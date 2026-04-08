/**
 * 請求書・領収書OCR解析サービス
 * Gemini 2.5 Flashで画像/PDFから構造化データを抽出
 */
import { geminiGenerate } from '../core/gemini';
import { extractJson } from '../core/gemini-utils';
import { getToday } from '../core/utils';
import { logger } from '../core/logger';

// OCR解析結果の型定義
export interface DocumentOCRResult {
  doc_type: 'invoice' | 'receipt' | 'credit_note' | 'statement';
  vendor_name: string;
  document_number: string | null;
  document_date: string; // YYYY-MM-DD
  due_date: string | null;
  amount_subtotal: number | null;
  amount_tax: number | null;
  amount_total: number;
  tax_rate: number;
  tax_category: string;
  items: Array<{ name: string; quantity?: number; unit_price?: number; amount?: number }>;
  payment_method: string | null;
  bank_info: Record<string, string> | null;
  is_qualified_invoice: boolean;
  registration_number: string | null;
  expense_category: string;
  confidence: number;
}

const INVOICE_OCR_PROMPT = `あなたは日本の請求書・領収書の読み取り専門AIです。

以下の書類から情報を抽出し、JSON形式で返してください。

{
  "doc_type": "invoice" | "receipt" | "credit_note" | "statement",
  "vendor_name": "発行元の会社名・店舗名",
  "document_number": "請求書番号・領収書番号（なければnull）",
  "document_date": "YYYY-MM-DD（発行日）",
  "due_date": "YYYY-MM-DD（支払期限、なければnull）",
  "amount_subtotal": 税抜金額（数値、不明ならnull）,
  "amount_tax": 消費税額（数値、不明ならnull）,
  "amount_total": 税込合計（数値）,
  "tax_rate": 税率（10 or 8）,
  "tax_category": "課税" | "非課税" | "免税" | "軽減税率",
  "items": [{"name": "品目", "quantity": 数量, "unit_price": 単価, "amount": 金額}],
  "payment_method": "振込" | "口座振替" | "クレジット" | "現金"（不明ならnull）,
  "bank_info": {"bank": "銀行名", "branch": "支店名", "account_type": "普通/当座", "account_number": "口座番号", "account_name": "口座名義"}（なければnull）,
  "is_qualified_invoice": true/false（適格請求書かどうか）,
  "registration_number": "T+13桁（インボイス登録番号、なければnull）",
  "expense_category": "交通費/消耗品/食費/通信費/水道光熱費/家賃/保険/修繕費/備品/外注費/会議費/接待交際費/その他",
  "confidence": 0.0-1.0（読み取り確信度）
}

【判定ルール】
- 適格請求書: 登録番号(T+数字13桁)の記載があれば true
- 軽減税率: 食品・新聞は 8%
- 日付が不明なら今日（${getToday()}）
- 読み取れない項目は null
- confidence: 全項目が明確に読めれば0.9以上、一部不明瞭なら0.5-0.8
JSONのみ返してください。`;

/**
 * テキスト（メール本文等）から請求書情報を抽出
 */
export async function extractDocumentFromText(
  geminiKey: string,
  text: string,
): Promise<DocumentOCRResult> {
  const result = await geminiGenerate(geminiKey, INVOICE_OCR_PROMPT, text);
  return normalizeResult(extractJson(result));
}

/**
 * OCR結果を正規化（型安全 + デフォルト値）
 */
function normalizeResult(raw: any): DocumentOCRResult {
  const today = getToday();
  return {
    doc_type: ['invoice', 'receipt', 'credit_note', 'statement'].includes(raw.doc_type) ? raw.doc_type : 'invoice',
    vendor_name: raw.vendor_name || '不明',
    document_number: raw.document_number || null,
    document_date: raw.document_date || today,
    due_date: raw.due_date || null,
    amount_subtotal: raw.amount_subtotal ? Number(raw.amount_subtotal) : null,
    amount_tax: raw.amount_tax ? Number(raw.amount_tax) : null,
    amount_total: Number(raw.amount_total) || 0,
    tax_rate: Number(raw.tax_rate) || 10,
    tax_category: raw.tax_category || '課税',
    items: Array.isArray(raw.items) ? raw.items : [],
    payment_method: raw.payment_method || null,
    bank_info: raw.bank_info || null,
    is_qualified_invoice: !!raw.is_qualified_invoice,
    registration_number: raw.registration_number || null,
    expense_category: raw.expense_category || 'その他',
    confidence: Math.min(1, Math.max(0, Number(raw.confidence) || 0.5)),
  };
}

/**
 * ベンダー自動マッチング（既存vendorsテーブルから検索、なければ自動作成）
 */
export async function matchOrCreateVendor(
  supabase: any,
  vendorName: string,
  category?: string,
): Promise<string | null> {
  if (!vendorName || vendorName === '不明') return null;

  // 1. 完全一致
  const { data: exact } = await supabase
    .from('vendors')
    .select('id')
    .eq('name', vendorName)
    .limit(1)
    .single();
  if (exact) return exact.id;

  // 2. 部分一致
  const { data: partial } = await supabase
    .from('vendors')
    .select('id, name')
    .ilike('name', `%${vendorName}%`)
    .limit(1);
  if (partial && partial.length > 0) return partial[0].id;

  // 3. エイリアス検索
  const { data: alias } = await supabase
    .from('vendors')
    .select('id')
    .contains('name_aliases', [vendorName])
    .limit(1);
  if (alias && alias.length > 0) return alias[0].id;

  // 4. 自動作成
  try {
    const { data: newVendor } = await supabase
      .from('vendors')
      .insert({
        name: vendorName,
        category: category || 'その他',
        vendor_type: guessVendorType(vendorName),
      })
      .select('id')
      .single();
    return newVendor?.id || null;
  } catch (e: any) {
    logger.warn('document-ocr', 'Vendor auto-create failed', { error: e?.message });
    return null;
  }
}

/** ベンダー名からタイプを推定 */
function guessVendorType(name: string): string {
  if (/電力|ガス|水道|電気/.test(name)) return 'utility';
  if (/NTT|ソフトバンク|au|KDDI|docomo|通信/.test(name)) return 'utility';
  if (/Amazon|AWS|Google|Microsoft|Adobe|Vercel|Supabase/.test(name)) return 'cloud';
  if (/税務|税理士|社労士|行政書士/.test(name)) return 'tax';
  if (/保険/.test(name)) return 'insurance';
  return 'general';
}

/**
 * 書類をDBに保存
 */
export async function saveDocument(
  supabase: any,
  ocrResult: DocumentOCRResult,
  source: 'email' | 'portal' | 'line_photo' | 'manual',
  userId?: string,
  sourceRef?: { emailId?: string; lineMessageId?: string },
): Promise<{ id: string; needsReview: boolean } | null> {
  const vendorId = await matchOrCreateVendor(supabase, ocrResult.vendor_name, ocrResult.expense_category);
  const docDate = new Date(ocrResult.document_date);
  const needsReview = ocrResult.confidence < 0.85;

  const { data, error } = await supabase.from('documents').insert({
    doc_type: ocrResult.doc_type,
    source,
    source_email_id: sourceRef?.emailId || null,
    source_line_message_id: sourceRef?.lineMessageId || null,
    vendor_id: vendorId,
    vendor_name: ocrResult.vendor_name,
    document_number: ocrResult.document_number,
    document_date: ocrResult.document_date,
    due_date: ocrResult.due_date,
    amount_subtotal: ocrResult.amount_subtotal,
    amount_tax: ocrResult.amount_tax,
    amount_total: ocrResult.amount_total,
    tax_rate: ocrResult.tax_rate,
    tax_category: ocrResult.tax_category,
    expense_category: ocrResult.expense_category,
    fiscal_year: docDate.getFullYear(),
    fiscal_month: docDate.getMonth() + 1,
    payment_status: 'unpaid',
    payment_method: ocrResult.payment_method,
    ocr_confidence: ocrResult.confidence,
    ai_extracted_data: ocrResult,
    needs_review: needsReview,
    is_qualified_invoice: ocrResult.is_qualified_invoice,
    issuer_registration_number: ocrResult.registration_number,
    created_by: userId || null,
  }).select('id').single();

  if (error) {
    logger.error('document-ocr', 'Document save failed', { error: error.message });
    return null;
  }

  return { id: data.id, needsReview };
}

/**
 * 請求書・領収書管理ハンドラー
 * LINE Botから「請求書」「未払い」「電気代」等のキーワードに対応
 */
import { lineReply, lineReplyWithQuickReply } from '../core/line';
import { geminiGenerate, stripMarkdown } from '../core/gemini';
import { extractJson } from '../core/gemini-utils';
import { getToday, getNowJST } from '../core/utils';
import { logger } from '../core/logger';
import { extractDocumentFromText, saveDocument, matchOrCreateVendor } from '../services/document-ocr';
import { stripHonorifics } from '../core/text-utils';

/**
 * 請求書検索（自然言語対応）
 * 「先月の電気代は？」「Amazonの請求」「未払いの請求書」
 */
export async function searchDocuments(user: any, text: string, replyToken: string, supabase: any, token: string, geminiKey: string) {
  const now = getNowJST();
  const thisYear = now.getUTCFullYear();
  const thisMonth = now.getUTCMonth() + 1;

  // 検索条件を解析
  let query = supabase.from('documents').select('*').order('document_date', { ascending: false });

  // 未払い検索
  if (/未払い|未払|支払い|支払期限|期限/.test(text)) {
    query = query.eq('payment_status', 'unpaid');
    const { data: docs } = await query.limit(10);
    if (!docs || docs.length === 0) {
      await lineReply(replyToken, '✅ 未払いの請求書はありません。\n\n写真を送るか「請求書追加 〇〇」で登録できます。', token);
      return;
    }
    const lines = docs.map((d: any) => {
      const overdue = d.due_date && d.due_date < getToday() ? '🔴' : '🟡';
      return `${overdue} ${d.vendor_name} ¥${Number(d.amount_total).toLocaleString()}\n  ${d.document_date}${d.due_date ? ' 期限:' + d.due_date : ''}`;
    });
    const total = docs.reduce((s: number, d: any) => s + Number(d.amount_total), 0);
    await lineReply(replyToken,
      `📋 未払い請求書（${docs.length}件）\n合計: ¥${total.toLocaleString()}\n\n${lines.join('\n\n')}`,
      token
    );
    return;
  }

  // ユーティリティ名で検索
  const utilityMap: Record<string, string> = {
    '電気代': '電力', '電気': '電力',
    'ガス代': 'ガス', 'ガス': 'ガス',
    '水道代': '水道', '水道': '水道',
    '通信費': 'NTT', '電話代': 'NTT', 'インターネット': 'NTT',
  };

  let vendorSearch = '';
  for (const [keyword, vendor] of Object.entries(utilityMap)) {
    if (text.includes(keyword)) { vendorSearch = vendor; break; }
  }

  // 会社名で直接検索
  if (!vendorSearch) {
    const cleaned = text.replace(/請求書|請求|領収書|の|は|を|検索|確認|見せて|教えて|いくら|\?|？/g, '').trim();
    if (cleaned.length >= 2) vendorSearch = stripHonorifics(cleaned);
  }

  // 月指定の検索
  let targetMonth = thisMonth;
  let targetYear = thisYear;
  const monthMatch = text.match(/(\d{1,2})月/);
  if (monthMatch) {
    targetMonth = parseInt(monthMatch[1]);
    if (targetMonth > thisMonth) targetYear--; // 去年の同月
  }
  if (/先月|前月/.test(text)) {
    targetMonth = thisMonth - 1;
    if (targetMonth <= 0) { targetMonth = 12; targetYear--; }
  }
  if (/今月/.test(text)) {
    targetMonth = thisMonth;
  }

  // クエリ構築
  if (vendorSearch) {
    query = query.ilike('vendor_name', `%${vendorSearch}%`);
  }
  if (/先月|前月|\d+月|今月/.test(text)) {
    query = query.eq('fiscal_year', targetYear).eq('fiscal_month', targetMonth);
  }

  // ownerは全件、それ以外は自分の作成分のみ
  if (user.role !== 'owner') {
    query = query.eq('created_by', user.id);
  }

  const { data: docs } = await query.limit(10);

  if (!docs || docs.length === 0) {
    const hint = vendorSearch ? `「${vendorSearch}」に関する` : '';
    await lineReply(replyToken, `${hint}請求書・領収書が見つかりませんでした。\n\n写真を送って登録するか、「請求書追加 ○○」と入力してください。`, token);
    return;
  }

  const lines = docs.map((d: any) => {
    const statusIcon = d.payment_status === 'paid' ? '✅' : d.payment_status === 'overdue' ? '🔴' : '📄';
    const typeLabel = d.doc_type === 'receipt' ? '領収書' : '請求書';
    return `${statusIcon} ${d.vendor_name}（${typeLabel}）\n  ¥${Number(d.amount_total).toLocaleString()} / ${d.document_date}${d.due_date ? ' 期限:' + d.due_date : ''}`;
  });
  const total = docs.reduce((s: number, d: any) => s + Number(d.amount_total), 0);

  await lineReply(replyToken,
    `🔍 検索結果（${docs.length}件）\n合計: ¥${total.toLocaleString()}\n\n${lines.join('\n\n')}`,
    token
  );
}

/**
 * 請求書サマリー（月次集計）
 */
export async function showDocumentSummary(user: any, text: string, replyToken: string, supabase: any, token: string) {
  const now = getNowJST();
  const thisYear = now.getUTCFullYear();
  let thisMonth = now.getUTCMonth() + 1;

  if (/先月|前月/.test(text)) {
    thisMonth--;
    if (thisMonth <= 0) thisMonth = 12;
  }

  const { data: docs } = await supabase
    .from('documents')
    .select('*')
    .eq('fiscal_year', thisYear)
    .eq('fiscal_month', thisMonth)
    .order('document_date', { ascending: false });

  if (!docs || docs.length === 0) {
    await lineReply(replyToken, `${thisMonth}月の請求書・領収書はまだ登録されていません。`, token);
    return;
  }

  // カテゴリ別集計
  const byCategory: Record<string, { count: number; total: number }> = {};
  let grandTotal = 0;
  let unpaidTotal = 0;
  let paidTotal = 0;

  for (const d of docs) {
    const cat = d.expense_category || 'その他';
    if (!byCategory[cat]) byCategory[cat] = { count: 0, total: 0 };
    byCategory[cat].count++;
    byCategory[cat].total += Number(d.amount_total);
    grandTotal += Number(d.amount_total);
    if (d.payment_status === 'unpaid' || d.payment_status === 'overdue') unpaidTotal += Number(d.amount_total);
    if (d.payment_status === 'paid') paidTotal += Number(d.amount_total);
  }

  const catLines = Object.entries(byCategory)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([cat, v]) => `  ${cat}: ¥${v.total.toLocaleString()}（${v.count}件）`);

  await lineReply(replyToken,
    `📊 ${thisMonth}月の請求書サマリー\n\n` +
    `合計: ¥${grandTotal.toLocaleString()}（${docs.length}件）\n` +
    `  ✅ 支払済: ¥${paidTotal.toLocaleString()}\n` +
    `  🟡 未払い: ¥${unpaidTotal.toLocaleString()}\n\n` +
    `【カテゴリ別】\n${catLines.join('\n')}`,
    token
  );
}

/**
 * 請求書の手動追加（テキスト入力）
 * 「請求書追加 東京電力 11000円 4/25期限」
 */
export async function addDocument(user: any, text: string, replyToken: string, supabase: any, token: string, geminiKey: string) {
  const cleaned = text.replace(/^(請求書|領収書)(追加|登録|入力)\s*/, '').trim();

  if (!cleaned || cleaned.length < 3) {
    await lineReply(replyToken,
      '📄 請求書を追加するには:\n\n' +
      '① 写真を送る → AI自動解析\n' +
      '② テキスト入力:\n' +
      '  「請求書追加 東京電力 11000円 4/25期限」\n' +
      '  「領収書追加 Amazon 3980円 消耗品」\n\n' +
      '💡 写真が一番正確です！',
      token
    );
    return;
  }

  try {
    const ocrResult = await extractDocumentFromText(geminiKey, cleaned);
    const result = await saveDocument(supabase, ocrResult, 'manual', user.id);

    if (!result) {
      await lineReply(replyToken, '請求書の登録に失敗しました。もう一度お試しください。', token);
      return;
    }

    const statusEmoji = ocrResult.doc_type === 'receipt' ? '🧾' : '📄';
    const typeLabel = ocrResult.doc_type === 'receipt' ? '領収書' : '請求書';

    await lineReplyWithQuickReply(replyToken,
      `${statusEmoji} ${typeLabel}を登録しました\n\n` +
      `🏢 ${ocrResult.vendor_name}\n` +
      `💰 ¥${Number(ocrResult.amount_total).toLocaleString()}\n` +
      `📅 ${ocrResult.document_date}\n` +
      (ocrResult.due_date ? `⏰ 期限: ${ocrResult.due_date}\n` : '') +
      `📁 ${ocrResult.expense_category}\n` +
      (ocrResult.is_qualified_invoice ? `✅ 適格請求書（${ocrResult.registration_number}）\n` : '') +
      (result.needsReview ? '\n⚠️ 確認が必要です（確信度が低め）' : ''),
      ['請求書一覧', '未払い確認', '今月の請求'],
      token
    );
  } catch (e: any) {
    logger.error('invoice', 'Add document failed', { error: e?.message });
    await lineReply(replyToken, '登録に失敗しました。\n例: 「請求書追加 東京電力 11000円」', token);
  }
}

/**
 * 支払い済みマーク
 * 「支払い完了 東京電力」
 */
export async function markPaid(user: any, text: string, replyToken: string, supabase: any, token: string) {
  const cleaned = stripHonorifics(text.replace(/支払い?(完了|済み?|済)\s*/, '').trim());

  // 直近の未払い請求書から検索
  let query = supabase.from('documents')
    .select('*')
    .eq('payment_status', 'unpaid')
    .order('document_date', { ascending: false });

  if (cleaned.length >= 2) {
    query = query.ilike('vendor_name', `%${cleaned}%`);
  }

  const { data: docs } = await query.limit(1);

  if (!docs || docs.length === 0) {
    await lineReply(replyToken, '該当する未払い請求書が見つかりませんでした。', token);
    return;
  }

  const doc = docs[0];
  await supabase.from('documents').update({
    payment_status: 'paid',
    payment_date: getToday(),
    updated_at: new Date().toISOString(),
  }).eq('id', doc.id);

  await lineReply(replyToken,
    `✅ 支払い完了にしました\n\n🏢 ${doc.vendor_name}\n💰 ¥${Number(doc.amount_total).toLocaleString()}\n📅 支払日: ${getToday()}`,
    token
  );
}

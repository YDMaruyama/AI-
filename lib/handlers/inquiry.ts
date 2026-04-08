import { lineReply } from '../core/line';
import { geminiGenerate } from '../core/gemini';
import { extractJson } from '../core/gemini-utils';
import { replyWithTextAndFeedback } from '../core/feedback';

/** 問い合わせ・見学対応 */
export async function handleInquiry(user: any, text: string, replyToken: string, supabase: any, token: string, geminiKey: string) {
  try {
    const extracted = await geminiGenerate(
      geminiKey,
      `以下のメッセージから見学・問い合わせ情報を抽出してJSON形式で返してください。
情報が不足していれば、わかる範囲で埋めてください。
{"name":"名前","phone":"電話番号","source":"経緯（紹介元等）","type":"見学/問い合わせ/その他","notes":"備考"}
JSONのみ出力してください。`,
      text
    );

    let inquiryData: any = {};
    try { inquiryData = extractJson(extracted); } catch {}

    await supabase.from('inquiries').insert({
      user_id: user.id,
      inquiry_type: inquiryData.type || '見学',
      contact_name: inquiryData.name || null,
      contact_phone: inquiryData.phone || null,
      source: inquiryData.source || null,
      notes: inquiryData.notes || text,
      status: 'new',
    });

    // 共有ボタン付きフィードバック（本人のみ。社長への共有は本人が選択）
    const detail = `${inquiryData.name ? '名前: ' + inquiryData.name + '\n' : ''}${inquiryData.phone ? '電話: ' + inquiryData.phone : ''}`;
    // 共有時に元メッセージの内容も含める（postbackデータ上限300bytes考慮）
    const shareDetail = [
      inquiryData.name || '',
      inquiryData.notes || text.substring(0, 80),
    ].filter(Boolean).join('\n');
    await replyWithTextAndFeedback(replyToken, token,
      `${inquiryData.type || '問い合わせ'}を記録しました。\n${detail}\n追加情報があれば教えてください。`,
      {
        icon: '📞',
        title: `${inquiryData.type || '問い合わせ'}記録完了`,
        detail: detail || text.substring(0, 80),
        shareData: `inquiry:${shareDetail.substring(0, 100)}`,
      }
    );
  } catch (e: any) {
    console.error('Inquiry error:', e?.message);
    await supabase.from('inquiries').insert({
      user_id: user.id,
      inquiry_type: text.includes('見学') ? '見学' : '問い合わせ',
      notes: text,
      status: 'new',
    });
    await lineReply(replyToken, '問い合わせ情報を記録しました。', token);
  }
}

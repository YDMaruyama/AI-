import { lineReply } from '../core/line';
import { parseDate } from '../core/utils';
import { geminiGenerate } from '../core/gemini';

/** 日報検索（owner/managerのみ） */
export async function searchReports(user: any, text: string, replyToken: string, supabase: any, token: string, geminiKey: string) {
  if (user.role === 'staff') {
    await lineReply(replyToken, 'この機能は管理者以上の権限が必要です。', token);
    return;
  }

  const targetDate = parseDate(text);
  if (!targetDate) {
    await lineReply(replyToken, '日付を認識できませんでした。\n「今日の日報」「3月28日の日報」のように指定してください。', token);
    return;
  }

  const { data: reports } = await supabase
    .from('daily_reports')
    .select('*, users!inner(display_name)')
    .eq('report_date', targetDate)
    .order('created_at', { ascending: true });

  if (!reports || reports.length === 0) {
    await lineReply(replyToken, `${targetDate} の日報はまだ提出されていません。`, token);
    return;
  }

  try {
    const reportTexts = reports.map((r: any) =>
      `【${r.users.display_name}】\n${r.content}`
    ).join('\n\n---\n\n');

    const summary = await geminiGenerate(
      geminiKey,
      `以下は就労継続支援事業所の日報です。簡潔に要約してください。
重要なポイント、気になる点、引き継ぎ事項を整理してください。`,
      reportTexts
    );

    await lineReply(
      replyToken,
      `${targetDate} の日報（${reports.length}件）\n\n${summary}`,
      token
    );
  } catch (e: any) {
    // Gemini失敗時は生データ
    const raw = reports.map((r: any) =>
      `【${r.users.display_name}】\n${r.content?.substring(0, 150)}...`
    ).join('\n\n');
    await lineReply(replyToken, `${targetDate} の日報（${reports.length}件）\n\n${raw}`, token);
  }
}

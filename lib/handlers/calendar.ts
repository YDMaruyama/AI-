import { lineReply } from '../core/line';
import { getToday, getNowJST } from '../core/utils';
import { geminiGenerate } from '../core/gemini';
import { CALENDAR_AGENT_PROMPT } from '../core/agents';
import { env } from '../core/config';

/** カレンダー */
export async function showCalendar(user: any, replyToken: string, supabase: any, token: string) {
  const gasUrl = env.GAS_CALENDAR_URL;

  if (gasUrl) {
    // Google Apps Script 経由でGoogleカレンダーから取得
    try {
      const res = await fetch(`${gasUrl}?action=list&days=7`);
      const data: any = await res.json();

      if (data.events && data.events.length > 0) {
        const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
        const lines = data.events.map((e: any) => {
          // UTC→JST変換（+9時間）
          const utc = new Date(e.start);
          const jst = new Date(utc.getTime() + 9 * 60 * 60 * 1000);
          const dayName = dayNames[jst.getUTCDay()];
          const shortDate = `${jst.getUTCMonth() + 1}/${jst.getUTCDate()}（${dayName}）`;
          if (e.allDay) {
            return `${shortDate} 終日 ${e.title}`;
          }
          const time = `${jst.getUTCHours()}:${String(jst.getUTCMinutes()).padStart(2, '0')}`;
          return `${shortDate} ${time} ${e.title}`;
        });
        await lineReply(replyToken, `📅 今週の予定:\n\n${lines.join('\n')}`, token);
        return;
      }
    } catch (e) {
      console.error('GAS Calendar error:', e);
    }
  }

  // フォールバック: Supabase calendar_events テーブルから取得
  const today = getToday();
  const now = getNowJST();
  const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const endStr = endDate.toISOString().split('T')[0];

  const { data: events } = await supabase
    .from('calendar_events')
    .select('*')
    .gte('start_time', today)
    .lte('start_time', endStr + 'T23:59:59')
    .order('start_time', { ascending: true })
    .limit(20);

  if (!events || events.length === 0) {
    await lineReply(replyToken, '今後7日間の予定はありません。\n\nGoogleカレンダー連携が未設定の場合は、管理者に連絡してください。', token);
    return;
  }

  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  const lines = events.map((e: any) => {
    const utc = new Date(e.start_time);
    const jst = new Date(utc.getTime() + 9 * 60 * 60 * 1000);
    const dayName = dayNames[jst.getUTCDay()];
    const shortDate = `${jst.getUTCMonth() + 1}/${jst.getUTCDate()}（${dayName}）`;
    const time = e.all_day ? '終日' : `${jst.getUTCHours()}:${String(jst.getUTCMinutes()).padStart(2, '0')}`;
    return `${shortDate} ${time} ${e.title}`;
  });

  await lineReply(replyToken, `📅 今週の予定:\n\n${lines.join('\n')}`, token);
}

/** カレンダー予定追加 */
export async function addCalendarEvent(user: any, text: string, replyToken: string, supabase: any, token: string, geminiKey: string) {
  const gasUrl = env.GAS_CALENDAR_URL;
  // テキストから予定情報を抽出 例:「予定追加 4/5 10:00 ○○様見学」
  const cleaned = text.replace(/^(予定追加|予定登録)\s*/, '');

  if (!cleaned) {
    await lineReply(replyToken, '予定の内容を教えてください。\n例: 予定追加 4/5 10:00 ○○様見学', token);
    return;
  }

  // Geminiで日時とタイトルを抽出
  const extractPrompt = `${CALENDAR_AGENT_PROMPT}

以下のテキストから予定の情報を抽出してJSON形式で返してください。今日は${getToday()}です。
テキスト: "${cleaned}"
形式: {"title":"予定名","date":"YYYY-MM-DD","time":"HH:MM","endTime":"HH:MM"}
timeが不明なら"09:00"、endTimeが不明ならtimeの1時間後にしてください。JSONのみ返してください。`;

  try {
    const jsonStr = await geminiGenerate(geminiKey, extractPrompt);
    const match = jsonStr.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('JSON parse failed');
    const info = JSON.parse(match[0]);

    const startISO = `${info.date}T${info.time}:00+09:00`;
    const endISO = `${info.date}T${info.endTime}:00+09:00`;

    // GASに予定作成
    if (gasUrl) {
      await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', title: info.title, start: startISO, end: endISO }),
      });
    }

    // Supabaseにも保存
    await supabase.from('calendar_events').insert({
      title: info.title, start_time: startISO, end_time: endISO, created_by: user.id,
    });

    await lineReply(replyToken, `📅 予定を追加しました:\n${info.date} ${info.time} ${info.title}`, token);
  } catch (e) {
    await lineReply(replyToken, '予定の追加に失敗しました。\n例: 予定追加 4/5 10:00 ○○様見学', token);
  }
}

/** カレンダー予定削除 */
export async function deleteCalendarEvent(user: any, text: string, replyToken: string, supabase: any, token: string) {
  const keyword = text.replace(/^予定削除\s*/, '').trim();
  if (!keyword) {
    await lineReply(replyToken, '削除する予定のキーワードを教えてください。\n例: 予定削除 ○○様見学', token);
    return;
  }

  const { data: events } = await supabase
    .from('calendar_events')
    .select('*')
    .ilike('title', `%${keyword}%`)
    .order('start_time', { ascending: true })
    .limit(5);

  if (!events || events.length === 0) {
    await lineReply(replyToken, `「${keyword}」に一致する予定が見つかりません。\n\n「予定」で今後の予定一覧を確認できます。`, token);
    return;
  }

  // 最初の一致を削除
  await supabase.from('calendar_events').delete().eq('id', events[0].id);
  await lineReply(replyToken, `📅 予定を削除しました: ${events[0].title}`, token);
}

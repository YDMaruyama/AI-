import { lineReply } from '../core/line';
import { getNowJST } from '../core/utils';

/** シフト表示 */
export async function showShift(user: any, replyToken: string, supabase: any, token: string) {
  const now = getNowJST();
  const dayOfWeek = now.getUTCDay();
  // 今週月曜日
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + mondayOffset));
  const sunday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + mondayOffset + 6));

  const startDate = monday.toISOString().split('T')[0];
  const endDate = sunday.toISOString().split('T')[0];

  const { data: shifts } = await supabase
    .from('shifts')
    .select('*, users(display_name)')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (!shifts || shifts.length === 0) {
    await lineReply(replyToken, `今週（${startDate}〜${endDate}）のシフトはまだ登録されていません。`, token);
    return;
  }

  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  const byDate: Record<string, string[]> = {};

  for (const s of shifts) {
    if (!byDate[s.date]) byDate[s.date] = [];
    const name = s.users?.display_name || '不明';
    const time = s.start_time && s.end_time ? `${s.start_time}-${s.end_time}` : '';
    byDate[s.date].push(`${name}${time ? ' ' + time : ''}`);
  }

  const lines: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() + i));
    const dateStr = d.toISOString().split('T')[0];
    const dayName = dayNames[d.getUTCDay()];
    const shortDate = `${d.getUTCMonth() + 1}/${d.getUTCDate()}（${dayName}）`;
    const staff = byDate[dateStr];
    if (staff && staff.length > 0) {
      lines.push(`${shortDate}: ${staff.join(', ')}`);
    } else {
      lines.push(`${shortDate}: -`);
    }
  }

  await lineReply(replyToken, `今週のシフト:\n\n${lines.join('\n')}`, token);
}

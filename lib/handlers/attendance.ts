import { lineReply } from '../core/line';
import { getToday } from '../core/utils';

/** 出欠状況 */
export async function showAttendance(user: any, replyToken: string, supabase: any, token: string) {
  const today = getToday();

  // アクティブ利用者数
  const { count: totalClients } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // 今日の出席記録
  const { data: records } = await supabase
    .from('attendance_records')
    .select('*, clients(name)')
    .eq('date', today);

  const presentCount = records?.filter((r: any) => r.status === 'present').length || 0;
  const absentList = records
    ?.filter((r: any) => r.status === 'absent')
    .map((r: any) => `${r.clients?.name || '不明'}${r.reason ? '（' + r.reason + '）' : ''}`) || [];

  let msg = `今日の出欠（${today}）:\n出席 ${presentCount}名 / 予定 ${totalClients || 0}名`;

  if (absentList.length > 0) {
    msg += `\n\n欠席:\n${absentList.join('\n')}`;
  }

  if (!records || records.length === 0) {
    msg += '\n\n※ まだ出欠データが登録されていません。';
  }

  await lineReply(replyToken, msg, token);
}

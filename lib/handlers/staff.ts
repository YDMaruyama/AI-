import { lineReply } from '../core/line';

/** スタッフ一覧（ownerのみ） */
export async function showStaffList(user: any, replyToken: string, supabase: any, token: string) {
  if (user.role !== 'owner') {
    await lineReply(replyToken, 'この機能は社長のみ利用できます。', token);
    return;
  }

  const { data: users } = await supabase
    .from('users')
    .select('*')
    .eq('is_active', true)
    .order('role', { ascending: true })
    .order('display_name', { ascending: true });

  if (!users || users.length === 0) {
    await lineReply(replyToken, '登録されているメンバーはいません。', token);
    return;
  }

  const owners = users.filter((u: any) => u.role === 'owner').map((u: any) => u.display_name);
  const managers = users.filter((u: any) => u.role === 'manager').map((u: any) => u.display_name);
  const staff = users.filter((u: any) => u.role === 'staff').map((u: any) => u.display_name);
  const pending = users.filter((u: any) => u.role === 'pending').map((u: any) => u.display_name);

  let msg = 'メンバー一覧:\n';
  if (owners.length > 0) msg += `\n社長: ${owners.join(', ')}`;
  if (managers.length > 0) msg += `\n管理者: ${managers.join(', ')}`;
  if (staff.length > 0) msg += `\nスタッフ: ${staff.join(', ')}`;
  if (pending.length > 0) msg += `\n承認待ち: ${pending.join(', ')}`;

  await lineReply(replyToken, msg, token);
}

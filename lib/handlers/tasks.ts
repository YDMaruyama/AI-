import { lineReply } from '../core/line';

/** タスク一覧 */
export async function showTasks(user: any, _text: string, replyToken: string, supabase: any, token: string) {
  let query = supabase
    .from('tasks')
    .select('*')
    .in('status', ['pending', 'in_progress'])
    .order('priority', { ascending: true })
    .order('due_date', { ascending: true })
    .limit(20);

  if (user.role !== 'owner') {
    query = query.eq('assignee_id', user.id);
  }

  const { data: tasks, error } = await query;

  if (error || !tasks || tasks.length === 0) {
    await lineReply(replyToken, '✅ 現在のタスクはありません。\n\n「タスク追加 〇〇」で新しいタスクを作成できます。', token);
    return;
  }

  const lines = tasks.map((t: any, i: number) => {
    const pri = t.priority === 'high' ? '[高]' : t.priority === 'low' ? '[低]' : '[中]';
    const status = t.status === 'in_progress' ? '(進行中)' : '';
    const due = t.due_date ? `期限: ${t.due_date}` : '';
    return `${i + 1}. ${pri} ${t.title}${status}${due ? ' ' + due : ''}`;
  });

  const header = user.role === 'owner' ? 'タスク一覧（全体）:' : 'あなたのタスク一覧:';
  await lineReply(replyToken, `${header}\n\n${lines.join('\n')}`, token);
}

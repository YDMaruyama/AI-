import { lineReply } from '../core/line';

/** 案件一覧 */
export async function showOrders(user: any, replyToken: string, supabase: any, token: string) {
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('status', 'active')
    .order('deadline', { ascending: true })
    .limit(10);

  if (!orders || orders.length === 0) {
    await lineReply(replyToken, '現在進行中の案件はありません。', token);
    return;
  }

  const lines: string[] = [];
  for (const o of orders) {
    // 進捗取得
    const { data: progress } = await supabase
      .from('order_progress')
      .select('completed_quantity')
      .eq('order_id', o.id)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();

    let progressStr = '';
    if (o.total_quantity && progress?.completed_quantity != null) {
      const pct = Math.round((progress.completed_quantity / o.total_quantity) * 100);
      progressStr = ` 進捗: ${progress.completed_quantity}/${o.total_quantity}個 ${pct}%`;
    }

    const deadline = o.deadline ? ` 納期: ${o.deadline}` : '';
    const client = o.client_name ? `（${o.client_name}）` : '';
    lines.push(`${lines.length + 1}. ${o.title}${client}${progressStr}${deadline}`);
  }

  await lineReply(replyToken, `案件一覧:\n\n${lines.join('\n')}`, token);
}

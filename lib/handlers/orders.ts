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

  // 全案件の進捗を並列取得（N+1 → 1+N並列）
  const progressResults = await Promise.all(
    orders.map((o: any) =>
      supabase
        .from('order_progress')
        .select('completed_quantity, order_id')
        .eq('order_id', o.id)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    )
  );

  const lines: string[] = [];
  for (let i = 0; i < orders.length; i++) {
    const o = orders[i];
    const progress = progressResults[i]?.data;

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

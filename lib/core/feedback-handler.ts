/**
 * 共有ボタン（Postback）のハンドラー
 * postback data形式: "share:{target}:{type}:{content_id}"
 *   target: owner | manager | all
 *   type: report | task | expense | incident | inquiry | calendar | cashbox
 *   content_id: DBのレコードID（省略可）
 */
import { lineReply, linePush } from './line';
import { logger } from './logger';

/**
 * 共有Postbackを処理
 * 指定されたロールのユーザーに、共有メッセージをPush送信
 */
export async function handleSharePostback(
  postbackData: string,
  senderLineUserId: string,
  replyToken: string,
  supabase: any,
  token: string,
): Promise<void> {
  // data = "share:owner:report:uuid" or "share:manager:task:タスク名"
  const parts = postbackData.split(':');
  if (parts.length < 3) return;

  const target = parts[1];  // owner | manager | all
  const type = parts[2];    // report | task | expense etc.
  const detail = parts.slice(3).join(':'); // 残り全部

  // 送信者を特定
  const { data: sender } = await supabase
    .from('users')
    .select('display_name, role')
    .eq('line_user_id', senderLineUserId)
    .maybeSingle();
  const senderName = sender?.display_name || '不明';

  // 共有先を取得
  let roleFilter: string[];
  if (target === 'owner') roleFilter = ['owner'];
  else if (target === 'manager') roleFilter = ['owner', 'manager'];
  else roleFilter = ['owner', 'manager', 'staff'];

  const { data: targets } = await supabase
    .from('users')
    .select('line_user_id, display_name')
    .eq('is_active', true)
    .in('role', roleFilter)
    .neq('line_user_id', senderLineUserId); // 自分自身は除外

  if (!targets || targets.length === 0) {
    await lineReply(replyToken, '共有先のユーザーが見つかりませんでした。', token);
    return;
  }

  // メッセージタイプに応じたアイコン
  const icons: Record<string, string> = {
    report: '📋', task: '✅', expense: '🧾', incident: '🚨',
    inquiry: '📞', calendar: '📅', cashbox: '🔐', sales: '📊',
  };
  const labels: Record<string, string> = {
    report: '日報', task: 'タスク', expense: '経費', incident: '事故報告',
    inquiry: '見学対応', calendar: '予定', cashbox: '金庫', sales: '売上',
  };

  const icon = icons[type] || '📤';
  const label = labels[type] || type;
  const shareMsg = `${icon}【共有】${senderName}さんの${label}\n${detail ? '\n' + detail : ''}`;

  // 共有先全員にPush
  let sentCount = 0;
  const sentNames: string[] = [];
  for (const t of targets) {
    if (t.line_user_id) {
      const ok = await linePush(t.line_user_id, shareMsg, token);
      if (ok) {
        sentCount++;
        sentNames.push(t.display_name || '不明');
      } else {
        logger.warn('share', `Push failed to ${t.display_name}`, { line_user_id: t.line_user_id?.substring(0, 10) });
      }
    }
  }

  const targetLabel = target === 'owner' ? '社長' : target === 'manager' ? '管理者' : '全員';
  const nameList = sentNames.length > 0 ? `（${sentNames.join('、')}）` : '';
  await lineReply(replyToken, `📤 ${targetLabel}に共有しました${nameList}`, token);

  logger.info('share', `${senderName} shared ${type} to ${target}`, { sentCount, sentNames, detail });
}

import { lineReplyWithQuickReply } from '../core/line';

export async function showHelp(user: any, replyToken: string, token: string) {
  const isOwner = user.role === 'owner';
  const isManager = user.role === 'manager';

  let msg = '📖 AI秘書の使い方\n\n';
  msg += '【基本機能】\n';
  msg += '📋 日報 → 日報作成\n';
  msg += '✅ タスク → タスク一覧\n';
  msg += '📅 予定 → カレンダー\n';
  msg += '🧾 経費入力 → 経費登録\n';
  msg += '📷 レシート写真 → 自動読取\n';
  msg += '🎤 音声メッセージ → 自動処理\n\n';
  msg += '【その他】\n';
  msg += '💰 今月の経費 → 経費サマリー\n';
  msg += '📊 売上 → 売上管理\n';
  msg += '🔐 金庫 → 金庫残高\n';

  if (isOwner || isManager) {
    msg += '\n【管理者向け】\n';
    msg += '👥 スタッフ一覧 → メンバー管理\n';
    msg += '📋 日報確認 → 日報検索\n';
    msg += '🏢 案件 → 案件一覧\n';
  }

  msg += '\n💡 何でも話しかけてOK！AI秘書が判断します。';

  const quickItems = ['日報', 'タスク', '予定', '経費入力', '今月の経費', '売上'];
  await lineReplyWithQuickReply(replyToken, msg, quickItems, token);
}

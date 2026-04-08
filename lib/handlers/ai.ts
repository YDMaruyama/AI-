import { lineReply, lineReplyWithQuickReply } from '../core/line';
import { getToday } from '../core/utils';
import { aiAgentResponse } from '../core/ai-agent';
import { maybeAddKnowledge } from '../core/memory-inline';
import { logger } from '../core/logger';

export async function aiResponse(user: any, text: string, replyToken: string, supabase: any, token: string, geminiKey: string) {
  let reply = 'すみません、応答に失敗しました。もう一度お試しください。';
  try {
    // AI Agent（Function Calling）でDB検索しながら回答
    reply = await aiAgentResponse(user, text, supabase, geminiKey);
  } catch (e: any) {
    logger.error('ai', 'AI agent error', { error: e?.message });
  }

  // 情報を含むメッセージなら次のアクション提案付きで返信
  const hasDateOrEvent = /\d{1,2}\/\d{1,2}|\d{1,2}月\d{1,2}日|イベント|予定|ミーティング|打ち合わせ/.test(text);
  if (hasDateOrEvent) {
    await lineReplyWithQuickReply(replyToken, reply, ['予定に登録', 'メモとして保存'], token);
  } else {
    await lineReply(replyToken, reply, token);
  }

  // 会話ログ保存
  await supabase.from('conversation_messages').insert([
    { user_id: user.id, role: 'user', content: text },
    { user_id: user.id, role: 'assistant', content: reply },
  ]);

  // 情報性の高いメッセージは知識ベースにも自動保存（fire-and-forget）
  const isInfoMessage = text.length > 15 && /ある|する|した|です|ます|から|ので|って|について/.test(text);
  if (isInfoMessage) {
    const title = text.length > 30 ? text.substring(0, 30) + '...' : text;
    const tags: string[] = [];
    if (/イベント|予定|日程/.test(text)) tags.push('予定');
    if (/売上|経費|金額|円/.test(text)) tags.push('売上', '経費');
    if (/利用者|スタッフ|メンバー/.test(text)) tags.push('利用者');
    if (/案件|取引|納品/.test(text)) tags.push('案件');
    maybeAddKnowledge(supabase, {
      category: 'fact',
      title,
      content: text.substring(0, 200),
      tags: tags.length > 0 ? tags : ['一般'],
      source_user_id: user.id,
    }).catch(e => logger.warn('ai', 'maybeAddKnowledge failed', { error: e?.message }));
  }
}

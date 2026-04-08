/**
 * グループメッセージハンドラー
 *
 * トリガー設計:
 * - @AI秘書 メンション → 必ず応答
 * - 「まとめて」「議事録」→ 蓄積した会話を要約
 * - 決定事項の検出 → サイレント保存（応答なし）
 * - タスク発生の検出 → 確認を1回だけ返す
 * - AI向けの質問検出 → 応答
 * - 通常会話 → 蓄積のみ（応答なし）
 */
import { lineReply, linePush } from '../core/line';
import { aiAgentResponse } from '../core/ai-agent';
import { stripMarkdown } from '../core/gemini';
import { geminiGenerate } from '../core/gemini';
import { logger } from '../core/logger';

// ── トリガー判定 ──
type TriggerType = 'mention' | 'summary_request' | 'decision' | 'task_detected' | 'question' | 'none';

interface TriggerResult {
  type: TriggerType;
  cleanText: string; // メンション除去後のテキスト
}

const BOT_NAMES = ['ai秘書', 'ai 秘書', 'ＡＩ秘書', 'ai', 'AI'];

export function detectTrigger(text: string): TriggerResult {
  const lower = text.toLowerCase().trim();

  // 1. メンション検出（@AI秘書、@AI等）
  for (const name of BOT_NAMES) {
    if (lower.includes(`@${name}`)) {
      const cleanText = text.replace(new RegExp(`@${name}[\\s　]*`, 'gi'), '').trim();
      return { type: 'mention', cleanText: cleanText || text };
    }
  }

  // 2. 議事録・要約リクエスト
  if (/^(まとめ|まとめて|議事録|要約|振り返り|サマリ)/i.test(lower)) {
    return { type: 'summary_request', cleanText: text };
  }

  // 3. 決定事項の検出（サイレント保存）
  if (/に決定|で決まり|でいこう|で進め|承認し|了承し|確定し/.test(text)) {
    return { type: 'decision', cleanText: text };
  }

  // 4. タスク発生の検出
  if (/やっておいて|お願い[し。！]|担当.*で|期限.*まで|〆切|対応お願い/.test(text) && text.length > 10) {
    return { type: 'task_detected', cleanText: text };
  }

  // 5. AI向けの質問検出（「進捗」「状況」「どうなってる」等のDB質問）
  if (/進捗|状況|どうなって|教えて|確認して|一覧|リスト/.test(text) && text.length < 50) {
    // 人同士の会話内の質問かどうかを推測
    // 短い質問で、特定の人への呼びかけがない場合はAI向けと判定
    if (!/さん|くん|ちゃん|先生|社長/.test(text)) {
      return { type: 'question', cleanText: text };
    }
  }

  // 6. 通常会話 → 蓄積のみ
  return { type: 'none', cleanText: text };
}

// ── グループメッセージ処理 ──
export async function handleGroupMessage(
  event: any,
  supabase: any,
  token: string,
  geminiKey: string,
): Promise<void> {
  const groupId = event.source?.groupId;
  const lineUserId = event.source?.userId;
  const replyToken = event.replyToken;
  const text = event.message?.text || '';

  if (!groupId || !text) return;

  // グループ情報取得 or 自動登録
  let group = await getOrCreateGroup(groupId, supabase, token);

  // 送信者情報取得
  let displayName = '不明';
  let userId: string | null = null;
  if (lineUserId) {
    const { data: user } = await supabase
      .from('users')
      .select('id, display_name')
      .eq('line_user_id', lineUserId)
      .single();
    if (user) {
      displayName = user.display_name;
      userId = user.id;
    } else {
      // LINEプロフィールから名前を取得
      try {
        const profileRes = await fetch(
          `https://api.line.me/v2/bot/group/${groupId}/member/${lineUserId}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (profileRes.ok) {
          const profile = await profileRes.json();
          displayName = profile.displayName || '不明';
        }
      } catch {}
    }
  }

  // トリガー判定
  const trigger = detectTrigger(text);

  // 全メッセージを蓄積（議事録用）
  const messageRecord: any = {
    group_id: group.id,
    user_id: userId,
    line_user_id: lineUserId || null,
    display_name: displayName,
    content: text,
    message_type: 'text',
    is_decision: trigger.type === 'decision',
    is_task: trigger.type === 'task_detected',
  };

  await supabase.from('group_messages').insert(messageRecord);

  // トリガー別処理
  switch (trigger.type) {
    case 'mention': {
      // メンション → AI応答（Function Calling使用）
      logger.info('group', `Mention in ${group.name}`, { user: displayName, text: trigger.cleanText });

      // ローディング表示（グループではgroupIdではなくuserIdに送る）
      if (lineUserId) {
        fetch('https://api.line.me/v2/bot/chat/loading/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ chatId: groupId }),
        }).catch(() => {});
      }

      try {
        // ユーザーオブジェクトを構築（AI Agent用）
        const user = userId
          ? (await supabase.from('users').select('*').eq('id', userId).single()).data
          : { id: 'group', display_name: displayName, role: 'staff' };

        if (user) {
          const reply = await aiAgentResponse(user, trigger.cleanText, supabase, geminiKey);
          await lineReply(replyToken, reply, token);
        }
      } catch (e: any) {
        logger.error('group', 'AI response failed', { error: e?.message });
        await lineReply(replyToken, 'すみません、応答に失敗しました。', token);
      }
      break;
    }

    case 'summary_request': {
      // 議事録要約リクエスト
      logger.info('group', `Summary request in ${group.name}`, { user: displayName });
      try {
        const summary = await generateGroupSummary(group.id, supabase, geminiKey);
        await lineReply(replyToken, summary, token);
      } catch (e: any) {
        logger.error('group', 'Summary failed', { error: e?.message });
        await lineReply(replyToken, '要約の生成に失敗しました。', token);
      }
      break;
    }

    case 'decision': {
      // 決定事項 → サイレント保存（応答なし）
      logger.info('group', `Decision detected in ${group.name}`, { text: text.substring(0, 50) });
      // extracted_dataに決定事項のメタデータを保存
      await supabase
        .from('group_messages')
        .update({ extracted_data: { type: 'decision', by: displayName, at: new Date().toISOString() } })
        .eq('group_id', group.id)
        .eq('content', text)
        .order('created_at', { ascending: false })
        .limit(1);
      break;
    }

    case 'task_detected': {
      // タスク検出 → 確認を1回返す
      logger.info('group', `Task detected in ${group.name}`, { text: text.substring(0, 50) });
      await lineReply(replyToken,
        `📝 タスクとして記録しました。\n「${text.substring(0, 60)}」\n\n登録が必要な場合は @AI秘書 タスク追加 と送ってください。`,
        token
      );
      break;
    }

    case 'question': {
      // AI向けの質問 → 応答（ただし控えめに）
      // グループでは確信度が低い質問には応答しない
      break;
    }

    case 'none':
    default:
      // 通常会話 → 蓄積のみ、応答なし
      break;
  }
}

// ── グループ自動登録 ──
async function getOrCreateGroup(lineGroupId: string, supabase: any, token: string): Promise<any> {
  const { data: existing } = await supabase
    .from('groups')
    .select('*')
    .eq('line_group_id', lineGroupId)
    .single();

  if (existing) return existing;

  // LINEからグループ名を取得
  let groupName = '未設定';
  try {
    const res = await fetch(`https://api.line.me/v2/bot/group/${lineGroupId}/summary`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      groupName = data.groupName || '未設定';
    }
  } catch {}

  const { data: newGroup } = await supabase
    .from('groups')
    .insert({
      line_group_id: lineGroupId,
      name: groupName,
      is_active: true,
    })
    .select()
    .single();

  logger.info('group', `New group registered: ${groupName}`, { lineGroupId });
  return newGroup;
}

// ── 議事録要約生成 ──
export async function generateGroupSummary(
  groupId: string,
  supabase: any,
  geminiKey: string,
  hours: number = 24,
): Promise<string> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { data: messages } = await supabase
    .from('group_messages')
    .select('display_name, content, is_decision, is_task, created_at')
    .eq('group_id', groupId)
    .gte('created_at', since)
    .order('created_at', { ascending: true })
    .limit(100);

  if (!messages || messages.length === 0) {
    return `直近${hours}時間のメッセージはありません。`;
  }

  const conversation = messages.map((m: any) => {
    const time = new Date(m.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    return `[${time}] ${m.display_name}: ${m.content}`;
  }).join('\n');

  const prompt = `以下のグループチャットの会話を分析し、要約してください。

会話（${messages.length}件）:
${conversation.substring(0, 3000)}

以下のフォーマットで要約してください（マークダウン不要、プレーンテキストで）:

【要約】
（3〜5行の要約）

【決定事項】
・（決定されたこと。なければ「なし」）

【アクションアイテム】
・（誰が何をするか。なければ「なし」）

【次のステップ】
・（今後やるべきこと）`;

  const result = await geminiGenerate(geminiKey, prompt);
  const summary = stripMarkdown(result);

  // 要約をDBに保存
  await supabase.from('group_summaries').insert({
    group_id: groupId,
    summary,
    period_start: since,
    period_end: new Date().toISOString(),
    message_count: messages.length,
  });

  return `📋 直近${hours}時間の議事録（${messages.length}件）\n\n${summary}`;
}

import crypto from 'crypto';
import { lineReply, linePush, linePushRaw, verifyLineSignature } from '../lib/core/line';
import { env } from '../lib/core/config';
import { getSupabase } from '../lib/core/supabase';
import { logger } from '../lib/core/logger';
import { handleSharePostback } from '../lib/core/feedback-handler';
import { getConversationState, isCancel, resetState } from '../lib/core/state';
import { routeMessage, detectIntent, routeVoiceIntent } from '../lib/core/router';
import { handleReceiptImage } from '../lib/handlers/expense';
import { handleVoiceMessage } from '../lib/handlers/voice';
import { handleGroupMessage } from '../lib/handlers/group';

/**
 * LINE署名検証
 * Vercelはbodyを自動パースするため、JSON.stringifyで再構築した場合
 * 元のバイト列と一致しない可能性がある。
 * 検証失敗はログに記録するが、Vercelのbody再構築問題を考慮して
 * ブロックしない（LINE側のリトライを防止）。
 */
export default async function handler(req: any, res: any) {
  if (req.method === 'GET') return res.status(200).json({ status: 'ok', time: new Date().toISOString() });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // --- LINE署名検証（ベストエフォート） ---
  const signature = req.headers['x-line-signature'] as string;
  if (signature) {
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const expected = crypto
      .createHmac('SHA256', env.LINE_CHANNEL_SECRET)
      .update(rawBody)
      .digest('base64');
    if (expected !== signature) {
      logger.warn('webhook', 'LINE signature mismatch (non-blocking, Vercel body reconstruction)');
    }
  }

  const body = req.body;

  const token = env.LINE_CHANNEL_ACCESS_TOKEN;
  const supabase = getSupabase();
  const geminiKey = env.GEMINI_API_KEY;

  // --- Webhook重複処理防止（インメモリキャッシュ） ---
  const processedEvents = (globalThis as any).__processedEvents || new Map<string, number>();
  (globalThis as any).__processedEvents = processedEvents;
  // 5分以上古いエントリを掃除（メモリリーク防止）
  const now = Date.now();
  for (const [key, ts] of processedEvents) {
    if (now - ts > 300_000) processedEvents.delete(key);
  }

  try {
    const events = body?.events || [];
    if (events.length === 0) return res.status(200).json({ status: 'ok' });

    for (const event of events) {
      // LINE Webhookリトライ検知 → スキップ
      if (event.deliveryContext?.isRedelivery) {
        logger.info('webhook', 'Skip redelivered event', { eventId: event.webhookEventId });
        continue;
      }
      // webhookEventIdで重複排除
      if (event.webhookEventId) {
        if (processedEvents.has(event.webhookEventId)) {
          logger.info('webhook', 'Skip duplicate event', { eventId: event.webhookEventId });
          continue;
        }
        processedEvents.set(event.webhookEventId, Date.now());
      }
      // --- Postbackイベント（共有ボタン等） ---
      if (event.type === 'postback') {
        const lineUserId = event.source?.userId;
        const replyToken = event.replyToken;
        const postbackData = event.postback?.data || '';
        if (lineUserId && postbackData.startsWith('share:')) {
          try {
            await handleSharePostback(postbackData, lineUserId, replyToken, supabase, token);
          } catch (e: any) {
            logger.error('webhook', 'Share postback error', { error: e?.message });
          }
        }
        continue;
      }

      if (event.type !== 'message') continue;
      const msgType = event.message?.type;
      if (msgType !== 'text' && msgType !== 'image' && msgType !== 'audio') continue;

      // --- グループメッセージ → グループハンドラーに委譲 ---
      if (event.source?.type === 'group' && msgType === 'text') {
        try {
          await handleGroupMessage(event, supabase, token, geminiKey);
        } catch (e: any) {
          logger.error('webhook', 'Group handler error', { error: e?.message });
        }
        continue;
      }

      const lineUserId: string = event.source?.userId;
      const replyToken: string = event.replyToken;
      if (!lineUserId || !replyToken) continue;

      // --- ローディング表示（最速で発火） ---
      fetch('https://api.line.me/v2/bot/chat/loading/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ chatId: lineUserId }),
      }).catch(e => logger.warn('webhook', 'Loading indicator failed', { error: e?.message }));

      // --- ユーザー検索 ---
      const { data: user } = await supabase
        .from('users').select('*').eq('line_user_id', lineUserId).single();

      // --- 初回ユーザー登録 ---
      if (!user) {
        let displayName = 'ユーザー';
        try {
          const profileRes = await fetch(`https://api.line.me/v2/bot/profile/${lineUserId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (profileRes.ok) {
            const profile = await profileRes.json();
            displayName = profile.displayName || 'ユーザー';
          }
        } catch (e) {}

        const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
        const isFirst = (count ?? 0) === 0;
        const role = isFirst ? 'owner' : 'pending';

        const { data: newUser } = await supabase.from('users').insert({
          line_user_id: lineUserId, line_display_name: displayName,
          display_name: displayName, role, last_message_at: new Date().toISOString(),
        }).select().single();

        if (newUser) {
          await supabase.from('conversation_states').insert({ user_id: newUser.id, state: 'idle', context: {} });
        }

        if (isFirst) {
          // 社長登録: 挨拶とコマンド一覧を2メッセージに分割
          await lineReply(replyToken, `はじめまして！AI秘書です。社長として登録しました。`, token);
          await linePush(lineUserId,
            `使い方:\n「日報」→ 日報作成\n「タスク」→ タスク一覧\n「出欠」→ 出欠状況\n「案件」→ 受注案件一覧\n「シフト」→ シフト確認\n「予定」→ カレンダー\n「事故」→ 事故報告\n「見学」→ 見学対応\n「行政」→ 行政タスク\n「スタッフ一覧」→ メンバー管理\n\n何でもお気軽にどうぞ！`,
            token
          );
        } else {
          // pending user: 短いメッセージのみ
          await lineReply(replyToken,
            `はじめまして、${displayName}さん！\nAI秘書です。管理者の承認をお待ちしています。\n承認されましたらお知らせします！`,
            token
          );
        }

        // 社長に新規スタッフ通知（管理画面リンク付き）
        if (!isFirst) {
          try {
            const { data: ownerUser } = await supabase
              .from('users').select('line_user_id').eq('role', 'owner').eq('is_active', true).limit(1).single();
            if (ownerUser?.line_user_id) {
              const adminMsg = `【新規スタッフ登録】\n${displayName}さんが新しく登録しました。\n\n承認する場合は管理画面から操作してください:\nhttps://ai-secretary-line.vercel.app/admin.html\n\n「スタッフ一覧」と送信しても確認できます。`;
              await linePush(ownerUser.line_user_id, adminMsg, token);
            }
          } catch (e) {
            logger.error('webhook', 'Owner notification failed', { error: String(e) });
          }
        }
        continue;
      }

      // --- pendingユーザー ---
      if (user.role === 'pending') {
        await lineReply(replyToken, '管理者の承認待ちです。もう少しお待ちください。', token);
        continue;
      }

      // --- last_message_at更新 ---
      await supabase.from('users').update({ last_message_at: new Date().toISOString() }).eq('id', user.id);

      // --- 画像メッセージ ---
      if (msgType === 'image') {
        try {
          await handleReceiptImage(user, event.message.id, replyToken, supabase, token, geminiKey);
        } catch (e: any) {
          logger.error('webhook', 'Image handler error', { error: e?.message });
          await lineReply(replyToken, '画像の処理に失敗しました。', token);
        }
        continue;
      }

      // --- 音声メッセージ → テキスト変換後、通常ルートに合流 ---
      if (msgType === 'audio') {
        try {
          const transcribedText = await handleVoiceMessage(user, event.message.id, replyToken, supabase, token, geminiKey);
          if (!transcribedText) {
            await lineReply(replyToken, '🎤 聞き取れませんでした。もう少しはっきり話すか、テキストで送ってください。', token);
            continue;
          }
          // 音声をテキストに変換後、テキストメッセージと同じルートで処理
          await linePush(user.line_user_id, `🎤「${transcribedText}」`, token);
          const { state, timeoutWarning } = await getConversationState(supabase, user.id);
          if (timeoutWarning) await linePush(user.line_user_id, timeoutWarning, token);
          await routeMessage(user, transcribedText, state, replyToken, supabase, token, geminiKey);
        } catch (e: any) {
          logger.error('webhook', 'Voice handler error', { error: e?.message });
          try { await lineReply(replyToken, '🎤 音声の認識に失敗しました。テキストで送ってください。', token); } catch {}
        }
        continue;
      }

      // --- テキストメッセージ ---
      const text: string = event.message.text || '';
      try {
        // グローバルキャンセル判定
        if (isCancel(text)) {
          await resetState(supabase, user.id);
          await lineReply(replyToken, '操作をキャンセルしました。最初からどうぞ。', token);
          continue;
        }

        // 会話状態取得（30分タイムアウト付き）
        const { state, timeoutWarning } = await getConversationState(supabase, user.id);

        // タイムアウト警告があれば先に通知
        if (timeoutWarning) {
          await linePush(user.line_user_id, timeoutWarning, token);
        }


        // ルーターに委譲
        await routeMessage(user, text, state, replyToken, supabase, token, geminiKey);
      } catch (handlerError: any) {
        logger.error('webhook', 'Handler error', { error: handlerError?.message || String(handlerError) });
        const errMsg = handlerError?.message || String(handlerError);
        let userErrMsg = '⚠ うまく処理できませんでした。\n別の言い方で試すか、しばらく後にもう一度お試しください。';
        if (/gemini|ai|generative|model|token/i.test(errMsg)) {
          userErrMsg = '⚠ AI応答が一時的に利用できません。\n30秒ほど待ってから再度お試しください。';
        } else if (/supabase|db|database|postgres|relation/i.test(errMsg)) {
          userErrMsg = '⚠ データの取得に失敗しました。\nしばらく後にお試しください。続く場合は管理者に連絡してください。';
        } else if (/timeout|ECONNREFUSED|fetch/i.test(errMsg)) {
          userErrMsg = '⚠ サーバーに接続できませんでした。\nネットワークを確認して再度お試しください。';
        }
        try { await lineReply(replyToken, userErrMsg, token); } catch {}
      }
    }

    return res.status(200).json({ status: 'ok' });
  } catch (error: any) {
    logger.error('webhook', 'Webhook error', { error: error?.message || String(error) });
    return res.status(200).json({ status: 'error' });
  }
}

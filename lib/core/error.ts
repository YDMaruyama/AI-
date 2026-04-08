/**
 * 統一エラーハンドラー & リトライユーティリティ
 */

/** 統一エラーハンドラー */
export async function handleError(
  error: any,
  context: string,
  replyToken: string,
  token: string,
  lineReplyFn: Function
): Promise<void> {
  const message = error?.message || String(error);
  console.error(`[${context}] Error:`, message);

  // Gemini レート制限
  if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
    await lineReplyFn(replyToken, 'AIの利用制限に達しました。少し時間を置いてからお試しください。', token);
    return;
  }

  // Supabase エラー
  if (message.includes('supabase') || message.includes('PostgrestError')) {
    await lineReplyFn(replyToken, 'データベースエラーが発生しました。管理者に連絡してください。', token);
    return;
  }

  // LINE API エラー
  if (message.includes('line.me') || message.includes('401')) {
    console.error('LINE API authentication error');
    return; // LINEのエラーはユーザーに通知できない
  }

  // デフォルト
  await lineReplyFn(replyToken, 'エラーが発生しました。もう一度お試しください。', token);
}

/** Gemini呼び出しをリトライ付きで実行 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  delayMs: number = 1000
): Promise<T> {
  let lastError: any;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (e: any) {
      lastError = e;
      if (i < maxRetries && (e?.message?.includes('429') || e?.message?.includes('503'))) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
        continue;
      }
      throw e;
    }
  }
  throw lastError;
}

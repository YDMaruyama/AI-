/** 会話状態管理 - タイムアウト & グローバルキャンセル */

const STATE_LABELS: Record<string, string> = {
  writing_report: '日報作成',
  confirming_report: '日報確認',
  writing_expense: '経費入力',
  writing_incident: '事故報告',
  confirming_receipt: 'レシート確認',
};

/** 状態を取得（30分以上経過→リセット、20分経過→警告フラグ付き） */
export async function getConversationState(supabase: any, userId: string): Promise<{state: string, context: any, timeoutWarning?: string}> {
  const { data } = await supabase
    .from('conversation_states')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!data) return { state: 'idle', context: {} };

  const updatedAt = new Date(data.updated_at);
  const now = new Date();
  const diffMinutes = (now.getTime() - updatedAt.getTime()) / (1000 * 60);

  // 30分以上経過→idleにリセット
  if (data.state !== 'idle' && diffMinutes > 30) {
    await supabase.from('conversation_states').upsert({
      user_id: userId, state: 'idle', context: {}, updated_at: new Date().toISOString(),
    });
    await supabase.from('report_drafts').delete().eq('user_id', userId);
    const label = STATE_LABELS[data.state] || data.state;
    return { state: 'idle', context: {}, timeoutWarning: `⏰ ${label}が30分経過したためリセットされました。` };
  }

  // 20分以上経過→警告フラグ
  if (data.state !== 'idle' && diffMinutes > 20) {
    const remaining = Math.ceil(30 - diffMinutes);
    return { state: data.state, context: data.context || {}, timeoutWarning: `⏰ あと${remaining}分で入力がリセットされます。` };
  }

  return { state: data.state, context: data.context || {} };
}

/** グローバルキャンセル判定 */
export function isCancel(text: string): boolean {
  return /^(キャンセル|やめる|やめ|戻る|戻して|中止|リセット)$/.test(text.trim());
}

/** 状態をidleにリセット */
export async function resetState(supabase: any, userId: string): Promise<void> {
  await supabase.from('conversation_states').upsert({
    user_id: userId, state: 'idle', context: {}, updated_at: new Date().toISOString(),
  });
  await supabase.from('report_drafts').delete().eq('user_id', userId);
}

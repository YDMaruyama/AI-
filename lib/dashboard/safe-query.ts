/**
 * エラー隔離ヘルパー: 1モジュールが失敗しても他に影響しない
 */
export async function safeQuery<T>(
  name: string,
  fn: () => Promise<T>,
  fallback: T
): Promise<{ data: T; error: string | null }> {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (e: any) {
    console.error(`[dashboard:${name}] failed:`, e?.message || e);
    return { data: fallback, error: e?.message || String(e) };
  }
}

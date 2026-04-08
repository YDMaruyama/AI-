/**
 * Tier 1: インライン追跡（毎メッセージ、Geminiコスト0）
 * - trackInteraction: intent分布・時間分布をアトミックに更新
 * - maybeAddKnowledge: 重複チェック付きでknowledge_baseに追加
 */
import { getNowJST } from './utils';
import { logger } from './logger';

/** メッセージごとにユーザー統計を更新（fire-and-forget） */
export async function trackInteraction(
  supabase: any,
  userId: string,
  intent: string
): Promise<void> {
  try {
    const hour = getNowJST().getUTCHours();
    await supabase.rpc('increment_interaction_stats', {
      p_user_id: userId,
      p_intent: intent,
      p_hour: hour,
    });
  } catch (e: any) {
    logger.warn('memory-inline', 'trackInteraction failed', { error: e?.message });
  }
}

/** 知識ベースにエントリ追加（タイトル重複時はスキップ） */
export async function maybeAddKnowledge(
  supabase: any,
  entry: {
    category: 'rule' | 'decision' | 'seasonal' | 'process' | 'fact' | 'lesson';
    title: string;
    content: string;
    tags: string[];
    source_user_id?: string;
  }
): Promise<boolean> {
  try {
    // タイトル完全一致で重複チェック
    const { count } = await supabase
      .from('knowledge_base')
      .select('*', { count: 'exact', head: true })
      .eq('title', entry.title)
      .eq('is_active', true);
    if ((count ?? 0) > 0) return false;

    await supabase.from('knowledge_base').insert({
      ...entry,
      source_type: 'event',
      confidence: 0.6,
    });
    return true;
  } catch (e: any) {
    logger.warn('memory-inline', 'maybeAddKnowledge failed', { error: e?.message });
    return false;
  }
}

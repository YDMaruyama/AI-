/**
 * 記憶検索: プロフィール + 知識ベース + 会話履歴を組み立て
 * トークン予算 ~1700 tokens（プロフィール400 + 知識500 + 履歴800）
 */
import { logger } from './logger';

const MAX_MEMORY_CHARS = 2000;

// キーワード抽出用の固定語彙（intent名に近い日本語）
const KEYWORD_MAP: Record<string, string[]> = {
  経費: ['expense', '経費', 'レシート', '領収書'],
  日報: ['report', '日報', '作業'],
  タスク: ['task', 'タスク', 'TODO'],
  予定: ['calendar', '予定', 'スケジュール'],
  出欠: ['attendance', '出欠', '出席'],
  案件: ['order', '案件', '受注', '納品'],
  金庫: ['cashbox', '金庫', '残高', '入金', '出金'],
  利用者: ['client', '利用者', '支援'],
  事故: ['incident', '事故', 'ヒヤリ'],
  売上: ['sales', '売上'],
  会議: ['meeting', '会議', '議事録', 'MTG'],
  行政: ['admin_doc', '行政', '書類'],
  シフト: ['shift', 'シフト', '勤務'],
};

/** テキストからタグ検索用キーワードを抽出 */
function extractKeywords(text: string): string[] {
  const keywords: string[] = [];
  for (const [tag, patterns] of Object.entries(KEYWORD_MAP)) {
    if (patterns.some(p => text.includes(p))) {
      keywords.push(tag);
    }
  }
  return keywords;
}

/** テキストからDB検索用の短いキーワードを抽出（ilike用） */
function extractSearchTerms(text: string): string[] {
  // 助詞・接続詞を除去して意味のある単語を抽出
  const cleaned = text
    .replace(/[について|教えて|どう|何|知りたい|ある|する|した|です|ます|から|ので|って|の|を|に|は|が|で|と|も|か|よ|ね|な|？|?|！|!]/g, ' ')
    .trim();
  // 2文字以上の単語を抽出
  return cleaned.split(/\s+/).filter(w => w.length >= 2).slice(0, 3);
}

/** メモリコンテキスト全体を組み立て */
export async function buildMemoryContext(
  supabase: any,
  userId: string,
  currentText: string
): Promise<string> {
  try {
    const keywords = extractKeywords(currentText);
    const searchTerms = extractSearchTerms(currentText);

    // 4クエリ並列実行
    const [profileRes, knowledgeByTagRes, knowledgeByTextRes, historyRes, relatedMsgRes] = await Promise.all([
      // 1. ユーザープロフィール
      supabase
        .from('user_profiles')
        .select('personality_summary, ai_notes, frequent_topics, work_patterns')
        .eq('user_id', userId)
        .single(),
      // 2a. 知識ベース検索（タグマッチ）
      keywords.length > 0
        ? supabase
            .from('knowledge_base')
            .select('id, title, content, category')
            .eq('is_active', true)
            .overlaps('tags', keywords)
            .order('access_count', { ascending: false })
            .limit(3)
        : Promise.resolve({ data: [] }),
      // 2b. 知識ベース検索（テキスト検索 — タグにない情報もヒット）
      searchTerms.length > 0
        ? supabase
            .from('knowledge_base')
            .select('id, title, content, category')
            .eq('is_active', true)
            .or(searchTerms.map(t => `content.ilike.%${t}%`).join(','))
            .order('created_at', { ascending: false })
            .limit(3)
        : Promise.resolve({ data: [] }),
      // 3. 直近の会話履歴（10件）
      supabase
        .from('conversation_messages')
        .select('role, content, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10),
      // 4. 関連する過去の会話（テキスト検索、全ユーザー対象）
      searchTerms.length > 0
        ? supabase
            .from('conversation_messages')
            .select('role, content, created_at')
            .or(searchTerms.map(t => `content.ilike.%${t}%`).join(','))
            .order('created_at', { ascending: false })
            .limit(5)
        : Promise.resolve({ data: [] }),
    ]);

    const parts: string[] = [];

    // プロフィール（~400 tokens）
    const profile = profileRes.data;
    if (profile) {
      const profileParts: string[] = [];
      if (profile.personality_summary) profileParts.push(profile.personality_summary);
      if (profile.ai_notes) profileParts.push(profile.ai_notes.slice(-200));
      if (profile.frequent_topics?.length > 0) {
        profileParts.push(`よく使う機能: ${profile.frequent_topics.join('、')}`);
      }
      if (profileParts.length > 0) {
        parts.push(`\n【このユーザーについて】\n${profileParts.join('\n')}`);
      }
    }

    // 知識ベース（タグ + テキスト検索の結果を統合、重複排除）
    const tagResults = knowledgeByTagRes.data || [];
    const textResults = knowledgeByTextRes.data || [];
    const seenIds = new Set<string>();
    const allKnowledge: any[] = [];
    for (const k of [...tagResults, ...textResults]) {
      if (!seenIds.has(k.id)) {
        seenIds.add(k.id);
        allKnowledge.push(k);
      }
    }
    if (allKnowledge.length > 0) {
      const kbEntries = allKnowledge.slice(0, 5).map((k: any) =>
        `・[${k.category}] ${k.title}: ${k.content}`
      ).join('\n');
      parts.push(`\n【関連する知識】\n${kbEntries}`);
    }

    // 関連する過去の会話（テキスト検索ヒット）
    const relatedMsgs = relatedMsgRes.data || [];
    if (relatedMsgs.length > 0) {
      const relEntries = relatedMsgs.map((m: any) =>
        `${m.role === 'user' ? 'U' : 'A'}: ${m.content.substring(0, 80)}`
      ).join('\n');
      parts.push(`\n【関連する過去の会話】\n${relEntries}`);
    }

    // 会話履歴（~800 tokens）
    const messages = historyRes.data;
    if (messages && messages.length > 0) {
      const history = messages.reverse().map((m: any) =>
        `${m.role === 'user' ? 'ユーザー' : 'AI'}: ${m.content.substring(0, 100)}`
      ).join('\n');
      parts.push(`\n【直近の会話】\n${history}`);
    }

    // トークン予算ガード
    let result = parts.join('');
    if (result.length > MAX_MEMORY_CHARS) {
      result = result.substring(0, MAX_MEMORY_CHARS) + '...';
    }

    return result;
  } catch (e: any) {
    logger.warn('memory-retrieval', 'buildMemoryContext failed, falling back', { error: e?.message });
    // フォールバック: 従来の会話履歴のみ
    try {
      const { data: messages } = await supabase
        .from('conversation_messages')
        .select('role, content')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      if (!messages || messages.length === 0) return '';
      return '\n【直近の会話】\n' + messages.reverse()
        .map((m: any) => `${m.role === 'user' ? 'ユーザー' : 'AI'}: ${m.content.substring(0, 100)}`)
        .join('\n');
    } catch {
      return '';
    }
  }
}

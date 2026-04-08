/**
 * Tier 2: 日次記憶抽出（Vercel Cron 22:00 JST）
 * 1日の会話をGeminiで分析 → user_profiles / knowledge_base / patterns に反映
 */
import { geminiGenerate } from './gemini';
import { extractJson } from './gemini-utils';
import { getToday } from './utils';
import { logger } from './logger';

const EXTRACTION_PROMPT = `あなたはAI秘書の記憶分析エンジンです。今日の会話を分析し、JSONのみ返してください。

【ユーザー】{USER_NAME}（{ROLE}）
【現在の記憶】{CURRENT_MEMORY}
【既存の知識タイトル】{EXISTING_TITLES}

【今日の会話（{MSG_COUNT}件）】
{MESSAGES}

以下のJSON形式で返してください:
{
  "personality_update": "新しい性格的発見（なければ空文字）",
  "frequent_topics": ["よく話題にするテーマ上位3つ"],
  "new_knowledge": [
    {"category": "rule|decision|fact|lesson|process|seasonal", "title": "20文字以内", "content": "50文字以内", "tags": ["keyword1"]}
  ],
  "new_patterns": [
    {"type": "habit|reminder|seasonal", "title": "20文字以内", "description": "50文字以内", "user_specific": true}
  ],
  "ai_notes_append": "今日の特記事項（50文字以内、なければ空文字）"
}

ルール:
- 本当に有用な発見のみ。些末な会話は無視
- new_knowledgeは既存タイトルと重複しないこと（最大2件）
- new_patternsは繰り返し観察されたもののみ（最大1件）
- frequent_topicsは会話内容から推定（最大3つ）
- JSONのみ返す。説明不要`;

interface ExtractionResult {
  personality_update: string;
  frequent_topics: string[];
  new_knowledge: Array<{
    category: string;
    title: string;
    content: string;
    tags: string[];
  }>;
  new_patterns: Array<{
    type: string;
    title: string;
    description: string;
    user_specific: boolean;
  }>;
  ai_notes_append: string;
}

/** 1ユーザー分の日次抽出 */
export async function extractDailyInsights(
  supabase: any,
  geminiKey: string,
  user: { id: string; display_name: string; role: string }
): Promise<{ extracted: boolean; knowledge: number; patterns: number }> {
  const today = getToday();

  // 今日の会話を取得（最大40件）
  const { data: messages } = await supabase
    .from('conversation_messages')
    .select('role, content, created_at')
    .eq('user_id', user.id)
    .gte('created_at', today)
    .order('created_at', { ascending: true })
    .limit(40);

  if (!messages || messages.length < 3) {
    return { extracted: false, knowledge: 0, patterns: 0 };
  }

  // 現在のプロフィール
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('personality_summary, ai_notes')
    .eq('user_id', user.id)
    .single();

  // 既存の知識タイトル
  const { data: existingKb } = await supabase
    .from('knowledge_base')
    .select('title')
    .eq('is_active', true)
    .limit(50);

  const currentMemory = profile
    ? `${profile.personality_summary || ''} / ${(profile.ai_notes || '').slice(-200)}`
    : 'なし';
  const existingTitles = (existingKb || []).map((k: any) => k.title).join('、') || 'なし';
  const msgText = messages
    .map((m: any) => `${m.role === 'user' ? 'U' : 'A'}: ${m.content.substring(0, 80)}`)
    .join('\n');

  // プロンプト組み立て
  const prompt = EXTRACTION_PROMPT
    .replace('{USER_NAME}', user.display_name)
    .replace('{ROLE}', user.role)
    .replace('{CURRENT_MEMORY}', currentMemory)
    .replace('{EXISTING_TITLES}', existingTitles)
    .replace('{MSG_COUNT}', String(messages.length))
    .replace('{MESSAGES}', msgText);

  try {
    const result = await geminiGenerate(geminiKey, prompt);
    const data = extractJson<ExtractionResult>(result);

    let knowledgeCount = 0;
    let patternCount = 0;

    // user_profiles 更新
    const profileUpdate: Record<string, any> = {
      last_analyzed_at: new Date().toISOString(),
    };
    if (data.personality_update) {
      profileUpdate.personality_summary = profile?.personality_summary
        ? `${profile.personality_summary}。${data.personality_update}`
        : data.personality_update;
      // 300文字上限
      if (profileUpdate.personality_summary.length > 300) {
        profileUpdate.personality_summary = profileUpdate.personality_summary.slice(-300);
      }
    }
    if (data.frequent_topics?.length > 0) {
      profileUpdate.frequent_topics = data.frequent_topics.slice(0, 5);
    }
    if (data.ai_notes_append) {
      const existingNotes = profile?.ai_notes || '';
      profileUpdate.ai_notes = (existingNotes + `\n[${today}] ${data.ai_notes_append}`).slice(-500);
    }

    await supabase
      .from('user_profiles')
      .upsert({ user_id: user.id, ...profileUpdate }, { onConflict: 'user_id' });

    // knowledge_base 追加
    if (data.new_knowledge?.length > 0) {
      for (const k of data.new_knowledge.slice(0, 2)) {
        const { count } = await supabase
          .from('knowledge_base')
          .select('*', { count: 'exact', head: true })
          .eq('title', k.title)
          .eq('is_active', true);
        if ((count ?? 0) === 0) {
          await supabase.from('knowledge_base').insert({
            category: k.category,
            title: k.title,
            content: k.content,
            tags: k.tags || [],
            source_user_id: user.id,
            source_type: 'daily_analysis',
            confidence: 0.6,
          });
          knowledgeCount++;
        }
      }
    }

    // patterns 追加
    if (data.new_patterns?.length > 0) {
      for (const p of data.new_patterns.slice(0, 1)) {
        await supabase.from('patterns').insert({
          pattern_type: p.type || 'habit',
          user_id: p.user_specific ? user.id : null,
          title: p.title,
          description: p.description,
          trigger_condition: {},
          confidence: 0.5,
        });
        patternCount++;
      }
    }

    return { extracted: true, knowledge: knowledgeCount, patterns: patternCount };
  } catch (e: any) {
    logger.error('memory-extraction', `Failed for ${user.display_name}`, { error: e?.message });
    return { extracted: false, knowledge: 0, patterns: 0 };
  }
}

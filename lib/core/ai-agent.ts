/**
 * AI Agent with Function Calling
 * GeminiがDB検索ツールを自分で呼び出して回答する
 * スキルレジストリからツールを動的取得
 */
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { GEMINI_MODEL } from './config';
import { SHARED_PERSONALITY, CONTEXT_TEMPLATE, WELFARE_KNOWLEDGE, SALON_KNOWLEDGE, GLOBAL_KNOWLEDGE, ANALYSIS_KNOWLEDGE } from './personality';
import { getToday, roleName } from './utils';
import { stripMarkdown } from './gemini';
import { logger } from './logger';
import { skillRegistry } from '../skills';

// ── スキルレジストリからのツール ──
const SKILL_TOOLS = skillRegistry.getAgentToolDeclarations();
const skillExecutors = skillRegistry.getAgentToolExecutors();

// ── レガシーDB検索ツール定義（まだスキル化されていないもの） ──
const LEGACY_DB_TOOLS = [
  {
    name: 'search_knowledge',
    description: '事業所の知識ベースを検索。社内ルール、決定事項、マニュアル、FAQ等。「〇〇のルールは？」「〇〇について教えて」系の質問で使う。',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: { type: SchemaType.STRING, description: '検索キーワード（日本語）' },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_conversations',
    description: '過去のLINE会話履歴を検索。「前に話した〇〇」「以前言った〇〇」系の質問で使う。',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: { type: SchemaType.STRING, description: '検索キーワード（日本語）' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_staff',
    description: 'スタッフ一覧と役割を取得。誰が何を担当しているか、最終利用日等。',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    },
  },
  {
    name: 'get_projects',
    description: 'シーラン事業のプロジェクト一覧・進捗を取得する。ドバイ、海外展開、サウナ、ホテル、排毒学校、ブランディング等のプロジェクト情報が含まれる。',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: { type: SchemaType.STRING, description: '検索キーワード（例: ドバイ、サウナ、海外）。省略で全プロジェクト' },
        status: { type: SchemaType.STRING, description: 'ステータスフィルタ: 進行中, 未着手, 完了, 保留, ブロック中。省略で未完了全て' },
      },
    },
  },
  {
    name: 'get_project_detail',
    description: '特定プロジェクトの詳細（マイルストーン・タスク含む）を取得する',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        project_title: { type: SchemaType.STRING, description: 'プロジェクト名（部分一致）' },
      },
      required: ['project_title'],
    },
  },
  {
    name: 'get_project_tasks',
    description: 'プロジェクトに紐づくタスク一覧を取得する',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: { type: SchemaType.STRING, description: '検索キーワード。省略で未完了タスク全て' },
        status: { type: SchemaType.STRING, description: 'ステータスフィルタ: 未着手, 進行中, レビュー中, 完了' },
      },
    },
  },
];

// スキル + レガシーを結合
const DB_TOOLS = [...SKILL_TOOLS, ...LEGACY_DB_TOOLS];

// ── Supabaseクエリのエラーチェック付きヘルパー ──
async function query(promise: any): Promise<any[]> {
  const { data, error } = await promise;
  if (error) throw new Error(`DB: ${error.message}`);
  return data || [];
}

// ── ツール実行（スキルレジストリ優先 → レガシーswitch） ──
async function executeTool(name: string, args: any, supabase: any, userId: string): Promise<string> {
  try {
    // スキルレジストリのツールを優先チェック
    const skillExecutor = skillExecutors.get(name);
    if (skillExecutor) {
      return await skillExecutor(args, supabase, userId);
    }

    // レガシーswitch（まだスキル化されていないもの）
    switch (name) {
      case 'search_knowledge': {
        const q = args.query || '';
        const data = await query(supabase
          .from('knowledge_base')
          .select('title, content, category, created_at')
          .eq('is_active', true)
          .or(`content.ilike.%${q}%,title.ilike.%${q}%`)
          .order('created_at', { ascending: false })
          .limit(5));
        if (data.length === 0) return '該当する情報はありません。';
        return data.map((k: any) => `[${k.category}] ${k.title}: ${k.content}`).join('\n');
      }
      case 'search_conversations': {
        const q = args.query || '';
        const { data } = await supabase
          .from('conversation_messages')
          .select('role, content, created_at')
          .ilike('content', `%${q}%`)
          .order('created_at', { ascending: false })
          .limit(10);
        if (!data || data.length === 0) return '該当する会話はありません。';
        return data.map((m: any) => `${m.role === 'user' ? 'U' : 'A'}(${(m.created_at || '').substring(0, 10)}): ${(m.content || '').substring(0, 100)}`).join('\n');
      }
      case 'get_staff': {
        const { data } = await supabase.from('users').select('display_name, role, job_description, is_active, last_message_at').eq('is_active', true);
        if (!data || data.length === 0) return 'スタッフ情報はありません。';
        return data.map((u: any) => `${u.display_name}（${roleName(u.role)}）${u.job_description ? ' - ' + u.job_description : ''}`).join('\n');
      }
      case 'get_projects': {
        const query = args.query || '';
        const statusFilter = args.status || '';
        let q = supabase
          .from('projects')
          .select('title, description, status, priority, category, next_action, target_date, tags, stakeholders')
          .order('priority', { ascending: true });

        if (statusFilter) {
          q = q.eq('status', statusFilter);
        } else {
          q = q.in('status', ['進行中', '未着手', 'ブロック中', '保留']);
        }

        if (query) {
          q = q.or(`title.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`);
        }

        const { data } = await q.limit(10);
        if (!data || data.length === 0) return '該当するプロジェクトはありません。';

        return data.map((p: any) => {
          let line = `【${p.status}/${p.priority}】${p.title}`;
          if (p.category) line += `（${p.category}）`;
          if (p.next_action) line += `\n  → 次のアクション: ${p.next_action}`;
          if (p.target_date) line += `\n  → 目標: ${p.target_date}`;
          if (p.stakeholders) line += `\n  → 関係者: ${p.stakeholders}`;
          // 説明の先頭200文字
          if (p.description) line += `\n  ${p.description.substring(0, 200)}`;
          return line;
        }).join('\n\n');
      }
      case 'get_project_detail': {
        const title = args.project_title || '';
        const { data: projects } = await supabase
          .from('projects')
          .select('id, title, description, status, priority, category, next_action, target_date, stakeholders, notion_url')
          .ilike('title', `%${title}%`)
          .limit(1);

        if (!projects || projects.length === 0) return `「${title}」に該当するプロジェクトが見つかりません。`;
        const proj = projects[0];

        // マイルストーン取得
        const { data: milestones } = await supabase
          .from('project_milestones')
          .select('title, status, due_date')
          .eq('project_id', proj.id)
          .order('sort_order', { ascending: true })
          .limit(20);

        // タスク取得
        const { data: tasks } = await supabase
          .from('project_tasks')
          .select('title, status, priority, due_date')
          .eq('project_id', proj.id)
          .in('status', ['未着手', '進行中', 'レビュー中'])
          .order('due_date', { ascending: true })
          .limit(15);

        let result = `プロジェクト: ${proj.title}\nステータス: ${proj.status}（優先度: ${proj.priority}）\nカテゴリ: ${proj.category || '未分類'}`;
        if (proj.next_action) result += `\n次のアクション: ${proj.next_action}`;
        if (proj.target_date) result += `\n目標時期: ${proj.target_date}`;
        if (proj.stakeholders) result += `\n関係者: ${proj.stakeholders}`;
        if (proj.description) result += `\n\n概要:\n${proj.description.substring(0, 800)}`;

        if (milestones && milestones.length > 0) {
          result += '\n\nマイルストーン:';
          for (const ms of milestones) {
            result += `\n  [${ms.status}] ${ms.title}${ms.due_date ? '（' + ms.due_date + '）' : ''}`;
          }
        }

        if (tasks && tasks.length > 0) {
          result += '\n\n未完了タスク:';
          for (const t of tasks) {
            result += `\n  [${t.status}/${t.priority}] ${t.title}${t.due_date ? ' 期限:' + t.due_date : ''}`;
          }
        }

        return result;
      }
      case 'get_project_tasks': {
        const query = args.query || '';
        const statusFilter = args.status || '';
        let q = supabase
          .from('project_tasks')
          .select('title, status, priority, assignee, due_date, project_id')
          .order('due_date', { ascending: true })
          .limit(20);

        if (statusFilter) {
          q = q.eq('status', statusFilter);
        } else {
          q = q.in('status', ['未着手', '進行中', 'レビュー中']);
        }

        if (query) {
          q = q.ilike('title', `%${query}%`);
        }

        const { data } = await q;
        if (!data || data.length === 0) return '該当するタスクはありません。';
        return data.map((t: any) =>
          `[${t.status}/${t.priority}] ${t.title}${t.assignee ? ' 担当:' + t.assignee : ''}${t.due_date ? ' 期限:' + t.due_date : ''}`
        ).join('\n');
      }
      default:
        return 'ツールが見つかりません。';
    }
  } catch (e: any) {
    logger.warn('ai-agent', `Tool ${name} failed`, { error: e?.message });
    return `検索に失敗しました: ${e?.message || 'unknown error'}`;
  }
}

// ── メインエージェント実行 ──
export async function aiAgentResponse(
  user: any, text: string, supabase: any, geminiKey: string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    tools: [{ functionDeclarations: DB_TOOLS as any }],
  });

  // 質問内容に応じて必要な専門知識を選択的に注入（トークン節約）
  const domainKnowledge: string[] = [];
  const lowerText = text.toLowerCase();
  if (/利用者|日報|支援|加算|行政|A型|B型|工賃|国保連|処遇改善/.test(text)) {
    domainKnowledge.push(WELFARE_KNOWLEDGE);
  }
  if (/サロン|予約|施術|リピート|客単価|キャンセル|よもぎ|ハーブ|リンパ|デトックス|SALT/.test(text)) {
    domainKnowledge.push(SALON_KNOWLEDGE);
  }
  if (/ドバイ|海外|シーラン|プロジェクト|マイルストーン|排毒|サウナ|ホテル/.test(text)) {
    domainKnowledge.push(GLOBAL_KNOWLEDGE);
  }
  if (/経費|売上|分析|異常|KPI|前月比|前年比|推移|傾向/.test(text)) {
    domainKnowledge.push(ANALYSIS_KNOWLEDGE);
  }

  const systemPrompt = `${SHARED_PERSONALITY}

${CONTEXT_TEMPLATE(user.display_name, roleName(user.role), getToday())}
${domainKnowledge.length > 0 ? domainKnowledge.join('\n') : ''}

【ツール活用ルール】
- 質問に答えるために必要なデータは、必ずツールで検索してから回答する
- 推測・憶測ではなく、実データに基づいて回答する
- 複数の事業にまたがる質問には、複数ツールを組み合わせて回答する
- データが見つからない場合は「該当する情報が見つかりませんでした」と正直に伝える
- 数字を聞かれたら合計・平均・比較等を計算して提示する
- 専門知識がある分野は、データ+知識を組み合わせて実用的なアドバイスをする

【回答の優先度】
1. 期限切れ・緊急事項があれば最初に警告
2. 質問への直接回答（数字・ファクト）
3. 専門知識に基づく判断・提案（あれば）
4. 関連する補足情報（あれば簡潔に）`;

  try {
    // 0. 直近の会話履歴を取得（コンテキスト強化）
    const { data: recentMsgs } = await supabase
      .from('conversation_messages')
      .select('role, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    const recentHistory: any[] = [];
    if (recentMsgs && recentMsgs.length > 0) {
      for (const m of [...recentMsgs].reverse()) {
        recentHistory.push({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content.substring(0, 1000) }],
        });
      }
    }

    // 1. ユーザーメッセージ送信（ツール呼び出しが返る可能性）
    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'はい、3事業のデータを活用して正確に回答します。' }] },
        ...recentHistory,
      ],
    });

    let response = await chat.sendMessage(text);
    let result = response.response;

    // 2. Function Callingループ（最大3回）
    for (let i = 0; i < 3; i++) {
      const calls = result.functionCalls();
      if (!calls || calls.length === 0) break;

      // ツール実行
      const toolResults = [];
      for (const call of calls) {
        const output = await executeTool(call.name, call.args || {}, supabase, user.id);
        toolResults.push({
          functionResponse: { name: call.name, response: { result: output } },
        });
      }

      // ツール結果をGeminiに返す
      response = await chat.sendMessage(toolResults);
      result = response.response;
    }

    return stripMarkdown(result.text() || '回答を生成できませんでした。');
  } catch (e: any) {
    logger.error('ai-agent', 'Function calling failed', { error: e?.message });
    throw e; // 呼び出し元でフォールバック
  }
}

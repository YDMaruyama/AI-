/**
 * スキルシステム型定義 + defineSkill ヘルパー
 * 1ファイル1スキルで完結するプラグインアーキテクチャ
 */
import { SchemaType } from '@google/generative-ai';

// ── ハンドラーの統一シグネチャ ──
export type SkillHandler = (
  user: any,
  text: string,
  replyToken: string,
  supabase: any,
  token: string,
  geminiKey: string,
) => Promise<void>;

// ── 会話状態ハンドラー ──
export interface StateHandler {
  /** conversation_states.state の値 (例: 'writing_report') */
  stateName: string;
  /** 状態中に呼ばれるハンドラー */
  handler: SkillHandler;
}

// ── キーワードルート ──
export interface SkillKeywordRoute {
  /** マッチパターン */
  pattern: RegExp;
  /** このルートに対応するintent名 */
  intent: string;
  /** ハンドラー */
  handler: SkillHandler;
}

// ── AI Agentツール定義 (Gemini Function Calling用) ──
export interface SkillAgentTool {
  /** ツール名 (例: 'get_documents') */
  name: string;
  /** Geminiに渡すdescription */
  description: string;
  /** Geminiに渡すparametersスキーマ */
  parameters: {
    type: typeof SchemaType.OBJECT;
    properties: Record<string, any>;
    required?: string[];
  };
  /** ツール実行関数 */
  execute: (args: any, supabase: any, userId: string) => Promise<string>;
}

// ── ブリーフィング提供者 ──
export interface BriefingProvider {
  /** ブリーフィング内の表示順序 (小さいほど先) */
  order: number;
  /** 対象ロール (省略で全員) */
  roles?: string[];
  /** ブリーフィングテキストを返す。null=出力なし */
  provide: (supabase: any, user: any, today: string) => Promise<string | null>;
  /** topActionsに追加するアイテムを返す (省略可) */
  topActions?: (supabase: any, user: any, today: string) => Promise<string[]>;
}

// ── Intent検出の高速パス ──
export interface FastIntentMatch {
  pattern: RegExp;
  intent: string;
}

// ── スキル定義 ──
export interface SkillDefinition {
  /** スキルID (ユニーク。例: 'invoice') */
  id: string;
  /** スキル名 (表示用) */
  name: string;

  /** このスキルが管理するintent名の配列 */
  intents: string[];

  /** キーワードルート (router.ts の KEYWORD_ROUTES に合流) */
  routes?: SkillKeywordRoute[];

  /** 会話状態ハンドラー (router.ts の STATE_ROUTES に合流) */
  states?: StateHandler[];

  /** detectIntent 内の高速パス正規表現 */
  fastIntents?: FastIntentMatch[];

  /** AI Agent用ツール定義 */
  agentTools?: SkillAgentTool[];

  /** 朝ブリーフィング提供 */
  briefing?: BriefingProvider;

  /** detectIntentのAI判定プロンプトに追加するカテゴリ説明 */
  intentDescriptions?: Record<string, string>;

  /** routeMessage の breakPattern に追加するキーワード */
  breakKeywords?: string[];
}

/** スキル定義ヘルパー（型チェック用、ランタイムコストゼロ） */
export function defineSkill(def: SkillDefinition): SkillDefinition {
  return def;
}

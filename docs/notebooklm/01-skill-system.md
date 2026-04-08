# スキルシステム設計ガイド

## 1. 概要

スキルベースプラグインシステムは、LINE Botの各機能を独立した「スキルファイル」として定義する設計パターン。

### 目的
- **関心の分離**: 1機能 = 1ファイル
- **スケーラビリティ**: 新機能追加がファイル追加だけで完結
- **テスト容易性**: 各スキルが独立してテスト可能
- **レガシー共存**: スキル化されていない機能とシームレスに共存

## 2. 型定義 (`_define.ts`)

### SkillDefinition — スキルの全体構造
```typescript
interface SkillDefinition {
  id: string;           // ユニークID（例: 'invoice'）
  name: string;         // 表示名（例: '請求書・領収書管理'）
  intents: string[];    // このスキルが管理するintent名の配列
  routes?: SkillKeywordRoute[];       // キーワードルート
  states?: StateHandler[];            // 会話状態ハンドラー
  fastIntents?: FastIntentMatch[];    // 高速intent判定パターン
  agentTools?: SkillAgentTool[];      // AI Agentツール定義
  briefing?: BriefingProvider;        // 朝ブリーフィング提供
  intentDescriptions?: Record<string, string>;  // AI判定プロンプト用説明
  breakKeywords?: string[];           // 会話状態脱出キーワード
}
```

### SkillHandler — 統一ハンドラーシグネチャ
```typescript
type SkillHandler = (
  user: any,         // ユーザーオブジェクト（id, display_name, role等）
  text: string,      // ユーザー入力テキスト
  replyToken: string,// LINE replyToken
  supabase: any,     // Supabaseクライアント
  token: string,     // LINE Channel Access Token
  geminiKey: string,  // Gemini API Key
) => Promise<void>;
```

### SkillKeywordRoute — キーワードマッチルート
```typescript
interface SkillKeywordRoute {
  pattern: RegExp;     // マッチ正規表現
  intent: string;      // 対応intent名
  handler: SkillHandler; // 実行ハンドラー
}
```

### SkillAgentTool — AI Agent Function Calling ツール
```typescript
interface SkillAgentTool {
  name: string;        // ツール名（例: 'get_documents'）
  description: string; // Geminiに渡す説明文
  parameters: {        // Gemini Function Calling スキーマ
    type: SchemaType.OBJECT;
    properties: Record<string, any>;
    required?: string[];
  };
  execute: (args: any, supabase: any, userId: string) => Promise<string>;
}
```

### BriefingProvider — 朝ブリーフィングセクション
```typescript
interface BriefingProvider {
  order: number;       // 表示順序（小さいほど先）
  roles?: string[];    // 対象ロール（省略で全員）
  provide: (supabase, user, today) => Promise<string | null>;
  topActions?: (supabase, user, today) => Promise<string[]>;
}
```

## 3. レジストリ (`_registry.ts`)

シングルトンパターン。`router.ts`, `ai-agent.ts`, `patterns.ts` がここから情報取得。

### 主要メソッド

| メソッド | 呼び出し元 | 用途 |
|---------|-----------|------|
| `getKeywordRoutes()` | router.ts | 全スキルのキーワードルートを連結 |
| `getStateRoutes()` | router.ts | 全スキルの会話状態ハンドラーをマージ |
| `getFastIntents()` | router.ts | 高速intent判定パターンを連結 |
| `getIntentDescriptions()` | router.ts | AIプロンプト用カテゴリ説明 |
| `getBreakKeywords()` | router.ts | 会話状態脱出キーワード |
| `getAgentToolDeclarations()` | ai-agent.ts | Gemini Function Calling用ツール宣言 |
| `getAgentToolExecutors()` | ai-agent.ts | ツール実行関数のマップ |
| `getBriefingProviders()` | patterns.ts | ブリーフィング提供者をorder順に取得 |

## 4. スキル登録 (`index.ts`)

```typescript
import { skillRegistry } from './_registry';
import { reportSkill } from './report.skill';
// ... 他のスキル

// 登録順 = キーワードルートの優先順位（具体的 → 汎用）
skillRegistry.register(reportSkill);
skillRegistry.register(taskSkill);
// ...
```

**⚠ 重要**: 
- 静的importのみ（Vercel Serverlessでdynamic import不可）
- 登録順 = ルートの優先順位。具体的なパターンのスキルを先に登録すること

## 5. 新しいスキルを追加する手順

### Step 1: ハンドラーを作成（または既存のものを利用）
```typescript
// lib/handlers/myfeature.ts
export async function handleMyFeature(
  user: any, text: string, replyToken: string,
  supabase: any, token: string, geminiKey: string
): Promise<void> {
  // 実装
}
```

### Step 2: スキルファイルを作成
```typescript
// lib/skills/myfeature.skill.ts
import { defineSkill } from './_define';
import { SchemaType } from '@google/generative-ai';
import { handleMyFeature } from '../handlers/myfeature';

export const myFeatureSkill = defineSkill({
  id: 'myfeature',
  name: 'My Feature',

  intents: ['myfeature'],

  routes: [
    { pattern: /キーワード/, intent: 'myfeature', handler: handleMyFeature },
  ],

  fastIntents: [
    { pattern: /キーワード/, intent: 'myfeature' },
  ],

  intentDescriptions: {
    myfeature: 'この機能の説明（AI判定プロンプト用）',
  },

  breakKeywords: ['キーワード'],

  // 任意: AI Agentツール
  agentTools: [{
    name: 'get_myfeature_data',
    description: 'ツールの説明',
    parameters: {
      type: SchemaType.OBJECT,
      properties: { /* ... */ },
    },
    execute: async (args, supabase, userId) => {
      // DB検索して結果を文字列で返す
      return 'result';
    },
  }],

  // 任意: 朝ブリーフィング
  briefing: {
    order: 50, // 表示順
    provide: async (supabase, user, today) => {
      return '📋 今日のMyFeature情報: ...';
    },
  },
});
```

### Step 3: index.ts に登録
```typescript
// lib/skills/index.ts
import { myFeatureSkill } from './myfeature.skill';
skillRegistry.register(myFeatureSkill);
```

### Step 4: types.ts にintent追加（必要な場合）
```typescript
// lib/core/types.ts の IntentType に追加
export type IntentType = /* ... */ | 'myfeature';
```

### Step 5: 動作確認
- LINE Botにキーワードを送信してルーティングを確認
- AI判定が正しく動作するかテスト

## 6. 既存スキルの構造パターン

### ミニマルスキル（sales.skill.ts — 35行）
- routes + fastIntents + intentDescriptions + breakKeywords のみ
- agentTools, briefing, states なし

### 標準スキル（task.skill.ts — 72行）
- routes + fastIntents + intentDescriptions + breakKeywords + agentTools

### フルスキル（invoice.skill.ts — 175行）
- routes + fastIntents + intentDescriptions + breakKeywords + agentTools(2個) + briefing(provide + topActions)

### 状態付きスキル（expense.skill.ts — 122行）
- routes + states(2状態) + fastIntents + intentDescriptions + breakKeywords + agentTools

## 7. スキル間のintent重複を避けるルール

1. intent名はスキルIDをプレフィックスにする（例: `invoice_search`, `invoice_summary`）
2. `general` intentはどのスキルにも属さない（router.tsのフォールバック）
3. 同じintentを複数スキルに持たせない

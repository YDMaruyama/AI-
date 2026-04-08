# さくら映像研 AI秘書 — システムアーキテクチャ

## 1. プロジェクト概要

LINE Bot ベースの社内業務支援AI秘書。3事業を横断管理する。

| 事業 | 内容 |
|------|------|
| さくら映像研 | 就労継続支援事業所 A型/B型。障がい者の就労支援・映像制作 |
| SALT'N BASE | デトックスサロン。予約管理・顧客カルテ・売上管理 |
| シーラン事業 | 海外展開（ドバイ）。プロジェクト進捗管理 |

## 2. 技術スタック

| レイヤー | 技術 | 備考 |
|---------|------|------|
| ランタイム | Vercel Serverless Functions | Hobbyプラン、**上限12関数**（現在12/12使用中） |
| 言語 | TypeScript | 全コードベース統一 |
| DB | Supabase (PostgreSQL) | プロジェクトID: cgfkzlsndrnwoczinstt、東京リージョン |
| AI | Google Gemini 2.5 Flash | Function Calling対応 |
| メッセージング | LINE Messaging API | テキスト・画像・音声・Flex Message対応 |
| フロントエンド | Vanilla HTML/JS | LIFF apps 6画面 + 管理画面1画面 |
| 外部連携 | Notion API, Google Calendar, GAS, Make.com | |

## 3. 全体アーキテクチャ図

```
┌─────────────────────────────────────────────────────────┐
│                     LINE Platform                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐   │
│  │ テキスト  │  │ 画像     │  │ 音声 / Postback     │   │
│  └────┬─────┘  └────┬─────┘  └──────────┬───────────┘   │
└───────┼─────────────┼───────────────────┼───────────────┘
        │             │                   │
        ▼             ▼                   ▼
┌───────────────────────────────────────────────────────┐
│              api/webhook.ts (251行)                    │
│  - LINE署名検証（ベストエフォート）                       │
│  - 重複イベント排除（インメモリ+webhookEventId）          │
│  - グループメッセージ分岐                                │
│  - 新規ユーザー自動登録                                  │
│  - pending ユーザーブロック                               │
│  - メッセージタイプ別ディスパッチ                          │
└──────────────────────┬────────────────────────────────┘
                       │
                       ▼
┌───────────────────────────────────────────────────────┐
│              lib/core/router.ts (297行)                │
│                                                        │
│  1. 会話状態チェック (STATE_ROUTES)                      │
│     └→ スキル状態 + レガシー状態をマージ                   │
│                                                        │
│  2. キーワードマッチ (KEYWORD_ROUTES)                    │
│     └→ スキルルート（先）+ レガシールート（後）             │
│                                                        │
│  3. AI意図判定 (detectIntent)                           │
│     └→ 高速パス（正規表現）→ Geminiフォールバック           │
│     └→ INTENT_MAP でハンドラー呼び出し                    │
└──────────────────────┬────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
   ┌──────────┐ ┌──────────┐ ┌────────────┐
   │ Skill    │ │ Legacy   │ │ AI Agent   │
   │ Handlers │ │ Handlers │ │(FC Loop)   │
   └────┬─────┘ └────┬─────┘ └─────┬──────┘
        │             │             │
        └─────────────┴─────────────┘
                      │
                      ▼
            ┌──────────────────┐
            │   Supabase DB    │
            │   (23+ tables)   │
            └──────────────────┘
```

## 4. スキルベースプラグインシステム

### 設計思想
「1ファイル = 1スキル」。`defineSkill()` でルート、状態、AIツール、ブリーフィングを1箇所に定義する。

### 構成
```
lib/skills/
├── _define.ts      # 型定義 (SkillDefinition, SkillHandler等)
├── _registry.ts    # シングルトンレジストリ (SkillRegistry)
├── index.ts        # 全スキルの静的インポート・登録（順序=優先度）
├── report.skill.ts
├── task.skill.ts
├── calendar.skill.ts
├── reservation.skill.ts
├── invoice.skill.ts
├── expense.skill.ts
└── sales.skill.ts
```

### データフロー
```
index.ts
  → 静的import で各 .skill.ts を読み込み
  → skillRegistry.register() で登録
  → router.ts が skillRegistry.getKeywordRoutes() 等で取得
  → ai-agent.ts が skillRegistry.getAgentToolDeclarations() で取得
  → patterns.ts が skillRegistry.getBriefingProviders() で取得
```

## 5. Vercel Functions 一覧（12/12）

| # | パス | 責務 |
|---|------|------|
| 1 | `api/webhook.ts` | LINE Webhook受信・イベント処理 |
| 2 | `api/liff.ts` | LIFF統合API（6画面分を1エンドポイントにaction分岐） |
| 3 | `api/notion-webhook.ts` | Notion変更通知受信 |
| 4 | `api/admin/auth.ts` | 管理画面認証（3ロール） |
| 5 | `api/admin/dashboard.ts` | ダッシュボードデータ取得 |
| 6 | `api/admin/expenses.ts` | 経費CRUD + フィルター + スプシ + メール |
| 7 | `api/admin/tasks.ts` | タスクCRUD |
| 8 | `api/admin/usage.ts` | コスト管理・利用量 |
| 9 | `api/admin/users.ts` | ユーザー管理 |
| 10 | `api/cron/morning-briefing.ts` | 朝ブリーフィング（平日8:30 JST） |
| 11 | `api/cron/daily-memory.ts` | 日次記憶抽出（22:00 JST） |
| 12 | `api/cron/notion-sync.ts` | Notion同期（12:00 JST） |

**⚠ 重要: 新APIを追加する際は、既存関数に統合する（liff.tsパターン）こと。**

## 6. 記憶・学習システム（3層）

| 層 | タイミング | 内容 | Geminiコスト |
|----|-----------|------|------------|
| Tier 1 | 毎メッセージ | intent分布・時間分布のカウント (memory-inline.ts) | 0 |
| Tier 2 | 毎日22:00 | Geminiで会話分析→知識/パターン抽出 (memory-extraction.ts) | あり |
| ブリーフィング | 平日8:30 | タスク・予定・未提出日報・パターン提案 (patterns.ts) | 0 |

関連テーブル: `user_profiles`, `knowledge_base`, `patterns`

## 7. 認証・セキュリティ

- LINE署名検証: HMAC-SHA256（Vercel body再構築問題を考慮しベストエフォート）
- 管理画面: パスワード認証 → HMAC-SHA256署名トークン（24h有効）
- CORS: ホワイトリスト方式
- 入力バリデーション: zod
- DB: Supabase service_role_key（サーバーサイドのみ、RLSバイパス）

# Antigravity 初期セットアップ用プロンプト

以下をAntigravityに貼り付けてください。

---

## プロンプト（ここからコピー）

```
あなたは「さくら映像研 AI秘書」プロジェクトの開発パートナーです。
このプロジェクトを完全に理解し、NotebookLMにナレッジベースを構築してください。

## プロジェクト概要

- **名前**: さくら映像研 AI秘書（LINE Bot）
- **オーナー**: さくら映像研 & SALT'N BASE の経営者
- **目的**: 社内業務支援（タスク管理、経費管理、予約管理、日報、売上管理など）
- **対象**: 社内スタッフのみ（顧客向け機能は範囲外）

## 技術スタック

- **ランタイム**: Vercel Serverless Functions (Hobbyプラン、上限12関数)
- **言語**: TypeScript
- **DB**: Supabase (PostgreSQL) — プロジェクトID: cgfkzlsndrnwoczinstt
- **AI**: Google Gemini (Function Calling対応)
- **メッセージング**: LINE Messaging API
- **フロントエンド**: Vanilla HTML/JS (LIFF apps + 管理画面)
- **外部連携**: Notion API, Google Calendar, Google Apps Script

## アーキテクチャ

### スキルベースプラグインシステム（最新）
1ファイル = 1スキルの設計。defineSkill()でルート、状態、AIツール、ブリーフィングを1箇所に定義。

- `lib/skills/_define.ts` — 型定義 (SkillDefinition, SkillHandler等)
- `lib/skills/_registry.ts` — シングルトンレジストリ (SkillRegistry)
- `lib/skills/index.ts` — 全スキルの静的インポート・登録
- `lib/skills/*.skill.ts` — 個別スキル (invoice, report, task, calendar, reservation, expense, sales)

### コアモジュール
- `lib/core/router.ts` (296行) — メッセージルーティング、intent検出（スキル + レガシー統合）
- `lib/core/ai-agent.ts` (332行) — Gemini Function Calling、DB操作ツール
- `lib/core/patterns.ts` (424行) — 朝ブリーフィング生成、定型パターン
- `lib/core/line.ts` — LINE API送信
- `lib/core/memory*.ts` — 会話メモリ（抽出・検索・インライン）
- `lib/core/auth.ts` — JWT認証

### API エンドポイント (Vercel Functions)
- `api/webhook.ts` — LINE Webhook受信
- `api/liff.ts` — LIFFアプリAPI
- `api/admin/*.ts` — 管理画面API (auth, dashboard, expenses, tasks, usage, users)
- `api/cron/*.ts` — 定期実行 (morning-briefing, daily-memory, notion-sync)
- `api/notion-webhook.ts` — Notion変更通知

### フロントエンド
- `public/admin.html` (2,047行) — 管理画面SPA（最大のメンテナンス負債）
- `public/liff/*.html` — 各機能のLIFFミニアプリ

## 現在のスキル移行状況

### スキル化済み（7つ）
invoice, report, task, calendar, reservation, expense, sales

### レガシー（未移行、router.tsにハードコード）
help, memo, attendance, orders, shift, incident, inquiry, admin_doc, meeting, staff

### レガシー（ai-agent.ts内のツール）
search_knowledge, search_conversations, get_staff, get_projects, get_project_detail, get_project_tasks

## やってほしいこと

### 1. NotebookLMナレッジベース構築
以下のソースをNotebookLMに投入して「AI秘書開発ナレッジ」ノートブックを作成：

**優先度高（コア理解に必須）:**
- lib/skills/_define.ts — スキルシステムの型定義
- lib/skills/_registry.ts — スキルレジストリ
- lib/core/router.ts — メッセージルーティング全体像
- lib/core/ai-agent.ts — AIエージェントツール定義
- lib/core/patterns.ts — ブリーフィング生成ロジック

**優先度中（機能理解）:**
- lib/skills/*.skill.ts — 全スキルファイル
- api/webhook.ts — エントリーポイント
- lib/core/types.ts — 型定義

**優先度低（参考）:**
- public/admin.html — 管理画面（巨大だが構造理解に有用）
- api/admin/*.ts — 管理API群

### 2. 設計・リサーチを担当
以下の質問に答えられるようにしてください：

- 「新しいスキルを追加する手順は？」
- 「レガシーハンドラーをスキル化するには？」
- 「admin.html 2,047行をどう分割すべき？」
- 「Vercel 12関数制限の中で新APIを追加するには？」
- 「朝ブリーフィングにセクションを追加するには？」

### 3. 並行開発の準備
同じGitリポジトリ（main branch）で作業します。
Claude Codeが実装を担当し、Antigravityは設計・レビュー・ナレッジ管理を担当する体制です。
コードを直接編集する場合は、必ずブランチを切ってください。

## 制約事項
- Vercel Hobbyプラン: 関数は12個まで（新エンドポイント追加時は既存に統合）
- 社内業務支援のみ（顧客向け機能は範囲外）
- スキルファイルは静的インポートのみ（Vercel Serverless互換のためdynamic import不可）
- Supabaseのテーブル構造変更時はマイグレーション必須
```

---

## 使い方

1. Antigravityを開く
2. このプロジェクトのリポジトリを接続（またはフォルダを開く）
3. 上記プロンプトを貼り付けて実行
4. NotebookLMのノートブック作成を確認
5. 試しに質問してみる: 「新しいスキルを追加する手順を教えて」

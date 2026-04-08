# APIエンドポイント詳細

## 1. api/webhook.ts — LINE Webhook受信（251行）

### 処理フロー
```
POST /api/webhook
  │
  ├─ GET → { status: 'ok' } (ヘルスチェック)
  ├─ LINE署名検証（ベストエフォート、ブロックしない）
  ├─ 重複イベント排除（インメモリMap + 5分TTL）
  │
  ├─ for each event:
  │   ├─ isRedelivery → スキップ
  │   ├─ webhookEventId 重複 → スキップ
  │   ├─ postback (share:) → handleSharePostback()
  │   ├─ group message → handleGroupMessage()
  │   │
  │   ├─ ユーザー検索 (line_user_id)
  │   │   ├─ 未登録 → 新規登録
  │   │   │   ├─ 最初のユーザー → owner ロール
  │   │   │   └─ 2人目以降 → pending ロール + 社長に通知
  │   │   └─ pending → 「承認待ち」メッセージ
  │   │
  │   ├─ 画像 → handleReceiptImage() (レシートOCR)
  │   ├─ 音声 → handleVoiceMessage() → detectIntent() → routeVoiceIntent()
  │   └─ テキスト → isCancel? → getConversationState() → routeMessage()
  │
  └─ 200 OK
```

### エラーハンドリング
テキスト処理でエラーが発生した場合、エラー種別に応じてユーザーフレンドリーなメッセージを返す：
- Gemini/AI系 → 「AI応答でエラー」
- DB系 → 「データベースエラー」
- ネットワーク系 → 「外部サービスに接続できません」

---

## 2. api/liff.ts — LIFF統合API（12,263バイト）

### 設計パターン
6種類のLIFFアプリ（経費・日報・タスク・予定・出欠・金庫）を1つのAPIエンドポイントに統合。
`action` パラメータで機能を分岐。

```
POST /api/liff
  body: { action: 'get_expenses', userId: '...', ... }
  
  switch(action) {
    case 'get_expenses': ...
    case 'add_expense': ...
    case 'get_reports': ...
    case 'add_report': ...
    // etc.
  }
```

**⚠ この統合パターンが Vercel 12関数制限への対処法。新APIは既存関数に統合すること。**

---

## 3. api/notion-webhook.ts — Notion変更通知（11,073バイト）

### 処理フロー
Make.comからのWebhook受信 → Notionページの変更を処理：
- 議事録のAI要約生成
- 議事録からタスク自動抽出
- 関連スタッフへの通知

---

## 4. api/admin/ — 管理画面API群

### api/admin/auth.ts（956バイト）
パスワード認証 → HMAC-SHA256署名トークン生成（24h有効）
3ロール: owner / manager / staff （パスワードはVercel環境変数で管理）

### api/admin/dashboard.ts（12,284バイト）
管理画面ダッシュボードのデータ取得:
- 今月の日報統計
- タスク進捗
- 経費サマリー
- 金庫残高
- 出欠状況
- カレンダーイベント

### api/admin/expenses.ts（7,869バイト）
経費の:
- CRUD（月別/カテゴリフィルター付き）
- インライン編集
- Google Sheets出力（GAS経由）
- Emailレポート送信（GAS経由）

### api/admin/tasks.ts（2,229バイト）
タスクのCRUD

### api/admin/usage.ts（5,019バイト）
コスト管理: Gemini / LINE / Make.com / Supabase / Vercel / GAS の利用量

### api/admin/users.ts（3,619バイト）
ユーザー管理:
- ロール変更（LINE通知付き）
- アクティブ/非アクティブ切り替え
- job_description 更新

### 共通ミドルウェア: lib/core/admin-middleware.ts
`withAdmin()` で認証チェック + CORS + エラーハンドリングを統一。

---

## 5. api/cron/ — Cron Jobs

### api/cron/morning-briefing.ts（3,207バイト）
```
スケジュール: 30 23 * * 0-4 (UTC) = 平日 08:30 JST
```
- 全アクティブユーザーに朝ブリーフィングをPush送信
- `buildMorningBriefing()` + 月曜は `buildWeeklyReport()` も追加

### api/cron/daily-memory.ts（2,848バイト）
```
スケジュール: 0 13 * * * (UTC) = 22:00 JST
```
- 各ユーザーの当日会話をGeminiで分析
- user_profiles, knowledge_base, patterns を更新

### api/cron/notion-sync.ts（16,714バイト）
```
スケジュール: 0 3 * * * (UTC) = 12:00 JST
```
- Notion APIからページ同期
- 変更検知 → AI要約 → タスク抽出

---

## 6. Vercel 12関数制限の中で新APIを追加する方法

### 方法1: 既存APIに統合（推奨）
```typescript
// api/liff.ts に新actionを追加
case 'new_feature':
  return handleNewFeature(body, supabase);
```

### 方法2: admin/dashboard.ts に統合
管理画面向け新機能は dashboard.ts に新しいアクション分岐を追加。

### 方法3: 関数のマージ
使用頻度の低い関数を他に統合して空き枠を作る。
候補: `api/admin/tasks.ts`(2KB小) を `dashboard.ts` に統合。

### 絶対にやってはいけないこと
- 新しい `api/*.ts` ファイルを追加する（13個目の関数 = デプロイ失敗）
- `api/admin/` に新ファイルを追加する（関数数カウントに含まれる）

---

## 7. フロントエンド

### public/admin.html（2,047行 = 108,659バイト）
管理画面SPA。**最大のメンテナンス負債。**

9タブ構成:
1. スタッフ管理
2. 日報一覧
3. タスク管理
4. 経費管理（月切替 + フィルター + チャート + インライン編集）
5. 案件管理
6. カレンダー
7. 出欠管理
8. 金庫（残高・履歴・スプシ/メール）
9. コスト管理

### public/liff/*.html（6画面）
| 画面 | ファイル | サイズ |
|------|---------|-------|
| 日報入力 | report.html | 7,178B |
| 経費入力 | expense.html | 12,039B |
| 出欠登録 | attendance.html | 11,115B |
| カレンダー | calendar.html | 11,152B |
| タスク管理 | task.html | 12,652B |
| 金庫入出金 | cashbox.html | 13,102B |

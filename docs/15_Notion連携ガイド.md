# 15. Notion連携ガイド

## 概要

Notionの議事録・会議ノートを自動でAI秘書に連携し、以下を自動実行する仕組み。

- Geminiで議事録を**要約**
- **決定事項**を抽出
- **アクションアイテム**をタスクDBに自動登録
- 社長に**LINE通知**

---

## システム構成図

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────────┐
│   Notion     │     │  Make.com    │     │  AI秘書（Vercel）     │
│              │     │              │     │                      │
│ 議事録DB     │────→│ Watch Objects │────→│ /api/notion-webhook  │
│ に新規ページ  │     │ (15分ごと)    │     │                      │
│ が作成される  │     │              │     │ ① Notion APIで内容取得│
└─────────────┘     └──────────────┘     │ ② Geminiで要約       │
                                         │ ③ タスク自動登録      │
                                         │ ④ LINE通知           │
                                         └──────────────────────┘
```

---

## 必要なもの

| 項目 | 値 |
|------|-----|
| Notion Internal Integration | `ntn_m667...`（AI秘書） |
| Make.com アカウント | 無料プラン |
| Make.com Notion接続 | OAuth接続（Connection ID: 7648652） |
| AI秘書 Webhook URL | `https://ai-secretary-line.vercel.app/api/notion-webhook` |
| Gemini API | 議事録の要約・判定に使用 |

---

## セットアップ手順

### Step 1: Notion Internal Integration の作成

1. https://www.notion.so/my-integrations にアクセス
2. 「新しいインテグレーション」をクリック
3. 名前: `AI秘書`
4. ワークスペースを選択 → 送信
5. **Internal Integration Secret**（`ntn_` で始まる）をコピー
6. Vercelの環境変数 `NOTION_API_KEY` に設定

### Step 2: Notion DBにインテグレーションを接続

**重要: この手順を忘れると連携が動きません**

1. Notionで議事録が入っている**データベース**を開く
   - 例: 「ドバイ議事録DB」「Meetings」など
2. 右上の **「…」** メニュー → **「コネクト」**
3. **「AI秘書」** を選択して追加
4. 子ページへのアクセスを許可

```
⚠️ Notion APIの制約:
  インテグレーションを接続したページ（とその子ページ）にしかアクセスできません。
  新しいDBを作った場合は、都度接続が必要です。
```

### Step 3: Make.com シナリオの設定

#### シナリオ構成
```
[Notion: Watch Objects] → [HTTP: Make a request]
  15分ごとにポーリング      AI秘書Webhookに送信
```

#### Module 1: Notion Watch Objects
| 設定 | 値 |
|------|-----|
| Connection | My Notion Public connection |
| Choose Type | Page |
| Limit | 5 |

#### Module 2: HTTP Make a request
| 設定 | 値 |
|------|-----|
| URL | `https://ai-secretary-line.vercel.app/api/notion-webhook` |
| Method | POST |
| Body content type | application/json |
| Body input method | JSON string |

**Body content:**
```json
{
  "entity": {
    "id": "{{1.id}}",
    "type": "page"
  },
  "type": "page.created",
  "source": "make"
}
```

`{{1.id}}` は Module 1（Notion Watch Objects）のページIDを参照。

#### スケジュール
- Every 15 minutes（無料プランの最小間隔）

### Step 4: シナリオを有効化

Make.comのシナリオ画面で左下の **ON** トグルをクリック。

---

## Webhook の処理フロー

`/api/notion-webhook` が受信すると以下の順で処理:

```
1. リクエストからページIDを取得
      ↓
2. Notion APIでページ情報を取得
   GET https://api.notion.com/v1/pages/{pageId}
      ↓
3. ページ本文（ブロック）を取得
   GET https://api.notion.com/v1/blocks/{pageId}/children
      ↓
4. ブロックが空の場合、プロパティからデータを取得
   （要約、決定事項、アクション等のテキストフィールド）
      ↓
5. Gemini AIで「会議の議事録かどうか」を判定
   → 会議でなければスキップ（何もしない）
      ↓
6. 会議と判定された場合:
   a. Geminiで要約 + アクションアイテム抽出
   b. アクションアイテムをtasksテーブルに登録
   c. 議事録をconversation_messagesに保存
   d. 社長にLINE Push通知
```

---

## 会議判定のロジック

Gemini AIに以下のプロンプトを送信:

```
以下のテキストは会議の議事録・ミーティングノートですか？
「yes」か「no」のみ答えてください。

タイトル: {ページタイトル}
内容（先頭500文字）: {ページ内容}
```

- `yes` → 議事録として処理
- `no` → スキップ（通常のNotionページ作成は無視）

---

## データの取得方法

### パターン1: ページ本文にデータがある場合
Notion AIのミーティングノートなど、ページ本文に議事録が記載されている場合。
→ ブロックAPI（`/blocks/{id}/children`）でテキストを取得

### パターン2: プロパティにデータがある場合
議事録DBなど、プロパティ（要約、決定事項、アクション等）にデータがある場合。
→ ページAPI（`/pages/{id}`）のpropertiesからテキストを抽出

対応しているプロパティタイプ:
- `rich_text` → テキストを結合
- `select` → 選択肢の名前
- `multi_select` → カンマ区切り
- `status` → ステータス名
- `date` → 日付文字列
- `url` → URLテキスト

---

## LINE通知の内容

社長に送信される通知の例:

```
📝 新しい議事録

📋 ドバイ販路：Sephora想定の提携条件整理
📅 2026-03-30

■ 要約
Sephora想定のドバイ販路提携に向け、ブランド提供物と
体制のギャップを整理。次回は提案資料の骨子を固める。

■ 決定事項
・提案の軸は「塩由来・温泉文脈」「品質証明」「継続供給」
・初回は代表SKUに絞り、反応を見て拡張する

■ アクションアイテム（3件→タスク登録済）
⬜ 代表SKU候補を3つに絞り、訴求ポイントを1枚にまとめる
⬜ 想定卸条件（MOQ/リードタイム/価格）をドラフトする
⬜ 証明書・試験データの提出可否を確認する

🔗 https://notion.so/15e599fa...
```

---

## 手動での議事録入力（LINE）

Make.com連携とは別に、LINEから直接議事録を入力することもできます。

### 方法1: 議事録として保存
```
議事録: グランピングの打ち合わせ
16名で1泊2日、8月予定。
見積もり送付を依頼。
次回は4月に日程確定。
```
→ AIが要約 + アクションアイテム抽出 + タスク自動登録

### 方法2: 過去の議事録を検索
```
最近の会議内容教えて
```
→ 保存済みの議事録から回答

---

## トラブルシューティング

### 「Cannot access page」エラー
**原因**: NotionのDBにAI秘書インテグレーションが接続されていない
**対処**: Notionで対象DB → 「…」→「コネクト」→「AI秘書」を追加

### 「Content too short」エラー
**原因**: ページ本文もプロパティもデータが入っていない
**対処**: ページにデータを入力してから再実行

### 「Not a meeting note」スキップ
**原因**: AIが「会議の議事録ではない」と判定した
**対処**: 正常動作。通常のページ作成は無視される仕様

### Make.comで「No bundles」
**原因**: 前回のチェック以降に新しいページが作成されていない
**対処**: 正常動作。新しいページが作成されれば検知される

### Watch Eventsが動かない
**原因**: Notion Webhook APIの権限問題
**対処**: Watch Objects（ポーリング方式）を使用する（現在の方式）

---

## 関連ファイル

| ファイル | 役割 |
|---------|------|
| `api/notion-webhook.ts` | Webhook受信 → Notion API → Gemini要約 → タスク化 → LINE通知 |
| `lib/handlers/notion.ts` | LINE「会議」ハンドラー（手動検索 + 議事録入力） |
| `api/cron/notion-sync.ts` | 定期同期（現在未使用、将来用） |

---

## 今後の拡張案

| 拡張 | 内容 |
|------|------|
| Meetings DB接続 | Notion AIのミーティングノートDBに接続すれば、会議終了後に自動連携 |
| 複数DB対応 | 複数の議事録DBを監視対象に追加 |
| 双方向同期 | AI秘書で作成したタスクをNotionにも反映 |
| 音声文字起こし | LINEの音声メッセージ → Gemini文字起こし → 議事録化 |

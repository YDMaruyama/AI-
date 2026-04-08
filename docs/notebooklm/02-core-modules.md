# コアモジュール詳細解説

## 1. router.ts — メッセージルーティング（297行）

### 役割
ユーザーからの全テキストメッセージを適切なハンドラーに振り分ける。
スキルレジストリとレガシーハンドラーの統合ルーター。

### 3層ルーティング

```
ユーザー入力テキスト
    │
    ▼
[Layer 1] 会話状態チェック (STATE_ROUTES)
    │  スキル状態 + レガシー状態をマージ
    │  例: writing_report → continueReport()
    │  例: confirming_receipt → handleReceiptConfirmation()
    │  ⚠ breakPattern にマッチ → 状態リセット → Layer 2へ
    │
    ▼
[Layer 2] キーワードマッチ (KEYWORD_ROUTES)
    │  スキルルート（先、優先）+ レガシールート（後）
    │  正規表現で順次走査、最初にマッチしたものを実行
    │  例: /日報/ → startReport()
    │  例: /予約/ → showReservations()
    │
    ▼
[Layer 3] AI意図判定 (detectIntent → INTENT_MAP)
    │  ① スキルレジストリの高速パス（正規表現）
    │  ② レガシー高速パス（正規表現）
    │  ③ Gemini AIフォールバック（プロンプト生成）
    │  → intent名でINTENT_MAPからハンドラー取得
    │
    ▼
ハンドラー実行
```

### 重要な設計判断

1. **スキルルートが先**: `KEYWORD_ROUTES = [...SKILL_ROUTES, ...LEGACY_KEYWORD_ROUTES]`
2. **breakPattern**: 会話状態中でも「日報」「タスク」等のキーワードで状態脱出可能
3. **expense特殊処理**: intent='expense' の場合、金額有無でハンドラー分岐（ワンショットvs段階入力）
4. **fire-and-forget ナレッジ保存**: 社長の「決まった」「ルール」等の発言を自動的にknowledge_baseに保存

### detectIntent の3段階処理
```
1. skillRegistry.getFastIntents()  — スキルの高速パス正規表現
2. レガシー高速パス正規表現      — /出欠|出席/, /案件|受注/ 等
3. Gemini AI判定                 — スキル説明を動的注入したプロンプト
```

### routeVoiceIntent
音声メッセージ専用のルーター。テキスト版とは異なり、linePush() を使用（replyToken不要）。
expense系は音声でもワンショット経費登録が可能。

---

## 2. ai-agent.ts — AIエージェント + Function Calling（333行）

### 役割
Gemini Function Callingを使い、AIがDB検索ツールを自分で呼び出して質問に回答する。

### ツール構成
```
DB_TOOLS = [...SKILL_TOOLS, ...LEGACY_DB_TOOLS]
          ↑                 ↑
   スキルレジストリから      まだスキル化されていない
   動的取得                  ツール6個
```

### スキルレジストリからのツール（動的取得）
各スキルの `agentTools` から自動収集:
- `get_documents` / `get_document_summary` (invoice)
- `get_daily_reports` (report)
- `get_tasks` (task)
- `get_calendar` (calendar)
- `get_reservations` / `get_salon_menus` / `get_salon_customers` (reservation)
- `get_expenses` (expense)

### レガシーツール（switch文内、a-agent.ts直書き）
- `search_knowledge` — knowledge_baseテーブル検索
- `search_conversations` — 会話履歴検索
- `get_staff` — スタッフ一覧取得
- `get_projects` — プロジェクト一覧取得
- `get_project_detail` — プロジェクト詳細取得
- `get_project_tasks` — プロジェクトタスク取得

### Function Callingループ
```
1. ユーザーメッセージ送信
2. Geminiがツール呼び出しを返す
3. ツール実行（executeTool → スキルレジストリ優先 → レガシーswitch）
4. ツール結果をGeminiに返す
5. 2-4を最大3回繰り返し
6. 最終テキスト回答を返す
```

### 会話コンテキスト
直近6件の会話履歴を取得してGeminiに渡す（各300文字に切り詰め、トークン節約）。

---

## 3. patterns.ts — ブリーフィング生成（425行）

### 役割
朝のブリーフィングメッセージを組み立て、パターンベースの先回り提案を行う。

### buildMorningBriefing() のセクション構成

| 順序 | セクション | 対象 | 内容 |
|------|----------|------|------|
| 1 | 挨拶 | 全員 | 「🌅 おはようございます、{名前}さん！」 |
| 2 | タスク | 全員(owner=全件, staff=自分) | 期限切れ・今日期限をtopActionsに追加 |
| 3 | 今日の予定 | 全員 | calendar_eventsから取得 |
| 4 | サロン予約 | 全員 | reservationsから取得 |
| 5 | 未提出日報 | owner/manager | 昨日日報を出していないスタッフ名 |
| 6 | 経費異常 | owner/manager | 高額(5万+), 前月比1.5倍超, 同日同店舗重複 |
| 7 | スキルブリーフィング | 各スキル設定による | skillRegistry.getBriefingProviders()から動的取得 |
| 8 | 行政書類期限 | owner | 30日以内の期限、提出済みはスキップ |
| 9 | KPIアラート | owner | 3日以上日報未提出、3日間予約ゼロ |
| 10 | パターン提案 | 全員 | patternsテーブルから条件マッチ |

### 朝ブリーフィングにセクションを追加する方法

1. **スキル経由（推奨）**: スキルの `briefing` プロパティで `provide()` と `topActions()` を定義
2. **patterns.ts直接編集**: `buildMorningBriefing()` 内に新セクションを追加

### 経費異常検出 (detectExpenseAnomalies)
- 1件5万円以上の高額経費
- 今月合計が先月の1.5倍以上
- 同一店舗で同日に複数回

### パターン自己強化 (recordPatternOutcome)
- hit/miss カウント追跡
- confidence = hit / (hit + miss)
- 10回以上で精度0.3以下 → 自動停止

---

## 4. state.ts — 会話状態管理（56行）

### 役割
マルチステップ入力（日報作成、経費入力、事故報告等）の状態を管理。

### 状態一覧
| state名 | 表示名 | スキル/レガシー |
|---------|--------|--------------|
| idle | — | デフォルト |
| writing_report | 日報作成 | report.skill |
| confirming_report | 日報確認 | report.skill |
| writing_expense | 経費入力 | expense.skill |
| confirming_receipt | レシート確認 | expense.skill |
| writing_incident | 事故報告 | レガシー |

### タイムアウト
- **20分経過**: 「あと{N}分でリセットされます」警告
- **30分経過**: idle にリセット + report_drafts 削除

### グローバルキャンセル
`キャンセル|やめる|やめ|戻る|戻して|中止|リセット` で即座にidleへ。

---

## 5. personality.ts — AI人格定義（49行）

### SHARED_PERSONALITY
- 3事業（さくら映像研、SALT'N BASE、シーラン）の横断管理AI
- 簡潔・的確な話し方。数字とファクト重視
- 絵文字は最小限（見出し程度）
- 医療・法律の断定は禁止

### CONTEXT_TEMPLATE
ユーザーのロールに応じてコンテキストを切り替え:
- 社長 → 経営判断に必要な情報優先
- 管理者 → 業務管理情報
- スタッフ → 自分の業務のみ

---

## 6. config.ts — 設定・定数（70行）

### 環境変数管理
- `requireEnv()`: 必須（未設定で起動エラー）
- `optionalEnv()`: 任意（フォールバック付き）
- `requireEnvOnVercel()`: 本番のみ必須（ローカルはデフォルト許可）

### 主要定数
- `GEMINI_MODEL`: 'gemini-2.5-flash'
- `LINE_MESSAGE_MAX_LENGTH`: 5000
- `CONVERSATION_TIMEOUT_MINUTES`: 30
- `JST_OFFSET_MS`: 9時間のミリ秒

---

## 7. memory系モジュール

### memory-inline.ts — 毎メッセージのリアルタイム追跡
- `trackInteraction()`: intent分布・時間帯分布をカウント（Geminiコスト0）
- `maybeAddKnowledge()`: 社長の重要発言をknowledge_baseに自動保存

### memory-extraction.ts — 日次バッチ分析
- Geminiで1日の会話を分析
- 個人の好み・パターンをuser_profilesに保存
- 組織知識をknowledge_baseに保存
- 行動パターンをpatternsに保存

### memory-retrieval.ts — コンテキスト検索
- ユーザープロフィール取得
- 関連knowledge検索
- トークン予算管理（プロフィール400 + 知識500 + 履歴800）

---

## 8. line.ts — LINE API送信（5,116バイト）

### 主要関数
- `lineReply()`: replyTokenで即座に返信
- `linePush()`: userIdで後から送信
- `linePushRaw()`: Flex Message等のリッチメッセージ送信
- `lineReplyWithQuickReply()`: Quick Replyボタン付き返信
- `verifyLineSignature()`: 署名検証

# AI秘書 開発進行状況
**最終更新: 2026-04-02 00:00 JST**

## プロジェクト概要
さくら映像研（就労継続支援事業所）+ SALT'NBASE.のAI秘書システム。
LINE公式アカウント経由で、AIがスタッフの業務をアシストし、社長が現場状況を即座に把握できる。
**使うほど賢くなる記憶・学習システム搭載。**

## 統計
- TypeScriptファイル: 55ファイル / 6,543行
- HTML（LIFF+管理画面）: 7ファイル
- 設計書: 16ファイル / 約25,000行
- Gitコミット: 54回
- Supabaseテーブル: 23+（user_profiles, knowledge_base, patterns追加）
- LINE Bot機能: 25+
- LIFFアプリ: 6画面
- Vercel Cron: 2ジョブ（朝ブリーフィング、日次記憶抽出）

---

## 🆕 2026-04-01 S+リファクタリング

### セキュリティ強化
- LINE署名検証: raw body + timingSafeEqual（ブロッキング）
- 管理画面認証: HMAC-SHA256署名トークン（24h有効期限付き）
- CORS: ワイルドカード → ホワイトリスト方式
- LIFF GET: 全エンドポイント認証必須化
- 入力バリデーション: zod導入（経費・金庫・売上の金額チェック等）

### アーキテクチャ改善
- 宣言的ルーティングテーブル（router.ts 413→250行）
- withAdmin()ミドルウェアで管理API統一
- 共有ユーティリティ10個新設（types, config, validation, gemini-utils, supabase, gas, logger, cors, auth, admin-middleware）
- デッドコード削除（intent.ts, orchestrator.ts）
- Geminiクライアントシングルトン化
- LINE APIレスポンスチェック追加

### 成長する記憶システム
| 層 | タイミング | 内容 |
|----|-----------|------|
| Tier 1 | 毎メッセージ | intent分布・時間分布をカウント（Geminiコスト0） |
| Tier 2 | 毎日22:00 | Geminiで会話分析→知識・パターン抽出 |
| 朝ブリーフィング | 平日8:30 | タスク・予定・未提出日報・パターン提案をPush |

- DBテーブル: user_profiles（個人記憶）、knowledge_base（組織知識）、patterns（行動パターン）
- トークン予算管理: プロフィール400+知識500+履歴800 = 常に一定
- パターン自己強化: hit/miss追跡、精度0.3以下で自動停止

### スタッフ承認UI改善
- 承認モーダル（ロール選択 + 業務メモ入力）
- users.job_descriptionカラム追加
- 承認LINE通知に業務内容表示

### フィードバック + 共有システム
- Flex Message共有ボタン（社長に共有 / 管理者に共有）
- 日報・見学: 本人のみフィードバック → 共有ボタンで選択
- 事故報告: 社長自動通知（安全上維持）+ 共有ボタン
- Postbackハンドラーで共有先にPush送信

---

## ✅ 完成済み

### インフラ
| サービス | URL / ID |
|---------|----------|
| LINE Bot | Ai秘書（@037ygaoh）Channel ID: 2009645496 |
| Vercel | https://ai-secretary-line.vercel.app |
| 管理画面 | https://ai-secretary-line.vercel.app/admin |
| Supabase | cgfkzlsndrnwoczinstt（東京リージョン） |
| GAS | AKfycbz6G...（カレンダー・スプシ・メール） |
| Make.com | シナリオ4574617（Notion→AI秘書、毎日17:00） |

### LINE Bot 全機能（23+）
| # | 機能 | 方式 |
|---|------|------|
| 1 | 日報入力 | LIFF + テキスト + スマート入力 |
| 2 | タスク自動抽出 | 日報提出時にGemini抽出 |
| 3 | タスク管理 | LIFF + テキスト |
| 4 | 日報検索 | テキスト（社長/管理者のみ） |
| 5 | 出欠登録 | LIFF + テキスト |
| 6 | 案件管理 | テキスト |
| 7 | シフト管理 | テキスト |
| 8 | Googleカレンダー | LIFF + テキスト + GAS連携 |
| 9 | 予定追加 | LIFF + テキスト + GAS |
| 10 | 事故・ヒヤリハット報告 | テキスト + スマート入力 |
| 11 | 見学・問い合わせ | テキスト |
| 12 | 行政書類リマインド | テキスト |
| 13 | スタッフ管理 | テキスト（社長のみ） |
| 14 | レシートOCR | 画像送信 → Gemini読み取り |
| 15 | 経費入力 | LIFF + テキスト + スマート入力 |
| 16 | 経費サマリー | テキスト |
| 17 | 経費スプシ出力 | GAS → Google Sheets |
| 18 | 経費メール送信 | GAS → Gmail（HTMLメール） |
| 19 | 経費修正・削除 | テキスト（自然文対応） |
| 20 | 金庫管理 | LIFF + テキスト |
| 21 | 金庫スプシ+メール | GAS |
| 22 | 議事録入力・検索 | テキスト |
| 23 | AI汎用応答 | DB参照 + 記憶 + 6専門エージェント |
| 24 | 音声メッセージ | Gemini文字起こし → 自動処理 |
| 25 | AI意図判定 | 正規表現高速パス + Geminiフォールバック |

### LIFFアプリ（6画面）
| 画面 | LIFF ID | URL |
|------|---------|-----|
| 日報入力 | 9uoUdsTL | /liff/report |
| 経費入力 | 9iyGZLqw | /liff/expense |
| タスク管理 | eNouqokE | /liff/task |
| 予定管理 | XlQtMO0U | /liff/calendar |
| 出欠登録 | BzAkGY6I | /liff/attendance |
| 金庫入出金 | u8xVzajB | /liff/cashbox |

### リッチメニュー
```
┌────────┬────────┬────────┐
│ 日報   │ 経費   │ タスク  │ ← LIFF
├────────┼────────┼────────┤
│ 予定   │ 出欠   │ 金庫   │ ← LIFF×2 + テキスト
└────────┴────────┴────────┘
```

### アーキテクチャ
```
webhook.ts（140行）→ router.ts（ルーティング全体）
    ↓
state.ts（30分タイムアウト + グローバルキャンセル）
intent.ts（正規表現高速パス → Geminiフォールバック）
error.ts（統一エラーハンドリング + リトライ）
    ↓
handlers/（16モジュール）→ core/（personality + agents + memory）
    ↓
api/liff.ts（統合LIFF API、6画面分を1エンドポイント）
```

### 管理画面（9タブ）
- スタッフ管理（ロール別アクセス制御）
- 日報一覧
- タスク管理
- 経費管理（月切替 + フィルター + カテゴリチャート + インライン編集 + スプシ/メール）
- 案件管理
- カレンダー
- 出欠管理
- 金庫（残高・履歴・スプシ/メール）
- コスト管理（Gemini/LINE/Make/Supabase/Vercel/GAS使用量）

パスワード: Vercel環境変数 ADMIN_PASSWORD / MANAGER_PASSWORD / STAFF_PASSWORD で管理

### 外部連携
| 連携先 | 方式 |
|--------|------|
| Googleカレンダー | GAS（読み書き） |
| Gmail | GAS（HTMLメール + スプシリンク） |
| Google Sheets | GAS（経費・金庫の帳簿自動生成） |
| Notion | API + Make.com（議事録自動取得・要約・タスク化） |

---

## 🔑 認証情報

### Vercel環境変数
- LINE_CHANNEL_ACCESS_TOKEN, LINE_CHANNEL_SECRET
- GEMINI_API_KEY
- SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
- GAS_CALENDAR_URL
- NOTION_API_KEY: (Vercel環境変数で管理)
- ADMIN_PASSWORD: (Vercel環境変数で管理)

### LIFF ID
- 経費: 2009645462-9iyGZLqw
- 日報: 2009645462-9uoUdsTL
- 金庫: 2009645462-u8xVzajB
- 出欠: 2009645462-BzAkGY6I
- タスク: 2009645462-eNouqokE
- 予定: 2009645462-XlQtMO0U

### Make.com
- Organization: 6764375 / Team: 1950031
- Notion Connection: 7648652
- シナリオ（v2）: 4574617（毎日17:00）

### Google
- GAS実行: unszzmm2@gmail.com
- カレンダーID: salt.nbase@gmail.com
- メール送信先: salt.nbase@gmail.com
- GCP: ai-secretary-calendar-491808（番号: 865512822862）

---

## 📁 ファイル構成

```
ai-secretary/
├── api/
│   ├── webhook.ts              # LINE Webhook（140行、受信+認証のみ）
│   ├── liff.ts                 # 統合LIFF API（6画面分を1エンドポイント）
│   ├── notion-webhook.ts       # Notion議事録Webhook（Make.com連携）
│   └── admin/
│       ├── auth.ts             # 管理画面認証（3ロール）
│       ├── dashboard.ts        # ダッシュボード（金庫タブ含む）
│       ├── expenses.ts         # 経費API（フィルター・編集・スプシ・メール）
│       ├── tasks.ts            # タスクAPI
│       ├── usage.ts            # コスト管理API
│       └── users.ts            # ユーザー管理（ロール変更LINE通知付き）
├── lib/
│   ├── core/
│   │   ├── router.ts           # メッセージルーティング全体
│   │   ├── state.ts            # 状態管理（30分タイムアウト+キャンセル）
│   │   ├── intent.ts           # 高速intent判定（正規表現）
│   │   ├── error.ts            # 統一エラーハンドリング+リトライ
│   │   ├── line.ts             # LINE Reply/Push + 署名検証
│   │   ├── gemini.ts           # Gemini API
│   │   ├── personality.ts      # 共通人格
│   │   ├── agents.ts           # 6専門エージェント
│   │   ├── memory.ts           # 記憶モジュール
│   │   ├── utils.ts            # 日付・ロール名
│   │   ├── db.ts               # DB共通
│   │   └── orchestrator.ts     # 司令塔
│   └── handlers/
│       ├── report.ts           # 日報（スマート入力対応）
│       ├── search.ts, tasks.ts, attendance.ts, orders.ts, shift.ts
│       ├── calendar.ts         # カレンダー（GAS連携）
│       ├── incident.ts         # 事故報告（スマート入力対応）
│       ├── inquiry.ts, admin.ts, staff.ts
│       ├── expense.ts          # 経費（OCR・重複防止・修正・削除・スプシ・メール）
│       ├── cashbox.ts          # 金庫（アトミック残高・スプシ・メール）
│       ├── notion.ts           # 議事録
│       ├── voice.ts            # 音声文字起こし
│       └── ai.ts               # AI汎用応答（DB参照+記憶）
├── public/
│   ├── admin.html              # 管理ダッシュボード（9タブ）
│   └── liff/
│       ├── expense.html        # 経費LIFF
│       ├── report.html         # 日報LIFF
│       ├── task.html           # タスクLIFF
│       ├── calendar.html       # 予定LIFF
│       ├── attendance.html     # 出欠LIFF
│       └── cashbox.html        # 金庫LIFF
├── gas-project/                # GAS（カレンダー・スプシ・HTMLメール）
├── docs/                       # 設計書16ファイル
├── PROGRESS.md                 # ← このファイル
├── vercel.json, tsconfig.json, package.json
└── .env.local
```

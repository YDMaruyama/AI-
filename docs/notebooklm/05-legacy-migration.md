# レガシーハンドラーのスキル化移行ガイド

## 1. 現状のレガシー一覧

### router.ts にハードコードされたレガシールート（10個）

| # | intent | パターン | ハンドラー | 推定移行コスト |
|---|--------|---------|-----------|--------------|
| 1 | help | `/^ヘルプ$\|^help$\|^使い方$\|^できること/` | showHelp() | 低（30分） |
| 2 | memo | `/^メモとして保存$/` | saveMemo() | 低（30分） |
| 3 | attendance | `/出欠\|出席/` | showAttendance() | 中（1時間） |
| 4 | order | `/案件\|受注/` | showOrders() | 中（1時間） |
| 5 | shift | `/シフト/` | showShift() | 中（1時間） |
| 6 | incident | `/事故\|ヒヤリ/` | startIncident() + continueIncident() | **高（2時間）** — 状態管理あり |
| 7 | inquiry | `/見学\|問い合わせ/` | handleInquiry() | 中（1時間） |
| 8 | admin_doc | `/行政\|書類/` | showAdminDocs() | 低（30分） |
| 9 | meeting | `/議事録\|会議\|MTG/` | saveMeetingNote() + handleMeetingQuery() | **高（2時間）** — 2ハンドラー |
| 10 | staff | `/スタッフ一覧\|メンバー/` | showStaffList() | 低（30分） |

### ai-agent.ts にハードコードされたレガシーツール（6個）

| # | ツール名 | 移行先スキル候補 |
|---|---------|---------------|
| 1 | search_knowledge | 新 knowledge.skill.ts |
| 2 | search_conversations | 新 knowledge.skill.ts |
| 3 | get_staff | 新 staff.skill.ts |
| 4 | get_projects | 新 project.skill.ts |
| 5 | get_project_detail | 新 project.skill.ts |
| 6 | get_project_tasks | 新 project.skill.ts |

## 2. 移行手順（テンプレート）

### Step 1: 既存ハンドラーの分析
```
件名: attendance
ファイル: lib/handlers/attendance.ts (1,210バイト)
ハンドラー: showAttendance(user, replyToken, supabase, token)
会話状態: なし
AI Agentツール: なし
ブリーフィング: なし（patterns.tsでの出欠関連セクションなし）
依存: lineReply, supabase
```

### Step 2: スキルファイル作成
```typescript
// lib/skills/attendance.skill.ts
import { defineSkill } from './_define';
import { showAttendance } from '../handlers/attendance';

export const attendanceSkill = defineSkill({
  id: 'attendance',
  name: '出欠管理',
  intents: ['attendance'],
  routes: [
    { pattern: /出欠|出席/, intent: 'attendance',
      handler: (u, _t, rt, s, tk) => showAttendance(u, rt, s, tk) },
  ],
  fastIntents: [
    { pattern: /出欠|出席/, intent: 'attendance' },
  ],
  intentDescriptions: {
    attendance: '出欠確認、出席状況、欠席報告',
  },
  breakKeywords: ['出欠'],
});
```

### Step 3: index.ts に登録
```typescript
import { attendanceSkill } from './attendance.skill';
skillRegistry.register(attendanceSkill);
```

### Step 4: router.ts からレガシーコードを削除
1. `LEGACY_KEYWORD_ROUTES` から該当行を削除
2. `detectIntent()` のレガシー高速パスから該当行を削除
3. importを削除

### Step 5: ai-agent.ts からレガシーツールを削除（該当がある場合）
1. `LEGACY_DB_TOOLS` から該当ツール定義を削除
2. `executeTool()` のswitch文から該当caseを削除

### Step 6: テスト
- LINE Botでキーワード送信して動作確認
- detectIntentが正しくintentを返すか確認

## 3. 推奨移行順序

### Phase 1: 単純移行（レガシーハンドラーをそのまま wrap）
1. ✅ help（最もシンプル、成功体験として最適）
2. ✅ staff
3. ✅ admin_doc
4. ✅ memo
5. ✅ attendance

### Phase 2: 中程度の移行
6. ✅ orders — showOrders() のみ
7. ✅ shift — showShift() のみ
8. ✅ inquiry — handleInquiry()

### Phase 3: 状態管理付き移行
9. ✅ incident — startIncident() + continueIncident()（states配列が必要）
10. ✅ meeting — saveMeetingNote() + handleMeetingQuery()（2ハンドラー）

### Phase 4: AIツール移行
11. ✅ knowledge.skill.ts — search_knowledge + search_conversations
12. ✅ project.skill.ts — get_projects + get_project_detail + get_project_tasks
13. ✅ staff.skill.ts に get_staff を統合

## 4. 移行時の注意点

### ハンドラーシグネチャの統一
レガシーハンドラーは統一シグネチャに合わない場合がある:
```typescript
// レガシー: 引数が足りない
showHelp(user, replyToken, token)

// スキル: 統一シグネチャ
(user, text, replyToken, supabase, token, geminiKey) => Promise<void>

// 解決: ラッパーで包む
handler: (u, _t, rt, _s, tk) => showHelp(u, rt, tk)
```

### 状態管理のある機能
`incident` のように `continueIncident` が `writing_incident` 状態で呼ばれる場合：
```typescript
states: [
  { stateName: 'writing_incident',
    handler: (u, t, rt, s, tk, gk) => continueIncident(u, t, rt, s, tk, gk) },
],
```
同時に `LEGACY_STATE_ROUTES` から削除すること。

### AI Agentツールの移行
agentTools を定義すると、自動的に:
1. `ai-agent.ts` の `DB_TOOLS` に追加される
2. `executeTool()` でスキルレジストリ経由で実行される
3. レガシーswitch文から該当caseを削除するだけ

## 5. admin.html 2,047行の分割方針

### 現状の問題
- 全9タブが1ファイルに存在（HTML + CSS + JS混在）
- 変更のコンフリクトリスク大
- ページロード時に全タブのHTMLをレンダリング

### 推奨分割案

#### Option A: タブごとにHTML分割（推奨）
```
public/admin/
├── index.html        # シェル（ナビ + 認証 + 共通CSS/JS）
├── staff.html        # スタッフ管理タブ
├── reports.html      # 日報一覧タブ
├── tasks.html        # タスク管理タブ
├── expenses.html     # 経費管理タブ
├── orders.html       # 案件管理タブ
├── calendar.html     # カレンダータブ
├── attendance.html   # 出欠管理タブ
├── cashbox.html      # 金庫タブ
└── costs.html        # コスト管理タブ
```
- 各タブは `<iframe>` または `fetch()` で動的読み込み
- 共通認証ロジックは index.html から提供

#### Option B: JSモジュール分割
```
public/admin.html     # HTMLテンプレートのみ（500行程度）
public/admin/
├── app.js            # メインJS
├── auth.js           # 認証
├── staff.js          # スタッフタブ
├── expenses.js       # 経費タブ
└── ...
```
- Vercelの静的配信を活用（関数数に影響なし）
- `<script type="module">` でES Modules使用

#### Option C: Vite/React化（大規模だが最終形態）
- LIFFアプリとの統一
- ただしVercel Hobbyプランのビルド制約あり
- **現時点では過剰**

### 分割の進め方
1. まず共通CSS/JSをファイル分離
2. 最も大きいタブ（経費管理）から分離
3. 認証ロジックの共通化
4. 段階的に全タブ分離

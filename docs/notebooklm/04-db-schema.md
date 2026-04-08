# DB設計サマリー

## 1. 概要

- **DBMS**: PostgreSQL 15（Supabase提供）
- **認証**: LINE User ID ベース（独自usersテーブル、Supabase Auth不使用）
- **テーブル数**: 38+（設計書定義）+ 運用追加テーブル
- **プロジェクトID**: cgfkzlsndrnwoczinstt

## 2. 主要テーブル一覧

### コア（全機能共通）
| テーブル | 用途 | 増加速度 |
|---------|------|---------|
| users | スタッフ・管理者・社長 | 低 |
| conversation_messages | 全LINE会話履歴 | **高** |
| conversation_states | 会話状態（1:1 with users） | 低 |

### 日報・タスク
| テーブル | 用途 |
|---------|------|
| daily_reports | 日報データ |
| report_drafts | 日報下書き（一時データ） |
| tasks | タスク（日報から自動生成含む） |
| task_comments | タスクコメント |
| task_suggestions | AI提案タスク候補 |

### 経費・金庫・売上
| テーブル | 用途 |
|---------|------|
| expenses | 経費データ |
| cashbox_transactions | 金庫入出金記録 |
| daily_sales | 日別売上 |
| documents | 請求書・領収書 |

### サロン関連
| テーブル | 用途 |
|---------|------|
| reservations | サロン予約 |
| salon_menus | 施術メニューマスタ |
| salon_customers | 顧客カルテ |

### プロジェクト管理（シーラン事業）
| テーブル | 用途 |
|---------|------|
| projects | プロジェクト |
| project_milestones | マイルストーン |
| project_tasks | プロジェクトタスク |

### 利用者管理（就労支援）
| テーブル | 用途 |
|---------|------|
| clients | 利用者マスタ |
| attendance_records | 出欠記録 |
| support_plans | 個別支援計画 |
| monitoring_records | モニタリング記録 |
| incident_reports | 事故・ヒヤリハット |
| inquiries | 見学・問い合わせ |

### 記憶・学習システム
| テーブル | 用途 |
|---------|------|
| user_profiles | ユーザー別記憶（好み・パターン） |
| knowledge_base | 組織知識（ルール・決定事項） |
| patterns | 行動パターン（先回り提案用） |

### 行政・運営
| テーブル | 用途 |
|---------|------|
| admin_documents | 行政書類マスタ |
| admin_document_records | 提出記録 |
| calendar_events | カレンダーイベント |
| shifts | シフトデータ |
| orders | 受注案件 |
| notifications | 通知キュー |

## 3. 重要なリレーション

```
users (1) ──── (N) conversation_messages
users (1) ──── (1) conversation_states
users (1) ──── (N) daily_reports
users (1) ──── (N) tasks (assignee_id)
users (1) ──── (N) expenses
users (1) ──── (N) user_profiles

daily_reports (1) ──── (N) task_suggestions

projects (1) ──── (N) project_milestones
projects (1) ──── (N) project_tasks

clients (1) ──── (N) attendance_records
clients (1) ──── (N) support_plans
support_plans (1) ──── (N) monitoring_records

admin_documents (1) ──── (N) admin_document_records
```

## 4. usersテーブル詳細

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    line_user_id TEXT UNIQUE NOT NULL,
    line_display_name TEXT,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'pending'
        CHECK (role IN ('owner', 'manager', 'staff', 'pending', 'rejected')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    job_description TEXT,      -- 業務内容メモ
    last_message_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### ロール
- `owner`: 社長（全権限、最初の登録ユーザーが自動付与）
- `manager`: 管理者（データ閲覧・管理権限）
- `staff`: スタッフ（自分のデータのみ）
- `pending`: 承認待ち（メッセージ送受信不可）
- `rejected`: 却下

## 5. 記憶システムのテーブル詳細

### user_profiles
ユーザーごとの記憶。日次バッチでGeminiが生成。
```
- user_id
- interaction_count: メッセージ数
- intent_distribution: {"expense": 15, "task": 8, ...}
- time_distribution: {"9": 3, "10": 5, ...}
- preferences: AIが抽出した好みや傾向
```

### knowledge_base
組織全体の知識。社長の決定事項、ルール、FAQ等。
```
- category: 'decision' | 'rule' | 'faq' | 'process' | etc.
- title
- content
- tags: string[]
- is_active: boolean
- source_user_id: 誰の発言から抽出されたか
```

### patterns
行動パターン。先回り提案に使用。
```
- title
- description: 提案テキスト
- trigger_condition: { type: 'time'|'date'|'seasonal', ... }
- confidence: 0.0〜1.0（自己強化）
- hit_count / miss_count
- is_active: confidence < 0.3 && total > 10 で自動停止
```

## 6. テーブル構造変更時のルール

1. **マイグレーションSQL必須**: Supabase SQL Editorで実行
2. **既存データの互換性**: ALTER TABLEでカラム追加はDEFAULT値必須
3. **インデックス**: 頻繁にフィルタ・ソートするカラムにはインデックス追加
4. **UNIQUE制約**: 重複防止が必要な組み合わせには複合UNIQUEを設定

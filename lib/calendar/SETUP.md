# Google Calendar API セットアップ手順

AI秘書がGoogleカレンダーと連携するための設定手順です。
サービスアカウント方式を使用します。

## 1. Google Cloud Console でプロジェクト作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 「プロジェクトを選択」→「新しいプロジェクト」をクリック
3. プロジェクト名を入力（例: `ai-secretary`）して作成

## 2. Google Calendar API を有効化

1. 左メニュー「APIとサービス」→「ライブラリ」
2. 「Google Calendar API」を検索
3. 「有効にする」をクリック

## 3. サービスアカウントを作成

1. 左メニュー「APIとサービス」→「認証情報」
2. 「認証情報を作成」→「サービスアカウント」
3. サービスアカウント名を入力（例: `calendar-bot`）
4. 「作成して続行」をクリック
5. ロールは不要（スキップ可）→「完了」

## 4. JSON キーをダウンロード

1. 作成したサービスアカウントをクリック
2. 「キー」タブを開く
3. 「鍵を追加」→「新しい鍵を作成」
4. 「JSON」を選択して「作成」
5. ダウンロードされたJSONファイルから以下の値をメモ:
   - `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL` に使用
   - `private_key` → `GOOGLE_PRIVATE_KEY` に使用

## 5. Google Calendar でサービスアカウントにカレンダーを共有

1. [Google Calendar](https://calendar.google.com/) を開く
2. 対象カレンダー（salt.nabase@gmail.com）の設定を開く
3. 「特定のユーザーとの共有」セクションで「ユーザーを追加」
4. サービスアカウントのメールアドレス（`xxx@xxx.iam.gserviceaccount.com`）を入力
5. 権限を「変更および共有の管理権限」に設定して保存

**注意**: 読み取りのみの場合は「予定の表示（すべての予定の詳細）」でも可。

## 6. 環境変数を設定

Vercelのプロジェクト設定で以下の環境変数を追加:

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=calendar-bot@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv..."
GOOGLE_CALENDAR_ID=salt.nabase@gmail.com
```

### 注意事項

- `GOOGLE_PRIVATE_KEY` はJSON内の `private_key` の値をそのまま設定
- Vercelの環境変数設定画面では改行が `\n` として扱われるため、そのまま貼り付けてOK
- ローカル開発時は `.env` ファイルに記載（`.gitignore` に追加済みであること）

## 動作確認

デプロイ後、以下のURLでイベント一覧が取得できることを確認:

```
GET https://your-domain.vercel.app/api/calendar?action=list&days=7
```

正常時のレスポンス例:

```json
{
  "success": true,
  "count": 3,
  "events": [
    {
      "id": "abc123",
      "title": "朝礼",
      "start": "2026-04-01T09:00:00+09:00",
      "end": "2026-04-01T09:30:00+09:00",
      "description": "",
      "allDay": false
    }
  ]
}
```

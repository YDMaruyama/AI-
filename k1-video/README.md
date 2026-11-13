# K1 排毒とは　暮らしの中での毒 — 教材動画（Remotion）

BP 受講者向けの講義動画「K1 排毒とは 暮らしの中での毒」を、React＋TypeScript（Remotion 4）で編集可能な形にまとめたプロジェクトです。ナレーション・字幕・尺・図の段階はすべて `src/data/chapters/*.ts`（scene-data）に集約しています。

- 原典：「K1 排毒とは 暮らしの中での毒」**改稿案**（承認済み・医学監修済みではありません）→ `source/K1_source_with_ids.md`
- 制作指示：`source/production_brief.md`
- 納品ドキュメント：`deliverables/`（台本・絵コンテ・対応表・字幕・制作メモ）
- 章の追加・修正の手順：`docs/AUTHORING.md`

## 納品物

| ファイル | 内容 |
|---|---|
| `out/K1_full_preview.mp4` | 全編プレビュー（1920×1080／60fps、**仮音声入り・字幕あり・仮尺**）。容量が大きいため git には含めない。`npm run render:preview` で再生成 |
| `out/chapters/K1_ChNN.mp4` | 章ごとの書き出し（Ch00 は導入） |
| `deliverables/narration_ja.md` | 収録用全文台本（読み方表・行ごとの読み注記つき） |
| `deliverables/storyboard.md` | 絵コンテ：シーン・秒数・画面・動き・ナレーション |
| `deliverables/source_coverage.md` | 原文の全段落・見出しとシーンの対応、統合した重複、未解決事項 |
| `deliverables/captions_ja.srt` / `.vtt` | 外部字幕（仮尺。VTT には区分を NOTE で明記） |
| `deliverables/production_notes.md` | 使用素材と利用条件、根拠の確認状況、要修正事項、実施した検証 |
| `deliverables/evidence_check.md` / `factcheck.json` | 根拠の確認の詳細（資料 URL・確認日） |

## 必要なもの

| 用途 | 必要なもの |
|---|---|
| プレビュー・書き出し | Node.js 18 以上（22 で確認）、ffmpeg |
| ブラウザ | Remotion が自動で取得します。取得できない環境では `REMOTION_BROWSER=/path/to/chrome-headless-shell` を指定 |
| 仮音声（任意） | Python 3 と `pip install pyopenjtalk-plus numpy`（`TTS_PYTHON` で python のパスを指定可） |

## はじめかた

```bash
cd k1-video
npm ci
npm run studio          # ブラウザでプレビュー（Remotion Studio）
```

## 編集の流れ

```bash
# 1. src/data/chapters/chXX.ts のナレーションや props を編集
npm run tts             # （任意）変更したシーンの仮音声を作り直す
npm run timeline        # 尺・字幕・図の段階を再計算 → src/generated/timeline.json
npm run validate        # 図解キー・段落 ID・見出し長・字幕分割・未収録段落の検査
npm run docs            # 台本・絵コンテ・対応表・字幕ファイルを deliverables/ に再生成
npx tsc --noEmit        # 型チェック
npm run stills -- c03-s05 --mid   # 確認用の静止画（out/stills/）
```

## 音声の差し替え（本収録）

1. シーン単位で収録し、`public/audio/recorded/<シーンID>.wav`（mp3 / m4a 可）に置く。台本は `deliverables/narration_ja.md`。
2. 行ごとの開始・終了秒があれば同名 `.json`（`{"lines":[{"id":"c01-s02-l1","start":0.0,"end":3.2}]}`）も置く。なければ行の文字数比で図の切り替えと字幕を割り当てる。
3. `npm run timeline && npm run docs` → 尺・字幕・台本・絵コンテが本収録に合わせて更新される（音声は伸縮しない）。
4. 本収録が入ったシーンは仮音声より優先される。すべて本収録になると、字幕と台本の表記が「確定尺」になる。

## 書き出し

```bash
npm run render:chapters                     # 章ごと（字幕あり） → out/chapters/K1_ChNN.mp4
npm run render:chapters -- --only Ch03      # 指定章だけ
npm run render:preview                      # 章ごとに書き出し → 連結 → out/K1_full_preview.mp4
npm run render:preview -- --nosub           # 字幕なし版 → out/K1_full_preview_nosub.mp4
npm run render:full                         # 全編を 1 回で書き出す（Remotion CLI） → out/K1_full.mp4
npx remotion render src/index.ts K1-Full-NoSub out/K1_full_nosub.mp4   # 字幕なし全編（CLI）
npx remotion render src/index.ts K1-Ch05 out/K1_Ch05.mp4 --props='{"chapterIds":["ch05"],"showCaptions":false}'
```

章ごとの書き出しは途中で止まっても同じコマンドで再開できます（書き出し済みの章はスキップ。`--force` で書き直し）。外部字幕は `deliverables/captions_ja.srt` / `.vtt`。

## Composition 一覧

| ID | 内容 |
|---|---|
| `K1-Full` | 全編・字幕あり |
| `K1-Full-NoSub` | 全編・字幕なし |
| `K1-Ch00` 〜 `K1-Ch10` | 章ごと（Ch00 は導入）。`showCaptions` で字幕の有無を切り替え |
| `K1-Scene` | シーン単体（`--props='{"sceneIds":["c03-s05"]}'`） |

## フォルダ構成

```
source/              原文（段落 ID 付き）・制作指示
src/data/            scene-data（chapters/）、型、読み方辞書、尺の定数
src/visuals/         図解（templates/ 共通、chXX/ 章固有）
src/components/      共通部品（アイコン、カード、矢印、字幕、シーン描画）
src/generated/       timeline.json（自動生成）
scripts/             timeline / tts / docs / validate / stills / render
public/fonts/        Noto Sans JP（SIL OFL 1.1）
public/audio/        scenes/（仮音声）, recorded/（本収録）
deliverables/        納品ドキュメント
docs/AUTHORING.md    章の制作手順と決まり
```

## デザイン

`src/theme.ts` に色・文字サイズ・画面領域をまとめています。既存 BP 教材の正式なデザイン設定が見つからなかったため、制作指示の仮案（アイボリー・濃いチャコール・落ち着いた緑・控えめな金）で作成しています。正式設定が決まったら `theme.ts` を差し替えてください。

## 利用条件（素材・ツール）

- Noto Sans JP：SIL Open Font License 1.1（`public/fonts/OFL.txt`）
- Remotion：Remotion License。個人・従業員 3 名以下の企業・非営利団体などは無料、それ以外の企業は Company License が必要です（https://www.remotion.dev/license）。利用主体の条件を確認してください。
- 仮音声：pyopenjtalk-plus（MIT）、Open JTalk 辞書（NAIST, 修正 BSD）、HTS Voice "Mei"（Nagoya Institute of Technology, CC BY 3.0）。仮音声を含む動画を配布する場合はクレジット表記が必要です。本収録に差し替える前提の仮素材です。
- BGM・効果音：使用していません。画像・写真・ロゴ・商品画像：使用していません（図はすべて SVG／React で作成）。

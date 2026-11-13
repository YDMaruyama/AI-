# K1 教材動画：章の制作手順（scene-data と図解）

この文書は、章ごとのシーン（ナレーション・字幕・図解）を追加・修正するときの手順と決まりをまとめたものです。

- 原文（段落 ID 付き）：`source/K1_source_with_ids.md`
- 制作指示：`source/production_brief.md`（章ごとの図解指示あり）
- 先行試作（お手本）：
  - `src/data/chapters/ch00.ts`, `ch01.ts`（導入・第1章、テンプレートの使い方）
  - `src/data/chapters/ch03.ts` の皮膚シーン ＋ `src/visuals/ch03/SkinBoundary.tsx`
  - `src/data/chapters/ch06.ts` ＋ `src/visuals/ch06/HormoneSignal.tsx`（同じ図を mode で切り替える例）
  - `src/data/chapters/ch09.ts` ＋ `src/visuals/ch09/PanSplit.tsx`（分割画面の例）

---

## 1. しくみ

```
src/data/chapters/chXX.ts   … 章のシーン定義（ナレーション行・字幕・step・図解キー・props）
src/visuals/chXX/*.tsx      … 章固有の図解コンポーネント
src/visuals/chXX/index.ts   … 章固有の図解の登録（キーは 'chXX/名前'）
src/visuals/templates/      … 共通テンプレート（下記）
src/components/             … 共通部品（Icons, ui, scene-context, SceneRenderer）
src/generated/timeline.json … npm run timeline が作る尺・字幕・step の表（手で編集しない）
```

- 画面：1920×1080、60fps。上部に章ラベルと見出し（`heading`）、中央が**図解領域 1760×676（左上 x=80, y=196）**、下部が字幕帯。図解コンポーネントは図解領域の中だけに描く（ルート要素は `position:absolute; inset:0`）。字幕帯と重ならない。
- `layout: 'full'` のシーンは見出しなし（章扉など）。
- ナレーション 1 行（`lines[]` の 1 要素）＝ 原則 1 文。行の始まりで図解の段階 `step` が進む。字幕は行ごとに自動で文節分割（最大 2 行×28 字）。
- 尺は音声から決まる。音声がない間は文字数から推定（5.5 字/秒）。

### step（図の段階）

- シーン開始時は step 0。`line.step` に数値を書くと、その行の始まりで step がその値になる（省略時は維持）。
- 行の途中で進めたい場合は `substeps: [{at: 0.5, step: 4}]`（at は行の長さに対する割合）。
- step は基本的に増やす方向で使う（戻すと validate が警告）。
- 図解コンポーネント側では次のフックを使う（`src/components/scene-context.tsx`）。
  - `useReveal(s, {delay, duration})` … step s に到達してからの表示進行度 0→1
  - `useFocus((step) => boolean)` … 強調度 0→1（なめらかに切り替わる）
  - `useStep()` … 現在の step、直前の step、経過秒など
  - `fadeUp(p)`, `dimOpacity(focus)`, `drawDash(p, length)` … スタイル補助

## 2. 共通テンプレート（`src/visuals/templates/index.tsx`）

各項目は `step`（省略時は並び順 0,1,2…）で現れ、**現在の step の項目だけ強調**、他は読める濃さで残る。`allStep` 以降は全項目を強調。`note` は図解領域の下端に出る補足帯（`noteStep` で表示、`noteLabel` 既定「補足」）。

| キー | 用途 | 主な props |
|---|---|---|
| `ChapterTitle` | 章扉（layout: 'full'） | number, title, subtitle?, kicker? |
| `Statement` | 1 つの要点を大きく | text（`**強調**`、`\n` 改行可）, sub?, subStep?, icon?, tone?, textSize?, note?, noteStep? |
| `Points` | 短い要点を順に（最大 5 程度） | items[{text, sub?, icon?, step?, tone?}], numbered?, columns?, size?, intro?, allStep?, note? |
| `Cards` | 2〜4 枚のカードを横並び | cards[{title, body?, icon?, step?, tone?, tag?}], allStep?, height?, note? |
| `Compare` | 2 つを並べて区別（中央に ≠） | left/right {title, points[], icon?, tone?, step?, tag?}, relation 'ne'\|'and'\|'none', relationLabel?, relationStep?, note? |
| `Separate` | 別々の観察として並べる（矢印で一本道にしない） | items[{title, body?, icon?, step?}], caption?, captionStep?, note? |
| `Checklist` | 確認項目（チェックが入る） | items[{text, sub?, step?}], title?, icon?, note? |
| `Quote` | 理念の言葉 | quote, parts[{text, icon, step}], sub?, subStep? |

`tone`: 'green'（主）| 'gold'（補助）| 'slate'（対比）| 'neutral'。色だけで意味を分けず、形・ラベルも併用する。

アイコン名は `src/components/Icons.tsx` の `IconName`（food, water, air, skin, hand, home, container, lid, microwave, board, knife, pan, spatula, bottle, shirt, capsule, dust, child, cell, label, check, search, book, leaf, heart, moon, walk, drop, can, fish, fiber, heat, clock, scale, person, flask, window, face, glass, bowl, wood, plate, soil, truck, package, sofa, tire, fragrance, shield, question, lungs, mouth, gland, chart, info, cycle, sprout, earth, list, warning-soft）。

## 3. 共通部品（`src/components/ui.tsx`）

- `Card`, `Pill`, `NoteStrip`（補足帯）, `CornerTag`（「模式図」等の注記）, `NotEqual`（≠）, `CheckItem`
- `EvidenceBadge kind='cell'|'animal'|'human'|'causal'|'assessment'|'unknown'`：根拠の種類を**形とラベル**で示す（細胞実験○／動物実験□／人での関連△／因果関係→／評価機関の判断（盾））
- SVG 用：`Arrow`（描画アニメーション、`dashed` で条件付き・一部）, `SvgText`, `SvgPill`（文字幅から自動で幅を決める丸ラベル）, `SvgIcon`
- `textUnits(text)`：全角 1・半角 0.58 の文字幅見積もり

## 4. 内容の決まり（必ず守る）

1. **原文の意味・条件・不確実性を保持**し、話し言葉（です・ます、穏やか）に整える。割り当てられた段落の主張と留保（「ただし」「〜とは限らない」「〜とまでは言えない」「主に動物実験」等）を一つも落とさない。
2. 重複は統合してよい。統合した場合は報告に記録する（source_coverage 用）。
3. **追加しない**：原文にない数値、排出率、治療・予防効果、商品によるプラスチック除去の主張、不安をあおる表現、営業・申込・クイズ・確認問題・制作側の説明。
4. 学校の理念と、特定の物質・製品の医学的効果を区別する。
5. 科学的な限界は**該当する説明と同じシーン**で短く伝える（`note` や図中ラベル）。
6. 原文中の出典表記（`[XX-cite]` の機関名・研究名）は**読み上げも表示もしない**。文中で主張の主体になっている機関（例：N10 のドイツ連邦リスク評価研究所、M7 の欧州食品安全機関）は「ドイツの公的なリスク評価機関」「欧州の食品安全の評価機関」のように**一般名で帰属を残す**（断定に書き換えない）。URL は出さない。
7. 物質・概念を混同させない：BPA と PET、DEP と DEHP、PET（テレフタレート）とフタル酸系可塑剤、PTFE と PFOA・PFOS、粒子と化学物質（分子）、検出と健康影響、接触と吸収、香料とカプセルの殻・破片、「無香料」と「マイクロカプセル不使用」。PFAS 全体を一つの危険度で表さない。
8. 根拠の種類（細胞実験・動物実験・人での関連・因果関係・評価機関の判断）を同じ証拠として描かない。
9. 健康な臓器が壊れる表現、根拠のないグラフ、架空の数値は使わない。図中の量の違いは「模式」と分かる描き方にする。
10. 人物写真・創設者の顔や経歴・ブランドロゴ・商品画像は描かない。汎用の記号で表す。

## 5. 画面の決まり

- **1 画面 1 論点**。見出し（`heading`）は 28 字以内（validate で検査）。画面の文字は短い要点にし、説明はナレーションで行う。
- 文字サイズ：見出し 60px（自動）、本文 36〜44px、補足 28px 以上。28px 未満の文字は使わない。
- 話している部分だけを強調し、比較対象は**同時に見える配置**にする。
- 意味のない常時運動・点滅は使わない。段階表示・矢印の描画・ハイライト・穏やかな拡大縮小のみ。
- 模式図には `CornerTag`「模式図」、大きさの比較には「模式図・縮尺は一定ではない」。
- 色だけで意味を分けない（形・ラベル・線種を併用）。
- 図解の文字は SVG の `text`／HTML で描く（画像に焼き込まない）。
- 補足帯（NoteStrip）は 1〜2 行に収める（目安 45 字以内）。

## 6. 章ファイルの書き方

```ts
export const ch05: Chapter = {
  id: 'ch05', number: 5, title: 'どこから体に入るか', slug: 'Ch05',
  scenes: [
    {id: 'c05-s01', title: '章扉', layout: 'full', visual: 'ChapterTitle',
     props: {number: 5, title: 'どこから体に入るか'},
     lines: [{text: '第5章では、…を見ていきます。', src: ['J']}],
     board: '章番号と章題。'},
    {id: 'c05-s02', title: '食べ物と飲み水', heading: '食べ物と飲み水から', visual: 'Points',
     props: {...}, lines: [{text: '…', src: ['J1'], step: 1}, …],
     board: '画面と動きの説明（storyboard に出力される）'},
  ],
};
```

- シーン ID は `cNN-sNN`（章内で 01 から連番）。試作シーン（c03-s90 等）は章内の位置に合わせて振り直してよい。
- 各章の最初は `ChapterTitle` の章扉（ナレーション 1 行：「第N章では、〜を見ていきます。」程度）。
- `src` には対応する原文段落 ID（見出し ID 可）を必ず書く。導入の学習目標のみ `BRIEF`。
- `board` には画面構成と動きを日本語で書く（storyboard.md に出力される）。
- 読み方の難しい語（例：胎仔＝たいし）は `src/data/readings.ts` にあるか確認し、ない語は報告に挙げる（共有ファイルなので章の作業では編集しない）。

## 7. 確認コマンド

```bash
npm run timeline                 # 尺・字幕・step を再計算（timeline.json）
npx tsc --noEmit                 # 型チェック
npm run validate                 # 図解キー・段落 ID・見出し長・字幕分割・未参照段落
npx tsx scripts/render-stills.ts --chapter ch05 --mid --out out/stills/ch05   # 確認用静止画
```

静止画（`out/stills/chXX/*.png`、960×540）を開き、各段階の完成状態と中間状態で、文字切れ・はみ出し・重なり・誤字・矢印の接続先・字幕と図の重なりを確認する。

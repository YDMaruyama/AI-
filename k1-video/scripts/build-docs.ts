/**
 * scene-data と timeline.json から納品ドキュメントを生成する。
 *   npm run docs
 * 出力（deliverables/）：
 *   narration_ja.md   収録用全文台本（読み方つき）
 *   storyboard.md     シーン・秒数・画面・動き・ナレーション
 *   source_coverage.md 原文段落とシーンの対応（自動部分＋ coverage-notes.json の手動メモ）
 *   captions_ja.srt / captions_ja.vtt 外部字幕
 * timeline.json の mode（tts / recorded / estimate）に応じて「仮尺」「確定尺」を明記する。
 */
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {CHAPTERS} from '../src/data/chapters';
import {READINGS} from '../src/data/readings';
import type {Chapter, Scene, Timeline} from '../src/data/types';
import {lineIdOf, spokenLength} from '../src/data/util';

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'deliverables');
mkdirSync(OUT, {recursive: true});
const timeline: Timeline = JSON.parse(readFileSync(path.join(ROOT, 'src', 'generated', 'timeline.json'), 'utf8'));
const FPS = 60;

const modeLabel = (m: string) =>
  m === 'recorded'
    ? '確定尺（本収録音声に同期）'
    : m === 'tts'
      ? '仮尺（仮音声：Open JTalk による合成音声に同期。本収録後に差し替え）'
      : m === 'estimate'
        ? '仮尺（音声なし。文字数から推定：5.5 字/秒）'
        : '仮尺（一部のシーンのみ音声あり）';
const isFinal = timeline.mode === 'recorded';

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${m}:${String(ss).padStart(2, '0')}`;
};
const fmtSrt = (s: number) => {
  const ms = Math.round(s * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  const r = ms % 1000;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(r).padStart(3, '0')}`;
};
const chapterName = (c: Chapter) => (c.number === 0 ? '導入' : `第${c.number}章　${c.title}`);

// 各シーンの開始時刻（フレーム丸めを Remotion と同じにする）
const starts = new Map<string, number>();
{
  let f = 0;
  for (const c of CHAPTERS)
    for (const s of c.scenes) {
      starts.set(s.id, f / FPS);
      f += Math.max(1, Math.round(timeline.scenes[s.id].duration * FPS));
    }
}
const total = [...CHAPTERS.flatMap((c) => c.scenes)].reduce((a, s) => a + Math.max(1, Math.round(timeline.scenes[s.id].duration * FPS)) / FPS, 0);
const chapterDur = (c: Chapter) => c.scenes.reduce((a, s) => a + Math.max(1, Math.round(timeline.scenes[s.id].duration * FPS)) / FPS, 0);
const today = '2026-11-13';

/* ---------------- narration_ja.md ---------------- */
{
  const hintTerms = READINGS.filter((r) => !r.ttsOnly && r.term !== r.reading);
  const lines: string[] = [];
  lines.push('# K1 排毒とは　暮らしの中での毒 — 収録用ナレーション台本');
  lines.push('');
  lines.push(`- 作成日：${today}（scene-data から自動生成：\`npm run docs\`）`);
  lines.push(`- 尺：**${modeLabel(timeline.mode)}**　合計 約 ${fmt(total)}`);
  lines.push('- 原典：「K1 排毒とは 暮らしの中での毒」改稿案（承認済み・医学監修済みではありません）。台本は原典の意味・条件・留保を保って話し言葉に整えたものです。');
  lines.push('- 読み上げの目安：穏やかに、1 分あたり 300〜330 字程度。行と行の間は自然な間を取ってください。音声を後から速めることはしません。');
  lines.push('');
  lines.push('## 収録と差し替えの方法');
  lines.push('');
  lines.push('1. シーン単位（下の `c01-s02` などの見出しごと）に 1 ファイルで収録します。行の番号（`l1`, `l2`…）は図解の切り替え位置です。');
  lines.push('2. ファイルを `public/audio/recorded/<シーンID>.wav`（mp3 / m4a も可）に置きます。');
  lines.push('3. 行ごとの開始・終了秒が分かる場合は、同名の `.json`（`{"lines":[{"id":"c01-s02-l1","start":0.0,"end":3.2}, …]}`）を置くと図解の切り替えと字幕が正確に合います。ない場合は行の文字数比で割り当てます。');
  lines.push('4. `npm run timeline && npm run docs` を実行すると、尺・字幕・台本・絵コンテが本収録の長さに更新されます。');
  lines.push('');
  lines.push('## 読み方');
  lines.push('');
  lines.push('| 表記 | 読み | 備考 |');
  lines.push('|---|---|---|');
  for (const r of hintTerms) lines.push(`| ${r.term} | ${r.reading} | ${r.note ?? ''} |`);
  lines.push('');
  for (const c of CHAPTERS) {
    lines.push(`## ${chapterName(c)}　（約 ${fmt(chapterDur(c))}）`);
    lines.push('');
    for (const s of c.scenes) {
      const t = timeline.scenes[s.id];
      lines.push(`### ${s.id}　${s.title}　〔${fmt(starts.get(s.id)!)}〜、約 ${Math.round(t.duration)} 秒〕`);
      if (s.heading) lines.push(`画面見出し：${s.heading}`);
      lines.push('');
      s.lines.forEach((l, i) => {
        const hints = hintTerms.filter((r) => l.text.includes(r.term)).map((r) => `${r.term}＝${r.reading}`);
        lines.push(`- **l${i + 1}**　${l.text}${hints.length ? `　〔読み：${hints.join('、')}〕` : ''}`);
      });
      lines.push('');
    }
  }
  writeFileSync(path.join(OUT, 'narration_ja.md'), lines.join('\n'));
}

/* ---------------- storyboard.md ---------------- */
{
  const lines: string[] = [];
  lines.push('# K1 排毒とは　暮らしの中での毒 — 絵コンテ（storyboard）');
  lines.push('');
  lines.push(`- 作成日：${today}（scene-data から自動生成）`);
  lines.push(`- 画面：1920×1080 / 60fps　尺：**${modeLabel(timeline.mode)}**　合計 約 ${fmt(total)}　シーン数 ${CHAPTERS.reduce((a, c) => a + c.scenes.length, 0)}`);
  lines.push('- 画面構成：上部に章ラベルと見出し（1 画面 1 論点）、中央に図解（1760×676）、下部に字幕帯（字幕なし版では空き）。図の段階（step）はナレーション行の開始で切り替わる。');
  lines.push('');
  lines.push('## 章の一覧');
  lines.push('');
  lines.push('| 章 | Composition | 開始 | 尺 | シーン数 |');
  lines.push('|---|---|---|---|---|');
  for (const c of CHAPTERS) {
    lines.push(`| ${chapterName(c)} | K1-${c.slug} | ${fmt(starts.get(c.scenes[0]?.id ?? '') ?? 0)} | ${fmt(chapterDur(c))} | ${c.scenes.length} |`);
  }
  lines.push('');
  for (const c of CHAPTERS) {
    lines.push(`## ${chapterName(c)}`);
    lines.push('');
    for (const s of c.scenes) {
      const t = timeline.scenes[s.id];
      const st = starts.get(s.id)!;
      lines.push(`### ${s.id}　${s.title}`);
      lines.push('');
      lines.push(`- 時間：${fmt(st)}〜${fmt(st + t.duration)}（${t.duration.toFixed(1)} 秒）`);
      lines.push(`- 見出し：${s.heading ?? '（全面レイアウト）'}`);
      lines.push(`- 図解：\`${s.visual}\``);
      lines.push(`- 画面と動き：${s.board}`);
      const steps = [...new Map(t.steps.map((x) => [x.step, x])).values()].filter((x) => x.step > 0);
      if (steps.length) lines.push(`- 段階：${steps.map((x) => `step${x.step}＠${x.at.toFixed(1)}秒`).join('、')}`);
      lines.push('- ナレーション：');
      s.lines.forEach((l, i) => {
        const tl = t.lines[i];
        const stepMark = typeof l.step === 'number' ? `［step${l.step}］` : '';
        lines.push(`  - ${tl ? `${tl.start.toFixed(1)}s` : ''} ${stepMark}${l.text}`);
      });
      lines.push('');
    }
  }
  writeFileSync(path.join(OUT, 'storyboard.md'), lines.join('\n'));
}

/* ---------------- source_coverage.md ---------------- */
{
  const src = readFileSync(path.join(ROOT, 'source', 'K1_source_with_ids.md'), 'utf8');
  const paras: {id: string; text: string; kind: 'heading' | 'para'; level: number}[] = [];
  for (const line of src.split('\n')) {
    const h = line.match(/^(#+) \[([A-Z][A-Z0-9-]*)\] (.+)$/);
    const p = line.match(/^\[([A-Z][A-Z0-9-]*)\] (.+)$/);
    if (h) paras.push({id: h[2], text: h[3], kind: 'heading', level: h[1].length});
    else if (p) paras.push({id: p[1], text: p[2], kind: 'para', level: 99});
  }
  /** 見出しの配下にある段落 ID（次の同格以上の見出しまで） */
  const childrenOf = (idx: number) => {
    const out: string[] = [];
    for (let k = idx + 1; k < paras.length; k++) {
      if (paras[k].kind === 'heading' && paras[k].level <= paras[idx].level) break;
      if (paras[k].kind === 'para') out.push(paras[k].id);
    }
    return out;
  };
  const used = new Map<string, Set<string>>();
  for (const c of CHAPTERS)
    for (const s of c.scenes)
      s.lines.forEach((l) => {
        for (const id of l.src) {
          if (!used.has(id)) used.set(id, new Set());
          used.get(id)!.add(s.id);
        }
      });
  const notesPath = path.join(OUT, 'coverage-notes.json');
  const notes: {merged?: string[]; unresolved?: string[]; perSource?: Record<string, string>} = existsSync(notesPath)
    ? JSON.parse(readFileSync(notesPath, 'utf8'))
    : {};
  const lines: string[] = [];
  lines.push('# K1 原文とシーンの対応表（source coverage）');
  lines.push('');
  lines.push(`- 作成日：${today}（対応は scene-data の \`src\` から自動集計。メモは deliverables/coverage-notes.json）`);
  lines.push('- 原文：source/K1_source_with_ids.md（制作指示に収録された全文に段落 ID を付与）');
  lines.push('- 「出典表記」は元文書でリンクになっていた機関名・研究名。本編では読み上げ・表示せず、production_notes.md で根拠の確認状況を管理する。');
  lines.push('- 「改稿案」（X0）は管理用表記のため本編対象外。');
  lines.push('');
  lines.push('## 段落ごとの対応');
  lines.push('');
  lines.push('| ID | 種別 | 原文（冒頭） | 対応シーン | 状態 | メモ |');
  lines.push('|---|---|---|---|---|---|');
  const seen = new Set<string>();
  let covered = 0;
  let totalParas = 0;
  for (const [idx, p] of paras.entries()) {
    const key = `${p.kind}:${p.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const isCite = false;
    let scenes = [...(used.get(p.id) ?? [])];
    let status = scenes.length ? '収録' : '未収録';
    if (p.id === 'X0') status = '対象外（管理用表記）';
    if (p.kind === 'heading') {
      const kids = childrenOf(idx).filter((k) => k !== 'X0');
      const kidScenes = [...new Set(kids.flatMap((k) => [...(used.get(k) ?? [])]))];
      const allKids = kids.length > 0 && kids.every((k) => used.has(k));
      scenes = [...new Set([...scenes, ...kidScenes])].sort();
      status = kids.length === 0 ? (scenes.length ? '収録' : '未収録') : allKids ? `見出し：配下 ${kids.length} 段落すべて収録` : `見出し：配下に未収録あり`;
    }
    if (p.kind === 'para' && p.id !== 'X0') {
      totalParas++;
      if (scenes.length) covered++;
    }
    const citeMatch = p.text.match(/\[([A-Z0-9]+-cite)\](.+)$/);
    const body = p.text.replace(/\s*\[[A-Z0-9]+-cite\].+$/, '');
    const excerpt = body.length > 38 ? body.slice(0, 38) + '…' : body;
    const memo = [notes.perSource?.[p.id], citeMatch ? `出典表記「${citeMatch[2]}」は本編で読まない` : ''].filter(Boolean).join('／');
    lines.push(`| ${p.id} | ${p.kind === 'heading' ? '見出し' : '段落'} | ${excerpt.replace(/\|/g, '／')} | ${scenes.join(', ')} | ${status} | ${memo} |`);
    void isCite;
  }
  lines.push('');
  lines.push(`段落 ${totalParas} 件中 ${covered} 件を収録（未収録 ${totalParas - covered} 件）。`);
  lines.push('');
  lines.push('## 統合した重複');
  lines.push('');
  for (const m of notes.merged ?? ['（記載なし）']) lines.push(`- ${m}`);
  lines.push('');
  lines.push('## 未解決事項');
  lines.push('');
  for (const m of notes.unresolved ?? ['（記載なし）']) lines.push(`- ${m}`);
  lines.push('');
  lines.push('## 原文以外から加えた内容');
  lines.push('');
  lines.push('- 導入の「この講義で目指すこと」（c00-s02、src: BRIEF）は制作指示「目的と対象」に基づく。正式な学習期間は原典にないため示していない。');
  lines.push('- 各章の章扉の一文（「第N章では〜を見ていきます」）は構成上の案内で、新しい主張は含まない。');
  writeFileSync(path.join(OUT, 'source_coverage.md'), lines.join('\n'));
}

/* ---------------- captions_ja.srt / .vtt ---------------- */
{
  const srt: string[] = [];
  const vtt: string[] = ['WEBVTT', '', `NOTE K1 排毒とは 暮らしの中での毒 — 日本語字幕。${isFinal ? '確定尺' : '仮尺'}：${modeLabel(timeline.mode)}。生成日 ${today}。`, ''];
  let n = 1;
  for (const c of CHAPTERS)
    for (const s of c.scenes) {
      const base = starts.get(s.id)!;
      const t = timeline.scenes[s.id];
      t.cues.forEach((cue, i) => {
        const next = t.cues[i + 1];
        const end = next ? Math.min(next.start, cue.end + 0.6) : Math.min(cue.end + 0.4, t.duration);
        srt.push(String(n++));
        srt.push(`${fmtSrt(base + cue.start)} --> ${fmtSrt(base + end)}`);
        srt.push(...cue.lines);
        srt.push('');
        vtt.push(`${fmtSrt(base + cue.start).replace(',', '.')} --> ${fmtSrt(base + end).replace(',', '.')}`);
        vtt.push(...cue.lines);
        vtt.push('');
      });
    }
  writeFileSync(path.join(OUT, 'captions_ja.srt'), srt.join('\n'));
  writeFileSync(path.join(OUT, 'captions_ja.vtt'), vtt.join('\n'));
}

const sceneCount = CHAPTERS.reduce((a, c) => a + c.scenes.length, 0);
const chars = CHAPTERS.flatMap((c) => c.scenes.flatMap((s: Scene) => s.lines.map((l) => spokenLength(l.text)))).reduce((a, b) => a + b, 0);
console.log(`docs → deliverables/ （${sceneCount} シーン、ナレーション ${chars} 字、合計 ${fmt(total)}、${modeLabel(timeline.mode)}）`);
void lineIdOf;

/**
 * 字幕の自動分割（自然な文節で最大 2 行）。
 * Intl.Segmenter（ICU の日本語辞書）で単語に分け、助詞・助動詞を前の語に付けて
 * 文節に近い単位を作り、句読点を優先して字幕 1 枚あたり最大 2 行に詰める。
 */
import {CAPTION} from '../../src/data/timing';

const HIRA = /^[ぁ-ゟー]+$/;
const isHiraStart = (s: string) => /^[ぁ-ゟ]/.test(s);
const isKanjiOrKataEnd = (s: string) => /[一-鿿゠-ヿ々〆ヶA-Za-z0-9０-９]$/.test(s);
const isKanjiOrKataStart = (s: string) => /^[一-鿿゠-ヿ々〆ヶA-Za-z0-9０-９]/.test(s);
const PUNCT_STRONG = /^[。！？!?]$/;
const PUNCT_WEAK = /^[、，,：:]$/;
const OPEN = /^[「『（(【]/;
const CLOSE = /^[」』）)】]/;

const PARTICLES = new Set([
  'は', 'が', 'を', 'に', 'で', 'と', 'も', 'へ', 'や', 'の', 'から', 'まで', 'より', 'など', 'では', 'には',
  'とは', 'でも', 'にも', 'へと', 'との', 'での', 'への', 'からの', 'について', 'によって', 'として', 'という',
  'ので', 'けれど', 'けど', 'ても', 'でも', 'か', 'ね', 'よ', 'だけ', 'しか', 'ほど', 'くらい', 'ぐらい', 'ごと',
  'によっては', 'にとって', 'において', 'ずつ',
]);
/** 次の語と一緒にしたい連体詞など */
const FORWARD = new Set(['その', 'この', 'あの', 'どの', 'ある', 'こうした', 'そうした', 'すべての', '同じ', '多くの', '一部の', '別の', '小さな', '大きな', '細かな']);

export const displayWidth = (s: string) =>
  [...s].reduce((w, ch) => w + (/[ -~]/.test(ch) ? 0.55 : 1), 0);

type Token = {text: string; breakAfter: number};

/** 文節単位のトークン列。breakAfter: 3=文末, 2=読点, 1=文節境界 */
export const toBunsetsu = (text: string): Token[] => {
  const seg = new Intl.Segmenter('ja', {granularity: 'word'});
  const words = [...seg.segment(text)].map((s) => s.segment).filter((w) => w.length > 0);
  const out: Token[] = [];
  let cur = '';
  let prevWord = '';
  const flush = (strength: number) => {
    if (cur) out.push({text: cur, breakAfter: strength});
    cur = '';
  };
  for (const w of words) {
    if (/^\s+$/.test(w)) {
      cur += w;
      continue;
    }
    if (PUNCT_STRONG.test(w)) {
      cur += w;
      flush(3);
      prevWord = w;
      continue;
    }
    if (PUNCT_WEAK.test(w)) {
      cur += w;
      flush(2);
      prevWord = w;
      continue;
    }
    if (CLOSE.test(w)) {
      cur += w;
      prevWord = w;
      continue;
    }
    let startNew = false;
    if (cur === '' || /[「『（(【・]$/.test(cur) || w === '・') startNew = false;
    else if (OPEN.test(w)) startNew = true;
    else if (FORWARD.has(cur) || [...FORWARD].some((f) => cur.endsWith(f) && cur.length > f.length && /[、]$/.test(cur.slice(0, -f.length)))) startNew = false;
    else if (isHiraStart(w)) {
      // 助詞・助動詞は前に付ける。助詞のあとに来るひらがなの語は新しい文節。
      startNew = PARTICLES.has(prevWord) && !PARTICLES.has(w) && !/^(ます|です|ない|た|て|れる|られる|せる|させる)/.test(w);
    } else if (isKanjiOrKataStart(w)) {
      // 複合語（漢字・カタカナの連続）は切らない
      startNew = !(isKanjiOrKataEnd(prevWord) && !PARTICLES.has(prevWord));
      if (HIRA.test(prevWord) && !PARTICLES.has(prevWord) && FORWARD.has(prevWord)) startNew = false;
    } else {
      startNew = false;
    }
    if (startNew) flush(1);
    cur += w;
    prevWord = w;
  }
  flush(3);
  if (out.length) out[out.length - 1].breakAfter = 3;
  return out;
};

const stripEdge = (s: string) => s.replace(/^\s+/, '').replace(/[、。，,\s]+$/, '');

const tokensWidth = (ts: Token[]) => displayWidth(ts.map((t) => t.text).join(''));

/** 長すぎる 1 文節を文字数で強制分割（最後の手段） */
const hardSplit = (t: Token, max: number): Token[] => {
  const chars = [...t.text];
  const parts: Token[] = [];
  let buf = '';
  for (const ch of chars) {
    if (displayWidth(buf + ch) > max) {
      parts.push({text: buf, breakAfter: 1});
      buf = '';
    }
    buf += ch;
  }
  parts.push({text: buf, breakAfter: t.breakAfter});
  return parts;
};

const PENALTY: Record<number, number> = {3: 0, 2: 4, 1: 14};

/** 2 行以内に収まるように 1 枚を 2 行へ分ける */
const splitLines = (ts: Token[], max: number): string[] | null => {
  const total = tokensWidth(ts);
  if (total <= max) return [stripEdge(ts.map((t) => t.text).join(''))];
  let best: {cost: number; k: number} | null = null;
  for (let k = 1; k < ts.length; k++) {
    const a = tokensWidth(ts.slice(0, k));
    const b = tokensWidth(ts.slice(k));
    if (a > max || b > max) continue;
    const cost = Math.abs(a - b) * 0.6 + PENALTY[ts[k - 1].breakAfter] + (b > a + 6 ? 3 : 0);
    if (!best || cost < best.cost) best = {cost, k};
  }
  if (!best) return null;
  return [
    stripEdge(ts.slice(0, best.k).map((t) => t.text).join('')),
    stripEdge(ts.slice(best.k).map((t) => t.text).join('')),
  ];
};

/** 1 行のナレーションを字幕カード（各最大 2 行）の配列に分ける */
export const splitCaption = (text: string): string[][] => {
  const max = CAPTION.maxCharsPerLine;
  let tokens = toBunsetsu(text).flatMap((t) => (displayWidth(t.text) > max ? hardSplit(t, max) : [t]));
  const n = tokens.length;
  const total = tokensWidth(tokens);
  const cards = Math.max(1, Math.ceil(total / (max * CAPTION.maxLines - 4)));
  const ideal = total / cards;
  // DP: dp[i] = 先頭 i トークンを分割した最小コスト
  const dp: {cost: number; prev: number; lines: string[] | null}[] = Array.from({length: n + 1}, () => ({
    cost: Infinity,
    prev: -1,
    lines: null,
  }));
  dp[0].cost = 0;
  for (let i = 0; i < n; i++) {
    if (!isFinite(dp[i].cost)) continue;
    for (let j = i + 1; j <= n; j++) {
      const slice = tokens.slice(i, j);
      const w = tokensWidth(slice);
      if (w > max * CAPTION.maxLines) break;
      const lines = splitLines(slice, max);
      if (!lines) continue;
      const shortPenalty = w < 8 && j < n ? 30 : 0;
      const cost = dp[i].cost + Math.pow((w - ideal) / 6, 2) + PENALTY[tokens[j - 1].breakAfter] + shortPenalty + 10;
      if (cost < dp[j].cost) dp[j] = {cost, prev: i, lines};
    }
  }
  if (!isFinite(dp[n].cost)) {
    // 念のため：文字数で切る
    return [[stripEdge(text)]];
  }
  const result: string[][] = [];
  let k = n;
  while (k > 0) {
    result.unshift(dp[k].lines!);
    k = dp[k].prev;
  }
  return result.map((card) => card.filter((l) => l.length > 0)).filter((c) => c.length > 0);
};

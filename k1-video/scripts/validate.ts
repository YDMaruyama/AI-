/**
 * scene-data の検査。npm run validate
 *  - 図解キーが登録されているか
 *  - src の段落 ID が原文（source/K1_source_with_ids.md）に存在するか
 *  - シーン ID の重複・形式
 *  - 見出しの長さ（1 行に収まるか）
 *  - step が単調に増えているか（戻る場合は警告）
 *  - 字幕が 2 行以内・1 行の文字数以内に分割できるか
 *  - 原文の全段落がどこかのシーンで参照されているか（未収録の一覧）
 */
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {CHAPTERS} from '../src/data/chapters';
import {CAPTION} from '../src/data/timing';
import {allScenes} from '../src/data/util';
import {displayWidth, splitCaption} from './lib/captions';

const ROOT = path.resolve(__dirname, '..');
const src = readFileSync(path.join(ROOT, 'source', 'K1_source_with_ids.md'), 'utf8');
const paraIds = new Set([...src.matchAll(/^\[([A-Z][A-Z0-9-]*)\]/gm)].map((m) => m[1]).filter((id) => !id.endsWith('-cite')));
const headingIds = new Set([...src.matchAll(/^#+ \[([A-Z][A-Z0-9-]*)\]/gm)].map((m) => m[1]));
const extraIds = new Set(['BRIEF']);
const contentIds = [...paraIds].filter((id) => /\d/.test(id) && id !== 'X0' && id !== 'T0');

// 登録済みの図解キー（registry.ts をテキストで解析）
const visualKeys = new Set<string>();
const reg = readFileSync(path.join(ROOT, 'src', 'visuals', 'templates', 'index.tsx'), 'utf8');
for (const m of reg.matchAll(/^export const (\w+): React\.FC/gm)) visualKeys.add(m[1]);
for (let i = 0; i <= 10; i++) {
  const f = path.join(ROOT, 'src', 'visuals', `ch${String(i).padStart(2, '0')}`, 'index.ts');
  try {
    const t = readFileSync(f, 'utf8');
    for (const m of t.matchAll(/'(ch\d\d\/[\w-]+)'\s*:/g)) visualKeys.add(m[1]);
  } catch {
    /* noop */
  }
}

let errors = 0;
let warnings = 0;
const err = (m: string) => {
  errors++;
  console.log(`✗ ${m}`);
};
const warn = (m: string) => {
  warnings++;
  console.log(`△ ${m}`);
};

const used = new Map<string, string[]>();
const ids = new Set<string>();
for (const {chapter, scene} of allScenes(CHAPTERS)) {
  if (ids.has(scene.id)) err(`${scene.id}: シーン ID が重複`);
  ids.add(scene.id);
  if (!new RegExp(`^c${String(chapter.number).padStart(2, '0')}-s\\d{2}$`).test(scene.id)) warn(`${scene.id}: ID の形式は c${String(chapter.number).padStart(2, '0')}-sNN を推奨`);
  if (!visualKeys.has(scene.visual)) err(`${scene.id}: 図解 "${scene.visual}" が registry に未登録`);
  if (scene.heading && displayWidth(scene.heading) > 28) err(`${scene.id}: 見出しが長すぎる（${displayWidth(scene.heading).toFixed(1)} 字 > 28）: ${scene.heading}`);
  if (scene.layout !== 'full' && !scene.heading) warn(`${scene.id}: 見出しがない`);
  if (!scene.board) warn(`${scene.id}: board（画面・動きの説明）がない`);
  let last = -1;
  scene.lines.forEach((l, i) => {
    if (!l.src || l.src.length === 0) err(`${scene.id} l${i + 1}: src がない`);
    for (const s of l.src ?? []) {
      if (!paraIds.has(s) && !headingIds.has(s) && !extraIds.has(s)) err(`${scene.id} l${i + 1}: 未知の段落 ID "${s}"`);
      used.set(s, [...(used.get(s) ?? []), scene.id]);
    }
    if (typeof l.step === 'number') {
      if (l.step < last) warn(`${scene.id} l${i + 1}: step が ${last} → ${l.step} に戻っている`);
      last = Math.max(last, l.step);
    }
    for (const ss of l.substeps ?? []) last = Math.max(last, ss.step);
    const cards = l.captions ?? splitCaption(l.text);
    for (const c of cards) {
      if (c.length > CAPTION.maxLines) err(`${scene.id} l${i + 1}: 字幕が ${c.length} 行`);
      for (const line of c) if (displayWidth(line) > CAPTION.maxCharsPerLine + 0.5) err(`${scene.id} l${i + 1}: 字幕 1 行が長い: ${line}`);
    }
    if (/[A-Za-z]/.test(l.text) && /https?:/.test(l.text)) err(`${scene.id} l${i + 1}: URL を本編に入れない`);
  });
}

const missing = contentIds.filter((id) => !used.has(id));
console.log('');
console.log(`シーン ${ids.size} / 原文段落 ${contentIds.length} のうち参照済み ${contentIds.length - missing.length}`);
if (missing.length) warn(`未参照の段落: ${missing.join(', ')}`);
console.log(`エラー ${errors} 件 / 警告 ${warnings} 件`);
process.exit(errors ? 1 : 0);

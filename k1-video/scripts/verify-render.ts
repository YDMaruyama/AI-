/**
 * 書き出し結果の検証。npx tsx scripts/verify-render.ts [--nosub]
 *  - 章ごとの mp4 の尺・フレーム数が timeline.json の計算値と一致するか
 *  - 映像・音声のストリームがあるか（音声の長さが映像と大きくずれていないか）
 *  - 全編の尺が章の合計と一致するか
 *  - 先頭・各章の境界（前後）・末尾のフレームを out/checks/ に書き出し、一覧画像を作る
 */
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, rmSync} from 'node:fs';
import path from 'node:path';
import {CHAPTERS} from '../src/data/chapters';
import type {Timeline} from '../src/data/types';
import {VIDEO} from '../src/theme';

const ROOT = path.resolve(__dirname, '..');
const suffix = process.argv.includes('--nosub') ? '_nosub' : '';
const timeline: Timeline = JSON.parse(readFileSync(path.join(ROOT, 'src', 'generated', 'timeline.json'), 'utf8'));
const fps = VIDEO.fps;

const probe = (file: string) => {
  const out = execFileSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames,duration', '-of', 'json', file],
    {encoding: 'utf8'},
  );
  return JSON.parse(out).streams as {codec_type: string; codec_name: string; width?: number; height?: number; r_frame_rate?: string; nb_frames?: string; duration?: string}[];
};

let ok = true;
const fail = (m: string) => {
  ok = false;
  console.log(`✗ ${m}`);
};

let expectedTotal = 0;
const boundaries: {label: string; t: number}[] = [];
for (const c of CHAPTERS) {
  const frames = c.scenes.reduce((a, s) => a + Math.max(1, Math.round(timeline.scenes[s.id].duration * fps)), 0);
  boundaries.push({label: `${c.slug}_start`, t: expectedTotal / fps + 0.6});
  expectedTotal += frames;
  boundaries.push({label: `${c.slug}_end`, t: expectedTotal / fps - 0.5});
  const file = path.join(ROOT, 'out', 'chapters', `K1_${c.slug}${suffix}.mp4`);
  if (!existsSync(file)) {
    fail(`${c.slug}: ${path.relative(ROOT, file)} がない`);
    continue;
  }
  const st = probe(file);
  const v = st.find((s) => s.codec_type === 'video');
  const a = st.find((s) => s.codec_type === 'audio');
  const nb = Number(v?.nb_frames ?? 0);
  const vd = Number(v?.duration ?? 0);
  const ad = Number(a?.duration ?? 0);
  const msg = `${c.slug}: 映像 ${v?.width}x${v?.height} ${v?.r_frame_rate} ${nb} フレーム（期待 ${frames}）／音声 ${a ? `${a.codec_name} ${ad.toFixed(2)}s` : 'なし'}（映像 ${vd.toFixed(2)}s）`;
  if (nb !== frames) fail(msg + ' → フレーム数が一致しない');
  else if (!a) fail(msg + ' → 音声がない');
  else if (Math.abs(ad - vd) > 0.15) fail(msg + ' → 音声と映像の長さがずれている');
  else console.log(`✓ ${msg}`);
}

const full = path.join(ROOT, 'out', `K1_full_preview${suffix}.mp4`);
if (existsSync(full)) {
  const st = probe(full);
  const v = st.find((s) => s.codec_type === 'video');
  const a = st.find((s) => s.codec_type === 'audio');
  const vd = Number(v?.duration ?? 0);
  const exp = expectedTotal / fps;
  const msg = `全編: 映像 ${vd.toFixed(2)}s（期待 ${exp.toFixed(2)}s）／音声 ${a ? `${Number(a.duration).toFixed(2)}s` : 'なし'}`;
  if (Math.abs(vd - exp) > 0.2 || !a) fail(msg);
  else console.log(`✓ ${msg}`);

  // 境界のフレームを書き出す
  const dir = path.join(ROOT, 'out', 'checks');
  if (existsSync(dir)) rmSync(dir, {recursive: true});
  mkdirSync(dir, {recursive: true});
  const shots = [{label: '00_first', t: 0.05}, ...boundaries, {label: 'zz_last', t: exp - 0.1}];
  shots.forEach((b, i) => {
    execFileSync('ffmpeg', ['-v', 'error', '-ss', b.t.toFixed(3), '-i', full, '-frames:v', '1', '-vf', 'scale=640:360', path.join(dir, `${String(i).padStart(2, '0')}_${b.label}.png`)]);
  });
  // 一覧画像（4 列）
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-pattern_type', 'glob', '-i', path.join(dir, '*.png'), '-vf', 'tile=4x6:padding=6:color=white', '-frames:v', '1', path.join(dir, 'boundaries_sheet.png')]);
  console.log(`境界フレーム → ${path.relative(ROOT, dir)}/（${shots.length} 枚と一覧 boundaries_sheet.png）`);
} else {
  fail(`${path.relative(ROOT, full)} がない`);
}
console.log(ok ? '検証 OK' : '検証で問題あり');
process.exit(ok ? 0 : 1);

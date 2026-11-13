/**
 * 仮音声（TTS）を生成する。本収録音声ではない。
 *   npm run tts                 … 変更のあったシーンだけ合成
 *   npm run tts -- --force      … 全シーンを合成し直す
 *   npm run tts -- c03-s02      … 指定シーンだけ
 * 前提：python に pyopenjtalk-plus と numpy（TTS_PYTHON で python のパスを指定可）
 * 出力：public/audio/scenes/<sceneId>.mp3 と .json（行の開始・終了秒）
 */
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {CHAPTERS} from '../src/data/chapters';
import {toReading} from '../src/data/readings';
import {TIMING} from '../src/data/timing';
import {allScenes, lineIdOf} from '../src/data/util';

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'public', 'audio', 'scenes');
const PY = process.env.TTS_PYTHON ?? 'python3';
const SPEED = Number(process.env.TTS_SPEED ?? 0.92);
const force = process.argv.includes('--force');
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));

mkdirSync(OUT, {recursive: true});
const hashFile = path.join(OUT, '_hashes.json');
const hashes: Record<string, string> = existsSync(hashFile) ? JSON.parse(readFileSync(hashFile, 'utf8')) : {};

const jobs = allScenes(CHAPTERS)
  .map(({scene}) => ({
    id: scene.id,
    lines: scene.lines.map((l, i) => ({id: lineIdOf(scene, i), reading: l.reading ?? toReading(l.text)})),
  }))
  .filter((s) => s.lines.length > 0)
  .filter((s) => only.length === 0 || only.includes(s.id));

const todo = jobs.filter((s) => {
  const h = createHash('sha1').update(JSON.stringify({s, SPEED, gap: TIMING.gap})).digest('hex');
  const mp3 = path.join(OUT, `${s.id}.mp3`);
  const fresh = !force && hashes[s.id] === h && existsSync(mp3);
  (s as {hash?: string}).hash = h;
  return !fresh;
});

console.log(`TTS: ${todo.length}/${jobs.length} シーンを合成します（speed=${SPEED}）`);
if (todo.length > 0) {
  execFileSync(PY, [path.join(__dirname, 'tts_openjtalk.py')], {
    input: JSON.stringify({outDir: OUT, gap: TIMING.gap, speed: SPEED, scenes: todo}),
    stdio: ['pipe', 'inherit', 'inherit'],
    maxBuffer: 1024 * 1024 * 64,
  });
  for (const s of todo) {
    const wav = path.join(OUT, `${s.id}.wav`);
    const mp3 = path.join(OUT, `${s.id}.mp3`);
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', wav, '-ac', '1', '-ar', '48000', '-c:a', 'libmp3lame', '-b:a', '96k', mp3]);
    rmSync(wav);
    hashes[s.id] = (s as {hash?: string}).hash!;
  }
  writeFileSync(hashFile, JSON.stringify(hashes, null, 1));
}
console.log('完了。続けて npm run timeline を実行してください。');

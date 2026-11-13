/**
 * scene-data（src/data/chapters/*.ts）から src/generated/timeline.json を作る。
 *
 * 尺の決め方（シーンごとに優先順）：
 *   1. 本収録音声  public/audio/recorded/<sceneId>.(wav|mp3|m4a)
 *      - 同名 .json（{"lines":[{"id","start","end"}]}）があれば行の位置に使う
 *      - なければ行の位置を文字数比で割り当てる（音声は伸縮しない）
 *   2. 仮音声（TTS） public/audio/scenes/<sceneId>.mp3 ＋ <sceneId>.json（npm run tts で生成）
 *   3. 推定  文字数 ÷ TIMING.charsPerSecond（音声なし）
 *
 * 使い方：npm run timeline        （音声があれば使う）
 *         npm run timeline -- --silent  （音声を無視して推定尺で作る）
 */
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {CHAPTERS} from '../src/data/chapters';
import {TIMING} from '../src/data/timing';
import type {Scene, Timeline, TimelineCue, TimelineLine, TimelineScene} from '../src/data/types';
import {allScenes, lineIdOf, spokenLength} from '../src/data/util';
import {splitCaption} from './lib/captions';

const ROOT = path.resolve(__dirname, '..');
const PUB = path.join(ROOT, 'public');
const silent = process.argv.includes('--silent');

const probeDuration = (file: string): number => {
  const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], {
    encoding: 'utf8',
  });
  return parseFloat(out.trim());
};

const findAudio = (dir: string, id: string) => {
  for (const ext of ['wav', 'mp3', 'm4a', 'aac']) {
    const p = path.join(PUB, 'audio', dir, `${id}.${ext}`);
    if (existsSync(p)) return p;
  }
  return null;
};

type Align = {lines: {id: string; start: number; end: number}[]};

const proportional = (scene: Scene, total: number, gap: number): TimelineLine[] => {
  const lens = scene.lines.map((l) => Math.max(1, spokenLength(l.text)));
  const speech = Math.max(0.1, total - gap * Math.max(0, scene.lines.length - 1));
  const sum = lens.reduce((a, b) => a + b, 0);
  let t = 0;
  return scene.lines.map((l, i) => {
    const d = (lens[i] / sum) * speech;
    const line = {id: lineIdOf(scene, i), start: t, end: t + d};
    t += d + gap;
    return line;
  });
};

const buildScene = (scene: Scene): TimelineScene => {
  const tail = scene.tail ?? TIMING.tail;
  let timing: TimelineScene['timing'] = 'estimate';
  let audio: string | null = null;
  let audioDur = 0;
  let lines: TimelineLine[] = [];

  const recorded = silent ? null : findAudio('recorded', scene.id);
  const tts = silent ? null : findAudio('scenes', scene.id);
  const ttsAlign = path.join(PUB, 'audio', 'scenes', `${scene.id}.json`);

  if (recorded) {
    timing = 'recorded';
    audio = path.relative(PUB, recorded).split(path.sep).join('/');
    audioDur = probeDuration(recorded);
    const alignPath = recorded.replace(/\.[a-z0-9]+$/, '.json');
    if (existsSync(alignPath)) {
      const a: Align = JSON.parse(readFileSync(alignPath, 'utf8'));
      lines = scene.lines.map((_, i) => {
        const hit = a.lines.find((x) => x.id === lineIdOf(scene, i)) ?? a.lines[i];
        return {id: lineIdOf(scene, i), start: hit.start, end: hit.end};
      });
    } else {
      lines = proportional(scene, audioDur, 0.4);
    }
  } else if (tts && existsSync(ttsAlign) && scene.lines.length > 0) {
    const a: Align = JSON.parse(readFileSync(ttsAlign, 'utf8'));
    if (a.lines.length === scene.lines.length) {
      timing = 'tts';
      audio = path.relative(PUB, tts).split(path.sep).join('/');
      audioDur = probeDuration(tts);
      lines = a.lines.map((x, i) => ({id: lineIdOf(scene, i), start: x.start, end: x.end}));
    } else {
      console.warn(`! ${scene.id}: TTS の行数（${a.lines.length}）が台本（${scene.lines.length}）と違うため推定尺を使います。npm run tts を再実行してください。`);
    }
  }

  if (timing === 'estimate') {
    let t = 0;
    lines = scene.lines.map((l, i) => {
      const d = Math.max(1.2, spokenLength(l.text) / TIMING.charsPerSecond);
      const line = {id: lineIdOf(scene, i), start: t, end: t + d};
      t += d + TIMING.gap;
      return line;
    });
    audioDur = lines.length ? lines[lines.length - 1].end : 0;
  }

  // シーン内の絶対秒に変換（音声は leadIn から始まる）
  const offset = scene.lines.length ? TIMING.leadIn : 0;
  const absLines = lines.map((l) => ({id: l.id, start: +(l.start + offset).toFixed(3), end: +(l.end + offset).toFixed(3)}));
  const speechEnd = Math.max(offset + audioDur, absLines.length ? absLines[absLines.length - 1].end : 0);
  const duration = +Math.max(scene.minDuration ?? TIMING.minScene, speechEnd + tail).toFixed(3);

  // 字幕
  const cues: TimelineCue[] = [];
  scene.lines.forEach((l, i) => {
    const cards = l.captions ?? splitCaption(l.text);
    const span = absLines[i];
    const weights = cards.map((c) => Math.max(1, spokenLength(c.join(''))));
    const sum = weights.reduce((a, b) => a + b, 0);
    let t = span.start;
    cards.forEach((c, k) => {
      const d = ((span.end - span.start) * weights[k]) / sum;
      cues.push({lines: c, start: +t.toFixed(3), end: +(t + d).toFixed(3), lineId: span.id});
      t += d;
    });
  });

  // 図の段階
  const steps: {step: number; at: number}[] = [{step: 0, at: 0}];
  scene.lines.forEach((l, i) => {
    const span = absLines[i];
    if (typeof l.step === 'number') steps.push({step: l.step, at: i === 0 ? Math.min(span.start, 0.2) : span.start});
    for (const s of l.substeps ?? []) {
      steps.push({step: s.step, at: +(span.start + (span.end - span.start) * s.at).toFixed(3)});
    }
  });
  steps.sort((a, b) => a.at - b.at);

  return {id: scene.id, duration, audio, audioOffset: offset, timing, lines: absLines, cues, steps};
};

const main = () => {
  const scenes: Record<string, TimelineScene> = {};
  const ids = new Set<string>();
  let total = 0;
  const counts = {tts: 0, recorded: 0, estimate: 0};
  for (const {scene} of allScenes(CHAPTERS)) {
    if (ids.has(scene.id)) throw new Error(`シーン ID が重複しています: ${scene.id}`);
    ids.add(scene.id);
    const ts = buildScene(scene);
    scenes[scene.id] = ts;
    total += ts.duration;
    counts[ts.timing]++;
  }
  const mode = counts.recorded ? (counts.estimate || counts.tts ? 'mixed' : 'recorded') : counts.tts ? (counts.estimate ? 'mixed' : 'tts') : 'estimate';
  const timeline: Timeline = {generatedAt: new Date().toISOString(), mode, totalSeconds: +total.toFixed(3), scenes};
  mkdirSync(path.join(ROOT, 'src', 'generated'), {recursive: true});
  writeFileSync(path.join(ROOT, 'src', 'generated', 'timeline.json'), JSON.stringify(timeline, null, 1));
  const m = Math.floor(total / 60);
  const s = Math.round(total % 60);
  console.log(`timeline.json: ${ids.size} シーン / ${m}分${s}秒 / mode=${mode} (tts=${counts.tts}, recorded=${counts.recorded}, estimate=${counts.estimate})`);
};

main();

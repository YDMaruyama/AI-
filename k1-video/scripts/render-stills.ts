/**
 * 確認用の静止画を書き出す（文字切れ・重なり・矢印の接続を目視確認するため）。
 *   npm run stills                       … 全シーン
 *   npm run stills -- c03-s02 c06-s01    … 指定シーン
 *   npm run stills -- --chapter ch03     … 章単位
 *   オプション: --scale 0.5（既定）, --mid（各段階の中間状態も出す）, --out out/stills
 * 各シーンについて「各 step の表示完了時点」と「シーン終盤」を出力する。
 * --mid を付けると、各 step の開始 0.25 秒後（アニメーション途中）も出力する。
 */
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
import {CHAPTERS} from '../src/data/chapters';
import type {Timeline} from '../src/data/types';
import {VIDEO} from '../src/theme';
import {browserExecutable} from './lib/browser';

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const opt = (name: string, def: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
};
const scale = Number(opt('--scale', '0.5'));
const outDir = path.resolve(ROOT, opt('--out', 'out/stills'));
const chapterFilter = opt('--chapter', '');
const withMid = args.includes('--mid');
const noSub = args.includes('--nosub');
const valueArgs = new Set(['--scale', '--out', '--chapter']);
const ids = args.filter((a, i) => !a.startsWith('--') && !valueArgs.has(args[i - 1] ?? ''));

const main = async () => {
  // timeline.json は毎回読み直す（bundle 前に npm run timeline 済みであること）
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const timeline: Timeline = require('../src/generated/timeline.json');
  const fps = VIDEO.fps;
  const jobs: {file: string; frame: number}[] = [];
  let offset = 0;
  for (const ch of CHAPTERS) {
    for (const sc of ch.scenes) {
      const tl = timeline.scenes[sc.id];
      const frames = Math.max(1, Math.round(tl.duration * fps));
      const wanted = (ids.length === 0 || ids.includes(sc.id)) && (!chapterFilter || chapterFilter === ch.id);
      if (wanted) {
        const steps = [...new Map(tl.steps.map((s) => [s.step, s])).values()].sort((a, b) => a.at - b.at);
        for (const s of steps) {
          const done = Math.min(frames - 20, Math.round((s.at + 1.3) * fps));
          jobs.push({file: `${sc.id}_step${s.step}.png`, frame: offset + Math.max(0, done)});
          if (withMid) {
            const mid = Math.min(frames - 20, Math.round((s.at + 0.25) * fps));
            jobs.push({file: `${sc.id}_step${s.step}_mid.png`, frame: offset + Math.max(0, mid)});
          }
        }
        jobs.push({file: `${sc.id}_end.png`, frame: offset + Math.max(0, frames - Math.round(0.5 * fps))});
      }
      offset += frames;
    }
  }
  if (jobs.length === 0) {
    console.log('対象のシーンがありません');
    return;
  }
  mkdirSync(outDir, {recursive: true});
  console.log(`bundling… (${jobs.length} stills)`);
  const serveUrl = await bundle({entryPoint: path.join(ROOT, 'src', 'index.ts'), publicDir: path.join(ROOT, 'public')});
  const compId = noSub ? 'K1-Full-NoSub' : 'K1-Full';
  const browser = await openBrowser('chrome', {browserExecutable, logLevel: 'error'});
  const composition = await selectComposition({serveUrl, id: compId, inputProps: {showCaptions: !noSub}, browserExecutable, puppeteerInstance: browser, logLevel: 'error'});
  for (const j of jobs) {
    await renderStill({
      composition,
      serveUrl,
      output: path.join(outDir, j.file),
      frame: Math.min(j.frame, composition.durationInFrames - 1),
      scale,
      inputProps: {showCaptions: !noSub},
      imageFormat: 'png',
      browserExecutable,
      puppeteerInstance: browser,
      logLevel: 'error',
    });
    console.log(`  ${j.file}  (frame ${j.frame})`);
  }
  await browser.close({silent: true});
  console.log(`→ ${path.relative(ROOT, outDir)}`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

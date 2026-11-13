/**
 * 動画の書き出し。
 *   npm run render:chapters                 … 章ごと（字幕あり）→ out/chapters/K1_ChNN.mp4
 *   npm run render:preview                  … 章ごとに書き出してから連結 → out/K1_full_preview.mp4
 *   オプション：
 *     --nosub        字幕なし版（ファイル名に _nosub）
 *     --only Ch03    指定した章だけ（カンマ区切り可）
 *     --scale 0.5    解像度の倍率（確認用に軽くしたい場合）
 *     --crf 20       画質（小さいほど高画質）
 *     --concurrency 2
 *     --force        既存ファイルがあっても書き出し直す
 * 章ごとに書き出すので、途中で止まっても同じコマンドで続きから再開できる。
 */
import {bundle} from '@remotion/bundler';
import {openBrowser, renderMedia, selectComposition} from '@remotion/renderer';
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, renameSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {CHAPTERS} from '../src/data/chapters';
import {browserExecutable} from './lib/browser';

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const mode = args[0] ?? 'preview';
const opt = (name: string, def?: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
};
const noSub = args.includes('--nosub');
const force = args.includes('--force');
const scale = Number(opt('--scale', '1'));
const crf = Number(opt('--crf', '20'));
const concurrency = Number(opt('--concurrency', '2'));
const only = opt('--only')?.split(',');
const suffix = noSub ? '_nosub' : '';

const main = async () => {
  const chapters = CHAPTERS.filter((c) => !only || only.includes(c.slug));
  const outDir = path.join(ROOT, 'out', 'chapters');
  mkdirSync(outDir, {recursive: true});
  console.log('bundling…');
  const serveUrl = await bundle({entryPoint: path.join(ROOT, 'src', 'index.ts'), publicDir: path.join(ROOT, 'public')});
  const browser = await openBrowser('chrome', {browserExecutable, logLevel: 'error'});
  const files: string[] = [];
  for (const c of chapters) {
    const out = path.join(outDir, `K1_${c.slug}${suffix}.mp4`);
    files.push(out);
    if (existsSync(out) && !force) {
      console.log(`skip ${path.relative(ROOT, out)}（既存。--force で書き直し）`);
      continue;
    }
    const inputProps = {chapterIds: [c.id], showCaptions: !noSub};
    const composition = await selectComposition({serveUrl, id: `K1-${c.slug}`, inputProps, browserExecutable, puppeteerInstance: browser, logLevel: 'error'});
    const tmp = out.replace(/\.mp4$/, '.part.mp4');
    const t0 = Date.now();
    let last = -1;
    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      crf,
      scale,
      pixelFormat: 'yuv420p',
      audioCodec: 'aac',
      audioBitrate: '128k',
      outputLocation: tmp,
      inputProps,
      concurrency,
      browserExecutable,
      puppeteerInstance: browser,
      logLevel: 'error',
      onProgress: ({progress}) => {
        const pct = Math.floor(progress * 100);
        if (pct % 10 === 0 && pct !== last) {
          last = pct;
          console.log(`  ${c.slug} ${pct}%  (${Math.round((Date.now() - t0) / 1000)}s)`);
        }
      },
    });
    renameSync(tmp, out);
    console.log(`✓ ${path.relative(ROOT, out)}  ${composition.durationInFrames} frames  ${Math.round((Date.now() - t0) / 1000)}s`);
  }
  await browser.close({silent: true});

  if (mode === 'preview' && !only) {
    const list = path.join(outDir, `concat${suffix}.txt`);
    writeFileSync(list, files.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'));
    const full = path.join(ROOT, 'out', `K1_full_preview${suffix}.mp4`);
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', full], {stdio: 'inherit'});
    console.log(`✓ ${path.relative(ROOT, full)}`);
  }
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

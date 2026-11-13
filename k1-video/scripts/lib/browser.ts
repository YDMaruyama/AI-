import {existsSync} from 'node:fs';

/**
 * レンダリングに使うブラウザ。
 * REMOTION_BROWSER が指定されていればそれを使い、なければこの制作環境に同梱の
 * chrome-headless-shell を使う。どちらもなければ null（Remotion が自動で取得する）。
 */
const CANDIDATES = [
  process.env.REMOTION_BROWSER,
  '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',
].filter(Boolean) as string[];

export const browserExecutable: string | null = CANDIDATES.find((p) => existsSync(p)) ?? null;

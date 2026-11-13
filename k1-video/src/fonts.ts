import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

/**
 * Noto Sans JP（SIL Open Font License 1.1。public/fonts/OFL.txt）。
 * Google Fonts 配布の静的 TTF を同梱し、レンダリング時にネットワークへ依存しない。
 * loadFont はフォントの読み込みが終わるまでレンダリングを待機させる。
 */
export const FONT_FAMILY = 'Noto Sans JP';

let loaded = false;
export const ensureFonts = () => {
  if (loaded) return;
  loaded = true;
  for (const [file, weight] of [
    ['NotoSansJP-Regular.ttf', '400'],
    ['NotoSansJP-Medium.ttf', '500'],
    ['NotoSansJP-Bold.ttf', '700'],
  ] as const) {
    loadFont({family: FONT_FAMILY, url: staticFile(`fonts/${file}`), weight, format: 'truetype'}).catch((err) => {
      console.error('font load failed', file, err);
      throw err;
    });
  }
};

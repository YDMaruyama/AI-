// Remotion CLI 設定（https://www.remotion.dev/docs/config）
import {Config} from '@remotion/cli/config';
import {browserExecutable} from './scripts/lib/browser';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');
// 静的な図解が中心のため、CRF をやや高めにしてファイルサイズを抑える
Config.setCrf(20);

// この制作環境ではブラウザの自動ダウンロードができないため、同梱の headless shell を使う。
// 別の環境では REMOTION_BROWSER を指定するか、何も置かなければ Remotion が自動取得する。
if (browserExecutable) {
  Config.setBrowserExecutable(browserExecutable);
}

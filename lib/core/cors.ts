/**
 * CORSヘルパー
 * 全エンドポイントの `Access-Control-Allow-Origin: *` を置き換え
 */

const ALLOWED_ORIGINS = [
  'https://ai-secretary-line.vercel.app',
  'https://liff.line.me',
];

// Vercel Preview URLにも対応
if (process.env.VERCEL_URL) {
  ALLOWED_ORIGINS.push(`https://${process.env.VERCEL_URL}`);
}

export function setCors(req: any, res: any): void {
  const origin = req.headers?.origin || '';
  if (ALLOWED_ORIGINS.some(o => origin === o || origin.endsWith('.vercel.app'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}

/** OPTIONS preflight を処理して true を返す（該当時のみ） */
export function handlePreflight(req: any, res: any): boolean {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

/**
 * 環境変数・定数の一元管理
 * requireEnv: 必須変数（未設定時は起動エラー）
 * optionalEnv: 任意変数（フォールバック付き）
 */

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

/** 本番ではenv必須、ローカルのみデフォルト許可 */
function requireEnvOnVercel(key: string, devFallback: string): string {
  const val = process.env[key];
  if (val) return val;
  if (process.env.VERCEL) {
    console.warn(`[SECURITY] ${key} is using default value on Vercel! Set it in environment variables.`);
  }
  return devFallback;
}

/** 遅延評価でアクセス時にenv読み込み */
export const env = {
  // Supabase
  get SUPABASE_URL() { return requireEnv('SUPABASE_URL'); },
  get SUPABASE_SERVICE_ROLE_KEY() { return requireEnv('SUPABASE_SERVICE_ROLE_KEY'); },

  // LINE
  get LINE_CHANNEL_ACCESS_TOKEN() { return requireEnv('LINE_CHANNEL_ACCESS_TOKEN'); },
  get LINE_CHANNEL_SECRET() { return requireEnv('LINE_CHANNEL_SECRET'); },

  // Gemini
  get GEMINI_API_KEY() { return requireEnv('GEMINI_API_KEY'); },

  // GAS
  get GAS_CALENDAR_URL() { return process.env.GAS_CALENDAR_URL || ''; },

  // Admin認証（必ず環境変数で設定すること。ローカルでも .env から読む）
  get ADMIN_PASSWORD() { return requireEnvOnVercel('ADMIN_PASSWORD', ''); },
  get MANAGER_PASSWORD() { return requireEnvOnVercel('MANAGER_PASSWORD', ''); },
  get STAFF_PASSWORD() { return requireEnvOnVercel('STAFF_PASSWORD', ''); },

  // Notion
  get NOTION_API_KEY() { return process.env.NOTION_API_KEY || ''; },

  // Webhook
  get WEBHOOK_SECRET() { return process.env.WEBHOOK_SECRET || ''; },

  // 通知先メール
  get NOTIFICATION_EMAIL() { return optionalEnv('NOTIFICATION_EMAIL', 'salt.nbase@gmail.com'); },
} as const;

// ── 定数 ──
export const GEMINI_MODEL = 'gemini-2.5-flash';
export const LINE_MESSAGE_MAX_LENGTH = 5000;
export const CONVERSATION_TIMEOUT_MINUTES = 30;
export const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

// ── 経費カテゴリ ──
export const EXPENSE_CATEGORIES = [
  '交通費', '消耗品', '食費', '通信費', '備品',
  '会議費', '接待交際費', '研修費', '水道光熱費', '外注費', 'その他',
] as const;
export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

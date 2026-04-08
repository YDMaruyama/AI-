/**
 * 構造化ログ
 * console.error散在を統一し、Vercelログ検索を容易にする
 */

type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  ctx: string;
  msg: string;
  ts: string;
  [key: string]: any;
}

export function log(level: LogLevel, ctx: string, msg: string, data?: Record<string, any>): void {
  const entry: LogEntry = {
    level,
    ctx,
    msg,
    ts: new Date().toISOString(),
    ...(data || {}),
  };
  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  info: (ctx: string, msg: string, data?: Record<string, any>) => log('info', ctx, msg, data),
  warn: (ctx: string, msg: string, data?: Record<string, any>) => log('warn', ctx, msg, data),
  error: (ctx: string, msg: string, data?: Record<string, any>) => log('error', ctx, msg, data),
};

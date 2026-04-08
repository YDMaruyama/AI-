/**
 * GAS (Google Apps Script) スプレッドシート出力ヘルパー
 * expense, cashbox, sales の4箇所で重複していたGAS連携を統一
 */
import { env } from './config';

export interface GasExportOptions {
  title: string;
  csv: string;
  sendEmail?: boolean;
}

export interface GasExportResult {
  url?: string;
  emailSent?: boolean;
  emailTo?: string;
}

/** GASにスプレッドシート作成（+メール送信）を依頼 */
export async function exportToSpreadsheet(options: GasExportOptions): Promise<GasExportResult | null> {
  const gasUrl = env.GAS_CALENDAR_URL;
  if (!gasUrl) return null;

  const action = options.sendEmail ? 'create_spreadsheet_and_email' : 'create_spreadsheet';
  const res = await fetch(gasUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action,
      title: options.title,
      csv: options.csv,
      email: env.NOTIFICATION_EMAIL,
    }),
  });

  if (!res.ok) {
    console.error(`[GAS] Export failed: ${res.status}`);
    return null;
  }

  const result = await res.json();
  return {
    url: result.url,
    emailSent: action === 'create_spreadsheet_and_email',
    emailTo: env.NOTIFICATION_EMAIL,
  };
}

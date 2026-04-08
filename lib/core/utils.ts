import { JST_OFFSET_MS } from './config';

/** 日本時間の今日の日付 YYYY-MM-DD */
export function getToday(): string {
  const jst = new Date(Date.now() + JST_OFFSET_MS);
  return jst.toISOString().split('T')[0];
}

/** 日本時間の現在時刻 */
export function getNowJST(): Date {
  return new Date(Date.now() + JST_OFFSET_MS);
}

/** 月初 YYYY-MM-01 */
export function getMonthStart(date?: string): string {
  const d = date || getToday();
  return d.substring(0, 7) + '-01';
}

/** 翌月初 */
export function getNextMonthStart(date?: string): string {
  const base = date || getToday();
  const [y, m] = base.split('-').map(Number);
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  return `${ny}-${String(nm).padStart(2, '0')}-01`;
}

/** N日前の日付 */
export function getDaysAgo(days: number): string {
  const d = new Date(Date.now() + JST_OFFSET_MS - days * 86400000);
  return d.toISOString().split('T')[0];
}

/** N日後の日付 */
export function getDaysLater(days: number): string {
  const d = new Date(Date.now() + JST_OFFSET_MS + days * 86400000);
  return d.toISOString().split('T')[0];
}

/** N ヶ月前の日付 */
export function getMonthsAgo(months: number): string {
  const now = getNowJST();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() - months;
  const d = now.getUTCDate();
  return new Date(Date.UTC(y, m, d)).toISOString().split('T')[0];
}

/** テキストから日付を解析 */
export function parseDate(text: string): string | null {
  const today = getNowJST();
  const yyyy = today.getUTCFullYear();
  const mm = today.getUTCMonth();
  const dd = today.getUTCDate();

  if (text.includes('今日')) return getToday();
  if (text.includes('昨日')) return new Date(Date.UTC(yyyy, mm, dd - 1)).toISOString().split('T')[0];
  if (text.includes('一昨日') || text.includes('おととい')) return new Date(Date.UTC(yyyy, mm, dd - 2)).toISOString().split('T')[0];

  // 「2024-03-28」パターン
  const m0 = text.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m0) return m0[0];

  // 「3月28日」パターン
  const m1 = text.match(/(\d{1,2})月(\d{1,2})日/);
  if (m1) {
    const mo = parseInt(m1[1], 10) - 1;
    const da = parseInt(m1[2], 10);
    return new Date(Date.UTC(yyyy, mo, da)).toISOString().split('T')[0];
  }

  // 「3/28」パターン
  const m2 = text.match(/(\d{1,2})\/(\d{1,2})/);
  if (m2) {
    const mo = parseInt(m2[1], 10) - 1;
    const da = parseInt(m2[2], 10);
    return new Date(Date.UTC(yyyy, mo, da)).toISOString().split('T')[0];
  }

  return null;
}

/** ロール表示名 */
export function roleName(role: string): string {
  if (role === 'owner') return '社長';
  if (role === 'manager') return '管理者';
  return 'スタッフ';
}

/** 月間合計（expenses/cashboxなど汎用） */
export async function getMonthTotal(
  supabase: any,
  table: string,
  userId: string,
  date?: string,
  amountField: string = 'amount',
  dateField: string = 'expense_date'
): Promise<number> {
  const monthStart = getMonthStart(date);
  const nextMonth = getNextMonthStart(date);
  const { data } = await supabase
    .from(table)
    .select(amountField)
    .eq('user_id', userId)
    .gte(dateField, monthStart)
    .lt(dateField, nextMonth);
  if (!data) return 0;
  return data.reduce((sum: number, row: any) => sum + Number(row[amountField] || 0), 0);
}

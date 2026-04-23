/**
 * 共通テキスト処理ヘルパー
 * 名前検索・日付解析など、複数スキルで使う処理を集約
 */

// ── 敬称・役職の除去 ──

const TITLE_REGEX = /(社長|会長|オーナー|管理者|マネージャー|店長|スタッフ|職員|先生|部長|課長|係長|主任|代表|取締役|さん|様|氏|くん|ちゃん|殿)/g;

const ROLE_MAP: Record<string, string> = {
  社長: 'owner', 会長: 'owner', オーナー: 'owner', 代表: 'owner', 取締役: 'owner',
  管理者: 'manager', マネージャー: 'manager', 店長: 'manager',
  スタッフ: 'staff', 職員: 'staff',
};

/**
 * 敬称・役職を除去して核の名前を返す
 * 例: "佐々木社長" → "佐々木", "田中さん" → "田中"
 */
export function stripHonorifics(text: string): string {
  return text.replace(TITLE_REGEX, '').trim();
}

/**
 * テキストから役職キーワードを検出してroleを返す
 * 例: "社長" → "owner", "店長" → "manager"
 * 見つからなければ null
 */
export function detectRole(text: string): string | null {
  for (const [kw, role] of Object.entries(ROLE_MAP)) {
    if (text.includes(kw)) return role;
  }
  return null;
}

/**
 * 名前検索の前処理をまとめて実行
 * @returns { coreName, role } coreNameは敬称除去後の名前、roleは検出された役職
 */
export function parseNameQuery(raw: string): { coreName: string; role: string | null } {
  return {
    coreName: stripHonorifics(raw),
    role: detectRole(raw),
  };
}

// ── 柔軟な期間パラメータ解析 ──

/**
 * 自然言語の期間指定を { fromDate, toDate, label } に変換
 * 対応: today, this_month, last_month, 先々月, 3月, 来月, 先週, 今週
 * 未知の文字列はnullを返す（呼び出し側でデフォルト処理）
 */
export function parseFlexiblePeriod(input: string, baseDate?: string): { fromDate: string; toDate: string; label: string } | null {
  const today = baseDate || new Date(Date.now() + 9 * 3600000).toISOString().split('T')[0];
  const [y, m, d] = today.split('-').map(Number);

  const monthRange = (year: number, month: number) => {
    const from = `${year}-${String(month).padStart(2, '0')}-01`;
    const nextM = month + 1 > 12 ? 1 : month + 1;
    const nextY = month + 1 > 12 ? year + 1 : year;
    const to = `${nextY}-${String(nextM).padStart(2, '0')}-01`;
    return { fromDate: from, toDate: to };
  };

  // 固定文字列
  if (input === 'today' || input === '今日') {
    // 半開区間 [today, tomorrow) でDBクエリに対応
    const nextDay = new Date(new Date(`${today}T00:00:00+09:00`).getTime() + 86400000);
    const nextDayStr = nextDay.toISOString().split('T')[0];
    return { fromDate: today, toDate: nextDayStr, label: `${m}/${d}` };
  }
  if (input === 'this_month' || input === '今月') {
    return { ...monthRange(y, m), label: `${m}月` };
  }
  if (input === 'last_month' || input === '先月' || input === '前月') {
    const lm = m - 1 <= 0 ? 12 : m - 1;
    const ly = m - 1 <= 0 ? y - 1 : y;
    return { ...monthRange(ly, lm), label: `${lm}月` };
  }
  if (input === '先々月' || input === '2ヶ月前') {
    let tm = m - 2; let ty = y;
    if (tm <= 0) { tm += 12; ty--; }
    return { ...monthRange(ty, tm), label: `${tm}月` };
  }
  if (input === '来月') {
    const nm = m + 1 > 12 ? 1 : m + 1;
    const ny = m + 1 > 12 ? y + 1 : y;
    return { ...monthRange(ny, nm), label: `${nm}月` };
  }

  // 「3月」「12月」等の月指定
  const monthMatch = input.match(/(\d{1,2})月/);
  if (monthMatch) {
    const targetM = parseInt(monthMatch[1]);
    if (targetM >= 1 && targetM <= 12) {
      // 未来の月なら前年とみなす
      const targetY = targetM > m ? y - 1 : y;
      return { ...monthRange(targetY, targetM), label: `${targetM}月` };
    }
  }

  // 「先週」「今週」
  const dayOfWeek = new Date(today).getDay();
  if (input === '今週' || input === 'this_week') {
    const start = new Date(new Date(today).getTime() - dayOfWeek * 86400000);
    const end = new Date(start.getTime() + 7 * 86400000);
    return { fromDate: start.toISOString().split('T')[0], toDate: end.toISOString().split('T')[0], label: '今週' };
  }
  if (input === '先週' || input === 'last_week') {
    const start = new Date(new Date(today).getTime() - (dayOfWeek + 7) * 86400000);
    const end = new Date(start.getTime() + 7 * 86400000);
    return { fromDate: start.toISOString().split('T')[0], toDate: end.toISOString().split('T')[0], label: '先週' };
  }

  return null; // 不明 → 呼び出し側でデフォルト処理
}

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

/**
 * 管理画面認証
 * Base64(password:role) → HMAC-SHA256署名付きトークン
 */
import crypto from 'crypto';
import { env } from './config';
import type { AdminRole } from './types';

interface PasswordEntry {
  role: AdminRole;
  name: string;
}

/** パスワード → ロールマップ（遅延評価） */
function getPasswordRoles(): Record<string, PasswordEntry> {
  const map: Record<string, PasswordEntry> = {};
  if (env.ADMIN_PASSWORD) map[env.ADMIN_PASSWORD] = { role: 'owner', name: '社長' };
  if (env.MANAGER_PASSWORD) map[env.MANAGER_PASSWORD] = { role: 'manager', name: '管理者' };
  if (env.STAFF_PASSWORD) map[env.STAFF_PASSWORD] = { role: 'staff', name: 'スタッフ' };
  return map;
}

/** HMAC-SHA256シークレット（AUTH_SECRET推奨、なければパスワード組合せのハッシュ） */
function getSecret(): string {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  // パスワード組合せからシークレットを導出（推測困難にする）
  const raw = `${env.ADMIN_PASSWORD}:${env.MANAGER_PASSWORD}:${env.STAFF_PASSWORD}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

// ── トークン（24時間有効、HMAC署名付き） ──

interface TokenPayload {
  role: AdminRole;
  exp: number;
}

/** トークン生成 */
export function generateToken(role: AdminRole): string {
  const payload: TokenPayload = {
    role,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24時間
  };
  const data = JSON.stringify(payload);
  const sig = crypto.createHmac('sha256', getSecret()).update(data).digest('hex');
  return Buffer.from(JSON.stringify({ data, sig })).toString('base64');
}

/** トークン検証 */
export function verifyToken(authHeader: string): { valid: boolean; role: AdminRole; expired: boolean } {
  const invalid = { valid: false, role: 'staff' as AdminRole, expired: false };
  try {
    const raw = authHeader.replace(/^(Bearer|Basic)\s+/i, '').trim();
    if (!raw) return invalid;

    // 新形式トークン（HMAC署名付き）
    const decoded = Buffer.from(raw, 'base64').toString();
    const parsed = JSON.parse(decoded);
    if (parsed.data && parsed.sig) {
      const expectedSig = crypto.createHmac('sha256', getSecret()).update(parsed.data).digest('hex');
      if (!crypto.timingSafeEqual(Buffer.from(parsed.sig), Buffer.from(expectedSig))) {
        return invalid;
      }
      const payload: TokenPayload = JSON.parse(parsed.data);
      if (Date.now() > payload.exp) return { valid: false, role: payload.role, expired: true };
      return { valid: true, role: payload.role, expired: false };
    }

    // 後方互換: 旧形式（password:role または パスワード単体）
    const parts = decoded.split(':');
    const passwordRoles = getPasswordRoles();
    if (parts.length >= 2) {
      const [password, role] = parts;
      if (passwordRoles[password] && passwordRoles[password].role === role) {
        return { valid: true, role: role as AdminRole, expired: false };
      }
    }
    if (passwordRoles[decoded]) {
      return { valid: true, role: passwordRoles[decoded].role, expired: false };
    }

    return invalid;
  } catch {
    return invalid;
  }
}

/** パスワードでログイン → トークン発行 */
export function authenticate(password: string): { token: string; role: AdminRole; name: string } | null {
  const passwordRoles = getPasswordRoles();
  const match = passwordRoles[password];
  if (!match) return null;
  return {
    token: generateToken(match.role),
    role: match.role,
    name: match.name,
  };
}

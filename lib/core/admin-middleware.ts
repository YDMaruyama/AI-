/**
 * 管理画面エンドポイント共通ラッパー
 * CORS → OPTIONS → 認証 → ビジネスロジック のボイラープレートを統一
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AdminRole } from './types';
import { setCors, handlePreflight } from './cors';
import { verifyToken } from './auth';
import { getSupabase } from './supabase';
import { logger } from './logger';

type AdminHandler = (
  req: VercelRequest,
  res: VercelResponse,
  supabase: SupabaseClient,
  role: AdminRole
) => Promise<void | any>;

interface WithAdminOptions {
  /** 許可するロール（デフォルト: 全ロール） */
  allowedRoles?: AdminRole[];
}

/** 管理画面エンドポイントラッパー */
export function withAdmin(handler: AdminHandler, options?: WithAdminOptions) {
  return async (req: VercelRequest, res: VercelResponse) => {
    setCors(req, res);
    if (handlePreflight(req, res)) return;

    // 認証
    const auth = verifyToken(req.headers.authorization || '');
    if (!auth.valid) {
      const msg = auth.expired ? 'Token expired' : 'Unauthorized';
      return res.status(401).json({ status: 'error', error: msg });
    }

    // ロールチェック
    if (options?.allowedRoles && !options.allowedRoles.includes(auth.role)) {
      return res.status(403).json({ status: 'error', error: 'Forbidden' });
    }

    const supabase = getSupabase();
    try {
      await handler(req, res, supabase, auth.role);
    } catch (e: any) {
      logger.error('admin', e.message || 'Unknown error', { path: req.url });
      return res.status(500).json({ status: 'error', error: 'Internal server error' });
    }
  };
}

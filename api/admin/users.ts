import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AdminRole } from '../../lib/core/types';
import { withAdmin } from '../../lib/core/admin-middleware';
import { linePush } from '../../lib/core/line';
import { env } from '../../lib/core/config';
import { logger } from '../../lib/core/logger';
import crypto from 'crypto';

async function handler(req: VercelRequest, res: VercelResponse, supabase: SupabaseClient, _role: AdminRole) {
  // GET: ユーザー一覧（フィルタ対応）
  if (req.method === 'GET') {
    const { role: filterRole, is_active, search } = req.query || {};

    let query = supabase.from('users').select('*');

    if (filterRole && typeof filterRole === 'string') {
      query = query.eq('role', filterRole);
    }
    if (is_active !== undefined && is_active !== '') {
      query = query.eq('is_active', is_active === 'true');
    }
    if (search && typeof search === 'string') {
      query = query.or(`display_name.ilike.%${search}%,line_display_name.ilike.%${search}%,job_description.ilike.%${search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return res.status(200).json(data || []);
  }

  // POST: スタッフ手動追加（LINE未連携）
  if (req.method === 'POST') {
    const { display_name, role, job_description, email, phone } = req.body || {};

    if (!display_name || !display_name.trim()) {
      return res.status(400).json({ error: '名前は必須です' });
    }

    const validRoles = ['owner', 'manager', 'staff'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ error: '無効なロールです' });
    }

    const uid = `admin_${crypto.randomUUID()}`;
    const newUser: any = {
      display_name: display_name.trim(),
      line_display_name: display_name.trim(),
      line_user_id: uid,
      role: role || 'staff',
      is_active: true,
    };
    if (job_description) newUser.job_description = job_description;
    if (email) newUser.email = email;
    if (phone) newUser.phone = phone;

    const { data, error } = await supabase
      .from('users')
      .insert(newUser)
      .select()
      .single();

    if (error) throw error;

    logger.info('admin/users', 'Staff created manually', { id: data.id, name: display_name });
    return res.status(201).json(data);
  }

  // PUT: ユーザー更新
  if (req.method === 'PUT') {
    const { userId, role, display_name, is_active, job_description, email, phone } = req.body || {};

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const updates: any = {};
    if (role !== undefined) updates.role = role;
    if (display_name !== undefined) updates.display_name = display_name;
    if (is_active !== undefined) updates.is_active = is_active;
    if (job_description !== undefined) updates.job_description = job_description;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // 更新前のユーザー情報を取得（ロール変更通知用）
    const { data: beforeUser } = await supabase
      .from('users')
      .select('role, line_user_id, display_name')
      .eq('id', userId)
      .single();

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // ロールが変更された場合、LINEで本人に通知
    // 管理者（admin dashboard操作者）には通知しない＝管理画面ログインロールは別概念
    // owner/manager/staff 全員に通知する（LINE連携済みの場合）
    if (beforeUser?.line_user_id && role !== undefined && beforeUser.role !== role) {
      const roleNames: Record<string, string> = {
        owner: '社長', manager: '管理者', staff: 'スタッフ', pending: '承認待ち', rejected: '拒否'
      };
      const oldRole = roleNames[beforeUser.role] || beforeUser.role;
      const newRole = roleNames[role] || role;

      let msg = '';
      if (beforeUser.role === 'pending' && (role === 'staff' || role === 'manager' || role === 'owner')) {
        const jobLine = job_description ? `\n担当業務: ${job_description}` : '';
        msg = `🎉 承認されました！\n\n${beforeUser.display_name}さん、「${newRole}」として登録されました。${jobLine}\n\nAI秘書をご利用いただけます。\n\n使い方:\n・「日報」→ 日報作成\n・「タスク」→ タスク確認\n・「予定」→ カレンダー\n・「経費入力」→ 経費記録\n\n何でもお気軽にどうぞ！`;
      } else if (role === 'rejected') {
        msg = `ご利用申請が承認されませんでした。管理者にお問い合わせください。`;
      } else {
        msg = `ロールが変更されました: ${oldRole} → ${newRole}`;
      }

      try {
        await linePush(beforeUser.line_user_id, msg, env.LINE_CHANNEL_ACCESS_TOKEN);
      } catch (e: any) {
        logger.warn('admin/users', 'LINE push notification failed', { userId, error: e.message });
      }
    }

    return res.status(200).json(data);
  }

  // DELETE: スタッフ削除
  if (req.method === 'DELETE') {
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // 削除前にユーザー情報を確認
    const { data: user } = await supabase
      .from('users')
      .select('display_name, role')
      .eq('id', userId)
      .single();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // ownerは削除不可
    if (user.role === 'owner' && _role !== 'owner') {
      return res.status(403).json({ error: 'オーナーは削除できません' });
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;

    logger.info('admin/users', 'Staff deleted', { id: userId, name: user.display_name });
    return res.status(200).json({ success: true, deleted: userId });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAdmin(handler, { allowedRoles: ['owner', 'manager'] });

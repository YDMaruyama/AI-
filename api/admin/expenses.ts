import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AdminRole } from '../../lib/core/types';
import { withAdmin } from '../../lib/core/admin-middleware';
import { getNowJST } from '../../lib/core/utils';
import { exportToSpreadsheet } from '../../lib/core/gas';

// ── 請求書・領収書CRUD ──
async function handleDocuments(req: VercelRequest, res: VercelResponse, supabase: SupabaseClient) {
  if (req.method === 'GET') {
    const month = (req.query.month as string) || '';
    const statusFilter = (req.query.status as string) || '';
    const categoryFilter = (req.query.category as string) || '';
    const vendorFilter = (req.query.vendor as string) || '';

    let query = supabase.from('documents').select('*').order('document_date', { ascending: false });

    if (month) {
      const [y, m] = month.split('-').map(Number);
      query = query.eq('fiscal_year', y).eq('fiscal_month', m);
    }
    if (statusFilter && statusFilter !== 'all') query = query.eq('payment_status', statusFilter);
    if (categoryFilter && categoryFilter !== 'all') query = query.eq('expense_category', categoryFilter);
    if (vendorFilter) query = query.ilike('vendor_name', `%${vendorFilter}%`);

    const { data, error } = await query.limit(100);
    if (error) return res.status(500).json({ error: error.message });

    const docs = data || [];
    const summary = {
      total: 0, paid: 0, unpaid: 0, overdue: 0, count: docs.length,
      byCategory: {} as Record<string, number>,
    };
    for (const d of docs) {
      const amt = Number(d.amount_total || 0);
      summary.total += amt;
      if (d.payment_status === 'paid') summary.paid += amt;
      else if (d.payment_status === 'overdue') summary.overdue += amt;
      else summary.unpaid += amt;
      const cat = d.expense_category || 'その他';
      summary.byCategory[cat] = (summary.byCategory[cat] || 0) + amt;
    }

    return res.status(200).json({ documents: docs, summary });
  }

  if (req.method === 'PUT') {
    const { id, payment_status, payment_date, expense_category, amount_total, due_date } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id is required' });

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (payment_status) updates.payment_status = payment_status;
    if (payment_date) updates.payment_date = payment_date;
    if (expense_category) updates.expense_category = expense_category;
    if (amount_total !== undefined) updates.amount_total = Number(amount_total);
    if (due_date !== undefined) updates.due_date = due_date || null;

    const { data, error } = await supabase.from('documents').update(updates).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id is required' });
    const { error } = await supabase.from('documents').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ status: 'ok' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function handler(req: VercelRequest, res: VercelResponse, supabase: SupabaseClient, _role: AdminRole) {
  // ── 請求書・領収書API（?type=documents） ──
  if (req.query.type === 'documents') {
    return handleDocuments(req, res, supabase);
  }

  // GET: 月別経費一覧（フィルター・サマリー付き）
  if (req.method === 'GET') {
    const month = (req.query.month as string) || '';
    const statusFilter = (req.query.status as string) || '';
    const categoryFilter = (req.query.category as string) || '';

    let query = supabase
      .from('expenses')
      .select('*, users!expenses_user_id_fkey(display_name)')
      .order('expense_date', { ascending: false });

    if (month) {
      const start = month + '-01';
      const [y, m] = month.split('-').map(Number);
      const nextMonth = m === 12
        ? `${y + 1}-01-01`
        : `${y}-${String(m + 1).padStart(2, '0')}-01`;
      query = query.gte('expense_date', start).lt('expense_date', nextMonth);
    }

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    if (categoryFilter && categoryFilter !== 'all') {
      query = query.eq('category', categoryFilter);
    }

    const { data, error } = await query;
    if (error) throw error;

    const expenses = (data || []).map((e: any) => ({
      ...e,
      user_name: e.users?.display_name || '',
      users: undefined,
    }));

    // サマリー計算
    const summary = {
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
      count: expenses.length,
      byCategory: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
    };
    for (const e of expenses) {
      const amt = Number(e.amount || 0);
      summary.total += amt;
      if (e.status === 'approved') summary.approved += amt;
      else if (e.status === 'pending') summary.pending += amt;
      else if (e.status === 'rejected') summary.rejected += amt;
      const cat = e.category || 'その他';
      summary.byCategory[cat] = (summary.byCategory[cat] || 0) + amt;
      const st = e.status || 'pending';
      summary.byStatus[st] = (summary.byStatus[st] || 0) + 1;
    }

    return res.status(200).json({ expenses, summary });
  }

  // PUT: 経費承認/却下 + フィールド編集
  if (req.method === 'PUT') {
    const { expenseId, status, amount, store_name, category, expense_date, description } = req.body || {};

    if (!expenseId) {
      return res.status(400).json({ error: 'expenseId is required' });
    }

    const updates: Record<string, any> = {};

    if (status) {
      if (!['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({ error: 'status must be "approved", "rejected", or "pending"' });
      }
      updates.status = status;
    }

    if (amount !== undefined && amount !== null) updates.amount = Number(amount);
    if (store_name !== undefined && store_name !== null) updates.store_name = store_name;
    if (category !== undefined && category !== null) updates.category = category;
    if (expense_date !== undefined && expense_date !== null) updates.expense_date = expense_date;
    if (description !== undefined && description !== null) updates.description = description;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', expenseId)
      .select()
      .single();

    if (error) throw error;
    return res.status(200).json(data);
  }

  // POST: スプシ作成 / メール送信（GAS経由）
  if (req.method === 'POST') {
    const queryAction = req.query.action as string;
    const isCashbox = queryAction === 'cashbox_export' || queryAction === 'cashbox_email';
    const sendEmail = queryAction === 'email' || queryAction === 'cashbox_email';
    const { csv } = req.body || {};
    if (!csv) return res.status(400).json({ error: 'csv is required' });

    const now = getNowJST();
    const label = isCashbox ? '金庫帳簿' : '経費一覧';
    const title = `${label}_${now.getUTCFullYear()}年${now.getUTCMonth() + 1}月`;

    const result = await exportToSpreadsheet({ title, csv, sendEmail });
    if (!result) return res.status(500).json({ error: 'GAS URL not configured' });
    return res.status(200).json(result);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAdmin(handler);

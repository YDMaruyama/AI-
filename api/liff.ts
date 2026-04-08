import { setCors, handlePreflight } from '../lib/core/cors';
import { env } from '../lib/core/config';
import { getSupabase } from '../lib/core/supabase';
import { linePush } from '../lib/core/line';
import { geminiGenerate, stripMarkdown } from '../lib/core/gemini';
import { logger } from '../lib/core/logger';
import { getToday, getMonthStart, getMonthTotal } from '../lib/core/utils';

/**
 * 統合LIFF API（全LIFF画面からのリクエストを1エンドポイントで処理）
 * POST /api/liff?action=expense|report|attendance|cashbox|task|calendar|sales
 * GET  /api/liff?action=clients|cashbox_balance|tasks|calendar|sales
 */
export default async function handler(req: any, res: any) {
  setCors(req, res);
  if (handlePreflight(req, res)) return;

  const supabase = getSupabase();
  const action = (req.query.action as string) || '';

  try {
    // === GET: データ取得（認証必須） ===
    if (req.method === 'GET') {
      const liffToken = req.query.liffToken as string;
      const user = await getUserFromToken(liffToken, supabase);
      if (!user) return res.status(401).json({ status: 'error', error: 'Authentication required' });

      if (action === 'clients') {
        const { data } = await supabase.from('clients').select('id, name, furigana').eq('status', 'active').order('furigana');
        return res.status(200).json({ status: 'ok', data: data || [] });
      }

      if (action === 'cashbox_balance') {
        const { data: bal } = await supabase.from('cashbox_balance').select('*').single();
        const { data: history } = await supabase.from('cashbox').select('*').eq('transaction_date', getToday()).order('created_at', { ascending: false });
        return res.status(200).json({ status: 'ok', data: { balance: bal?.current_balance || 0, today_in: bal?.today_in || 0, today_out: bal?.today_out || 0, history: history || [] } });
      }

      if (action === 'tasks') {
        let query;
        if (user.role !== 'owner') {
          query = supabase.from('tasks').select('*').eq('assignee_id', user.id).in('status', ['pending', 'in_progress']).order('created_at', { ascending: false }).limit(20);
        } else {
          query = supabase.from('tasks').select('*').in('status', ['pending', 'in_progress']).order('created_at', { ascending: false }).limit(20);
        }
        const { data } = await query;
        return res.status(200).json({ status: 'ok', data: data || [] });
      }

      if (action === 'calendar') {
        const gasUrl = env.GAS_CALENDAR_URL;
        if (gasUrl) {
          const gasRes = await fetch(`${gasUrl}?action=list&days=14`);
          const data = await gasRes.json();
          return res.status(200).json({ status: 'ok', data });
        }
        const { data: events } = await supabase.from('calendar_events').select('*').gte('start_time', getToday()).order('start_time').limit(20);
        return res.status(200).json({ status: 'ok', data: { events: events || [] } });
      }

      if (action === 'sales') {
        const today = getToday();
        const monthStart = getMonthStart(today);
        const { data: sales } = await supabase.from('daily_sales').select('*').gte('sales_date', monthStart).order('sales_date', { ascending: false });
        let totalSales = 0, totalCustomers = 0;
        (sales || []).forEach((s: any) => { totalSales += Number(s.total_amount || 0); totalCustomers += Number(s.customer_count || 0); });
        const avgDaily = sales && sales.length > 0 ? Math.round(totalSales / sales.length) : 0;
        return res.status(200).json({
          status: 'ok',
          data: { sales: sales || [], summary: { totalSales, totalCustomers, avgDaily, days: (sales || []).length } },
        });
      }

      return res.status(400).json({ status: 'error', error: 'Unknown action' });
    }

    // === POST/PUT: データ登録・更新（認証必須） ===
    if (req.method === 'POST' || req.method === 'PUT') {
      const body = req.body || {};
      const user = await getUserFromToken(body.liffToken, supabase);
      if (!user) return res.status(401).json({ status: 'error', error: 'User not found' });

      // --- 経費登録 ---
      if (action === 'expense') {
        const amount = Number(body.amount);
        if (!amount || amount <= 0) return res.status(400).json({ status: 'error', error: '金額は正の数で入力してください' });
        const { error } = await supabase.from('expenses').insert({
          user_id: user.id, expense_date: body.date || getToday(), store_name: body.store || '',
          amount, category: body.category || 'その他', description: body.description || '', status: 'pending',
        });
        if (error) throw new Error(`Expense insert failed: ${error.message}`);
        const mt = await getMonthTotal(supabase, 'expenses', user.id, body.date || getToday());
        return res.status(200).json({ status: 'ok', monthTotal: mt });
      }

      // --- 日報登録 ---
      if (action === 'report') {
        let summary = `作業: ${body.work_content || ''}\n利用者: ${body.client_notes || ''}`;
        try {
          const prompt = `以下の日報内容を簡潔に整形してください:\n作業内容: ${body.work_content}\n利用者: ${body.client_notes}\n外部: ${body.external_contacts}\n引き継ぎ: ${body.handover}\nその他: ${body.other_notes}`;
          summary = stripMarkdown(await geminiGenerate(env.GEMINI_API_KEY, prompt));
        } catch {
          logger.warn('liff', 'Gemini formatting failed, using raw input');
        }
        const { error } = await supabase.from('daily_reports').upsert({
          user_id: user.id, report_date: getToday(), work_content: [{ task: body.work_content }],
          client_notes: body.client_notes ? [{ note: body.client_notes }] : [], external_contacts: body.external_contacts || '',
          handover: body.handover || '', other_notes: body.other_notes || '', summary, status: 'submitted',
        }, { onConflict: 'user_id,report_date' });
        if (error) throw new Error(`Report upsert failed: ${error.message}`);
        // 社長通知
        const { data: owner } = await supabase.from('users').select('line_user_id').eq('role', 'owner').limit(1).single();
        if (owner?.line_user_id) {
          await linePush(owner.line_user_id, `📋 日報提出: ${user.display_name}\n${summary.substring(0, 300)}`, env.LINE_CHANNEL_ACCESS_TOKEN);
        }
        return res.status(200).json({ status: 'ok' });
      }

      // --- 出欠登録 ---
      if (action === 'attendance') {
        const records = body.records || [];
        if (!Array.isArray(records) || records.length === 0) return res.status(400).json({ status: 'error', error: 'records array is required' });
        for (const r of records) {
          const { error } = await supabase.from('attendance_records').upsert({
            client_id: r.client_id, date: getToday(), status: r.status || 'present',
            absence_reason: r.note || '', recorded_by: user.id,
          }, { onConflict: 'client_id,date' });
          if (error) logger.warn('liff', `Attendance upsert failed: ${error.message}`);
        }
        return res.status(200).json({ status: 'ok', count: records.length });
      }

      // --- 金庫入出金 ---
      if (action === 'cashbox') {
        const amount = Number(body.amount);
        if (!amount || amount <= 0) return res.status(400).json({ status: 'error', error: '金額は正の数で入力してください' });
        if (!['in', 'out', 'adjust'].includes(body.type)) return res.status(400).json({ status: 'error', error: 'type must be in/out/adjust' });
        const { data, error } = await supabase.rpc('insert_cashbox_transaction', {
          p_date: getToday(), p_type: body.type, p_amount: amount,
          p_description: body.description || '', p_category: body.category || 'その他', p_recorded_by: user.id,
        });
        if (error) {
          const { data: bal } = await supabase.from('cashbox_balance').select('current_balance').single();
          const cur = Number(bal?.current_balance || 0);
          const newBal = body.type === 'in' ? cur + amount : cur - amount;
          await supabase.from('cashbox').insert({
            transaction_date: getToday(), type: body.type, amount,
            description: body.description, category: body.category, balance_after: newBal, recorded_by: user.id,
          });
          return res.status(200).json({ status: 'ok', balance: newBal });
        }
        return res.status(200).json({ status: 'ok', balance: data?.[0]?.balance_after ?? 0 });
      }

      // --- タスク更新 ---
      if (action === 'task') {
        if (body.taskId && body.status) {
          const updates: any = { status: body.status };
          if (body.status === 'done') updates.completed_at = new Date().toISOString();
          const { error } = await supabase.from('tasks').update(updates).eq('id', body.taskId);
          if (error) throw new Error(`Task update failed: ${error.message}`);
          return res.status(200).json({ status: 'ok' });
        }
        if (body.title) {
          const { error } = await supabase.from('tasks').insert({
            title: body.title, description: body.description || '', status: 'pending',
            priority: body.priority || 'medium', assignee_id: user.id, created_by: user.id, source: 'manual',
            due_date: body.due_date || null,
          });
          if (error) throw new Error(`Task insert failed: ${error.message}`);
          return res.status(200).json({ status: 'ok' });
        }
        return res.status(400).json({ status: 'error', error: 'taskId+status or title required' });
      }

      // --- 売上登録 ---
      if (action === 'sales') {
        const totalAmount = Number(body.total_amount);
        if (isNaN(totalAmount) || totalAmount < 0) return res.status(400).json({ status: 'error', error: '売上金額が不正です' });
        const { error } = await supabase.from('daily_sales').upsert({
          sales_date: body.date || getToday(),
          total_amount: totalAmount,
          cash_amount: Number(body.cash_amount || 0),
          card_amount: Number(body.card_amount || 0),
          other_amount: Number(body.other_amount || 0),
          customer_count: Number(body.customer_count || 0),
          note: body.note || null,
          recorded_by: user.id,
        }, { onConflict: 'sales_date' });
        if (error) throw new Error(`Sales upsert failed: ${error.message}`);
        return res.status(200).json({ status: 'ok' });
      }

      // --- 予定追加 ---
      if (action === 'calendar') {
        if (!body.title || !body.start) return res.status(400).json({ status: 'error', error: 'title and start are required' });
        const gasUrl = env.GAS_CALENDAR_URL;
        if (gasUrl) {
          await fetch(gasUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create', title: body.title, start: body.start, end: body.end || '' }),
          });
        }
        const { error } = await supabase.from('calendar_events').insert({
          title: body.title, start_time: body.start, end_time: body.end || null, created_by: user.id,
        });
        if (error) throw new Error(`Calendar insert failed: ${error.message}`);
        return res.status(200).json({ status: 'ok' });
      }

      return res.status(400).json({ status: 'error', error: 'Unknown action' });
    }

    return res.status(405).json({ status: 'error', error: 'Method not allowed' });
  } catch (e: any) {
    logger.error('liff', e?.message || 'Unknown error', { action });
    return res.status(500).json({ status: 'error', error: e?.message || 'Internal error' });
  }
}

async function getUserFromToken(liffToken: string, supabase: any) {
  if (!liffToken) return null;
  try {
    const profileRes = await fetch('https://api.line.me/v2/profile', { headers: { 'Authorization': `Bearer ${liffToken}` } });
    if (!profileRes.ok) return null;
    const profile: any = await profileRes.json();
    const { data } = await supabase.from('users').select('*').eq('line_user_id', profile.userId).single();
    return data;
  } catch { return null; }
}

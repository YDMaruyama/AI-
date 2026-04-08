import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AdminRole } from '../../lib/core/types';
import { withAdmin } from '../../lib/core/admin-middleware';
import { getToday } from '../../lib/core/utils';
import {
  loadUsers, loadReports, loadTasks, loadAllTaskStats,
  loadExpenses, loadExpenses6m, loadExpensesByCategory,
  loadOrders, loadAttendance, loadCalendar,
  loadCashboxBalance, loadCashbox, loadReports30d, loadSales,
  loadProjects, loadMilestones, loadProjectTasks,
  loadReservations, loadSalonMenus, loadSalonStats,
} from '../../lib/dashboard/modules';

async function handleReservationAction(req: VercelRequest, res: VercelResponse, supabase: SupabaseClient) {
  const { action } = req.body || {};

  if (action === 'add_reservation') {
    const { customer_name, date, time, menu_id, note } = req.body;
    if (!customer_name || !date || !time) {
      return res.status(400).json({ error: 'customer_name, date, time are required' });
    }
    let menuName = '';
    let durationMin = 60;
    if (menu_id) {
      const { data: menu } = await supabase.from('salon_menus').select('name, duration_minutes').eq('id', menu_id).single();
      if (menu) { menuName = menu.name; durationMin = menu.duration_minutes; }
    }
    let customerId = null;
    const { data: existing } = await supabase.from('salon_customers').select('id').ilike('name', `%${customer_name}%`).limit(1).single();
    if (existing) { customerId = existing.id; }
    else {
      const { data: newCust } = await supabase.from('salon_customers').insert({ name: customer_name }).select('id').single();
      customerId = newCust?.id;
    }
    const startTime = `${date}T${time}:00+09:00`;
    const endDate = new Date(new Date(startTime).getTime() + durationMin * 60000);
    const endTimeJST = `${date}T${String(endDate.getUTCHours() + 9).padStart(2, '0')}:${String(endDate.getUTCMinutes()).padStart(2, '0')}:00+09:00`;
    const { error } = await supabase.from('reservations').insert({
      customer_id: customerId, customer_name, menu_id: menu_id || null, menu_name: menuName,
      start_time: startTime, end_time: endTimeJST, status: 'confirmed', note: note || null,
    });
    if (error) return res.status(500).json({ error: error.message });
    if (customerId) { try { await (supabase.rpc as any)('increment_visit_count', { cid: customerId }); } catch {} }
    return res.status(200).json({ status: 'ok' });
  }

  if (action === 'update_status') {
    const { id, status } = req.body;
    if (!id || !status) return res.status(400).json({ error: 'id and status are required' });
    if (!['confirmed', 'completed', 'cancelled', 'no_show'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const { data: rsv } = await supabase.from('reservations').select('start_time, menu_id').eq('id', id).single();
    const { error } = await supabase.from('reservations').update({ status }).eq('id', id);
    if (error) return res.status(500).json({ error: error.message });

    if (status === 'completed' && rsv) {
      const salesDate = rsv.start_time ? rsv.start_time.split('T')[0] : new Date().toISOString().split('T')[0];
      let price = 0;
      if (rsv.menu_id) {
        const { data: menu } = await supabase.from('salon_menus').select('price').eq('id', rsv.menu_id).single();
        if (menu) price = Number(menu.price) || 0;
      }
      if (price > 0) {
        const { data: existingSales } = await supabase.from('daily_sales').select('id, total_amount, customer_count').eq('sales_date', salesDate).single();
        if (existingSales) {
          await supabase.from('daily_sales').update({
            total_amount: Number(existingSales.total_amount || 0) + price,
            customer_count: Number(existingSales.customer_count || 0) + 1,
          }).eq('id', existingSales.id);
        } else {
          await supabase.from('daily_sales').insert({
            sales_date: salesDate, total_amount: price, cash_amount: 0, card_amount: 0,
            other_amount: price, customer_count: 1, note: '予約完了から自動計上',
          });
        }
      }
    }
    return res.status(200).json({ status: 'ok' });
  }

  return res.status(400).json({ error: 'Unknown action' });
}

async function handler(req: VercelRequest, res: VercelResponse, supabase: SupabaseClient, role: AdminRole) {
  // ── POST: 予約管理アクション ──
  if (req.method === 'POST') {
    return handleReservationAction(req, res, supabase);
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const today = getToday();

  // 各モジュールを並列実行（safeQuery で隔離済み: 1つ失敗しても他に影響しない）
  const [
    usersR, reportsR, tasksR, expensesR, ordersR, attendanceR,
    calendarR, cashboxBalanceR, cashboxR,
    expenses6mR, expensesCatR, reports30dR, allTasksR, salesR,
    projectsR, milestonesR, projectTasksR,
    reservationsR, salonMenusR, salonStatsR,
  ] = await Promise.all([
    loadUsers(supabase), loadReports(supabase), loadTasks(supabase),
    loadExpenses(supabase), loadOrders(supabase), loadAttendance(supabase),
    loadCalendar(supabase), loadCashboxBalance(supabase), loadCashbox(supabase),
    loadExpenses6m(supabase), loadExpensesByCategory(supabase),
    loadReports30d(supabase), loadAllTaskStats(supabase), loadSales(supabase),
    loadProjects(supabase), loadMilestones(supabase), loadProjectTasks(supabase),
    loadReservations(supabase), loadSalonMenus(supabase), loadSalonStats(supabase),
  ]);

  const users = usersR.data;
  const reports = reportsR.data;
  const tasks = tasksR.data;
  const expenses = expensesR.data;
  const orders = ordersR.data;
  const attendance = attendanceR.data;
  const calendar = calendarR.data;
  const cashboxBalance = cashboxBalanceR.data;
  const cashbox = cashboxR.data;
  const sales = salesR.data;
  const projects = projectsR.data;
  const milestones = milestonesR.data;
  const projectTasks = projectTasksR.data;
  const reservations = reservationsR.data;
  const salonMenus = salonMenusR.data;
  const rsvStats = {
    today: reservations.length,
    tomorrow: salonStatsR.data.tomorrow,
    month: salonStatsR.data.month,
    customers: salonStatsR.data.customers,
  };

  // 各モジュールのエラー状況を集計（フロントで部分エラー表示用）
  const _errors: Record<string, string> = {};
  const moduleResults: Record<string, { error: string | null }> = {
    users: usersR, reports: reportsR, tasks: tasksR, expenses: expensesR,
    orders: ordersR, attendance: attendanceR, calendar: calendarR,
    cashboxBalance: cashboxBalanceR, cashbox: cashboxR,
    expenses6m: expenses6mR, expensesCat: expensesCatR, reports30d: reports30dR,
    allTasks: allTasksR, sales: salesR, projects: projectsR,
    milestones: milestonesR, projectTasks: projectTasksR,
    reservations: reservationsR, salonMenus: salonMenusR, salonStats: salonStatsR,
  };
  for (const [k, v] of Object.entries(moduleResults)) {
    if (v.error) _errors[k] = v.error;
  }

  // Analytics: expenses by month (past 6 months)
  const expenses6m = expenses6mR.data;
  const expensesByMonthMap: Record<string, number> = {};
  expenses6m.forEach((e: any) => {
    const month = (e.expense_date || '').slice(0, 7);
    if (month) expensesByMonthMap[month] = (expensesByMonthMap[month] || 0) + (e.amount || 0);
  });
  const expensesByMonth = Object.entries(expensesByMonthMap)
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Analytics: expenses by category (this month)
  const expensesCat = expensesCatR.data;
  const expensesByCatMap: Record<string, number> = {};
  expensesCat.forEach((e: any) => {
    const cat = e.category || 'その他';
    expensesByCatMap[cat] = (expensesByCatMap[cat] || 0) + (e.amount || 0);
  });
  const expensesByCategory = Object.entries(expensesByCatMap)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  // Analytics: reports by day (past 30 days)
  const reports30d = reports30dR.data;
  const reportsByDayMap: Record<string, Set<string>> = {};
  reports30d.forEach((r: any) => {
    const d = r.report_date || '';
    if (d) {
      if (!reportsByDayMap[d]) reportsByDayMap[d] = new Set();
      reportsByDayMap[d].add(r.user_id);
    }
  });
  const totalStaffCount = users.filter((u: any) => u.is_active !== false).length;
  const reportsByDay = Object.entries(reportsByDayMap)
    .map(([date, userSet]) => ({ date, count: userSet.size, total_staff: totalStaffCount }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Analytics: task stats (all statuses)
  const allTasks = allTasksR.data;
  const taskStats = { done: 0, in_progress: 0, pending: 0 };
  allTasks.forEach((t: any) => {
    if (t.status === 'done') taskStats.done++;
    else if (t.status === 'in_progress') taskStats.in_progress++;
    else taskStats.pending++;
  });

  const analytics = {
    expensesByMonth,
    expensesByCategory,
    reportsByDay,
    taskStats,
  };

  const todayReports = reports.filter((r: any) => r.report_date === today);
  const monthlyTotal = expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
  const presentCount = attendance.filter((a: any) => a.clock_in).length;
  const activeStaff = users.filter((u: any) => u.is_active !== false);

  const stats = {
    totalStaff: activeStaff.length,
    todayReports: todayReports.length,
    pendingTasks: tasks.filter((t: any) => t.status === 'pending').length,
    monthlyExpenses: monthlyTotal,
    activeOrders: orders.length,
    todayAttendance: {
      present: presentCount,
      total: activeStaff.length,
    },
    upcomingEvents: calendar.length,
    cashbox_balance: Number(cashboxBalance?.current_balance || 0),
    today_sales: Number(sales.find((s: any) => s.sales_date === today)?.total_amount || 0),
    monthly_sales: sales.reduce((sum: number, s: any) => sum + Number(s.total_amount || 0), 0),
  };

  return res.status(200).json({
    role,
    stats,
    analytics,
    users,
    recentReports: reports,
    tasks,
    expenses,
    orders,
    calendar,
    cashbox,
    sales,
    projects,
    milestones,
    projectTasks,
    reservations,
    salonMenus,
    rsvStats,
    _errors,
  });
}

export default withAdmin(handler);

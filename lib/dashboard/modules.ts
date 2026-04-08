import type { SupabaseClient } from '@supabase/supabase-js';
import { safeQuery } from './safe-query';
import { getToday, getMonthStart, getDaysLater, getMonthsAgo, getDaysAgo } from '../core/utils';

/**
 * ダッシュボードの各機能モジュール
 * 1モジュールが失敗しても他に影響しないよう safeQuery で隔離
 */

// ── Staff / Users ─────────────────────────────────
export const loadUsers = (supabase: SupabaseClient) =>
  safeQuery('users', async () => {
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    return data || [];
  }, [] as any[]);

// ── Daily Reports ─────────────────────────────────
export const loadReports = (supabase: SupabaseClient) =>
  safeQuery('reports', async () => {
    const weekAgo = getDaysLater(-7);
    const { data } = await supabase.from('daily_reports').select('*').gte('report_date', weekAgo).order('report_date', { ascending: false });
    return data || [];
  }, [] as any[]);

// ── Tasks ─────────────────────────────────────────
export const loadTasks = (supabase: SupabaseClient) =>
  safeQuery('tasks', async () => {
    const { data } = await supabase.from('tasks').select('*').in('status', ['pending', 'in_progress']).order('priority', { ascending: true }).order('due_date', { ascending: true });
    return data || [];
  }, [] as any[]);

export const loadAllTaskStats = (supabase: SupabaseClient) =>
  safeQuery('allTasks', async () => {
    const { data } = await supabase.from('tasks').select('status');
    return data || [];
  }, [] as any[]);

// ── Expenses ──────────────────────────────────────
export const loadExpenses = (supabase: SupabaseClient) =>
  safeQuery('expenses', async () => {
    const monthStart = getMonthStart();
    const { data } = await supabase.from('expenses').select('*').gte('expense_date', monthStart).order('expense_date', { ascending: false });
    return data || [];
  }, [] as any[]);

export const loadExpenses6m = (supabase: SupabaseClient) =>
  safeQuery('expenses6m', async () => {
    const sixMonthsAgo = getMonthsAgo(6);
    const { data } = await supabase.from('expenses').select('expense_date, amount').gte('expense_date', sixMonthsAgo);
    return data || [];
  }, [] as any[]);

export const loadExpensesByCategory = (supabase: SupabaseClient) =>
  safeQuery('expensesCat', async () => {
    const monthStart = getMonthStart();
    const { data } = await supabase.from('expenses').select('category, amount').gte('expense_date', monthStart);
    return data || [];
  }, [] as any[]);

// ── Orders ────────────────────────────────────────
export const loadOrders = (supabase: SupabaseClient) =>
  safeQuery('orders', async () => {
    const { data } = await supabase.from('orders').select('*').in('status', ['受注', '制作中', '確認待ち']).order('created_at', { ascending: false });
    return data || [];
  }, [] as any[]);

// ── Attendance（テーブル未作成のため空返す） ────────
export const loadAttendance = (_supabase: SupabaseClient) =>
  safeQuery('attendance', async () => {
    return [] as any[];
  }, [] as any[]);

// ── Calendar ──────────────────────────────────────
export const loadCalendar = (supabase: SupabaseClient) =>
  safeQuery('calendar', async () => {
    const today = getToday();
    const weekLater = getDaysLater(7);
    const { data } = await supabase.from('calendar_events').select('*').gte('start_time', today + 'T00:00:00+09:00').lte('start_time', weekLater + 'T23:59:59+09:00').order('start_time', { ascending: true });
    return data || [];
  }, [] as any[]);

// ── Cashbox ───────────────────────────────────────
export const loadCashboxBalance = (supabase: SupabaseClient) =>
  safeQuery('cashboxBalance', async () => {
    const { data } = await supabase.from('cashbox_balance').select('*').single();
    return data || {};
  }, {} as any);

export const loadCashbox = (supabase: SupabaseClient) =>
  safeQuery('cashbox', async () => {
    const monthStart = getMonthStart();
    const { data } = await supabase.from('cashbox').select('*').gte('transaction_date', monthStart).order('transaction_date', { ascending: false });
    return data || [];
  }, [] as any[]);

// ── Reports analytics ─────────────────────────────
export const loadReports30d = (supabase: SupabaseClient) =>
  safeQuery('reports30d', async () => {
    const thirtyDaysAgo = getDaysAgo(30);
    const { data } = await supabase.from('daily_reports').select('report_date, user_id').gte('report_date', thirtyDaysAgo);
    return data || [];
  }, [] as any[]);

// ── Sales ─────────────────────────────────────────
export const loadSales = (supabase: SupabaseClient) =>
  safeQuery('sales', async () => {
    const monthStart = getMonthStart();
    const { data } = await supabase.from('daily_sales').select('*').gte('sales_date', monthStart).order('sales_date', { ascending: false });
    return data || [];
  }, [] as any[]);

// ── Projects ──────────────────────────────────────
export const loadProjects = (supabase: SupabaseClient) =>
  safeQuery('projects', async () => {
    const { data } = await supabase.from('projects').select('*').not('status', 'eq', 'cancelled').order('priority', { ascending: true });
    return data || [];
  }, [] as any[]);

export const loadMilestones = (supabase: SupabaseClient) =>
  safeQuery('milestones', async () => {
    const { data } = await supabase.from('project_milestones').select('*').order('due_date', { ascending: true });
    return data || [];
  }, [] as any[]);

export const loadProjectTasks = (supabase: SupabaseClient) =>
  safeQuery('projectTasks', async () => {
    const { data } = await supabase.from('project_tasks').select('*').in('status', ['pending', 'in_progress']).order('due_date', { ascending: true });
    return data || [];
  }, [] as any[]);

// ── Salon ─────────────────────────────────────────
export const loadReservations = (supabase: SupabaseClient) =>
  safeQuery('reservations', async () => {
    const today = getToday();
    const { data } = await supabase.from('reservations').select('*').gte('start_time', `${today}T00:00:00+09:00`).lte('start_time', `${today}T23:59:59+09:00`).neq('status', 'cancelled').order('start_time', { ascending: true });
    return data || [];
  }, [] as any[]);

export const loadSalonMenus = (supabase: SupabaseClient) =>
  safeQuery('salonMenus', async () => {
    const { data } = await supabase.from('salon_menus').select('*').eq('is_active', true).order('sort_order');
    return data || [];
  }, [] as any[]);

export const loadSalonStats = (supabase: SupabaseClient) =>
  safeQuery('salonStats', async () => {
    const today = getToday();
    const tomorrow = getDaysLater(1);
    const monthStart = getMonthStart();
    const [custCount, tomorrowCount, monthCount] = await Promise.all([
      supabase.from('salon_customers').select('id', { count: 'exact', head: true }),
      supabase.from('reservations').select('id', { count: 'exact', head: true }).gte('start_time', `${tomorrow}T00:00:00+09:00`).lte('start_time', `${tomorrow}T23:59:59+09:00`).neq('status', 'cancelled'),
      supabase.from('reservations').select('id', { count: 'exact', head: true }).gte('start_time', `${monthStart}T00:00:00+09:00`).neq('status', 'cancelled'),
    ]);
    return {
      customers: custCount.count || 0,
      tomorrow: tomorrowCount.count || 0,
      month: monthCount.count || 0,
    };
  }, { customers: 0, tomorrow: 0, month: 0 });

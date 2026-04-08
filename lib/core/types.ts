import type { SupabaseClient } from '@supabase/supabase-js';

// ── ユーザーロール ──
export type UserRole = 'owner' | 'manager' | 'staff' | 'pending' | 'rejected';
export type AdminRole = 'owner' | 'manager' | 'staff';

// ── ユーザー ──
export interface User {
  id: string;
  line_user_id: string;
  line_display_name: string;
  display_name: string;
  role: UserRole;
  is_active: boolean;
  last_message_at: string;
  created_at: string;
}

// ── 会話状態 ──
export type StateName =
  | 'idle'
  | 'writing_report'
  | 'confirming_report'
  | 'writing_incident'
  | 'writing_expense'
  | 'confirming_receipt';

export interface ConversationState {
  user_id: string;
  state: StateName;
  context: Record<string, any>;
  updated_at: string;
}

// ── Intent ──
export type IntentType =
  | 'daily_report' | 'search_report'
  | 'task' | 'attendance' | 'order' | 'shift'
  | 'calendar' | 'add_calendar'
  | 'incident' | 'inquiry' | 'admin_doc'
  | 'meeting' | 'memo' | 'staff'
  | 'sales' | 'client' | 'cashbox'
  | 'expense' | 'expense_summary' | 'expense_export' | 'expense_email'
  | 'reservation' | 'add_reservation' | 'menu' | 'customer'
  | 'invoice' | 'invoice_search' | 'invoice_summary' | 'add_invoice' | 'invoice_paid'
  | 'general';

// ── ハンドラーコンテキスト ──
export interface HandlerContext {
  user: User;
  replyToken: string;
  supabase: SupabaseClient;
  token: string;
  geminiKey: string;
}

// ── DB エンティティ ──
export interface Expense {
  id: string;
  user_id: string;
  date: string;
  store: string;
  amount: number;
  category: string;
  description?: string;
  status: string;
  created_at: string;
}

export interface DailyReport {
  id: string;
  user_id: string;
  report_date: string;
  report_type: string;
  content: string;
  raw_input?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  assignee_id?: string;
  due_date?: string;
  source?: string;
  created_at: string;
}

export interface CashboxTransaction {
  id: string;
  user_id: string;
  type: 'in' | 'out' | 'adjust';
  amount: number;
  description: string;
  balance_after: number;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time?: string;
  description?: string;
  created_by?: string;
}

export interface IncidentReport {
  id: string;
  user_id: string;
  incident_type: string;
  severity: string;
  description: string;
  location?: string;
  involved_persons?: string;
  actions_taken?: string;
  created_at: string;
}

// ── API レスポンス ──
export interface ApiSuccess<T = any> {
  status: 'ok';
  data?: T;
}

export interface ApiError {
  status: 'error';
  error: string;
  code?: string;
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError;

// ── Handler型 ──
export type Handler = (ctx: HandlerContext, text: string) => Promise<void>;

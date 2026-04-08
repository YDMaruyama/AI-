/**
 * 入力バリデーション（zodベース）
 * API/LIFFからの入力を検証するスキーマ群
 */
import { z } from 'zod';
import { EXPENSE_CATEGORIES } from './config';

// ── 共通スキーマ ──
export const UUIDSchema = z.string().uuid();
export const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式');
export const PositiveNumber = z.number().positive('金額は正の数');
export const NonNegativeNumber = z.number().nonnegative('金額は0以上');

// ── 経費 ──
export const ExpenseInputSchema = z.object({
  date: DateSchema,
  store: z.string().min(1, '店名は必須'),
  amount: PositiveNumber,
  category: z.enum(EXPENSE_CATEGORIES as unknown as [string, ...string[]]).optional(),
  description: z.string().optional(),
});

// ── 金庫 ──
export const CashboxTransactionSchema = z.object({
  type: z.enum(['in', 'out', 'adjust']),
  amount: PositiveNumber,
  description: z.string().min(1, '説明は必須'),
});

// ── タスク ──
export const TaskInputSchema = z.object({
  title: z.string().min(1, 'タイトルは必須'),
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  assignee_id: UUIDSchema.optional(),
  due_date: DateSchema.optional(),
});

export const TaskUpdateSchema = z.object({
  taskId: UUIDSchema,
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  assignee_id: UUIDSchema.optional().nullable(),
  due_date: DateSchema.optional().nullable(),
});

// ── 売上 ──
export const SalesInputSchema = z.object({
  date: DateSchema,
  total_amount: NonNegativeNumber,
  cash_amount: NonNegativeNumber.optional(),
  card_amount: NonNegativeNumber.optional(),
  other_amount: NonNegativeNumber.optional(),
  customer_count: z.number().int().nonnegative().optional(),
  memo: z.string().optional(),
});

// ── 出欠 ──
export const AttendanceRecordSchema = z.object({
  user_id: UUIDSchema,
  date: DateSchema,
  status: z.enum(['present', 'absent', 'late', 'early_leave', 'holiday']),
  note: z.string().optional(),
});

// ── 管理画面認証 ──
export const AdminAuthSchema = z.object({
  password: z.string().min(1, 'パスワードは必須'),
});

// ── バリデーションヘルパー ──
export function validateBody<T>(schema: z.ZodSchema<T>, data: unknown): { ok: true; data: T } | { ok: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) return { ok: true, data: result.data };
  const messages = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
  return { ok: false, error: messages };
}

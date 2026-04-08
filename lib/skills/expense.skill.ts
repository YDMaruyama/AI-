/**
 * 経費管理スキル
 */
import { defineSkill } from './_define';
import { SchemaType } from '@google/generative-ai';
import {
  startExpenseInput,
  continueExpenseInput,
  showExpenseSummary,
  exportExpenses,
  exportAndEmailExpenses,
  editExpense,
  deleteExpense,
  handleReceiptConfirmation,
} from '../handlers/expense';
import { getToday } from '../core/utils';

export const expenseSkill = defineSkill({
  id: 'expense',
  name: '経費管理',

  intents: ['expense', 'expense_summary', 'expense_export', 'expense_email'],

  routes: [
    // 修正・変更系（specific first）
    { pattern: /経費修正|経費変更|経費直し|^修正/, intent: 'expense', handler: (u, t, rt, s, tk, gk) => editExpense(u, t, rt, s, tk, gk) },
    // 削除系
    { pattern: /経費削除|削除確定/, intent: 'expense', handler: (u, t, rt, s, tk) => deleteExpense(u, rt, s, tk, t) },
    // 経費入力・レシート
    // 「経費入力」「レシート」等の短いコマンドのみ。「先月の経費」等は AI Agent (get_expenses) に流す
    { pattern: /^レシート$|^経費入力$|^領収書入力$|^経費$/, intent: 'expense', handler: (u, t, rt, s, tk, gk) => startExpenseInput(u, rt, s, tk, gk, t) },
    // サマリー
    { pattern: /今月の経費|経費サマリー|経費一覧/, intent: 'expense_summary', handler: (u, t, rt, s, tk) => showExpenseSummary(u, t, rt, s, tk) },
    // エクスポート
    { pattern: /経費出力|経費エクスポート|領収書出力/, intent: 'expense_export', handler: (u, _t, rt, s, tk) => exportExpenses(u, rt, s, tk) },
    // メール送信
    { pattern: /領収書.*まとめ|経費.*報告|経費.*メール|領収書.*送|経費.*送信/, intent: 'expense_email', handler: (u, _t, rt, s, tk) => exportAndEmailExpenses(u, rt, s, tk) },
  ],

  states: [
    { stateName: 'writing_expense', handler: (u, t, rt, s, tk, gk) => continueExpenseInput(u, t, rt, s, tk, gk) },
    { stateName: 'confirming_receipt', handler: (u, t, rt, s, tk, gk) => handleReceiptConfirmation(u, t, rt, s, tk, gk) },
  ],

  fastIntents: [
    { pattern: /今月の経費|経費サマリー|経費一覧/, intent: 'expense_summary' },
    { pattern: /経費出力|経費エクスポート/, intent: 'expense_export' },
    { pattern: /領収書.*まとめ|経費.*報告|経費.*メール|領収書.*送/, intent: 'expense_email' },
    { pattern: /^(経費|レシート|領収書)$|^経費入力$|^領収書入力$/, intent: 'expense' },
  ],

  intentDescriptions: {
    expense: '経費入力、レシート読み取り、経費修正、経費削除、領収書入力',
    expense_summary: '今月の経費サマリー、経費一覧、カテゴリ別集計',
    expense_export: '経費出力、経費エクスポート、スプレッドシート出力',
    expense_email: '経費メール送信、領収書まとめ、経費報告',
  },

  breakKeywords: ['経費'],

  agentTools: [
    {
      name: 'get_expenses',
      description: '経費データを取得。「今月の経費」「先月の経費」「今日の経費」等。金額・カテゴリ・店舗を確認できる。',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          period: {
            type: SchemaType.STRING,
            description: '期間: today, this_month, last_month。省略でthis_month',
          },
        },
      },
      execute: async (args, supabase, userId) => {
        const period = args.period || 'this_month';
        const today = getToday();
        const [y, m, d] = today.split('-').map(Number);

        let fromDate: string;
        let toDate: string;
        let label: string;

        if (period === 'today') {
          fromDate = today;
          toDate = `${y}-${String(m).padStart(2, '0')}-${String(d + 1).padStart(2, '0')}`;
          label = `${m}/${d}`;
        } else if (period === 'last_month') {
          let targetMonth = m - 1;
          let targetYear = y;
          if (targetMonth <= 0) { targetMonth = 12; targetYear--; }
          fromDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
          toDate = `${y}-${String(m).padStart(2, '0')}-01`;
          label = `${targetMonth}月`;
        } else {
          // this_month
          fromDate = `${y}-${String(m).padStart(2, '0')}-01`;
          const nextMonth = m + 1 > 12 ? 1 : m + 1;
          const nextYear = m + 1 > 12 ? y + 1 : y;
          toDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
          label = `${m}月`;
        }

        const { data } = await supabase
          .from('expenses')
          .select('expense_date, store_name, amount, category, description')
          .eq('user_id', userId)
          .gte('expense_date', fromDate)
          .lt('expense_date', toDate)
          .order('expense_date', { ascending: true });

        if (!data || data.length === 0) return `${label}の経費はありません。`;

        const total = data.reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
        let result = `${label}の経費: ${data.length}件 合計¥${total.toLocaleString()}\n`;
        result += data.map((e: any) =>
          `  ${e.expense_date} ${e.store_name || '不明'} ¥${Number(e.amount).toLocaleString()} (${e.category || 'その他'})${e.description ? ' ' + e.description : ''}`
        ).join('\n');
        return result;
      },
    },
  ],
});

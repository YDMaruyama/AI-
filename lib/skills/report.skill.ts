/**
 * 日報管理スキル
 */
import { defineSkill } from './_define';
import { SchemaType } from '@google/generative-ai';
import { startReport, continueReport, confirmReport } from '../handlers/report';
import { searchReports } from '../handlers/search';
import { getToday } from '../core/utils';

export const reportSkill = defineSkill({
  id: 'report',
  name: '日報管理',

  intents: ['daily_report', 'search_report'],

  routes: [
    { pattern: /日報.*(検索|確認|見|教え|一覧)|(\d{1,2}月\d{1,2}日|今日|昨日|一昨日|\d{1,2}\/\d{1,2})の日報/, intent: 'search_report', handler: (u, t, rt, s, tk, gk) => searchReports(u, t, rt, s, tk, gk) },
    { pattern: /日報|作業報告|業務報告/, intent: 'daily_report', handler: (u, t, rt, s, tk, gk) => startReport(u, rt, s, tk, gk, t) },
  ],

  states: [
    { stateName: 'writing_report', handler: (u, t, rt, s, tk, gk) => continueReport(u, t, rt, s, tk, gk) },
    { stateName: 'confirming_report', handler: (u, t, rt, s, tk, gk) => confirmReport(u, t, rt, s, tk, gk) },
  ],

  fastIntents: [
    { pattern: /日報.*(検索|確認|見|教え|一覧)|(\d{1,2}月\d{1,2}日|今日|昨日|一昨日|\d{1,2}\/\d{1,2})の日報/, intent: 'search_report' },
    { pattern: /日報|作業報告|業務報告/, intent: 'daily_report' },
  ],

  intentDescriptions: {
    daily_report: '日報作成、作業報告、業務報告の入力',
    search_report: '日報検索、日報確認、特定日の日報一覧',
  },

  breakKeywords: ['日報'],

  agentTools: [
    {
      name: 'get_daily_reports',
      description: '日報を取得。特定日の日報一覧を確認できる。「今日の日報」「昨日の日報」等。',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          date: { type: SchemaType.STRING, description: '日付 (YYYY-MM-DD)。省略で今日' },
        },
      },
      execute: async (args, supabase, _userId) => {
        const date = args.date || getToday();
        const { data } = await supabase
          .from('daily_reports')
          .select('user_id, summary, content, report_date')
          .eq('report_date', date);
        if (!data || data.length === 0) return `${date} の日報はありません。「日報」で今日の日報を作成できます。`;
        return `${date} の日報（${data.length}件）:\n` + data.map((r: any) =>
          `- ${r.content?.substring(0, 150) || r.summary || '(内容なし)'}`
        ).join('\n');
      },
    },
  ],
});

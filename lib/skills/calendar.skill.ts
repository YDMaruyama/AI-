/**
 * カレンダー・予定管理スキル
 */
import { defineSkill } from './_define';
import { SchemaType } from '@google/generative-ai';
import { showCalendar, addCalendarEvent, deleteCalendarEvent } from '../handlers/calendar';
import { getToday } from '../core/utils';

export const calendarSkill = defineSkill({
  id: 'calendar',
  name: 'カレンダー・予定管理',

  intents: ['calendar', 'add_calendar'],

  routes: [
    { pattern: /^予定(追加|登録)/, intent: 'add_calendar', handler: (u, t, rt, s, tk, gk) => addCalendarEvent(u, t, rt, s, tk, gk) },
    { pattern: /^予定削除/, intent: 'calendar', handler: (u, t, rt, s, tk) => deleteCalendarEvent(u, t, rt, s, tk) },
    // 短いコマンド形式のみ。「○○さんの予定」「来月の予定」等は AI Agent (get_calendar) に流す
    { pattern: /^(予定|カレンダー|スケジュール)$|^(今日|明日|明後日|今週|来週)の?(予定|カレンダー|スケジュール)$/, intent: 'calendar', handler: (u, _t, rt, s, tk) => showCalendar(u, rt, s, tk) },
  ],

  fastIntents: [
    { pattern: /^予定(追加|登録|入れ)/, intent: 'add_calendar' },
    { pattern: /^(予定|カレンダー|スケジュール)$|^(今日|明日|明後日|今週|来週)の?(予定|カレンダー|スケジュール)$/, intent: 'calendar' },
  ],

  intentDescriptions: {
    calendar: '予定確認、カレンダー表示、スケジュール確認、今週の予定',
    add_calendar: '予定追加、予定登録、スケジュール登録',
  },

  breakKeywords: ['予定'],

  agentTools: [
    {
      name: 'get_calendar',
      description: '今後の予定・スケジュールを取得。「今週の予定」「来週の予定」「今後の予定」等。',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          days: { type: SchemaType.NUMBER, description: '取得する日数。省略で14日間' },
        },
      },
      execute: async (args, supabase, _userId) => {
        const days = args.days || 14;
        const today = getToday();
        const { data } = await supabase
          .from('calendar_events')
          .select('title, start_time, description')
          .gte('start_time', today)
          .order('start_time', { ascending: true })
          .limit(10);
        if (!data || data.length === 0) return `今後${days}日間の予定はありません。「予定追加 〇〇」で新しい予定を登録できます。`;
        const lines = data.map((e: any) => {
          const utc = new Date(e.start_time);
          const jst = new Date(utc.getTime() + 9 * 60 * 60 * 1000);
          const dateStr = `${jst.getUTCMonth() + 1}/${jst.getUTCDate()}`;
          const time = `${jst.getUTCHours()}:${String(jst.getUTCMinutes()).padStart(2, '0')}`;
          const desc = e.description ? ` - ${e.description}` : '';
          return `${dateStr} ${time} ${e.title}${desc}`;
        });
        return `今後の予定（${data.length}件）:\n${lines.join('\n')}`;
      },
    },
  ],
});

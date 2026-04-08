/**
 * タスク管理スキル
 */
import { defineSkill } from './_define';
import { SchemaType } from '@google/generative-ai';
import { showTasks } from '../handlers/tasks';
import { getToday } from '../core/utils';

export const taskSkill = defineSkill({
  id: 'task',
  name: 'タスク管理',

  intents: ['task'],

  routes: [
    { pattern: /タスク|やること|TODO|todo/, intent: 'task', handler: showTasks },
  ],

  fastIntents: [
    { pattern: /タスク|やること|TODO|todo/, intent: 'task' },
  ],

  intentDescriptions: {
    task: 'やること、タスク、TODO',
  },

  breakKeywords: ['タスク'],

  agentTools: [
    {
      name: 'get_tasks',
      description: 'タスク一覧を取得。「やること」「TODO」「進行中のタスク」等。優先度・期限・ステータスを確認できる。',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          status: {
            type: SchemaType.STRING,
            description: 'タスクの状態: pending, in_progress, all。省略でall',
          },
        },
      },
      execute: async (args, supabase, _userId) => {
        const status = args.status || 'all';

        let q = supabase
          .from('tasks')
          .select('title, priority, due_date, status')
          .order('due_date', { ascending: true })
          .limit(10);

        if (status !== 'all') {
          q = q.eq('status', status);
        } else {
          q = q.in('status', ['pending', 'in_progress']);
        }

        const { data } = await q;
        if (!data || data.length === 0) return '現在のタスクはありません。';

        const lines = data.map((t: any) => {
          const pri = t.priority === 'high' ? '[高]' : t.priority === 'low' ? '[低]' : '[中]';
          const st = t.status === 'in_progress' ? '進行中' : t.status;
          const due = t.due_date ? ` due:${t.due_date}` : '';
          return `[${pri}/${st}] ${t.title}${due}`;
        });

        return `タスク一覧 (${data.length}件):\n${lines.join('\n')}`;
      },
    },
  ],
});

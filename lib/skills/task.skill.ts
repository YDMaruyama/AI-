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
      description: 'タスク一覧を取得。「やること」「TODO」「進行中のタスク」等。優先度・期限・ステータスを確認できる。特定の人のタスクを聞かれたら assignee_name を指定する。',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          status: {
            type: SchemaType.STRING,
            description: 'タスクの状態: pending, in_progress, all。省略でall',
          },
          assignee_name: {
            type: SchemaType.STRING,
            description: '担当者名で絞り込む（部分一致）。例: 「佐々木」「社長」。省略で全員',
          },
        },
      },
      execute: async (args, supabase, _userId) => {
        const status = args.status || 'all';
        const assigneeName = (args.assignee_name || '').trim();

        // 担当者名 → user_id 解決
        let assigneeIds: string[] | null = null;
        if (assigneeName) {
          const { data: matchedUsers } = await supabase
            .from('users')
            .select('id, display_name, role')
            .or(`display_name.ilike.%${assigneeName}%,role.ilike.%${assigneeName}%`);
          if (!matchedUsers || matchedUsers.length === 0) {
            return `「${assigneeName}」に該当するユーザーが見つかりません。`;
          }
          assigneeIds = matchedUsers.map((u: any) => u.id);
        }

        let q = supabase
          .from('tasks')
          .select('title, priority, due_date, status, assignee_id')
          .order('due_date', { ascending: true })
          .limit(20);

        if (status !== 'all') {
          q = q.eq('status', status);
        } else {
          q = q.in('status', ['pending', 'in_progress']);
        }

        if (assigneeIds) {
          q = q.in('assignee_id', assigneeIds);
        }

        const { data } = await q;
        if (!data || data.length === 0) {
          return assigneeName
            ? `${assigneeName}さんの現在のタスクはありません。`
            : '現在のタスクはありません。';
        }

        // 担当者名を引くためのマップ作成
        const allAssigneeIds = [...new Set(data.map((t: any) => t.assignee_id).filter(Boolean))];
        const nameMap: Record<string, string> = {};
        if (allAssigneeIds.length > 0) {
          const { data: users } = await supabase
            .from('users')
            .select('id, display_name')
            .in('id', allAssigneeIds);
          for (const u of users || []) nameMap[u.id] = u.display_name;
        }

        const lines = data.map((t: any) => {
          const pri = t.priority === 'high' ? '[高]' : t.priority === 'low' ? '[低]' : '[中]';
          const st = t.status === 'in_progress' ? '進行中' : t.status;
          const due = t.due_date ? ` due:${t.due_date}` : '';
          const who = t.assignee_id && nameMap[t.assignee_id] ? ` 担当:${nameMap[t.assignee_id]}` : '';
          return `[${pri}/${st}] ${t.title}${due}${who}`;
        });

        const header = assigneeName
          ? `${assigneeName}さんのタスク (${data.length}件):`
          : `タスク一覧 (${data.length}件):`;
        return `${header}\n${lines.join('\n')}`;
      },
    },
  ],
});

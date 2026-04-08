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
    // 短いコマンド系のみマッチ。人名や修飾語付き（「佐々木社長のタスク」等）は
    // AI Agent (get_tasks) に流して assignee_name フィルタを使わせる。
    { pattern: /^(タスク|やること|TODO|todo)$|^タスク一覧$|^TODO一覧$/i, intent: 'task', handler: showTasks },
  ],

  fastIntents: [
    { pattern: /^(タスク|やること|TODO|todo)$|^タスク一覧$/i, intent: 'task' },
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
        const rawAssignee = (args.assignee_name || '').trim();

        // 役職→roleマッピング
        const roleKeywords: Record<string, string> = {
          社長: 'owner', 会長: 'owner', オーナー: 'owner',
          管理者: 'manager', マネージャー: 'manager', 店長: 'manager',
          スタッフ: 'staff', 職員: 'staff',
        };

        // 敬称・役職を除去した「核」の名前を抽出
        const titleRegex = /(社長|会長|オーナー|管理者|マネージャー|店長|スタッフ|職員|さん|様|氏|くん|ちゃん)/g;
        const coreName = rawAssignee.replace(titleRegex, '').trim();

        // 役職キーワードがあれば role 検索もOR条件に
        let matchedRole: string | null = null;
        for (const [kw, r] of Object.entries(roleKeywords)) {
          if (rawAssignee.includes(kw)) { matchedRole = r; break; }
        }

        // 担当者名 → user_id 解決
        let assigneeIds: string[] | null = null;
        if (rawAssignee) {
          let userQuery = supabase.from('users').select('id, display_name, role');
          if (coreName && matchedRole) {
            userQuery = userQuery.or(`display_name.ilike.%${coreName}%,role.eq.${matchedRole}`);
          } else if (coreName) {
            userQuery = userQuery.ilike('display_name', `%${coreName}%`);
          } else if (matchedRole) {
            userQuery = userQuery.eq('role', matchedRole);
          }
          const { data: matchedUsers } = await userQuery;

          // coreName が指定されていれば、display_name に core が含まれるユーザーを優先
          let candidates = matchedUsers || [];
          if (coreName && candidates.length > 1) {
            const narrowed = candidates.filter((u: any) =>
              (u.display_name || '').includes(coreName)
            );
            if (narrowed.length > 0) candidates = narrowed;
          }

          if (candidates.length === 0) {
            return `「${rawAssignee}」に該当するユーザーが見つかりません。`;
          }
          assigneeIds = candidates.map((u: any) => u.id);
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
          return rawAssignee
            ? `${rawAssignee}の現在のタスクはありません。`
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

        const header = rawAssignee
          ? `${rawAssignee}のタスク (${data.length}件):`
          : `タスク一覧 (${data.length}件):`;
        return `${header}\n${lines.join('\n')}`;
      },
    },
  ],
});

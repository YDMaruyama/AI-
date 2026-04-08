import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AdminRole } from '../../lib/core/types';
import { withAdmin } from '../../lib/core/admin-middleware';
import { getNowJST } from '../../lib/core/utils';
import { logger } from '../../lib/core/logger';

async function handler(req: VercelRequest, res: VercelResponse, supabase: SupabaseClient, _role: AdminRole) {
  // GET: タスク一覧（フィルタ対応）
  if (req.method === 'GET') {
    const { status, priority, assignee_id, search } = req.query || {};

    let query = supabase.from('tasks').select('*');

    if (status && typeof status === 'string') {
      query = query.eq('status', status);
    }
    if (priority && typeof priority === 'string') {
      query = query.eq('priority', priority);
    }
    if (assignee_id && typeof assignee_id === 'string') {
      if (assignee_id === 'unassigned') {
        query = query.is('assignee_id', null);
      } else {
        query = query.eq('assignee_id', assignee_id);
      }
    }
    if (search && typeof search === 'string') {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query
      .order('priority', { ascending: true })
      .order('due_date', { ascending: true });

    if (error) throw error;
    return res.status(200).json(data || []);
  }

  // POST: タスク作成
  if (req.method === 'POST') {
    const { title, description, assignee_id, priority, due_date } = req.body || {};

    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }

    // created_by: 管理用UID（ownerを自動付与）
    const { data: adminUser } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'owner')
      .limit(1)
      .single();
    const creatorId = adminUser?.id;

    if (!creatorId) {
      return res.status(400).json({ error: 'Admin user not found' });
    }

    const newTask: any = {
      title,
      status: 'pending',
      priority: priority || 'medium',
      source: 'manual',
      created_by: creatorId,
    };
    if (description) newTask.description = description;
    if (assignee_id) newTask.assignee_id = assignee_id;
    if (due_date) newTask.due_date = due_date;

    const { data, error } = await supabase
      .from('tasks')
      .insert(newTask)
      .select()
      .single();

    if (error) throw error;
    logger.info('admin/tasks', 'Task created', { id: data.id, title });
    return res.status(201).json(data);
  }

  // PUT: タスク更新（ステータス以外も対応）
  if (req.method === 'PUT') {
    const { taskId, status, title, description, assignee_id, priority, due_date } = req.body || {};

    if (!taskId) {
      return res.status(400).json({ error: 'taskId is required' });
    }

    const validStatuses = ['pending', 'in_progress', 'done', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updates: any = {};
    if (status !== undefined) {
      updates.status = status;
      if (status === 'done') {
        updates.completed_at = getNowJST().toISOString();
      } else {
        updates.completed_at = null;
      }
    }
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (assignee_id !== undefined) updates.assignee_id = assignee_id || null;
    if (priority !== undefined) updates.priority = priority;
    if (due_date !== undefined) updates.due_date = due_date || null;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.updated_at = getNowJST().toISOString();

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return res.status(200).json(data);
  }

  // DELETE: タスク削除
  if (req.method === 'DELETE') {
    const taskId = req.query.taskId as string;

    if (!taskId) {
      return res.status(400).json({ error: 'taskId is required' });
    }

    const { data: task } = await supabase
      .from('tasks')
      .select('title')
      .eq('id', taskId)
      .single();

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;

    logger.info('admin/tasks', 'Task deleted', { id: taskId, title: task.title });
    return res.status(200).json({ success: true, deleted: taskId });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAdmin(handler);

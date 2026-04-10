/**
 * 統合 Cron マスター
 * Vercel Hobby は cron 2個まで＋1日1回しか走らせられないため、
 * このエンドポイントを 1日1回呼び出し、全タスクをまとめて実行する。
 *
 * スケジュール: 毎日 00:00 UTC (= 09:00 JST)
 * - 朝のブリーフィング（owner/manager）
 * - タスクリマインド（全スタッフ個別通知）
 * - 日次記憶抽出（前日分）
 *
 * NOTE: タスクごとに try/catch で隔離。1つ失敗しても他は走る。
 */
import { env } from '../../lib/core/config';
import { getSupabase } from '../../lib/core/supabase';
import { linePush } from '../../lib/core/line';
import { logger } from '../../lib/core/logger';
import { extractDailyInsights } from '../../lib/core/memory-extraction';
import { buildMorningBriefing, buildWeeklyReport } from '../../lib/core/patterns';

async function safeRun(name: string, fn: () => Promise<any>) {
  try {
    const result = await fn();
    logger.info('cron-master', `${name} OK`, result);
    return { task: name, status: 'ok', result };
  } catch (e: any) {
    logger.error('cron-master', `${name} failed`, { error: e?.message });
    return { task: name, status: 'error', error: e?.message };
  }
}

// ── タスク1: 日次記憶抽出 ─────────────────────────
async function runDailyMemory(supabase: any) {
  const geminiKey = env.GEMINI_API_KEY;
  const today = new Date().toISOString().split('T')[0];
  const { data: activeUsers } = await supabase
    .from('users')
    .select('id, display_name, role')
    .eq('is_active', true)
    .gte('last_message_at', today);

  if (!activeUsers || activeUsers.length === 0) {
    return { processed: 0, message: 'No active users today' };
  }

  const results = [];
  for (const user of activeUsers) {
    const result = await extractDailyInsights(supabase, geminiKey, user);
    results.push({ user: user.display_name, ...result });
  }

  // 月初プルーニング
  const dom = new Date().getUTCDate();
  if (dom === 1) {
    await supabase.from('knowledge_base')
      .update({ is_active: false })
      .eq('access_count', 0)
      .lt('created_at', new Date(Date.now() - 90 * 86400000).toISOString());
    try {
      await (supabase.rpc as any)('prune_low_confidence_patterns');
    } catch {
      await supabase.from('patterns')
        .update({ is_active: false })
        .lt('confidence', 0.3)
        .gte('hit_count', 5);
    }
  }
  return { processed: results.length };
}

// ── タスク2: 朝のブリーフィング ───────────────────
async function runMorningBriefing(supabase: any) {
  const token = env.LINE_CHANNEL_ACCESS_TOKEN;

  // 初期パターン投入（一度だけ）
  const { count: patternCount } = await supabase.from('patterns').select('*', { count: 'exact', head: true });
  if ((patternCount ?? 0) === 0) {
    try {
      await supabase.from('patterns').insert([
        { pattern_type: 'seasonal', title: '月末経費精算', description: '月末です。経費の精算をお忘れなく！', trigger_condition: { type: 'date', day_of_month: 25 }, confidence: 0.8 },
        { pattern_type: 'reminder', title: '金曜日報リマインド', description: '週末前に今週の日報を確認しましょう', trigger_condition: { type: 'time', day_of_week: [5], hour: 15 }, confidence: 0.7 },
        { pattern_type: 'seasonal', title: '月初タスク確認', description: '新しい月です。今月のタスクを確認しましょう！', trigger_condition: { type: 'date', day_of_month: 1 }, confidence: 0.8 },
      ]);
    } catch {}
  }

  const { data: users } = await supabase
    .from('users')
    .select('id, line_user_id, display_name, role')
    .eq('is_active', true)
    .in('role', ['owner', 'manager']);

  if (!users || users.length === 0) return { sent: 0 };

  let sentCount = 0;
  for (const user of users) {
    const message = await buildMorningBriefing(supabase, user);
    if (message && user.line_user_id) {
      const sent = await linePush(user.line_user_id, message, token);
      if (sent) sentCount++;
    }
  }

  // 月曜: 週次レポート
  const weeklyReport = await buildWeeklyReport(supabase);
  if (weeklyReport) {
    const owner = users.find((u: any) => u.role === 'owner');
    if (owner?.line_user_id) {
      await linePush(owner.line_user_id, weeklyReport, token);
      sentCount++;
    }
  }
  return { sent: sentCount, total: users.length };
}

// ── タスク3: タスクリマインド（全ユーザーに個別タスク通知） ──
async function runTaskReminders(supabase: any) {
  const token = env.LINE_CHANNEL_ACCESS_TOKEN;
  const now = new Date();
  const today = new Date(now.getTime() + 9 * 3600000).toISOString().split('T')[0];

  // アクティブな全ユーザーを取得
  const { data: users } = await supabase
    .from('users')
    .select('id, line_user_id, display_name')
    .eq('is_active', true);

  if (!users || users.length === 0) return { sent: 0, message: 'No active users' };

  let sentCount = 0;
  for (const user of users) {
    if (!user.line_user_id) continue;

    // このユーザーの未完了タスクを全件取得
    const { data: tasks } = await supabase
      .from('tasks')
      .select('title, priority, due_date, status')
      .eq('assignee_id', user.id)
      .in('status', ['pending', 'in_progress'])
      .order('priority')
      .order('due_date', { ascending: true })
      .limit(20);

    if (!tasks || tasks.length === 0) continue;

    // 期限別に分類
    const overdue = tasks.filter((t: any) => t.due_date && t.due_date < today);
    const dueToday = tasks.filter((t: any) => t.due_date === today);
    const upcoming = tasks.filter((t: any) => t.due_date && t.due_date > today);
    const noDue = tasks.filter((t: any) => !t.due_date);

    const shortDate = (d: string) => {
      const [, m, day] = d.split('-');
      return `${Number(m)}/${Number(day)}`;
    };

    const lines: string[] = [`📋 今日のタスク（${tasks.length}件）`];

    for (const t of overdue) {
      lines.push(`🔴 ${t.title}（${shortDate(t.due_date)}期限切れ）`);
    }
    for (const t of dueToday) {
      lines.push(`🟡 ${t.title}`);
    }
    for (const t of upcoming) {
      lines.push(`▫️ ${t.title}（〜${shortDate(t.due_date)}）`);
    }
    for (const t of noDue) {
      lines.push(`▫️ ${t.title}`);
    }

    const sent = await linePush(user.line_user_id, lines.join('\n'), token);
    if (sent) sentCount++;
  }

  return { sent: sentCount, users: users.length };
}

// ── ハンドラ ──────────────────────────────────────
export default async function handler(req: any, res: any) {
  const authHeader = req.headers['authorization'] || '';
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && !req.headers['x-vercel-cron']) {
    if (process.env.VERCEL) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const supabase = getSupabase();

  // 全タスクを並列実行（個別エラー隔離）
  const results = await Promise.all([
    safeRun('task-reminders', () => runTaskReminders(supabase)),
    safeRun('daily-memory', () => runDailyMemory(supabase)),
  ]);

  const hasError = results.some((r) => r.status === 'error');
  return res.status(hasError ? 207 : 200).json({ status: 'ok', results });
}

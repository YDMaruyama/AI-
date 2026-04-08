/**
 * 統合 Cron マスター
 * Vercel Hobby は cron 2個まで＋1日1回しか走らせられないため、
 * このエンドポイントを 1日1回呼び出し、UTC時刻で各タスクを内部分岐する。
 *
 * スケジュール:
 * - 毎日 13:00 UTC (= 22:00 JST): 日次記憶抽出 + 朝のブリーフィング前準備
 * - その後すぐ朝のブリーフィング送信もまとめて実行（朝の前日23:30 UTC送信から、
 *   1日1回統合運用に変更：22:00 JSTにブリーフィングデータ確定→push）
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
    safeRun('daily-memory', () => runDailyMemory(supabase)),
    safeRun('morning-briefing', () => runMorningBriefing(supabase)),
  ]);

  const hasError = results.some((r) => r.status === 'error');
  return res.status(hasError ? 207 : 200).json({ status: 'ok', results });
}

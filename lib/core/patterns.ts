/**
 * パターンマッチング & 朝のブリーフィング
 * 検出済みパターンを評価し、先回り提案メッセージを組み立てる
 */
import { getToday, getNowJST } from './utils';
import { logger } from './logger';
import { skillRegistry } from '../skills';

/** 朝のブリーフィングメッセージを組み立て */
export async function buildMorningBriefing(
  supabase: any,
  user: { id: string; display_name: string; role: string }
): Promise<string | null> {
  const today = getToday();
  const now = getNowJST();
  const dayOfWeek = now.getUTCDay(); // 0=日, 1=月...

  const parts: string[] = [`🌅 おはようございます、${user.display_name}さん！`];
  const topActions: string[] = []; // 今日の最優先アクション

  try {
    // 1. 今日のタスク
    const { data: tasks } = await supabase
      .from('tasks')
      .select('title, priority, due_date, status')
      .in('status', ['pending', 'in_progress'])
      .or(user.role === 'owner' ? 'id.not.is.null' : `assignee_id.eq.${user.id}`)
      .order('priority')
      .limit(10);
    if (tasks && tasks.length > 0) {
      const overdue = tasks.filter((t: any) => t.due_date && t.due_date < today);
      const todayDue = tasks.filter((t: any) => t.due_date === today);
      // 期限切れを最優先アクションに
      overdue.forEach((t: any) => topActions.push(`🔴 期限切れ: ${t.title}`));
      todayDue.forEach((t: any) => topActions.push(`🟡 今日期限: ${t.title}`));
      parts.push(`📋 タスク: ${tasks.length}件${overdue.length > 0 ? `（⚠ 期限切れ${overdue.length}件）` : ''}`);
    }

    // 2. 今日の予定
    const { data: events } = await supabase
      .from('calendar_events')
      .select('title, start_time')
      .gte('start_time', today)
      .lt('start_time', today + 'T23:59:59')
      .order('start_time')
      .limit(3);
    if (events && events.length > 0) {
      const evtList = events.map((e: any) => {
        const t = new Date(new Date(e.start_time).getTime() + 9 * 3600000);
        return `  ${t.getUTCHours()}:${String(t.getUTCMinutes()).padStart(2, '0')} ${e.title}`;
      }).join('\n');
      parts.push(`📅 今日の予定:\n${evtList}`);
    }

    // 2.5 今日のサロン予約
    const { data: todayReservations } = await supabase
      .from('reservations')
      .select('customer_name, menu_name, start_time')
      .gte('start_time', `${today}T00:00:00+09:00`)
      .lte('start_time', `${today}T23:59:59+09:00`)
      .neq('status', 'cancelled')
      .order('start_time', { ascending: true });
    if (todayReservations && todayReservations.length > 0) {
      const rsvList = todayReservations.map((r: any) => {
        const t = new Date(r.start_time);
        const h = String(t.getHours()).padStart(2, '0');
        const m = String(t.getMinutes()).padStart(2, '0');
        return `  ${h}:${m} ${r.customer_name || '名前なし'} - ${r.menu_name || ''}`;
      }).join('\n');
      parts.push(`💆 本日の予約（${todayReservations.length}件）:\n${rsvList}`);
    }

    // 3. 昨日の未提出日報（社長/管理者向け）
    if (user.role === 'owner' || user.role === 'manager') {
      const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];
      const { data: activeUsers } = await supabase
        .from('users')
        .select('id, display_name')
        .eq('is_active', true)
        .in('role', ['owner', 'manager', 'staff']);
      const { data: reports } = await supabase
        .from('daily_reports')
        .select('user_id')
        .eq('report_date', yesterday);
      if (activeUsers && reports) {
        const reportedIds = new Set(reports.map((r: any) => r.user_id));
        const missing = activeUsers.filter((u: any) => !reportedIds.has(u.id));
        if (missing.length > 0) {
          parts.push(`⚠ 昨日の未提出日報: ${missing.map((u: any) => u.display_name).join('、')}`);
        }
      }
    }

    // 4. 経費異常検出（社長/管理者向け）
    if (user.role === 'owner' || user.role === 'manager') {
      const anomalies = await detectExpenseAnomalies(supabase, today);
      if (anomalies.length > 0) {
        parts.push(`🚨 経費異常検出:\n${anomalies.join('\n')}`);
      }
    }

    // 4.5 スキルレジストリからのブリーフィング
    const providers = skillRegistry.getBriefingProviders();
    for (const provider of providers) {
      if (provider.roles && !provider.roles.includes(user.role)) continue;
      try {
        const section = await provider.provide(supabase, user, today);
        if (section) parts.push(section);
        // topActions追加
        if (provider.topActions) {
          const actions = await provider.topActions(supabase, user, today);
          topActions.push(...actions);
        }
      } catch (e: any) {
        logger.warn('patterns', 'Skill briefing provider failed', { error: e?.message });
      }
    }

    // 5. 行政書類期限カウントダウン（社長向け）
    if (user.role === 'owner') {
      const deadlines = await getAdminDocDeadlines(supabase, today);
      if (deadlines.length > 0) {
        parts.push(`📄 行政書類の期限:\n${deadlines.join('\n')}`);
      }
    }

    // 6. KPI異常検知（社長向け）
    if (user.role === 'owner') {
      const kpiAlerts: string[] = [];
      // 3日以上日報未提出スタッフ
      const threeDaysAgo = new Date(now.getTime() - 3 * 86400000).toISOString().split('T')[0];
      const { data: allStaff } = await supabase.from('users').select('id, display_name').eq('is_active', true).in('role', ['staff', 'manager']);
      const { data: recentReports } = await supabase.from('daily_reports').select('user_id').gte('report_date', threeDaysAgo);
      if (allStaff && recentReports) {
        const recentReporters = new Set((recentReports || []).map((r: any) => r.user_id));
        const silentStaff = allStaff.filter((u: any) => !recentReporters.has(u.id));
        if (silentStaff.length > 0) {
          kpiAlerts.push(`  📋 3日以上日報未提出: ${silentStaff.map((u: any) => u.display_name).join('、')}`);
        }
      }
      // 予約のない空き日が3日連続
      const in3Days = new Date(now.getTime() + 3 * 86400000).toISOString().split('T')[0];
      const { count: upcomingRsv } = await supabase.from('reservations').select('id', { count: 'exact', head: true })
        .gte('start_time', `${today}T00:00:00+09:00`).lte('start_time', `${in3Days}T23:59:59+09:00`).neq('status', 'cancelled');
      if ((upcomingRsv ?? 0) === 0) {
        kpiAlerts.push('  💆 今後3日間サロン予約ゼロ');
        topActions.push('🟡 サロン集客: 3日間予約なし');
      }
      if (kpiAlerts.length > 0) {
        parts.push(`📊 KPIアラート:\n${kpiAlerts.join('\n')}`);
      }
    }

    // 7. パターンベース提案
    const { data: activePatterns } = await supabase
      .from('patterns')
      .select('*')
      .eq('is_active', true)
      .gte('confidence', 0.4)
      .or(`user_id.eq.${user.id},user_id.is.null`);

    if (activePatterns) {
      for (const p of activePatterns) {
        const suggestion = evaluatePattern(p, today, dayOfWeek);
        if (suggestion) {
          parts.push(`💡 ${suggestion}`);
          // last_triggered_at 更新
          await supabase.from('patterns')
            .update({ last_triggered_at: new Date().toISOString() })
            .eq('id', p.id);
        }
      }
    }

    // 最低限の内容がなければ送らない
    if (parts.length <= 1) return null;

    // 「今日の最優先」を挨拶の直後に挿入（最大3件）
    if (topActions.length > 0) {
      const top3 = topActions.slice(0, 3).join('\n');
      parts.splice(1, 0, `\n🎯 今日の最優先:\n${top3}`);
    }

    return parts.join('\n');
  } catch (e: any) {
    logger.error('patterns', 'buildMorningBriefing failed', { error: e?.message });
    return null;
  }
}

/** パターンのトリガー条件を評価 */
function evaluatePattern(
  pattern: any,
  today: string,
  dayOfWeek: number
): string | null {
  const cond = pattern.trigger_condition || {};

  // 時間ベース（曜日チェック）
  if (cond.type === 'time' && cond.day_of_week) {
    if (!cond.day_of_week.includes(dayOfWeek)) return null;
    return pattern.description || pattern.title;
  }

  // 日付ベース（月の日チェック）
  if (cond.type === 'date' && cond.day_of_month) {
    const dom = parseInt(today.split('-')[2], 10);
    if (dom !== cond.day_of_month) return null;
    return pattern.description || pattern.title;
  }

  // 季節ベース（月チェック）
  if (cond.type === 'seasonal' && cond.months) {
    const month = parseInt(today.split('-')[1], 10);
    if (!cond.months.includes(month)) return null;
    return pattern.description || pattern.title;
  }

  // 条件なしのパターン → description があれば常に返す（一般的な提案）
  if (pattern.description && !cond.type) {
    return pattern.description;
  }

  return null;
}

/** 経費異常検出 */
async function detectExpenseAnomalies(supabase: any, today: string): Promise<string[]> {
  const anomalies: string[] = [];
  try {
    const monthStart = today.slice(0, 7) + '-01';
    const prevMonthDate = new Date(new Date(today).getTime() - 35 * 86400000);
    const prevMonth = prevMonthDate.toISOString().slice(0, 7);

    // 今月の経費を取得
    const { data: thisMonth } = await supabase
      .from('expenses').select('amount, category, user_id, store_name, expense_date')
      .gte('expense_date', monthStart);

    // 先月の経費を取得
    const { data: lastMonth } = await supabase
      .from('expenses').select('amount, category')
      .gte('expense_date', prevMonth + '-01')
      .lt('expense_date', monthStart);

    if (!thisMonth) return anomalies;

    // 異常1: 高額経費（1件5万円以上）
    const highExpenses = thisMonth.filter((e: any) => e.amount >= 50000);
    for (const e of highExpenses) {
      anomalies.push(`  ⚠ 高額: ¥${Number(e.amount).toLocaleString()} ${e.store_name || ''} (${e.expense_date})`);
    }

    // 異常2: 今月の合計が先月の1.5倍以上
    if (lastMonth && lastMonth.length > 0) {
      const thisTotal = thisMonth.reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
      const lastTotal = lastMonth.reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
      if (lastTotal > 0 && thisTotal > lastTotal * 1.5) {
        anomalies.push(`  📈 今月合計 ¥${thisTotal.toLocaleString()} は先月(¥${lastTotal.toLocaleString()})の${Math.round(thisTotal / lastTotal * 100)}%`);
      }
    }

    // 異常3: 同一店舗で同日に複数回
    const dayStoreMap: Record<string, number> = {};
    for (const e of thisMonth) {
      if (e.store_name) {
        const key = `${e.expense_date}_${e.store_name}`;
        dayStoreMap[key] = (dayStoreMap[key] || 0) + 1;
      }
    }
    for (const [key, count] of Object.entries(dayStoreMap)) {
      if (count >= 2) {
        const [date, store] = key.split('_');
        anomalies.push(`  🔁 重複? ${store} ${date}に${count}件`);
      }
    }
  } catch (e: any) {
    logger.warn('patterns', 'Expense anomaly detection failed', { error: e?.message });
  }
  return anomalies.slice(0, 5); // 最大5件
}

/** 行政書類期限カウントダウン */
async function getAdminDocDeadlines(supabase: any, today: string): Promise<string[]> {
  const deadlines: string[] = [];
  try {
    const { data: docs } = await supabase
      .from('admin_documents').select('*').eq('is_active', true);
    if (!docs) return deadlines;

    const todayDate = new Date(today);
    const currentMonth = todayDate.getMonth() + 1; // 1-12
    const currentDay = todayDate.getDate();
    const currentYear = todayDate.getFullYear();

    for (const doc of docs) {
      let nextDueDate: Date | null = null;

      if (doc.frequency === 'monthly' && doc.due_day_of_month) {
        // 月次: 今月の期限日
        nextDueDate = new Date(currentYear, todayDate.getMonth(), doc.due_day_of_month);
        if (nextDueDate < todayDate) {
          // 今月の期限が過ぎたら来月
          nextDueDate = new Date(currentYear, todayDate.getMonth() + 1, doc.due_day_of_month);
        }
      } else if (doc.frequency === 'yearly' && doc.due_month) {
        // 年次: 今年のdue_month月末
        const dueDay = doc.due_day_of_month || 28;
        nextDueDate = new Date(currentYear, doc.due_month - 1, dueDay);
        if (nextDueDate < todayDate) {
          nextDueDate = new Date(currentYear + 1, doc.due_month - 1, dueDay);
        }
      }

      if (!nextDueDate) continue;

      const daysLeft = Math.ceil((nextDueDate.getTime() - todayDate.getTime()) / 86400000);

      // 提出済みかチェ��ク
      const period = doc.frequency === 'monthly'
        ? `${nextDueDate.getFullYear()}-${String(nextDueDate.getMonth() + 1).padStart(2, '0')}`
        : `${nextDueDate.getFullYear()}`;
      const { data: record } = await supabase
        .from('admin_document_records')
        .select('status')
        .eq('document_id', doc.id)
        .eq('target_period', period)
        .single();

      if (record?.status === 'submitted') continue; // 提出済みはスキップ

      // 30日以内の期限のみ表示
      if (daysLeft <= 30) {
        const urgency = daysLeft <= 3 ? '🔴' : daysLeft <= 7 ? '🟡' : '🟢';
        const dateStr = `${nextDueDate.getMonth() + 1}/${nextDueDate.getDate()}`;
        deadlines.push(`  ${urgency} ${doc.name}: ${dateStr}まで（残${daysLeft}日）`);
      }
    }

    // 緊急度順にソート
    deadlines.sort();
  } catch (e: any) {
    logger.warn('patterns', 'Admin doc deadline check failed', { error: e?.message });
  }
  return deadlines;
}

/** 週次レポート生成（月曜朝に送信） */
export async function buildWeeklyReport(supabase: any): Promise<string | null> {
  const now = getNowJST();
  if (now.getUTCDay() !== 1) return null; // 月曜以外はスキップ

  const today = getToday();
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
  const monthStart = today.substring(0, 7) + '-01';

  try {
    const [
      { data: tasksCompleted },
      { data: tasksPending },
      { data: expenses },
      { data: sales },
      { data: reservations },
      { data: reports },
    ] = await Promise.all([
      supabase.from('tasks').select('id').eq('status', 'completed').gte('completed_at', weekAgo),
      supabase.from('tasks').select('id').in('status', ['pending', 'in_progress']),
      supabase.from('expenses').select('amount').gte('expense_date', weekAgo),
      supabase.from('daily_sales').select('total_amount, customer_count').gte('sales_date', weekAgo),
      supabase.from('reservations').select('id, status').gte('start_time', `${weekAgo}T00:00:00+09:00`).neq('status', 'cancelled'),
      supabase.from('daily_reports').select('id').gte('report_date', weekAgo),
    ]);

    const expenseTotal = (expenses || []).reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
    const salesTotal = (sales || []).reduce((s: number, e: any) => s + Number(e.total_amount || 0), 0);
    const customerTotal = (sales || []).reduce((s: number, e: any) => s + Number(e.customer_count || 0), 0);
    const completedRsv = (reservations || []).filter((r: any) => r.status === 'completed').length;

    const lines = [
      '📊 週次レポート（先週の実績）',
      '',
      `✅ タスク: ${(tasksCompleted || []).length}件完了 / 残${(tasksPending || []).length}件`,
      `💰 経費: ¥${expenseTotal.toLocaleString()}`,
      `📈 売上: ¥${salesTotal.toLocaleString()}（${customerTotal}名）`,
      `💆 予約: ${(reservations || []).length}件（完了${completedRsv}件）`,
      `📋 日報: ${(reports || []).length}件提出`,
    ];

    return lines.join('\n');
  } catch (e: any) {
    logger.warn('patterns', 'buildWeeklyReport failed', { error: e?.message });
    return null;
  }
}

/** パターンのヒット/ミスを記録（自己強化） */
export async function recordPatternOutcome(
  supabase: any,
  patternId: string,
  hit: boolean
): Promise<void> {
  try {
    const field = hit ? 'hit_count' : 'miss_count';
    const { data } = await supabase
      .from('patterns')
      .select('hit_count, miss_count')
      .eq('id', patternId)
      .single();
    if (!data) return;

    const newHit = (data.hit_count || 0) + (hit ? 1 : 0);
    const newMiss = (data.miss_count || 0) + (hit ? 0 : 1);
    const total = newHit + newMiss;
    const confidence = total > 0 ? newHit / total : 0.5;

    await supabase.from('patterns').update({
      [field]: data[field] + 1,
      confidence,
      is_active: confidence >= 0.3 || total < 10, // 10回以上で精度0.3以下なら停止
    }).eq('id', patternId);
  } catch (e: any) {
    logger.warn('patterns', 'recordPatternOutcome failed', { error: e?.message });
  }
}

import { lineReply } from '../core/line';
import { getToday } from '../core/utils';
import { geminiGenerate } from '../core/gemini';
import { handleError } from '../core/error';
import { stripHonorifics } from '../core/text-utils';

/**
 * 利用者管理（管理者・社長のみ）
 *
 * 使い方:
 * - 「利用者一覧」→ 利用者リスト表示
 * - 「利用者追加 佐藤太郎 A型」→ 利用者登録
 * - 「佐藤さんの出席率」→ 個人の出席率（過去30日）
 * - 「支援計画 佐藤」→ 支援計画の期限確認
 */

/** 利用者管理メインハンドラー */
export async function handleClient(user: any, text: string, replyToken: string, supabase: any, token: string, geminiKey: string) {
  // アクセス制御: 管理者・社長のみ
  if (user.role !== 'owner' && user.role !== 'manager') {
    await lineReply(replyToken, 'この機能は管理者のみ利用できます。', token);
    return;
  }

  const t = text.trim();

  // 利用者一覧
  if (/^利用者(一覧|リスト)?$/.test(t)) {
    return showClientList(user, replyToken, supabase, token);
  }

  // 利用者追加
  if (t.startsWith('利用者追加')) {
    return addClient(user, t, replyToken, supabase, token);
  }

  // 出席率
  if (/出席率/.test(t)) {
    return showAttendanceRate(user, t, replyToken, supabase, token);
  }

  // 支援計画
  if (/支援計画/.test(t)) {
    return showSupportPlan(user, t, replyToken, supabase, token);
  }

  // デフォルト: 利用者一覧
  return showClientList(user, replyToken, supabase, token);
}

/** 利用者一覧 */
async function showClientList(user: any, replyToken: string, supabase: any, token: string) {
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('status', 'active')
    .order('furigana');

  if (!clients || clients.length === 0) {
    await lineReply(replyToken,
      `👥 利用者一覧\n\nまだ利用者が登録されていません。\n\n登録例:\n「利用者追加 佐藤太郎 A型」`,
      token
    );
    return;
  }

  const typeLabel: Record<string, string> = { A: 'A型', B: 'B型', '移行': '移行' };
  const lines = clients.map((c: any, i: number) => {
    const cType = typeLabel[c.client_type] || c.client_type;
    return `${i + 1}. ${c.name}（${cType}）${c.start_date ? ' ' + c.start_date.substring(5) + '~' : ''}`;
  });

  let msg = `👥 利用者一覧（${clients.length}名）\n\n`;
  msg += lines.join('\n');
  msg += `\n\n操作:\n`;
  msg += `・「利用者追加 名前 A型」\n`;
  msg += `・「○○さんの出席率」\n`;
  msg += `・「支援計画 ○○」`;

  await lineReply(replyToken, msg, token);
}

/** 利用者追加 */
async function addClient(user: any, text: string, replyToken: string, supabase: any, token: string) {
  // 「利用者追加 佐藤太郎 A型」のパターンを解析
  const cleaned = text.replace(/^利用者追加\s*/, '').trim();
  if (!cleaned) {
    await lineReply(replyToken, '利用者名を入力してください。\n例: 「利用者追加 佐藤太郎 A型」', token);
    return;
  }

  // 名前と種別を分離
  const typeMatch = cleaned.match(/(A型|B型|移行|a型|b型)/i);
  const clientType = typeMatch ? typeMatch[1].replace(/[aａ]/i, 'A').replace(/[bｂ]/i, 'B').replace('型', '') : 'A';
  const name = cleaned.replace(/(A型|B型|移行|a型|b型)/i, '').trim();

  if (!name) {
    await lineReply(replyToken, '利用者名を入力してください。\n例: 「利用者追加 佐藤太郎 A型」', token);
    return;
  }

  // 重複チェック
  const { data: existing } = await supabase
    .from('clients')
    .select('id')
    .eq('name', name)
    .eq('status', 'active')
    .maybeSingle();

  if (existing) {
    await lineReply(replyToken, `「${name}」さんは既に登録されています。`, token);
    return;
  }

  const today = getToday();
  const { error } = await supabase.from('clients').insert({
    name,
    client_type: clientType,
    status: 'active',
    start_date: today,
  });

  if (error) {
    await handleError(error, 'client:add', replyToken, token, lineReply);
    return;
  }

  await lineReply(replyToken,
    `✅ 利用者を登録しました！\n\n` +
    `👤 ${name}\n` +
    `📋 種別: ${clientType}型\n` +
    `📅 開始日: ${today}`,
    token
  );
}

/** 個人の出席率（過去30日） */
async function showAttendanceRate(user: any, text: string, replyToken: string, supabase: any, token: string) {
  // 名前を抽出
  const nameMatch = text.match(/(.+?)(?:さん|くん|ちゃん)?の?出席率/);
  const searchName = nameMatch ? nameMatch[1].trim() : '';

  if (!searchName) {
    await lineReply(replyToken, '利用者名を指定してください。\n例: 「佐藤さんの出席率」', token);
    return;
  }

  // 名前で利用者を検索（部分一致）
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('status', 'active')
    .ilike('name', `%${stripHonorifics(searchName)}%`);

  if (!clients || clients.length === 0) {
    await lineReply(replyToken, `「${searchName}」に該当する利用者が見つかりません。`, token);
    return;
  }

  const client = clients[0];
  const today = getToday();
  const thirtyDaysAgo = new Date(Date.now() + 9 * 3600000 - 30 * 86400000).toISOString().split('T')[0];

  const { data: records } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('client_id', client.id)
    .gte('date', thirtyDaysAgo)
    .order('date', { ascending: false });

  const total = records?.length || 0;
  const present = records?.filter((r: any) => r.status === 'present').length || 0;
  const absent = records?.filter((r: any) => r.status === 'absent').length || 0;
  const rate = total > 0 ? Math.round((present / total) * 100) : 0;

  let msg = `📊 ${client.name}さんの出席状況\n`;
  msg += `（過去30日間）\n\n`;
  msg += `✅ 出席: ${present}日\n`;
  msg += `❌ 欠席: ${absent}日\n`;
  msg += `📈 出席率: ${rate}%\n`;
  msg += `📅 記録日数: ${total}日`;

  // 最近の欠席理由があれば表示
  const recentAbsent = records?.filter((r: any) => r.status === 'absent' && r.absence_reason).slice(0, 3);
  if (recentAbsent && recentAbsent.length > 0) {
    msg += `\n\n【最近の欠席理由】\n`;
    for (const r of recentAbsent) {
      msg += `${r.date}: ${r.absence_reason}\n`;
    }
  }

  await lineReply(replyToken, msg, token);
}

/** 支援計画の期限確認 */
async function showSupportPlan(user: any, text: string, replyToken: string, supabase: any, token: string) {
  const searchName = stripHonorifics(text.replace(/支援計画\s*/, '').trim());

  // 特定の利用者名がある場合
  if (searchName) {
    const { data: clients } = await supabase
      .from('clients')
      .select('*')
      .eq('status', 'active')
      .ilike('name', `%${searchName}%`);

    if (!clients || clients.length === 0) {
      await lineReply(replyToken, `「${searchName}」に該当する利用者が見つかりません。`, token);
      return;
    }

    const client = clients[0];
    const { data: plans } = await supabase
      .from('support_plans')
      .select('*')
      .eq('client_id', client.id)
      .order('end_date', { ascending: false })
      .limit(1);

    if (!plans || plans.length === 0) {
      await lineReply(replyToken, `${client.name}さんの支援計画はまだ登録されていません。`, token);
      return;
    }

    const plan = plans[0];
    const daysToReview = Math.ceil((new Date(plan.review_date).getTime() - Date.now()) / 86400000);
    const daysToEnd = Math.ceil((new Date(plan.end_date).getTime() - Date.now()) / 86400000);
    const statusIcon = daysToReview <= 7 ? '🔴' : daysToReview <= 30 ? '🟡' : '🟢';

    let msg = `📋 ${client.name}さんの支援計画\n\n`;
    msg += `${statusIcon} 計画番号: 第${plan.plan_number}期\n`;
    msg += `📅 期間: ${plan.start_date} ~ ${plan.end_date}\n`;
    msg += `🔍 見直し日: ${plan.review_date}（${daysToReview > 0 ? `あと${daysToReview}日` : '期限超過'}）\n`;
    msg += `📅 終了まで: ${daysToEnd > 0 ? `あと${daysToEnd}日` : '期限超過'}\n`;
    if (plan.goal_short_term) msg += `\n【短期目標】\n${plan.goal_short_term}\n`;
    if (plan.goal_long_term) msg += `\n【長期目標】\n${plan.goal_long_term}\n`;
    msg += `\nステータス: ${plan.status}`;

    await lineReply(replyToken, msg, token);
    return;
  }

  // 名前なし → 全体の支援計画期限一覧
  const today = getToday();
  const sixtyDaysLater = new Date(Date.now() + 9 * 3600000 + 60 * 86400000).toISOString().split('T')[0];

  const { data: plans } = await supabase
    .from('support_plans')
    .select('*, clients(name)')
    .eq('status', 'active')
    .lte('review_date', sixtyDaysLater)
    .order('review_date', { ascending: true });

  if (!plans || plans.length === 0) {
    await lineReply(replyToken, '60日以内に見直し期限のある支援計画はありません。', token);
    return;
  }

  const lines = plans.map((p: any) => {
    const daysLeft = Math.ceil((new Date(p.review_date).getTime() - Date.now()) / 86400000);
    const icon = daysLeft <= 7 ? '🔴' : daysLeft <= 30 ? '🟡' : '🟢';
    const name = p.clients?.name || '不明';
    return `${icon} ${name} - 見直し: ${p.review_date}（${daysLeft > 0 ? `あと${daysLeft}日` : '期限超過'}）`;
  });

  let msg = `📋 支援計画 期限一覧\n（60日以内）\n\n`;
  msg += lines.join('\n');

  await lineReply(replyToken, msg, token);
}

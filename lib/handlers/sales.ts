import { lineReply } from '../core/line';
import { getToday } from '../core/utils';
import { geminiGenerate } from '../core/gemini';
import { handleError, withRetry } from '../core/error';
import { extractJson } from '../core/gemini-utils';
import { exportToSpreadsheet } from '../core/gas';

/**
 * SALT'NBASE. 売上管理
 *
 * 使い方:
 * - 「売上」→ 今日の売上入力 or 確認
 * - 「売上 50000」→ 今日の売上を50000円で記録
 * - 「売上 今月」→ 月次売上サマリー
 * - 「売上 出力」→ スプシ出力
 * - 「今日の売上5万、客数20人」→ Geminiで自然文解析
 */

/** 売上メインハンドラー */
export async function handleSales(user: any, text: string, replyToken: string, supabase: any, token: string, geminiKey: string) {
  const cleaned = text.replace(/^売上\s*/, '').trim();

  // キーワード判定
  if (!cleaned || cleaned === '確認' || cleaned === '今日') {
    return showTodaySales(user, replyToken, supabase, token);
  }
  if (cleaned === '今月' || cleaned.includes('月次') || cleaned.includes('サマリー')) {
    return showMonthlySales(user, replyToken, supabase, token);
  }
  if (cleaned === '出力' || cleaned === 'スプシ' || cleaned.includes('スプレッドシート')) {
    return exportSales(user, replyToken, supabase, token);
  }
  if (cleaned === 'メール' || cleaned === '送信' || cleaned === '報告') {
    return exportSales(user, replyToken, supabase, token, true);
  }

  // 数値のみ → クイック登録
  const quickNum = cleaned.replace(/[,、]/g, '').match(/^(\d+)$/);
  if (quickNum) {
    return quickSalesRecord(user, parseInt(quickNum[1], 10), replyToken, supabase, token);
  }

  // 自然文 → Gemini で解析
  return smartSalesRecord(user, cleaned, replyToken, supabase, token, geminiKey);
}

/** 今日の売上表示 */
async function showTodaySales(user: any, replyToken: string, supabase: any, token: string) {
  const today = getToday();
  const { data: sale } = await supabase
    .from('daily_sales')
    .select('*')
    .eq('sales_date', today)
    .maybeSingle();

  if (!sale) {
    await lineReply(replyToken,
      `📊 SALT'NBASE. 売上管理\n\n` +
      `今日（${today}）の売上はまだ記録されていません。\n\n` +
      `入力例:\n` +
      `・「売上 50000」\n` +
      `・「今日の売上5万、客数20人」\n` +
      `・「売上 今月」→ 月次サマリー`,
      token
    );
    return;
  }

  let msg = `📊 SALT'NBASE. 本日の売上\n\n`;
  msg += `📅 ${today}\n`;
  msg += `💰 売上合計: ¥${Number(sale.total_amount).toLocaleString()}\n`;
  if (Number(sale.cash_amount)) msg += `  💵 現金: ¥${Number(sale.cash_amount).toLocaleString()}\n`;
  if (Number(sale.card_amount)) msg += `  💳 カード: ¥${Number(sale.card_amount).toLocaleString()}\n`;
  if (Number(sale.other_amount)) msg += `  📱 その他: ¥${Number(sale.other_amount).toLocaleString()}\n`;
  if (sale.customer_count) msg += `👥 客数: ${sale.customer_count}人\n`;
  if (sale.note) msg += `📝 ${sale.note}\n`;

  msg += `\n更新する場合は再度「売上 金額」と送ってください。`;

  await lineReply(replyToken, msg, token);
}

/** クイック売上登録（金額のみ） */
async function quickSalesRecord(user: any, amount: number, replyToken: string, supabase: any, token: string) {
  if (isNaN(amount) || amount <= 0) {
    await lineReply(replyToken, '正しい金額を入力してください（1円以上）。\n例: 「売上 50000」', token);
    return;
  }
  if (amount > 100_000_000) {
    await lineReply(replyToken, '金額が大きすぎます。金額を確認してください。', token);
    return;
  }
  const today = getToday();

  const { error } = await supabase
    .from('daily_sales')
    .upsert({
      sales_date: today,
      total_amount: amount,
      recorded_by: user.id,
    }, { onConflict: 'sales_date' });

  if (error) {
    await handleError(error, 'sales:quick', replyToken, token, lineReply);
    return;
  }

  await lineReply(replyToken,
    `📊 売上を記録しました！\n\n` +
    `📅 ${today}\n` +
    `💰 ¥${amount.toLocaleString()}\n\n` +
    `内訳・客数も記録する場合:\n` +
    `「今日の売上5万、現金3万、カード2万、客数20人」`,
    token
  );
}

/** 自然文から売上情報を解析して記録 */
async function smartSalesRecord(user: any, text: string, replyToken: string, supabase: any, token: string, geminiKey: string) {
  const prompt = `以下のテキストから店舗売上情報を抽出してJSON形式で返してください。今日は${getToday()}です。

テキスト: "${text}"

JSON形式:
{
  "total_amount": 数値（売上合計）,
  "cash_amount": 数値（現金売上、不明なら0）,
  "card_amount": 数値（カード売上、不明なら0）,
  "other_amount": 数値（その他決済、不明なら0）,
  "customer_count": 数値（客数、不明なら0）,
  "note": "メモ（あれば）"
}

注意:
- 「5万」「50000」→ 50000
- 「3万」「30000」→ 30000
- 現金・カードの内訳がない場合はcash_amount=0, card_amount=0
- total_amountは必須
JSONのみ返してください。`;

  try {
    const jsonStr = await withRetry(() => geminiGenerate(geminiKey, prompt));
    const info = extractJson(jsonStr);

    if (!info.total_amount || info.total_amount <= 0) throw new Error('invalid amount');
    if (info.total_amount > 100_000_000) {
      await lineReply(replyToken, '金額が大きすぎます。金額を確認してください。', token);
      return;
    }

    const today = getToday();
    const { error } = await supabase
      .from('daily_sales')
      .upsert({
        sales_date: today,
        total_amount: Number(info.total_amount),
        cash_amount: Number(info.cash_amount || 0),
        card_amount: Number(info.card_amount || 0),
        other_amount: Number(info.other_amount || 0),
        customer_count: Number(info.customer_count || 0),
        note: info.note || null,
        recorded_by: user.id,
      }, { onConflict: 'sales_date' });

    if (error) {
      await handleError(error, 'sales:smart', replyToken, token, lineReply);
      return;
    }

    let msg = `📊 売上を記録しました！\n\n`;
    msg += `📅 ${today}\n`;
    msg += `💰 売上合計: ¥${Number(info.total_amount).toLocaleString()}\n`;
    if (Number(info.cash_amount)) msg += `  💵 現金: ¥${Number(info.cash_amount).toLocaleString()}\n`;
    if (Number(info.card_amount)) msg += `  💳 カード: ¥${Number(info.card_amount).toLocaleString()}\n`;
    if (Number(info.other_amount)) msg += `  📱 その他: ¥${Number(info.other_amount).toLocaleString()}\n`;
    if (info.customer_count) msg += `👥 客数: ${info.customer_count}人\n`;
    if (info.note) msg += `📝 ${info.note}\n`;

    await lineReply(replyToken, msg, token);
  } catch (e) {
    await handleError(e, 'sales:smart', replyToken, token, lineReply);
  }
}

/** 月次売上サマリー */
async function showMonthlySales(user: any, replyToken: string, supabase: any, token: string) {
  const today = getToday();
  const monthStart = today.substring(0, 7) + '-01';

  const { data: sales } = await supabase
    .from('daily_sales')
    .select('*')
    .gte('sales_date', monthStart)
    .order('sales_date', { ascending: true });

  if (!sales || sales.length === 0) {
    await lineReply(replyToken, '今月の売上データがありません。\n\n「売上入力」で登録できます。', token);
    return;
  }

  let totalSales = 0, totalCash = 0, totalCard = 0, totalOther = 0, totalCustomers = 0;
  const lines: string[] = [];

  for (const s of sales) {
    const amt = Number(s.total_amount);
    totalSales += amt;
    totalCash += Number(s.cash_amount || 0);
    totalCard += Number(s.card_amount || 0);
    totalOther += Number(s.other_amount || 0);
    totalCustomers += Number(s.customer_count || 0);
    lines.push(`${s.sales_date.substring(5)} ¥${amt.toLocaleString()}${s.customer_count ? ` (${s.customer_count}人)` : ''}`);
  }

  const avgDaily = Math.round(totalSales / sales.length);

  let msg = `📊 SALT'NBASE. ${today.substring(0, 7)} 売上サマリー\n\n`;
  msg += `💰 売上合計: ¥${totalSales.toLocaleString()}\n`;
  msg += `📈 平均日商: ¥${avgDaily.toLocaleString()}\n`;
  msg += `📅 営業日数: ${sales.length}日\n`;
  if (totalCustomers) msg += `👥 客数合計: ${totalCustomers}人\n`;
  if (totalCash) msg += `💵 現金計: ¥${totalCash.toLocaleString()}\n`;
  if (totalCard) msg += `💳 カード計: ¥${totalCard.toLocaleString()}\n`;
  if (totalOther) msg += `📱 その他計: ¥${totalOther.toLocaleString()}\n`;

  // 日別売上は上位5件に絞り、続きは管理画面へ誘導
  msg += `\n【日別売上（直近5日）】\n`;
  const displayLines = lines.slice(-5);
  msg += displayLines.join('\n');
  if (lines.length > 5) msg += `\n...他${lines.length - 5}日\n続きは管理画面で`;

  await lineReply(replyToken, msg, token);
}

/** 売上データをスプレッドシートに出力 */
async function exportSales(user: any, replyToken: string, supabase: any, token: string, sendEmail: boolean = false) {
  const today = getToday();
  const year = parseInt(today.substring(0, 4), 10);
  const month = parseInt(today.substring(5, 7), 10);
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const monthEnd = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

  const { data: sales } = await supabase
    .from('daily_sales')
    .select('*')
    .gte('sales_date', monthStart)
    .lt('sales_date', monthEnd)
    .order('sales_date', { ascending: true });

  if (!sales || sales.length === 0) {
    await lineReply(replyToken, `${month}月の売上データがありません。\n\n「売上入力」で登録できます。`, token);
    return;
  }

  const header = '日付,売上合計,現金,カード,その他,客数,メモ';
  const rows = sales.map((s: any) =>
    `${s.sales_date},${s.total_amount},${s.cash_amount || 0},${s.card_amount || 0},${s.other_amount || 0},${s.customer_count || 0},${(s.note || '').replace(/,/g, '/')}`
  );
  const csv = header + '\n' + rows.join('\n');
  const title = `SALT'NBASE_売上_${year}年${month}月`;

  let totalSales = 0;
  for (const s of sales) totalSales += Number(s.total_amount);

  try {
    const result = await exportToSpreadsheet({ title, csv, sendEmail });
    if (result?.url) {
      let msg = `📊 ${month}月の売上データをスプレッドシートに出力しました！\n\n` +
        `📎 ${result.url}\n\n` +
        `${sales.length}日分 / 合計¥${totalSales.toLocaleString()}`;
      if (result.emailSent) msg += `\n\n✉️ ${result.emailTo} にメール送信しました`;
      await lineReply(replyToken, msg, token);
      return;
    }
  } catch (e) {
    console.error('GAS sales spreadsheet error:', e);
  }

  // GASが使えない場合はテキスト出力
  await lineReply(replyToken,
    `📊 ${month}月の売上データ（${sales.length}日分）\n\n` +
    `${header}\n${rows.slice(0, 20).join('\n')}` +
    (rows.length > 20 ? `\n...他${rows.length - 20}日` : ''),
    token
  );
}

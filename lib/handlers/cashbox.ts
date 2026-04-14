import { lineReply } from '../core/line';
import { getToday } from '../core/utils';
import { geminiGenerate } from '../core/gemini';
import { handleError, withRetry } from '../core/error';
import { exportToSpreadsheet } from '../core/gas';
import { extractJson } from '../core/gemini-utils';

/**
 * 金庫管理（SALT'NBASE. 現金出納帳）
 *
 * 使い方:
 * - 「金庫」「残高」→ 現在の残高と今日の入出金
 * - 「入金 50000 売上」→ 入金記録
 * - 「出金 3000 備品購入」→ 出金記録
 * - 「金庫 今日の売上5万入れた」→ 自然文で入金
 * - 「金庫 釣り銭用に3000円出した」→ 自然文で出金
 * - 「金庫残高 152000」→ 実際の残高に調整（棚卸し）
 * - 「金庫履歴」→ 直近の取引一覧
 * - 「金庫 今月」→ 月次サマリー
 */

/** 金庫メインハンドラー（自然文対応） */
export async function handleCashbox(user: any, text: string, replyToken: string, supabase: any, token: string, geminiKey: string) {
  const cleaned = text.replace(/^(金庫|残高|現金)\s*/, '').trim();

  // キーワード判定
  if (!cleaned || cleaned === '確認' || cleaned === '残高') {
    return showBalance(user, replyToken, supabase, token);
  }
  if (cleaned === '履歴' || cleaned === '一覧' || cleaned === 'ログ') {
    return showHistory(user, replyToken, supabase, token);
  }
  if (cleaned === '今月' || cleaned.includes('月次') || cleaned.includes('サマリー')) {
    return showMonthlySummary(user, replyToken, supabase, token);
  }
  if (cleaned.startsWith('残高') || cleaned.startsWith('調整')) {
    return adjustBalance(user, cleaned, replyToken, supabase, token);
  }

  // 「入金」「出金」のキーワードがある場合
  if (/^入金/.test(cleaned)) {
    return quickTransaction(user, 'in', cleaned.replace(/^入金\s*/, ''), replyToken, supabase, token, geminiKey);
  }
  if (/^出金/.test(cleaned)) {
    return quickTransaction(user, 'out', cleaned.replace(/^出金\s*/, ''), replyToken, supabase, token, geminiKey);
  }

  // 「出力」「スプシ」→ スプレッドシート出力
  if (cleaned === '出力' || cleaned === 'スプシ' || cleaned.includes('スプレッドシート')) {
    return exportCashbox(user, replyToken, supabase, token);
  }
  // 「メール」「送信」「報告」→ スプシ作成＋メール送信
  if (cleaned === 'メール' || cleaned === '送信' || cleaned === '報告' || cleaned.includes('メール送信')) {
    return exportAndEmailCashbox(user, replyToken, supabase, token);
  }

  // 自然文 → Gemini で入出金を判定
  return smartTransaction(user, cleaned, replyToken, supabase, token, geminiKey);
}

/** 残高表示 */
async function showBalance(user: any, replyToken: string, supabase: any, token: string) {
  const { data: balanceData } = await supabase.from('cashbox_balance').select('*').maybeSingle();
  const balance = balanceData?.current_balance || 0;
  const todayIn = balanceData?.today_in || 0;
  const todayOut = balanceData?.today_out || 0;
  const todayTx = balanceData?.today_transactions || 0;

  // 直近3件
  const { data: recent } = await supabase
    .from('cashbox')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);

  let msg = `🔐 SALT'NBASE. 金庫\n\n`;
  msg += `💰 現在残高: ¥${Number(balance).toLocaleString()}\n\n`;
  msg += `📅 今日の入出金（${todayTx}件）:\n`;
  msg += `  入金: ¥${Number(todayIn).toLocaleString()}\n`;
  msg += `  出金: ¥${Number(todayOut).toLocaleString()}\n`;

  if (recent && recent.length > 0) {
    msg += `\n📋 直近の取引:\n`;
    for (const tx of recent) {
      const sign = tx.type === 'in' ? '+' : tx.type === 'out' ? '-' : '=';
      msg += `  ${tx.transaction_date} ${sign}¥${Number(tx.amount).toLocaleString()} ${tx.description}\n`;
    }
  }

  msg += `\n入力例:\n`;
  msg += `・「入金 50000 売上」\n`;
  msg += `・「出金 3000 備品」\n`;
  msg += `・「金庫 売上5万入れた」`;

  await lineReply(replyToken, msg, token);
}

/** 取引履歴 */
async function showHistory(user: any, replyToken: string, supabase: any, token: string) {
  const { data: history } = await supabase
    .from('cashbox')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(15);

  if (!history || history.length === 0) {
    await lineReply(replyToken, '金庫の取引履歴がありません。', token);
    return;
  }

  const lines = history.map((tx: any) => {
    const sign = tx.type === 'in' ? '⬆️+' : tx.type === 'out' ? '⬇️-' : '🔄';
    return `${tx.transaction_date} ${sign}¥${Number(tx.amount).toLocaleString()} ${tx.description} (残高¥${Number(tx.balance_after).toLocaleString()})`;
  });

  await lineReply(replyToken, `🔐 金庫 取引履歴:\n\n${lines.join('\n')}`, token);
}

/** 月次サマリー */
async function showMonthlySummary(user: any, replyToken: string, supabase: any, token: string) {
  const today = getToday();
  const monthStart = today.substring(0, 7) + '-01';

  const { data: txs } = await supabase
    .from('cashbox')
    .select('*')
    .gte('transaction_date', monthStart)
    .order('transaction_date', { ascending: true });

  if (!txs || txs.length === 0) {
    await lineReply(replyToken, '今月の金庫取引はありません。', token);
    return;
  }

  let totalIn = 0, totalOut = 0;
  const byCategory: Record<string, number> = {};

  for (const tx of txs) {
    if (tx.type === 'in') totalIn += Number(tx.amount);
    if (tx.type === 'out') {
      totalOut += Number(tx.amount);
      const cat = tx.category || 'その他';
      byCategory[cat] = (byCategory[cat] || 0) + Number(tx.amount);
    }
  }

  const catLines = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => `  ${cat}: ¥${amt.toLocaleString()}`);

  const { data: bal } = await supabase.from('cashbox_balance').select('current_balance').maybeSingle();

  let msg = `🔐 金庫 ${today.substring(0, 7)} 月次サマリー\n\n`;
  msg += `💰 現在残高: ¥${Number(bal?.current_balance || 0).toLocaleString()}\n`;
  msg += `⬆️ 入金合計: ¥${totalIn.toLocaleString()}\n`;
  msg += `⬇️ 出金合計: ¥${totalOut.toLocaleString()}\n`;
  msg += `📊 差引: ¥${(totalIn - totalOut).toLocaleString()}\n`;
  msg += `📝 取引件数: ${txs.length}件\n`;

  if (catLines.length > 0) {
    msg += `\n【出金カテゴリ別】\n${catLines.join('\n')}`;
  }

  await lineReply(replyToken, msg, token);
}

/** 残高調整（棚卸し） */
async function adjustBalance(user: any, text: string, replyToken: string, supabase: any, token: string) {
  const numMatch = text.match(/[\d,]+/);
  if (!numMatch) {
    await lineReply(replyToken, '金額を入力してください。\n例: 「金庫残高 152000」', token);
    return;
  }

  const actualBalance = parseInt(numMatch[0].replace(/,/g, ''), 10);
  const { data: bal } = await supabase.from('cashbox_balance').select('current_balance').maybeSingle();
  const currentBalance = Number(bal?.current_balance || 0);
  const diff = actualBalance - currentBalance;

  // DB関数でトランザクション安全に挿入
  const { error } = await supabase.rpc('insert_cashbox_transaction', {
    p_date: getToday(),
    p_type: 'adjust',
    p_amount: actualBalance,
    p_description: `残高調整（実残高: ¥${actualBalance.toLocaleString()}、差異: ${diff >= 0 ? '+' : ''}¥${diff.toLocaleString()}）`,
    p_category: '調整',
    p_recorded_by: user.id,
  });

  if (error) {
    await handleError(error, 'cashbox:adjust', replyToken, token, lineReply);
    return;
  }

  await lineReply(replyToken,
    `🔄 金庫残高を調整しました\n\n` +
    `帳簿残高: ¥${currentBalance.toLocaleString()}\n` +
    `実際残高: ¥${actualBalance.toLocaleString()}\n` +
    `差異: ${diff >= 0 ? '+' : ''}¥${diff.toLocaleString()}\n\n` +
    `💰 現在残高: ¥${actualBalance.toLocaleString()}`,
    token
  );
}

/** キーワード付き取引（入金 50000 売上） */
async function quickTransaction(user: any, type: 'in' | 'out', text: string, replyToken: string, supabase: any, token: string, geminiKey: string) {
  const numMatch = text.match(/[\d,]+/);
  if (!numMatch) {
    await lineReply(replyToken, `金額を入力してください。\n例: 「${type === 'in' ? '入金' : '出金'} 50000 売上」`, token);
    return;
  }

  const amount = parseInt(numMatch[0].replace(/,/g, ''), 10);
  const desc = text.replace(/[\d,]+/, '').replace(/円/g, '').trim() || (type === 'in' ? '入金' : '出金');

  // DB関数でトランザクション安全に挿入
  const { data, error } = await supabase.rpc('insert_cashbox_transaction', {
    p_date: getToday(),
    p_type: type,
    p_amount: amount,
    p_description: desc,
    p_category: desc,
    p_recorded_by: user.id,
  });

  if (error) {
    await handleError(error, 'cashbox:quick', replyToken, token, lineReply);
    return;
  }

  const newBalance = data?.[0]?.balance_after ?? 0;
  const icon = type === 'in' ? '⬆️' : '⬇️';
  await lineReply(replyToken,
    `${icon} ${type === 'in' ? '入金' : '出金'}を記録しました\n\n` +
    `${type === 'in' ? '+' : '-'}¥${amount.toLocaleString()} ${desc}\n\n` +
    `💰 残高: ¥${Number(newBalance).toLocaleString()}`,
    token
  );
}

/** 自然文から入出金を判定して記録 */
async function smartTransaction(user: any, text: string, replyToken: string, supabase: any, token: string, geminiKey: string) {
  const prompt = `以下のテキストから金庫の入出金情報を抽出してJSON形式で返してください。今日は${getToday()}です。

テキスト: "${text}"

JSON形式:
{
  "type": "in"（入金）or "out"（出金）,
  "amount": 数値,
  "description": "説明",
  "category": "売上/仕入/備品/交通費/給与/雑費/その他"
}

判定基準:
- 「入れた」「入金」「売上」「預けた」→ in
- 「出した」「出金」「買った」「支払い」「払った」→ out
JSONのみ返してください。`;

  try {
    // リトライ付きでGemini呼び出し
    const jsonStr = await withRetry(() => geminiGenerate(geminiKey, prompt));
    const info = extractJson(jsonStr);

    if (!info.amount || info.amount <= 0) throw new Error('invalid amount');

    const type = info.type === 'in' ? 'in' : 'out';
    const amount = Number(info.amount);

    // DB関数でトランザクション安全に挿入
    const { data, error } = await supabase.rpc('insert_cashbox_transaction', {
      p_date: getToday(),
      p_type: type,
      p_amount: amount,
      p_description: info.description || text,
      p_category: info.category || 'その他',
      p_recorded_by: user.id,
    });

    if (error) {
      await handleError(error, 'cashbox:smart', replyToken, token, lineReply);
      return;
    }

    const newBalance = data?.[0]?.balance_after ?? 0;
    const icon = type === 'in' ? '⬆️' : '⬇️';
    await lineReply(replyToken,
      `${icon} ${type === 'in' ? '入金' : '出金'}を記録しました\n\n` +
      `${type === 'in' ? '+' : '-'}¥${amount.toLocaleString()} ${info.description || ''}\n` +
      `📁 ${info.category || 'その他'}\n\n` +
      `💰 残高: ¥${Number(newBalance).toLocaleString()}`,
      token
    );
  } catch (e) {
    await handleError(e, 'cashbox:smart', replyToken, token, lineReply);
  }
}

/** 金庫帳簿をスプレッドシートに出力（メール送信オプション付き） */
export async function exportCashbox(user: any, replyToken: string, supabase: any, token: string, sendEmail: boolean = false) {
  const today = getToday();
  const year = parseInt(today.substring(0, 4), 10);
  const month = parseInt(today.substring(5, 7), 10);
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const monthEnd = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

  const { data: txs } = await supabase
    .from('cashbox')
    .select('*')
    .gte('transaction_date', monthStart)
    .lt('transaction_date', monthEnd)
    .order('transaction_date', { ascending: true });

  if (!txs || txs.length === 0) {
    await lineReply(replyToken, `${month}月の金庫データがありません。`, token);
    return;
  }

  const header = '日付,種別,金額,説明,カテゴリ,残高';
  const typeLabel: Record<string, string> = { in: '入金', out: '出金', adjust: '調整' };
  const rows = txs.map((tx: any) =>
    `${tx.transaction_date},${typeLabel[tx.type] || tx.type},${tx.amount},${(tx.description || '').replace(/,/g, '/')},${tx.category || ''},${tx.balance_after || ''}`
  );
  const csv = header + '\n' + rows.join('\n');
  const title = `金庫帳簿_${year}年${month}月`;

  let totalIn = 0, totalOut = 0;
  for (const tx of txs) {
    if (tx.type === 'in') totalIn += Number(tx.amount);
    if (tx.type === 'out') totalOut += Number(tx.amount);
  }

  try {
    const result = await exportToSpreadsheet({ title, csv, sendEmail });
    if (result?.url) {
      let msg = `📊 ${month}月の金庫帳簿をスプレッドシートに出力しました！\n\n` +
        `📎 ${result.url}\n\n` +
        `${txs.length}件 / 入金¥${totalIn.toLocaleString()} / 出金¥${totalOut.toLocaleString()}`;

      if (result.emailSent) {
        msg += `\n\n✉️ ${result.emailTo} にメール送信しました（PDF添付）`;
      }

      await lineReply(replyToken, msg, token);
      return;
    }
  } catch (e) {
    console.error('GAS cashbox spreadsheet/email error:', e);
  }

  // GASが使えない場合はテキストで出力
  await lineReply(replyToken,
    `📊 ${month}月の金庫帳簿（${txs.length}件）\n\n` +
    `${header}\n${rows.slice(0, 20).join('\n')}` +
    (rows.length > 20 ? `\n...他${rows.length - 20}件` : ''),
    token
  );
}

/** 金庫帳簿をメール送信（スプシ + PDF添付） */
export async function exportAndEmailCashbox(user: any, replyToken: string, supabase: any, token: string) {
  return exportCashbox(user, replyToken, supabase, token, true);
}

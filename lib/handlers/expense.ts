import { lineReply, lineReplyWithQuickReply, lineReplyRaw, downloadLineContent } from '../core/line';
import { getToday, getNowJST, getMonthStart, getNextMonthStart } from '../core/utils';
import { geminiGenerate } from '../core/gemini';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { EXPENSE_AGENT_PROMPT } from '../core/agents';
import { exportToSpreadsheet } from '../core/gas';
import { extractJson } from '../core/gemini-utils';
import { GEMINI_MODEL } from '../core/config';

/** 画像を受信 → 1回のAPI呼出で分類+内容抽出を同時実行 */
export async function handleReceiptImage(user: any, messageId: string, replyToken: string, supabase: any, token: string, geminiKey: string) {
  try {
    const imageBuffer = await downloadLineContent(messageId, token);
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const imagePart = { inlineData: { mimeType: 'image/jpeg', data: base64Image } };

    // ── 1回のAPIコールで分類＋内容抽出 ──
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          imagePart,
          { text: `この画像を分析してJSON形式で返してください。

まず画像の種類を判定:
- "receipt": レシート・領収書・請求書・納品書（金額が記載された書類）
- "photo": それ以外（風景・人物・物・スクリーンショット・書類・名刺等すべて）

■ receiptの場合:
{
  "type": "receipt",
  "store_name": "店舗名",
  "date": "YYYY-MM-DD",
  "amount": 数値（税込合計）,
  "category": "交通費/消耗品/食費/通信費/水道光熱費/家賃/保険/修繕費/備品/外注費/会議費/接待交際費/研修費/その他",
  "items": "主な品目"
}

■ photoの場合:
{
  "type": "photo",
  "description": "画像の内容を日本語で2-3文で説明"
}

JSONのみ返してください。` },
        ],
      }],
    });

    const responseText = result.response.text();
    let parsed: any;
    try {
      parsed = extractJson(responseText);
    } catch {
      // JSON解析失敗 → 画像の説明だけ返す
      await lineReply(replyToken, `📷 画像を受け取りました。\n内容を読み取れませんでした。\n\nレシートの場合は、明るい場所で撮り直してみてください。`, token);
      return;
    }

    // ── レシート以外 → 説明を返す ──
    if (parsed.type !== 'receipt') {
      const desc = parsed.description || '内容を確認しました。';
      await lineReply(replyToken, `📷 ${desc}`, token);
      return;
    }

    // ── レシート → 経費登録フロー ──
    const info = parsed;
    const expenseDate = info.date || getToday();
    const amount = info.amount || 0;
    const storeName = info.store_name || '不明';
    const category = info.category || 'その他';
    const description = Array.isArray(info.items) ? info.items.join(', ') : (info.items || '');

    // 重複チェック（同日・同店舗・同金額が直近5分以内にあれば警告）
    const { data: duplicate } = await supabase
      .from('expenses')
      .select('id')
      .eq('user_id', user.id)
      .eq('expense_date', expenseDate)
      .eq('store_name', storeName)
      .eq('amount', amount)
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .limit(1);

    if (duplicate && duplicate.length > 0) {
      await lineReply(replyToken,
        `⚠️ 重複の可能性あり\n\n` +
        `同じ内容の経費が直近に登録されています:\n` +
        `${storeName} ¥${Number(amount).toLocaleString()}\n\n` +
        `登録をスキップしました。\n別の経費の場合は「経費入力 ${storeName} ${amount}円」と送ってください。`,
        token
      );
      return;
    }

    // 確認フローへ（即時登録せずstate保存して確認を求める）
    await supabase.from('conversation_states').upsert({
      user_id: user.id,
      state: 'confirming_receipt',
      context: {
        receipt_data: { date: expenseDate, store: storeName, amount, category, description },
      },
      updated_at: new Date().toISOString(),
    });

    await lineReplyWithQuickReply(replyToken,
      `🧾 レシート読み取り結果:\n\n` +
      `📅 ${expenseDate}\n` +
      `🏪 ${storeName}\n` +
      `💰 ¥${Number(amount).toLocaleString()}\n` +
      `📁 ${category}\n` +
      `📝 ${description}\n\n` +
      `この内容で登録しますか？`,
      ['OK', '修正', 'キャンセル'],
      token
    );
  } catch (e: any) {
    console.error('Image handler error:', e?.message);
    await lineReply(replyToken,
      '📷 画像の処理中にエラーが発生しました。\nもう一度送信してみてください。',
      token
    );
  }
}

/** レシート手動入力開始（スマート対応: テキストに内容があれば一括解析） */
export async function startExpenseInput(user: any, replyToken: string, supabase: any, token: string, geminiKey?: string, text?: string) {
  // テキストから「経費入力」「レシート」「領収書入力」キーワードを除去して追加情報があるか判定
  const extra = (text || '').replace(/経費入力|レシート|領収書入力|経費|入力/g, '').trim();

  if (extra && extra.length >= 3 && geminiKey) {
    // --- スマートモード: 自然文から一括で経費登録 ---
    try {
      const prompt = `${EXPENSE_AGENT_PROMPT}

以下のテキストから経費情報を抽出してJSON形式で返してください。上記のカテゴリ分類ルールに従ってください。今日は${getToday()}です。
テキスト: "${extra}"
形式: {"date":"YYYY-MM-DD","store":"店舗名","amount":数値,"category":"交通費/消耗品/食費/通信費/備品/会議費/その他","description":"内容"}
日付が不明なら今日、店舗名が不明なら"不明"、カテゴリは最も適切なものを推定してください。JSONのみ返してください。`;

      const jsonStr = await geminiGenerate(geminiKey, prompt);
      const info = extractJson(jsonStr);

      const amount = Number(info.amount);
      if (!amount || amount <= 0) throw new Error('invalid amount');

      const date = info.date || getToday();
      const store = info.store || '不明';
      const cat = info.category || 'その他';
      const desc = info.description || '';

      await supabase.from('expenses').insert({
        user_id: user.id,
        expense_date: date,
        store_name: store,
        amount: amount,
        category: cat,
        description: desc,
        status: 'pending',
      });

      // 今月の累計
      const ms = date.substring(0, 7) + '-01';
      const { data: me } = await supabase.from('expenses').select('amount').eq('user_id', user.id).gte('expense_date', ms);
      const mt = (me || []).reduce((s: number, e: any) => s + Number(e.amount), 0);

      await lineReplyWithQuickReply(replyToken,
        `🧾 経費を登録しました！\n\n` +
        `📅 ${date}  🏪 ${store}\n` +
        `💰 ¥${amount.toLocaleString()}  📁 ${cat}\n` +
        (desc ? `📝 ${desc}\n` : '') +
        `\n📊 今月累計: ¥${mt.toLocaleString()}（${(me||[]).length}件）`,
        ['経費修正', '経費削除', '今月の経費'],
        token
      );
      return;
    } catch (e: any) {
      console.error('Smart expense parse error:', e?.message);
      // パース失敗時は従来フローにフォールバック
    }
  }

  // --- 従来の5段階フロー ---
  await supabase.from('conversation_states').upsert({
    user_id: user.id,
    state: 'writing_expense',
    context: { step: 0, data: {} },
    updated_at: new Date().toISOString(),
  });

  await lineReply(replyToken,
    '🧾 経費を入力します。\n\n' +
    '📅 まず日付を教えてください。\n（例: 今日、3/28、2026-03-28）\n\n' +
    '💡 レシートの写真を送ると自動で読み取れます！\n💡 「経費入力 3/30 コメダ 660円 会議費」のように一度に書くと1回で完結します！',
    token
  );
}

/** レシート手動入力の続き */
export async function continueExpenseInput(user: any, text: string, replyToken: string, supabase: any, token: string, geminiKey: string) {
  const { data: stateRow } = await supabase
    .from('conversation_states')
    .select('context')
    .eq('user_id', user.id)
    .maybeSingle();

  const ctx = stateRow?.context || { step: 0, data: {} };
  const step = ctx.step || 0;
  const data = ctx.data || {};

  if (text === 'キャンセル' || text === 'やめる') {
    await supabase.from('conversation_states').upsert({
      user_id: user.id, state: 'idle', context: {}, updated_at: new Date().toISOString(),
    });
    await lineReply(replyToken, '経費入力をキャンセルしました。', token);
    return;
  }

  if (step === 0) {
    // 日付
    const parsed = parseExpenseDate(text);
    data.date = parsed || getToday();
    ctx.step = 1;
    ctx.data = data;
    await supabase.from('conversation_states').upsert({ user_id: user.id, state: 'writing_expense', context: ctx, updated_at: new Date().toISOString() });
    // 直近の店舗名を候補として表示
    const { data: recentStores } = await supabase
      .from('expenses')
      .select('store_name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    const uniqueStores = [...new Set((recentStores || []).map((e: any) => e.store_name).filter(Boolean))].slice(0, 5);
    if (uniqueStores.length > 0) {
      await lineReplyWithQuickReply(replyToken, `📅 ${data.date}\n\n🏪 次に店舗名を教えてください。`, uniqueStores as string[], token);
    } else {
      await lineReply(replyToken, `📅 ${data.date}\n\n🏪 次に店舗名を教えてください。`, token);
    }

  } else if (step === 1) {
    // 店舗名
    data.store = text;
    ctx.step = 2;
    ctx.data = data;
    await supabase.from('conversation_states').upsert({ user_id: user.id, state: 'writing_expense', context: ctx, updated_at: new Date().toISOString() });
    await lineReply(replyToken, `🏪 ${data.store}\n\n💰 金額を教えてください。（例: 1500、¥3,200）`, token);

  } else if (step === 2) {
    // 金額（¥5,200 → 5200, 5200円 → 5200, ５２００ → 5200 全角対応）
    const cleaned = text
      .replace(/[¥￥,、\s円]/g, '')
      .replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
    const amount = parseInt(cleaned, 10);
    if (isNaN(amount)) {
      await lineReply(replyToken, '金額を数字で入力してください。（例: 1500）', token);
      return;
    }
    data.amount = amount;
    ctx.step = 3;
    ctx.data = data;
    await supabase.from('conversation_states').upsert({ user_id: user.id, state: 'writing_expense', context: ctx, updated_at: new Date().toISOString() });
    // ユーザーの使用頻度でカテゴリをソート
    const { data: recentCats } = await supabase
      .from('expenses')
      .select('category')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    const catFreq: Record<string, number> = {};
    (recentCats || []).forEach((e: any) => { if (e.category) catFreq[e.category] = (catFreq[e.category] || 0) + 1; });
    const allCats = ['交通費', '消耗品', '食費', '通信費', '水道光熱費', '家賃', '保険', '修繕費', '備品', '外注費', '会議費', '接待交際費', 'その他'];
    const sortedCats = [...allCats].sort((a, b) => (catFreq[b] || 0) - (catFreq[a] || 0));
    await lineReplyWithQuickReply(replyToken,
      `💰 ¥${amount.toLocaleString()}\n\n📁 カテゴリを選んでください:`,
      sortedCats.slice(0, 13),
      token
    );

  } else if (step === 3) {
    // カテゴリ
    const validCategories = ['交通費', '消耗品', '食費', '通信費', '水道光熱費', '家賃', '保険', '修繕費', '備品', '外注費', '会議費', '接待交際費', '研修費', 'その他'];
    data.category = validCategories.includes(text) ? text : 'その他';
    ctx.step = 4;
    ctx.data = data;
    await supabase.from('conversation_states').upsert({ user_id: user.id, state: 'writing_expense', context: ctx, updated_at: new Date().toISOString() });
    await lineReplyWithQuickReply(replyToken, `📁 ${data.category}\n\n📝 メモがあれば入力してください。`, ['なし'], token);

  } else if (step === 4) {
    // メモ → 保存
    data.description = text === 'なし' ? '' : text;

    await supabase.from('expenses').insert({
      user_id: user.id,
      expense_date: data.date,
      store_name: data.store,
      amount: data.amount,
      category: data.category,
      description: data.description,
      status: 'pending',
    });

    await supabase.from('conversation_states').upsert({
      user_id: user.id, state: 'idle', context: {}, updated_at: new Date().toISOString(),
    });

    // 今月累計
    const ms2 = data.date.substring(0, 7) + '-01';
    const { data: me2 } = await supabase.from('expenses').select('amount').eq('user_id', user.id).gte('expense_date', ms2);
    const mt2 = (me2 || []).reduce((s: number, e: any) => s + Number(e.amount), 0);

    await lineReplyWithQuickReply(replyToken,
      `🧾 経費を登録しました！\n\n` +
      `📅 ${data.date}  🏪 ${data.store}\n` +
      `💰 ¥${data.amount.toLocaleString()}  📁 ${data.category}\n` +
      (data.description ? `📝 ${data.description}\n` : '') +
      `\n📊 今月累計: ¥${mt2.toLocaleString()}（${(me2||[]).length}件）`,
      ['経費修正', '経費削除', '今月の経費'],
      token
    );
  }
}

/** 今月の経費サマリー */
export async function showExpenseSummary(user: any, text: string, replyToken: string, supabase: any, token: string) {
  const now = getNowJST();
  const month = now.getUTCMonth();
  const startDate = getMonthStart();
  const endDate = getNextMonthStart();

  let query = supabase
    .from('expenses')
    .select('*')
    .gte('expense_date', startDate)
    .lt('expense_date', endDate)
    .order('expense_date', { ascending: true });

  // ownerは全員分、それ以外は自分のみ
  if (user.role !== 'owner') {
    query = query.eq('user_id', user.id);
  }

  const { data: expenses } = await query;

  if (!expenses || expenses.length === 0) {
    await lineReply(replyToken, `${month + 1}月の経費はまだ登録されていません。`, token);
    return;
  }

  // カテゴリ別集計
  const byCategory: Record<string, number> = {};
  let total = 0;
  for (const e of expenses) {
    const cat = e.category || 'その他';
    byCategory[cat] = (byCategory[cat] || 0) + Number(e.amount);
    total += Number(e.amount);
  }

  const catLines = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amount]) => `  ${cat}: ¥${amount.toLocaleString()}`);

  const recentLines = expenses.slice(-5).map((e: any) =>
    `  ${e.expense_date} ${e.store_name} ¥${Number(e.amount).toLocaleString()} (${e.category})`
  );

  // 長いメッセージを2つに分割して送信
  const msg1 = `📊 ${month + 1}月の経費サマリー\n\n` +
    `合計: ¥${total.toLocaleString()} （${expenses.length}件）\n\n` +
    `【カテゴリ別】\n${catLines.join('\n')}`;

  const msg2 = `【直近の登録】\n${recentLines.join('\n')}\n\n` +
    `スプレッドシートに出力するには「経費出力」と送ってください。`;

  await lineReplyRaw(replyToken, [
    { type: 'text', text: msg1 },
    { type: 'text', text: msg2 },
  ], token);
}

/** 経費をGoogleスプレッドシートに出力（メール送信オプション付き） */
export async function exportExpenses(user: any, replyToken: string, supabase: any, token: string, sendEmail: boolean = false) {
  const now = getNowJST();
  const month = now.getUTCMonth();
  const year = now.getUTCFullYear();
  const startDate = getMonthStart();
  const endDate = getNextMonthStart();

  let query = supabase
    .from('expenses')
    .select('expense_date, store_name, amount, category, description, payment_method')
    .gte('expense_date', startDate)
    .lt('expense_date', endDate)
    .order('expense_date', { ascending: true });

  if (user.role !== 'owner') {
    query = query.eq('user_id', user.id);
  }

  const { data: expenses } = await query;

  if (!expenses || expenses.length === 0) {
    await lineReply(replyToken, `${month + 1}月の経費データがありません。`, token);
    return;
  }

  const header = '日付,店舗名,金額,カテゴリ,内容,支払方法';
  const rows = expenses.map((e: any) =>
    `${e.expense_date},${e.store_name || ''},${e.amount},${e.category},${(e.description || '').replace(/,/g, '/')},${e.payment_method || '現金'}`
  );
  const csv = header + '\n' + rows.join('\n');
  const title = `経費一覧_${year}年${month + 1}月`;
  const total = expenses.reduce((s: number, e: any) => s + Number(e.amount), 0);

  try {
    const result = await exportToSpreadsheet({ title, csv, sendEmail });
    if (result?.url) {
      let msg = `📊 ${month + 1}月の経費をスプレッドシートに出力しました！\n\n` +
        `📎 ${result.url}\n\n` +
        `${expenses.length}件 / 合計¥${total.toLocaleString()}`;

      if (result.emailSent) {
        msg += `\n\n✉️ ${result.emailTo} にメール送信しました（PDF添付）`;
      }

      await lineReply(replyToken, msg, token);
      return;
    }
  } catch (e) {
    console.error('GAS spreadsheet/email error:', e);
  }

  await lineReply(replyToken,
    `📊 ${month + 1}月の経費データ（${expenses.length}件 / 合計¥${total.toLocaleString()}）\n\n` +
    `${header}\n${rows.slice(0, 20).join('\n')}` +
    (rows.length > 20 ? `\n...他${rows.length - 20}件` : ''),
    token
  );
}

/** 経費レポートをメール送信（スプシ + PDF添付） */
export async function exportAndEmailExpenses(user: any, replyToken: string, supabase: any, token: string) {
  return exportExpenses(user, replyToken, supabase, token, true);
}

/** 経費修正（1メッセージで完結。自然文で複数項目を同時変更可能） */
export async function editExpense(user: any, text: string, replyToken: string, supabase: any, token: string, geminiKey: string) {
  // 直近5件の経費を取得（特定指定があれば検索用）
  const { data: recent } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  if (!recent || recent.length === 0) {
    await lineReply(replyToken, '修正できる経費がありません。', token);
    return;
  }

  const cleaned = text.replace(/^(経費修正|修正)\s*/, '').trim();

  // 修正内容が空 → 直近5件を表示して自然文で修正を促す
  if (!cleaned) {
    const list = recent.map((e: any, i: number) =>
      `${i + 1}. ${e.expense_date} ${e.store_name} ¥${Number(e.amount).toLocaleString()} (${e.category})`
    ).join('\n');

    await lineReply(replyToken,
      `🧾 直近の経費:\n\n${list}\n\n` +
      `修正例（1メッセージで完結します）:\n` +
      `・「経費修正 コメダの金額を800円に」\n` +
      `・「経費修正 さっきのをカテゴリ会議費、金額1200円に」\n` +
      `・「経費修正 トリセンの店名をトリセン足利店に変更」\n` +
      `・「経費修正 2番目のを削除」\n` +
      `・「経費削除」→ 直近1件を削除`,
      token
    );
    return;
  }

  // Geminiで「どの経費を」「何に変更するか」を一括解析
  const recentList = recent.map((e: any, i: number) =>
    `${i + 1}. id=${e.id} 日付=${e.expense_date} 店舗=${e.store_name} 金額=${e.amount} カテゴリ=${e.category}`
  ).join('\n');

  const prompt = `ユーザーの修正指示を解析してください。

直近の経費一覧:
${recentList}

ユーザーの指示: "${cleaned}"

以下のJSON形式で返してください。JSONのみ返してください。
{
  "target_index": 対象の経費番号（1始まり。「さっきの」「直近の」は1。不明なら1）,
  "action": "update" or "delete",
  "updates": {
    "store_name": "変更後の店舗名（変更しない場合はnull）",
    "amount": 変更後の金額（変更しない場合はnull）,
    "category": "変更後のカテゴリ（変更しない場合はnull）",
    "expense_date": "変更後の日付YYYY-MM-DD（変更しない場合はnull）"
  }
}`;

  try {
    const jsonStr = await geminiGenerate(geminiKey, prompt);
    const result = extractJson(jsonStr);

    const idx = Math.max(0, Math.min(recent.length - 1, (result.target_index || 1) - 1));
    const expense = recent[idx];

    // 削除の場合
    if (result.action === 'delete') {
      await supabase.from('expenses').delete().eq('id', expense.id);
      await lineReply(replyToken,
        `🗑️ 経費を削除しました:\n${expense.expense_date} ${expense.store_name} ¥${Number(expense.amount).toLocaleString()}`,
        token
      );
      return;
    }

    // 更新の場合
    const updates: any = {};
    if (result.updates?.store_name) updates.store_name = result.updates.store_name;
    if (result.updates?.amount) updates.amount = result.updates.amount;
    if (result.updates?.category) updates.category = result.updates.category;
    if (result.updates?.expense_date) updates.expense_date = result.updates.expense_date;

    if (Object.keys(updates).length === 0) {
      await lineReply(replyToken, '修正内容を認識できませんでした。\n例: 「経費修正 コメダの金額を800円に」', token);
      return;
    }

    await supabase.from('expenses').update(updates).eq('id', expense.id);

    const updated = { ...expense, ...updates };
    const changes = Object.entries(updates).map(([k, v]) => {
      const label = k === 'store_name' ? '店舗' : k === 'amount' ? '金額' : k === 'category' ? 'カテゴリ' : '日付';
      const old = k === 'amount' ? `¥${Number(expense[k]).toLocaleString()}` : expense[k];
      const val = k === 'amount' ? `¥${Number(v).toLocaleString()}` : v;
      return `  ${label}: ${old} → ${val}`;
    }).join('\n');

    await lineReply(replyToken,
      `✅ 経費を修正しました！\n\n` +
      `変更内容:\n${changes}\n\n` +
      `修正後:\n` +
      `📅 ${updated.expense_date}\n` +
      `🏪 ${updated.store_name}\n` +
      `💰 ¥${Number(updated.amount).toLocaleString()}\n` +
      `📁 ${updated.category}`,
      token
    );
  } catch (e) {
    await lineReply(replyToken, '修正に失敗しました。\n例: 「経費修正 コメダの金額を800円に」', token);
  }
}

/** 経費削除（確認付き: 「削除確定」で実行） */
export async function deleteExpense(user: any, replyToken: string, supabase: any, token: string, text?: string) {
  const { data: recent } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1);

  if (!recent || recent.length === 0) {
    await lineReply(replyToken, '削除できる経費がありません。', token);
    return;
  }

  const expense = recent[0];
  const cleanedText = (text || '').replace(/経費削除\s*/, '').trim();

  // 「削除確定」が含まれていたら即削除
  if (cleanedText === '削除確定') {
    await supabase.from('expenses').delete().eq('id', expense.id);
    await lineReply(replyToken,
      `🗑️ 経費を削除しました:\n\n` +
      `📅 ${expense.expense_date}\n` +
      `🏪 ${expense.store_name}\n` +
      `💰 ¥${Number(expense.amount).toLocaleString()}`,
      token
    );
    return;
  }

  // 確認メッセージを表示
  await lineReplyWithQuickReply(replyToken,
    `🗑️ この経費を削除しますか？\n\n` +
    `📅 ${expense.expense_date}\n` +
    `🏪 ${expense.store_name}\n` +
    `💰 ¥${Number(expense.amount).toLocaleString()}\n\n` +
    `「削除確定」と送ると削除されます。`,
    ['削除確定', 'キャンセル'],
    token
  );
}

/** 日付パース（経費用） */
function parseExpenseDate(text: string): string | null {
  const now = getNowJST();
  const yyyy = now.getUTCFullYear();
  const mm = now.getUTCMonth();
  const dd = now.getUTCDate();

  if (text.includes('今日')) return getToday();
  if (text.includes('昨日')) {
    const d = new Date(Date.UTC(yyyy, mm, dd - 1));
    return d.toISOString().split('T')[0];
  }

  const m1 = text.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m1) return `${m1[1]}-${m1[2].padStart(2, '0')}-${m1[3].padStart(2, '0')}`;

  const m2 = text.match(/(\d{1,2})\/(\d{1,2})/);
  if (m2) return `${yyyy}-${m2[1].padStart(2, '0')}-${m2[2].padStart(2, '0')}`;

  const m3 = text.match(/(\d{1,2})月(\d{1,2})日/);
  if (m3) return `${yyyy}-${m3[1].padStart(2, '0')}-${m3[2].padStart(2, '0')}`;

  return null;
}

/** レシートOCR確認フローハンドラー */
export async function handleReceiptConfirmation(user: any, text: string, replyToken: string, supabase: any, token: string, geminiKey: string) {
  const { data: stateData } = await supabase.from('conversation_states').select('context').eq('user_id', user.id).maybeSingle();
  const receiptData = stateData?.context?.receipt_data;

  if (!receiptData) {
    await supabase.from('conversation_states').upsert({ user_id: user.id, state: 'idle', context: {}, updated_at: new Date().toISOString() });
    await lineReply(replyToken, 'レシートデータが見つかりません。もう一度写真を送ってください。', token);
    return;
  }

  if (text === 'OK' || text === 'ok' || text === 'はい') {
    // 経費登録
    await supabase.from('expenses').insert({
      user_id: user.id, expense_date: receiptData.date, store_name: receiptData.store,
      amount: receiptData.amount, category: receiptData.category, description: receiptData.description, status: 'pending',
    });

    // 今月の累計
    const monthStart = receiptData.date.substring(0, 7) + '-01';
    const { data: monthExpenses } = await supabase
      .from('expenses').select('amount').eq('user_id', user.id).gte('expense_date', monthStart);
    const monthTotal = (monthExpenses || []).reduce((s: number, e: any) => s + Number(e.amount), 0);
    const monthCount = (monthExpenses || []).length;

    await supabase.from('conversation_states').upsert({ user_id: user.id, state: 'idle', context: {} });
    await lineReplyWithQuickReply(replyToken,
      `🧾 経費を登録しました！\n\n` +
      `📅 ${receiptData.date}\n🏪 ${receiptData.store}\n💰 ¥${Number(receiptData.amount).toLocaleString()}\n📁 ${receiptData.category}\n\n` +
      `📊 今月の累計: ¥${monthTotal.toLocaleString()}（${monthCount}件）`,
      ['経費修正', '経費削除', '今月の経費'],
      token
    );
  } else if (text === '修正') {
    // 手動入力フローに移行（日付は保持）
    await supabase.from('conversation_states').upsert({
      user_id: user.id, state: 'writing_expense',
      context: { step: 0, data: { date: receiptData.date } },
      updated_at: new Date().toISOString(),
    });
    await lineReply(replyToken, `レシートの日付は ${receiptData.date} です。\n\n🏪 お店の名前を入力してください。`, token);
  } else {
    // キャンセル
    await supabase.from('conversation_states').upsert({ user_id: user.id, state: 'idle', context: {} });
    await lineReply(replyToken, 'レシート読み取りをキャンセルしました。', token);
  }
}

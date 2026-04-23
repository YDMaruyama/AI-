/**
 * SALT'NBASE. 予約管理ハンドラー
 * 「予約」「本日の予約」「予約追加」「メニュー」「顧客」等のキーワードに対応
 */
import { lineReply } from '../core/line';
import { geminiGenerate, stripMarkdown } from '../core/gemini';
import { extractJson } from '../core/gemini-utils';
import { getToday } from '../core/utils';
import { logger } from '../core/logger';
import { stripHonorifics } from '../core/text-utils';

/** 今日の予約一覧を表示 */
export async function showReservations(user: any, text: string, replyToken: string, supabase: any, token: string) {
  const today = getToday();
  // 日付指定があれば抽出
  let targetDate = today;
  const dateMatch = text.match(/(\d{1,2})[\/月](\d{1,2})/);
  if (dateMatch) {
    const year = new Date().getFullYear();
    targetDate = `${year}-${dateMatch[1].padStart(2, '0')}-${dateMatch[2].padStart(2, '0')}`;
  }
  if (/明日/.test(text)) {
    const JST_OFFSET = 9 * 60 * 60 * 1000;
    const tomorrow = new Date(Date.now() + JST_OFFSET + 86400000);
    targetDate = tomorrow.toISOString().split('T')[0];
  }

  const dayStart = `${targetDate}T00:00:00+09:00`;
  const dayEnd = `${targetDate}T23:59:59+09:00`;

  const { data: reservations } = await supabase
    .from('reservations')
    .select('*')
    .gte('start_time', dayStart)
    .lte('start_time', dayEnd)
    .neq('status', 'cancelled')
    .order('start_time', { ascending: true });

  if (!reservations || reservations.length === 0) {
    const label = targetDate === today ? '今日' : targetDate;
    await lineReply(replyToken, `📅 ${label}の予約はありません。\n\n「予約追加 山田さん 14:00 カット」で登録できます。`, token);
    return;
  }

  const lines = reservations.map((r: any) => {
    const time = new Date(r.start_time);
    const h = String(time.getUTCHours() + 9).padStart(2, '0'); // JST
    const m = String(time.getUTCMinutes()).padStart(2, '0');
    const endTime = new Date(r.end_time);
    const eh = String(endTime.getUTCHours() + 9).padStart(2, '0'); // JST
    const em = String(endTime.getUTCMinutes()).padStart(2, '0');
    const status = r.status === 'completed' ? '✅' : '🔵';
    return `${status} ${h}:${m}-${eh}:${em} ${r.customer_name || '名前なし'}\n  ${r.menu_name || ''}${r.note ? ' / ' + r.note : ''}`;
  });

  const label = targetDate === today ? '今日' : targetDate;
  await lineReply(replyToken, `📅 ${label}の予約（${reservations.length}件）\n\n${lines.join('\n\n')}`, token);
}

/** 予約追加（AIで自然言語から抽出） */
export async function addReservation(user: any, text: string, replyToken: string, supabase: any, token: string, geminiKey: string) {
  const today = getToday();

  // メニュー一覧を取得してAIに渡す
  const { data: menus } = await supabase
    .from('salon_menus')
    .select('id, name, duration_minutes, price')
    .eq('is_active', true)
    .order('sort_order');

  const menuList = (menus || []).map((m: any) => `${m.name}(${m.duration_minutes}分/¥${m.price})`).join(', ');

  const prompt = `以下のメッセージから予約情報を抽出してJSON形式で返してください。
今日は${today}です。

利用可能なメニュー: ${menuList}

メッセージ: "${text}"

JSON形式:
{"customer_name":"顧客名","date":"YYYY-MM-DD","time":"HH:MM","menu":"メニュー名","note":"備考"}
- 日付が不明なら今日
- 時間が不明なら"10:00"
- メニュー名はできるだけ上記メニューから選んでください
- JSONのみ返してください`;

  try {
    const result = await geminiGenerate(geminiKey, prompt);
    const info = extractJson(result);

    // メニューをDBから検索
    let menuId = null;
    let menuName = info.menu || '';
    let durationMin = 60;
    if (menus && info.menu) {
      const matched = menus.find((m: any) => m.name.includes(info.menu) || info.menu.includes(m.name));
      if (matched) {
        menuId = matched.id;
        menuName = matched.name;
        durationMin = matched.duration_minutes;
      }
    }

    // 顧客をDBから検索 or 作成
    let customerId = null;
    if (info.customer_name) {
      const { data: existing } = await supabase
        .from('salon_customers')
        .select('id')
        .ilike('name', `%${info.customer_name}%`)
        .limit(1)
        .maybeSingle();
      if (existing) {
        customerId = existing.id;
      } else {
        const { data: newCustomer } = await supabase
          .from('salon_customers')
          .insert({ name: info.customer_name })
          .select('id')
          .maybeSingle();
        customerId = newCustomer?.id;
      }
    }

    // 開始・終了時刻を計算
    const timeStr = info.time || '10:00';
    const dateStr = info.date || today;
    // 日付・時間の形式チェック
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      await lineReply(replyToken, '日付の形式が正しくありません。\n例: 「予約追加 山田さん 14:00 カット」', token);
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(timeStr)) {
      await lineReply(replyToken, '時間の形式が正しくありません。\n例: 「予約追加 山田さん 14:00 カット」', token);
      return;
    }
    const startTime = `${dateStr}T${timeStr}:00+09:00`;
    const endDate = new Date(new Date(startTime).getTime() + durationMin * 60000);
    const endTimeJST = `${dateStr}T${String(endDate.getUTCHours() + 9).padStart(2, '0')}:${String(endDate.getUTCMinutes()).padStart(2, '0')}:00+09:00`;
    const displayTime = `${timeStr}〜${String(endDate.getUTCHours() + 9).padStart(2, '0')}:${String(endDate.getUTCMinutes()).padStart(2, '0')}`;

    await supabase.from('reservations').insert({
      customer_id: customerId,
      customer_name: info.customer_name || '名前なし',
      staff_id: null,
      menu_id: menuId,
      menu_name: menuName,
      start_time: startTime,
      end_time: endTimeJST,
      status: 'confirmed',
      note: info.note || null,
      created_by: user.id,
    });

    // 顧客の来店回数を更新
    if (customerId) {
      await supabase.rpc('increment_visit_count', { cid: customerId }).catch(() => {});
    }
    await lineReply(replyToken,
      `✅ 予約を登録しました\n\n📅 ${dateStr}\n⏰ ${displayTime}\n👤 ${info.customer_name || '名前なし'}\n💆 ${menuName}\n${info.note ? '📝 ' + info.note : ''}`,
      token
    );
  } catch (e: any) {
    logger.error('reservation', 'Add reservation failed', { error: e?.message });
    await lineReply(replyToken, '予約の登録に失敗しました。\n例: 「予約追加 山田さん 14:00 よもぎ蒸し」', token);
  }
}

/** メニュー一覧表示 */
export async function showMenus(user: any, replyToken: string, supabase: any, token: string) {
  const { data: menus } = await supabase
    .from('salon_menus')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (!menus || menus.length === 0) {
    await lineReply(replyToken, 'メニューが登録されていません。', token);
    return;
  }

  // カテゴリごとにグループ化
  const grouped: Record<string, any[]> = {};
  for (const m of menus) {
    const cat = m.category || 'その他';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(m);
  }

  const sections = Object.entries(grouped).map(([cat, items]) => {
    const list = items.map((m: any) =>
      `  💆 ${m.name}\n    ${m.duration_minutes}分 / ¥${Number(m.price).toLocaleString()}`
    ).join('\n');
    return `【${cat}】\n${list}`;
  });

  await lineReply(replyToken, `📋 SALT'NBASE. メニュー\n\n${sections.join('\n\n')}`, token);
}

/** 顧客検索・情報表示 */
export async function showCustomer(user: any, text: string, replyToken: string, supabase: any, token: string) {
  // 顧客名を抽出
  const nameMatch = text.replace(/顧客|お客|カルテ|検索/g, '').trim();

  if (!nameMatch || nameMatch.length < 1) {
    // 最近の顧客一覧
    const { data: recent } = await supabase
      .from('salon_customers')
      .select('name, visit_count, last_visit_at')
      .order('last_visit_at', { ascending: false })
      .limit(10);

    if (!recent || recent.length === 0) {
      await lineReply(replyToken, '顧客データがありません。\n\n予約を追加すると自動で顧客登録されます。', token);
      return;
    }

    const list = recent.map((c: any) => {
      const lastVisit = c.last_visit_at ? new Date(c.last_visit_at).toLocaleDateString('ja-JP') : '未来店';
      return `👤 ${c.name}（来店${c.visit_count || 0}回 / 最終: ${lastVisit}）`;
    }).join('\n');

    await lineReply(replyToken, `👥 最近の顧客（${recent.length}名）\n\n${list}`, token);
    return;
  }

  // 名前で検索
  const { data: customers } = await supabase
    .from('salon_customers')
    .select('*')
    .ilike('name', `%${stripHonorifics(nameMatch)}%`)
    .limit(5);

  if (!customers || customers.length === 0) {
    await lineReply(replyToken, `「${nameMatch}」に該当する顧客が見つかりません。\n\n「顧客」で最近の顧客一覧を確認できます。`, token);
    return;
  }

  const details = customers.map((c: any) => {
    const lastVisit = c.last_visit_at ? new Date(c.last_visit_at).toLocaleDateString('ja-JP') : '未来店';
    return `👤 ${c.name}\n  📞 ${c.phone || '未登録'}\n  📧 ${c.email || '未登録'}\n  🔢 来店${c.visit_count || 0}回 / 最終: ${lastVisit}\n  ${c.preferences ? '💡 ' + c.preferences : ''}${c.notes ? '\n  📝 ' + c.notes : ''}`;
  }).join('\n\n');

  await lineReply(replyToken, `🔍 顧客検索「${nameMatch}」\n\n${details}`, token);
}

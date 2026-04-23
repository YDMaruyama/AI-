/**
 * サロン予約管理スキル
 */
import { defineSkill } from './_define';
import { SchemaType } from '@google/generative-ai';
import { showReservations, addReservation, showMenus, showCustomer } from '../handlers/reservation';
import { getToday } from '../core/utils';
import { stripHonorifics } from '../core/text-utils';

export const reservationSkill = defineSkill({
  id: 'reservation',
  name: 'サロン予約管理',

  intents: ['reservation', 'add_reservation', 'menu', 'customer'],

  routes: [
    { pattern: /^予約追加|^予約登録|^予約入れ/, intent: 'add_reservation', handler: (u, t, rt, s, tk, gk) => addReservation(u, t, rt, s, tk, gk) },
    { pattern: /予約|本日の予約|今日の予約|明日の予約|リザベーション/, intent: 'reservation', handler: (u, t, rt, s, tk) => showReservations(u, t, rt, s, tk) },
    { pattern: /^メニュー$|^施術メニュー|^コース一覧/, intent: 'menu', handler: (u, _t, rt, s, tk) => showMenus(u, rt, s, tk) },
    { pattern: /顧客|お客|カルテ/, intent: 'customer', handler: (u, t, rt, s, tk) => showCustomer(u, t, rt, s, tk) },
  ],

  fastIntents: [
    { pattern: /^予約追加|^予約登録|^予約入れ/, intent: 'add_reservation' },
    { pattern: /予約|本日の予約|今日の予約|明日の予約|リザベーション/, intent: 'reservation' },
    { pattern: /^メニュー$|^施術メニュー|^コース一覧/, intent: 'menu' },
    { pattern: /顧客|お客|カルテ/, intent: 'customer' },
  ],

  intentDescriptions: {
    reservation: '予約確認、今日の予約、明日の予約、本日の予約一覧',
    add_reservation: '予約追加、予約登録、新しい予約を入れる',
    menu: '施術メニュー一覧、コース一覧、メニュー確認',
    customer: '顧客検索、お客様情報、カルテ確認',
  },

  breakKeywords: ['予約', 'メニュー', '顧客'],

  agentTools: [
    {
      name: 'get_reservations',
      description: '指定日の予約一覧を取得。「今日の予約」「明日の予約」「4/10の予約」等。時間・顧客名・メニュー・ステータスを確認できる。',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          date: { type: SchemaType.STRING, description: '日付 YYYY-MM-DD。省略で今日' },
        },
      },
      execute: async (args, supabase, _userId) => {
        const today = getToday();
        const targetDate = args.date || today;
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
          return `${label}の予約はありません。「予約追加 〇〇さん 14:00 メニュー名」で登録できます。`;
        }

        const lines = reservations.map((r: any) => {
          const time = new Date(r.start_time);
          const h = String(time.getUTCHours() + 9).padStart(2, '0');
          const m = String(time.getUTCMinutes()).padStart(2, '0');
          const status = r.status === 'completed' ? '完了' : r.status === 'confirmed' ? '確定' : r.status;
          return `${h}:${m} ${r.customer_name || '名前なし'} / ${r.menu_name || ''} [${status}]`;
        });

        const label = targetDate === today ? '今日' : targetDate;
        return `${label}の予約（${reservations.length}件）:\n${lines.join('\n')}`;
      },
    },
    {
      name: 'get_salon_menus',
      description: 'サロンの施術メニュー一覧を取得。メニュー名・カテゴリ・所要時間・料金を確認できる。',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {},
      },
      execute: async (_args, supabase, _userId) => {
        const { data: menus } = await supabase
          .from('salon_menus')
          .select('name, category, duration_minutes, price')
          .eq('is_active', true)
          .order('sort_order');

        if (!menus || menus.length === 0) return 'メニューが登録されていません。';

        const lines = menus.map((m: any) =>
          `${m.name}（${m.category || 'その他'}）${m.duration_minutes}分 / ¥${Number(m.price).toLocaleString()}`
        );
        return `施術メニュー（${menus.length}件）:\n${lines.join('\n')}`;
      },
    },
    {
      name: 'get_salon_customers',
      description: '顧客情報を検索。名前の部分一致で検索可能。来店回数・最終来店日・電話番号・好みを確認できる。',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING, description: '顧客名（部分一致）。省略で最近の顧客一覧' },
        },
      },
      execute: async (args, supabase, _userId) => {
        const rawName = args.name || '';
        const name = rawName ? stripHonorifics(rawName) : '';

        let q = supabase
          .from('salon_customers')
          .select('name, visit_count, last_visit_at, phone, preferences')
          .order('last_visit_at', { ascending: false })
          .limit(10);

        if (name) {
          q = q.ilike('name', `%${name}%`);
        }

        const { data: customers } = await q;

        if (!customers || customers.length === 0) {
          return name ? `「${name}」に該当する顧客が見つかりません。名前を確認するか「顧客」で一覧を表示できます。` : '顧客データがありません。予約を追加すると自動で顧客登録されます。';
        }

        const lines = customers.map((c: any) => {
          const lastVisit = c.last_visit_at ? new Date(c.last_visit_at).toLocaleDateString('ja-JP') : '未来店';
          return `${c.name}（来店${c.visit_count || 0}回 / 最終: ${lastVisit}）${c.phone ? ' TEL:' + c.phone : ''}${c.preferences ? ' 好み:' + c.preferences : ''}`;
        });

        const label = name ? `顧客検索「${name}」` : '最近の顧客';
        return `${label}（${customers.length}件）:\n${lines.join('\n')}`;
      },
    },
  ],
});

/**
 * 請求書・領収書管理スキル
 */
import { defineSkill } from './_define';
import { SchemaType } from '@google/generative-ai';
import { searchDocuments, showDocumentSummary, addDocument, markPaid } from '../handlers/invoice';
import { getToday } from '../core/utils';

export const invoiceSkill = defineSkill({
  id: 'invoice',
  name: '請求書・領収書管理',

  intents: ['invoice_search', 'invoice_summary', 'add_invoice', 'invoice_paid'],

  routes: [
    { pattern: /^(請求書|領収書)(追加|登録|入力)/, intent: 'add_invoice', handler: (u, t, rt, s, tk, gk) => addDocument(u, t, rt, s, tk, gk) },
    { pattern: /支払い?(完了|済み?|済)/, intent: 'invoice_paid', handler: (u, t, rt, s, tk) => markPaid(u, t, rt, s, tk) },
    { pattern: /請求書.*(検索|確認|見|教え|一覧)|未払い|支払い?期限/, intent: 'invoice_search', handler: (u, t, rt, s, tk, gk) => searchDocuments(u, t, rt, s, tk, gk) },
    { pattern: /請求(まとめ|サマリー)|今月の請求|先月の請求|請求書サマリー/, intent: 'invoice_summary', handler: (u, t, rt, s, tk) => showDocumentSummary(u, t, rt, s, tk) },
    // 短いコマンドのみ。「電気代いくら？」等の自然文は AI Agent (get_documents) に流す
    { pattern: /^(請求書|領収書|インボイス)$|^未払い$/, intent: 'invoice_search', handler: (u, t, rt, s, tk, gk) => searchDocuments(u, t, rt, s, tk, gk) },
  ],

  fastIntents: [
    { pattern: /^(請求書|領収書)(追加|登録|入力)/, intent: 'add_invoice' },
    { pattern: /支払い?(完了|済み?|済)$/, intent: 'invoice_paid' },
    { pattern: /^請求書.*(検索|一覧)$|^未払い$/, intent: 'invoice_search' },
    { pattern: /^請求(まとめ|サマリー)$|^(今月|先月)の請求$/, intent: 'invoice_summary' },
  ],

  intentDescriptions: {
    invoice_search: '請求書検索、未払い確認、電気代・ガス代・水道代・通信費、請求書の金額確認',
    invoice_summary: '請求書サマリー、今月の請求まとめ',
    add_invoice: '請求書追加、領収書追加、請求書登録',
    invoice_paid: '支払い完了、支払い済み',
  },

  breakKeywords: ['請求書', '領収書', '未払い'],

  agentTools: [
    {
      name: 'get_documents',
      description: '請求書・領収書を検索。「電気代」「先月のガス代」「未払い」「Amazonの請求」等。金額・期限・支払状況を確認できる。',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          vendor: { type: SchemaType.STRING, description: '業者名・会社名（部分一致）。電気→電力、ガス→ガス等のキーワードでもOK' },
          status: { type: SchemaType.STRING, description: '支払状態: unpaid, paid, overdue, all。省略で全件' },
          period: { type: SchemaType.STRING, description: 'this_month, last_month, all。省略でall' },
        },
      },
      execute: async (args, supabase, _userId) => {
        const vendor = args.vendor || '';
        const status = args.status || 'all';
        const period = args.period || 'all';
        const today = getToday();
        let q = supabase.from('documents')
          .select('vendor_name, doc_type, amount_total, document_date, due_date, payment_status, expense_category')
          .order('document_date', { ascending: false })
          .limit(15);
        if (vendor) {
          const utilMap: Record<string, string> = { '電気': '電力', '電気代': '電力', 'ガス代': 'ガス', '水道代': '水道', '通信費': 'NTT', '電話代': 'NTT' };
          const mapped = utilMap[vendor] || vendor;
          q = q.ilike('vendor_name', `%${mapped}%`);
        }
        if (status !== 'all') q = q.eq('payment_status', status);
        if (period === 'this_month') {
          q = q.gte('document_date', today.substring(0, 7) + '-01');
        } else if (period === 'last_month') {
          const [y, m] = today.split('-').map(Number);
          const from = m === 1 ? `${y - 1}-12-01` : `${y}-${String(m - 1).padStart(2, '0')}-01`;
          q = q.gte('document_date', from).lt('document_date', today.substring(0, 7) + '-01');
        }
        const { data } = await q;
        if (!data || data.length === 0) return '該当する請求書・領収書はありません。';
        const total = data.reduce((s: number, d: any) => s + Number(d.amount_total || 0), 0);
        const unpaid = data.filter((d: any) => d.payment_status === 'unpaid' || d.payment_status === 'overdue');
        const unpaidTotal = unpaid.reduce((s: number, d: any) => s + Number(d.amount_total || 0), 0);
        let result = `検索結果: ${data.length}件 合計¥${total.toLocaleString()}`;
        if (unpaid.length > 0) result += `（未払い${unpaid.length}件 ¥${unpaidTotal.toLocaleString()}）`;
        result += '\n' + data.map((d: any) => {
          const icon = d.payment_status === 'paid' ? '✅' : d.payment_status === 'overdue' ? '🔴' : '📄';
          return `${icon} ${d.vendor_name} ¥${Number(d.amount_total).toLocaleString()} ${d.document_date}${d.due_date ? ' 期限:' + d.due_date : ''} (${d.expense_category})`;
        }).join('\n');
        return result;
      },
    },
    {
      name: 'get_document_summary',
      description: '請求書・領収書の月次サマリー。カテゴリ別集計、支払済/未払い内訳。「今月の請求合計」「経費カテゴリ別」。',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          period: { type: SchemaType.STRING, description: 'this_month or last_month。省略でthis_month' },
        },
      },
      execute: async (args, supabase, _userId) => {
        const period = args.period || 'this_month';
        const today = getToday();
        const [y, m] = today.split('-').map(Number);
        let targetYear = y, targetMonth = m;
        if (period === 'last_month') {
          targetMonth = m - 1;
          if (targetMonth <= 0) { targetMonth = 12; targetYear--; }
        }
        const { data } = await supabase.from('documents')
          .select('vendor_name, amount_total, payment_status, expense_category')
          .eq('fiscal_year', targetYear).eq('fiscal_month', targetMonth);
        if (!data || data.length === 0) return `${targetMonth}月の請求書・領収書はありません。`;
        let grandTotal = 0, unpaidTotal = 0, paidTotal = 0;
        const byCat: Record<string, number> = {};
        for (const d of data) {
          const amt = Number(d.amount_total || 0);
          grandTotal += amt;
          if (d.payment_status === 'paid') paidTotal += amt; else unpaidTotal += amt;
          const cat = d.expense_category || 'その他';
          byCat[cat] = (byCat[cat] || 0) + amt;
        }
        let result = `${targetMonth}月サマリー: ${data.length}件 合計¥${grandTotal.toLocaleString()}\n`;
        result += `  支払済: ¥${paidTotal.toLocaleString()} / 未払い: ¥${unpaidTotal.toLocaleString()}\n`;
        result += 'カテゴリ別:\n';
        result += Object.entries(byCat).sort((a, b) => b[1] - a[1])
          .map(([cat, total]) => `  ${cat}: ¥${total.toLocaleString()}`).join('\n');
        return result;
      },
    },
  ],

  briefing: {
    order: 45,
    roles: ['owner', 'manager'],
    provide: async (supabase, _user, today) => {
      const weekLater = new Date(new Date(today).getTime() + 7 * 86400000).toISOString().split('T')[0];
      const { data: urgent } = await supabase
        .from('documents')
        .select('vendor_name, amount_total, due_date, payment_status')
        .eq('payment_status', 'unpaid')
        .not('due_date', 'is', null)
        .lte('due_date', weekLater)
        .order('due_date', { ascending: true })
        .limit(10);
      if (!urgent || urgent.length === 0) return null;

      // 期限超過分はpayment_statusを自動更新
      const overdue = urgent.filter((d: any) => d.due_date < today);
      if (overdue.length > 0) {
        await supabase.from('documents')
          .update({ payment_status: 'overdue', updated_at: new Date().toISOString() })
          .eq('payment_status', 'unpaid')
          .lt('due_date', today);
      }

      const lines = urgent.map((d: any) => {
        const isOverdue = d.due_date < today;
        const daysLeft = Math.ceil((new Date(d.due_date).getTime() - new Date(today).getTime()) / 86400000);
        const icon = isOverdue ? '🔴' : daysLeft <= 3 ? '🟡' : '🟢';
        const label = isOverdue ? `期限超過${Math.abs(daysLeft)}日` : `残${daysLeft}日`;
        return `  ${icon} ${d.vendor_name} ¥${Number(d.amount_total).toLocaleString()}（${label} ${d.due_date}）`;
      });
      return `💳 支払期限リマインダー:\n${lines.join('\n')}`;
    },
    topActions: async (supabase, _user, today) => {
      const { data: overdue } = await supabase
        .from('documents')
        .select('vendor_name, amount_total')
        .in('payment_status', ['unpaid', 'overdue'])
        .not('due_date', 'is', null)
        .lt('due_date', today)
        .limit(3);
      if (!overdue || overdue.length === 0) return [];
      return overdue.map((d: any) => `🔴 支払期限超過: ${d.vendor_name} ¥${Number(d.amount_total).toLocaleString()}`);
    },
  },
});

/**
 * 売上・利用者管理スキル
 */
import { defineSkill } from './_define';
import { handleSales } from '../handlers/sales';
import { handleClient } from '../handlers/client';

export const salesSkill = defineSkill({
  id: 'sales',
  name: '売上・利用者管理',

  intents: ['sales', 'client'],

  routes: [
    { pattern: /^売上|^今日の売上|^本日の売上/, intent: 'sales', handler: handleSales },
    { pattern: /^利用者|出席率|^支援計画/, intent: 'client', handler: handleClient },
  ],

  fastIntents: [
    { pattern: /^売上|^今日の売上|^本日の売上/, intent: 'sales' },
    { pattern: /^利用者|出席率|^支援計画/, intent: 'client' },
  ],

  intentDescriptions: {
    sales: '売上入力・確認、今日の売上、月次売上サマリー、売上出力',
    client: '利用者一覧、利用者追加、出席率確認、支援計画の期限',
  },

  breakKeywords: ['売上', '利用者'],
});

/**
 * 売上・金庫・利用者管理スキル
 */
import { defineSkill } from './_define';
import { handleSales } from '../handlers/sales';
import { handleCashbox } from '../handlers/cashbox';
import { handleClient } from '../handlers/client';

export const salesSkill = defineSkill({
  id: 'sales',
  name: '売上・金庫・利用者管理',

  intents: ['sales', 'cashbox', 'client'],

  routes: [
    { pattern: /^売上|^今日の売上|^本日の売上/, intent: 'sales', handler: handleSales },
    { pattern: /^利用者|出席率|^支援計画/, intent: 'client', handler: handleClient },
    { pattern: /金庫|残高|^入金|^出金|現金|出納/, intent: 'cashbox', handler: handleCashbox },
  ],

  fastIntents: [
    { pattern: /^売上|^今日の売上|^本日の売上/, intent: 'sales' },
    { pattern: /^利用者|出席率|^支援計画/, intent: 'client' },
    { pattern: /金庫|残高|^入金|^出金|現金|出納/, intent: 'cashbox' },
  ],

  intentDescriptions: {
    sales: '売上入力・確認、今日の売上、月次売上サマリー、売上出力',
    cashbox: '金庫残高、入金・出金記録、現金出納帳、金庫履歴',
    client: '利用者一覧、利用者追加、出席率確認、支援計画の期限',
  },

  breakKeywords: ['売上', '金庫', '利用者'],
});

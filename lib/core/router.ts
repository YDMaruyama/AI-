/**
 * メッセージルーター
 * スキルレジストリ + レガシールートの統合ルーティング
 */

import { lineReply, linePush, lineReplyWithQuickReply } from './line';
import { geminiGenerate, stripMarkdown } from './gemini';
import { getToday } from './utils';
import { resetState } from './state';
import { saveMemo } from './memory';
import { EXPENSE_AGENT_PROMPT } from './agents';
import { extractJson } from './gemini-utils';
import { trackInteraction, maybeAddKnowledge } from './memory-inline';
import { logger } from './logger';
import type { IntentType } from './types';
import { skillRegistry } from '../skills';

// レガシーimport（まだスキル化されていないもの）
import { showAttendance } from '../handlers/attendance';
import { showOrders } from '../handlers/orders';
import { showShift } from '../handlers/shift';
import { startIncident, continueIncident } from '../handlers/incident';
import { handleInquiry } from '../handlers/inquiry';
import { showAdminDocs } from '../handlers/admin';
import { showStaffList } from '../handlers/staff';
import { aiResponse } from '../handlers/ai';
import { startExpenseInput } from '../handlers/expense';
import { handleMeetingQuery, saveMeetingNote } from '../handlers/notion';
import { showHelp } from '../handlers/help';

// ── 型定義 ──
type RouteHandler = (user: any, text: string, replyToken: string, supabase: any, token: string, geminiKey: string) => Promise<void>;

// ── 会話状態ルート: スキル + レガシーをマージ ──
const SKILL_STATE_ROUTES = skillRegistry.getStateRoutes();
const LEGACY_STATE_ROUTES: Record<string, RouteHandler> = {
  writing_incident: (u, t, rt, s, tk, gk) => continueIncident(u, t, rt, s, tk, gk),
};
const STATE_ROUTES: Record<string, RouteHandler> = {
  ...LEGACY_STATE_ROUTES,
  ...SKILL_STATE_ROUTES,
};

// ── キーワードルート: スキル + レガシーをマージ（順序重要：具体的 → 汎用） ──
interface KeywordRoute {
  pattern: RegExp;
  intent: IntentType;
  handler: RouteHandler;
}

// スキルレジストリからのルート
const SKILL_ROUTES = skillRegistry.getKeywordRoutes() as KeywordRoute[];

// まだスキル化されていないレガシールート
const LEGACY_KEYWORD_ROUTES: KeywordRoute[] = [
  // ヘルプ
  { pattern: /^ヘルプ$|^help$|^使い方$|^できること/, intent: 'general', handler: (u, _t, rt, _s, tk) => showHelp(u, rt, tk) },

  // Quick Reply
  { pattern: /^メモとして保存$/, intent: 'memo', handler: async (u, _t, rt, s, tk) => {
    await saveMemo(s, u.id, '（前の会話の内容をメモ保存）', 'general');
    await lineReply(rt, '📝 メモとして保存しました！', tk);
  }},

  // 出欠・案件・シフト（短いコマンドのみ。修飾付きはAIへ）
  { pattern: /^(出欠|出席)$/, intent: 'attendance', handler: (u, _t, rt, s, tk) => showAttendance(u, rt, s, tk) },
  { pattern: /^(案件|受注)$|^案件一覧$/, intent: 'order', handler: (u, _t, rt, s, tk) => showOrders(u, rt, s, tk) },
  { pattern: /^シフト$/, intent: 'shift', handler: (u, _t, rt, s, tk) => showShift(u, rt, s, tk) },

  // 事故・ヒヤリハット
  { pattern: /^(事故|ヒヤリ(ハット)?)$|^事故報告/, intent: 'incident', handler: (u, t, rt, s, tk, gk) => startIncident(u, rt, s, tk, gk, t) },

  // 見学・行政
  { pattern: /^(見学|問い合わせ)/, intent: 'inquiry', handler: (u, t, rt, s, tk, gk) => handleInquiry(u, t, rt, s, tk, gk) },
  { pattern: /^(行政|書類)$/, intent: 'admin_doc', handler: (u, _t, rt, s, tk) => showAdminDocs(u, rt, s, tk) },

  // 議事録
  { pattern: /^議事録[:：]/, intent: 'meeting', handler: (u, t, rt, s, tk, gk) => saveMeetingNote(u, t, rt, s, tk, gk) },
  { pattern: /^(会議|ミーティング|議事録|打ち合わせ|MTG)$/, intent: 'meeting', handler: (u, t, rt, s, tk, gk) => handleMeetingQuery(u, t, rt, s, tk, gk) },

  // スタッフ
  { pattern: /^(スタッフ一覧|メンバー)$/, intent: 'staff', handler: (u, _t, rt, s, tk) => showStaffList(u, rt, s, tk) },
];

// スキルルートが先（優先）、レガシーが後
const KEYWORD_ROUTES: KeywordRoute[] = [...SKILL_ROUTES, ...LEGACY_KEYWORD_ROUTES];

// ── IntentルートマップをKEYWORD_ROUTESから自動生成（重複排除） ──
const INTENT_MAP = new Map<IntentType, RouteHandler>();
for (const route of KEYWORD_ROUTES) {
  if (!INTENT_MAP.has(route.intent)) {
    INTENT_MAP.set(route.intent, route.handler);
  }
}
// 追加intent（キーワードルートにないもの）
INTENT_MAP.set('memo', async (u, t, _rt, s, _tk, gk) => {
  await saveMemo(s, u.id, t, 'general');
  await aiResponse(u, t, _rt, s, _tk, gk);
});
INTENT_MAP.set('general', (u, t, rt, s, tk, gk) => aiResponse(u, t, rt, s, tk, gk));

// ── breakPattern: スキル + レガシーキーワードで動的生成 ──
const breakKeywordSet = new Set([
  '日報', 'タスク', '出欠', '案件', 'シフト', '予定', '事故',
  '見学', '行政', '経費', '金庫', '売上', '利用者', '会議',
  'スタッフ', 'ヘルプ', '予約', 'メニュー', '顧客',
  ...skillRegistry.getBreakKeywords(),
]);
const breakPattern = new RegExp(`^(${[...breakKeywordSet].join('|')})`);

// ── スキルのintent説明をAIプロンプト用に取得 ──
const skillIntentDescs = skillRegistry.getIntentDescriptions();

// ── AI意図判定 ──
export async function detectIntent(text: string, geminiKey: string): Promise<IntentType> {
  // スキルレジストリの高速パスを先にチェック
  for (const { pattern, intent } of skillRegistry.getFastIntents()) {
    if (pattern.test(text)) return intent as IntentType;
  }

  // レガシー高速パス（まだスキル化されていないもの）
  if (/^(出欠|出席)$/.test(text)) return 'attendance';
  if (/^(案件|受注)$|^案件一覧$/.test(text)) return 'order';
  if (/^シフト$/.test(text)) return 'shift';
  if (/^(スタッフ一覧|メンバー)$/.test(text)) return 'staff';
  if (/^(事故|ヒヤリ(ハット)?)$/.test(text)) return 'incident';
  if (/^(会議|ミーティング|議事録|打ち合わせ|MTG)$/.test(text)) return 'meeting';
  if (/覚えて|メモして|メモ$/.test(text)) return 'memo';
  // 質問形はgeneral
  if (/について|教えて|どう|何\?|何？|知りたい|詳しく/.test(text)) return 'general';
  // 短文（10文字以下）はgeneral（挨拶等）
  if (text.length <= 10) return 'general';

  // AI判定プロンプト: スキル説明を動的注入
  const skillDescLines = Object.entries(skillIntentDescs)
    .map(([intent, desc]) => `- ${intent}: ${desc}`)
    .join('\n');

  const prompt = `ユーザーのメッセージの意図を1つだけ判定。カテゴリ名のみ返してください。

カテゴリと判定基準:
${skillDescLines}
- attendance: 出欠、出席、欠席
- order: 案件、受注、納品、進捗
- shift: シフト、勤務
- incident: 事故、怪我、ヒヤリハット、転倒、破損
- inquiry: 見学、問い合わせ
- admin_doc: 行政書類、提出
- staff: スタッフ一覧、メンバー
- meeting: 会議、ミーティング、議事録、打ち合わせ
- memo: 「覚えて」「メモ」等の明確な保存依頼
- general: 情報共有、質問、雑談、相談、報告。迷ったらgeneralを選ぶこと

【重要ルール】
- 質問（「教えて」「について」「何？」「どう？」「知りたい」）→ 必ずgeneral
- 情報共有（「○○がある」「○○した」）→ general
- 登録・追加・作成が明確（「追加して」「登録して」「入れて」）→ 該当カテゴリ
- 迷ったら → general

メッセージ: "${text}"`;

  try {
    const result = await geminiGenerate(geminiKey, prompt);
    return result.trim().toLowerCase().replace(/[^a-z_]/g, '') as IntentType;
  } catch {
    return 'general';
  }
}

// ── メインルーター ──
export async function routeMessage(
  user: any, text: string, state: string,
  replyToken: string, supabase: any, token: string, geminiKey: string,
): Promise<void> {
  // 1. 会話状態ルート（ただし明確なコマンドキーワードは状態を脱出）
  const stateHandler = STATE_ROUTES[state];
  if (stateHandler) {
    if (breakPattern.test(text)) {
      await resetState(supabase, user.id);
      // フォールスルーして通常キーワードマッチへ
    } else {
      return stateHandler(user, text, replyToken, supabase, token, geminiKey);
    }
  }

  // 2. キーワードマッチ（順序通り走査）
  for (const route of KEYWORD_ROUTES) {
    if (route.pattern.test(text)) {
      trackInteraction(supabase, user.id, route.intent).catch(e => logger.warn('router', 'trackInteraction failed', { error: e?.message }));
      return route.handler(user, text, replyToken, supabase, token, geminiKey);
    }
  }

  // 3. AI意図判定 → INTENTマップ
  const intent = await detectIntent(text, geminiKey);
  trackInteraction(supabase, user.id, intent).catch(e => logger.warn('router', 'trackInteraction failed', { error: e?.message }));

  // expense intentは金額有無でハンドラーを分岐
  if (intent === 'expense') {
    const hasAmount = /[¥￥]?\s*[\d,]+\s*円?/.test(text);
    if (hasAmount) {
      return handleQuickExpense(user, text, replyToken, supabase, token, geminiKey);
    }
    return startExpenseInput(user, replyToken, supabase, token, geminiKey, text);
  }

  // fire-and-forget: 重要な発言をナレッジとして自動保存
  if (user.role === 'owner' && /決まった|ルール|今後は|方針|変更|廃止|導入/.test(text) && text.length >= 10) {
    const title = text.substring(0, 20).replace(/\n/g, ' ');
    maybeAddKnowledge(supabase, {
      category: 'decision',
      title: `社長決定: ${title}`,
      content: text.substring(0, 100),
      tags: ['auto-detect'],
      source_user_id: user.id,
    }).catch(() => {});
  }

  const handler = INTENT_MAP.get(intent) || INTENT_MAP.get('general')!;
  return handler(user, text, replyToken, supabase, token, geminiKey);
}

// ── 音声メッセージルーター ──
export async function routeVoiceIntent(
  intent: string, user: any, transcribedText: string,
  lineUserId: string, supabase: any, token: string, geminiKey: string,
): Promise<void> {
  if (intent === 'expense') {
    const hasAmount = /[¥￥]?\s*[\d,]+\s*円?/.test(transcribedText);
    if (hasAmount) {
      try {
        const prompt = `${EXPENSE_AGENT_PROMPT}\n\n以下のテキストから経費情報を抽出してJSON形式で返してください。上記のカテゴリ分類ルールに従ってください。今日は${getToday()}です。\nテキスト: "${transcribedText}"\n形式: {"date":"YYYY-MM-DD","store":"店舗名","amount":数値,"category":"交通費/消耗品/食費/通信費/備品/会議費/その他","description":"内容"}\n日付が不明なら今日、店舗名が不明なら"不明"、カテゴリは最も適切なものを推定してください。JSONのみ返してください。`;
        const jsonStr = await geminiGenerate(geminiKey, prompt);
        const info = extractJson(jsonStr);
        await supabase.from('expenses').insert({
          user_id: user.id, expense_date: info.date || getToday(), store_name: info.store || '不明',
          amount: info.amount || 0, category: info.category || 'その他', description: info.description || '', status: 'pending',
        });
        await linePush(lineUserId, `🧾 経費を登録しました！\n\n📅 ${info.date}\n🏪 ${info.store}\n💰 ¥${Number(info.amount).toLocaleString()}\n📁 ${info.category}\n📝 ${info.description || ''}\n\n修正が必要なら「経費修正」と送ってください。`, token);
      } catch {
        await linePush(lineUserId, '経費の登録に失敗しました。「レシート」と送って手動入力してください。', token);
      }
      return;
    }
    await linePush(lineUserId, '経費の入力を開始します。\n金額を含めて音声で送るか、「レシート」と送って手動入力してください。', token);
    return;
  }

  const voiceGuide: Partial<Record<IntentType, string>> = {
    daily_report: '日報を作成します。\n今日の業務内容をテキストで送ってください。\n（「日報」と送ると入力モードに入ります）',
    expense_summary: '経費サマリーを表示するには「今月の経費」と送ってください。',
    calendar: '予定の確認・追加はテキストで「予定」「予定追加 ○○」と送ってください。',
    add_calendar: '予定の確認・追加はテキストで「予定」「予定追加 ○○」と送ってください。',
  };

  const guide = voiceGuide[intent as IntentType];
  if (guide) {
    await linePush(lineUserId, guide, token);
    return;
  }

  if (intent === 'memo') {
    await saveMemo(supabase, user.id, transcribedText, 'voice');
    await linePush(lineUserId, '📝 メモとして保存しました。', token);
    return;
  }

  const aiReply = stripMarkdown(await geminiGenerate(geminiKey, `あなたは就労支援事業所「さくら映像研」のAI秘書です。以下のユーザーの音声メッセージに対して親切に回答してください。\n\nユーザー: ${transcribedText}`));
  await linePush(lineUserId, aiReply, token);
}

// ── ワンショット経費登録 ──
async function handleQuickExpense(user: any, text: string, replyToken: string, supabase: any, token: string, geminiKey: string) {
  const prompt = `${EXPENSE_AGENT_PROMPT}

以下のテキストから経費情報を抽出してJSON形式で返してください。上記のカテゴリ分類ルールに従ってください。今日は${getToday()}です。
テキスト: "${text}"
形式: {"date":"YYYY-MM-DD","store":"店舗名","amount":数値,"category":"交通費/消耗品/食費/通信費/備品/会議費/その他","description":"内容"}
日付が不明なら今日、店舗名が不明なら"不明"、カテゴリは最も適切なものを推定してください。JSONのみ返してください。`;

  try {
    const jsonStr = await geminiGenerate(geminiKey, prompt);
    const info = extractJson(jsonStr);
    await supabase.from('expenses').insert({
      user_id: user.id, expense_date: info.date || getToday(), store_name: info.store || '不明',
      amount: info.amount || 0, category: info.category || 'その他', description: info.description || '', status: 'pending',
    });
    await lineReplyWithQuickReply(replyToken,
      `🧾 経費を登録しました！\n\n📅 ${info.date}\n🏪 ${info.store}\n💰 ¥${Number(info.amount).toLocaleString()}\n📁 ${info.category}\n📝 ${info.description || ''}`,
      ['経費修正', '経費削除', '今月の経費'],
      token
    );
  } catch {
    await lineReply(replyToken, '経費の登録に失敗しました。「レシート」と送って手動入力してください。', token);
  }
}

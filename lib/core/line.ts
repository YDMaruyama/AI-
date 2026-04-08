import crypto from 'crypto';
import { LINE_MESSAGE_MAX_LENGTH } from './config';

/** LINE署名検証（timingSafeEqual使用） */
export function verifyLineSignature(body: string | Buffer, signature: string, secret: string): boolean {
  try {
    const expected = crypto.createHmac('SHA256', secret).update(body).digest();
    const actual = Buffer.from(signature, 'base64');
    if (expected.length !== actual.length) return false;
    return crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

/** メッセージをLINE制限内にトランケート */
function truncate(text: string): string {
  const max = LINE_MESSAGE_MAX_LENGTH - 1;
  return text.length > max ? text.substring(0, max - 3) + '...' : text;
}

/** 長文を分割（改行区切りで自然に分割、最大5メッセージ） */
function splitMessage(text: string, maxLen = LINE_MESSAGE_MAX_LENGTH): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0 && chunks.length < 5) {
    if (remaining.length <= maxLen) { chunks.push(remaining); break; }
    // 改行で自然に分割
    let splitAt = remaining.lastIndexOf('\n', maxLen);
    if (splitAt < maxLen * 0.3) splitAt = maxLen; // 改行が見つからない場合は強制分割
    chunks.push(remaining.substring(0, splitAt));
    remaining = remaining.substring(splitAt).replace(/^\n/, '');
  }
  return chunks;
}

/** LINE Reply API（レスポンスチェック付き） */
export async function lineReply(replyToken: string, text: string, token: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ replyToken, messages: [{ type: 'text', text: truncate(text) }] }),
    });
    if (!res.ok) console.error(`[LINE] Reply failed: ${res.status}`);
    return res.ok;
  } catch (e) {
    console.error('[LINE] Reply error:', e);
    return false;
  }
}

/** LINE Push API（長文自動分割対応） */
export async function linePush(lineUserId: string, text: string, token: string): Promise<boolean> {
  try {
    const chunks = splitMessage(text);
    const messages = chunks.map(c => ({ type: 'text', text: c }));
    // LINE APIは1リクエスト最大5メッセージ
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ to: lineUserId, messages }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[LINE] Push failed: ${res.status} to=${lineUserId.substring(0, 10)}... body=${body}`);
    }
    return res.ok;
  } catch (e) {
    console.error('[LINE] Push error:', e);
    return false;
  }
}

/** Quick Reply付きテキスト返信 */
export async function lineReplyWithQuickReply(
  replyToken: string, text: string, items: string[], token: string
): Promise<boolean> {
  const quickReply = {
    items: items.map(label => ({
      type: 'action',
      action: { type: 'message', label: label.length > 20 ? label.substring(0, 20) : label, text: label },
    })),
  };
  const msg = truncate(text);
  return lineReplyRaw(replyToken, [{ type: 'text', text: msg, quickReply }], token);
}

/** LINE Reply（Flex Messageなど任意メッセージ対象） */
export async function lineReplyRaw(replyToken: string, messages: any[], token: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ replyToken, messages }),
    });
    if (!res.ok) console.error(`[LINE] ReplyRaw failed: ${res.status}`);
    return res.ok;
  } catch (e) {
    console.error('[LINE] ReplyRaw error:', e);
    return false;
  }
}

/** LINE Push（Flex Messageなど任意メッセージ対象） */
export async function linePushRaw(lineUserId: string, messages: any[], token: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ to: lineUserId, messages }),
    });
    if (!res.ok) console.error(`[LINE] PushRaw failed: ${res.status}`);
    return res.ok;
  } catch (e) {
    console.error('[LINE] PushRaw error:', e);
    return false;
  }
}

/** LINEコンテンツダウンロード（画像・音声） */
export async function downloadLineContent(messageId: string, token: string): Promise<ArrayBuffer> {
  const res = await fetch(`https://api-data.line.me/v2/bot/message/${messageId}/content`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`LINE content download failed: ${res.status}`);
  return res.arrayBuffer();
}

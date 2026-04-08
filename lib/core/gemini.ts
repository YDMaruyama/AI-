import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_MODEL } from './config';

/** シングルトンGenAIクライアント（モジュールキャッシュ） */
let _genAI: GoogleGenerativeAI | null = null;
function getGenAI(apiKey: string): GoogleGenerativeAI {
  if (!_genAI) _genAI = new GoogleGenerativeAI(apiKey);
  return _genAI;
}

/** Geminiテキスト生成 */
export async function geminiGenerate(geminiKey: string, systemPrompt: string, userText?: string): Promise<string> {
  const model = getGenAI(geminiKey).getGenerativeModel({ model: GEMINI_MODEL });
  const prompt = userText ? systemPrompt + '\n\n' + userText : systemPrompt;
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });
  return result.response.text();
}

/**
 * Markdown→LINEプレーンテキスト変換
 * Geminiの応答をLINE表示用にクリーンアップ
 */
export function stripMarkdown(text: string): string {
  return text
    // 見出し: ## タイトル → 【タイトル】
    .replace(/^#{1,4}\s+(.+)$/gm, '【$1】')
    // 太字: **text** or __text__ → text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    // 斜体: *text* or _text_ → text
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '$1')
    .replace(/(?<!_)_([^_]+)_(?!_)/g, '$1')
    // リスト: - item or * item → ・item
    .replace(/^\s*[-*]\s+/gm, '・')
    // 番号付きリスト: 1. item → 1. item (そのまま)
    // コードブロック: ```...``` → 削除
    .replace(/```[\s\S]*?```/g, '')
    // インラインコード: `code` → code
    .replace(/`([^`]+)`/g, '$1')
    // 水平線: --- or *** → ━━━
    .replace(/^[-*]{3,}$/gm, '━━━')
    // 連続空行を1つに
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Gemini画像解析 */
export async function geminiGenerateWithImage(
  geminiKey: string, base64Data: string, mimeType: string, prompt: string
): Promise<string> {
  const model = getGenAI(geminiKey).getGenerativeModel({ model: GEMINI_MODEL });
  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType, data: base64Data } },
        { text: prompt },
      ],
    }],
  });
  return result.response.text();
}

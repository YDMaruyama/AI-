import { GoogleGenerativeAI } from '@google/generative-ai';
import { downloadLineContent } from '../core/line';
import { GEMINI_MODEL } from '../core/config';

/** LINE音声メッセージをGeminiで文字起こし */
export async function handleVoiceMessage(
  user: any,
  messageId: string,
  replyToken: string,
  supabase: any,
  token: string,
  geminiKey: string
): Promise<string> {
  // 1. LINE APIから音声データをダウンロード
  const audioBuffer = await downloadLineContent(messageId, token);
  const base64Audio = Buffer.from(audioBuffer).toString('base64');

  // 2. Gemini APIで文字起こし
  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [
        {
          inlineData: {
            mimeType: 'audio/m4a',
            data: base64Audio,
          },
        },
        {
          text: 'この音声を日本語でテキストに書き起こしてください。音声の内容のみ返してください。',
        },
      ],
    }],
  });

  return result.response.text().trim();
}

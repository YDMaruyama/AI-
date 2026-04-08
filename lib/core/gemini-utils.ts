/**
 * GeminiレスポンスからのJSON抽出ユーティリティ
 * 10+箇所で重複していた match(/\{[\s\S]*\}/) パターンを統一
 */
import { z } from 'zod';

/** GeminiレスポンスからJSONオブジェクトを抽出 */
export function extractJson<T = Record<string, any>>(
  response: string,
  schema?: z.ZodSchema<T>
): T {
  const match = response.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('JSON not found in Gemini response');
  const parsed = JSON.parse(match[0]);
  if (schema) {
    const result = schema.safeParse(parsed);
    if (!result.success) {
      const msg = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
      throw new Error(`Gemini JSON validation failed: ${msg}`);
    }
    return result.data;
  }
  return parsed;
}

/** GeminiレスポンスからJSON配列を抽出 */
export function extractJsonArray<T = any>(
  response: string,
  schema?: z.ZodSchema<T>
): T[] {
  const match = response.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('JSON array not found in Gemini response');
  const parsed = JSON.parse(match[0]);
  if (!Array.isArray(parsed)) throw new Error('Extracted value is not an array');
  if (schema) {
    return parsed.map((item, i) => {
      const result = schema.safeParse(item);
      if (!result.success) {
        throw new Error(`Array item[${i}] validation failed: ${result.error.message}`);
      }
      return result.data;
    });
  }
  return parsed;
}

/** Gemini JSON抽出を安全に試行（失敗時null） */
export function tryExtractJson<T = Record<string, any>>(
  response: string,
  schema?: z.ZodSchema<T>
): T | null {
  try {
    return extractJson(response, schema);
  } catch {
    return null;
  }
}

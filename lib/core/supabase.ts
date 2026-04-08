/**
 * Supabaseクライアント（シングルトン）+ DB操作ヘルパー
 * 全エンドポイントで createClient() を繰り返す代わりにこれを使う
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './config';

let _client: SupabaseClient | null = null;

/** Supabaseクライアント（モジュールキャッシュでシングルトン） */
export function getSupabase(): SupabaseClient {
  if (!_client) {
    _client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  }
  return _client;
}

/** INSERT + error check（single row） */
export async function dbInsert<T = any>(table: string, data: Record<string, any>): Promise<T> {
  const { data: result, error } = await getSupabase().from(table).insert(data).select().single();
  if (error) throw new Error(`[DB] ${table} insert failed: ${error.message}`);
  return result as T;
}

/** INSERT multiple rows + error check */
export async function dbInsertMany(table: string, rows: Record<string, any>[]): Promise<void> {
  const { error } = await getSupabase().from(table).insert(rows);
  if (error) throw new Error(`[DB] ${table} insertMany failed: ${error.message}`);
}

/** UPDATE + error check */
export async function dbUpdate(table: string, match: Record<string, any>, data: Record<string, any>): Promise<void> {
  let q = getSupabase().from(table).update(data);
  for (const [key, val] of Object.entries(match)) {
    q = q.eq(key, val);
  }
  const { error } = await q;
  if (error) throw new Error(`[DB] ${table} update failed: ${error.message}`);
}

/** UPSERT + error check */
export async function dbUpsert(table: string, data: Record<string, any>): Promise<void> {
  const { error } = await getSupabase().from(table).upsert(data);
  if (error) throw new Error(`[DB] ${table} upsert failed: ${error.message}`);
}

/** DELETE + error check */
export async function dbDelete(table: string, match: Record<string, any>): Promise<void> {
  let q = getSupabase().from(table).delete();
  for (const [key, val] of Object.entries(match)) {
    q = q.eq(key, val);
  }
  const { error } = await q;
  if (error) throw new Error(`[DB] ${table} delete failed: ${error.message}`);
}

/** ownerのlineUserIdを取得 */
export async function getOwnerLineUserId(supabase: any): Promise<string | null> {
  const { data } = await supabase
    .from('users')
    .select('line_user_id')
    .eq('role', 'owner')
    .eq('is_active', true)
    .limit(1)
    .single();
  return data?.line_user_id || null;
}

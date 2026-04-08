export async function saveMemo(supabase: any, userId: string, content: string, category: string = 'general') {
  await supabase.from('conversation_messages').insert({
    user_id: userId,
    role: 'system',
    content: `[MEMO:${category}] ${content}`,
    metadata: { type: 'memo', category },
  });
}

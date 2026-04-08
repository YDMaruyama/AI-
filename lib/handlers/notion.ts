import { lineReply } from '../core/line';
import { getToday } from '../core/utils';
import { geminiGenerate } from '../core/gemini';
import { SHARED_PERSONALITY, CONTEXT_TEMPLATE } from '../core/personality';
import { roleName } from '../core/utils';
import { env } from '../core/config';

const MEETING_AGENT_PROMPT = `${SHARED_PERSONALITY}

あなたは議事録・ミーティングの専門家です。

【できること】
- 議事録の要約
- アクションアイテムの抽出とタスク化
- 会議メモの構造化
- Notionの議事録データの検索（APIアクセス可能な場合）

【議事録フォーマット】
━━━━━━━━━━━━
📝 議事録: {タイトル}
📅 日付: {日付}
■ 要約
・{要約}
■ 決定事項
・{決定事項}
■ アクションアイテム
⬜ {担当者}: {内容}（期限: {期限}）
━━━━━━━━━━━━
`;

/** 会議・議事録関連のハンドリング */
export async function handleMeetingQuery(user: any, text: string, replyToken: string, supabase: any, token: string, geminiKey: string) {
  try {
    const notionKey = env.NOTION_API_KEY;

    // Notion APIで議事録を検索
    if (notionKey) {
      const result = await searchNotionMeetings(notionKey, text);
      if (result) {
        // Geminiで要約
        const ctx = CONTEXT_TEMPLATE(user.display_name, roleName(user.role), getToday());
        const prompt = MEETING_AGENT_PROMPT + ctx +
          `\n\n以下はNotionから取得した議事録です:\n\n${result}\n\nユーザーの質問: ${text}\n\n議事録を元に回答してください。アクションアイテムがあれば必ず含めてください。`;

        const reply = await geminiGenerate(geminiKey, prompt);
        await lineReply(replyToken, reply, token);

        await supabase.from('conversation_messages').insert([
          { user_id: user.id, role: 'user', content: text },
          { user_id: user.id, role: 'assistant', content: reply },
        ]);
        return;
      }
    }

    // Notionから取得できない場合 → DB内の議事録を検索
    const { data: savedNotes } = await supabase
      .from('conversation_messages')
      .select('content, created_at, metadata')
      .eq('user_id', user.id)
      .eq('role', 'system')
      .like('content', '%[MEETING]%')
      .order('created_at', { ascending: false })
      .limit(5);

    if (savedNotes && savedNotes.length > 0) {
      const notes = savedNotes.map((n: any) => {
        const meta = n.metadata || {};
        return `📅 ${n.created_at.split('T')[0]} ${meta.title || ''}\n${n.content.replace('[MEETING] ', '')}`;
      }).join('\n\n---\n\n');

      const ctx = CONTEXT_TEMPLATE(user.display_name, roleName(user.role), getToday());
      const prompt = MEETING_AGENT_PROMPT + ctx + `\n\n保存済みの議事録:\n${notes}`;
      const reply = await geminiGenerate(geminiKey, prompt, `ユーザー: ${text}`);
      await lineReply(replyToken, reply, token);
      return;
    }

    // 何もない場合 → 議事録入力を案内
    await lineReply(replyToken,
      '📝 議事録機能\n\n' +
      '現在保存されている議事録はありません。\n\n' +
      '【議事録を保存する方法】\n' +
      '「議事録: ○○の打ち合わせ\n参加者: ○○、△△\n内容: ～～」\n' +
      'と送ると、AIが要約してタスクを自動抽出します。\n\n' +
      '会議メモをそのまま貼り付けてもOKです！',
      token
    );
  } catch (e: any) {
    console.error('Meeting handler error:', e?.message);
    await lineReply(replyToken, '議事録の処理に失敗しました。もう一度お試しください。', token);
  }
}

/** 議事録テキストを受け取って要約・タスク化・保存 */
export async function saveMeetingNote(user: any, text: string, replyToken: string, supabase: any, token: string, geminiKey: string) {
  try {
    const content = text.replace(/^(議事録[:：]\s*)/i, '');

    // Geminiで構造化
    const extractPrompt = `以下の会議メモ/議事録を構造化してJSONで返してください。

会議メモ:
${content}

JSON形式:
{
  "title": "会議タイトル",
  "date": "${getToday()}",
  "summary": "3行以内の要約",
  "decisions": ["決定事項1", "決定事項2"],
  "action_items": [
    {"task": "タスク内容", "assignee": "担当者名", "deadline": "期限（あれば）"}
  ],
  "next_meeting": "次回会議の予定（あれば）"
}
JSONのみ返してください。`;

    const jsonStr = await geminiGenerate(geminiKey, extractPrompt);
    const match = jsonStr.match(/\{[\s\S]*\}/);

    let meetingData: any = { title: '会議メモ', summary: content.substring(0, 200), action_items: [] };
    if (match) {
      try { meetingData = JSON.parse(match[0]); } catch {}
    }

    // DB保存
    await supabase.from('conversation_messages').insert({
      user_id: user.id,
      role: 'system',
      content: `[MEETING] ${meetingData.title}: ${meetingData.summary}`,
      metadata: {
        type: 'meeting',
        title: meetingData.title,
        date: meetingData.date || getToday(),
        summary: meetingData.summary,
        decisions: meetingData.decisions || [],
        action_items: meetingData.action_items || [],
      },
    });

    // アクションアイテムをタスク化
    const actionItems = meetingData.action_items || [];
    if (actionItems.length > 0) {
      await supabase.from('tasks').insert(
        actionItems.map((item: any) => ({
          title: item.task || item,
          description: `議事録「${meetingData.title}」より`,
          status: 'pending',
          priority: 'medium',
          assignee_id: user.id,
          created_by: user.id,
          source: 'conversation',
        }))
      );
    }

    // 返答
    let reply = `📝 議事録を保存しました！\n\n`;
    reply += `📋 ${meetingData.title}\n`;
    reply += `📅 ${meetingData.date || getToday()}\n\n`;
    reply += `■ 要約\n${meetingData.summary}\n`;

    if (meetingData.decisions && meetingData.decisions.length > 0) {
      reply += `\n■ 決定事項\n`;
      meetingData.decisions.forEach((d: string) => { reply += `・${d}\n`; });
    }

    if (actionItems.length > 0) {
      reply += `\n■ アクションアイテム（${actionItems.length}件→タスク登録済）\n`;
      actionItems.forEach((a: any) => {
        const task = typeof a === 'string' ? a : a.task;
        const assignee = a.assignee ? `（${a.assignee}）` : '';
        reply += `⬜ ${task}${assignee}\n`;
      });
    }

    if (meetingData.next_meeting) {
      reply += `\n📅 次回: ${meetingData.next_meeting}`;
    }

    await lineReply(replyToken, reply, token);

    await supabase.from('conversation_messages').insert([
      { user_id: user.id, role: 'user', content: text },
      { user_id: user.id, role: 'assistant', content: reply },
    ]);
  } catch (e: any) {
    console.error('Save meeting error:', e?.message);
    await lineReply(replyToken, '議事録の保存に失敗しました。', token);
  }
}

/** Notion APIで議事録を検索 */
async function searchNotionMeetings(notionKey: string, query: string): Promise<string | null> {
  try {
    const searchQuery = query
      .replace(/(会議|ミーティング|議事録|打ち合わせ|MTG|の内容|を教えて|について|まとめて)/g, '')
      .trim() || '';

    const res = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: searchQuery || '会議',
        filter: { property: 'object', value: 'page' },
        sort: { direction: 'descending', timestamp: 'last_edited_time' },
        page_size: 3,
      }),
    });

    const data: any = await res.json();
    const pages = data.results || [];
    if (pages.length === 0) return null;

    const summaries: string[] = [];
    for (const page of pages.slice(0, 2)) {
      const title = extractTitle(page);
      const blocksRes = await fetch(`https://api.notion.com/v1/blocks/${page.id}/children?page_size=50`, {
        headers: {
          'Authorization': `Bearer ${notionKey}`,
          'Notion-Version': '2022-06-28',
        },
      });
      const blocksData: any = await blocksRes.json();
      const content = extractBlocks(blocksData.results || []);
      if (content.length > 10) {
        summaries.push(`## ${title}\n${content.substring(0, 1500)}`);
      }
    }

    return summaries.length > 0 ? summaries.join('\n\n---\n\n') : null;
  } catch {
    return null;
  }
}

function extractTitle(page: any): string {
  try {
    for (const prop of Object.values(page.properties || {}) as any[]) {
      if (prop.type === 'title' && prop.title?.length > 0) {
        return prop.title.map((t: any) => t.plain_text).join('');
      }
    }
  } catch {}
  return '無題';
}

function extractBlocks(blocks: any[]): string {
  return blocks.map((b: any) => {
    const type = b.type;
    if (['paragraph', 'heading_1', 'heading_2', 'heading_3'].includes(type)) {
      return (b[type]?.rich_text || []).map((t: any) => t.plain_text).join('');
    }
    if (['bulleted_list_item', 'numbered_list_item'].includes(type)) {
      return '・' + (b[type]?.rich_text || []).map((t: any) => t.plain_text).join('');
    }
    if (type === 'to_do') {
      const text = (b.to_do?.rich_text || []).map((t: any) => t.plain_text).join('');
      return (b.to_do?.checked ? '✅ ' : '⬜ ') + text;
    }
    return '';
  }).filter(Boolean).join('\n');
}

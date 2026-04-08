import { lineReply } from '../core/line';
import { getNowJST } from '../core/utils';

/** 行政書類 */
export async function showAdminDocs(user: any, replyToken: string, supabase: any, token: string) {
  const now = getNowJST();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  const { data: docs } = await supabase
    .from('admin_documents')
    .select('*, admin_document_records(status, submitted_at)')
    .eq('is_active', true)
    .order('deadline_day', { ascending: true });

  if (!docs || docs.length === 0) {
    await lineReply(replyToken, '登録されている行政タスクはありません。', token);
    return;
  }

  const lines = docs.map((doc: any) => {
    const records = doc.admin_document_records || [];
    // 今月のレコードを探す
    const thisMonth = records.find((r: any) => {
      if (!r.submitted_at) return false;
      const d = new Date(r.submitted_at);
      return d.getUTCFullYear() === year && d.getUTCMonth() + 1 === month;
    });

    const submitted = thisMonth?.status === 'submitted';
    const icon = submitted ? '!' : '[ ]';
    const deadlineStr = doc.deadline_day ? `${month}/${doc.deadline_day}` : '';
    return `${icon} ${doc.title}${deadlineStr ? '（' + deadlineStr + '）' : ''}${submitted ? ' 提出済' : ' 未提出'}`;
  });

  await lineReply(replyToken, `今月の行政タスク:\n\n${lines.join('\n')}`, token);
}

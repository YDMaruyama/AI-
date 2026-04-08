import { lineReply, linePush, lineReplyWithQuickReply } from '../core/line';
import { getToday } from '../core/utils';
import { geminiGenerate, stripMarkdown } from '../core/gemini';
import { getOwnerLineUserId } from '../core/db';
import { REPORT_AGENT_PROMPT } from '../core/agents';
import { extractJson, extractJsonArray } from '../core/gemini-utils';
import { replyWithTextAndFeedback } from '../core/feedback';

/** 日報作成開始（スマート対応: テキストに内容があれば一括解析） */
export async function startReport(user: any, replyToken: string, supabase: any, token: string, geminiKey?: string, text?: string) {
  // テキストから「日報」キーワードを除去して、追加情報があるか判定
  const extra = (text || '').replace(/日報/g, '').replace(/作成|書く|入力/g, '').trim();

  if (extra && extra.length >= 5 && geminiKey) {
    // --- スマートモード: 自然文から一括で日報を作成 ---
    try {
      const parsePrompt = `あなたは就労継続支援事業所の日報作成アシスタントです。
以下のユーザーの自然文メッセージから日報の各項目を抽出してJSON形式で返してください。
該当しない項目は「なし」としてください。JSONのみ返してください。

{
  "work_content": "作業内容と進捗",
  "client_notes": "利用者の様子・気になること",
  "external_contacts": "外部・取引先とのやり取り",
  "handover": "引き継ぎ事項",
  "other_notes": "その他の連絡事項"
}`;

      const parseResult = await geminiGenerate(geminiKey, parsePrompt, extra);
      const collected = extractJson(parseResult);

      // draft作成（upsertで安全に。既存があれば上書き）
      const { error: draftErr } = await supabase.from('report_drafts')
        .upsert({
          user_id: user.id,
          report_type: 'daily',
          report_date: getToday(),
          current_step: 5,
          collected_data: collected,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,report_type' });
      if (draftErr) throw new Error(`Draft upsert failed: ${draftErr.message}`);

      // Geminiで整形
      const formatted = stripMarkdown(await geminiGenerate(
        geminiKey,
        REPORT_AGENT_PROMPT + '\n\n以下の入力を、上記フォーマットに従って読みやすい日報形式に整形してください。余計な情報は追加せず、入力内容を整理するだけにしてください。',
        `作業内容: ${collected.work_content || 'なし'}
利用者の様子: ${collected.client_notes || 'なし'}
外部やり取り: ${collected.external_contacts || 'なし'}
引き継ぎ: ${collected.handover || 'なし'}
その他: ${collected.other_notes || 'なし'}
日付: ${getToday()}
報告者: ${user.display_name}`
      ));

      await supabase.from('report_drafts').update({
        formatted_content: formatted,
        updated_at: new Date().toISOString(),
      }).eq('user_id', user.id).eq('report_type', 'daily');

      // confirming_reportステートへ直行（upsertで安全に）
      await supabase.from('conversation_states').upsert({
        user_id: user.id, state: 'confirming_report', context: {}, updated_at: new Date().toISOString(),
      });

      await lineReplyWithQuickReply(
        replyToken,
        `以下の内容で日報を送信します。\n\n${formatted}`,
        ['OK', '修正', 'キャンセル'],
        token
      );
      return;
    } catch (e: any) {
      console.error('Smart report parse error:', e?.message);
      // パース失敗時は従来フローにフォールバック
    }
  }

  // --- 従来の5段階フロー ---
  // draft作成（upsertで安全に）
  await supabase.from('report_drafts')
    .upsert({
      user_id: user.id,
      report_type: 'daily',
      report_date: getToday(),
      current_step: 0,
      collected_data: {},
      formatted_content: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,report_type' });

  // stateを変更（upsertで安全に）
  await supabase.from('conversation_states').upsert({
    user_id: user.id, state: 'writing_report', context: {}, updated_at: new Date().toISOString(),
  });

  await lineReply(replyToken, '日報を作成します。\n\n今日の作業内容と進捗を教えてください。\n\n💡 「日報 封入作業150個、佐藤さん午後早退」のように内容を一緒に書くと1回で完結します！', token);
}

/** 日報作成続行 */
export async function continueReport(user: any, text: string, replyToken: string, supabase: any, token: string, geminiKey: string) {
  // キャンセル処理
  if (text === 'キャンセル' || text === 'やめる') {
    await supabase.from('report_drafts').delete().eq('user_id', user.id).eq('report_type', 'daily');
    await supabase.from('conversation_states').upsert({
      user_id: user.id, state: 'idle', context: {}, updated_at: new Date().toISOString(),
    });
    await lineReply(replyToken, '日報作成をキャンセルしました。', token);
    return;
  }

  const { data: draft } = await supabase
    .from('report_drafts')
    .select('*')
    .eq('user_id', user.id)
    .eq('report_type', 'daily')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (!draft) {
    await supabase.from('conversation_states').upsert({
      user_id: user.id, state: 'idle', context: {}, updated_at: new Date().toISOString(),
    });
    await lineReply(replyToken, '下書きが見つかりませんでした。「日報」と入力して最初からやり直してください。', token);
    return;
  }

  const step = draft.current_step || 0;
  const collected = draft.collected_data || {};

  const questions = [
    { key: 'work_content', next: '利用者さんで気になる様子の方はいましたか？' },
    { key: 'client_notes', next: '取引先や外部とのやり取りはありましたか？（なければ「なし」）' },
    { key: 'external_contacts', next: '明日への引き継ぎ事項はありますか？（なければ「なし」）' },
    { key: 'handover', next: '他に何かあれば教えてください。（なければ「なし」）' },
    { key: 'other_notes', next: null },
  ];

  if (step < questions.length) {
    // スキップ・なし対応（step 0以外）
    const skipValue = (text === 'スキップ' || text === 'なし') && step > 0 ? '' : text;
    collected[questions[step].key] = skipValue;
    const nextStep = step + 1;

    if (nextStep < questions.length && questions[step].next) {
      // 次のステップへ
      await supabase.from('report_drafts').update({
        current_step: nextStep,
        collected_data: collected,
        updated_at: new Date().toISOString(),
      }).eq('id', draft.id);

      // step 1以降はスキップボタン付き
      if (nextStep >= 1) {
        await lineReplyWithQuickReply(replyToken, questions[step].next as string, ['スキップ'], token);
      } else {
        await lineReply(replyToken, questions[step].next as string, token);
      }
    } else {
      // 全ステップ完了 → Gemini整形
      await supabase.from('report_drafts').update({
        current_step: nextStep,
        collected_data: collected,
        updated_at: new Date().toISOString(),
      }).eq('id', draft.id);

      try {
        const formatted = stripMarkdown(await geminiGenerate(
          geminiKey,
          REPORT_AGENT_PROMPT + '\n\n以下の入力を、上記フォーマットに従って読みやすい日報形式に整形してください。余計な情報は追加せず、入力内容を整理するだけにしてください。',
          `作業内容: ${collected.work_content || 'なし'}
利用者の様子: ${collected.client_notes || 'なし'}
外部やり取り: ${collected.external_contacts || 'なし'}
引き継ぎ: ${collected.handover || 'なし'}
その他: ${collected.other_notes || 'なし'}
日付: ${getToday()}
報告者: ${user.display_name}`
        ));

        await supabase.from('report_drafts').update({
          formatted_content: formatted,
          updated_at: new Date().toISOString(),
        }).eq('id', draft.id);

        await supabase.from('conversation_states').upsert({
          user_id: user.id, state: 'confirming_report', context: {}, updated_at: new Date().toISOString(),
        });

        await lineReply(
          replyToken,
          `以下の内容で日報を送信します。\n\n${formatted}\n\n「OK」→ 送信\n「修正」→ やり直し\n「キャンセル」→ 取消`,
          token
        );
      } catch (e: any) {
        console.error('Gemini format error:', e?.message);
        // Gemini失敗時は生テキストで確認
        const rawFormatted = `【日報】${getToday()} ${user.display_name}\n\n■ 作業内容\n${collected.work_content}\n\n■ 利用者の様子\n${collected.client_notes}\n\n■ 外部やり取り\n${collected.external_contacts}\n\n■ 引き継ぎ\n${collected.handover}\n\n■ その他\n${collected.other_notes}`;

        await supabase.from('report_drafts').update({
          formatted_content: rawFormatted,
          updated_at: new Date().toISOString(),
        }).eq('id', draft.id);

        await supabase.from('conversation_states').upsert({
          user_id: user.id, state: 'confirming_report', context: {}, updated_at: new Date().toISOString(),
        });

        await lineReplyWithQuickReply(
          replyToken,
          `以下の内容で日報を送信します。\n\n${rawFormatted}`,
          ['OK', '修正', 'キャンセル'],
          token
        );
      }
    }
  }
}

/** 日報確認 */
export async function confirmReport(user: any, text: string, replyToken: string, supabase: any, token: string, geminiKey: string) {
  const lower = text.trim().toLowerCase();

  if (['ok', 'はい', '送信', 'おk', 'オッケー', 'おけ'].includes(lower)) {
    // 送信処理
    const { data: draft, error: draftErr } = await supabase
      .from('report_drafts')
      .select('*')
      .eq('user_id', user.id)
      .eq('report_type', 'daily')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (!draft || draftErr) {
      await supabase.from('conversation_states').upsert({
        user_id: user.id, state: 'idle', context: {}, updated_at: new Date().toISOString(),
      });
      await lineReply(replyToken, '下書きが見つかりませんでした。「日報」と入力して最初からやり直してください。', token);
      return;
    }

    const reportDate = getToday();
    const content = draft.formatted_content || '';
    const collected = draft.collected_data || {};

    // daily_reportsに保存（エラーチェック付き）
    const { error: saveErr } = await supabase.from('daily_reports').insert({
      user_id: user.id,
      report_date: reportDate,
      content: content,
      raw_data: collected,
      status: 'submitted',
    });
    if (saveErr) {
      await lineReply(replyToken, `日報の保存に失敗しました。もう一度「OK」と送ってください。\n（${saveErr.message}）`, token);
      return;
    }

    // draft削除
    await supabase.from('report_drafts').delete().eq('id', draft.id);

    // stateをidleに
    await supabase.from('conversation_states').upsert({
      user_id: user.id, state: 'idle', context: {}, updated_at: new Date().toISOString(),
    });

    // Geminiでタスク自動抽出
    let taskMsg = '';
    try {
      const taskResult = await geminiGenerate(
        geminiKey,
        `あなたは就労継続支援事業所のタスク抽出アシスタントです。
以下の日報からタスク（TODO、やるべきこと、引き継ぎ事項）を抽出してください。
タスクがあれば以下のJSON配列で出力してください。なければ空配列[]を返してください。
[{"title":"タスク名","priority":"high/medium/low","due_hint":"期限のヒント（あれば）"}]
JSONのみ出力し、他の文言は不要です。`,
        content
      );

      const tasks = extractJsonArray(taskResult);
      if (tasks.length > 0) {
        await supabase.from('task_suggestions').insert(
          tasks.map((t: any) => ({
            user_id: user.id,
            source_type: 'daily_report',
            source_date: reportDate,
            title: t.title,
            priority: t.priority || 'medium',
            due_hint: t.due_hint || null,
            status: 'pending',
          }))
        );
        const taskLines = tasks.map((t: any, i: number) => {
          const pri = t.priority === 'high' ? '[高]' : t.priority === 'low' ? '[低]' : '[中]';
          return `${i + 1}. ${pri} ${t.title}${t.due_hint ? '（' + t.due_hint + '）' : ''}`;
        }).join('\n');
        taskMsg = `\n\nタスク候補を検出しました:\n${taskLines}\n\n「タスク」で一覧確認できます。`;
      }
    } catch (e: any) {
      console.error('Task extraction error:', e?.message);
    }

    // 共有ボタン付きフィードバック（社長への自動通知は廃止、本人が共有ボタンで選択）
    const summary = content.length > 100 ? content.substring(0, 100) + '...' : content;
    await replyWithTextAndFeedback(replyToken, token,
      `日報を送信しました。お疲れさまでした!${taskMsg}\n\n「タスク」「予定」「日報確認」で次の操作ができます。`,
      {
        icon: '📋',
        title: '日報提出完了',
        detail: summary,
        shareData: `report:${reportDate} ${user.display_name}の日報\n${summary}`,
      }
    );

  } else if (['修正', 'やり直し', 'やりなおし'].includes(text.trim())) {
    // やり直し（前回の入力内容を表示）
    const { data: draft } = await supabase
      .from('report_drafts')
      .select('collected_data')
      .eq('user_id', user.id)
      .eq('report_type', 'daily')
      .single();

    const prevData = draft?.collected_data || {};
    let prevSummary = '';
    if (prevData.work_content) prevSummary += `作業内容: ${prevData.work_content}\n`;
    if (prevData.client_notes && prevData.client_notes !== 'なし') prevSummary += `利用者の様子: ${prevData.client_notes}\n`;
    if (prevData.external_contacts && prevData.external_contacts !== 'なし') prevSummary += `外部やり取り: ${prevData.external_contacts}\n`;
    if (prevData.handover && prevData.handover !== 'なし') prevSummary += `引き継ぎ: ${prevData.handover}\n`;
    if (prevData.other_notes && prevData.other_notes !== 'なし') prevSummary += `その他: ${prevData.other_notes}\n`;

    await supabase.from('report_drafts').update({
      current_step: 0,
      formatted_content: null,
      updated_at: new Date().toISOString(),
    }).eq('user_id', user.id).eq('report_type', 'daily');

    await supabase.from('conversation_states').upsert({
      user_id: user.id, state: 'writing_report', context: {}, updated_at: new Date().toISOString(),
    });

    const prevMsg = prevSummary ? `\n前回の入力:\n${prevSummary}\n` : '';
    await lineReply(replyToken, `最初からやり直します。${prevMsg}\n今日の作業内容と進捗を教えてください。`, token);

  } else if (['キャンセル', 'やめる', '取消'].includes(text.trim())) {
    await supabase.from('report_drafts').delete().eq('user_id', user.id).eq('report_type', 'daily');
    await supabase.from('conversation_states').upsert({
      user_id: user.id, state: 'idle', context: {}, updated_at: new Date().toISOString(),
    });
    await lineReply(replyToken, '日報作成をキャンセルしました。', token);

  } else {
    await lineReplyWithQuickReply(replyToken, 'どちらにしますか？', ['OK', '修正', 'キャンセル'], token);
  }
}

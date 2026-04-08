import { lineReply, linePush, lineReplyWithQuickReply } from '../core/line';
import { getToday } from '../core/utils';
import { geminiGenerate, stripMarkdown } from '../core/gemini';
import { getOwnerLineUserId } from '../core/db';
import { extractJson } from '../core/gemini-utils';

/** 事故・ヒヤリハット開始（スマート対応: テキストに内容があれば一括解析） */
export async function startIncident(user: any, replyToken: string, supabase: any, token: string, geminiKey?: string, text?: string) {
  // テキストから「事故」「ヒヤリ」「報告」キーワードを除去して追加情報があるか判定
  const extra = (text || '').replace(/事故|ヒヤリ|ハット|報告/g, '').trim();

  if (extra && extra.length >= 5 && geminiKey) {
    // --- スマートモード: 自然文から一括で事故報告を作成 ---
    try {
      await supabase.from('report_drafts').delete().eq('user_id', user.id).eq('report_type', 'incident');

      const parsePrompt = `あなたは就労継続支援事業所の事故報告アシスタントです。
以下のユーザーの自然文メッセージから事故・ヒヤリハット報告の各項目を抽出してJSON形式で返してください。
該当しない項目は「不明」としてください。JSONのみ返してください。

{
  "when": "いつ起きたか（日時）",
  "who": "誰が関わったか（利用者名など）",
  "what": "何が起きたか",
  "injury": "怪我の有無と程度",
  "action": "どう対応したか"
}`;

      const parseResult = await geminiGenerate(geminiKey, parsePrompt, extra);
      const collected = extractJson(parseResult);

      // Geminiで整形
      let formatted = '';
      try {
        formatted = stripMarkdown(await geminiGenerate(
          geminiKey,
          `以下の情報を事故・ヒヤリハット報告書形式に整形してください。簡潔で正確に記録してください。`,
          `発生日時: ${collected.when}
関係者: ${collected.who}
内容: ${collected.what}
怪我の有無: ${collected.injury}
対応内容: ${collected.action}
報告者: ${user.display_name}
報告日: ${getToday()}`
        ));
      } catch {
        formatted = `【事故・ヒヤリハット報告】\n報告日: ${getToday()}\n報告者: ${user.display_name}\n\n発生日時: ${collected.when}\n関係者: ${collected.who}\n内容: ${collected.what}\n怪我: ${collected.injury}\n対応: ${collected.action}`;
      }

      // incident_reportsに保存（エラーチェック付き）
      const { error: incErr } = await supabase.from('incident_reports').insert({
        user_id: user.id,
        report_date: getToday(),
        content: formatted,
        raw_data: collected,
        severity: collected.injury && collected.injury !== 'なし' && collected.injury !== 'ない' && collected.injury !== '不明' ? 'high' : 'low',
      });
      if (incErr) {
        await lineReply(replyToken, `事故報告の保存に失敗しました。もう一度お試しください。\n（${incErr.message}）`, token);
        return;
      }

      // stateをidleに
      await supabase.from('conversation_states').upsert({
        user_id: user.id, state: 'idle', context: {}, updated_at: new Date().toISOString(),
      });

      // 社長に即時通知
      const ownerLineId = await getOwnerLineUserId(supabase);
      if (ownerLineId) {
        await linePush(
          ownerLineId,
          `[緊急] 事故・ヒヤリハット報告\n報告者: ${user.display_name}\n\n${formatted}`,
          token
        );
      }

      await lineReply(replyToken, `事故・ヒヤリハット報告を記録しました。\n管理者に通知済みです。\n\n${formatted}`, token);
      return;
    } catch (e: any) {
      console.error('Smart incident parse error:', e?.message);
      // パース失敗時は従来フローにフォールバック
    }
  }

  // --- 従来の5段階フロー ---
  await supabase.from('report_drafts')
    .upsert({
      user_id: user.id,
      report_type: 'incident',
      report_date: getToday(),
      current_step: 0,
      collected_data: {},
      formatted_content: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,report_type' });

  await supabase.from('conversation_states').upsert({
    user_id: user.id, state: 'writing_incident', context: { incident_step: 0 }, updated_at: new Date().toISOString(),
  });

  await lineReply(
    replyToken,
    '事故・ヒヤリハット報告を開始します。\n\nいつ起きましたか？（例: 今日の15時、さっき）\n\n💡 「事故報告 今日15時 高橋さん カッターで指切った 軽傷 絆創膏対応済み」のように一度に書くと1回で完結します！',
    token
  );
}

/** 事故・ヒヤリハット続行 */
export async function continueIncident(user: any, text: string, replyToken: string, supabase: any, token: string, geminiKey: string) {
  if (text === 'キャンセル' || text === 'やめる') {
    await supabase.from('report_drafts').delete().eq('user_id', user.id).eq('report_type', 'incident');
    await supabase.from('conversation_states').upsert({
      user_id: user.id, state: 'idle', context: {}, updated_at: new Date().toISOString(),
    });
    await lineReply(replyToken, '事故報告をキャンセルしました。', token);
    return;
  }

  const { data: draft } = await supabase
    .from('report_drafts')
    .select('*')
    .eq('user_id', user.id)
    .eq('report_type', 'incident')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (!draft) {
    await supabase.from('conversation_states').upsert({
      user_id: user.id, state: 'idle', context: {}, updated_at: new Date().toISOString(),
    });
    await lineReply(replyToken, '下書きが見つかりませんでした。「事故」と入力して最初からやり直してください。', token);
    return;
  }

  const step = draft.current_step || 0;
  const collected = draft.collected_data || {};

  const questions = [
    { key: 'when', next: '誰が関わりましたか？（利用者名）', quickReply: null },
    { key: 'who', next: '何が起きましたか？', quickReply: null },
    { key: 'what', next: '怪我はありましたか？', quickReply: ['なし', '軽傷', '重傷', '不明'] },
    { key: 'injury', next: 'どう対応しましたか？', quickReply: ['応急処置済み', '病院搬送', '経過観察', '対応なし'] },
    { key: 'action', next: null, quickReply: null },
  ];

  if (step < questions.length) {
    collected[questions[step].key] = text;
    const nextStep = step + 1;

    if (nextStep < questions.length && questions[step].next) {
      await supabase.from('report_drafts').update({
        current_step: nextStep,
        collected_data: collected,
        updated_at: new Date().toISOString(),
      }).eq('id', draft.id);

      const qr = questions[step].quickReply;
      if (qr) {
        await lineReplyWithQuickReply(replyToken, questions[step].next as string, qr, token);
      } else {
        await lineReply(replyToken, questions[step].next as string, token);
      }
    } else {
      // 全ステップ完了 → 整形して保存
      await supabase.from('report_drafts').update({
        current_step: nextStep,
        collected_data: collected,
        updated_at: new Date().toISOString(),
      }).eq('id', draft.id);

      let formatted = '';
      try {
        formatted = stripMarkdown(await geminiGenerate(
          geminiKey,
          `以下の情報を事故・ヒヤリハット報告書形式に整形してください。
簡潔で正確に記録してください。`,
          `発生日時: ${collected.when}
関係者: ${collected.who}
内容: ${collected.what}
怪我の有無: ${collected.injury}
対応内容: ${collected.action}
報告者: ${user.display_name}
報告日: ${getToday()}`
        ));
      } catch (e: any) {
        formatted = `【事故・ヒヤリハット報告】\n報告日: ${getToday()}\n報告者: ${user.display_name}\n\n発生日時: ${collected.when}\n関係者: ${collected.who}\n内容: ${collected.what}\n怪我: ${collected.injury}\n対応: ${collected.action}`;
      }

      // incident_reportsに保存（エラーチェック付き）
      const { error: saveErr } = await supabase.from('incident_reports').insert({
        user_id: user.id,
        report_date: getToday(),
        content: formatted,
        raw_data: collected,
        severity: collected.injury && collected.injury !== 'なし' && collected.injury !== 'ない' ? 'high' : 'low',
      });
      if (saveErr) {
        await lineReply(replyToken, `事故報告の保存に失敗しました。もう一度お試しください。`, token);
        return;
      }

      // draft削除、stateリセット
      await supabase.from('report_drafts').delete().eq('id', draft.id);
      await supabase.from('conversation_states').upsert({
        user_id: user.id, state: 'idle', context: {}, updated_at: new Date().toISOString(),
      });

      // 社長に即時通知
      const ownerLineId = await getOwnerLineUserId(supabase);
      if (ownerLineId) {
        await linePush(
          ownerLineId,
          `[緊急] 事故・ヒヤリハット報告\n報告者: ${user.display_name}\n\n${formatted}`,
          token
        );
      }

      await lineReply(replyToken, `事故・ヒヤリハット報告を記録しました。\n管理者に通知済みです。\n\n${formatted}`, token);
    }
  }
}

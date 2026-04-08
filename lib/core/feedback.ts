/**
 * フィードバック + 共有ボタン付きFlex Message
 * 処理完了時に本人へのフィードバックと、任意の相手への共有を実現
 */
import { lineReplyRaw } from './line';

interface FeedbackOptions {
  icon: string;        // 例: '✅', '🧾', '📋'
  title: string;       // 例: 'タスク追加完了'
  detail?: string;     // 例: '「○○の資料作成」'
  extra?: string;      // 追加情報行
  shareData?: string;  // 共有ボタン用のpostbackデータ識別子
}

/**
 * 共有ボタン付きFlex Messageを生成
 * shareDataが指定されると「共有する」ボタンが表示される
 */
export function buildFeedbackFlex(opts: FeedbackOptions): any {
  const bodyContents: any[] = [
    {
      type: 'text',
      text: `${opts.icon} ${opts.title}`,
      weight: 'bold',
      size: 'md',
      wrap: true,
    },
  ];

  if (opts.detail) {
    bodyContents.push({
      type: 'text',
      text: opts.detail,
      size: 'sm',
      color: '#555555',
      wrap: true,
      margin: 'sm',
    });
  }

  if (opts.extra) {
    bodyContents.push({
      type: 'text',
      text: opts.extra,
      size: 'xs',
      color: '#888888',
      wrap: true,
      margin: 'sm',
    });
  }

  const flex: any = {
    type: 'flex',
    altText: `${opts.icon} ${opts.title}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: bodyContents,
        paddingAll: '16px',
      },
    },
  };

  // 共有ボタン
  if (opts.shareData) {
    flex.contents.footer = {
      type: 'box',
      layout: 'horizontal',
      contents: [
        {
          type: 'button',
          action: {
            type: 'postback',
            label: '📤 社長に共有',
            data: `share:owner:${opts.shareData}`,
            displayText: '社長に共有します',
          },
          style: 'primary',
          height: 'sm',
          color: '#5B5EA6',
          flex: 1,
        },
        {
          type: 'button',
          action: {
            type: 'postback',
            label: '👥 管理者に共有',
            data: `share:manager:${opts.shareData}`,
            displayText: '管理者に共有します',
          },
          style: 'secondary',
          height: 'sm',
          flex: 1,
        },
      ],
      spacing: 'sm',
      paddingAll: '12px',
    };
  }

  return flex;
}

/** Flex Message付きでreply（本人のみにフィードバック） */
export async function replyWithFeedback(
  replyToken: string,
  token: string,
  opts: FeedbackOptions
): Promise<boolean> {
  const flex = buildFeedbackFlex(opts);
  return lineReplyRaw(replyToken, [flex], token);
}

/** テキスト + Flex Messageの2メッセージでreply */
export async function replyWithTextAndFeedback(
  replyToken: string,
  token: string,
  text: string,
  opts: FeedbackOptions
): Promise<boolean> {
  const flex = buildFeedbackFlex(opts);
  return lineReplyRaw(replyToken, [
    { type: 'text', text: text.length > 4999 ? text.substring(0, 4996) + '...' : text },
    flex,
  ], token);
}

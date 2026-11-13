/**
 * K1 教材動画のデザイントークン（仮案）。
 * 既存 BP 教材の正式なデザイン設定が見つからなかったため、制作指示の仮案
 * 「アイボリー、濃いチャコール、落ち着いた緑、控えめな金」に沿って定義している。
 * 正式設定が届いたら、このファイルだけを差し替えれば全シーンに反映される。
 */

export const VIDEO = {
  width: 1920,
  height: 1080,
  fps: 60,
} as const;

export const COLORS = {
  /** 背景（アイボリー） */
  bg: '#F6F1E6',
  /** 背景より一段明るい面（カード） */
  surface: '#FFFCF5',
  /** 背景より一段濃い面（区画・パネル） */
  panel: '#ECE5D5',
  /** 本文（濃いチャコール） */
  ink: '#2A2B2A',
  /** 補足テキスト */
  inkSoft: '#5C5D58',
  /** 罫線・弱い線 */
  line: '#B9B1A0',
  lineSoft: '#D8D0BE',
  /** 落ち着いた緑（主役の強調） */
  green: '#3F6E54',
  greenSoft: '#DCE8DF',
  greenDeep: '#2C513D',
  /** 控えめな金（補助の強調・区切り） */
  gold: '#A88A4A',
  goldSoft: '#F1E7CF',
  /** 対比用の第三色（くすんだ青灰）。色だけで意味を分けず、形・ラベルと併用する */
  slate: '#56697A',
  slateSoft: '#DFE5EA',
  /** 字幕帯 */
  captionBg: 'rgba(34, 35, 34, 0.86)',
  captionText: '#FBF8F1',
} as const;

export const FONT = {
  family: '"Noto Sans JP", sans-serif',
  /** 見出し 56〜72px */
  heading: 60,
  headingLarge: 72,
  /** 本文 36〜44px */
  body: 40,
  bodyLarge: 44,
  bodySmall: 36,
  /** 補足 28px */
  note: 28,
  /** 章ラベル */
  label: 28,
  /** 字幕 */
  caption: 40,
} as const;

/**
 * 画面の領域（px）。図解は VISUAL 領域の中だけに描き、字幕領域 CAPTION と重ならない。
 */
export const LAYOUT = {
  marginX: 80,
  header: {top: 44, labelHeight: 40, titleTop: 92, height: 176},
  visual: {left: 80, top: 196, width: 1760, height: 676},
  caption: {bottom: 36, maxWidth: 1560, height: 156},
} as const;

export type ColorName = keyof typeof COLORS;

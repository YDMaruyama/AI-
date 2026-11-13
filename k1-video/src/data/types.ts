/**
 * scene-data の型定義。
 * ナレーション・字幕・尺・図の段階（step）を 1 か所に集約する。
 * React に依存しないので、Remotion とビルドスクリプトの両方から読み込める。
 */

/** 原文の段落 ID（source/K1_source_with_ids.md の [ID]） */
export type SourceId = string;

export type NarrationLine = {
  /** 台本・字幕に使う表記（漢字かな交じり） */
  text: string;
  /**
   * この行が始まった時点で図解が進む段階。
   * シーン開始時は 0。省略時は直前の段階を維持する。
   */
  step?: number;
  /**
   * 行の途中で段階を進めたい場合の指定。at は行の長さに対する割合（0〜1）。
   */
  substeps?: {at: number; step: number}[];
  /** この行が対応する原文段落 ID（1 つ以上） */
  src: SourceId[];
  /**
   * 字幕を手動で区切る場合のみ指定。外側の配列が字幕 1 枚、内側が行（最大 2 行）。
   * 省略時は scripts/build-timeline.ts が文節単位で自動分割する。
   */
  captions?: string[][];
  /** 読み上げ用の表記（TTS・収録者向け）。省略時は読み方辞書で自動変換。 */
  reading?: string;
};

export type Scene = {
  /** 例: c03-s02 */
  id: string;
  /** storyboard 用の短い名前 */
  title: string;
  /** 画面上部の見出し（1 画面 1 論点）。layout が 'full' のときは表示しない */
  heading?: string;
  /** 'standard'：章ラベル＋見出し＋図解領域。'full'：見出しなし全面 */
  layout?: 'standard' | 'full';
  /** 図解コンポーネントのキー（src/visuals/registry.ts） */
  visual: string;
  /** 図解コンポーネントに渡す props */
  props?: Record<string, unknown>;
  lines: NarrationLine[];
  /** storyboard 用：画面と動きの説明 */
  board: string;
  /** 最後の行のあと、読むための静止時間（秒）。既定 1.2 */
  tail?: number;
  /** ナレーションがない場合などの最小尺（秒） */
  minDuration?: number;
};

export type Chapter = {
  /** 例: ch03 */
  id: string;
  /** 0 = 導入, 1〜10 = 本編, 11 = 結び（必要な場合） */
  number: number;
  /** 章タイトル（画面左上の章ラベルにも使う） */
  title: string;
  /** Composition 名やファイル名に使う英数字 */
  slug: string;
  scenes: Scene[];
};

/** 生成されたタイムライン（秒単位）。src/generated/timeline.json */
export type TimelineLine = {id: string; start: number; end: number};
export type TimelineCue = {lines: string[]; start: number; end: number; lineId: string};
export type TimelineScene = {
  id: string;
  duration: number;
  /** public/ からの相対パス。音声がない場合は null */
  audio: string | null;
  /** 音声がシーン内で始まる位置（秒） */
  audioOffset: number;
  /** 'tts' | 'recorded' | 'estimate' */
  timing: 'tts' | 'recorded' | 'estimate';
  lines: TimelineLine[];
  cues: TimelineCue[];
  /** step 番号 → シーン内の開始秒 */
  steps: {step: number; at: number}[];
};
export type Timeline = {
  generatedAt: string;
  mode: string;
  totalSeconds: number;
  scenes: Record<string, TimelineScene>;
};

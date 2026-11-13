import React, {createContext, useContext} from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {TimelineScene} from '../data/types';

/**
 * シーン内の「図の段階（step）」を図解コンポーネントへ渡すコンテキスト。
 * step はナレーション行の開始に合わせて進む（scene-data の line.step）。
 */
export type SceneCtx = {
  sceneId: string;
  /** step 番号 → シーン内の開始秒（timeline.json） */
  steps: {step: number; at: number}[];
  durationInFrames: number;
};

const Ctx = createContext<SceneCtx | null>(null);

export const SceneProvider: React.FC<{value: SceneCtx; children: React.ReactNode}> = ({value, children}) => (
  <Ctx.Provider value={value}>{children}</Ctx.Provider>
);

/** シーン外（単体プレビュー等）でも動くよう、既定値を持つ */
const useCtx = (): SceneCtx => useContext(Ctx) ?? {sceneId: 'preview', steps: [{step: 0, at: 0}], durationInFrames: 600};

const ease = Easing.bezier(0.25, 0.1, 0.25, 1);

/** 現在の step と、その step に入った時刻（秒） */
export const useStep = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {steps, durationInFrames} = useCtx();
  const t = frame / fps;
  let current = steps[0] ?? {step: 0, at: 0};
  let previous = current;
  for (const s of steps) {
    if (s.at <= t && s.step !== current.step) {
      previous = current;
      current = s;
    }
  }
  /** step s に初めて到達した時刻（未到達なら null） */
  const reachedAt = (s: number): number | null => {
    let best: number | null = null;
    for (const e of steps) {
      if (e.step >= s && (best === null || e.at < best)) best = e.at;
    }
    return best;
  };
  return {step: current.step, since: t - current.at, previous: previous.step, t, fps, frame, durationInFrames, reachedAt};
};

/**
 * step s に到達してからの表示進行度 0→1（ゆるやかなイーズ）。
 * delay・duration は秒。
 */
export const useReveal = (s: number, opts: {delay?: number; duration?: number} = {}) => {
  const {t, reachedAt} = useStep();
  const at = reachedAt(s);
  if (at === null) return 0;
  const start = at + (opts.delay ?? 0);
  const dur = opts.duration ?? 0.6;
  return interpolate(t, [start, start + dur], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });
};

/**
 * 強調の度合い 0→1。isFocused(step) が true の段階では 1、そうでなければ 0。
 * 段階が切り替わった直後は 0.45 秒かけてなめらかに移る。
 */
export const useFocus = (isFocused: (step: number) => boolean, dur = 0.45) => {
  const {step, previous, since} = useStep();
  const now = isFocused(step) ? 1 : 0;
  const before = isFocused(previous) ? 1 : 0;
  if (now === before) return now;
  const k = interpolate(since, [0, dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  return before + (now - before) * k;
};

/** 0→1 の進行度から、下から浮かび上がる表示スタイル */
export const fadeUp = (p: number, distance = 18): React.CSSProperties => ({
  opacity: p,
  transform: `translateY(${(1 - p) * distance}px)`,
});

/** 強調度から不透明度（読める濃さを保つ） */
export const dimOpacity = (focus: number, min = 0.5) => min + (1 - min) * focus;

/** 線の描画（strokeDashoffset 用） */
export const drawDash = (p: number, length: number) => ({
  strokeDasharray: length,
  strokeDashoffset: length * (1 - p),
});

export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

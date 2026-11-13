import React from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Chapter, Scene, TimelineCue} from '../data/types';
import {COLORS, FONT, LAYOUT} from '../theme';
import {sceneTimeline, sec2f} from '../timeline';
import {VISUALS} from '../visuals/registry';
import {SceneProvider} from './scene-context';

const ease = Easing.bezier(0.25, 0.1, 0.25, 1);

export const chapterLabel = (c: Chapter) => (c.number === 0 ? '導入' : `第${c.number}章`);

/** 画面上部：章ラベルと、この画面の論点 */
const Header: React.FC<{chapter: Chapter; scene: Scene; animateTitle: boolean; totalChapters: number}> = ({
  chapter,
  scene,
  animateTitle,
  totalChapters,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = animateTitle
    ? interpolate(frame, [0, 0.5 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease})
    : 1;
  return (
    <div style={{position: 'absolute', left: LAYOUT.marginX, right: LAYOUT.marginX, top: LAYOUT.header.top}}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
          <span
            style={{
              fontSize: FONT.label,
              fontWeight: 700,
              color: COLORS.surface,
              background: COLORS.green,
              borderRadius: 8,
              padding: '3px 14px',
              letterSpacing: '0.06em',
            }}
          >
            {chapterLabel(chapter)}
          </span>
          <span style={{fontSize: FONT.label, fontWeight: 500, color: COLORS.inkSoft, letterSpacing: '0.04em'}}>
            {chapter.title}
          </span>
        </div>
        {chapter.number > 0 ? (
          <div style={{display: 'flex', gap: 8, alignItems: 'center'}} aria-label="章の進み具合">
            {Array.from({length: totalChapters}, (_, i) => (
              <div
                key={i}
                style={{
                  width: i + 1 === chapter.number ? 28 : 10,
                  height: 10,
                  borderRadius: 5,
                  background: i + 1 <= chapter.number ? COLORS.gold : COLORS.lineSoft,
                }}
              />
            ))}
          </div>
        ) : null}
      </div>
      {scene.heading ? (
        <div
          style={{
            marginTop: 18,
            fontSize: FONT.heading,
            fontWeight: 700,
            color: COLORS.ink,
            lineHeight: 1.25,
            letterSpacing: '0.02em',
            opacity: p,
            transform: `translateY(${(1 - p) * 10}px)`,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'clip',
          }}
        >
          {scene.heading}
        </div>
      ) : null}
    </div>
  );
};

/** 字幕（最大 2 行）。図解領域と重ならない下部の帯に表示する */
const Captions: React.FC<{cues: TimelineCue[]}> = ({cues}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  let cue: TimelineCue | null = null;
  for (let i = 0; i < cues.length; i++) {
    const c = cues[i];
    const next = cues[i + 1];
    // 行間の短い無音では前の字幕を残し、ちらつきを防ぐ
    const until = next ? Math.min(next.start, c.end + 0.6) : c.end + 0.4;
    if (t >= c.start && t < until) {
      cue = c;
      break;
    }
  }
  if (!cue) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: LAYOUT.caption.bottom,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          maxWidth: LAYOUT.caption.maxWidth,
          background: COLORS.captionBg,
          color: COLORS.captionText,
          borderRadius: 12,
          padding: '12px 36px',
          fontSize: FONT.caption,
          fontWeight: 500,
          lineHeight: 1.5,
          letterSpacing: '0.03em',
          textAlign: 'center',
        }}
      >
        {cue.lines.map((l, i) => (
          <div key={i} style={{whiteSpace: 'nowrap'}}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
};

const MissingVisual: React.FC<{name: string}> = ({name}) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      border: `4px dashed ${COLORS.gold}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 40,
      color: COLORS.gold,
    }}
  >
    図解コンポーネントが未登録：{name}
  </div>
);

export type SceneRenderProps = {
  chapter: Chapter;
  scene: Scene;
  showCaptions: boolean;
  /** 直前のシーンと見出しが同じなら見出しをアニメーションしない */
  sameHeadingAsPrev?: boolean;
  totalChapters: number;
  withAudio?: boolean;
};

/** 1 シーン分の画面（背景・見出し・図解・字幕・音声） */
export const SceneRenderer: React.FC<SceneRenderProps> = ({
  chapter,
  scene,
  showCaptions,
  sameHeadingAsPrev = false,
  totalChapters,
  withAudio = true,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const tl = sceneTimeline(scene.id);
  const Visual = VISUALS[scene.visual];
  const full = scene.layout === 'full';
  // 図解領域の出入り（穏やかなフェード）
  const fadeIn = interpolate(frame, [0, 0.4 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  const fadeOut = interpolate(frame, [durationInFrames - 0.3 * fps, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const area = full
    ? {left: 0, top: 0, width: 1920, height: LAYOUT.visual.top + LAYOUT.visual.height}
    : LAYOUT.visual;

  return (
    <AbsoluteFill style={{background: COLORS.bg, fontFamily: FONT.family}}>
      <SceneProvider value={{sceneId: scene.id, steps: tl.steps, durationInFrames}}>
        {!full ? <Header chapter={chapter} scene={scene} animateTitle={!sameHeadingAsPrev} totalChapters={totalChapters} /> : null}
        <div
          style={{
            position: 'absolute',
            left: area.left,
            top: area.top,
            width: area.width,
            height: area.height,
            opacity: fadeIn * fadeOut,
          }}
        >
          {Visual ? <Visual {...(scene.props ?? {})} /> : <MissingVisual name={scene.visual} />}
        </div>
      </SceneProvider>
      {showCaptions ? <Captions cues={tl.cues} /> : null}
      {withAudio && tl.audio ? (
        <Sequence from={sec2f(tl.audioOffset, fps)} layout="none" name={`audio ${scene.id}`}>
          <Audio src={staticFile(tl.audio)} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};

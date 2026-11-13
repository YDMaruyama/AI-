import React from 'react';
import {Icon, IconName} from '../../components/Icons';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {NotEqual, Pill} from '../../components/ui';
import {COLORS} from '../../theme';

/**
 * 曝露を学ぶこと ≠ 身の回りのものをすべて避けること（原文 Q1）。
 * 上段：「曝露を学ぶこと」と「すべて避けること」を ≠ で区別（後者は点線の枠で、主張ではないことを形でも示す）。
 * 下段：知る → 確かめる → 見直す（必要に応じて）を、話す順に一枚ずつ示す。
 */

const W = 1760;
const CARD_W = 500;
const GAP = (W - CARD_W * 3) / 2;
const CARD_TOP = 250;
const CARD_H = 380;

type Step = {lead: string; word: string; icon: IconName; tag?: string; step: number};

const DEFAULT_STEPS: Step[] = [
  {lead: '何に接しているのかを', word: '知る', icon: 'search', step: 2},
  {lead: '自分に関係する条件を', word: '確かめる', icon: 'person', step: 3},
  {lead: '扱い方や選び方を', word: '見直す', icon: 'cycle', tag: '必要に応じて', step: 4},
];

const Chevron: React.FC<{x: number; appear: number}> = ({x, appear}) => (
  <svg
    width={GAP}
    height={80}
    viewBox={`0 0 ${GAP} 80`}
    style={{position: 'absolute', left: x, top: CARD_TOP + CARD_H / 2 - 40, opacity: appear}}
  >
    <path d={`M${GAP / 2 - 14} 14 L${GAP / 2 + 16} 40 L${GAP / 2 - 14} 66`} fill="none" stroke={COLORS.gold} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const StepCard: React.FC<{s: Step; index: number; steps: number[]; allStep?: number}> = ({s, index, steps, allStep}) => {
  const appear = useReveal(s.step);
  const focus = useFocus((st) => {
    if (allStep !== undefined && st >= allStep) return true;
    if (steps.includes(st)) return steps[index] === st;
    return true;
  });
  return (
    <div
      style={{
        ...fadeUp(appear),
        opacity: appear * (0.62 + 0.38 * focus),
        position: 'absolute',
        left: index * (CARD_W + GAP),
        top: CARD_TOP,
        width: CARD_W,
        height: CARD_H,
        boxSizing: 'border-box',
        background: COLORS.surface,
        borderRadius: 22,
        border: `3px solid ${focus > 0.5 ? COLORS.green : COLORS.lineSoft}`,
        boxShadow: focus > 0.5 ? `0 10px 28px rgba(42,43,42,${0.1 * focus})` : 'none',
        padding: '30px 26px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 16,
      }}
    >
      <div
        style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          background: focus > 0.5 ? COLORS.green : COLORS.greenSoft,
          color: focus > 0.5 ? COLORS.surface : COLORS.green,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon name={s.icon} size={62} />
      </div>
      <div style={{fontSize: 36, fontWeight: 500, color: COLORS.inkSoft, lineHeight: 1.4, whiteSpace: 'nowrap'}}>{s.lead}</div>
      <div style={{fontSize: 58, fontWeight: 700, color: COLORS.greenDeep, lineHeight: 1.2, letterSpacing: '0.06em'}}>{s.word}</div>
      {s.tag ? (
        <Pill tone="gold" size={28}>
          {s.tag}
        </Pill>
      ) : null}
    </div>
  );
};

export const LearnFrame: React.FC<{
  learn?: string;
  avoid?: string;
  learnStep?: number;
  avoidStep?: number;
  steps?: Step[];
  allStep?: number;
}> = ({learn = '曝露を学ぶこと', avoid = '身の回りのものをすべて避けること', learnStep = 0, avoidStep = 1, steps = DEFAULT_STEPS, allStep}) => {
  const a = useReveal(learnStep);
  const b = useReveal(avoidStep);
  const ne = useReveal(avoidStep, {delay: 0.2});
  const stepNums = steps.map((s) => s.step);
  const rule = useReveal(stepNums[0] ?? 2);
  const topFocus = useFocus((st) => st < (stepNums[0] ?? 2) || (allStep !== undefined && st >= allStep));

  return (
    <div style={{position: 'absolute', inset: 0}}>
      {/* 上段：学ぶこと ≠ すべて避けること */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 20,
          height: 150,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 34,
          opacity: 0.62 + 0.38 * topFocus,
        }}
      >
        <div
          style={{
            ...fadeUp(a),
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            background: COLORS.greenSoft,
            border: `3px solid ${COLORS.green}`,
            borderRadius: 20,
            padding: '22px 38px',
          }}
        >
          <div style={{color: COLORS.green, display: 'flex'}}>
            <Icon name="book" size={60} />
          </div>
          <div style={{fontSize: 46, fontWeight: 700, color: COLORS.greenDeep, whiteSpace: 'nowrap'}}>{learn}</div>
        </div>
        <NotEqual appear={ne} size={84} />
        <div
          style={{
            ...fadeUp(b),
            display: 'flex',
            alignItems: 'center',
            background: COLORS.surface,
            border: `3px dashed ${COLORS.slate}`,
            borderRadius: 20,
            padding: '24px 38px',
          }}
        >
          <div style={{fontSize: 42, fontWeight: 700, color: COLORS.slate, whiteSpace: 'nowrap'}}>{avoid}</div>
        </div>
      </div>

      {/* 区切り */}
      <div style={{position: 'absolute', left: 300, right: 300, top: 206, height: 3, background: COLORS.lineSoft, opacity: rule}} />

      {/* 下段：知る → 確かめる → 見直す */}
      {steps.map((s, i) => (
        <StepCard key={s.word} s={s} index={i} steps={stepNums} allStep={allStep} />
      ))}
      {steps.slice(1).map((s, i) => (
        <ChevronAt key={s.word} index={i} step={s.step} />
      ))}
    </div>
  );
};

const ChevronAt: React.FC<{index: number; step: number}> = ({index, step}) => {
  const p = useReveal(step);
  return <Chevron x={(index + 1) * CARD_W + index * GAP} appear={p} />;
};

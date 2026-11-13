import React from 'react';
import {Icon, IconName} from '../../components/Icons';
import {fadeUp, lerp, useFocus, useReveal} from '../../components/scene-context';
import {COLORS} from '../../theme';

/**
 * 結び（原文 Q3 と、制作指示の結びの三つの言葉）。
 * 上に Q3 の一文、下に三つの言葉を番号付きのカードで一枚ずつ示す。
 * 三つは並列のカードとして置き、矢印でつながない。最後に三枚すべてを強調して終える。
 */

const W = 1760;
const GAP = 40;
const CARD_W = (W - GAP * 2) / 3;
const CARD_TOP = 210;
const CARD_H = 400;

type Point = {text: string; icon: IconName; step: number};

const DEFAULT_POINTS: Point[] = [
  {text: '何に接しているかを知る', icon: 'search', step: 1},
  {text: '使い方と状態を確かめる', icon: 'check', step: 2},
  {text: '生活に合った選択を重ねる', icon: 'list', step: 3},
];

const PointCard: React.FC<{p: Point; index: number; steps: number[]; allStep?: number}> = ({p, index, steps, allStep}) => {
  // 一枚目は、上の一文が移り終わってから現れる
  const appear = useReveal(p.step, {delay: index === 0 ? 0.45 : 0, duration: 0.7});
  const focus = useFocus((st) => {
    if (allStep !== undefined && st >= allStep) return true;
    if (steps.includes(st)) return steps[index] === st;
    return true;
  });
  return (
    <div
      style={{
        ...fadeUp(appear),
        // 表示済みのカードは十分に読める濃さで残す
        opacity: appear * (0.7 + 0.3 * focus),
        position: 'absolute',
        left: index * (CARD_W + GAP),
        top: CARD_TOP,
        width: CARD_W,
        height: CARD_H,
        boxSizing: 'border-box',
        background: COLORS.surface,
        borderRadius: 24,
        border: `3px solid ${focus > 0.5 ? COLORS.green : COLORS.lineSoft}`,
        borderTop: `14px solid ${focus > 0.5 ? COLORS.green : COLORS.line}`,
        boxShadow: focus > 0.5 ? `0 12px 30px rgba(42,43,42,${0.1 * focus})` : 'none',
        padding: '34px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 26,
        textAlign: 'center',
      }}
    >
      <div style={{fontSize: 32, fontWeight: 700, color: COLORS.gold, letterSpacing: '0.1em'}}>{index + 1}</div>
      <div
        style={{
          width: 128,
          height: 128,
          borderRadius: 64,
          background: focus > 0.5 ? COLORS.green : COLORS.greenSoft,
          color: focus > 0.5 ? COLORS.surface : COLORS.green,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={p.icon} size={80} />
      </div>
      <div style={{fontSize: 40, fontWeight: 700, color: COLORS.ink, lineHeight: 1.4, whiteSpace: 'nowrap', letterSpacing: '0.01em'}}>{p.text}</div>
    </div>
  );
};

export const Closing: React.FC<{lead?: string; leadStep?: number; points?: Point[]; allStep?: number}> = ({
  lead = '物質と身体の関係を学びながら、自分の生活に合った選択を重ねていく',
  leadStep = 0,
  points = DEFAULT_POINTS,
  allStep,
}) => {
  const a = useReveal(leadStep, {duration: 0.8});
  const line = useReveal(leadStep, {delay: 0.3, duration: 1.0});
  const steps = points.map((p) => p.step);
  // 最初は中央に大きく、三つの言葉が出始めたら上へ穏やかに移る
  const move = useReveal(steps[0] ?? 1, {duration: 0.8});
  const top = lerp(250, 26, move);
  const size = lerp(50, 40, move);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', left: 0, right: 0, top, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22}}>
        <div
          style={{
            ...fadeUp(a),
            fontSize: size,
            fontWeight: 700,
            color: move > 0.5 ? COLORS.inkSoft : COLORS.ink,
            letterSpacing: '0.03em',
            whiteSpace: 'nowrap',
          }}
        >
          {lead}
        </div>
        <div style={{height: 4, width: 560 * line, background: COLORS.gold, borderRadius: 2}} />
      </div>
      {points.map((p, i) => (
        <PointCard key={p.text} p={p} index={i} steps={steps} allStep={allStep} />
      ))}
    </div>
  );
};

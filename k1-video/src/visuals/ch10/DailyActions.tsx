import React from 'react';
import {Icon, IconName} from '../../components/Icons';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {COLORS} from '../../theme';

/**
 * 身近な行動（原文 Q2）。
 * 三枚のカード（表示を確かめる／食品を扱う／製品を使う）を話す順に示し、
 * 最後に三枚から下の帯「暮らしの中の接点を考えることにつながる」へ点線を引く。
 * 行動の効果（病気が減る等）は示さない。
 */

const W = 1760;
const GAP = 40;
const CARD_W = (W - GAP * 2) / 3;
const CARD_TOP = 16;
const CARD_H = 400;
const BAND_TOP = 534;
const BAND_H = 120;

type Action = {title: string; body: string; icon: IconName; step: number};

const DEFAULT_ACTIONS: Action[] = [
  {title: '表示を確かめる', body: '自分に関係するアレルゲンや、\n商品の注意表示を確認する', icon: 'label', step: 0},
  {title: '食品を扱う', body: '食品を適切に保存し、\n調理する', icon: 'food', step: 1},
  {title: '製品を使う', body: '使用方法を確認し、\n必要に応じて換気する', icon: 'window', step: 2},
];

const ActionCard: React.FC<{a: Action; index: number; steps: number[]; allStep?: number}> = ({a, index, steps, allStep}) => {
  const appear = useReveal(a.step);
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
        padding: '34px 26px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 108,
          height: 108,
          borderRadius: 54,
          background: focus > 0.5 ? COLORS.green : COLORS.greenSoft,
          color: focus > 0.5 ? COLORS.surface : COLORS.green,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon name={a.icon} size={68} />
      </div>
      <div style={{fontSize: 46, fontWeight: 700, color: COLORS.ink, lineHeight: 1.3}}>{a.title}</div>
      <div style={{fontSize: 34, fontWeight: 500, color: COLORS.inkSoft, lineHeight: 1.5, whiteSpace: 'pre-line'}}>{a.body}</div>
    </div>
  );
};

export const DailyActions: React.FC<{actions?: Action[]; allStep?: number; band?: string; bandStep?: number}> = ({
  actions = DEFAULT_ACTIONS,
  allStep = 3,
  band = 'こうした身近な行動も、暮らしの中の接点を考えることにつながる',
  bandStep = 3,
}) => {
  const steps = actions.map((a) => a.step);
  const link = useReveal(bandStep, {duration: 0.8});
  const bandIn = useReveal(bandStep, {delay: 0.4});
  const len = BAND_TOP - (CARD_TOP + CARD_H);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      {actions.map((a, i) => (
        <ActionCard key={a.title} a={a} index={i} steps={steps} allStep={allStep} />
      ))}
      {/* 三枚から帯へ */}
      <svg width={W} height={len} viewBox={`0 0 ${W} ${len}`} style={{position: 'absolute', left: 0, top: CARD_TOP + CARD_H}}>
        {actions.map((_, i) => {
          const x = i * (CARD_W + GAP) + CARD_W / 2;
          return <line key={i} x1={x} y1={8} x2={x} y2={len - 6} stroke={COLORS.gold} strokeWidth={5} strokeLinecap="round" strokeDasharray="10 10" opacity={link} />;
        })}
      </svg>
      <div
        style={{
          ...fadeUp(bandIn, 10),
          position: 'absolute',
          left: 0,
          right: 0,
          top: BAND_TOP,
          height: BAND_H,
          boxSizing: 'border-box',
          background: COLORS.greenSoft,
          border: `3px solid ${COLORS.green}`,
          borderRadius: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 22,
        }}
      >
        <div style={{color: COLORS.green, display: 'flex'}}>
          <Icon name="home" size={58} />
        </div>
        <div style={{fontSize: 40, fontWeight: 700, color: COLORS.greenDeep, letterSpacing: '0.02em'}}>{band}</div>
      </div>
    </div>
  );
};

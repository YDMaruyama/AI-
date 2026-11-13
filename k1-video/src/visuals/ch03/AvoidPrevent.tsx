import React from 'react';
import {Icon, IconName} from '../../components/Icons';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {COLORS} from '../../theme';

/**
 * 「避ける・防ぐ・排出する」のうち、曝露への対策は特に「避ける・防ぐ」につながる実践。
 * 三つの視点は矢印で結ばない（一連の排出経路のように見せない）。
 * 「排出する」は消さずに読める濃さで残し、「避ける・防ぐ」の上に括弧と見出しを付ける。
 * 最後に、次に見ること（暮らしの中の接点）を下段に示す。
 */
type Steps = {focus: number; next: number};

const CARD_TOP = 178;
const CARD_H = 290;
const CARD_W = 540;
const GAP = 70;

const VIEWS: {title: string; icon: IconName}[] = [
  {title: '避ける', icon: 'label'},
  {title: '防ぐ', icon: 'shield'},
  {title: '排出する', icon: 'cycle'},
];

const ViewCard: React.FC<{title: string; icon: IconName; x: number; appear: number; focus: number}> = ({title, icon, x, appear, focus}) => {
  const on = focus > 0.5;
  return (
    <div
      style={{
        ...fadeUp(appear),
        opacity: appear * (0.45 + 0.55 * focus),
        position: 'absolute',
        left: x,
        top: CARD_TOP,
        width: CARD_W,
        height: CARD_H,
        boxSizing: 'border-box',
        background: COLORS.surface,
        borderRadius: 22,
        border: `3px solid ${on ? COLORS.green : COLORS.lineSoft}`,
        boxShadow: on ? `0 10px 26px rgba(42,43,42,${0.1 * focus})` : 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
      }}
    >
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: 60,
          background: on ? COLORS.green : COLORS.greenSoft,
          color: on ? COLORS.surface : COLORS.green,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size={74} />
      </div>
      <div style={{fontSize: 60, fontWeight: 700, color: COLORS.ink, letterSpacing: '0.06em'}}>{title}</div>
    </div>
  );
};

export const AvoidPrevent: React.FC<{
  steps?: Steps;
  bracketTitle?: string;
  bracketSub?: string;
  nextLabel?: string;
  nextText?: string;
}> = ({
  steps = {focus: 1, next: 2},
  bracketTitle = '曝露への対策',
  bracketSub = '特に、この二つにつながる実践',
  nextLabel = 'まずは',
  nextText = '日々の暮らしのどこに、物質との接点があるか',
}) => {
  const cards = [useReveal(0, {delay: 0.1}), useReveal(0, {delay: 0.4}), useReveal(0, {delay: 0.7})];
  const bracket = useReveal(steps.focus, {duration: 0.8});
  const next = useReveal(steps.next);
  const twoFocus = 1;
  const thirdFocus = useFocus((s) => s < steps.focus);

  const x = (i: number) => i * (CARD_W + GAP);
  const bx0 = x(0) + 30;
  const bx1 = x(1) + CARD_W - 30;

  return (
    <div style={{position: 'absolute', inset: 0}}>
      {/* 括弧：避ける・防ぐ */}
      <div style={{...fadeUp(bracket, 10), position: 'absolute', left: bx0, width: bx1 - bx0, top: 26, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 24, whiteSpace: 'nowrap'}}>
          <span style={{fontSize: 44, fontWeight: 700, color: COLORS.greenDeep}}>{bracketTitle}</span>
          <span style={{fontSize: 34, fontWeight: 500, color: COLORS.ink}}>{bracketSub}</span>
        </div>
        <svg width={bx1 - bx0} height={50} viewBox={`0 0 ${bx1 - bx0} 50`} style={{marginTop: 8}}>
          <path
            d={`M3 46 V18 H${bx1 - bx0 - 3} V46`}
            fill="none"
            stroke={COLORS.green}
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d={`M${(bx1 - bx0) / 2} 18 V4`} stroke={COLORS.green} strokeWidth={5} strokeLinecap="round" />
        </svg>
      </div>

      {VIEWS.map((v, i) => (
        <ViewCard key={v.title} title={v.title} icon={v.icon} x={x(i)} appear={cards[i]} focus={i < 2 ? twoFocus : thirdFocus} />
      ))}

      {/* 次に見ること */}
      <div
        style={{
          ...fadeUp(next),
          position: 'absolute',
          left: 0,
          right: 0,
          top: CARD_TOP + CARD_H + 50,
          height: 116,
          boxSizing: 'border-box',
          background: COLORS.greenSoft,
          borderRadius: 18,
          padding: '0 40px',
          display: 'flex',
          alignItems: 'center',
          gap: 26,
        }}
      >
        <div style={{color: COLORS.green, display: 'flex'}}>
          <Icon name="search" size={60} />
        </div>
        <div
          style={{
            fontSize: 30,
            fontWeight: 700,
            color: COLORS.surface,
            background: COLORS.green,
            borderRadius: 10,
            padding: '4px 16px',
            whiteSpace: 'nowrap',
          }}
        >
          {nextLabel}
        </div>
        <div style={{fontSize: 42, fontWeight: 700, color: COLORS.ink, whiteSpace: 'nowrap'}}>{nextText}</div>
      </div>
    </div>
  );
};

import React from 'react';
import {Icon, IconName} from '../../components/Icons';
import {fadeUp, useReveal} from '../../components/scene-context';
import {Arrow} from '../../components/ui';
import {COLORS} from '../../theme';

/**
 * 「曝露（ばくろ）」の定義。
 * 左：食べ物・空気・肌に触れる製品など → 右のカード「さまざまな物質に接している」
 * step: define で、カードの下段に「曝露」（読み：ばくろ）と「＝ 物質に接すること」を表示。
 */
type Source = {icon: IconName; text: string; delay: number};

const SOURCES: Source[] = [
  {icon: 'food', text: '食べ物', delay: 0.9},
  {icon: 'air', text: '空気', delay: 1.4},
  {icon: 'bottle', text: '肌に触れる製品', delay: 1.9},
];
const ROW_Y = [130, 318, 506];
const CARD = {x: 820, y: 30, w: 940, h: 580};

export const ExposureWord: React.FC<{steps?: {define: number}; word?: string; reading?: string; meaning?: string; lead?: string}> = ({
  steps = {define: 1},
  word = '曝露',
  reading = 'ばくろ',
  meaning = '物質に接すること',
  lead = 'さまざまな物質に接している',
}) => {
  const rows = [useReveal(0, {delay: SOURCES[0].delay}), useReveal(0, {delay: SOURCES[1].delay}), useReveal(0, {delay: SOURCES[2].delay})];
  const arrows = [useReveal(0, {delay: 2.6, duration: 0.8}), useReveal(0, {delay: 2.8, duration: 0.8}), useReveal(0, {delay: 3.0, duration: 0.8})];
  const card = useReveal(0, {delay: 2.3});
  const leadP = useReveal(0, {delay: 3.4});
  const define = useReveal(steps.define, {duration: 0.8});
  const meaningP = useReveal(steps.define, {delay: 0.6});

  return (
    <div style={{position: 'absolute', inset: 0}}>
      {SOURCES.map((s, i) => (
        <div
          key={s.text}
          style={{
            ...fadeUp(rows[i], 10),
            position: 'absolute',
            left: 0,
            top: ROW_Y[i] - 56,
            height: 112,
            width: 620,
            boxSizing: 'border-box',
            background: COLORS.surface,
            border: `3px solid ${COLORS.lineSoft}`,
            borderRadius: 56,
            padding: '0 34px 0 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 24,
          }}
        >
          <div style={{width: 80, height: 80, borderRadius: 40, background: COLORS.greenSoft, color: COLORS.green, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
            <Icon name={s.icon} size={54} />
          </div>
          <div style={{fontSize: 42, fontWeight: 700, color: COLORS.ink, whiteSpace: 'nowrap'}}>{s.text}</div>
        </div>
      ))}

      <svg width={1760} height={676} viewBox="0 0 1760 676" style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none'}}>
        {ROW_Y.map((y, i) => (
          <Arrow key={i} from={[640, y]} to={[CARD.x - 22, 318]} bend={i === 0 ? -18 : i === 2 ? 18 : 0} p={arrows[i]} color={COLORS.gold} width={5} />
        ))}
      </svg>

      <div
        style={{
          ...fadeUp(card),
          position: 'absolute',
          left: CARD.x,
          top: CARD.y,
          width: CARD.w,
          height: CARD.h,
          boxSizing: 'border-box',
          background: COLORS.surface,
          borderRadius: 26,
          border: `3px solid ${define > 0.5 ? COLORS.green : COLORS.lineSoft}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '30px 40px 40px',
        }}
      >
        <div style={{...fadeUp(leadP, 10), fontSize: 44, fontWeight: 700, color: COLORS.ink, whiteSpace: 'nowrap'}}>{lead}</div>
        <div style={{width: 640 * define, height: 4, background: COLORS.gold, borderRadius: 2, margin: '34px 0 10px'}} />
        <div style={{...fadeUp(define, 14), display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <div style={{fontSize: 40, fontWeight: 700, color: COLORS.green, letterSpacing: '0.5em', marginLeft: '0.5em', lineHeight: 1.2}}>{reading}</div>
          <div style={{fontSize: 156, fontWeight: 700, color: COLORS.greenDeep, letterSpacing: '0.12em', marginLeft: '0.12em', lineHeight: 1.1}}>{word}</div>
        </div>
        <div style={{...fadeUp(meaningP, 10), display: 'flex', alignItems: 'center', gap: 18, marginTop: 14}}>
          <span style={{fontSize: 50, fontWeight: 700, color: COLORS.gold}}>＝</span>
          <span style={{fontSize: 44, fontWeight: 700, color: COLORS.ink}}>{meaning}</span>
        </div>
      </div>
    </div>
  );
};

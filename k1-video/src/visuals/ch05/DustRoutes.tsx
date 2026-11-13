import React from 'react';
import {Icon, SvgIcon} from '../../components/Icons';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {Arrow, CornerTag, SvgText} from '../../components/ui';
import {COLORS} from '../../theme';
import {Node, Shard} from './parts';

/**
 * ほこりの経路（模式図）：
 *  経路1 ほこり → 吸い込む
 *  経路2 ほこり → 手に付く → 口に入る
 * 小さな子どもは床の近くで過ごし、手や物を口に運ぶ（汎用の子どもの記号のみ）。
 * 下の帯：屋外にはタイヤや路面の摩耗などによる粒子もある。
 */
type Steps = {inhale: number; hand: number; child: number; outdoor: number};

const DUST = {x: 170, y: 330, r: 100};
const INH = {x: 560, y: 110, r: 74};
const HAND = {x: 560, y: 390, r: 74};
const MOUTH = {x: 880, y: 390, r: 74};

export const DustRoutes: React.FC<{steps?: Steps}> = ({steps = {inhale: 1, hand: 2, child: 3, outdoor: 4}}) => {
  const base = useReveal(0, {duration: 0.7});
  const inhale = useReveal(steps.inhale, {duration: 0.9});
  const hand = useReveal(steps.hand, {duration: 0.9});
  const handArrow2 = useReveal(steps.hand, {delay: 0.5, duration: 0.9});
  const child = useReveal(steps.child, {duration: 0.8});
  const childRing = useReveal(steps.child, {delay: 0.6, duration: 0.8});
  const outdoor = useReveal(steps.outdoor);
  const fInhale = useFocus((s) => s === steps.inhale || s >= steps.outdoor || s < steps.inhale);
  const fHand = useFocus((s) => s >= steps.hand);

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <svg width={1100} height={580} viewBox="0 0 1100 580" style={{position: 'absolute', left: 0, top: 0}}>
        {/* ほこり */}
        <g opacity={base}>
          <circle cx={DUST.x} cy={DUST.y} r={DUST.r} fill={COLORS.panel} stroke={COLORS.inkSoft} strokeWidth={4} />
          <SvgIcon name="dust" x={DUST.x - 52} y={DUST.y - 58} size={104} color={COLORS.inkSoft} />
          <Shard x={DUST.x - 40} y={DUST.y + 48} r={11} rot={20} />
          <Shard x={DUST.x + 44} y={DUST.y + 36} r={10} rot={-40} />
          <SvgText x={DUST.x} y={DUST.y + DUST.r + 42} size={36} weight={700}>
            室内のほこり
          </SvgText>
        </g>

        {/* 経路1：吸い込む */}
        <g opacity={inhale * (0.45 + 0.55 * fInhale)}>
          <Arrow from={[DUST.x + 70, DUST.y - 76]} to={[INH.x - 80, INH.y + 26]} p={inhale} color={COLORS.green} width={5} bend={20} />
          <Node x={INH.x} y={INH.y} r={INH.r} icon="lungs" iconSize={88} />
          <SvgText x={INH.x + INH.r + 24} y={INH.y} size={38} weight={700} anchor="start">
            吸い込む
          </SvgText>
        </g>

        {/* 経路2：手に付く → 口に入る */}
        <g opacity={hand * (0.45 + 0.55 * fHand)}>
          <Arrow from={[DUST.x + DUST.r + 10, HAND.y - 20]} to={[HAND.x - HAND.r - 12, HAND.y]} p={hand} color={COLORS.green} width={5} />
          <Node x={HAND.x} y={HAND.y} r={HAND.r} icon="hand" iconSize={84} label="手に付く" labelSize={34} labelGap={42} />
          <Arrow from={[HAND.x + HAND.r + 10, HAND.y]} to={[MOUTH.x - MOUTH.r - 12, MOUTH.y]} p={handArrow2} color={COLORS.green} width={5} />
          <g opacity={handArrow2}>
            <Node x={MOUTH.x} y={MOUTH.y} r={MOUTH.r} icon="mouth" iconSize={84} label="口に入る" labelSize={34} labelGap={42} />
          </g>
        </g>

        {/* 子どもに関係する経路を囲む */}
        <rect
          x={HAND.x - HAND.r - 30}
          y={HAND.y - HAND.r - 30}
          width={MOUTH.x - HAND.x + HAND.r * 2 + 60}
          height={HAND.r * 2 + 120}
          rx={30}
          fill="none"
          stroke={COLORS.gold}
          strokeWidth={5}
          strokeDasharray="12 10"
          opacity={childRing}
        />
        <line x1={MOUTH.x + MOUTH.r + 30} y1={HAND.y} x2={1100} y2={HAND.y} stroke={COLORS.gold} strokeWidth={5} strokeDasharray="12 10" opacity={childRing} />
      </svg>

      {/* 小さな子ども */}
      <div
        style={{
          ...fadeUp(child),
          position: 'absolute',
          left: 1100,
          top: 0,
          width: 660,
          height: 556,
          boxSizing: 'border-box',
          background: COLORS.surface,
          border: `3px solid ${child > 0.5 ? COLORS.gold : COLORS.lineSoft}`,
          borderTop: `14px solid ${COLORS.gold}`,
          borderRadius: 22,
          padding: '24px 32px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 24,
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
          <div style={{width: 110, height: 110, borderRadius: 55, background: COLORS.goldSoft, color: COLORS.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
            <Icon name="child" size={84} />
          </div>
          <div style={{fontSize: 42, fontWeight: 700, color: COLORS.ink}}>小さな子ども</div>
        </div>
        {['床の近くで過ごす', '手や物を口に運ぶ'].map((t) => (
          <div key={t} style={{display: 'flex', gap: 14, fontSize: 38, fontWeight: 600, color: COLORS.ink, lineHeight: 1.4}}>
            <span style={{color: COLORS.gold}}>●</span>
            <span>{t}</span>
          </div>
        ))}
        <div style={{marginTop: 16, fontSize: 36, fontWeight: 700, color: COLORS.greenDeep, background: COLORS.greenSoft, borderRadius: 14, padding: '14px 20px', lineHeight: 1.45}}>
          こうした経路への
          <br />
          配慮が役立つ
        </div>
      </div>

      {/* 屋外 */}
      <div
        style={{
          ...fadeUp(outdoor, 12),
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 22,
          background: COLORS.slateSoft,
          borderLeft: `8px solid ${COLORS.slate}`,
          borderRadius: 12,
          padding: '10px 28px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{flexShrink: 0, fontSize: 28, fontWeight: 700, color: COLORS.surface, background: COLORS.slate, borderRadius: 8, padding: '4px 14px', letterSpacing: '0.08em'}}>屋外</div>
        <div style={{color: COLORS.slate, display: 'flex'}}>
          <Icon name="tire" size={52} />
        </div>
        <div style={{fontSize: 32, fontWeight: 500, color: COLORS.ink, lineHeight: 1.45}}>タイヤや路面の摩耗などによる粒子もある</div>
      </div>

      <div style={{position: 'absolute', left: 860, top: 0}}>
        <CornerTag appear={base}>模式図</CornerTag>
      </div>
    </div>
  );
};

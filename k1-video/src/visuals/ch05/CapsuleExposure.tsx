import React from 'react';
import {interpolate} from 'remotion';
import {Icon, IconName, SvgIcon} from '../../components/Icons';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {Arrow, NoteStrip, SvgPill, SvgText} from '../../components/ui';
import {COLORS} from '../../theme';
import {Shard, Waft} from './parts';

/**
 * 柔軟剤：放出された香料への曝露と、カプセル・破片への曝露の両方に目を向ける。
 *  左：衣類から立ちのぼる香料（波線）と、カプセル・破片（角ばった形）。量は描かない。
 *  右上：香りを感じる ≠ 粒子をどれほど吸い込んだか
 *  右下：吸入による影響を考えるのに必要な情報
 *  下：この図から吸入量は定量できない（模式図）
 */
type Steps = {both: number; scent: number; needs: number};

const NEEDS: {icon: IconName; text: string}[] = [
  {icon: 'scale', text: '衣類から離れる粒子の量'},
  {icon: 'search', text: '粒子の大きさ'},
  {icon: 'air', text: '空気中への舞い上がり方'},
];

export const CapsuleExposure: React.FC<{steps?: Steps}> = ({steps = {both: 1, scent: 2, needs: 3}}) => {
  const base = useReveal(0, {duration: 0.7});
  const both = useReveal(steps.both, {duration: 1.6});
  const bothLabel = useReveal(steps.both, {delay: 1.0});
  const scent = useReveal(steps.scent);
  const needs = useReveal(steps.needs);
  const fScent = useFocus((s) => s === steps.scent);
  const fNeeds = useFocus((s) => s >= steps.needs);
  const rise = interpolate(both, [0, 1], [0, 1]);

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <svg width={780} height={590} viewBox="0 0 780 590" style={{position: 'absolute', left: 0, top: 0}}>
        <g opacity={base}>
          <SvgIcon name="shirt" x={70} y={330} size={250} color={COLORS.green} />
          <circle cx={660} cy={130} r={78} fill={COLORS.panel} stroke={COLORS.inkSoft} strokeWidth={4} />
          <SvgIcon name="lungs" x={614} y={84} size={92} color={COLORS.inkSoft} />
          <SvgText x={660} y={244} size={32} weight={700}>
            吸い込む空気
          </SvgText>
        </g>
        {/* 香料（波線） */}
        {[150, 205].map((x, i) => (
          <Waft key={x} x={x} y={340 - 40 * rise} h={150} amp={16} width={6} p={interpolate(both, [i * 0.1, 0.6 + i * 0.1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
        ))}
        {/* カプセル・破片（角ばった形） */}
        {[
          {x: 270, y: 300, r: 15, rot: 20},
          {x: 320, y: 250, r: 13, rot: -30},
          {x: 360, y: 300, r: 11, rot: 60},
          {x: 300, y: 200, r: 12, rot: 10},
        ].map((s, i) => {
          const k = interpolate(both, [0.2 + i * 0.1, 0.7 + i * 0.1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          return <Shard key={i} x={s.x + 20 * k} y={s.y - 30 * k} r={s.r} rot={s.rot} opacity={k > 0 ? 1 : 0} />;
        })}
        {/* どちらも呼吸の場に届きうる（点線） */}
        <Arrow from={[240, 150]} to={[572, 108]} p={bothLabel} dashed color={COLORS.gold} width={4} bend={20} />
        <Arrow from={[400, 200]} to={[574, 160]} p={bothLabel} dashed color={COLORS.slate} width={4} bend={-10} />
        <SvgPill x={150} y={70} text="放出された香料" size={30} fill={COLORS.gold} opacity={bothLabel} />
        <SvgPill x={500} y={330} text="カプセル・破片" size={30} fill={COLORS.slate} opacity={bothLabel} />
        <SvgPill x={560} y={470} text="両方に目を向ける" size={30} fill={COLORS.surface} color={COLORS.green} stroke={COLORS.green} opacity={bothLabel} />
      </svg>

      {/* 香りを感じる ≠ 吸い込んだ粒子の量 */}
      <div
        style={{
          ...fadeUp(scent),
          opacity: scent * (0.55 + 0.45 * fScent),
          position: 'absolute',
          left: 820,
          top: 0,
          width: 940,
          boxSizing: 'border-box',
          background: COLORS.surface,
          border: `3px solid ${fScent > 0.5 ? COLORS.gold : COLORS.lineSoft}`,
          borderRadius: 20,
          padding: '22px 30px',
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
          <div style={{fontSize: 36, fontWeight: 700, color: COLORS.ink, background: COLORS.goldSoft, borderRadius: 14, padding: '10px 20px', whiteSpace: 'nowrap'}}>香りを感じる</div>
          <div style={{fontSize: 60, fontWeight: 700, color: COLORS.gold, lineHeight: 1}}>≠</div>
          <div style={{fontSize: 36, fontWeight: 700, color: COLORS.ink, background: COLORS.slateSoft, borderRadius: 14, padding: '10px 20px', lineHeight: 1.35}}>
            プラスチック粒子を
            <br />
            どれほど吸い込んだか
          </div>
        </div>
        <div style={{marginTop: 12, fontSize: 32, fontWeight: 700, color: COLORS.inkSoft}}>香りだけでは分からない</div>
      </div>

      {/* 必要な情報 */}
      <div
        style={{
          ...fadeUp(needs),
          opacity: needs * (0.55 + 0.45 * fNeeds),
          position: 'absolute',
          left: 820,
          top: 262,
          width: 940,
          boxSizing: 'border-box',
          background: COLORS.surface,
          border: `3px solid ${fNeeds > 0.5 ? COLORS.green : COLORS.lineSoft}`,
          borderRadius: 20,
          padding: '18px 30px',
        }}
      >
        <div style={{fontSize: 34, fontWeight: 700, color: COLORS.ink, marginBottom: 6}}>吸入による影響を考えるのに必要な情報</div>
        {NEEDS.map((n) => (
          <div key={n.text} style={{display: 'flex', alignItems: 'center', gap: 18, padding: '5px 0'}}>
            <div style={{color: COLORS.green, display: 'flex'}}>
              <Icon name={n.icon} size={46} />
            </div>
            <div style={{fontSize: 34, fontWeight: 600, color: COLORS.ink}}>{n.text}</div>
          </div>
        ))}
      </div>

      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0}}>
        <NoteStrip appear={base} label="模式図">
          この図から、吸入量を定量することはできません
        </NoteStrip>
      </div>
    </div>
  );
};

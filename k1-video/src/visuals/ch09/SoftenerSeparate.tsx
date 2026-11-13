import React from 'react';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {Arrow, Pill, SvgPill, SvgText} from '../../components/ui';
import {COLORS} from '../../theme';
import {Box, FragMark, IconBadge, WaveMark} from './parts';

/**
 * 柔軟剤：注意したいものと、分けて考えること（N14）。注意点と留保を同じ場面に置く。
 *  上：注意したいもの … 放出される香料（波線）／カプセルやその破片（角ばった形）
 *  中：ただし「香りがする」から「プラスチック粒子を同時にどれほど吸い込んでいるか」は判断できない（点線＋？）
 *  下：「使うとマイクロプラスチックを食べる」と一括りにしない → 衣類からの粒子の脱落／吸入 など を分けて考える
 * 量・数は描かない。
 */
type Steps = {attention: number; cannot: number; lump: number; separate: number};

const ROW_B = 162;
const ROW_B_H = 190;
const ROW_C = 402;

export const SoftenerSeparate: React.FC<{steps?: Steps}> = ({steps = {attention: 1, cannot: 2, lump: 3, separate: 4}}) => {
  const att = useReveal(steps.attention);
  const attFocus = useFocus((s) => s === steps.attention);
  const top = useReveal(steps.cannot);
  const arrow = useReveal(steps.cannot, {delay: 0.4, duration: 0.9});
  const cannot = useReveal(steps.cannot, {delay: 1.2});
  const topFocus = useFocus((s) => s === steps.cannot);
  const lump = useReveal(steps.lump);
  const lumpFocus = useFocus((s) => s === steps.lump);
  const sep = useReveal(steps.separate);
  const sep2 = useReveal(steps.separate, {delay: 0.5});
  const sepFocus = useFocus((s) => s >= steps.separate);
  const midY = ROW_B + ROW_B_H / 2 - 20;

  return (
    <div style={{position: 'absolute', inset: 0}}>
      {/* 上：注意したいもの */}
      <Box
        appear={att}
        focus={attFocus}
        tone="green"
        style={{left: 0, top: 14, width: 1760, height: 120, display: 'flex', alignItems: 'center', gap: 30, padding: '0 40px'}}
      >
        <Pill tone="green" filled size={32}>
          注意したいもの
        </Pill>
        <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
          <WaveMark size={58} />
          <div style={{fontSize: 42, fontWeight: 700, color: COLORS.ink}}>放出される香料</div>
        </div>
        <div style={{fontSize: 36, fontWeight: 700, color: COLORS.inkSoft}}>と</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
          <FragMark size={58} />
          <div style={{fontSize: 42, fontWeight: 700, color: COLORS.ink}}>カプセルやその破片</div>
        </div>
      </Box>

      {/* 中：香り → 吸い込む量は判断できない */}
      <Box
        appear={top}
        focus={topFocus}
        tone="gold"
        style={{left: 0, top: ROW_B, width: 420, height: ROW_B_H, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14}}
      >
        <IconBadge name="fragrance" tone="gold" size={84} />
        <div style={{fontSize: 40, fontWeight: 700, color: COLORS.ink}}>香りがする</div>
      </Box>

      <svg width={1760} height={676} viewBox="0 0 1760 676" style={{position: 'absolute', left: 0, top: 0, opacity: 0.5 + 0.5 * topFocus, pointerEvents: 'none'}}>
        <Arrow from={[440, midY]} to={[940, midY]} p={arrow} dashed color={COLORS.inkSoft} width={5} />
        <g opacity={arrow}>
          <circle cx={690} cy={midY} r={30} fill={COLORS.surface} stroke={COLORS.inkSoft} strokeWidth={4} />
          <SvgText x={690} y={midY + 2} size={36} weight={700} color={COLORS.inkSoft}>
            ？
          </SvgText>
        </g>
        <SvgPill x={690} y={midY + 76} text="これだけでは判断できない" size={30} fill={COLORS.goldSoft} color={COLORS.ink} stroke={COLORS.gold} opacity={cannot} />
      </svg>

      <Box
        appear={top}
        focus={topFocus}
        tone="slate"
        style={{left: 960, top: ROW_B, width: 800, height: ROW_B_H, display: 'flex', alignItems: 'center', gap: 26, padding: '0 34px'}}
      >
        <IconBadge name="lungs" tone="slate" size={88} />
        <div>
          <div style={{fontSize: 32, fontWeight: 500, color: COLORS.inkSoft, lineHeight: 1.4}}>プラスチック粒子を</div>
          <div style={{fontSize: 38, fontWeight: 700, color: COLORS.ink, lineHeight: 1.4}}>同時にどれほど吸い込んでいるか</div>
        </div>
      </Box>

      {/* 下左：一括りにしない */}
      <Box
        appear={lump}
        focus={lumpFocus}
        tone="slate"
        dashed
        style={{left: 0, top: ROW_C, width: 760, height: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22}}
      >
        <Pill tone="slate" filled size={30}>
          一括りにしない
        </Pill>
        <div style={{fontSize: 34, fontWeight: 700, color: COLORS.inkSoft}}>「使うとマイクロプラスチックを食べる」</div>
        <svg width={56} height={56} viewBox="0 0 56 56" style={{position: 'absolute', right: 18, top: 18}}>
          <circle cx={28} cy={28} r={24} fill={COLORS.surface} stroke={COLORS.slate} strokeWidth={4} />
          <path d="M18 18 L38 38 M38 18 L18 38" stroke={COLORS.slate} strokeWidth={5} strokeLinecap="round" />
        </svg>
      </Box>

      <svg width={1760} height={676} viewBox="0 0 1760 676" style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none'}}>
        <Arrow from={[776, ROW_C + 140]} to={[870, ROW_C + 140]} p={sep} color={COLORS.green} width={6} />
      </svg>

      {/* 下右：分けて考える */}
      <div style={{...fadeUp(sep), opacity: sep * (0.5 + 0.5 * sepFocus), position: 'absolute', left: 890, top: ROW_C - 6}}>
        <Pill tone="green" filled size={30}>
          分けて考える
        </Pill>
      </div>
      <Box
        appear={sep}
        focus={sepFocus}
        tone="green"
        style={{left: 890, top: ROW_C + 56, width: 520, height: 180, display: 'flex', alignItems: 'center', gap: 18, padding: '0 26px'}}
      >
        <IconBadge name="shirt" tone="green" size={80} />
        <div style={{fontSize: 36, fontWeight: 700, color: COLORS.ink, lineHeight: 1.35}}>衣類からの粒子の脱落</div>
      </Box>
      <Box
        appear={sep2}
        focus={sepFocus}
        tone="green"
        style={{left: 1426, top: ROW_C + 56, width: 236, height: 180, display: 'flex', alignItems: 'center', gap: 16, padding: '0 22px'}}
      >
        <IconBadge name="lungs" tone="green" size={80} />
        <div style={{fontSize: 38, fontWeight: 700, color: COLORS.ink}}>吸入</div>
      </Box>
      <div style={{...fadeUp(sep2), position: 'absolute', left: 1680, top: ROW_C + 122, fontSize: 34, fontWeight: 700, color: COLORS.inkSoft}}>など</div>
    </div>
  );
};

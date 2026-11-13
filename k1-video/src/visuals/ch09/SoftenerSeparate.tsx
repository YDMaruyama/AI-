import React from 'react';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {Arrow, Pill, SvgPill, SvgText} from '../../components/ui';
import {COLORS} from '../../theme';
import {Box, IconBadge} from './parts';

/**
 * 柔軟剤：一括りにせず、分けて考える（N14 後半）。
 *  上：「香りがする」から「プラスチック粒子を同時にどれほど吸い込んでいるか」は判断できない（点線＋？）
 *  下：「使うとマイクロプラスチックを食べる」と一括りにしない → 衣類からの粒子の脱落／吸入 など を分けて考える
 */
type Steps = {cannot: number; lump: number; separate: number};

export const SoftenerSeparate: React.FC<{steps?: Steps}> = ({steps = {cannot: 1, lump: 2, separate: 3}}) => {
  const top = useReveal(steps.cannot);
  const arrow = useReveal(steps.cannot, {delay: 0.4, duration: 0.9});
  const cannot = useReveal(steps.cannot, {delay: 1.2});
  const topFocus = useFocus((s) => s <= steps.cannot);
  const lump = useReveal(steps.lump);
  const lumpFocus = useFocus((s) => s === steps.lump);
  const sep = useReveal(steps.separate);
  const sep2 = useReveal(steps.separate, {delay: 0.5});
  const sepFocus = useFocus((s) => s >= steps.separate);

  return (
    <div style={{position: 'absolute', inset: 0}}>
      {/* 上：香り → 吸い込む量は判断できない */}
      <Box
        appear={top}
        focus={topFocus}
        tone="gold"
        style={{left: 0, top: 30, width: 460, height: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16}}
      >
        <IconBadge name="fragrance" tone="gold" size={92} />
        <div style={{fontSize: 42, fontWeight: 700, color: COLORS.ink}}>香りがする</div>
      </Box>

      <svg width={1760} height={300} viewBox="0 0 1760 300" style={{position: 'absolute', left: 0, top: 0, opacity: 0.5 + 0.5 * topFocus}}>
        <Arrow from={[478, 140]} to={[940, 140]} p={arrow} dashed color={COLORS.inkSoft} width={5} />
        <g opacity={arrow}>
          <circle cx={710} cy={140} r={30} fill={COLORS.surface} stroke={COLORS.inkSoft} strokeWidth={4} />
          <SvgText x={710} y={142} size={36} weight={700} color={COLORS.inkSoft}>
            ？
          </SvgText>
        </g>
        <SvgPill x={710} y={224} text="これだけでは判断できない" size={30} fill={COLORS.goldSoft} color={COLORS.ink} stroke={COLORS.gold} opacity={cannot} />
      </svg>

      <Box
        appear={top}
        focus={topFocus}
        tone="slate"
        style={{left: 960, top: 30, width: 800, height: 240, display: 'flex', alignItems: 'center', gap: 26, padding: '0 34px'}}
      >
        <IconBadge name="lungs" tone="slate" size={92} />
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
        style={{left: 0, top: 350, width: 760, height: 250, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22}}
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
        <Arrow from={[776, 475]} to={[870, 475]} p={sep} color={COLORS.green} width={6} />
      </svg>

      {/* 下右：分けて考える */}
      <div style={{...fadeUp(sep), opacity: sep * (0.5 + 0.5 * sepFocus), position: 'absolute', left: 890, top: 350}}>
        <Pill tone="green" filled size={30}>
          分けて考える
        </Pill>
      </div>
      <Box
        appear={sep}
        focus={sepFocus}
        tone="green"
        style={{left: 890, top: 420, width: 520, height: 180, display: 'flex', alignItems: 'center', gap: 18, padding: '0 26px'}}
      >
        <IconBadge name="shirt" tone="green" size={80} />
        <div style={{fontSize: 36, fontWeight: 700, color: COLORS.ink, lineHeight: 1.35}}>衣類からの粒子の脱落</div>
      </Box>
      <Box
        appear={sep2}
        focus={sepFocus}
        tone="green"
        style={{left: 1426, top: 420, width: 236, height: 180, display: 'flex', alignItems: 'center', gap: 16, padding: '0 22px'}}
      >
        <IconBadge name="lungs" tone="green" size={80} />
        <div style={{fontSize: 38, fontWeight: 700, color: COLORS.ink}}>吸入</div>
      </Box>
      <div style={{...fadeUp(sep2), position: 'absolute', left: 1680, top: 486, fontSize: 34, fontWeight: 700, color: COLORS.inkSoft}}>など</div>
    </div>
  );
};

import React from 'react';
import {IconName} from '../../components/Icons';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {Arrow, Pill} from '../../components/ui';
import {COLORS} from '../../theme';
import {Box, IconBadge} from './parts';

/**
 * 特に注意したい使い方（N2）。
 *  左：4 つの使い方（加熱する／包丁で削る／硬い道具でこする／傷んだまま使い続ける）
 *  右：材質や使用条件によっては → 細かな粒子が出る → 食品に混じる → 一緒に取り込む可能性（点線＝条件付き）
 *  下：柔軟剤は食品への混入とは別に、香料やカプセル由来の粒子との接触を考える（区切り線で分ける）
 */
type Steps = {uses: number[]; cond: number; flow: number[]; softener: number};

const USES: {icon: IconName; text: string}[] = [
  {icon: 'microwave', text: '加熱する'},
  {icon: 'knife', text: '包丁で削る'},
  {icon: 'spatula', text: '硬い道具でこする'},
  {icon: 'clock', text: '傷んだまま使い続ける'},
];
const FLOW = ['細かな粒子が出る', '食品に混じる', '食べ物と一緒に取り込む可能性'];

const TILE_W = 420;
const TILE_H = 196;
const GAP = 20;
const FLOW_X = 1060;
const FLOW_W = 700;
const TOP = 24;
const FLOW_TOP = [76 + TOP, 198 + TOP, 320 + TOP];
const FLOW_H = 84;

const UseTile: React.FC<{i: number; step: number; steps: Steps}> = ({i, step, steps}) => {
  const appear = useReveal(step);
  const focus = useFocus((s) => s === step || (s >= steps.cond && s < steps.softener));
  const u = USES[i];
  return (
    <Box
      appear={appear}
      focus={focus}
      tone="slate"
      style={{
        left: (i % 2) * (TILE_W + GAP),
        top: TOP + Math.floor(i / 2) * (TILE_H + GAP),
        width: TILE_W,
        height: TILE_H,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
      }}
    >
      <IconBadge name={u.icon} tone="slate" size={92} />
      <div style={{fontSize: 36, fontWeight: 700, color: COLORS.ink}}>{u.text}</div>
    </Box>
  );
};

const FlowBox: React.FC<{i: number; step: number; focus: number}> = ({i, step, focus}) => {
  const appear = useReveal(step);
  return (
    <Box
      appear={appear}
      focus={focus}
      tone="green"
      style={{
        left: FLOW_X + 40,
        top: FLOW_TOP[i],
        width: FLOW_W - 80,
        height: FLOW_H,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 36,
        fontWeight: 700,
        color: COLORS.ink,
      }}
    >
      {FLOW[i]}
    </Box>
  );
};

export const UseRisks: React.FC<{steps?: Steps}> = ({steps = {uses: [1, 2, 3, 4], cond: 5, flow: [6, 7, 8], softener: 9}}) => {
  const cond = useReveal(steps.cond, {duration: 0.9});
  const flowFocus = useFocus((s) => s >= steps.cond && s < steps.softener);
  const arrows = steps.flow.map((s) => useReveal(s, {delay: 0.1, duration: 0.6}));
  const soft = useReveal(steps.softener);
  const softFocus = useFocus((s) => s >= steps.softener);
  const cx = FLOW_X + FLOW_W / 2;

  return (
    <div style={{position: 'absolute', inset: 0}}>
      {steps.uses.map((s, i) => (
        <UseTile key={i} i={i} step={s} steps={steps} />
      ))}

      {/* 条件 */}
      <div style={{...fadeUp(cond), opacity: cond * (0.5 + 0.5 * flowFocus), position: 'absolute', left: FLOW_X, width: FLOW_W, top: TOP - 4, display: 'flex', justifyContent: 'center'}}>
        <Pill tone="gold" size={30} style={{border: `2.5px dashed ${COLORS.gold}`}}>
          材質や使用条件によっては
        </Pill>
      </div>

      <svg width={1760} height={676} viewBox="0 0 1760 676" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {/* 使い方 → 粒子（条件付き：点線） */}
        <Arrow from={[878, 206 + TOP]} to={[FLOW_X + 30, FLOW_TOP[0] + FLOW_H / 2]} bend={-30} p={cond} dashed color={COLORS.gold} width={5} opacity={0.5 + 0.5 * flowFocus} />
        {[0, 1].map((k) => (
          <Arrow
            key={k}
            from={[cx, FLOW_TOP[k] + FLOW_H + 4]}
            to={[cx, FLOW_TOP[k + 1] - 6]}
            p={arrows[k + 1]}
            dashed
            color={COLORS.green}
            width={5}
            opacity={0.5 + 0.5 * flowFocus}
          />
        ))}
        {/* 区切り線：柔軟剤は別に考える */}
        <line x1={0} y1={474} x2={1760} y2={474} stroke={COLORS.line} strokeWidth={3} strokeDasharray="12 10" opacity={soft} />
      </svg>

      {FLOW.map((_, i) => (
        <FlowBox key={i} i={i} step={steps.flow[i]} focus={flowFocus} />
      ))}

      {/* 柔軟剤 */}
      <Box
        appear={soft}
        focus={softFocus}
        tone="gold"
        style={{left: 0, top: 500, width: 1760, height: 160, display: 'flex', alignItems: 'center', gap: 28, padding: '0 36px'}}
      >
        <IconBadge name="shirt" tone="gold" size={96} />
        <div style={{fontSize: 42, fontWeight: 700, color: COLORS.ink, whiteSpace: 'nowrap'}}>柔軟剤</div>
        <Pill tone="slate" size={30}>
          食品への混入とは別に
        </Pill>
        <div style={{fontSize: 36, fontWeight: 700, color: COLORS.ink, lineHeight: 1.4}}>香料やカプセル由来の粒子との接触を考える</div>
      </Box>
    </div>
  );
};

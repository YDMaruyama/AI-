import React from 'react';
import {interpolate} from 'remotion';
import {useFocus, useReveal} from '../../components/scene-context';
import {Arrow, CornerTag, NoteStrip, SvgPill, SvgText} from '../../components/ui';
import {COLORS} from '../../theme';
import {Panel, Shard} from './parts';

/**
 * 食品に触れる容器や器具から粒子が離れる（研究で示されていること）と、
 * 測定の難しさ（測定中の混入・プラスチック以外を数える問題）を左右に分けて示す。
 * 下の区別帯：報告された個数 ≠ 家庭での摂取量
 */
type Steps = {release: number; factors: number; measure: number; note: number};

const PANEL_W = 840;
const PANEL_H = 560;
const SURF_Y = 290;

export const UtensilRelease: React.FC<{steps?: Steps}> = ({steps = {release: 1, factors: 2, measure: 3, note: 4}}) => {
  const base = useReveal(0, {duration: 0.7});
  const release = useReveal(steps.release, {duration: 1.6});
  const factors = useReveal(steps.factors);
  const measure = useReveal(steps.measure, {duration: 1.2});
  const measureLabel = useReveal(steps.measure, {delay: 0.9});
  const note = useReveal(steps.note);
  const leftFocus = useFocus((s) => s < steps.measure || s >= steps.note);
  const rightFocus = useFocus((s) => s >= steps.measure);

  const drift = (i: number) => interpolate(release, [0.25 + i * 0.08, 0.8 + i * 0.05], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fall = interpolate(measure, [0.1, 0.9], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, display: 'flex', justifyContent: 'space-between'}}>
        {/* 左：容器や器具から粒子が離れる */}
        <Panel title="研究で示されていること" tag="粒子" tone="slate" width={PANEL_W} height={PANEL_H} appear={base} focus={leftFocus}>
          <svg width={780} height={460} viewBox="0 0 780 460" style={{display: 'block', marginTop: 4}}>
            {/* 表面（容器・器具の断面） */}
            <rect x={20} y={SURF_Y} width={740} height={70} rx={10} fill={COLORS.slateSoft} stroke={COLORS.slate} strokeWidth={4} />
            <SvgText x={390} y={SURF_Y + 104} size={30} weight={700} color={COLORS.inkSoft}>
              食品に触れる容器や器具の表面
            </SvgText>
            {/* 摩擦：道具の先がこする */}
            <g>
              <rect x={120} y={150} width={36} height={140} rx={10} fill={COLORS.inkSoft} transform={`rotate(-24 138 290)`} />
              <path d={`M160 ${SURF_Y - 22} H270`} stroke={COLORS.ink} strokeWidth={4} strokeLinecap="round" />
              <path d={`M174 ${SURF_Y - 34} L158 ${SURF_Y - 22} L174 ${SURF_Y - 10} M256 ${SURF_Y - 34} L272 ${SURF_Y - 22} L256 ${SURF_Y - 10}`} fill="none" stroke={COLORS.ink} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
            </g>
            {/* 摩耗：表面の傷 */}
            {[300, 340, 380, 420].map((x, i) => (
              <path key={x} d={`M${x} ${SURF_Y + 8 + (i % 2) * 6} l 34 22`} stroke={COLORS.slate} strokeWidth={4} strokeLinecap="round" />
            ))}
            {/* 繊維状の構造：表面から立つ細い線 */}
            {[540, 575, 610, 645, 680, 715].map((x, i) => (
              <path key={x} d={`M${x} ${SURF_Y} c ${-8 + (i % 2) * 16} -16 ${10 - (i % 3) * 8} -30 ${2 - (i % 2) * 6} -46`} fill="none" stroke={COLORS.slate} strokeWidth={4} strokeLinecap="round" />
            ))}
            {/* 離れる粒子（角ばった破片と短い繊維） */}
            <g>
              <Shard x={200} y={SURF_Y - 40 - 130 * drift(0)} r={12} rot={20} opacity={drift(0) > 0 ? 1 : 0} />
              <Shard x={370} y={SURF_Y - 20 - 140 * drift(1)} r={11} rot={-30} opacity={drift(1) > 0 ? 1 : 0} />
              <Shard x={430} y={SURF_Y - 20 - 100 * drift(2)} r={9} rot={60} opacity={drift(2) > 0 ? 1 : 0} />
              <path
                d={`M${610} ${SURF_Y - 60 - 110 * drift(3)} c 12 -10 24 6 36 -4`}
                fill="none"
                stroke={COLORS.slate}
                strokeWidth={5}
                strokeLinecap="round"
                opacity={drift(3) > 0 ? 1 : 0}
              />
            </g>
            {/* 要因のラベル */}
            <SvgPill x={200} y={60} text="摩擦" size={30} fill={COLORS.surface} color={COLORS.slate} stroke={COLORS.slate} opacity={factors} />
            <SvgPill x={380} y={60} text="摩耗" size={30} fill={COLORS.surface} color={COLORS.slate} stroke={COLORS.slate} opacity={factors} />
            <SvgPill x={630} y={60} text="繊維状の構造" size={30} fill={COLORS.surface} color={COLORS.slate} stroke={COLORS.slate} opacity={factors} />
          </svg>
        </Panel>

        {/* 右：測定の難しさ */}
        <Panel title="測定の難しさ" tag="注意" tone="gold" width={PANEL_W} height={PANEL_H} appear={measure} focus={rightFocus}>
          <svg width={780} height={460} viewBox="0 0 780 460" style={{display: 'block', marginTop: 4}}>
            {/* 試料の皿 */}
            <ellipse cx={330} cy={318} rx={250} ry={70} fill={COLORS.surface} stroke={COLORS.inkSoft} strokeWidth={5} />
            <ellipse cx={330} cy={306} rx={226} ry={56} fill={COLORS.bg} stroke={COLORS.line} strokeWidth={3} />
            <SvgText x={330} y={420} size={30} weight={700} color={COLORS.inkSoft}>
              測定する試料
            </SvgText>
            <Shard x={230} y={300} r={13} rot={20} />
            <Shard x={300} y={320} r={11} rot={-20} />
            <Shard x={420} y={296} r={12} rot={50} />
            {/* プラスチック以外の物質（丸く、点線の輪） */}
            <circle cx={360} cy={292} r={14} fill={COLORS.goldSoft} stroke={COLORS.gold} strokeWidth={4} />
            <circle cx={360} cy={292} r={26} fill="none" stroke={COLORS.gold} strokeWidth={3} strokeDasharray="6 6" opacity={measureLabel} />
            <path d="M384 276 L520 212" stroke={COLORS.gold} strokeWidth={3} strokeDasharray="6 6" opacity={measureLabel} />
            <SvgPill x={760} y={196} anchor="end" text="プラスチック以外も数える" size={28} fill={COLORS.goldSoft} color={COLORS.ink} opacity={measureLabel} />
            {/* 測定中の混入：外から入る */}
            <Arrow from={[110, 70]} to={[180, 262]} p={measure} dashed color={COLORS.gold} width={4} />
            <Shard x={110 + 66 * fall} y={70 + 180 * fall} r={11} rot={30} fill={COLORS.gold} opacity={measure > 0.05 ? 1 : 0} />
            <SvgPill x={150} y={40} anchor="start" text="測定中の混入" size={28} fill={COLORS.goldSoft} color={COLORS.ink} opacity={measureLabel} />
          </svg>
        </Panel>
      </div>
      <div style={{position: 'absolute', left: PANEL_W - 170, top: 34}}>
        <CornerTag appear={base}>模式図</CornerTag>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0}}>
        <NoteStrip appear={note} label="区別">
          報告された個数を、そのまま家庭での摂取量とは考えられない
        </NoteStrip>
      </div>
    </div>
  );
};

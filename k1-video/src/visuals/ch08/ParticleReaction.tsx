import React from 'react';
import {interpolate} from 'remotion';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {CornerTag, EvidenceBadge, NoteStrip, SvgPill, SvgText} from '../../components/ui';
import {COLORS} from '../../theme';
import {DashTag, Fragment, IconDisc} from './parts';

/**
 * M2・M3：三つの話を別々の枠で並べる（矢印で一本道にしない）。
 *  左：体に入った粒子に免疫細胞が異物として反応する「ことがある」（模式図）
 *  中：細胞実験・動物実験で、マイクロプラスチックによる炎症・酸化ストレスが報告（根拠の種類のバッジ）
 *      体の中の図と同じ枠に入れず、免疫細胞から矢印を引かない（体内の仕組みとして描かない）
 *  右：吸い込んだ粒子は気道・肺への影響が「懸念」（根拠の種類は示されていないため、懸念のラベルのみ）
 * 最後に「実験での反応 ≠ 日常の使用で同じ障害」の留保を同じ画面に出す。
 * 臓器が壊れる表現は使わない。反応は静的な点線の輪で示す（点滅しない）。
 */
type Steps = {react: number; report: number; inhale: number; caveat: number};

const PANEL_TOP = 50;
const PANEL_H = 520;
const A_W = 600;
const B_X = 630;
const B_W = 480;
const C_X = 1140;
const C_W = 1760 - C_X;
const CELL = {x: 400, y: 290, r: 92};

export const ParticleReaction: React.FC<{steps?: Steps; caveat?: string}> = ({
  steps = {react: 1, report: 2, inhale: 3, caveat: 4},
  caveat = '実験での反応から、普段の衣類や食品容器の使用で同じ障害が起こるとまでは言えない',
}) => {
  const base = useReveal(0, {duration: 0.7});
  const react = useReveal(steps.react, {duration: 1.2});
  const report = useReveal(steps.report);
  const reportCards = useReveal(steps.report, {delay: 0.4});
  const inhale = useReveal(steps.inhale);
  const cav = useReveal(steps.caveat);
  const fA = useFocus((s) => s <= steps.react || s >= steps.caveat);
  const fB = useFocus((s) => s === steps.report || s >= steps.caveat);
  const fC = useFocus((s) => s === steps.inhale);

  const drift = interpolate(react, [0, 1], [0, 46]);

  const panel = (appear: number, focus: number, left: number, width: number, accent: string): React.CSSProperties => ({
    ...fadeUp(appear),
    opacity: appear * (0.5 + 0.5 * focus),
    position: 'absolute',
    left,
    top: PANEL_TOP,
    width,
    height: PANEL_H,
    boxSizing: 'border-box',
    borderRadius: 28,
    border: `3px solid ${focus > 0.5 ? accent : COLORS.lineSoft}`,
  });

  return (
    <div style={{position: 'absolute', inset: 0}}>
      {/* 左：体の中（模式図） */}
      <div style={{...panel(base, fA, 0, A_W, COLORS.green), background: COLORS.panel}}>
        <svg width={A_W - 6} height={PANEL_H - 6} viewBox={`0 0 ${A_W - 6} ${PANEL_H - 6}`} style={{display: 'block'}}>
          <SvgText x={28} y={40} anchor="start" size={30} weight={700} color={COLORS.inkSoft}>
            体の中
          </SvgText>
          {/* 粒子 */}
          <g transform={`translate(${drift} 0)`}>
            <Fragment x={110} y={260} r={30} rot={10} />
            <Fragment x={185} y={330} r={22} rot={-25} />
            <Fragment x={100} y={370} r={17} rot={40} />
          </g>
          <SvgText x={150} y={448} size={30} weight={700} color={COLORS.slate}>
            粒子
          </SvgText>
          {/* 免疫細胞 */}
          <circle cx={CELL.x} cy={CELL.y} r={CELL.r} fill={COLORS.greenSoft} stroke={COLORS.green} strokeWidth={5} />
          <ellipse cx={CELL.x + 16} cy={CELL.y - 8} rx={34} ry={26} fill={COLORS.surface} stroke={COLORS.green} strokeWidth={3} />
          <SvgText x={CELL.x} y={448} size={32} weight={700} color={COLORS.green}>
            免疫細胞
          </SvgText>
          {/* 異物として反応（静的な点線の輪） */}
          <circle cx={CELL.x} cy={CELL.y} r={CELL.r + 22} fill="none" stroke={COLORS.gold} strokeWidth={4} strokeDasharray="12 9" opacity={react} />
          <SvgPill x={(A_W - 6) / 2} y={112} text="異物として反応することがある" size={30} fill={COLORS.surface} color={COLORS.ink} stroke={COLORS.gold} opacity={react} />
        </svg>
        <div style={{position: 'absolute', right: 14, top: 12}}>
          <CornerTag style={{padding: '2px 12px'}}>模式図</CornerTag>
        </div>
      </div>

      {/* 中：実験での報告（細胞実験・動物実験） */}
      <div
        style={{
          ...panel(report, fB, B_X, B_W, COLORS.slate),
          background: COLORS.surface,
          padding: '24px 30px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{fontSize: 34, fontWeight: 700, color: COLORS.ink}}>実験での報告</div>
        <div style={{display: 'flex', gap: 12}}>
          <EvidenceBadge kind="cell" size={28} />
          <EvidenceBadge kind="animal" size={28} />
        </div>
        <div style={{...fadeUp(reportCards), display: 'flex', flexDirection: 'column', gap: 14, marginTop: 6}}>
          <div style={{fontSize: 30, fontWeight: 700, color: COLORS.inkSoft}}>マイクロプラスチックによる</div>
          <div style={{background: COLORS.slateSoft, borderRadius: 16, padding: '10px 22px', fontSize: 38, fontWeight: 700, color: COLORS.ink}}>炎症</div>
          <div style={{background: COLORS.slateSoft, borderRadius: 16, padding: '10px 22px'}}>
            <div style={{fontSize: 38, fontWeight: 700, color: COLORS.ink}}>酸化ストレス</div>
            <div style={{fontSize: 28, fontWeight: 500, color: COLORS.inkSoft, marginTop: 2}}>細胞を傷つけ得る</div>
          </div>
        </div>
      </div>

      {/* 右：吸い込んだ粒子 */}
      <div
        style={{
          ...panel(inhale, fC, C_X, C_W, COLORS.green),
          background: COLORS.surface,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 22,
          textAlign: 'center',
          padding: '0 30px',
        }}
      >
        <IconDisc name="lungs" size={130} />
        <div style={{fontSize: 42, fontWeight: 700, color: COLORS.ink}}>吸い込んだ粒子</div>
        <div style={{fontSize: 36, fontWeight: 500, color: COLORS.ink, lineHeight: 1.45}}>気道や肺への影響</div>
        <DashTag color={COLORS.gold}>懸念されている</DashTag>
      </div>

      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0}}>
        <NoteStrip appear={cav} label="ただし">
          {caveat}
        </NoteStrip>
      </div>
    </div>
  );
};

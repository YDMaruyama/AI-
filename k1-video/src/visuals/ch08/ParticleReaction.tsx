import React from 'react';
import {interpolate} from 'remotion';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {Arrow, CornerTag, EvidenceBadge, NoteStrip, SvgPill, SvgText} from '../../components/ui';
import {COLORS} from '../../theme';
import {DashTag, Fragment, IconDisc} from './parts';

/**
 * M2・M3：体に入った粒子に免疫細胞が異物として反応する → 実験（細胞・動物）で炎症・酸化ストレスが報告。
 * 吸い込んだ粒子は気道・肺への影響が「懸念」（根拠の種類は示されていないため、懸念のラベルのみ）。
 * 最後に「実験での反応 ≠ 日常の使用で同じ障害」の留保を同じ画面に出す。
 * 臓器が壊れる表現は使わない。反応は静的な点線の輪で示す（点滅しない）。
 */
type Steps = {react: number; report: number; inhale: number; caveat: number};

const CELL = {x: 460, y: 330, r: 100};

export const ParticleReaction: React.FC<{steps?: Steps; caveat?: string}> = ({
  steps = {react: 1, report: 2, inhale: 3, caveat: 4},
  caveat = '実験での反応から、普段の衣類や食品容器の使用で同じ障害が起こるとまでは言えない',
}) => {
  const base = useReveal(0, {duration: 0.7});
  const react = useReveal(steps.react, {duration: 1.2});
  const report = useReveal(steps.report);
  const reportCards = useReveal(steps.report, {delay: 0.5});
  const inhale = useReveal(steps.inhale);
  const cav = useReveal(steps.caveat);
  const leftFocus = useFocus((s) => s < steps.inhale || s >= steps.caveat);
  const rightFocus = useFocus((s) => s >= steps.inhale);

  const drift = interpolate(react, [0, 1], [0, 46]);

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{opacity: 0.5 + 0.5 * leftFocus}}>
        <svg width={1100} height={560} viewBox="0 0 1100 560" style={{position: 'absolute', left: 0, top: 0}}>
          <g opacity={base}>
            <rect x={0} y={60} width={1080} height={490} rx={36} fill={COLORS.panel} stroke={COLORS.lineSoft} strokeWidth={3} />
            <SvgText x={30} y={102} anchor="start" size={30} weight={700} color={COLORS.inkSoft}>
              体の中
            </SvgText>
            {/* 粒子 */}
            <g transform={`translate(${drift} 0)`}>
              <Fragment x={150} y={290} r={30} rot={10} />
              <Fragment x={225} y={360} r={22} rot={-25} />
              <Fragment x={140} y={400} r={17} rot={40} />
            </g>
            <SvgText x={180} y={488} size={30} weight={700} color={COLORS.slate}>
              粒子
            </SvgText>
            {/* 免疫細胞 */}
            <circle cx={CELL.x} cy={CELL.y} r={CELL.r} fill={COLORS.greenSoft} stroke={COLORS.green} strokeWidth={5} />
            <ellipse cx={CELL.x + 18} cy={CELL.y - 8} rx={36} ry={28} fill={COLORS.surface} stroke={COLORS.green} strokeWidth={3} />
            <SvgText x={CELL.x} y={CELL.y + CELL.r + 58} size={32} weight={700} color={COLORS.green}>
              免疫細胞
            </SvgText>
          </g>
          {/* 異物として反応（静的な点線の輪） */}
          <circle
            cx={CELL.x}
            cy={CELL.y}
            r={CELL.r + 22}
            fill="none"
            stroke={COLORS.gold}
            strokeWidth={4}
            strokeDasharray="12 9"
            opacity={react}
          />
          <SvgPill x={CELL.x} y={168} text="異物として反応" size={30} fill={COLORS.surface} color={COLORS.ink} stroke={COLORS.gold} opacity={react} />
          {/* 実験での報告へ（点線：実験で報告されたもの） */}
          <Arrow from={[CELL.x + CELL.r + 26, CELL.y - 34]} to={[690, 262]} p={report} dashed color={COLORS.inkSoft} width={4} />
          <Arrow from={[CELL.x + CELL.r + 26, CELL.y + 34]} to={[690, 418]} p={report} dashed color={COLORS.inkSoft} width={4} />
        </svg>

        {/* 実験での報告 */}
        <div style={{...fadeUp(report), position: 'absolute', left: 660, top: 82, width: 400}}>
          <div style={{fontSize: 30, fontWeight: 700, color: COLORS.inkSoft}}>実験での報告</div>
          <div style={{display: 'flex', gap: 12, marginTop: 10}}>
            <EvidenceBadge kind="cell" size={28} />
            <EvidenceBadge kind="animal" size={28} />
          </div>
        </div>
        <div
          style={{
            ...fadeUp(reportCards),
            position: 'absolute',
            left: 700,
            top: 214,
            width: 350,
            boxSizing: 'border-box',
            background: COLORS.surface,
            border: `3px solid ${COLORS.slate}`,
            borderRadius: 16,
            padding: '12px 22px',
            fontSize: 38,
            fontWeight: 700,
            color: COLORS.ink,
          }}
        >
          炎症
        </div>
        <div
          style={{
            ...fadeUp(reportCards),
            position: 'absolute',
            left: 700,
            top: 352,
            width: 350,
            boxSizing: 'border-box',
            background: COLORS.surface,
            border: `3px solid ${COLORS.slate}`,
            borderRadius: 16,
            padding: '12px 22px',
          }}
        >
          <div style={{fontSize: 38, fontWeight: 700, color: COLORS.ink}}>酸化ストレス</div>
          <div style={{fontSize: 28, fontWeight: 500, color: COLORS.inkSoft, marginTop: 2}}>細胞を傷つけ得る</div>
        </div>
      </div>

      {/* 吸い込んだ粒子 */}
      <div
        style={{
          ...fadeUp(inhale),
          opacity: inhale * (0.5 + 0.5 * rightFocus),
          position: 'absolute',
          left: 1120,
          top: 60,
          width: 640,
          height: 490,
          boxSizing: 'border-box',
          background: COLORS.surface,
          border: `3px solid ${rightFocus > 0.5 ? COLORS.green : COLORS.lineSoft}`,
          borderRadius: 26,
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

      <div style={{position: 'absolute', left: 0, top: 0}}>
        <CornerTag appear={base}>模式図</CornerTag>
      </div>

      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0}}>
        <NoteStrip appear={cav} label="ただし">
          {caveat}
        </NoteStrip>
      </div>
    </div>
  );
};

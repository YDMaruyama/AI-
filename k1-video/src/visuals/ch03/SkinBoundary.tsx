import React from 'react';
import {interpolate} from 'remotion';
import {Icon, IconName} from '../../components/Icons';
import {fadeUp, useReveal} from '../../components/scene-context';
import {Arrow, CornerTag, NoteStrip, SvgPill, SvgText} from '../../components/ui';
import {COLORS} from '../../theme';

/**
 * 皮膚：表面への接触と、条件付きの体内移行を区別する模式図（断面）。
 * - 物質（金の丸）はまず表面に「付く」（接触）
 * - 条件によっては、その一部が皮膚の中や血液へ「移行」する（点線＝一部・条件付き）
 * 実際の皮膚構造の縮尺・層構成を正確に示すものではない（模式図）。
 */
type Steps = {contact: number; transfer: number; conditions: number; distinct: number};

const SURF = 170;
const INNER_BOTTOM = 420;
const VESSEL_Y = 482;
const X0 = 230;
const X1 = 1060;

const DOTS = [300, 400, 490, 590, 690, 790, 890, 980];
/** 移行する一部の粒（index と到達点） */
const MOVERS: {i: number; to: [number, number]}[] = [
  {i: 2, to: [520, 330]},
  {i: 5, to: [800, VESSEL_Y]},
];

const CONDITIONS: {icon: IconName; text: string}[] = [
  {icon: 'flask', text: '物質の性質'},
  {icon: 'skin', text: '皮膚の状態'},
  {icon: 'hand', text: '触れる部位'},
  {icon: 'scale', text: '製品の量'},
  {icon: 'clock', text: '接触時間'},
];

export const SkinBoundary: React.FC<{steps?: Steps; distinctText?: string}> = ({
  steps = {contact: 1, transfer: 2, conditions: 3, distinct: 4},
  distinctText = '表面に付いたことと、体内に吸収されたことは同じではありません',
}) => {
  const base = useReveal(0, {duration: 0.8});
  const contact = useReveal(steps.contact, {duration: 1.2});
  const transfer = useReveal(steps.transfer, {duration: 1.6, delay: 0.2});
  const transferLabel = useReveal(steps.transfer, {delay: 1.2});
  const cond = useReveal(steps.conditions);
  const distinct = useReveal(steps.distinct);

  const surfaceWave = `M${X0} ${SURF} ${Array.from({length: 9}, (_, k) => {
    const x = X0 + ((k + 1) * (X1 - X0)) / 9;
    return `Q${x - (X1 - X0) / 18} ${SURF + (k % 2 === 0 ? -10 : 10)} ${x} ${SURF}`;
  }).join(' ')}`;

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <svg width={1100} height={600} viewBox="0 0 1100 600" style={{position: 'absolute', left: 0, top: 0}}>
        <g opacity={base}>
          {/* 層 */}
          <rect x={X0} y={SURF} width={X1 - X0} height={INNER_BOTTOM - SURF} fill="#EED9C4" />
          <rect x={X0} y={SURF} width={X1 - X0} height={34} fill="#E2C2A4" />
          <path d={surfaceWave} fill="none" stroke="#B88C66" strokeWidth={5} />
          {/* 血液（血管の断面を横長に簡略化） */}
          <rect x={X0} y={VESSEL_Y - 34} width={X1 - X0} height={68} rx={34} fill="#E8C9C4" stroke="#B9817A" strokeWidth={4} />
          {/* ラベル */}
          <SvgText x={200} y={SURF + 16} anchor="end" size={30} weight={700}>皮膚の表面</SvgText>
          <SvgText x={200} y={300} anchor="end" size={30} weight={700}>皮膚の中</SvgText>
          <SvgText x={200} y={VESSEL_Y} anchor="end" size={30} weight={700}>血液</SvgText>
          <SvgText x={200} y={80} anchor="end" size={30} weight={700} color={COLORS.gold}>物質</SvgText>
        </g>

        {/* 接触：物質が表面に付く */}
        {DOTS.map((x, i) => {
          const mover = MOVERS.find((m) => m.i === i);
          const k = interpolate(contact, [Math.min(0.6, i * 0.05), Math.min(1, i * 0.05 + 0.45)], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          let cx = x;
          let cy = 60 + (SURF - 14 - 60) * k;
          if (mover) {
            cx = x + (mover.to[0] - x) * transfer;
            cy = cy + (mover.to[1] - (SURF - 14)) * transfer;
          }
          return <circle key={i} cx={cx} cy={cy} r={13} fill={COLORS.gold} stroke={COLORS.surface} strokeWidth={3} opacity={contact > 0 ? Math.min(1, contact * 3) : 0} />;
        })}

        {/* 移行の経路（点線＝一部・条件付き） */}
        {MOVERS.map((m) => (
          <Arrow
            key={m.i}
            from={[DOTS[m.i], SURF + 6]}
            to={[m.to[0], m.to[1] - 22]}
            bend={-30}
            p={transfer}
            dashed
            color={COLORS.slate}
            width={4}
            opacity={0.9}
          />
        ))}

        {/* ラベル：接触 / 移行 */}
        <SvgPill x={X1} y={70} anchor="end" text="接触：表面に付く" size={30} opacity={contact} />
        <SvgPill
          x={X1}
          y={VESSEL_Y + 78}
          anchor="end"
          text="移行：条件によっては一部"
          size={28}
          fill={COLORS.surface}
          color={COLORS.slate}
          stroke={COLORS.slate}
          dashed
          opacity={transferLabel}
        />
      </svg>

      {/* 条件の一覧 */}
      <div
        style={{
          ...fadeUp(cond),
          position: 'absolute',
          left: 1150,
          top: 10,
          width: 610,
          background: COLORS.surface,
          border: `3px solid ${COLORS.lineSoft}`,
          borderRadius: 20,
          padding: '26px 34px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{fontSize: 34, fontWeight: 700, color: COLORS.ink, marginBottom: 14}}>考えたい条件の例</div>
        {CONDITIONS.map((c) => (
          <div key={c.text} style={{display: 'flex', alignItems: 'center', gap: 18, padding: '9px 0'}}>
            <div style={{color: COLORS.green}}>
              <Icon name={c.icon} size={44} />
            </div>
            <div style={{fontSize: 34, fontWeight: 500, color: COLORS.ink}}>{c.text}</div>
          </div>
        ))}
      </div>

      <div style={{position: 'absolute', left: 230, top: 0}}>
        <CornerTag appear={base}>模式図</CornerTag>
      </div>

      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0}}>
        <NoteStrip appear={distinct} label="区別">
          {distinctText}
        </NoteStrip>
      </div>
    </div>
  );
};

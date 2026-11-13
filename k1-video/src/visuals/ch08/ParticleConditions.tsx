import React from 'react';
import {Icon} from '../../components/Icons';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {CornerTag, EvidenceBadge} from '../../components/ui';
import {COLORS} from '../../theme';
import {Fragment} from './parts';

/**
 * M3：影響は粒子の大きさ・形・材質・量などで変わる（記号での模式。縮尺・数は一定ではない）。
 * 日常で取り込む量が人の身体にどの程度影響するかは、まだ十分に分かっていない（未解明のバッジ）。
 */
type Steps = {factors: number; unknown: number};

const TILE_W = 410;
const TILE_GAP = 40;

const Glyph: React.FC<{kind: 'size' | 'shape' | 'material' | 'amount'}> = ({kind}) => (
  <svg width={360} height={150} viewBox="0 0 360 150" style={{display: 'block'}}>
    <defs>
      <pattern id="ch08-hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="10" height="10" fill={COLORS.slateSoft} />
        <line x1="0" y1="0" x2="0" y2="10" stroke={COLORS.slate} strokeWidth="4" />
      </pattern>
    </defs>
    {kind === 'size' ? (
      <>
        <Fragment x={100} y={80} r={20} />
        <Fragment x={240} y={76} r={56} rot={12} />
      </>
    ) : null}
    {kind === 'shape' ? (
      <>
        <circle cx={70} cy={78} r={30} fill={COLORS.slate} stroke={COLORS.surface} strokeWidth={2.5} />
        <rect x={130} y={68} width={110} height={18} rx={9} fill={COLORS.slate} transform="rotate(-18 185 77)" />
        <Fragment x={292} y={78} r={36} rot={-15} />
      </>
    ) : null}
    {kind === 'material' ? (
      <>
        <Fragment x={70} y={78} r={36} />
        <Fragment x={180} y={78} r={36} rot={30} patternId="ch08-hatch" stroke={COLORS.slate} />
        <Fragment x={290} y={78} r={36} rot={-20} fill={COLORS.surface} stroke={COLORS.slate} dashed />
      </>
    ) : null}
    {kind === 'amount' ? (
      <>
        {[
          [70, 60],
          [100, 98],
          [52, 104],
        ].map(([x, y], i) => (
          <circle key={`a${i}`} cx={x} cy={y} r={11} fill={COLORS.slate} />
        ))}
        <line x1={160} y1={30} x2={160} y2={130} stroke={COLORS.lineSoft} strokeWidth={3} />
        {Array.from({length: 12}, (_, i) => {
          const col = i % 4;
          const row = Math.floor(i / 4);
          return <circle key={`b${i}`} cx={208 + col * 36 + (row % 2) * 14} cy={42 + row * 34} r={11} fill={COLORS.slate} />;
        })}
      </>
    ) : null}
  </svg>
);

const FACTORS: {kind: 'size' | 'shape' | 'material' | 'amount'; label: string}[] = [
  {kind: 'size', label: '大きさ'},
  {kind: 'shape', label: '形'},
  {kind: 'material', label: '材質'},
  {kind: 'amount', label: '量'},
];

const FactorTile: React.FC<{i: number; kind: 'size' | 'shape' | 'material' | 'amount'; label: string; step: number; dimAt: number}> = ({i, kind, label, step, dimAt}) => {
  const p = useReveal(step, {delay: i * 0.25});
  const focus = useFocus((s) => s < dimAt);
  return (
    <div
      style={{
        ...fadeUp(p),
        opacity: p * (0.55 + 0.45 * focus),
        position: 'absolute',
        left: i * (TILE_W + TILE_GAP),
        top: 62,
        width: TILE_W,
        height: 260,
        boxSizing: 'border-box',
        background: COLORS.surface,
        border: `3px solid ${focus > 0.5 ? COLORS.slate : COLORS.lineSoft}`,
        borderRadius: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      <Glyph kind={kind} />
      <div style={{fontSize: 42, fontWeight: 700, color: COLORS.ink}}>{label}</div>
    </div>
  );
};

export const ParticleConditions: React.FC<{steps?: Steps}> = ({steps = {factors: 1, unknown: 2}}) => {
  const head = useReveal(0);
  const etc = useReveal(steps.factors, {delay: 1.0});
  const unk = useReveal(steps.unknown);

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{...fadeUp(head), position: 'absolute', left: 0, top: 0, fontSize: 34, fontWeight: 700, color: COLORS.inkSoft}}>
        粒子の条件によって、影響は変わる
      </div>
      <div style={{position: 'absolute', right: 0, top: 0}}>
        <CornerTag appear={head}>模式図・縮尺や数は一定ではない</CornerTag>
      </div>
      {FACTORS.map((f, i) => (
        <FactorTile key={f.kind} i={i} kind={f.kind} label={f.label} step={steps.factors} dimAt={steps.unknown} />
      ))}
      <div style={{...fadeUp(etc), position: 'absolute', right: 0, top: 330, fontSize: 30, fontWeight: 700, color: COLORS.inkSoft}}>など</div>

      {/* まだ十分に分かっていないこと */}
      <div
        style={{
          ...fadeUp(unk),
          position: 'absolute',
          left: 0,
          right: 0,
          top: 400,
          height: 276,
          boxSizing: 'border-box',
          background: COLORS.surface,
          border: `3px dashed ${COLORS.inkSoft}`,
          borderRadius: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 44,
          padding: '0 56px',
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 6, color: COLORS.inkSoft, flexShrink: 0}}>
          <Icon name="person" size={110} />
          <Icon name="question" size={84} />
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 18}}>
          <div style={{fontSize: 42, fontWeight: 700, color: COLORS.ink, lineHeight: 1.4}}>
            日常生活で取り込む量が、
            <br />
            人の身体にどの程度の影響を与えるか
          </div>
          <div>
            <EvidenceBadge kind="unknown" label="まだ十分に分かっていない" size={32} />
          </div>
        </div>
      </div>
    </div>
  );
};

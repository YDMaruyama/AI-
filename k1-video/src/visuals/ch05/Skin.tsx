import React from 'react';
import {interpolate} from 'remotion';
import {Icon, IconName, SvgIcon} from '../../components/Icons';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {Arrow, CornerTag, NoteStrip, SvgPill, SvgText} from '../../components/ui';
import {COLORS} from '../../theme';
import {Molecule, NotSame, Panel, Shard} from './parts';

/* ------------------------------------------------------------------ */
/* 皮膚の断面（簡略）                                                   */
/* ------------------------------------------------------------------ */

const SkinLayer: React.FC<{x0: number; x1: number; surf: number; bottom: number}> = ({x0, x1, surf, bottom}) => {
  const n = 9;
  const wave = `M${x0} ${surf} ${Array.from({length: n}, (_, k) => {
    const x = x0 + ((k + 1) * (x1 - x0)) / n;
    return `Q${x - (x1 - x0) / (2 * n)} ${surf + (k % 2 === 0 ? -9 : 9)} ${x} ${surf}`;
  }).join(' ')}`;
  return (
    <g>
      <rect x={x0} y={surf} width={x1 - x0} height={bottom - surf} fill="#EED9C4" />
      <rect x={x0} y={surf} width={x1 - x0} height={30} fill="#E2C2A4" />
      <path d={wave} fill="none" stroke="#B88C66" strokeWidth={5} />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* 皮膚に触れる製品と化学物質                                           */
/* ------------------------------------------------------------------ */

type SkinSteps = {uptake: number; factors: number; note: number};

const SX0 = 230;
const SX1 = 1040;
const SURF = 300;
const BOTTOM = 470;
const PRODUCTS: {x: number; icon: IconName; label: string}[] = [
  {x: 380, icon: 'bottle', label: '化粧品'},
  {x: 640, icon: 'fragrance', label: '香料'},
  {x: 900, icon: 'container', label: '樹脂製品'},
];
const FACTORS: {icon: IconName; text: string}[] = [
  {icon: 'flask', text: '成分'},
  {icon: 'drop', text: '濃度'},
  {icon: 'clock', text: '接触時間'},
  {icon: 'hand', text: '製品の使い方'},
];

export const SkinProducts: React.FC<{steps?: SkinSteps}> = ({steps = {uptake: 1, factors: 2, note: 3}}) => {
  const base = useReveal(0, {duration: 0.7});
  const land = useReveal(steps.uptake, {duration: 1.2});
  const move = useReveal(steps.uptake, {delay: 1.0, duration: 1.4});
  const moveLabel = useReveal(steps.uptake, {delay: 2.0});
  const factors = useReveal(steps.factors);
  const note = useReveal(steps.note);
  const fFactors = useFocus((s) => s >= steps.factors);

  // 製品から皮膚の表面に付く化学物質（小さな丸）
  const dots = [330, 420, 600, 690, 850, 950];
  const movers: Record<number, [number, number]> = {1: [450, 400], 4: [830, 440]};

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <svg width={1060} height={580} viewBox="0 0 1060 580" style={{position: 'absolute', left: 0, top: 0}}>
        <g opacity={base}>
          {PRODUCTS.map((p) => (
            <g key={p.label}>
              <circle cx={p.x} cy={86} r={62} fill={COLORS.greenSoft} stroke={COLORS.green} strokeWidth={4} />
              <SvgIcon name={p.icon} x={p.x - 38} y={48} size={76} color={COLORS.green} />
              <SvgText x={p.x} y={182} size={32} weight={700}>
                {p.label}
              </SvgText>
            </g>
          ))}
          <SkinLayer x0={SX0} x1={SX1} surf={SURF} bottom={BOTTOM} />
          <SvgText x={SX0 - 20} y={SURF + 14} size={30} weight={700} anchor="end">
            皮膚の表面
          </SvgText>
          <SvgText x={SX0 - 20} y={410} size={30} weight={700} anchor="end">
            皮膚の中
          </SvgText>
          <SvgText x={SX0 - 20} y={88} size={30} weight={700} anchor="end" color={COLORS.gold}>
            化学物質
          </SvgText>
          <Molecule x={SX0 - 70} y={130} r={12} />
        </g>
        {dots.map((x, i) => {
          const k = interpolate(land, [i * 0.07, i * 0.07 + 0.5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          let cx = x;
          let cy = 220 + (SURF - 16 - 220) * k;
          const m = movers[i];
          if (m) {
            cx = x + (m[0] - x) * move;
            cy = cy + (m[1] - (SURF - 16)) * move;
          }
          return <Molecule key={x} x={cx} y={cy} r={12} opacity={k > 0 ? Math.min(1, k * 3) : 0} />;
        })}
        {Object.entries(movers).map(([i, to]) => (
          <Arrow key={i} from={[dots[Number(i)], SURF + 6]} to={[to[0], to[1] - 22]} bend={-24} p={move} dashed color={COLORS.slate} width={4} />
        ))}
        <SvgPill x={SX1} y={526} anchor="end" text="使い方によって、一部が取り込まれる" size={28} fill={COLORS.surface} color={COLORS.slate} stroke={COLORS.slate} dashed opacity={moveLabel} />
      </svg>

      {/* 何がどの程度取り込まれるか */}
      <div
        style={{
          ...fadeUp(factors),
          opacity: factors * (0.55 + 0.45 * fFactors),
          position: 'absolute',
          left: 1110,
          top: 0,
          width: 650,
          background: COLORS.surface,
          border: `3px solid ${fFactors > 0.5 ? COLORS.green : COLORS.lineSoft}`,
          borderRadius: 20,
          padding: '24px 34px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{fontSize: 34, fontWeight: 700, color: COLORS.ink, marginBottom: 6, lineHeight: 1.4}}>
          何がどの程度取り込まれるかは
          <br />
          次によって変わる
        </div>
        {FACTORS.map((f) => (
          <div key={f.text} style={{display: 'flex', alignItems: 'center', gap: 18, padding: '8px 0'}}>
            <div style={{color: COLORS.green, display: 'flex'}}>
              <Icon name={f.icon} size={48} />
            </div>
            <div style={{fontSize: 36, fontWeight: 600, color: COLORS.ink}}>{f.text}</div>
          </div>
        ))}
      </div>

      <div style={{position: 'absolute', left: 60, top: 470}}>
        <CornerTag appear={base}>模式図</CornerTag>
      </div>

      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0}}>
        <NoteStrip appear={note} label="補足">
          「肌に触れた」だけでは、全身への影響の大きさは判断できない
        </NoteStrip>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 粒子の話と化学物質の話を分ける                                       */
/* ------------------------------------------------------------------ */

const PW = 790;
const PH = 600;

/** 「通過するか・吸収されるか」という問いの向きを示す白抜きの矢印（結果は示さない） */
const TopicArrow: React.FC<{x: number; p: number}> = ({x, p}) => (
  <g opacity={p}>
    <path
      d={`M${x - 14} 70 h28 v100 h18 l-32 40 l-32 -40 h18 z`}
      fill={COLORS.surface}
      stroke={COLORS.inkSoft}
      strokeWidth={4}
      strokeDasharray="9 7"
      strokeLinejoin="round"
    />
  </g>
);

export const ParticleOrChemical: React.FC<{steps?: {particle: number; chemical: number}}> = ({steps = {particle: 1, chemical: 2}}) => {
  const base = useReveal(0, {duration: 0.6});
  const left = useReveal(steps.particle, {duration: 0.7});
  const right = useReveal(steps.chemical, {duration: 0.7});
  const leftMove = useReveal(steps.particle, {delay: 0.5, duration: 0.8});
  const rightMove = useReveal(steps.chemical, {delay: 0.5, duration: 0.8});
  const rel = useReveal(steps.chemical, {delay: 1.0});

  return (
    <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between'}}>
      <Panel title="粒子そのもの" tag="粒子" tone="slate" width={PW} height={PH} appear={left}>
        <svg width={734} height={290} viewBox="0 0 734 290" style={{display: 'block', marginTop: 20}}>
          <SkinLayer x0={20} x1={714} surf={130} bottom={280} />
          <Shard x={210} y={106} r={20} rot={15} />
          <Shard x={370} y={110} r={16} rot={-30} />
          <Shard x={520} y={104} r={22} rot={50} />
          <TopicArrow x={630} p={leftMove} />
          <SvgText x={367} y={44} size={30} weight={700} color={COLORS.slate}>
            角ばった形＝粒子
          </SvgText>
        </svg>
        <div style={{marginTop: 34, fontSize: 40, fontWeight: 700, color: COLORS.ink, lineHeight: 1.45}}>
          粒子そのものが
          <br />
          <span style={{color: COLORS.slate}}>皮膚を通過する</span>話
        </div>
      </Panel>

      <div style={{width: 180, alignSelf: 'center', display: 'flex', justifyContent: 'center'}}>
        <NotSame appear={rel} label={'分けて\n考える'} size={88} />
      </div>

      <Panel title="製品から出た化学物質" tag="化学物質" tone="gold" width={PW} height={PH} appear={right}>
        <svg width={734} height={290} viewBox="0 0 734 290" style={{display: 'block', marginTop: 20}}>
          <SkinLayer x0={20} x1={714} surf={130} bottom={280} />
          {[200, 290, 380, 470, 560].map((x) => (
            <Molecule key={x} x={x} y={112} r={13} />
          ))}
          <TopicArrow x={630} p={rightMove} />
          <SvgText x={367} y={44} size={30} weight={700} color={COLORS.gold}>
            小さな丸＝化学物質
          </SvgText>
        </svg>
        <div style={{marginTop: 34, fontSize: 40, fontWeight: 700, color: COLORS.ink, lineHeight: 1.45}}>
          製品から出た化学物質が
          <br />
          <span style={{color: COLORS.gold}}>吸収される</span>話
        </div>
      </Panel>

      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center'}}>
        <CornerTag appear={base}>模式図</CornerTag>
      </div>
    </div>
  );
};

import React from 'react';
import {Icon} from '../../components/Icons';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {CornerTag} from '../../components/ui';
import {COLORS} from '../../theme';
import {Fragment, Panel, PanelTitle, Tag, fragmentPoints} from './parts';

/**
 * 粒子の性質（I2 前半）：大きさだけでなく、形・材質・表面の性質・風化の程度が
 * 体内での動きや作用に関わる。4 枚のカードに、それぞれの違いを形で描く（模式図）。
 */
type Steps = {size: number; shape: number; material: number; surface: number; weathering: number; effect: number};

const CW = 410;
const GAP = (1760 - CW * 4) / 3;
const CH = 400;
const TOP = 96;

const ShapeArt: React.FC = () => (
  <svg width={360} height={230} viewBox="0 0 360 230">
    <Fragment x={90} y={115} r={62} seed={0.5} />
    <path d="M175 70 q22 -26 44 0 t44 0 t44 0" fill="none" stroke={COLORS.slate} strokeWidth={13} strokeLinecap="round" />
    <rect x={190} y={150} width={140} height={22} rx={4} fill={COLORS.slate} transform="rotate(-14 260 161)" />
  </svg>
);

const MaterialArt: React.FC = () => (
  <svg width={360} height={230} viewBox="0 0 360 230">
    <defs>
      <pattern id="ch04-hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="14" height="14" fill={COLORS.slateSoft} />
        <line x1="0" y1="0" x2="0" y2="14" stroke={COLORS.slate} strokeWidth="6" />
      </pattern>
      <pattern id="ch04-dots" width="16" height="16" patternUnits="userSpaceOnUse">
        <rect width="16" height="16" fill={COLORS.goldSoft} />
        <circle cx="8" cy="8" r="4" fill={COLORS.gold} />
      </pattern>
    </defs>
    <polygon points={fragmentPoints(95, 115, 70, 1.1)} fill="url(#ch04-hatch)" stroke={COLORS.slate} strokeWidth={4} strokeLinejoin="round" />
    <polygon points={fragmentPoints(265, 115, 70, 1.1)} fill="url(#ch04-dots)" stroke={COLORS.gold} strokeWidth={4} strokeLinejoin="round" />
  </svg>
);

const roughPoints = (cx: number, cy: number, r: number) => {
  const n = 28;
  return Array.from({length: n}, (_, i) => {
    const a = (Math.PI * 2 * i) / n;
    const k = i % 2 === 0 ? 1 : 0.82;
    return `${(cx + r * k * Math.cos(a)).toFixed(1)},${(cy + r * k * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
};

const SurfaceArt: React.FC = () => (
  <svg width={360} height={230} viewBox="0 0 360 230">
    <circle cx={95} cy={115} r={66} fill={COLORS.slateSoft} stroke={COLORS.slate} strokeWidth={5} />
    <polygon points={roughPoints(265, 115, 72)} fill={COLORS.slateSoft} stroke={COLORS.slate} strokeWidth={5} strokeLinejoin="round" />
  </svg>
);

const WeatherArt: React.FC = () => (
  <svg width={360} height={230} viewBox="0 0 360 230">
    <polygon points={fragmentPoints(95, 115, 70, 2.0)} fill={COLORS.slate} stroke={COLORS.surface} strokeWidth={4} strokeLinejoin="round" />
    <polygon points={fragmentPoints(262, 112, 64, 2.0)} fill="#9AA8B4" stroke={COLORS.surface} strokeWidth={4} strokeLinejoin="round" />
    <path d="M238 70 l18 30 l-10 22 l20 26 M286 84 l-14 26 l16 18" fill="none" stroke={COLORS.surface} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
    <Fragment x={330} y={178} r={11} seed={0.3} fill="#9AA8B4" />
    <Fragment x={300} y={198} r={7} seed={1.2} fill="#9AA8B4" />
  </svg>
);

const CARDS: {key: keyof Steps; title: string; art: React.FC}[] = [
  {key: 'shape', title: '形', art: ShapeArt},
  {key: 'material', title: '材質', art: MaterialArt},
  {key: 'surface', title: '表面の性質', art: SurfaceArt},
  {key: 'weathering', title: '風化の程度', art: WeatherArt},
];

const TraitCard: React.FC<{index: number; title: string; art: React.FC; step: number; effectStep: number}> = ({index, title, art: Art, step, effectStep}) => {
  const appear = useReveal(step);
  const focus = useFocus((s) => s === step || s >= effectStep);
  return (
    <div style={{position: 'absolute', left: index * (CW + GAP), top: TOP}}>
      <Panel tone="slate" appear={appear} focus={focus} width={CW} height={CH}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 24, gap: 18}}>
          <PanelTitle size={44}>{title}</PanelTitle>
          <Art />
        </div>
      </Panel>
    </div>
  );
};

export const ParticleTraits: React.FC<{steps?: Steps}> = ({steps = {size: 1, shape: 2, material: 3, surface: 4, weathering: 5, effect: 6}}) => {
  const base = useReveal(0);
  const size = useReveal(steps.size);
  const effect = useReveal(steps.effect);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{...fadeUp(size, 10), position: 'absolute', left: 0, top: 6, display: 'flex', alignItems: 'center', gap: 18}}>
        <Tag tone="neutral" size={36}>
          大きさ
        </Tag>
        <span style={{fontSize: 38, fontWeight: 700, color: COLORS.inkSoft}}>だけでなく</span>
      </div>
      {CARDS.map((c, i) => (
        <TraitCard key={c.key} index={i} title={c.title} art={c.art} step={steps[c.key]} effectStep={steps.effect} />
      ))}
      <div style={{position: 'absolute', left: 0, right: 0, top: TOP + CH + 40, display: 'flex', justifyContent: 'center'}}>
        <div style={{...fadeUp(effect), display: 'flex', alignItems: 'center', gap: 20, fontSize: 42, fontWeight: 700, color: COLORS.greenDeep, background: COLORS.greenSoft, borderRadius: 16, padding: '12px 40px'}}>
          <Icon name="person" size={52} color={COLORS.green} />
          体内での動きや作用に関わる
        </div>
      </div>
      <div style={{position: 'absolute', right: 0, top: 6}}>
        <CornerTag appear={base}>模式図</CornerTag>
      </div>
    </div>
  );
};

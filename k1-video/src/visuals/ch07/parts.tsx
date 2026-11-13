import React from 'react';
import {Icon, IconName} from '../../components/Icons';
import {EvidenceBadge, EvidenceKind, SvgText, Tone, toneColor} from '../../components/ui';
import {COLORS} from '../../theme';

/**
 * 第7章の共通部品。
 * 三つの物質（BPA・フタル酸エステル・PFAS）を同じ四つの観点で比べるための行の定義、
 * 物質の「まとまり方」を示す記号（模式）、根拠の種類を示すバッジ。
 */

export type RowKey = 'use' | 'contact' | 'effect' | 'distinct';

export const ROW_DEFS: {key: RowKey; label: string; icon: IconName | 'ne'}[] = [
  {key: 'use', label: '用途', icon: 'package'},
  {key: 'contact', label: '接点（曝露源）', icon: 'hand'},
  {key: 'effect', label: '研究される作用', icon: 'search'},
  {key: 'distinct', label: '区別すべき点', icon: 'ne'},
];

/** 行ラベルのアイコン（「区別すべき点」は ≠ の記号） */
export const RowIcon: React.FC<{icon: IconName | 'ne'; size?: number; color?: string}> = ({icon, size = 40, color}) =>
  icon === 'ne' ? (
    <div style={{width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.95, fontWeight: 700, lineHeight: 1, color}}>≠</div>
  ) : (
    <Icon name={icon} size={size} color={color} />
  );

/* ------------------------------------------------------------------ */
/* 物質のまとまり方（模式）                                              */
/*  single：一つの物質 ／ group：名前の付いた物質群 ／ many：多くの物質の総称 */
/*  形の違い＝別の物質。危険度の大小は表さない（メーターは使わない）。          */
/* ------------------------------------------------------------------ */

export type ClusterKind = 'single' | 'group' | 'many';
type ShapeKind = 'hex' | 'circle' | 'square' | 'triangle' | 'diamond' | 'pentagon';

const poly = (cx: number, cy: number, r: number, n: number, rot = -Math.PI / 2) =>
  Array.from({length: n}, (_, i) => {
    const a = rot + (2 * Math.PI * i) / n;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');

export const Shape: React.FC<{kind: ShapeKind; x: number; y: number; r: number; fill: string; stroke: string; strokeWidth?: number; opacity?: number}> = ({
  kind,
  x,
  y,
  r,
  fill,
  stroke,
  strokeWidth = 4,
  opacity = 1,
}) => {
  const common = {fill, stroke, strokeWidth, opacity, strokeLinejoin: 'round' as const};
  if (kind === 'circle') return <circle cx={x} cy={y} r={r * 0.9} {...common} />;
  if (kind === 'square') return <rect x={x - r * 0.8} y={y - r * 0.8} width={r * 1.6} height={r * 1.6} rx={r * 0.18} {...common} />;
  if (kind === 'triangle') return <polygon points={poly(x, y + r * 0.12, r * 1.02, 3)} {...common} />;
  if (kind === 'diamond') return <polygon points={poly(x, y, r, 4)} {...common} />;
  if (kind === 'pentagon') return <polygon points={poly(x, y, r * 0.95, 5)} {...common} />;
  return <polygon points={poly(x, y, r, 6, 0)} {...common} />;
};

type Member = {label?: string; kind: ShapeKind; x: number; y: number; r: number};

const W = 328;
const H = 224;

const LAYOUTS: Record<ClusterKind, Member[]> = {
  single: [{label: 'BPA', kind: 'hex', x: W / 2, y: H / 2, r: 62}],
  group: [
    {label: 'DEHP', kind: 'square', x: 64, y: 50, r: 32},
    {label: 'DBP', kind: 'circle', x: 204, y: 50, r: 32},
    {label: 'BBP', kind: 'triangle', x: 64, y: 150, r: 32},
    {label: 'DEP', kind: 'diamond', x: 204, y: 150, r: 32},
  ],
  many: [
    {label: 'PFOA', kind: 'hex', x: 58, y: 46, r: 30},
    {label: 'PFOS', kind: 'pentagon', x: 166, y: 46, r: 30},
    {kind: 'circle', x: 262, y: 34, r: 18},
    {kind: 'triangle', x: 304, y: 74, r: 16},
    {kind: 'diamond', x: 250, y: 92, r: 17},
    {kind: 'square', x: 34, y: 146, r: 15},
    {kind: 'circle', x: 80, y: 168, r: 13},
    {kind: 'pentagon', x: 128, y: 140, r: 17},
    {kind: 'triangle', x: 176, y: 172, r: 15},
    {kind: 'hex', x: 218, y: 140, r: 15},
    {kind: 'diamond', x: 264, y: 176, r: 13},
    {kind: 'square', x: 304, y: 144, r: 13},
  ],
};

/**
 * 物質のまとまり方を示す記号。highlight に含まれるラベルの物質を塗りで強調し、他は薄くする。
 * hp：強調の進行度 0→1。
 */
export const Cluster: React.FC<{kind: ClusterKind; tone: Tone; highlight?: string[]; hp?: number; appear?: number}> = ({
  kind,
  tone,
  highlight = [],
  hp = 0,
  appear = 1,
}) => {
  const c = toneColor(tone);
  const members = LAYOUTS[kind];
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{display: 'block', overflow: 'visible', opacity: appear}}>
      {members.map((m, i) => {
        const on = m.label ? highlight.includes(m.label) : false;
        const dim = highlight.length > 0 && !on ? 1 - 0.6 * hp : 1;
        const fillMix = on ? hp : 0;
        return (
          <g key={i} opacity={dim}>
            <Shape kind={m.kind} x={m.x} y={m.y} r={m.r} fill={fillMix > 0.5 ? c.main : c.soft} stroke={c.main} strokeWidth={m.r > 25 ? 4.5 : 3.5} />
            {m.label && kind !== 'single' ? (
              <SvgText x={m.x} y={m.y + m.r + 24} size={28} weight={700} color={on && hp > 0.5 ? c.main : COLORS.ink}>
                {m.label}
              </SvgText>
            ) : null}
          </g>
        );
      })}
      {kind === 'group' ? (
        <SvgText x={292} y={150} size={28} weight={500} color={COLORS.inkSoft}>
          など
        </SvgText>
      ) : null}
      {kind === 'many' ? (
        <SvgText x={W - 4} y={H - 12} size={28} weight={500} color={COLORS.inkSoft} anchor="end">
          ほか多数
        </SvgText>
      ) : null}
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/* 根拠・判断の種類を示すバッジ                                          */
/* ------------------------------------------------------------------ */

/** EvidenceKind に加え、原文が種類を特定していない「実験」を別の形で示す */
export type BadgeKind = EvidenceKind | 'experiment';

export const KindBadge: React.FC<{kind: BadgeKind; label?: string; appear?: number}> = ({kind, label, appear = 1}) => {
  if (kind !== 'experiment') return <EvidenceBadge kind={kind} label={label} appear={appear} size={28} />;
  return (
    <span
      style={{
        opacity: appear,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 28,
        fontWeight: 700,
        color: COLORS.slate,
        background: COLORS.surface,
        border: `2.5px solid ${COLORS.slate}`,
        borderRadius: 10,
        padding: '4px 12px 4px 6px',
        whiteSpace: 'nowrap',
      }}
    >
      <Icon name="flask" size={32} />
      {label ?? '実験'}
    </span>
  );
};

/**
 * 第8章の図解で共通に使う小さな部品（章内専用）。
 * - 粒子（角ばった破片）と化学物質（六角形の分子記号）を形で区別する
 * - 「言えないこと」の項目（≠ 記号）や、点線の注記ラベル
 */
import React from 'react';
import {Icon, IconName} from '../../components/Icons';
import {fadeUp} from '../../components/scene-context';
import {COLORS} from '../../theme';

/** 角ばった粒子（破片）の記号 */
export const Fragment: React.FC<{x: number; y: number; r: number; rot?: number; fill?: string; stroke?: string; opacity?: number; dashed?: boolean; patternId?: string}> = ({
  x,
  y,
  r,
  rot = 0,
  fill = COLORS.slate,
  stroke = COLORS.surface,
  opacity = 1,
  dashed = false,
  patternId,
}) => {
  // 角ばった不規則な破片（六角形の分子記号と見分けられるよう、くぼみのある形にする）
  const shape: [number, number][] = [
    [-0.1, -1],
    [0.5, -0.62],
    [1, -0.05],
    [0.42, 0.28],
    [0.62, 0.92],
    [-0.3, 0.62],
    [-1, 0.48],
    [-0.62, -0.22],
  ];
  const pts = shape.map(([a, b]) => `${x + a * r},${y + b * r}`).join(' ');
  return (
    <polygon
      points={pts}
      transform={`rotate(${rot} ${x} ${y})`}
      fill={patternId ? `url(#${patternId})` : fill}
      stroke={stroke}
      strokeWidth={dashed ? 3.5 : 2.5}
      strokeDasharray={dashed ? '6 5' : undefined}
      strokeLinejoin="round"
      opacity={opacity}
    />
  );
};

/** 化学物質（分子）の記号：六角形の環と短い結合線 */
export const Molecule: React.FC<{x: number; y: number; r?: number; color?: string; opacity?: number}> = ({x, y, r = 22, color = COLORS.gold, opacity = 1}) => {
  const pts = Array.from({length: 6}, (_, i) => {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    return `${x + r * Math.cos(a)},${y + r * Math.sin(a)}`;
  }).join(' ');
  return (
    <g opacity={opacity}>
      <polygon points={pts} fill="none" stroke={color} strokeWidth={4} strokeLinejoin="round" />
      <line x1={x + r * Math.cos(-Math.PI / 6)} y1={y + r * Math.sin(-Math.PI / 6)} x2={x + r * 1.75} y2={y - r * 0.95} stroke={color} strokeWidth={4} strokeLinecap="round" />
      <line x1={x - r * Math.cos(-Math.PI / 6)} y1={y + r * Math.sin(Math.PI / 6)} x2={x - r * 1.75} y2={y + r * 0.95} stroke={color} strokeWidth={4} strokeLinecap="round" />
      <circle cx={x + r * 1.75} cy={y - r * 0.95} r={4.5} fill={color} />
    </g>
  );
};

/** 点線の枠の小さなラベル（「懸念」「可能性」「配慮」など。根拠の種類とは別の注記） */
export const DashTag: React.FC<{children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties}> = ({
  children,
  color = COLORS.inkSoft,
  size = 30,
  style,
}) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      fontSize: size,
      fontWeight: 700,
      color,
      background: COLORS.surface,
      border: `2.5px dashed ${color}`,
      borderRadius: 10,
      padding: '3px 14px',
      whiteSpace: 'nowrap',
      lineHeight: 1.25,
      ...style,
    }}
  >
    {children}
  </span>
);

/** 「言えないこと」の項目（≠ 記号＋文） */
export const LimitItem: React.FC<{text: React.ReactNode; appear?: number; focus?: number; size?: number}> = ({text, appear = 1, focus = 1, size = 34}) => (
  <div style={{...fadeUp(appear), opacity: appear * (0.5 + 0.5 * focus), display: 'flex', gap: 18, alignItems: 'flex-start'}}>
    <div style={{flexShrink: 0, fontSize: 46, fontWeight: 700, color: COLORS.gold, lineHeight: 1, marginTop: 2}}>≠</div>
    <div style={{fontSize: size, fontWeight: 700, color: COLORS.ink, lineHeight: 1.45, whiteSpace: 'pre-line'}}>{text}</div>
  </div>
);

/** アイコン入りの丸 */
export const IconDisc: React.FC<{name: IconName; size?: number; color?: string; bg?: string}> = ({name, size = 92, color = COLORS.green, bg = COLORS.greenSoft}) => (
  <div style={{width: size, height: size, borderRadius: size / 2, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
    <Icon name={name} size={size * 0.62} />
  </div>
);

/** 枠付きの面（HTML、絶対配置） */
export const Box: React.FC<{
  left: number;
  top: number;
  width: number;
  height: number;
  appear?: number;
  focus?: number;
  borderColor?: string;
  dashed?: boolean;
  topBar?: string;
  bg?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({left, top, width, height, appear = 1, focus = 1, borderColor = COLORS.lineSoft, dashed, topBar, bg = COLORS.surface, style, children}) => (
  <div
    style={{
      ...fadeUp(appear),
      opacity: appear * (0.5 + 0.5 * focus),
      position: 'absolute',
      left,
      top,
      width,
      height,
      boxSizing: 'border-box',
      background: bg,
      borderRadius: 22,
      border: `3px ${dashed ? 'dashed' : 'solid'} ${borderColor}`,
      borderTop: topBar ? `12px solid ${topBar}` : undefined,
      ...style,
    }}
  >
    {children}
  </div>
);

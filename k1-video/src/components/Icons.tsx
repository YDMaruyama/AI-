import React from 'react';

/**
 * 汎用の線画アイコン（viewBox 64×64）。製品・ブランド・人物を描かない模式的な記号。
 * 色は currentColor。サイズは size で指定。
 */
export type IconName =
  | 'food' | 'water' | 'air' | 'skin' | 'home' | 'container' | 'lid' | 'microwave' | 'board' | 'knife'
  | 'pan' | 'spatula' | 'bottle' | 'shirt' | 'capsule' | 'dust' | 'child' | 'cell' | 'label' | 'check'
  | 'search' | 'book' | 'leaf' | 'heart' | 'moon' | 'walk' | 'drop' | 'can' | 'fish' | 'fiber' | 'heat'
  | 'clock' | 'scale' | 'person' | 'flask' | 'hand' | 'window' | 'face' | 'glass' | 'bowl' | 'wood'
  | 'plate' | 'soil' | 'truck' | 'package' | 'sofa' | 'tire' | 'fragrance' | 'shield' | 'question'
  | 'lungs' | 'mouth' | 'gland' | 'chart' | 'info' | 'cycle' | 'sprout' | 'earth' | 'list' | 'warning-soft';

const S = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 3.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const paths: Record<IconName, React.ReactNode> = {
  food: (
    <>
      <path {...S} d="M8 30h48c0 12-10 22-24 22S8 42 8 30z" />
      <path {...S} d="M22 52h20" />
      <path {...S} d="M24 24c0-4 4-4 4-8M34 24c0-4 4-4 4-8" />
    </>
  ),
  bowl: (
    <>
      <path {...S} d="M8 28h48c0 13-10 22-24 22S8 41 8 28z" />
      <path {...S} d="M24 50l-2 6h20l-2-6" />
    </>
  ),
  water: (
    <>
      <path {...S} d="M18 10h28l-4 44H22z" />
      <path {...S} d="M20 26c4 2 8-2 12 0s8 2 12 0" />
    </>
  ),
  glass: (
    <>
      <path {...S} d="M18 10h28l-4 44H22z" />
      <path {...S} d="M20 26h24" />
    </>
  ),
  air: (
    <>
      <path {...S} d="M8 24h32a7 7 0 1 0-7-7" />
      <path {...S} d="M8 34h42a7 7 0 1 1-7 7" />
      <path {...S} d="M8 44h20" />
    </>
  ),
  skin: (
    <>
      <path {...S} d="M6 26c8-4 14 4 22 0s14-4 22 0 8 2 8 2" />
      <path {...S} d="M6 26v26h52V28" />
      <path {...S} d="M6 38h52" strokeDasharray="4 5" />
    </>
  ),
  hand: (
    <>
      <path {...S} d="M22 56V30l-6-8c-2-3 2-6 5-3l5 6V12c0-4 6-4 6 0v14-18c0-4 6-4 6 0v18-14c0-4 6-4 6 0v16-10c0-4 6-4 6 0v20c0 10-6 18-16 18z" />
    </>
  ),
  home: (
    <>
      <path {...S} d="M8 30L32 10l24 20" />
      <path {...S} d="M14 26v28h36V26" />
      <path {...S} d="M27 54V40h10v14" />
    </>
  ),
  container: (
    <>
      <path {...S} d="M10 24h44l-4 28H14z" />
      <path {...S} d="M8 18h48v6H8z" />
    </>
  ),
  lid: (
    <>
      <path {...S} d="M8 30h48v8H8z" />
      <path {...S} d="M26 30v-6h12v6" />
    </>
  ),
  microwave: (
    <>
      <path {...S} d="M6 14h52v36H6z" />
      <path {...S} d="M12 20h30v24H12z" />
      <path {...S} d="M50 22v2M50 30v2M50 38v2" />
    </>
  ),
  board: (
    <>
      <path {...S} d="M8 22h40a6 6 0 0 1 6 6v14a6 6 0 0 1-6 6H8z" />
      <path {...S} d="M54 35h4" />
      <path {...S} d="M16 30l8 4M28 38l10-6M18 42l6-2" strokeWidth={2.2} />
    </>
  ),
  knife: (
    <>
      <path {...S} d="M6 40L40 14c4 6 2 14-4 18L20 42" />
      <path {...S} d="M20 42l-6 6h-8l14-14" />
    </>
  ),
  pan: (
    <>
      <path {...S} d="M6 30h38c0 9-6 16-19 16S6 39 6 30z" />
      <path {...S} d="M44 32l14-4" />
    </>
  ),
  spatula: (
    <>
      <path {...S} d="M14 10h16v20H14z" />
      <path {...S} d="M22 30v26" />
    </>
  ),
  bottle: (
    <>
      <path {...S} d="M24 6h16v8H24z" />
      <path {...S} d="M22 14h20l4 10v30H18V24z" />
      <path {...S} d="M24 34h16v10H24z" />
    </>
  ),
  shirt: (
    <>
      <path {...S} d="M22 8l-14 8 6 12 6-3v31h24V25l6 3 6-12-14-8c-2 5-6 7-10 7s-8-2-10-7z" />
    </>
  ),
  capsule: (
    <>
      <circle {...S} cx="32" cy="32" r="20" />
      <circle {...S} cx="32" cy="32" r="13" strokeDasharray="3 4" />
    </>
  ),
  dust: (
    <>
      <circle {...S} cx="16" cy="40" r="3" />
      <circle {...S} cx="30" cy="30" r="2" />
      <circle {...S} cx="44" cy="42" r="3.5" />
      <path {...S} d="M20 22c4 2 6-2 10 0M38 18c3 2 5 0 8 2M10 52h44" />
    </>
  ),
  child: (
    <>
      <circle {...S} cx="32" cy="16" r="8" />
      <path {...S} d="M20 56l4-20h16l4 20M24 36l-8-6M40 36l8-6" />
    </>
  ),
  person: (
    <>
      <circle {...S} cx="32" cy="16" r="9" />
      <path {...S} d="M14 56c0-12 8-20 18-20s18 8 18 20" />
    </>
  ),
  cell: (
    <>
      <ellipse {...S} cx="32" cy="32" rx="24" ry="20" />
      <circle {...S} cx="34" cy="30" r="7" />
    </>
  ),
  label: (
    <>
      <path {...S} d="M8 12h28l20 20-20 20H8z" />
      <circle {...S} cx="18" cy="32" r="3" />
    </>
  ),
  check: (
    <>
      <path {...S} d="M8 8h48v48H8z" />
      <path {...S} d="M18 33l9 9 19-20" />
    </>
  ),
  search: (
    <>
      <circle {...S} cx="27" cy="27" r="15" />
      <path {...S} d="M38 38l16 16" />
    </>
  ),
  book: (
    <>
      <path {...S} d="M32 16c-6-4-14-5-24-4v38c10-1 18 0 24 4 6-4 14-5 24-4V12c-10-1-18 0-24 4z" />
      <path {...S} d="M32 16v38" />
    </>
  ),
  leaf: (
    <>
      <path {...S} d="M12 52C10 28 26 12 54 10c0 28-16 42-42 42z" />
      <path {...S} d="M12 52L36 28" />
    </>
  ),
  sprout: (
    <>
      <path {...S} d="M32 56V32" />
      <path {...S} d="M32 34c0-10-8-16-20-16 0 10 8 16 20 16zM32 30c0-10 8-16 20-16 0 10-8 16-20 16z" />
    </>
  ),
  heart: <path {...S} d="M32 54S8 40 8 22c0-8 6-12 12-12 6 0 10 4 12 8 2-4 6-8 12-8 6 0 12 4 12 12 0 18-24 32-24 32z" />,
  moon: <path {...S} d="M42 8a24 24 0 1 0 14 34A20 20 0 0 1 42 8z" />,
  walk: (
    <>
      <circle {...S} cx="34" cy="10" r="5" />
      <path {...S} d="M30 20l-6 16 8 6v14M30 20l10 6 8-2M24 36l-8 18" />
    </>
  ),
  drop: <path {...S} d="M32 8C22 22 14 30 14 40a18 18 0 0 0 36 0c0-10-8-18-18-32z" />,
  can: (
    <>
      <ellipse {...S} cx="32" cy="14" rx="16" ry="5" />
      <path {...S} d="M16 14v36c0 3 7 5 16 5s16-2 16-5V14" />
      <path {...S} d="M16 26c0 3 7 5 16 5s16-2 16-5" strokeDasharray="3 4" />
    </>
  ),
  fish: (
    <>
      <path {...S} d="M8 32c8-12 24-16 36-6l12-8v28l-12-8C32 48 16 44 8 32z" />
      <circle cx="20" cy="30" r="2" fill="currentColor" />
    </>
  ),
  fiber: (
    <>
      <path {...S} d="M6 20c10-8 18 8 28 0s16-6 24 0" />
      <path {...S} d="M6 34c10-8 18 8 28 0s16-6 24 0" />
      <path {...S} d="M6 48c10-8 18 8 28 0s16-6 24 0" />
    </>
  ),
  heat: (
    <>
      <path {...S} d="M32 56c-10 0-16-7-16-15 0-10 10-14 10-26 8 4 14 12 14 20 2-2 4-6 4-8 4 4 4 8 4 14 0 8-6 15-16 15z" />
    </>
  ),
  clock: (
    <>
      <circle {...S} cx="32" cy="32" r="24" />
      <path {...S} d="M32 18v14l10 6" />
    </>
  ),
  scale: (
    <>
      <path {...S} d="M32 8v44M16 52h32M12 18h40" />
      <path {...S} d="M12 18L4 36h16zM52 18l-8 18h16z" />
    </>
  ),
  flask: (
    <>
      <path {...S} d="M24 8h16M26 8v16L10 52c-1 3 1 4 4 4h36c3 0 5-1 4-4L38 24V8" />
      <path {...S} d="M18 40h28" />
    </>
  ),
  window: (
    <>
      <path {...S} d="M10 10h44v44H10z" />
      <path {...S} d="M32 10v44M10 32h44" />
      <path {...S} d="M58 22h4M58 30h4" />
    </>
  ),
  face: (
    <>
      <circle {...S} cx="32" cy="32" r="24" />
      <path {...S} d="M22 38c6 6 14 6 20 0" />
      <circle cx="24" cy="26" r="2.4" fill="currentColor" />
      <circle cx="40" cy="26" r="2.4" fill="currentColor" />
    </>
  ),
  plate: (
    <>
      <ellipse {...S} cx="32" cy="36" rx="26" ry="10" />
      <ellipse {...S} cx="32" cy="34" rx="14" ry="5" />
    </>
  ),
  wood: (
    <>
      <path {...S} d="M8 22h44a6 6 0 0 1 6 6v14a6 6 0 0 1-6 6H8z" />
      <path {...S} d="M14 30c10-3 22 3 34 0M14 40c10-3 22 3 34 0" strokeWidth={2.2} />
    </>
  ),
  soil: (
    <>
      <path {...S} d="M6 30c8-6 14 2 26-2s18 2 26-2" />
      <path {...S} d="M6 30v24h52V28" />
      <circle cx="20" cy="42" r="2" fill="currentColor" />
      <circle cx="38" cy="46" r="2" fill="currentColor" />
    </>
  ),
  truck: (
    <>
      <path {...S} d="M6 16h32v28H6zM38 26h12l8 10v8H38z" />
      <circle {...S} cx="16" cy="48" r="5" />
      <circle {...S} cx="46" cy="48" r="5" />
    </>
  ),
  package: (
    <>
      <path {...S} d="M8 20l24-10 24 10v26L32 56 8 46z" />
      <path {...S} d="M8 20l24 10 24-10M32 30v26" />
    </>
  ),
  sofa: (
    <>
      <path {...S} d="M12 30V20c0-4 4-6 8-6h24c4 0 8 2 8 6v10" />
      <path {...S} d="M6 30h52v16H6zM10 46v6M54 46v6" />
    </>
  ),
  tire: (
    <>
      <circle {...S} cx="32" cy="32" r="22" />
      <circle {...S} cx="32" cy="32" r="9" />
    </>
  ),
  fragrance: (
    <>
      <path {...S} d="M14 50c-6-6 6-10 0-16s6-10 0-16" />
      <path {...S} d="M32 54c-6-6 6-10 0-16s6-10 0-16" />
      <path {...S} d="M50 50c-6-6 6-10 0-16s6-10 0-16" />
    </>
  ),
  shield: <path {...S} d="M32 6l22 8v16c0 14-10 24-22 28C20 54 10 44 10 30V14z" />,
  question: (
    <>
      <circle {...S} cx="32" cy="32" r="24" />
      <path {...S} d="M24 24c0-5 4-8 8-8s8 3 8 8c0 6-8 7-8 13" />
      <circle cx="32" cy="45" r="2.4" fill="currentColor" />
    </>
  ),
  lungs: (
    <>
      <path {...S} d="M32 8v20" />
      <path {...S} d="M28 24c-4-6-16-4-18 10-2 12 0 20 6 20 8 0 12-6 12-14V24zM36 24c4-6 16-4 18 10 2 12 0 20-6 20-8 0-12-6-12-14V24z" />
    </>
  ),
  mouth: (
    <>
      <path {...S} d="M8 32c8-10 40-10 48 0-8 12-40 12-48 0z" />
      <path {...S} d="M8 32h48" />
    </>
  ),
  gland: (
    <>
      <path {...S} d="M14 26c0-10 8-14 18-14s18 4 18 14-6 20-18 20-18-10-18-20z" />
      <circle cx="26" cy="28" r="2.4" fill="currentColor" />
      <circle cx="36" cy="24" r="2.4" fill="currentColor" />
      <circle cx="38" cy="34" r="2.4" fill="currentColor" />
      <path {...S} d="M32 46v10" />
    </>
  ),
  chart: (
    <>
      <path {...S} d="M8 8v48h48" />
      <path {...S} d="M18 40l10-10 8 6 14-16" />
    </>
  ),
  info: (
    <>
      <circle {...S} cx="32" cy="32" r="24" />
      <path {...S} d="M32 28v16" />
      <circle cx="32" cy="20" r="2.4" fill="currentColor" />
    </>
  ),
  cycle: (
    <>
      <path {...S} d="M50 26A20 20 0 0 0 14 22M14 38a20 20 0 0 0 36 4" />
      <path {...S} d="M14 12v10h10M50 52V42H40" />
    </>
  ),
  earth: (
    <>
      <circle {...S} cx="32" cy="32" r="24" />
      <path {...S} d="M14 20c6 2 8 8 14 8s4 8 10 8 4 10 0 14M40 10c-2 6 4 8 10 10" />
    </>
  ),
  list: (
    <>
      <path {...S} d="M22 16h32M22 32h32M22 48h32" />
      <circle cx="11" cy="16" r="3" fill="currentColor" />
      <circle cx="11" cy="32" r="3" fill="currentColor" />
      <circle cx="11" cy="48" r="3" fill="currentColor" />
    </>
  ),
  'warning-soft': (
    <>
      <circle {...S} cx="32" cy="32" r="24" />
      <path {...S} d="M32 18v18" />
      <circle cx="32" cy="45" r="2.4" fill="currentColor" />
    </>
  ),
};

export const Icon: React.FC<{name: IconName; size?: number; color?: string; style?: React.CSSProperties}> = ({
  name,
  size = 64,
  color,
  style,
}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={{color, flexShrink: 0, overflow: 'visible', ...style}}>
    {paths[name]}
  </svg>
);

/** SVG の中にアイコンを置く場合（x, y は左上） */
export const SvgIcon: React.FC<{name: IconName; x: number; y: number; size?: number; color?: string; opacity?: number}> = ({
  name,
  x,
  y,
  size = 64,
  color,
  opacity = 1,
}) => (
  <g transform={`translate(${x} ${y}) scale(${size / 64})`} style={{color}} opacity={opacity}>
    {paths[name]}
  </g>
);

export const ICON_NAMES = Object.keys(paths) as IconName[];

import React from 'react';
import {interpolate} from 'remotion';
import {IconName, SvgIcon} from '../../components/Icons';
import {dimOpacity, drawDash, fadeUp} from '../../components/scene-context';
import {SvgText} from '../../components/ui';
import {COLORS} from '../../theme';

/**
 * 第2章の図解で共有する部品。
 * - 三つの視点（避ける・防ぐ・排出する）の記号と語
 * - 暮らしの場面を表す小さな挿絵（ビネット）と、それを載せるタイル
 * 人物写真・製品・ブランドは描かず、汎用の線画だけで構成する。
 * 「排出する」の場面には製品・カプセル・容器を描かない（排出をうたう商品と結び付けないため）。
 */

export type ViewKey = 'avoid' | 'protect' | 'release';
export const VIEW_ORDER: ViewKey[] = ['avoid', 'protect', 'release'];
export const VIEW_WORD: Record<ViewKey, string> = {avoid: '避ける', protect: '防ぐ', release: '排出する'};

const C = COLORS;
const S = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 3.2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
/** 0→1 の進行度 k のうち、[a, b] の区間だけを 0→1 に引き延ばす */
export const seg = (k: number, a: number, b: number) =>
  interpolate(k, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

/* ------------------------------------------------------------------ */
/* 三つの視点の記号（viewBox 64×64、線画）                              */
/* ------------------------------------------------------------------ */
const VIEW_PATHS: Record<ViewKey, React.ReactNode> = {
  // 避ける：道の途中にある物を、よけて進む
  avoid: (
    <>
      <circle cx="36" cy="48" r="6.5" fill="currentColor" />
      <path {...S} d="M8 48h12c7 0 6-26 15-26h19" />
      <path {...S} d="M47 15l7 7-7 7" />
    </>
  ),
  // 防ぐ：盾
  protect: (
    <>
      <path {...S} d="M32 6l22 8v16c0 14-10 24-22 28C20 54 10 44 10 30V14z" />
      <path {...S} d="M22 31l7 7 13-14" />
    </>
  ),
  // 排出する：身体をいたわる（人の形と小さなハート）。排出経路は描かない
  release: (
    <>
      <circle {...S} cx="32" cy="14" r="8" />
      <path {...S} d="M13 58c0-14 8-24 19-24s19 10 19 24" />
      <path
        d="M32 54S8 40 8 22c0-8 6-12 12-12 6 0 10 4 12 8 2-4 6-8 12-8 6 0 12 4 12 12 0 18-24 32-24 32z"
        fill="currentColor"
        transform="translate(32 47) scale(0.28) translate(-32 -32)"
      />
    </>
  ),
};

export const ViewIcon: React.FC<{view: ViewKey; size?: number; color?: string}> = ({view, size = 56, color}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={{color, flexShrink: 0, overflow: 'visible'}}>
    {VIEW_PATHS[view]}
  </svg>
);

/* ------------------------------------------------------------------ */
/* 暮らしの場面の挿絵（viewBox 320×210。habits のみ 660×210）           */
/* k：挿絵内の小さな動きの進行度 0→1（一度だけ動いて止まる）             */
/* ------------------------------------------------------------------ */
export type VignetteKind =
  | 'allergen'
  | 'caution'
  | 'alternative'
  | 'storage'
  | 'cooking'
  | 'instructions'
  | 'ventilation'
  | 'learn'
  | 'habits'
  | 'meal'
  | 'skincare'
  | 'rest'
  | 'awareness';

const VB: Partial<Record<VignetteKind, [number, number]>> = {habits: [660, 210]};
export const vignetteSize = (kind: VignetteKind) => VB[kind] ?? [320, 210];

/** ふた付きの保存容器 */
const Box: React.FC<{x: number; y: number; w: number; h: number; lidLift?: number}> = ({x, y, w, h, lidLift = 0}) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={6} fill={C.greenSoft} stroke={C.green} strokeWidth={4} />
    <rect x={x - 5} y={y - 11 - lidLift} width={w + 10} height={11} rx={4} fill={C.green} />
  </g>
);

const Allergen: React.FC<{k: number}> = ({k}) => (
  <g>
    {/* 食品の包装 */}
    <path d="M74 56 L104 22 H216 L246 56 V200 H74 Z" fill={C.surface} stroke={C.inkSoft} strokeWidth={5} strokeLinejoin="round" />
    <line x1={74} y1={56} x2={246} y2={56} stroke={C.inkSoft} strokeWidth={4} />
    <SvgIcon name="food" x={128} y={60} size={64} color={C.green} />
    {/* 表示欄（原材料などの行） */}
    <rect x={92} y={130} width={136} height={58} rx={8} fill={C.panel} />
    <line x1={106} y1={146} x2={212} y2={146} stroke={C.line} strokeWidth={5} strokeLinecap="round" />
    <line x1={106} y1={160} x2={180} y2={160} stroke={C.gold} strokeWidth={7} strokeLinecap="round" />
    <line x1={106} y1={174} x2={200} y2={174} stroke={C.line} strokeWidth={5} strokeLinecap="round" />
    {/* 虫めがね：表示を確かめる */}
    <g opacity={clamp01(k * 2)} transform={`translate(${(1 - k) * 50} ${(1 - k) * -12})`}>
      <circle cx={148} cy={160} r={36} fill="rgba(255,252,245,0.2)" stroke={C.green} strokeWidth={8} />
      <line x1={175} y1={184} x2={204} y2={200} stroke={C.green} strokeWidth={12} strokeLinecap="round" />
    </g>
  </g>
);

const Caution: React.FC<{k: number}> = ({k}) => (
  <g>
    {/* 製品の容器 */}
    <rect x={124} y={12} width={48} height={26} rx={6} fill={C.inkSoft} />
    <rect x={130} y={38} width={36} height={16} fill={C.surface} stroke={C.inkSoft} strokeWidth={4} />
    <rect x={96} y={54} width={104} height={148} rx={22} fill={C.surface} stroke={C.inkSoft} strokeWidth={5} />
    {/* 注意表示 */}
    <rect x={110} y={94} width={76} height={86} rx={8} fill={C.goldSoft} stroke={C.gold} strokeWidth={4} />
    <circle cx={148} cy={126} r={20} fill="none" stroke={C.gold} strokeWidth={5} />
    <line x1={148} y1={115} x2={148} y2={129} stroke={C.gold} strokeWidth={5} strokeLinecap="round" />
    <circle cx={148} cy={137} r={3.5} fill={C.gold} />
    <line x1={122} y1={164} x2={174} y2={164} stroke={C.gold} strokeWidth={4} strokeLinecap="round" />
    {/* 吹き出し */}
    <g opacity={k}>
      <path d="M214 108 L190 128 L234 112 Z" fill={C.surface} stroke={C.gold} strokeWidth={4} strokeLinejoin="round" />
      <rect x={204} y={56} width={110} height={60} rx={16} fill={C.surface} stroke={C.gold} strokeWidth={4} />
      <SvgText x={259} y={87} size={34} weight={700} color={C.ink}>
        注意
      </SvgText>
    </g>
  </g>
);

const Alternative: React.FC<{k: number}> = ({k}) => (
  <g>
    {/* 二つの選択肢（どちらかを良い・悪いと色で示さないよう、同じ描き方にそろえる） */}
    <rect x={20} y={58} width={116} height={140} rx={16} fill={C.surface} stroke={C.inkSoft} strokeWidth={4} />
    <SvgIcon name="bottle" x={33} y={82} size={90} color={C.inkSoft} />
    <rect x={184} y={58} width={116} height={140} rx={16} fill={C.surface} stroke={C.inkSoft} strokeWidth={4} />
    <SvgIcon name="container" x={197} y={84} size={90} color={C.inkSoft} />
    {/* 見比べる（両向きの弧） */}
    {k > 0.001 ? <path d="M86 50 Q160 -4 234 50" fill="none" stroke={C.gold} strokeWidth={6} strokeLinecap="round" {...drawDash(k, 190)} /> : null}
    <g opacity={k > 0.95 ? 1 : 0} fill="none" stroke={C.gold} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M215.8 47.9 L234 50 L226.4 33.3" />
      <path d="M93.6 33.3 L86 50 L104.2 47.9" />
    </g>
  </g>
);

const Storage: React.FC<{k: number}> = ({k}) => (
  <g>
    {/* 冷蔵庫の中（扉を外した模式） */}
    <rect x={84} y={8} width={152} height={196} rx={16} fill={C.surface} stroke={C.inkSoft} strokeWidth={5} />
    <line x1={84} y1={64} x2={236} y2={64} stroke={C.inkSoft} strokeWidth={4} />
    <g stroke={C.slate} strokeWidth={4} strokeLinecap="round">
      <line x1={160} y1={22} x2={160} y2={50} />
      <line x1={148} y1={29} x2={172} y2={43} />
      <line x1={148} y1={43} x2={172} y2={29} />
    </g>
    <line x1={96} y1={136} x2={224} y2={136} stroke={C.line} strokeWidth={4} strokeLinecap="round" />
    <Box x={102} y={100} w={54} h={34} />
    <Box x={168} y={106} w={50} h={28} />
    <Box x={110} y={160} w={100} h={36} lidLift={(1 - k) * 22} />
  </g>
);

const Cooking: React.FC<{k: number}> = ({k}) => (
  <g>
    {/* 湯気（静止） */}
    {[124, 160, 196].map((x, i) => (
      <path
        key={x}
        d={`M${x} 54 c -10 -10 10 -16 0 -26 s 10 -16 0 -24`}
        fill="none"
        stroke={C.line}
        strokeWidth={4}
        strokeLinecap="round"
        opacity={seg(k, 0.3 + i * 0.15, 0.7 + i * 0.15)}
      />
    ))}
    {/* ふたと鍋 */}
    <path d="M76 98 Q160 62 244 98 Z" fill={C.greenSoft} stroke={C.green} strokeWidth={5} strokeLinejoin="round" />
    <rect x={150} y={66} width={20} height={14} rx={5} fill={C.green} />
    <path d="M82 102 H238 V150 a24 24 0 0 1 -24 24 H106 a24 24 0 0 1 -24 -24 Z" fill={C.surface} stroke={C.inkSoft} strokeWidth={5} />
    <line x1={82} y1={118} x2={60} y2={118} stroke={C.inkSoft} strokeWidth={6} strokeLinecap="round" />
    <line x1={238} y1={118} x2={260} y2={118} stroke={C.inkSoft} strokeWidth={6} strokeLinecap="round" />
    {/* こんろ（模式） */}
    <rect x={70} y={190} width={180} height={14} rx={7} fill={C.inkSoft} />
    {[124, 160, 196].map((x) => (
      <path key={x} d={`M${x} 188 c -9 -6 -4 -14 0 -18 c 4 4 9 12 0 18 z`} fill={C.gold} />
    ))}
  </g>
);

const Instructions: React.FC<{k: number}> = ({k}) => (
  <g>
    {/* 使用方法の説明書 */}
    <rect x={30} y={12} width={162} height={190} rx={12} fill={C.surface} stroke={C.inkSoft} strokeWidth={4} />
    <rect x={50} y={30} width={122} height={14} rx={7} fill={C.line} />
    {[0, 1, 2].map((i) => {
      const y = 78 + i * 42;
      const kk = seg(k, i * 0.25, i * 0.25 + 0.4);
      return (
        <g key={i}>
          <rect x={48} y={y - 14} width={28} height={28} rx={6} fill={C.surface} stroke={C.green} strokeWidth={4} />
          {kk > 0.001 ? (
            <path d={`M53 ${y} l6 7 l12 -14`} fill="none" stroke={C.green} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" {...drawDash(kk, 30)} />
          ) : null}
          <line x1={90} y1={y} x2={174} y2={y} stroke={C.line} strokeWidth={6} strokeLinecap="round" />
        </g>
      );
    })}
    {/* 製品 */}
    <rect x={236} y={58} width={36} height={22} rx={5} fill={C.inkSoft} />
    <rect x={216} y={80} width={76} height={122} rx={18} fill={C.surface} stroke={C.inkSoft} strokeWidth={5} />
    <rect x={228} y={114} width={52} height={52} rx={8} fill={C.greenSoft} />
  </g>
);

const Ventilation: React.FC<{k: number}> = ({k}) => {
  const open = seg(k, 0, 0.5);
  const flow = seg(k, 0.4, 1);
  return (
    <g>
      {/* 窓（外は青灰） */}
      <rect x={30} y={20} width={208} height={156} rx={6} fill={C.slateSoft} stroke={C.inkSoft} strokeWidth={5} />
      <rect x={36} y={26} width={98} height={144} fill={C.surface} fillOpacity={0.75} stroke={C.inkSoft} strokeWidth={3} />
      <rect x={134 - 86 * open} y={26} width={98} height={144} fill={C.surface} fillOpacity={0.75} stroke={C.inkSoft} strokeWidth={4} />
      <line x1={18} y1={184} x2={250} y2={184} stroke={C.inkSoft} strokeWidth={6} strokeLinecap="round" />
      {/* 空気の入れ替わり */}
      {[72, 128].map((y) =>
        flow <= 0.001 ? null : (
        <g key={y}>
          <path
            d={`M150 ${y} C172 ${y - 16} 192 ${y + 16} 214 ${y} S256 ${y - 14} 272 ${y} L298 ${y}`}
            fill="none"
            stroke={C.slate}
            strokeWidth={5}
            strokeLinecap="round"
            {...drawDash(flow, 175)}
          />
          <path d={`M286 ${y - 10} L298 ${y} L286 ${y + 10}`} fill="none" stroke={C.slate} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={flow > 0.95 ? 1 : 0} />
        </g>
        ),
      )}
    </g>
  );
};

const Learn: React.FC<{k: number}> = ({k}) => (
  <g>
    {/* 開いた本 */}
    <path d="M30 64 Q94 44 158 64 V198 Q94 178 30 198 Z" fill={C.surface} stroke={C.inkSoft} strokeWidth={5} strokeLinejoin="round" />
    <path d="M162 64 Q226 44 290 64 V198 Q226 178 162 198 Z" fill={C.surface} stroke={C.inkSoft} strokeWidth={5} strokeLinejoin="round" />
    {[100, 126, 152].map((y) => (
      <line key={y} x1={52} y1={y} x2={136} y2={y} stroke={C.line} strokeWidth={6} strokeLinecap="round" />
    ))}
    {/* 身体（人の形）。内部の器官や排出経路は描かない */}
    <g opacity={0.35 + 0.65 * k}>
      <SvgIcon name="person" x={184} y={82} size={84} color={C.green} />
    </g>
  </g>
);

const HABITS: {icon: IconName; label: string}[] = [
  {icon: 'bowl', label: '食事'},
  {icon: 'walk', label: '身体活動'},
  {icon: 'moon', label: '休養など'},
];
const Habits: React.FC<{k: number}> = ({k}) => (
  <g>
    {HABITS.map((h, i) => {
      const cx = 110 + i * 220;
      const o = seg(k, i * 0.22, i * 0.22 + 0.35);
      return (
        <g key={h.label} opacity={o} transform={`translate(0 ${(1 - o) * 10})`}>
          <circle cx={cx} cy={80} r={68} fill={C.greenSoft} />
          <SvgIcon name={h.icon} x={cx - 42} y={38} size={84} color={C.green} />
          <SvgText x={cx} y={184} size={34} weight={700}>
            {h.label}
          </SvgText>
        </g>
      );
    })}
  </g>
);

const Meal: React.FC<{k: number}> = () => (
  <g>
    <SvgIcon name="food" x={44} y={36} size={140} color={C.green} />
    <SvgIcon name="glass" x={192} y={76} size={96} color={C.green} />
  </g>
);

const Skincare: React.FC<{k: number}> = ({k}) => (
  <g>
    <SvgIcon name="hand" x={56} y={40} size={150} color={C.green} />
    <g opacity={k}>
      <SvgIcon name="drop" x={212} y={34} size={60} color={C.slate} />
      <SvgIcon name="drop" x={240} y={112} size={42} color={C.slate} />
    </g>
  </g>
);

const Rest: React.FC<{k: number}> = ({k}) => (
  <g>
    {/* 寝具（模式） */}
    <line x1={40} y1={96} x2={40} y2={198} stroke={C.inkSoft} strokeWidth={6} strokeLinecap="round" />
    <line x1={270} y1={150} x2={270} y2={198} stroke={C.inkSoft} strokeWidth={6} strokeLinecap="round" />
    <rect x={40} y={132} width={230} height={38} rx={10} fill={C.surface} stroke={C.inkSoft} strokeWidth={5} />
    <rect x={54} y={106} width={66} height={28} rx={12} fill={C.greenSoft} stroke={C.green} strokeWidth={4} />
    <path d="M124 132 Q150 108 262 118 L270 132 Z" fill={C.green} opacity={0.4} />
    <g opacity={k}>
      <SvgIcon name="moon" x={206} y={10} size={76} color={C.gold} />
    </g>
  </g>
);

const Awareness: React.FC<{k: number}> = ({k}) => (
  <g>
    <SvgIcon name="person" x={40} y={46} size={150} color={C.green} />
    <g opacity={k}>
      <circle cx={196} cy={98} r={7} fill={C.line} />
      <circle cx={214} cy={74} r={10} fill={C.line} />
      <circle cx={260} cy={56} r={44} fill={C.surface} stroke={C.gold} strokeWidth={4} />
      <SvgIcon name="heart" x={236} y={33} size={48} color={C.gold} />
    </g>
  </g>
);

const VIGNETTES: Record<VignetteKind, React.FC<{k: number}>> = {
  allergen: Allergen,
  caution: Caution,
  alternative: Alternative,
  storage: Storage,
  cooking: Cooking,
  instructions: Instructions,
  ventilation: Ventilation,
  learn: Learn,
  habits: Habits,
  meal: Meal,
  skincare: Skincare,
  rest: Rest,
  awareness: Awareness,
};

export const Vignette: React.FC<{kind: VignetteKind; k: number; height: number}> = ({kind, k, height}) => {
  const [w, h] = vignetteSize(kind);
  const V = VIGNETTES[kind];
  return (
    <svg width={(height * w) / h} height={height} viewBox={`0 0 ${w} ${h}`} style={{display: 'block', flexShrink: 0, overflow: 'visible'}}>
      <V k={k} />
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/* 挿絵＋短いラベルのタイル                                              */
/* ------------------------------------------------------------------ */
export const Tile: React.FC<{
  kind: VignetteKind;
  label: string;
  appear: number;
  focus: number;
  k: number;
  flex?: number;
  artHeight: number;
  labelSize?: number;
  style?: React.CSSProperties;
}> = ({kind, label, appear, focus, k, flex = 1, artHeight, labelSize = 34, style}) => (
  <div
    style={{
      ...fadeUp(appear),
      opacity: appear * dimOpacity(focus, 0.55),
      flex,
      minWidth: 0,
      boxSizing: 'border-box',
      background: C.bg,
      border: `3px solid ${focus > 0.5 ? C.green : C.lineSoft}`,
      borderRadius: 18,
      padding: '14px 16px 16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      ...style,
    }}
  >
    <Vignette kind={kind} k={k} height={artHeight} />
    <div style={{fontSize: labelSize, fontWeight: 700, color: C.ink, lineHeight: 1.35, textAlign: 'center', letterSpacing: '0.02em', whiteSpace: 'pre-line'}}>
      {label}
    </div>
  </div>
);

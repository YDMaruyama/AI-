import React from 'react';
import {Icon, IconName} from '../../components/Icons';
import {dimOpacity, drawDash, fadeUp} from '../../components/scene-context';
import {Tone, toneColor} from '../../components/ui';
import {COLORS} from '../../theme';

/**
 * 第9章の図解で共通に使う部品（章フォルダ内のみで使用）。
 * 形の約束：
 *  - プラスチック片・破片 … 角ばった三角形（Fragment）
 *  - 微細な粒子 … 小さな四角（Particle）
 *  - 香り（香料） … 波線（ScentWave）
 *  - マイクロカプセル … 外側の殻（線）＋中の香料（金の丸）（Capsule）
 */

/** 枠付きの面。appear：表示の進行度、focus：強調度 */
export const Box: React.FC<{
  appear?: number;
  focus?: number;
  tone?: Tone;
  topBar?: boolean;
  dashed?: boolean;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({appear = 1, focus = 1, tone = 'green', topBar = false, dashed = false, style, children}) => {
  const c = toneColor(tone);
  return (
    <div
      style={{
        ...fadeUp(appear),
        opacity: appear * dimOpacity(focus, 0.5),
        position: 'absolute',
        boxSizing: 'border-box',
        background: COLORS.surface,
        borderRadius: 20,
        border: `3px ${dashed ? 'dashed' : 'solid'} ${focus > 0.5 ? c.main : COLORS.lineSoft}`,
        borderTop: topBar ? `12px solid ${c.main}` : undefined,
        boxShadow: focus > 0.5 ? `0 8px 24px rgba(42,43,42,${0.08 * focus})` : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** 丸い背景付きのアイコン */
export const IconBadge: React.FC<{name: IconName; tone?: Tone; size?: number; filled?: boolean}> = ({name, tone = 'green', size = 88, filled = false}) => {
  const c = toneColor(tone);
  return (
    <div
      style={{
        flexShrink: 0,
        width: size,
        height: size,
        borderRadius: size / 2,
        background: filled ? c.main : c.soft,
        color: filled ? COLORS.surface : c.main,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={name} size={size * 0.62} />
    </div>
  );
};

/** チェックボックス（HTML 用）。checked：チェックの描画進行度 */
export const CheckBox: React.FC<{checked: number; size?: number}> = ({checked, size = 52}) => (
  <svg width={size} height={size} viewBox="0 0 52 52" style={{flexShrink: 0}}>
    <rect x="3" y="3" width="46" height="46" rx="10" fill={COLORS.surface} stroke={COLORS.green} strokeWidth="4" />
    <path d="M13 27l9 9 18-20" fill="none" stroke={COLORS.green} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" {...drawDash(checked, 44)} />
  </svg>
);

/** 角ばった破片（プラスチック片・殻の破片） */
export const Fragment: React.FC<{x: number; y: number; r?: number; rot?: number; opacity?: number; fill?: string}> = ({
  x,
  y,
  r = 11,
  rot = 0,
  opacity = 1,
  fill = COLORS.slate,
}) => (
  <polygon
    points={`${x},${y - r} ${x + r * 0.95},${y + r * 0.45} ${x - r * 0.35},${y + r * 0.85}`}
    transform={`rotate(${rot} ${x} ${y})`}
    fill={fill}
    stroke={COLORS.surface}
    strokeWidth={2}
    opacity={opacity}
  />
);

/** 微細な粒子（小さな四角） */
export const Particle: React.FC<{x: number; y: number; s?: number; opacity?: number}> = ({x, y, s = 11, opacity = 1}) => (
  <rect x={x - s / 2} y={y - s / 2} width={s} height={s} rx={1.5} fill={COLORS.slate} stroke={COLORS.surface} strokeWidth={1.5} opacity={opacity} />
);

/** 香り（波線）。p：描画の進行度 */
export const ScentWave: React.FC<{x: number; y: number; h?: number; p?: number; color?: string; width?: number}> = ({
  x,
  y,
  h = 120,
  p = 1,
  color = COLORS.gold,
  width = 6,
}) => {
  const q = h / 4;
  const d = `M${x} ${y} c -${q * 0.7} -${q * 0.6} ${q * 0.7} -${q} 0 -${q * 2} s ${q * 0.7} -${q} 0 -${q * 2}`;
  return <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" {...drawDash(p, h * 1.4)} />;
};

/** マイクロカプセル（殻＝線、中の香料＝金の丸）。broken：割れ具合 0→1 */
export const Capsule: React.FC<{x: number; y: number; r?: number; broken?: number; opacity?: number}> = ({x, y, r = 26, broken = 0, opacity = 1}) => {
  const gap = broken * r * 0.45;
  // 割れ目のギザギザ（上下の端を結ぶ）
  const crack = (dir: 1 | -1) =>
    `L${x + dir * 3} ${y + r * 0.55} L${x - dir * 4} ${y + r * 0.15} L${x + dir * 4} ${y - r * 0.25} L${x - dir * 2} ${y - r * 0.6}`;
  return (
    <g opacity={opacity}>
      {broken > 0 ? (
        <>
          {/* 左半分 */}
          <path
            d={`M${x} ${y - r} A ${r} ${r} 0 0 0 ${x} ${y + r} ${crack(1)} Z`}
            fill={COLORS.surface}
            stroke={COLORS.slate}
            strokeWidth={5}
            strokeLinejoin="round"
            transform={`translate(${-gap} ${gap * 0.3}) rotate(${-broken * 12} ${x} ${y})`}
          />
          {/* 右半分 */}
          <path
            d={`M${x} ${y - r} A ${r} ${r} 0 0 1 ${x} ${y + r} ${crack(1)} Z`}
            fill={COLORS.surface}
            stroke={COLORS.slate}
            strokeWidth={5}
            strokeLinejoin="round"
            transform={`translate(${gap} ${-gap * 0.3}) rotate(${broken * 12} ${x} ${y})`}
          />
        </>
      ) : (
        <circle cx={x} cy={y} r={r} fill={COLORS.surface} stroke={COLORS.slate} strokeWidth={5} />
      )}
      <circle cx={x} cy={y} r={r * 0.45} fill={COLORS.gold} opacity={1 - broken * 0.85} />
    </g>
  );
};

/** チェック付きの短い実践チップ */
export const TipChip: React.FC<{text: string; appear: number; size?: number; style?: React.CSSProperties}> = ({text, appear, size = 30, style}) => (
  <div
    style={{
      ...fadeUp(appear, 10),
      display: 'inline-flex',
      alignItems: 'center',
      gap: 12,
      fontSize: size,
      fontWeight: 700,
      color: COLORS.greenDeep,
      background: COLORS.greenSoft,
      borderRadius: 12,
      padding: '8px 18px',
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    <span>✓</span>
    {text}
  </div>
);

/**
 * 留保・補足の帯（共通の NoteStrip と同じ見た目で、ラベルを 28px にした章内用の写し）。
 * 不安をあおらない落ち着いた見た目にする（赤・点滅は使わない）。
 */
export const Note: React.FC<{children: React.ReactNode; label?: string; appear?: number; style?: React.CSSProperties}> = ({
  children,
  label = '補足',
  appear = 1,
  style,
}) => (
  <div
    style={{
      ...fadeUp(appear, 12),
      display: 'flex',
      alignItems: 'center',
      gap: 22,
      background: COLORS.goldSoft,
      borderLeft: `8px solid ${COLORS.gold}`,
      borderRadius: 12,
      padding: '14px 28px',
      boxSizing: 'border-box',
      ...style,
    }}
  >
    <div
      style={{
        flexShrink: 0,
        fontSize: 28,
        fontWeight: 700,
        color: COLORS.surface,
        background: COLORS.gold,
        borderRadius: 8,
        padding: '3px 14px',
        letterSpacing: '0.08em',
      }}
    >
      {label}
    </div>
    <div style={{fontSize: 32, fontWeight: 500, color: COLORS.ink, lineHeight: 1.45}}>{children}</div>
  </div>
);

/** 香料（波線）の凡例マーク */
export const WaveMark: React.FC<{size?: number}> = ({size = 44}) => (
  <svg width={size} height={size} viewBox="0 0 44 44" style={{flexShrink: 0}}>
    <path d="M14 40 c -8 -6 8 -10 0 -18 s 8 -10 0 -18" fill="none" stroke={COLORS.gold} strokeWidth={4.5} strokeLinecap="round" />
    <path d="M30 40 c -8 -6 8 -10 0 -18 s 8 -10 0 -18" fill="none" stroke={COLORS.gold} strokeWidth={4.5} strokeLinecap="round" />
  </svg>
);

/** カプセルの殻・破片（角ばった形）の凡例マーク */
export const FragMark: React.FC<{size?: number}> = ({size = 44}) => (
  <svg width={size} height={size} viewBox="0 0 44 44" style={{flexShrink: 0}}>
    <polygon points="14,6 26,18 8,24" fill={COLORS.slate} />
    <polygon points="30,20 40,34 24,38" fill={COLORS.slate} />
  </svg>
);

/** 0→1 の進行度を区間 [a, b] に割り当てる */
export const seg = (p: number, a: number, b: number) => Math.max(0, Math.min(1, (p - a) / (b - a)));

import React from 'react';
import {fadeUp} from '../../components/scene-context';
import {Tone, toneColor} from '../../components/ui';
import {COLORS, FONT} from '../../theme';

/**
 * 第4章の図解で共通に使う小さな部品。
 * 共通部品（ui.tsx）の一部はラベルが 26px のため、28px 以上で描く章内の版を用意している。
 */

/** 補足帯（NoteStrip の章内版。ラベル 28px） */
export const NoteBand: React.FC<{children: React.ReactNode; label?: string; appear?: number; style?: React.CSSProperties}> = ({
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
    <div style={{fontSize: 34, fontWeight: 600, color: COLORS.ink, lineHeight: 1.45}}>{children}</div>
  </div>
);

/** 丸ラベル（Pill の章内版。既定 28px） */
export const Tag: React.FC<{children: React.ReactNode; tone?: Tone; filled?: boolean; size?: number; style?: React.CSSProperties}> = ({
  children,
  tone = 'green',
  filled = false,
  size = 28,
  style,
}) => {
  const c = toneColor(tone);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: size,
        fontWeight: 700,
        lineHeight: 1.2,
        color: filled ? COLORS.surface : c.main,
        background: filled ? c.main : c.soft,
        borderRadius: 999,
        padding: `${size * 0.22}px ${size * 0.6}px`,
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </span>
  );
};

/** 「≠」と短いラベル（ラベルは 30px、複数行可） */
export const NeSign: React.FC<{appear?: number; size?: number; lines?: string[]}> = ({appear = 1, size = 96, lines = []}) => (
  <div style={{...fadeUp(appear, 10), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8}}>
    <div style={{fontSize: size, fontWeight: 700, color: COLORS.gold, lineHeight: 1}}>≠</div>
    {lines.map((l) => (
      <div key={l} style={{fontSize: 30, fontWeight: 700, color: COLORS.gold, whiteSpace: 'nowrap', lineHeight: 1.3}}>
        {l}
      </div>
    ))}
  </div>
);

/** 枠付きのパネル。focus が低いときも読める濃さで残す */
export const Panel: React.FC<{
  tone: Tone;
  appear: number;
  focus: number;
  width: number | string;
  height: number | string;
  children: React.ReactNode;
  topBand?: boolean;
  style?: React.CSSProperties;
}> = ({tone, appear, focus, width, height, children, topBand = true, style}) => {
  const c = toneColor(tone);
  return (
    <div
      style={{
        ...fadeUp(appear),
        opacity: appear * (0.5 + 0.5 * focus),
        width,
        height,
        boxSizing: 'border-box',
        background: COLORS.surface,
        borderRadius: 22,
        border: `3px solid ${focus > 0.5 ? c.main : COLORS.lineSoft}`,
        borderTop: topBand ? `14px solid ${c.main}` : undefined,
        boxShadow: focus > 0.5 ? `0 10px 28px rgba(42,43,42,${0.08 * focus})` : 'none',
        position: 'relative',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** 文字を中央に置く見出し（パネル内） */
export const PanelTitle: React.FC<{children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties}> = ({
  children,
  size = 42,
  color = COLORS.ink,
  style,
}) => <div style={{fontSize: size, fontWeight: 700, color, lineHeight: 1.3, letterSpacing: '0.02em', ...style}}>{children}</div>;

/** 0→1 の値を少し遅らせて返す（順に出す項目用） */
export const lag = (p: number, k: number) => Math.max(0, Math.min(1, (p - k) / (1 - k)));

/* ------------------------------------------------------------------ */
/* SVG の形（色だけに頼らず、形で区別する）                              */
/* ------------------------------------------------------------------ */

/** 不規則な破片（プラスチック片の模式） */
export const fragmentPoints = (x: number, y: number, r: number, seed = 0) => {
  const n = 7;
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + seed;
    const k = 0.62 + 0.38 * Math.abs(Math.sin(seed * 3.1 + i * 1.7));
    pts.push(`${(x + r * k * Math.cos(a)).toFixed(1)},${(y + r * k * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
};

export const Fragment: React.FC<{x: number; y: number; r: number; seed?: number; fill?: string; opacity?: number; stroke?: string}> = ({
  x,
  y,
  r,
  seed = 0,
  fill = COLORS.slate,
  opacity = 1,
  stroke = COLORS.surface,
}) => <polygon points={fragmentPoints(x, y, r, seed)} fill={fill} stroke={stroke} strokeWidth={Math.max(1.5, r * 0.06)} strokeLinejoin="round" opacity={opacity} />;

/** ホルモンに似た働きの物質（六角形）— 第6章の記号と同じ */
export const Hex: React.FC<{x: number; y: number; r?: number; opacity?: number}> = ({x, y, r = 22, opacity = 1}) => {
  const pts = Array.from({length: 6}, (_, i) => {
    const a = (Math.PI / 3) * i;
    return `${x + r * Math.cos(a)},${y + r * Math.sin(a)}`;
  }).join(' ');
  return <polygon points={pts} fill={COLORS.gold} stroke={COLORS.surface} strokeWidth={3} opacity={opacity} />;
};

/** 働きを弱める物質（四角）— 第6章の記号と同じ */
export const Square: React.FC<{x: number; y: number; r?: number; opacity?: number}> = ({x, y, r = 20, opacity = 1}) => (
  <rect x={x - r} y={y - r} width={r * 2} height={r * 2} rx={4} fill={COLORS.slate} stroke={COLORS.surface} strokeWidth={3} opacity={opacity} />
);

/** 量や分解に作用する物質（ひし形）— 第6章の記号と同じ */
export const Diamond: React.FC<{x: number; y: number; r?: number; opacity?: number}> = ({x, y, r = 22, opacity = 1}) => (
  <polygon points={`${x},${y - r} ${x + r},${y} ${x},${y + r} ${x - r},${y}`} fill={COLORS.slate} stroke={COLORS.surface} strokeWidth={3} opacity={opacity} />
);

/** 三角（原料の残留成分の記号） */
export const Tri: React.FC<{x: number; y: number; r?: number; opacity?: number; fill?: string}> = ({x, y, r = 12, opacity = 1, fill = COLORS.slate}) => (
  <polygon points={`${x},${y - r} ${x + r * 0.95},${y + r * 0.7} ${x - r * 0.95},${y + r * 0.7}`} fill={fill} stroke={COLORS.surface} strokeWidth={2} opacity={opacity} />
);

export const FONT_FAMILY = FONT.family;

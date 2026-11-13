import React from 'react';
import {COLORS, FONT} from '../theme';
import {Icon, IconName} from './Icons';
import {dimOpacity, drawDash, fadeUp} from './scene-context';

/* ------------------------------------------------------------------ */
/* 文字                                                                */
/* ------------------------------------------------------------------ */

export const Title: React.FC<{children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties}> = ({
  children,
  size = FONT.heading,
  color = COLORS.ink,
  style,
}) => (
  <div style={{fontSize: size, fontWeight: 700, color, lineHeight: 1.3, letterSpacing: '0.02em', ...style}}>{children}</div>
);

export const Body: React.FC<{children: React.ReactNode; size?: number; color?: string; weight?: number; style?: React.CSSProperties}> = ({
  children,
  size = FONT.body,
  color = COLORS.ink,
  weight = 500,
  style,
}) => (
  <div style={{fontSize: size, fontWeight: weight, color, lineHeight: 1.5, letterSpacing: '0.02em', ...style}}>{children}</div>
);

export const Small: React.FC<{children: React.ReactNode; color?: string; style?: React.CSSProperties}> = ({
  children,
  color = COLORS.inkSoft,
  style,
}) => (
  <div style={{fontSize: FONT.note, fontWeight: 500, color, lineHeight: 1.5, letterSpacing: '0.02em', ...style}}>{children}</div>
);

/* ------------------------------------------------------------------ */
/* カード                                                              */
/* ------------------------------------------------------------------ */

export type Tone = 'green' | 'gold' | 'slate' | 'neutral';

export const toneColor = (tone: Tone) =>
  tone === 'green'
    ? {main: COLORS.green, soft: COLORS.greenSoft}
    : tone === 'gold'
      ? {main: COLORS.gold, soft: COLORS.goldSoft}
      : tone === 'slate'
        ? {main: COLORS.slate, soft: COLORS.slateSoft}
        : {main: COLORS.inkSoft, soft: COLORS.panel};

/**
 * appear：表示の進行度 0→1、focus：強調度 0→1（話している項目だけ 1）。
 * 強調していない項目も読める濃さで残す（比較対象を同時に見せるため）。
 */
export const Card: React.FC<{
  title?: React.ReactNode;
  body?: React.ReactNode;
  icon?: IconName;
  tone?: Tone;
  appear?: number;
  focus?: number;
  width?: number | string;
  height?: number | string;
  align?: 'left' | 'center';
  titleSize?: number;
  bodySize?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  tag?: React.ReactNode;
}> = ({
  title,
  body,
  icon,
  tone = 'green',
  appear = 1,
  focus = 1,
  width,
  height,
  align = 'left',
  titleSize = 44,
  bodySize = FONT.bodySmall,
  children,
  style,
  tag,
}) => {
  const c = toneColor(tone);
  return (
    <div
      style={{
        ...fadeUp(appear),
        opacity: appear * dimOpacity(focus, 0.5),
        width,
        height,
        boxSizing: 'border-box',
        background: COLORS.surface,
        borderRadius: 20,
        border: `3px solid ${focus > 0.5 ? c.main : COLORS.lineSoft}`,
        boxShadow: focus > 0.5 ? `0 10px 28px rgba(42,43,42,${0.1 * focus})` : 'none',
        padding: '30px 34px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        alignItems: align === 'center' ? 'center' : 'flex-start',
        textAlign: align,
        ...style,
      }}
    >
      {tag}
      {icon ? (
        <div
          style={{
            width: 92,
            height: 92,
            borderRadius: 46,
            background: c.soft,
            color: c.main,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={60} />
        </div>
      ) : null}
      {title ? (
        <div style={{fontSize: titleSize, fontWeight: 700, color: COLORS.ink, lineHeight: 1.3, letterSpacing: '0.02em'}}>{title}</div>
      ) : null}
      {body ? (
        <div style={{fontSize: bodySize, fontWeight: 500, color: COLORS.inkSoft, lineHeight: 1.5, letterSpacing: '0.02em'}}>{body}</div>
      ) : null}
      {children}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 補足（留保・科学的な限界）                                           */
/* ------------------------------------------------------------------ */

/**
 * 科学的な限界や留保を、該当する図と同じ場面で短く示す帯。
 * 不安をあおらない落ち着いた見た目にする（赤・点滅は使わない）。
 */
export const NoteStrip: React.FC<{
  children: React.ReactNode;
  label?: string;
  appear?: number;
  style?: React.CSSProperties;
}> = ({children, label = '補足', appear = 1, style}) => (
  <div
    style={{
      ...fadeUp(appear, 12),
      display: 'flex',
      alignItems: 'center',
      gap: 22,
      background: COLORS.goldSoft,
      borderLeft: `8px solid ${COLORS.gold}`,
      borderRadius: 12,
      padding: '16px 28px',
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

/** 図の隅に置く小さな注記（例：模式図・縮尺は一定ではない） */
export const CornerTag: React.FC<{children: React.ReactNode; appear?: number; style?: React.CSSProperties}> = ({
  children,
  appear = 1,
  style,
}) => (
  <div
    style={{
      opacity: appear,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      fontSize: FONT.note,
      fontWeight: 500,
      color: COLORS.inkSoft,
      border: `2px dashed ${COLORS.line}`,
      borderRadius: 10,
      padding: '6px 16px',
      background: 'rgba(255,252,245,0.85)',
      ...style,
    }}
  >
    {children}
  </div>
);

/** 丸みのあるラベル */
export const Pill: React.FC<{children: React.ReactNode; tone?: Tone; filled?: boolean; size?: number; style?: React.CSSProperties}> = ({
  children,
  tone = 'green',
  filled = false,
  size = 30,
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

/* ------------------------------------------------------------------ */
/* 根拠の種類                                                           */
/* ------------------------------------------------------------------ */

export type EvidenceKind = 'cell' | 'animal' | 'human' | 'causal' | 'assessment' | 'unknown';

const EVIDENCE: Record<EvidenceKind, {label: string; tone: Tone}> = {
  cell: {label: '細胞実験', tone: 'slate'},
  animal: {label: '動物実験', tone: 'gold'},
  human: {label: '人での関連', tone: 'green'},
  causal: {label: '因果関係', tone: 'neutral'},
  assessment: {label: '評価機関の判断', tone: 'neutral'},
  unknown: {label: '未解明', tone: 'neutral'},
};

/** 形の違うマーク（色だけに頼らない） */
const EvidenceMark: React.FC<{kind: EvidenceKind; color: string}> = ({kind, color}) => (
  <svg width={30} height={30} viewBox="0 0 30 30">
    {kind === 'cell' ? <circle cx="15" cy="15" r="11" fill="none" stroke={color} strokeWidth="3.5" /> : null}
    {kind === 'animal' ? <rect x="4" y="4" width="22" height="22" rx="3" fill="none" stroke={color} strokeWidth="3.5" /> : null}
    {kind === 'human' ? <path d="M15 3l12 22H3z" fill="none" stroke={color} strokeWidth="3.5" strokeLinejoin="round" /> : null}
    {kind === 'causal' ? <path d="M3 15h20M17 8l7 7-7 7" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" /> : null}
    {kind === 'assessment' ? <path d="M15 3l11 4v8c0 7-5 11-11 13C9 26 4 22 4 15V7z" fill="none" stroke={color} strokeWidth="3.2" /> : null}
    {kind === 'unknown' ? <circle cx="15" cy="15" r="11" fill="none" stroke={color} strokeWidth="3" strokeDasharray="4 4" /> : null}
  </svg>
);

/**
 * 根拠の種類を示す小さなバッジ。細胞実験・動物実験・人での関連・因果関係を
 * 同じ証拠として描かないため、形・ラベルで区別する。
 */
export const EvidenceBadge: React.FC<{kind: EvidenceKind; label?: string; appear?: number; size?: number}> = ({
  kind,
  label,
  appear = 1,
  size = 28,
}) => {
  const e = EVIDENCE[kind];
  const c = toneColor(e.tone);
  return (
    <span
      style={{
        opacity: appear,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontSize: size,
        fontWeight: 700,
        color: c.main,
        background: COLORS.surface,
        border: `2.5px solid ${c.main}`,
        borderRadius: 10,
        padding: '4px 12px 4px 8px',
        whiteSpace: 'nowrap',
      }}
    >
      <EvidenceMark kind={kind} color={c.main} />
      {label ?? e.label}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/* SVG 部品                                                             */
/* ------------------------------------------------------------------ */

/**
 * 描画アニメーション付きの矢印（SVG 内で使う）。
 * p：描画の進行度。dashed：条件付き・一部のみ等を表す点線。
 */
export const Arrow: React.FC<{
  from: [number, number];
  to: [number, number];
  /** 曲がり具合（正で左、負で右に膨らむ） */
  bend?: number;
  p?: number;
  color?: string;
  width?: number;
  dashed?: boolean;
  head?: boolean;
  opacity?: number;
}> = ({from, to, bend = 0, p = 1, color = COLORS.green, width = 5, dashed = false, head = true, opacity = 1}) => {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx - (dy / len) * bend;
  const cy = my + (dx / len) * bend;
  const d = `M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`;
  // おおよその曲線長
  const L = len + Math.abs(bend) * 0.6;
  // 矢じりの向き：終点付近の接線
  const tx = x2 - cx;
  const ty = y2 - cy;
  const tl = Math.hypot(tx, ty) || 1;
  const ux = tx / tl;
  const uy = ty / tl;
  const hs = 12 + width * 1.6;
  const maskId = `am${Math.round(x1)}_${Math.round(y1)}_${Math.round(x2)}_${Math.round(y2)}_${Math.round(bend)}`;
  const hp = `M${x2 - ux * hs - uy * hs * 0.6} ${y2 - uy * hs + ux * hs * 0.6} L${x2} ${y2} L${x2 - ux * hs + uy * hs * 0.6} ${y2 - uy * hs - ux * hs * 0.6}`;
  return (
    <g opacity={opacity}>
      {dashed ? (
        <>
          <mask id={maskId} maskUnits="userSpaceOnUse">
            <path d={d} fill="none" stroke="#fff" strokeWidth={width + 6} {...drawDash(p, L)} />
          </mask>
          <path
            d={d}
            fill="none"
            stroke={color}
            strokeWidth={width}
            strokeLinecap="round"
            strokeDasharray="12 12"
            mask={`url(#${maskId})`}
          />
        </>
      ) : (
        <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" {...drawDash(p, L)} />
      )}
      {head && p > 0.96 ? (
        <path d={hp} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
      ) : null}
    </g>
  );
};

/** SVG 内のテキスト（日本語は foreignObject を使わず text で置く） */
export const SvgText: React.FC<{
  x: number;
  y: number;
  children: React.ReactNode;
  size?: number;
  weight?: number;
  color?: string;
  anchor?: 'start' | 'middle' | 'end';
  opacity?: number;
}> = ({x, y, children, size = 32, weight = 500, color = COLORS.ink, anchor = 'middle', opacity = 1}) => (
  <text
    x={x}
    y={y}
    fontSize={size}
    fontWeight={weight}
    fill={color}
    textAnchor={anchor}
    dominantBaseline="middle"
    opacity={opacity}
    style={{fontFamily: FONT.family, letterSpacing: '0.02em'}}
  >
    {children}
  </text>
);

/** 「≠」を示す区切り（2 つの話を混同しない） */
export const NotEqual: React.FC<{appear?: number; size?: number; label?: string}> = ({appear = 1, size = 96, label}) => (
  <div style={{...fadeUp(appear, 10), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
    <div style={{fontSize: size, fontWeight: 700, color: COLORS.gold, lineHeight: 1}}>≠</div>
    {label ? <div style={{fontSize: 28, fontWeight: 700, color: COLORS.gold, whiteSpace: 'nowrap'}}>{label}</div> : null}
  </div>
);

/** チェック項目 */
export const CheckItem: React.FC<{
  text: React.ReactNode;
  sub?: React.ReactNode;
  appear?: number;
  checked?: number;
  focus?: number;
  size?: number;
}> = ({text, sub, appear = 1, checked = 1, focus = 1, size = 40}) => (
  <div style={{...fadeUp(appear), opacity: appear * dimOpacity(focus, 0.55), display: 'flex', gap: 24, alignItems: 'flex-start'}}>
    <svg width={size * 1.3} height={size * 1.3} viewBox="0 0 52 52" style={{flexShrink: 0, marginTop: 2}}>
      <rect x="3" y="3" width="46" height="46" rx="10" fill={COLORS.surface} stroke={COLORS.green} strokeWidth="4" />
      <path d="M13 27l9 9 18-20" fill="none" stroke={COLORS.green} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" {...drawDash(checked, 44)} />
    </svg>
    <div>
      <div style={{fontSize: size, fontWeight: 700, color: COLORS.ink, lineHeight: 1.4}}>{text}</div>
      {sub ? <div style={{fontSize: 30, fontWeight: 500, color: COLORS.inkSoft, lineHeight: 1.45, marginTop: 4}}>{sub}</div> : null}
    </div>
  </div>
);

/** 全角 1・半角 0.55 として文字幅を見積もる（SVG ラベルの幅計算用） */
export const textUnits = (s: string) => [...s].reduce((w, ch) => w + (/[ -~]/.test(ch) ? 0.58 : 1), 0);

/**
 * SVG 内の丸ラベル。幅は文字数から自動計算するので文字がはみ出さない。
 * anchor：x を左端・中央・右端のどこに合わせるか。
 */
export const SvgPill: React.FC<{
  x: number;
  y: number;
  text: string;
  size?: number;
  fill?: string;
  color?: string;
  stroke?: string;
  dashed?: boolean;
  anchor?: 'start' | 'middle' | 'end';
  opacity?: number;
  weight?: number;
}> = ({x, y, text, size = 30, fill = COLORS.green, color = COLORS.surface, stroke, dashed, anchor = 'middle', opacity = 1, weight = 700}) => {
  const padX = size * 0.75;
  const w = textUnits(text) * size * 1.04 + padX * 2;
  const h = size * 1.75;
  const left = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
  return (
    <g opacity={opacity}>
      <rect
        x={left}
        y={y - h / 2}
        width={w}
        height={h}
        rx={h / 2}
        fill={fill}
        stroke={stroke}
        strokeWidth={stroke ? 3 : 0}
        strokeDasharray={dashed ? '8 6' : undefined}
      />
      <SvgText x={left + w / 2} y={y + 1} size={size} weight={weight} color={color}>
        {text}
      </SvgText>
    </g>
  );
};

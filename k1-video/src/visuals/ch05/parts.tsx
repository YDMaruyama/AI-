import React from 'react';
import {Icon, IconName, SvgIcon} from '../../components/Icons';
import {fadeUp} from '../../components/scene-context';
import {Pill, SvgText, Tone, toneColor} from '../../components/ui';
import {COLORS} from '../../theme';

/**
 * 第5章の図解で共通に使う部品。
 * 形の約束（色だけに頼らない）：
 *  - 粒子・破片 … 角ばった多角形（Shard）
 *  - 香料       … やわらかな波線（Waft）
 *  - 化学物質   … 小さな丸（Molecule）
 *  - 繊維       … 細長い線（合成＝なめらかな一様の線、天然＝不規則な線）
 */

/** 角ばった破片・粒子 */
export const Shard: React.FC<{x: number; y: number; r?: number; rot?: number; opacity?: number; fill?: string}> = ({
  x,
  y,
  r = 12,
  rot = 0,
  opacity = 1,
  fill = COLORS.slate,
}) => (
  <polygon
    points={`${x - r},${y - r * 0.35} ${x - r * 0.1},${y - r} ${x + r},${y - r * 0.15} ${x + r * 0.35},${y + r * 0.9} ${x - r * 0.7},${y + r * 0.6}`}
    transform={`rotate(${rot} ${x} ${y})`}
    fill={fill}
    stroke={COLORS.surface}
    strokeWidth={2}
    strokeLinejoin="round"
    opacity={opacity}
  />
);

/** 香料を表すやわらかな波線（下から上へ立ちのぼる）。p で下から描かれる */
export const Waft: React.FC<{x: number; y: number; h?: number; amp?: number; color?: string; width?: number; p?: number; opacity?: number}> = ({
  x,
  y,
  h = 90,
  amp = 12,
  color = COLORS.gold,
  width = 5,
  p = 1,
  opacity = 1,
}) => {
  const q = h / 4;
  const d = `M${x} ${y} c ${-amp} ${-q * 0.5} ${amp} ${-q * 1.5} 0 ${-q * 2} s ${amp} ${-q * 1.5} 0 ${-q * 2}`;
  const L = h * 1.35;
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeDasharray={L}
      strokeDashoffset={L * (1 - p)}
      opacity={opacity}
    />
  );
};

/** 化学物質（分子）を表す小さな丸 */
export const Molecule: React.FC<{x: number; y: number; r?: number; opacity?: number; color?: string}> = ({
  x,
  y,
  r = 11,
  opacity = 1,
  color = COLORS.gold,
}) => <circle cx={x} cy={y} r={r} fill={color} stroke={COLORS.surface} strokeWidth={3} opacity={opacity} />;

/** 円形のノード（アイコン＋下のラベル） */
export const Node: React.FC<{
  x: number;
  y: number;
  r?: number;
  icon?: IconName;
  iconSize?: number;
  label?: string;
  labelSize?: number;
  labelGap?: number;
  tone?: Tone;
  appear?: number;
  focus?: number;
  filled?: boolean;
  children?: React.ReactNode;
}> = ({x, y, r = 70, icon, iconSize, label, labelSize = 34, labelGap = 40, tone = 'green', appear = 1, focus = 1, filled = true, children}) => {
  const c = toneColor(tone);
  const s = iconSize ?? r * 1.15;
  return (
    <g opacity={appear * (0.5 + 0.5 * focus)}>
      <circle cx={x} cy={y} r={r} fill={filled ? c.soft : COLORS.surface} stroke={focus > 0.5 ? c.main : COLORS.line} strokeWidth={4} />
      {icon ? <SvgIcon name={icon} x={x - s / 2} y={y - s / 2} size={s} color={c.main} /> : null}
      {children}
      {label ? (
        <SvgText x={x} y={y + r + labelGap} size={labelSize} weight={700}>
          {label}
        </SvgText>
      ) : null}
    </g>
  );
};

/** 枠付きのパネル（見出し＋タグ） */
export const Panel: React.FC<{
  title?: string;
  tag?: string;
  tone?: Tone;
  focus?: number;
  appear?: number;
  width: number | string;
  height: number | string;
  titleSize?: number;
  /** 強調していないときの濃さ（比較対象を読める濃さで残す） */
  dim?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({title, tag, tone = 'green', focus = 1, appear = 1, width, height, titleSize = 38, dim = 0.5, children, style}) => {
  const c = toneColor(tone);
  return (
    <div
      style={{
        ...fadeUp(appear),
        opacity: appear * (dim + (1 - dim) * focus),
        width,
        height,
        boxSizing: 'border-box',
        background: COLORS.surface,
        borderRadius: 22,
        border: `3px solid ${focus > 0.5 ? c.main : COLORS.lineSoft}`,
        borderTop: `14px solid ${c.main}`,
        padding: '20px 28px',
        position: 'relative',
        ...style,
      }}
    >
      {title || tag ? (
        <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
          {tag ? (
            <Pill tone={tone} size={28}>
              {tag}
            </Pill>
          ) : null}
          {title ? <div style={{fontSize: titleSize, fontWeight: 700, color: COLORS.ink, lineHeight: 1.3}}>{title}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
};

/** HTML 内のアイコン付きの行 */
export const IconRow: React.FC<{icon: IconName; text: React.ReactNode; size?: number; appear?: number; color?: string; iconSize?: number}> = ({
  icon,
  text,
  size = 36,
  appear = 1,
  color = COLORS.green,
  iconSize,
}) => (
  <div style={{...fadeUp(appear, 10), display: 'flex', alignItems: 'center', gap: 18}}>
    <div style={{color, display: 'flex'}}>
      <Icon name={icon} size={iconSize ?? size * 1.3} />
    </div>
    <div style={{fontSize: size, fontWeight: 600, color: COLORS.ink, lineHeight: 1.35}}>{text}</div>
  </div>
);

/** パネル間の「次へ」の山形（順序を示すだけで因果を示さない） */
export const Chevron: React.FC<{appear?: number; color?: string; size?: number}> = ({appear = 1, color = COLORS.line, size = 56}) => (
  <svg width={size} height={size} viewBox="0 0 56 56" style={{opacity: appear}}>
    <path d="M18 10l18 18-18 18" fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** 加工を表す歯車（Icons にないため章内で定義。viewBox 64 相当） */
export const SvgGear: React.FC<{x: number; y: number; size?: number; color?: string}> = ({x, y, size = 64, color = COLORS.green}) => {
  const teeth = Array.from({length: 8}, (_, i) => (Math.PI / 4) * i);
  return (
    <g transform={`translate(${x} ${y}) scale(${size / 64})`} stroke={color} fill="none" strokeLinecap="round">
      <circle cx={32} cy={32} r={16} strokeWidth={3.2} />
      <circle cx={32} cy={32} r={6} strokeWidth={3.2} />
      {teeth.map((a) => (
        <line key={a} x1={32 + 16 * Math.cos(a)} y1={32 + 16 * Math.sin(a)} x2={32 + 24 * Math.cos(a)} y2={32 + 24 * Math.sin(a)} strokeWidth={7} strokeLinecap="butt" />
      ))}
    </g>
  );
};

/** カーペットの記号（Icons にないため章内で定義。viewBox 64 相当） */
export const SvgRug: React.FC<{x: number; y: number; size?: number; color?: string}> = ({x, y, size = 64, color = COLORS.green}) => (
  <g transform={`translate(${x} ${y}) scale(${size / 64})`} stroke={color} fill="none" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 16h40v32H12z" />
    <path d="M18 22h28v20H18z" strokeDasharray="4 4" />
    <path d="M12 20H6M12 28H6M12 36H6M12 44H6M52 20h6M52 28h6M52 36h6M52 44h6" />
  </g>
);

/** 繊維：合成（なめらかで太さが一様な線） */
export const SyntheticFiber: React.FC<{d: string; color?: string; p?: number}> = ({d, color = COLORS.slate, p = 1}) => (
  <g opacity={p}>
    <path d={d} fill="none" stroke={color} strokeWidth={20} strokeLinecap="round" />
    <path d={d} fill="none" stroke={COLORS.surface} strokeWidth={5} strokeLinecap="round" opacity={0.55} transform="translate(0 -4)" />
  </g>
);

/** 繊維：天然（よじれ・節のある不規則な線） */
export const NaturalFiber: React.FC<{x0: number; y0: number; len: number; tilt?: number; color?: string; p?: number; kind?: 'twist' | 'scale'}> = ({
  x0,
  y0,
  len,
  tilt = 0,
  color = COLORS.green,
  p = 1,
  kind = 'twist',
}) => {
  const n = 7;
  const seg = len / n;
  if (kind === 'twist') {
    // 幅がなめらかに変わる、よじれたリボン
    const top: string[] = [];
    const bot: string[] = [];
    const m = 48;
    for (let i = 0; i <= m; i++) {
      const t = i / m;
      const x = x0 + t * len;
      const w = 3 + 10 * Math.abs(Math.sin(t * Math.PI * 4.5));
      const wob = Math.sin(t * Math.PI * 2) * 12;
      top.push(`${x.toFixed(1)},${(y0 + wob - w).toFixed(1)}`);
      bot.unshift(`${x.toFixed(1)},${(y0 + wob + w).toFixed(1)}`);
    }
    return (
      <g opacity={p} transform={`rotate(${tilt} ${x0 + len / 2} ${y0})`}>
        <polygon points={[...top, ...bot].join(' ')} fill={color} stroke={COLORS.surface} strokeWidth={2} strokeLinejoin="round" />
      </g>
    );
  }
  // 節（うろこ状の刻み）のある線
  const marks = Array.from({length: n}, (_, i) => x0 + seg * (i + 0.5));
  return (
    <g opacity={p} transform={`rotate(${tilt} ${x0 + len / 2} ${y0})`}>
      <path d={`M${x0} ${y0} C ${x0 + len * 0.3} ${y0 - 22}, ${x0 + len * 0.6} ${y0 + 22}, ${x0 + len} ${y0 - 4}`} fill="none" stroke={color} strokeWidth={16} strokeLinecap="round" />
      {marks.map((x, i) => {
        const t = (x - x0) / len;
        const yy = y0 + (-22 * 3 * t * (1 - t) * (1 - t) + 22 * 3 * t * t * (1 - t) - 4 * t * t * t);
        return <path key={i} d={`M${x - 6} ${yy - 9} l 8 9 l -8 9`} fill="none" stroke={COLORS.surface} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />;
      })}
    </g>
  );
};

/** 「≠」と短いラベル（共通の NotEqual と同じ見た目で、ラベルを 30px にした章内の変種） */
export const NotSame: React.FC<{appear?: number; size?: number; label?: string}> = ({appear = 1, size = 88, label}) => (
  <div style={{...fadeUp(appear, 10), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
    <div style={{fontSize: size, fontWeight: 700, color: COLORS.gold, lineHeight: 1}}>≠</div>
    {label ? <div style={{fontSize: 30, fontWeight: 700, color: COLORS.gold, textAlign: 'center', lineHeight: 1.3, whiteSpace: 'pre-line'}}>{label}</div> : null}
  </div>
);

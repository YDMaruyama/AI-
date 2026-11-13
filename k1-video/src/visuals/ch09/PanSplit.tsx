import React from 'react';
import {interpolate} from 'remotion';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {CornerTag, NotEqual, Pill, SvgText} from '../../components/ui';
import {COLORS} from '../../theme';

/**
 * フッ素樹脂加工のフライパン：
 *  左「傷・剥がれ → 微細な破片が食品に混じる」（粒子を飲み込む話）
 *  右「空焚き・著しい過熱 → 分解して有害なガス」（別の注意）
 * 二つを同時に見える配置で示し、別の問題であることを「≠」で区別する。
 * 破片（角ばった形）とガス（波線）は形で区別する。
 */
type Steps = {scrape: number; scrapeNote: number; heat: number; heatNote: number; both: number};

const PANEL_W = 790;
const PANEL_H = 600;

const Flake: React.FC<{x: number; y: number; r?: number; rot?: number; opacity: number}> = ({x, y, r = 12, rot = 0, opacity}) => (
  <polygon
    points={`${x},${y - r} ${x + r * 0.9},${y + r * 0.4} ${x - r * 0.3},${y + r * 0.8}`}
    transform={`rotate(${rot} ${x} ${y})`}
    fill={COLORS.inkSoft}
    stroke={COLORS.surface}
    strokeWidth={2}
    opacity={opacity}
  />
);

const PanBody: React.FC<{x: number; y: number; coatingDamaged?: number}> = ({x, y, coatingDamaged = 0}) => (
  <g>
    <line x1={x + 230} y1={y - 6} x2={x + 360} y2={y - 40} stroke={COLORS.ink} strokeWidth={16} strokeLinecap="round" />
    <ellipse cx={x} cy={y + 18} rx={240} ry={64} fill={COLORS.inkSoft} />
    <ellipse cx={x} cy={y} rx={240} ry={64} fill="#4A4C4A" />
    <ellipse cx={x} cy={y} rx={214} ry={52} fill="#6E7470" />
    {/* 傷 */}
    <path d={`M${x - 120} ${y - 10} L${x + 40} ${y + 14}`} stroke={COLORS.surface} strokeWidth={4} strokeLinecap="round" opacity={coatingDamaged} />
    <path d={`M${x - 90} ${y + 6} L${x + 10} ${y + 24}`} stroke={COLORS.surface} strokeWidth={3} strokeLinecap="round" opacity={coatingDamaged * 0.8} />
  </g>
);

const Panel: React.FC<{
  title: string;
  tag: string;
  tone: string;
  focus: number;
  appear: number;
  children: React.ReactNode;
}> = ({title, tag, tone, focus, appear, children}) => (
  <div
    style={{
      ...fadeUp(appear),
      opacity: appear * (0.5 + 0.5 * focus),
      width: PANEL_W,
      height: PANEL_H,
      boxSizing: 'border-box',
      background: COLORS.surface,
      borderRadius: 22,
      border: `3px solid ${focus > 0.5 ? tone : COLORS.lineSoft}`,
      borderTop: `14px solid ${tone}`,
      padding: '22px 30px',
      position: 'relative',
    }}
  >
    <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
      <Pill tone={tone === COLORS.slate ? 'slate' : 'gold'} size={24}>
        {tag}
      </Pill>
      <div style={{fontSize: 38, fontWeight: 700, color: COLORS.ink}}>{title}</div>
    </div>
    {children}
  </div>
);

const Chip: React.FC<{text: string; appear: number}> = ({text, appear}) => (
  <div
    style={{
      ...fadeUp(appear, 10),
      display: 'inline-flex',
      alignItems: 'center',
      gap: 12,
      fontSize: 26,
      fontWeight: 700,
      color: COLORS.greenDeep,
      background: COLORS.greenSoft,
      borderRadius: 12,
      padding: '7px 16px',
      whiteSpace: 'nowrap',
    }}
  >
    <span style={{fontSize: 26}}>✓</span>
    {text}
  </div>
);

export const PanSplit: React.FC<{
  steps?: Steps;
  scrapeNote?: string;
  scrapeTips?: string[];
  heatNote?: string;
  heatTips?: string[];
}> = ({
  steps = {scrape: 1, scrapeNote: 2, heat: 3, heatNote: 4, both: 5},
  scrapeNote = '飲み込むこと ≠ 健康被害が起こること',
  scrapeTips = ['メーカーが認める調理道具を使う', '剥がれが広がったら交換案内を確認'],
  heatNote = '粒子を食べる問題とは別の注意',
  heatTips = ['空のまま強火で熱し続けない'],
}) => {
  const base = useReveal(0, {duration: 0.7});
  const scrape = useReveal(steps.scrape, {duration: 2.2});
  const sNote = useReveal(steps.scrapeNote);
  const sTip1 = useReveal(steps.scrapeNote, {delay: 0.4});
  const heat = useReveal(steps.heat, {duration: 2.2});
  const hNote = useReveal(steps.heatNote);
  const both = useReveal(steps.both);
  const leftFocus = useFocus((s) => s < steps.heat || s >= steps.both);
  const rightFocus = useFocus((s) => s >= steps.heat || s === 0);

  // ヘラが表面をこする動き
  const spX = interpolate(scrape, [0, 0.55], [120, -80], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const damaged = interpolate(scrape, [0.2, 0.55], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const flakes = interpolate(scrape, [0.5, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // 熱とガス
  const flame = interpolate(heat, [0, 0.35], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const gas = interpolate(heat, [0.4, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between'}}>
      {/* 左：傷・剥がれ */}
      <Panel title="傷・剥がれ" tag="粒子" tone={COLORS.slate} focus={leftFocus} appear={base}>
        <svg width={730} height={250} viewBox="0 20 730 270" style={{display: 'block', marginTop: 6}}>
          <PanBody x={330} y={170} coatingDamaged={damaged} />
          {/* 食品（丸み）と破片（角ばった形） */}
          <ellipse cx={250} cy={168} rx={48} ry={20} fill="#C9A56A" />
          <ellipse cx={400} cy={178} rx={56} ry={22} fill="#9DB48A" />
          <Flake x={262} y={160} rot={10} opacity={flakes} />
          <Flake x={395} y={170} r={10} rot={-30} opacity={flakes} />
          <Flake x={320} y={182} r={9} rot={40} opacity={flakes} />
          {/* 金属製のヘラ */}
          <g transform={`translate(${spX} 0)`} opacity={scrape > 0 && scrape < 0.75 ? 1 : interpolate(scrape, [0.75, 0.9], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
            <rect x={300} y={40} width={22} height={110} rx={4} fill="#8B8F8C" transform="rotate(-28 311 95)" />
            <rect x={330} y={-30} width={12} height={90} rx={6} fill={COLORS.ink} transform="rotate(-28 311 95)" />
          </g>
          <g opacity={flakes}>
            <SvgText x={600} y={70} size={26} weight={700} color={COLORS.inkSoft} anchor="middle">
              剥がれた破片
            </SvgText>
            <line x1={540} y1={86} x2={420} y2={160} stroke={COLORS.inkSoft} strokeWidth={2.5} strokeDasharray="5 5" />
          </g>
        </svg>
        <div style={{...fadeUp(sNote, 10), fontSize: 30, fontWeight: 700, color: COLORS.ink, lineHeight: 1.45, marginTop: 4}}>{scrapeNote}</div>
        <div style={{display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16}}>
          {scrapeTips.map((t, i) => (
            <Chip key={t} text={t} appear={i === 0 ? sTip1 : lagged(sTip1)} />
          ))}
        </div>
      </Panel>

      <div style={{width: 120, alignSelf: 'center', display: 'flex', justifyContent: 'center'}}>
        <NotEqual appear={both} label="別の注意" size={88} />
      </div>

      {/* 右：空焚き・過熱 */}
      <Panel title="空焚き・著しい過熱" tag="ガス" tone={COLORS.gold} focus={rightFocus} appear={base}>
        <svg width={730} height={250} viewBox="0 20 730 270" style={{display: 'block', marginTop: 6}}>
          {/* ガス（波線） */}
          {[250, 330, 410].map((x, i) => (
            <path
              key={x}
              d={`M${x} 130 c -24 -22 24 -38 0 -60 s 24 -38 0 -60`}
              fill="none"
              stroke={COLORS.gold}
              strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray="160"
              strokeDashoffset={160 * (1 - interpolate(gas, [i * 0.15, 0.6 + i * 0.15], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}))}
            />
          ))}
          <PanBody x={330} y={170} />
          {/* 炎（模式） */}
          {[250, 330, 410].map((x) => (
            <path key={x} d={`M${x} 290 c -26 -20 -10 -44 0 -56 c 10 12 26 36 0 56 z`} fill={COLORS.gold} opacity={flame * 0.85} />
          ))}
          <g opacity={gas}>
            <SvgText x={600} y={70} size={26} weight={700} color={COLORS.gold} anchor="middle">
              分解して生じるガス
            </SvgText>
          </g>
          <g opacity={flame}>
            <SvgText x={600} y={250} size={26} weight={700} color={COLORS.inkSoft} anchor="middle">
              中身がないまま加熱
            </SvgText>
          </g>
        </svg>
        <div style={{...fadeUp(hNote, 10), fontSize: 30, fontWeight: 700, color: COLORS.ink, lineHeight: 1.45, marginTop: 4}}>{heatNote}</div>
        <div style={{display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16}}>
          {heatTips.map((t) => (
            <Chip key={t} text={t} appear={hNote} />
          ))}
        </div>
      </Panel>

      <div style={{position: 'absolute', left: PANEL_W, width: 1760 - PANEL_W * 2, bottom: 40, display: 'flex', justifyContent: 'center'}}>
        <CornerTag appear={base} style={{padding: '6px 10px'}}>模式図</CornerTag>
      </div>
    </div>
  );
};

/** チップを少し遅れて出す（値だけを変換） */
const lagged = (p: number) => Math.max(0, Math.min(1, p * 1.4 - 0.4));

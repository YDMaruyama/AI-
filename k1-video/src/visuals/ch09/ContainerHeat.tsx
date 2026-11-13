import React from 'react';
import {interpolate} from 'remotion';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {CornerTag, NoteStrip, SvgPill, SvgText} from '../../components/ui';
import {COLORS} from '../../theme';
import {Box, IconBadge, Particle, seg} from './parts';

/**
 * プラスチック容器：加熱条件や材質によって、微細な粒子が食品側へ出る可能性（N3）。
 *  左：容器の断面（模式図）。容器の内側から小さな四角（微細な粒子）が食品側へ移る
 *  右：実験で報告された例（一部の容器から放出／電子レンジ加熱で放出量が増えた例）
 *  下：ただし、すべての容器で同じ量が出るわけではない
 * 量の違いは描かない（数値・量の比較を創作しない）。
 */
type Steps = {heat: number; report: number; more: number; caveat: number};

const PARTICLES: {from: [number, number]; to: [number, number]}[] = [
  {from: [219, 330], to: [300, 330]},
  {from: [234, 420], to: [330, 405]},
  {from: [320, 480], to: [365, 440]},
  {from: [470, 480], to: [470, 425]},
  {from: [610, 480], to: [585, 440]},
  {from: [726, 410], to: [640, 395]},
  {from: [745, 320], to: [668, 330]},
];

const Row: React.FC<{appear: number; focus: number; title: string; sub?: string}> = ({appear, focus, title, sub}) => (
  <div style={{...fadeUp(appear), opacity: appear * (0.5 + 0.5 * focus), display: 'flex', gap: 18, alignItems: 'flex-start'}}>
    <svg width={26} height={26} viewBox="0 0 26 26" style={{flexShrink: 0, marginTop: 14}}>
      <rect x={4} y={4} width={18} height={18} rx={3} fill={COLORS.slate} />
    </svg>
    <div>
      <div style={{fontSize: 36, fontWeight: 700, color: COLORS.ink, lineHeight: 1.4}}>{title}</div>
      {sub ? <div style={{fontSize: 30, fontWeight: 500, color: COLORS.inkSoft, lineHeight: 1.45}}>{sub}</div> : null}
    </div>
  </div>
);

export const ContainerHeat: React.FC<{steps?: Steps}> = ({steps = {heat: 1, report: 2, more: 3, caveat: 4}}) => {
  const base = useReveal(0, {duration: 0.8});
  const heat = useReveal(steps.heat, {duration: 2.4});
  const label = useReveal(steps.heat, {delay: 1.6});
  const report = useReveal(steps.report);
  const more = useReveal(steps.more);
  const caveat = useReveal(steps.caveat);
  const leftFocus = useFocus((s) => s <= steps.heat || s >= steps.caveat);
  const r1Focus = useFocus((s) => s === steps.report || s >= steps.caveat);
  const r2Focus = useFocus((s) => s === steps.more || s >= steps.caveat);

  return (
    <div style={{position: 'absolute', inset: 0}}>
      {/* 条件 */}
      <div style={{...fadeUp(heat), opacity: heat * (0.5 + 0.5 * leftFocus), position: 'absolute', left: 150, top: 20, display: 'flex', alignItems: 'center', gap: 16}}>
        <IconBadge name="microwave" tone="gold" size={76} />
        <IconBadge name="flask" tone="gold" size={76} />
        <div style={{fontSize: 34, fontWeight: 700, color: COLORS.gold, marginLeft: 6}}>加熱条件や材質によって</div>
      </div>

      <svg width={980} height={560} viewBox="0 0 980 560" style={{position: 'absolute', left: 0, top: 10, opacity: 0.5 + 0.5 * leftFocus}}>
        <g opacity={base}>
          {/* 容器（外側）と縁 */}
          <path d="M170 200 L790 200 L730 500 L230 500 Z" fill="#D5DEE5" stroke={COLORS.slate} strokeWidth={3} />
          <rect x={156} y={190} width={648} height={18} rx={9} fill="#C3CED8" stroke={COLORS.slate} strokeWidth={3} />
          {/* 内側（空間） */}
          <path d="M188 208 L772 208 L713 482 L247 482 Z" fill={COLORS.surface} />
          {/* 食品 */}
          <path d="M198 252 Q480 236 762 252 L713 482 L247 482 Z" fill="#EBCB92" />
          <path d="M198 252 Q480 236 762 252" fill="none" stroke="#C9A56A" strokeWidth={4} />
          {/* ラベル */}
          <SvgText x={128} y={360} anchor="end" size={32} weight={700}>
            容器
          </SvgText>
          <line x1={136} y1={360} x2={208} y2={360} stroke={COLORS.inkSoft} strokeWidth={2.5} />
          <SvgText x={480} y={300} size={32} weight={700} color="#7A5A22">
            食品
          </SvgText>
        </g>

        {/* 微細な粒子：容器の内側 → 食品側（模式） */}
        {PARTICLES.map((pt, i) => {
          const k = seg(heat, 0.08 * i, 0.08 * i + 0.45);
          const x = interpolate(k, [0, 1], [pt.from[0], pt.to[0]]);
          const y = interpolate(k, [0, 1], [pt.from[1], pt.to[1]]);
          return <Particle key={i} x={x} y={y} s={19} opacity={heat > 0 ? Math.min(1, heat * 4) : 0} />;
        })}

        <g opacity={label}>
          <line x1={796} y1={318} x2={680} y2={330} stroke={COLORS.slate} strokeWidth={2.5} strokeDasharray="6 5" />
          <SvgPill x={980} y={300} anchor="end" text="微細な粒子" size={30} fill={COLORS.surface} color={COLORS.slate} stroke={COLORS.slate} />
        </g>
      </svg>

      <div style={{position: 'absolute', left: 0, top: 524}}>
        <CornerTag appear={base}>模式図</CornerTag>
      </div>

      {/* 実験で報告された例 */}
      <Box
        appear={report}
        focus={Math.max(r1Focus, r2Focus)}
        tone="slate"
        topBar
        style={{left: 1010, top: 60, width: 750, height: 450, padding: '28px 36px', display: 'flex', flexDirection: 'column', gap: 26}}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
          <IconBadge name="flask" tone="slate" size={72} />
          <div style={{fontSize: 38, fontWeight: 700, color: COLORS.ink}}>実験で報告された例</div>
        </div>
        <Row appear={report} focus={r1Focus} title="一部の容器から放出" sub="マイクロプラスチック・ナノプラスチック" />
        <Row appear={more} focus={r2Focus} title="電子レンジ加熱で放出量が増えた例" />
      </Box>

      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0}}>
        <NoteStrip appear={caveat} label="ただし">
          すべての容器で、同じ量が出るわけではありません
        </NoteStrip>
      </div>
    </div>
  );
};

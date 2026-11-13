import React from 'react';
import {interpolate} from 'remotion';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {Arrow, CornerTag, SvgPill, SvgText} from '../../components/ui';
import {COLORS} from '../../theme';
import {Chevron, Panel, Shard, Waft} from './parts';

/**
 * 柔軟剤のマイクロカプセル（模式図・縮尺は一定ではない）。
 * 形の約束：香料＝やわらかな波線（金）、殻・破片＝角ばった形（青灰）。
 *  - CapsuleMechanism：①カプセルの断面 → ②摩擦・衝撃 → ③香料の放出
 *  - CapsuleShell：殻の素材（合成樹脂を使うものがある／製品によって異なる）
 */

const FABRIC = '#C9B79A';

/** カプセルの断面。crack：ひび（0→1） */
const CapsuleSection: React.FC<{cx: number; cy: number; r: number; crack?: number; shell?: 'solid' | 'dashed' | 'double'; shellWidth?: number; scentOpacity?: number}> = ({
  cx,
  cy,
  r,
  crack = 0,
  shell = 'solid',
  shellWidth = 16,
  scentOpacity = 1,
}) => (
  <g>
    <circle cx={cx} cy={cy} r={r - shellWidth / 2} fill={COLORS.goldSoft} />
    {[-0.32, 0, 0.32].map((dx) => (
      <Waft key={dx} x={cx + dx * r} y={cy + r * 0.42} h={r * 0.84} amp={r * 0.1} width={5} opacity={scentOpacity} />
    ))}
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill="none"
      stroke={COLORS.slate}
      strokeWidth={shell === 'double' ? shellWidth * 0.45 : shellWidth}
      strokeDasharray={shell === 'dashed' ? `${r * 0.32} ${r * 0.16}` : undefined}
    />
    {shell === 'double' ? <circle cx={cx} cy={cy} r={r - shellWidth * 0.75} fill="none" stroke={COLORS.slate} strokeWidth={shellWidth * 0.45} /> : null}
    {crack > 0 ? (
      <g opacity={crack}>
        <path
          d={`M${cx + r * 0.25} ${cy - r * 1.02} l ${-r * 0.12} ${r * 0.28} l ${r * 0.16} ${r * 0.14} l ${-r * 0.1} ${r * 0.26}`}
          fill="none"
          stroke={COLORS.ink}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={`M${cx + r * 1.0} ${cy - r * 0.1} l ${-r * 0.26} ${r * 0.08} l ${-r * 0.06} ${r * 0.22}`}
          fill="none"
          stroke={COLORS.ink}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    ) : null}
  </g>
);

/** 衣類の繊維（帯） */
const FabricBand: React.FC<{y: number; x0?: number; x1?: number; dx?: number}> = ({y, x0 = 10, x1 = 450, dx = 0}) => (
  <g transform={`translate(${dx} 0)`}>
    <path
      d={`M${x0} ${y} C ${x0 + (x1 - x0) * 0.25} ${y - 14}, ${x0 + (x1 - x0) * 0.5} ${y + 14}, ${x0 + (x1 - x0) * 0.75} ${y - 6} S ${x1 - 10} ${y + 6}, ${x1} ${y}`}
      fill="none"
      stroke={FABRIC}
      strokeWidth={28}
      strokeLinecap="round"
    />
  </g>
);

/** 割れた殻の破片の配置（円周上の位置と外への移動） */
const SHARDS = [
  {a: -150, d: 0.5, rot: 10},
  {a: -100, d: 0.9, rot: -30},
  {a: -40, d: 0.6, rot: 40},
  {a: 10, d: 1.0, rot: -10},
  {a: 70, d: 0.4, rot: 70},
  {a: 130, d: 0.8, rot: -50},
  {a: 180, d: 0.7, rot: 25},
];

const PANEL_W = 520;
const PANEL_H = 548;
const SVG_W = 460;
const SVG_H = 420;
const C = {x: 230, y: 214, r: 96};
const FAB_Y = 334;

type MechSteps = {section: number; force: number; release: number};

export const CapsuleMechanism: React.FC<{steps?: MechSteps}> = ({steps = {section: 1, force: 2, release: 3}}) => {
  const base = useReveal(0, {duration: 0.7});
  const p1Labels = useReveal(steps.section, {duration: 0.6});
  const p2 = useReveal(steps.force, {duration: 0.6});
  const rub = useReveal(steps.force, {delay: 0.3, duration: 1.4});
  const p3 = useReveal(steps.release, {duration: 0.6});
  const burst = useReveal(steps.release, {delay: 0.2, duration: 1.6});
  const f1 = useFocus((s) => s <= steps.section);
  const f2 = useFocus((s) => s === steps.force);
  const f3 = useFocus((s) => s >= steps.release);

  const crack = interpolate(rub, [0.45, 0.9], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rubDx = interpolate(rub, [0, 0.5, 1], [24, -24, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rise = interpolate(burst, [0.2, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        {/* ① 断面 */}
        <Panel title="① カプセルの断面" tone="slate" width={PANEL_W} height={PANEL_H} appear={base} focus={f1} titleSize={36}>
          <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{display: 'block', marginTop: 10}}>
            <FabricBand y={FAB_Y} />
            <CapsuleSection cx={C.x} cy={C.y} r={C.r} />
            <g opacity={p1Labels}>
              <line x1={C.x + C.r * 0.72} y1={C.y - C.r * 0.72} x2={384} y2={64} stroke={COLORS.slate} strokeWidth={3} />
              <SvgPill x={400} y={50} text="殻" size={30} fill={COLORS.slate} />
              <line x1={C.x - C.r * 0.32} y1={C.y - 10} x2={76} y2={64} stroke={COLORS.gold} strokeWidth={3} />
              <SvgPill x={66} y={50} text="香料" size={30} fill={COLORS.gold} />
              <SvgText x={230} y={392} size={30} weight={700} color={COLORS.inkSoft}>
                衣類の繊維に付着
              </SvgText>
            </g>
          </svg>
        </Panel>

        <Chevron appear={p2} />

        {/* ② 摩擦・衝撃 */}
        <Panel title="② 摩擦・衝撃" tone="slate" width={PANEL_W} height={PANEL_H} appear={p2} focus={f2} titleSize={36}>
          <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{display: 'block', marginTop: 10}}>
            <FabricBand y={FAB_Y} />
            {/* 上からこすれる別の布 */}
            <FabricBand y={92} x0={40} x1={420} dx={rubDx} />
            <CapsuleSection cx={C.x} cy={C.y + 6} r={C.r} crack={crack} />
            {/* 摩擦（左右の矢印）と衝撃（押す矢印） */}
            <g opacity={rub > 0 ? 1 : 0}>
              <path d="M120 46 H340" stroke={COLORS.ink} strokeWidth={4} strokeLinecap="round" />
              <path d="M136 32 L118 46 L136 60 M324 32 L342 46 L324 60" fill="none" stroke={COLORS.ink} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
            </g>
            <Arrow from={[420, 150]} to={[340, 186]} p={rub} color={COLORS.ink} width={5} />
            <SvgPill x={60} y={46} text="摩擦" size={28} fill={COLORS.surface} color={COLORS.ink} stroke={COLORS.ink} opacity={rub} />
            <SvgPill x={410} y={236} text="衝撃" size={28} fill={COLORS.surface} color={COLORS.ink} stroke={COLORS.ink} opacity={rub} />
            <g opacity={crack}>
              <SvgText x={230} y={392} size={30} weight={700} color={COLORS.inkSoft}>
                カプセルが壊れる
              </SvgText>
            </g>
          </svg>
        </Panel>

        <Chevron appear={p3} />

        {/* ③ 放出 */}
        <Panel title="③ 香料の放出" tone="gold" width={PANEL_W} height={PANEL_H} appear={p3} focus={f3} titleSize={36}>
          <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{display: 'block', marginTop: 10}}>
            <FabricBand y={FAB_Y} />
            {/* 立ちのぼる香料（やわらかな波線） */}
            {[-70, -20, 30, 80].map((dx, i) => (
              <Waft key={dx} x={C.x + dx} y={C.y + 40 - 70 * rise} h={130} amp={14} width={6} p={interpolate(burst, [i * 0.08, 0.6 + i * 0.08], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
            ))}
            {/* 殻の破片（角ばった形） */}
            {SHARDS.map((s, i) => {
              const a = (s.a * Math.PI) / 180;
              // 始め：殻があった円周上 → 終わり：外へ広がり、繊維の近くに残る
              const x0 = C.x + C.r * Math.cos(a);
              const y0 = C.y + C.r * Math.sin(a);
              const x1 = C.x + (C.r + 30 * s.d) * Math.cos(a);
              const y1 = Math.min(FAB_Y - 28, C.y + 70 + C.r * 0.45 * Math.sin(a));
              const k = interpolate(burst, [0, 0.7], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
              return <Shard key={i} x={x0 + (x1 - x0) * k} y={y0 + (y1 - y0) * k} r={17} rot={s.rot + 40 * k} />;
            })}
            <g opacity={burst}>
              <SvgPill x={400} y={44} text="香料" size={28} fill={COLORS.gold} />
              <SvgPill x={86} y={392} text="殻・破片" size={28} fill={COLORS.slate} />
            </g>
          </svg>
        </Panel>
      </div>

      {/* 凡例 */}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 46}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
          <svg width={60} height={54} viewBox="0 0 60 54">
            <Waft x={18} y={50} h={46} amp={9} width={5} />
            <Waft x={40} y={50} h={46} amp={9} width={5} />
          </svg>
          <span style={{fontSize: 30, fontWeight: 700, color: COLORS.ink}}>香料（波線）</span>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
          <svg width={60} height={54} viewBox="0 0 60 54">
            <Shard x={20} y={28} r={13} rot={10} />
            <Shard x={44} y={30} r={11} rot={-40} />
          </svg>
          <span style={{fontSize: 30, fontWeight: 700, color: COLORS.ink}}>殻・破片（角ばった形）</span>
        </div>
        <CornerTag appear={base}>模式図・縮尺は一定ではない</CornerTag>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 殻の素材                                                             */
/* ------------------------------------------------------------------ */

type ShellSteps = {resin: number; vary: number; notSame: number};

export const CapsuleShell: React.FC<{steps?: ShellSteps}> = ({steps = {resin: 1, vary: 2, notSame: 3}}) => {
  const base = useReveal(0, {duration: 0.7});
  const resin = useReveal(steps.resin, {duration: 0.7});
  const resinNote = useReveal(steps.resin, {delay: 1.2});
  const vary = useReveal(steps.vary, {duration: 0.8});
  const notSame = useReveal(steps.notSame);
  const fLeft = useFocus((s) => s <= steps.resin);
  const fRight = useFocus((s) => s >= steps.vary);

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, display: 'flex', justifyContent: 'space-between'}}>
        <Panel title="殻に合成樹脂を使うものがある" tone="slate" width={800} height={600} appear={base} focus={fLeft} titleSize={36} dim={0.65}>
          <svg width={740} height={500} viewBox="0 0 740 500" style={{display: 'block', marginTop: 6}}>
            <CapsuleSection cx={250} cy={190} r={130} shellWidth={26} />
            {/* 殻を強調する輪 */}
            <circle cx={250} cy={190} r={158} fill="none" stroke={COLORS.slate} strokeWidth={4} strokeDasharray="10 9" opacity={resin} />
            <line x1={364} y1={86} x2={470} y2={70} stroke={COLORS.slate} strokeWidth={3} opacity={resin} />
            <SvgPill x={480} y={70} anchor="start" text="殻" size={32} fill={COLORS.slate} opacity={resin} />
            {/* 破片 */}
            <g opacity={resinNote}>
              <Shard x={480} y={236} r={18} rot={10} />
              <Shard x={540} y={262} r={15} rot={-40} />
              <Shard x={600} y={230} r={17} rot={60} />
              <Shard x={660} y={268} r={13} rot={-10} />
              <Arrow from={[400, 250]} to={[456, 250]} p={resinNote} color={COLORS.slate} width={4} />
              <SvgText x={370} y={392} size={32} weight={700} color={COLORS.ink}>
                マイクロプラスチックの
              </SvgText>
              <SvgText x={370} y={440} size={32} weight={700} color={COLORS.ink}>
                発生源としても問題になる
              </SvgText>
            </g>
          </svg>
        </Panel>

        <Panel title="素材や分解性は製品によって異なる" tone="gold" width={920} height={600} appear={vary} focus={fRight} titleSize={36}>
          <svg width={860} height={310} viewBox="0 0 860 310" style={{display: 'block', marginTop: 16}}>
            {(['solid', 'dashed', 'double'] as const).map((sh, i) => {
              const x = 140 + i * 290;
              return (
                <g key={sh}>
                  <CapsuleSection cx={x} cy={130} r={92} shell={sh} shellWidth={18} />
                  <SvgText x={x} y={272} size={32} weight={700} color={COLORS.inkSoft}>
                    {`製品${'ABC'[i]}`}
                  </SvgText>
                </g>
              );
            })}
            <g opacity={notSame}>
              <SvgText x={285} y={130} size={64} weight={700} color={COLORS.gold}>
                ≠
              </SvgText>
              <SvgText x={575} y={130} size={64} weight={700} color={COLORS.gold}>
                ≠
              </SvgText>
            </g>
          </svg>
          <div style={{...fadeUp(notSame, 10), marginTop: 10, fontSize: 36, fontWeight: 700, color: COLORS.ink, lineHeight: 1.45, background: COLORS.goldSoft, borderRadius: 14, padding: '14px 22px'}}>
            すべての香料カプセルを、
            <br />
            同じものとして扱うことはできない
          </div>
        </Panel>
      </div>
      <div style={{position: 'absolute', right: 0, bottom: 0}}>
        <CornerTag appear={base}>模式図・縮尺は一定ではない</CornerTag>
      </div>
    </div>
  );
};

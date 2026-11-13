import React from 'react';
import {interpolate} from 'remotion';
import {SvgIcon} from '../../components/Icons';
import {useFocus, useReveal} from '../../components/scene-context';
import {Arrow, CornerTag, SvgText} from '../../components/ui';
import {COLORS} from '../../theme';
import {NaturalFiber, Node, NotSame, Panel, Shard, SvgRug, SyntheticFiber} from './parts';

/* ------------------------------------------------------------------ */
/* 室内のほこりに混じる繊維や破片                                        */
/* ------------------------------------------------------------------ */

const SOURCES = [
  {x: 230, label: '衣類'},
  {x: 650, label: 'カーペット'},
  {x: 1110, label: '家具'},
  {x: 1530, label: '樹脂製品'},
];
const SRC_Y = 120;
const DUST = {x: 880, y: 500, r: 150};

/** 衣類・カーペット・家具・樹脂製品 → 室内のほこり（点線＝混じることがある） */
export const DustSources: React.FC<{steps?: {sources: number}}> = ({steps = {sources: 1}}) => {
  const base = useReveal(0, {duration: 0.7});
  const src = useReveal(steps.sources, {duration: 0.8});
  const arrows = useReveal(steps.sources, {delay: 0.6, duration: 1.2});
  const contents = useReveal(steps.sources, {delay: 1.3, duration: 1.0});
  const ends: [number, number][] = [
    [DUST.x - 128, DUST.y - 92],
    [DUST.x - 52, DUST.y - 146],
    [DUST.x + 52, DUST.y - 146],
    [DUST.x + 128, DUST.y - 92],
  ];
  const k = (i: number) => interpolate(contents, [i * 0.1, 0.5 + i * 0.1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <svg width={1760} height={676} viewBox="0 0 1760 676" style={{position: 'absolute', left: 0, top: 0}}>
        {SOURCES.map((s, i) => (
          <Node key={s.label} x={s.x} y={SRC_Y} r={72} label={s.label} labelSize={34} labelGap={40} appear={src} tone="green">
            {i === 0 ? <SvgIcon name="shirt" x={s.x - 42} y={SRC_Y - 42} size={84} color={COLORS.green} /> : null}
            {i === 1 ? <SvgRug x={s.x - 42} y={SRC_Y - 42} size={84} color={COLORS.green} /> : null}
            {i === 2 ? <SvgIcon name="sofa" x={s.x - 42} y={SRC_Y - 42} size={84} color={COLORS.green} /> : null}
            {i === 3 ? <SvgIcon name="container" x={s.x - 42} y={SRC_Y - 42} size={84} color={COLORS.green} /> : null}
          </Node>
        ))}
        {SOURCES.map((s, i) => (
          <Arrow key={s.label} from={[s.x + (i < 2 ? 40 : -40), SRC_Y + 132]} to={ends[i]} p={arrows} dashed color={COLORS.slate} width={4} bend={i === 0 ? -20 : i === 3 ? 20 : 0} />
        ))}
        {/* ほこり（拡大した模式） */}
        <g opacity={base}>
          <circle cx={DUST.x} cy={DUST.y} r={DUST.r} fill={COLORS.panel} stroke={COLORS.inkSoft} strokeWidth={4} />
          {/* もともとのほこり（灰色の細かな粒） */}
          {[
            [-90, -40],
            [-60, 50],
            [-20, -90],
            [30, 70],
            [80, -30],
            [100, 40],
            [-110, 10],
            [10, 10],
            [50, -80],
          ].map(([dx, dy]) => (
            <circle key={`${dx}-${dy}`} cx={DUST.x + dx} cy={DUST.y + dy} r={6} fill={COLORS.line} />
          ))}
          <SvgText x={DUST.x - DUST.r - 30} y={DUST.y + 10} size={36} weight={700} anchor="end">
            室内のほこり
          </SvgText>
        </g>
        {/* 混じる繊維（細長い線）と破片（角ばった形） */}
        <g>
          <path d={`M${DUST.x - 100} ${DUST.y - 10} c 30 -30 60 20 90 -10`} fill="none" stroke={COLORS.slate} strokeWidth={7} strokeLinecap="round" opacity={k(0)} />
          <path d={`M${DUST.x + 10} ${DUST.y + 40} c 30 -26 50 22 84 -6`} fill="none" stroke={COLORS.green} strokeWidth={7} strokeLinecap="round" opacity={k(1)} />
          <path d={`M${DUST.x - 60} ${DUST.y + 90} c 26 -18 44 14 70 -4`} fill="none" stroke={COLORS.slate} strokeWidth={7} strokeLinecap="round" opacity={k(2)} />
          <Shard x={DUST.x + 40} y={DUST.y - 60} r={16} rot={20} opacity={k(1)} />
          <Shard x={DUST.x - 30} y={DUST.y + 40} r={13} rot={-35} opacity={k(2)} />
          <Shard x={DUST.x + 100} y={DUST.y + 80} r={12} rot={60} opacity={k(3)} />
        </g>
        <g opacity={contents}>
          <SvgText x={DUST.x + DUST.r + 30} y={DUST.y - 20} size={34} weight={700} anchor="start" color={COLORS.slate}>
            細かな繊維や破片が
          </SvgText>
          <SvgText x={DUST.x + DUST.r + 30} y={DUST.y + 28} size={34} weight={700} anchor="start" color={COLORS.slate}>
            混じることがある
          </SvgText>
        </g>
      </svg>
      <div style={{position: 'absolute', left: 0, top: 0}}>
        <CornerTag appear={base}>模式図</CornerTag>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 合成繊維と天然繊維                                                    */
/* ------------------------------------------------------------------ */

const P_W = 790;
const P_H = 610;

/** 合成繊維（なめらかで一様な線）と天然繊維（不規則な線）を形とラベルで区別する */
export const FiberCompare: React.FC<{steps?: {synthetic: number; natural: number}}> = ({steps = {synthetic: 1, natural: 2}}) => {
  const base = useReveal(0, {duration: 0.6});
  const syn = useReveal(steps.synthetic, {duration: 0.8});
  const synDraw = useReveal(steps.synthetic, {delay: 0.2, duration: 1.0});
  const nat = useReveal(steps.natural, {duration: 0.8});
  const natDraw = useReveal(steps.natural, {delay: 0.2, duration: 1.0});
  const natNote = useReveal(steps.natural, {delay: 1.2});
  const fSyn = useFocus((s) => s <= steps.synthetic);
  const fNat = useFocus((s) => s >= steps.natural);

  return (
    <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between'}}>
      <Panel title="ポリエステル・ナイロンなど" tag="合成繊維" tone="slate" width={P_W} height={P_H} appear={syn} focus={fSyn} titleSize={36} dim={0.7}>
        <svg width={734} height={260} viewBox="0 0 734 260" style={{display: 'block', marginTop: 16}}>
          <rect x={0} y={0} width={734} height={260} rx={18} fill={COLORS.bg} />
          <SyntheticFiber d="M60 70 C 230 30, 420 110, 680 60" p={synDraw} />
          <SyntheticFiber d="M80 140 C 260 170, 460 100, 660 150" p={synDraw} />
          <SyntheticFiber d="M50 210 C 220 190, 400 230, 640 200" p={synDraw} />
        </svg>
        <div style={{marginTop: 40, fontSize: 44, fontWeight: 700, color: COLORS.ink}}>
          <span style={{color: COLORS.slate}}>プラスチック</span>の一種
        </div>
      </Panel>

      <div style={{width: 180, alignSelf: 'center', display: 'flex', justifyContent: 'center'}}>
        <NotSame appear={nat} label="区別する" size={88} />
      </div>

      <Panel title="綿・羊毛など" tag="天然繊維" tone="green" width={P_W} height={P_H} appear={nat} focus={fNat} titleSize={36} dim={0.7}>
        <svg width={734} height={260} viewBox="0 0 734 260" style={{display: 'block', marginTop: 16}}>
          <rect x={0} y={0} width={734} height={260} rx={18} fill={COLORS.bg} />
          <NaturalFiber x0={70} y0={70} len={600} tilt={-2} p={natDraw} kind="twist" />
          <NaturalFiber x0={80} y0={140} len={580} tilt={2} p={natDraw} kind="scale" />
          <NaturalFiber x0={60} y0={205} len={600} tilt={-1} p={natDraw} kind="twist" />
        </svg>
        <div style={{marginTop: 40, fontSize: 40, fontWeight: 700, color: COLORS.ink}}>繊維くずを出す</div>
        <div style={{opacity: natNote, marginTop: 22, fontSize: 38, fontWeight: 700, color: COLORS.ink, lineHeight: 1.4}}>
          すべてを<span style={{color: COLORS.green}}>マイクロプラスチック</span>
          <br />
          とは呼ばない
        </div>
      </Panel>

      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center'}}>
        <CornerTag appear={base}>模式図：線の形は区別のための記号</CornerTag>
      </div>
    </div>
  );
};

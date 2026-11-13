import React from 'react';
import {Icon} from '../../components/Icons';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {Arrow, CornerTag} from '../../components/ui';
import {COLORS} from '../../theme';
import {Panel, PanelTitle, Tag, Tri, fragmentPoints} from './parts';

/**
 * マイクロプラスチックと内分泌かく乱物質はどう関係するのか（I5）。
 * 左：プラスチック製品に含まれることがある成分（▲ 原料の残留成分、● 調整する成分）。
 *     その一部（点線の輪）に、内分泌系への影響が問題となる物質がある。
 * 右「ただし」：粒子ごとに含む物質は同じではない／BPA・PFAS などへの曝露は粒子を介するものだけではない。
 * 主張と留保を同じ画面に置く。
 * 「粒子を介して」「粒子以外から」の 2 本の矢印は同じ線種にする（どちらかを従・条件付きに見せない）。
 */
type Steps = {residual: number; additive: number; concern: number; notSame: number; notOnly: number};

const LW = 920;
const RX = 950;
const RW = 1760 - RX;
const PH = 640;
/** 見出しとの余白 */
const TOP = 16;

const TRIS: [number, number][] = [
  [90, 120],
  [300, 190],
  [175, 330],
  [380, 400],
];
const DOTS: [number, number][] = [
  [225, 100],
  [110, 250],
  [345, 300],
  [255, 430],
];
const RINGS: [number, number][] = [
  [300, 190],
  [110, 250],
];

const Dot: React.FC<{x: number; y: number; r?: number; opacity?: number}> = ({x, y, r = 13, opacity = 1}) => (
  <circle cx={x} cy={y} r={r} fill={COLORS.gold} stroke={COLORS.surface} strokeWidth={2} opacity={opacity} />
);

const LegendRow: React.FC<{mark: React.ReactNode; text: string; sub?: string; appear: number; focus: number}> = ({mark, text, sub, appear, focus}) => (
  <div style={{...fadeUp(appear, 10), opacity: appear * (0.55 + 0.45 * focus), display: 'flex', alignItems: 'flex-start', gap: 18}}>
    <svg width={44} height={44} viewBox="0 0 44 44" style={{flexShrink: 0, marginTop: 4}}>
      {mark}
    </svg>
    <div>
      <div style={{fontSize: 36, fontWeight: 700, color: COLORS.ink, lineHeight: 1.4, whiteSpace: 'pre-line'}}>{text}</div>
      {sub ? <div style={{fontSize: 32, fontWeight: 500, color: COLORS.inkSoft, lineHeight: 1.4, whiteSpace: 'nowrap'}}>{sub}</div> : null}
    </div>
  </div>
);

/** 右パネルの一行の結論 */
const Statement: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div style={{fontSize: 34, fontWeight: 700, color: COLORS.ink, lineHeight: 1.4, whiteSpace: 'nowrap'}}>{children}</div>
);

export const PlasticLink: React.FC<{steps?: Steps}> = ({steps = {residual: 1, additive: 2, concern: 3, notSame: 4, notOnly: 5}}) => {
  const base = useReveal(0, {duration: 0.6});
  const res = useReveal(steps.residual);
  const add = useReveal(steps.additive);
  const con = useReveal(steps.concern);
  const right = useReveal(steps.notSame);
  const ns = useReveal(steps.notSame, {delay: 0.3});
  const no = useReveal(steps.notOnly);
  const noArrow = useReveal(steps.notOnly, {delay: 0.3, duration: 0.8});
  const lf = useFocus((s) => s < steps.notSame);
  const fRes = useFocus((s) => s === steps.residual || (s > steps.additive && s < steps.notSame));
  const fAdd = useFocus((s) => s >= steps.additive && s < steps.notSame);
  const fCon = useFocus((s) => s === steps.concern);
  const fNs = useFocus((s) => s === steps.notSame);
  const fNo = useFocus((s) => s >= steps.notOnly);

  return (
    <div style={{position: 'absolute', inset: 0}}>
      {/* ---------- 左：製品に含まれることがある成分 ---------- */}
      <div style={{position: 'absolute', left: 0, top: TOP}}>
        <Panel tone="slate" appear={base} focus={lf} width={LW} height={PH}>
          <div style={{display: 'flex', alignItems: 'center', gap: 18, padding: '22px 34px 0'}}>
            <Icon name="container" size={54} color={COLORS.slate} />
            <PanelTitle size={42}>プラスチック製品</PanelTitle>
          </div>
          <div style={{position: 'absolute', right: 24, top: 24}}>
            <CornerTag>模式図</CornerTag>
          </div>
          <svg width={380} height={420} viewBox="0 0 470 520" style={{position: 'absolute', left: 30, top: 140}}>
            <rect x={10} y={10} width={450} height={490} rx={30} fill={COLORS.slateSoft} stroke={COLORS.slate} strokeWidth={4} />
            {[60, 140, 220, 300, 380, 460].map((y) => (
              <path key={y} d={`M30 ${y} q35 -22 70 0 t70 0 t70 0 t70 0 t70 0 t70 0`} fill="none" stroke="#A9B6C1" strokeWidth={4} strokeLinecap="round" />
            ))}
            <g opacity={res}>
              {TRIS.map(([x, y]) => (
                <Tri key={`${x}-${y}`} x={x} y={y} r={17} />
              ))}
            </g>
            <g opacity={add}>
              {DOTS.map(([x, y]) => (
                <Dot key={`${x}-${y}`} x={x} y={y} r={15} />
              ))}
            </g>
            <g opacity={con}>
              {RINGS.map(([x, y]) => (
                <circle key={`${x}-${y}`} cx={x} cy={y} r={34} fill="none" stroke={COLORS.ink} strokeWidth={4} strokeDasharray="7 6" />
              ))}
            </g>
          </svg>
          <div style={{position: 'absolute', left: 434, right: 24, top: 186, display: 'flex', flexDirection: 'column', gap: 40}}>
            <LegendRow mark={<Tri x={22} y={24} r={17} />} text="原料の残留成分" appear={res} focus={fRes} />
            <LegendRow mark={<Dot x={22} y={22} r={15} />} text="調整する成分" sub="柔らかさ・色・耐久性など" appear={add} focus={fAdd} />
            <LegendRow
              mark={<circle cx={22} cy={22} r={17} fill="none" stroke={COLORS.ink} strokeWidth={3.5} strokeDasharray="5 4" />}
              text={'一部に、内分泌系への\n影響が問題となる物質'}
              appear={con}
              focus={fCon}
            />
          </div>
        </Panel>
      </div>

      {/* ---------- 右：ただし ---------- */}
      <div style={{position: 'absolute', left: RX, top: TOP}}>
        <Panel tone="gold" appear={right} focus={1} width={RW} height={PH}>
          <div style={{padding: '22px 30px 0'}}>
            <Tag tone="gold" filled size={36}>
              ただし
            </Tag>
          </div>
          {/* A：粒子ごとに中身は違う */}
          <div style={{...fadeUp(ns, 10), opacity: ns * (0.55 + 0.45 * fNs), padding: '32px 30px 0'}}>
            <svg width={744} height={116} viewBox="0 0 744 116">
              {[130, 372, 614].map((x, i) => (
                <polygon key={x} points={fragmentPoints(x, 58, 54, 0.8 + i)} fill={COLORS.slateSoft} stroke={COLORS.slate} strokeWidth={4} strokeLinejoin="round" />
              ))}
              <Tri x={112} y={56} r={14} />
              <Dot x={148} y={60} r={12} />
              <Dot x={359} y={54} r={12} />
              <Dot x={389} y={68} r={12} />
            </svg>
            <div style={{marginTop: 16}}>
              <Statement>すべての粒子が、同じ物質を含むわけではない</Statement>
            </div>
          </div>
          <div style={{margin: '40px 30px 0', borderTop: `3px dashed ${COLORS.lineSoft}`, opacity: no}} />
          {/* B：曝露は粒子を介するものだけではない */}
          <div style={{...fadeUp(no, 10), opacity: no * (0.55 + 0.45 * fNo), padding: '36px 30px 0', position: 'relative'}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div style={{display: 'flex', flexDirection: 'column', gap: 30}}>
                <Tag tone="slate" size={32}>
                  粒子を介して
                </Tag>
                <Tag tone="neutral" size={32}>
                  粒子以外から
                </Tag>
              </div>
              <div style={{width: 320, fontSize: 34, fontWeight: 700, color: COLORS.ink, lineHeight: 1.35, textAlign: 'center', border: `3px solid ${COLORS.gold}`, borderRadius: 16, padding: '16px 10px', background: COLORS.surface}}>
                BPA・PFAS
                <br />
                などへの曝露
              </div>
            </div>
            <svg width={744} height={140} viewBox="0 0 744 140" style={{position: 'absolute', left: 30, top: 36, pointerEvents: 'none'}}>
              <Arrow from={[246, 28]} to={[414, 58]} p={noArrow} color={COLORS.slate} width={4} />
              <Arrow from={[246, 108]} to={[414, 80]} p={noArrow} color={COLORS.slate} width={4} />
            </svg>
            <div style={{marginTop: 32}}>
              <Statement>すべてが粒子を介して起こるわけではない</Statement>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
};

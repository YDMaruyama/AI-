import React from 'react';
import {SvgIcon} from '../../components/Icons';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {CornerTag} from '../../components/ui';
import {COLORS} from '../../theme';
import {NeSign, Panel, PanelTitle} from './parts';

/**
 * 接触・吸収・検出・健康への影響を「別々の観察」として並べる（G1）。
 * パネル同士を矢印でつながない（必ず病気へ進む一本道にしない）。
 * 「付いた ≠ 吸収された」「検出 ≠ 影響が生じた」を ≠ で示す。
 */
type Steps = {pairA: number; pairB: number};

const PW = 360;
const GAP = (1760 - PW * 4) / 3;
const PH = 420;
const xOf = (i: number) => i * (PW + GAP);

const SKIN = '#EED9C4';
const SKIN_LINE = '#B88C66';

const Surface: React.FC = () => (
  <g>
    <rect x={20} y={100} width={260} height={64} rx={8} fill={SKIN} />
    <path d="M20 100 Q53 90 85 100 T150 100 T215 100 T280 100" fill="none" stroke={SKIN_LINE} strokeWidth={5} />
  </g>
);

const Dot: React.FC<{x: number; y: number; dashed?: boolean}> = ({x, y, dashed}) => (
  <circle cx={x} cy={y} r={13} fill={dashed ? 'none' : COLORS.gold} stroke={dashed ? COLORS.gold : COLORS.surface} strokeWidth={3} strokeDasharray={dashed ? '5 4' : undefined} />
);

const Illust: React.FC<{kind: 'contact' | 'absorb' | 'detect' | 'effect'}> = ({kind}) => {
  if (kind === 'contact') {
    return (
      <svg width={300} height={170} viewBox="0 0 300 170">
        <Surface />
        <Dot x={95} y={84} />
        <Dot x={150} y={84} />
        <Dot x={205} y={84} />
      </svg>
    );
  }
  if (kind === 'absorb') {
    return (
      <svg width={300} height={170} viewBox="0 0 300 170">
        <Surface />
        <Dot x={110} y={84} dashed />
        <path d="M118 98 Q150 112 160 128" fill="none" stroke={COLORS.slate} strokeWidth={4} strokeDasharray="7 6" strokeLinecap="round" />
        <Dot x={170} y={138} />
      </svg>
    );
  }
  if (kind === 'detect') {
    return (
      <svg width={300} height={170} viewBox="0 0 300 170">
        {/* 試験管（血液などの試料）の模式 */}
        <path d="M110 20 h50 v110 a25 25 0 0 1 -50 0 z" fill={COLORS.surface} stroke={COLORS.inkSoft} strokeWidth={5} strokeLinejoin="round" />
        <path d="M113 80 h44 v50 a22 22 0 0 1 -44 0 z" fill="#E8C9C4" />
        <Dot x={135} y={122} />
        <SvgIcon name="search" x={168} y={52} size={86} color={COLORS.green} />
      </svg>
    );
  }
  return (
    <svg width={300} height={170} viewBox="0 0 300 170">
      <circle cx={150} cy={88} r={74} fill={COLORS.greenSoft} />
      <SvgIcon name="person" x={98} y={36} size={104} color={COLORS.green} />
    </svg>
  );
};

const ITEMS: {kind: 'contact' | 'absorb' | 'detect' | 'effect'; title: string; sub: string}[] = [
  {kind: 'contact', title: '接触', sub: '表面に付いた'},
  {kind: 'absorb', title: '吸収', sub: '体の中に取り込まれた'},
  {kind: 'detect', title: '検出', sub: '血液などで見つかった'},
  {kind: 'effect', title: '健康への影響', sub: '影響が生じた'},
];

export const Observations: React.FC<{steps?: Steps}> = ({steps = {pairA: 1, pairB: 2}}) => {
  const a0 = useReveal(0, {duration: 0.7});
  const a1 = useReveal(0, {delay: 0.25, duration: 0.7});
  const a2 = useReveal(0, {delay: 0.5, duration: 0.7});
  const a3 = useReveal(0, {delay: 0.75, duration: 0.7});
  const appears = [a0, a1, a2, a3];
  const fA = useFocus((s) => s !== steps.pairB);
  const fB = useFocus((s) => s !== steps.pairA);
  const focus = [fA, fA, fB, fB];
  const neA = useReveal(steps.pairA);
  const neB = useReveal(steps.pairB);
  const sepLine = useReveal(0, {delay: 0.9});
  const labelA = useReveal(steps.pairA, {delay: 0.3});
  const labelB = useReveal(steps.pairB, {delay: 0.3});
  const cap = useReveal(0, {delay: 1.1});

  return (
    <div style={{position: 'absolute', inset: 0}}>
      {ITEMS.map((it, i) => (
        <div key={it.kind} style={{position: 'absolute', left: xOf(i), top: 0}}>
          <Panel tone={i < 2 ? 'green' : 'slate'} appear={appears[i]} focus={focus[i]} width={PW} height={PH}>
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 22, gap: 6, textAlign: 'center'}}>
              <Illust kind={it.kind} />
              <PanelTitle size={46}>{it.title}</PanelTitle>
              <div style={{fontSize: 30, fontWeight: 500, color: COLORS.inkSoft, lineHeight: 1.4, padding: '0 16px'}}>{it.sub}</div>
            </div>
          </Panel>
        </div>
      ))}

      {/* ≠（接触と吸収／検出と健康への影響） */}
      <div style={{position: 'absolute', left: PW, width: GAP, top: PH / 2 - 60, display: 'flex', justifyContent: 'center'}}>
        <NeSign appear={neA} size={88} />
      </div>
      <div style={{position: 'absolute', left: xOf(2) + PW, width: GAP, top: PH / 2 - 60, display: 'flex', justifyContent: 'center'}}>
        <NeSign appear={neB} size={88} />
      </div>
      {/* 中央の区切り（矢印ではなく点線） */}
      <div style={{position: 'absolute', left: xOf(1) + PW + GAP / 2 - 1.5, top: 20, height: PH - 40, borderLeft: `3px dashed ${COLORS.line}`, opacity: sepLine}} />

      {/* 対の説明 */}
      <div style={{position: 'absolute', left: 0, width: xOf(1) + PW, top: PH + 26, display: 'flex', justifyContent: 'center'}}>
        <div style={{...fadeUp(labelA, 10), fontSize: 36, fontWeight: 700, color: COLORS.ink, background: COLORS.goldSoft, borderRadius: 14, padding: '8px 28px', whiteSpace: 'nowrap'}}>
          付いた <span style={{color: COLORS.gold}}>≠</span> 吸収された
        </div>
      </div>
      <div style={{position: 'absolute', left: xOf(2), width: xOf(1) + PW, top: PH + 26, display: 'flex', justifyContent: 'center'}}>
        <div style={{...fadeUp(labelB, 10), fontSize: 36, fontWeight: 700, color: COLORS.ink, background: COLORS.goldSoft, borderRadius: 14, padding: '8px 28px', whiteSpace: 'nowrap'}}>
          検出された <span style={{color: COLORS.gold}}>≠</span> 影響が生じた
        </div>
      </div>

      {/* 下段：別々の観察であること */}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 28}}>
        <CornerTag appear={cap} style={{fontSize: 32, fontWeight: 700, color: COLORS.ink, padding: '8px 24px'}}>
          四つは、それぞれ別の観察
        </CornerTag>
      </div>
      <div style={{position: 'absolute', right: 0, bottom: 4}}>
        <CornerTag appear={a0}>模式図</CornerTag>
      </div>
    </div>
  );
};

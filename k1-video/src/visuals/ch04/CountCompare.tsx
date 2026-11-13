import React from 'react';
import {fadeUp, useReveal} from '../../components/scene-context';
import {CornerTag} from '../../components/ui';
import {COLORS} from '../../theme';
import {Fragment, NoteBand, Panel, PanelTitle, Tag} from './parts';

/**
 * 同じ「100個」でも、大きな破片と小さな粒子では重さや表面積が異なる（I2 後半）。
 * 100 個を描かず、数個＋「…」で群を表す模式図。数値は示さない。
 * 中央に「個数 ＝」「重さ ≠」「表面積 ≠」を並べ、最後に「個数だけで比較できない」。
 */
type Steps = {groups: number; differ: number; point: number};

const PW = 620;
const CW = 1760 - PW * 2;
const PH = 450;

const Group: React.FC<{big: boolean}> = ({big}) => (
  <svg width={560} height={290} viewBox="0 0 560 290">
    <rect x={10} y={10} width={540} height={270} rx={28} fill="none" stroke={COLORS.line} strokeWidth={3} strokeDasharray="10 8" />
    {big ? (
      <>
        <Fragment x={110} y={145} r={78} seed={0.6} />
        <Fragment x={260} y={140} r={66} seed={1.7} />
        <Fragment x={395} y={150} r={72} seed={2.5} />
      </>
    ) : (
      <>
        <Fragment x={150} y={140} r={15} seed={0.6} />
        <Fragment x={260} y={156} r={13} seed={1.7} />
        <Fragment x={370} y={136} r={14} seed={2.5} />
      </>
    )}
    <text x={500} y={160} fontSize={56} fontWeight={700} fill={COLORS.inkSoft} textAnchor="middle" dominantBaseline="middle">
      …
    </text>
  </svg>
);

const Row: React.FC<{label: string; sym: string; appear: number}> = ({label, sym, appear}) => (
  <div style={{...fadeUp(appear, 10), display: 'grid', gridTemplateColumns: '220px 110px', alignItems: 'center'}}>
    <div style={{fontSize: 42, fontWeight: 700, color: COLORS.ink, textAlign: 'right'}}>{label}</div>
    <div style={{fontSize: 76, fontWeight: 700, color: sym === '≠' ? COLORS.gold : COLORS.green, textAlign: 'center', lineHeight: 1}}>{sym}</div>
  </div>
);

export const CountCompare: React.FC<{steps?: Steps}> = ({steps = {groups: 1, differ: 2, point: 3}}) => {
  const base = useReveal(0);
  const left = useReveal(steps.groups);
  const right = useReveal(steps.groups, {delay: 0.4});
  const count = useReveal(steps.groups, {delay: 0.9});
  const weight = useReveal(steps.differ);
  const area = useReveal(steps.differ, {delay: 0.5});
  const point = useReveal(steps.point);

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', left: 0, top: 0}}>
        <Panel tone="slate" appear={left} focus={1} width={PW} height={PH}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px 6px'}}>
            <PanelTitle size={44}>大きな破片</PanelTitle>
            <Tag tone="gold" size={38}>
              100個
            </Tag>
          </div>
          <div style={{display: 'flex', justifyContent: 'center'}}>
            <Group big />
          </div>
        </Panel>
      </div>

      <div style={{position: 'absolute', left: PW, width: CW, top: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34}}>
        <Row label="個数" sym="＝" appear={count} />
        <Row label="重さ" sym="≠" appear={weight} />
        <Row label="表面積" sym="≠" appear={area} />
      </div>

      <div style={{position: 'absolute', left: PW + CW, top: 0}}>
        <Panel tone="slate" appear={right} focus={1} width={PW} height={PH}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px 6px'}}>
            <PanelTitle size={44}>小さな粒子</PanelTitle>
            <Tag tone="gold" size={38}>
              100個
            </Tag>
          </div>
          <div style={{display: 'flex', justifyContent: 'center'}}>
            <Group big={false} />
          </div>
        </Panel>
      </div>

      <div style={{position: 'absolute', left: PW, width: CW, top: PH - 56, display: 'flex', justifyContent: 'center'}}>
        <CornerTag appear={base}>模式図</CornerTag>
      </div>

      <div style={{position: 'absolute', left: 0, right: 0, top: PH + 60}}>
        <NoteBand appear={point} label="ポイント" style={{justifyContent: 'center'}}>
          個数だけで、危険度を比較することはできない
        </NoteBand>
      </div>
    </div>
  );
};

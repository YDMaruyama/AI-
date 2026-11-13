import React from 'react';
import {fadeUp, lerp, useReveal} from '../../components/scene-context';
import {Arrow, Pill} from '../../components/ui';
import {COLORS} from '../../theme';
import {useItem} from '../templates/helpers';
import {Tile, VIEW_ORDER, VIEW_WORD, ViewIcon, VignetteKind} from './parts';

/**
 * 三つの視点（上の囲み）を、暮らしの複数の場面（下のタイル）へ広げる。
 * 三語は囲みの中で横に並べるだけで、互いを矢印で結ばない。
 * 囲みからタイルへの細い線は「当てはめる場面が広がる」ことを示す（矢じりなし）。
 * はじめは囲みを中央に置き、最初の場面が出るときに上へ穏やかに移す。
 */
type AreaSpec = {kind: VignetteKind; label: string; step: number};

const W = 1760;
const HUB_W = 1000;
const HUB_H = 150;
const HUB_LEFT = (W - HUB_W) / 2;
const TILE_TOP = 286;
const GAP = 32;

export const ViewsExtend: React.FC<{
  areas: AreaSpec[];
  allStep?: number;
  hubLabel?: string;
  spreadLabel?: string;
  spreadStep?: number;
}> = ({areas, allStep, hubLabel = '三つの視点', spreadLabel, spreadStep}) => {
  const hub = useReveal(0, {duration: 0.7});
  const lift = useReveal(areas.length ? Math.min(...areas.map((a) => a.step)) : 99, {duration: 0.8});
  const hubTop = lerp((676 - HUB_H) / 2, 0, lift);
  const spread = useReveal(spreadStep ?? allStep ?? 99);
  const steps = areas.map((a) => a.step);
  const n = areas.length;
  const tileW = (W - GAP * (n - 1)) / n;

  return (
    <div style={{position: 'absolute', inset: 0}}>
      {/* 当てはめる場面へ広がる線（矢じりなし） */}
      <svg width={W} height={676} viewBox={`0 0 ${W} 676`} style={{position: 'absolute', left: 0, top: 0}}>
        {areas.map((a, i) => (
          <AreaLine key={a.kind} index={i} n={n} step={a.step} tileW={tileW} hubBottom={hubTop + HUB_H} />
        ))}
      </svg>

      {/* 三つの視点の囲み */}
      <div
        style={{
          ...fadeUp(hub),
          position: 'absolute',
          left: HUB_LEFT,
          top: hubTop,
          width: HUB_W,
          height: HUB_H,
          boxSizing: 'border-box',
          background: COLORS.surface,
          border: `4px solid ${COLORS.green}`,
          borderRadius: 26,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <div style={{fontSize: 28, fontWeight: 700, color: COLORS.inkSoft, letterSpacing: '0.1em'}}>{hubLabel}</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 30}}>
          {VIEW_ORDER.map((v, i) => (
            <React.Fragment key={v}>
              {i > 0 ? <div style={{width: 12, height: 12, borderRadius: 6, background: COLORS.gold}} /> : null}
              <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
                <div style={{width: 62, height: 62, borderRadius: 31, background: COLORS.green, color: COLORS.surface, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <ViewIcon view={v} size={42} />
                </div>
                <div style={{fontSize: 44, fontWeight: 700, color: COLORS.ink, letterSpacing: '0.06em'}}>{VIEW_WORD[v]}</div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {spreadLabel ? (
        <div style={{...fadeUp(spread, 8), position: 'absolute', left: 0, right: 0, top: HUB_H + 40, display: 'flex', justifyContent: 'center'}}>
          <Pill tone="gold" size={28}>
            {spreadLabel}
          </Pill>
        </div>
      ) : null}

      {/* 暮らしの場面 */}
      <div style={{position: 'absolute', left: 0, right: 0, top: TILE_TOP, bottom: 0, display: 'flex', gap: GAP}}>
        {areas.map((a, i) => (
          <AreaTile key={a.kind} area={a} index={i} steps={steps} allStep={allStep} />
        ))}
      </div>
    </div>
  );
};

const AreaLine: React.FC<{index: number; n: number; step: number; tileW: number; hubBottom: number}> = ({index, n, step, tileW, hubBottom}) => {
  const p = useReveal(step, {delay: 0.3, duration: 0.7});
  const x0 = W / 2 + (index - (n - 1) / 2) * 140;
  const x1 = index * (tileW + GAP) + tileW / 2;
  // 描き始める前は何も描かない（丸い線端が点として残らないように）
  if (p <= 0.001) return null;
  return <Arrow from={[x0, hubBottom + 2]} to={[x1, TILE_TOP - 4]} p={p} head={false} width={4} color={COLORS.green} opacity={0.75} />;
};

const AreaTile: React.FC<{area: AreaSpec; index: number; steps: number[]; allStep?: number}> = ({area, index, steps, allStep}) => {
  const {appear, focus} = useItem(index, steps, allStep);
  const k = useReveal(area.step, {delay: 0.25, duration: 0.9});
  return <Tile kind={area.kind} label={area.label} appear={appear} focus={focus} k={k} artHeight={230} labelSize={36} />;
};

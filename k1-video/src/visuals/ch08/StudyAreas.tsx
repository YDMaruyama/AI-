import React from 'react';
import {IconName} from '../../components/Icons';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {CornerTag, Pill} from '../../components/ui';
import {COLORS} from '../../theme';
import {Box, Fragment, IconDisc, Molecule} from './parts';

/**
 * M1：調べられている影響の領域（5 つ、矢印で結ばない）と、
 * 「小さなプラスチック粒子そのもの」と「化学物質」を分けて理解すること。
 * 粒子は角ばった破片、化学物質は六角形の分子記号で形を変えて区別する。
 */
type Steps = {areas: number; split: number; sep: number};

const AREAS: {label: string; icon: IconName}[] = [
  {label: '炎症', icon: 'cell'},
  {label: 'ホルモンの働き', icon: 'gland'},
  {label: '生殖・発達', icon: 'sprout'},
  {label: '免疫', icon: 'shield'},
  {label: '肝臓や脂質代謝', icon: 'drop'},
];
const TILE_W = 328;
const TILE_GAP = 30;
const SPLIT_TOP = 292;
const PANEL_W = 760;

const AreaTile: React.FC<{i: number; label: string; icon: IconName; step: number; dimAt: number}> = ({i, label, icon, step, dimAt}) => {
  const p = useReveal(step, {delay: i * 0.22});
  const focus = useFocus((s) => s < dimAt);
  return (
    <div
      style={{
        ...fadeUp(p),
        opacity: p * (0.55 + 0.45 * focus),
        position: 'absolute',
        left: i * (TILE_W + TILE_GAP),
        top: 58,
        width: TILE_W,
        height: 190,
        boxSizing: 'border-box',
        background: COLORS.surface,
        border: `3px solid ${focus > 0.5 ? COLORS.green : COLORS.lineSoft}`,
        borderRadius: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
      }}
    >
      <IconDisc name={icon} size={84} />
      <div style={{fontSize: 36, fontWeight: 700, color: COLORS.ink, whiteSpace: 'nowrap'}}>{label}</div>
    </div>
  );
};

export const StudyAreas: React.FC<{steps?: Steps}> = ({steps = {areas: 1, split: 2, sep: 3}}) => {
  const head = useReveal(0);
  const split = useReveal(steps.split);
  const sep = useReveal(steps.sep);

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{...fadeUp(head), position: 'absolute', left: 0, top: 0, fontSize: 32, fontWeight: 700, color: COLORS.inkSoft}}>
        調べられている影響（例）
      </div>
      {AREAS.map((a, i) => (
        <AreaTile key={a.label} i={i} label={a.label} icon={a.icon} step={steps.areas} dimAt={steps.split} />
      ))}

      {/* 粒子そのもの */}
      <Box left={0} top={SPLIT_TOP} width={PANEL_W} height={676 - SPLIT_TOP} appear={split} topBar={COLORS.slate} borderColor={COLORS.slate}>
        <div style={{padding: '20px 32px 0', display: 'flex', alignItems: 'center', gap: 16}}>
          <Pill tone="slate" size={28}>粒子</Pill>
          <div style={{fontSize: 38, fontWeight: 700, color: COLORS.ink, whiteSpace: 'nowrap'}}>小さなプラスチック粒子そのもの</div>
        </div>
        <svg width={PANEL_W - 6} height={250} viewBox={`0 0 ${PANEL_W - 6} 250`} style={{display: 'block'}}>
          <Fragment x={210} y={120} r={46} rot={8} />
          <Fragment x={340} y={150} r={30} rot={-30} />
          <Fragment x={450} y={100} r={38} rot={50} />
          <Fragment x={560} y={150} r={24} rot={20} />
        </svg>
      </Box>

      {/* 化学物質 */}
      <Box left={1760 - PANEL_W} top={SPLIT_TOP} width={PANEL_W} height={676 - SPLIT_TOP} appear={split} topBar={COLORS.gold} borderColor={COLORS.gold}>
        <div style={{padding: '20px 32px 0', display: 'flex', alignItems: 'center', gap: 16}}>
          <Pill tone="gold" size={28}>化学物質</Pill>
          <div style={{fontSize: 36, fontWeight: 700, color: COLORS.ink, whiteSpace: 'nowrap'}}>BPA・フタル酸エステルなど</div>
        </div>
        <svg width={PANEL_W - 6} height={250} viewBox={`0 0 ${PANEL_W - 6} 250`} style={{display: 'block'}}>
          <Molecule x={210} y={130} r={30} />
          <Molecule x={380} y={110} r={30} />
          <Molecule x={550} y={140} r={30} />
        </svg>
      </Box>

      {/* ≠ 分けて理解する */}
      <div
        style={{
          ...fadeUp(sep, 10),
          position: 'absolute',
          left: PANEL_W,
          width: 1760 - PANEL_W * 2,
          top: SPLIT_TOP + 60,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div style={{fontSize: 100, fontWeight: 700, color: COLORS.gold, lineHeight: 1}}>≠</div>
        <div style={{fontSize: 30, fontWeight: 700, color: COLORS.gold, textAlign: 'center', lineHeight: 1.35}}>
          分けて
          <br />
          理解する
        </div>
      </div>
      <div style={{position: 'absolute', left: PANEL_W, width: 1760 - PANEL_W * 2, bottom: 6, display: 'flex', justifyContent: 'center'}}>
        <CornerTag appear={split} style={{padding: '6px 10px'}}>
          模式図
        </CornerTag>
      </div>
    </div>
  );
};

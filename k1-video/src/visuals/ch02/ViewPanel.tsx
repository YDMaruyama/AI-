import React from 'react';
import {fadeUp, lerp, useReveal} from '../../components/scene-context';
import {Pill} from '../../components/ui';
import {COLORS} from '../../theme';
import {Rich, useItem} from '../templates/helpers';
import {Tile, VIEW_ORDER, VIEW_WORD, ViewIcon, ViewKey, VignetteKind} from './parts';

/**
 * 三つの視点を「タブ」として横に並べ、話している視点のタブだけを下の面とつなげて開く。
 * 視点のタブは章の進行に合わせて一枚ずつ加わる（避ける → 防ぐ → 排出する）。
 * タブは並列の見出しであり、矢印で結ばない（一連の手順や体内の排出経路として描かない）。
 *
 * 面の中：はじめは視点の記号と意味（短い言い換え）を中央に大きく示し、最初の場面が出るときに
 * 意味の文を面の上部へ穏やかに移す。下に暮らしの場面のタイル（挿絵＋短いラベル）。
 * タイルは tiles[i].step で現れ、話しているタイルだけ強調（allStep 以降は全部）。
 */
type TileSpec = {kind: VignetteKind; label: string; step: number; flex?: number};

const W = 1760;
const TAB_W = 560;
const TAB_GAP = (W - TAB_W * 3) / 2;
const TAB_H = 112;
const BORDER = 4;
const PANEL_TOP = TAB_H - BORDER;

const Tab: React.FC<{view: ViewKey; index: number; active: boolean; appear: number}> = ({view, index, active, appear}) => {
  const left = index * (TAB_W + TAB_GAP);
  if (active) {
    return (
      <div
        style={{
          ...fadeUp(appear, 12),
          position: 'absolute',
          left,
          top: 0,
          width: TAB_W,
          height: TAB_H + BORDER,
          boxSizing: 'border-box',
          background: COLORS.surface,
          border: `${BORDER}px solid ${COLORS.green}`,
          borderBottom: 'none',
          borderRadius: '22px 22px 0 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 22,
          paddingBottom: BORDER,
        }}
      >
        <div style={{width: 72, height: 72, borderRadius: 36, background: COLORS.green, color: COLORS.surface, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <ViewIcon view={view} size={48} />
        </div>
        <div style={{fontSize: 50, fontWeight: 700, color: COLORS.ink, letterSpacing: '0.08em'}}>{VIEW_WORD[view]}</div>
      </div>
    );
  }
  return (
    <div
      style={{
        ...fadeUp(appear, 12),
        position: 'absolute',
        left,
        top: 18,
        width: TAB_W,
        height: PANEL_TOP - 18,
        boxSizing: 'border-box',
        background: COLORS.panel,
        border: `3px solid ${COLORS.lineSoft}`,
        borderBottom: 'none',
        borderRadius: '20px 20px 0 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
      }}
    >
      <div style={{width: 60, height: 60, borderRadius: 30, background: COLORS.surface, color: COLORS.inkSoft, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <ViewIcon view={view} size={40} />
      </div>
      <div style={{fontSize: 42, fontWeight: 700, color: COLORS.inkSoft, letterSpacing: '0.08em'}}>{VIEW_WORD[view]}</div>
    </div>
  );
};

const TileCell: React.FC<{tile: TileSpec; index: number; steps: number[]; allStep?: number; artHeight: number; delay: number}> = ({
  tile,
  index,
  steps,
  allStep,
  artHeight,
  delay,
}) => {
  const {appear, focus} = useItem(index, steps, allStep, delay);
  const k = useReveal(tile.step, {delay: delay + 0.25, duration: 1.1});
  return <Tile kind={tile.kind} label={tile.label} appear={appear} focus={focus} k={k} flex={tile.flex ?? 1} artHeight={artHeight} />;
};

/** 面の内側（枠と余白を除いた）大きさ */
const INNER_H = 676 - PANEL_TOP - BORDER * 2 - 26 * 2;
const DEF_LARGE = 44;
const DEF_SMALL = 38;
const HERO_ICON = 150;
const DEF_LINE = DEF_LARGE * 1.45;
const HERO_TOP = (INNER_H - (HERO_ICON + 30 + DEF_LINE)) / 2;
const LABEL_TOP = DEF_LINE * (DEF_SMALL / DEF_LARGE) + 14;
const TILES_TOP = LABEL_TOP + 46 + 16;

export const ViewPanel: React.FC<{
  view: ViewKey;
  /** 視点の意味（**強調** 可）。DEF_LARGE で 1 行に収まる長さにする */
  definition: string;
  defStep?: number;
  /** タイル列の上に置く小さなラベル（例：たとえば） */
  sceneLabel?: string;
  tiles: TileSpec[];
  allStep?: number;
  artHeight?: number;
}> = ({view, definition, defStep = 1, sceneLabel, tiles, allStep, artHeight = 224}) => {
  const idx = VIEW_ORDER.indexOf(view);
  const firstTile = tiles.length ? tiles[0].step : 99;
  const tabIn = useReveal(0, {delay: 0.1, duration: 0.7});
  const panelIn = useReveal(0, {duration: 0.6});
  const heroIcon = useReveal(0, {delay: 0.3, duration: 0.7});
  const def = useReveal(defStep);
  // 最初の場面が出るとき、意味の文を面の上部へ穏やかに移して縮める
  const move = useReveal(firstTile, {duration: 0.9});
  const lab = useReveal(firstTile, {delay: 0.45});
  const steps = tiles.map((t) => t.step);
  const defTop = lerp(HERO_TOP + HERO_ICON + 30, 0, move);
  const defScale = lerp(1, DEF_SMALL / DEF_LARGE, move);

  return (
    <div style={{position: 'absolute', inset: 0}}>
      {/* 開いている視点の面 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: PANEL_TOP,
          bottom: 0,
          opacity: panelIn,
          boxSizing: 'border-box',
          background: COLORS.surface,
          border: `${BORDER}px solid ${COLORS.green}`,
          borderRadius: 22,
          borderTopLeftRadius: idx === 0 ? 0 : 22,
          borderTopRightRadius: idx === VIEW_ORDER.length - 1 ? 0 : 22,
        }}
      >
        <div style={{position: 'absolute', left: 36, right: 36, top: 26, bottom: 26}}>
          {/* 視点の記号（意味の文が上へ移ると消える） */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: HERO_TOP - move * 40,
              display: 'flex',
              justifyContent: 'center',
              opacity: heroIcon * Math.max(0, 1 - move * 2.5),
            }}
          >
            <div style={{width: HERO_ICON, height: HERO_ICON, borderRadius: HERO_ICON / 2, background: COLORS.greenSoft, color: COLORS.green, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <ViewIcon view={view} size={96} />
            </div>
          </div>

          {/* 視点の意味 */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: defTop,
              opacity: def,
              transform: `translateY(${(1 - def) * 16}px) scale(${defScale})`,
              transformOrigin: 'top center',
              textAlign: 'center',
              fontSize: DEF_LARGE,
              fontWeight: 700,
              color: COLORS.ink,
              lineHeight: 1.45,
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap',
            }}
          >
            <Rich text={definition} color={COLORS.green} />
          </div>

          {sceneLabel ? (
            <div style={{...fadeUp(lab, 10), position: 'absolute', left: 0, right: 0, top: LABEL_TOP, display: 'flex', justifyContent: 'center'}}>
              <Pill tone="gold" size={28}>
                {sceneLabel}
              </Pill>
            </div>
          ) : null}

          <div style={{position: 'absolute', left: 0, right: 0, top: TILES_TOP, bottom: 0, display: 'flex', gap: 26}}>
            {tiles.map((t, i) => (
              <TileCell key={t.kind} tile={t} index={i} steps={steps} allStep={allStep} artHeight={artHeight} delay={0.45} />
            ))}
          </div>
        </div>
      </div>

      {/* タブ：これまでに出た視点（読める濃さ）と、いま話している視点 */}
      {VIEW_ORDER.map((v, i) => (i > idx ? null : <Tab key={v} view={v} index={i} active={i === idx} appear={i === idx ? tabIn : 1} />))}
    </div>
  );
};

import React from 'react';
import {useFocus, useReveal} from '../../components/scene-context';
import {CornerTag, SvgPill, SvgText} from '../../components/ui';
import {COLORS} from '../../theme';
import {Fragment} from './parts';

/**
 * マイクロプラスチックとナノプラスチックの大きさの模式図（I1）。
 * 左：5 mm の目盛りと、それより小さい粒子（一般に 5 mm 未満）
 * 右：拡大した枠の中に、さらに小さいナノプラスチック。1 µm の目盛りは右端を点線にして
 *     「研究によって境界は異なる」ことを示す。
 * 左右で縮尺が大きく異なるため「模式図・縮尺は一定ではない」を常に表示する。
 */
type Steps = {micro: number; nano: number; boundary: number; unit: number};

const BAR = {x0: 80, x1: 720, y: 170};
const ZOOM = {x: 668, y: 362, s: 30};
const FRAME = {x: 960, y: 80, w: 780, h: 440};
const NBAR = {x0: 1060, x1: 1620, y: 230};

export const SizeScale: React.FC<{steps?: Steps}> = ({steps = {micro: 1, nano: 2, boundary: 3, unit: 4}}) => {
  const base = useReveal(0, {duration: 0.6});
  const micro = useReveal(steps.micro, {duration: 0.8});
  const microLabel = useReveal(steps.micro, {delay: 0.6});
  const zoom = useReveal(steps.nano, {duration: 0.9});
  const nano = useReveal(steps.nano, {delay: 0.5, duration: 0.8});
  const bound = useReveal(steps.boundary, {duration: 0.8});
  const boundLabel = useReveal(steps.boundary, {delay: 0.6});
  const unit = useReveal(steps.unit);
  const lf = useFocus((s) => s <= steps.micro || s >= steps.unit);
  const rf = useFocus((s) => s === 0 || (s >= steps.nano && s < steps.unit) || s >= steps.unit);
  const lo = 0.5 + 0.5 * lf;
  const ro = 0.5 + 0.5 * rf;

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <svg width={1760} height={676} viewBox="0 0 1760 676" style={{position: 'absolute', left: 0, top: 0}}>
        {/* ---------- 左：マイクロプラスチック ---------- */}
        <g opacity={micro * lo}>
          <SvgPill x={40} y={52} anchor="start" text="マイクロプラスチック" size={36} fill={COLORS.slate} />
          {/* 5 mm の目盛り */}
          <line x1={BAR.x0} y1={BAR.y} x2={BAR.x1} y2={BAR.y} stroke={COLORS.ink} strokeWidth={5} />
          <line x1={BAR.x0} y1={BAR.y - 18} x2={BAR.x0} y2={BAR.y + 18} stroke={COLORS.ink} strokeWidth={5} />
          <line x1={BAR.x1} y1={BAR.y - 18} x2={BAR.x1} y2={BAR.y + 18} stroke={COLORS.ink} strokeWidth={5} />
          <SvgText x={(BAR.x0 + BAR.x1) / 2} y={BAR.y - 38} size={38} weight={700}>
            5 mm
          </SvgText>
          {/* 5 mm より小さい粒子（形はさまざま） */}
          <Fragment x={170} y={300} r={78} seed={0.4} />
          <Fragment x={350} y={292} r={48} seed={1.3} />
          <Fragment x={480} y={318} r={28} seed={2.2} />
          <path d="M540 268 q20 -18 40 0 t40 0 t40 0" fill="none" stroke={COLORS.slate} strokeWidth={9} strokeLinecap="round" />
          <Fragment x={590} y={340} r={14} seed={3.1} />
          <circle cx={ZOOM.x + 6} cy={ZOOM.y + 2} r={3.5} fill={COLORS.gold} />
          <circle cx={ZOOM.x - 5} cy={ZOOM.y - 4} r={2.5} fill={COLORS.gold} />
        </g>
        <g opacity={microLabel * lo}>
          <SvgText x={400} y={440} size={42} weight={700}>
            一般に 5 mm未満
          </SvgText>
        </g>

        {/* ---------- 拡大の枠線 ---------- */}
        <g opacity={zoom}>
          <rect x={ZOOM.x - ZOOM.s / 2} y={ZOOM.y - ZOOM.s / 2} width={ZOOM.s} height={ZOOM.s} fill="none" stroke={COLORS.gold} strokeWidth={3} />
          <line x1={ZOOM.x + ZOOM.s / 2} y1={ZOOM.y - ZOOM.s / 2} x2={FRAME.x} y2={FRAME.y} stroke={COLORS.gold} strokeWidth={2.5} strokeDasharray="8 7" />
          <line x1={ZOOM.x + ZOOM.s / 2} y1={ZOOM.y + ZOOM.s / 2} x2={FRAME.x} y2={FRAME.y + FRAME.h} stroke={COLORS.gold} strokeWidth={2.5} strokeDasharray="8 7" />
        </g>

        {/* ---------- 右：ナノプラスチック（拡大） ---------- */}
        <g opacity={zoom * ro}>
          <rect x={FRAME.x} y={FRAME.y} width={FRAME.w} height={FRAME.h} rx={20} fill={COLORS.surface} stroke={COLORS.gold} strokeWidth={4} />
          <SvgPill x={FRAME.x + 30} y={FRAME.y + 50} anchor="start" text="ナノプラスチック" size={36} fill={COLORS.gold} />
          <SvgText x={FRAME.x + 420} y={FRAME.y + 52} size={34} weight={700} color={COLORS.inkSoft} anchor="start">
            さらに小さいもの
          </SvgText>
        </g>
        <g opacity={nano * ro}>
          <Fragment x={1110} y={330} r={26} seed={0.7} fill={COLORS.gold} />
          <Fragment x={1210} y={350} r={16} seed={1.9} fill={COLORS.gold} />
          <circle cx={1300} cy={325} r={11} fill={COLORS.gold} />
          <Fragment x={1390} y={348} r={20} seed={2.6} fill={COLORS.gold} />
          <circle cx={1470} cy={330} r={7} fill={COLORS.gold} />
          <Fragment x={1545} y={322} r={13} seed={0.2} fill={COLORS.gold} />
          <circle cx={1615} cy={348} r={5} fill={COLORS.gold} />
        </g>
        {/* 1 µm の目盛り：右端は点線（境界は研究によって異なる） */}
        <g opacity={bound * ro}>
          <line x1={NBAR.x0} y1={NBAR.y} x2={NBAR.x1 - 40} y2={NBAR.y} stroke={COLORS.ink} strokeWidth={5} />
          <line x1={NBAR.x1 - 40} y1={NBAR.y} x2={NBAR.x1 + 40} y2={NBAR.y} stroke={COLORS.ink} strokeWidth={5} strokeDasharray="8 8" />
          <line x1={NBAR.x0} y1={NBAR.y - 18} x2={NBAR.x0} y2={NBAR.y + 18} stroke={COLORS.ink} strokeWidth={5} />
          <line x1={NBAR.x1} y1={NBAR.y - 24} x2={NBAR.x1} y2={NBAR.y + 24} stroke={COLORS.ink} strokeWidth={5} strokeDasharray="6 6" />
          <SvgText x={(NBAR.x0 + NBAR.x1) / 2} y={NBAR.y - 34} size={38} weight={700}>
            1 µm
          </SvgText>
        </g>
        <g opacity={boundLabel * ro}>
          <SvgText x={FRAME.x + FRAME.w / 2} y={412} size={36} weight={700}>
            1 µm未満として扱うことがある
          </SvgText>
          <SvgPill x={FRAME.x + FRAME.w / 2} y={472} text="細かな境界は研究によって異なる" size={30} fill={COLORS.surface} color={COLORS.slate} stroke={COLORS.slate} dashed />
        </g>

        {/* ---------- 下：単位 ---------- */}
        <g opacity={unit}>
          <rect x={480} y={566} width={800} height={92} rx={20} fill={COLORS.goldSoft} stroke={COLORS.gold} strokeWidth={3} />
          <SvgText x={880} y={613} size={46} weight={700}>
            1 µm ＝ 1 mm の 1,000分の1
          </SvgText>
        </g>
      </svg>
      <div style={{position: 'absolute', right: 0, top: 0}}>
        <CornerTag appear={base}>模式図・縮尺は一定ではない</CornerTag>
      </div>
    </div>
  );
};

import React from 'react';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {CornerTag, SvgPill, SvgText} from '../../components/ui';
import {COLORS} from '../../theme';

/**
 * 量に加えて時期も大切（原文 K7）。
 * - 時間の帯：胎児期・乳幼児期・その後の時期（長さは模式で、実際の期間の比ではない）
 * - 「体の仕組みが作られる時期」の括弧（「など」を表すため右端は点線で開いておく）
 * - 同じ形の曝露の帯（＝同じ物質・同じ量）を、時期のちがい（位置）と期間のちがい（長さ）で並べ、
 *   右に「影響が変わる可能性」。どちらが強い・弱いといった結果は描かない。
 */
type Steps = {window: number; rows: number; result: number};

const X0 = 320;
const X1 = 720;
const X2 = 1120;
const X3 = 1560;
const BAND = {y: 250, h: 72};
const LEGEND_Y = 372;
const ROW1 = 470;
const ROW2A = 550;
const ROW2B = 604;
const BAR_H = 30;
/** 結果（影響が変わる可能性）の括弧と枠の位置 */
const BRACE_X = 1404;
const RESULT_X = 1460;

const Segment: React.FC<{x0: number; x1: number; label: string; fill: string; stroke: string; color: string; bold?: boolean}> = ({
  x0,
  x1,
  label,
  fill,
  stroke,
  color,
  bold = true,
}) => (
  <g>
    <rect x={x0} y={BAND.y} width={x1 - x0} height={BAND.h} fill={fill} stroke={stroke} strokeWidth={3} />
    <SvgText x={(x0 + x1) / 2} y={BAND.y + BAND.h / 2 + 1} size={38} weight={bold ? 700 : 500} color={color}>
      {label}
    </SvgText>
  </g>
);

/** 曝露の帯（同じ物質・同じ量を同じ形で表す） */
const Bar: React.FC<{x0: number; x1: number; y: number; opacity: number}> = ({x0, x1, y, opacity}) => (
  <rect x={x0} y={y - BAR_H / 2} width={x1 - x0} height={BAR_H} rx={BAR_H / 2} fill={COLORS.gold} stroke={COLORS.surface} strokeWidth={3} opacity={opacity} />
);

export const TimingWindow: React.FC<{steps?: Steps}> = ({steps = {window: 1, rows: 2, result: 3}}) => {
  const base = useReveal(0, {duration: 0.8});
  const win = useReveal(steps.window, {duration: 0.9});
  const winFocus = useFocus((s) => s === steps.window);
  const rows = useReveal(steps.rows, {duration: 0.8});
  const row2 = useReveal(steps.rows, {delay: 0.6, duration: 0.8});
  const result = useReveal(steps.result, {duration: 0.8});

  const early = winFocus > 0.5 ? COLORS.greenSoft : '#E7EFE9';
  // 区切りの補助線（凡例の下から、帯の区切りと同じ位置に）
  const guide = (x: number) => <line x1={x} y1={LEGEND_Y + 54} x2={x} y2={ROW2B + 34} stroke={COLORS.line} strokeWidth={2} strokeDasharray="6 8" />;

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <svg width={1760} height={676} viewBox="0 0 1760 676" style={{position: 'absolute', left: 0, top: 0}}>
        {/* 時間の帯 */}
        <g opacity={base}>
          <g opacity={rows}>
            {guide(X1)}
            {guide(X2)}
          </g>
          <Segment x0={X0} x1={X1} label="胎児期" fill={win > 0 ? early : COLORS.surface} stroke={COLORS.green} color={COLORS.ink} />
          <Segment x0={X1} x1={X2} label="乳幼児期" fill={win > 0 ? early : COLORS.surface} stroke={COLORS.green} color={COLORS.ink} />
          <Segment x0={X2} x1={X3} label="その後の時期" fill={COLORS.panel} stroke={COLORS.line} color={COLORS.inkSoft} bold={false} />
          {/* 時間の向き */}
          <path d={`M${X3} ${BAND.y} L${X3 + 70} ${BAND.y + BAND.h / 2} L${X3} ${BAND.y + BAND.h}`} fill={COLORS.panel} stroke={COLORS.line} strokeWidth={3} strokeLinejoin="round" />
          <SvgText x={X3 + 40} y={BAND.y + BAND.h + 36} size={28} weight={500} color={COLORS.inkSoft}>
            時間
          </SvgText>
        </g>

        {/* 体の仕組みが作られる時期 */}
        <g opacity={win * (0.6 + 0.4 * winFocus)}>
          <path d={`M${X0} ${BAND.y - 18} V${BAND.y - 46} H${X2}`} fill="none" stroke={COLORS.green} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
          <path d={`M${X2} ${BAND.y - 46} H${X2 + 120}`} fill="none" stroke={COLORS.green} strokeWidth={5} strokeLinecap="round" strokeDasharray="10 12" />
          <SvgText x={X0} y={BAND.y - 92} size={38} weight={700} color={COLORS.greenDeep} anchor="start">
            体の仕組みが作られる時期
          </SvgText>
          <SvgPill x={X0 + 520} y={BAND.y - 92} text="特に注意が必要" size={30} anchor="start" fill={COLORS.green} color={COLORS.surface} />
        </g>

        {/* 時期のちがい・期間のちがい */}
        <g opacity={rows}>
          <SvgText x={X0 - 30} y={ROW1} size={34} weight={700} anchor="end">
            時期のちがい
          </SvgText>
          <Bar x0={420} x1={560} y={ROW1} opacity={1} />
          <Bar x0={1200} x1={1340} y={ROW1} opacity={1} />
        </g>
        <g opacity={row2}>
          <SvgText x={X0 - 30} y={(ROW2A + ROW2B) / 2} size={34} weight={700} anchor="end">
            期間のちがい
          </SvgText>
          <Bar x0={800} x1={940} y={ROW2A} opacity={1} />
          <Bar x0={800} x1={1340} y={ROW2B} opacity={1} />
        </g>

        {/* 結果：影響が変わる可能性 */}
        <g opacity={result}>
          <path
            d={`M${BRACE_X} ${ROW1 - 24} q26 0 26 26 V${(ROW1 + ROW2B) / 2 - 18} q0 18 18 18 q-18 0 -18 18 V${ROW2B - 2} q0 26 -26 26`}
            fill="none"
            stroke={COLORS.gold}
            strokeWidth={4}
            strokeLinecap="round"
          />
        </g>
      </svg>

      {/* 凡例：同じ形の帯＝同じ物質・同じ量 */}
      <div style={{...fadeUp(rows), position: 'absolute', left: X0, top: LEGEND_Y - 18, display: 'flex', alignItems: 'center', gap: 14, fontSize: 30, fontWeight: 700, color: COLORS.ink}}>
        <svg width={92} height={34} viewBox="0 0 92 34">
          <rect x={3} y={3} width={86} height={28} rx={14} fill={COLORS.gold} />
        </svg>
        曝露（同じ物質・同じ量）
      </div>

      <div
        style={{
          ...fadeUp(result),
          position: 'absolute',
          left: RESULT_X,
          top: (ROW1 + ROW2B) / 2 - 72,
          width: 1760 - RESULT_X - 10,
          boxSizing: 'border-box',
          background: COLORS.goldSoft,
          border: `3px solid ${COLORS.gold}`,
          borderRadius: 18,
          padding: '18px 22px',
          fontSize: 36,
          fontWeight: 700,
          lineHeight: 1.4,
          color: COLORS.ink,
          textAlign: 'center',
        }}
      >
        影響が変わる
        <br />
        可能性がある
      </div>

      <div style={{position: 'absolute', right: 0, top: 0}}>
        <CornerTag appear={base}>模式図・長さは実際の期間の比ではない</CornerTag>
      </div>
    </div>
  );
};

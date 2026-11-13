import React from 'react';
import {Icon, IconName, SvgIcon} from '../../components/Icons';
import {dimOpacity, drawDash, fadeUp, lerp, useFocus, useReveal} from '../../components/scene-context';
import {Pill} from '../../components/ui';
import {COLORS} from '../../theme';
import {seg} from './parts';

/**
 * 上の帯：「一度行って終える」（印が一つだけで、すぐ閉じる短い線）。
 *   はじめは中央に置き、次の段階で上へ穏やかに移って読める濃さに下がる。
 * 下の帯：「自分の暮らしを知り（左の丸）、続けられる選択を重ねる（右へ続く線と印）」。
 *   印は順に一つずつ加わり、出そろったら止まる（常時の動きはない）。右端の点は「この先も続く」。
 * 量・効果の大小は表さない。
 */
type Steps = {once: number; know: number; choices: number};

const W = 1760;
const H = 676;
const BAND_A_H = 196;
const BAND_B_TOP = 232;
const PATH_Y = 452;
const NODE_X = 210;
const NODE_R = 96;
const PATH_X0 = NODE_X + NODE_R + 12;
const PATH_X1 = 1640;
const MARKS: IconName[] = ['bowl', 'hand', 'moon', 'heart', 'window', 'label'];
const MARK = 100;

export const KeepChoosing: React.FC<{
  steps?: Steps;
  onceText?: string;
  notLabel?: string;
  knowText?: string;
  choiceText?: string;
}> = ({
  steps = {once: 0, know: 1, choices: 2},
  onceText = '一度行って終える',
  notLabel = 'ではなく',
  knowText = '自分の暮らしを知る',
  choiceText = '続けられる選択を重ねる',
}) => {
  const once = useReveal(steps.once, {delay: 0.2, duration: 0.7});
  const onceFocus = useFocus((s) => s < steps.know);
  const lift = useReveal(steps.know, {duration: 0.9});
  const know = useReveal(steps.know, {delay: 0.35, duration: 0.7});
  const path = useReveal(steps.choices, {duration: 2.6});
  const choiceLabel = useReveal(steps.choices, {delay: 0.2});
  const span = PATH_X1 - PATH_X0;
  const markX = (i: number) => PATH_X0 + 110 + i * 205;
  const bandATop = lerp((H - BAND_A_H) / 2, 0, lift);

  return (
    <div style={{position: 'absolute', inset: 0}}>
      {/* 下の帯：続けられる選択を重ねる */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: BAND_B_TOP,
          bottom: 0,
          opacity: know,
          boxSizing: 'border-box',
          background: COLORS.surface,
          border: `3px solid ${COLORS.green}`,
          borderRadius: 22,
        }}
      />
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
        {path > 0.001 ? (
        <line
          x1={PATH_X0}
          y1={PATH_Y}
          x2={PATH_X1}
          y2={PATH_Y}
          stroke={COLORS.green}
          strokeWidth={6}
          strokeLinecap="round"
          {...drawDash(seg(path, 0, 0.75), span)}
        />
        ) : null}
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={PATH_X1 + 34 + i * 28} cy={PATH_Y} r={7} fill={COLORS.green} opacity={seg(path, 0.8 + i * 0.05, 0.9 + i * 0.05)} />
        ))}
        {MARKS.map((m, i) => {
          const o = seg(path, 0.06 + i * 0.11, 0.2 + i * 0.11);
          const x = markX(i);
          return (
            <g key={m} opacity={o} transform={`translate(0 ${(1 - o) * 14})`}>
              <rect x={x - MARK / 2} y={PATH_Y - MARK / 2} width={MARK} height={MARK} rx={22} fill={COLORS.surface} stroke={COLORS.green} strokeWidth={4} />
              <SvgIcon name={m} x={x - 32} y={PATH_Y - 32} size={64} color={COLORS.green} />
            </g>
          );
        })}
      </svg>

      {/* 自分の暮らしを知る（起点の丸） */}
      <div
        style={{
          ...fadeUp(know),
          position: 'absolute',
          left: NODE_X - 190,
          width: 380,
          top: PATH_Y - NODE_R,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: NODE_R * 2,
            height: NODE_R * 2,
            borderRadius: NODE_R,
            boxSizing: 'border-box',
            background: COLORS.greenSoft,
            border: `5px solid ${COLORS.green}`,
            color: COLORS.green,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="home" size={100} />
          <div
            style={{
              position: 'absolute',
              right: -8,
              bottom: -8,
              width: 74,
              height: 74,
              borderRadius: 37,
              boxSizing: 'border-box',
              background: COLORS.surface,
              border: `4px solid ${COLORS.green}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="search" size={44} />
          </div>
        </div>
        <div style={{fontSize: 38, fontWeight: 700, color: COLORS.ink, whiteSpace: 'nowrap'}}>{knowText}</div>
      </div>

      {/* 続けられる選択を重ねる（ラベル） */}
      <div
        style={{
          ...fadeUp(choiceLabel),
          position: 'absolute',
          left: PATH_X0 + 40,
          right: 0,
          top: PATH_Y - 152,
          display: 'flex',
          justifyContent: 'center',
          fontSize: 46,
          fontWeight: 700,
          color: COLORS.greenDeep,
          letterSpacing: '0.04em',
        }}
      >
        {choiceText}
      </div>

      {/* 上の帯：一度行って終える（短く閉じた線） */}
      <div
        style={{
          ...fadeUp(once),
          opacity: once * dimOpacity(onceFocus, 0.5),
          position: 'absolute',
          left: 0,
          right: 0,
          top: bandATop,
          height: BAND_A_H,
          boxSizing: 'border-box',
          border: `3px dashed ${COLORS.line}`,
          borderRadius: 22,
          background: COLORS.panel,
          display: 'flex',
          alignItems: 'center',
          gap: 34,
          paddingLeft: NODE_X - MARK / 2 - 3,
        }}
      >
        <svg width={400} height={110} viewBox="0 0 400 110" style={{flexShrink: 0}}>
          <rect x={2} y={5} width={MARK} height={MARK} rx={22} fill={COLORS.surface} stroke={COLORS.slate} strokeWidth={4} />
          <SvgIcon name="check" x={20} y={23} size={64} color={COLORS.slate} />
          <line x1={106} y1={55} x2={366} y2={55} stroke={COLORS.slate} strokeWidth={6} strokeLinecap="round" />
          <line x1={384} y1={17} x2={384} y2={93} stroke={COLORS.slate} strokeWidth={10} strokeLinecap="round" />
        </svg>
        <div style={{fontSize: 46, fontWeight: 700, color: COLORS.inkSoft, letterSpacing: '0.04em', whiteSpace: 'nowrap'}}>{onceText}</div>
        <Pill tone="slate" filled size={32}>
          {notLabel}
        </Pill>
      </div>
    </div>
  );
};

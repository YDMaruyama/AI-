import React from 'react';
import {Icon, IconName} from '../../components/Icons';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {COLORS} from '../../theme';

/**
 * 量と影響：一直線とは限らない反応の読み方（原文 K8 前半）。
 * 架空のデータで用量反応のグラフを描かず、文字カードで示す。
 *  上段：研究されている内容
 *  中段：読み替えられない 2 つの言い方（×印・ラベルで示す）
 *  下段：大切なのは「どの物質の・どの作用を・どの条件で 調べたのか」
 */
type Steps = {finding: number; misread: number; conditions: number};

/** 下段の小さな印：物質（フラスコ）・作用（矢印と波＝この章の「作用」の印）・条件（一覧） */
const ActionMark: React.FC<{size?: number}> = ({size = 48}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={{flexShrink: 0}}>
    <path d="M8 32 H38" stroke="currentColor" strokeWidth={5} strokeLinecap="round" />
    <path d="M28 21 L40 32 L28 43" fill="none" stroke="currentColor" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M47 18 a 16 16 0 0 1 0 28" fill="none" stroke="currentColor" strokeWidth={4.5} strokeLinecap="round" />
  </svg>
);
const COND_MARKS: (IconName | 'action')[] = ['flask', 'action', 'list'];

const Cross: React.FC<{size?: number}> = ({size = 64}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={{flexShrink: 0}}>
    <circle cx={32} cy={32} r={28} fill={COLORS.surface} stroke={COLORS.slate} strokeWidth={4} />
    <path d="M21 21l22 22M43 21L21 43" stroke={COLORS.slate} strokeWidth={6} strokeLinecap="round" />
  </svg>
);

export const DoseReading: React.FC<{
  steps?: Steps;
  finding: string;
  findingSub?: string;
  misreads: string[];
  misreadLabel: string;
  conditions: string[];
  conditionsTail: string;
}> = ({steps = {finding: 0, misread: 1, conditions: 2}, finding, findingSub, misreads, misreadLabel, conditions, conditionsTail}) => {
  const a = useReveal(steps.finding, {duration: 0.7});
  const b = useReveal(steps.misread, {duration: 0.7});
  const c = useReveal(steps.conditions, {duration: 0.7});
  const fa = useFocus((s) => s === steps.finding);
  const fb = useFocus((s) => s === steps.misread);
  const fc = useFocus((s) => s >= steps.conditions);
  const dim = (p: number, f: number) => p * (0.55 + 0.45 * f);

  return (
    <div style={{position: 'absolute', inset: 0}}>
      {/* 上段：研究されている内容 */}
      <div
        style={{
          ...fadeUp(a),
          opacity: dim(a, fa),
          position: 'absolute',
          left: 0,
          right: 0,
          top: 16,
          height: 150,
          boxSizing: 'border-box',
          background: COLORS.surface,
          border: `3px solid ${fa > 0.5 ? COLORS.green : COLORS.lineSoft}`,
          borderLeft: `14px solid ${COLORS.green}`,
          borderRadius: 20,
          padding: '20px 40px',
          display: 'flex',
          alignItems: 'center',
          gap: 34,
        }}
      >
        <div style={{width: 110, height: 110, borderRadius: 55, background: COLORS.greenSoft, color: COLORS.green, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
          <Icon name="scale" size={70} />
        </div>
        <div>
          {findingSub ? <div style={{fontSize: 30, fontWeight: 700, color: COLORS.green, marginBottom: 6}}>{findingSub}</div> : null}
          <div style={{fontSize: 40, fontWeight: 700, color: COLORS.ink, lineHeight: 1.35, whiteSpace: 'pre-line'}}>{finding}</div>
        </div>
      </div>

      {/* 中段：読み替えられない言い方 */}
      <div style={{...fadeUp(b), opacity: dim(b, fb), position: 'absolute', left: 0, right: 0, top: 206, height: 216}}>
        <div style={{fontSize: 32, fontWeight: 700, color: COLORS.slate}}>{misreadLabel}</div>
        <div style={{display: 'flex', gap: 36, marginTop: 16}}>
          {misreads.map((m) => (
            <div
              key={m}
              style={{
                flex: 1,
                height: 150,
                boxSizing: 'border-box',
                background: COLORS.slateSoft,
                border: `3px dashed ${COLORS.slate}`,
                borderRadius: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 28,
              }}
            >
              <Cross />
              <span style={{fontSize: 46, fontWeight: 700, color: COLORS.ink}}>「{m}」</span>
            </div>
          ))}
        </div>
      </div>

      {/* 下段：大切なのは */}
      <div
        style={{
          ...fadeUp(c),
          opacity: dim(c, fc),
          position: 'absolute',
          left: 0,
          right: 0,
          top: 466,
          height: 176,
          boxSizing: 'border-box',
          background: COLORS.goldSoft,
          border: `3px solid ${fc > 0.5 ? COLORS.gold : COLORS.lineSoft}`,
          borderRadius: 20,
          padding: '0 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 26,
        }}
      >
        <div style={{fontSize: 34, fontWeight: 700, color: COLORS.gold, flexShrink: 0, marginRight: 8}}>大切なのは</div>
        {conditions.map((t, i) => (
          <div
            key={t}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              background: COLORS.surface,
              border: `3px solid ${COLORS.gold}`,
              borderRadius: 16,
              padding: '14px 24px',
            }}
          >
            <span style={{color: COLORS.gold, display: 'flex'}}>
              {COND_MARKS[i % COND_MARKS.length] === 'action' ? <ActionMark /> : <Icon name={COND_MARKS[i % COND_MARKS.length] as IconName} size={48} />}
            </span>
            <span style={{fontSize: 40, fontWeight: 700, color: COLORS.ink, whiteSpace: 'nowrap'}}>{t}</span>
          </div>
        ))}
        <div style={{fontSize: 40, fontWeight: 700, color: COLORS.ink, whiteSpace: 'nowrap'}}>{conditionsTail}</div>
      </div>
    </div>
  );
};

import React from 'react';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {EvidenceBadge, EvidenceKind, Pill} from '../../components/ui';
import {COLORS} from '../../theme';
import {Rich, useItem} from '../templates/helpers';
import {DashTag, LimitItem} from './parts';

/**
 * 「示されていること」と「ここから言えないこと」を同じ画面に並べる板。
 * 左の各行には根拠の種類（EvidenceBadge：形とラベル）を付け、根拠の種類が違うものを同じ証拠として描かない。
 * 根拠の種類ではない注記（「可能性」「配慮」など）は点線のタグで区別する。
 * conclusion の行は「言えること」として緑の面で示す。
 * 右の「言えないこと」は ≠ 記号で示す（同じ画面で留保を伝える）。
 */
export type BoardRow = {
  text: string;
  sub?: string;
  step: number;
  kind?: EvidenceKind;
  badgeLabel?: string;
  tag?: string;
  conclusion?: boolean;
};
export type BoardLimit = {text: string; step: number};

const LEFT_W = 1090;
const TOP = 96;
const BADGE_COL = 300;

const Row: React.FC<{row: BoardRow; index: number; steps: number[]; allStep?: number}> = ({row, index, steps, allStep}) => {
  const item = useItem(index, steps, allStep);
  // 「言えること」の行は、表示された後も強調を保つ（言えないことと並べて見せるため）
  const keep = useFocus((s) => s >= row.step);
  const appear = item.appear;
  const focus = row.conclusion ? keep : item.focus;
  return (
    <div
      style={{
        ...fadeUp(appear),
        opacity: appear * (0.5 + 0.5 * focus),
        display: 'flex',
        alignItems: 'flex-start',
        gap: 24,
        background: row.conclusion ? COLORS.greenSoft : 'transparent',
        border: row.conclusion ? `3px solid ${focus > 0.5 ? COLORS.green : COLORS.greenSoft}` : 'none',
        borderRadius: 16,
        padding: row.conclusion ? '16px 20px' : '0 0',
        marginLeft: row.conclusion ? -20 : 0,
        marginRight: row.conclusion ? -20 : 0,
      }}
    >
      <div style={{width: BADGE_COL, flexShrink: 0, paddingTop: 4}}>
        {row.kind ? <EvidenceBadge kind={row.kind} label={row.badgeLabel} size={30} /> : null}
        {!row.kind && row.conclusion ? (
          <Pill tone="green" filled size={30}>
            {row.tag ?? '言えること'}
          </Pill>
        ) : null}
        {!row.kind && !row.conclusion && row.tag ? <DashTag color={COLORS.gold}>{row.tag}</DashTag> : null}
      </div>
      <div style={{flex: 1}}>
        <div style={{fontSize: 36, fontWeight: 700, color: COLORS.ink, lineHeight: 1.45, whiteSpace: 'pre-line'}}>
          <Rich text={row.text} />
        </div>
        {row.sub ? <div style={{fontSize: 30, fontWeight: 500, color: COLORS.inkSoft, lineHeight: 1.45, marginTop: 4}}>{row.sub}</div> : null}
      </div>
    </div>
  );
};

const Limit: React.FC<{item: BoardLimit; index: number; steps: number[]; allStep?: number}> = ({item, index, steps, allStep}) => {
  const {appear, focus} = useItem(index, steps, allStep);
  return <LimitItem text={item.text} appear={appear} focus={focus} />;
};

export const EvidenceBoard: React.FC<{
  subject: {title: string; chips?: string[]};
  leftTitle: string;
  rows: BoardRow[];
  rightTitle?: string;
  limits: BoardLimit[];
  allStep?: number;
}> = ({subject, leftTitle, rows, rightTitle = 'ここから言えないこと', limits, allStep}) => {
  const head = useReveal(0);
  const firstLimit = Math.min(...limits.map((l) => l.step));
  const right = useReveal(firstLimit);
  const steps = [...rows.map((r) => r.step), ...limits.map((l) => l.step)];

  return (
    <div style={{position: 'absolute', inset: 0}}>
      {/* 対象 */}
      <div style={{...fadeUp(head), position: 'absolute', left: 0, top: 0, height: 76, display: 'flex', alignItems: 'center', gap: 16}}>
        {(subject.chips ?? []).map((c) => (
          <Pill key={c} tone="gold" filled size={30}>
            {c}
          </Pill>
        ))}
        <div style={{fontSize: 42, fontWeight: 700, color: COLORS.ink, whiteSpace: 'nowrap'}}>{subject.title}</div>
      </div>

      {/* 左：示されていること */}
      <div
        style={{
          ...fadeUp(head),
          position: 'absolute',
          left: 0,
          top: TOP,
          width: LEFT_W,
          height: 676 - TOP,
          boxSizing: 'border-box',
          background: COLORS.surface,
          border: `3px solid ${COLORS.lineSoft}`,
          borderRadius: 24,
          padding: '24px 34px',
          display: 'flex',
          flexDirection: 'column',
          gap: 32,
        }}
      >
        <div style={{fontSize: 32, fontWeight: 700, color: COLORS.inkSoft}}>{leftTitle}</div>
        {rows.map((r, i) => (
          <Row key={i} row={r} index={i} steps={steps} allStep={allStep} />
        ))}
      </div>

      {/* 右：ここから言えないこと */}
      <div
        style={{
          ...fadeUp(right),
          position: 'absolute',
          left: LEFT_W + 40,
          top: TOP,
          width: 1760 - LEFT_W - 40,
          maxHeight: 676 - TOP,
          boxSizing: 'border-box',
          background: COLORS.surface,
          border: `3px dashed ${COLORS.gold}`,
          borderRadius: 24,
          padding: '24px 32px 34px',
          display: 'flex',
          flexDirection: 'column',
          gap: 30,
        }}
      >
        <div style={{fontSize: 32, fontWeight: 700, color: COLORS.gold}}>{rightTitle}</div>
        {limits.map((l, i) => (
          <Limit key={i} item={l} index={rows.length + i} steps={steps} allStep={allStep} />
        ))}
      </div>
    </div>
  );
};

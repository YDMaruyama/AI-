import React from 'react';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {Tone, toneColor} from '../../components/ui';
import {COLORS} from '../../theme';
import {ROW_DEFS, RowIcon, RowKey} from './parts';

/**
 * 三つの物質を同じ四つの観点で並べる表。
 *  - mode 'map'    ：章の始めに枠組みだけを示す（中身は空欄。行ラベルを順に強調）
 *  - mode 'filled' ：章の終わりに要約を並べて比べる
 * 危険度の大小を示す列やメーターは置かない。
 */
type Column = {name: string; sub?: string; tone: Tone; cells?: Partial<Record<RowKey, string>>};

type Props = {
  mode?: 'map' | 'filled';
  columns: Column[];
  /** 行ラベルを強調する step（map では順に、filled では指定した行だけ） */
  rowSteps?: Partial<Record<RowKey, number>>;
  /** 見出し列（物質名）を出す step */
  headStep?: number;
};

const LABEL_W = 290;
const COL_GAP = 18;
const HEAD_H = 128;
const ROW_GAP = 14;
const H = 676;
const ROW_H = (H - HEAD_H - ROW_GAP * 4) / 4;

const Head: React.FC<{col: Column; index: number; headStep: number}> = ({col, index, headStep}) => {
  const c = toneColor(col.tone);
  const p = useReveal(headStep, {delay: index * 0.15});
  return (
    <div
      style={{
        ...fadeUp(p, 10),
        height: HEAD_H,
        boxSizing: 'border-box',
        background: COLORS.surface,
        borderRadius: 18,
        border: `3px solid ${COLORS.lineSoft}`,
        borderTop: `12px solid ${c.main}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <div style={{fontSize: 44, fontWeight: 700, color: COLORS.ink, lineHeight: 1.2, whiteSpace: 'nowrap'}}>{col.name}</div>
      {col.sub ? <div style={{fontSize: 28, fontWeight: 500, color: COLORS.inkSoft, lineHeight: 1.3, whiteSpace: 'nowrap'}}>{col.sub}</div> : null}
    </div>
  );
};

const LabelCell: React.FC<{def: (typeof ROW_DEFS)[number]; step?: number; focusSteps: number[]}> = ({def, step, focusSteps}) => {
  const p = useReveal(0, {duration: 0.6});
  const focus = useFocus((s) => (step !== undefined ? (focusSteps.includes(s) ? s === step : false) : false));
  return (
    <div
      style={{
        ...fadeUp(p, 10),
        height: ROW_H,
        boxSizing: 'border-box',
        borderRadius: 16,
        background: focus > 0.5 ? COLORS.green : COLORS.panel,
        color: focus > 0.5 ? COLORS.surface : COLORS.ink,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 18px',
      }}
    >
      <RowIcon icon={def.icon} size={40} />
      <span style={{fontSize: 30, fontWeight: 700, whiteSpace: 'nowrap'}}>{def.label}</span>
    </div>
  );
};

const Cell: React.FC<{text?: string; mode: 'map' | 'filled'; rowStep?: number; focusSteps: number[]; tone: Tone}> = ({text, mode, rowStep, focusSteps, tone}) => {
  const c = toneColor(tone);
  const p = useReveal(0, {duration: 0.6, delay: 0.2});
  const focus = useFocus((s) => (focusSteps.includes(s) ? s === rowStep : mode === 'filled'));
  if (mode === 'map') {
    return (
      <div
        style={{
          ...fadeUp(p, 10),
          height: ROW_H,
          boxSizing: 'border-box',
          borderRadius: 16,
          border: `3px dashed ${focus > 0.5 ? c.main : COLORS.lineSoft}`,
          background: focus > 0.5 ? c.soft : 'transparent',
        }}
      />
    );
  }
  return (
    <div
      style={{
        ...fadeUp(p, 10),
        opacity: p * (0.64 + 0.36 * focus),
        height: ROW_H,
        boxSizing: 'border-box',
        borderRadius: 16,
        background: COLORS.surface,
        border: `3px solid ${focus > 0.5 && focusSteps.length > 0 ? c.main : COLORS.lineSoft}`,
        display: 'flex',
        alignItems: 'center',
        padding: '8px 20px',
        fontSize: 30,
        fontWeight: 600,
        color: COLORS.ink,
        lineHeight: 1.35,
        whiteSpace: 'pre-line',
      }}
    >
      {text}
    </div>
  );
};

export const ProfileGrid: React.FC<Props> = ({mode = 'map', columns, rowSteps = {}, headStep = 0}) => {
  const focusSteps = Object.values(rowSteps).filter((v): v is number => typeof v === 'number');
  const colW = (1760 - LABEL_W - COL_GAP * columns.length) / columns.length;
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          gridTemplateColumns: `${LABEL_W}px ${columns.map(() => `${colW}px`).join(' ')}`,
          gridTemplateRows: `${HEAD_H}px ${ROW_DEFS.map(() => `${ROW_H}px`).join(' ')}`,
          columnGap: COL_GAP,
          rowGap: ROW_GAP,
        }}
      >
        <div />
        {columns.map((col, i) => (
          <Head key={col.name} col={col} index={i} headStep={headStep} />
        ))}
        {ROW_DEFS.map((d) => (
          <React.Fragment key={d.key}>
            <LabelCell def={d} step={rowSteps[d.key]} focusSteps={focusSteps} />
            {columns.map((col) => (
              <Cell key={col.name + d.key} text={col.cells?.[d.key]} mode={mode} rowStep={rowSteps[d.key]} focusSteps={focusSteps} tone={col.tone} />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

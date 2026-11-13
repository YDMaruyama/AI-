import React from 'react';
import {Icon, IconName} from '../../components/Icons';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {NoteStrip} from '../../components/ui';
import {COLORS} from '../../theme';

/**
 * アイコン付きの短い行動を横並びのカードで示す（Cards テンプレートの章内版）。
 * 文言は \n で 2 行に分けられる（原文の言い回しを省略せずに載せるため）。
 * 話しているカードだけ強調し、allStep 以降は全カードを強調。下端に任意の帯（note）。
 */
type Item = {text: string; icon: IconName; step?: number};

const CARD_TOP = 50;
const CARD_H = 360;

const isFocused = (index: number, step: number, steps: number[], allStep?: number) => {
  if (allStep !== undefined && step >= allStep) return true;
  if (steps.includes(step)) return steps[index] === step;
  return true;
};

const ItemCard: React.FC<{item: Item; index: number; steps: number[]; allStep?: number}> = ({item, index, steps, allStep}) => {
  const appear = useReveal(steps[index]);
  const focus = useFocus((s) => isFocused(index, s, steps, allStep));
  const on = focus > 0.5;
  return (
    <div
      style={{
        ...fadeUp(appear),
        opacity: appear * (0.55 + 0.45 * focus),
        flex: 1,
        minWidth: 0,
        height: CARD_H,
        boxSizing: 'border-box',
        background: COLORS.surface,
        borderRadius: 22,
        border: `3px solid ${on ? COLORS.green : COLORS.lineSoft}`,
        boxShadow: on ? `0 10px 26px rgba(42,43,42,${0.1 * focus})` : 'none',
        padding: '20px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 30,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: 60,
          background: on ? COLORS.green : COLORS.greenSoft,
          color: on ? COLORS.surface : COLORS.green,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon name={item.icon} size={74} />
      </div>
      <div style={{fontSize: 42, fontWeight: 700, color: COLORS.ink, lineHeight: 1.4, whiteSpace: 'pre-line'}}>{item.text}</div>
    </div>
  );
};

export const IconCards: React.FC<{items: Item[]; allStep?: number; note?: string; noteStep?: number; noteLabel?: string}> = ({
  items,
  allStep,
  note,
  noteStep = 99,
  noteLabel,
}) => {
  const steps = items.map((it, i) => it.step ?? i);
  const noteP = useReveal(noteStep);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: CARD_TOP, display: 'flex', gap: 36}}>
        {items.map((it, i) => (
          <ItemCard key={i} item={it} index={i} steps={steps} allStep={allStep} />
        ))}
      </div>
      {note ? (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 64}}>
          <NoteStrip appear={noteP} label={noteLabel}>
            {note}
          </NoteStrip>
        </div>
      ) : null}
    </div>
  );
};

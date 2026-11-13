import React from 'react';
import {IconName} from '../../components/Icons';
import {fadeUp, useReveal} from '../../components/scene-context';
import {EvidenceBadge, Pill} from '../../components/ui';
import {COLORS} from '../../theme';
import {BottomNote, useItem} from '../templates/helpers';
import {IconDisc} from './parts';

/**
 * M10・M12：一部の PFAS について、人の研究で報告された「関連」。
 * 根拠の種類は「人での関連」（△）。因果の矢印は使わず、項目は並べるだけにする。
 * 数値・グラフは使わない。PFAS 全体を一つの危険度で表さない（対象は「一部の物質」と明示）。
 */
type Item = {text: string; icon: IconName; step: number};

const ItemCard: React.FC<{
  item: Item;
  index: number;
  steps: number[];
  allStep?: number;
  height: number;
  width: number;
  left: number;
  top: number;
  previewStep?: number;
}> = ({item, index, steps, allStep, height, width, left, top, previewStep}) => {
  const {appear: own, focus} = useItem(index, steps, allStep);
  // previewStep があれば、その段階で全項目を並べて見せ、各項目の step で個別に強調する
  const preview = useReveal(previewStep ?? 999, {delay: index * 0.25});
  const appear = Math.max(own, preview);
  return (
    <div
      style={{
        ...fadeUp(appear),
        opacity: appear * (0.5 + 0.5 * focus),
        position: 'absolute',
        left,
        top,
        width,
        height,
        boxSizing: 'border-box',
        background: COLORS.surface,
        border: `3px solid ${focus > 0.5 ? COLORS.green : COLORS.lineSoft}`,
        borderRadius: 22,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 22,
        padding: '0 30px',
        textAlign: 'center',
      }}
    >
      <IconDisc name={item.icon} size={104} />
      <div style={{fontSize: 40, fontWeight: 700, color: COLORS.ink, lineHeight: 1.4, whiteSpace: 'pre-line'}}>{item.text}</div>
    </div>
  );
};

export const PfasAssociations: React.FC<{
  /** 対象の表示（見出しと重複する場合は省略） */
  subject?: {title: string; chips?: string[]};
  items: Item[];
  allStep?: number;
  note?: string;
  noteStep?: number;
  noteLabel?: string;
  /** 「人での関連」のバッジを出す step（省略時は最初の項目と同時） */
  badgeStep?: number;
  /** 全項目を先に並べて見せる step（省略時は各項目の step で現れる） */
  previewStep?: number;
}> = ({subject, items, allStep, note, noteStep, noteLabel, badgeStep, previewStep}) => {
  const head = useReveal(0);
  const badge = useReveal(badgeStep ?? Math.min(...items.map((i) => i.step)));
  const steps = items.map((i) => i.step);
  const gap = 36;
  const w = (1760 - gap * (items.length - 1)) / items.length;
  const badgeTop = subject ? 104 : 0;
  const top = badgeTop + 96;
  const bottom = note ? 560 : 656;
  const h = bottom - top;

  return (
    <div style={{position: 'absolute', inset: 0}}>
      {subject ? (
        <div style={{...fadeUp(head), position: 'absolute', left: 0, top: 0, height: 76, display: 'flex', alignItems: 'center', gap: 16}}>
          {(subject.chips ?? []).map((c) => (
            <Pill key={c} tone="gold" filled size={30}>
              {c}
            </Pill>
          ))}
          <div style={{fontSize: 42, fontWeight: 700, color: COLORS.ink, whiteSpace: 'nowrap'}}>{subject.title}</div>
        </div>
      ) : null}
      <div style={{...fadeUp(badge), position: 'absolute', left: 0, top: badgeTop, display: 'flex', alignItems: 'center', gap: 20}}>
        <EvidenceBadge kind="human" size={32} />
        <div style={{fontSize: 34, fontWeight: 700, color: COLORS.inkSoft}}>人の研究で、関連が報告されている</div>
      </div>
      {items.map((it, i) => (
        <ItemCard key={it.text} item={it} index={i} steps={steps} allStep={allStep} height={h} width={w} left={i * (w + gap)} top={top} previewStep={previewStep} />
      ))}
      <BottomNote note={note} noteStep={noteStep} label={noteLabel} />
    </div>
  );
};

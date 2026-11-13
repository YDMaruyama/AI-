import React from 'react';
import {NoteStrip} from '../../components/ui';
import {COLORS} from '../../theme';
import {useFocus, useReveal, useStep} from '../../components/scene-context';

/**
 * 項目リストの強調ルール：
 *  - step >= allStep のときは全項目を強調
 *  - 現在の step に対応する項目があれば、その項目だけ強調（他は読める濃さで残す）
 *  - 対応する項目がなければ、表示済みの全項目を強調
 */
export const focusRule = (itemSteps: number[], allStep?: number) => (index: number) => (step: number) => {
  if (allStep !== undefined && step >= allStep) return true;
  if (itemSteps.includes(step)) return itemSteps[index] === step;
  return true;
};

export const useItem = (index: number, itemSteps: number[], allStep?: number, revealDelay = 0) => {
  const appear = useReveal(itemSteps[index], {delay: revealDelay});
  const focus = useFocus(focusRule(itemSteps, allStep)(index));
  return {appear, focus};
};

/** 図解領域の下端に置く補足帯（note がない場合は何も描かない） */
export const BottomNote: React.FC<{note?: string; noteStep?: number; label?: string}> = ({note, noteStep = 0, label}) => {
  const p = useReveal(noteStep);
  if (!note) return null;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0}}>
      <NoteStrip appear={p} label={label}>
        {note}
      </NoteStrip>
    </div>
  );
};

export const useCurrentStep = () => useStep().step;

/** 文字列中の「…」を強調色で表示する簡易マークアップ：**語** */
export const Rich: React.FC<{text: string; color?: string}> = ({text, color}) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') ? (
          <span key={i} style={{color: color ?? COLORS.green, fontWeight: 700}}>
            {p.slice(2, -2)}
          </span>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        ),
      )}
    </>
  );
};

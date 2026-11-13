import React from 'react';
import {Icon, IconName} from '../../components/Icons';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {Pill} from '../../components/ui';
import {COLORS} from '../../theme';
import {focusRule} from '../templates/helpers';
import {NotSame} from './parts';

/* ------------------------------------------------------------------ */
/* 「香料を含む」だけでは環境ホルモンを含むとは判断できない                */
/* ------------------------------------------------------------------ */

type FSteps = {claim: number; items: [number, number, number]; all: number};

const ITEMS: {icon: IconName; text: string}[] = [
  {icon: 'fragrance', text: '香料の成分'},
  {icon: 'capsule', text: 'カプセルの素材'},
  {icon: 'person', text: '体への入り方'},
];

const CheckCell: React.FC<{icon: IconName; text: string; index: number; steps: number[]; all: number}> = ({icon, text, index, steps, all}) => {
  const appear = useReveal(steps[index]);
  const focus = useFocus(focusRule(steps, all)(index));
  return (
    <div style={{...fadeUp(appear), opacity: appear * (0.5 + 0.5 * focus), flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22, textAlign: 'center'}}>
      <div
        style={{
          width: 150,
          height: 150,
          borderRadius: 26,
          border: `4px solid ${COLORS.green}`,
          background: focus > 0.5 ? COLORS.greenSoft : COLORS.surface,
          color: COLORS.green,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size={92} />
      </div>
      <div style={{fontSize: 44, fontWeight: 700, color: COLORS.ink}}>{text}</div>
    </div>
  );
};

export const FragranceChecks: React.FC<{steps?: FSteps}> = ({steps = {claim: 1, items: [2, 3, 4], all: 5}}) => {
  const claim = useReveal(steps.claim);
  const rel = useReveal(steps.claim, {delay: 0.6});
  const head = useReveal(steps.items[0]);
  const fClaim = useFocus((s) => s <= steps.claim || s >= steps.all);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      {/* 上：香料を含む ≠ 環境ホルモンを含む */}
      <div style={{...fadeUp(claim), opacity: claim * (0.55 + 0.45 * fClaim), position: 'absolute', left: 0, right: 0, top: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 18, background: COLORS.goldSoft, border: `3px solid ${COLORS.gold}`, borderRadius: 20, padding: '20px 34px'}}>
          <div style={{color: COLORS.gold, display: 'flex'}}>
            <Icon name="fragrance" size={64} />
          </div>
          <div style={{fontSize: 44, fontWeight: 700, color: COLORS.ink}}>香料を含む</div>
        </div>
        <div style={{width: 260, display: 'flex', justifyContent: 'center'}}>
          <NotSame appear={rel} label={'それだけでは\n判断できない'} size={84} />
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 18, background: COLORS.slateSoft, border: `3px solid ${COLORS.slate}`, borderRadius: 20, padding: '20px 34px'}}>
          <div style={{color: COLORS.slate, display: 'flex'}}>
            <Icon name="gland" size={64} />
          </div>
          <div style={{fontSize: 44, fontWeight: 700, color: COLORS.ink}}>環境ホルモンを含む</div>
        </div>
      </div>

      {/* 下：分けて確認する */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 230,
          bottom: 0,
          background: COLORS.surface,
          border: `3px solid ${COLORS.lineSoft}`,
          borderRadius: 22,
          padding: '22px 40px',
          boxSizing: 'border-box',
          opacity: head,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
          <Pill tone="green" size={28}>
            確認
          </Pill>
          <div style={{fontSize: 40, fontWeight: 700, color: COLORS.ink}}>分けて確認する</div>
        </div>
        <div style={{display: 'flex', alignItems: 'stretch', flex: 1, paddingTop: 10, paddingBottom: 20}}>
          {ITEMS.map((it, i) => (
            <React.Fragment key={it.text}>
              {i > 0 ? <div style={{width: 0, borderLeft: `3px dashed ${COLORS.line}`, margin: '6px 0'}} /> : null}
              <CheckCell icon={it.icon} text={it.text} index={i} steps={[...steps.items]} all={steps.all} />
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 香りを付ける必要があるかを考える                                       */
/* ------------------------------------------------------------------ */

type SSteps = {clothes: number; question: number; noUse: number; choose: number; separate: number};

const LabelCheck: React.FC<{text: string; appear: number; checked: number}> = ({text, appear, checked}) => (
  <div style={{...fadeUp(appear, 10), display: 'flex', alignItems: 'center', gap: 18, background: COLORS.surface, border: `3px solid ${COLORS.green}`, borderRadius: 16, padding: '14px 22px'}}>
    <svg width={52} height={52} viewBox="0 0 52 52" style={{flexShrink: 0}}>
      <rect x="3" y="3" width="46" height="46" rx="10" fill={COLORS.surface} stroke={COLORS.green} strokeWidth="4" />
      <path d="M13 27l9 9 18-20" fill="none" stroke={COLORS.green} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={44} strokeDashoffset={44 * (1 - checked)} />
    </svg>
    <div style={{fontSize: 38, fontWeight: 700, color: COLORS.ink, whiteSpace: 'nowrap'}}>「{text}」</div>
  </div>
);

export const ScentChoice: React.FC<{steps?: SSteps}> = ({steps = {clothes: 1, question: 2, noUse: 3, choose: 4, separate: 5}}) => {
  const clothes = useReveal(steps.clothes);
  const q = useReveal(steps.question);
  const noUse = useReveal(steps.noUse);
  const choose = useReveal(steps.choose);
  const tick1 = useReveal(steps.choose, {delay: 0.6, duration: 0.5});
  const tick2 = useReveal(steps.choose, {delay: 1.1, duration: 0.5});
  const sep = useReveal(steps.separate);
  const fClothes = useFocus((s) => s <= steps.clothes);
  const fQ = useFocus((s) => s === steps.question);
  const fNo = useFocus((s) => s === steps.noUse);
  const fChoose = useFocus((s) => s >= steps.choose);

  const card = (focus: number, color: string): React.CSSProperties => ({
    background: COLORS.surface,
    border: `3px solid ${focus > 0.5 ? color : COLORS.lineSoft}`,
    borderRadius: 22,
    boxSizing: 'border-box',
    position: 'absolute',
  });

  return (
    <div style={{position: 'absolute', inset: 0}}>
      {/* 衣類の特徴 */}
      <div style={{...card(fClothes, COLORS.green), ...fadeUp(clothes), opacity: clothes * (0.55 + 0.45 * fClothes), left: 0, top: 0, width: 470, height: 656, padding: '28px 30px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 30}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
          <div style={{width: 110, height: 110, borderRadius: 55, background: COLORS.greenSoft, color: COLORS.green, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
            <Icon name="shirt" size={76} />
          </div>
          <div style={{fontSize: 42, fontWeight: 700, color: COLORS.ink}}>衣類は</div>
        </div>
        {['身体の近くで\n長い時間使う', '周囲の人とも\n接する'].map((t) => (
          <div key={t} style={{display: 'flex', gap: 12, fontSize: 40, fontWeight: 600, color: COLORS.ink, lineHeight: 1.4}}>
            <span style={{color: COLORS.green}}>●</span>
            <span style={{whiteSpace: 'pre-line'}}>{t}</span>
          </div>
        ))}
      </div>

      {/* 問い */}
      <div style={{...card(fQ, COLORS.gold), ...fadeUp(q), opacity: q * (0.55 + 0.45 * fQ), left: 520, top: 0, width: 1240, height: 150, padding: '0 34px', display: 'flex', alignItems: 'center', gap: 22}}>
        <div style={{color: COLORS.gold, display: 'flex'}}>
          <Icon name="question" size={76} />
        </div>
        <div style={{fontSize: 44, fontWeight: 700, color: COLORS.ink}}>香りを付ける必要があるかを考える</div>
      </div>

      {/* 見直しの例 1：使わない */}
      <div style={{...card(fNo, COLORS.green), ...fadeUp(noUse), opacity: noUse * (0.55 + 0.45 * fNo), left: 520, top: 190, width: 440, height: 466, padding: '28px 30px', display: 'flex', flexDirection: 'column', gap: 18}}>
        <Pill tone="green" size={28} style={{alignSelf: 'flex-start'}}>
          見直しの例
        </Pill>
        <div style={{fontSize: 40, fontWeight: 700, color: COLORS.inkSoft, marginTop: 40}}>不要なら</div>
        <div style={{fontSize: 52, fontWeight: 700, color: COLORS.ink, lineHeight: 1.35}}>
          柔軟剤を
          <br />
          使わない
        </div>
      </div>

      {/* 見直しの例 2：表示を確認して選ぶ */}
      <div style={{...card(fChoose, COLORS.green), ...fadeUp(choose), opacity: choose * (0.55 + 0.45 * fChoose), left: 1000, top: 190, width: 760, height: 466, padding: '28px 30px', display: 'flex', flexDirection: 'column', gap: 18}}>
        <Pill tone="green" size={28} style={{alignSelf: 'flex-start'}}>
          見直しの例
        </Pill>
        <div style={{fontSize: 40, fontWeight: 700, color: COLORS.ink, marginTop: 4}}>表示を確認して選ぶ</div>
        <LabelCheck text="無香料" appear={choose} checked={tick1} />
        <LabelCheck text="マイクロカプセル不使用" appear={choose} checked={tick2} />
        <div style={{...fadeUp(sep, 8), alignSelf: 'flex-start'}}>
          <Pill tone="gold" filled size={30}>
            それぞれ別の表示として確認
          </Pill>
        </div>
      </div>
    </div>
  );
};

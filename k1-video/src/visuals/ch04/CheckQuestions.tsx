import React from 'react';
import {Icon, IconName} from '../../components/Icons';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {Tone, toneColor} from '../../components/ui';
import {COLORS} from '../../theme';
import {Panel, PanelTitle} from './parts';

/**
 * 分けて考えるための問い（G2）。
 * 「接し方」「取り込み」「健康への影響」の三つの欄に、問いを音声に合わせて置いていく。
 * 欄同士は矢印でつながず、点線の区切りで別々に示す。
 */
type Steps = {what: number; route: number; amount: number; period: number; absorb: number; effect: number; all: number};

const COLS: {title: string; icon: IconName | 'intake'; tone: Tone; w: number}[] = [
  {title: '接し方', icon: 'hand', tone: 'green', w: 520},
  {title: '取り込み', icon: 'intake', tone: 'slate', w: 590},
  {title: '健康への影響', icon: 'person', tone: 'gold', w: 590},
];

/** 取り込み：境界の外から内側へ入る点（模式） */
const IntakeIcon: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <rect x="18" y="10" width="40" height="44" rx="12" fill="none" stroke="currentColor" strokeWidth="3.2" />
    <path d="M6 32h18" fill="none" stroke="currentColor" strokeWidth="3.2" strokeDasharray="4 4" strokeLinecap="round" />
    <path d="M24 26l7 6-7 6" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="42" cy="32" r="6" fill="currentColor" />
  </svg>
);
const GAP = (1760 - COLS.reduce((a, c) => a + c.w, 0)) / 2;
const PH = 500;

const Q: React.FC<{text: string; appear: number; focus: number; tone: Tone}> = ({text, appear, focus, tone}) => {
  const c = toneColor(tone);
  return (
    <div
      style={{
        ...fadeUp(appear, 12),
        opacity: appear * (0.55 + 0.45 * focus),
        fontSize: 36,
        fontWeight: 700,
        color: COLORS.ink,
        lineHeight: 1.4,
        background: focus > 0.5 ? c.soft : COLORS.bg,
        border: `3px solid ${focus > 0.5 ? c.main : COLORS.lineSoft}`,
        borderRadius: 16,
        padding: '10px 22px',
        textAlign: 'left',
        whiteSpace: 'pre-line',
      }}
    >
      {text}
    </div>
  );
};

export const CheckQuestions: React.FC<{steps?: Steps}> = ({
  steps = {what: 1, route: 2, amount: 3, period: 4, absorb: 5, effect: 6, all: 7},
}) => {
  const base = useReveal(0, {duration: 0.7});
  const qWhat = useReveal(steps.what);
  const qRoute = useReveal(steps.route);
  const qAmount = useReveal(steps.amount);
  const qPeriod = useReveal(steps.period);
  const qAbsorb = useReveal(steps.absorb);
  const qEffect = useReveal(steps.effect);
  const all = useReveal(steps.all);
  const f0 = useFocus((s) => s < steps.absorb || s >= steps.all);
  const f1 = useFocus((s) => s === steps.absorb || s >= steps.all || s === 0);
  const f2 = useFocus((s) => s === steps.effect || s >= steps.all || s === 0);
  const fq = (k: number) => (s: number) => s === k || s >= steps.all;
  const fWhat = useFocus(fq(steps.what));
  const fRoute = useFocus(fq(steps.route));
  const fAmount = useFocus(fq(steps.amount));
  const fPeriod = useFocus(fq(steps.period));
  const colFocus = [f0, f1, f2];

  let x = 0;
  const xs = COLS.map((c) => {
    const v = x;
    x += c.w + GAP;
    return v;
  });

  return (
    <div style={{position: 'absolute', inset: 0}}>
      {COLS.map((col, i) => {
        const c = toneColor(col.tone);
        return (
          <div key={col.title} style={{position: 'absolute', left: xs[i], top: 0}}>
            <Panel tone={col.tone} appear={base} focus={colFocus[i]} width={col.w} height={PH}>
              <div style={{display: 'flex', alignItems: 'center', gap: 18, padding: '22px 28px 10px'}}>
                <div style={{width: 76, height: 76, borderRadius: 38, background: c.soft, color: c.main, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
                  {col.icon === 'intake' ? <IntakeIcon size={50} /> : <Icon name={col.icon} size={50} />}
                </div>
                <PanelTitle size={42}>{col.title}</PanelTitle>
              </div>
              <div style={{padding: '8px 28px', display: 'flex', flexDirection: 'column', gap: 14}}>
                {i === 0 ? (
                  <>
                    <Q text="何に？" appear={qWhat} focus={fWhat} tone={col.tone} />
                    <Q text="どの経路で？" appear={qRoute} focus={fRoute} tone={col.tone} />
                    <Q text="どれくらいの量を？" appear={qAmount} focus={fAmount} tone={col.tone} />
                    <Q text="どれくらいの期間？" appear={qPeriod} focus={fPeriod} tone={col.tone} />
                  </>
                ) : null}
                {i === 1 ? <Q text={"身体の中へ、\nどれほど取り込まれたか？"} appear={qAbsorb} focus={f1} tone={col.tone} /> : null}
                {i === 2 ? <Q text={"どのような条件で、\n健康への影響が\n確認されているか？"} appear={qEffect} focus={f2} tone={col.tone} /> : null}
              </div>
            </Panel>
          </div>
        );
      })}
      {/* 欄の区切り（点線。矢印ではない） */}
      {[1, 2].map((i) => (
        <div key={i} style={{position: 'absolute', left: xs[i] - GAP / 2 - 1.5, top: 30, height: PH - 60, borderLeft: `3px dashed ${COLORS.line}`, opacity: base}} />
      ))}
      <div style={{position: 'absolute', left: 0, right: 0, top: PH + 40, display: 'flex', justifyContent: 'center'}}>
        <div style={{...fadeUp(all), fontSize: 44, fontWeight: 700, color: COLORS.greenDeep, background: COLORS.greenSoft, borderRadius: 16, padding: '12px 40px'}}>
          それぞれを分けて考える
        </div>
      </div>
    </div>
  );
};

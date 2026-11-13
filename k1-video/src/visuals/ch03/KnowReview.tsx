import React from 'react';
import {Icon, IconName} from '../../components/Icons';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {Arrow, SvgText} from '../../components/ui';
import {COLORS} from '../../theme';

/**
 * 「漠然と怖がる」のではなく、まず「知る」（何に・どのように・どれくらい接しているか）、
 * そのうえで自分に関係するものの「接する機会・使い方」を「見直す」。
 * 怖がることは赤や×で否定せず、点線の控えめなラベルで「ではなく」と示す。
 */
type Steps = {know: number; review: number};

const PANEL_TOP = 150;
const PANEL_H = 490;
const LEFT_W = 760;
const RIGHT_X = 980;

const Panel: React.FC<{
  x: number;
  w: number;
  icon: IconName;
  title: string;
  tone: 'green' | 'gold';
  appear: number;
  focus: number;
  children: React.ReactNode;
}> = ({x, w, icon, title, tone, appear, focus, children}) => {
  const main = tone === 'green' ? COLORS.green : COLORS.gold;
  const soft = tone === 'green' ? COLORS.greenSoft : COLORS.goldSoft;
  return (
    <div
      style={{
        ...fadeUp(appear),
        opacity: appear * (0.55 + 0.45 * focus),
        position: 'absolute',
        left: x,
        top: PANEL_TOP,
        width: w,
        height: PANEL_H,
        boxSizing: 'border-box',
        background: COLORS.surface,
        borderRadius: 22,
        border: `3px solid ${focus > 0.5 ? main : COLORS.lineSoft}`,
        borderTop: `14px solid ${main}`,
        padding: '30px 44px',
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
        <div style={{width: 88, height: 88, borderRadius: 44, background: soft, color: main, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Icon name={icon} size={56} />
        </div>
        <div style={{fontSize: 56, fontWeight: 700, color: COLORS.ink}}>{title}</div>
      </div>
      {children}
    </div>
  );
};

const QRow: React.FC<{text: string; p: number}> = ({text, p}) => (
  <div style={{...fadeUp(p, 10), display: 'flex', alignItems: 'center', gap: 20}}>
    <div style={{width: 16, height: 16, borderRadius: 8, background: COLORS.green, flexShrink: 0}} />
    <div style={{fontSize: 50, fontWeight: 700, color: COLORS.greenDeep, lineHeight: 1.2}}>{text}</div>
  </div>
);

export const KnowReview: React.FC<{
  steps?: Steps;
  questions?: string[];
  questionsTail?: string;
  reviewSub?: string;
  reviewItems?: string[];
}> = ({
  steps = {know: 1, review: 2},
  questions = ['何に', 'どのように', 'どれくらい'],
  questionsTail = '接しているかを知る',
  reviewSub = '自分に関係するものについて',
  reviewItems = ['接する機会', '使い方'],
}) => {
  const top = useReveal(0, {duration: 0.7});
  const know = useReveal(steps.know);
  const q = [useReveal(steps.know, {delay: 0.2}), useReveal(steps.know, {delay: 0.6}), useReveal(steps.know, {delay: 1.0})];
  const tail = useReveal(steps.know, {delay: 1.4});
  const review = useReveal(steps.review, {delay: 0.5});
  const arrow = useReveal(steps.review, {duration: 0.8});
  const items = reviewItems.map((_, i) => i);
  const r0 = useReveal(steps.review, {delay: 1.0});
  const r1 = useReveal(steps.review, {delay: 1.4});
  const knowFocus = useFocus((s) => s < steps.review);
  const reviewFocus = useFocus((s) => s >= steps.review);

  return (
    <div style={{position: 'absolute', inset: 0}}>
      {/* 上段：「漠然と怖がる」のではなく */}
      <div style={{...fadeUp(top), position: 'absolute', left: 0, right: 0, top: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18}}>
        <div style={{fontSize: 38, fontWeight: 500, color: COLORS.inkSoft}}>身の回りのものを</div>
        <div
          style={{
            fontSize: 40,
            fontWeight: 700,
            color: COLORS.slate,
            border: `3px dashed ${COLORS.slate}`,
            borderRadius: 999,
            padding: '8px 30px',
            background: COLORS.surface,
          }}
        >
          漠然と怖がる
        </div>
        <div style={{fontSize: 40, fontWeight: 700, color: COLORS.gold}}>のではなく</div>
      </div>

      {/* 左：知る */}
      <Panel x={0} w={LEFT_W} icon="search" title="知る" tone="green" appear={know} focus={knowFocus}>
        <div style={{display: 'flex', flexDirection: 'column', gap: 22, marginTop: 6, paddingLeft: 10}}>
          {questions.map((t, i) => (
            <QRow key={t} text={t} p={q[i] ?? 1} />
          ))}
        </div>
        <div style={{...fadeUp(tail, 10), fontSize: 38, fontWeight: 700, color: COLORS.ink, marginTop: 4}}>{questionsTail}</div>
      </Panel>

      {/* 矢印：そのうえで */}
      <svg width={1760} height={676} viewBox="0 0 1760 676" style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none'}}>
        <Arrow from={[LEFT_W + 24, PANEL_TOP + PANEL_H / 2 + 20]} to={[RIGHT_X - 24, PANEL_TOP + PANEL_H / 2 + 20]} p={arrow} color={COLORS.gold} width={6} />
        <SvgText x={(LEFT_W + RIGHT_X) / 2} y={PANEL_TOP + PANEL_H / 2 - 30} size={30} weight={700} color={COLORS.gold} opacity={arrow}>
          そのうえで
        </SvgText>
      </svg>

      {/* 右：見直す */}
      <Panel x={RIGHT_X} w={1760 - RIGHT_X} icon="cycle" title="見直す" tone="gold" appear={review} focus={reviewFocus}>
        <div style={{fontSize: 36, fontWeight: 500, color: COLORS.inkSoft, marginTop: 4}}>{reviewSub}</div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 20, marginTop: 8}}>
          {items.map((i) => (
            <div
              key={i}
              style={{
                ...fadeUp(i === 0 ? r0 : r1, 10),
                alignSelf: 'flex-start',
                fontSize: 46,
                fontWeight: 700,
                color: COLORS.ink,
                background: COLORS.goldSoft,
                borderRadius: 16,
                padding: '12px 34px',
              }}
            >
              {reviewItems[i]}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
};

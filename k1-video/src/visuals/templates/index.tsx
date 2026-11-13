/**
 * 汎用テンプレート。多くのシーンはこのテンプレートに props を渡すだけで作れる。
 * step の扱い：各項目は item.step（省略時は並び順 0,1,2…）に到達した時点で現れ、
 * 現在の step の項目だけが強調される（helpers.tsx の focusRule）。
 */
import React from 'react';
import {Icon, IconName} from '../../components/Icons';
import {fadeUp, useReveal} from '../../components/scene-context';
import {Card, CornerTag, NotEqual, Pill, Tone, toneColor} from '../../components/ui';
import {CheckItem} from '../../components/ui';
import {COLORS, FONT, LAYOUT} from '../../theme';
import {BottomNote, Rich, useItem} from './helpers';

const W = LAYOUT.visual.width;
const H = LAYOUT.visual.height;
const NOTE_SPACE = 118;

type NoteProps = {note?: string; noteStep?: number; noteLabel?: string};

/* ------------------------------------------------------------------ */
/* 章扉                                                                */
/* ------------------------------------------------------------------ */
export const ChapterTitle: React.FC<{number: number; title: string; subtitle?: string; kicker?: string}> = ({
  number,
  title,
  subtitle,
  kicker,
}) => {
  const a = useReveal(0, {duration: 0.8});
  const b = useReveal(0, {delay: 0.35, duration: 0.8});
  const line = useReveal(0, {delay: 0.2, duration: 1.0});
  return (
    <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: 220}}>
      <div style={{...fadeUp(a), fontSize: 40, fontWeight: 700, color: COLORS.gold, letterSpacing: '0.2em'}}>
        {kicker ?? (number === 0 ? 'K1' : `第${number}章`)}
      </div>
      <div style={{height: 4, width: 520 * line, background: COLORS.gold, margin: '26px 0 34px', borderRadius: 2}} />
      <div style={{...fadeUp(b), fontSize: FONT.headingLarge, fontWeight: 700, color: COLORS.ink, lineHeight: 1.35, letterSpacing: '0.03em', maxWidth: 1500}}>
        {title}
      </div>
      {subtitle ? (
        <div style={{...fadeUp(b), marginTop: 26, fontSize: FONT.body, fontWeight: 500, color: COLORS.inkSoft, lineHeight: 1.5}}>
          {subtitle}
        </div>
      ) : null}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 1 つの要点                                                          */
/* ------------------------------------------------------------------ */
export const Statement: React.FC<
  {text: string; sub?: string; subStep?: number; icon?: IconName; tone?: Tone; textSize?: number} & NoteProps
> = ({text, sub, subStep = 1, icon, tone = 'green', textSize = 60, note, noteStep = 2, noteLabel}) => {
  const a = useReveal(0, {duration: 0.7});
  const b = useReveal(subStep);
  const c = toneColor(tone);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: note ? NOTE_SPACE : 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 34,
        }}
      >
        {icon ? (
          <div style={{...fadeUp(a), width: 150, height: 150, borderRadius: 75, background: c.soft, color: c.main, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Icon name={icon} size={96} />
          </div>
        ) : null}
        <div style={{...fadeUp(a), fontSize: textSize, fontWeight: 700, color: COLORS.ink, lineHeight: 1.45, maxWidth: 1500, letterSpacing: '0.03em', whiteSpace: 'pre-line'}}>
          <Rich text={text} color={c.main} />
        </div>
        {sub ? (
          <div style={{...fadeUp(b), fontSize: FONT.body, fontWeight: 500, color: COLORS.inkSoft, lineHeight: 1.55, maxWidth: 1400}}>
            <Rich text={sub} color={c.main} />
          </div>
        ) : null}
      </div>
      <BottomNote note={note} noteStep={noteStep} label={noteLabel} />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 箇条（短い要点を順に）                                              */
/* ------------------------------------------------------------------ */
type PointItem = {text: string; sub?: string; icon?: IconName; step?: number; tone?: Tone};

const PointRow: React.FC<{item: PointItem; index: number; steps: number[]; allStep?: number; numbered?: boolean; size: number}> = ({
  item,
  index,
  steps,
  allStep,
  numbered,
  size,
}) => {
  const {appear, focus} = useItem(index, steps, allStep);
  const c = toneColor(item.tone ?? 'green');
  return (
    <div style={{...fadeUp(appear), opacity: appear * (0.5 + 0.5 * focus), display: 'flex', alignItems: 'center', gap: 30}}>
      <div
        style={{
          flexShrink: 0,
          width: 88,
          height: 88,
          borderRadius: 44,
          background: focus > 0.5 ? c.main : c.soft,
          color: focus > 0.5 ? COLORS.surface : c.main,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 40,
          fontWeight: 700,
        }}
      >
        {numbered ? index + 1 : item.icon ? <Icon name={item.icon} size={54} /> : <div style={{width: 18, height: 18, borderRadius: 9, background: 'currentColor'}} />}
      </div>
      <div>
        <div style={{fontSize: size, fontWeight: 700, color: COLORS.ink, lineHeight: 1.4, letterSpacing: '0.02em'}}>
          <Rich text={item.text} color={c.main} />
        </div>
        {item.sub ? (
          <div style={{fontSize: 32, fontWeight: 500, color: COLORS.inkSoft, lineHeight: 1.45, marginTop: 4}}>
            <Rich text={item.sub} color={c.main} />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export const Points: React.FC<
  {items: PointItem[]; allStep?: number; numbered?: boolean; columns?: 1 | 2; size?: number; intro?: string} & NoteProps
> = ({items, allStep, numbered, columns = 1, size = 44, intro, note, noteStep, noteLabel}) => {
  const steps = items.map((it, i) => it.step ?? i);
  const introP = useReveal(0);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div
        style={{
          position: 'absolute',
          left: 60,
          right: 60,
          top: 0,
          bottom: note ? NOTE_SPACE : 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 30,
        }}
      >
        {intro ? <div style={{...fadeUp(introP), fontSize: 36, fontWeight: 500, color: COLORS.inkSoft, marginBottom: 6}}>{intro}</div> : null}
        <div style={{display: 'grid', gridTemplateColumns: columns === 2 ? '1fr 1fr' : '1fr', columnGap: 70, rowGap: items.length > 4 ? 28 : 40}}>
          {items.map((it, i) => (
            <PointRow key={i} item={it} index={i} steps={steps} allStep={allStep} numbered={numbered} size={size} />
          ))}
        </div>
      </div>
      <BottomNote note={note} noteStep={noteStep} label={noteLabel} />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* カード（2〜4 枚を横並び）                                            */
/* ------------------------------------------------------------------ */
type CardItem = {title: string; body?: string; icon?: IconName; step?: number; tone?: Tone; tag?: string};

const CardCell: React.FC<{item: CardItem; index: number; steps: number[]; allStep?: number; height: number; count: number}> = ({
  item,
  index,
  steps,
  allStep,
  height,
  count,
}) => {
  const {appear, focus} = useItem(index, steps, allStep);
  return (
    <Card
      title={item.title}
      body={item.body ? <Rich text={item.body} /> : undefined}
      icon={item.icon}
      tone={item.tone ?? 'green'}
      appear={appear}
      focus={focus}
      height={height}
      width="100%"
      align="center"
      titleSize={count >= 4 ? 40 : 46}
      bodySize={count >= 4 ? 30 : 34}
      tag={item.tag ? <Pill tone={item.tone ?? 'green'} size={24}>{item.tag}</Pill> : undefined}
      style={{justifyContent: 'flex-start', paddingTop: 40}}
    />
  );
};

export const Cards: React.FC<{cards: CardItem[]; allStep?: number; height?: number} & NoteProps> = ({
  cards,
  allStep,
  height,
  note,
  noteStep,
  noteLabel,
}) => {
  const steps = cards.map((c, i) => c.step ?? i);
  const h = height ?? (note ? H - NOTE_SPACE - 40 : H - 60);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: note ? 10 : 30,
          display: 'grid',
          gridTemplateColumns: `repeat(${cards.length}, 1fr)`,
          gap: 36,
        }}
      >
        {cards.map((c, i) => (
          <CardCell key={i} item={c} index={i} steps={steps} allStep={allStep} height={h} count={cards.length} />
        ))}
      </div>
      <BottomNote note={note} noteStep={noteStep} label={noteLabel} />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 2 つを並べて区別する                                                */
/* ------------------------------------------------------------------ */
type Side = {title: string; points?: string[]; icon?: IconName; tone?: Tone; step?: number; tag?: string};

const SidePanel: React.FC<{side: Side; index: number; steps: number[]; allStep?: number; height: number}> = ({side, index, steps, allStep, height}) => {
  const {appear, focus} = useItem(index, steps, allStep);
  const c = toneColor(side.tone ?? (index === 0 ? 'green' : 'slate'));
  return (
    <div
      style={{
        ...fadeUp(appear),
        opacity: appear * (0.5 + 0.5 * focus),
        flex: 1,
        height,
        boxSizing: 'border-box',
        background: COLORS.surface,
        borderRadius: 22,
        border: `3px solid ${focus > 0.5 ? c.main : COLORS.lineSoft}`,
        borderTop: `14px solid ${c.main}`,
        padding: '34px 40px',
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
        {side.icon ? (
          <div style={{width: 84, height: 84, borderRadius: 42, background: c.soft, color: c.main, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
            <Icon name={side.icon} size={54} />
          </div>
        ) : null}
        <div>
          {side.tag ? <Pill tone={side.tone ?? (index === 0 ? 'green' : 'slate')} size={24}>{side.tag}</Pill> : null}
          <div style={{fontSize: 46, fontWeight: 700, color: COLORS.ink, lineHeight: 1.3, marginTop: side.tag ? 8 : 0}}>{side.title}</div>
        </div>
      </div>
      {(side.points ?? []).map((p, i) => (
        <div key={i} style={{display: 'flex', gap: 16, fontSize: 36, fontWeight: 500, color: COLORS.ink, lineHeight: 1.5}}>
          <span style={{color: c.main, flexShrink: 0}}>●</span>
          <span>
            <Rich text={p} color={c.main} />
          </span>
        </div>
      ))}
    </div>
  );
};

export const Compare: React.FC<
  {left: Side; right: Side; relation?: 'ne' | 'and' | 'none'; relationLabel?: string; relationStep?: number; allStep?: number} & NoteProps
> = ({left, right, relation = 'ne', relationLabel, relationStep, allStep, note, noteStep, noteLabel}) => {
  const steps = [left.step ?? 0, right.step ?? 1];
  const rel = useReveal(relationStep ?? Math.max(steps[0], steps[1]));
  const h = note ? H - NOTE_SPACE - 30 : H - 40;
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: note ? 0 : 20, display: 'flex', alignItems: 'center', gap: 28}}>
        <SidePanel side={left} index={0} steps={steps} allStep={allStep} height={h} />
        <div style={{width: 130, display: 'flex', justifyContent: 'center'}}>
          {relation === 'ne' ? <NotEqual appear={rel} label={relationLabel} /> : null}
          {relation === 'and' ? (
            <div style={{...fadeUp(rel), fontSize: 30, fontWeight: 700, color: COLORS.gold, textAlign: 'center'}}>{relationLabel ?? 'と'}</div>
          ) : null}
        </div>
        <SidePanel side={right} index={1} steps={steps} allStep={allStep} height={h} />
      </div>
      <BottomNote note={note} noteStep={noteStep} label={noteLabel} />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 別々の観察として並べる（矢印で一本道にしない）                        */
/* ------------------------------------------------------------------ */
type SepItem = {title: string; body?: string; icon?: IconName; step?: number; tone?: Tone};

const SepCell: React.FC<{item: SepItem; index: number; steps: number[]; allStep?: number}> = ({item, index, steps, allStep}) => {
  const {appear, focus} = useItem(index, steps, allStep);
  const c = toneColor(item.tone ?? 'green');
  return (
    <div style={{...fadeUp(appear), opacity: appear * (0.5 + 0.5 * focus), flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, textAlign: 'center', padding: '0 18px'}}>
      <div style={{width: 120, height: 120, borderRadius: 24, border: `4px solid ${c.main}`, background: focus > 0.5 ? c.soft : COLORS.surface, color: c.main, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        {item.icon ? <Icon name={item.icon} size={70} /> : <span style={{fontSize: 52, fontWeight: 700}}>{index + 1}</span>}
      </div>
      <div style={{fontSize: 44, fontWeight: 700, color: COLORS.ink, lineHeight: 1.3}}>{item.title}</div>
      {item.body ? <div style={{fontSize: 32, fontWeight: 500, color: COLORS.inkSoft, lineHeight: 1.5}}><Rich text={item.body} color={c.main} /></div> : null}
    </div>
  );
};

export const Separate: React.FC<{items: SepItem[]; caption?: string; captionStep?: number; allStep?: number} & NoteProps> = ({
  items,
  caption,
  captionStep,
  allStep,
  note,
  noteStep,
  noteLabel,
}) => {
  const steps = items.map((it, i) => it.step ?? i);
  const cap = useReveal(captionStep ?? 0);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 30, bottom: note ? NOTE_SPACE + 10 : 20, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 40}}>
        <div style={{display: 'flex', alignItems: 'stretch'}}>
          {items.map((it, i) => (
            <React.Fragment key={i}>
              {i > 0 ? <div style={{width: 0, borderLeft: `3px dashed ${COLORS.line}`, margin: '10px 0'}} /> : null}
              <SepCell item={it} index={i} steps={steps} allStep={allStep} />
            </React.Fragment>
          ))}
        </div>
        {caption ? (
          <div style={{...fadeUp(cap), alignSelf: 'center'}}>
            <CornerTag>{caption}</CornerTag>
          </div>
        ) : null}
      </div>
      <BottomNote note={note} noteStep={noteStep} label={noteLabel} />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 確認項目                                                            */
/* ------------------------------------------------------------------ */
type CheckEntry = {text: string; sub?: string; step?: number};

const CheckRow: React.FC<{item: CheckEntry; index: number; steps: number[]; allStep?: number}> = ({item, index, steps, allStep}) => {
  const {appear, focus} = useItem(index, steps, allStep);
  const tick = useReveal(steps[index], {delay: 0.35, duration: 0.5});
  return <CheckItem text={<Rich text={item.text} />} sub={item.sub} appear={appear} checked={tick} focus={focus} />;
};

export const Checklist: React.FC<{items: CheckEntry[]; title?: string; icon?: IconName; allStep?: number} & NoteProps> = ({
  items,
  title,
  icon,
  allStep,
  note,
  noteStep,
  noteLabel,
}) => {
  const steps = items.map((it, i) => it.step ?? i);
  const t = useReveal(0);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', left: 80, right: 80, top: 0, bottom: note ? NOTE_SPACE : 0, display: 'flex', alignItems: 'center', gap: 80}}>
        {icon || title ? (
          <div style={{...fadeUp(t), width: 380, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, textAlign: 'center'}}>
            {icon ? (
              <div style={{width: 220, height: 220, borderRadius: 110, background: COLORS.greenSoft, color: COLORS.green, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <Icon name={icon} size={140} />
              </div>
            ) : null}
            {title ? <div style={{fontSize: 40, fontWeight: 700, color: COLORS.ink, lineHeight: 1.4}}>{title}</div> : null}
          </div>
        ) : null}
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: items.length > 4 ? 26 : 40}}>
          {items.map((it, i) => (
            <CheckRow key={i} item={it} index={i} steps={steps} allStep={allStep} />
          ))}
        </div>
      </div>
      <BottomNote note={note} noteStep={noteStep} label={noteLabel} />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 言葉を大切に示す（理念など）                                         */
/* ------------------------------------------------------------------ */
export const Quote: React.FC<{quote: string; sub?: string; subStep?: number; parts?: {text: string; icon: IconName; step: number}[]}> = ({
  quote,
  sub,
  subStep = 1,
  parts,
}) => {
  const a = useReveal(0, {duration: 0.9});
  const b = useReveal(subStep);
  return (
    <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 46}}>
      <div style={{...fadeUp(a), display: 'flex', alignItems: 'center', gap: 34}}>
        <div style={{width: 70, height: 4, background: COLORS.gold}} />
        <div style={{fontSize: 76, fontWeight: 700, color: COLORS.greenDeep, letterSpacing: '0.08em'}}>{quote}</div>
        <div style={{width: 70, height: 4, background: COLORS.gold}} />
      </div>
      {parts ? <QuoteParts parts={parts} /> : null}
      {sub ? <div style={{...fadeUp(b), fontSize: FONT.body, fontWeight: 500, color: COLORS.inkSoft, textAlign: 'center', lineHeight: 1.6, maxWidth: 1400}}>{sub}</div> : null}
    </div>
  );
};

const QuotePart: React.FC<{text: string; icon: IconName; step: number}> = ({text, icon, step}) => {
  const p = useReveal(step);
  return (
    <div style={{...fadeUp(p), display: 'flex', alignItems: 'center', gap: 22, background: COLORS.surface, border: `3px solid ${COLORS.lineSoft}`, borderRadius: 20, padding: '22px 36px'}}>
      <div style={{color: COLORS.green}}>
        <Icon name={icon} size={64} />
      </div>
      <div style={{fontSize: 38, fontWeight: 700, color: COLORS.ink}}>{text}</div>
    </div>
  );
};

const QuoteParts: React.FC<{parts: {text: string; icon: IconName; step: number}[]}> = ({parts}) => (
  <div style={{display: 'flex', gap: 40}}>
    {parts.map((p, i) => (
      <QuotePart key={i} {...p} />
    ))}
  </div>
);

export const templates: Record<string, React.FC<any>> = {
  ChapterTitle,
  Statement,
  Points,
  Cards,
  Compare,
  Separate,
  Checklist,
  Quote,
};

export const TEMPLATE_SIZE = {W, H, NOTE_SPACE};

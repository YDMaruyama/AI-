import React from 'react';
import {Icon, IconName} from '../../components/Icons';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {CornerTag, NoteStrip, Pill, Tone, toneColor} from '../../components/ui';
import {COLORS} from '../../theme';
import {BadgeKind, Cluster, ClusterKind, KindBadge, ROW_DEFS, RowIcon, RowKey} from './parts';

/**
 * 第7章の共通レイアウト：物質のプロフィール。
 * 左に物質の名前と「まとまり方」（一つの物質／物質群／多くの物質の総称）の模式、
 * 右に同じ四つの行「用途／接点（曝露源）／研究される作用／区別すべき点」。
 * BPA・フタル酸エステル・PFAS の各シーンで同じ配置を使い、比べられるようにする。
 *
 * 行の状態（シーンごとに props で指定）：
 *  - hidden  まだ扱っていない行（ラベルと点線だけ）
 *  - summary 前のシーンで扱った行（1 行の要約を読める濃さで残す）
 *  - active  このシーンで扱う行（項目が step ごとに現れ、話している項目を強調）
 */

export type Identity = {
  /** 表示名。改行は \n */
  name: string;
  nameSize?: number;
  /** 読み・正式名（例：ビスフェノールA） */
  reading?: string;
  readingSize?: number;
  /** まとまり方（例：物質群） */
  kind: string;
  cluster: ClusterKind;
  tone: Tone;
};

type Chip = {text: string; icon?: IconName};

export type ProfileItem =
  | {type?: 'point'; text?: string; chips?: Chip[]; tail?: string; chipsBreak?: boolean; step: number}
  | {type: 'caveat'; text: string; label?: string; step: number}
  | {type: 'badge'; badge: BadgeKind; badgeLabel?: string; text: string; step: number}
  | {type: 'ne'; left: string; right: string; sub?: string; subStep?: number; step: number};

export type RowState = {mode: 'hidden'} | {mode: 'summary'; text: string} | {mode: 'active'; items: ProfileItem[]; weight?: number};

type Props = {
  identity: Identity;
  rows: Record<RowKey, RowState>;
  /** まとまり方のラベルを出す step（既定 0） */
  kindStep?: number;
  /** まとまり方のラベル（例：多くの物質の総称）を強調し直す step */
  kindFocusSteps?: number[];
  /** 模式図の中で特定の物質を強調する（until の step で強調を解く） */
  highlight?: {members: string[]; step: number; until?: number; callout?: string};
  note?: string;
  noteStep?: number;
  noteLabel?: string;
};

const ID_W = 380;
const GAP = 24;
const ROW_GAP = 14;
const COLLAPSED = 80;
const NOTE_SPACE = 104;
const LABEL_W = 300;
const H = 676;

const itemSteps = (it: ProfileItem) => (it.type === 'ne' && it.subStep !== undefined ? [it.step, it.subStep] : [it.step]);

/* ------------------------------------------------------------------ */
/* 左：物質の名前とまとまり方                                            */
/* ------------------------------------------------------------------ */
const IdentityPanel: React.FC<{identity: Identity; kindStep: number; kindFocusSteps: number[]; highlight?: Props['highlight']}> = ({
  identity,
  kindStep,
  kindFocusSteps,
  highlight,
}) => {
  const c = toneColor(identity.tone);
  const base = useReveal(0, {duration: 0.7});
  const kindP = useReveal(kindStep);
  const kindFocus = useFocus((s) => (s === kindStep && kindStep > 0) || kindFocusSteps.includes(s));
  const hOn = useReveal(highlight ? highlight.step : 999, {duration: 0.7});
  const hOff = useReveal(highlight?.until ?? 999, {duration: 0.7});
  const hp = hOn * (1 - hOff);
  const hFocus = useFocus((s) => !!highlight && s === highlight.step);
  const calloutP = useReveal(highlight ? highlight.step : 999, {delay: 0.3}) * (1 - hOff);
  return (
    <div
      style={{
        ...fadeUp(base),
        position: 'absolute',
        left: 0,
        top: 0,
        width: ID_W,
        height: H,
        boxSizing: 'border-box',
        background: COLORS.surface,
        borderRadius: 22,
        border: `3px solid ${kindFocus > 0.5 || hFocus > 0.5 ? c.main : COLORS.lineSoft}`,
        borderTop: `14px solid ${c.main}`,
        padding: '18px 22px 14px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <div style={{fontSize: identity.nameSize ?? 66, fontWeight: 700, color: COLORS.ink, lineHeight: 1.15, whiteSpace: 'pre-line', letterSpacing: '0.02em'}}>
        {identity.name}
      </div>
      {identity.reading ? (
        <div style={{fontSize: identity.readingSize ?? 30, fontWeight: 500, color: COLORS.inkSoft, marginTop: 4, lineHeight: 1.3, whiteSpace: 'nowrap'}}>{identity.reading}</div>
      ) : null}
      <div style={{...fadeUp(kindP, 8), marginTop: 12}}>
        <Pill tone={identity.tone} filled={kindFocus > 0.5} size={28}>
          {identity.kind}
        </Pill>
      </div>
      <div style={{flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%'}}>
        <Cluster kind={identity.cluster} tone={identity.tone} highlight={highlight?.members} hp={hp} appear={kindStep > 0 ? 0.35 + 0.65 * kindP : 1} />
        {highlight?.callout ? (
          <div
            style={{
              ...fadeUp(calloutP, 8),
              width: '100%',
              boxSizing: 'border-box',
              background: c.soft,
              borderRadius: 12,
              padding: '6px 10px',
              fontSize: 28,
              fontWeight: 700,
              color: COLORS.ink,
              lineHeight: 1.35,
              whiteSpace: 'pre-line',
            }}
          >
            {highlight.callout}
          </div>
        ) : null}
      </div>
      <CornerTag appear={base} style={{padding: '2px 14px'}}>
        模式図
      </CornerTag>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 右：行の項目                                                         */
/* ------------------------------------------------------------------ */
const ChipBox: React.FC<{chip: Chip; tone: Tone}> = ({chip, tone}) => {
  const c = toneColor(tone);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 30,
        fontWeight: 700,
        color: COLORS.ink,
        background: c.soft,
        borderRadius: 12,
        padding: '5px 16px 5px 10px',
        whiteSpace: 'nowrap',
      }}
    >
      {chip.icon ? <Icon name={chip.icon} size={36} color={c.main} /> : null}
      {chip.text}
    </span>
  );
};

const SidePill: React.FC<{text: string; tone: Tone}> = ({text, tone}) => {
  const c = toneColor(tone);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: 32,
        fontWeight: 700,
        color: COLORS.ink,
        background: COLORS.surface,
        border: `3px solid ${c.main}`,
        borderRadius: 14,
        padding: '4px 18px',
        whiteSpace: 'nowrap',
        lineHeight: 1.35,
      }}
    >
      {text}
    </span>
  );
};

const ItemView: React.FC<{item: ProfileItem; allSteps: number[]; tone: Tone}> = ({item, allSteps, tone}) => {
  const c = toneColor(tone);
  const appear = useReveal(item.step);
  const mine = itemSteps(item);
  // 章の段階に含まれない step（導入の行）では強調しない。最後の段階より後は全体を強調
  const focus = useFocus((s) => (allSteps.includes(s) ? mine.includes(s) : s > Math.max(...allSteps)));
  const subP = useReveal(item.type === 'ne' ? (item.subStep ?? item.step) : item.step, {delay: item.type === 'ne' && item.subStep === undefined ? 0.35 : 0});
  // 話していない項目も読める濃さで残す
  const wrap: React.CSSProperties = {...fadeUp(appear, 10), opacity: appear * (0.64 + 0.36 * focus)};

  if (item.type === 'caveat') {
    return (
      <div style={{...wrap, display: 'flex', alignItems: 'center', gap: 16}}>
        <span style={{flexShrink: 0, fontSize: 28, fontWeight: 700, color: COLORS.surface, background: COLORS.gold, borderRadius: 8, padding: '3px 12px', letterSpacing: '0.06em'}}>
          {item.label ?? 'ただし'}
        </span>
        <span style={{fontSize: 32, fontWeight: 600, color: COLORS.ink, lineHeight: 1.4, whiteSpace: 'pre-line'}}>{item.text}</span>
      </div>
    );
  }
  if (item.type === 'badge') {
    return (
      <div style={{...wrap, display: 'flex', alignItems: 'center', gap: 16}}>
        <span style={{flexShrink: 0}}>
          <KindBadge kind={item.badge} label={item.badgeLabel} />
        </span>
        <span style={{fontSize: 34, fontWeight: 600, color: COLORS.ink, lineHeight: 1.4, whiteSpace: 'pre-line'}}>{item.text}</span>
      </div>
    );
  }
  if (item.type === 'ne') {
    return (
      <div style={{...wrap, display: 'flex', flexDirection: 'column', gap: 6}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
          <SidePill text={item.left} tone="green" />
          <span style={{fontSize: 52, fontWeight: 700, color: COLORS.gold, lineHeight: 1}}>≠</span>
          <SidePill text={item.right} tone="slate" />
        </div>
        {item.sub ? (
          <div style={{...fadeUp(subP, 8), fontSize: 30, fontWeight: 500, color: COLORS.inkSoft, lineHeight: 1.4, paddingLeft: 6}}>
            {item.sub}
          </div>
        ) : null}
      </div>
    );
  }
  const chips = item.chips ?? [];
  const textStyle: React.CSSProperties = {fontSize: 34, fontWeight: 600, color: COLORS.ink, lineHeight: 1.4, whiteSpace: 'pre-line'};
  // 短い語尾（「など」）は最後のチップと離さない
  const tailAttached = !!item.tail && chips.length > 0 && [...item.tail].length <= 3;
  return (
    <div style={{...wrap, display: 'flex', alignItems: 'flex-start', gap: 16}}>
      <span style={{flexShrink: 0, width: 14, height: 14, borderRadius: 7, background: c.main, marginTop: 19}} />
      <div style={{display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 12, rowGap: 8}}>
        {item.text ? <span style={{...textStyle, flexBasis: item.chipsBreak ? '100%' : undefined}}>{item.text}</span> : null}
        {chips.map((ch, i) =>
          tailAttached && i === chips.length - 1 ? (
            <span key={ch.text} style={{display: 'inline-flex', alignItems: 'center', gap: 12, whiteSpace: 'nowrap'}}>
              <ChipBox chip={ch} tone={tone} />
              <span style={textStyle}>{item.tail}</span>
            </span>
          ) : (
            <ChipBox key={ch.text} chip={ch} tone={tone} />
          ),
        )}
        {item.tail && !tailAttached ? <span style={textStyle}>{item.tail}</span> : null}
      </div>
    </div>
  );
};

const Row: React.FC<{
  def: (typeof ROW_DEFS)[number];
  state: RowState;
  height: number;
  allSteps: number[];
  tone: Tone;
}> = ({def, state, height, allSteps, tone}) => {
  const c = toneColor(tone);
  const base = useReveal(0, {duration: 0.6});
  const steps = state.mode === 'active' ? state.items.flatMap(itemSteps) : [];
  const focus = useFocus((s) => (state.mode !== 'active' ? false : allSteps.includes(s) ? steps.includes(s) : s > Math.max(...allSteps)));
  const active = state.mode === 'active';
  const labelBg = active ? (focus > 0.5 ? c.main : c.soft) : COLORS.panel;
  const labelColor = active ? (focus > 0.5 ? COLORS.surface : COLORS.ink) : COLORS.inkSoft;
  return (
    <div
      style={{
        ...fadeUp(base, 10),
        height,
        boxSizing: 'border-box',
        display: 'flex',
        background: COLORS.surface,
        borderRadius: 18,
        border: `3px solid ${active && focus > 0.5 ? c.main : COLORS.lineSoft}`,
        overflow: 'hidden',
        opacity: base * (active ? 1 : 0.85),
      }}
    >
      <div
        style={{
          width: LABEL_W,
          flexShrink: 0,
          background: labelBg,
          color: labelColor,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 18px',
          boxSizing: 'border-box',
        }}
      >
        <RowIcon icon={def.icon} size={40} />
        <span style={{fontSize: 30, fontWeight: 700, lineHeight: 1.3, whiteSpace: 'nowrap'}}>{def.label}</span>
      </div>
      <div style={{flex: 1, padding: '14px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10, minWidth: 0}}>
        {state.mode === 'hidden' ? <div style={{height: 0, borderTop: `3px dashed ${COLORS.lineSoft}`, width: '70%'}} /> : null}
        {state.mode === 'summary' ? (
          <div style={{fontSize: 30, fontWeight: 500, color: COLORS.inkSoft, lineHeight: 1.35, whiteSpace: 'nowrap', overflow: 'hidden'}}>{state.text}</div>
        ) : null}
        {state.mode === 'active' ? state.items.map((it, i) => <ItemView key={i} item={it} allSteps={allSteps} tone={tone} />) : null}
      </div>
    </div>
  );
};

export const SubstanceProfile: React.FC<Props> = ({identity, rows, kindStep = 0, kindFocusSteps = [], highlight, note, noteStep = 1, noteLabel}) => {
  const noteP = useReveal(noteStep);
  const itemStepList = ROW_DEFS.flatMap((d) => {
    const st = rows[d.key];
    return st.mode === 'active' ? st.items.flatMap(itemSteps) : [];
  });
  // 左の模式図だけを話している段階では、右の項目を強調しない
  const idSteps = [kindStep > 0 ? kindStep : -1, highlight ? highlight.step : -1, ...kindFocusSteps].filter((s) => s > 0 && !itemStepList.includes(s));
  const allSteps = [...itemStepList, ...idSteps];

  const areaH = H - (note ? NOTE_SPACE : 0);
  const collapsedCount = ROW_DEFS.filter((d) => rows[d.key].mode !== 'active').length;
  const weights = ROW_DEFS.map((d) => {
    const st = rows[d.key];
    return st.mode === 'active' ? (st.weight ?? 1) : 0;
  });
  const totalW = weights.reduce((a, b) => a + b, 0) || 1;
  const free = areaH - ROW_GAP * 3 - COLLAPSED * collapsedCount;

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <IdentityPanel identity={identity} kindStep={kindStep} kindFocusSteps={kindFocusSteps} highlight={highlight} />
      <div style={{position: 'absolute', left: ID_W + GAP, right: 0, top: 0, height: areaH, display: 'flex', flexDirection: 'column', gap: ROW_GAP}}>
        {ROW_DEFS.map((d, i) => (
          <Row
            key={d.key}
            def={d}
            state={rows[d.key]}
            height={rows[d.key].mode === 'active' ? (free * weights[i]) / totalW : COLLAPSED}
            allSteps={allSteps}
            tone={identity.tone}
          />
        ))}
      </div>
      {note ? (
        <div style={{position: 'absolute', left: ID_W + GAP, right: 0, bottom: 0}}>
          <NoteStrip appear={noteP} label={noteLabel}>
            {note}
          </NoteStrip>
        </div>
      ) : null}
    </div>
  );
};

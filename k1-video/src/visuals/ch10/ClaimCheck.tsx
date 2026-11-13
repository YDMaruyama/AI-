import React from 'react';
import {Icon, IconName} from '../../components/Icons';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {Arrow, NotEqual, Pill, SvgText, Tone, toneColor} from '../../components/ui';
import {COLORS} from '../../theme';
import {Rich} from '../templates/helpers';

/**
 * 不安をあおる情報を見分ける（原文 O1〜O4）。
 * 左に「情報の例」（吹き出しで引用）、右に「確かめること」を並べる落ち着いた構成。
 * 情報の例に×印・赤色・警告表現は使わず、確かめる観点を示すだけにする。
 * 上部の 4 つの見出し札で、いま何番目の例かを示す（現在の札は塗りの番号と太枠：色だけに頼らない）。
 *
 * 右側の中身は 3 種類：
 *  - items：確かめる観点のリスト（アイコン＋短い語）
 *  - pair ：混同しやすい 2 つを上下に置き「≠」で分ける
 *  - text ：1 つの語を大きく（左右を ≠ で比べる場合）
 */

const W = 1760;
const H = 676;
const STRIP_H = 60;
const PANEL_TOP = 92;
const NOTE_SPACE = 112;
const SIDE_W = 790;
const MID_W = W - SIDE_W * 2;

const DEFAULT_LABELS = ['印象的な換算', '検出と原因', '排出法の宣伝', '検査と予測'];

type Item = {text: string; sub?: string; icon?: IconName; step?: number};
type PairSide = {label: string; text: string};
type SideSpec = {
  tag: string;
  tone?: Tone;
  /** quote：吹き出しで引用、plain：アイコンと語を大きく */
  kind?: 'quote' | 'plain';
  text?: string;
  icon?: IconName;
  step?: number;
  items?: Item[];
  pair?: {a: PairSide; b: PairSide; label?: string; labelStep?: number};
};

/* ------------------------------------------------------------------ */
/* 上部の見出し札（1〜4）                                               */
/* ------------------------------------------------------------------ */
const Strip: React.FC<{index: number; labels: string[]; appear: number; highlightFrom: number}> = ({index, labels, appear, highlightFrom}) => {
  // highlightFrom の step までは四つの札を同じ見た目で並べ（「四つの例」の紹介）、以降は現在の札だけを示す
  const hl = useFocus((s) => s >= highlightFrom);
  return (
    <div
      style={{
        ...fadeUp(appear, 10),
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: STRIP_H,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 22,
      }}
    >
      {labels.map((l, i) => {
        const current = i + 1 === index && hl > 0.5;
        return (
          <div
            key={l}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '5px 24px 5px 6px',
              borderRadius: 999,
              border: `3px solid ${current ? COLORS.green : COLORS.lineSoft}`,
              background: current ? COLORS.greenSoft : COLORS.surface,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                boxSizing: 'border-box',
                border: `3px solid ${current ? COLORS.green : COLORS.line}`,
                background: current ? COLORS.green : COLORS.surface,
                color: current ? COLORS.surface : COLORS.inkSoft,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              {i + 1}
            </div>
            <div style={{fontSize: 28, fontWeight: 700, color: current ? COLORS.greenDeep : COLORS.inkSoft, whiteSpace: 'nowrap'}}>{l}</div>
          </div>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 下端の帯（例・補足）。共通の NoteStrip と同じ見た目で、ラベルを 28px にしたもの */
/* ------------------------------------------------------------------ */
const ExampleStrip: React.FC<{children: React.ReactNode; label?: string; appear?: number}> = ({children, label = '補足', appear = 1}) => (
  <div
    style={{
      ...fadeUp(appear, 12),
      display: 'flex',
      alignItems: 'center',
      gap: 22,
      background: COLORS.goldSoft,
      borderLeft: `8px solid ${COLORS.gold}`,
      borderRadius: 12,
      padding: '14px 28px',
      boxSizing: 'border-box',
    }}
  >
    <div
      style={{
        flexShrink: 0,
        fontSize: 28,
        fontWeight: 700,
        color: COLORS.surface,
        background: COLORS.gold,
        borderRadius: 8,
        padding: '3px 14px',
        letterSpacing: '0.08em',
      }}
    >
      {label}
    </div>
    <div style={{fontSize: 32, fontWeight: 500, color: COLORS.ink, lineHeight: 1.45}}>{children}</div>
  </div>
);

/* ------------------------------------------------------------------ */
/* パネルの枠                                                           */
/* ------------------------------------------------------------------ */
const Panel: React.FC<{
  x: number;
  h: number;
  tone: Tone;
  tag: string;
  icon?: IconName;
  appear: number;
  focus: number;
  children?: React.ReactNode;
}> = ({x, h, tone, tag, icon, appear, focus, children}) => {
  const c = toneColor(tone);
  return (
    <div
      style={{
        ...fadeUp(appear),
        opacity: appear * (0.72 + 0.28 * focus),
        position: 'absolute',
        left: x,
        top: PANEL_TOP,
        width: SIDE_W,
        height: h,
        boxSizing: 'border-box',
        background: COLORS.surface,
        borderRadius: 22,
        border: `3px solid ${focus > 0.5 ? c.main : COLORS.lineSoft}`,
        borderTop: `14px solid ${c.main}`,
        padding: '22px 36px 30px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
        {icon ? (
          <div style={{color: c.main, display: 'flex'}}>
            <Icon name={icon} size={46} />
          </div>
        ) : null}
        <Pill tone={tone} size={30}>
          {tag}
        </Pill>
      </div>
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>{children}</div>
    </div>
  );
};

/** 引用の吹き出し（中立の色。誤りの印は付けない） */
const QuoteBubble: React.FC<{text: string; appear: number}> = ({text, appear}) => (
  <div style={{...fadeUp(appear), position: 'relative', marginBottom: 26}}>
    <div
      style={{
        background: COLORS.panel,
        borderRadius: 28,
        padding: '34px 40px',
        fontSize: 42,
        fontWeight: 700,
        color: COLORS.ink,
        lineHeight: 1.55,
        letterSpacing: '0.02em',
        whiteSpace: 'pre-line',
      }}
    >
      「<Rich text={text} color={COLORS.gold} />」
    </div>
    <div
      style={{
        position: 'absolute',
        left: 80,
        bottom: -26,
        width: 0,
        height: 0,
        borderLeft: '0 solid transparent',
        borderRight: '40px solid transparent',
        borderTop: `28px solid ${COLORS.panel}`,
      }}
    />
  </div>
);

/** 大きな語（アイコン付き） */
const PlainWord: React.FC<{text: string; icon?: IconName; tone: Tone; appear: number}> = ({text, icon, tone, appear}) => {
  const c = toneColor(tone);
  return (
    <div style={{...fadeUp(appear), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30, textAlign: 'center'}}>
      {icon ? (
        <div
          style={{
            width: 132,
            height: 132,
            borderRadius: 66,
            background: c.soft,
            color: c.main,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={84} />
        </div>
      ) : null}
      <div style={{fontSize: 46, fontWeight: 700, color: COLORS.ink, lineHeight: 1.4, whiteSpace: 'pre-line'}}>
        <Rich text={text} color={c.main} />
      </div>
    </div>
  );
};

/** 確かめる観点の 1 行 */
const CheckRow: React.FC<{item: Item; appear: number; focus: number}> = ({item, appear, focus}) => (
  <div style={{...fadeUp(appear), opacity: appear * (0.6 + 0.4 * focus), display: 'flex', alignItems: 'center', gap: 26}}>
    <div
      style={{
        flexShrink: 0,
        width: 88,
        height: 88,
        borderRadius: 44,
        background: focus > 0.5 ? COLORS.green : COLORS.greenSoft,
        color: focus > 0.5 ? COLORS.surface : COLORS.green,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {item.icon ? <Icon name={item.icon} size={54} /> : <div style={{width: 18, height: 18, borderRadius: 9, background: 'currentColor'}} />}
    </div>
    <div>
      <div style={{fontSize: 40, fontWeight: 700, color: COLORS.ink, lineHeight: 1.35, whiteSpace: 'pre-line'}}>
        <Rich text={item.text} />
      </div>
      {item.sub ? <div style={{fontSize: 32, fontWeight: 500, color: COLORS.inkSoft, lineHeight: 1.4, marginTop: 4}}>{item.sub}</div> : null}
    </div>
  </div>
);

const Items: React.FC<{items: Item[]; base: number}> = ({items, base}) => {
  const steps = items.map((it, i) => it.step ?? base + i);
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 46}}>
      {items.map((it, i) => (
        <ItemRow key={i} item={it} index={i} steps={steps} />
      ))}
    </div>
  );
};

const ItemRow: React.FC<{item: Item; index: number; steps: number[]}> = ({item, index, steps}) => {
  const appear = useReveal(steps[index]);
  const focus = useFocus((s) => {
    if (steps.includes(s)) return steps[index] === s;
    return true;
  });
  return <CheckRow item={item} appear={appear} focus={focus} />;
};

/** 混同しやすい 2 つを上下に分ける */
const PairBox: React.FC<{side: PairSide; tone: Tone; dashed?: boolean}> = ({side, tone, dashed}) => {
  const c = toneColor(tone);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 22,
        border: `3px ${dashed ? 'dashed' : 'solid'} ${c.main}`,
        borderRadius: 18,
        padding: '18px 26px',
        background: COLORS.surface,
      }}
    >
      <Pill tone={tone} filled size={30}>
        {side.label}
      </Pill>
      <div style={{fontSize: 40, fontWeight: 700, color: COLORS.ink, whiteSpace: 'nowrap'}}>{side.text}</div>
    </div>
  );
};

const Pair: React.FC<{pair: NonNullable<SideSpec['pair']>; step: number}> = ({pair, step}) => {
  const a = useReveal(step);
  const b = useReveal(step, {delay: 0.35});
  const ne = useReveal(step, {delay: 0.6});
  const lab = useReveal(pair.labelStep ?? step, {delay: pair.labelStep === undefined ? 0.6 : 0});
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 6}}>
      <div style={fadeUp(a)}>
        <PairBox side={pair.a} tone="slate" />
      </div>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, height: 96}}>
        <div style={{opacity: ne, fontSize: 80, fontWeight: 700, color: COLORS.gold, lineHeight: 1}}>≠</div>
        {pair.label ? <div style={{...fadeUp(lab, 8), fontSize: 30, fontWeight: 700, color: COLORS.gold}}>{pair.label}</div> : null}
      </div>
      <div style={fadeUp(b)}>
        <PairBox side={pair.b} tone="gold" dashed />
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 本体                                                                 */
/* ------------------------------------------------------------------ */
export const ClaimCheck: React.FC<{
  index: number;
  labels?: string[];
  left: SideSpec;
  right: SideSpec;
  relation?: 'arrow' | 'ne';
  relationLabel?: string;
  relationStep?: number;
  note?: string;
  noteStep?: number;
  noteLabel?: string;
  /** この step から上部の札で現在の例を示す（既定 0。章の最初の例では紹介の行のあとにする） */
  stripFocusStep?: number;
}> = ({index, labels = DEFAULT_LABELS, left, right, relation = 'arrow', relationLabel, relationStep, note, noteStep = 2, noteLabel, stripFocusStep = 0}) => {
  const leftStep = left.step ?? 0;
  const rightStep = right.step ?? 1;
  const relStep = relationStep ?? rightStep;

  const frame = useReveal(0, {duration: 0.7});
  const leftIn = useReveal(leftStep);
  const rightIn = useReveal(rightStep);
  const rel = useReveal(relStep, {duration: 0.9});
  const noteIn = useReveal(noteStep);
  // 右の観点が出たら左は読める濃さで残す（比較対象を同時に見せる）
  const leftFocus = useFocus((s) => s < rightStep || (note !== undefined && s >= noteStep));
  const rightFocus = useFocus((s) => s >= rightStep);

  const panelH = H - PANEL_TOP - (note ? NOTE_SPACE : 12);
  const midY = PANEL_TOP + panelH / 2;

  const leftTone = left.tone ?? 'slate';
  const rightTone = right.tone ?? 'green';

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <Strip index={index} labels={labels} appear={frame} highlightFrom={stripFocusStep} />

      <Panel x={0} h={panelH} tone={leftTone} tag={left.tag} icon={left.kind === 'plain' ? undefined : left.icon} appear={frame} focus={leftFocus}>
        {left.kind === 'plain' ? (
          <PlainWord text={left.text ?? ''} icon={left.icon} tone={leftTone} appear={leftIn} />
        ) : (
          <QuoteBubble text={left.text ?? ''} appear={leftIn} />
        )}
      </Panel>

      {/* 中央：確かめる矢印、または ≠ */}
      <div
        style={{position: 'absolute', left: SIDE_W, width: MID_W, top: midY - 90, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center'}}
      >
        {relation === 'arrow' ? (
          <svg width={MID_W} height={180} viewBox={`0 0 ${MID_W} 180`}>
            {relationLabel ? (
              <SvgText x={MID_W / 2} y={52} size={28} weight={700} color={COLORS.gold} opacity={rel}>
                {relationLabel}
              </SvgText>
            ) : null}
            <Arrow from={[26, 104]} to={[MID_W - 26, 104]} p={rel} color={COLORS.gold} width={6} />
          </svg>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
            <NotEqual appear={rel} size={96} />
            {relationLabel ? (
              <div style={{...fadeUp(rel, 8), fontSize: 28, fontWeight: 700, color: COLORS.gold, whiteSpace: 'nowrap'}}>{relationLabel}</div>
            ) : null}
          </div>
        )}
      </div>

      <Panel
        x={SIDE_W + MID_W}
        h={panelH}
        tone={rightTone}
        tag={right.tag}
        icon={right.kind === 'plain' ? undefined : right.icon}
        appear={frame}
        focus={rightFocus}
      >
        {right.items ? <Items items={right.items} base={rightStep} /> : null}
        {right.pair ? <Pair pair={right.pair} step={rightStep} /> : null}
        {!right.items && !right.pair && right.text ? <PlainWord text={right.text} icon={right.icon} tone={rightTone} appear={rightIn} /> : null}
      </Panel>

      {note ? (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0}}>
          <ExampleStrip appear={noteIn} label={noteLabel}>
            {note}
          </ExampleStrip>
        </div>
      ) : null}
    </div>
  );
};

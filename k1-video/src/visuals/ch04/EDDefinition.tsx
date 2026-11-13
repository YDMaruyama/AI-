import React from 'react';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {Arrow, SvgText} from '../../components/ui';
import {COLORS} from '../../theme';
import {Diamond, Hex, Square, Tag} from './parts';

/**
 * 内分泌かく乱物質の定義と「環境ホルモン」という呼び名（I3）。
 * 上段：ホルモン系の働きを変化させ →（それによって）→ 健康への有害な影響を起こす ＝ 内分泌かく乱物質
 * 下段：「環境ホルモン」は広く使われてきた呼び名。似た働き（⬡）だけでなく、
 *       作用を弱める（■）、作られる量や分解される速さを変える（◆）場合もある。
 * 形の記号は第6章（ホルモンの情報伝達）と揃えている。
 */
type Steps = {change: number; harm: number; term: number; name: number; mimic: number; weaken: number; amount: number};

const BoxText: React.FC<{text: string; appear: number; tone: 'gold' | 'slate'}> = ({text, appear, tone}) => (
  <div
    style={{
      ...fadeUp(appear, 10),
      width: 700,
      height: 120,
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 42,
      fontWeight: 700,
      color: COLORS.ink,
      background: COLORS.surface,
      border: `4px solid ${tone === 'gold' ? COLORS.gold : COLORS.slate}`,
      borderRadius: 18,
    }}
  >
    {text}
  </div>
);

const WayCard: React.FC<{shape: 'hex' | 'square' | 'diamond'; text: string; appear: number; focus: number; tag?: string; tagAppear?: number}> = ({
  shape,
  text,
  appear,
  focus,
  tag,
  tagAppear = 0,
}) => (
  <div
    style={{
      ...fadeUp(appear, 12),
      opacity: appear * (0.55 + 0.45 * focus),
      position: 'relative',
      width: 560,
      height: 200,
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      gap: 18,
      padding: '0 26px',
      background: COLORS.surface,
      border: `3px solid ${focus > 0.5 ? (shape === 'hex' ? COLORS.gold : COLORS.slate) : COLORS.lineSoft}`,
      borderRadius: 20,
    }}
  >
    <svg width={76} height={76} viewBox="0 0 90 90" style={{flexShrink: 0}}>
      {shape === 'hex' ? <Hex x={45} y={45} r={36} /> : null}
      {shape === 'square' ? <Square x={45} y={45} r={32} /> : null}
      {shape === 'diamond' ? <Diamond x={45} y={45} r={38} /> : null}
    </svg>
    <div style={{fontSize: 36, fontWeight: 700, color: COLORS.ink, lineHeight: 1.4, whiteSpace: 'pre-line'}}>{text}</div>
    {tag ? (
      <div style={{position: 'absolute', right: 18, top: -24, opacity: tagAppear}}>
        <Tag tone="gold" filled size={30}>
          {tag}
        </Tag>
      </div>
    ) : null}
  </div>
);

export const EDDefinition: React.FC<{steps?: Steps}> = ({
  steps = {change: 1, harm: 2, term: 3, name: 4, mimic: 5, weaken: 6, amount: 7},
}) => {
  const a = useReveal(steps.change);
  const arrow = useReveal(steps.harm, {duration: 0.7});
  const b = useReveal(steps.harm, {delay: 0.4});
  const term = useReveal(steps.term);
  const name = useReveal(steps.name);
  const mimic = useReveal(steps.mimic);
  const mimicTag = useReveal(steps.mimic, {delay: 0.8});
  const weaken = useReveal(steps.weaken);
  const amount = useReveal(steps.amount);
  const topFocus = useFocus((s) => s < steps.name);
  const fm = useFocus((s) => s === steps.mimic || s > steps.amount);
  const fw = useFocus((s) => s >= steps.weaken);
  const fa = useFocus((s) => s >= steps.weaken);

  return (
    <div style={{position: 'absolute', inset: 0}}>
      {/* 上段：定義 */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 290, opacity: 0.5 + 0.5 * topFocus}}>
        <div style={{position: 'absolute', left: 30, top: 24}}>
          <BoxText text="ホルモン系の働きを変化させ" appear={a} tone="slate" />
        </div>
        <div style={{position: 'absolute', left: 1030, top: 24}}>
          <BoxText text="健康への有害な影響を起こす" appear={b} tone="gold" />
        </div>
        <svg width={1760} height={290} viewBox="0 0 1760 290" style={{position: 'absolute', left: 0, top: 0}}>
          <Arrow from={[748, 84]} to={[1016, 84]} p={arrow} color={COLORS.ink} width={5} />
          <g opacity={arrow}>
            <SvgText x={882} y={44} size={30} weight={700} color={COLORS.inkSoft}>
              それによって
            </SvgText>
          </g>
          <g opacity={term}>
            <path d="M30 170 v22 h1700 v-22" fill="none" stroke={COLORS.green} strokeWidth={4} strokeLinejoin="round" />
            <path d="M880 192 v18" stroke={COLORS.green} strokeWidth={4} />
          </g>
        </svg>
        <div style={{...fadeUp(term, 10), position: 'absolute', left: 0, right: 0, top: 216, display: 'flex', justifyContent: 'center'}}>
          <span style={{fontSize: 46, fontWeight: 700, color: COLORS.greenDeep, background: COLORS.greenSoft, borderRadius: 14, padding: '4px 30px'}}>内分泌かく乱物質</span>
        </div>
      </div>

      {/* 下段：「環境ホルモン」という呼び名 */}
      <div style={{...fadeUp(name, 10), position: 'absolute', left: 0, top: 330, display: 'flex', alignItems: 'center', gap: 22}}>
        <Tag tone="neutral" size={38}>
          「環境ホルモン」
        </Tag>
        <span style={{fontSize: 38, fontWeight: 700, color: COLORS.inkSoft}}>広く使われてきた呼び名</span>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 444, display: 'flex', justifyContent: 'space-between'}}>
        <WayCard shape="hex" text={"ホルモンに\n似た働きをする"} appear={mimic} focus={fm} tag="これだけではない" tagAppear={mimicTag} />
        <WayCard shape="square" text={"ホルモンの\n作用を弱める"} appear={weaken} focus={fw} />
        <WayCard shape="diamond" text={"作られる量や、\n分解される速さを変える"} appear={amount} focus={fa} />
      </div>
    </div>
  );
};

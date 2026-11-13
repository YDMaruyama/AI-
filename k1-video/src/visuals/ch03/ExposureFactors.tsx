import React from 'react';
import {Icon, IconName} from '../../components/Icons';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {NoteStrip} from '../../components/ui';
import {COLORS} from '../../theme';

/**
 * 「物質・量・時間・使い方・本人の条件」を、横一列のチップで順に強調する図。
 * - 上段（lead）：接点の例（食事・呼吸・肌に触れるもの／容器・洗顔・換気・保存 など）→ 結果の一文
 * - 下段（chips）：見ること。話しているチップだけ強調し、他は読める濃さで残す
 * - origin：チップの前に置く「由来（天然か合成か）」と「＋（加えて）」の区切り（E2 用）
 * 強調ルール：groups[step] があればその番号（origin は -1）、
 *             step に対応するチップがあればそのチップ、allStep 以降は全部、それ以外は表示済みの全部。
 */
type LeadItem = {icon: IconName; text: string; delay?: number};
type Lead = {items: LeadItem[]; result: string; resultDelay?: number; extra?: string; extraStep?: number};
type Chip = {title: string; sub?: string; icon: IconName; step: number; divider?: boolean};
type Origin = {title: string; sub?: string; icon: IconName; step: number; joiner?: string};

const LEAD_H = 140;
const CHIP_TOP = 262;
const CHIP_H_DEFAULT = 340;

const isFocused = (
  index: number,
  step: number,
  chips: Chip[],
  origin: Origin | undefined,
  groups: Record<string, number[]> | undefined,
  allStep: number | undefined,
) => {
  if (allStep !== undefined && step >= allStep) return true;
  const g = groups?.[String(step)];
  if (g) return g.includes(index);
  const own = index === -1 ? origin?.step : chips[index]?.step;
  const anyOwn = chips.some((c) => c.step === step) || origin?.step === step;
  if (anyOwn) return own === step;
  return true;
};

const LeadRow: React.FC<{lead: Lead}> = ({lead}) => {
  const base = useReveal(0, {duration: 0.6});
  const result = useReveal(0, {delay: lead.resultDelay ?? 1.6});
  const extra = useReveal(lead.extraStep ?? 99);
  return (
    <div
      style={{
        ...fadeUp(base),
        position: 'absolute',
        left: 0,
        right: 0,
        top: 14,
        height: LEAD_H,
        boxSizing: 'border-box',
        background: COLORS.panel,
        borderRadius: 22,
        padding: '0 40px',
        display: 'flex',
        alignItems: 'center',
        gap: 30,
      }}
    >
      {lead.items.map((it, i) => (
        <LeadChip key={i} item={it} />
      ))}
      <svg width={70} height={40} viewBox="0 0 70 40" style={{flexShrink: 0, opacity: result}}>
        <path d="M4 20h56M46 8l14 12-14 12" fill="none" stroke={COLORS.gold} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
        <div style={{...fadeUp(result, 10), fontSize: 38, fontWeight: 700, color: COLORS.ink, whiteSpace: 'nowrap'}}>{lead.result}</div>
        {lead.extra ? (
          <div style={{...fadeUp(extra, 10), display: 'flex', alignItems: 'center', gap: 10, fontSize: 32, fontWeight: 700, color: COLORS.greenDeep, whiteSpace: 'nowrap'}}>
            <Icon name="check" size={36} color={COLORS.green} />
            {lead.extra}
          </div>
        ) : null}
      </div>
    </div>
  );
};

const LeadChip: React.FC<{item: LeadItem}> = ({item}) => {
  const p = useReveal(0, {delay: item.delay ?? 0});
  return (
    <div style={{...fadeUp(p, 10), display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0}}>
      <div
        style={{
          width: 68,
          height: 68,
          borderRadius: 34,
          background: COLORS.surface,
          color: COLORS.green,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={item.icon} size={44} />
      </div>
      <div style={{fontSize: 36, fontWeight: 700, color: COLORS.ink, whiteSpace: 'nowrap'}}>{item.text}</div>
    </div>
  );
};

const ChipBox: React.FC<{
  title: string;
  sub?: string;
  icon: IconName;
  appear: number;
  focus: number;
  height: number;
  tone?: 'green' | 'slate';
}> = ({title, sub, icon, appear, focus, height, tone = 'green'}) => {
  const main = tone === 'green' ? COLORS.green : COLORS.slate;
  const soft = tone === 'green' ? COLORS.greenSoft : COLORS.slateSoft;
  const on = focus > 0.5;
  return (
    <div
      style={{
        ...fadeUp(appear),
        opacity: appear * (0.55 + 0.45 * focus),
        flex: 1,
        minWidth: 0,
        height,
        boxSizing: 'border-box',
        background: COLORS.surface,
        borderRadius: 22,
        border: `3px ${tone === 'slate' ? 'dashed' : 'solid'} ${on ? main : COLORS.lineSoft}`,
        boxShadow: on ? `0 10px 26px rgba(42,43,42,${0.1 * focus})` : 'none',
        padding: '34px 18px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: sub ? 'flex-start' : 'center',
        gap: 18,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 104,
          height: 104,
          borderRadius: 52,
          background: on ? main : soft,
          color: on ? COLORS.surface : main,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon name={icon} size={64} />
      </div>
      <div style={{fontSize: 46, fontWeight: 700, color: COLORS.ink, lineHeight: 1.25, whiteSpace: 'nowrap'}}>{title}</div>
      {sub ? (
        <div style={{fontSize: 30, fontWeight: 500, color: COLORS.inkSoft, lineHeight: 1.45, whiteSpace: 'pre-line'}}>{sub}</div>
      ) : null}
    </div>
  );
};

const FactorChip: React.FC<{
  chip: Chip;
  index: number;
  chips: Chip[];
  origin?: Origin;
  groups?: Record<string, number[]>;
  allStep?: number;
  height: number;
}> = ({chip, index, chips, origin, groups, allStep, height}) => {
  const appear = useReveal(chip.step);
  const focus = useFocus((s) => isFocused(index, s, chips, origin, groups, allStep));
  return (
    <>
      {chip.divider ? <div style={{opacity: appear, width: 0, height: height - 40, borderLeft: `3px dashed ${COLORS.line}`, flexShrink: 0}} /> : null}
      <ChipBox title={chip.title} sub={chip.sub} icon={chip.icon} appear={appear} focus={focus} height={height} />
    </>
  );
};

const OriginChip: React.FC<{origin: Origin; chips: Chip[]; groups?: Record<string, number[]>; allStep?: number; height: number}> = ({
  origin,
  chips,
  groups,
  allStep,
  height,
}) => {
  const appear = useReveal(origin.step);
  const focus = useFocus((s) => isFocused(-1, s, chips, origin, groups, allStep));
  const join = useReveal(Math.min(...chips.map((c) => c.step)));
  return (
    <>
      <ChipBox title={origin.title} sub={origin.sub} icon={origin.icon} appear={appear} focus={focus} height={height} tone="slate" />
      <div style={{...fadeUp(join, 10), width: 96, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4}}>
        <div style={{fontSize: 72, fontWeight: 700, color: COLORS.gold, lineHeight: 1}}>＋</div>
        <div style={{fontSize: 28, fontWeight: 700, color: COLORS.gold, whiteSpace: 'nowrap'}}>{origin.joiner ?? '加えて'}</div>
      </div>
    </>
  );
};

export const ExposureFactors: React.FC<{
  lead?: Lead;
  chips: Chip[];
  origin?: Origin;
  chipsLabel?: string;
  chipsLabelStep?: number;
  groups?: Record<string, number[]>;
  allStep?: number;
  chipHeight?: number;
  note?: string;
  noteStep?: number;
  noteLabel?: string;
}> = ({lead, chips, origin, chipsLabel, chipsLabelStep, groups, allStep, chipHeight = CHIP_H_DEFAULT, note, noteStep = 99, noteLabel}) => {
  const label = useReveal(chipsLabelStep ?? Math.min(...chips.map((c) => c.step)));
  const noteP = useReveal(noteStep);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      {lead ? <LeadRow lead={lead} /> : null}
      {chipsLabel ? (
        <div style={{...fadeUp(label, 10), position: 'absolute', left: 6, top: CHIP_TOP - 62, fontSize: 32, fontWeight: 700, color: COLORS.inkSoft}}>
          {chipsLabel}
        </div>
      ) : null}
      <div style={{position: 'absolute', left: 0, right: 0, top: CHIP_TOP, display: 'flex', alignItems: 'center', gap: 24}}>
        {origin ? <OriginChip origin={origin} chips={chips} groups={groups} allStep={allStep} height={chipHeight} /> : null}
        {chips.map((c, i) => (
          <FactorChip key={i} chip={c} index={i} chips={chips} origin={origin} groups={groups} allStep={allStep} height={chipHeight} />
        ))}
      </div>
      {note ? (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0}}>
          <NoteStrip appear={noteP} label={noteLabel}>
            {note}
          </NoteStrip>
        </div>
      ) : null}
    </div>
  );
};

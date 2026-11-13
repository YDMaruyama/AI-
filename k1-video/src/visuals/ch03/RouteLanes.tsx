import React from 'react';
import {Icon, IconName} from '../../components/Icons';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {CornerTag} from '../../components/ui';
import {COLORS} from '../../theme';

/**
 * 身体と物質が接する三つの経路（食事・呼吸・皮膚）を、別々のレーンとして並べる模式図。
 * 一本の流れ（パイプライン）にはせず、レーンごとに入口と届く先、考えることを示す。
 * 実線矢印＝届く先、点線矢印・点線ラベル＝「一部」。
 * 皮膚のレーンは見出しのみ（詳しくは皮膚の断面図のシーンで扱う）。
 *
 * props
 *  - active：説明中のレーン
 *  - done：すでに説明したレーン（最初から完成状態で、控えめに表示）
 *  - intro：true なら step 0 でレーン見出しを順に出し、step 0 の間は全レーンを同じ濃さで示す
 *  - steps：flow（入口→届く先）、part（点線の「一部」）、factors（考えること）
 */
type LaneKey = 'food' | 'air' | 'skin';
type FlowItem = {text: string; dashed?: boolean};
type LaneDef = {label: string; icon: IconName; flow: FlowItem[]; factorsTitle: string; factors: string[]};

const LANES: Record<LaneKey, LaneDef> = {
  food: {
    label: '食事',
    icon: 'food',
    flow: [{text: '口から入る'}, {text: '消化管へ'}, {text: '一部が吸収', dashed: true}],
    factorsTitle: '大切なこと',
    factors: ['何を', 'どのくらい食べたか', 'どの物質か'],
  },
  air: {
    label: '呼吸',
    icon: 'lungs',
    flow: [{text: '吸い込む'}, {text: '気道や肺に届く'}],
    factorsTitle: '接し方に関わること',
    factors: ['物質の形', '空気中の濃度', '吸い込む時間', '環境'],
  },
  skin: {
    label: '皮膚',
    icon: 'skin',
    flow: [],
    factorsTitle: '',
    factors: [],
  },
};
const ORDER: LaneKey[] = ['food', 'air', 'skin'];

const TOP = 58;
const LANE_H = 192;
const LANE_GAP = 13;
const LABEL_W = 210;
const FLOW_W = 860;

type Steps = {flow: number; part?: number; factors: number};

const FlowArrow: React.FC<{dashed?: boolean; p: number}> = ({dashed, p}) => (
  <svg width={60} height={36} viewBox="0 0 60 36" style={{flexShrink: 0, opacity: p}}>
    <path
      d="M4 18h44"
      fill="none"
      stroke={dashed ? COLORS.slate : COLORS.green}
      strokeWidth={5}
      strokeLinecap="round"
      strokeDasharray={dashed ? '9 8' : undefined}
    />
    <path d="M40 7l13 11-13 11" fill="none" stroke={dashed ? COLORS.slate : COLORS.green} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const FlowPill: React.FC<{item: FlowItem; p: number}> = ({item, p}) => (
  <div
    style={{
      ...fadeUp(p, 8),
      flexShrink: 0,
      fontSize: 34,
      fontWeight: 700,
      whiteSpace: 'nowrap',
      color: item.dashed ? COLORS.slate : COLORS.greenDeep,
      background: item.dashed ? COLORS.surface : COLORS.greenSoft,
      border: `3px ${item.dashed ? 'dashed' : 'solid'} ${item.dashed ? COLORS.slate : COLORS.greenSoft}`,
      borderRadius: 999,
      padding: '10px 22px',
    }}
  >
    {item.text}
  </div>
);

const Lane: React.FC<{
  k: LaneKey;
  index: number;
  active: LaneKey;
  done: LaneKey[];
  intro: boolean;
  steps: Steps;
}> = ({k, index, active, done, intro, steps}) => {
  const def = LANES[k];
  const isActive = k === active;
  const isDone = done.includes(k);
  const laneIn = useReveal(0, {delay: intro ? 0.3 + index * 0.35 : 0, duration: 0.6});
  // フロー各要素：説明中のレーンは段階で、説明済みのレーンは最初から表示
  const partStep = steps.part ?? steps.flow;
  const f0 = useReveal(steps.flow, {delay: 0.1});
  const a0 = useReveal(steps.flow, {delay: 0.6});
  const f1 = useReveal(steps.flow, {delay: 0.9});
  const a1 = useReveal(partStep, {delay: steps.part !== undefined ? 0.1 : 1.4});
  const f2 = useReveal(partStep, {delay: steps.part !== undefined ? 0.5 : 1.7});
  const fx = useReveal(steps.factors);
  const fxP = [
    useReveal(steps.factors, {delay: 0.3}),
    useReveal(steps.factors, {delay: 0.6}),
    useReveal(steps.factors, {delay: 0.9}),
    useReveal(steps.factors, {delay: 1.2}),
  ];
  const vis = (p: number) => (isDone ? 1 : isActive ? p : 0);
  const pFlow = [vis(f0), vis(f1), vis(f2)];
  const pArrow = [vis(a0), vis(a1)];

  const focus = useFocus((s) => (intro && s === 0 ? true : isActive && (s >= steps.flow || !intro)));
  // 強調色（緑）は説明中のレーンだけ。導入（step 0）では全レーンを同じ見た目にする
  const emph = useFocus((s) => isActive && (!intro || s >= steps.flow));
  const on = emph > 0.5;

  return (
    <div
      style={{
        ...fadeUp(laneIn, 10),
        opacity: laneIn * (0.42 + 0.58 * focus),
        position: 'absolute',
        left: 0,
        right: 0,
        top: TOP + index * (LANE_H + LANE_GAP),
        height: LANE_H,
        boxSizing: 'border-box',
        background: COLORS.surface,
        borderRadius: 22,
        border: `3px solid ${on ? COLORS.green : COLORS.lineSoft}`,
        boxShadow: on ? `0 10px 26px rgba(42,43,42,${0.1 * emph})` : 'none',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      {/* レーン見出し */}
      <div
        style={{
          width: LABEL_W,
          height: '100%',
          flexShrink: 0,
          background: on ? COLORS.green : COLORS.panel,
          color: on ? COLORS.surface : COLORS.green,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <Icon name={def.icon} size={70} />
        <div style={{fontSize: 46, fontWeight: 700, color: on ? COLORS.surface : COLORS.ink, letterSpacing: '0.1em', marginLeft: '0.1em'}}>{def.label}</div>
      </div>

      {/* 入口 → 届く先 */}
      <div style={{width: FLOW_W, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 40, boxSizing: 'border-box'}}>
        {def.flow.map((it, i) => (
          <React.Fragment key={it.text}>
            {i > 0 ? <FlowArrow dashed={it.dashed} p={pArrow[i - 1] ?? 0} /> : null}
            <FlowPill item={it} p={pFlow[i] ?? 0} />
          </React.Fragment>
        ))}
      </div>

      {/* 考えること */}
      {def.factors.length ? (
        <div
          style={{
            flex: 1,
            height: '100%',
            boxSizing: 'border-box',
            borderLeft: `3px dashed ${COLORS.lineSoft}`,
            padding: '12px 26px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <div style={{...fadeUp(vis(fx), 6), fontSize: 28, fontWeight: 700, color: COLORS.inkSoft, lineHeight: 1.3}}>{def.factorsTitle}</div>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px 12px'}}>
            {def.factors.map((t, i) => (
              <div
                key={t}
                style={{
                  ...fadeUp(vis(fxP[i] ?? 1), 6),
                  fontSize: 30,
                  fontWeight: 700,
                  lineHeight: 1.3,
                  color: COLORS.ink,
                  background: COLORS.goldSoft,
                  border: `2px solid ${COLORS.gold}`,
                  borderRadius: 12,
                  padding: '4px 14px',
                  whiteSpace: 'nowrap',
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export const RouteLanes: React.FC<{active?: LaneKey; done?: LaneKey[]; intro?: boolean; steps?: Steps}> = ({
  active = 'food',
  done = [],
  intro = false,
  steps = {flow: 1, part: 2, factors: 3},
}) => {
  const tag = useReveal(0, {duration: 0.6});
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', right: 0, top: 0}}>
        <CornerTag appear={tag}>模式図</CornerTag>
      </div>
      <div style={{...fadeUp(tag, 6), position: 'absolute', left: 4, top: 4, fontSize: 30, fontWeight: 700, color: COLORS.inkSoft}}>
        経路ごとに分けて見る
      </div>
      {ORDER.map((k, i) => (
        <Lane key={k} k={k} index={i} active={active} done={done} intro={intro} steps={steps} />
      ))}
    </div>
  );
};

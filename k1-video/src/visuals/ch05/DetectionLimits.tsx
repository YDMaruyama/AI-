import React from 'react';
import {Icon} from '../../components/Icons';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {CornerTag} from '../../components/ui';
import {COLORS} from '../../theme';
import {Panel, Shard} from './parts';

/**
 * 粒子が報告された食品・飲料の一覧と、その読み方の限界。
 *  左：報告の例（順位を付けない）
 *  中：研究ごとに測定法・対象粒子が異なる（レンズの線種と中身の形を変えた模式）
 *  右：食品名を並べても分からないこと（摂取量の順位・健康リスク）
 */
type Steps = {list: number; studies: number; unknown: number};

const Lens: React.FC<{kind: 'shard' | 'fiber' | 'dot'; ring: 'solid' | 'dashed' | 'double'}> = ({kind, ring}) => (
  <svg width={150} height={124} viewBox="0 0 150 124">
    <circle cx={62} cy={58} r={46} fill={COLORS.bg} stroke={COLORS.slate} strokeWidth={5} strokeDasharray={ring === 'dashed' ? '10 8' : undefined} />
    {ring === 'double' ? <circle cx={62} cy={58} r={37} fill="none" stroke={COLORS.slate} strokeWidth={3} /> : null}
    <line x1={96} y1={92} x2={130} y2={118} stroke={COLORS.slate} strokeWidth={9} strokeLinecap="round" />
    {kind === 'shard' ? (
      <>
        <Shard x={48} y={48} r={14} rot={15} />
        <Shard x={76} y={70} r={12} rot={-40} />
      </>
    ) : null}
    {kind === 'fiber' ? (
      <>
        <path d="M34 44 C 50 30, 66 60, 88 44" fill="none" stroke={COLORS.slate} strokeWidth={6} strokeLinecap="round" />
        <path d="M38 72 C 54 60, 70 86, 90 70" fill="none" stroke={COLORS.slate} strokeWidth={6} strokeLinecap="round" />
      </>
    ) : null}
    {kind === 'dot' ? (
      <>
        {[
          [44, 44],
          [62, 40],
          [80, 50],
          [50, 64],
          [70, 70],
          [58, 82],
          [84, 76],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={4.5} fill={COLORS.slate} />
        ))}
      </>
    ) : null}
  </svg>
);

const STUDIES: {name: string; kind: 'shard' | 'fiber' | 'dot'; ring: 'solid' | 'dashed' | 'double'}[] = [
  {name: '研究A', kind: 'shard', ring: 'solid'},
  {name: '研究B', kind: 'fiber', ring: 'dashed'},
  {name: '研究C', kind: 'dot', ring: 'double'},
];

export const DetectionLimits: React.FC<{steps?: Steps}> = ({steps = {list: 1, studies: 2, unknown: 3}}) => {
  const list = useReveal(steps.list);
  const studies = useReveal(steps.studies);
  const unknown = useReveal(steps.unknown);
  const fList = useFocus((s) => s <= steps.list || s >= steps.unknown);
  const fStudies = useFocus((s) => s === steps.studies);
  const fUnknown = useFocus((s) => s >= steps.unknown);

  return (
    <div style={{position: 'absolute', inset: 0, display: 'flex', gap: 40, alignItems: 'stretch', paddingTop: 10, paddingBottom: 30, boxSizing: 'border-box'}}>
      {/* 報告の例 */}
      <Panel title="微小な粒子の報告" tag="例" tone="green" width={520} height="100%" appear={list} focus={fList}>
        <div style={{display: 'flex', flexDirection: 'column', gap: 40, marginTop: 50}}>
          {[
            {icon: 'fish' as const, text: '魚介類', sub: 'だけでなく'},
            {icon: 'food' as const, text: 'さまざまな食品'},
            {icon: 'glass' as const, text: '飲料'},
          ].map((r) => (
            <div key={r.text}>
              <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
                <div style={{width: 96, height: 96, borderRadius: 48, background: COLORS.greenSoft, color: COLORS.green, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
                  <Icon name={r.icon} size={62} />
                </div>
                <div style={{fontSize: 44, fontWeight: 700, color: COLORS.ink}}>{r.text}</div>
              </div>
              {r.sub ? <div style={{fontSize: 30, fontWeight: 500, color: COLORS.inkSoft, marginLeft: 116, marginTop: 4}}>{r.sub}</div> : null}
            </div>
          ))}
        </div>
      </Panel>

      {/* 研究ごとの違い */}
      <Panel title="研究ごとに異なる" tag="測定" tone="slate" width={560} height="100%" appear={studies} focus={fStudies}>
        <div style={{display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14}}>
          {STUDIES.map((s) => (
            <div key={s.name} style={{display: 'flex', alignItems: 'center', gap: 20}}>
              <div style={{fontSize: 34, fontWeight: 700, color: COLORS.slate, width: 110}}>{s.name}</div>
              <Lens kind={s.kind} ring={s.ring} />
            </div>
          ))}
        </div>
        <div style={{position: 'absolute', left: 28, right: 28, bottom: 22, fontSize: 32, fontWeight: 700, color: COLORS.ink, lineHeight: 1.4}}>
          測定法・対象とする粒子が違う
        </div>
        <div style={{position: 'absolute', right: 24, top: 110}}>
          <CornerTag appear={studies}>模式図</CornerTag>
        </div>
      </Panel>

      {/* 分からないこと */}
      <Panel tone="gold" width={600} height="100%" appear={unknown} focus={fUnknown}>
        <div style={{fontSize: 38, fontWeight: 700, color: COLORS.ink, lineHeight: 1.35}}>
          食品名を並べるだけでは
          <br />
          分からないこと
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 36, marginTop: 60}}>
          {['摂取量の順位', '健康リスク'].map((t, i) => (
            <div key={t} style={{...fadeUp(i === 0 ? unknown : Math.max(0, unknown * 1.5 - 0.5), 10), display: 'flex', alignItems: 'center', gap: 22, background: COLORS.goldSoft, borderRadius: 16, padding: '24px 26px'}}>
              <div style={{color: COLORS.gold, display: 'flex'}}>
                <Icon name="question" size={64} />
              </div>
              <div style={{fontSize: 44, fontWeight: 700, color: COLORS.ink}}>{t}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
};

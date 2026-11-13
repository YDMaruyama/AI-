import React from 'react';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {CornerTag, EvidenceBadge, NoteStrip} from '../../components/ui';
import {COLORS} from '../../theme';
import {IconDisc} from './parts';

/**
 * M11：指標の変化が意味すること。
 *  - 肝酵素の変化 ＝ 肝臓への影響を調べる手がかり
 *  - 抗体反応の低下 ＝ 接種後に作られる抗体の量が少なくなる（Y 字の記号で模式的に。数は一定ではない）
 *  - 「免疫がすべて働かなくなる／ワクチンがまったく効かなくなる」という意味ではない（同じ画面の帯）
 */
type Steps = {liver: number; antibody: number; not: number};

const PANEL_W = 830;
const PANEL_TOP = 70;
const PANEL_H = 440;

/** 抗体の記号（Y 字）。faded は「作られなかった分」を点線で示す */
const Antibody: React.FC<{x: number; y: number; faded?: boolean; opacity?: number}> = ({x, y, faded, opacity = 1}) => (
  <g opacity={opacity} stroke={faded ? COLORS.line : COLORS.green} strokeWidth={7} strokeLinecap="round" fill="none" strokeDasharray={faded ? '6 7' : undefined}>
    <path d={`M${x} ${y + 34} L${x} ${y}`} />
    <path d={`M${x} ${y} L${x - 22} ${y - 26}`} />
    <path d={`M${x} ${y} L${x + 22} ${y - 26}`} />
  </g>
);

export const IndicatorMeaning: React.FC<{steps?: Steps; notText?: string}> = ({
  steps = {liver: 1, antibody: 2, not: 3},
  notText = '免疫がすべて働かなくなる、ワクチンがまったく効かなくなる、という意味ではない',
}) => {
  const head = useReveal(0);
  const liver = useReveal(steps.liver);
  const ab = useReveal(steps.antibody);
  const abFew = useReveal(steps.antibody, {delay: 0.9, duration: 0.8});
  const not = useReveal(steps.not);
  const fLiver = useFocus((s) => s === steps.liver);
  const fAb = useFocus((s) => s >= steps.antibody);

  const panel = (appear: number, focus: number, left: number): React.CSSProperties => ({
    ...fadeUp(appear),
    opacity: appear * (0.5 + 0.5 * focus),
    position: 'absolute',
    left,
    top: PANEL_TOP,
    width: PANEL_W,
    height: PANEL_H,
    boxSizing: 'border-box',
    background: COLORS.surface,
    border: `3px solid ${focus > 0.5 ? COLORS.green : COLORS.lineSoft}`,
    borderRadius: 24,
    padding: '26px 36px',
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  });

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{...fadeUp(head), position: 'absolute', left: 0, top: 0, display: 'flex', alignItems: 'center', gap: 18}}>
        <EvidenceBadge kind="human" size={28} />
        <div style={{fontSize: 30, fontWeight: 700, color: COLORS.inkSoft}}>人の研究で関連が報告された項目</div>
      </div>

      {/* 肝酵素の変化 */}
      <div style={panel(liver, fLiver, 0)}>
        <div style={{fontSize: 44, fontWeight: 700, color: COLORS.ink}}>肝酵素の変化</div>
        <div style={{flex: 1, display: 'flex', alignItems: 'center', gap: 30}}>
          <IconDisc name="search" size={130} />
          <div style={{fontSize: 40, fontWeight: 700, color: COLORS.greenDeep, lineHeight: 1.45}}>
            肝臓への影響を
            <br />
            調べる手がかり
          </div>
        </div>
      </div>

      {/* 抗体反応の低下 */}
      <div style={panel(ab, fAb, 1760 - PANEL_W)}>
        <div style={{fontSize: 44, fontWeight: 700, color: COLORS.ink}}>抗体反応の低下</div>
        <svg width={PANEL_W - 78} height={150} viewBox={`0 0 ${PANEL_W - 78} 150`} style={{display: 'block'}}>
          <rect x={0} y={10} width={PANEL_W - 78} height={130} rx={18} fill={COLORS.greenSoft} opacity={0.55} />
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const removed = i >= 4;
            return (
              <g key={i}>
                <Antibody x={110 + i * 105} y={78} opacity={removed ? 1 - abFew : 1} />
                {removed ? <Antibody x={110 + i * 105} y={78} faded opacity={abFew} /> : null}
              </g>
            );
          })}
        </svg>
        <div style={{fontSize: 36, fontWeight: 700, color: COLORS.greenDeep, lineHeight: 1.45}}>
          ワクチン接種後に作られる
          <br />
          抗体の量が少なくなる
        </div>
        <div style={{position: 'absolute', right: 20, top: 20}}>
          <CornerTag appear={ab} style={{padding: '4px 12px'}}>
            模式図
          </CornerTag>
        </div>
      </div>

      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0}}>
        <NoteStrip appear={not} label="意味しない">
          {notText}
        </NoteStrip>
      </div>
    </div>
  );
};

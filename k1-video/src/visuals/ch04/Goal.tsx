import React from 'react';
import {interpolate} from 'remotion';
import {Icon} from '../../components/Icons';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {COLORS} from '../../theme';
import {Panel, PanelTitle, Tag} from './parts';

/**
 * 学びの目標（H1 後半）。
 * 左：「すべてを避ける」は目標ではない（取り消し線）
 * 右：目標 ①分かっていること／未解明なことを区別する ②無理なく減らせる曝露を見つける
 * 「分かっている」は実線、「未解明」は点線の枠で、色だけに頼らず区別する。
 */
type Steps = {notGoal: number; distinguish: number; reduce: number};

const LW = 560;
const RX = 620;
const RW = 1760 - RX;
const PH = 540;

export const Goal: React.FC<{steps?: Steps}> = ({steps = {notGoal: 1, distinguish: 2, reduce: 3}}) => {
  const left = useReveal(steps.notGoal);
  const strike = useReveal(steps.notGoal, {delay: 0.5, duration: 0.7});
  const right = useReveal(steps.distinguish);
  const known = useReveal(steps.distinguish, {delay: 0.2});
  const unknown = useReveal(steps.distinguish, {delay: 0.7});
  const reduce = useReveal(steps.reduce);
  const lf = useFocus((s) => s <= steps.notGoal);
  const f1 = useFocus((s) => s === steps.distinguish);
  const f2 = useFocus((s) => s >= steps.reduce);
  const rf = useFocus((s) => s >= steps.distinguish);
  const strikeW = interpolate(strike, [0, 1], [0, 100]);

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', left: 0, top: 20}}>
        <Panel tone="slate" appear={left} focus={lf} width={LW} height={PH}>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 34, paddingBottom: 20}}>
            <div style={{position: 'relative', fontSize: 56, fontWeight: 700, color: COLORS.ink, whiteSpace: 'nowrap'}}>
              すべてを避ける
              <div style={{position: 'absolute', left: -8, top: '52%', height: 5, width: `calc(${strikeW}% + 16px)`, background: COLORS.gold, borderRadius: 4}} />
            </div>
            <div style={{...fadeUp(strike, 10)}}>
              <Tag tone="slate" size={34}>目標ではない</Tag>
            </div>
          </div>
        </Panel>
      </div>

      <div style={{position: 'absolute', left: RX, top: 20}}>
        <Panel tone="green" appear={right} focus={rf} width={RW} height={PH}>
          <div style={{padding: '28px 48px 40px', display: 'flex', flexDirection: 'column', gap: 46, height: '100%', boxSizing: 'border-box'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
              <Tag tone="green" filled size={34}>目標</Tag>
            </div>

            {/* ① 区別する */}
            <div style={{opacity: 0.55 + 0.45 * f1, display: 'flex', alignItems: 'center', gap: 24, marginTop: 30}}>
              <div
                style={{
                  ...fadeUp(known, 10),
                  fontSize: 38,
                  fontWeight: 700,
                  color: COLORS.greenDeep,
                  background: COLORS.greenSoft,
                  border: `4px solid ${COLORS.green}`,
                  borderRadius: 16,
                  padding: '14px 24px',
                  whiteSpace: 'nowrap',
                }}
              >
                分かっていること
              </div>
              <div style={{...fadeUp(unknown, 10), fontSize: 38, fontWeight: 700, color: COLORS.ink}}>と</div>
              <div
                style={{
                  ...fadeUp(unknown, 10),
                  fontSize: 38,
                  fontWeight: 700,
                  color: COLORS.slate,
                  background: COLORS.surface,
                  border: `4px dashed ${COLORS.slate}`,
                  borderRadius: 16,
                  padding: '14px 24px',
                  whiteSpace: 'nowrap',
                }}
              >
                未解明なこと
              </div>
              <div style={{...fadeUp(unknown, 10), fontSize: 38, fontWeight: 700, color: COLORS.ink, whiteSpace: 'nowrap'}}>を区別する</div>
            </div>

            <div style={{height: 0, borderTop: `3px dashed ${COLORS.lineSoft}`, opacity: reduce}} />

            {/* ② 無理なく減らせる曝露を見つける */}
            <div style={{...fadeUp(reduce, 12), opacity: reduce * (0.55 + 0.45 * f2), display: 'flex', alignItems: 'center', gap: 24}}>
              <div style={{width: 96, height: 96, borderRadius: 48, background: COLORS.greenSoft, color: COLORS.green, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
                <Icon name="search" size={60} />
              </div>
              <PanelTitle size={40}>生活の中で、無理なく減らせる曝露を見つける</PanelTitle>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
};

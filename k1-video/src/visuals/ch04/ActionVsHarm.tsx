import React from 'react';
import {Icon, IconName} from '../../components/Icons';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {COLORS} from '../../theme';
import {NeSign, Panel, PanelTitle} from './parts';

/**
 * ホルモンに作用することと、健康被害を起こすことを区別する（I4）。
 * 左：ホルモンに作用する ＋ 体にはホルモン量を調整する仕組みもある
 * 右：健康被害を起こす ＋ 作用の有無だけでなく、有害な変化に結び付くかを調べる
 * 中央の ≠ で二つを区別する（矢印でつながない）。
 */
type Steps = {ne: number; regulate: number; study: number};

const PW = 740;
const CW = 1760 - PW * 2;
const PH = 520;
const TOP = 36;

const Header: React.FC<{icon: IconName; title: string; tone: 'slate' | 'gold'}> = ({icon, title, tone}) => {
  const main = tone === 'slate' ? COLORS.slate : COLORS.gold;
  const soft = tone === 'slate' ? COLORS.slateSoft : COLORS.goldSoft;
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 22, padding: '28px 36px 0'}}>
      <div style={{width: 96, height: 96, borderRadius: 48, background: soft, color: main, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
        <Icon name={icon} size={60} />
      </div>
      <PanelTitle size={46}>{title}</PanelTitle>
    </div>
  );
};

/** パネル内の説明枠（左右で同じ高さ・縦中央に揃える） */
const InnerBox: React.FC<{appear: number; children: React.ReactNode}> = ({appear, children}) => (
  <div
    style={{
      ...fadeUp(appear, 12),
      flex: 1,
      margin: '36px 36px 36px',
      padding: '24px 30px',
      borderRadius: 18,
      background: COLORS.bg,
      border: `3px solid ${COLORS.lineSoft}`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}
  >
    {children}
  </div>
);

export const ActionVsHarm: React.FC<{steps?: Steps}> = ({steps = {ne: 1, regulate: 2, study: 3}}) => {
  const base = useReveal(0, {duration: 0.6});
  const right = useReveal(0, {delay: 0.3, duration: 0.6});
  const ne = useReveal(steps.ne);
  const reg = useReveal(steps.regulate);
  const study = useReveal(steps.study);
  const study2 = useReveal(steps.study, {delay: 0.6});
  const lf = useFocus((s) => s <= steps.regulate || s >= steps.study);
  const rf = useFocus((s) => s <= steps.ne || s >= steps.study);

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', left: 0, top: TOP}}>
        <Panel tone="slate" appear={base} focus={lf} width={PW} height={PH} style={{display: 'flex', flexDirection: 'column'}}>
          <Header icon="gland" title="ホルモンに作用する" tone="slate" />
          <InnerBox appear={reg}>
            <div style={{display: 'flex', alignItems: 'center', gap: 26}}>
              <div style={{color: COLORS.green, flexShrink: 0}}>
                <Icon name="cycle" size={120} />
              </div>
              <div style={{fontSize: 40, fontWeight: 700, color: COLORS.ink, lineHeight: 1.45}}>
                体には、ホルモン量を
                <br />
                調整する仕組みもある
              </div>
            </div>
          </InnerBox>
        </Panel>
      </div>

      <div style={{position: 'absolute', left: PW, width: CW, top: TOP + PH / 2 - 90, display: 'flex', justifyContent: 'center'}}>
        <NeSign appear={ne} size={110} lines={['区別する']} />
      </div>

      <div style={{position: 'absolute', left: PW + CW, top: TOP}}>
        <Panel tone="gold" appear={right} focus={rf} width={PW} height={PH} style={{display: 'flex', flexDirection: 'column'}}>
          <Header icon="person" title="健康被害を起こす" tone="gold" />
          <InnerBox appear={study}>
            <div style={{fontSize: 34, fontWeight: 600, color: COLORS.inkSoft, marginBottom: 14}}>作用の有無だけでなく</div>
            <div style={{...fadeUp(study2, 8), display: 'flex', alignItems: 'center', gap: 22}}>
              <div style={{color: COLORS.green, flexShrink: 0}}>
                <Icon name="search" size={92} />
              </div>
              <div style={{fontSize: 40, fontWeight: 700, color: COLORS.ink, lineHeight: 1.45}}>
                有害な変化に
                <br />
                結び付くかを調べる
              </div>
            </div>
          </InnerBox>
        </Panel>
      </div>
    </div>
  );
};

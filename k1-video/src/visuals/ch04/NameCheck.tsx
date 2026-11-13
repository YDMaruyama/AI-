import React from 'react';
import {Icon} from '../../components/Icons';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {CheckItem} from '../../components/ui';
import {COLORS} from '../../theme';
import {NeSign, Panel, PanelTitle} from './parts';

/**
 * 物質群の名前だけで、手元の製品の影響を決めない（G3）。
 * 左：物質群の名前（BPA・フタル酸類・PFAS など）／中央：≠／右：手元の製品について確かめること。
 */
type Steps = {names: number; ne: number; check: number};

const LW = 560;
const CW = 260;
const RW = 1760 - LW - CW;
const PH = 560;

const NAMES = ['BPA', 'フタル酸類', 'PFAS'];
const CHECKS = ['具体的な物質', '製品', '接し方'];

export const NameCheck: React.FC<{steps?: Steps}> = ({steps = {names: 1, ne: 2, check: 3}}) => {
  const left = useReveal(steps.names);
  const n1 = useReveal(steps.names, {delay: 0.2});
  const n2 = useReveal(steps.names, {delay: 0.5});
  const n3 = useReveal(steps.names, {delay: 0.8});
  const ne = useReveal(steps.ne);
  const right = useReveal(steps.ne, {delay: 0.2});
  const c1 = useReveal(steps.check, {duration: 0.5});
  const c2 = useReveal(steps.check, {delay: 0.6, duration: 0.5});
  const c3 = useReveal(steps.check, {delay: 1.2, duration: 0.5});
  const lf = useFocus((s) => s < steps.ne);
  const rf = useFocus((s) => s >= steps.ne);
  const nameAppear = [n1, n2, n3];
  const checkAppear = [c1, c2, c3];

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', left: 0, top: 20}}>
        <Panel tone="slate" appear={left} focus={lf} width={LW} height={PH}>
          <div style={{padding: '30px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26}}>
            <PanelTitle size={40}>物質群の名前</PanelTitle>
            {NAMES.map((n, i) => (
              <div
                key={n}
                style={{
                  ...fadeUp(nameAppear[i], 10),
                  width: 400,
                  textAlign: 'center',
                  fontSize: 48,
                  fontWeight: 700,
                  color: COLORS.slate,
                  background: COLORS.slateSoft,
                  borderRadius: 999,
                  padding: '10px 0',
                  letterSpacing: '0.04em',
                }}
              >
                {n}
              </div>
            ))}
            <div style={{...fadeUp(n3, 10), fontSize: 34, fontWeight: 500, color: COLORS.inkSoft}}>など</div>
          </div>
        </Panel>
      </div>

      <div style={{position: 'absolute', left: LW, width: CW, top: 20 + PH / 2 - 110, display: 'flex', justifyContent: 'center'}}>
        <NeSign appear={ne} size={100} lines={['名前だけで', '決めない']} />
      </div>

      <div style={{position: 'absolute', left: LW + CW, top: 20}}>
        <Panel tone="green" appear={right} focus={rf} width={RW} height={PH}>
          <div style={{padding: '30px 50px', display: 'flex', flexDirection: 'column', gap: 30}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
              <div style={{width: 92, height: 92, borderRadius: 46, background: COLORS.greenSoft, color: COLORS.green, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <Icon name="package" size={58} />
              </div>
              <PanelTitle size={44}>手元の製品の影響</PanelTitle>
            </div>
            <div style={{...fadeUp(right, 10), fontSize: 34, fontWeight: 700, color: COLORS.inkSoft, display: 'flex', alignItems: 'center', gap: 12}}>
              <Icon name="search" size={44} color={COLORS.green} />
              確かめること
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: 22, paddingLeft: 20}}>
              {CHECKS.map((t, i) => (
                <CheckItem key={t} text={t} appear={checkAppear[i]} checked={checkAppear[i]} size={44} />
              ))}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
};

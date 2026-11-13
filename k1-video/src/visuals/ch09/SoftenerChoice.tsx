import React from 'react';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {Pill} from '../../components/ui';
import {COLORS} from '../../theme';
import {Box, CheckBox, IconBadge} from './parts';

/**
 * 香りを付ける必要がなければ（N15）。
 *  上：条件「香りを付ける必要がなければ」
 *  左：柔軟剤を使わない
 *  右：製品を選ぶ場合 → 「無香料」と「マイクロカプセル不使用」を別々のチェック項目として示す
 */
type Steps = {opt1: number; opt2: number; check: number};

const CheckRow: React.FC<{term: string; checked: number; top: number}> = ({term, checked, top}) => (
  <div style={{position: 'absolute', left: 40, right: 40, top, display: 'flex', alignItems: 'center', gap: 24}}>
    <CheckBox checked={checked} size={60} />
    <div style={{fontSize: 46, fontWeight: 700, color: COLORS.ink, whiteSpace: 'nowrap'}}>{term}</div>
    <div style={{fontSize: 34, fontWeight: 500, color: COLORS.inkSoft, whiteSpace: 'nowrap'}}>を確認</div>
  </div>
);

export const SoftenerChoice: React.FC<{steps?: Steps}> = ({steps = {opt1: 1, opt2: 2, check: 3}}) => {
  const cond = useReveal(steps.opt1);
  const o1 = useReveal(steps.opt1, {delay: 0.3});
  const o1Focus = useFocus((s) => s === steps.opt1);
  const o2 = useReveal(steps.opt2);
  const o2Focus = useFocus((s) => s >= steps.opt2);
  const c1 = useReveal(steps.check, {delay: 0.4, duration: 0.5});
  const c2 = useReveal(steps.check, {delay: 1.3, duration: 0.5});
  const each = useReveal(steps.check, {delay: 0.2});

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <Box appear={cond} focus={1} tone="gold" style={{left: 0, top: 16, width: 1760, height: 108, display: 'flex', alignItems: 'center', gap: 24, padding: '0 34px'}}>
        <IconBadge name="fragrance" tone="gold" size={76} />
        <div style={{fontSize: 42, fontWeight: 700, color: COLORS.ink}}>香りを付ける必要がなければ</div>
      </Box>

      <Box
        appear={o1}
        focus={o1Focus}
        tone="green"
        topBar
        style={{left: 0, top: 156, width: 560, height: 490, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 30}}
      >
        <IconBadge name="shirt" tone="green" size={130} />
        <div style={{fontSize: 44, fontWeight: 700, color: COLORS.ink}}>柔軟剤を使わない</div>
      </Box>

      <div style={{...fadeUp(o2), position: 'absolute', left: 560, width: 140, top: 376, textAlign: 'center', fontSize: 32, fontWeight: 700, color: COLORS.inkSoft}}>
        または
      </div>

      <Box appear={o2} focus={o2Focus} tone="green" topBar style={{left: 700, top: 156, width: 1060, height: 490}}>
        <div style={{position: 'absolute', left: 40, top: 26, fontSize: 36, fontWeight: 700, color: COLORS.inkSoft}}>製品を選ぶ場合</div>
        <CheckRow term="「無香料」" checked={c1} top={118} />
        <div style={{position: 'absolute', left: 40, right: 40, top: 262, borderTop: `3px dashed ${COLORS.line}`}} />
        <div style={{...fadeUp(each), position: 'absolute', left: 0, right: 0, top: 240, display: 'flex', justifyContent: 'center'}}>
          <Pill tone="green" size={28} style={{background: COLORS.surface, border: `2.5px solid ${COLORS.green}`}}>
            それぞれ確認
          </Pill>
        </div>
        <CheckRow term="「マイクロカプセル不使用」" checked={c2} top={316} />
      </Box>
    </div>
  );
};

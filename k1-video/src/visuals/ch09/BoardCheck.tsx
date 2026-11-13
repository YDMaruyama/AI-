import React from 'react';
import {useFocus, useReveal} from '../../components/scene-context';
import {Arrow, CornerTag, Pill} from '../../components/ui';
import {COLORS} from '../../theme';
import {Box, Fragment, IconBadge} from './parts';

/**
 * まな板の状態を確かめる（N7）。
 *  上：表面の状態の例 3 つ（深い傷が多い／毛羽立ちや削れ／細かな破片が見える）→ 状態を確認して交換を検討
 *  下：包丁で表面を強くこすって食材を集める使い方は、摩耗を増やすため控える
 * 表面の様子は模式図（実際の見え方の再現ではない）。
 */
type Steps = {signs: number[]; replace: number; habit: number};

const SW = 380;
const SH = 360;
const SX = [0, 405, 810];

const Surface: React.FC<{kind: 0 | 1 | 2}> = ({kind}) => (
  <svg width={320} height={200} viewBox="0 0 320 200" style={{display: 'block'}}>
    <rect x={2} y={2} width={316} height={196} rx={14} fill="#E8EEF1" stroke={COLORS.slate} strokeWidth={3} />
    {kind === 0
      ? [
          [30, 40, 120, 170],
          [70, 30, 170, 160],
          [130, 40, 230, 175],
          [190, 28, 290, 150],
          [40, 150, 200, 60],
          [150, 170, 290, 70],
          [240, 40, 280, 180],
        ].map(([x1, y1, x2, y2], i) => (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#7F8E9B" strokeWidth={7} strokeLinecap="round" />
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#4E5F6D" strokeWidth={2.5} strokeLinecap="round" />
          </g>
        ))
      : null}
    {kind === 1
      ? [56, 104, 152].map((y, r) => (
          <g key={y}>
            <line x1={26} y1={y} x2={294} y2={y + (r - 1) * 8} stroke="#7F8E9B" strokeWidth={4} strokeLinecap="round" />
            {Array.from({length: 12}, (_, k) => {
              const x = 34 + k * 22;
              const yy = y + ((r - 1) * 8 * (x - 26)) / 268;
              return <path key={k} d={`M${x} ${yy} q ${4 + (k % 3) * 2} -${16 + (k % 2) * 6} ${12} -${6 + (k % 3) * 3}`} fill="none" stroke={COLORS.slate} strokeWidth={3} strokeLinecap="round" />;
            })}
          </g>
        ))
      : null}
    {kind === 2 ? (
      <g>
        <line x1={40} y1={70} x2={280} y2={120} stroke="#9AA7B2" strokeWidth={3} strokeLinecap="round" />
        <line x1={60} y1={160} x2={250} y2={50} stroke="#9AA7B2" strokeWidth={3} strokeLinecap="round" />
        {[
          [70, 50, 0],
          [120, 95, 30],
          [180, 70, -20],
          [230, 140, 50],
          [90, 145, -40],
          [150, 160, 15],
          [260, 90, 70],
          [205, 112, -60],
          [50, 110, 20],
        ].map(([x, y, rot], i) => (
          <Fragment key={i} x={x} y={y} r={14 + (i % 3) * 3} rot={rot} />
        ))}
      </g>
    ) : null}
  </svg>
);

const LABELS = ['深い傷が多い', '毛羽立ちや削れ', '細かな破片が見える'];

const Swatch: React.FC<{i: 0 | 1 | 2; step: number; steps: Steps}> = ({i, step, steps}) => {
  const appear = useReveal(step);
  const focus = useFocus((s) => s === step || s === steps.replace);
  return (
    <Box
      appear={appear}
      focus={focus}
      tone="slate"
      style={{left: SX[i], top: 24, width: SW, height: SH, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22}}
    >
      <Surface kind={i} />
      <div style={{fontSize: 36, fontWeight: 700, color: COLORS.ink}}>{LABELS[i]}</div>
    </Box>
  );
};

export const BoardCheck: React.FC<{steps?: Steps}> = ({steps = {signs: [1, 2, 3], replace: 4, habit: 5}}) => {
  const base = useReveal(steps.signs[0]);
  const rep = useReveal(steps.replace);
  const repFocus = useFocus((s) => s === steps.replace);
  const habit = useReveal(steps.habit);
  const habitFocus = useFocus((s) => s >= steps.habit);

  return (
    <div style={{position: 'absolute', inset: 0}}>
      {([0, 1, 2] as const).map((i) => (
        <Swatch key={i} i={i} step={steps.signs[i]} steps={steps} />
      ))}

      <svg width={1760} height={400} viewBox="0 0 1760 400" style={{position: 'absolute', left: 0, top: 0}}>
        <Arrow from={[1204, 204]} to={[1270, 204]} p={rep} color={COLORS.green} width={6} opacity={0.5 + 0.5 * repFocus} />
      </svg>

      <Box
        appear={rep}
        focus={repFocus}
        tone="green"
        topBar
        style={{left: 1290, top: 54, width: 470, height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16}}
      >
        <IconBadge name="search" tone="green" size={88} />
        <div style={{fontSize: 34, fontWeight: 500, color: COLORS.inkSoft}}>状態を確認して</div>
        <div style={{fontSize: 46, fontWeight: 700, color: COLORS.ink}}>交換を検討</div>
      </Box>

      <Box
        appear={habit}
        focus={habitFocus}
        tone="gold"
        style={{left: 0, top: 430, width: 1760, height: 180, display: 'flex', alignItems: 'center', gap: 30, padding: '0 40px'}}
      >
        <IconBadge name="knife" tone="gold" size={96} />
        <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
          <div>
            <Pill tone="gold" size={28}>
              控えたい使い方
            </Pill>
          </div>
          <div style={{fontSize: 38, fontWeight: 700, color: COLORS.ink}}>包丁で表面を強くこすって、食材を集める</div>
        </div>
        <div style={{marginLeft: 'auto'}}>
          <Pill tone="slate" size={32} style={{border: `2.5px solid ${COLORS.slate}`}}>
            摩耗を増やすため
          </Pill>
        </div>
      </Box>

      <div style={{position: 'absolute', left: 0, top: 626, opacity: base}}>
        <CornerTag>表面の様子は模式図</CornerTag>
      </div>
    </div>
  );
};

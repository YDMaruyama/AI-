import React from 'react';
import {IconName} from '../../components/Icons';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {Pill, SvgText} from '../../components/ui';
import {COLORS} from '../../theme';
import {Box, IconBadge} from './parts';

/**
 * 木製など別の材質を選ぶ場合（N8）。
 * 選択肢の枠の中に「洗浄・乾燥を十分に・衛生的に使う」を入れ、衛生管理がこの選択肢の一部であることを示す。
 * 材質を変えることの効果は描かない（原文にない比較をしない）。
 */
type Steps = {wood: number; care: number[]};

const CARE: {icon: IconName; text: string}[] = [
  {icon: 'drop', text: '洗浄を十分に行う'},
  {icon: 'air', text: '乾燥を十分に行う'},
  {icon: 'shield', text: '衛生的に使う'},
];

const CareRow: React.FC<{i: number; step: number; last: number}> = ({i, step, last}) => {
  const appear = useReveal(step);
  const focus = useFocus((s) => s === step || s >= last);
  return (
    <Box
      appear={appear}
      focus={focus}
      tone="green"
      style={{left: 720, top: 210 + i * 128, width: 960, height: 108, display: 'flex', alignItems: 'center', gap: 26, padding: '0 30px'}}
    >
      <IconBadge name={CARE[i].icon} tone="green" size={78} />
      <div style={{fontSize: 40, fontWeight: 700, color: COLORS.ink}}>{CARE[i].text}</div>
    </Box>
  );
};

export const WoodOption: React.FC<{steps?: Steps}> = ({steps = {wood: 1, care: [2, 3, 4]}}) => {
  const frame = useReveal(steps.wood);
  const sub = useReveal(steps.care[0]);
  const boardFocus = useFocus((s) => s <= steps.wood);
  const last = steps.care[steps.care.length - 1];

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <Box appear={frame} focus={1} tone="green" topBar style={{left: 0, top: 14, width: 1760, height: 630}}>
        <div style={{position: 'absolute', left: 40, top: 26, display: 'flex', alignItems: 'center', gap: 22}}>
          <Pill tone="green" size={30}>
            選択肢の一つ
          </Pill>
          <div style={{fontSize: 44, fontWeight: 700, color: COLORS.ink}}>木製など、別の材質を選ぶ</div>
        </div>

        {/* 木のまな板（模式） */}
        <svg
          width={600}
          height={330}
          viewBox="0 0 600 330"
          style={{position: 'absolute', left: 50, top: 190, opacity: 0.55 + 0.45 * boardFocus}}
        >
          <rect x={20} y={40} width={540} height={240} rx={26} fill="#DCBD90" stroke="#9C7A4C" strokeWidth={4} />
          <circle cx={510} cy={160} r={18} fill={COLORS.surface} stroke="#9C7A4C" strokeWidth={4} />
          {[86, 130, 176, 222].map((y, k) => (
            <path
              key={y}
              d={`M50 ${y} C 150 ${y - 16 + k * 4}, 260 ${y + 18}, 360 ${y} S 440 ${y - 12}, 470 ${y + 2}`}
              fill="none"
              stroke="#B48F5D"
              strokeWidth={4}
              strokeLinecap="round"
            />
          ))}
          <SvgText x={290} y={312} size={30} weight={700} color="#7A5A30">
            木製のまな板
          </SvgText>
        </svg>

        <div style={{...fadeUp(sub), position: 'absolute', left: 724, top: 140, fontSize: 34, fontWeight: 700, color: COLORS.inkSoft}}>
          その場合も大切なこと
        </div>
        {steps.care.map((s, i) => (
          <CareRow key={i} i={i} step={s} last={last} />
        ))}
      </Box>
    </div>
  );
};

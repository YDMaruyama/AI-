import React from 'react';
import {IconName} from '../../components/Icons';
import {useFocus, useReveal} from '../../components/scene-context';
import {COLORS} from '../../theme';
import {Box, CheckBox, IconBadge} from './parts';

/**
 * 毎日使うものの状態を確かめる（N16）。
 *  上：温める容器／切るまな板／調理するフライパン — それぞれ「材質」「傷み」を確認
 *  下：用途に合った使い方を守る／削れや剥がれが目立つものは交換を検討
 */
type Steps = {tools: number[]; use: number; replace: number};

const TOOLS: {icon: IconName; text: string}[] = [
  {icon: 'container', text: '食品を温める容器'},
  {icon: 'board', text: '食材を切るまな板'},
  {icon: 'pan', text: '調理するフライパン'},
];

const ToolCard: React.FC<{i: number; step: number; steps: Steps}> = ({i, step, steps}) => {
  const appear = useReveal(step);
  const focus = useFocus((s) => s === step || (s > steps.tools[steps.tools.length - 1] && s < steps.use));
  const c1 = useReveal(step, {delay: 0.5, duration: 0.5});
  const c2 = useReveal(step, {delay: 0.9, duration: 0.5});
  return (
    <Box
      appear={appear}
      focus={focus}
      tone="green"
      topBar
      style={{left: i * 600, top: 20, width: 560, height: 370, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20}}
    >
      <IconBadge name={TOOLS[i].icon} tone="green" size={100} />
      <div style={{fontSize: 38, fontWeight: 700, color: COLORS.ink}}>{TOOLS[i].text}</div>
      <div style={{display: 'flex', gap: 40}}>
        {['材質', '傷み'].map((t, k) => (
          <div key={t} style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <CheckBox checked={k === 0 ? c1 : c2} size={46} />
            <div style={{fontSize: 36, fontWeight: 700, color: COLORS.ink}}>{t}</div>
          </div>
        ))}
      </div>
    </Box>
  );
};

export const DailyCheck: React.FC<{steps?: Steps}> = ({steps = {tools: [1, 2, 3], use: 4, replace: 5}}) => {
  const use = useReveal(steps.use);
  const useFoc = useFocus((s) => s === steps.use);
  const rep = useReveal(steps.replace);
  const repFoc = useFocus((s) => s >= steps.replace);

  return (
    <div style={{position: 'absolute', inset: 0}}>
      {steps.tools.map((s, i) => (
        <ToolCard key={i} i={i} step={s} steps={steps} />
      ))}

      <Box appear={use} focus={useFoc} tone="green" style={{left: 0, top: 430, width: 860, height: 210, display: 'flex', alignItems: 'center', gap: 28, padding: '0 40px'}}>
        <IconBadge name="check" tone="green" size={96} />
        <div style={{fontSize: 40, fontWeight: 700, color: COLORS.ink}}>用途に合った使い方を守る</div>
      </Box>
      <Box appear={rep} focus={repFoc} tone="gold" style={{left: 900, top: 430, width: 860, height: 210, display: 'flex', alignItems: 'center', gap: 28, padding: '0 40px'}}>
        <IconBadge name="search" tone="gold" size={96} />
        <div>
          <div style={{fontSize: 34, fontWeight: 500, color: COLORS.inkSoft, lineHeight: 1.4}}>削れや剥がれが目立つものは</div>
          <div style={{fontSize: 44, fontWeight: 700, color: COLORS.ink, lineHeight: 1.4}}>交換を検討</div>
        </div>
      </Box>
    </div>
  );
};

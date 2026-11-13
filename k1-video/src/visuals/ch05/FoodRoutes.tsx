import React from 'react';
import {useFocus, useReveal} from '../../components/scene-context';
import {Arrow, CornerTag, SvgText} from '../../components/ui';
import {COLORS} from '../../theme';
import {Molecule, Node, Shard, SvgGear} from './parts';
import {SvgIcon} from '../../components/Icons';

/**
 * 食べ物と飲み水：食品に入る経路（模式図）。
 *  - 上：環境中の粒子・化学物質が、水・土壌・生物を通じて食品に「入ることがある」（点線＝条件付き）
 *  - 下：食品の加工・輸送・包装・調理の過程も「調査対象」（括弧で囲むだけで、混入を断定しない）
 */
type Steps = {env: number; process: number};

const FOOD = {x: 260, y: 470, r: 90};
const ENV_Y = 180;
const ENV = [
  {x: 100, label: '水'},
  {x: 260, label: '土壌'},
  {x: 420, label: '生物'},
];
const PROC_X = [750, 1010, 1270, 1530];
const PROC_LABEL = ['加工', '輸送', '包装', '調理'];
const PR = 76;

export const FoodRoutes: React.FC<{steps?: Steps}> = ({steps = {env: 1, process: 2}}) => {
  const base = useReveal(0, {duration: 0.7});
  const env = useReveal(steps.env, {duration: 0.8});
  const envArrows = useReveal(steps.env, {delay: 0.6, duration: 1.2});
  const envLabel = useReveal(steps.env, {delay: 1.5});
  const proc = useReveal(steps.process, {duration: 0.8});
  const procBracket = useReveal(steps.process, {delay: 0.7, duration: 0.9});
  const envFocus = useFocus((s) => s < steps.process);
  const procFocus = useFocus((s) => s >= steps.process);

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <svg width={1760} height={676} viewBox="0 0 1760 676" style={{position: 'absolute', left: 0, top: 0}}>
        {/* 環境 */}
        <g opacity={env * (0.6 + 0.4 * envFocus)}>
          <SvgText x={260} y={34} size={34} weight={700}>
            環境中の粒子・化学物質
          </SvgText>
          <Shard x={150} y={92} r={13} rot={10} />
          <Molecule x={195} y={86} />
          <Shard x={245} y={96} r={11} rot={-30} />
          <Molecule x={290} y={90} />
          <Shard x={335} y={88} r={12} rot={40} />
          <Molecule x={378} y={96} />
          {ENV.map((e, i) => (
            <Node key={e.label} x={e.x} y={ENV_Y} r={60} label={e.label} labelSize={32} labelGap={36} tone="slate">
              {i === 0 ? <SvgIcon name="drop" x={e.x - 34} y={ENV_Y - 34} size={68} color={COLORS.slate} /> : null}
              {i === 1 ? <SvgIcon name="soil" x={e.x - 34} y={ENV_Y - 34} size={68} color={COLORS.slate} /> : null}
              {i === 2 ? (
                <>
                  <SvgIcon name="fish" x={e.x - 44} y={ENV_Y - 30} size={50} color={COLORS.slate} />
                  <SvgIcon name="sprout" x={e.x - 4} y={ENV_Y - 34} size={50} color={COLORS.slate} />
                </>
              ) : null}
            </Node>
          ))}
        </g>
        {/* 環境 → 食品（点線＝入ることがある） */}
        <g opacity={0.6 + 0.4 * envFocus}>
          <Arrow from={[110, 298]} to={[214, 392]} p={envArrows} dashed color={COLORS.gold} width={4} />
          <Arrow from={[260, 298]} to={[260, 372]} p={envArrows} dashed color={COLORS.gold} width={4} />
          <Arrow from={[410, 298]} to={[306, 392]} p={envArrows} dashed color={COLORS.gold} width={4} />
          <g opacity={envLabel}>
            <SvgText x={440} y={336} size={30} weight={700} color={COLORS.gold} anchor="start">
              入ることがある
            </SvgText>
          </g>
        </g>

        {/* 食品 */}
        <Node x={FOOD.x} y={FOOD.y} r={FOOD.r} icon="food" iconSize={104} label="食品" labelSize={36} labelGap={44} appear={base} />

        {/* 加工・輸送・包装・調理 */}
        <g opacity={proc * (0.6 + 0.4 * procFocus)}>
          <Arrow from={[FOOD.x + FOOD.r + 8, FOOD.y]} to={[PROC_X[0] - PR - 10, FOOD.y]} p={proc} color={COLORS.line} width={4} />
          {PROC_X.slice(1).map((x, i) => (
            <Arrow key={x} from={[PROC_X[i] + PR + 8, FOOD.y]} to={[x - PR - 10, FOOD.y]} p={proc} color={COLORS.line} width={4} />
          ))}
          {PROC_X.map((x, i) => (
            <Node key={x} x={x} y={FOOD.y} r={PR} label={PROC_LABEL[i]} labelSize={34} labelGap={58} tone="neutral" icon={i === 1 ? 'truck' : i === 2 ? 'package' : i === 3 ? 'pan' : undefined} iconSize={84}>
              {i === 0 ? <SvgGear x={x - 40} y={FOOD.y - 40} size={80} color={COLORS.inkSoft} /> : null}
            </Node>
          ))}
        </g>
        {/* 調査対象の括弧 */}
        <g opacity={procBracket}>
          <path d={`M${PROC_X[0] - PR} 384 V362 H${PROC_X[3] + PR} V384`} fill="none" stroke={COLORS.green} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
          <SvgIcon name="search" x={PROC_X[0] + 70} y={290} size={52} color={COLORS.green} />
          <SvgText x={PROC_X[0] + 136} y={318} size={36} weight={700} color={COLORS.green} anchor="start">
            これらの過程も調査対象
          </SvgText>
        </g>
      </svg>
      <div style={{position: 'absolute', right: 0, top: 0}}>
        <CornerTag appear={base}>模式図</CornerTag>
      </div>
    </div>
  );
};

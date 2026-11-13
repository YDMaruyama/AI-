import React from 'react';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {Arrow, CornerTag, SvgText} from '../../components/ui';
import {COLORS} from '../../theme';
import {Box, Capsule, Fragment, IconBadge, ScentWave, seg} from './parts';

/**
 * 香りが続く柔軟剤：香料とカプセルの素材（N13）。衣類の拡大の模式図。
 *  1 衣類に付着（香料をマイクロカプセルに包む）
 *  2 着用時の摩擦・衝撃（カプセルが割れる）
 *  3 香りを放出（香料＝波線、殻・破片＝角ばった形で区別）
 *  4 殻に合成樹脂を使うものがある → 素材によってはマイクロプラスチックに該当
 * 吸い込む量・数はこの図からは分からない（量は描かない）。注意したいものと留保（N14）は次の場面。
 */
type Steps = {attach: number; friction: number; release: number; shell: number};

const PW = 540;
const PX = [0, 610, 1220];
const SMALL: [number, number, number][] = [
  [90, 196, 20],
  [390, 192, 20],
  [160, 250, 18],
  [330, 252, 18],
];

const Fibers: React.FC = () => (
  <g>
    {[150, 205, 260].map((y) => (
      <path
        key={y}
        d={`M6 ${y} C 120 ${y - 18}, 240 ${y + 18}, 360 ${y} S 470 ${y - 10}, 480 ${y}`}
        fill="none"
        stroke="#D3CAB8"
        strokeWidth={16}
        strokeLinecap="round"
      />
    ))}
  </g>
);

const PanelBox: React.FC<{x: number; title: string; appear: number; focus: number; children: React.ReactNode}> = ({x, title, appear, focus, children}) => (
  <Box appear={appear} focus={focus} tone="gold" topBar style={{left: x, top: 14, width: PW, height: 420, padding: '20px 24px'}}>
    <div style={{fontSize: 38, fontWeight: 700, color: COLORS.ink, textAlign: 'center'}}>{title}</div>
    <svg width={480} height={300} viewBox="0 0 480 300" style={{display: 'block', marginTop: 20, overflow: 'visible'}}>
      {children}
    </svg>
  </Box>
);

export const SoftenerCapsule: React.FC<{steps?: Steps}> = ({steps = {attach: 1, friction: 2, release: 3, shell: 4}}) => {
  const p1 = useReveal(steps.attach);
  const p1Label = useReveal(steps.attach, {delay: 0.8});
  const p2 = useReveal(steps.friction);
  const crack = useReveal(steps.friction, {delay: 0.6, duration: 1.4});
  const p3 = useReveal(steps.release);
  const scent = useReveal(steps.release, {delay: 0.3, duration: 1.6});
  const shell = useReveal(steps.shell);
  const f1 = useFocus((s) => s === steps.attach || s >= steps.shell);
  const f2 = useFocus((s) => s === steps.friction);
  const f3 = useFocus((s) => s === steps.release || s >= steps.shell);
  const fShell = useFocus((s) => s >= steps.shell);

  return (
    <div style={{position: 'absolute', inset: 0}}>
      {/* 1 衣類に付着 */}
      <PanelBox x={PX[0]} title="衣類に付着" appear={p1} focus={f1}>
        <Fibers />
        {SMALL.map(([x, y, r], i) => (
          <Capsule key={i} x={x} y={y} r={r} />
        ))}
        <Capsule x={240} y={118} r={36} />
        <g opacity={p1Label}>
          <line x1={150} y1={60} x2={232} y2={112} stroke={COLORS.gold} strokeWidth={2.5} />
          <SvgText x={120} y={48} size={30} weight={700} color={COLORS.gold}>
            香料
          </SvgText>
        </g>
        <g opacity={shell}>
          <line x1={330} y1={60} x2={268} y2={96} stroke={COLORS.slate} strokeWidth={2.5} />
          <SvgText x={360} y={48} size={30} weight={700} color={COLORS.slate}>
            殻
          </SvgText>
        </g>
      </PanelBox>

      {/* 2 着用時の摩擦・衝撃 */}
      <PanelBox x={PX[1]} title="着用時の摩擦・衝撃" appear={p2} focus={f2}>
        <Fibers />
        {SMALL.map(([x, y, r], i) => (
          <Capsule key={i} x={x} y={y} r={r} broken={i % 2 === 0 ? crack * 0.6 : 0} />
        ))}
        <Capsule x={240} y={118} r={36} broken={crack} />
        <Arrow from={[170, 34]} to={[320, 34]} p={seg(p2, 0.2, 1)} color={COLORS.inkSoft} width={5} />
        <Arrow from={[310, 58]} to={[160, 58]} p={seg(p2, 0.4, 1)} color={COLORS.inkSoft} width={5} />
      </PanelBox>

      {/* 3 香りを放出 */}
      <PanelBox x={PX[2]} title="香りを放出" appear={p3} focus={f3}>
        <Fibers />
        {SMALL.map(([x, y, r], i) => (
          <Capsule key={i} x={x} y={y} r={r} broken={i % 2 === 0 ? 0.6 : 0} />
        ))}
        <Capsule x={240} y={118} r={36} broken={1} />
        {[262, 304, 346].map((x, i) => (
          <ScentWave key={x} x={x} y={104 - i * 6} h={92} p={seg(scent, i * 0.15, 0.6 + i * 0.15)} />
        ))}
        {[
          [150, 112, 20],
          [172, 74, -30],
          [118, 140, 60],
          [200, 52, 15],
        ].map(([x, y, rot], i) => (
          <Fragment key={i} x={x} y={y} r={15} rot={rot} opacity={seg(scent, 0.1 * i, 0.3 + 0.1 * i)} />
        ))}
        <g opacity={scent}>
          <SvgText x={420} y={40} size={30} weight={700} color={COLORS.gold}>
            香料
          </SvgText>
          <SvgText x={76} y={40} size={30} weight={700} color={COLORS.slate}>
            殻・破片
          </SvgText>
        </g>
      </PanelBox>

      {/* 矢印（順序） */}
      <svg width={1760} height={400} viewBox="0 0 1760 400" style={{position: 'absolute', left: 0, top: 0}}>
        <Arrow from={[550, 244]} to={[600, 244]} p={p2} color={COLORS.gold} width={6} />
        <Arrow from={[1160, 244]} to={[1210, 244]} p={p3} color={COLORS.gold} width={6} />
      </svg>

      {/* 殻の素材 */}
      <Box
        appear={shell}
        focus={fShell}
        tone="slate"
        style={{left: 0, top: 466, width: 1760, height: 124, display: 'flex', alignItems: 'center', gap: 24, padding: '0 34px'}}
      >
        <IconBadge name="capsule" tone="slate" size={80} />
        <div style={{fontSize: 38, fontWeight: 700, color: COLORS.ink}}>殻に合成樹脂を使うものがある</div>
        <div style={{fontSize: 42, fontWeight: 700, color: COLORS.slate}}>→</div>
        <div style={{fontSize: 38, fontWeight: 700, color: COLORS.ink}}>素材によってはマイクロプラスチックに該当</div>
      </Box>

      <div style={{position: 'absolute', left: 0, top: 618, opacity: p1}}>
        <CornerTag>模式図</CornerTag>
      </div>
    </div>
  );
};

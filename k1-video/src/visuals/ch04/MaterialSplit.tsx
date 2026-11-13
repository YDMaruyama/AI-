import React from 'react';
import {interpolate} from 'remotion';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {CornerTag, SvgText} from '../../components/ui';
import {COLORS} from '../../theme';
import {NeSign, Panel, PanelTitle, Tag, fragmentPoints} from './parts';

/**
 * 分割画面（I6）：食品に触れる材料から
 *  左「材料の一部が粒子として離れる」（角ばった破片・材料にくぼみが残る）
 *  右「化学物質が分子として移る」（小さな点が境目を越える・材料の形は変わらない）
 * を同時に見える配置で示し、≠「別の現象」で区別する。
 * 下段：「容器」「粒子」「添加物」を一つの危険としてまとめず、何についての情報かを確認する。
 */
type Steps = {particle: number; molecule: number; ne: number; lump: number};

const PW = 760;
const CW = 1760 - PW * 2;
const PH = 460;
/** 見出しとの余白 */
const TOP = 16;
const WALL = {x: 20, y: 20, w: 660, h: 96};
const FOOD_Y = WALL.y + WALL.h;
const FOOD_H = 150;
const FOOD_FILL = '#F1E2C4';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const Base: React.FC<{id: string; notch?: number}> = ({id, notch = 0}) => (
  <g>
    <defs>
      <pattern id={id} width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="18" height="18" fill={COLORS.panel} />
        <line x1="0" y1="0" x2="0" y2="18" stroke={COLORS.lineSoft} strokeWidth="6" />
      </pattern>
    </defs>
    <rect x={WALL.x} y={FOOD_Y} width={WALL.w} height={FOOD_H} rx={10} fill={FOOD_FILL} />
    <rect x={WALL.x} y={WALL.y} width={WALL.w} height={WALL.h} rx={10} fill={`url(#${id})`} stroke={COLORS.line} strokeWidth={3} />
    {/* 粒子が離れた跡（くぼみ） */}
    <polygon points="306,117 318,94 350,88 370,102 376,117" fill={FOOD_FILL} stroke={COLORS.slate} strokeWidth={3} strokeDasharray="6 5" opacity={notch} />
    <rect x={WALL.x + 16} y={WALL.y + 26} width={250} height={44} rx={10} fill={COLORS.surface} opacity={0.92} />
    <SvgText x={WALL.x + 141} y={WALL.y + 49} size={30} weight={700}>
      食品に触れる材料
    </SvgText>
    <SvgText x={WALL.x + WALL.w - 20} y={FOOD_Y + FOOD_H - 32} size={30} weight={700} color={COLORS.inkSoft} anchor="end">
      食品
    </SvgText>
  </g>
);

const MOLS: {x: number; y: number; move?: [number, number]; d?: number}[] = [
  {x: 330, y: 44},
  {x: 380, y: 84, move: [400, 170], d: 0},
  {x: 440, y: 50},
  {x: 470, y: 96, move: [500, 210], d: 0.15},
  {x: 520, y: 62},
  {x: 560, y: 90, move: [590, 160], d: 0.3},
  {x: 610, y: 46},
  {x: 640, y: 84, move: [610, 186], d: 0.45},
  {x: 300, y: 92, move: [330, 200], d: 0.2},
];

export const MaterialSplit: React.FC<{steps?: Steps}> = ({steps = {particle: 1, molecule: 2, ne: 3, lump: 4}}) => {
  const base = useReveal(0, {duration: 0.6});
  const part = useReveal(steps.particle, {duration: 2.0});
  const partLabel = useReveal(steps.particle, {delay: 1.2});
  const mol = useReveal(steps.molecule, {duration: 2.2});
  const molLabel = useReveal(steps.molecule, {delay: 1.2});
  const ne = useReveal(steps.ne);
  const lump = useReveal(steps.lump);
  const lf = useFocus((s) => s !== steps.molecule);
  const rf = useFocus((s) => s !== steps.particle);

  const t = interpolate(part, [0.15, 0.9], [0, 1], clamp);
  const chunkX = 340 + 50 * t;
  const chunkY = 104 + 110 * t;
  const notch = interpolate(part, [0.1, 0.3], [0, 1], clamp);

  return (
    <div style={{position: 'absolute', inset: 0}}>
      {/* ---------- 左：粒子として離れる ---------- */}
      <div style={{position: 'absolute', left: 0, top: TOP}}>
        <Panel tone="slate" appear={base} focus={lf} width={PW} height={PH}>
          <div style={{display: 'flex', alignItems: 'center', gap: 16, padding: '20px 28px 4px'}}>
            <Tag tone="slate" size={30}>
              粒子
            </Tag>
            <PanelTitle size={42}>粒子として離れる</PanelTitle>
          </div>
          <svg width={700} height={290} viewBox="0 0 700 290" style={{display: 'block', margin: '0 auto'}}>
            <Base id="ch04-wall-l" notch={notch} />
            {part > 0 ? (
              <>
                <path d={`M340 112 Q ${360} ${170} ${390} ${214}`} fill="none" stroke={COLORS.slate} strokeWidth={3} strokeDasharray="7 7" opacity={t} />
                <polygon points={fragmentPoints(chunkX, chunkY, 34, 0.9)} fill={COLORS.slate} stroke={COLORS.surface} strokeWidth={3} strokeLinejoin="round" />
              </>
            ) : null}
          </svg>
          <div style={{...fadeUp(partLabel, 10), fontSize: 36, fontWeight: 700, color: COLORS.ink, padding: '6px 32px 0'}}>材料の一部が、粒子として離れる</div>
        </Panel>
      </div>

      <div style={{position: 'absolute', left: PW, width: CW, top: TOP + PH / 2 - 90, display: 'flex', justifyContent: 'center'}}>
        <NeSign appear={ne} size={100} lines={['別の現象']} />
      </div>
      <div style={{position: 'absolute', left: PW, width: CW, top: TOP + PH - 60, display: 'flex', justifyContent: 'center'}}>
        <CornerTag appear={base}>模式図</CornerTag>
      </div>

      {/* ---------- 右：分子として移る ---------- */}
      <div style={{position: 'absolute', left: PW + CW, top: TOP}}>
        <Panel tone="gold" appear={base} focus={rf} width={PW} height={PH}>
          <div style={{display: 'flex', alignItems: 'center', gap: 16, padding: '20px 28px 4px'}}>
            <Tag tone="gold" size={30}>
              化学物質
            </Tag>
            <PanelTitle size={42}>分子として移る</PanelTitle>
          </div>
          <svg width={700} height={290} viewBox="0 0 700 290" style={{display: 'block', margin: '0 auto'}}>
            <Base id="ch04-wall-r" />
            {MOLS.map((m, i) => {
              const k = m.move ? interpolate(mol, [0.2 + (m.d ?? 0), 0.75 + (m.d ?? 0) * 0.5], [0, 1], clamp) : 0;
              const x = m.move ? m.x + (m.move[0] - m.x) * k : m.x;
              const y = m.move ? m.y + (m.move[1] - m.y) * k : m.y;
              return <circle key={i} cx={x} cy={y} r={9} fill={COLORS.gold} stroke={COLORS.ink} strokeWidth={1.5} opacity={Math.min(1, mol * 3)} />;
            })}
          </svg>
          <div style={{...fadeUp(molLabel, 10), fontSize: 36, fontWeight: 700, color: COLORS.ink, padding: '6px 32px 0'}}>材料から、化学物質が分子として移る</div>
        </Panel>
      </div>

      {/* ---------- 下：まとめず、何についての情報かを確認 ---------- */}
      <div
        style={{
          ...fadeUp(lump, 12),
          position: 'absolute',
          left: 0,
          right: 0,
          top: TOP + PH + 40,
          height: 120,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 40,
          background: COLORS.goldSoft,
          borderLeft: `8px solid ${COLORS.gold}`,
          borderRadius: 14,
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
          {['容器', '粒子', '添加物'].map((w, i) => (
            <React.Fragment key={w}>
              {i > 0 ? <div style={{height: 54, borderLeft: `3px dashed ${COLORS.gold}`}} /> : null}
              <span style={{fontSize: 38, fontWeight: 700, color: COLORS.ink, background: COLORS.surface, border: `3px solid ${COLORS.line}`, borderRadius: 12, padding: '6px 22px'}}>{w}</span>
            </React.Fragment>
          ))}
        </div>
        <div style={{fontSize: 38, fontWeight: 700, color: COLORS.ink, lineHeight: 1.35}}>
          一つの危険としてまとめず、
          <span style={{color: COLORS.greenDeep}}>何についての情報か</span>を確認
        </div>
      </div>
    </div>
  );
};

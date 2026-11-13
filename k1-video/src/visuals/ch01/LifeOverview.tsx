import React from 'react';
import {Easing, interpolate} from 'remotion';
import {SvgIcon} from '../../components/Icons';
import {useReveal, useStep} from '../../components/scene-context';
import {CornerTag, SvgText} from '../../components/ui';
import {COLORS} from '../../theme';

/**
 * 暮らしの俯瞰図（家の断面の模式図）から、食事・呼吸・肌の接点へ順に寄る。
 * 人物・製品・ブランドは描かず、汎用の記号だけで構成する。
 *
 * props.focus: 各 step で寄る先。'all' は全体表示で 3 つの接点をまとめて強調。
 */
type Zone = 'food' | 'air' | 'skin';
type Focus = Zone | 'all' | 'none';

const VB = {w: 1760, h: 676};
const ROOMS: Record<Zone, {x: number; label: string}> = {
  food: {x: 230, label: '食べる'},
  air: {x: 663, label: '呼吸する'},
  skin: {x: 1096, label: '肌に触れる'},
};
const ROOM_W = 433;
const FLOOR = 600;
const CEIL = 200;

const camera = (f: Focus) => {
  if (f === 'none' || f === 'all') return {x: 0, y: 0, w: VB.w, h: VB.h};
  const s = 1.38;
  const w = VB.w / s;
  const h = VB.h / s;
  const cx = ROOMS[f].x + ROOM_W / 2;
  const cy = 425;
  return {x: cx - w / 2, y: cy - h / 2, w, h};
};

const ease = Easing.bezier(0.33, 0, 0.2, 1);

export const LifeOverview: React.FC<{focus?: Record<string, Focus>}> = ({
  focus = {'0': 'none', '1': 'food', '2': 'air', '3': 'skin', '4': 'all'},
}) => {
  const {step, previous, since} = useStep();
  const cur: Focus = focus[String(step)] ?? 'all';
  const prev: Focus = focus[String(previous)] ?? 'none';
  const k = interpolate(since, [0, 1.1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  const a = camera(prev);
  const b = camera(cur);
  const vb = {
    x: a.x + (b.x - a.x) * k,
    y: a.y + (b.y - a.y) * k,
    w: a.w + (b.w - a.w) * k,
    h: a.h + (b.h - a.h) * k,
  };
  const houseIn = useReveal(0, {duration: 0.9});

  const zoneEmph = (z: Zone) => {
    const on = (f: Focus) => (f === 'none' || f === 'all' || f === z ? 1 : 0);
    return on(prev) + (on(cur) - on(prev)) * k;
  };
  const zoneRing = (z: Zone) => {
    const on = (f: Focus) => (f === z || f === 'all' ? 1 : 0);
    return on(prev) + (on(cur) - on(prev)) * k;
  };

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <svg width={VB.w} height={VB.h} viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} style={{overflow: 'hidden'}}>
        <g opacity={houseIn}>
          {/* 地面と家の外形 */}
          <line x1={80} y1={FLOOR} x2={1680} y2={FLOOR} stroke={COLORS.line} strokeWidth={4} strokeLinecap="round" />
          <path d={`M180 ${CEIL + 6} L880 60 L1580 ${CEIL + 6}`} fill="none" stroke={COLORS.inkSoft} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
          <rect x={230} y={CEIL} width={ROOM_W * 3} height={FLOOR - CEIL} fill={COLORS.surface} stroke={COLORS.inkSoft} strokeWidth={6} />
          <line x1={663} y1={CEIL} x2={663} y2={FLOOR} stroke={COLORS.line} strokeWidth={4} />
          <line x1={1096} y1={CEIL} x2={1096} y2={FLOOR} stroke={COLORS.line} strokeWidth={4} />

          {/* 食べる：棚の容器、食卓の器と飲み物 */}
          <g opacity={0.35 + 0.65 * zoneEmph('food')}>
            <line x1={270} y1={330} x2={470} y2={330} stroke={COLORS.inkSoft} strokeWidth={5} strokeLinecap="round" />
            <SvgIcon name="container" x={285} y={262} size={66} color={COLORS.slate} />
            <SvgIcon name="can" x={380} y={262} size={64} color={COLORS.slate} />
            <rect x={300} y={500} width={300} height={14} rx={7} fill={COLORS.inkSoft} />
            <line x1={330} y1={514} x2={330} y2={FLOOR} stroke={COLORS.inkSoft} strokeWidth={6} />
            <line x1={570} y1={514} x2={570} y2={FLOOR} stroke={COLORS.inkSoft} strokeWidth={6} />
            <SvgIcon name="bowl" x={340} y={420} size={84} color={COLORS.green} />
            <SvgIcon name="glass" x={470} y={420} size={78} color={COLORS.green} />
            <circle cx={446} cy={455} r={130} fill="none" stroke={COLORS.gold} strokeWidth={5} strokeDasharray="10 10" opacity={zoneRing('food')} />
          </g>

          {/* 呼吸する：窓（換気）と空気の流れ、床のほこり */}
          <g opacity={0.35 + 0.65 * zoneEmph('air')}>
            <rect x={735} y={250} width={290} height={170} rx={8} fill={COLORS.slateSoft} stroke={COLORS.inkSoft} strokeWidth={5} />
            <line x1={880} y1={250} x2={880} y2={420} stroke={COLORS.inkSoft} strokeWidth={4} />
            <path d="M760 300 C800 280, 830 320, 870 300 S940 280, 990 300" fill="none" stroke={COLORS.slate} strokeWidth={5} strokeLinecap="round" />
            <path d="M760 350 C800 330, 830 370, 870 350 S940 330, 990 350" fill="none" stroke={COLORS.slate} strokeWidth={5} strokeLinecap="round" />
            <SvgIcon name="sofa" x={760} y={470} size={120} color={COLORS.inkSoft} />
            <SvgIcon name="dust" x={930} y={520} size={74} color={COLORS.slate} />
            <circle cx={880} cy={400} r={150} fill="none" stroke={COLORS.gold} strokeWidth={5} strokeDasharray="10 10" opacity={zoneRing('air')} />
          </g>

          {/* 肌に触れる：鏡と洗面台、衣類 */}
          <g opacity={0.35 + 0.65 * zoneEmph('skin')}>
            <rect x={1150} y={250} width={150} height={120} rx={10} fill={COLORS.slateSoft} stroke={COLORS.inkSoft} strokeWidth={5} />
            <path d="M1135 420 h180 v18 a40 40 0 0 1 -40 40 h-100 a40 40 0 0 1 -40 -40 z" fill={COLORS.surface} stroke={COLORS.inkSoft} strokeWidth={5} />
            <line x1={1225} y1={478} x2={1225} y2={FLOOR} stroke={COLORS.inkSoft} strokeWidth={6} />
            <SvgIcon name="bottle" x={1160} y={366} size={54} color={COLORS.green} />
            <line x1={1350} y1={260} x2={1490} y2={260} stroke={COLORS.inkSoft} strokeWidth={5} strokeLinecap="round" />
            <SvgIcon name="shirt" x={1362} y={272} size={118} color={COLORS.green} />
            <SvgIcon name="hand" x={1370} y={440} size={96} color={COLORS.green} />
            <circle cx={1313} cy={410} r={160} fill="none" stroke={COLORS.gold} strokeWidth={5} strokeDasharray="10 10" opacity={zoneRing('skin')} />
          </g>

          {/* 接点のラベル */}
          {(Object.keys(ROOMS) as Zone[]).map((z) => {
            const r = ROOMS[z];
            const cx = r.x + ROOM_W / 2;
            const e = zoneRing(z);
            return (
              <g key={z} opacity={0.45 + 0.55 * zoneEmph(z)}>
                <rect x={cx - 120} y={FLOOR + 14} width={240} height={56} rx={28} fill={e > 0.5 ? COLORS.green : COLORS.panel} />
                <SvgText x={cx} y={FLOOR + 43} size={32} weight={700} color={e > 0.5 ? COLORS.surface : COLORS.ink}>
                  {r.label}
                </SvgText>
              </g>
            );
          })}
        </g>
      </svg>
      <div style={{position: 'absolute', right: 0, top: 0}}>
        <CornerTag appear={houseIn}>模式図</CornerTag>
      </div>
    </div>
  );
};

import React from 'react';
import {IconName} from '../../components/Icons';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {CornerTag} from '../../components/ui';
import {COLORS} from '../../theme';
import {DashTag, IconDisc} from './parts';

/**
 * M4：ホルモンは成長・性機能・生殖の仕組みを調整 → 働きが妨げられると量や作用する時期が変わり →
 * 生殖器の発達や生殖機能に影響する「場合がある」（点線の矢印＝条件付き）。
 * 一般的な仕組みの説明なので、根拠の種類のバッジは付けない（次の場面で付ける）。
 */
type Steps = {roles: number; disrupt: number; effect: number};

const ROLES = ['成長', '性機能', '生殖の仕組み'];
const CHANGES: {text: string; icon: IconName}[] = [
  {text: 'ホルモンの量', icon: 'scale'},
  {text: '作用する時期', icon: 'clock'},
];

const LEFT_W = 500;
const MID_X = 600;
const MID_W = 560;
const RIGHT_X = 1260;

export const HormoneRoles: React.FC<{steps?: Steps}> = ({steps = {roles: 1, disrupt: 2, effect: 3}}) => {
  const base = useReveal(0);
  const roles = useReveal(steps.roles);
  const dis = useReveal(steps.disrupt);
  const eff = useReveal(steps.effect);
  const a1 = useReveal(steps.disrupt, {delay: 0.2, duration: 0.8});
  const a2 = useReveal(steps.effect, {duration: 0.9});
  const leftFocus = useFocus((s) => s < steps.disrupt);
  const midFocus = useFocus((s) => s === steps.disrupt);
  const rightFocus = useFocus((s) => s >= steps.effect);

  return (
    <div style={{position: 'absolute', inset: 0}}>
      {/* 左：ホルモンの役割 */}
      <div
        style={{
          ...fadeUp(base),
          opacity: base * (0.5 + 0.5 * leftFocus),
          position: 'absolute',
          left: 0,
          top: 80,
          width: LEFT_W,
          height: 520,
          boxSizing: 'border-box',
          background: COLORS.surface,
          border: `3px solid ${leftFocus > 0.5 ? COLORS.green : COLORS.lineSoft}`,
          borderRadius: 24,
          padding: '28px 34px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 20,
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
          <svg width={44} height={44} viewBox="0 0 44 44">
            <circle cx={22} cy={22} r={18} fill={COLORS.green} />
          </svg>
          <div style={{fontSize: 42, fontWeight: 700, color: COLORS.ink}}>ホルモン</div>
        </div>
        <div style={{fontSize: 32, fontWeight: 500, color: COLORS.inkSoft}}>身体の仕組みを調整</div>
        {ROLES.map((r, i) => (
          <div
            key={r}
            style={{
              ...fadeUp(Math.max(0, Math.min(1, roles * 2.2 - i * 0.5))),
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              background: COLORS.greenSoft,
              borderRadius: 16,
              padding: '16px 24px',
            }}
          >
            <span style={{width: 16, height: 16, borderRadius: 8, background: COLORS.green, flexShrink: 0}} />
            <span style={{fontSize: 38, fontWeight: 700, color: COLORS.ink}}>{r}</span>
          </div>
        ))}
      </div>

      {/* 矢印（左→中） */}
      <svg width={1760} height={676} viewBox="0 0 1760 676" style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none'}}>
        <path
          d={`M${LEFT_W + 14} 340 L${MID_X - 18} 340`}
          stroke={COLORS.gold}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={MID_X - LEFT_W - 32}
          strokeDashoffset={(MID_X - LEFT_W - 32) * (1 - a1)}
        />
        <path d={`M${MID_X - 34} 326 L${MID_X - 18} 340 L${MID_X - 34} 354`} fill="none" stroke={COLORS.gold} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" opacity={a1 > 0.95 ? 1 : 0} />
        {/* 中→右：点線＝場合がある */}
        <path
          d={`M${MID_X + MID_W + 14} 340 L${RIGHT_X - 18} 340`}
          stroke={COLORS.gold}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray="12 12"
          opacity={a2}
        />
        <path d={`M${RIGHT_X - 34} 326 L${RIGHT_X - 18} 340 L${RIGHT_X - 34} 354`} fill="none" stroke={COLORS.gold} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" opacity={a2 > 0.95 ? 1 : 0} />
      </svg>

      {/* 中：働きが妨げられると */}
      <div
        style={{
          ...fadeUp(dis),
          opacity: dis * (0.5 + 0.5 * midFocus),
          position: 'absolute',
          left: MID_X,
          top: 80,
          width: MID_W,
          height: 520,
          boxSizing: 'border-box',
          background: COLORS.surface,
          border: `3px solid ${midFocus > 0.5 ? COLORS.gold : COLORS.lineSoft}`,
          borderRadius: 24,
          padding: '28px 34px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 26,
        }}
      >
        <div style={{fontSize: 38, fontWeight: 700, color: COLORS.gold}}>働きが妨げられると</div>
        {CHANGES.map((c) => (
          <div key={c.text} style={{display: 'flex', alignItems: 'center', gap: 20, borderBottom: `2px solid ${COLORS.lineSoft}`, paddingBottom: 22}}>
            <IconDisc name={c.icon} size={88} color={COLORS.gold} bg={COLORS.goldSoft} />
            <div>
              <div style={{fontSize: 38, fontWeight: 700, color: COLORS.ink}}>{c.text}</div>
              <div style={{fontSize: 32, fontWeight: 500, color: COLORS.inkSoft}}>が変わる</div>
            </div>
          </div>
        ))}
      </div>

      {/* 右：影響する場合がある */}
      <div
        style={{
          ...fadeUp(eff),
          opacity: eff * (0.5 + 0.5 * rightFocus),
          position: 'absolute',
          left: RIGHT_X,
          top: 150,
          width: 1760 - RIGHT_X,
          height: 380,
          boxSizing: 'border-box',
          background: COLORS.surface,
          border: `3px dashed ${rightFocus > 0.5 ? COLORS.gold : COLORS.line}`,
          borderRadius: 24,
          padding: '30px 34px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 20,
        }}
      >
        <div style={{fontSize: 40, fontWeight: 700, color: COLORS.ink, lineHeight: 1.4}}>
          生殖器の発達や
          <br />
          生殖機能
        </div>
        <div style={{fontSize: 34, fontWeight: 500, color: COLORS.ink}}>に影響する</div>
        <div>
          <DashTag color={COLORS.gold}>場合がある</DashTag>
        </div>
      </div>

      <div style={{position: 'absolute', right: 0, top: 0}}>
        <CornerTag appear={base}>模式図</CornerTag>
      </div>
    </div>
  );
};

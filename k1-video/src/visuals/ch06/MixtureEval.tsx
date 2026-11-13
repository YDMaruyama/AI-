import React from 'react';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {Pill, SvgPill, SvgText} from '../../components/ui';
import {COLORS} from '../../theme';

/**
 * 似た作用を持つ複数の物質を一緒に評価すること（原文 K8 後半）。
 * 左：同じ印（＝似た作用）を持つ物質 A・B・C を点線の枠で囲む「一緒に評価することもある」
 * 右：留保「すべての組み合わせで影響が何倍にもなる、と決まっているわけではない」
 * 影響の大きさ（倍率）は描かない。
 */
type Steps = {group: number; caveat: number};

const TOKENS = [
  {x: 200, label: 'A'},
  {x: 500, label: 'B'},
  {x: 800, label: 'C'},
];
const TOKEN_Y = 300;
const TOKEN_R = 92;

/** 似た作用を表す共通の印（同じ形をすべての物質に付ける） */
const ActionMark: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g>
    <path d={`M${x - 30} ${y} H${x + 14}`} stroke={COLORS.green} strokeWidth={6} strokeLinecap="round" />
    <path d={`M${x + 2} ${y - 13} L${x + 18} ${y} L${x + 2} ${y + 13}`} fill="none" stroke={COLORS.green} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
    <path d={`M${x + 28} ${y - 16} a 20 20 0 0 1 0 32`} fill="none" stroke={COLORS.green} strokeWidth={5} strokeLinecap="round" />
  </g>
);

export const MixtureEval: React.FC<{steps?: Steps}> = ({steps = {group: 0, caveat: 1}}) => {
  const g = useReveal(steps.group, {duration: 0.8});
  const frame = useReveal(steps.group, {delay: 0.6, duration: 0.8});
  const cav = useReveal(steps.caveat, {duration: 0.7});
  const gf = useFocus((s) => s < steps.caveat);
  const cf = useFocus((s) => s >= steps.caveat);

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <svg width={1000} height={676} viewBox="0 0 1000 676" style={{position: 'absolute', left: 0, top: 0, opacity: 0.55 + 0.45 * gf}}>
        {/* 一緒に評価する枠 */}
        <rect x={40} y={120} width={920} height={380} rx={34} fill="none" stroke={COLORS.gold} strokeWidth={4} strokeDasharray="14 12" opacity={frame} />
        <SvgPill x={500} y={120} text="一緒に評価することもある" size={34} fill={COLORS.gold} color={COLORS.surface} opacity={frame} />
        {/* 物質 A・B・C */}
        {TOKENS.map((t, i) => (
          <g key={t.label} opacity={Math.min(1, g * 1.2 - i * 0.1)}>
            <circle cx={t.x} cy={TOKEN_Y} r={TOKEN_R} fill={COLORS.surface} stroke={COLORS.inkSoft} strokeWidth={4} />
            <SvgText x={t.x} y={TOKEN_Y - 26} size={38} weight={700}>
              {`物質${t.label}`}
            </SvgText>
            <ActionMark x={t.x - 6} y={TOKEN_Y + 34} />
          </g>
        ))}
        <SvgText x={500} y={450} size={30} weight={700} color={COLORS.green} opacity={frame}>
          同じ印 ＝ 似た作用
        </SvgText>
        <SvgText x={500} y={566} size={38} weight={700} opacity={g}>
          似た作用を持つ複数の物質
        </SvgText>
      </svg>

      {/* ただし：すべての組み合わせで何倍にも、とは決まっていない */}
      <div
        style={{
          ...fadeUp(cav),
          opacity: cav * (0.55 + 0.45 * cf),
          position: 'absolute',
          left: 1050,
          right: 0,
          top: 120,
          height: 380,
          boxSizing: 'border-box',
          background: COLORS.surface,
          border: `3px solid ${cf > 0.5 ? COLORS.slate : COLORS.lineSoft}`,
          borderTop: `14px solid ${COLORS.slate}`,
          borderRadius: 22,
          padding: '36px 44px',
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
        }}
      >
        <div>
          <Pill tone="slate" filled size={30}>
            ただし
          </Pill>
        </div>
        {/* 否定の部分だけが切り離されて読まれないよう、1 つの文として区切らずに置く */}
        <div style={{fontSize: 42, fontWeight: 700, color: COLORS.ink, lineHeight: 1.55}}>
          すべての組み合わせで
          <br />
          影響が何倍にもなる、と
          <br />
          <span style={{color: COLORS.slate, borderBottom: `4px solid ${COLORS.slate}`}}>決まっているわけではない</span>
        </div>
      </div>
    </div>
  );
};

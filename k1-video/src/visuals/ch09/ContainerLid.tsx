import React from 'react';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {Arrow, CornerTag, SvgPill, SvgText} from '../../components/ui';
import {COLORS} from '../../theme';
import {Box} from './parts';

/**
 * 温めるときの器と、容器・ふたの表示（N5）。
 *  左：電子レンジ対応のガラスや陶磁器の食器へ移す方法
 *  右：ふたと容器を分けて描き、それぞれの表示（ラベル）へ線でつなぐ。
 *      「対応条件が異なる場合も」→ 両方の表示にチェック（それぞれ確認）
 * 表示の中身は灰色の線で模式的に示し、具体的な表示内容は創作しない。
 */
type Steps = {transfer: number; differ: number; check: number};

const LabelCard: React.FC<{x: number; y: number; title: string; checked: number}> = ({x, y, title, checked}) => (
  <g>
    <rect x={x} y={y} width={400} height={150} rx={14} fill={COLORS.surface} stroke={COLORS.inkSoft} strokeWidth={3} />
    <SvgText x={x + 28} y={y + 40} anchor="start" size={32} weight={700}>
      {title}
    </SvgText>
    {[0, 1, 2].map((k) => (
      <rect key={k} x={x + 28} y={y + 76 + k * 22} width={k === 2 ? 180 : 260} height={10} rx={5} fill={COLORS.lineSoft} />
    ))}
    {/* チェック欄 */}
    <rect x={x + 318} y={y + 64} width={56} height={56} rx={10} fill={COLORS.surface} stroke={COLORS.green} strokeWidth={4} />
    <path
      d={`M${x + 330} ${y + 93} l10 10 l20 -22`}
      fill="none"
      stroke={COLORS.green}
      strokeWidth={6}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={46}
      strokeDashoffset={46 * (1 - checked)}
    />
  </g>
);

export const ContainerLid: React.FC<{steps?: Steps}> = ({steps = {transfer: 1, differ: 2, check: 3}}) => {
  const left = useReveal(steps.transfer);
  const move = useReveal(steps.transfer, {delay: 0.4, duration: 1.0});
  const leftFocus = useFocus((s) => s <= steps.transfer);
  const right = useReveal(steps.differ);
  const lines = useReveal(steps.differ, {delay: 0.3, duration: 0.8});
  const differ = useReveal(steps.differ, {delay: 0.9});
  const rightFocus = useFocus((s) => s >= steps.differ);
  const checkA = useReveal(steps.check, {delay: 0.3, duration: 0.5});
  const checkB = useReveal(steps.check, {delay: 0.9, duration: 0.5});
  const each = useReveal(steps.check, {delay: 1.2});

  return (
    <div style={{position: 'absolute', inset: 0}}>
      {/* 左：移す方法 */}
      <Box appear={left} focus={leftFocus} tone="green" topBar style={{left: 0, top: 16, width: 600, height: 590, padding: '24px 30px'}}>
        <div style={{fontSize: 34, fontWeight: 700, color: COLORS.inkSoft}}>温めるときの方法の一つ</div>
        <svg width={540} height={280} viewBox="0 0 540 280" style={{display: 'block', marginTop: 16}}>
          {/* プラスチック容器 */}
          <path d="M20 110 L170 110 L156 200 L34 200 Z" fill="#D5DEE5" stroke={COLORS.slate} strokeWidth={3} />
          <path d="M30 130 Q95 122 160 130 L154 196 L36 196 Z" fill="#EBCB92" opacity={1 - move * 0.7} />
          <SvgText x={95} y={240} size={28} weight={700} color={COLORS.inkSoft}>
            プラスチック
          </SvgText>
          <Arrow from={[188, 150]} to={[262, 150]} p={move} color={COLORS.green} width={6} />
          {/* ガラスの器 */}
          <path d="M282 112 L382 112 L372 200 L292 200 Z" fill="#E6F0F2" stroke="#7FA3AD" strokeWidth={4} />
          <path d="M290 140 Q332 134 376 140 L371 196 L293 196 Z" fill="#EBCB92" opacity={move} />
          <SvgText x={332} y={240} size={28} weight={700} color={COLORS.inkSoft}>
            ガラス
          </SvgText>
          {/* 陶磁器の器 */}
          <path d="M408 140 h120 c0 34 -26 60 -60 60 s-60 -26 -60 -60 z" fill="#F4EFE6" stroke={COLORS.inkSoft} strokeWidth={4} />
          <path d="M414 148 h108 c-4 24 -24 44 -54 44 s-50 -20 -54 -44 z" fill="#EBCB92" opacity={move} />
          <SvgText x={468} y={240} size={28} weight={700} color={COLORS.inkSoft}>
            陶磁器
          </SvgText>
        </svg>
        <div style={{fontSize: 38, fontWeight: 700, color: COLORS.ink, lineHeight: 1.45, marginTop: 18}}>
          電子レンジ対応の
          <br />
          ガラスや陶磁器の食器へ移す
        </div>
      </Box>

      {/* 右：容器とふたの表示 */}
      <Box appear={right} focus={rightFocus} tone="green" topBar style={{left: 640, top: 16, width: 1120, height: 590, padding: '24px 30px'}}>
        <div style={{fontSize: 34, fontWeight: 700, color: COLORS.inkSoft}}>容器とふた、それぞれの表示</div>
        <svg width={1060} height={480} viewBox="0 0 1060 480" style={{display: 'block', marginTop: 10}}>
          {/* ふた（分けて描く） */}
          <rect x={60} y={74} width={420} height={42} rx={12} fill="#C3CED8" stroke={COLORS.slate} strokeWidth={3} />
          <rect x={230} y={52} width={80} height={24} rx={8} fill="#C3CED8" stroke={COLORS.slate} strokeWidth={3} />
          <SvgText x={270} y={152} size={30} weight={700} color={COLORS.slate}>
            ふた
          </SvgText>
          {/* 容器 */}
          <path d="M60 196 L480 196 L446 400 L94 400 Z" fill="#D5DEE5" stroke={COLORS.slate} strokeWidth={3} />
          <SvgText x={270} y={300} size={30} weight={700} color={COLORS.slate}>
            容器
          </SvgText>

          {/* 引き出し線 */}
          <g opacity={lines}>
            <circle cx={480} cy={95} r={7} fill={COLORS.inkSoft} />
            <line x1={480} y1={95} x2={600} y2={95} stroke={COLORS.inkSoft} strokeWidth={3} />
            <circle cx={466} cy={290} r={7} fill={COLORS.inkSoft} />
            <line x1={466} y1={290} x2={600} y2={345} stroke={COLORS.inkSoft} strokeWidth={3} />
          </g>
          <g opacity={lines}>
            <LabelCard x={600} y={20} title="ふたの表示" checked={checkA} />
            <LabelCard x={600} y={270} title="容器の表示" checked={checkB} />
          </g>
          <SvgPill x={800} y={220} text="対応条件が異なる場合も" size={28} fill={COLORS.goldSoft} color={COLORS.gold} stroke={COLORS.gold} dashed opacity={differ} />
          <SvgPill x={800} y={456} text="それぞれ確認" size={30} fill={COLORS.green} color={COLORS.surface} opacity={each} />
        </svg>
      </Box>

      <div style={{...fadeUp(right), position: 'absolute', left: 640, top: 624}}>
        <CornerTag>模式図</CornerTag>
      </div>
    </div>
  );
};

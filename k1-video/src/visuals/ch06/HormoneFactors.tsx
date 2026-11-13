import React from 'react';
import {Icon} from '../../components/Icons';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {COLORS} from '../../theme';

/**
 * 量だけでなく、分泌される時期や、細胞が情報を受け取る仕組みも重要（原文 K1）。
 * 3 枚のカードを「＋」でつなぎ、量だけを見るのではないことを示す。
 * 「受け取る仕組み」は、後の情報伝達の図（HormoneSignal）と同じ形（受容体のくぼみと緑の丸）で描く。
 */
type Item = {title: string; body: string; pict: 'amount' | 'timing' | 'receive'};

const ITEMS: Item[] = [
  {title: '量', body: 'ホルモンの量', pict: 'amount'},
  {title: '時期', body: '分泌される時期', pict: 'timing'},
  {title: '受け取る仕組み', body: '細胞が情報を\n受け取る仕組み', pict: 'receive'},
];

const CARD_W = 500;
const CARD_H = 440;
const GAP = 80;
const LEFT = (1760 - (CARD_W * 3 + GAP * 2)) / 2;
const TOP = (676 - CARD_H) / 2;

/** 受容体のくぼみにホルモン（緑の丸）が収まる小さな図 */
const ReceivePict: React.FC = () => (
  <svg width={120} height={96} viewBox="0 0 120 96">
    <rect x={44} y={6} width={72} height={84} rx={18} fill={COLORS.greenSoft} stroke={COLORS.green} strokeWidth={4} />
    <path d="M44 22 h-10 v12 h-6 a14 14 0 0 0 0 28 h6 v12 h10" fill={COLORS.surface} stroke={COLORS.green} strokeWidth={4} strokeLinejoin="round" />
    <circle cx={28} cy={48} r={11} fill={COLORS.green} stroke={COLORS.surface} strokeWidth={3} />
  </svg>
);

const FactorCard: React.FC<{item: Item; index: number; steps: number[]; allStep: number}> = ({item, index, steps, allStep}) => {
  const appear = useReveal(steps[index]);
  const focus = useFocus((s) => s >= allStep || s === steps[index]);
  return (
    <div
      style={{
        ...fadeUp(appear),
        opacity: appear * (0.5 + 0.5 * focus),
        width: CARD_W,
        height: CARD_H,
        boxSizing: 'border-box',
        background: COLORS.surface,
        borderRadius: 22,
        border: `3px solid ${focus > 0.5 ? COLORS.green : COLORS.lineSoft}`,
        boxShadow: focus > 0.5 ? `0 10px 28px rgba(42,43,42,${0.1 * focus})` : 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 22,
        textAlign: 'center',
        padding: '48px 30px 0',
      }}
    >
      <div style={{width: 150, height: 150, borderRadius: 75, background: COLORS.greenSoft, color: COLORS.green, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        {item.pict === 'amount' ? <Icon name="scale" size={90} /> : null}
        {item.pict === 'timing' ? <Icon name="clock" size={90} /> : null}
        {item.pict === 'receive' ? <ReceivePict /> : null}
      </div>
      <div style={{fontSize: 50, fontWeight: 700, color: COLORS.ink, lineHeight: 1.25}}>{item.title}</div>
      <div style={{fontSize: 34, fontWeight: 500, color: COLORS.inkSoft, lineHeight: 1.45, whiteSpace: 'pre-line'}}>{item.body}</div>
    </div>
  );
};

const Plus: React.FC<{appear: number}> = ({appear}) => (
  <div style={{...fadeUp(appear, 8), width: GAP, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, fontWeight: 700, color: COLORS.gold}}>＋</div>
);

export const HormoneFactors: React.FC<{steps?: number[]; allStep?: number}> = ({steps = [0, 1, 2], allStep = 3}) => {
  const p1 = useReveal(steps[1]);
  const p2 = useReveal(steps[2]);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', left: LEFT, top: TOP, display: 'flex', alignItems: 'stretch'}}>
        <FactorCard item={ITEMS[0]} index={0} steps={steps} allStep={allStep} />
        <Plus appear={p1} />
        <FactorCard item={ITEMS[1]} index={1} steps={steps} allStep={allStep} />
        <Plus appear={p2} />
        <FactorCard item={ITEMS[2]} index={2} steps={steps} allStep={allStep} />
      </div>
    </div>
  );
};

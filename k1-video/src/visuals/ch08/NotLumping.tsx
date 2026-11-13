import React from 'react';
import {IconName} from '../../components/Icons';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {Pill} from '../../components/ui';
import {COLORS} from '../../theme';
import {IconDisc} from './parts';

/**
 * M14：「プラスチックだから同じ」「環境ホルモンだから同じ」とまとめず、具体的な物質と接し方を見る。
 * 日々の生活では、不要な曝露を減らしながら、食事・衛生・必要な医療を保つ。
 * まとめる言い方は点線の吹き出し（弱い表示）、見るべきものは実線のカードで区別する。
 */
type Steps = {lump: number; concrete: number; daily: number; keep: number};

const Bubble: React.FC<{text: string}> = ({text}) => (
  <div
    style={{
      fontSize: 38,
      fontWeight: 700,
      color: COLORS.inkSoft,
      background: COLORS.panel,
      border: `3px dashed ${COLORS.line}`,
      borderRadius: 40,
      padding: '14px 34px',
      whiteSpace: 'nowrap',
    }}
  >
    {text}
  </div>
);

const SmallCard: React.FC<{icon: IconName; text: React.ReactNode; tone?: 'green' | 'gold'}> = ({icon, text, tone = 'green'}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 22,
      background: COLORS.surface,
      border: `3px solid ${tone === 'green' ? COLORS.green : COLORS.gold}`,
      borderRadius: 20,
      padding: '18px 30px',
    }}
  >
    <IconDisc name={icon} size={84} color={tone === 'green' ? COLORS.green : COLORS.gold} bg={tone === 'green' ? COLORS.greenSoft : COLORS.goldSoft} />
    <div style={{fontSize: 40, fontWeight: 700, color: COLORS.ink, lineHeight: 1.35}}>{text}</div>
  </div>
);

export const NotLumping: React.FC<{steps?: Steps}> = ({steps = {lump: 1, concrete: 2, daily: 3, keep: 4}}) => {
  const lump = useReveal(steps.lump);
  const concrete = useReveal(steps.concrete);
  const arrow = useReveal(steps.concrete, {duration: 0.7});
  const daily = useReveal(steps.daily);
  const keep = useReveal(steps.keep);
  const fTop = useFocus((s) => s < steps.daily);
  const fDaily = useFocus((s) => s >= steps.daily);

  return (
    <div style={{position: 'absolute', inset: 0}}>
      {/* まとめない */}
      <div style={{...fadeUp(lump), opacity: lump * (0.55 + 0.45 * fTop), position: 'absolute', left: 0, right: 0, top: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28}}>
        <Bubble text="「プラスチックだから同じ」" />
        <Bubble text="「環境ホルモンだから同じ」" />
        <Pill tone="gold" filled size={32}>
          とまとめない
        </Pill>
      </div>

      {/* 下向きの矢印 */}
      <svg width={1760} height={80} viewBox="0 0 1760 80" style={{position: 'absolute', left: 0, top: 110, opacity: fTop * 0.45 + 0.55}}>
        <path d="M880 6 V60" stroke={COLORS.gold} strokeWidth={6} strokeLinecap="round" strokeDasharray={54} strokeDashoffset={54 * (1 - arrow)} />
        <path d="M864 46 L880 62 L896 46" fill="none" stroke={COLORS.gold} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" opacity={arrow > 0.95 ? 1 : 0} />
      </svg>

      {/* 具体的な物質と接し方を見る */}
      <div style={{...fadeUp(concrete), opacity: concrete * (0.55 + 0.45 * fTop), position: 'absolute', left: 0, right: 0, top: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 26}}>
        <SmallCard icon="flask" text="具体的な物質" />
        <div style={{fontSize: 38, fontWeight: 700, color: COLORS.inkSoft}}>と</div>
        <SmallCard icon="hand" text="接し方" />
        <div style={{fontSize: 40, fontWeight: 700, color: COLORS.ink}}>を見る</div>
      </div>

      {/* 日々の生活では */}
      <div
        style={{
          ...fadeUp(daily),
          opacity: daily * (0.55 + 0.45 * fDaily),
          position: 'absolute',
          left: 0,
          right: 0,
          top: 372,
          bottom: 0,
          boxSizing: 'border-box',
          background: COLORS.surface,
          border: `3px solid ${fDaily > 0.5 ? COLORS.green : COLORS.lineSoft}`,
          borderRadius: 24,
          padding: '22px 40px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        <div style={{fontSize: 32, fontWeight: 700, color: COLORS.inkSoft}}>日々の生活では</div>
        <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 34, paddingBottom: 30}}>
          <SmallCard icon="shield" text="不要な曝露を減らしながら" tone="gold" />
          <div style={{...fadeUp(keep)}}>
            <SmallCard icon="heart" text="食事・衛生・必要な医療を保つ" />
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {EvidenceBadge} from '../../components/ui';
import {COLORS} from '../../theme';
import {IconDisc} from './parts';

/**
 * M7：免疫は感染から身体を守る一方、反応が強すぎると炎症などにも関わる。
 * BPA について、欧州の食品安全の評価機関は免疫系への有害な影響を重視して評価（評価機関の判断のバッジ）。
 * 機関名は表示せず、一般名で帰属を残す。
 */
type Steps = {protect: number; strong: number; assess: number};

const CARD_W = 760;
const CARD_TOP = 22;
const CARD_H = 340;

export const ImmuneBalance: React.FC<{steps?: Steps; assessor?: string; assessText?: string}> = ({
  steps = {protect: 1, strong: 2, assess: 3},
  assessor = '欧州の食品安全の評価機関',
  assessText = '免疫系への有害な影響を重視して評価',
}) => {
  const protect = useReveal(steps.protect);
  const strong = useReveal(steps.strong);
  const between = useReveal(steps.strong, {delay: 0.2});
  const assess = useReveal(steps.assess);
  const fProtect = useFocus((s) => s === steps.protect);
  const fStrong = useFocus((s) => s === steps.strong);
  const fAssess = useFocus((s) => s >= steps.assess);

  const card = (appear: number, focus: number, tone: string): React.CSSProperties => ({
    ...fadeUp(appear),
    opacity: appear * (0.5 + 0.5 * focus),
    position: 'absolute',
    top: CARD_TOP,
    width: CARD_W,
    height: CARD_H,
    boxSizing: 'border-box',
    background: COLORS.surface,
    border: `3px solid ${focus > 0.5 ? tone : COLORS.lineSoft}`,
    borderTop: `12px solid ${tone}`,
    borderRadius: 24,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    textAlign: 'center',
  });

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{...card(protect, fProtect, COLORS.green), left: 0}}>
        <IconDisc name="shield" size={120} />
        <div style={{fontSize: 34, fontWeight: 700, color: COLORS.inkSoft}}>免疫の働き</div>
        <div style={{fontSize: 44, fontWeight: 700, color: COLORS.ink}}>感染から身体を守る</div>
      </div>

      <div
        style={{
          ...fadeUp(between, 10),
          position: 'absolute',
          left: CARD_W,
          width: 1760 - CARD_W * 2,
          top: CARD_TOP + CARD_H / 2 - 30,
          textAlign: 'center',
          fontSize: 38,
          fontWeight: 700,
          color: COLORS.gold,
        }}
      >
        一方
      </div>

      <div style={{...card(strong, fStrong, COLORS.slate), left: 1760 - CARD_W}}>
        <IconDisc name="cell" size={120} color={COLORS.slate} bg={COLORS.slateSoft} />
        <div style={{fontSize: 34, fontWeight: 700, color: COLORS.inkSoft}}>反応が強すぎると</div>
        <div style={{fontSize: 44, fontWeight: 700, color: COLORS.ink}}>炎症などにも関わる</div>
      </div>

      {/* 評価機関の判断 */}
      <div
        style={{
          ...fadeUp(assess),
          opacity: assess * (0.5 + 0.5 * fAssess),
          position: 'absolute',
          left: 0,
          right: 0,
          top: CARD_TOP + CARD_H + 44,
          bottom: 0,
          boxSizing: 'border-box',
          background: COLORS.surface,
          border: `3px solid ${fAssess > 0.5 ? COLORS.inkSoft : COLORS.lineSoft}`,
          borderRadius: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 40,
          padding: '0 48px',
        }}
      >
        <div style={{display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0}}>
          <div style={{fontSize: 34, fontWeight: 700, color: COLORS.ink, whiteSpace: 'nowrap'}}>BPAについて</div>
          <EvidenceBadge kind="assessment" size={30} />
        </div>
        <div style={{width: 3, alignSelf: 'stretch', margin: '40px 0', background: COLORS.lineSoft}} />
        <div>
          <div style={{fontSize: 34, fontWeight: 700, color: COLORS.inkSoft}}>{assessor}</div>
          <div style={{fontSize: 42, fontWeight: 700, color: COLORS.ink, lineHeight: 1.4, marginTop: 6}}>{assessText}</div>
        </div>
      </div>
    </div>
  );
};

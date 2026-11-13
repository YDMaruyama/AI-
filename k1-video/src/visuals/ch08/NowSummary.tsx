import React from 'react';
import {Icon} from '../../components/Icons';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {EvidenceBadge, Pill} from '../../components/ui';
import {COLORS} from '../../theme';
import {DashTag} from './parts';

/**
 * M13：現時点で言えること。
 *  左：一部の化学物質 … 生殖・発達や免疫への有害性が確認（評価機関の判断）→ 曝露を減らすための管理
 *  右：マイクロプラスチック … 炎症などを起こす仕組みを研究中／普段の量でどの病気がどの程度増えるかは明確に示せる段階にない（未解明）
 * 左右は「一方」で並べ、同じ段階の話として描かない。
 */
type Steps = {chem: number; manage: number; mpStudy: number; mpUnknown: number};

const PANEL_W = 780;

const Item: React.FC<{appear: number; focus: number; head: React.ReactNode; children: React.ReactNode}> = ({appear, focus, head, children}) => (
  <div style={{...fadeUp(appear), opacity: appear * (0.5 + 0.5 * focus), display: 'flex', flexDirection: 'column', gap: 12}}>
    <div>{head}</div>
    <div style={{fontSize: 38, fontWeight: 700, color: COLORS.ink, lineHeight: 1.45}}>{children}</div>
  </div>
);

export const NowSummary: React.FC<{steps?: Steps}> = ({steps = {chem: 1, manage: 2, mpStudy: 3, mpUnknown: 4}}) => {
  const left = useReveal(steps.chem);
  const manage = useReveal(steps.manage);
  const right = useReveal(steps.mpStudy);
  const unk = useReveal(steps.mpUnknown);
  const fLeft = useFocus((s) => s < steps.mpStudy);
  const fChem = useFocus((s) => s === steps.chem);
  const fManage = useFocus((s) => s === steps.manage);
  const fRight = useFocus((s) => s >= steps.mpStudy);
  const fStudy = useFocus((s) => s === steps.mpStudy);
  const fUnk = useFocus((s) => s === steps.mpUnknown);

  const panel = (appear: number, focus: number, x: number, tone: string): React.CSSProperties => ({
    ...fadeUp(appear),
    opacity: appear * (0.7 + 0.3 * focus),
    position: 'absolute',
    left: x,
    top: 20,
    width: PANEL_W,
    height: 656,
    boxSizing: 'border-box',
    background: COLORS.surface,
    border: `3px solid ${focus > 0.5 ? tone : COLORS.lineSoft}`,
    borderTop: `14px solid ${tone}`,
    borderRadius: 24,
    padding: '26px 38px',
    display: 'flex',
    flexDirection: 'column',
    gap: 26,
  });

  return (
    <div style={{position: 'absolute', inset: 0}}>
      {/* 一部の化学物質 */}
      <div style={panel(left, fLeft, 0, COLORS.gold)}>
        <div>
          <Pill tone="gold" filled size={34}>
            一部の化学物質
          </Pill>
        </div>
        <Item appear={left} focus={Math.max(fChem, fRight > 0.5 ? 1 : 0)} head={<EvidenceBadge kind="assessment" size={30} />}>
          生殖・発達や免疫への
          <br />
          有害性が確認されている
        </Item>
        <div style={{...fadeUp(manage), color: COLORS.gold, marginLeft: 20}}>
          <svg width={40} height={44} viewBox="0 0 40 44">
            <path d="M20 4 V36 M8 26 L20 38 L32 26" fill="none" stroke={COLORS.gold} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <Item
          appear={manage}
          focus={Math.max(fManage, fRight > 0.5 ? 1 : 0)}
          head={
            <span style={{display: 'inline-flex', alignItems: 'center', gap: 10, color: COLORS.green, fontSize: 30, fontWeight: 700}}>
              <Icon name="check" size={40} />
              管理
            </span>
          }
        >
          曝露を減らすための
          <br />
          管理が行われている
        </Item>
      </div>

      <div
        style={{
          ...fadeUp(right, 10),
          position: 'absolute',
          left: PANEL_W,
          width: 1760 - PANEL_W * 2,
          top: 320,
          textAlign: 'center',
          fontSize: 38,
          fontWeight: 700,
          color: COLORS.gold,
        }}
      >
        一方
      </div>

      {/* マイクロプラスチック */}
      <div style={panel(right, fRight, 1760 - PANEL_W, COLORS.slate)}>
        <div>
          <Pill tone="slate" filled size={34}>
            マイクロプラスチック
          </Pill>
        </div>
        <Item appear={right} focus={fStudy} head={<DashTag color={COLORS.slate}>研究されている</DashTag>}>
          炎症などを起こす仕組み
        </Item>
        <Item appear={unk} focus={fUnk} head={<EvidenceBadge kind="unknown" label="明確に示せる段階にない" size={30} />}>
          普段の生活で取り込む量によって、
          <br />
          どの病気がどの程度増えるのか
        </Item>
      </div>
    </div>
  );
};

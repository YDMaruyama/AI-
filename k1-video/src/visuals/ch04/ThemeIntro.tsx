import React from 'react';
import {Icon, IconName, SvgIcon} from '../../components/Icons';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {COLORS} from '../../theme';
import {Fragment, Panel, PanelTitle} from './parts';

/**
 * ここから学ぶ二つのテーマ（H1 前半）。
 * 上段：物質に接する場面（食べ物・水・空気・身の回りの製品）
 * 下段：小さなプラスチック粒子／ホルモンの働きに影響する化学物質
 */
type Steps = {particles: number; chemicals: number};

const LW = 520;
const H = 640;
const PW = (1760 - LW - 40 - 40) / 2;

const CONTACTS: {icon: IconName; label: string}[] = [
  {icon: 'food', label: '食べ物'},
  {icon: 'water', label: '水'},
  {icon: 'air', label: '空気'},
  {icon: 'package', label: '身の回りの製品'},
];

const ContactChip: React.FC<{icon: IconName; label: string; delay: number}> = ({icon, label, delay}) => {
  const p = useReveal(0, {delay, duration: 0.6});
  return (
    <div style={{...fadeUp(p, 10), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12}}>
      <div style={{width: 124, height: 124, borderRadius: 62, background: COLORS.surface, color: COLORS.inkSoft, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Icon name={icon} size={76} />
      </div>
      <div style={{fontSize: 34, fontWeight: 700, color: COLORS.ink, whiteSpace: 'nowrap'}}>{label}</div>
    </div>
  );
};

const ParticleArt: React.FC = () => (
  <svg width={300} height={170} viewBox="0 0 300 170">
    <Fragment x={80} y={80} r={46} seed={0.4} />
    <Fragment x={170} y={60} r={28} seed={1.3} />
    <Fragment x={210} y={120} r={20} seed={2.2} />
    <Fragment x={140} y={130} r={12} seed={3.1} />
    <Fragment x={250} y={70} r={9} seed={0.9} />
    <circle cx={262} cy={130} r={5} fill={COLORS.slate} />
    <circle cx={110} cy={150} r={4} fill={COLORS.slate} />
  </svg>
);

const HormoneArt: React.FC = () => (
  <svg width={300} height={170} viewBox="0 0 300 170">
    {/* 受け取る細胞と受容体の模式（第6章と同じ記号：● ホルモン） */}
    <rect x={150} y={20} width={140} height={130} rx={36} fill={COLORS.greenSoft} stroke={COLORS.green} strokeWidth={4} />
    <path d="M150 62 h-14 v12 h-10 a12 12 0 0 0 0 24 h10 v12 h14" fill={COLORS.surface} stroke={COLORS.inkSoft} strokeWidth={4} strokeLinejoin="round" />
    <circle cx={60} cy={100} r={18} fill={COLORS.green} stroke={COLORS.surface} strokeWidth={3} />
    <path d="M84 98 Q100 90 112 86" stroke={COLORS.green} strokeWidth={4} strokeLinecap="round" strokeDasharray="6 6" />
    <SvgIcon name="flask" x={4} y={10} size={56} color={COLORS.slate} />
  </svg>
);

export const ThemeIntro: React.FC<{steps?: Steps}> = ({steps = {particles: 1, chemicals: 2}}) => {
  const a = useReveal(steps.particles);
  const b = useReveal(steps.chemicals);
  const fa = useFocus((s) => s === steps.particles || s > steps.chemicals);
  const fb = useFocus((s) => s >= steps.chemicals);
  const row = useReveal(0);
  const rowFocus = useFocus((s) => s === 0);

  return (
    <div style={{position: 'absolute', inset: 0}}>
      {/* 左：物質に接する場面 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: LW,
          height: H,
          boxSizing: 'border-box',
          background: COLORS.panel,
          borderRadius: 22,
          opacity: 0.55 + 0.45 * rowFocus,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 40,
        }}
      >
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 30, rowGap: 34, width: LW - 60}}>
          {CONTACTS.map((c, i) => (
            <ContactChip key={c.label} icon={c.icon} label={c.label} delay={i * 0.35} />
          ))}
        </div>
        <div style={{...fadeUp(row), fontSize: 34, fontWeight: 700, color: COLORS.inkSoft, textAlign: 'center', lineHeight: 1.4}}>
          さまざまな物質に
          <br />
          接している
        </div>
      </div>

      {/* 右：ここから学ぶ二つのテーマ */}
      <div style={{position: 'absolute', left: LW + 40, right: 0, top: 0, display: 'flex', justifyContent: 'space-between'}}>
        <Panel tone="slate" appear={a} focus={fa} width={PW} height={H}>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 70, gap: 36, textAlign: 'center'}}>
            <div style={{transform: 'scale(1.3)', transformOrigin: 'center top', height: 230}}>
              <ParticleArt />
            </div>
            <PanelTitle size={48}>
              小さな
              <br />
              プラスチック粒子
            </PanelTitle>
          </div>
        </Panel>
        <Panel tone="green" appear={b} focus={fb} width={PW} height={H}>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 70, gap: 36, textAlign: 'center'}}>
            <div style={{transform: 'scale(1.3)', transformOrigin: 'center top', height: 230}}>
              <HormoneArt />
            </div>
            <PanelTitle size={48}>
              ホルモンの働きに
              <br />
              影響する化学物質
            </PanelTitle>
          </div>
        </Panel>
      </div>
    </div>
  );
};

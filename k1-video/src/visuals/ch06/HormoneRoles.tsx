import React from 'react';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {Arrow, SvgText} from '../../components/ui';
import {COLORS} from '../../theme';

/**
 * ホルモンとは：体の中で情報を伝える物質（原文 K1）。
 * 左「分泌するところ（例）」→ 中央「ホルモン」→ 右「調整する働き（例）」。
 * 臓器の位置や形は描かない（解剖図にしない）。どの臓器がどの働きに対応するかを線で結ばない
 * （原文にない対応関係を作らないため、一覧どうしを 1 本の矢印でつなぐだけにする）。
 */
type Steps = {hub: number; sources: number; roles: number};

const SOURCES = ['甲状腺', 'すい臓', '卵巣', '精巣'];
const ROLES = ['成長', '代謝', '血糖', '生殖', '発達'];

const PANEL = {w: 500, top: 64, h: 548};
const LEFT_X = 20;
const RIGHT_X = 1760 - 20 - PANEL.w;
const HUB = {x: 880, y: 340, r: 165};

const Panel: React.FC<{
  x: number;
  title: string;
  items: string[];
  tone: 'gold' | 'green';
  appear: number;
  focus: number;
  marker: 'gland' | 'dot';
}> = ({x, title, items, tone, appear, focus, marker}) => {
  const main = tone === 'gold' ? COLORS.gold : COLORS.green;
  const soft = tone === 'gold' ? COLORS.goldSoft : COLORS.greenSoft;
  return (
    <div
      style={{
        ...fadeUp(appear),
        opacity: appear * (0.55 + 0.45 * focus),
        position: 'absolute',
        left: x,
        top: PANEL.top,
        width: PANEL.w,
        height: PANEL.h,
        boxSizing: 'border-box',
        background: COLORS.surface,
        borderRadius: 22,
        border: `3px solid ${focus > 0.5 ? main : COLORS.lineSoft}`,
        borderTop: `14px solid ${main}`,
        padding: '26px 40px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div style={{fontSize: 34, fontWeight: 700, color: main, marginBottom: 6}}>{title}</div>
      {items.map((t) => (
        <div key={t} style={{display: 'flex', alignItems: 'center', gap: 22}}>
          <svg width={40} height={40} viewBox="0 0 40 40" style={{flexShrink: 0}}>
            {marker === 'gland' ? (
              <ellipse cx={20} cy={20} rx={15} ry={18} fill={soft} stroke={main} strokeWidth={3.5} />
            ) : (
              <circle cx={20} cy={20} r={11} fill={main} />
            )}
          </svg>
          <span style={{fontSize: 42, fontWeight: 700, color: COLORS.ink, lineHeight: 1.3}}>{t}</span>
        </div>
      ))}
      <div style={{fontSize: 32, fontWeight: 500, color: COLORS.inkSoft, paddingLeft: 62}}>など</div>
    </div>
  );
};

export const HormoneRoles: React.FC<{steps?: Steps}> = ({steps = {hub: 0, sources: 1, roles: 2}}) => {
  const hub = useReveal(steps.hub, {duration: 0.8});
  const src = useReveal(steps.sources);
  const srcArrow = useReveal(steps.sources, {delay: 0.3, duration: 0.8});
  const roles = useReveal(steps.roles);
  const rolesArrow = useReveal(steps.roles, {delay: 0.3, duration: 0.8});
  const hubFocus = useFocus((s) => s === steps.hub || s > steps.roles);
  const srcFocus = useFocus((s) => s === steps.sources || s > steps.roles);
  const rolesFocus = useFocus((s) => s >= steps.roles);

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <svg width={1760} height={676} viewBox="0 0 1760 676" style={{position: 'absolute', left: 0, top: 0}}>
        {/* 中央：ホルモン */}
        <g opacity={hub * (0.6 + 0.4 * hubFocus)}>
          <circle cx={HUB.x} cy={HUB.y} r={HUB.r} fill={COLORS.greenSoft} stroke={COLORS.green} strokeWidth={hubFocus > 0.5 ? 5 : 3} />
          {[-46, 0, 46].map((dx, i) => (
            <circle key={i} cx={HUB.x + dx} cy={HUB.y - 70 + (i === 1 ? -8 : 0)} r={16} fill={COLORS.green} stroke={COLORS.surface} strokeWidth={3} />
          ))}
          <SvgText x={HUB.x} y={HUB.y + 4} size={50} weight={700}>
            ホルモン
          </SvgText>
          <SvgText x={HUB.x} y={HUB.y + 64} size={30} weight={700} color={COLORS.greenDeep}>
            情報を伝える物質
          </SvgText>
        </g>
        {/* 分泌 → ホルモン */}
        <Arrow from={[LEFT_X + PANEL.w + 14, HUB.y]} to={[HUB.x - HUB.r - 14, HUB.y]} p={srcArrow} color={COLORS.gold} width={6} />
        <SvgText x={(LEFT_X + PANEL.w + HUB.x - HUB.r) / 2} y={HUB.y - 40} size={30} weight={700} color={COLORS.gold} opacity={srcArrow}>
          分泌
        </SvgText>
        {/* ホルモン → 働き */}
        <Arrow from={[HUB.x + HUB.r + 14, HUB.y]} to={[RIGHT_X - 14, HUB.y]} p={rolesArrow} color={COLORS.green} width={6} />
        <SvgText x={(HUB.x + HUB.r + RIGHT_X) / 2} y={HUB.y - 40} size={30} weight={700} color={COLORS.green} opacity={rolesArrow}>
          調整
        </SvgText>
      </svg>

      <Panel x={LEFT_X} title="分泌するところ（例）" items={SOURCES} tone="gold" appear={src} focus={srcFocus} marker="gland" />
      <Panel x={RIGHT_X} title="調整する働き（例）" items={ROLES} tone="green" appear={roles} focus={rolesFocus} marker="dot" />
    </div>
  );
};

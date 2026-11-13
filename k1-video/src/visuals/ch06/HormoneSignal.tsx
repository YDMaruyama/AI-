import React from 'react';
import {interpolate} from 'remotion';
import {fadeUp, useReveal} from '../../components/scene-context';
import {Arrow, CornerTag, NoteStrip, SvgPill, SvgText} from '../../components/ui';
import {COLORS} from '../../theme';

/**
 * ホルモンの情報伝達と、内分泌かく乱が起こり得る段階の模式図。
 * 形で区別する：● ホルモン ／ ⬡ ホルモンに似た働きの物質 ／ ■ 働きを妨げる物質 ／ ◆ 合成・運搬・分解に作用する物質
 *
 * mode:
 *  - normal    通常の情報伝達（作る→運ぶ→受け取る→細胞の反応）
 *  - overview  かく乱が起こり得る 4 つの段階の位置（1〜4 を順に）
 *  - mimic     受容体を動かす
 *  - block     受容体の働きを妨げる
 *  - synth     ホルモンを作る過程を変える
 *  - transport 運搬や分解を変える
 * steps.act でその場面の動き、steps.note で補足を表示する。
 */
export type HormoneMode = 'normal' | 'overview' | 'mimic' | 'block' | 'synth' | 'transport';

const GL = {cx: 250, cy: 300, rx: 150, ry: 170};
const VES = {x0: 400, x1: 1130, y: 300, h: 100};
const CELL = {x: 1160, y: 110, w: 540, h: 380};
const REC = {x: 1160, y: 300};
const NUC = {x: 1470, y: 300, r: 62};
const HORMONE_R = 18;

const Hormone: React.FC<{x: number; y: number; opacity?: number}> = ({x, y, opacity = 1}) => (
  <circle cx={x} cy={y} r={HORMONE_R} fill={COLORS.green} stroke={COLORS.surface} strokeWidth={3} opacity={opacity} />
);
const Mimic: React.FC<{x: number; y: number; opacity?: number}> = ({x, y, opacity = 1}) => {
  const r = 20;
  const pts = Array.from({length: 6}, (_, i) => {
    const a = (Math.PI / 3) * i;
    return `${x + r * Math.cos(a)},${y + r * Math.sin(a)}`;
  }).join(' ');
  return <polygon points={pts} fill={COLORS.gold} stroke={COLORS.surface} strokeWidth={3} opacity={opacity} />;
};
const Blocker: React.FC<{x: number; y: number; opacity?: number}> = ({x, y, opacity = 1}) => (
  <rect x={x - 19} y={y - 19} width={38} height={38} rx={4} fill={COLORS.slate} stroke={COLORS.surface} strokeWidth={3} opacity={opacity} />
);
const Diamond: React.FC<{x: number; y: number; opacity?: number}> = ({x, y, opacity = 1}) => (
  <polygon points={`${x},${y - 20} ${x + 20},${y} ${x},${y + 20} ${x - 20},${y}`} fill={COLORS.slate} stroke={COLORS.surface} strokeWidth={3} opacity={opacity} />
);

/** 受容体（細胞膜のくぼみ） */
const Receptor: React.FC<{glow: number}> = ({glow}) => (
  <g>
    <path
      d={`M${REC.x} ${REC.y - 46} h-26 v22 h-16 a24 24 0 0 0 0 48 h16 v22 h26`}
      fill={COLORS.surface}
      stroke={glow > 0.5 ? COLORS.green : COLORS.inkSoft}
      strokeWidth={5}
      strokeLinejoin="round"
    />
  </g>
);

/** 細胞の反応（静的な弧。点滅はしない） */
const Response: React.FC<{level: number; appear: number; changed?: boolean}> = ({level, appear, changed}) => (
  <g opacity={appear}>
    {[0, 1, 2].map((i) => (
      <path
        key={i}
        d={`M${NUC.x + NUC.r + 18 + i * 26} ${NUC.y - 50 - i * 10} a ${70 + i * 26} ${70 + i * 26} 0 0 1 0 ${100 + i * 20}`}
        fill="none"
        stroke={changed ? COLORS.gold : COLORS.green}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={changed ? '10 9' : undefined}
        opacity={i < level ? 1 : 0.15}
      />
    ))}
  </g>
);

const Marker: React.FC<{n: number; x: number; y: number; label: string; appear: number; focus: number; anchor?: 'start' | 'end' | 'middle'; lx?: number; ly?: number}> = ({
  n,
  x,
  y,
  label,
  appear,
  focus,
  anchor = 'middle',
  lx,
  ly,
}) => (
  <g opacity={appear * (0.45 + 0.55 * focus)}>
    <circle cx={x} cy={y} r={30} fill={focus > 0.5 ? COLORS.gold : COLORS.surface} stroke={COLORS.gold} strokeWidth={4} />
    <SvgText x={x} y={y + 1} size={32} weight={700} color={focus > 0.5 ? COLORS.surface : COLORS.gold}>
      {n}
    </SvgText>
    <SvgText x={lx ?? x} y={ly ?? y + 58} size={30} weight={700} anchor={anchor}>
      {label}
    </SvgText>
  </g>
);

export const HormoneSignal: React.FC<{
  mode?: HormoneMode;
  steps?: {act?: number; note?: number; markers?: number[]};
  note?: string;
  noteLabel?: string;
  /** 鍵と鍵穴の比喩であることを示すタグ */
  showMetaphor?: boolean;
  metaphorStep?: number;
}> = ({mode = 'normal', steps = {}, note, noteLabel = '補足', showMetaphor = false, metaphorStep = 2}) => {
  const actStep = steps.act ?? 1;
  const base = useReveal(0, {duration: 0.8});
  const act = useReveal(actStep, {duration: 2.0});
  const actLabel = useReveal(actStep, {delay: 1.6});
  const noteP = useReveal(steps.note ?? 99);
  const metaphor = useReveal(metaphorStep);
  const markerSteps = steps.markers ?? [1, 2, 3, 4];
  const m1 = useReveal(markerSteps[0]);
  const m2 = useReveal(markerSteps[1]);
  const m3 = useReveal(markerSteps[2]);
  const m4 = useReveal(markerSteps[3]);
  // overview の強調：最後に現れたマーカーを強調
  const markerFocus = (p: number, next: number) => (p > 0.5 && next < 0.5 ? 1 : 0);

  // ホルモンが作られて受容体へ届くまでの動き
  const travel = (p: number, from = GL.cx + 60, to = REC.x - 34) => from + (to - from) * p;
  const hormoneX = travel(interpolate(act, [0, 0.85], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));

  const isNormalBound = mode === 'normal' && act > 0.85;
  const responseLevel = mode === 'normal' ? 3 : mode === 'mimic' ? 3 : mode === 'block' ? 1 : mode === 'synth' ? 3 : mode === 'transport' ? 3 : 3;
  const responseAppear =
    mode === 'normal' ? interpolate(act, [0.85, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) :
    mode === 'mimic' ? interpolate(act, [0.85, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) :
    mode === 'block' ? interpolate(act, [0.85, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) :
    mode === 'overview' ? base * 0.9 : base * 0.9;

  const actText: Record<HormoneMode, string> = {
    normal: '',
    overview: '',
    mimic: '本来とは異なるタイミング・強さの信号',
    block: 'ホルモンがあっても、伝わる信号が変わる',
    synth: '作られる量が変わる',
    transport: '作用する場所や時間が変わる',
  };

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <svg width={1760} height={580} viewBox="0 0 1760 580" style={{position: 'absolute', left: 0, top: 0}}>
        <g opacity={base}>
          {/* 作る組織 */}
          <ellipse cx={GL.cx} cy={GL.cy} rx={GL.rx} ry={GL.ry} fill={COLORS.goldSoft} stroke={COLORS.gold} strokeWidth={4} />
          <SvgText x={GL.cx} y={70} size={32} weight={700}>ホルモンを作る組織</SvgText>
          <rect x={GL.cx - 70} y={GL.cy - 40} width={140} height={80} rx={14} fill={COLORS.surface} stroke={COLORS.gold} strokeWidth={3} />
          <SvgText x={GL.cx} y={GL.cy + 1} size={30} weight={700} color={COLORS.gold}>合成</SvgText>
          {/* 血液 */}
          <rect x={VES.x0} y={VES.y - VES.h / 2} width={VES.x1 - VES.x0} height={VES.h} rx={VES.h / 2} fill="#EFD6D2" stroke="#C49690" strokeWidth={4} />
          <SvgText x={(VES.x0 + VES.x1) / 2} y={VES.y + VES.h / 2 + 38} size={30} weight={500} color={COLORS.inkSoft}>血液で運ばれる</SvgText>
          {/* 運ぶたんぱく質（模式） */}
          {[620, 880].map((x) => (
            <rect key={x} x={x - 34} y={VES.y - 20} width={68} height={40} rx={20} fill="none" stroke="#B9817A" strokeWidth={3.5} strokeDasharray="6 5" />
          ))}
          {/* 受け取る細胞 */}
          <rect x={CELL.x} y={CELL.y} width={CELL.w} height={CELL.h} rx={70} fill={COLORS.greenSoft} stroke={COLORS.green} strokeWidth={4} />
          <SvgText x={CELL.x + CELL.w / 2} y={70} size={32} weight={700}>受け取る細胞</SvgText>
          <circle cx={NUC.x} cy={NUC.y} r={NUC.r} fill={COLORS.surface} stroke={COLORS.green} strokeWidth={4} />
          <SvgText x={NUC.x} y={NUC.y + 1} size={28} weight={700} color={COLORS.green}>反応</SvgText>
          <Receptor glow={isNormalBound ? 1 : 0} />
          <SvgText x={REC.x + 22} y={REC.y - 62} size={28} weight={700} color={COLORS.inkSoft} anchor="start">受容体</SvgText>
          {/* 受容体から核への信号 */}
          <Arrow from={[REC.x + 10, REC.y]} to={[NUC.x - NUC.r - 12, NUC.y]} p={responseAppear} color={mode === 'mimic' ? COLORS.gold : COLORS.green} width={5} dashed={mode === 'block'} />
          <Response level={responseLevel} appear={responseAppear} changed={mode === 'mimic' || mode === 'block'} />
        </g>

        {/* --- 場面ごとの動き --- */}
        {mode === 'normal' ? <Hormone x={hormoneX} y={VES.y} opacity={act > 0 ? 1 : 0} /> : null}

        {mode === 'mimic' ? (
          <>
            <Mimic
              x={interpolate(act, [0, 0.35, 0.85], [760, 760, REC.x - 34], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}
              y={interpolate(act, [0, 0.35], [140, VES.y], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}
              opacity={act > 0 ? 1 : 0}
            />
            <SvgText x={760} y={110} size={28} weight={700} color={COLORS.gold} opacity={act > 0 ? Math.min(1, act * 4) : 0}>
              ホルモンに似た働きの物質
            </SvgText>
          </>
        ) : null}

        {mode === 'block' ? (
          <>
            <Blocker
              x={interpolate(act, [0, 0.4], [REC.x - 160, REC.x - 34], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}
              y={interpolate(act, [0, 0.4], [150, REC.y], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}
              opacity={act > 0 ? 1 : 0}
            />
            <Hormone x={interpolate(act, [0.3, 0.85], [GL.cx + 60, REC.x - 92], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} y={VES.y} opacity={act > 0.3 ? 1 : 0} />
            <SvgText x={REC.x - 160} y={118} size={28} weight={700} color={COLORS.slate} opacity={act > 0 ? Math.min(1, act * 4) : 0}>
              働きを妨げる物質
            </SvgText>
          </>
        ) : null}

        {mode === 'synth' ? (
          <>
            <Diamond x={GL.cx + 70} y={interpolate(act, [0, 0.35], [60, GL.cy - 40], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} opacity={act > 0 ? 1 : 0} />
            {/* 作られる量の変化：通常の位置に薄い丸、実際に出てくる丸は少ない */}
            {[0, 1, 2].map((i) => (
              <circle key={i} cx={470 + i * 70} cy={VES.y} r={HORMONE_R} fill="none" stroke={COLORS.green} strokeWidth={3} strokeDasharray="5 5" opacity={act > 0.4 ? 0.7 : 0} />
            ))}
            <Hormone x={interpolate(act, [0.4, 0.9], [GL.cx + 60, 470], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} y={VES.y} opacity={act > 0.4 ? 1 : 0} />
          </>
        ) : null}

        {mode === 'transport' ? (
          <>
            <Diamond x={interpolate(act, [0, 0.4], [880, 880], {})} y={interpolate(act, [0, 0.4], [150, VES.y - 44], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} opacity={act > 0 ? 1 : 0} />
            <Hormone x={interpolate(act, [0.3, 0.9], [GL.cx + 60, 700], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} y={VES.y} opacity={act > 0.3 ? 1 : 0} />
            <Hormone x={820} y={VES.y} opacity={act > 0.5 ? 0.45 : 0} />
            <path d="M800 280 l40 40 M840 280 l-40 40" stroke={COLORS.slate} strokeWidth={5} strokeLinecap="round" opacity={act > 0.6 ? 1 : 0} />
          </>
        ) : null}

        {/* 起こり得る段階（overview）：図の上には番号だけを置き、名前は下の一覧に出す */}
        {mode === 'overview' ? (
          <>
            <Marker n={1} x={REC.x - 34} y={REC.y - 96} label="" appear={m1} focus={markerFocus(m1, m2)} />
            <Marker n={2} x={REC.x - 34} y={REC.y + 96} label="" appear={m2} focus={markerFocus(m2, m3)} />
            <Marker n={3} x={GL.cx} y={GL.cy - 96} label="" appear={m3} focus={markerFocus(m3, m4)} />
            <Marker n={4} x={765} y={VES.y - 96} label="" appear={m4} focus={m4 > 0.5 ? 1 : 0} />
          </>
        ) : null}

        {/* 動きの説明ラベル */}
        {actText[mode] ? (
          <SvgPill x={1430} y={528} text={actText[mode]} size={28} fill={COLORS.surface} color={COLORS.ink} stroke={COLORS.gold} opacity={actLabel} />
        ) : null}
      </svg>

      {/* 形の凡例（色だけで区別しない） */}
      <div style={{...fadeUp(base), position: 'absolute', left: 0, top: 0, display: 'flex', gap: 22, fontSize: 26, color: COLORS.inkSoft, fontWeight: 500}}>
        <span>● ホルモン</span>
        {mode === 'mimic' ? <span>⬡ 似た働きの物質</span> : null}
        {mode === 'block' ? <span>■ 妨げる物質</span> : null}
        {mode === 'synth' || mode === 'transport' ? <span>◆ 作用する物質</span> : null}
      </div>
      <div style={{position: 'absolute', right: 0, top: 0}}>
        <CornerTag appear={base}>模式図</CornerTag>
      </div>
      {showMetaphor ? (
        <div style={{...fadeUp(metaphor), position: 'absolute', left: 0, right: 0, top: 590, display: 'flex', justifyContent: 'center'}}>
          <CornerTag style={{whiteSpace: 'nowrap', fontSize: 30}}>「鍵と鍵穴」はたとえ。実際の体内では、受容体の種類や数、他の信号も関わる</CornerTag>
        </div>
      ) : null}
      {mode === 'overview' ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: 588, display: 'flex', justifyContent: 'center', gap: 26}}>
          {[
            {n: 1, t: '受容体を動かす', p: m1, f: markerFocus(m1, m2)},
            {n: 2, t: '働きを妨げる', p: m2, f: markerFocus(m2, m3)},
            {n: 3, t: '作る過程を変える', p: m3, f: markerFocus(m3, m4)},
            {n: 4, t: '運搬・分解を変える', p: m4, f: m4 > 0.5 ? 1 : 0},
          ].map((x) => (
            <div
              key={x.n}
              style={{
                ...fadeUp(x.p, 10),
                opacity: x.p * (0.5 + 0.5 * x.f),
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: x.f > 0.5 ? COLORS.goldSoft : COLORS.surface,
                border: `3px solid ${x.f > 0.5 ? COLORS.gold : COLORS.lineSoft}`,
                borderRadius: 14,
                padding: '8px 20px',
              }}
            >
              <span style={{width: 40, height: 40, borderRadius: 20, background: COLORS.gold, color: COLORS.surface, fontSize: 26, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{x.n}</span>
              <span style={{fontSize: 32, fontWeight: 700, color: COLORS.ink, whiteSpace: 'nowrap'}}>{x.t}</span>
            </div>
          ))}
        </div>
      ) : null}
      {note ? (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0}}>
          <NoteStrip appear={noteP} label={noteLabel}>
            {note}
          </NoteStrip>
        </div>
      ) : null}
    </div>
  );
};

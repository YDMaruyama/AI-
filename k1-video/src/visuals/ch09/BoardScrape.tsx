import React from 'react';
import {interpolate} from 'remotion';
import {fadeUp, useFocus, useReveal} from '../../components/scene-context';
import {CornerTag, SvgPill, SvgText} from '../../components/ui';
import {COLORS} from '../../theme';
import {Box, Fragment, IconBadge, seg} from './parts';

/**
 * プラスチックのまな板：包丁による削れ（N6）。模式図（側面）。
 *  1 包丁が表面を削り、細かなプラスチック片（角ばった形）が出る
 *  2 右：ポリエチレン製・ポリプロピレン製のまな板を使った実験で、切る動作による粒子の発生を確認
 *  3 片の一部が食材に付着 → 食事と一緒に取り込む可能性
 */
type Steps = {scrape: number; study: number; attach: number};

const SURF = 390;
/** 削れで出る片：[出た位置, 食材に付着する位置（null は板の上に残る）] */
const FRAGS: {at: [number, number]; to: [number, number] | null; r: number; rot: number}[] = [
  {at: [590, SURF - 24], to: [752, SURF - 66], r: 21, rot: 10},
  {at: [626, SURF - 44], to: [818, SURF - 68], r: 18, rot: -25},
  {at: [654, SURF - 18], to: null, r: 20, rot: 35},
  {at: [606, SURF - 12], to: [884, SURF - 64], r: 17, rot: 60},
  {at: [684, SURF - 34], to: null, r: 17, rot: -50},
];

export const BoardScrape: React.FC<{steps?: Steps}> = ({steps = {scrape: 1, study: 2, attach: 3}}) => {
  const base = useReveal(0, {duration: 0.8});
  const scrape = useReveal(steps.scrape, {duration: 2.6});
  const labels = useReveal(steps.scrape, {delay: 2.0});
  const study = useReveal(steps.study);
  const attach = useReveal(steps.attach, {duration: 1.4});
  const attachLabel = useReveal(steps.attach, {delay: 1.0});
  const leftFocus = useFocus((s) => s !== steps.study);
  const studyFocus = useFocus((s) => s === steps.study || s === 0);

  const down = seg(scrape, 0, 0.35);
  const rub = seg(scrape, 0.35, 0.75);
  const knifeY = interpolate(down, [0, 1], [-110, 0]);
  const knifeX = Math.sin(rub * Math.PI) * -26;
  const groove = seg(scrape, 0.4, 0.75);
  const frags = seg(scrape, 0.5, 1);

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <svg width={1060} height={600} viewBox="0 0 1060 600" style={{position: 'absolute', left: 0, top: 0, opacity: 0.5 + 0.5 * leftFocus}}>
        <g opacity={base}>
          {/* まな板（側面） */}
          <rect x={40} y={SURF} width={980} height={110} rx={10} fill="#E8EEF1" stroke={COLORS.slate} strokeWidth={3} />
          <SvgText x={530} y={SURF + 60} size={30} weight={700} color={COLORS.slate}>
            プラスチックのまな板
          </SvgText>
          {/* 食材 */}
          <rect x={720} y={SURF - 56} width={260} height={56} rx={26} fill="#A9C08F" stroke="#6F8A5A" strokeWidth={3} />
          <SvgText x={850} y={SURF - 27} size={30} weight={700} color="#3F5530">
            食材
          </SvgText>
        </g>

        {/* 削れ跡 */}
        <path
          d={`M${300} ${SURF + 4} l18 7 l16 -6 l18 8 l16 -7 l18 8 l16 -6 l18 7 l16 -6 l18 8 l16 -7 l18 6 l16 -6 l18 7`}
          fill="none"
          stroke={COLORS.slate}
          strokeWidth={3.5}
          strokeLinejoin="round"
          opacity={groove}
        />

        {/* 包丁（側面）：持ち手は左、刃先は右、刃は下 */}
        <g transform={`translate(${knifeX} ${knifeY})`} opacity={scrape > 0 ? 1 : base}>
          <rect x={110} y={SURF - 98} width={170} height={34} rx={11} fill={COLORS.ink} />
          <rect x={272} y={SURF - 106} width={16} height={50} rx={4} fill="#7D8487" />
          <path
            d={`M288 ${SURF - 108} L520 ${SURF - 96} Q560 ${SURF - 88} 578 ${SURF - 62} Q540 ${SURF - 18} 470 ${SURF - 2} L288 ${SURF} Z`}
            fill="#B9BFC2"
            stroke="#7D8487"
            strokeWidth={3}
            strokeLinejoin="round"
          />
        </g>

        {/* プラスチック片 */}
        {FRAGS.map((f, i) => {
          const k = f.to ? attach : 0;
          const x = f.to ? interpolate(k, [0, 1], [f.at[0], f.to[0]]) : f.at[0];
          const y = f.to ? interpolate(k, [0, 1], [f.at[1], f.to[1]]) - Math.sin(k * Math.PI) * 60 : f.at[1];
          const pop = seg(frags, i * 0.12, i * 0.12 + 0.4);
          return <Fragment key={i} x={x} y={y - (1 - pop) * 14} r={f.r} rot={f.rot} opacity={pop} />;
        })}

        {/* ラベル */}
        <SvgPill x={110} y={130} anchor="start" text="包丁が表面を削る" size={30} fill={COLORS.surface} color={COLORS.ink} stroke={COLORS.inkSoft} opacity={labels} />
        <g opacity={labels}>
          <line x1={648} y1={156} x2={654} y2={SURF - 46} stroke={COLORS.slate} strokeWidth={2.5} strokeDasharray="6 5" />
          <SvgPill x={648} y={130} text="細かなプラスチック片" size={30} fill={COLORS.surface} color={COLORS.slate} stroke={COLORS.slate} />
        </g>
        <g opacity={attachLabel}>
          <line x1={880} y1={246} x2={850} y2={SURF - 84} stroke={COLORS.green} strokeWidth={2.5} strokeDasharray="6 5" />
          <SvgPill x={900} y={220} text="食材に付着" size={30} fill={COLORS.green} color={COLORS.surface} />
        </g>
      </svg>

      <div style={{position: 'absolute', left: 0, top: 624}}>
        <CornerTag appear={base}>模式図</CornerTag>
      </div>

      {/* 実験 */}
      <Box appear={study} focus={studyFocus} tone="slate" topBar style={{left: 1090, top: 20, width: 670, height: 390, padding: '26px 32px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
          <IconBadge name="flask" tone="slate" size={72} />
          <div style={{fontSize: 36, fontWeight: 700, color: COLORS.ink}}>実験で確認されたこと</div>
        </div>
        <div style={{fontSize: 32, fontWeight: 500, color: COLORS.inkSoft, lineHeight: 1.5, marginTop: 22}}>
          ポリエチレン製・ポリプロピレン製の
          <br />
          まな板を使った実験で
        </div>
        <div style={{fontSize: 38, fontWeight: 700, color: COLORS.ink, lineHeight: 1.45, marginTop: 14}}>切る動作による粒子の発生</div>
      </Box>

      {/* 付着 → 取り込む可能性 */}
      <Box
        appear={attach}
        focus={attach > 0 ? 1 : 0}
        tone="green"
        style={{left: 1090, top: 436, width: 670, height: 200, padding: '22px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8}}
      >
        <div style={{...fadeUp(attach), fontSize: 32, fontWeight: 500, color: COLORS.inkSoft}}>食材に付着すると</div>
        <div style={{fontSize: 38, fontWeight: 700, color: COLORS.ink, lineHeight: 1.4}}>
          <span style={{color: COLORS.green}}>↓</span> 食事と一緒に取り込む可能性
        </div>
      </Box>
    </div>
  );
};

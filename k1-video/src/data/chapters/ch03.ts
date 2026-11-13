import {toReading} from '../readings';
import type {Chapter} from '../types';

/**
 * 第3章 なぜ曝露への対策が必要か／暮らしの中での毒（原文 D, E, F）
 * 「物質・量・時間・使い方・本人の条件」を順に強調し、食事・呼吸・皮膚の三経路を別々のレーンで示す。
 * 皮膚は表面への接触と、条件付きの体内移行を区別する（先行試作の SkinBoundary を使用）。
 */
/**
 * 仮音声（TTS）用の読みの補い。共有の読み方辞書（readings.ts）に未登録の語だけを章内で置換する。
 * 身体＝からだ（Open JTalk は「しんたい」と読むため）。
 */
const LOCAL_READINGS: [string, string][] = [['身体', 'からだ']];
const withLocalReadings = (ch: Chapter): Chapter => ({
  ...ch,
  scenes: ch.scenes.map((sc) => ({
    ...sc,
    lines: sc.lines.map((l) =>
      l.reading || !LOCAL_READINGS.some(([term]) => l.text.includes(term))
        ? l
        : {...l, reading: toReading(LOCAL_READINGS.reduce((t, [a, b]) => t.split(a).join(b), l.text))},
    ),
  })),
});

export const ch03: Chapter = withLocalReadings({
  id: 'ch03',
  number: 3,
  title: 'なぜ曝露への対策が必要か／暮らしの中での毒',
  slug: 'Ch03',
  scenes: [
    {
      id: 'c03-s01',
      title: '章扉',
      layout: 'full',
      visual: 'ChapterTitle',
      props: {number: 3, title: 'なぜ曝露への対策が必要か', subtitle: '暮らしの中での毒'},
      lines: [
        {
          text: '第3章では、なぜ曝露への対策が必要なのか、そして、暮らしの中のどこで物質と接しているのかを見ていきます。',
          src: ['D', 'E'],
        },
      ],
      board: '章番号と章題（「なぜ曝露への対策が必要か」、副題「暮らしの中での毒」）。金の罫線が伸びる。',
    },
    {
      id: 'c03-s02',
      title: '影響を左右すること',
      heading: '影響は、接し方と本人の条件によって異なる',
      visual: 'ch03/ExposureFactors',
      props: {
        lead: {
          items: [
            {icon: 'food', text: '食事', delay: 1.2},
            {icon: 'lungs', text: '呼吸', delay: 1.8},
            {icon: 'hand', text: '肌に触れるもの', delay: 2.4},
          ],
          result: '毎日さまざまな物質と接する',
          resultDelay: 3.8,
          extra: '多くは暮らしに役立つもの',
          extraStep: 1,
        },
        chipsLabel: '影響に関わること',
        chips: [
          {title: '物質', sub: 'どの物質か', icon: 'flask', step: 2},
          {title: '量', sub: '接する量', icon: 'scale', step: 3},
          {title: '時間', sub: '接する時間', icon: 'clock', step: 4},
          {title: '使い方', sub: 'どう使うか', icon: 'hand', step: 5},
          {title: '本人の条件', sub: '年齢・体調\n体質・生活環境', icon: 'person', step: 7, divider: true},
        ],
        groups: {'6': [0, 1, 2, 3]},
        leadCenterUntil: 2,
      },
      lines: [
        {text: '私たちの身体は、食事や呼吸、肌に触れるものを通じて、毎日さまざまな物質と接しています。', src: ['D1'], step: 0},
        {text: 'その多くは、暮らしに役立つものです。', src: ['D1'], step: 1},
        {
          text: 'ただ、中には、接する量や時間、使い方によって、健康に影響を及ぼすものもあります。',
          src: ['D1'],
          step: 2,
          substeps: [
            {at: 0.22, step: 3},
            {at: 0.29, step: 4},
            {at: 0.38, step: 5},
            {at: 0.6, step: 6},
          ],
        },
        {
          text: 'また、同じものに接していても、年齢や体調、体質、生活環境によって、影響の受け方は異なります。',
          src: ['D1'],
          step: 7,
          captions: [['また、同じものに接していても', '年齢や体調、体質、生活環境によって'], ['影響の受け方は異なります']],
        },
      ],
      board:
        '上段：食事・呼吸・肌に触れるもの → 毎日さまざまな物質と接する（「多くは暮らしに役立つもの」を追加表示）。チップが出るまでは上段を図解領域の中ほどに置き、チップが出るときに上へ穏やかに移す。下段：「物質・量・時間・使い方・本人の条件」のチップが音声に合わせて一つずつ現れ、話しているチップだけ緑で強調。「本人の条件」の前は点線で区切り、年齢・体調・体質・生活環境を添える。',
    },
    {
      id: 'c03-s03',
      title: '知って見直す',
      heading: '漠然と怖がるのではなく、知って見直す',
      visual: 'ch03/KnowReview',
      props: {steps: {know: 1, review: 2}},
      lines: [
        {
          text: 'そこで大切になるのが、身の回りのものを漠然と怖がるのではなく、何に、どのように、どれくらい接しているかを知ることです。',
          src: ['D2'],
          step: 0,
          substeps: [{at: 0.5, step: 1}],
        },
        {text: 'そのうえで、自分に関係するものについて、接する機会や使い方を見直していきます。', src: ['D2'], step: 2},
      ],
      board:
        '上段に「身の回りのものを〔漠然と怖がる〕のではなく」（点線の控えめなラベル。赤や×は使わない）。左の緑のパネル「知る」に、何に・どのように・どれくらい（接しているかを知る）が順に現れる。金の矢印「そのうえで」→ 右の金のパネル「見直す」：自分に関係するものについて、接する機会・使い方。',
    },
    {
      id: 'c03-s04',
      title: '身近な対策の例',
      heading: '避けられるリスクを減らす、身近な対策',
      visual: 'ch03/IconCards',
      props: {
        items: [
          {text: '自分に関係する\nアレルゲンを確認', icon: 'label'},
          {text: '食品を\n適切に保存', icon: 'can'},
          {text: '製品の\n使用方法を守る', icon: 'book'},
          {text: '必要に応じて\n換気', icon: 'window'},
        ],
        allStep: 4,
        note: '暮らしに必要なものを上手に使いながら、避けられるリスクを減らす',
        noteStep: 4,
        noteLabel: 'ねらい',
      },
      lines: [
        {text: 'たとえば、自分に関係するアレルゲンを確認すること。', src: ['D3'], step: 0},
        {text: '食品を適切に保存すること。', src: ['D3'], step: 1},
        {text: '製品の使用方法を守ること。', src: ['D3'], step: 2},
        {text: 'そして、必要に応じて換気すること。', src: ['D3'], step: 3},
        {text: 'こうした行動は、暮らしに必要なものを上手に使いながら、避けられるリスクを減らすための対策です。', src: ['D3'], step: 4},
      ],
      board: 'アイコン付きの4枚のカード（自分に関係するアレルゲンを確認／食品を適切に保存／製品の使用方法を守る／必要に応じて換気）が音声に合わせて順に現れ、話しているカードを強調。最後に全カードを強調し、下に「ねらい」の帯。',
    },
    {
      id: 'c03-s05',
      title: '避ける・防ぐにつながる実践',
      heading: '曝露への対策：特に「避ける・防ぐ」につながる実践',
      visual: 'ch03/AvoidPrevent',
      props: {steps: {focus: 1, next: 2}},
      lines: [
        {
          text: '排毒学校では、曝露への対策を、「避ける・防ぐ・排出する」のうち、特に、避ける・防ぐにつながる実践として考えます。',
          src: ['D4'],
          step: 0,
          substeps: [{at: 0.55, step: 1}],
        },
        {
          text: 'まずは、日々の暮らしのどこに物質との接点があるのかを見ていきましょう。',
          src: ['D4'],
          step: 2,
          captions: [['まずは、日々の暮らしのどこに', '物質との接点があるのかを見ていきましょう']],
        },
      ],
      board:
        '「避ける」「防ぐ」「排出する」の3枚のカード（矢印で結ばない）。「避ける・防ぐ」の上に括弧と「曝露への対策：特に、この二つにつながる実践」。「排出する」は消さずに控えめな濃さで残す。最後に下段「まずは：日々の暮らしのどこに、物質との接点があるか」。',
    },
    {
      id: 'c03-s06',
      title: '曝露とは',
      heading: '物質に接することを「曝露」という',
      visual: 'ch03/ExposureWord',
      props: {steps: {define: 1}},
      lines: [
        {
          text: '私たちは暮らしの中で、食べ物や空気、肌に触れる製品などを通じて、さまざまな物質に接しています。',
          src: ['E', 'E1'],
          step: 0,
          captions: [['私たちは暮らしの中で', '食べ物や空気、肌に触れる製品などを通じて'], ['さまざまな物質に接しています']],
        },
        {text: 'このように、物質に接することを、「曝露」といいます。', src: ['E1'], step: 1},
      ],
      board:
        '左に「食べ物」「空気」「肌に触れる製品」が順に現れ、金の矢印が右のカード「さまざまな物質に接している」へ集まる。次の段階でカードの下段に読み「ばくろ」付きの大きな「曝露」と「＝ 物質に接すること」。',
    },
    {
      id: 'c03-s07',
      title: '身近な接点で見ること',
      heading: '身近な接点から考える：由来に加えて見ること',
      visual: 'ch03/ExposureFactors',
      props: {
        lead: {
          items: [
            {icon: 'container', text: '容器の使い方', delay: 0.3},
            {icon: 'face', text: '洗顔の手順', delay: 1.4},
            {icon: 'window', text: '換気', delay: 2.4},
            {icon: 'can', text: '食品の保存', delay: 3.0},
          ],
          result: '身近な接点から考える',
          resultDelay: 4.2,
        },
        origin: {title: '由来', sub: '天然か合成か', icon: 'info', step: 1, joiner: '加えて'},
        chips: [
          {title: '成分の性質', icon: 'flask', step: 2},
          {title: '量', icon: 'scale', step: 3},
          {title: '製品の使い方', icon: 'hand', step: 4},
          {title: '本人の条件', icon: 'person', step: 5},
        ],
        allStep: 6,
        chipHeight: 290,
        chipTitleSize: 42,
        leadCenterUntil: 1,
      },
      lines: [
        {text: '容器の使い方、洗顔の手順、換気、食品の保存など、身近な接点から考えます。', src: ['E2'], step: 0},
        {
          text: '天然か合成かという由来の情報に加えて、成分の性質、量、製品の使い方、本人の条件を見ます。',
          src: ['E2'],
          step: 1,
          substeps: [
            {at: 0.42, step: 2},
            {at: 0.55, step: 3},
            {at: 0.62, step: 4},
            {at: 0.76, step: 5},
            {at: 0.97, step: 6},
          ],
        },
      ],
      board:
        '上段：容器の使い方・洗顔の手順・換気・食品の保存 → 身近な接点から考える（チップが出るまでは図解領域の中ほどに置き、チップが出るときに上へ移す）。下段：点線の「由来（天然か合成か）」のチップ、「＋ 加えて」、続いて「成分の性質・量・製品の使い方・本人の条件」が音声に合わせて一つずつ強調され、最後に全体を強調。',
    },
    {
      id: 'c03-s08',
      title: '経路：食事',
      heading: '三つの経路を分けて見る：まず食事',
      visual: 'ch03/RouteLanes',
      props: {active: 'food', intro: true, steps: {flow: 1, part: 2, factors: 3}},
      lines: [
        {text: 'ここからは、身体と物質が接する経路を、食事、呼吸、皮膚に分けて見ていきます。', src: ['F'], step: 0},
        {
          text: 'まず食事では、口から入ったものが消化管に入り、含まれる物質の一部が吸収されます。',
          src: ['F1'],
          step: 1,
          substeps: [{at: 0.66, step: 2}],
        },
        {text: '何を、どのくらい食べたか、そして、どの物質を考えているかが大切です。', src: ['F1'], step: 3},
      ],
      board:
        '食事・呼吸・皮膚の3本のレーンを上下に分けて並べる（一本の流れにしない）。見出しが順に現れたあと、食事のレーンだけ強調：口から入る → 消化管へ ⇢（点線）一部が吸収。右に「大切なこと：何を／どのくらい食べたか／どの物質か」。',
    },
    {
      id: 'c03-s09',
      title: '経路：呼吸',
      heading: '呼吸：吸い込んだ物質は気道や肺へ',
      visual: 'ch03/RouteLanes',
      props: {active: 'air', done: ['food'], steps: {flow: 1, factors: 2}},
      lines: [
        {text: '次に呼吸では、吸い込んだ物質が気道や肺に届きます。', src: ['F2'], step: 1},
        {text: '物質の形や空気中の濃度、吸い込む時間、環境によって、接し方は異なります。', src: ['F2'], step: 2},
      ],
      board:
        '同じ3本のレーン。食事のレーンは完成状態のまま控えめに残し、呼吸のレーンを強調：吸い込む → 気道や肺に届く。右に「接し方に関わること：物質の形／空気中の濃度／吸い込む時間／環境」。',
    },
    {
      id: 'c03-s10',
      title: '皮膚：接触と移行',
      heading: '皮膚：触れることと、体内へ移ること',
      visual: 'ch03/SkinBoundary',
      // 「表面に付いた≠吸収された」（G1）は第4章の冒頭（c04-s02）で扱うため、ここでは区別帯を出さない
      props: {steps: {contact: 1, transfer: 2, conditions: 3, distinct: 99}},
      lines: [
        {text: 'そして皮膚では、まず物質が皮膚の表面に触れます。', src: ['F3'], step: 1},
        {text: '物質や皮膚の状態などによっては、その一部が皮膚の中や血液へ移行する場合があります。', src: ['F3'], step: 2},
        {text: '触れる部位、製品の量、接触時間などを考えます。', src: ['F3'], step: 3},
      ],
      board:
        '皮膚の断面の模式図（表面・皮膚の中・血液）。物質（金の丸）が表面に付く（接触）→一部だけが点線の経路で中へ移る（条件によっては一部）→右に「考えたい条件の例」（物質の性質・皮膚の状態・触れる部位・製品の量・接触時間）。「付いた≠吸収された」は次章冒頭で扱う。',
      tail: 1.6,
    },
  ],
});

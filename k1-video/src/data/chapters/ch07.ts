import type {Chapter} from '../types';

/**
 * 第7章 BPA・フタル酸エステル・PFAS（原文 L「代表的な物質を個別に知る」L1〜L9）
 *
 * 三つの物質を共通レイアウト ch07/SubstanceProfile で示す。四つの行は常に同じ：
 *   用途 ／ 接点（曝露源） ／ 研究される作用 ／ 区別すべき点
 * 各物質 3 シーン（用途と接点 → 研究される作用 → 区別すべき点）。
 * 章の始めに枠組み（ch07/ProfileGrid の map）、終わりに要約の比較表（filled）。
 *
 * 混同させない組み合わせ：BPA と PET（PET≠ポリカーボネート）、DEP と DEHP、
 * PET（テレフタレート）とフタル酸系可塑剤、フライパンの樹脂（PTFE）と PFOA・PFOS。
 * PFAS は「多くの物質の総称」として形の異なる記号の集まりで示し、一つの危険度（メーター）では表さない。
 */

const ID = {
  bpa: {name: 'BPA', reading: 'ビスフェノールA', kind: '物質', cluster: 'single', tone: 'green'},
  pht: {name: 'フタル酸\nエステル', nameSize: 54, kind: '物質群', cluster: 'group', tone: 'gold'},
  pfas: {name: 'PFAS', reading: '有機フッ素化合物の一群', readingSize: 28, kind: '多くの物質の総称', cluster: 'many', tone: 'slate'},
} as const;

/** 前のシーンで扱った行の 1 行要約 */
const SUM = {
  bpa: {
    use: 'ポリカーボネート樹脂・エポキシ樹脂の製造',
    contact: '一部の食品容器・缶の内面塗装など（製品・国・時期で異なる）',
    effect: 'エストロゲン受容体などへの作用（実験）・影響の評価',
  },
  pht: {
    use: '主に樹脂を柔らかくする可塑剤など／香料・化粧品にも',
    contact: '一部の軟質塩化ビニル製品・床材など／食品・ほこりを通じて',
    effect: '胎仔のテストステロン産生など（動物実験）・人での関連研究',
  },
  pfas: {
    use: '撥水・撥油加工、泡消火薬剤、工業用途など',
    contact: '食品・水・ほこりなど／汚染された水源の近くでは飲み水',
    effect: '一部のPFASで指標との関連／作用・危険度は一様ではない',
  },
};

const HIDDEN = {mode: 'hidden'} as const;

export const ch07: Chapter = {
  id: 'ch07',
  number: 7,
  title: 'BPA・フタル酸エステル・PFAS',
  slug: 'Ch07',
  scenes: [
    {
      id: 'c07-s01',
      title: '章扉',
      layout: 'full',
      visual: 'ChapterTitle',
      props: {number: 7, title: 'BPA・フタル酸エステル・PFAS', subtitle: '代表的な物質を個別に知る'},
      lines: [{text: '第7章では、代表的な物質として、BPA、フタル酸エステル、PFASを、一つずつ見ていきます。', src: ['L']}],
      board: '章番号と章題。副題「代表的な物質を個別に知る」。金の罫線が伸びる。',
    },
    {
      id: 'c07-s02',
      title: '三つの物質・四つの観点',
      heading: '三つの物質を、同じ四つの観点で',
      visual: 'ch07/ProfileGrid',
      props: {
        mode: 'map',
        columns: [
          {name: 'BPA', sub: 'ビスフェノールA', tone: 'green'},
          {name: 'フタル酸エステル', sub: '物質群', tone: 'gold'},
          {name: 'PFAS', sub: '有機フッ素化合物の一群', tone: 'slate'},
        ],
        rowSteps: {use: 1, contact: 2, effect: 3, distinct: 4},
      },
      lines: [
        {text: 'ここでは、三つの物質を、同じ四つの観点で整理していきます。', src: ['L'], step: 0},
        {
          text: '何に使われてきたかという用途、どこで接するかという接点、研究されている作用、そして区別すべき点です。',
          src: ['L'],
          step: 1,
          substeps: [
            {at: 0.3, step: 2},
            {at: 0.57, step: 3},
            {at: 0.77, step: 4},
          ],
        },
      ],
      board: '3 列（BPA／フタル酸エステル／PFAS）×4 行（用途・接点・研究される作用・区別すべき点）の空欄の表。音声に合わせて行ラベルと空欄の行を順に強調。危険度の列やメーターは置かない。',
    },

    /* ---------------------------------------------------------------- */
    /* BPA（L1〜L3）                                                     */
    /* ---------------------------------------------------------------- */
    {
      id: 'c07-s03',
      title: 'BPA：用途と接点',
      heading: 'BPA：用途と接点',
      visual: 'ch07/SubstanceProfile',
      props: {
        identity: ID.bpa,
        rows: {
          use: {mode: 'active', items: [{text: 'ポリカーボネート樹脂・エポキシ樹脂の製造に使われてきた', step: 1}]},
          contact: {
            mode: 'active',
            weight: 1.3,
            items: [
              {
                chips: [
                  {text: '一部の食品容器', icon: 'container'},
                  {text: '缶の内面塗装', icon: 'can'},
                ],
                tail: 'など',
                step: 2,
              },
              {type: 'caveat', label: '補足', text: '使用状況は、製品・国・製造時期によって異なる', step: 3},
            ],
          },
          effect: HIDDEN,
          distinct: HIDDEN,
        },
      },
      lines: [
        {text: '一つ目は、BPA、ビスフェノールAです。', src: ['L1'], step: 0},
        {text: 'BPAは、ポリカーボネート樹脂やエポキシ樹脂の製造に使われてきた物質です。', src: ['L1'], step: 1},
        {text: '一部の食品容器や、缶の内面塗装などが、曝露源となり得ます。', src: ['L1'], step: 2},
        {text: '使用状況は、製品や国、製造時期によって異なります。', src: ['L1'], step: 3},
      ],
      board:
        '共通レイアウト。左に「BPA／ビスフェノールA／物質」と一つの六角形の記号（模式図）。右の4行のうち「用途」「接点（曝露源）」を順に表示（容器・缶のアイコン付きチップ）。続けて「補足：使用状況は製品・国・製造時期で異なる」。残り2行は点線の空欄。',
    },
    {
      id: 'c07-s04',
      title: 'BPA：研究される作用',
      heading: 'BPA：研究されている作用と評価',
      visual: 'ch07/SubstanceProfile',
      props: {
        identity: ID.bpa,
        rows: {
          use: {mode: 'summary', text: SUM.bpa.use},
          contact: {mode: 'summary', text: SUM.bpa.contact},
          effect: {
            mode: 'active',
            items: [
              {type: 'badge', badge: 'experiment', text: 'エストロゲン受容体などへの作用を確認', step: 1},
              {type: 'badge', badge: 'assessment', badgeLabel: '評価', text: '生殖・発達・代謝・免疫などへの影響', step: 2},
              {type: 'badge', badge: 'assessment', badgeLabel: '評価', text: '食品からの摂取の評価は、機関によって異なる', step: 3},
              {type: 'badge', badge: 'assessment', badgeLabel: '管理', text: '欧州：免疫系への影響などを重視し、管理を強化', step: 4},
              {type: 'caveat', text: '「缶詰を一度食べると免疫が壊れる」は不正確', step: 5},
            ],
          },
          distinct: HIDDEN,
        },
      },
      lines: [
        {text: '実験では、エストロゲン受容体などへの作用が確認されています。', src: ['L2'], step: 1},
        {text: 'そして、生殖・発達・代謝・免疫などへの影響が評価されています。', src: ['L2'], step: 2},
        {text: '食品からの摂取に対する評価は、機関によって異なります。', src: ['L2'], step: 3},
        {text: '欧州では、免疫系への影響などを重視して、管理が強化されました。', src: ['L2'], step: 4},
        {
          text: 'ただし、これを「缶詰を一度食べると免疫が壊れる」と説明するのは、不正確です。',
          src: ['L2'],
          step: 5,
          captions: [['ただし、これを', '「缶詰を一度食べると免疫が壊れる」と'], ['説明するのは、不正確です']],
        },
      ],
      board:
        '同じレイアウトで「研究される作用」の行を展開。根拠・判断の種類を形とラベルで区別：［実験］フラスコ印、［評価］［管理］盾印（評価機関の判断）。最後に同じ行の中に「ただし」の帯で「缶詰を一度食べると免疫が壊れる」は不正確、と表示。用途・接点は1行要約で残す。',
    },
    {
      id: 'c07-s05',
      title: 'BPA：区別すべき点',
      heading: 'BPA：区別すべき点',
      visual: 'ch07/SubstanceProfile',
      props: {
        identity: ID.bpa,
        rows: {
          use: {mode: 'summary', text: SUM.bpa.use},
          contact: {mode: 'summary', text: SUM.bpa.contact},
          effect: {mode: 'summary', text: SUM.bpa.effect},
          distinct: {
            mode: 'active',
            items: [
              {text: '「BPA不使用」は、BPAについての表示', step: 1},
              {type: 'caveat', label: '保証ではない', text: '他の物質を含まないこと・あらゆる使い方での安全', step: 2},
              {type: 'ne', left: '一般的なPETボトルのPET', right: 'ポリカーボネート', sub: '別の材質。PETの製造にBPAを使うわけではない', subStep: 4, step: 3},
            ],
          },
        },
      },
      lines: [
        {text: '「BPA不使用」は、BPAについての表示です。', src: ['L3'], step: 1},
        {text: '他の物質を含まないことや、あらゆる使い方での安全を保証する表示ではありません。', src: ['L3'], step: 2},
        {text: 'また、一般的なPETボトルのPETと、ポリカーボネートは、別の材質です。', src: ['L3'], step: 3},
        {text: 'PETの製造に、BPAを使うわけではありません。', src: ['L3'], step: 4},
      ],
      board:
        '同じレイアウトで「区別すべき点」の行を展開。①「BPA不使用」＝BPAについての表示 →「保証ではない：他の物質を含まないこと・あらゆる使い方での安全」。②「一般的なPETボトルのPET ≠ ポリカーボネート」と、その下に「別の材質。PETの製造にBPAを使うわけではない」。',
    },

    /* ---------------------------------------------------------------- */
    /* フタル酸エステル（L4〜L6）                                         */
    /* ---------------------------------------------------------------- */
    {
      id: 'c07-s06',
      title: 'フタル酸エステル：用途と接点',
      heading: 'フタル酸エステル：用途と接点',
      visual: 'ch07/SubstanceProfile',
      props: {
        identity: ID.pht,
        rows: {
          use: {
            mode: 'active',
            items: [
              {text: '主に、樹脂を柔らかくする可塑剤など', step: 1},
              {
                text: '物質によっては',
                chips: [
                  {text: '香料', icon: 'fragrance'},
                  {text: '化粧品', icon: 'face'},
                ],
                tail: 'にも使われてきた',
                step: 2,
              },
            ],
          },
          contact: {
            mode: 'active',
            items: [
              {text: '一部の軟質塩化ビニル製品・床材・食品に接触する材料など', step: 3},
              {
                text: '製品から移った成分を、',
                chips: [
                  {text: '食品', icon: 'food'},
                  {text: 'ほこり', icon: 'dust'},
                ],
                tail: 'などを通じて取り込むことがある',
                step: 4,
              },
            ],
          },
          effect: HIDDEN,
          distinct: HIDDEN,
        },
      },
      lines: [
        {text: '二つ目は、フタル酸エステルです。', src: ['L4'], step: 0},
        {text: 'フタル酸エステルは、主に樹脂を柔らかくする可塑剤などに用いられる物質群です。', src: ['L4'], step: 1},
        {text: '物質によっては、香料や化粧品にも使われてきました。', src: ['L4'], step: 2},
        {text: '一部の軟質塩化ビニル製品、床材、食品に接触する材料などが関係します。', src: ['L4'], step: 3},
        {text: '製品から移った成分を、食品やほこりなどを通じて取り込むことがあります。', src: ['L4'], step: 4},
      ],
      board:
        '共通レイアウト。左に「フタル酸エステル／物質群」と、形の異なる4つの記号（DEHP・DBP・BBP・DEP など）の模式図。右の「用途」「接点（曝露源）」を順に表示。香料・化粧品、食品・ほこりはアイコン付きチップ。',
    },
    {
      id: 'c07-s07',
      title: 'フタル酸エステル：研究される作用',
      heading: 'フタル酸エステル：研究されている作用',
      visual: 'ch07/SubstanceProfile',
      props: {
        identity: ID.pht,
        highlight: {members: ['DEHP', 'DBP', 'BBP'], step: 1},
        rows: {
          use: {mode: 'summary', text: SUM.pht.use},
          contact: {mode: 'summary', text: SUM.pht.contact},
          effect: {
            mode: 'active',
            items: [
              {type: 'badge', badge: 'animal', text: 'DEHP・DBP・BBPなど：\n胎仔のテストステロン産生、生殖器の発達への影響', step: 1},
              {type: 'badge', badge: 'assessment', badgeLabel: '規制評価', text: 'こうした動物実験は、規制評価にも使われている', step: 2},
              {type: 'badge', badge: 'human', text: '生殖に関連する指標との関連を調べる研究', step: 3},
              {type: 'caveat', text: '個人の不妊や症状を、特定の製品のせいとは判断できない', step: 4},
            ],
          },
          distinct: HIDDEN,
        },
      },
      lines: [
        {
          text: 'DEHP、DBP、BBPなどでは、動物実験で、胎仔のテストステロン産生や、生殖器の発達への影響が調べられています。',
          src: ['L5'],
          step: 1,
        },
        {text: 'こうした動物実験は、規制評価にも使われています。', src: ['L5'], step: 2},
        {text: '人でも、生殖に関連する指標との関連を調べる研究があります。', src: ['L5'], step: 3},
        {text: 'ただし、個人の不妊や症状を、特定の製品のせいだと判断することはできません。', src: ['L5'], step: 4},
      ],
      board:
        '同じレイアウトで「研究される作用」を展開。左の模式図で DEHP・DBP・BBP を塗りで強調。根拠の種類を形とラベルで区別：［動物実験］□、［規制評価］盾、［人での関連］△。最後に同じ行の中に「ただし：個人の不妊や症状を、特定の製品のせいとは判断できない」。',
    },
    {
      id: 'c07-s08',
      title: 'フタル酸エステル：区別すべき点',
      heading: 'フタル酸エステル：区別すべき点',
      visual: 'ch07/SubstanceProfile',
      props: {
        identity: ID.pht,
        highlight: {members: ['DEP', 'DEHP'], step: 2},
        rows: {
          use: {mode: 'summary', text: SUM.pht.use},
          contact: {mode: 'summary', text: SUM.pht.contact},
          effect: {mode: 'summary', text: SUM.pht.effect},
          distinct: {
            mode: 'active',
            items: [
              {text: '同じ物質群でも、作用は同一ではない', step: 1},
              {type: 'ne', left: 'DEP（香料に使われることがある）', right: 'DEHP', sub: 'DEPについての知見を、DEHPと同じものとして扱わない', step: 2},
              {type: 'ne', left: 'PET（名称に「テレフタレート」）', right: 'フタル酸系可塑剤', sub: '可塑剤が加えられている、という意味ではない', subStep: 4, step: 3},
            ],
          },
        },
      },
      lines: [
        {text: '同じ物質群でも、作用は同一ではありません。', src: ['L6'], step: 1},
        {text: '例えば、香料に使われることがあるDEPについての知見を、DEHPと同じものとして扱わないことが重要です。', src: ['L6'], step: 2},
        {text: 'また、PETの名称には、「テレフタレート」という言葉が含まれています。', src: ['L6'], step: 3},
        {text: 'しかし、これは、軟質樹脂に使うフタル酸系可塑剤が加えられている、という意味ではありません。', src: ['L6'], step: 4},
      ],
      board:
        '同じレイアウトで「区別すべき点」を展開。①同じ物質群でも作用は同一ではない。②「DEP（香料に使われることがある）≠ DEHP」—左の模式図で DEP と DEHP を強調（形が異なる）。③「PET（名称に『テレフタレート』）≠ フタル酸系可塑剤」と「可塑剤が加えられている、という意味ではない」。',
    },

    /* ---------------------------------------------------------------- */
    /* PFAS（L7〜L9）                                                     */
    /* ---------------------------------------------------------------- */
    {
      id: 'c07-s09',
      title: 'PFAS：用途と接点',
      heading: 'PFAS：用途と接点',
      visual: 'ch07/SubstanceProfile',
      props: {
        identity: ID.pfas,
        kindStep: 1,
        highlight: {members: ['PFOA', 'PFOS'], step: 3, callout: '分解されにくさ・\n体内から排出される\nまでの長さが問題に'},
        rows: {
          use: {mode: 'active', weight: 0.8, items: [{text: '撥水・撥油加工、泡消火薬剤、工業用途など', step: 2}]},
          contact: {
            mode: 'active',
            weight: 1.2,
            items: [
              {
                chips: [
                  {text: '食品', icon: 'food'},
                  {text: '水', icon: 'water'},
                  {text: 'ほこり', icon: 'dust'},
                ],
                tail: 'など',
                step: 4,
              },
              {type: 'caveat', label: '補足', text: '汚染された水源の近くでは、飲み水が重要になる場合がある', step: 5},
            ],
          },
          effect: HIDDEN,
          distinct: HIDDEN,
        },
      },
      lines: [
        {text: '三つ目は、PFAS、有機フッ素化合物の一群です。', src: ['L7'], step: 0},
        {text: 'PFASは、性質の異なる多くの物質を含む総称です。', src: ['L7'], step: 1},
        {text: '撥水・撥油加工、泡消火薬剤、工業用途などで使われてきました。', src: ['L7'], step: 2},
        {text: 'なかでもPFOAやPFOSなどは、分解されにくさや、体内から排出されるまでの長さが問題になっています。', src: ['L7'], step: 3},
        {text: '食品や水、ほこりなどが、曝露源となります。', src: ['L7'], step: 4},
        {text: '汚染された水源の近くでは、飲み水が重要になる場合があります。', src: ['L7'], step: 5},
      ],
      board:
        '共通レイアウト。左に「PFAS／有機フッ素化合物の一群」と、形も大きさも異なる多数の記号（模式図）。「多くの物質の総称」のラベルを強調。「用途」を表示後、左の PFOA・PFOS の記号を塗りで強調し「分解されにくさ、体内から排出されるまでの長さ」の注記。続いて「接点（曝露源）」に食品・水・ほこりのチップと「補足：汚染された水源の近くでは飲み水」。一つの危険度メーターでは表さない。',
    },
    {
      id: 'c07-s10',
      title: 'PFAS：研究される作用',
      heading: 'PFAS：研究されている作用',
      visual: 'ch07/SubstanceProfile',
      props: {
        identity: ID.pfas,
        rows: {
          use: {mode: 'summary', text: SUM.pfas.use},
          contact: {mode: 'summary', text: SUM.pfas.contact},
          effect: {
            mode: 'active',
            items: [
              {
                text: '一部のPFASで、関連が調べられている指標',
                chipsBreak: true,
                chips: [{text: '血中脂質'}, {text: '肝機能の指標'}, {text: 'ワクチンへの抗体反応'}, {text: '妊娠・出生に関する指標'}],
                tail: 'など',
                step: 1,
              },
              {type: 'badge', badge: 'assessment', badgeLabel: '評価', text: 'PFOAには、発がん性の評価もある', step: 2},
              {type: 'caveat', text: 'すべてをホルモン作用だけで説明することはできない', step: 3},
              {type: 'caveat', text: 'すべてのPFASが同じ作用や危険度を持つわけではない', step: 4},
            ],
          },
          distinct: HIDDEN,
        },
      },
      lines: [
        {
          text: '一部のPFASでは、血中脂質、肝機能の指標、ワクチンへの抗体反応、妊娠・出生に関する指標などとの関連が調べられています。',
          src: ['L8'],
          step: 1,
        },
        {text: 'PFOAには、発がん性の評価もあります。', src: ['L8'], step: 2},
        {text: 'ただし、これらをすべて、ホルモン作用だけで説明することはできません。', src: ['L8'], step: 3},
        {text: 'また、すべてのPFASが、同じ作用や危険度を持つわけでもありません。', src: ['L8'], step: 4},
      ],
      board:
        '同じレイアウトで「研究される作用」を展開。関連を調べている指標をチップで並べる（血中脂質・肝機能の指標・ワクチンへの抗体反応・妊娠・出生に関する指標）。［評価］盾印で PFOA の発がん性の評価。続けて「ただし」の帯を2つ（ホルモン作用だけで説明できない／すべての PFAS が同じ作用や危険度ではない）。左の模式図は形の異なる多数の記号のまま（一つの危険度で表さない）。',
    },
    {
      id: 'c07-s11',
      title: 'PFAS：区別すべき点',
      heading: 'PFAS：区別すべき点',
      visual: 'ch07/SubstanceProfile',
      props: {
        identity: ID.pfas,
        highlight: {members: ['PFOA', 'PFOS'], step: 3},
        rows: {
          use: {mode: 'summary', text: SUM.pfas.use},
          contact: {mode: 'summary', text: SUM.pfas.contact},
          effect: {mode: 'summary', text: SUM.pfas.effect},
          distinct: {
            mode: 'active',
            items: [
              {type: 'ne', left: '分解されにくい', right: '一度体に入ったら一生出ていかない', sub: '排出の速さは、物質や人によって異なる', subStep: 2, step: 1},
              {type: 'ne', left: 'フライパンの樹脂（PTFE）', right: 'PFOA・PFOS', sub: '現在のフッ素樹脂加工フライパンの樹脂と同一視できない', step: 3},
            ],
          },
        },
      },
      lines: [
        {
          text: '「分解されにくい」と、「一度体に入ったら一生出ていかない」は、同じではありません。',
          src: ['L9'],
          step: 1,
          captions: [['「分解されにくい」と', '「一度体に入ったら一生出ていかない」は'], ['同じではありません']],
        },
        {text: '排出の速さは、物質や人によって異なります。', src: ['L9'], step: 2},
        {text: 'また、現在のフッ素樹脂加工フライパンの樹脂と、PFOA・PFOSを、同一視することはできません。', src: ['L9', 'N9'], step: 3},
      ],
      board:
        '同じレイアウトで「区別すべき点」を展開。①「分解されにくい」≠「一度体に入ったら一生出ていかない」と「排出の速さは物質や人によって異なる」。②「フライパンの樹脂（PTFE）≠ PFOA・PFOS」—左の模式図で PFOA・PFOS を強調。下に「現在のフッ素樹脂加工フライパンの樹脂と同一視できない」。PTFE の表記は原文 N9（表面に使われる PTFE）による。',
    },

    /* ---------------------------------------------------------------- */
    /* 比較表                                                             */
    /* ---------------------------------------------------------------- */
    {
      id: 'c07-s12',
      title: '三つの物質の比較',
      heading: '三つの物質を並べて比べる',
      visual: 'ch07/ProfileGrid',
      props: {
        mode: 'filled',
        rowSteps: {distinct: 1},
        columns: [
          {
            name: 'BPA',
            sub: 'ビスフェノールA',
            tone: 'green',
            cells: {
              use: 'ポリカーボネート樹脂・\nエポキシ樹脂の製造',
              contact: '一部の食品容器・\n缶の内面塗装など',
              effect: 'エストロゲン受容体など\nへの作用・影響の評価',
              distinct: '「BPA不使用」の範囲\nPET ≠ ポリカーボネート',
            },
          },
          {
            name: 'フタル酸エステル',
            sub: '物質群',
            tone: 'gold',
            cells: {
              use: '主に樹脂を柔らかくする\n可塑剤など',
              contact: '一部の軟質塩化ビニル製品\nなど／食品・ほこりを通じて',
              effect: '胎仔のテストステロン産生\nなど（動物実験）',
              distinct: 'DEP ≠ DEHP\nPET ≠ フタル酸系可塑剤',
            },
          },
          {
            name: 'PFAS',
            sub: '有機フッ素化合物の一群',
            tone: 'slate',
            cells: {
              use: '撥水・撥油加工、\n泡消火薬剤、工業用途など',
              contact: '食品・水・ほこりなど\n汚染水源の近くでは飲み水',
              effect: '一部で指標との関連\n作用・危険度は一様でない',
              distinct: '分解されにくい ≠ 一生出ない\nPTFE ≠ PFOA・PFOS',
            },
          },
        ],
      },
      lines: [
        {text: '最後に、三つの物質を、同じ四つの観点で並べてみます。', src: ['L'], step: 0},
        {text: '名前や材質が似ていても、同じものとして扱わず、区別して見ていくことが大切です。', src: ['L3', 'L6', 'L9'], step: 1},
      ],
      board:
        '章の始めと同じ表に、各物質の要約を並べる（3列×4行）。危険度の列やメーターは置かない。2行目で「区別すべき点」の行を強調（BPA不使用の範囲・PET≠ポリカーボネート／DEP≠DEHP・PET≠フタル酸系可塑剤／分解されにくい≠一生出ない・PTFE≠PFOA・PFOS）。',
      tail: 4,
    },
  ],
};

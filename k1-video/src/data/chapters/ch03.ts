import type {Chapter} from '../types';

/**
 * 第3章 なぜ曝露への対策が必要か／暮らしの中での毒（原文 D, E, F）
 * ※ 先行試作：皮膚の接触と移行（c03-s90）。章の他のシーンはこの後に追加する。
 */
export const ch03: Chapter = {
  id: 'ch03',
  number: 3,
  title: 'なぜ曝露への対策が必要か／暮らしの中での毒',
  slug: 'Ch03',
  scenes: [
    {
      id: 'c03-s90',
      title: '皮膚：接触と移行',
      heading: '皮膚：触れることと、体内へ移ること',
      visual: 'ch03/SkinBoundary',
      props: {steps: {contact: 1, transfer: 2, conditions: 3, distinct: 4}},
      lines: [
        {text: '皮膚では、まず物質が皮膚の表面に触れます。', src: ['F3'], step: 1},
        {text: '物質や皮膚の状態などによっては、その一部が皮膚の中や血液へ移行する場合があります。', src: ['F3'], step: 2},
        {text: 'そのため、触れる部位、製品の量、接触時間などを考えます。', src: ['F3', 'J5'], step: 3},
        {text: '表面に付いたことと、身体の中に吸収されたことは、同じではありません。', src: ['G1'], step: 4},
      ],
      board:
        '皮膚の断面の模式図（表面・皮膚の中・血液）。物質（金の丸）が表面に付く→一部だけが点線の経路で中へ移る（条件付き）→右に条件の例→下に「付いた≠吸収された」の区別帯。',
    },
  ],
};

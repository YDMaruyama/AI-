import {toReading} from '../readings';
import type {Chapter, NarrationLine} from '../types';

/**
 * 第2章 避ける・防ぐ・排出する（原文 C, C1〜C4）
 * - 三つの視点は「タブ」として一枚ずつ加わる（避ける → 防ぐ → 排出する）。並列の視点であり、
 *   矢印で結んで一連の手順や体内の排出経路のようには描かない。
 * - 「排出する」は身体の働きに目を向け、いたわる暮らしを整える視点。製品・排出の約束は描かない。
 */

/**
 * 仮音声（TTS）用の読みの補い。共有の読み方辞書（readings.ts）に未登録の語だけを章内で置換する。
 * 身体＝からだ（ただし「身体活動」は しんたいかつどう）、避ける＝さける、（一度）行って＝おこなって。
 */
const LOCAL_READINGS: [string, string][] = [
  ['身体活動', 'しんたいかつどう'],
  ['身体', 'からだ'],
  ['避ける', 'さける'],
  ['行って', 'おこなって'],
];
const line = (text: string, src: string[], opt: Omit<NarrationLine, 'text' | 'src'> = {}): NarrationLine => {
  const needs = LOCAL_READINGS.some(([term]) => text.includes(term));
  const reading = needs ? toReading(LOCAL_READINGS.reduce((t, [a, b]) => t.split(a).join(b), text)) : undefined;
  return {text, src, ...opt, ...(reading ? {reading} : {})};
};

export const ch02: Chapter = {
  id: 'ch02',
  number: 2,
  title: '避ける・防ぐ・排出する',
  slug: 'Ch02',
  scenes: [
    {
      id: 'c02-s01',
      title: '章扉',
      layout: 'full',
      visual: 'ChapterTitle',
      props: {number: 2, title: '避ける・防ぐ・排出する', subtitle: '排毒学校が大切にする三つの視点'},
      lines: [line('第2章では、排毒学校が大切にする三つの視点、「避ける・防ぐ・排出する」を見ていきます。', ['C'])],
      board: '章番号と章題「避ける・防ぐ・排出する」。副題に「排毒学校が大切にする三つの視点」。金の罫線が伸びる。',
    },
    {
      id: 'c02-s02',
      title: '避ける',
      heading: '避ける：減らせる接触を知り、選び方を見直す',
      visual: 'ch02/ViewPanel',
      props: {
        view: 'avoid',
        definition: '自分にとって避ける必要のあるものや、減らせる接触を知り、**選び方を見直す**',
        defStep: 1,
        sceneLabel: 'たとえば',
        tiles: [
          {kind: 'allergen', label: '自分に関係する\nアレルゲンを確認', step: 2},
          {kind: 'caution', label: '商品の注意表示を確認', step: 3},
          {kind: 'alternative', label: '別の選択肢を考える', step: 4},
        ],
      },
      lines: [
        line('一つ目の視点は、「避ける」です。', ['C1'], {step: 0}),
        line('自分にとって避ける必要のあるものや、減らせる接触を知り、選び方を見直すことです。', ['C1'], {step: 1}),
        line('たとえば、自分に関係するアレルゲンや、商品の注意表示を確認すること。', ['C1'], {step: 2, substeps: [{at: 0.55, step: 3}]}),
        line('そして、別の選択肢を考えることも、その一つです。', ['C1'], {step: 4}),
      ],
      board:
        '上に三つの視点のタブ。最初のタブ「避ける」が現れて下の面と一続きに開く（残り二枚の位置は空けておく）。面の中央に視点の記号と意味「自分にとって避ける必要のあるものや、減らせる接触を知り、選び方を見直す」を大きく示し、最初の場面が出るとき意味の文を面の上部へ穏やかに移す。下に暮らしの場面のタイルが音声に合わせて順に現れ、話しているタイルだけ緑の枠で強調：食品の包装の表示欄を虫めがねで確かめる／製品の注意表示と「注意」の吹き出し／二つの選択肢を両向きの弧で見比べる。',
    },
    {
      id: 'c02-s03',
      title: '防ぐ',
      heading: '防ぐ：使い方や環境を整え、機会を減らす',
      visual: 'ch02/ViewPanel',
      props: {
        view: 'protect',
        definition: '使い方や暮らしの環境を整え、**望ましくない影響が起きる機会を減らす**',
        defStep: 1,
        sceneLabel: '日々の扱い方',
        tiles: [
          {kind: 'storage', label: '食品の保存', step: 2},
          {kind: 'cooking', label: '調理', step: 3},
          {kind: 'instructions', label: '製品の使用方法', step: 4},
          {kind: 'ventilation', label: '室内の換気', step: 5},
        ],
        allStep: 6,
      },
      lines: [
        line('二つ目の視点は、「防ぐ」です。', ['C2'], {step: 0}),
        line('使い方や暮らしの環境を整え、望ましくない影響が起きる機会を減らすことです。', ['C2'], {step: 1}),
        line('たとえば、食品の保存や調理。', ['C2'], {step: 2, substeps: [{at: 0.72, step: 3}]}),
        line('製品の使用方法。', ['C2'], {step: 4}),
        line('室内の換気。', ['C2'], {step: 5}),
        line('こうした日々の扱い方にも、目を向けます。', ['C2'], {step: 6}),
      ],
      board:
        'タブに「防ぐ」が加わり、「避ける」は読める濃さで残る。中央に視点の記号と意味「使い方や暮らしの環境を整え、望ましくない影響が起きる機会を減らす」→場面が出るとき面の上部へ移る。日々の扱い方のタイルを順に表示：冷蔵庫の中のふた付き容器（ふたが閉まる）／ふたをした鍋（湯気は静止）／使用方法の説明書にチェックが入る／窓が開き空気が入れ替わる。最後に四枚すべてを強調。',
    },
    {
      id: 'c02-s04',
      title: '排出する',
      heading: '排出する：身体の働きに目を向け、いたわる',
      visual: 'ch02/ViewPanel',
      props: {
        view: 'release',
        definition: '不要になったものを体外へ出す**身体の働きに目を向け**、**いたわる暮らし**を整える',
        defStep: 1,
        sceneLabel: '暮らしの中で',
        tiles: [
          {kind: 'learn', label: '身体の仕組みを学ぶ', step: 2},
          {kind: 'habits', label: '日々の習慣とのつながりを考える', step: 3, flex: 2},
        ],
      },
      lines: [
        line('三つ目の視点は、「排出する」です。', ['C3'], {step: 0}),
        line('身体が不要になったものを体外へ出す働きに目を向け、身体をいたわる暮らしを整えることです。', ['C3'], {step: 1}),
        line('身体の仕組みを学びながら、食事、身体活動、休養などの日々の習慣とのつながりを考えます。', ['C3'], {
          step: 2,
          substeps: [{at: 0.3, step: 3}],
        }),
      ],
      board:
        'タブに「排出する」が加わり、三枚がそろう（矢印でつながない）。中央に視点の記号と意味「不要になったものを体外へ出す身体の働きに目を向け、いたわる暮らしを整える」→場面が出るとき面の上部へ移る。タイル：開いた本と人の形（身体の仕組みを学ぶ）／食事・身体活動・休養などの記号が音声に合わせて順に現れる（日々の習慣とのつながりを考える）。体内の経路・製品・排出量は描かない。',
    },
    {
      id: 'c02-s05',
      title: '視点を広げる場面',
      heading: '三つの視点を、食事以外にも広げる',
      visual: 'ch02/ViewsExtend',
      props: {
        areas: [
          {kind: 'meal', label: '食事', step: 1},
          {kind: 'skincare', label: '肌の手入れ', step: 2},
          {kind: 'rest', label: '休み方', step: 3},
          {kind: 'awareness', label: '自分の状態への気づき', step: 4},
        ],
        allStep: 5,
      },
      lines: [
        line(
          '排毒学校では、この三つの視点を、食事だけでなく、肌の手入れ、休み方、自分の状態への気づきにも広げていきます。',
          ['C4'],
          {
            step: 0,
            substeps: [
              {at: 0.28, step: 1},
              {at: 0.43, step: 2},
              {at: 0.54, step: 3},
              {at: 0.62, step: 4},
              {at: 0.86, step: 5},
            ],
          },
        ),
      ],
      board:
        '上の囲みに三つの視点（避ける・防ぐ・排出する）を横に並べる（矢印でつながない）。音声に合わせて、囲みから細い線（矢じりなし）が伸び、下に「食事」「肌の手入れ」「休み方」「自分の状態への気づき」のタイルが順に現れる。最後に四枚すべてを強調。',
      tail: 1.5,
    },
    {
      id: 'c02-s06',
      title: '続けられる選択を重ねる',
      heading: '一度で終えず、続けられる選択を重ねる',
      visual: 'ch02/KeepChoosing',
      props: {steps: {once: 0, know: 1, choices: 2}},
      lines: [
        line('排毒学校が大切にするのは、何かを一度行って終えることではありません。', ['C4'], {step: 0}),
        line('自分の暮らしを知り、続けられる選択を重ねていくことです。', ['C4'], {step: 1, substeps: [{at: 0.36, step: 2}]}),
      ],
      board:
        '点線の帯に、印が一つだけの短く閉じた線と「一度行って終える」「ではなく」をまず中央に示し、次の段階で上へ移して読める濃さに下げる。下の枠：左の丸（家と虫めがね）「自分の暮らしを知る」から右へ線が伸び、暮らしの記号の印（食事・肌・休む・気づき・換気・表示）が一つずつ加わって止まる。右端の点で「この先も続く」ことを示す。',
      tail: 1.8,
    },
  ],
};

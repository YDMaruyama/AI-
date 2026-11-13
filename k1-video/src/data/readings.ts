/**
 * 読み方辞書。
 * - narration_ja.md の「読み方」表に出力する
 * - 仮音声（TTS）の読み上げ用テキストへ自動置換する
 * 長い語から順に置換されるため、複合語は個別に登録する。
 */
export type Reading = {term: string; reading: string; note?: string; ttsOnly?: boolean};

export const READINGS: Reading[] = [
  {term: 'K1', reading: 'ケーワン'},
  {term: '曝露', reading: 'ばくろ'},
  {term: '身体活動', reading: 'しんたいかつどう'},
  {term: '身体', reading: 'からだ', note: '「身体活動」は しんたいかつどう'},
  {term: '内分泌', reading: 'ないぶんぴ'},
  {term: 'かく乱', reading: 'かくらん'},
  {term: '排毒', reading: 'はいどく'},
  {term: '胎仔', reading: 'たいし', note: '動物の胎児。人の場合は「胎児（たいじ）」'},
  {term: '胎児期', reading: 'たいじき'},
  {term: '撥水', reading: 'はっすい'},
  {term: '撥油', reading: 'はつゆ'},
  {term: '可塑剤', reading: 'かそざい'},
  {term: '受容体', reading: 'じゅようたい'},
  {term: '甲状腺', reading: 'こうじょうせん'},
  {term: '精巣', reading: 'せいそう'},
  {term: '卵巣', reading: 'らんそう'},
  {term: '生殖器', reading: 'せいしょくき'},
  {term: '生殖', reading: 'せいしょく'},
  {term: '酵素', reading: 'こうそ'},
  {term: '肝酵素', reading: 'かんこうそ'},
  {term: '酸化ストレス', reading: 'さんかストレス'},
  {term: '風化', reading: 'ふうか'},
  {term: '摩耗', reading: 'まもう'},
  {term: '樹脂', reading: 'じゅし'},
  {term: '軟質', reading: 'なんしつ'},
  {term: '塩化ビニル', reading: 'えんかビニル'},
  {term: '陶磁器', reading: 'とうじき'},
  {term: '毛羽立ち', reading: 'けばだち'},
  {term: '剥がれ', reading: 'はがれ'},
  {term: '空焚き', reading: 'からだき'},
  {term: '研磨剤', reading: 'けんまざい'},
  {term: '泡消火薬剤', reading: 'あわしょうかやくざい'},
  {term: '妊娠高血圧症候群', reading: 'にんしんこうけつあつしょうこうぐん'},
  {term: '自身に愛を、地球に敬意を', reading: 'じしんにあいを、ちきゅうにけいいを'},
  {term: 'シーラン', reading: 'シーラン', note: '固有名詞。表記どおり'},
  {term: 'ビスフェノールA', reading: 'ビスフェノールエー'},
  {term: 'テレフタレート', reading: 'テレフタレート'},
  {term: 'フタル酸エステル', reading: 'フタルさんエステル'},
  {term: 'フタル酸系', reading: 'フタルさんけい'},
  {term: 'フタル酸類', reading: 'フタルさんるい'},
  {term: 'フタル酸', reading: 'フタルさん'},
  {term: '有機フッ素化合物', reading: 'ゆうきフッそかごうぶつ'},
  {term: 'フッ素樹脂', reading: 'フッそじゅし'},
  {term: 'ポリカーボネート', reading: 'ポリカーボネート'},
  {term: 'BPA', reading: 'ビーピーエー'},
  {term: 'PFAS', reading: 'ピーファス'},
  {term: 'PFOA', reading: 'ピーフォア'},
  {term: 'PFOS', reading: 'ピーフォス'},
  {term: 'PTFE', reading: 'ピーティーエフイー'},
  {term: 'PET', reading: 'ペット'},
  {term: 'DEHP', reading: 'ディーイーエイチピー'},
  {term: 'DBP', reading: 'ディービーピー'},
  {term: 'BBP', reading: 'ビービーピー'},
  {term: 'DEP', reading: 'ディーイーピー'},
  {term: 'Th17', reading: 'ティーエイチじゅうなな'},
  {term: '5 mm', reading: 'ごミリメートル'},
  {term: '1 µm', reading: 'いちマイクロメートル'},
  {term: '1 mm', reading: 'いちミリメートル'},
  {term: 'µm', reading: 'マイクロメートル'},
  {term: 'mm', reading: 'ミリメートル', ttsOnly: true},
  {term: '1,000分の1', reading: 'せんぶんのいち'},
  {term: '100個', reading: 'ひゃっこ'},
  {term: '一分子', reading: 'いちぶんし'},
  {term: '何倍', reading: 'なんばい'},
  {term: '体外', reading: 'たいがい'},
  {term: '体内', reading: 'たいない'},
  {term: '皮膚内', reading: 'ひふない'},
  {term: '気道', reading: 'きどう'},
  {term: '消化管', reading: 'しょうかかん'},
];

/** TTS 用：読み方辞書で表記を置換する（長い語を優先） */
export const toReading = (text: string): string => {
  const sorted = [...READINGS].sort((a, b) => b.term.length - a.term.length);
  let out = text;
  for (const r of sorted) {
    out = out.split(r.term).join(r.reading);
  }
  // 記号の読み上げを避ける
  return out.replace(/[「」『』（）()]/g, '').replace(/／/g, '、').replace(/・/g, '、');
};

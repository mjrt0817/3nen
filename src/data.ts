import { Card, Badge, ArithmeticQuestion, KanjiQuestion } from './types';

export const DEFAULT_CARDS: Card[] = [
  // Normal Cards (10-30 coins value range)
  {
    id: 'n1',
    name: 'ピカポチ',
    rarity: 'N',
    description: 'いつも元気に飛び跳ねている、でんきネズミ。ほっぺたを触ると静電気がピリリと走るよ。勉強が大好き！',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'n2',
    name: 'モリノコ',
    rarity: 'N',
    description: '森の奥深くに住んでいる葉っぱの妖精。読書が趣味で、漢字を覚えるのが得意なんだ。',
    imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'n3',
    name: 'ペンタロウ',
    rarity: 'N',
    description: 'お腹の星マークがチャームポイントのペンギン。算数の計算を始めるとスピードが止まらない！',
    imageUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'n4',
    name: 'コロリン',
    rarity: 'N',
    description: 'ころころ転がる不思議な岩石モンスター。数字の「0」が大好きで、わり算を応援してくれる。',
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'n5',
    name: 'ウサノフ',
    rarity: 'N',
    description: 'ノートを抱えたウサギ。いつも勉強の予定をメモしている、しっかり者。',
    imageUrl: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=200&auto=format&fit=crop&q=80',
  },
  // Rare Cards
  {
    id: 'r1',
    name: 'イナズマレオ',
    rarity: 'R',
    description: '雲の上を走る、雷の力を持つちいさなライオン。算数の「かけ算筆算」で稲妻のような速さを手に入れた！',
    imageUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'r2',
    name: 'ホシヨミフクロウ',
    rarity: 'R',
    description: '夜空の星を読んで未来を占うフクロウ。漢字の歴史をすべて知っている物知り博士。',
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'r3',
    name: 'アクアドフィン',
    rarity: 'R',
    description: 'きれいな水の世界を守るイルカ。分数の計算が得意で、ピザやケーキを等分するのが大好き。',
    imageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'r4',
    name: 'クリスタルキツネ',
    rarity: 'R',
    description: '結晶のような美しいしっぽを持つキツネ。集中力が高まると、体が青くきらめくよ。',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&auto=format&fit=crop&q=80',
  },
  // Super Rare Cards
  {
    id: 'sr1',
    name: 'フェニックス・マスタリー',
    rarity: 'SR',
    description: 'あきらめずに挑戦し続けた勉強者にのみ姿を現す不死鳥。すべてを包み込む暖かい光で満ちている。',
    imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'sr2',
    name: 'ギャラクシードラゴン',
    rarity: 'SR',
    description: '銀河のエネルギーを宿した伝説のドラゴン。大きな数（億兆）を自由に操り、宇宙を旅する。',
    imageUrl: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'sr3',
    name: 'エンプレス・サクラ',
    rarity: 'SR',
    description: '漢字の奥義を極めた美しい桜の精霊。流れるような筆さばきで、すべての漢字を美しく書き上げる。',
    imageUrl: 'https://images.unsplash.com/photo-1522441815192-d9f04eb0615c?w=200&auto=format&fit=crop&q=80',
  }
];

export const DEFAULT_BADGES: Badge[] = [
  {
    id: 'badge_1',
    name: 'はじめの一歩',
    description: '最初の勉強をクリアする',
    iconName: 'BookOpen',
    requiredStreak: 0,
    unlocked: false,
  },
  {
    id: 'badge_2',
    name: '3日連続の達人',
    description: '勉強を3日間連続でがんばる',
    iconName: 'Flame',
    requiredStreak: 3,
    unlocked: false,
  },
  {
    id: 'badge_3',
    name: '5日連続の英雄',
    description: '勉強を5日間連続でがんばる',
    iconName: 'Award',
    requiredStreak: 5,
    unlocked: false,
  },
  {
    id: 'badge_4',
    name: '1週間マスター',
    description: '勉強を7日間連続でがんばる',
    iconName: 'Trophy',
    requiredStreak: 7,
    unlocked: false,
  },
  {
    id: 'badge_5',
    name: 'コレクター',
    description: 'トレーディングカードを5枚以上集める',
    iconName: 'Grid',
    requiredStreak: 0,
    unlocked: false,
  }
];

// 3rd Grade Arithmetic Questions
export const ARITHMETIC_QUESTIONS: ArithmeticQuestion[] = [
  // わり算 (Division)
  {
    id: 'm1',
    num1: 24,
    num2: 4,
    operator: '÷',
    questionText: '24 ÷ 4 はいくつかな？（4のだんの九九を思い出してね）',
    correctAnswer: 6,
    options: [4, 5, 6, 8],
    hint: '「4に何をかけたら24になるかな？」と考えてみてね。',
  },
  {
    id: 'm2',
    num1: 35,
    num2: 5,
    operator: '÷',
    questionText: '35 ÷ 5 はいくつかな？',
    correctAnswer: 7,
    options: [5, 6, 7, 8],
    hint: '5の段の九九で、答えが35になるものをさがそう！',
  },
  {
    id: 'm3',
    num1: 48,
    num2: 8,
    operator: '÷',
    questionText: '48 ÷ 8 はいくつかな？',
    correctAnswer: 6,
    options: [5, 6, 7, 8],
    hint: '8 × [ ] = 48。あてはまる数字は何かな？',
  },
  {
    id: 'm4',
    num1: 0,
    num2: 9,
    operator: '÷',
    questionText: '0 ÷ 9 はいくつかな？（お菓子が0個のとき、9人で分けても…？）',
    correctAnswer: 0,
    options: [0, 1, 9, 3],
    hint: '何もないものを分けても、やっぱり0だね！',
  },

  // かけ算筆算 (Multiplication with carry over)
  {
    id: 'm5',
    num1: 23,
    num2: 3,
    operator: '×',
    questionText: '23 × 3 はいくつかな？（筆算のように、一の位から順番にかけてね）',
    correctAnswer: 69,
    options: [56, 63, 69, 72],
    hint: 'まず 3 × 3 = 9、つぎに 20 × 3 = 60 だから…？',
  },
  {
    id: 'm6',
    num1: 45,
    num2: 2,
    operator: '×',
    questionText: '45 × 2 はいくつかな？（繰り上がりに気をつけてね！）',
    correctAnswer: 90,
    options: [80, 85, 90, 95],
    hint: '5 × 2 = 10 で、1が繰り上がるよ。4 × 2 = 8に 1をたすと…？',
  },
  {
    id: 'm7',
    num1: 12,
    num2: 4,
    operator: '×',
    questionText: '12 × 4 はいくつかな？',
    correctAnswer: 48,
    options: [36, 44, 48, 52],
    hint: '2 × 4 = 8 と 10 × 4 = 40 をあわせよう。',
  },

  // あまりのあるわり算 (Division with remainder)
  {
    id: 'm8',
    num1: 17,
    num2: 3,
    operator: '÷',
    questionText: '17 ÷ 3 の「商（しょう＝答えの数）」はいくつかな？',
    correctAnswer: 5,
    options: [4, 5, 6, 7],
    hint: '3のだんで17をこえない一番大きい数をさがそう。3 × 5 = 15、3 × 6 = 18。',
  },

  // 大きな数 (Large numbers)
  {
    id: 'm9',
    num1: 8000,
    num2: 2000,
    operator: '+',
    questionText: '8000 ＋ 2000 はいくつかな？',
    correctAnswer: 10000,
    options: [9000, 10000, 11000, 12000],
    hint: '「8000」に「2000」をたすと、1万（一万）になるよ。ゼロの数に気をつけよう！',
  },

  // 小数・分数 (Decimals & Fractions)
  {
    id: 'm10',
    num1: 3, // representing 0.3 + 0.4
    num2: 4,
    operator: '+',
    questionText: '0.3 ＋ 0.4 はいくつかな？',
    correctAnswer: 7, // will map to 0.7
    options: [0.1, 0.5, 0.7, 1.2], // custom handling in UI
    hint: '0.1が、3個と4個あるから、あわせて何個かな？',
  }
];

// 3rd Grade Kanji Questions
export const KANJI_QUESTIONS: KanjiQuestion[] = [
  {
    id: 'k1',
    kanji: '赤',
    reading: 'あか',
    contextBefore: 'ポストは ',
    contextAfter: ' い色をしています。',
    hint: '「土」の下に「八」のような形を書くよ。赤（あか）信号の「あか」だよ。',
    strokeCount: 7,
  },
  {
    id: 'k2',
    kanji: '青',
    reading: 'あお',
    contextBefore: 'さわやかに晴れた ',
    contextAfter: ' 空がひろがっている。',
    hint: '上は「ま（キ）」、下は「月」だよ。青（あお）色の「あお」だね。',
    strokeCount: 8,
  },
  {
    id: 'k3',
    kanji: '歌',
    reading: 'うた',
    contextBefore: 'みんなで元気に ',
    contextAfter: ' をうたいましょう。',
    hint: '左側は「可」をたてに2つ並べて、右側は「欠」を書くよ。',
    strokeCount: 14,
  },
  {
    id: 'k4',
    kanji: '森',
    reading: 'もり',
    contextBefore: 'たくさんの木が生いしげる ',
    contextAfter: ' の中をさんぽする。',
    hint: '「木」という漢字を、上に1つ、下に2つ、合計3つ書くんだ！',
    strokeCount: 12,
  },
  {
    id: 'k5',
    kanji: '駅',
    reading: 'えき',
    contextBefore: '電車に乗るために ',
    contextAfter: ' まで歩いていきました。',
    hint: '左側は「馬（うまへん）」、右側は「尺」を書くよ。電車の「えき」だね。',
    strokeCount: 14,
  },
  {
    id: 'k6',
    kanji: '花',
    reading: 'はな',
    contextBefore: '庭にきれいな ',
    contextAfter: ' がさきました。',
    hint: '上は「くさかんむり」、下は「化」という漢字を書くよ。',
    strokeCount: 7,
  },
  {
    id: 'k7',
    kanji: '寺',
    reading: 'てら',
    contextBefore: '古いお ',
    contextAfter: ' で鐘（かね）の音がひびく。',
    hint: '上は「土」、下は「寸」を書くよ。お「てら」の漢字だよ。',
    strokeCount: 6,
  },
  {
    id: 'k8',
    kanji: '走',
    reading: 'はし',
    contextBefore: '校庭を全力で ',
    contextAfter: ' る練習をします。',
    hint: '「土」の下に、走る足の形（「止」に似た形）を書くよ。',
    strokeCount: 7,
  },
  {
    id: 'k9',
    kanji: '茶',
    reading: 'ちゃ',
    contextBefore: '温かい緑 ',
    contextAfter: ' を飲んでほっとする。',
    hint: '上は「くさかんむり」、中は「人」のような形、下は「ホ」だよ。',
    strokeCount: 9,
  },
  {
    id: 'k10',
    kanji: '重',
    reading: 'おも',
    contextBefore: 'このダンボールはとても ',
    contextAfter: ' いです。',
    hint: '「千」と「里」が組み合わさったような漢字だよ。たいじゅうの「じゅう」でもあるよ。',
    strokeCount: 9,
  }
];

#!/usr/bin/env node
// Script to add hiragana alternatives to kanji-only cards
// Usage: node scripts/add-hiragana.js src/data/cards/genki/genki_vocab_23.yaml

const fs = require('fs');

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/add-hiragana.js <yaml-file>');
  process.exit(1);
}

// Mapping of kanji answers to hiragana readings
const hiraganaMap = {
  // Genki 23
  '雨がやむ': 'あめがやむ',
  '表す': 'あらわす',
  '言う（悪口を）': 'いう（わるくちを）',
  '一方': 'いっぽう',
  '絵文字': 'えもじ',
  '思い出': 'おもいで',
  '海外旅行': 'かいがいりょこう',
  '顔文字': 'かおもじ',
  '～顔をする': '～かおをする',
  '我慢する': 'がまんする',
  '感情': 'かんじょう',
  '記号': 'きごう',
  '気に入る': 'きにいる',
  '休講': 'きゅうこう',
  '靴下': 'くつした',
  '結果': 'けっか',
  '元気でね': 'げんきでね',
  '健康': 'けんこう',
  '社会': 'しゃかい',
  '小学校': 'しょうがっこう',
  '世界中': 'せかいじゅう',
  '世話をする': 'せわをする',
  '縦': 'たて',
  '調査': 'ちょうさ',
  '（～は）…という意味だ': '（～は）…といういみだ',
  '同情する': 'どうじょうする',
  '～は…という意味だ': '～は…といういみだ',
  '離れる': 'はなれる',
  '表情': 'ひょうじょう',
  '盆踊り': 'ぼんおどり',
  '面接': 'めんせつ',
  '戻ってくる': 'もどってくる',
  '優勝する': 'ゆうしょうする',
  '夕食': 'ゆうしょく',
  '横': 'よこ',
  '理想': 'りそう',
  '留守番': 'るすばん',
  '悪口を言う': 'わるくちをいう',
};

let content = fs.readFileSync(file, 'utf8');
let changes = 0;

for (const [kanji, hiragana] of Object.entries(hiraganaMap)) {
  // Pattern: answers:\n    - KANJI\n  hint: (without hiragana already)
  const escapedKanji = kanji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedHiragana = hiragana.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Check if hiragana is NOT already present after kanji
  const regex = new RegExp(
    `(answers:\\n    - ${escapedKanji}\\n)(  hint:)`,
    'g'
  );

  if (regex.test(content)) {
    content = content.replace(regex, `$1    - ${hiragana}\n$2`);
    changes++;
    console.log(`Added: ${kanji} → ${hiragana}`);
  }
}

fs.writeFileSync(file, content);
console.log(`\nDone! Made ${changes} changes.`);

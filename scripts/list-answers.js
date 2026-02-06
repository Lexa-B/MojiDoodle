#!/usr/bin/env node
// Temporary script to list all answers from a card deck YAML file
// Usage: node scripts/list-answers.js src/data/cards/genki/genki_vocab_01.yaml

const fs = require('fs');
const yaml = require('js-yaml');

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/list-answers.js <yaml-file>');
  process.exit(1);
}

const content = fs.readFileSync(file, 'utf8');
const cards = yaml.load(content);

// Regex to detect kanji (CJK Unified Ideographs)
const hasKanji = (str) => /[\u4e00-\u9faf]/.test(str);

for (const card of cards) {
  const answers = card.answers || [];
  const hasHiraganaOption = answers.some(a => !hasKanji(a));
  const flag = hasHiraganaOption ? '' : ' ⚠️  KANJI ONLY';
  console.log(`${card.id}: ${answers.join(', ')}${flag}`);
}

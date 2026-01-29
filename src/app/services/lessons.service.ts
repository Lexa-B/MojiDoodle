import { Injectable } from '@angular/core';

export interface Befuddler {
  answer: string;
  toast: string;
}

export interface Lesson {
  id: string;
  prompt: string;
  answer: string;
  hint?: string;
  strokeCount?: number;
  stage: number;
  unlocks: string;
  befuddlers: Befuddler[];
}

@Injectable({
  providedIn: 'root'
})
export class LessonsService {
  private lessons: Lesson[] = [
    // === HIRAGANA ===
    {
      id: 'h-a',
      prompt: 'A (Hiragana)',
      answer: 'あ',
      hint: '3 strokes',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ア', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'お', toast: 'That\'s "O", not "A"!\nLook at the right side - this one has a loop.' }
      ]
    },
    {
      id: 'h-i',
      prompt: 'I (Hiragana)',
      answer: 'い',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'イ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'り', toast: 'That\'s "RI"!\nThis one has connected strokes.' }
      ]
    },
    {
      id: 'h-u',
      prompt: 'U (Hiragana)',
      answer: 'う',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ウ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' }
      ]
    },
    {
      id: 'h-e',
      prompt: 'E (Hiragana)',
      answer: 'え',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'エ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'ん', toast: 'That\'s "N"!\nThis one curves smoothly without a top line.' }
      ]
    },
    {
      id: 'h-o',
      prompt: 'O (Hiragana)',
      answer: 'お',
      hint: '3 strokes',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'オ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'あ', toast: 'That\'s "A", not "O"!\nThis one has a more open shape without the loop.' }
      ]
    },
    {
      id: 'h-ka',
      prompt: 'KA (Hiragana)',
      answer: 'か',
      hint: '3 strokes',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'カ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'が', toast: 'That\'s "GA"!\nThis one has dakuten (゛) marks.' }
      ]
    },
    {
      id: 'h-ki',
      prompt: 'KI (Hiragana)',
      answer: 'き',
      hint: '4 strokes',
      strokeCount: 4,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'キ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'さ', toast: 'That\'s "SA"!\nThis one has a simpler top.' }
      ]
    },
    {
      id: 'h-ku',
      prompt: 'KU (Hiragana)',
      answer: 'く',
      hint: '1 stroke',
      strokeCount: 1,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ク', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'へ', toast: 'That\'s "HE"!\nThis one is more horizontal.' }
      ]
    },
    {
      id: 'h-ke',
      prompt: 'KE (Hiragana)',
      answer: 'け',
      hint: '3 strokes',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ケ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'は', toast: 'That\'s "HA"!\nThis one has a loop on the right.' }
      ]
    },
    {
      id: 'h-ko',
      prompt: 'KO (Hiragana)',
      answer: 'こ',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'コ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'に', toast: 'That\'s "NI"!\nThis one has a vertical stroke on the left.' }
      ]
    },
    {
      id: 'h-sa',
      prompt: 'SA (Hiragana)',
      answer: 'さ',
      hint: '3 strokes',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'サ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'き', toast: 'That\'s "KI"!\nThis one has an extra horizontal stroke.' }
      ]
    },
    {
      id: 'h-shi',
      prompt: 'SHI (Hiragana)',
      answer: 'し',
      hint: '1 stroke',
      strokeCount: 1,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'シ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'つ', toast: 'That\'s "TSU"!\nThis one curves horizontally.' }
      ]
    },
    {
      id: 'h-su',
      prompt: 'SU (Hiragana)',
      answer: 'す',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ス', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'む', toast: 'That\'s "MU"!\nThis one has a loop at the bottom.' }
      ]
    },
    {
      id: 'h-se',
      prompt: 'SE (Hiragana)',
      answer: 'せ',
      hint: '3 strokes',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'セ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' }
      ]
    },
    {
      id: 'h-so',
      prompt: 'SO (Hiragana)',
      answer: 'そ',
      hint: '1 stroke',
      strokeCount: 1,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ソ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'ん', toast: 'That\'s "N"!\nThis one curves differently at the end.' }
      ]
    },
    {
      id: 'h-ta',
      prompt: 'TA (Hiragana)',
      answer: 'た',
      hint: '4 strokes',
      strokeCount: 4,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'タ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'な', toast: 'That\'s "NA"!\nThis one has a different right side.' }
      ]
    },
    {
      id: 'h-chi',
      prompt: 'CHI (Hiragana)',
      answer: 'ち',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'チ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'さ', toast: 'That\'s "SA"!\nThis one has a longer top.' }
      ]
    },
    {
      id: 'h-tsu',
      prompt: 'TSU (Hiragana)',
      answer: 'つ',
      hint: '1 stroke',
      strokeCount: 1,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ツ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'し', toast: 'That\'s "SHI"!\nThis one curves vertically.' }
      ]
    },
    {
      id: 'h-te',
      prompt: 'TE (Hiragana)',
      answer: 'て',
      hint: '1 stroke',
      strokeCount: 1,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'テ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' }
      ]
    },
    {
      id: 'h-to',
      prompt: 'TO (Hiragana)',
      answer: 'と',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ト', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' }
      ]
    },
    {
      id: 'h-na',
      prompt: 'NA (Hiragana)',
      answer: 'な',
      hint: '4 strokes',
      strokeCount: 4,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ナ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'た', toast: 'That\'s "TA"!\nThis one has a different right side.' }
      ]
    },
    {
      id: 'h-ni',
      prompt: 'NI (Hiragana)',
      answer: 'に',
      hint: '3 strokes',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ニ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'こ', toast: 'That\'s "KO"!\nThis one has no vertical stroke.' }
      ]
    },
    {
      id: 'h-nu',
      prompt: 'NU (Hiragana)',
      answer: 'ぬ',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ヌ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'め', toast: 'That\'s "ME"!\nThis one has no loop at the end.' }
      ]
    },
    {
      id: 'h-ne',
      prompt: 'NE (Hiragana)',
      answer: 'ね',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ネ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'れ', toast: 'That\'s "RE"!\nThis one has no loop.' }
      ]
    },
    {
      id: 'h-no',
      prompt: 'NO (Hiragana)',
      answer: 'の',
      hint: '1 stroke',
      strokeCount: 1,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ノ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' }
      ]
    },
    {
      id: 'h-ha',
      prompt: 'HA (Hiragana)',
      answer: 'は',
      hint: '3 strokes',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ハ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'け', toast: 'That\'s "KE"!\nThis one has no loop on the right.' }
      ]
    },
    {
      id: 'h-hi',
      prompt: 'HI (Hiragana)',
      answer: 'ひ',
      hint: '1 stroke',
      strokeCount: 1,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ヒ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' }
      ]
    },
    {
      id: 'h-fu',
      prompt: 'FU (Hiragana)',
      answer: 'ふ',
      hint: '4 strokes',
      strokeCount: 4,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'フ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' }
      ]
    },
    {
      id: 'h-he',
      prompt: 'HE (Hiragana)',
      answer: 'へ',
      hint: '1 stroke',
      strokeCount: 1,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ヘ', toast: 'That\'s katakana!\nActually they look the same, but context matters!' },
        { answer: 'く', toast: 'That\'s "KU"!\nThis one is more angled.' }
      ]
    },
    {
      id: 'h-ho',
      prompt: 'HO (Hiragana)',
      answer: 'ほ',
      hint: '4 strokes',
      strokeCount: 4,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ホ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'は', toast: 'That\'s "HA"!\nThis one has no extra horizontal stroke.' }
      ]
    },
    {
      id: 'h-ma',
      prompt: 'MA (Hiragana)',
      answer: 'ま',
      hint: '3 strokes',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'マ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'も', toast: 'That\'s "MO"!\nThis one has no loop.' }
      ]
    },
    {
      id: 'h-mi',
      prompt: 'MI (Hiragana)',
      answer: 'み',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ミ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' }
      ]
    },
    {
      id: 'h-mu',
      prompt: 'MU (Hiragana)',
      answer: 'む',
      hint: '3 strokes',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ム', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'す', toast: 'That\'s "SU"!\nThis one has no loop at the bottom.' }
      ]
    },
    {
      id: 'h-me',
      prompt: 'ME (Hiragana)',
      answer: 'め',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'メ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'ぬ', toast: 'That\'s "NU"!\nThis one has a loop at the end.' }
      ]
    },
    {
      id: 'h-mo',
      prompt: 'MO (Hiragana)',
      answer: 'も',
      hint: '3 strokes',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'モ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'ま', toast: 'That\'s "MA"!\nThis one has a loop.' }
      ]
    },
    {
      id: 'h-ya',
      prompt: 'YA (Hiragana)',
      answer: 'や',
      hint: '3 strokes',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ヤ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'か', toast: 'That\'s "KA"!\nThis one has a different shape.' }
      ]
    },
    {
      id: 'h-yu',
      prompt: 'YU (Hiragana)',
      answer: 'ゆ',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ユ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' }
      ]
    },
    {
      id: 'h-yo',
      prompt: 'YO (Hiragana)',
      answer: 'よ',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ヨ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'ま', toast: 'That\'s "MA"!\nThis one has a loop at the bottom.' }
      ]
    },
    {
      id: 'h-ra',
      prompt: 'RA (Hiragana)',
      answer: 'ら',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ラ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'ち', toast: 'That\'s "CHI"!\nThis one curves differently.' }
      ]
    },
    {
      id: 'h-ri',
      prompt: 'RI (Hiragana)',
      answer: 'り',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'リ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'い', toast: 'That\'s "I"!\nThis one has separate strokes.' }
      ]
    },
    {
      id: 'h-ru',
      prompt: 'RU (Hiragana)',
      answer: 'る',
      hint: '1 stroke',
      strokeCount: 1,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ル', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'ろ', toast: 'That\'s "RO"!\nThis one has no loop.' }
      ]
    },
    {
      id: 'h-re',
      prompt: 'RE (Hiragana)',
      answer: 'れ',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'レ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'ね', toast: 'That\'s "NE"!\nThis one has a loop.' }
      ]
    },
    {
      id: 'h-ro',
      prompt: 'RO (Hiragana)',
      answer: 'ろ',
      hint: '1 stroke',
      strokeCount: 1,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ロ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'る', toast: 'That\'s "RU"!\nThis one has a loop.' }
      ]
    },
    {
      id: 'h-wa',
      prompt: 'WA (Hiragana)',
      answer: 'わ',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ワ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'れ', toast: 'That\'s "RE"!\nThis one has a different right side.' }
      ]
    },
    {
      id: 'h-wo',
      prompt: 'WO (Hiragana)',
      answer: 'を',
      hint: '3 strokes',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ヲ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' }
      ]
    },
    {
      id: 'h-n',
      prompt: 'N (Hiragana)',
      answer: 'ん',
      hint: '1 stroke',
      strokeCount: 1,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ン', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'そ', toast: 'That\'s "SO"!\nThis one curves differently.' }
      ]
    },

    // === KATAKANA ===
    {
      id: 'k-a',
      prompt: 'A (Katakana)',
      answer: 'ア',
      hint: '2 strokes, angular',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'あ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'マ', toast: 'That\'s "MA"!\nSimilar angle, but different structure.' }
      ]
    },
    {
      id: 'k-i',
      prompt: 'I (Katakana)',
      answer: 'イ',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'い', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' }
      ]
    },
    {
      id: 'k-u',
      prompt: 'U (Katakana)',
      answer: 'ウ',
      hint: '3 strokes',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'う', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'ワ', toast: 'That\'s "WA"!\nThis one has no top line.' }
      ]
    },
    {
      id: 'k-e',
      prompt: 'E (Katakana)',
      answer: 'エ',
      hint: '3 strokes, like I-beam',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'え', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' }
      ]
    },
    {
      id: 'k-o',
      prompt: 'O (Katakana)',
      answer: 'オ',
      hint: '3 strokes',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'お', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'ホ', toast: 'That\'s "HO"!\nThis one has an extra vertical stroke splitting the bottom.' }
      ]
    },
    {
      id: 'k-ka',
      prompt: 'KA (Katakana)',
      answer: 'カ',
      hint: '2 strokes, angular',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'か', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'ガ', toast: 'That\'s "GA"!\nThis one has dakuten (゛) marks.' }
      ]
    },
    {
      id: 'k-ki',
      prompt: 'KI (Katakana)',
      answer: 'キ',
      hint: '3 strokes',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'き', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' }
      ]
    },
    {
      id: 'k-ku',
      prompt: 'KU (Katakana)',
      answer: 'ク',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'く', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'タ', toast: 'That\'s "TA"!\nThis one has an extra stroke.' }
      ]
    },
    {
      id: 'k-ke',
      prompt: 'KE (Katakana)',
      answer: 'ケ',
      hint: '3 strokes',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'け', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' }
      ]
    },
    {
      id: 'k-ko',
      prompt: 'KO (Katakana)',
      answer: 'コ',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'こ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' }
      ]
    },
    {
      id: 'k-sa',
      prompt: 'SA (Katakana)',
      answer: 'サ',
      hint: '3 strokes',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'さ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'セ', toast: 'That\'s "SE"!\nThis one has a different shape.' }
      ]
    },
    {
      id: 'k-shi',
      prompt: 'SHI (Katakana)',
      answer: 'シ',
      hint: '3 strokes',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'し', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'ツ', toast: 'That\'s "TSU"!\nThe strokes angle differently.' }
      ]
    },
    {
      id: 'k-su',
      prompt: 'SU (Katakana)',
      answer: 'ス',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'す', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' }
      ]
    },
    {
      id: 'k-se',
      prompt: 'SE (Katakana)',
      answer: 'セ',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'せ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'サ', toast: 'That\'s "SA"!\nThis one has a different shape.' }
      ]
    },
    {
      id: 'k-so',
      prompt: 'SO (Katakana)',
      answer: 'ソ',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'そ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'ン', toast: 'That\'s "N"!\nThe strokes angle differently.' }
      ]
    },
    {
      id: 'k-ta',
      prompt: 'TA (Katakana)',
      answer: 'タ',
      hint: '3 strokes',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'た', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'ク', toast: 'That\'s "KU"!\nThis one has fewer strokes.' }
      ]
    },
    {
      id: 'k-chi',
      prompt: 'CHI (Katakana)',
      answer: 'チ',
      hint: '3 strokes',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ち', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'テ', toast: 'That\'s "TE"!\nThis one has a different bottom.' }
      ]
    },
    {
      id: 'k-tsu',
      prompt: 'TSU (Katakana)',
      answer: 'ツ',
      hint: '3 strokes',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'つ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'シ', toast: 'That\'s "SHI"!\nThe strokes angle differently.' }
      ]
    },
    {
      id: 'k-te',
      prompt: 'TE (Katakana)',
      answer: 'テ',
      hint: '3 strokes',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'て', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' }
      ]
    },
    {
      id: 'k-to',
      prompt: 'TO (Katakana)',
      answer: 'ト',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'と', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' }
      ]
    },
    {
      id: 'k-na',
      prompt: 'NA (Katakana)',
      answer: 'ナ',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'な', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'メ', toast: 'That\'s "ME"!\nThis one crosses differently.' }
      ]
    },
    {
      id: 'k-ni',
      prompt: 'NI (Katakana)',
      answer: 'ニ',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'に', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' }
      ]
    },
    {
      id: 'k-nu',
      prompt: 'NU (Katakana)',
      answer: 'ヌ',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ぬ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' }
      ]
    },
    {
      id: 'k-ne',
      prompt: 'NE (Katakana)',
      answer: 'ネ',
      hint: '4 strokes',
      strokeCount: 4,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ね', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' }
      ]
    },
    {
      id: 'k-no',
      prompt: 'NO (Katakana)',
      answer: 'ノ',
      hint: '1 stroke',
      strokeCount: 1,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'の', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' }
      ]
    },
    {
      id: 'k-ha',
      prompt: 'HA (Katakana)',
      answer: 'ハ',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'は', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' }
      ]
    },
    {
      id: 'k-hi',
      prompt: 'HI (Katakana)',
      answer: 'ヒ',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ひ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' }
      ]
    },
    {
      id: 'k-fu',
      prompt: 'FU (Katakana)',
      answer: 'フ',
      hint: '1 stroke',
      strokeCount: 1,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ふ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' }
      ]
    },
    {
      id: 'k-he',
      prompt: 'HE (Katakana)',
      answer: 'ヘ',
      hint: '1 stroke',
      strokeCount: 1,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'へ', toast: 'That\'s hiragana!\nActually they look the same, but context matters!' }
      ]
    },
    {
      id: 'k-ho',
      prompt: 'HO (Katakana)',
      answer: 'ホ',
      hint: '4 strokes',
      strokeCount: 4,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ほ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'オ', toast: 'That\'s "O"!\nThis one has no middle vertical stroke.' }
      ]
    },
    {
      id: 'k-ma',
      prompt: 'MA (Katakana)',
      answer: 'マ',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ま', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'ア', toast: 'That\'s "A"!\nThis one has a different angle.' }
      ]
    },
    {
      id: 'k-mi',
      prompt: 'MI (Katakana)',
      answer: 'ミ',
      hint: '3 strokes',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'み', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' }
      ]
    },
    {
      id: 'k-mu',
      prompt: 'MU (Katakana)',
      answer: 'ム',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'む', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' }
      ]
    },
    {
      id: 'k-me',
      prompt: 'ME (Katakana)',
      answer: 'メ',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'め', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'ナ', toast: 'That\'s "NA"!\nThis one crosses differently.' }
      ]
    },
    {
      id: 'k-mo',
      prompt: 'MO (Katakana)',
      answer: 'モ',
      hint: '3 strokes',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'も', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' }
      ]
    },
    {
      id: 'k-ya',
      prompt: 'YA (Katakana)',
      answer: 'ヤ',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'や', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' }
      ]
    },
    {
      id: 'k-yu',
      prompt: 'YU (Katakana)',
      answer: 'ユ',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ゆ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' }
      ]
    },
    {
      id: 'k-yo',
      prompt: 'YO (Katakana)',
      answer: 'ヨ',
      hint: '3 strokes',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'よ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' }
      ]
    },
    {
      id: 'k-ra',
      prompt: 'RA (Katakana)',
      answer: 'ラ',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ら', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' }
      ]
    },
    {
      id: 'k-ri',
      prompt: 'RI (Katakana)',
      answer: 'リ',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'り', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' }
      ]
    },
    {
      id: 'k-ru',
      prompt: 'RU (Katakana)',
      answer: 'ル',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'る', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' }
      ]
    },
    {
      id: 'k-re',
      prompt: 'RE (Katakana)',
      answer: 'レ',
      hint: '1 stroke',
      strokeCount: 1,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'れ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' }
      ]
    },
    {
      id: 'k-ro',
      prompt: 'RO (Katakana)',
      answer: 'ロ',
      hint: '3 strokes',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ろ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' }
      ]
    },
    {
      id: 'k-wa',
      prompt: 'WA (Katakana)',
      answer: 'ワ',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'わ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'ウ', toast: 'That\'s "U"!\nThis one has a top stroke.' }
      ]
    },
    {
      id: 'k-wo',
      prompt: 'WO (Katakana)',
      answer: 'ヲ',
      hint: '3 strokes',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'を', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' }
      ]
    },
    {
      id: 'k-n',
      prompt: 'N (Katakana)',
      answer: 'ン',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ん', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'ソ', toast: 'That\'s "SO"!\nThe strokes angle differently.' }
      ]
    },

    // === INDIVIDUAL KANJI ===
    {
      id: 'kj-ichi',
      prompt: 'One (Number)',
      answer: '一',
      hint: 'Single horizontal stroke',
      strokeCount: 1,
      stage: -1,
      unlocks: '9999-12-31T23:59:59+00:00',
      befuddlers: []
    },
    {
      id: 'kj-ni',
      prompt: 'Two (Number)',
      answer: '二',
      hint: 'Two horizontal strokes',
      strokeCount: 2,
      stage: -1,
      unlocks: '9999-12-31T23:59:59+00:00',
      befuddlers: []
    },
    {
      id: 'kj-san',
      prompt: 'Three (Number)',
      answer: '三',
      hint: 'Three horizontal strokes',
      strokeCount: 3,
      stage: -1,
      unlocks: '9999-12-31T23:59:59+00:00',
      befuddlers: []
    },
    {
      id: 'kj-hi',
      prompt: 'Sun / Day',
      answer: '日',
      hint: '4 strokes, box shape',
      strokeCount: 4,
      stage: -1,
      unlocks: '9999-12-31T23:59:59+00:00',
      befuddlers: [
        { answer: '目', toast: 'That means "eye"!\nThis one has an extra horizontal line inside.' }
      ]
    },
    {
      id: 'kj-tsuki',
      prompt: 'Moon / Month',
      answer: '月',
      hint: '4 strokes',
      strokeCount: 4,
      stage: -1,
      unlocks: '9999-12-31T23:59:59+00:00',
      befuddlers: [
        { answer: '日', toast: 'That means "sun/day"!\nThis one is more square-shaped.' }
      ]
    },
    {
      id: 'kj-yama',
      prompt: 'Mountain',
      answer: '山',
      hint: '3 strokes, looks like peaks',
      strokeCount: 3,
      stage: -1,
      unlocks: '9999-12-31T23:59:59+00:00',
      befuddlers: []
    },
    {
      id: 'kj-kawa',
      prompt: 'River',
      answer: '川',
      hint: '3 vertical strokes',
      strokeCount: 3,
      stage: -1,
      unlocks: '9999-12-31T23:59:59+00:00',
      befuddlers: []
    },
    {
      id: 'kj-ki',
      prompt: 'Tree / Wood',
      answer: '木',
      hint: '4 strokes',
      strokeCount: 4,
      stage: -1,
      unlocks: '9999-12-31T23:59:59+00:00',
      befuddlers: [
        { answer: '本', toast: 'That means "book/origin"!\nThis one has an extra stroke at the bottom.' }
      ]
    },

    // === KATAKANA WORDS ===
    {
      id: 'kw-koohii',
      prompt: 'Coffee',
      answer: 'コーヒー',
      hint: 'ko-hi- with long vowels',
      stage: -1,
      unlocks: '9999-12-31T23:59:59+00:00',
      befuddlers: [
        { answer: 'ココア', toast: 'That\'s "cocoa/hot chocolate"!\nThink caffeinated drink from beans.' }
      ]
    },
    {
      id: 'kw-terebi',
      prompt: 'Television',
      answer: 'テレビ',
      hint: 'te-re-bi',
      stage: -1,
      unlocks: '9999-12-31T23:59:59+00:00',
      befuddlers: [
        { answer: 'ラジオ', toast: 'That\'s "radio" (audio only)!\nThe prompt asks for the device with a screen.' }
      ]
    },
    {
      id: 'kw-konpyuutaa',
      prompt: 'Computer',
      answer: 'コンピューター',
      hint: 'kon-pyu-u-ta-a',
      stage: -1,
      unlocks: '9999-12-31T23:59:59+00:00',
      befuddlers: [
        { answer: 'スマホ', toast: 'That\'s "smartphone"!\nThe prompt asks for the larger device.' }
      ]
    },
    {
      id: 'kw-pan',
      prompt: 'Bread',
      answer: 'パン',
      hint: 'From Portuguese "pão"',
      stage: -1,
      unlocks: '9999-12-31T23:59:59+00:00',
      befuddlers: [
        { answer: 'ごはん', toast: 'That\'s "rice"!\nThe prompt asks for the wheat-based food.' }
      ]
    },
    {
      id: 'kw-aisu',
      prompt: 'Ice Cream',
      answer: 'アイス',
      hint: 'a-i-su',
      stage: -1,
      unlocks: '9999-12-31T23:59:59+00:00',
      befuddlers: []
    },

    // === KANJI WORDS ===
    {
      id: 'kjw-omou',
      prompt: 'To Think (Opinion/Feeling)',
      answer: '思う',
      hint: 'omou - subjective thinking',
      stage: -1,
      unlocks: '9999-12-31T23:59:59+00:00',
      befuddlers: [
        { answer: '考える', toast: 'That\'s "to reason/consider"!\nThis one is for thinking through a problem logically.' },
        { answer: '知っている', toast: 'That\'s "to know"!\nThis one is about having information, not forming thoughts.' }
      ]
    },
    {
      id: 'kjw-taberu',
      prompt: 'To Eat',
      answer: '食べる',
      hint: 'taberu',
      stage: -1,
      unlocks: '9999-12-31T23:59:59+00:00',
      befuddlers: [
        { answer: '飲む', toast: 'That\'s "to drink"!\nThe prompt asks about solid food.' }
      ]
    },
    {
      id: 'kjw-miru',
      prompt: 'To See / Watch',
      answer: '見る',
      hint: 'miru',
      stage: -1,
      unlocks: '9999-12-31T23:59:59+00:00',
      befuddlers: [
        { answer: '聞く', toast: 'That\'s "to hear/listen"!\nThe prompt asks about visual perception.' }
      ]
    },
    {
      id: 'kjw-iku',
      prompt: 'To Go',
      answer: '行く',
      hint: 'iku',
      stage: -1,
      unlocks: '9999-12-31T23:59:59+00:00',
      befuddlers: [
        { answer: '来る', toast: 'That\'s "to come"!\nThis one means movement toward the speaker.' }
      ]
    },
    {
      id: 'kjw-kuru',
      prompt: 'To Come',
      answer: '来る',
      hint: 'kuru',
      stage: -1,
      unlocks: '9999-12-31T23:59:59+00:00',
      befuddlers: [
        { answer: '行く', toast: 'That\'s "to go"!\nThis one means movement away from the speaker.' }
      ]
    },
    {
      id: 'kjw-nihon',
      prompt: 'Japan',
      answer: '日本',
      hint: 'nihon - "sun origin"',
      stage: -1,
      unlocks: '9999-12-31T23:59:59+00:00',
      befuddlers: [
        { answer: '日曜日', toast: 'That\'s "Sunday"!\nThe prompt asks for a country, not a day.' }
      ]
    },
    {
      id: 'kjw-sensei',
      prompt: 'Teacher',
      answer: '先生',
      hint: 'sensei',
      stage: -1,
      unlocks: '9999-12-31T23:59:59+00:00',
      befuddlers: [
        { answer: '学生', toast: 'That\'s "student"!\nThe prompt asks for the one who teaches.' }
      ]
    },
    {
      id: 'kjw-gakusei',
      prompt: 'Student',
      answer: '学生',
      hint: 'gakusei',
      stage: -1,
      unlocks: '9999-12-31T23:59:59+00:00',
      befuddlers: [
        { answer: '先生', toast: 'That\'s "teacher"!\nThe prompt asks for the one who learns.' }
      ]
    }
  ];

  getAllLessons(): Lesson[] {
    return this.lessons;
  }

  getLessonById(id: string): Lesson | undefined {
    return this.lessons.find(l => l.id === id);
  }

  getLessonsByStage(stage: number): Lesson[] {
    return this.lessons.filter(l => l.stage === stage);
  }

  getAvailableLessons(): Lesson[] {
    return this.lessons.filter(l => l.stage >= 0);
  }

  getUnlockedLessons(): Lesson[] {
    const now = new Date();
    return this.lessons.filter(l => l.stage >= 0 && new Date(l.unlocks) <= now);
  }

  getRandomUnlockedLesson(): Lesson | undefined {
    const unlocked = this.getUnlockedLessons();
    if (unlocked.length === 0) return undefined;
    return unlocked[Math.floor(Math.random() * unlocked.length)];
  }

  getLessonByAnswer(answer: string): Lesson | undefined {
    return this.lessons.find(l => l.answer === answer);
  }

  // Update a lesson's stage (for progression)
  setLessonStage(id: string, stage: number): void {
    const lesson = this.lessons.find(l => l.id === id);
    if (lesson) {
      lesson.stage = stage;
    }
  }

  // Get stroke count for a character
  getStrokeCount(answer: string): number {
    const lesson = this.lessons.find(l => l.answer === answer);
    return lesson?.strokeCount ?? 0;
  }
}

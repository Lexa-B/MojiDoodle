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
      prompt: 'Ka (Hiragana)',
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
      prompt: 'Ki (Hiragana)',
      answer: 'き',
      hint: '4 strokes',
      strokeCount: 4,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'キ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'ぎ', toast: 'That\'s "Gi" with dakuten!\nThe prompt asks for "Ki" without the marks.' },
        { answer: 'さ', toast: 'That\'s "Sa"!\nThis one has a simpler top.' }
      ]
    },
    {
      id: 'h-ku',
      prompt: 'Ku (Hiragana)',
      answer: 'く',
      hint: '1 stroke',
      strokeCount: 1,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ク', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'ぐ', toast: 'That\'s "Gu" with dakuten!\nThe prompt asks for "Ku" without the marks.' },
        { answer: 'へ', toast: 'That\'s "He"!\nThis one is more horizontal.' }
      ]
    },
    {
      id: 'h-ke',
      prompt: 'Ke (Hiragana)',
      answer: 'け',
      hint: '3 strokes',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ケ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'げ', toast: 'That\'s "Ge" with dakuten!\nThe prompt asks for "Ke" without the marks.' },
        { answer: 'は', toast: 'That\'s "Ha"!\nThis one has a loop on the right.' }
      ]
    },
    {
      id: 'h-ko',
      prompt: 'Ko (Hiragana)',
      answer: 'こ',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'コ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'ご', toast: 'That\'s "Go" with dakuten!\nThe prompt asks for "Ko" without the marks.' },
        { answer: 'に', toast: 'That\'s "Ni"!\nThis one has a vertical stroke on the left.' }
      ]
    },
    {
      id: 'h-sa',
      prompt: 'Sa (Hiragana)',
      answer: 'さ',
      hint: '3 strokes',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'サ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'ざ', toast: 'That\'s "Za" with dakuten!\nThe prompt asks for "Sa" without the marks.' },
        { answer: 'き', toast: 'That\'s "Ki"!\nThis one has an extra horizontal stroke.' }
      ]
    },
    {
      id: 'h-shi',
      prompt: 'Shi (Hiragana)',
      answer: 'し',
      hint: '1 stroke',
      strokeCount: 1,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'シ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'じ', toast: 'That\'s "Ji" with dakuten!\nThe prompt asks for "Shi" without the marks.' },
        { answer: 'つ', toast: 'That\'s "Tsu"!\nThis one curves horizontally.' }
      ]
    },
    {
      id: 'h-su',
      prompt: 'Su (Hiragana)',
      answer: 'す',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ス', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'ず', toast: 'That\'s "Zu" with dakuten!\nThe prompt asks for "Su" without the marks.' },
        { answer: 'む', toast: 'That\'s "Mu"!\nThis one has a loop at the bottom.' }
      ]
    },
    {
      id: 'h-se',
      prompt: 'Se (Hiragana)',
      answer: 'せ',
      hint: '3 strokes',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'セ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'ぜ', toast: 'That\'s "Ze" with dakuten!\nThe prompt asks for "Se" without the marks.' }
      ]
    },
    {
      id: 'h-so',
      prompt: 'So (Hiragana)',
      answer: 'そ',
      hint: '1 stroke',
      strokeCount: 1,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ソ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'ぞ', toast: 'That\'s "Zo" with dakuten!\nThe prompt asks for "So" without the marks.' },
        { answer: 'ん', toast: 'That\'s "N"!\nThis one curves differently at the end.' }
      ]
    },
    {
      id: 'h-ta',
      prompt: 'Ta (Hiragana)',
      answer: 'た',
      hint: '4 strokes',
      strokeCount: 4,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'タ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'だ', toast: 'That\'s "Da" with dakuten!\nThe prompt asks for "Ta" without the marks.' },
        { answer: 'な', toast: 'That\'s "Na"!\nThis one has a different right side.' }
      ]
    },
    {
      id: 'h-chi',
      prompt: 'Chi (Hiragana)',
      answer: 'ち',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'チ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'ぢ', toast: 'That\'s "Di" with dakuten!\nThe prompt asks for "Chi" without the marks.' },
        { answer: 'さ', toast: 'That\'s "Sa"!\nThis one has a longer top.' }
      ]
    },
    {
      id: 'h-tsu',
      prompt: 'Tsu (Hiragana)',
      answer: 'つ',
      hint: '1 stroke',
      strokeCount: 1,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ツ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'づ', toast: 'That\'s "Du" with dakuten!\nThe prompt asks for "Tsu" without the marks.' },
        { answer: 'し', toast: 'That\'s "Shi"!\nThis one curves vertically.' }
      ]
    },
    {
      id: 'h-te',
      prompt: 'Te (Hiragana)',
      answer: 'て',
      hint: '1 stroke',
      strokeCount: 1,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'テ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'で', toast: 'That\'s "De" with dakuten!\nThe prompt asks for "Te" without the marks.' }
      ]
    },
    {
      id: 'h-to',
      prompt: 'To (Hiragana)',
      answer: 'と',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ト', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'ど', toast: 'That\'s "Do" with dakuten!\nThe prompt asks for "To" without the marks.' }
      ]
    },
    {
      id: 'h-na',
      prompt: 'Na (Hiragana)',
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
      prompt: 'Ni (Hiragana)',
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
      prompt: 'Nu (Hiragana)',
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
      prompt: 'Ne (Hiragana)',
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
      prompt: 'No (Hiragana)',
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
      prompt: 'Ha (Hiragana)',
      answer: 'は',
      hint: '3 strokes',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ハ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'ば', toast: 'That\'s "Ba" with dakuten!\nThe prompt asks for "Ha" without the marks.' },
        { answer: 'ぱ', toast: 'That\'s "Pa" with handakuten!\nThe prompt asks for "Ha" without the circle.' },
        { answer: 'け', toast: 'That\'s "Ke"!\nThis one has no loop on the right.' }
      ]
    },
    {
      id: 'h-hi',
      prompt: 'Hi (Hiragana)',
      answer: 'ひ',
      hint: '1 stroke',
      strokeCount: 1,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ヒ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'び', toast: 'That\'s "Bi" with dakuten!\nThe prompt asks for "Hi" without the marks.' },
        { answer: 'ぴ', toast: 'That\'s "Pi" with handakuten!\nThe prompt asks for "Hi" without the circle.' }
      ]
    },
    {
      id: 'h-fu',
      prompt: 'Fu (Hiragana)',
      answer: 'ふ',
      hint: '4 strokes',
      strokeCount: 4,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'フ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'ぶ', toast: 'That\'s "Bu" with dakuten!\nThe prompt asks for "Fu" without the marks.' },
        { answer: 'ぷ', toast: 'That\'s "Pu" with handakuten!\nThe prompt asks for "Fu" without the circle.' }
      ]
    },
    {
      id: 'h-he',
      prompt: 'He (Hiragana)',
      answer: 'へ',
      hint: '1 stroke',
      strokeCount: 1,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ヘ', toast: 'That\'s katakana!\nActually they look the same, but context matters!' },
        { answer: 'べ', toast: 'That\'s "Be" with dakuten!\nThe prompt asks for "He" without the marks.' },
        { answer: 'ぺ', toast: 'That\'s "Pe" with handakuten!\nThe prompt asks for "He" without the circle.' },
        { answer: 'く', toast: 'That\'s "Ku"!\nThis one is more angled.' }
      ]
    },
    {
      id: 'h-ho',
      prompt: 'Ho (Hiragana)',
      answer: 'ほ',
      hint: '4 strokes',
      strokeCount: 4,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ホ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'ぼ', toast: 'That\'s "Bo" with dakuten!\nThe prompt asks for "Ho" without the marks.' },
        { answer: 'ぽ', toast: 'That\'s "Po" with handakuten!\nThe prompt asks for "Ho" without the circle.' },
        { answer: 'は', toast: 'That\'s "Ha"!\nThis one has no extra horizontal stroke.' }
      ]
    },
    {
      id: 'h-ma',
      prompt: 'Ma (Hiragana)',
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
      prompt: 'Mi (Hiragana)',
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
      prompt: 'Mu (Hiragana)',
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
      prompt: 'Me (Hiragana)',
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
      prompt: 'Mo (Hiragana)',
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
      prompt: 'Ya (Hiragana)',
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
      prompt: 'Yu (Hiragana)',
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
      prompt: 'Yo (Hiragana)',
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
      prompt: 'Ra (Hiragana)',
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
      prompt: 'Ri (Hiragana)',
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
      prompt: 'Ru (Hiragana)',
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
      prompt: 'Re (Hiragana)',
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
      prompt: 'Ro (Hiragana)',
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
      prompt: 'Wa (Hiragana)',
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
      prompt: 'Wo (Hiragana)',
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
    {
      id: 'h-ga',
      prompt: 'Ga (Hiragana)',
      answer: 'が',
      hint: '3 strokes + dakuten',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ガ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'か', toast: 'That\'s "Ka" without dakuten!\nAdd the two small marks (゛) for "Ga".' }
      ]
    },
    {
      id: 'h-gi',
      prompt: 'Gi (Hiragana)',
      answer: 'ぎ',
      hint: '4 strokes + dakuten',
      strokeCount: 4,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ギ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'き', toast: 'That\'s "Ki" without dakuten!\nAdd the two small marks (゛) for "Gi".' }
      ]
    },
    {
      id: 'h-gu',
      prompt: 'Gu (Hiragana)',
      answer: 'ぐ',
      hint: '1 stroke + dakuten',
      strokeCount: 1,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'グ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'く', toast: 'That\'s "Ku" without dakuten!\nAdd the two small marks (゛) for "Gu".' }
      ]
    },
    {
      id: 'h-ge',
      prompt: 'Ge (Hiragana)',
      answer: 'げ',
      hint: '3 strokes + dakuten',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ゲ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'け', toast: 'That\'s "Ke" without dakuten!\nAdd the two small marks (゛) for "Ge".' }
      ]
    },
    {
      id: 'h-go',
      prompt: 'Go (Hiragana)',
      answer: 'ご',
      hint: '2 strokes + dakuten',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ゴ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'こ', toast: 'That\'s "Ko" without dakuten!\nAdd the two small marks (゛) for "Go".' }
      ]
    },
    {
      id: 'h-za',
      prompt: 'Za (Hiragana)',
      answer: 'ざ',
      hint: '3 strokes + dakuten',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ザ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'さ', toast: 'That\'s "Sa" without dakuten!\nAdd the two small marks (゛) for "Za".' }
      ]
    },
    {
      id: 'h-ji',
      prompt: 'Ji (Hiragana)',
      answer: 'じ',
      hint: '1 stroke + dakuten',
      strokeCount: 1,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ジ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'し', toast: 'That\'s "Shi" without dakuten!\nAdd the two small marks (゛) for "Ji".' }
      ]
    },
    {
      id: 'h-zu',
      prompt: 'Zu (Hiragana)',
      answer: 'ず',
      hint: '2 strokes + dakuten',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ズ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'す', toast: 'That\'s "Su" without dakuten!\nAdd the two small marks (゛) for "Zu".' }
      ]
    },
    {
      id: 'h-ze',
      prompt: 'Ze (Hiragana)',
      answer: 'ぜ',
      hint: '3 strokes + dakuten',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ゼ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'せ', toast: 'That\'s "Se" without dakuten!\nAdd the two small marks (゛) for "Ze".' }
      ]
    },
    {
      id: 'h-zo',
      prompt: 'Zo (Hiragana)',
      answer: 'ぞ',
      hint: '1 stroke + dakuten',
      strokeCount: 1,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ゾ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'そ', toast: 'That\'s "So" without dakuten!\nAdd the two small marks (゛) for "Zo".' }
      ]
    },
    {
      id: 'h-da',
      prompt: 'Da (Hiragana)',
      answer: 'だ',
      hint: '4 strokes + dakuten',
      strokeCount: 4,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ダ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'た', toast: 'That\'s "Ta" without dakuten!\nAdd the two small marks (゛) for "Da".' }
      ]
    },
    {
      id: 'h-di',
      prompt: 'Di (Hiragana)',
      answer: 'ぢ',
      hint: '2 strokes + dakuten',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ヂ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'ち', toast: 'That\'s "Chi" without dakuten!\nAdd the two small marks (゛) for "Di".' },
        { answer: 'じ', toast: 'That\'s "Ji" (from shi)!\nThis one comes from "Chi" instead.' }
      ]
    },
    {
      id: 'h-du',
      prompt: 'Du (Hiragana)',
      answer: 'づ',
      hint: '1 stroke + dakuten',
      strokeCount: 1,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ヅ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'つ', toast: 'That\'s "Tsu" without dakuten!\nAdd the two small marks (゛) for "Du".' },
        { answer: 'ず', toast: 'That\'s "Zu" (from su)!\nThis one comes from "Tsu" instead.' }
      ]
    },
    {
      id: 'h-de',
      prompt: 'De (Hiragana)',
      answer: 'で',
      hint: '1 stroke + dakuten',
      strokeCount: 1,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'デ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'て', toast: 'That\'s "Te" without dakuten!\nAdd the two small marks (゛) for "De".' }
      ]
    },
    {
      id: 'h-do',
      prompt: 'Do (Hiragana)',
      answer: 'ど',
      hint: '2 strokes + dakuten',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ド', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'と', toast: 'That\'s "To" without dakuten!\nAdd the two small marks (゛) for "Do".' }
      ]
    },
    {
      id: 'h-ba',
      prompt: 'Ba (Hiragana)',
      answer: 'ば',
      hint: '3 strokes + dakuten',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'バ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'は', toast: 'That\'s "Ha" without dakuten!\nAdd the two small marks (゛) for "Ba".' },
        { answer: 'ぱ', toast: 'That\'s "Pa" with handakuten!\nUse two marks (゛) not a circle (゜).' }
      ]
    },
    {
      id: 'h-bi',
      prompt: 'Bi (Hiragana)',
      answer: 'び',
      hint: '1 stroke + dakuten',
      strokeCount: 1,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ビ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'ひ', toast: 'That\'s "Hi" without dakuten!\nAdd the two small marks (゛) for "Bi".' },
        { answer: 'ぴ', toast: 'That\'s "Pi" with handakuten!\nUse two marks (゛) not a circle (゜).' }
      ]
    },
    {
      id: 'h-bu',
      prompt: 'Bu (Hiragana)',
      answer: 'ぶ',
      hint: '4 strokes + dakuten',
      strokeCount: 4,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ブ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'ふ', toast: 'That\'s "Fu" without dakuten!\nAdd the two small marks (゛) for "Bu".' },
        { answer: 'ぷ', toast: 'That\'s "Pu" with handakuten!\nUse two marks (゛) not a circle (゜).' }
      ]
    },
    {
      id: 'h-be',
      prompt: 'Be (Hiragana)',
      answer: 'べ',
      hint: '1 stroke + dakuten',
      strokeCount: 1,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ベ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'へ', toast: 'That\'s "He" without dakuten!\nAdd the two small marks (゛) for "Be".' },
        { answer: 'ぺ', toast: 'That\'s "Pe" with handakuten!\nUse two marks (゛) not a circle (゜).' }
      ]
    },
    {
      id: 'h-bo',
      prompt: 'Bo (Hiragana)',
      answer: 'ぼ',
      hint: '4 strokes + dakuten',
      strokeCount: 4,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ボ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'ほ', toast: 'That\'s "Ho" without dakuten!\nAdd the two small marks (゛) for "Bo".' },
        { answer: 'ぽ', toast: 'That\'s "Po" with handakuten!\nUse two marks (゛) not a circle (゜).' }
      ]
    },
    {
      id: 'h-pa',
      prompt: 'Pa (Hiragana)',
      answer: 'ぱ',
      hint: '3 strokes + handakuten',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'パ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'は', toast: 'That\'s "Ha" without handakuten!\nAdd the small circle (゜) for "Pa".' },
        { answer: 'ば', toast: 'That\'s "Ba" with dakuten!\nUse a circle (゜) not two marks (゛).' }
      ]
    },
    {
      id: 'h-pi',
      prompt: 'Pi (Hiragana)',
      answer: 'ぴ',
      hint: '1 stroke + handakuten',
      strokeCount: 1,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ピ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'ひ', toast: 'That\'s "Hi" without handakuten!\nAdd the small circle (゜) for "Pi".' },
        { answer: 'び', toast: 'That\'s "Bi" with dakuten!\nUse a circle (゜) not two marks (゛).' }
      ]
    },
    {
      id: 'h-pu',
      prompt: 'Pu (Hiragana)',
      answer: 'ぷ',
      hint: '4 strokes + handakuten',
      strokeCount: 4,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'プ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'ふ', toast: 'That\'s "Fu" without handakuten!\nAdd the small circle (゜) for "Pu".' },
        { answer: 'ぶ', toast: 'That\'s "Bu" with dakuten!\nUse a circle (゜) not two marks (゛).' }
      ]
    },
    {
      id: 'h-pe',
      prompt: 'Pe (Hiragana)',
      answer: 'ぺ',
      hint: '1 stroke + handakuten',
      strokeCount: 1,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ペ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'へ', toast: 'That\'s "He" without handakuten!\nAdd the small circle (゜) for "Pe".' },
        { answer: 'べ', toast: 'That\'s "Be" with dakuten!\nUse a circle (゜) not two marks (゛).' }
      ]
    },
    {
      id: 'h-po',
      prompt: 'Po (Hiragana)',
      answer: 'ぽ',
      hint: '4 strokes + handakuten',
      strokeCount: 4,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ポ', toast: 'That\'s katakana!\nThe prompt asks for hiragana, which is curvy.' },
        { answer: 'ほ', toast: 'That\'s "Ho" without handakuten!\nAdd the small circle (゜) for "Po".' },
        { answer: 'ぼ', toast: 'That\'s "Bo" with dakuten!\nUse a circle (゜) not two marks (゛).' }
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
      prompt: 'Ka (Katakana)',
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
      prompt: 'Ki (Katakana)',
      answer: 'キ',
      hint: '3 strokes',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'き', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'ギ', toast: 'That\'s "Gi" with dakuten!\nThe prompt asks for "Ki" without the marks.' }
      ]
    },
    {
      id: 'k-ku',
      prompt: 'Ku (Katakana)',
      answer: 'ク',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'く', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'グ', toast: 'That\'s "Gu" with dakuten!\nThe prompt asks for "Ku" without the marks.' },
        { answer: 'タ', toast: 'That\'s "Ta"!\nThis one has an extra stroke.' }
      ]
    },
    {
      id: 'k-ke',
      prompt: 'Ke (Katakana)',
      answer: 'ケ',
      hint: '3 strokes',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'け', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'ゲ', toast: 'That\'s "Ge" with dakuten!\nThe prompt asks for "Ke" without the marks.' }
      ]
    },
    {
      id: 'k-ko',
      prompt: 'Ko (Katakana)',
      answer: 'コ',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'こ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'ゴ', toast: 'That\'s "Go" with dakuten!\nThe prompt asks for "Ko" without the marks.' }
      ]
    },
    {
      id: 'k-sa',
      prompt: 'Sa (Katakana)',
      answer: 'サ',
      hint: '3 strokes',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'さ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'ザ', toast: 'That\'s "Za" with dakuten!\nThe prompt asks for "Sa" without the marks.' },
        { answer: 'セ', toast: 'That\'s "Se"!\nThis one has a different shape.' }
      ]
    },
    {
      id: 'k-shi',
      prompt: 'Shi (Katakana)',
      answer: 'シ',
      hint: '3 strokes',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'し', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'ジ', toast: 'That\'s "Ji" with dakuten!\nThe prompt asks for "Shi" without the marks.' },
        { answer: 'ツ', toast: 'That\'s "Tsu"!\nThe strokes angle differently.' }
      ]
    },
    {
      id: 'k-su',
      prompt: 'Su (Katakana)',
      answer: 'ス',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'す', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'ズ', toast: 'That\'s "Zu" with dakuten!\nThe prompt asks for "Su" without the marks.' }
      ]
    },
    {
      id: 'k-se',
      prompt: 'Se (Katakana)',
      answer: 'セ',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'せ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'ゼ', toast: 'That\'s "Ze" with dakuten!\nThe prompt asks for "Se" without the marks.' },
        { answer: 'サ', toast: 'That\'s "Sa"!\nThis one has a different shape.' }
      ]
    },
    {
      id: 'k-so',
      prompt: 'So (Katakana)',
      answer: 'ソ',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'そ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'ゾ', toast: 'That\'s "Zo" with dakuten!\nThe prompt asks for "So" without the marks.' },
        { answer: 'ン', toast: 'That\'s "N"!\nThe strokes angle differently.' }
      ]
    },
    {
      id: 'k-ta',
      prompt: 'Ta (Katakana)',
      answer: 'タ',
      hint: '3 strokes',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'た', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'ダ', toast: 'That\'s "Da" with dakuten!\nThe prompt asks for "Ta" without the marks.' },
        { answer: 'ク', toast: 'That\'s "Ku"!\nThis one has fewer strokes.' }
      ]
    },
    {
      id: 'k-chi',
      prompt: 'Chi (Katakana)',
      answer: 'チ',
      hint: '3 strokes',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ち', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'ヂ', toast: 'That\'s "Di" with dakuten!\nThe prompt asks for "Chi" without the marks.' },
        { answer: 'テ', toast: 'That\'s "Te"!\nThis one has a different bottom.' }
      ]
    },
    {
      id: 'k-tsu',
      prompt: 'Tsu (Katakana)',
      answer: 'ツ',
      hint: '3 strokes',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'つ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'ヅ', toast: 'That\'s "Du" with dakuten!\nThe prompt asks for "Tsu" without the marks.' },
        { answer: 'シ', toast: 'That\'s "Shi"!\nThe strokes angle differently.' }
      ]
    },
    {
      id: 'k-te',
      prompt: 'Te (Katakana)',
      answer: 'テ',
      hint: '3 strokes',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'て', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'デ', toast: 'That\'s "De" with dakuten!\nThe prompt asks for "Te" without the marks.' }
      ]
    },
    {
      id: 'k-to',
      prompt: 'To (Katakana)',
      answer: 'ト',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'と', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'ド', toast: 'That\'s "Do" with dakuten!\nThe prompt asks for "To" without the marks.' }
      ]
    },
    {
      id: 'k-na',
      prompt: 'Na (Katakana)',
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
      prompt: 'Ni (Katakana)',
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
      prompt: 'Nu (Katakana)',
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
      prompt: 'Ne (Katakana)',
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
      prompt: 'No (Katakana)',
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
      prompt: 'Ha (Katakana)',
      answer: 'ハ',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'は', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'バ', toast: 'That\'s "Ba" with dakuten!\nThe prompt asks for "Ha" without the marks.' },
        { answer: 'パ', toast: 'That\'s "Pa" with handakuten!\nThe prompt asks for "Ha" without the circle.' }
      ]
    },
    {
      id: 'k-hi',
      prompt: 'Hi (Katakana)',
      answer: 'ヒ',
      hint: '2 strokes',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ひ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'ビ', toast: 'That\'s "Bi" with dakuten!\nThe prompt asks for "Hi" without the marks.' },
        { answer: 'ピ', toast: 'That\'s "Pi" with handakuten!\nThe prompt asks for "Hi" without the circle.' }
      ]
    },
    {
      id: 'k-fu',
      prompt: 'Fu (Katakana)',
      answer: 'フ',
      hint: '1 stroke',
      strokeCount: 1,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ふ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'ブ', toast: 'That\'s "Bu" with dakuten!\nThe prompt asks for "Fu" without the marks.' },
        { answer: 'プ', toast: 'That\'s "Pu" with handakuten!\nThe prompt asks for "Fu" without the circle.' }
      ]
    },
    {
      id: 'k-he',
      prompt: 'He (Katakana)',
      answer: 'ヘ',
      hint: '1 stroke',
      strokeCount: 1,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'へ', toast: 'That\'s hiragana!\nActually they look the same, but context matters!' },
        { answer: 'ベ', toast: 'That\'s "Be" with dakuten!\nThe prompt asks for "He" without the marks.' },
        { answer: 'ペ', toast: 'That\'s "Pe" with handakuten!\nThe prompt asks for "He" without the circle.' }
      ]
    },
    {
      id: 'k-ho',
      prompt: 'Ho (Katakana)',
      answer: 'ホ',
      hint: '4 strokes',
      strokeCount: 4,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ほ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'ボ', toast: 'That\'s "Bo" with dakuten!\nThe prompt asks for "Ho" without the marks.' },
        { answer: 'ポ', toast: 'That\'s "Po" with handakuten!\nThe prompt asks for "Ho" without the circle.' },
        { answer: 'オ', toast: 'That\'s "O"!\nThis one has no middle vertical stroke.' }
      ]
    },
    {
      id: 'k-ma',
      prompt: 'Ma (Katakana)',
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
      prompt: 'Mi (Katakana)',
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
      prompt: 'Mu (Katakana)',
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
      prompt: 'Me (Katakana)',
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
      prompt: 'Mo (Katakana)',
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
      prompt: 'Ya (Katakana)',
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
      prompt: 'Yu (Katakana)',
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
      prompt: 'Yo (Katakana)',
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
      prompt: 'Ra (Katakana)',
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
      prompt: 'Ri (Katakana)',
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
      prompt: 'Ru (Katakana)',
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
      prompt: 'Re (Katakana)',
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
      prompt: 'Ro (Katakana)',
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
      prompt: 'Wa (Katakana)',
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
      prompt: 'Wo (Katakana)',
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
    {
      id: 'k-ga',
      prompt: 'Ga (Katakana)',
      answer: 'ガ',
      hint: '2 strokes + dakuten',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'が', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'カ', toast: 'That\'s "Ka" without dakuten!\nAdd the two small marks (゛) for "Ga".' }
      ]
    },
    {
      id: 'k-gi',
      prompt: 'Gi (Katakana)',
      answer: 'ギ',
      hint: '3 strokes + dakuten',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ぎ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'キ', toast: 'That\'s "Ki" without dakuten!\nAdd the two small marks (゛) for "Gi".' }
      ]
    },
    {
      id: 'k-gu',
      prompt: 'Gu (Katakana)',
      answer: 'グ',
      hint: '2 strokes + dakuten',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ぐ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'ク', toast: 'That\'s "Ku" without dakuten!\nAdd the two small marks (゛) for "Gu".' }
      ]
    },
    {
      id: 'k-ge',
      prompt: 'Ge (Katakana)',
      answer: 'ゲ',
      hint: '3 strokes + dakuten',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'げ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'ケ', toast: 'That\'s "Ke" without dakuten!\nAdd the two small marks (゛) for "Ge".' }
      ]
    },
    {
      id: 'k-go',
      prompt: 'Go (Katakana)',
      answer: 'ゴ',
      hint: '2 strokes + dakuten',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ご', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'コ', toast: 'That\'s "Ko" without dakuten!\nAdd the two small marks (゛) for "Go".' }
      ]
    },
    {
      id: 'k-za',
      prompt: 'Za (Katakana)',
      answer: 'ザ',
      hint: '3 strokes + dakuten',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ざ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'サ', toast: 'That\'s "Sa" without dakuten!\nAdd the two small marks (゛) for "Za".' }
      ]
    },
    {
      id: 'k-ji',
      prompt: 'Ji (Katakana)',
      answer: 'ジ',
      hint: '3 strokes + dakuten',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'じ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'シ', toast: 'That\'s "Shi" without dakuten!\nAdd the two small marks (゛) for "Ji".' }
      ]
    },
    {
      id: 'k-zu',
      prompt: 'Zu (Katakana)',
      answer: 'ズ',
      hint: '2 strokes + dakuten',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ず', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'ス', toast: 'That\'s "Su" without dakuten!\nAdd the two small marks (゛) for "Zu".' }
      ]
    },
    {
      id: 'k-ze',
      prompt: 'Ze (Katakana)',
      answer: 'ゼ',
      hint: '2 strokes + dakuten',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ぜ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'セ', toast: 'That\'s "Se" without dakuten!\nAdd the two small marks (゛) for "Ze".' }
      ]
    },
    {
      id: 'k-zo',
      prompt: 'Zo (Katakana)',
      answer: 'ゾ',
      hint: '2 strokes + dakuten',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ぞ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'ソ', toast: 'That\'s "So" without dakuten!\nAdd the two small marks (゛) for "Zo".' }
      ]
    },
    {
      id: 'k-da',
      prompt: 'Da (Katakana)',
      answer: 'ダ',
      hint: '3 strokes + dakuten',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'だ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'タ', toast: 'That\'s "Ta" without dakuten!\nAdd the two small marks (゛) for "Da".' }
      ]
    },
    {
      id: 'k-di',
      prompt: 'Di (Katakana)',
      answer: 'ヂ',
      hint: '3 strokes + dakuten',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ぢ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'チ', toast: 'That\'s "Chi" without dakuten!\nAdd the two small marks (゛) for "Di".' },
        { answer: 'ジ', toast: 'That\'s "Ji" (from Shi)!\nThis one comes from "Chi" instead.' }
      ]
    },
    {
      id: 'k-du',
      prompt: 'Du (Katakana)',
      answer: 'ヅ',
      hint: '3 strokes + dakuten',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'づ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'ツ', toast: 'That\'s "Tsu" without dakuten!\nAdd the two small marks (゛) for "Du".' },
        { answer: 'ズ', toast: 'That\'s "Zu" (from Su)!\nThis one comes from "Tsu" instead.' }
      ]
    },
    {
      id: 'k-de',
      prompt: 'De (Katakana)',
      answer: 'デ',
      hint: '3 strokes + dakuten',
      strokeCount: 3,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'で', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'テ', toast: 'That\'s "Te" without dakuten!\nAdd the two small marks (゛) for "De".' }
      ]
    },
    {
      id: 'k-do',
      prompt: 'Do (Katakana)',
      answer: 'ド',
      hint: '2 strokes + dakuten',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ど', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'ト', toast: 'That\'s "To" without dakuten!\nAdd the two small marks (゛) for "Do".' }
      ]
    },
    {
      id: 'k-ba',
      prompt: 'Ba (Katakana)',
      answer: 'バ',
      hint: '2 strokes + dakuten',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ば', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'ハ', toast: 'That\'s "Ha" without dakuten!\nAdd the two small marks (゛) for "Ba".' },
        { answer: 'パ', toast: 'That\'s "Pa" with handakuten!\nUse two marks (゛) not a circle (゜).' }
      ]
    },
    {
      id: 'k-bi',
      prompt: 'Bi (Katakana)',
      answer: 'ビ',
      hint: '2 strokes + dakuten',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'び', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'ヒ', toast: 'That\'s "Hi" without dakuten!\nAdd the two small marks (゛) for "Bi".' },
        { answer: 'ピ', toast: 'That\'s "Pi" with handakuten!\nUse two marks (゛) not a circle (゜).' }
      ]
    },
    {
      id: 'k-bu',
      prompt: 'Bu (Katakana)',
      answer: 'ブ',
      hint: '1 stroke + dakuten',
      strokeCount: 1,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ぶ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'フ', toast: 'That\'s "Fu" without dakuten!\nAdd the two small marks (゛) for "Bu".' },
        { answer: 'プ', toast: 'That\'s "Pu" with handakuten!\nUse two marks (゛) not a circle (゜).' }
      ]
    },
    {
      id: 'k-be',
      prompt: 'Be (Katakana)',
      answer: 'ベ',
      hint: '1 stroke + dakuten',
      strokeCount: 1,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'べ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'ヘ', toast: 'That\'s "He" without dakuten!\nAdd the two small marks (゛) for "Be".' },
        { answer: 'ペ', toast: 'That\'s "Pe" with handakuten!\nUse two marks (゛) not a circle (゜).' }
      ]
    },
    {
      id: 'k-bo',
      prompt: 'Bo (Katakana)',
      answer: 'ボ',
      hint: '4 strokes + dakuten',
      strokeCount: 4,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ぼ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'ホ', toast: 'That\'s "Ho" without dakuten!\nAdd the two small marks (゛) for "Bo".' },
        { answer: 'ポ', toast: 'That\'s "Po" with handakuten!\nUse two marks (゛) not a circle (゜).' }
      ]
    },
    {
      id: 'k-pa',
      prompt: 'Pa (Katakana)',
      answer: 'パ',
      hint: '2 strokes + handakuten',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ぱ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'ハ', toast: 'That\'s "Ha" without handakuten!\nAdd the small circle (゜) for "Pa".' },
        { answer: 'バ', toast: 'That\'s "Ba" with dakuten!\nUse a circle (゜) not two marks (゛).' }
      ]
    },
    {
      id: 'k-pi',
      prompt: 'Pi (Katakana)',
      answer: 'ピ',
      hint: '2 strokes + handakuten',
      strokeCount: 2,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ぴ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'ヒ', toast: 'That\'s "Hi" without handakuten!\nAdd the small circle (゜) for "Pi".' },
        { answer: 'ビ', toast: 'That\'s "Bi" with dakuten!\nUse a circle (゜) not two marks (゛).' }
      ]
    },
    {
      id: 'k-pu',
      prompt: 'Pu (Katakana)',
      answer: 'プ',
      hint: '1 stroke + handakuten',
      strokeCount: 1,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ぷ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'フ', toast: 'That\'s "Fu" without handakuten!\nAdd the small circle (゜) for "Pu".' },
        { answer: 'ブ', toast: 'That\'s "Bu" with dakuten!\nUse a circle (゜) not two marks (゛).' }
      ]
    },
    {
      id: 'k-pe',
      prompt: 'Pe (Katakana)',
      answer: 'ペ',
      hint: '1 stroke + handakuten',
      strokeCount: 1,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ぺ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'ヘ', toast: 'That\'s "He" without handakuten!\nAdd the small circle (゜) for "Pe".' },
        { answer: 'ベ', toast: 'That\'s "Be" with dakuten!\nUse a circle (゜) not two marks (゛).' }
      ]
    },
    {
      id: 'k-po',
      prompt: 'Po (Katakana)',
      answer: 'ポ',
      hint: '4 strokes + handakuten',
      strokeCount: 4,
      stage: 0,
      unlocks: '2026-01-29T12:06:14+00:00',
      befuddlers: [
        { answer: 'ぽ', toast: 'That\'s hiragana!\nThe prompt asks for katakana, which is angular.' },
        { answer: 'ホ', toast: 'That\'s "Ho" without handakuten!\nAdd the small circle (゜) for "Po".' },
        { answer: 'ボ', toast: 'That\'s "Bo" with dakuten!\nUse a circle (゜) not two marks (゛).' }
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

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

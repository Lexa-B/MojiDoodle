import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import initSqlJs, { Database } from 'sql.js';

export interface Befuddler {
  answer: string;
  toast: string;
}

export interface Card {
  id: string;
  prompt: string;
  answer: string;
  hint?: string;
  strokeCount?: number;
  stage: number;
  unlocks: string;
  category: string;
  befuddlers: Befuddler[];
}

export interface Lesson {
  id: string;
  name: string;
  file: string;
  status: 'locked' | 'available' | 'unlocked';
  requires: string[];
  ids?: string[];
}

const DB_NAME = 'mojidoodle-cards';
const DB_VERSION = 1;

// Get base URL for asset paths (handles /MojiDoodle/ on GitHub Pages)
function getBaseUrl(): string {
  const base = document.baseURI || '/';
  return base.endsWith('/') ? base : base + '/';
}

@Injectable({
  providedIn: 'root'
})
export class CardsService {
  private db: Database | null = null;
  private initPromise: Promise<void> | null = null;
  private timetable: Map<number, number> = new Map(); // stage -> minutes

  constructor(private loadingCtrl: LoadingController) {}

  async initialize(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.doInitialize();
    return this.initPromise;
  }

  private async doInitialize(): Promise<void> {
    const baseUrl = getBaseUrl();
    const SQL = await initSqlJs({
      locateFile: (file: string) => `${baseUrl}${file}`
    });

    // Load timetable
    await this.loadTimetable();

    // Try to load from IndexedDB
    const stored = await this.loadFromStorage();

    if (stored) {
      this.db = new SQL.Database(stored);
      console.log('Loaded cards database from storage');
      return;
    }

    // Build from YAML
    const loading = await this.loadingCtrl.create({
      message: 'ちょっと待ってください...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      this.db = new SQL.Database();
      await this.buildDatabase();
      await this.saveToStorage();
      console.log('Built and saved cards database');
    } finally {
      await loading.dismiss();
    }
  }

  private async loadCardManifest(): Promise<Array<{ id: string; category: string; files: string[] }>> {
    const packs: Array<{ id: string; category: string; files: string[] }> = [];

    try {
      const response = await fetch(`${getBaseUrl()}data/cards/manifest.yaml`);
      if (!response.ok) return packs;

      const yaml = await response.text();
      let current: { id: string; category: string; files: string[] } | null = null;
      let inFiles = false;

      for (const line of yaml.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        if (trimmed.startsWith('- id:')) {
          if (current) packs.push(current);
          current = { id: trimmed.split(':')[1].trim(), category: '', files: [] };
          inFiles = false;
          continue;
        }

        if (!current) continue;

        if (trimmed.startsWith('category:')) {
          current.category = trimmed.split(':')[1].trim();
        } else if (trimmed === 'files:') {
          inFiles = true;
        } else if (inFiles && trimmed.startsWith('- ')) {
          current.files.push(trimmed.slice(2).trim());
        } else if (!trimmed.startsWith('-') && trimmed.includes(':')) {
          inFiles = false;
        }
      }

      if (current) packs.push(current);
      console.log(`Loaded ${packs.length} card packs from manifest`);
    } catch (err) {
      console.warn('Failed to load card manifest:', err);
    }

    return packs;
  }

  private async loadTimetable(): Promise<void> {
    try {
      const response = await fetch(`${getBaseUrl()}data/timetable.yaml`);
      if (!response.ok) return;

      const yaml = await response.text();
      const lines = yaml.split('\n');
      let currentStage: number | null = null;

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const stageMatch = trimmed.match(/^-?\s*stage:\s*(\d+)/);
        if (stageMatch) {
          currentStage = parseInt(stageMatch[1], 10);
          continue;
        }

        const minutesMatch = trimmed.match(/^minutes:\s*(\d+)/);
        if (minutesMatch && currentStage !== null) {
          this.timetable.set(currentStage, parseInt(minutesMatch[1], 10));
          currentStage = null;
        }
      }

      console.log(`Loaded ${this.timetable.size} timetable entries`);
    } catch (err) {
      console.warn('Failed to load timetable:', err);
    }
  }

  private async buildDatabase(): Promise<void> {
    if (!this.db) return;

    // Create tables
    this.db.run(`
      CREATE TABLE cards (
        id TEXT PRIMARY KEY,
        prompt TEXT NOT NULL,
        answer TEXT NOT NULL,
        hint TEXT,
        stroke_count INTEGER,
        stage INTEGER NOT NULL DEFAULT 0,
        unlocks TEXT NOT NULL,
        category TEXT NOT NULL
      );

      CREATE TABLE befuddlers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        card_id TEXT NOT NULL,
        answer TEXT NOT NULL,
        toast TEXT NOT NULL,
        FOREIGN KEY (card_id) REFERENCES cards(id)
      );

      CREATE TABLE lessons (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'locked',
        original_status TEXT NOT NULL DEFAULT 'locked',
        reset_by TEXT
      );

      CREATE TABLE lesson_cards (
        lesson_id TEXT NOT NULL,
        card_id TEXT NOT NULL,
        PRIMARY KEY (lesson_id, card_id),
        FOREIGN KEY (lesson_id) REFERENCES lessons(id),
        FOREIGN KEY (card_id) REFERENCES cards(id)
      );

      CREATE TABLE lesson_requires (
        lesson_id TEXT NOT NULL,
        required_lesson_id TEXT NOT NULL,
        PRIMARY KEY (lesson_id, required_lesson_id),
        FOREIGN KEY (lesson_id) REFERENCES lessons(id),
        FOREIGN KEY (required_lesson_id) REFERENCES lessons(id)
      );

      CREATE TABLE lesson_supercedes (
        lesson_id TEXT NOT NULL,
        superceded_lesson_id TEXT NOT NULL,
        PRIMARY KEY (lesson_id, superceded_lesson_id),
        FOREIGN KEY (lesson_id) REFERENCES lessons(id),
        FOREIGN KEY (superceded_lesson_id) REFERENCES lessons(id)
      );

      CREATE INDEX idx_cards_stage ON cards(stage);
      CREATE INDEX idx_cards_answer ON cards(answer);
      CREATE INDEX idx_cards_category ON cards(category);
      CREATE INDEX idx_befuddlers_card ON befuddlers(card_id);
      CREATE INDEX idx_lesson_cards_lesson ON lesson_cards(lesson_id);
    `);

    // Load card packs from manifest
    const packs = await this.loadCardManifest();

    for (const pack of packs) {
      for (const file of pack.files) {
        try {
          const response = await fetch(`${getBaseUrl()}data/cards/${file}`);
          if (!response.ok) continue;

          const yaml = await response.text();
          const cards = this.parseYaml(yaml);

          for (const card of cards) {
            if (!card.id || !card.prompt || !card.answer) continue;

            this.db.run(
              `INSERT INTO cards (id, prompt, answer, hint, stroke_count, stage, unlocks, category)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [card.id, card.prompt, card.answer, card.hint ?? null,
               card.strokeCount ?? null, card.stage ?? 0, card.unlocks ?? '', pack.category]
            );

            for (const b of card.befuddlers ?? []) {
              this.db.run(
                `INSERT INTO befuddlers (card_id, answer, toast) VALUES (?, ?, ?)`,
                [card.id, b.answer, b.toast]
              );
            }
          }

          console.log(`Loaded ${cards.length} cards from ${pack.id}/${file}`);
        } catch (err) {
          console.warn(`Failed to load ${file}:`, err);
        }
      }
    }

    // Load lessons
    await this.buildLessons();
  }

  private async loadLessonManifest(): Promise<Array<{ id: string; category: string; files: string[] }>> {
    const packs: Array<{ id: string; category: string; files: string[] }> = [];

    try {
      const response = await fetch(`${getBaseUrl()}data/lessons/manifest.yaml`);
      if (!response.ok) return packs;

      const yaml = await response.text();
      let current: { id: string; category: string; files: string[] } | null = null;
      let inFiles = false;

      for (const line of yaml.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        if (trimmed.startsWith('- id:')) {
          if (current) packs.push(current);
          current = { id: trimmed.split(':')[1].trim(), category: '', files: [] };
          inFiles = false;
          continue;
        }

        if (!current) continue;

        if (trimmed.startsWith('category:')) {
          current.category = trimmed.split(':')[1].trim();
        } else if (trimmed === 'files:') {
          inFiles = true;
        } else if (inFiles && trimmed.startsWith('- ')) {
          current.files.push(trimmed.slice(2).trim());
        } else if (!trimmed.startsWith('-') && trimmed.includes(':')) {
          inFiles = false;
        }
      }

      if (current) packs.push(current);
      console.log(`Loaded ${packs.length} lesson packs from manifest`);
    } catch (err) {
      console.warn('Failed to load lesson manifest:', err);
    }

    return packs;
  }

  private async buildLessons(): Promise<void> {
    if (!this.db) return;

    try {
      // Load lesson packs from manifest
      const packs = await this.loadLessonManifest();

      for (const pack of packs) {
        for (const file of pack.files) {
          try {
            const response = await fetch(`${getBaseUrl()}data/lessons/${file}`);
            if (!response.ok) continue;

            const yaml = await response.text();
            const lessonData = this.parseLessonFile(yaml);

            // Insert lesson (use pack.category as reset_by)
            this.db.run(
              'INSERT INTO lessons (id, name, status, original_status, reset_by) VALUES (?, ?, ?, ?, ?)',
              [lessonData.id, lessonData.name, lessonData.status, lessonData.status, pack.category]
            );

            // Insert requires
            for (const reqId of lessonData.requires) {
              this.db.run(
                'INSERT INTO lesson_requires (lesson_id, required_lesson_id) VALUES (?, ?)',
                [lessonData.id, reqId]
              );
            }

            // Insert card IDs
            for (const cardId of lessonData.ids) {
              this.db.run(
                'INSERT OR IGNORE INTO lesson_cards (lesson_id, card_id) VALUES (?, ?)',
                [lessonData.id, cardId]
              );
            }

            // Insert supercedes relationships
            for (const supercededId of lessonData.supercedes) {
              this.db.run(
                'INSERT OR IGNORE INTO lesson_supercedes (lesson_id, superceded_lesson_id) VALUES (?, ?)',
                [lessonData.id, supercededId]
              );
            }

            console.log(`Loaded lesson ${lessonData.id} with ${lessonData.ids.length} cards`);
          } catch (err) {
            console.warn(`Failed to load lesson ${file}:`, err);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load lessons:', err);
    }
  }

  private parseLessonFile(yaml: string): { id: string; name: string; status: string; requires: string[]; ids: string[]; supercedes: string[] } {
    let id = '';
    let name = '';
    let status = 'locked';
    const requires: string[] = [];
    const ids: string[] = [];
    const supercedes: string[] = [];
    let currentSection: 'none' | 'requires' | 'ids' | 'supercedes' = 'none';

    for (const line of yaml.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      // Parse top-level scalar fields
      const propMatch = trimmed.match(/^([\w-]+):\s*(.*)$/);
      if (propMatch && !trimmed.startsWith('-')) {
        const [, key, value] = propMatch;
        if (key === 'id') {
          id = value;
          currentSection = 'none';
        } else if (key === 'name') {
          name = value.replace(/^["']|["']$/g, '');
          currentSection = 'none';
        } else if (key === 'status') {
          status = value;
          currentSection = 'none';
        } else if (key === 'requires') {
          currentSection = value === '[]' ? 'none' : 'requires';
        } else if (key === 'ids') {
          currentSection = 'ids';
        } else if (key === 'supercedes') {
          currentSection = value === '[]' ? 'none' : 'supercedes';
        }
        continue;
      }

      if (trimmed.startsWith('- ')) {
        const value = trimmed.slice(2).trim();
        if (currentSection === 'requires') {
          requires.push(value);
        } else if (currentSection === 'ids') {
          ids.push(value);
        } else if (currentSection === 'supercedes') {
          supercedes.push(value);
        }
      }
    }

    return { id, name, status, requires, ids, supercedes };
  }

  private parseYaml(content: string): Partial<Card>[] {
    const cards: Partial<Card>[] = [];
    let currentCard: Partial<Card> | null = null;
    let currentBefuddler: Befuddler | null = null;
    let inBefuddlers = false;

    const lines = content.split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;

      const indent = line.search(/\S/);
      const trimmed = line.trim();

      // New card
      if (indent === 0 && trimmed.startsWith('- ')) {
        if (currentBefuddler && currentCard) {
          currentCard.befuddlers = currentCard.befuddlers || [];
          currentCard.befuddlers.push(currentBefuddler);
        }
        if (currentCard) cards.push(currentCard);

        currentCard = { befuddlers: [] };
        currentBefuddler = null;
        inBefuddlers = false;

        const match = trimmed.match(/^- (\w+): (.+)$/);
        if (match) {
          (currentCard as any)[match[1]] = this.parseValue(match[2]);
        }
        continue;
      }

      // Card property
      if (indent === 2 && currentCard && !trimmed.startsWith('-')) {
        const match = trimmed.match(/^(\w+): (.+)$/);
        if (match) {
          const key = match[1];
          const value = match[2];

          if (key === 'befuddlers' && value === '[]') {
            currentCard.befuddlers = [];
            inBefuddlers = false;
          } else if (key === 'befuddlers') {
            inBefuddlers = true;
          } else {
            (currentCard as any)[key] = this.parseValue(value);
          }
        } else if (trimmed === 'befuddlers:') {
          inBefuddlers = true;
        }
        continue;
      }

      // New befuddler
      if (indent === 4 && trimmed.startsWith('- ') && inBefuddlers && currentCard) {
        if (currentBefuddler) {
          currentCard.befuddlers = currentCard.befuddlers || [];
          currentCard.befuddlers.push(currentBefuddler);
        }
        currentBefuddler = { answer: '', toast: '' };

        const match = trimmed.match(/^- (\w+): (.+)$/);
        if (match) {
          (currentBefuddler as any)[match[1]] = this.parseValue(match[2]);
        }
        continue;
      }

      // Befuddler property
      if (indent === 6 && currentBefuddler) {
        const match = trimmed.match(/^(\w+): (.+)$/);
        if (match) {
          (currentBefuddler as any)[match[1]] = this.parseValue(match[2]);
        }
        continue;
      }
    }

    // Final items
    if (currentBefuddler && currentCard) {
      currentCard.befuddlers = currentCard.befuddlers || [];
      currentCard.befuddlers.push(currentBefuddler);
    }
    if (currentCard) cards.push(currentCard);

    return cards;
  }

  private parseValue(val: string): string | number {
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
      val = val.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }
    if (/^-?\d+$/.test(val)) {
      return parseInt(val, 10);
    }
    return val;
  }

  // IndexedDB storage
  private openIDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('data')) {
          db.createObjectStore('data');
        }
      };
    });
  }

  private async loadFromStorage(): Promise<Uint8Array | null> {
    try {
      const idb = await this.openIDB();
      return new Promise((resolve) => {
        const tx = idb.transaction('data', 'readonly');
        const store = tx.objectStore('data');
        const request = store.get('db');
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  private async saveToStorage(): Promise<void> {
    if (!this.db) return;
    try {
      const data = this.db.export();
      const idb = await this.openIDB();
      return new Promise((resolve, reject) => {
        const tx = idb.transaction('data', 'readwrite');
        const store = tx.objectStore('data');
        const request = store.put(data, 'db');
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error('Failed to save db to storage:', err);
    }
  }

  // Query methods
  private queryOne<T>(sql: string, params: any[] = []): T | null {
    if (!this.db) return null;
    const result = this.db.exec(sql, params);
    if (result.length === 0 || result[0].values.length === 0) return null;

    const columns = result[0].columns;
    const row = result[0].values[0];
    const obj: any = {};
    columns.forEach((col: string, i: number) => obj[col] = row[i]);
    return obj;
  }

  private queryAll<T>(sql: string, params: any[] = []): T[] {
    if (!this.db) return [];
    const result = this.db.exec(sql, params);
    if (result.length === 0) return [];

    const columns = result[0].columns;
    return result[0].values.map((row: any[]) => {
      const obj: any = {};
      columns.forEach((col: string, i: number) => obj[col] = row[i]);
      return obj;
    });
  }

  private attachBefuddlers(card: any): Card {
    const befuddlers = this.queryAll<Befuddler>(
      'SELECT answer, toast FROM befuddlers WHERE card_id = ?',
      [card.id]
    );
    return {
      ...card,
      strokeCount: card.stroke_count,
      befuddlers
    };
  }

  // Public API
  getAllCards(): Card[] {
    const cards = this.queryAll<any>('SELECT * FROM cards');
    return cards.map(c => this.attachBefuddlers(c));
  }

  getCardById(id: string): Card | undefined {
    const card = this.queryOne<any>('SELECT * FROM cards WHERE id = ?', [id]);
    if (!card) return undefined;
    return this.attachBefuddlers(card);
  }

  getCardsByStage(stage: number): Card[] {
    const cards = this.queryAll<any>('SELECT * FROM cards WHERE stage = ?', [stage]);
    return cards.map(c => this.attachBefuddlers(c));
  }

  getCardsByCategory(category: string): Card[] {
    const cards = this.queryAll<any>('SELECT * FROM cards WHERE category = ?', [category]);
    return cards.map(c => this.attachBefuddlers(c));
  }

  getAvailableCards(): Card[] {
    const cards = this.queryAll<any>('SELECT * FROM cards WHERE stage >= 0');
    return cards.map(c => this.attachBefuddlers(c));
  }

  getUnlockedCards(): Card[] {
    const now = new Date().toISOString();
    const cards = this.queryAll<any>(
      'SELECT * FROM cards WHERE stage >= 0 AND unlocks <= ?',
      [now]
    );
    return cards.map(c => this.attachBefuddlers(c));
  }

  getRandomUnlockedCard(): Card | undefined {
    const now = new Date().toISOString();
    const card = this.queryOne<any>(
      'SELECT * FROM cards WHERE stage >= 0 AND unlocks <= ? ORDER BY RANDOM() LIMIT 1',
      [now]
    );
    if (!card) return undefined;
    return this.attachBefuddlers(card);
  }

  getCardByAnswer(answer: string): Card | undefined {
    const card = this.queryOne<any>('SELECT * FROM cards WHERE answer = ?', [answer]);
    if (!card) return undefined;
    return this.attachBefuddlers(card);
  }

  hasUnavailableCards(category: string): boolean {
    const result = this.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM cards WHERE category = ? AND stage = -1',
      [category]
    );
    return (result?.count ?? 0) > 0;
  }

  unlockAllInCategory(category: string): void {
    if (!this.db) return;
    const now = new Date().toISOString();
    this.db.run(
      'UPDATE cards SET stage = 0, unlocks = ? WHERE category = ? AND stage = -1',
      [now, category]
    );
    this.saveToStorage();
  }

  // Lessons API
  getAvailableLessons(): Lesson[] {
    // Get available lessons that are NOT superceded by an unlocked lesson
    const rows = this.queryAll<{ id: string; name: string; status: string }>(
      `SELECT id, name, status FROM lessons
       WHERE status = 'available'
       AND id NOT IN (
         SELECT superceded_lesson_id FROM lesson_supercedes ls
         JOIN lessons l ON ls.lesson_id = l.id
         WHERE l.status = 'unlocked'
       )`
    );
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      file: '',
      status: r.status as Lesson['status'],
      requires: []
    }));
  }

  getAllLessons(): Lesson[] {
    const rows = this.queryAll<{ id: string; name: string; status: string }>(
      'SELECT id, name, status FROM lessons'
    );
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      file: '',
      status: r.status as Lesson['status'],
      requires: []
    }));
  }

  unlockLesson(lessonId: string): void {
    if (!this.db) return;

    // Check lesson exists and is available
    const lesson = this.queryOne<{ status: string }>(
      'SELECT status FROM lessons WHERE id = ?',
      [lessonId]
    );
    if (!lesson || lesson.status !== 'available') return;

    // Get card IDs for this lesson
    const cardRows = this.queryAll<{ card_id: string }>(
      'SELECT card_id FROM lesson_cards WHERE lesson_id = ?',
      [lessonId]
    );

    // Unlock all cards in the lesson
    const now = new Date().toISOString();
    for (const row of cardRows) {
      this.db.run(
        'UPDATE cards SET stage = 0, unlocks = ? WHERE id = ? AND stage = -1',
        [now, row.card_id]
      );
    }

    // Mark lesson as unlocked
    this.db.run(
      'UPDATE lessons SET status = ? WHERE id = ?',
      ['unlocked', lessonId]
    );

    this.saveToStorage();
  }

  // Check if a lesson is completed (all cards have stage > 0)
  isLessonCompleted(lessonId: string): boolean {
    const result = this.queryOne<{ incomplete: number }>(
      `SELECT COUNT(*) as incomplete FROM lesson_cards lc
       JOIN cards c ON lc.card_id = c.id
       WHERE lc.lesson_id = ? AND c.stage <= 0`,
      [lessonId]
    );
    return (result?.incomplete ?? 1) === 0;
  }

  // Update locked lessons to available if their prerequisites are met
  updateLessonStatuses(): void {
    if (!this.db) return;

    // Get all locked lessons
    const lockedLessons = this.queryAll<{ id: string }>(
      'SELECT id FROM lessons WHERE status = ?',
      ['locked']
    );

    for (const lesson of lockedLessons) {
      // Get all required lessons for this lesson
      const requires = this.queryAll<{ required_lesson_id: string }>(
        'SELECT required_lesson_id FROM lesson_requires WHERE lesson_id = ?',
        [lesson.id]
      );

      // Check if all required lessons are completed
      const allCompleted = requires.every(req => this.isLessonCompleted(req.required_lesson_id));

      if (allCompleted && requires.length > 0) {
        this.db.run(
          'UPDATE lessons SET status = ? WHERE id = ?',
          ['available', lesson.id]
        );
        console.log(`Lesson ${lesson.id} is now available`);
      }
    }

    this.saveToStorage();
  }

  setCardStage(id: string, stage: number): void {
    if (!this.db) return;
    this.db.run('UPDATE cards SET stage = ? WHERE id = ?', [stage, id]);
    this.saveToStorage(); // Persist change
  }

  advanceCard(id: string): void {
    if (!this.db) return;

    const card = this.queryOne<{ stage: number }>('SELECT stage FROM cards WHERE id = ?', [id]);
    if (!card) return;

    const newStage = Math.min(card.stage + 1, 15); // Cap at stage 15
    const minutes = this.timetable.get(newStage) ?? 15; // Default to 15 min if not found
    const unlocks = new Date(Date.now() + minutes * 60 * 1000).toISOString();

    this.db.run('UPDATE cards SET stage = ?, unlocks = ? WHERE id = ?', [newStage, unlocks, id]);

    // Check if this unlocks any new lessons
    this.updateLessonStatuses();
  }

  getStrokeCount(answer: string): number {
    const card = this.queryOne<any>('SELECT stroke_count FROM cards WHERE answer = ?', [answer]);
    return card?.stroke_count ?? 0;
  }

  // Get upcoming unlocks grouped by hour for the next N hours
  getUpcomingUnlocksByHour(hours: number = 48): { hour: number; count: number; label: string }[] {
    const now = new Date();
    const result: { hour: number; count: number; label: string }[] = [];

    // Get all cards with stage >= 0 that unlock in the future (within the time window)
    const endTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
    const cards = this.queryAll<{ unlocks: string }>(
      'SELECT unlocks FROM cards WHERE stage >= 0 AND unlocks > ? AND unlocks <= ?',
      [now.toISOString(), endTime.toISOString()]
    );

    // Group by hour offset from now
    const hourCounts = new Map<number, number>();
    for (const card of cards) {
      const unlockTime = new Date(card.unlocks);
      const hourOffset = Math.floor((unlockTime.getTime() - now.getTime()) / (60 * 60 * 1000));
      if (hourOffset >= 0 && hourOffset < hours) {
        hourCounts.set(hourOffset, (hourCounts.get(hourOffset) ?? 0) + 1);
      }
    }

    // Build result array for all hours (including zeros)
    for (let h = 0; h < hours; h++) {
      const futureDate = new Date(now.getTime() + h * 60 * 60 * 1000);
      const hourLabel = futureDate.getHours().toString().padStart(2, '0') + ':00';
      result.push({
        hour: h,
        count: hourCounts.get(h) ?? 0,
        label: hourLabel
      });
    }

    return result;
  }

  // Reset all cards in a category to their original YAML values
  async resetCategory(category: string): Promise<void> {
    if (!this.db) return;

    try {
      // Find the pack with this category from the manifest
      const packs = await this.loadCardManifest();
      const pack = packs.find(p => p.category === category);

      if (pack) {
        // Load all files for this pack and reset their cards
        for (const file of pack.files) {
          const response = await fetch(`${getBaseUrl()}data/cards/${file}`);
          if (!response.ok) continue;

          const yaml = await response.text();
          const cards = this.parseYaml(yaml);

          for (const card of cards) {
            if (!card.id) continue;
            const stage = card.stage ?? 0;
            this.db.run('UPDATE cards SET stage = ? WHERE id = ?', [stage, card.id]);
          }
        }
      }

      // Reset lessons that belong to this category
      this.db.run(
        'UPDATE lessons SET status = original_status WHERE reset_by = ?',
        [category]
      );

      await this.saveToStorage();
    } catch (err) {
      console.error(`Failed to reset category ${category}:`, err);
    }
  }

  // Force rebuild (for updates)
  async rebuild(): Promise<void> {
    // Clear storage
    try {
      const idb = await this.openIDB();
      const tx = idb.transaction('data', 'readwrite');
      tx.objectStore('data').delete('db');
    } catch {}

    this.db = null;
    this.initPromise = null;
    await this.initialize();
  }
}

import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import initSqlJs, { Database } from 'sql.js';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Befuddler {
  answers: string[];
  toast: string;
}

export interface Card {
  id: string;
  prompt: string;
  answers: string[];
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
  private stages: Map<number, number> = new Map(); // stage -> minutes
  private stageColors: Map<number, string> = new Map(); // stage -> color

  // Polling for card availability
  private availableCardCount$ = new BehaviorSubject<number>(0);
  private pollingIntervalId: ReturnType<typeof setInterval> | null = null;
  private visibilityHandler: (() => void) | null = null;
  private readonly POLLING_INTERVAL_MS = 30000; // 30 seconds

  constructor(private loadingCtrl: LoadingController) {}

  /** Observable that emits the count of currently available cards */
  get cardAvailability$(): Observable<number> {
    return this.availableCardCount$.asObservable();
  }

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

    // Try to load from IndexedDB
    const stored = await this.loadFromStorage();

    if (stored) {
      this.db = new SQL.Database(stored);
      // Load stages for color lookups
      await this.loadStagesFromBundle();
      console.log('Loaded cards database from storage');
      this.startPolling();
      return;
    }

    // Build from pre-compiled bundle (much faster than individual YAML files)
    const loading = await this.loadingCtrl.create({
      message: 'ちょっと待ってください...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      this.db = new SQL.Database();
      await this.buildFromBundle();
      await this.saveToStorage();
      console.log('Built and saved cards database');
      this.startPolling();
    } finally {
      await loading.dismiss();
    }
  }

  private async buildFromBundle(): Promise<void> {
    if (!this.db) return;

    // Fetch the pre-compiled bundle (single request instead of 70+)
    const response = await fetch(`${getBaseUrl()}data/bundle.json`);
    if (!response.ok) {
      console.error('Failed to load data bundle, falling back to YAML');
      await this.loadStages();
      await this.buildDatabase();
      return;
    }

    const bundle = await response.json();

    // Load stages
    for (const s of bundle.stages) {
      this.stages.set(s.stage, s.minutes);
      this.stageColors.set(s.stage, s.color);
    }
    console.log(`Loaded ${bundle.stages.length} stages from bundle`);

    // Create tables
    // Note: answers and befuddler answers are stored as JSON arrays
    this.db.run(`
      CREATE TABLE cards (
        id TEXT PRIMARY KEY,
        prompt TEXT NOT NULL,
        answers TEXT NOT NULL,
        hint TEXT,
        stroke_count INTEGER,
        stage INTEGER NOT NULL DEFAULT 0,
        unlocks TEXT NOT NULL,
        category TEXT NOT NULL
      );

      CREATE TABLE befuddlers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        card_id TEXT NOT NULL,
        answers TEXT NOT NULL,
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
      CREATE INDEX idx_cards_category ON cards(category);
      CREATE INDEX idx_befuddlers_card ON befuddlers(card_id);
      CREATE INDEX idx_lesson_cards_lesson ON lesson_cards(lesson_id);
    `);

    // Insert all cards
    for (const card of bundle.cards) {
      if (!card.id || !card.prompt || !card.answers) continue;

      this.db.run(
        `INSERT INTO cards (id, prompt, answers, hint, stroke_count, stage, unlocks, category)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [card.id, card.prompt, JSON.stringify(card.answers), card.hint ?? null,
         card.strokeCount ?? null, card.stage ?? 0, card.unlocks ?? '', card.category]
      );

      for (const b of card.befuddlers ?? []) {
        this.db.run(
          `INSERT INTO befuddlers (card_id, answers, toast) VALUES (?, ?, ?)`,
          [card.id, JSON.stringify(b.answers), b.toast]
        );
      }
    }
    console.log(`Loaded ${bundle.cards.length} cards from bundle`);

    // Insert all lessons
    for (const lesson of bundle.lessons) {
      this.db.run(
        'INSERT INTO lessons (id, name, status, original_status, reset_by) VALUES (?, ?, ?, ?, ?)',
        [lesson.id, lesson.name, lesson.status, lesson.status, lesson.category]
      );

      for (const reqId of lesson.requires) {
        this.db.run(
          'INSERT INTO lesson_requires (lesson_id, required_lesson_id) VALUES (?, ?)',
          [lesson.id, reqId]
        );
      }

      for (const cardId of lesson.ids) {
        this.db.run(
          'INSERT OR IGNORE INTO lesson_cards (lesson_id, card_id) VALUES (?, ?)',
          [lesson.id, cardId]
        );
      }

      for (const supercededId of lesson.supercedes) {
        this.db.run(
          'INSERT OR IGNORE INTO lesson_supercedes (lesson_id, superceded_lesson_id) VALUES (?, ?)',
          [lesson.id, supercededId]
        );
      }
    }
    console.log(`Loaded ${bundle.lessons.length} lessons from bundle`);
  }

  private async loadStagesFromBundle(): Promise<void> {
    try {
      const response = await fetch(`${getBaseUrl()}data/bundle.json`);
      if (!response.ok) return;

      const bundle = await response.json();
      for (const s of bundle.stages) {
        this.stages.set(s.stage, s.minutes);
        this.stageColors.set(s.stage, s.color);
      }
    } catch (err) {
      console.warn('Failed to load stages from bundle:', err);
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

  private async loadStages(): Promise<void> {
    try {
      const response = await fetch(`${getBaseUrl()}data/stages.yaml`);
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

        if (currentStage !== null) {
          const minutesMatch = trimmed.match(/^minutes:\s*(\d+)/);
          if (minutesMatch) {
            this.stages.set(currentStage, parseInt(minutesMatch[1], 10));
          }

          const colorMatch = trimmed.match(/^color:\s*"?(#[0-9A-Fa-f]{6})"?/);
          if (colorMatch) {
            this.stageColors.set(currentStage, colorMatch[1]);
          }
        }
      }

      console.log(`Loaded ${this.stages.size} stage entries`);
    } catch (err) {
      console.warn('Failed to load stages:', err);
    }
  }

  private async buildDatabase(): Promise<void> {
    if (!this.db) return;

    // Create tables
    // Note: answers and befuddler answers are stored as JSON arrays
    this.db.run(`
      CREATE TABLE cards (
        id TEXT PRIMARY KEY,
        prompt TEXT NOT NULL,
        answers TEXT NOT NULL,
        hint TEXT,
        stroke_count INTEGER,
        stage INTEGER NOT NULL DEFAULT 0,
        unlocks TEXT NOT NULL,
        category TEXT NOT NULL
      );

      CREATE TABLE befuddlers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        card_id TEXT NOT NULL,
        answers TEXT NOT NULL,
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
            if (!card.id || !card.prompt || !card.answers) continue;

            this.db.run(
              `INSERT INTO cards (id, prompt, answers, hint, stroke_count, stage, unlocks, category)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [card.id, card.prompt, JSON.stringify(card.answers), card.hint ?? null,
               card.strokeCount ?? null, card.stage ?? 0, card.unlocks ?? '', pack.category]
            );

            for (const b of card.befuddlers ?? []) {
              this.db.run(
                `INSERT INTO befuddlers (card_id, answers, toast) VALUES (?, ?, ?)`,
                [card.id, JSON.stringify(b.answers), b.toast]
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
    let inAnswers = false;
    let inBefuddlerAnswers = false;

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

        currentCard = { befuddlers: [], answers: [] };
        currentBefuddler = null;
        inBefuddlers = false;
        inAnswers = false;
        inBefuddlerAnswers = false;

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
            inAnswers = false;
          } else if (key === 'befuddlers') {
            inBefuddlers = true;
            inAnswers = false;
          } else if (key === 'answers' && value === '[]') {
            currentCard.answers = [];
            inAnswers = false;
          } else {
            (currentCard as any)[key] = this.parseValue(value);
            inAnswers = false;
          }
        } else if (trimmed === 'befuddlers:') {
          inBefuddlers = true;
          inAnswers = false;
        } else if (trimmed === 'answers:') {
          inAnswers = true;
          currentCard.answers = [];
        }
        continue;
      }

      // Card answers list item
      if (indent === 4 && trimmed.startsWith('- ') && inAnswers && currentCard && !inBefuddlers) {
        const value = trimmed.slice(2).trim();
        currentCard.answers = currentCard.answers || [];
        currentCard.answers.push(this.parseValue(value) as string);
        continue;
      }

      // New befuddler
      if (indent === 4 && trimmed.startsWith('- ') && inBefuddlers && currentCard && !inAnswers) {
        if (currentBefuddler) {
          currentCard.befuddlers = currentCard.befuddlers || [];
          currentCard.befuddlers.push(currentBefuddler);
        }
        currentBefuddler = { answers: [], toast: '' };
        inBefuddlerAnswers = false;

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
          const key = match[1];
          if (key === 'answers' && match[2] === '[]') {
            currentBefuddler.answers = [];
            inBefuddlerAnswers = false;
          } else {
            (currentBefuddler as any)[key] = this.parseValue(match[2]);
            inBefuddlerAnswers = false;
          }
        } else if (trimmed === 'answers:') {
          inBefuddlerAnswers = true;
          currentBefuddler.answers = [];
        }
        continue;
      }

      // Befuddler answers list item
      if (indent === 8 && trimmed.startsWith('- ') && inBefuddlerAnswers && currentBefuddler) {
        const value = trimmed.slice(2).trim();
        currentBefuddler.answers = currentBefuddler.answers || [];
        currentBefuddler.answers.push(this.parseValue(value) as string);
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

  async hasStoredData(): Promise<boolean> {
    const data = await this.loadFromStorage();
    return data !== null;
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
    const rawBefuddlers = this.queryAll<{ answers: string; toast: string }>(
      'SELECT answers, toast FROM befuddlers WHERE card_id = ?',
      [card.id]
    );
    // Parse JSON arrays for both card answers and befuddler answers
    const befuddlers: Befuddler[] = rawBefuddlers.map(b => ({
      answers: JSON.parse(b.answers),
      toast: b.toast
    }));
    return {
      ...card,
      answers: JSON.parse(card.answers),
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
    // Search for cards where the answers array contains the given answer
    // Using LIKE since SQLite doesn't have native JSON array search
    const card = this.queryOne<any>(
      `SELECT * FROM cards WHERE answers LIKE ?`,
      [`%"${answer}"%`]
    );
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

  // Stage colors
  getStageColor(stage: number): string {
    return this.stageColors.get(stage) ?? '#FFFFFF';
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

  // Check if a lesson is completed (all cards have stage >= 5)
  isLessonCompleted(lessonId: string): boolean {
    const result = this.queryOne<{ incomplete: number }>(
      `SELECT COUNT(*) as incomplete FROM lesson_cards lc
       JOIN cards c ON lc.card_id = c.id
       WHERE lc.lesson_id = ? AND c.stage < 5`,
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
    const minutes = this.stages.get(newStage) ?? 15; // Default to 15 min if not found
    const unlocks = new Date(Date.now() + minutes * 60 * 1000).toISOString();

    this.db.run('UPDATE cards SET stage = ?, unlocks = ? WHERE id = ?', [newStage, unlocks, id]);

    // Check if this unlocks any new lessons
    this.updateLessonStatuses();
  }

  getStrokeCount(answer: string): number {
    // Search for cards where the answers array contains the given answer
    const card = this.queryOne<any>(
      `SELECT stroke_count FROM cards WHERE answers LIKE ?`,
      [`%"${answer}"%`]
    );
    return card?.stroke_count ?? 0;
  }

  // Get upcoming unlocks grouped by hour for the next N hours
  getUpcomingUnlocksByHour(hours: number = 48): { hour: number; count: number; segments: { stage: number; count: number; color: string }[]; label: string }[] {
    const now = new Date();
    const result: { hour: number; count: number; segments: { stage: number; count: number; color: string }[]; label: string }[] = [];

    // Get all cards with stage >= 0 that unlock in the future (within the time window)
    const endTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
    const cards = this.queryAll<{ unlocks: string; stage: number }>(
      'SELECT unlocks, stage FROM cards WHERE stage >= 0 AND unlocks > ? AND unlocks <= ?',
      [now.toISOString(), endTime.toISOString()]
    );

    // Group by hour offset and stage
    const hourStageCounts = new Map<number, Map<number, number>>();
    for (const card of cards) {
      const unlockTime = new Date(card.unlocks);
      const hourOffset = Math.floor((unlockTime.getTime() - now.getTime()) / (60 * 60 * 1000));
      if (hourOffset >= 0 && hourOffset < hours) {
        if (!hourStageCounts.has(hourOffset)) {
          hourStageCounts.set(hourOffset, new Map());
        }
        const stageCounts = hourStageCounts.get(hourOffset)!;
        stageCounts.set(card.stage, (stageCounts.get(card.stage) ?? 0) + 1);
      }
    }

    // Build result array for all hours (including zeros)
    for (let h = 0; h < hours; h++) {
      const futureDate = new Date(now.getTime() + h * 60 * 60 * 1000);
      const hourLabel = futureDate.getHours().toString().padStart(2, '0') + ':00';
      const stageCounts = hourStageCounts.get(h);
      const segments: { stage: number; count: number; color: string }[] = [];
      let total = 0;

      if (stageCounts) {
        // Sort by stage ascending so lower stages are at the bottom
        const sortedStages = Array.from(stageCounts.keys()).sort((a, b) => a - b);
        for (const stage of sortedStages) {
          const count = stageCounts.get(stage)!;
          segments.push({ stage, count, color: this.getStageColor(stage) });
          total += count;
        }
      }

      result.push({
        hour: h,
        count: total,
        segments,
        label: hourLabel
      });
    }

    return result;
  }

  // Reset all cards in a category to their original values
  async resetCategory(category: string): Promise<void> {
    if (!this.db) return;

    try {
      // Load bundle and find cards in this category
      const response = await fetch(`${getBaseUrl()}data/bundle.json`);
      if (response.ok) {
        const bundle = await response.json();
        for (const card of bundle.cards) {
          if (card.category === category && card.id) {
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

    this.stopPolling();
    this.db = null;
    this.initPromise = null;
    await this.initialize();
  }

  // Polling for card availability
  /** Start background polling for available cards (every 30 seconds) */
  private startPolling(): void {
    // Initial check
    this.checkAvailableCards();

    // Set up interval polling
    if (this.pollingIntervalId === null) {
      this.pollingIntervalId = setInterval(() => {
        if (document.visibilityState === 'visible') {
          this.checkAvailableCards();
        }
      }, this.POLLING_INTERVAL_MS);
    }

    // Set up visibility change handler
    if (this.visibilityHandler === null) {
      this.visibilityHandler = () => {
        if (document.visibilityState === 'visible') {
          // Immediately check when returning to foreground
          this.checkAvailableCards();
        }
      };
      document.addEventListener('visibilitychange', this.visibilityHandler);
    }
  }

  /** Stop background polling */
  stopPolling(): void {
    if (this.pollingIntervalId !== null) {
      clearInterval(this.pollingIntervalId);
      this.pollingIntervalId = null;
    }
    if (this.visibilityHandler !== null) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
  }

  /** Check how many cards are currently available and emit the count */
  private checkAvailableCards(): void {
    const count = this.getAvailableCardCount();
    this.availableCardCount$.next(count);
  }

  /** Get count of currently available (unlocked and ready for review) cards */
  private getAvailableCardCount(): number {
    if (!this.db) return 0;
    const now = new Date().toISOString();
    const result = this.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM cards WHERE stage >= 0 AND unlocks <= ?',
      [now]
    );
    return result?.count ?? 0;
  }
}

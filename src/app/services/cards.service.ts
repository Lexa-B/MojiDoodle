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

      CREATE INDEX idx_cards_stage ON cards(stage);
      CREATE INDEX idx_cards_answer ON cards(answer);
      CREATE INDEX idx_cards_category ON cards(category);
      CREATE INDEX idx_befuddlers_card ON befuddlers(card_id);
    `);

    // Fetch and parse all YAML files
    const categories = ['hiragana', 'katakana', 'kanji', 'katakana-words', 'kanji-words'];

    for (const category of categories) {
      try {
        const response = await fetch(`${getBaseUrl()}data/cards/${category}.yaml`);
        if (!response.ok) continue;

        const yaml = await response.text();
        const cards = this.parseYaml(yaml);

        for (const card of cards) {
          if (!card.id || !card.prompt || !card.answer) continue;

          this.db.run(
            `INSERT INTO cards (id, prompt, answer, hint, stroke_count, stage, unlocks, category)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [card.id, card.prompt, card.answer, card.hint ?? null,
             card.strokeCount ?? null, card.stage ?? 0, card.unlocks ?? '', category]
          );

          for (const b of card.befuddlers ?? []) {
            this.db.run(
              `INSERT INTO befuddlers (card_id, answer, toast) VALUES (?, ?, ?)`,
              [card.id, b.answer, b.toast]
            );
          }
        }

        console.log(`Loaded ${cards.length} cards from ${category}`);
      } catch (err) {
        console.warn(`Failed to load ${category}:`, err);
      }
    }
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

  setCardStage(id: string, stage: number): void {
    if (!this.db) return;
    this.db.run('UPDATE cards SET stage = ? WHERE id = ?', [stage, id]);
    this.saveToStorage(); // Persist change
  }

  getStrokeCount(answer: string): number {
    const card = this.queryOne<any>('SELECT stroke_count FROM cards WHERE answer = ?', [answer]);
    return card?.stroke_count ?? 0;
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

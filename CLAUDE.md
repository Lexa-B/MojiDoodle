# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MojiDoodle is a Japanese character practice application (文字の練習) built with Ionic Angular and Capacitor. Users draw characters on a canvas and the app recognizes their handwriting using Google Input Tools API.

## Commands

```bash
npm start                      # Dev server (ng serve with custom webpack)
npm run build                  # Production build
ng test                        # Unit tests
ng lint                        # Linting
npm run deploy                 # Build and deploy to GitHub Pages

# Native platforms
ionic capacitor add ios
ionic capacitor add android
ionic capacitor sync           # Sync web code to native
ionic capacitor open ios       # Open in Xcode
```

**Live site**: https://lexa-b.github.io/MojiDoodle/

## Architecture

**Stack**: Ionic 8 / Angular 20 / Capacitor 8 / sql.js
**App ID**: `com.lexab.mojidoodle`

### Key Paths

```
src/
├── app/
│   ├── pages/
│   │   ├── dashboard/           # Home page
│   │   ├── workbook/            # Drawing practice page
│   │   └── settings/            # Reset progression, app settings
│   ├── services/
│   │   ├── cards.service.ts     # Card database (SQLite + IndexedDB)
│   │   ├── lessons.service.ts   # Legacy, unused
│   │   └── stroke-recognition.service.ts  # Google Input Tools API
│   ├── app.component.ts         # Sidemenu config
│   └── app-routing.module.ts    # Routes (default: /dashboard)
├── data/
│   └── cards/                   # YAML card definitions (source of truth)
│       ├── hiragana.yaml
│       ├── katakana.yaml
│       ├── kanji.yaml
│       ├── katakana-words.yaml
│       └── kanji-words.yaml
└── theme/variables.scss         # Ionic theme colors

extra-webpack.config.js          # Webpack fallbacks for sql.js
```

### Cards Database

The app uses a hybrid YAML → SQLite architecture:

**Source of truth**: Human-readable YAML files in `src/data/cards/`
**Runtime**: SQLite database built on-device, persisted to IndexedDB

**How it works:**
1. First launch shows "ちょっと待ってください..." spinner
2. Fetches YAML files, parses them, builds SQLite in-memory via sql.js
3. Saves compiled database to IndexedDB
4. Subsequent launches load instantly from IndexedDB

**To add/edit cards**: Edit the YAML files directly. Users will get updates on next fresh install or when `cardsService.rebuild()` is called.

**Cross-platform**: Works on desktop web, mobile web, Android, and iOS using the same sql.js + IndexedDB approach.

### Pages

- **Dashboard** (`/dashboard`) - Home page, currently minimal
- **Workbook** (`/workbook`) - Drawing practice with:
  - Prompt bar showing current character (random unlocked card on load)
  - Full-screen black canvas (OLED-friendly)
  - Undo button (backspace icon)
  - CHECK! button for handwriting recognition
  - Results overlay: ◯ correct, ？ befuddled (try again), ✕ wrong
  - "All caught up" message when no cards available
- **Settings** (`/settings`) - App settings:
  - Reset Progression: buttons to reset each category to original YAML values

### Services

**CardsService** (`cards.service.ts`)
- Loads card database from IndexedDB or builds from YAML on first run
- SQLite queries via sql.js (pure JS, works everywhere)
- Methods: `getRandomUnlockedCard()`, `getCardByAnswer()`, `setCardStage()`, `resetCategory()`, etc.
- Call `initialize()` before using (shows loading spinner if building)

**StrokeRecognitionService** (`stroke-recognition.service.ts`)
- Uses Google Input Tools API for handwriting recognition
- API endpoint: `https://inputtools.google.com/request?itc=ja-t-i0-handwrit&app=translate`
- Supports hiragana, katakana, kanji, and multi-character words
- No API key required, works in browser
- Stroke format: `[[x coords], [y coords], [timestamps]]` per stroke
- Returns ranked character candidates

### Data Models

```typescript
interface Card {
  id: string;
  prompt: string;        // "A (Hiragana)"
  answer: string;        // "あ"
  hint?: string;         // "3 strokes"
  strokeCount?: number;  // Expected stroke count for feedback
  stage: number;         // -1 = unavailable, 0+ = unlocked
  unlocks: string;       // ISO timestamp when card becomes available
  category: string;      // "hiragana", "katakana", etc.
  befuddlers: Befuddler[];
}

interface Befuddler {
  answer: string;        // "ア" (wrong answer)
  toast: string;         // "That's katakana!\n..." (no spoilers)
}

interface Point { x: number; y: number; t: number; }  // t = timestamp relative to draw start
```

### YAML Card Format

```yaml
- id: h-a
  prompt: "A (Hiragana)"
  answer: "あ"
  hint: "3 strokes"
  strokeCount: 3
  stage: 0
  unlocks: "2026-01-29T12:06:14+00:00"
  befuddlers:
    - answer: "ア"
      toast: "That's katakana!\nThe prompt asks for hiragana, which is curvy."
```

### Workbook Drawing System

- Canvas captures strokes as `Point[][]` (array of strokes, each stroke is array of points with timestamps)
- White strokes on black background
- Touch and mouse support with proper coordinate scaling
- Timestamps are relative to first point drawn (resets on clear)
- Undo removes last stroke and redraws
- On CHECK: sends strokes to Google Input Tools API, shows recognized candidates

**Shodo-style brush rendering** (visual only, doesn't affect API data):
- Velocity-based thickness: slow = thick, fast = thin (like a real brush)
- Smoothed transitions between thickness changes
- Harai (払い) flicks: tapered tails on stroke ends based on lift-off velocity
- Settings in `workbook.page.ts`: `minBrushSize`, `maxBrushSize`, `brushSmoothing`

### Handwriting Recognition Flow

1. User draws on canvas → strokes captured with relative timestamps
2. CHECK button pressed → `StrokeRecognitionService.recognize()` called
3. Strokes converted to Google format: `[[x1,x2,...], [y1,y2,...], [t1,t2,...]]`
4. POST to Google Input Tools API
5. Response parsed → returns array of `{character, score}` candidates
6. Result logic:
   - If answer in top 5 → correct (◯), load new card
   - If befuddler in top 5 → befuddled (？), show toast, retry same card
   - Otherwise → wrong (✕), load new card

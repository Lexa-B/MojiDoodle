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
│   │   ├── dashboard/           # Home page with lesson selection
│   │   ├── workbook/            # Drawing practice page
│   │   └── settings/            # Reset progression, app settings
│   ├── services/
│   │   ├── cards.service.ts     # Card & lesson database (SQLite + IndexedDB)
│   │   └── stroke-recognition.service.ts  # Google Input Tools API
│   ├── app.component.ts         # Sidemenu config, version checking
│   └── app-routing.module.ts    # Routes (default: /dashboard)
├── data/
│   ├── cards/
│   │   ├── manifest.yaml        # Card pack definitions
│   │   ├── hiragana/            # Hiragana cards
│   │   ├── katakana/            # Katakana cards
│   │   └── genki/               # Genki textbook vocabulary
│   ├── lessons/
│   │   ├── manifest.yaml        # Lesson pack definitions
│   │   ├── hiragana/            # Hiragana row lessons
│   │   ├── katakana/            # Katakana row lessons
│   │   └── genki/               # Genki chapter lessons
│   ├── stages.yaml              # SRS timing intervals & colors
│   ├── bundle.json              # Pre-compiled data (generated at build)
│   └── version.json             # Build timestamp (generated at build)
├── 404.html                     # GitHub Pages SPA redirect handler
└── theme/variables.scss         # Ionic theme colors

scripts/
├── compile-data.js              # Compiles YAML → bundle.json
├── generate-version.js          # Generates version.json timestamp
├── deploy.sh                    # Deploy to GitHub Pages (production)
└── deploy-dev.sh                # Deploy to /dev path

extra-webpack.config.js          # Webpack fallbacks for sql.js
```

### Database Architecture

The app uses a hybrid YAML → JSON → SQLite architecture:

**Source of truth**: Human-readable YAML files in `src/data/`
**Build time**: YAML compiled to `bundle.json` (single file, ~500KB)
**Runtime**: SQLite database built on-device from bundle, persisted to IndexedDB

**How it works:**
1. Build runs `compile-data.js` → creates `bundle.json` from all YAML files
2. First launch shows "ちょっと待ってください..." spinner
3. Fetches single `bundle.json` (instead of 70+ individual files), builds SQLite in-memory
4. Saves compiled database to IndexedDB
5. Subsequent launches load instantly from IndexedDB

**To add/edit data**: Edit the YAML files directly. Run `npm run build` to regenerate bundle. Users get updates on next fresh install or when prompted by version mismatch.

**Cross-platform**: Works on desktop web, mobile web, Android, and iOS using the same sql.js + IndexedDB approach.

**GitHub Pages SPA**: Uses `404.html` redirect trick to handle client-side routing (saves path to sessionStorage, redirects to root, `index.html` restores path).

**Database tables:**
- `cards` - Character cards with stage and unlock time
- `befuddlers` - Wrong answers with helpful toasts
- `lessons` - Lesson definitions with status, original_status, and reset_by
- `lesson_cards` - Maps lessons to their cards
- `lesson_requires` - Lesson prerequisites
- `lesson_supercedes` - Lessons that replace others when unlocked

### Pages

- **Dashboard** (`/dashboard`) - Home page with lesson selection:
  - Shows available lessons as buttons ("I want to practice...")
  - Unlocking a lesson sets its cards to stage 0 and navigates to workbook
  - Completing prerequisites unlocks dependent lessons
  - 48-hour forecast chart showing upcoming card unlocks by hour (stacked by stage color)
- **Workbook** (`/workbook`) - Drawing practice with:
  - Prompt bar showing current character (random unlocked card on load), colored by SRS stage
  - Full-screen black canvas (OLED-friendly)
  - Undo button (backspace icon)
  - Check button with random Japanese labels (よし!, 判定!, できた!, etc.)
  - Results overlay: ◯ correct, ？ befuddled (try again), ✕ wrong
  - Japanese feedback messages (正解!, ちがう!, etc.)
  - "All caught up" message when no cards available
  - Auto-loads new card when cards become available (subscribes to polling)
- **Settings** (`/settings`) - App settings:
  - Reset Progression: buttons to reset each category (cards and associated lessons) to original values

### Services

**CardsService** (`cards.service.ts`)
- Loads card/lesson database from IndexedDB or builds from `bundle.json` on first run
- SQLite queries via sql.js (pure JS, works everywhere)
- Call `initialize()` before using (shows loading spinner if building)
- Polls for card availability every 30 seconds, emits via `cardAvailability$` observable

Card methods:
- `getRandomUnlockedCard()`, `getCardByAnswer()`, `setCardStage()`, `resetCategory()`
- `advanceCard(id)` - Increments stage and sets unlock time based on SRS timetable
- `getStrokeCount(answer)` - Get expected stroke count for a character
- `getStageColor(stage)` - Get the color for a given SRS stage
- `getUpcomingUnlocksByHour(hours)` - Get card unlock forecast grouped by hour (for dashboard chart)

Lesson methods:
- `getAvailableLessons()`, `getAllLessons()`, `unlockLesson(id)`
- `isLessonCompleted(id)` - Checks if all cards have stage >= 5
- `updateLessonStatuses()` - Unlocks lessons whose prerequisites are complete

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
  stage: number;         // -1 = unavailable, 0 = unlocked, 1-15 = SRS stages
  unlocks: string;       // ISO timestamp when card becomes available
  category: string;      // "hiragana", "katakana", etc.
  befuddlers: Befuddler[];
}

interface Befuddler {
  answer: string;        // "ア" (wrong answer)
  toast: string;         // "That's katakana!\n..." (no spoilers)
}

interface Lesson {
  id: string;            // "h_a", "h_all", "k_all"
  name: string;          // "Hiragana あ行"
  file: string;          // "lesson_h_a.yaml"
  status: 'locked' | 'available' | 'unlocked';
  requires: string[];    // Prerequisite lesson IDs
  // In DB only:
  // original_status - Initial status for reset
  // reset_by - Category that resets this lesson (e.g., "hiragana")
}

interface Point { x: number; y: number; t: number; }  // t = timestamp relative to draw start
```

### SRS Stages

Defined in `src/data/stages.yaml`. When a card is answered correctly, it advances to the next stage with increasing review intervals. Each stage also has a color for UI display:

| Stage | Interval |
|-------|----------|
| 0 | 15 min |
| 1 | 30 min |
| 2 | 1 hour |
| 3 | 4 hours |
| 4 | 12 hours |
| 5 | 1 day |
| 6 | 2 days |
| 7 | 4 days |
| 8 | 1 week |
| 9 | 2 weeks |
| 10 | 1 month |
| 11 | 2 months |
| 12 | 3 months |
| 13 | 5 months |
| 14 | 8 months |
| 15 | 12 months |

### YAML Card Format

```yaml
- id: h-a
  prompt: "A (Hiragana)"
  answer: "あ"
  hint: "3 strokes"
  strokeCount: 3
  stage: -1                              # -1 = locked until lesson unlocked
  unlocks: "2026-01-29T12:06:14+00:00"
  befuddlers:
    - answer: "ア"
      toast: "That's katakana!\nThe prompt asks for hiragana, which is curvy."
```

### YAML Manifest Format

**cards/manifest.yaml** and **lessons/manifest.yaml** define packs:
```yaml
packs:
  - id: hiragana
    name: Hiragana
    category: hiragana        # Used for reset_by in DB
    files:
      - hiragana/hiragana.yaml
```

### YAML Lesson Format

**lesson_h_a.yaml** (individual lesson file):
```yaml
id: h_a
name: "Hiragana あ行"
status: available             # locked, available, or unlocked
requires: []                  # Prerequisite lesson IDs
supercedes: []                # Lessons this one replaces when unlocked

ids:
  - h-a
  - h-i
  - h-u
  - h-e
  - h-o
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
6. Result logic (whitespace-normalized comparison):
   - If answer in top 5 → correct (◯), advance card via SRS, check for lesson unlocks, load new card
   - If befuddler in top 5 → befuddled (？), show toast, retry same card
   - Otherwise → wrong (✕), load new card

**Grading normalization**: All comparisons strip whitespace/newlines from both API results and card answers using `.replace(/\s+/g, '')`. This handles any extra whitespace in YAML data or API responses.

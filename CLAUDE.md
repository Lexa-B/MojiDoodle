# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MojiDoodle is a Japanese character practice application (文字の練習) built with Ionic Angular and Capacitor. Users draw characters on a canvas and the app recognizes their handwriting using Google Input Tools API.

## Commands

```bash
ionic serve                    # Dev server at localhost:8100
ionic build --prod             # Production build
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

**Stack**: Ionic 8 / Angular 20 / Capacitor 8
**App ID**: `com.lexab.mojidoodle`

### Key Paths

```
src/app/
├── pages/
│   ├── dashboard/           # Home page
│   └── workbook/            # Drawing practice page
├── services/
│   ├── lessons.service.ts   # Lesson database
│   └── stroke-recognition.service.ts  # Google Input Tools API integration
├── app.component.ts         # Sidemenu config (appPages array)
├── app.component.html       # Sidemenu template
└── app-routing.module.ts    # Routes (default: /dashboard)

src/theme/variables.scss     # Ionic theme colors
```

### Pages

- **Dashboard** (`/dashboard`) - Home page, currently minimal
- **Workbook** (`/workbook`) - Drawing practice with:
  - Prompt bar showing current character (random unlocked lesson on load)
  - Full-screen black canvas (OLED-friendly)
  - Undo button (backspace icon)
  - CHECK! button for handwriting recognition
  - Results overlay: ◯ correct, ？ befuddled (try again), ✕ wrong

### Services

**LessonsService** (`lessons.service.ts`)
- Lesson database with hiragana, katakana, kanji, and words
- Each lesson has: `id`, `prompt`, `answer`, `hint`, `stage`, `befuddlers[]`
- Befuddlers are common mistakes with toast explanations (don't reveal answer)
- Stage -1 = not yet available

**StrokeRecognitionService** (`stroke-recognition.service.ts`)
- Uses Google Input Tools API for handwriting recognition
- API endpoint: `https://inputtools.google.com/request?itc=ja-t-i0-handwrit&app=translate`
- Supports hiragana, katakana, kanji, and multi-character words
- No API key required, works in browser
- Stroke format: `[[x coords], [y coords], [timestamps]]` per stroke
- Returns ranked character candidates

### Data Models

```typescript
interface Lesson {
  id: string;
  prompt: string;        // "A (Hiragana)"
  answer: string;        // "あ"
  hint?: string;         // "3 strokes"
  strokeCount?: number;  // Expected stroke count for feedback
  stage: number;         // -1 = unavailable, 0+ = unlocked
  unlocks: string;       // ISO timestamp when lesson becomes available
  befuddlers: Befuddler[];
}

interface Befuddler {
  answer: string;        // "ア" (wrong answer)
  toast: string;         // "That's katakana!\n..." (no spoilers)
}

interface Point { x: number; y: number; t: number; }  // t = timestamp relative to draw start
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
   - If answer in top 5 → correct (◯), load new lesson
   - If befuddler in top 5 → befuddled (？), show toast, retry same lesson
   - Otherwise → wrong (✕), load new lesson

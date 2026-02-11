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

# Deployment
npm run deploy:prod            # Build and deploy to Cloudflare Pages (app.mojidoodle.ai)
npm run deploy:dev             # Build and deploy to Cloudflare Pages (dev.mojidoodle.ai)
npm run deploy:gh-pages        # Build and deploy to GitHub Pages

# Native platforms
ionic capacitor add ios
ionic capacitor add android
ionic capacitor sync           # Sync web code to native
ionic capacitor open ios       # Open in Xcode
```

**Live site**: https://app.mojidoodle.ai (production), https://dev.mojidoodle.ai (dev), https://lexa-b.github.io/MojiDoodle/ (GitHub Pages)

## Architecture

**Stack**: Ionic 8 / Angular 20 / Capacitor 8 / sql.js
**App ID**: `ai.mojidoodle.app`

### Key Paths

```
src/
├── app/
│   ├── pages/
│   │   ├── dashboard/           # Home page with lesson selection
│   │   ├── workbook/            # Drawing practice page
│   │   └── settings/            # Pause decks, reset progression, app settings
│   ├── services/
│   │   ├── cards.service.ts     # Card & lesson database (SQLite + IndexedDB)
│   │   ├── stroke-recognition.service.ts  # Google Input Tools API
│   │   ├── character-segmentation.service.ts  # Multi-char segmentation
│   │   ├── collection.service.ts  # Training data collection & export
│   │   └── cheat-codes.service.ts # Developer cheat code system
│   ├── models/
│   │   ├── segmentation.types.ts  # Segmentation grid types
│   │   └── collection.types.ts    # Training data sample types
│   ├── app.component.ts         # Sidemenu config, version checking
│   └── app-routing.module.ts    # Routes (default: /dashboard)
├── data/
│   ├── cards/
│   │   ├── manifest.yaml        # Card pack definitions
│   │   ├── hiragana/            # Hiragana cards
│   │   ├── katakana/            # Katakana cards
│   │   ├── genki/               # Genki textbook vocabulary
│   │   ├── kanji_joyo/          # Jōyō Kanji (grades 1-6, 8)
│   │   ├── kanji_jinmeiyo/      # Jinmeiyō Kanji (grades 9-10)
│   │   ├── kanji_hyogai/        # Hyōgai Kanji (outside jōyō/jinmeiyō, used by WaniKani)
│   │   └── common_katakana_words/ # BCCWJ loanwords (40 levels)
│   ├── lessons/
│   │   ├── manifest.yaml        # Lesson pack definitions
│   │   ├── hiragana/            # Hiragana row lessons
│   │   ├── katakana/            # Katakana row lessons
│   │   ├── genki/               # Genki chapter lessons
│   │   ├── wanikani/            # WaniKani level lessons
│   │   └── common_katakana_words/ # Common katakana word lessons
│   ├── themes/
│   │   └── workbook.yaml        # Workbook theme definitions (stroke mode, brush, colors)
│   ├── stages.yaml              # SRS timing intervals & colors
│   ├── bundle.json              # Pre-compiled data (generated at build)
│   └── version.json             # Build timestamp (generated at build)
├── 404.html                     # GitHub Pages SPA redirect handler
└── theme/variables.scss         # Ionic theme colors

scripts/
├── compile-data.js              # Compiles YAML → bundle.json (cards, lessons, stages, themes)
├── generate-version.js          # Generates version.json timestamp
├── add-card-fields.js           # Migration: add invulnerable/max_stage/learned/hidden to YAML
├── deploy.sh                    # Deploy to GitHub Pages
├── deploy-prod.sh               # Deploy to Cloudflare Pages (app.mojidoodle.ai)
└── deploy-dev.sh                # Deploy to Cloudflare Pages (dev.mojidoodle.ai)

extra-webpack.config.js          # Webpack fallbacks for sql.js
```

### Database Architecture

The app uses a hybrid YAML → JSON → SQLite architecture:

**Source of truth**: Human-readable YAML files in `src/data/`
**Build time**: YAML compiled to `bundle.json` via js-yaml (single file, ~2.4MB)
**Runtime**: SQLite database built on-device from bundle, persisted to IndexedDB

**How it works:**
1. Build runs `compile-data.js` (uses `js-yaml` library) → creates `bundle.json` from all YAML files
2. First launch shows "ちょっと待ってください..." spinner
3. Fetches single `bundle.json` (instead of 70+ individual files), builds SQLite in-memory
4. Saves compiled database to IndexedDB
5. Subsequent launches load instantly from IndexedDB
6. If IndexedDB load fails but a prior session exists (localStorage `mojidoodle-version` key), shows "Database Load Error" alert instead of silently rebuilding — offers Refresh, Download DB, or Rebuild

**To add/edit data**: Edit the YAML files directly. Run `npm run build` to regenerate bundle. Users get updates on next fresh install or when prompted by version mismatch.

**Cross-platform**: Works on desktop web, mobile web, Android, and iOS using the same sql.js + IndexedDB approach.

**GitHub Pages SPA**: Uses `404.html` redirect trick to handle client-side routing (saves path to sessionStorage, redirects to root, `index.html` restores path).

**Database tables:**
- `cards` - Character cards with stage, unlock time, and SRS metadata (invulnerable, max_stage, learned, hidden)
- `befuddlers` - Wrong answers with helpful toasts
- `lessons` - Lesson definitions with status, original_status, and reset_by
- `lesson_cards` - Maps lessons to their cards
- `lesson_requires` - Lesson prerequisites
- `lesson_supercedes` - Lessons that replace others when unlocked
- `user_settings` - Key-value store for user preferences (user_uuid, data_collection, workbook_theme)

### Pages

- **Dashboard** (`/dashboard`) - Home page with lesson selection:
  - Shows available lessons as buttons ("I want to practice...")
  - Unlocking a lesson sets its cards to stage 0 and navigates to workbook
  - Completing prerequisites unlocks dependent lessons
  - 48-hour forecast chart showing upcoming card unlocks by hour (stacked by stage color, paused/hidden cards shown with black crosshatching)
  - Auto-refreshes data every 5 seconds (pauses while alerts are open)
- **Workbook** (`/workbook`) - Drawing practice with:
  - Prompt bar showing current character (random unlocked card on load), colored by SRS stage
  - Full-screen black canvas (OLED-friendly)
  - **Tool column** (right side) with Skip (play-skip-forward-outline), Undo (backspace), Clear All, Brush (default), and Lasso buttons
  - Check button with random Japanese labels (よし!, 判定!, できた!, etc.)
  - Results overlay: ◯ correct, ？ befuddled (try again), ✕ wrong
  - Japanese feedback messages (正解!, ちがう!, etc.)
  - "All caught up" message when no cards available
  - Auto-loads new card when cards become available (subscribes to polling)
- **Settings** (`/settings`) - App settings:
  - Themes: workbook theme selector (ion-select popover). Options loaded from `themes/workbook.yaml` via bundle. Persisted in `user_settings` table as `workbook_theme` key, defaults to `simple-dark`.
  - Data: Backup Progress (download JSON) and Restore Progress (load from JSON file)
  - Pause Decks: toggles to hide/unhide all cards in a category from workbook circulation
  - Reset Progression: buttons to reset each category (cards and associated lessons) to original values
  - Cheat Codes: text input + submit button for developer testing (uses CheatCodesService)
  - Categories: hiragana, katakana, genki, wanikani, joyo-kanji, jinmeiyo-kanji, hyogai-kanji, common-katakana-words

### Services

**CardsService** (`cards.service.ts`)
- Loads card/lesson database from IndexedDB or builds from `bundle.json` on first run
- **Database load protection**: If IndexedDB returns empty but localStorage has `mojidoodle-version` (evidence of prior session), refuses to silently rebuild. Shows error alert with Refresh / Download DB / Rebuild options. The `rebuild()` method sets `rebuildInProgress` flag to bypass this guard for intentional rebuilds (version check Migrate/Reset).
- SQLite queries via sql.js (pure JS, works everywhere)
- Call `initialize()` before using (shows loading spinner if building)
- Polls for card availability every 30 seconds, emits via `cardAvailability$` observable

Card methods:
- `getRandomUnlockedCard()`, `getCardByAnswer()`, `setCardStage()`, `resetCategory()`, `bulkSetStage(fromMin, fromMax, toStage)`
- `advanceCard(id)` - Advances card on correct answer with three branches: if invulnerable, clears flag without incrementing stage; if `max_stage - stage > 1`, increments by 2 (fast recovery); otherwise increments by 1. Always updates max_stage and sets unlock time.
- `demoteCard(id)` - Demotes card on wrong answer: if invulnerable or stage <= 0, skips; if stage > 5, demotes to 4; if stage 1-5, demotes by 1. Sets invulnerable flag after demotion. Does not change unlock time.
- `getStrokeCount(answer)` - Get expected stroke count for a character
- `getStageColor(stage)` - Get the color for a given SRS stage
- `getUpcomingUnlocksByHour(hours)` - Get card unlock forecast grouped by hour (for dashboard chart)
- `isCategoryHidden(category)` - Check if any cards in a category are hidden
- `setCategoryHidden(category, hidden)` - Bulk set hidden flag on all cards in a category

Theme methods:
- `getWorkbookThemes()` - Get all loaded workbook theme configs (from bundle)
- `getWorkbookTheme()` - Get active theme ID from `user_settings` (defaults to `'simple-dark'`)
- `setWorkbookTheme(themeId)` - Save active theme ID to `user_settings`

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
- `recognize()` - Single recognition for all strokes combined
- `recognizeBatch()` - Batch recognition for segmented cells (one API call, multiple results)

**CharacterSegmentationService** (`character-segmentation.service.ts`)
- Segments multi-character handwriting into individual character cells
- Uses gap-based two-pass approach with size uniformity enforcement
- Supports protected groups (from lassos) that prevent dividers from splitting grouped strokes
- `segment(strokes, width, height, protectedGroups?)` - Returns `SegmentationResult` with grid, cells, and stroke assignments

**CheatCodesService** (`cheat-codes.service.ts`)
- Developer tool for testing SRS progression and other features
- Input is sanitized (non-letters stripped, lowercased) then SHA-256 hashed
- Hashed codes are compared against known hashes to trigger effects
- Codes and their effects are not documented here intentionally; check the service source for the hash table
- `sanitize(input)` - Strip non-letters, lowercase
- `hash(input)` - Sanitize then SHA-256 hash, returns hex string
- `submit(input)` - Process a code, returns true if matched

### Data Models

```typescript
interface Card {
  id: string;
  prompt: string;        // "A (Hiragana)"
  answers: string[];     // ["あ"] - list of valid answers (first is primary)
  hint?: string;         // "3 strokes"
  strokeCount?: number;  // Expected stroke count for feedback
  stage: number;         // -1 = unavailable, 0 = unlocked, 1-15 = SRS stages
  unlocks: string;       // ISO timestamp when card becomes available
  category: string;      // "hiragana", "katakana", etc.
  invulnerable: boolean; // If true, card cannot be demoted until next correct answer
  max_stage: number;     // Highest stage ever reached (-1 if never unlocked)
  learned: boolean;      // True once initial learning session is complete (not yet implemented)
  hidden: boolean;       // If true, card is excluded from workbook circulation
  befuddlers: Befuddler[];
}

interface Befuddler {
  answers: string[];     // ["ア"] - list of wrong answers that trigger this befuddler
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

// Character segmentation types
interface DividerLine {
  slope: number;      // For columns: dx/dy, for rows: dy/dx (0 = perfectly straight)
  intercept: number;  // x-intercept for columns, y-intercept for rows
  start: number;      // Start coordinate (y for columns, x for rows)
  end: number;        // End coordinate
}

interface GridCell {
  column: number;           // 0 = rightmost (Japanese reading order)
  row: number;              // 0 = topmost
  strokeIndices: number[];  // Strokes belonging to this cell
  bounds: { minX, maxX, minY, maxY: number };
}

interface SegmentationGrid {
  columnDividers: DividerLine[];  // Vertical lines between columns
  rowDividers: DividerLine[][];   // Horizontal lines within each column
  cells: GridCell[];
  columns: number;
  maxRows: number;
}

interface SegmentationResult {
  grid: SegmentationGrid;
  estimatedCharHeight: number;
  estimatedCharWidth: number;
}

// Protected group for lasso-based segmentation protection
interface ProtectedGroup {
  strokeIndices: number[];  // Strokes that should not be split by dividers
}

// Workbook theme configuration (loaded from themes/workbook.yaml via bundle)
interface WorkbookThemeConfig {
  id: string;               // "simple-dark", "dark-candy-cane"
  name: string;             // Display name
  strokeMode: 'solid' | 'candy-cane';
  defaultColor: string;     // Color for strokes without lasso/character assignment
  stripeLength?: number;    // Candy-cane: px per color stripe
  lassoSaturation?: number; // Solid mode: lasso color HSL saturation %
  lassoLightness?: number;  // Solid mode: lasso color HSL lightness %
  color1?: { saturation: number; lightness: number };  // Candy-cane: first alternating color
  color2?: { saturation: number; lightness: number };  // Candy-cane: second alternating color
  brush?: {
    minSize: number;        // Minimum brush diameter in px
    maxSize: number;        // Maximum brush diameter in px
    smoothing: number;      // How quickly brush responds to speed changes (0-1)
    speedResponse: boolean; // If true, brush size varies with drawing velocity
    harai: boolean;         // If true, draw tapered flick at stroke end
  };
}
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
  answers:                               # List of valid answers (first is primary)
    - "あ"
  hint: "3 strokes"
  strokeCount: 3
  stage: -1                              # -1 = locked until lesson unlocked
  unlocks: "2026-01-29T12:06:14+00:00"
  invulnerable: false                    # Prevents demotion until next correct answer
  max_stage: -1                          # Highest stage ever reached
  learned: false                         # Initial learning session complete
  hidden: false                          # Excluded from workbook circulation
  befuddlers:
    - answers:                           # List of wrong answers that trigger this
        - "ア"
      toast: "That's katakana!\nThe prompt asks for hiragana, which is curvy."
```

**Multi-answer cards** (e.g., kanji with multiple readings):
```yaml
- id: k-ichi
  prompt: "One (Kanji)"
  answers:
    - "一"
    - "いち"                             # Hiragana reading also accepted
  hint: "1 stroke"
  strokeCount: 1
  stage: -1
  invulnerable: false
  max_stage: -1
  learned: false
  hidden: false
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

### YAML Workbook Theme Format

**themes/workbook.yaml** defines available workbook themes. Each theme controls stroke rendering mode, colors, and brush behavior:
```yaml
- id: simple-dark
  name: Simple Dark
  strokeMode: solid              # solid or candy-cane
  defaultColor: "#ffffff"        # Color for unassigned strokes
  lassoSaturation: 55            # Lasso color HSL saturation %
  lassoLightness: 78             # Lasso color HSL lightness %
  brush:
    minSize: 3                   # Min brush diameter px
    maxSize: 24                  # Max brush diameter px
    smoothing: 0.05              # Speed smoothing factor
    speedResponse: true          # Velocity-based thickness
    harai: true                  # Tapered flick at stroke end

- id: dark-candy-cane
  name: Dark Candy Cane
  strokeMode: candy-cane
  stripeLength: 10               # Pixels per color stripe
  defaultColor: "#ffffff"
  color1:                        # First alternating color (hue from lasso index)
    saturation: 55
    lightness: 78
  color2:                        # Second alternating color (hue from character index)
    saturation: 95
    lightness: 55
  brush:
    minSize: 6
    maxSize: 6                   # Same as min = fixed width
    smoothing: 0.05
    speedResponse: false         # No velocity variation
    harai: false                 # No tapered flick
```

Themes are compiled into `bundle.json` by `compile-data.js` and loaded by CardsService at startup. The active theme ID is stored in `user_settings` as `workbook_theme`. Adding new themes requires only a new entry in this YAML file and a rebuild — no code changes needed for `solid` or `candy-cane` stroke modes.

### Workbook Drawing System

- Canvas captures strokes as `Point[][]` (array of strokes, each stroke is array of points with timestamps)
- White strokes on black background
- Touch and mouse support with proper coordinate scaling
- Timestamps are relative to first point drawn (resets on clear)
- Undo removes last stroke and redraws
- On CHECK: sends strokes to Google Input Tools API, shows recognized candidates

**Brush rendering** (visual only, doesn't affect API data):
Controlled by the active workbook theme (defined in `src/data/themes/workbook.yaml`). The workbook page reads brush settings from `themeConfig.brush` via getters (`minBrushSize`, `maxBrushSize`, `brushSmoothing`, `speedResponse`, `haraiEnabled`), falling back to Simple Dark defaults if no theme is loaded.

- **Simple Dark** (shodo-style): Velocity-based thickness (slow = thick, fast = thin), smoothed transitions, harai (払い) flicks on stroke ends
- **Dark Candy Cane**: Fixed uniform width (no speed response), no harai, alternating two colors every `stripeLength` px per stroke after segmentation

**Stroke rendering modes** (`themeConfig.strokeMode`):
- `solid` - Single color per stroke. Lasso strokes use pastel colors at `lassoSaturation`/`lassoLightness`; unassigned strokes use `defaultColor`.
- `candy-cane` - Two alternating colors per stroke (only after segmentation). Color1 hue from lasso index, color2 hue from character index. During live drawing (before segmentation), strokes render in `defaultColor`.

### Lasso Tool (Segmentation Protection)

The workbook toolbar includes a lasso tool for manually grouping strokes to prevent incorrect automatic segmentation.

**Toolbar buttons:**
- 🗑️ **Clear All** - Clears all strokes AND lassos
- 🖌️ **Brush** - Default drawing mode (highlighted when active)
- ⭕ **Lasso** - Draw polygons to protect strokes from segmentation

**How it works:**
1. User switches to lasso mode
2. User draws a closed polygon around strokes they want to keep together
3. System detects which strokes are inside using percentage containment (≥50% of stroke points inside = belongs to lasso)
4. Strokes inside the lasso render in the lasso's pastel color
5. When segmentation runs:
   - Skips creating any divider that would split a protected group
   - Forces dividers between strokes in different lassos (inter-lasso segmentation)
   - Uses perpendicular overlap to detect multi-column layouts (for vertical writing where columns wrap to top)
6. Tap an existing lasso (in lasso mode only) to delete it

**Visual feedback:**
- 24 pastel colors distributed around the color wheel in lug-nut pattern
- Strokes without a lasso: white (default)
- Strokes inside a lasso: rendered in lasso's color
- Lasso outline: dashed line in its color
- Lasso fill: very faint (10% opacity)

**Stroke ownership:** When multiple lassos overlap, the stroke belongs to whichever lasso contains the highest percentage of its points.

**Data export:** Lassos are exported to the collection service as `SelectionLasso[]` with both `points` and `strokeIndices`.

### Handwriting Recognition Flow

1. User draws on canvas → strokes captured with relative timestamps
2. CHECK button pressed → `StrokeRecognitionService.recognize()` called
3. Strokes converted to Google format: `[[x1,x2,...], [y1,y2,...], [t1,t2,...]]`
4. POST to Google Input Tools API
5. Response parsed → returns array of `{character, score}` candidates
6. Result logic (whitespace-normalized comparison):
   - If ANY valid answer from answers[] is in top 5 → correct (◯), display the matched answer (not raw API result), advance card via SRS, check for lesson unlocks, load new card
   - If ANY befuddler answer is in top 5 → befuddled (？), show toast, retry same card
   - Otherwise → wrong (✕), load new card

**Grading normalization**: All comparisons strip whitespace/newlines from both API results and card answers using `.replace(/\s+/g, '')`. This handles any extra whitespace in YAML data or API responses.

**Kana fuzzy matching**: Small kana (っ, ゃ, ゅ, ょ, etc.) are treated as equivalent to their big counterparts (つ, や, ゆ, よ, etc.) during grading. This handles cases where the API returns big kana when the user writes small kana. Works for both hiragana and katakana.

**Chōon fuzzy matching**: The prolonged sound mark ー is treated as equivalent to vertical line characters (|, ｜) during grading. In vertical Japanese writing, ー is drawn as a vertical line which the API often recognizes as a pipe character.

**Wave dash fuzzy matching**: The wave dash 〜 is treated as equivalent to tilde characters (~, ～) during grading. The API often returns ASCII tilde when the user draws the Japanese wave dash.

**Multi-answer support**: Cards can have multiple valid answers (e.g., kanji + hiragana reading). The system accepts ANY answer from the answers[] list. The first answer is used as the primary display character.

### Character Segmentation (Multi-Character Words)

For vocabulary cards with multiple characters (e.g., "たべる"), the app segments handwriting into individual characters before recognition.

**Files:**
- `src/app/models/segmentation.types.ts` - Type definitions
- `src/app/services/character-segmentation.service.ts` - Segmentation algorithm
- `src/app/services/stroke-recognition.service.ts` - Batch recognition

**Approach: Two-Pass Gap-Based Segmentation**

Uses a two-pass approach that first divides into columns, then divides each column into rows:

```
┌─────────┬─────────┐
│ Col 1   │ Col 0   │  ← Japanese reading order: right-to-left
├─────────┼─────────┤
│  あ     │  た     │  ← Row dividers (horizontal lines)
├─────────┼─────────┤
│  い     │  べ     │
└─────────┴─────────┘
     ↑
  Column divider (vertical line, max ±10° angle)
```

**Divider Lines:** Simple linear equations
- Column dividers: `x = slope * y + intercept` (vertical, slope ≈ 0)
- Row dividers: `y = slope * x + intercept` (horizontal, slope ≈ 0)
- Max 10 degrees from vertical/horizontal

**Pass 1 - Column Detection:**
1. Sort strokes by X center position
2. Find gaps between stroke bounding boxes larger than threshold
3. Create vertical divider lines through gap midpoints

**Pass 2 - Row Detection (per column):**
1. Sort column's strokes by Y center position
2. Find gaps between stroke bounding boxes larger than threshold
3. Create horizontal divider lines through gap midpoints

**Size Uniformity Enforcement:**
After gap detection, enforces that no cell is >2x larger than any other:
- Content edges are treated as implicit boundaries
- For each dimension, compares all region sizes
- Can either SPLIT large regions (add divider at midpoint) or MERGE small regions (remove divider)
- Chooses whichever action improves the max/min ratio
- Iterates until ratio ≤ 2.0 or no improvement possible
- Respects protected groups (from lassos) - won't split a lasso

**Inter-Lasso Segmentation:**
When lassos are present, forces dividers between different lassos:
- Calculates bounding box for each lasso in both dimensions
- Sorts lassos by position in the divider dimension
- Adds dividers between consecutive lassos that don't significantly overlap
- Uses perpendicular overlap to detect side-by-side lassos (e.g., different columns at similar Y positions)
- For vertical Japanese writing: if lassos have >30% Y overlap, they're likely in different columns → add column divider even if X ranges overlap slightly

**Configurable Thresholds** (in `SegmentationConfig`):
- `minColumnGapRatio: 0.25` - Min gap as fraction of char width
- `maxColumnAngle: 10` - Max degrees from vertical for column dividers
- `minRowGapRatio: 0.25` - Min gap as fraction of char height
- `maxRowAngle: 10` - Max degrees from horizontal for row dividers

**Batch API Recognition:**
- Google Input Tools API supports multiple requests in single call via `requests` array
- Each cell's strokes sent as separate request
- Results filtered to single characters only (no multi-char, no punctuation)
- Punctuation filter: `/^[\p{P}\p{S}\p{M}]$/u` (Unicode categories)

**Backwards Grading:**
For multi-character cards, grading works backwards from the expected answers:
1. For each valid answer in answers[], split into characters using Unicode-safe `[...answer]`
2. Check if each character appears in the corresponding cell's top 5 candidates
3. If ANY answer fully matches → correct (◯)
4. Befuddlers use same logic - if any befuddler answer fully matches cells, show befuddled (？)

```typescript
// Example: target answers ["たべる", "食べる"], 3 cells with results
const isCorrect = normalizedAnswers.some(target => {
  const targetChars = [...target];
  if (targetChars.length !== batchResults.length) return false;
  return targetChars.every((char, idx) => {
    const cellCandidates = batchResults[idx].slice(0, 5).map(r => r.character);
    // kanaMatch handles small/big kana equivalence (っ ↔ つ, etc.)
    return cellCandidates.some(candidate => this.kanaMatch(char, candidate));
  });
});
```

**Reading Order:** Japanese vertical writing
- Columns: right-to-left (column 0 = rightmost)
- Rows: top-to-bottom (row 0 = topmost)

**Visualization:** Workbook draws faint dashed divider lines between columns and rows.

### Data Collection Service

Collects workbook sessions for training segmentation models. Sends JSON samples to Cloudflare Worker after each grading.

**Files:**
- `src/app/models/collection.types.ts` - Type definitions (v2)
- `src/app/services/collection.service.ts` - Export logic

**CollectionSampleV2 Schema:**
```typescript
interface CollectionSampleV2 {
  version: 2;
  strokes: Point[][];           // Raw input strokes (Point from mojidoodle-algo-segmenter)
  canvasWidth: number;          // Canvas dimensions for normalization
  canvasHeight: number;
  characterAssignments: CharacterAssignment[];  // Segmenter output (not raw divider lines)
  selectionLassos: SelectionLasso[] | null;     // Manual segmentation from lasso tool
  answers: string[];            // Card's valid answers
  recognitionResults: { character: string; score: number }[][] | null;
  groundTruth: GroundTruthEntry[] | null;  // Inferred on success
  success: boolean;             // Did recognition match?
  id: string;                   // UUID for this sample
  userId: string;               // Persistent user UUID (localStorage, separate from CardsService)
  cardId: string;               // Card being practiced
  timestamp: number;            // When collected
}

interface CharacterAssignment {
  characterIndex: number;       // Reading-order index (0 = first character)
  strokeIndices: number[];      // Which input strokes belong to this character
  bounds: { minX, maxX, minY, maxY, width, height: number };
}

interface GroundTruthEntry {
  strokeIndices: number[];      // Strokes belonging to this character
  character: string;            // Expected character
}

interface SelectionLasso {      // Manual segmentation from lasso tool
  points: { x: number; y: number }[];
  strokeIndices: number[];
}
```

**Ground Truth Strategy:**
- On success: automatically inferred from character assignments
- On failure: `groundTruth = null` (needs manual labeling)
- Single-char: all strokes → one character
- Multi-char: stroke indices from character assignments

**Export Flow:**
1. After grading completes, `workbook.page.ts` calls `collectionService.exportSample()`
2. Sample built from strokes, `mojidoodle-algo-segmenter` output (SegmentResult), recognition results
3. POST to `https://data-collection.mojidoodle.ai/collect` (Cloudflare Worker)
4. Falls back to console logging on failure

**User ID:** CollectionService stores its own persistent UUID in localStorage (`mojidoodle_collection_user_id`), separate from the `user_uuid` in CardsService's SQLite database.

### User Settings & Data Collection

**Database table:** `user_settings` (key-value store)
- `user_uuid` - Persistent UUID generated on first launch
- `data_collection` - User's opt-in status: `'opted-in'`, `'opted-out'`, or `'no-response'`
- `workbook_theme` - Active workbook theme ID (defaults to `'simple-dark'` when absent)

**CardsService methods:**
- `getUserUuid()` - Get persistent user UUID (stored in SQLite `user_settings`)
- `getDataCollectionStatus()` - Get opt-in status
- `setDataCollectionStatus(status)` - Update opt-in status

**Note:** CollectionService uses a separate user UUID stored in localStorage (`mojidoodle_collection_user_id`), not the CardsService UUID. These are independent.

**Data Collection Prompt:**
- On app launch, if status is `'no-response'`, shows opt-in alert
- User can choose "Yes!", "No.", or "Maybe later"
- "Maybe later" keeps `'no-response'` so prompt appears again next launch

### Cloudflare Worker (Data Collection Backend)

**Location**: `worker/`
**Endpoint**: `https://data-collection.mojidoodle.ai/collect`

Receives `CollectionSample` JSON from the app and stores in R2.

**Files:**
```
worker/
├── src/index.ts      # Worker code
├── wrangler.toml     # Cloudflare config
├── package.json      # Scripts: start, publish, logs
└── tsconfig.json
```

**Scripts** (run from `worker/` directory):
```bash
npm start        # Local dev server at localhost:8787
npm run publish  # Deploy to Cloudflare
npm run logs     # Tail worker logs
```

**Endpoints:**
- `GET /` or `/health` - Health check
- `POST /collect` - Receive samples

**Security controls:**
- CORS: Dynamic origin reflection from `ALLOWED_ORIGINS` env var (`https://lexa-b.github.io`, `https://app.mojidoodle.ai`, `https://dev.mojidoodle.ai`)
- Rate limit: 60 requests/minute per IP
- Body size limit: 1MB max
- Content-Type: Must be `application/json`
- Validation: Checks required fields, strokes is array, answers is non-empty array, canvas dimensions are positive

**Storage:**
- R2 bucket: `mojidoodle-samples`
- Version-prefixed paths: `v2/{userId}/{cardId}/{sampleId}.json` (v2 schema) or `v1/{userId}/{cardId}/{sampleId}.json` (v1 fallback)
- KV namespace: `RATE_LIMIT` (for rate limiting)

**Server-side metadata** (stored in R2 custom metadata, not in JSON):
- `receivedAt` - Server timestamp
- `ipHash` - SHA-256 hash of client IP (first 16 hex chars)
- `uaHash` - SHA-256 hash of User-Agent
- `contentLength` - Request body size

### Version Checking & Migration

**Files:**
- `src/data/version.json` - Build timestamp (generated by `scripts/generate-version.js`)
- `app.component.ts` - Version check and migration logic

**Flow:**
1. On app launch, fetch `version.json` from server
2. Compare with stored version in localStorage (`mojidoodle-version`)
3. If mismatch AND user has existing data → show "Update Available" alert:
   - **Migrate**: Export progress → rebuild DB → restore progress
   - **Later**: Store version, keep old DB (may have stale content)
   - **Reset**: Rebuild DB from scratch, lose all progress

**Migration methods (CardsService):**
- `exportToBundle()` - Export current DB state (cards, lessons, user settings)
- `restoreFromBundle(backup)` - Restore progress after rebuild. After restoring, automatically unlocks any new cards that were added to already-unlocked lessons (e.g., 々 added to wk_02 after a user already unlocked it).
- `rebuild()` - Clear IndexedDB and rebuild from fresh bundle. Sets `rebuildInProgress` flag to bypass the database load protection guard (otherwise `initialize()` would block the rebuild with an error alert).

**Database load protection:**
If `loadFromStorage()` returns null during `initialize()` but `localStorage.getItem('mojidoodle-version')` exists, the app assumes this is a transient IndexedDB failure (common on mobile browsers like Firefox Android) rather than a fresh install. Instead of silently rebuilding and losing progress, it shows a blocking alert:
- **Refresh** - Reloads the page to retry the IndexedDB load
- **Download DB** - Retries reading IndexedDB and triggers a `.sqlite` file download if data is found
- **Rebuild (lose progress)** - Explicitly proceeds with a fresh build from bundle

### Card Fields & DB Migration

Cards have 4 metadata fields added to the `cards` table as INTEGER columns (SQLite booleans):
- `invulnerable` (default 0) - Prevents stage demotion after a wrong answer until the next correct answer
- `max_stage` (default -1) - Tracks the highest SRS stage ever reached; updated automatically in `advanceCard()`
- `learned` (default 0) - Flag for initial learning session completion (mechanism not yet implemented)
- `hidden` (default 0) - Excludes card from workbook circulation; used by Pause Decks in Settings

**DB migration** (`runMigrations()`): For existing databases missing these columns:
1. Adds all 4 columns via ALTER TABLE
2. Smart defaults: `max_stage = stage` where `stage > max_stage` (backfills from current progress)
3. Smart defaults: `learned = 1` where `stage > -1` (assumes previously unlocked cards were learned)
4. `invulnerable` and `hidden` default to 0

**Workbook filtering**: `getRandomUnlockedCard()` and `getAvailableCardCount()` filter `hidden = 0` so paused decks don't appear.

**YAML parsing**: Both `compile-data.js` and the in-app fallback parser use the `js-yaml` library (v4.1.1). All YAML files are parsed with `yaml.load()`. Boolean `true`/`false` values are converted to JS booleans by js-yaml, stored as 0/1 in SQLite.

## Critical Rules

### Never Silently Rebuild an Existing Database

**CRITICAL**: The app must never build a new database from bundle when evidence of a prior session exists. This prevents silent data loss from transient IndexedDB failures on mobile browsers.

**Bug example (2026-02-10):** On Firefox Android, IndexedDB intermittently failed to load the stored database. The app silently rebuilt from bundle, wiping all user progress with no warning or recovery option.

**How it's prevented:** `doInitialize()` checks `localStorage.getItem('mojidoodle-version')` before building from bundle. If the key exists and `rebuildInProgress` is false, it shows a "Database Load Error" alert instead of proceeding. Only explicit `rebuild()` calls (from version check Migrate/Reset) set the `rebuildInProgress` flag to bypass this guard.

### Database Initialization Order

**CRITICAL**: Always call `await cardsService.initialize()` before any database operations.

The service uses lazy initialization - `this.db` is null until `initialize()` is called. Any method that queries the database (like `exportToBundle()`) will return empty results if called before initialization.

**Bug example (2026-02-05):** Migration wiped user progress because `exportToBundle()` was called before `initialize()`. The export returned empty arrays, then rebuild happened, then empty data was "restored".

**Correct pattern:**
```typescript
await this.cardsService.initialize();  // Load existing DB first!
const backup = await this.cardsService.exportToBundle();
await this.cardsService.rebuild();
await this.cardsService.restoreFromBundle(backup);
```

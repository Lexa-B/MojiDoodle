# MojiDoodle 文字の練習

A Japanese character practice app with shodo-style brush strokes and spaced repetition.

**Status: Work in Progress**

## What it does

Draw Japanese characters on a canvas and get instant feedback via handwriting recognition. The app uses velocity-based brush rendering to simulate the feel of writing with a calligraphy brush.

- Lesson-based progression: unlock new character sets as you learn
- Spaced repetition (SRS): cards reappear at optimal intervals (15min → 12 months)
- Shodo-style strokes that respond to drawing speed
- Harai (払い) flicks on stroke endings
- Instant recognition via Google Input Tools API
- OLED-friendly dark canvas

## Try it

https://lexa-b.github.io/MojiDoodle/

## How to Use

### Getting Started

1. **Open the app** - You'll land on the Dashboard showing available lessons
2. **Pick a lesson** - Tap a lesson button (e.g., "Hiragana あ Row") to unlock those characters
3. **Start practicing** - You'll be taken to the Workbook where cards appear one at a time

### Drawing Characters

1. **Read the prompt** - The top bar shows what to draw (e.g., "A (Hiragana)")
2. **Draw on the canvas** - Use your finger or mouse to write the character
3. **Tap the check button** (よし!, 判定!, etc.) - The app recognizes your handwriting and shows the result:
   - **◯** Correct! The card advances to the next SRS stage
   - **？** Befuddled - you drew a similar but wrong character (e.g., katakana instead of hiragana). Try again!
   - **✕** Wrong - a new card loads

### Toolbar

The workbook has a toolbar on the right side:
- **⌫ Undo** - Remove your last stroke
- **🗑️ Clear All** - Clear all strokes and start over
- **🖌️ Brush** - Default drawing mode
- **⭕ Lasso** - Circle strokes to keep them together (prevents auto-segmentation from splitting characters)

### Lasso Tool (for multi-character words)

When writing multi-character words, the app automatically segments your handwriting. If it splits a character incorrectly:

1. Tap the **lasso button** (⭕) to enter lasso mode
2. Draw a circle around the strokes that belong together
3. Those strokes will turn a pastel color showing they're grouped
4. The segmenter will no longer split through that group
5. Tap an existing lasso to delete it
6. Tap the **brush button** (🖌️) to return to drawing mode

### Tips for Better Recognition

- Draw characters at a reasonable size (not too small)
- Use the correct stroke count when possible
- The hint below the prompt shows expected stroke count
- Tap the undo button (⌫) to remove your last stroke
- For multi-character words: write vertically (top to bottom), leave visible gaps between characters
- Use the **lasso tool** if the auto-segmentation incorrectly splits a character
- Small kana (っ, ゃ, ゅ, ょ) are accepted even if recognized as their big counterparts
- Some cards accept multiple answers (e.g., kanji or hiragana)

### Progression System

- **Unlock lessons** from the Dashboard to add new cards to your practice queue
- **Complete lessons** by getting all cards to stage 5 (requires multiple review sessions over ~12 hours)
- **Unlock advanced lessons** by completing their prerequisites (e.g., finish all basic rows to unlock "All Hiragana")
- **Review cards** as they become available - the app uses spaced repetition to optimize your learning

### Spaced Repetition (SRS)

Each correct answer advances a card to the next stage with a longer review interval:

| Stage | Next Review |
|-------|-------------|
| 0 → 1 | 15 minutes |
| 1 → 2 | 30 minutes |
| 2 → 3 | 1 hour |
| 3 → 4 | 4 hours |
| 4 → 5 | 12 hours |
| 5+ | 1 day → 12 months |

When you see "All caught up!", all your unlocked cards are waiting for their next review time.

### Settings

Access Settings from the menu (☰) to:
- **Reset Progression** - Start over with a specific category (Hiragana, Katakana, or Genki Vocabulary)

## Run locally

```bash
npm install
npm start
```

### Data Collection Worker

The worker that receives training data is in `worker/`. To deploy changes:

```bash
cd worker
npm install
npm run publish   # Deploy to Cloudflare
npm run logs      # Tail logs
```

## Tech

- Ionic 8 / Angular 20 / Capacitor 8
- sql.js (SQLite in the browser)
- Google Input Tools API (no key required)
- Canvas 2D for brush rendering
- IndexedDB for offline persistence
- Character segmentation for multi-character vocabulary words
- Cloudflare Worker + R2 for training data collection (opt-in)

## Data Architecture

Cards and lessons are defined in human-readable YAML files (`src/data/`). At build time, these are compiled into a single `bundle.json`. On first launch, the app loads this bundle and builds a SQLite database stored in IndexedDB. This hybrid approach gives you:

- **Dev-friendly**: Edit YAML files directly, easy to read and version control
- **Fast loading**: Single HTTP request instead of 70+ individual files
- **Production-ready**: Efficient SQLite queries, works offline
- **Cross-platform**: Same code works on web, Android, and iOS

### Lessons System

Lessons group cards together and can have prerequisites:
- Complete "Hiragana あ Row" to unlock "All Hiragana"
- Dashboard shows available lessons to start, plus a 48-hour forecast chart
- Completing a lesson (all cards reach stage 5) unlocks dependent lessons

### SRS Stages

Cards advance through 16 stages with increasing intervals:
- Stage 0: 15 minutes
- Stage 5: 1 day
- Stage 10: 1 month
- Stage 15: 12 months

### User Data & Privacy

**What's stored locally:**
- Your card progress (stages and unlock times)
- Lesson completion status
- A random user UUID (for data collection if opted-in)
- Your data collection preference

**Data Collection (optional):**
On first launch, you'll be asked if you want to help improve the app by sharing workbook session data. This is completely optional:
- **Yes**: Session data (strokes, recognition results, and lasso selections) is sent to our collection server to train better segmentation models
- **No**: No data is collected, ever
- **Maybe later**: You'll be asked again next time

Your card progress and lesson status are always stored locally in IndexedDB. No accounts, no cloud sync for your learning data.

### Updates & Migration

When new content is available, you'll see an "Update Available" prompt:
- **Migrate**: Preserves your progress while updating to new content
- **Later**: Keeps your current database (may have stale content)
- **Reset**: Fresh start, all progress lost

Migration safely exports your card stages and lesson statuses, rebuilds the database with new content, then restores your progress.

## Acknowledgements

### Data Sources
- **[Genki](https://genki3.japantimes.co.jp/)** by The Japan Times - Japanese textbook vocabulary
  - Vocabulary index downloaded from [Japan Times Book Club](https://bookclub2.japantimes.co.jp/)
- **[Google Input Tools](https://www.google.com/inputtools/)** - Handwriting recognition API
- **[KanjiVG](https://kanjivg.tagaini.net/)** - Stroke order data (CC BY-SA 3.0)
- **[Project X0213](https://x0213.org/)** - Kanji code tables
  - [Joyo Kanji Code](https://x0213.org/joyo-kanji-code/index.en.html) - 2,136 joyo kanji with encoding data
  - [Jinmeiyou Kanji Code](https://x0213.org/jinmeiyou-kanji-code/index.en.html) - 861 jinmeiyou (name) kanji
- **[KANJIDIC](https://www.edrdg.org/wiki/index.php/KANJIDIC_Project)** by James William Breen and the [EDRDG](https://www.edrdg.org/) - Kanji meanings (CC BY-SA 4.0)

## TODO

- [ ] More kanji and vocabulary
- [ ] Stroke order hints
- [ ] Native iOS/Android builds
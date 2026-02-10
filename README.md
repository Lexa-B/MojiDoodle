# MojiDoodle 文字の練習

A Japanese character practice app with shodo-style brush strokes and spaced repetition.

**Status: Work in Progress**

## What it does
<video src="https://github.com/user-attachments/assets/523fbe5e-b69b-43b6-9835-afac045a396b" alt="Example usage: selecting lessons from the dashboard and completing character practice cards in the workbook" autoplay loop muted playsinline width="300"></video>

Draw Japanese characters on a canvas and get instant feedback via handwriting recognition. The app uses velocity-based brush rendering to simulate the feel of writing with a calligraphy brush.

- Lesson-based progression: unlock new character sets as you learn
- Spaced repetition (SRS): cards reappear at optimal intervals (15min → 12 months)
- Pause decks to focus on specific categories without losing progress
- Shodo-style strokes that respond to drawing speed
- Harai (払い) flicks on stroke endings
- Instant recognition via Google Input Tools API
- OLED-friendly dark canvas

## Try it

https://app.mojidoodle.ai

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
- **⏭ Skip** - Skip the current card and load a new one (no SRS impact)
- **⌫ Undo** - Remove your last stroke
- **🗑️ Clear All** - Clear all strokes and start over
- **🖌️ Brush** - Default drawing mode (highlighted when active)
- **⭕ Lasso** - Circle strokes to group them together

### How Multi-Character Recognition Works

When you're practicing a word like たべる (3 characters), the app needs to recognize each character separately. Here's what happens:

1. **You draw the word** - All your strokes go onto the canvas
2. **The app segments your writing** - It looks for gaps between characters and draws faint dashed lines to show where it thinks one character ends and the next begins
3. **Each segment gets recognized** - The app sends each character cell to Google's handwriting API
4. **Results are matched** - The app checks if the recognized characters match the expected answer

**The Problem**: Sometimes the automatic segmentation gets it wrong:
- It might split one character into two pieces (e.g., splitting い into two separate strokes)
- It might merge two characters into one (e.g., combining ホ and ー because they're close together)
- For vertical writing with multiple columns, it might not detect where one column ends and the next begins

**The Solution**: Use the **lasso tool** to manually tell the app which strokes belong together!

### Lasso Tool

The lasso tool lets you circle strokes that belong to the same character. This gives you full control over segmentation.

**How to use it:**

1. **Finish drawing your word** - Write all the characters first
2. **Switch to lasso mode** - Tap the ⭕ button (it will highlight)
3. **Circle each character** - Draw a loop around all the strokes of one character
   - The strokes inside will turn a pastel color (pink, blue, green, etc.)
   - Each lasso gets a different color so you can see what's grouped
4. **Repeat for each character** - Circle the next character, it gets a new color
5. **Check your work** - You should see each character in a different color, with dashed divider lines between them
6. **Switch back to brush mode** - Tap 🖌️ when done lassoing
7. **Hit the check button** - The app will use your lasso groupings for recognition

**What lassos do:**
- **Protect**: Strokes inside a lasso will NEVER be split apart
- **Separate**: The app will ALWAYS put a divider between different lassos

**To delete a lasso:** While in lasso mode (⭕), tap on an existing lasso to remove it.

**Pro tips:**
- You don't have to lasso every character - just the ones that are being mis-segmented
- For vertical writing with multiple columns, lasso each character and the app will figure out the column layout
- If a character has a dakuten (゛) or handakuten (゜), make sure to include it in the same lasso as the base character

### Tips for Better Recognition

**Writing style:**
- Draw characters at a reasonable size - not too tiny!
- Leave visible gaps between characters (the segmenter looks for these)
- The hint below the prompt shows expected stroke count - try to match it
- Use the undo button (⌫) to fix mistakes without starting over

**For multi-character words:**
- Write vertically (top to bottom) - this is how Japanese is traditionally written
- If you run out of room, start a new column to the LEFT
- Leave bigger gaps between characters than within characters
- Use the lasso tool if auto-segmentation fails

**Fuzzy matching - the app is forgiving:**
- **Small kana**: っ, ゃ, ゅ, ょ are accepted even if recognized as つ, や, ゆ, よ
- **Chōon mark**: The prolonged sound mark ー is accepted even if recognized as a vertical line | (common when writing vertically)
- **Multiple answers**: Some cards accept alternate writings (e.g., both kanji and hiragana)

**When things go wrong:**
- If a character is split incorrectly → lasso its strokes together
- If two characters are merged → make sure there's a gap, or lasso them separately
- If columns aren't detected → lasso each character to help the app understand the layout

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

**Wrong answers demote cards:**
- Stage 1–5: demoted one level
- Above stage 5: demoted to stage 4
- Stage 0: no demotion
- After demotion, the card becomes **invulnerable** (no further demotion until you get it right)
- If a card has been demoted far below its max stage, correct answers advance it by 2 stages instead of 1 to help it recover faster

When you see "All caught up!", all your unlocked cards are waiting for their next review time.

### Settings

Access Settings from the menu (☰) to:
- **Pause Decks** - Toggle individual card categories on/off. Paused decks won't appear in the workbook, but your progress is preserved. Useful when you want to focus on specific decks without being interrupted by others.
- **Reset Progression** - Start over with a specific category (Hiragana, Katakana, or Genki Vocabulary)
- **Cheat Codes** - Developer tool for testing. Enter a code and submit to trigger special actions.

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

### Card Metadata

Each card tracks additional state beyond its SRS stage:
- **Invulnerable** - Prevents demotion after a wrong answer until the next correct answer
- **Max stage** - Highest SRS stage ever reached, allowing faster re-advancement after demotion
- **Learned** - Flag for initial learning session completion
- **Hidden** - Excludes card from workbook circulation (used by Pause Decks)

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

**Database load protection:** If the app detects a previous session but can't load your database from storage (e.g., a transient browser issue), it will show an error instead of silently rebuilding and losing your progress. You'll get options to refresh the page, download your database file, or rebuild as a last resort.

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
- **[BCCWJ](https://clrd.ninjal.ac.jp/bccwj/en/index.html)** (Balanced Corpus of Contemporary Written Japanese) by [NINJAL](https://www.ninjal.ac.jp/english/) - Word frequency data for Common Katakana Words lessons
  - [Frequency list (SUW)](https://repository.ninjal.ac.jp/records/3234) - Short Unit Word frequency list - https://doi.org/10.15084/00003218

## TODO

- [ ] More kanji and vocabulary
- [ ] Stroke order hints
- [ ] Native iOS/Android builds
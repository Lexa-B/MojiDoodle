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
- Works offline after first load

## Try it

https://lexa-b.github.io/MojiDoodle/

## Run locally

```bash
npm install
npm start
```

## Tech

- Ionic 8 / Angular 20 / Capacitor 8
- sql.js (SQLite in the browser)
- Google Input Tools API (no key required)
- Canvas 2D for brush rendering
- IndexedDB for offline persistence

## Data Architecture

Cards and lessons are defined in human-readable YAML files (`src/data/`). On first launch, the app compiles these into a SQLite database stored in IndexedDB. This hybrid approach gives you:

- **Dev-friendly**: Edit YAML files directly, easy to read and version control
- **Production-ready**: Efficient SQLite queries, works offline
- **Cross-platform**: Same code works on web, Android, and iOS

### Lessons System

Lessons group cards together and can have prerequisites:
- Complete "Hiragana あ Row" to unlock "All Hiragana"
- Dashboard shows available lessons to start
- Completing a lesson (all cards practiced) unlocks dependent lessons

### SRS Timetable

Cards advance through 16 stages with increasing intervals:
- Stage 0: 15 minutes
- Stage 5: 1 day
- Stage 10: 1 month
- Stage 15: 12 months

## TODO

- [ ] More kanji and vocabulary
- [ ] Stroke order hints
- [ ] Native iOS/Android builds

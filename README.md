# MojiDoodle 文字の練習

A Japanese character practice app with shodo-style brush strokes.

**Status: Work in Progress**

## What it does

Draw Japanese characters on a canvas and get instant feedback via handwriting recognition. The app uses velocity-based brush rendering to simulate the feel of writing with a calligraphy brush.

- Practice hiragana, katakana, and kanji
- Shodo-style strokes that respond to drawing speed
- Harai (払い) flicks on stroke endings
- Instant recognition via Google Input Tools API
- OLED-friendly dark canvas
- Works offline after first load
- Reset progression per category in Settings

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

## Card Database

Cards are defined in human-readable YAML files (`src/data/cards/*.yaml`). On first launch, the app compiles these into a SQLite database stored in IndexedDB. This hybrid approach gives you:

- **Dev-friendly**: Edit YAML files directly, easy to read and version control
- **Production-ready**: Efficient SQLite queries, works offline
- **Cross-platform**: Same code works on web, Android, and iOS

## TODO

- [ ] More kanji and vocabulary
- [ ] Progress tracking
- [ ] Spaced repetition
- [ ] Stroke order hints
- [ ] Native iOS/Android builds

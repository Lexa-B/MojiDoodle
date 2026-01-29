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

## Try it

https://lexa-b.github.io/MojiDoodle/

## Run locally

```bash
npm install
ionic serve
```

## Tech

- Ionic 8 / Angular 20 / Capacitor 8
- Google Input Tools API (no key required)
- Canvas 2D for brush rendering

## TODO

- [ ] More lessons (kanji, words)
- [ ] Progress tracking
- [ ] Spaced repetition
- [ ] Stroke order hints
- [ ] Native iOS/Android builds

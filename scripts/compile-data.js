#!/usr/bin/env node
/**
 * Compiles all YAML data files into a single JSON bundle for faster loading.
 * This runs at build time so the app only needs one HTTP request.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const DATA_DIR = path.join(__dirname, '../src/data');
const OUTPUT_FILE = path.join(DATA_DIR, 'bundle.json');

function parseCardsYaml(content) {
  return yaml.load(content) || [];
}

function parseLessonYaml(content) {
  const data = yaml.load(content) || {};
  return {
    id: data.id || '',
    name: data.name || '',
    status: data.status || 'locked',
    requires: data.requires || [],
    ids: data.ids || [],
    supercedes: data.supercedes || [],
  };
}

function parseManifestYaml(content) {
  const data = yaml.load(content) || {};
  return data.packs || [];
}

function parseStagesYaml(content) {
  return yaml.load(content) || [];
}

// Main compilation
console.log('Compiling data bundle...');

const bundle = {
  stages: [],
  cards: [],      // All cards with their category
  lessons: []     // All lessons with their category
};

// Load stages
const stagesPath = path.join(DATA_DIR, 'stages.yaml');
if (fs.existsSync(stagesPath)) {
  const content = fs.readFileSync(stagesPath, 'utf8');
  bundle.stages = parseStagesYaml(content);
  console.log(`  Loaded ${bundle.stages.length} stages`);
}

// Load cards from manifest
const cardsManifestPath = path.join(DATA_DIR, 'cards/manifest.yaml');
if (fs.existsSync(cardsManifestPath)) {
  const manifestContent = fs.readFileSync(cardsManifestPath, 'utf8');
  const packs = parseManifestYaml(manifestContent);

  for (const pack of packs) {
    for (const file of pack.files) {
      const filePath = path.join(DATA_DIR, 'cards', file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const cards = parseCardsYaml(content);
        for (const card of cards) {
          card.category = pack.category;
          bundle.cards.push(card);
        }
        console.log(`  Loaded ${cards.length} cards from ${file}`);
      }
    }
  }
}

// Load lessons from manifest
const lessonsManifestPath = path.join(DATA_DIR, 'lessons/manifest.yaml');
if (fs.existsSync(lessonsManifestPath)) {
  const manifestContent = fs.readFileSync(lessonsManifestPath, 'utf8');
  const packs = parseManifestYaml(manifestContent);

  for (const pack of packs) {
    for (const file of pack.files) {
      const filePath = path.join(DATA_DIR, 'lessons', file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const lesson = parseLessonYaml(content);
        lesson.category = pack.category;
        bundle.lessons.push(lesson);
        console.log(`  Loaded lesson ${lesson.id} with ${lesson.ids.length} cards`);
      }
    }
  }
}

// Load workbook themes
const workbookThemesPath = path.join(DATA_DIR, 'themes/workbook.yaml');
if (fs.existsSync(workbookThemesPath)) {
  const content = fs.readFileSync(workbookThemesPath, 'utf8');
  bundle.themes = { workbook: yaml.load(content) || [] };
  console.log(`  Loaded ${bundle.themes.workbook.length} workbook themes`);
}

// Write the bundle
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(bundle));
const stats = fs.statSync(OUTPUT_FILE);
console.log(`\nGenerated bundle.json: ${bundle.cards.length} cards, ${bundle.lessons.length} lessons`);
console.log(`Bundle size: ${(stats.size / 1024).toFixed(1)} KB`);

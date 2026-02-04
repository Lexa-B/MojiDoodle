#!/usr/bin/env node
/**
 * Compiles all YAML data files into a single JSON bundle for faster loading.
 * This runs at build time so the app only needs one HTTP request.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../src/data');
const OUTPUT_FILE = path.join(DATA_DIR, 'bundle.json');

// Simple YAML parser for our specific format
function parseYamlValue(val) {
  if (!val) return val;
  val = val.trim();
  if ((val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
    val = val.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
  if (/^-?\d+$/.test(val)) {
    return parseInt(val, 10);
  }
  return val;
}

function parseCardsYaml(content) {
  const cards = [];
  let currentCard = null;
  let currentBefuddler = null;
  let inBefuddlers = false;
  let inAnswers = false;
  let inBefuddlerAnswers = false;
  let inMultilineToast = false;
  let toastLines = [];

  for (const line of content.split('\n')) {
    if (!line.trim()) continue;

    const indent = line.search(/\S/);
    const trimmed = line.trim();

    // New card
    if (indent === 0 && trimmed.startsWith('- ')) {
      // Finalize any pending multi-line toast
      if (inMultilineToast && currentBefuddler && toastLines.length > 0) {
        currentBefuddler.toast = toastLines.join('\n');
        toastLines = [];
        inMultilineToast = false;
      }
      if (currentBefuddler && currentCard) {
        currentCard.befuddlers = currentCard.befuddlers || [];
        currentCard.befuddlers.push(currentBefuddler);
      }
      if (currentCard) cards.push(currentCard);

      currentCard = { befuddlers: [], answers: [] };
      currentBefuddler = null;
      inBefuddlers = false;
      inAnswers = false;
      inBefuddlerAnswers = false;

      const match = trimmed.match(/^- (\w+): (.+)$/);
      if (match) {
        currentCard[match[1]] = parseYamlValue(match[2]);
      }
      continue;
    }

    // Card property
    if (indent === 2 && currentCard && !trimmed.startsWith('-')) {
      const match = trimmed.match(/^(\w+): (.+)$/);
      if (match) {
        const key = match[1];
        const value = match[2];

        if (key === 'befuddlers' && value === '[]') {
          currentCard.befuddlers = [];
          inBefuddlers = false;
          inAnswers = false;
        } else if (key === 'befuddlers') {
          inBefuddlers = true;
          inAnswers = false;
        } else if (key === 'answers' && value === '[]') {
          currentCard.answers = [];
          inAnswers = false;
        } else {
          currentCard[key] = parseYamlValue(value);
          inAnswers = false;
        }
      } else if (trimmed === 'befuddlers:') {
        inBefuddlers = true;
        inAnswers = false;
      } else if (trimmed === 'answers:') {
        inAnswers = true;
        currentCard.answers = [];
      }
      continue;
    }

    // Card answers list item
    if (indent === 4 && trimmed.startsWith('- ') && inAnswers && currentCard && !inBefuddlers) {
      const value = trimmed.slice(2).trim();
      currentCard.answers = currentCard.answers || [];
      currentCard.answers.push(parseYamlValue(value));
      continue;
    }

    // New befuddler (starts with "- answer:" or "- answers:")
    // Note: befuddler items are at indent 2, same level as "befuddlers:" key
    if (indent === 2 && trimmed.startsWith('- ') && inBefuddlers && currentCard && !inAnswers) {
      // Finalize any pending multi-line toast before starting new befuddler
      if (inMultilineToast && currentBefuddler && toastLines.length > 0) {
        currentBefuddler.toast = toastLines.join('\n');
        toastLines = [];
        inMultilineToast = false;
      }
      if (currentBefuddler) {
        currentCard.befuddlers = currentCard.befuddlers || [];
        currentCard.befuddlers.push(currentBefuddler);
      }
      currentBefuddler = { answers: [], toast: '' };
      inBefuddlerAnswers = false;

      // Check for "- key: value" format
      const matchWithValue = trimmed.match(/^- (\w+): (.+)$/);
      if (matchWithValue) {
        const key = matchWithValue[1];
        const value = parseYamlValue(matchWithValue[2]);
        // Convert singular "answer" to plural "answers" array
        if (key === 'answer') {
          currentBefuddler.answers = [value];
        } else {
          currentBefuddler[key] = value;
        }
      } else if (trimmed === '- answers:') {
        // Befuddler starts with answers list (value on next lines)
        inBefuddlerAnswers = true;
      }
      continue;
    }

    // Multi-line toast content (at indent 6)
    if (indent === 6 && inMultilineToast && currentBefuddler) {
      toastLines.push(trimmed);
      continue;
    }

    // End multi-line toast if we're at a lower indent
    if (inMultilineToast && indent < 6 && currentBefuddler) {
      currentBefuddler.toast = toastLines.join('\n');
      toastLines = [];
      inMultilineToast = false;
    }

    // Befuddler property (at indent 4, e.g., "    toast: |-")
    if (indent === 4 && currentBefuddler && !trimmed.startsWith('- ')) {
      const match = trimmed.match(/^(\w+): (.+)$/);
      if (match) {
        const key = match[1];
        if (key === 'answers' && match[2] === '[]') {
          currentBefuddler.answers = [];
          inBefuddlerAnswers = false;
        } else if (key === 'answer') {
          // Convert singular "answer" to plural "answers" array
          currentBefuddler.answers = [parseYamlValue(match[2])];
          inBefuddlerAnswers = false;
        } else if (key === 'toast' && (match[2] === '|-' || match[2] === '|')) {
          // Start multi-line toast block
          inMultilineToast = true;
          toastLines = [];
        } else {
          currentBefuddler[key] = parseYamlValue(match[2]);
          inBefuddlerAnswers = false;
        }
      } else if (trimmed === 'answers:') {
        inBefuddlerAnswers = true;
        currentBefuddler.answers = [];
      }
      continue;
    }

    // Befuddler answers list item (at indent 6)
    if (indent === 6 && trimmed.startsWith('- ') && inBefuddlerAnswers && currentBefuddler) {
      const value = trimmed.slice(2).trim();
      currentBefuddler.answers = currentBefuddler.answers || [];
      currentBefuddler.answers.push(parseYamlValue(value));
      continue;
    }
  }

  // Finalize any pending multi-line toast
  if (inMultilineToast && currentBefuddler && toastLines.length > 0) {
    currentBefuddler.toast = toastLines.join('\n');
  }

  // Final items
  if (currentBefuddler && currentCard) {
    currentCard.befuddlers = currentCard.befuddlers || [];
    currentCard.befuddlers.push(currentBefuddler);
  }
  if (currentCard) cards.push(currentCard);

  return cards;
}

function parseLessonYaml(content) {
  let id = '';
  let name = '';
  let status = 'locked';
  const requires = [];
  const ids = [];
  const supercedes = [];
  let currentSection = 'none';

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const propMatch = trimmed.match(/^([\w-]+):\s*(.*)$/);
    if (propMatch && !trimmed.startsWith('-')) {
      const [, key, value] = propMatch;
      if (key === 'id') {
        id = value;
        currentSection = 'none';
      } else if (key === 'name') {
        name = value.replace(/^["']|["']$/g, '');
        currentSection = 'none';
      } else if (key === 'status') {
        status = value;
        currentSection = 'none';
      } else if (key === 'requires') {
        currentSection = value === '[]' ? 'none' : 'requires';
      } else if (key === 'ids') {
        currentSection = 'ids';
      } else if (key === 'supercedes') {
        currentSection = value === '[]' ? 'none' : 'supercedes';
      }
      continue;
    }

    if (trimmed.startsWith('- ')) {
      // Strip inline comments (e.g., "k-joyo-4e00  # 一 One" -> "k-joyo-4e00")
      let value = trimmed.slice(2).trim();
      const commentIndex = value.indexOf('#');
      if (commentIndex > 0) {
        value = value.slice(0, commentIndex).trim();
      }
      if (currentSection === 'requires') {
        requires.push(value);
      } else if (currentSection === 'ids') {
        ids.push(value);
      } else if (currentSection === 'supercedes') {
        supercedes.push(value);
      }
    }
  }

  return { id, name, status, requires, ids, supercedes };
}

function parseManifestYaml(content) {
  const packs = [];
  let current = null;
  let inFiles = false;

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    if (trimmed.startsWith('- id:')) {
      if (current) packs.push(current);
      current = { id: trimmed.split(':')[1].trim(), category: '', files: [] };
      inFiles = false;
      continue;
    }

    if (!current) continue;

    if (trimmed.startsWith('category:')) {
      current.category = trimmed.split(':')[1].trim();
    } else if (trimmed === 'files:') {
      inFiles = true;
    } else if (inFiles && trimmed.startsWith('- ')) {
      current.files.push(trimmed.slice(2).trim());
    } else if (!trimmed.startsWith('-') && trimmed.includes(':')) {
      inFiles = false;
    }
  }

  if (current) packs.push(current);
  return packs;
}

function parseStagesYaml(content) {
  const stages = [];
  let currentStage = null;

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const stageMatch = trimmed.match(/^-?\s*stage:\s*(\d+)/);
    if (stageMatch) {
      if (currentStage !== null) stages.push(currentStage);
      currentStage = { stage: parseInt(stageMatch[1], 10), minutes: 0, color: '#FFFFFF' };
      continue;
    }

    if (currentStage !== null) {
      const minutesMatch = trimmed.match(/^minutes:\s*(\d+)/);
      if (minutesMatch) {
        currentStage.minutes = parseInt(minutesMatch[1], 10);
      }

      const colorMatch = trimmed.match(/^color:\s*"?(#[0-9A-Fa-f]{6})"?/);
      if (colorMatch) {
        currentStage.color = colorMatch[1];
      }
    }
  }

  if (currentStage !== null) stages.push(currentStage);
  return stages;
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

// Write the bundle
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(bundle));
const stats = fs.statSync(OUTPUT_FILE);
console.log(`\nGenerated bundle.json: ${bundle.cards.length} cards, ${bundle.lessons.length} lessons`);
console.log(`Bundle size: ${(stats.size / 1024).toFixed(1)} KB`);

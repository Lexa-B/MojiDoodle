#!/usr/bin/env node
/**
 * Temporary migration script: Add invulnerable, max_stage, learned, hide fields
 * to all card YAML files (both final cards and skeletons).
 *
 * Inserts the 4 new fields right before the `befuddlers:` line of each card.
 *
 * Usage: node scripts/add-card-fields.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const PROJECT_ROOT = path.resolve(__dirname, '..');

const NEW_FIELDS = [
  '  invulnerable: false',
  '  max_stage: -1',
  '  learned: false',
  '  hidden: false',
];

// All card YAML files (cards + skeletons), excluding manifests
const patterns = [
  'src/data/cards/**/*.yaml',
  'src/data/external/processed/**/*.yaml',
];

function processFile(filePath) {
  const relPath = path.relative(PROJECT_ROOT, filePath);

  // Skip manifest files
  if (path.basename(filePath) === 'manifest.yaml') {
    return { path: relPath, skipped: true, reason: 'manifest' };
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const output = [];
  let insertions = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match card-level befuddlers field (2-space indent, not deeper)
    if (/^  befuddlers:/.test(line)) {
      // Check we haven't already added the fields (idempotent)
      const prevLines = output.slice(-4).map(l => l.trim());
      if (prevLines.includes('hide: false')) {
        output.push(line);
        continue;
      }

      for (const field of NEW_FIELDS) {
        output.push(field);
      }
      insertions++;
    }

    output.push(line);
  }

  if (insertions > 0) {
    fs.writeFileSync(filePath, output.join('\n'), 'utf-8');
  }

  return { path: relPath, insertions };
}

function main() {
  let totalFiles = 0;
  let totalInsertions = 0;
  let skipped = 0;

  for (const pattern of patterns) {
    const files = glob.sync(pattern, { cwd: PROJECT_ROOT, absolute: true });

    for (const filePath of files) {
      const result = processFile(filePath);

      if (result.skipped) {
        skipped++;
        continue;
      }

      totalFiles++;
      totalInsertions += result.insertions;

      if (result.insertions > 0) {
        console.log(`  ${result.path}: ${result.insertions} cards updated`);
      }
    }
  }

  console.log(`\nDone! ${totalInsertions} cards updated across ${totalFiles} files (${skipped} skipped)`);
}

main();

#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const version = {
  timestamp: new Date().toISOString(),
  buildTime: Date.now()
};

const outputPath = path.join(__dirname, '..', 'src', 'data', 'version.json');
fs.writeFileSync(outputPath, JSON.stringify(version, null, 2));

console.log(`Generated version.json: ${version.timestamp}`);

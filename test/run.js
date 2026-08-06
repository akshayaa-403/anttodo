#!/usr/bin/env node
'use strict';
/* Runs every suite against the engine extracted from ../index.html.
   Usage: node test/run.js   (no dependencies required) */
const { execFileSync } = require('child_process');
const path = require('path');

const suites = ['engine.test.js', 'ui.test.js'];
let failed = 0;

for (const s of suites) {
  console.log(`\n${'─'.repeat(54)}\n▶ ${s}\n${'─'.repeat(54)}`);
  try {
    const out = execFileSync(process.execPath, [path.join(__dirname, s)], {
      encoding: 'utf8', stdio: 'pipe',
    });
    process.stdout.write(out);
  } catch (e) {
    if (e.stdout) process.stdout.write(e.stdout);
    if (e.stderr) process.stderr.write(e.stderr);
    failed++;
  }
}

console.log(`\n${'═'.repeat(54)}`);
console.log(failed ? `✗ ${failed} suite(s) FAILED` : '✓ all suites passed');
console.log('═'.repeat(54));
process.exit(failed ? 1 : 0);

#!/usr/bin/env node
/**
 * Platform test runner — runs tests/platform/*.test.js via node:test.
 * Separate from the 4-tier suite so the existing 51-test architecture is preserved.
 */
import { run } from 'node:test';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dir = path.join(__dirname, 'platform');

const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.test.js'))
  .map((f) => path.join(dir, f))
  .sort();

let total = 0;
let passed = 0;
let failed = 0;
const failures = [];

console.log('\n===============================================');
console.log('       OMEGA PLATFORM TEST SUITE RUNNER        ');
console.log('===============================================\n');

for (const file of files) {
  const rel = path.relative(path.resolve(__dirname, '..'), file);
  console.log(`▶ ${rel}`);
  const stream = run({ files: [file] });
  for await (const event of stream) {
    const name = event.data?.name || '';
    if (!/^P\d+\./.test(name)) continue;
    if (event.type === 'test:pass') {
      total++;
      passed++;
      console.log(`  ✔ [PASS] ${name}`);
    } else if (event.type === 'test:fail') {
      total++;
      failed++;
      const msg = event.data.details.error?.message || 'Assertion failed';
      console.log(`  ✖ [FAIL] ${name}\n     └─ ${msg}`);
      failures.push({ file: rel, name, error: msg });
    }
  }
}

console.log('\n-----------------------------------------------');
console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
console.log('-----------------------------------------------\n');

if (failures.length > 0) {
  for (const f of failures) console.log(`- [${f.file}] ${f.name}: ${f.error}`);
  process.exit(1);
} else {
  console.log('All platform tests PASSED!\n');
}

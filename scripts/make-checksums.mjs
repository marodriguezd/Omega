#!/usr/bin/env node
/**
 * Generate SHA-256 checksums for release artifacts.
 *
 * Usage:
 *   node scripts/make-checksums.mjs [dir] [--out=<file>] [--extra=<file> ...]
 *
 * --extra includes an additional file (e.g. manifest.json) in the manifest
 * even when it is not a distributable artifact.
 *
 * Scans <dir> (default: ./release) for distributable artifacts
 * (*.apk, *.dmg, *.msi, *.AppImage, *.exe, *.zip, *.tar.gz),
 * writes "<sha256>  <filename>" lines to SHA256SUMS.txt in that dir,
 * and prints the table to stdout.
 *
 * Exits 1 when no artifacts are found.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const ARTIFACT_RE = /\.(apk|dmg|msi|AppImage|exe|zip|tar\.gz)$/i;

function parseArgs(argv) {
  const out = { dir: path.join(ROOT, 'release'), outFile: 'SHA256SUMS.txt', extra: [] };
  for (const a of argv) {
    if (a.startsWith('--out=')) out.outFile = a.slice('--out='.length);
    else if (a.startsWith('--extra=')) out.extra.push(a.slice('--extra='.length));
    else if (!a.startsWith('--')) out.dir = path.resolve(a);
  }
  return out;
}

const { dir, outFile, extra } = parseArgs(process.argv.slice(2));

if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
  console.error(`FATAL: directory not found: ${dir}`);
  process.exit(1);
}

const files = fs
  .readdirSync(dir)
  .filter((f) => ARTIFACT_RE.test(f) && fs.statSync(path.join(dir, f)).isFile())
  .sort();

if (files.length === 0) {
  console.error(`FATAL: no release artifacts found in ${dir}`);
  process.exit(1);
}

for (const e of extra) {
  const full = path.join(dir, e);
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) {
    console.error(`FATAL: --extra file not found: ${full}`);
    process.exit(1);
  }
  if (!files.includes(e)) files.push(e);
}

const lines = files.map((f) => {
  const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, f))).digest('hex');
  return `${hash}  ${f}`;
});

fs.writeFileSync(path.join(dir, outFile), lines.join('\n') + '\n');
console.log(`SHA-256 checksums (${files.length} artifact(s)) → ${path.join(dir, outFile)}`);
for (const line of lines) console.log(`  ${line}`);

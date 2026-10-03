#!/usr/bin/env node
/**
 * Omega deterministic release manifest generator.
 *
 * Usage:
 *   node scripts/make-manifest.mjs <dir> --platform=<android|mac|windows|linux>
 *     --signing=<status> [--commit=<sha>] [--out=<file>]
 *
 * Scans <dir> for distributable artifacts (same set as make-checksums.mjs)
 * and writes a sorted JSON manifest with one entry per artifact:
 *   { version, commit, platform, artifact, sha256, signing, builtAt }
 *
 * - version: package.json (single source of truth).
 * - commit: --commit flag or `git rev-parse HEAD`, else "unknown".
 * - signing: caller-provided status token (e.g. android-production,
 *   android-dev, mac-signed, mac-unsigned, win-unsigned). Never inferred.
 * - builtAt: ISO-8601 UTC build timestamp (informational only — artifact
 *   identity is (version, artifact, sha256)).
 *
 * Exits 1 when no artifacts are found. Output is deterministic:
 * entries sorted by artifact filename.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const ARTIFACT_RE = /\.(apk|dmg|msi|AppImage|exe|zip|tar\.gz)$/i;

function argValue(argv, name) {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
}

const argv = process.argv.slice(2);
const dirArg = argv.find((a) => !a.startsWith('--'));
if (!dirArg) {
  console.error('FATAL: usage: make-manifest.mjs <dir> --platform=<p> --signing=<s>');
  process.exit(1);
}
const dir = path.resolve(dirArg);
const platform = argValue(argv, 'platform');
const signing = argValue(argv, 'signing');
const outFile = argValue(argv, 'out') ?? 'manifest.json';
let commit = argValue(argv, 'commit');
if (!platform || !signing) {
  console.error('FATAL: --platform and --signing are required');
  process.exit(1);
}
if (!commit) {
  try {
    commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', cwd: ROOT }).trim();
  } catch {
    commit = 'unknown';
  }
}

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const version = pkg.version;

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

const builtAt = new Date().toISOString();
const entries = files.map((f) => ({
  version,
  commit,
  platform,
  artifact: f,
  sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, f))).digest('hex'),
  signing,
  builtAt,
}));

fs.writeFileSync(path.join(dir, outFile), JSON.stringify(entries, null, 2) + '\n');
console.log(`Release manifest (${entries.length} artifact(s)) → ${path.join(dir, outFile)}`);
for (const e of entries) console.log(`  ${e.artifact}  ${e.sha256.slice(0, 12)}…  ${e.signing}`);

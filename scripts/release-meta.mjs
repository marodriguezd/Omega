#!/usr/bin/env node
/**
 * Omega release metadata — single source of truth for versioning.
 *
 * Source of truth: package.json "version".
 * Derives the deterministic artifact names for all four targets:
 *   Omega-<version>.apk / .dmg / .msi / .AppImage
 *
 * Usage:
 *   node scripts/release-meta.mjs [--tag=v1.0.0] [--json]
 *
 * With --tag, exits 1 when the Git tag does not match package.json
 * (tag "v1.0.0" must equal version "1.0.0"). CI calls this on every
 * v* tag build to guarantee artifact versions match the Git tag.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const version = pkg.version;
if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version ?? '')) {
  console.error(`FATAL: package.json version "${version}" is not semver`);
  process.exit(1);
}

const artifacts = {
  apk: `Omega-${version}.apk`,
  dmg: `Omega-${version}.dmg`,
  msi: `Omega-${version}.msi`,
  appimage: `Omega-${version}.AppImage`,
};

const args = process.argv.slice(2);
const tagArg = args.find((a) => a.startsWith('--tag='));
if (tagArg) {
  const tag = tagArg.slice('--tag='.length);
  const tagVersion = tag.startsWith('v') ? tag.slice(1) : tag;
  if (tagVersion !== version) {
    console.error(`FATAL: Git tag "${tag}" does not match package.json version "${version}"`);
    process.exit(1);
  }
  console.log(`Tag ${tag} matches package.json version ${version}.`);
}

if (args.includes('--json')) {
  console.log(JSON.stringify({ version, appId: pkg?.build?.appId ?? null, artifacts }, null, 2));
} else {
  console.log(`Omega release metadata (version ${version})`);
  for (const [kind, name] of Object.entries(artifacts)) {
    console.log(`  ${kind.padEnd(9)} ${name}`);
  }
}

export { version, artifacts };

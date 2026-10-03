import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { readProjectFile, fileExists } from '../helpers/test-utils.js';

describe('Release hardening — checksums, signing optionality, CI integrity', () => {
  it('R13. make-checksums emits verifiable SHA-256 manifests', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'omega-checksums-'));
    try {
      fs.writeFileSync(path.join(tmp, 'Omega-1.0.0.apk'), 'fake-apk-bytes');
      fs.writeFileSync(path.join(tmp, 'notes.txt'), 'must be ignored');
      const out = execFileSync('node', ['scripts/make-checksums.mjs', tmp], { encoding: 'utf8' });
      assert.match(out, /SHA-256 checksums \(1 artifact/);
      const manifest = fs.readFileSync(path.join(tmp, 'SHA256SUMS.txt'), 'utf8');
      assert.match(manifest, /^[0-9a-f]{64}  Omega-1\.0\.0\.apk$/m, 'manifest line must be "<sha256>  <file>"');
      assert.doesNotMatch(manifest, /notes\.txt/, 'non-artifact files must be excluded');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('R14. make-checksums fails loudly when no artifacts exist', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'omega-empty-'));
    try {
      assert.throws(
        () => execFileSync('node', ['scripts/make-checksums.mjs', tmp], { stdio: 'pipe' }),
        /Command failed/,
        'empty artifact dir must exit non-zero',
      );
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('R15. signing is optional: unsigned builds work, secrets only opt in', () => {
    const desktop = readProjectFile('.github/workflows/desktop.yml') || '';
    const android = readProjectFile('.github/workflows/android.yml') || '';
    // Desktop: signing inputs exist but every build job runs without them by default.
    assert.match(desktop, /MAC_CSC_LINK/, 'mac signing input must be wired');
    assert.match(desktop, /WIN_CSC_LINK/, 'windows signing input must be wired');
    assert.match(desktop, /UNSIGNED/, 'CI must explicitly report unsigned artifacts');
    // Android: committed dev keystore fallback preserved; custom keystore opt-in.
    assert.match(android, /ANDROID_KEYSTORE_BASE64/, 'custom keystore opt-in must exist');
    assert.match(android, /dev-keystore|DEV keystore/i, 'dev-keystore fallback must be reported');
    const gradle = readProjectFile('android/app/build.gradle') || '';
    assert.match(gradle, /KEYSTORE_FILE/, 'gradle must accept an injected keystore path');
    // No credentials may ever be committed in workflow files.
    assert.doesNotMatch(desktop, /BEGIN PRIVATE KEY/, 'no private keys in CI config');
    assert.doesNotMatch(android, /BEGIN PRIVATE KEY/, 'no private keys in CI config');
  });

  it('R16. CI uses native runners, tag gates, checksums and artifact guards', () => {
    const desktop = readProjectFile('.github/workflows/desktop.yml') || '';
    const android = readProjectFile('.github/workflows/android.yml') || '';
    assert.match(desktop, /runs-on:\s*macos-latest/, 'DMG must build on macOS');
    assert.match(desktop, /runs-on:\s*windows-latest/, 'MSI must build on Windows');
    assert.match(desktop, /runs-on:\s*ubuntu-latest/, 'AppImage must build on Linux');
    assert.match(desktop, /release-meta\.mjs --tag=/, 'desktop must gate tags against package.json');
    assert.match(android, /release-meta\.mjs --tag=/, 'android must gate tags against package.json');
    assert.match(desktop, /make-checksums\.mjs/, 'desktop must publish checksums');
    assert.match(android, /make-checksums\.mjs/, 'android must publish checksums');
    assert.match(desktop, /Assemble clean release payload/, 'desktop must assemble a clean payload dir');
    assert.match(desktop, /Publish exactly and only these files/, 'desktop release must publish an allowlisted payload');
    assert.match(desktop, /runner-release\.js/, 'desktop CI must run the release suite');
    assert.match(android, /runner-release\.js/, 'android CI must run the release suite');
  });
});

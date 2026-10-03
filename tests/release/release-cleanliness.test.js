import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readProjectFile, fileExists, PROJECT_ROOT } from '../helpers/test-utils.js';

function trackedFiles() {
  return execFileSync('git', ['ls-files'], { encoding: 'utf8', cwd: PROJECT_ROOT });
}

describe('Release hardening — cleanliness and manifest regressions', () => {
  it('R17. no signing credentials are tracked in Git', () => {
    const files = trackedFiles().split('\n').filter(Boolean);
    const offenders = files.filter((f) => /\.(jks|keystore|p12|pfx|pem|key)$/i.test(f));
    assert.deepStrictEqual(offenders, [], `credential files must not be tracked: ${offenders.join(', ')}`);
  });

  it('R18. .gitignore blocks future credential commits', () => {
    const ignore = readProjectFile('.gitignore') || '';
    for (const pattern of ['*.jks', '*.keystore', '*.p12', '*.pfx', '*.pem']) {
      assert.ok(
        ignore.split('\n').some((line) => line.trim() === pattern),
        `.gitignore must contain "${pattern}"`,
      );
    }
  });

  it('R19. release scripts and workflows contain no machine-specific paths', () => {
    const targets = [
      'scripts/release-meta.mjs',
      'scripts/make-checksums.mjs',
      'scripts/make-manifest.mjs',
      'scripts/validate-build.mjs',
      'scripts/generate-icons.py',
      '.github/workflows/android.yml',
      '.github/workflows/desktop.yml',
    ];
    const bad = [/\/home\//, /\/data\/data\//, /C:\\/, /C:\//, /\/Users\//];
    for (const t of targets) {
      const content = readProjectFile(t) || '';
      assert.ok(content.length > 0, `${t} must exist`);
      for (const re of bad) {
        assert.doesNotMatch(content, re, `${t} must not contain machine-specific path ${re}`);
      }
    }
  });

  it('R20. release manifest is correct and deterministic', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'omega-manifest-'));
    try {
      fs.writeFileSync(path.join(tmp, 'Omega-9.9.9.apk'), 'bytes-one');
      fs.writeFileSync(path.join(tmp, 'Omega-9.9.9.AppImage'), 'bytes-two');
      const run = (extra = []) =>
        execFileSync('node', ['scripts/make-manifest.mjs', tmp, '--platform=android', '--signing=android-dev', ...extra], {
          encoding: 'utf8',
        });
      run();
      const first = JSON.parse(fs.readFileSync(path.join(tmp, 'manifest.json'), 'utf8'));
      assert.strictEqual(first.length, 2, 'one entry per artifact');
      const pkg = JSON.parse(readProjectFile('package.json') || '{}');
      for (const entry of first) {
        assert.strictEqual(entry.version, pkg.version, 'manifest version must equal package.json');
        assert.strictEqual(entry.platform, 'android');
        assert.strictEqual(entry.signing, 'android-dev');
        assert.match(entry.sha256, /^[0-9a-f]{64}$/);
        assert.match(entry.commit, /^[0-9a-f]{40}$|^unknown$/);
        assert.ok(!Number.isNaN(Date.parse(entry.builtAt)), 'builtAt must be a valid timestamp');
        const expected = crypto.createHash('sha256').update(fs.readFileSync(path.join(tmp, entry.artifact))).digest('hex');
        assert.strictEqual(entry.sha256, expected, `sha256 must match file bytes for ${entry.artifact}`);
      }
      // Sorted by filename, stable across runs apart from builtAt.
      assert.deepStrictEqual(first.map((e) => e.artifact), ['Omega-9.9.9.AppImage', 'Omega-9.9.9.apk']);
      const strip = (list) => list.map(({ builtAt, ...rest }) => rest);
      run();
      const second = JSON.parse(fs.readFileSync(path.join(tmp, 'manifest.json'), 'utf8'));
      assert.deepStrictEqual(strip(second), strip(first), 'manifest must be deterministic');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('R21. checksums and manifest agree on every artifact hash', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'omega-agree-'));
    try {
      fs.writeFileSync(path.join(tmp, 'Omega-9.9.9.dmg'), 'dmg-bytes');
      execFileSync('node', ['scripts/make-manifest.mjs', tmp, '--platform=mac', '--signing=mac-unsigned'], { stdio: 'pipe' });
      execFileSync('node', ['scripts/make-checksums.mjs', tmp, '--extra=manifest.json'], { stdio: 'pipe' });
      const sums = new Map(
        fs.readFileSync(path.join(tmp, 'SHA256SUMS.txt'), 'utf8').trim().split('\n').map((line) => {
          const [hash, file] = line.split(/\s+/);
          return [file, hash];
        }),
      );
      const manifest = JSON.parse(fs.readFileSync(path.join(tmp, 'manifest.json'), 'utf8'));
      for (const entry of manifest) {
        assert.strictEqual(sums.get(entry.artifact), entry.sha256, `checksum mismatch for ${entry.artifact}`);
      }
      assert.ok(sums.has('manifest.json'), 'checksums must cover the manifest itself');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('R22. manifest tooling fails loudly without signing context', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'omega-nosign-'));
    try {
      fs.writeFileSync(path.join(tmp, 'Omega-9.9.9.msi'), 'msi-bytes');
      assert.throws(
        () => execFileSync('node', ['scripts/make-manifest.mjs', tmp, '--platform=windows'], { stdio: 'pipe' }),
        /Command failed/,
        'missing --signing must exit non-zero (signing status must never be silent)',
      );
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('R23. release publishes exactly the expected payload — nothing else', () => {
    const desktop = readProjectFile('.github/workflows/desktop.yml') || '';
    // The publish step globs the assembled payload dir only.
    assert.match(desktop, /payload\/\*\.dmg payload\/\*\.msi payload\/\*\.AppImage payload\/manifest-\*\.json payload\/SHA256SUMS\.txt/);
    assert.doesNotMatch(desktop, /merge-multiple:\s*true/, 'artifacts must not be merged (filename collisions)');
    const android = readProjectFile('.github/workflows/android.yml') || '';
    assert.match(android, /build-output\/\*\.apk build-output\/SHA256SUMS\.txt build-output\/manifest\.json/);
  });
});

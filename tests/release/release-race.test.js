import { describe, it } from 'node:test';
import assert from 'node:assert';
import { execFileSync } from 'node:child_process';
import { readProjectFile, PROJECT_ROOT } from '../helpers/test-utils.js';

function trackedFiles() {
  return execFileSync('git', ['ls-files'], { encoding: 'utf8', cwd: PROJECT_ROOT });
}

describe('Release hardening — race-safe publication, reproducible CI, least privilege', () => {
  it('R36. both workflows share the one safe release-creation strategy', () => {
    for (const file of ['.github/workflows/android.yml', '.github/workflows/desktop.yml']) {
      const yml = readProjectFile(file) || '';
      assert.doesNotMatch(yml, /gh release delete/, `${file} must never delete/recreate the shared release`);
      // Idempotent pattern: reuse when present, create when missing,
      // fall back to clobber-upload when creation races.
      assert.match(yml, /gh release view/, `${file} must reuse the existing release when present`);
      assert.match(yml, /gh release create/, `${file} must create the release when missing`);
      assert.match(yml, /falling back to clobber upload/, `${file} must survive a concurrent create race`);
      assert.match(yml, /--clobber/, `${file} must clobber-upload so re-runs replace assets`);
      // Tag-only, version-tag shaped, fail-closed publication.
      assert.match(
        yml,
        /if:\s*startsWith\(github\.ref,\s*['"]refs\/tags\/v['"]\)/,
        `${file} publish must run on v* tags only`,
      );
      assert.match(yml, /v\[0-9\]\*/, `${file} must validate the tag shape`);
      assert.match(yml, /refusing to publish non-version tag/, `${file} must refuse non-version tags`);
    }
    // The publish steps must not be allowed to fail silently.
    const android = readProjectFile('.github/workflows/android.yml') || '';
    const relStart = android.indexOf('Create or Update GitHub Release');
    const relEnd = android.indexOf('Report pipeline telemetry', relStart);
    assert.doesNotMatch(
      android.slice(relStart, relEnd),
      /continue-on-error/,
      'android publish must fail the job on error',
    );
    const desktop = readProjectFile('.github/workflows/desktop.yml') || '';
    const pubStart = desktop.indexOf('Publish to GitHub Release');
    assert.ok(pubStart !== -1, 'desktop publish step must exist');
    assert.doesNotMatch(
      desktop.slice(pubStart),
      /continue-on-error/,
      'desktop publish must fail the job on error',
    );
  });

  it('R37. concurrent android/desktop uploads compose (disjoint asset sets)', () => {
    const android = readProjectFile('.github/workflows/android.yml') || '';
    const desktop = readProjectFile('.github/workflows/desktop.yml') || '';
    // Platform-scoped metadata: a shared SHA256SUMS.txt / manifest.json
    // would let the last uploader destroy the other platform's checksums.
    for (const [file, yml, sum, manifest] of [
      ['android.yml', android, 'SHA256SUMS-android.txt', 'manifest-android.json'],
      ['desktop.yml', desktop, 'SHA256SUMS-desktop.txt', 'manifest-'],
    ]) {
      assert.ok(yml.includes(sum), `${file} must publish platform-scoped ${sum}`);
      assert.ok(yml.includes(manifest), `${file} must publish platform-scoped ${manifest} manifest(s)`);
    }
    const releaseLines = (yml) =>
      yml.split('\n').filter((l) => /gh release (upload|create)/.test(l));
    for (const line of [...releaseLines(android), ...releaseLines(desktop)]) {
      assert.doesNotMatch(
        line,
        /SHA256SUMS\.txt(?!-)/,
        `release upload must not use the shared SHA256SUMS.txt name: ${line.trim()}`,
      );
    }
    assert.doesNotMatch(
      releaseLines(desktop).join('\n'),
      /manifest\.json/,
      'desktop release must use manifest-*.json, never a shared manifest.json',
    );
    // Binaries stay disjoint too: APKs only from android, DMG/MSI/AppImage only from desktop.
    assert.doesNotMatch(releaseLines(desktop).join('\n'), /\.apk/, 'desktop must never upload APKs');
    assert.doesNotMatch(releaseLines(android).join('\n'), /\.(dmg|msi|AppImage)/, 'android must never upload desktop artifacts');
  });

  it('R38. CI runs least privilege: read by default, write only to publish', () => {
    // Strip `#` comments: prose may name the grants, only YAML counts.
    const code = (yml) => yml.split('\n').filter((l) => !/^\s*#/.test(l)).join('\n');
    for (const file of ['.github/workflows/android.yml', '.github/workflows/desktop.yml']) {
      const yml = code(readProjectFile(file) || '');
      assert.match(
        yml,
        /permissions:\s*\n\s*contents:\s*read/,
        `${file} must default to read-only repository permissions`,
      );
    }
    const desktop = code(readProjectFile('.github/workflows/desktop.yml') || '');
    const pubStart = desktop.indexOf('release-desktop:');
    assert.ok(pubStart !== -1, 'release-desktop job must exist');
    assert.match(
      desktop.slice(0, pubStart),
      /contents:\s*read/,
      'desktop build jobs must stay read-only',
    );
    assert.doesNotMatch(
      desktop.slice(0, pubStart),
      /contents:\s*write/,
      'no desktop build job may hold contents:write',
    );
    assert.match(
      desktop.slice(pubStart),
      /contents:\s*write/,
      'release-desktop (the only publishing job) needs contents:write',
    );
    const android = readProjectFile('.github/workflows/android.yml') || '';
    // Single-job workflow: build + tag-publish + telemetry share one job,
    // so the job (not the workflow) carries the write grant, with the
    // branch-publish ban enforced by the step-level tag gate (R32).
    assert.match(code(android), /contents:\s*write/, 'android publish job needs contents:write');
  });

  it('R39. CI installs are reproducible from the committed lockfile', () => {
    // Strip `#` comments: prose may name the avoided flag, only YAML counts.
    const code = (yml) => yml.split('\n').filter((l) => !/^\s*#/.test(l)).join('\n');
    for (const file of ['.github/workflows/android.yml', '.github/workflows/desktop.yml']) {
      const yml = code(readProjectFile(file) || '');
      const installs = yml.split('\n').filter((l) => /run:\s*pnpm install/.test(l));
      assert.ok(installs.length > 0, `${file} must install dependencies via pnpm`);
      for (const line of installs) {
        assert.match(line, /--frozen-lockfile/, `${file} must never mutate the lockfile in CI: ${line.trim()}`);
      }
      assert.doesNotMatch(
        yml,
        /--dangerously-allow-all-builds/,
        `${file} must not blanket-allow builds: postinstalls are allowlisted in pnpm-workspace.yaml`,
      );
    }
    const workspace = readProjectFile('pnpm-workspace.yaml') || '';
    for (const dep of ['electron', 'electron-builder', 'esbuild']) {
      assert.ok(workspace.includes(dep), `pnpm-workspace.yaml must allowlist the ${dep} postinstall`);
    }
  });

  it('R40. internal agent state is not product/release content', () => {
    const ignore = readProjectFile('.gitignore') || '';
    assert.ok(
      ignore.split('\n').some((line) => line.trim() === '.opencode/'),
      '.gitignore must ignore .opencode/',
    );
    const files = trackedFiles().split('\n').filter(Boolean);
    const offenders = files.filter((f) => f.startsWith('.opencode/'));
    assert.deepStrictEqual(offenders, [], `.opencode state must not be tracked: ${offenders.join(', ')}`);
  });
});

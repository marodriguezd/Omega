import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readProjectFile, fileExists } from '../helpers/test-utils.js';

describe('Release hardening — metadata, naming and version truth', () => {
  const pkg = JSON.parse(readProjectFile('package.json') || '{}');

  it('R1. package.json carries full release identity (appId, names, license, repo)', () => {
    assert.strictEqual(pkg?.build?.appId, 'com.marodriguezd.omega');
    assert.strictEqual(pkg?.build?.productName, 'Omega');
    assert.strictEqual(pkg?.license, 'MIT');
    assert.strictEqual(pkg?.repository?.url, 'https://github.com/marodriguezd/Omega.git');
    assert.strictEqual(pkg?.homepage, 'https://github.com/marodriguezd/Omega');
    assert.strictEqual(pkg?.main, 'electron/main.cjs');
  });

  it('R2. version is semver and the single source of truth', () => {
    assert.match(pkg?.version ?? '', /^\d+\.\d+\.\d+(-[\w.]+)?$/, 'version must be semver');
    const cap = readProjectFile('capacitor.config.ts') || '';
    assert.match(cap, /appId:\s*['"]com\.marodriguezd\.omega['"]/, 'capacitor appId must match builder appId');
    assert.match(cap, /appName:\s*['"]Omega['"]/, 'capacitor appName must match productName');
  });

  it('R3. every target derives artifact names from ${version}', () => {
    for (const section of ['mac', 'win', 'linux', 'dmg', 'msi']) {
      const name = pkg?.build?.[section]?.artifactName ?? '';
      assert.match(name, /Omega-\$\{version\}/, `build.${section}.artifactName must embed version`);
    }
    assert.strictEqual(pkg?.build?.win?.executableName, 'Omega');
    assert.strictEqual(pkg?.build?.linux?.executableName, 'Omega');
    assert.strictEqual(pkg?.desktopName, 'Omega', 'root desktopName must be Omega for WM_CLASS association');
    assert.strictEqual(pkg?.build?.linux?.syncDesktopName, true, 'linux must sync .desktop name with app_id');
  });

  it('R4. release-meta derives deterministic names and gates tag matches', async () => {
    const { execFileSync } = await import('node:child_process');
    const out = execFileSync('node', ['scripts/release-meta.mjs', '--json'], { encoding: 'utf8' });
    const meta = JSON.parse(out);
    assert.strictEqual(meta.version, pkg.version);
    assert.deepStrictEqual(meta.artifacts, {
      apk: `Omega-${pkg.version}.apk`,
      dmg: `Omega-${pkg.version}.dmg`,
      msi: `Omega-${pkg.version}.msi`,
      appimage: `Omega-${pkg.version}.AppImage`,
    });
    // Matching tag passes …
    execFileSync('node', ['scripts/release-meta.mjs', `--tag=v${pkg.version}`], { stdio: 'pipe' });
    // … mismatched tag fails.
    assert.throws(
      () => execFileSync('node', ['scripts/release-meta.mjs', '--tag=v0.0.0-mismatch'], { stdio: 'pipe' }),
      /Command failed/,
      'mismatched tag must exit non-zero',
    );
  });

  it('R35. third-party license status is documented without inventing the Hydrocicle license', () => {
    const notices = readProjectFile('THIRD-PARTY-NOTICES.md') || '';
    assert.ok(notices.length > 0, 'THIRD-PARTY-NOTICES.md must exist for the public release');
    assert.match(
      notices,
      /Bubble-Breathing\/LICENSE/,
      'Bubble-Breathing Apache-2.0 evidence must be cited',
    );
    assert.match(notices, /Hydrocicle/, 'Hydrocicle status must be documented, not silent');
    assert.match(
      notices,
      /OWNER CONFIRMATION REQUIRED/,
      'the unverified Hydrocicle license must stay flagged for the owner',
    );
    // No license may be asserted for Hydrocicle: its pinned commit ships no
    // LICENSE file and upstream metadata reports no license.
    const start = notices.indexOf('## Hydrocicle');
    assert.ok(start !== -1, 'Hydrocicle section must exist');
    const next = notices.indexOf('\n## ', start + 3);
    const hydro = next === -1 ? notices.slice(start) : notices.slice(start, next);
    // The section may quote the README's claim, but must explicitly record
    // the evidence gap and assert no license of its own: the pinned commit
    // ships no LICENSE file and upstream metadata reports no license.
    assert.match(hydro, /no `LICENSE` file/i, 'must record the missing LICENSE file');
    assert.match(hydro, /"license": null/, 'must record the upstream metadata result');
    assert.match(hydro, /No license is asserted here/, 'must not assert a license without evidence');
  });

  it('R31. public download links resolve to the versioned v1.0.0 release asset', () => {
    // The floating `latest` release carries branch/dev APKs; links labeled
    // with the release version must target the pinned tag asset instead.
    for (const doc of ['README.md', 'README.es.md']) {
      const text = readProjectFile(doc) || '';
      assert.doesNotMatch(
        text,
        /releases\/latest\/download\//,
        `${doc} must not link the floating dev 'latest' release as the versioned download`,
      );
      assert.match(
        text,
        new RegExp(`releases/download/v${pkg.version}/Omega-${pkg.version}\\.apk`),
        `${doc} must link the pinned v${pkg.version} release asset`,
      );
    }
  });
});

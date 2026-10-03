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
});

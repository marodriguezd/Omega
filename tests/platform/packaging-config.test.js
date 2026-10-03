import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readProjectFile, fileExists } from '../helpers/test-utils.js';

describe('Packaging configuration (electron-builder + Capacitor + scripts)', () => {
  it('P11. electron-builder targets DMG, MSI and AppImage with stable appId', () => {
    const pkg = JSON.parse(readProjectFile('package.json') || '{}');
    assert.strictEqual(pkg?.build?.appId, 'com.marodriguezd.omega');
    assert.strictEqual(pkg?.build?.productName, 'Omega');
    assert.match(JSON.stringify(pkg?.build?.mac ?? {}), /dmg/i, 'mac must target dmg');
    assert.match(JSON.stringify(pkg?.build?.win ?? {}), /msi/i, 'win must target msi');
    assert.match(JSON.stringify(pkg?.build?.linux ?? {}), /AppImage/i, 'linux must target AppImage');
    assert.match(JSON.stringify(pkg?.build ?? {}), /Omega-\$\{version\}/, 'artifacts must be named Omega-${version}');
  });

  it('P12. Maintainable npm scripts exist for every platform flow', () => {
    const pkg = JSON.parse(readProjectFile('package.json') || '{}');
    for (const s of [
      'dev',
      'build',
      'validate',
      'electron:dev',
      'electron:build',
      'electron:pack',
      'dist:all',
      'dist:mac',
      'dist:win',
      'dist:linux',
      'android:sync',
      'android:build',
    ]) {
      assert.ok(pkg?.scripts?.[s], `script "${s}" must exist`);
    }
    // electron-builder must never self-publish: releases ship only via the
    // allowlisted release-desktop payload job.
    for (const s of ['dist:mac', 'dist:win', 'dist:linux']) {
      assert.match(pkg?.scripts?.[s] ?? '', /--publish never/, `"${s}" must disable electron-builder publish`);
    }
    // An empty CSC_LINK secret must be unset before packaging: electron-builder
    // resolves "" to the project dir and aborts with "<dir> not a file".
    const desktop = readProjectFile('.github/workflows/desktop.yml') || '';
    assert.match(desktop, /unset CSC_LINK/, 'mac packaging must unset an empty CSC_LINK');
    // Windows must mirror macOS: an empty CSC_LINK is removed, never passed
    // through, so absent secrets yield a valid unsigned MSI.
    assert.match(desktop, /Remove-Item Env:\\CSC_LINK/, 'win packaging must unset an empty CSC_LINK like mac');
  });

  it('P13. Capacitor Android config and manifest cover release APK needs', () => {
    const cap = readProjectFile('capacitor.config.ts') || '';
    assert.match(cap, /appId:\s*['"]com\.marodriguezd\.omega['"]/, 'appId must be stable');
    assert.match(cap, /webDir:\s*['"]dist['"]/, 'webDir must be dist');
    const manifest = readProjectFile('android/app/src/main/AndroidManifest.xml') || '';
    for (const perm of ['WAKE_LOCK', 'VIBRATE', 'INTERNET']) {
      assert.ok(manifest.includes(perm), `manifest must declare ${perm}`);
    }
  });

  it('P14. Icons, Vite base and validator script are present', () => {
    assert.ok(fileExists('build/icon.png'), 'build/icon.png must exist for electron-builder');
    const vite = readProjectFile('vite.config.ts') || '';
    assert.match(vite, /base:\s*['"]\.\/['"]/, 'vite base must be "./" for file:// bundles');
    assert.ok(fileExists('scripts/validate-build.mjs'), 'scripts/validate-build.mjs must exist');
  });

  it('P15. every local electron-builder command is publish-safe', () => {
    // A developer running any local distribution script must never trigger
    // a GitHub publish by accident: publication happens ONLY via the
    // allowlisted release-desktop job (`gh release upload`).
    const pkg = JSON.parse(readProjectFile('package.json') || '{}');
    const builderScripts = Object.entries(pkg?.scripts ?? {}).filter(([, cmd]) =>
      String(cmd).includes('electron-builder'),
    );
    assert.ok(builderScripts.length >= 5, 'expected at least the six distribution scripts');
    for (const [name, cmd] of builderScripts) {
      assert.match(
        String(cmd),
        /--publish never/,
        `"${name}" invokes electron-builder and must pass --publish never`,
      );
    }
  });

  it('P16. production web build does not require mixed content', () => {
    const cap = readProjectFile('capacitor.config.ts') || '';
    assert.doesNotMatch(cap, /allowMixedContent/, 'capacitor config must not enable mixed content');
    assert.match(cap, /androidScheme:\s*['"]https['"]/, 'android web content must load over https');
    const manifest = readProjectFile('android/app/src/main/AndroidManifest.xml') || '';
    assert.doesNotMatch(
      manifest,
      /usesCleartextTraffic\s*=\s*["']true["']/,
      'manifest must not opt into cleartext traffic',
    );
  });
});

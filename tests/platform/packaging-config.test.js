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
      'dist:mac',
      'dist:win',
      'dist:linux',
      'android:sync',
      'android:build',
    ]) {
      assert.ok(pkg?.scripts?.[s], `script "${s}" must exist`);
    }
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
});

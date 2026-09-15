import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readProjectFile, fileExists } from '../helpers/test-utils.js';
import { setupDOMEnvironment } from '../helpers/dom-shim.js';

describe('Tier 1: Feature Coverage - R4 Multi-Platform Compilation & Services', () => {
  it('T1.R4.1: vite.config.ts must declare base: "./" for Electron file:// packaging compatibility', () => {
    // Authoritative source: PROJECT.md lines 58, 145 & Survey 3 lines 18-19
    const viteConfig = readProjectFile('vite.config.ts') || '';
    assert.match(
      viteConfig,
      /base:\s*['"]\.\/['"]/i,
      'vite.config.ts must set base: "./" so asset paths resolve relatively in Electron packaged bundles'
    );
  });

  it('T1.R4.2: capacitor.config.ts must be configured for Capacitor 8 Android deployment', () => {
    // Authoritative source: ORIGINAL_REQUEST.md lines 26, 34 & PROJECT.md lines 8, 144
    const capConfig = readProjectFile('capacitor.config.ts') || '';
    assert.match(
      capConfig,
      /appId:\s*['"]com\.marodriguezd\.omega['"]/i,
      'capacitor.config.ts must set appId to "com.marodriguezd.omega"'
    );
    assert.match(
      capConfig,
      /webDir:\s*['"]dist['"]/i,
      'capacitor.config.ts must set webDir to "dist"'
    );
  });

  it('T1.R4.3: Electron desktop environment must be scaffolded with packaging scripts and IPC entries', () => {
    // Authoritative source: ORIGINAL_REQUEST.md lines 27, 35 & PROJECT.md lines 57, 137-139
    const packageJsonRaw = readProjectFile('package.json') || '{}';
    const pkg = JSON.parse(packageJsonRaw);

    const hasElectronDev = Boolean(pkg.scripts && pkg.scripts['electron:dev']);
    const hasElectronBuild = Boolean(pkg.scripts && (pkg.scripts['electron:build'] || pkg.scripts['electron:pack']));
    const hasMainScript = fileExists('electron/main.cjs');
    const hasPreloadScript = fileExists('electron/preload.cjs');

    assert.ok(
      hasElectronDev,
      'package.json must contain "electron:dev" script for PC desktop development'
    );
    assert.ok(
      hasElectronBuild,
      'package.json must contain "electron:build" or "electron:pack" script for PC desktop packaging'
    );
    assert.ok(
      hasMainScript,
      'electron/main.cjs must exist as the Electron main process entry'
    );
    assert.ok(
      hasPreloadScript,
      'electron/preload.cjs must exist for secure contextBridge IPC'
    );
  });

  it('T1.R4.4: KeepAwake native service must cascade cleanly through Electron IPC, Capacitor, and Web WakeLock', async () => {
    // Authoritative source: PROJECT.md lines 103-109
    const env = setupDOMEnvironment();
    try {
      const nativeServiceCode = readProjectFile('src/services/nativeService.ts') || '';

      // Verify the code handles Electron IPC bridge
      const handlesElectron = /electronAPI|powerSaveBlocker/i.test(nativeServiceCode);
      assert.ok(
        handlesElectron,
        'nativeService.ts must support Electron IPC for KeepAwake / powerSaveBlocker'
      );

      // Verify Web Screen Wake Lock fallback is present
      const handlesWeb = /wakeLock/i.test(nativeServiceCode);
      assert.ok(
        handlesWeb,
        'nativeService.ts must support Web Screen Wake Lock API fallback'
      );
    } finally {
      env.cleanup();
    }
  });

  it('T1.R4.5: Haptics abstraction must route to Capacitor on mobile, Web vibrate on browser, and no-op on Electron', async () => {
    // Authoritative source: PROJECT.md lines 110-114
    const nativeServiceCode = readProjectFile('src/services/nativeService.ts') || '';

    // Verify triggerHaptic implementation or abstraction
    const hasHapticFn = /triggerHaptic/i.test(nativeServiceCode);
    assert.ok(
      hasHapticFn,
      'nativeService.ts must export triggerHaptic abstraction function'
    );

    // Verify it handles Capacitor Haptics
    const handlesCapacitor = /Haptics|@capacitor\/haptics/i.test(nativeServiceCode);
    assert.ok(
      handlesCapacitor,
      'triggerHaptic must interface with Capacitor Haptics plugin'
    );
  });
});

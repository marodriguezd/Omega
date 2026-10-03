import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readProjectFile, fileExists } from '../helpers/test-utils.js';

describe('Platform abstraction layer (src/platform)', () => {
  it('P1. Runtime detection exposes electron/capacitor/web without duplicating logic', () => {
    const runtime = readProjectFile('src/platform/runtime.ts') || '';
    assert.match(runtime, /getRuntimeKind/, 'runtime.ts must export getRuntimeKind');
    assert.match(runtime, /isElectron/, 'runtime.ts must export isElectron');
    assert.match(runtime, /isCapacitorNative|capacitor/i, 'runtime.ts must detect Capacitor native');
    assert.match(runtime, /electronAPI/, 'runtime detection must honor the Electron preload bridge');
  });

  it('P2. Storage abstraction wraps localStorage with memory fallback and JSON safety', () => {
    assert.ok(fileExists('src/platform/storage.ts'), 'src/platform/storage.ts must exist');
    const storage = readProjectFile('src/platform/storage.ts') || '';
    assert.match(storage, /storageGetJson|platformStorage/, 'storage.ts must export JSON-safe helpers');
    assert.match(storage, /QuotaExceededError/, 'storage.ts must tolerate quota errors');
    assert.match(storage, /MemoryBackend|memory/i, 'storage.ts must fall back when localStorage is unavailable');
  });

  it('P3. KeepAwake cascades Electron IPC -> Capacitor -> Web wakeLock', () => {
    const keepAwake = readProjectFile('src/platform/keepAwake.ts') || '';
    assert.match(keepAwake, /electronAPI\.setKeepAwake/, 'keepAwake must try Electron IPC first');
    assert.match(keepAwake, /KeepAwake\.keepAwake|@capacitor-community\/keep-awake/, 'keepAwake must use Capacitor plugin');
    assert.match(keepAwake, /wakeLock/, 'keepAwake must fall back to Web wakeLock');
    assert.match(keepAwake, /disableKeepAwake/, 'keepAwake must export disableKeepAwake');
  });

  it('P4. Haptics routes Capacitor native -> vibrate -> Electron no-op', () => {
    const haptics = readProjectFile('src/platform/haptics.ts') || '';
    assert.match(haptics, /triggerHaptic/, 'haptics.ts must export triggerHaptic');
    assert.match(haptics, /Haptics|@capacitor\/haptics/, 'haptics must use Capacitor Haptics plugin');
    assert.match(haptics, /navigator\.vibrate/, 'haptics must fall back to navigator.vibrate');
    assert.match(haptics, /isElectron|electronAPI/, 'haptics must no-op on Electron desktop');
  });

  it('P5. Lifecycle exposes back-button handler with cleanup', () => {
    const lifecycle = readProjectFile('src/platform/lifecycle.ts') || '';
    assert.match(lifecycle, /registerBackButtonHandler/, 'lifecycle.ts must export registerBackButtonHandler');
    assert.match(lifecycle, /backButton/, 'lifecycle must listen to Capacitor backButton');
    assert.match(lifecycle, /exitApp|history\.back/, 'lifecycle must exit or navigate back when unhandled');
  });

  it('P6. nativeService remains a thin backward-compatible facade (no duplicated logic)', () => {
    const native = readProjectFile('src/services/nativeService.ts') || '';
    assert.match(native, /from '\.\.\/platform/, 'nativeService must delegate to ../platform');
    assert.match(native, /triggerHaptic/, 'nativeService must preserve triggerHaptic export');
    const lines = native.split('\n').length;
    assert.ok(lines < 60, `nativeService facade must stay small (got ${lines} lines)`);
  });

  it('P7. Platform barrel exports the full capability surface', () => {
    const index = readProjectFile('src/platform/index.ts') || '';
    for (const sym of [
      'enableKeepAwake',
      'disableKeepAwake',
      'triggerHaptic',
      'registerBackButtonHandler',
      'platformStorage',
      'getRuntimeKind',
      'getPlatformInfo',
    ]) {
      assert.ok(index.includes(sym), `platform index must export ${sym}`);
    }
  });
});

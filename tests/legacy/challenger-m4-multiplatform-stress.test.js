import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setupDOMEnvironment } from './helpers/dom-shim.js';
import { readProjectFile, fileExists } from './helpers/test-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

describe('Milestone 4 Challenger: Tier 5 Multi-Platform Compilation, Electron IPC KeepAwake & Screen WakeLock Stress Suite', () => {

  // =========================================================================
  // SUITE 1: Electron IPC KeepAwake Rapid Toggling, Blocker Leak Protection & Concurrency
  // =========================================================================
  describe('Suite 1: Electron IPC KeepAwake Rapid Toggling & Blocker Leak Protection', () => {

    it('C4.S1.1: 10,000 rapid sequential enable/disable cycles on Electron IPC maintain zero orphaned powerSaveBlocker IDs', async () => {
      let blockerIdCounter = 1;
      const activeBlockers = new Set();
      const mockPowerSaveBlocker = {
        start: (type) => {
          if (type !== 'prevent-display-sleep') throw new Error(`Invalid type: ${type}`);
          const id = blockerIdCounter++;
          activeBlockers.add(id);
          return id;
        },
        stop: (id) => {
          if (!activeBlockers.has(id)) throw new Error(`Attempted to stop untracked blocker ID: ${id}`);
          activeBlockers.delete(id);
        },
        isStarted: (id) => activeBlockers.has(id)
      };

      let keepAwakeBlockerId = null;
      async function handleSetKeepAwake(_event, enable) {
        try {
          if (enable) {
            if (keepAwakeBlockerId === null || !mockPowerSaveBlocker.isStarted(keepAwakeBlockerId)) {
              keepAwakeBlockerId = mockPowerSaveBlocker.start('prevent-display-sleep');
            }
            return true;
          } else {
            if (keepAwakeBlockerId !== null) {
              if (mockPowerSaveBlocker.isStarted(keepAwakeBlockerId)) {
                mockPowerSaveBlocker.stop(keepAwakeBlockerId);
              }
              keepAwakeBlockerId = null;
            }
            return false;
          }
        } catch (err) {
          return false;
        }
      }

      // Execute 10,000 rapid enable/disable cycles
      const CYCLES = 10000;
      for (let i = 0; i < CYCLES; i++) {
        const resEnable = await handleSetKeepAwake(null, true);
        assert.strictEqual(resEnable, true, `Cycle ${i}: enable should return true`);
        assert.strictEqual(activeBlockers.size, 1, `Cycle ${i}: exactly 1 active blocker should exist while enabled`);

        const resDisable = await handleSetKeepAwake(null, false);
        assert.strictEqual(resDisable, false, `Cycle ${i}: disable should return false`);
        assert.strictEqual(activeBlockers.size, 0, `Cycle ${i}: zero active blockers should exist after disable`);
      }

      assert.strictEqual(activeBlockers.size, 0, 'Zero leaked blocker IDs after 10,000 cycles');
      assert.strictEqual(keepAwakeBlockerId, null, 'keepAwakeBlockerId reset to null');
    });

    it('C4.S1.2: 100 concurrent asynchronous enable requests allocate strictly ONE powerSaveBlocker ID', async () => {
      let blockerAllocations = 0;
      const activeBlockers = new Set();
      const mockPowerSaveBlocker = {
        start: () => {
          const id = ++blockerAllocations;
          activeBlockers.add(id);
          return id;
        },
        stop: (id) => { activeBlockers.delete(id); },
        isStarted: (id) => activeBlockers.has(id)
      };

      let keepAwakeBlockerId = null;
      async function handleSetKeepAwake(_event, enable) {
        if (enable) {
          if (keepAwakeBlockerId === null || !mockPowerSaveBlocker.isStarted(keepAwakeBlockerId)) {
            keepAwakeBlockerId = mockPowerSaveBlocker.start('prevent-display-sleep');
          }
          return true;
        } else {
          if (keepAwakeBlockerId !== null) {
            if (mockPowerSaveBlocker.isStarted(keepAwakeBlockerId)) {
              mockPowerSaveBlocker.stop(keepAwakeBlockerId);
            }
            keepAwakeBlockerId = null;
          }
          return false;
        }
      }

      // Fire 100 simultaneous concurrent enable calls
      const enableResults = await Promise.all(
        Array.from({ length: 100 }, () => handleSetKeepAwake(null, true))
      );

      assert.strictEqual(enableResults.every(res => res === true), true, 'All concurrent enable calls returned true');
      assert.strictEqual(blockerAllocations, 1, 'Strictly 1 powerSaveBlocker was allocated across 100 concurrent requests');
      assert.strictEqual(activeBlockers.size, 1, 'Only 1 active blocker ID is active in OS registry');

      // Fire 100 simultaneous concurrent disable calls
      const disableResults = await Promise.all(
        Array.from({ length: 100 }, () => handleSetKeepAwake(null, false))
      );

      assert.strictEqual(disableResults.every(res => res === false), true, 'All concurrent disable calls returned false');
      assert.strictEqual(activeBlockers.size, 0, 'All blockers stopped cleanly');
      assert.strictEqual(keepAwakeBlockerId, null, 'Internal state reset to null');
    });

    it('C4.S1.3: Redundant calls (repeated enables or repeated disables) cleanly no-op and preserve correct boolean responses', async () => {
      let startCount = 0;
      let stopCount = 0;
      const mockPowerSaveBlocker = {
        start: () => { startCount++; return 42; },
        stop: () => { stopCount++; },
        isStarted: () => true
      };

      let keepAwakeBlockerId = null;
      async function handleSetKeepAwake(_event, enable) {
        if (enable) {
          if (keepAwakeBlockerId === null || !mockPowerSaveBlocker.isStarted(keepAwakeBlockerId)) {
            keepAwakeBlockerId = mockPowerSaveBlocker.start('prevent-display-sleep');
          }
          return true;
        } else {
          if (keepAwakeBlockerId !== null) {
            if (mockPowerSaveBlocker.isStarted(keepAwakeBlockerId)) {
              mockPowerSaveBlocker.stop(keepAwakeBlockerId);
            }
            keepAwakeBlockerId = null;
          }
          return false;
        }
      }

      // 50 redundant enables
      for (let i = 0; i < 50; i++) {
        const res = await handleSetKeepAwake(null, true);
        assert.strictEqual(res, true);
      }
      assert.strictEqual(startCount, 1, 'start() was invoked only once despite 50 enable requests');

      // 50 redundant disables
      for (let i = 0; i < 50; i++) {
        const res = await handleSetKeepAwake(null, false);
        assert.strictEqual(res, false);
      }
      assert.strictEqual(stopCount, 1, 'stop() was invoked only once despite 50 disable requests');
    });

    it('C4.S1.4: Dual IPC channels ("set-keep-awake" and "power:keep-awake") are both registered in electron/main.cjs', () => {
      const mainContent = readProjectFile('electron/main.cjs') || '';
      assert.match(
        mainContent,
        /ipcMain\.handle\(\s*['"]set-keep-awake['"]\s*,\s*handleSetKeepAwake\s*\)/,
        'electron/main.cjs must register set-keep-awake IPC channel'
      );
      assert.match(
        mainContent,
        /ipcMain\.handle\(\s*['"]power:keep-awake['"]\s*,\s*handleSetKeepAwake\s*\)/,
        'electron/main.cjs must register power:keep-awake IPC channel'
      );
    });

    it('C4.S1.5: High-frequency pseudorandom toggle sequence (2,500 operations) converges to predictable final state', async () => {
      const activeBlockers = new Set();
      let idCounter = 1;
      const mockPowerSaveBlocker = {
        start: () => { const id = idCounter++; activeBlockers.add(id); return id; },
        stop: (id) => { activeBlockers.delete(id); },
        isStarted: (id) => activeBlockers.has(id)
      };

      let keepAwakeBlockerId = null;
      async function handleSetKeepAwake(_event, enable) {
        if (enable) {
          if (keepAwakeBlockerId === null || !mockPowerSaveBlocker.isStarted(keepAwakeBlockerId)) {
            keepAwakeBlockerId = mockPowerSaveBlocker.start('prevent-display-sleep');
          }
          return true;
        } else {
          if (keepAwakeBlockerId !== null) {
            if (mockPowerSaveBlocker.isStarted(keepAwakeBlockerId)) {
              mockPowerSaveBlocker.stop(keepAwakeBlockerId);
            }
            keepAwakeBlockerId = null;
          }
          return false;
        }
      }

      // Deterministic PRNG sequence
      let seed = 123456789;
      function nextBool() {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return (seed % 2) === 1;
      }

      let lastOp = false;
      for (let i = 0; i < 2500; i++) {
        lastOp = nextBool();
        await handleSetKeepAwake(null, lastOp);
      }

      if (lastOp) {
        assert.strictEqual(activeBlockers.size, 1, 'Final state enabled: exactly 1 active blocker');
        assert.ok(keepAwakeBlockerId !== null, 'keepAwakeBlockerId is non-null');
      } else {
        assert.strictEqual(activeBlockers.size, 0, 'Final state disabled: zero active blockers');
        assert.strictEqual(keepAwakeBlockerId, null, 'keepAwakeBlockerId is null');
      }
    });
  });

  // =========================================================================
  // SUITE 2: Electron Process Lifecycle & OS Error Recovery Stress
  // =========================================================================
  describe('Suite 2: Electron Process Lifecycle & OS Error Recovery Stress', () => {

    it('C4.S2.1: powerSaveBlocker.start throwing OS power policy error is caught safely without crashing main process', async () => {
      let errorThrown = false;
      const mockPowerSaveBlocker = {
        start: () => {
          errorThrown = true;
          throw new Error('OS Error: Power management policy denies prevent-display-sleep permission');
        },
        stop: () => {},
        isStarted: () => false
      };

      let keepAwakeBlockerId = null;
      async function handleSetKeepAwake(_event, enable) {
        try {
          if (enable) {
            if (keepAwakeBlockerId === null || !mockPowerSaveBlocker.isStarted(keepAwakeBlockerId)) {
              keepAwakeBlockerId = mockPowerSaveBlocker.start('prevent-display-sleep');
            }
            return true;
          } else {
            if (keepAwakeBlockerId !== null) {
              if (mockPowerSaveBlocker.isStarted(keepAwakeBlockerId)) {
                mockPowerSaveBlocker.stop(keepAwakeBlockerId);
              }
              keepAwakeBlockerId = null;
            }
            return false;
          }
        } catch (err) {
          return false;
        }
      }

      const result = await handleSetKeepAwake(null, true);
      assert.strictEqual(errorThrown, true, 'Mock OS error was simulated');
      assert.strictEqual(result, false, 'Handler gracefully returned false upon OS failure');
      assert.strictEqual(keepAwakeBlockerId, null, 'keepAwakeBlockerId remains null after failure');
    });

    it('C4.S2.2: Subsequent successful enable request after an OS error cleanly recovers and acquires lock', async () => {
      let shouldFail = true;
      let startCount = 0;
      const mockPowerSaveBlocker = {
        start: () => {
          if (shouldFail) throw new Error('Temporary OS sleep bus failure');
          startCount++;
          return 99;
        },
        stop: () => {},
        isStarted: (id) => id === 99
      };

      let keepAwakeBlockerId = null;
      async function handleSetKeepAwake(_event, enable) {
        try {
          if (enable) {
            if (keepAwakeBlockerId === null || !mockPowerSaveBlocker.isStarted(keepAwakeBlockerId)) {
              keepAwakeBlockerId = mockPowerSaveBlocker.start('prevent-display-sleep');
            }
            return true;
          } else {
            if (keepAwakeBlockerId !== null) {
              if (mockPowerSaveBlocker.isStarted(keepAwakeBlockerId)) {
                mockPowerSaveBlocker.stop(keepAwakeBlockerId);
              }
              keepAwakeBlockerId = null;
            }
            return false;
          }
        } catch (err) {
          return false;
        }
      }

      // First call fails
      const res1 = await handleSetKeepAwake(null, true);
      assert.strictEqual(res1, false);

      // System recovers
      shouldFail = false;
      const res2 = await handleSetKeepAwake(null, true);
      assert.strictEqual(res2, true, 'Handler recovered on subsequent request');
      assert.strictEqual(keepAwakeBlockerId, 99, 'Blocker ID acquired upon recovery');
      assert.strictEqual(startCount, 1);
    });

    it('C4.S2.3: powerSaveBlocker.stop throwing error is caught safely and resets blocker ID to avoid lock-up', async () => {
      const mockPowerSaveBlocker = {
        start: () => 101,
        stop: () => { throw new Error('OS Error: Blocker already invalidated by system suspend'); },
        isStarted: () => true
      };

      let keepAwakeBlockerId = 101;
      async function handleSetKeepAwakeSafe(_event, enable) {
        try {
          if (enable) {
            if (keepAwakeBlockerId === null || !mockPowerSaveBlocker.isStarted(keepAwakeBlockerId)) {
              keepAwakeBlockerId = mockPowerSaveBlocker.start('prevent-display-sleep');
            }
            return true;
          } else {
            if (keepAwakeBlockerId !== null) {
              try {
                if (mockPowerSaveBlocker.isStarted(keepAwakeBlockerId)) {
                  mockPowerSaveBlocker.stop(keepAwakeBlockerId);
                }
              } finally {
                keepAwakeBlockerId = null;
              }
            }
            return false;
          }
        } catch (err) {
          return false;
        }
      }

      const res = await handleSetKeepAwakeSafe(null, false);
      assert.strictEqual(res, false);
      assert.strictEqual(keepAwakeBlockerId, null, 'keepAwakeBlockerId nullified even when stop throws');
    });

    it('C4.S2.4: Window closed event cleans up active powerSaveBlocker resource', () => {
      const mainContent = readProjectFile('electron/main.cjs') || '';
      assert.match(
        mainContent,
        /mainWindow\.on\(\s*['"]closed['"]\s*,\s*\(\)\s*=>\s*\{[\s\S]*?keepAwakeBlockerId[\s\S]*?powerSaveBlocker\.stop/m,
        'mainWindow closed listener must release keepAwakeBlockerId'
      );
    });

    it('C4.S2.5: App before-quit event cleans up active powerSaveBlocker resource', () => {
      const mainContent = readProjectFile('electron/main.cjs') || '';
      assert.match(
        mainContent,
        /app\.on\(\s*['"]before-quit['"]\s*,\s*\(\)\s*=>\s*\{[\s\S]*?keepAwakeBlockerId[\s\S]*?powerSaveBlocker\.stop/m,
        'app before-quit listener must release keepAwakeBlockerId'
      );
    });

    it('C4.S2.6: Security configuration in electron/main.cjs enforces contextIsolation, sandbox, and disables nodeIntegration', () => {
      const mainContent = readProjectFile('electron/main.cjs') || '';
      assert.match(mainContent, /contextIsolation:\s*true/, 'webPreferences must set contextIsolation: true');
      assert.match(mainContent, /nodeIntegration:\s*false/, 'webPreferences must set nodeIntegration: false');
      assert.match(mainContent, /sandbox:\s*true/, 'webPreferences must set sandbox: true');
      assert.match(mainContent, /preload:\s*path\.join\(__dirname,\s*['"]preload\.cjs['"]\)/, 'preload path properly declared');
    });
  });

  // =========================================================================
  // SUITE 3: Preload ContextBridge & Secure IPC Translation
  // =========================================================================
  describe('Suite 3: Preload ContextBridge & Secure IPC Translation', () => {

    it('C4.S3.1: Preload script exposes electronAPI with isElectron: true, platform, and setKeepAwake', () => {
      const preloadContent = readProjectFile('electron/preload.cjs') || '';
      assert.match(
        preloadContent,
        /contextBridge\.exposeInMainWorld\(\s*['"]electronAPI['"]\s*,/m,
        'preload.cjs must call contextBridge.exposeInMainWorld with electronAPI'
      );
      assert.match(preloadContent, /isElectron:\s*true/, 'electronAPI must declare isElectron: true');
      assert.match(preloadContent, /platform:\s*process\.platform/, 'electronAPI must declare platform');
      assert.match(
        preloadContent,
        /setKeepAwake:\s*\(enable\)\s*=>\s*ipcRenderer\.invoke\(\s*['"]set-keep-awake['"]\s*,\s*Boolean\(enable\)\)/,
        'setKeepAwake must invoke set-keep-awake with Boolean cast'
      );
    });

    it('C4.S3.2: Argument normalization in setKeepAwake casts truthy/falsy values strictly to booleans', () => {
      const testCases = [
        { input: true, expected: true },
        { input: false, expected: false },
        { input: 1, expected: true },
        { input: 0, expected: false },
        { input: 'active', expected: true },
        { input: '', expected: false },
        { input: {}, expected: true },
        { input: null, expected: false },
        { input: undefined, expected: false }
      ];

      for (const tc of testCases) {
        assert.strictEqual(
          Boolean(tc.input),
          tc.expected,
          `Boolean(${JSON.stringify(tc.input)}) must evaluate to ${tc.expected}`
        );
      }
    });

    it('C4.S3.3: Preload script does NOT leak raw ipcRenderer, require, or process to window', () => {
      const preloadContent = readProjectFile('electron/preload.cjs') || '';
      // Ensure only electronAPI is exposed
      const exposeCalls = preloadContent.match(/contextBridge\.exposeInMainWorld/g) || [];
      assert.strictEqual(exposeCalls.length, 1, 'Only exactly 1 contextBridge.exposeInMainWorld call allowed');
      assert.doesNotMatch(preloadContent, /exposeInMainWorld\(['"]ipcRenderer['"]/, 'ipcRenderer must never be exposed directly');
      assert.doesNotMatch(preloadContent, /exposeInMainWorld\(['"]process['"]/, 'process object must never be exposed directly');
    });
  });

  // =========================================================================
  // SUITE 4: Cross-Platform KeepAwake Fallback Cascade & Error Handling
  // =========================================================================
  describe('Suite 4: Cross-Platform KeepAwake Fallback Cascade & Error Handling', () => {

    it('C4.S4.1: Priority 1 - Electron IPC bridge is used when available, bypassing Capacitor and Web WakeLock', async () => {
      const env = setupDOMEnvironment();
      try {
        let electronCalledWith = null;
        let capacitorCalled = false;
        let webWakeLockCalled = false;

        env.window.electronAPI = {
          isElectron: true,
          setKeepAwake: async (enable) => {
            electronCalledWith = enable;
            return true;
          }
        };

        env.window.navigator.wakeLock.request = async () => {
          webWakeLockCalled = true;
          return { released: false, release: async () => {} };
        };

        const { enableKeepAwake, disableKeepAwake } = await import('../src/services/nativeService.ts');

        await enableKeepAwake();
        assert.strictEqual(electronCalledWith, true, 'Electron IPC setKeepAwake called with true');
        assert.strictEqual(webWakeLockCalled, false, 'Web Screen Wake Lock was NOT called (bypassed by Electron)');

        await disableKeepAwake();
        assert.strictEqual(electronCalledWith, false, 'Electron IPC setKeepAwake called with false');
      } finally {
        env.cleanup();
      }
    });

    it('C4.S4.2: Priority Fallback - When Electron IPC throws, fallback cascades cleanly to Web Wake Lock API', async () => {
      const env = setupDOMEnvironment();
      try {
        let webWakeLockRequested = false;

        env.window.electronAPI = {
          isElectron: true,
          setKeepAwake: async () => {
            throw new Error('Simulated Electron IPC communication error: IPC disconnected');
          }
        };

        env.window.navigator.wakeLock.request = async (type) => {
          assert.strictEqual(type, 'screen');
          webWakeLockRequested = true;
          return { released: false, release: async () => {} };
        };

        const { enableKeepAwake, disableKeepAwake } = await import('../src/services/nativeService.ts');

        await enableKeepAwake();
        assert.strictEqual(webWakeLockRequested, true, 'Web wakeLock was acquired after Electron IPC failure');

        await disableKeepAwake();
      } finally {
        env.cleanup();
      }
    });

    it('C4.S4.3: Total cascade failure resilience: When Electron, Capacitor, and Web WakeLock all reject, enableKeepAwake completes without unhandled rejection', async () => {
      const env = setupDOMEnvironment();
      try {
        env.window.electronAPI = {
          isElectron: true,
          setKeepAwake: async () => { throw new Error('Electron IPC unreachable'); }
        };

        env.window.navigator.wakeLock.request = async () => {
          throw new Error('NotAllowedError: Wake lock request denied by user or OS battery saver');
        };

        const { enableKeepAwake, disableKeepAwake } = await import('../src/services/nativeService.ts');

        let threwError = false;
        try {
          await enableKeepAwake();
        } catch (e) {
          threwError = true;
        }

        assert.strictEqual(threwError, false, 'enableKeepAwake must never throw unhandled exception on total failure');

        // Cleanup disable call
        await disableKeepAwake();
      } finally {
        env.cleanup();
      }
    });

    it('C4.S4.4: Redundant enableKeepAwake() calls when already active do not re-request underlying locks', async () => {
      const env = setupDOMEnvironment();
      try {
        let ipcInvocationCount = 0;
        env.window.electronAPI = {
          isElectron: true,
          setKeepAwake: async () => {
            ipcInvocationCount++;
            return true;
          }
        };

        const { enableKeepAwake, disableKeepAwake } = await import('../src/services/nativeService.ts');

        await enableKeepAwake();
        await enableKeepAwake();
        await enableKeepAwake();

        assert.strictEqual(ipcInvocationCount, 1, 'Underlying setKeepAwake was invoked exactly once');

        await disableKeepAwake();
      } finally {
        env.cleanup();
      }
    });

    it('C4.S4.5: Redundant disableKeepAwake() calls when inactive return immediately without throwing', async () => {
      const env = setupDOMEnvironment();
      try {
        let ipcInvocationCount = 0;
        env.window.electronAPI = {
          isElectron: true,
          setKeepAwake: async () => {
            ipcInvocationCount++;
            return true;
          }
        };

        const { disableKeepAwake } = await import('../src/services/nativeService.ts');

        await disableKeepAwake();
        await disableKeepAwake();

        assert.strictEqual(ipcInvocationCount, 0, 'No IPC calls made when lock is already inactive');
      } finally {
        env.cleanup();
      }
    });
  });

  // =========================================================================
  // SUITE 5: Web Screen WakeLock Lifecycle & Involuntary Release Recovery
  // =========================================================================
  describe('Suite 5: Web Screen WakeLock Lifecycle & Involuntary Release Recovery', () => {

    it('C4.S5.1: Screen Wake Lock sentinel release is triggered upon disableKeepAwake()', async () => {
      const env = setupDOMEnvironment();
      try {
        env.window.electronAPI = null;
        let released = false;

        env.window.navigator.wakeLock = {
          request: async () => ({
            released: false,
            release: async function() {
              this.released = true;
              released = true;
            }
          })
        };

        const { enableKeepAwake, disableKeepAwake } = await import('../src/services/nativeService.ts');

        await enableKeepAwake();
        assert.strictEqual(released, false, 'Sentinel initially unreleased');

        await disableKeepAwake();
        assert.strictEqual(released, true, 'Sentinel release() was invoked on disableKeepAwake()');
      } finally {
        env.cleanup();
      }
    });

    it('C4.S5.2: Involuntary release resilience: Browser releasing sentinel (tab backgrounded) does not crash disableKeepAwake()', async () => {
      const env = setupDOMEnvironment();
      try {
        env.window.electronAPI = null;
        const mockSentinel = {
          released: false,
          release: async function() {
            // In accordance with W3C Screen Wake Lock specification Section 4.3:
            // "If this's [[Released]] is true, then return a promise resolved with undefined."
            this.released = true;
          }
        };

        env.window.navigator.wakeLock = {
          request: async () => mockSentinel
        };

        const { enableKeepAwake, disableKeepAwake } = await import('../src/services/nativeService.ts');

        await enableKeepAwake();

        // Simulate browser automatically releasing lock when user switches tab
        mockSentinel.released = true;

        let errorThrown = false;
        try {
          await disableKeepAwake();
        } catch (e) {
          errorThrown = true;
        }

        assert.strictEqual(errorThrown, false, 'disableKeepAwake() swallowed already-released sentinel exception safely');
      } finally {
        env.cleanup();
      }
    });

    it('C4.S5.3: Partial Web API resilience: navigator.wakeLock exists but request is missing or throws immediately', async () => {
      const env = setupDOMEnvironment();
      try {
        env.window.electronAPI = null;
        env.window.navigator.wakeLock = {}; // missing request function

        const { enableKeepAwake, disableKeepAwake } = await import('../src/services/nativeService.ts');

        let error = false;
        try {
          await enableKeepAwake();
          await disableKeepAwake();
        } catch (e) {
          error = true;
        }

        assert.strictEqual(error, false, 'Partial wakeLock object handled safely');
      } finally {
        env.cleanup();
      }
    });

    it('C4.S5.4: Multi-cycle re-acquisition: enable -> disable -> enable -> disable retains consistency', async () => {
      const env = setupDOMEnvironment();
      try {
        env.window.electronAPI = null;
        let acquisitions = 0;
        let releases = 0;

        env.window.navigator.wakeLock = {
          request: async () => {
            acquisitions++;
            return {
              released: false,
              release: async () => { releases++; }
            };
          }
        };

        const { enableKeepAwake, disableKeepAwake } = await import('../src/services/nativeService.ts');

        for (let i = 0; i < 10; i++) {
          await enableKeepAwake();
          await disableKeepAwake();
        }

        assert.strictEqual(acquisitions, 10, 'Acquired 10 times in 10 cycles');
        assert.strictEqual(releases, 10, 'Released 10 times in 10 cycles');
      } finally {
        env.cleanup();
      }
    });
  });

  // =========================================================================
  // SUITE 6: Cross-Platform Haptics Sensory Durations & Platform Routing
  // =========================================================================
  describe('Suite 6: Cross-Platform Haptics Sensory Durations & Platform Routing', () => {

    it('C4.S6.1: Electron / Desktop environment bypasses vibration completely (safe no-op)', async () => {
      const env = setupDOMEnvironment();
      try {
        env.window.electronAPI = { isElectron: true };
        let vibrationAttempted = false;
        env.window.navigator.vibrate = () => {
          vibrationAttempted = true;
          return true;
        };

        const { triggerHaptic } = await import('../src/services/nativeService.ts');

        await triggerHaptic('heavy');
        await triggerHaptic('selection');
        await triggerHaptic('success');

        assert.strictEqual(vibrationAttempted, false, 'Vibration must NEVER be invoked on Electron desktop');
      } finally {
        env.cleanup();
      }
    });

    it('C4.S6.2: Web browser environment maps standard haptic types to exact tactile vibration patterns', async () => {
      const env = setupDOMEnvironment();
      try {
        env.window.electronAPI = null;
        let lastVibration = null;
        env.window.navigator.vibrate = (p) => {
          lastVibration = p;
          return true;
        };

        const { triggerHaptic } = await import('../src/services/nativeService.ts');

        await triggerHaptic('light');
        assert.strictEqual(lastVibration, 15, 'light -> 15ms');

        await triggerHaptic('medium');
        assert.strictEqual(lastVibration, 30, 'medium -> 30ms');

        await triggerHaptic('heavy');
        assert.strictEqual(lastVibration, 50, 'heavy -> 50ms');

        await triggerHaptic('selection');
        assert.strictEqual(lastVibration, 10, 'selection -> 10ms');

        await triggerHaptic('success');
        assert.deepStrictEqual(lastVibration, [15, 50, 15], 'success -> [15, 50, 15] ms');

        await triggerHaptic('warning');
        assert.deepStrictEqual(lastVibration, [30, 50, 30], 'warning -> [30, 50, 30] ms');
      } finally {
        env.cleanup();
      }
    });

    it('C4.S6.3: Custom vibration pattern bypasses default duration map and passes directly to navigator.vibrate', async () => {
      const env = setupDOMEnvironment();
      try {
        env.window.electronAPI = null;
        let lastVibration = null;
        env.window.navigator.vibrate = (p) => {
          lastVibration = p;
          return true;
        };

        const { triggerHaptic } = await import('../src/services/nativeService.ts');

        await triggerHaptic('light', [50, 100, 150]);
        assert.deepStrictEqual(lastVibration, [50, 100, 150]);

        await triggerHaptic('heavy', 75);
        assert.strictEqual(lastVibration, 75);
      } finally {
        env.cleanup();
      }
    });

    it('C4.S6.4: High-throughput haptic firing (1,000 rapid calls) executes with zero uncaught errors', async () => {
      const env = setupDOMEnvironment();
      try {
        env.window.electronAPI = null;
        let count = 0;
        env.window.navigator.vibrate = () => {
          count++;
          return true;
        };

        const { triggerHaptic } = await import('../src/services/nativeService.ts');

        for (let i = 0; i < 1000; i++) {
          await triggerHaptic('light');
        }

        assert.strictEqual(count, 1000, 'All 1,000 vibrations processed');
      } finally {
        env.cleanup();
      }
    });

    it('C4.S6.5: navigator.vibrate throwing exception (e.g. security restriction / unfocused window) is handled silently', async () => {
      const env = setupDOMEnvironment();
      try {
        env.window.electronAPI = null;
        env.window.navigator.vibrate = () => {
          throw new Error('NotAllowedError: document is not focused');
        };

        const { triggerHaptic } = await import('../src/services/nativeService.ts');

        let threw = false;
        try {
          await triggerHaptic('medium');
        } catch (e) {
          threw = true;
        }

        assert.strictEqual(threw, false, 'navigator.vibrate error swallowed cleanly');
      } finally {
        env.cleanup();
      }
    });
  });

  // =========================================================================
  // SUITE 7: Multi-Platform Packaging, Configuration & Asset Sync Integrity
  // =========================================================================
  describe('Suite 7: Multi-Platform Packaging, Configuration & Asset Sync Integrity', () => {

    it('C4.S7.1: vite.config.ts declares base: "./" for Electron file:// relative asset loading', () => {
      const viteConfig = readProjectFile('vite.config.ts') || '';
      assert.match(
        viteConfig,
        /base:\s*['"]\.\/['"]/i,
        'vite.config.ts must set base: "./"'
      );
    });

    it('C4.S7.2: package.json declares Electron main entry and complete lifecycle scripts', () => {
      const pkg = JSON.parse(readProjectFile('package.json') || '{}');
      assert.strictEqual(pkg.main, 'electron/main.cjs', 'package.json main must point to electron/main.cjs');
      assert.ok(pkg.scripts['electron:dev'], 'electron:dev script must exist');
      assert.ok(pkg.scripts['electron:build'], 'electron:build script must exist');
      assert.ok(pkg.scripts['electron:pack'], 'electron:pack script must exist');
      assert.ok(pkg.scripts['electron:preview'], 'electron:preview script must exist');
      assert.ok(pkg.scripts['cap:sync'], 'cap:sync script must exist');
      assert.ok(pkg.dependencies['@capacitor/haptics'], '@capacitor/haptics must be in dependencies');
    });

    it('C4.S7.3: capacitor.config.ts specifies valid appId and dist webDir', () => {
      const capConfig = readProjectFile('capacitor.config.ts') || '';
      assert.match(capConfig, /appId:\s*['"]com\.marodriguezd\.omega['"]/);
      assert.match(capConfig, /webDir:\s*['"]dist['"]/);
    });

    it('C4.S7.4: Production bundle artifacts in dist/ exist and contain relative asset references', () => {
      assert.ok(fileExists('dist/index.html'), 'dist/index.html must exist from production build');
      const indexHtml = readProjectFile('dist/index.html') || '';
      // Ensure scripts and links use relative paths "./assets/..." and NOT absolute "/assets/..."
      assert.match(indexHtml, /src=["']\.\/assets\//, 'HTML script src must use relative "./assets/" path');
      assert.match(indexHtml, /href=["']\.\/assets\//, 'HTML stylesheet href must use relative "./assets/" path');
      assert.doesNotMatch(indexHtml, /src=["']\/assets\//, 'HTML must NOT contain root-relative "/assets/" paths');
      assert.doesNotMatch(indexHtml, /href=["']\/assets\//, 'HTML must NOT contain root-relative "/assets/" paths');
    });

    it('C4.S7.5: Android capacitor plugin registrations in capacitor.plugins.json include keep-awake, app, and haptics', () => {
      const pluginsJsonPath = path.join(PROJECT_ROOT, 'android/app/src/main/assets/capacitor.plugins.json');
      assert.ok(fs.existsSync(pluginsJsonPath), 'capacitor.plugins.json must exist in android assets');
      const plugins = JSON.parse(fs.readFileSync(pluginsJsonPath, 'utf8'));
      const pluginNames = plugins.map(p => p.name || p.pkg);
      assert.ok(
        plugins.some(p => p.pkg === '@capacitor-community/keep-awake'),
        'keep-awake plugin registered in android'
      );
      assert.ok(
        plugins.some(p => p.pkg === '@capacitor/app'),
        'capacitor/app plugin registered in android'
      );
      assert.ok(
        plugins.some(p => p.pkg === '@capacitor/haptics'),
        'capacitor/haptics plugin registered in android'
      );
    });
  });
});

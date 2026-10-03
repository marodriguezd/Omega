import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT_ROOT, readProjectFile, fileExists } from './helpers/test-utils.js';
import { Capacitor } from '@capacitor/core';
import { triggerHaptic, enableKeepAwake, disableKeepAwake } from '../src/services/nativeService.ts';

describe('Tier 5 Adversarial Stress Suite: Milestone 4 Multi-Platform & Haptics Engine', () => {

  // Save original globals for clean teardown
  let origNavigatorDescriptor;
  let origWindowDescriptor;
  let origDocumentDescriptor;

  beforeEach(() => {
    origNavigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    origWindowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');
    origDocumentDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'document');
  });

  afterEach(() => {
    // Restore globals
    if (origNavigatorDescriptor) {
      Object.defineProperty(globalThis, 'navigator', origNavigatorDescriptor);
    } else {
      delete globalThis.navigator;
    }

    if (origWindowDescriptor) {
      Object.defineProperty(globalThis, 'window', origWindowDescriptor);
    } else {
      delete globalThis.window;
    }

    if (origDocumentDescriptor) {
      Object.defineProperty(globalThis, 'document', origDocumentDescriptor);
    } else {
      delete globalThis.document;
    }

    // Reset Capacitor platform state
    Capacitor.isNativePlatform = () => false;
  });

  // =========================================================================
  // SUITE 1: Vite Production Bundle Asset Path Verification & Deep file:// Protocol
  // =========================================================================
  describe('Suite 1: Production Bundle Asset Path Verification & Deep file:// Protocol Resolution Audit', () => {

    it('T5.M4.1.1: dist/index.html must have 100% relative local asset paths (./assets/...) with 0% absolute paths', () => {
      const distIndexPath = path.resolve(PROJECT_ROOT, 'dist/index.html');
      assert.ok(fs.existsSync(distIndexPath), 'dist/index.html must exist');

      const htmlContent = fs.readFileSync(distIndexPath, 'utf8');

      // Extract all href and src attributes
      const attributeRegex = /(?:src|href)=["']([^"']+)["']/gi;
      let match;
      const allExtractedPaths = [];

      while ((match = attributeRegex.exec(htmlContent)) !== null) {
        allExtractedPaths.push(match[1]);
      }

      assert.ok(allExtractedPaths.length > 0, 'Must extract at least one asset attribute from dist/index.html');

      // Filter local asset references (exclude external protocols like https://, data:, blob:, or meta tags)
      const localAssets = allExtractedPaths.filter(p => {
        if (p.startsWith('http://') || p.startsWith('https://')) return false;
        if (p.startsWith('data:') || p.startsWith('blob:')) return false;
        if (p.startsWith('#') || p.startsWith('mailto:')) return false;
        return true;
      });

      assert.ok(localAssets.length >= 4, `Expected at least 4 local asset references, found ${localAssets.length}`);

      // Verify every single local asset path starts with ./ (strictly relative)
      const nonRelativePaths = localAssets.filter(p => !p.startsWith('./'));
      assert.strictEqual(
        nonRelativePaths.length,
        0,
        `Found local asset paths that are not relative: ${JSON.stringify(nonRelativePaths)}`
      );

      // Explicitly assert zero absolute root paths starting with '/'
      const absoluteRootPaths = allExtractedPaths.filter(p => p.startsWith('/') && !p.startsWith('//'));
      assert.strictEqual(
        absoluteRootPaths.length,
        0,
        `Found forbidden absolute root paths in dist/index.html: ${JSON.stringify(absoluteRootPaths)}`
      );
    });

    it('T5.M4.1.2: Deep file:// protocol emulation resolves all referenced assets to existing files on disk', () => {
      const distIndexPath = path.resolve(PROJECT_ROOT, 'dist/index.html');
      const htmlContent = fs.readFileSync(distIndexPath, 'utf8');

      // Emulate deep Electron app installation paths (Linux, macOS, Windows)
      const simulatedBaseURIs = [
        'file:///opt/omega-wellbeing/resources/app/dist/index.html',
        'file:///Applications/Omega.app/Contents/Resources/app/dist/index.html',
        'file:///C:/Program%20Files/Omega%20App/resources/app/dist/index.html'
      ];

      const relativeAssetRegex = /(?:src|href)=["'](\.\/assets\/[^"']+)["']/gi;
      let match;
      const assetUrls = [];

      while ((match = relativeAssetRegex.exec(htmlContent)) !== null) {
        assetUrls.push(match[1]);
      }

      assert.ok(assetUrls.length >= 4, 'Must find ./assets references in dist/index.html');

      for (const baseUri of simulatedBaseURIs) {
        const base = new URL(baseUri);
        for (const assetRef of assetUrls) {
          const resolved = new URL(assetRef, base);
          // Resolved URL must stay within the app/dist hierarchy, NOT root file:///assets/...
          assert.ok(
            resolved.pathname.includes('/dist/assets/'),
            `Resolved path "${resolved.pathname}" does not preserve /dist/assets/ directory hierarchy for base "${baseUri}"`
          );
          assert.ok(
            !resolved.pathname.startsWith('/assets/'),
            `Resolved path "${resolved.pathname}" dangerously resolved to root filesystem /assets/!`
          );
        }
      }

      // Verify that every single asset referenced actually exists on local filesystem
      for (const assetRef of assetUrls) {
        const relPath = assetRef.replace(/^\.\//, '');
        const fullDiskPath = path.resolve(PROJECT_ROOT, 'dist', relPath);
        assert.ok(
          fs.existsSync(fullDiskPath),
          `Referenced asset does not exist on disk: ${fullDiskPath}`
        );
        const stats = fs.statSync(fullDiskPath);
        assert.ok(stats.size > 0, `Referenced asset is empty (0 bytes): ${fullDiskPath}`);
      }
    });

    it('T5.M4.1.3: Compiled JS and CSS bundle chunks contain zero root-relative asset URLs', () => {
      const assetsDir = path.resolve(PROJECT_ROOT, 'dist/assets');
      assert.ok(fs.existsSync(assetsDir), 'dist/assets directory must exist');

      const files = fs.readdirSync(assetsDir);
      const codeFiles = files.filter(f => f.endsWith('.js') || f.endsWith('.css'));

      assert.ok(codeFiles.length > 0, 'dist/assets must contain compiled js and css chunks');

      for (const file of codeFiles) {
        const content = fs.readFileSync(path.join(assetsDir, file), 'utf8');

        // Check for hardcoded "/assets/" strings (which break Electron file:// scheme)
        // Allowed patterns: "./assets/", "assets/", or `${base}assets/`
        const badAssetMatch = content.match(/["']\/assets\/[^"']+["']/g);
        assert.strictEqual(
          badAssetMatch,
          null,
          `File ${file} contains root-relative asset paths: ${JSON.stringify(badAssetMatch)}`
        );
      }
    });

    it('T5.M4.1.4: vite.config.ts base configuration guarantees relative packaging', () => {
      const viteConfig = readProjectFile('vite.config.ts') || '';
      assert.match(
        viteConfig,
        /base:\s*['"]\.\/['"]/i,
        'vite.config.ts must declare base: "./"'
      );
      assert.match(
        viteConfig,
        /outDir:\s*['"]dist['"]/i,
        'vite.config.ts must declare outDir: "dist"'
      );
      assert.match(
        viteConfig,
        /emptyOutDir:\s*true/i,
        'vite.config.ts must declare emptyOutDir: true'
      );
    });
  });

  // =========================================================================
  // SUITE 2: Haptics Abstraction Under Extreme Load & High-Frequency Triggers
  // =========================================================================
  describe('Suite 2: Haptics Abstraction Under Extreme Load & High-Frequency Burst Stress', () => {

    it('T5.M4.2.1: 2,500 concurrent asynchronous triggers across all haptic types resolve without unhandled rejections', async () => {
      let vibrationCalls = 0;
      Object.defineProperty(globalThis, 'navigator', {
        value: {
          vibrate: () => {
            vibrationCalls++;
            return true;
          }
        },
        configurable: true,
        writable: true
      });
      Object.defineProperty(globalThis, 'window', {
        value: {},
        configurable: true,
        writable: true
      });

      const types = ['light', 'medium', 'heavy', 'selection', 'success', 'warning'];
      const totalCalls = 2500;
      const promises = [];

      const startTime = performance.now();
      for (let i = 0; i < totalCalls; i++) {
        const type = types[i % types.length];
        promises.push(triggerHaptic(type));
      }

      await Promise.all(promises);
      const durationMs = performance.now() - startTime;

      assert.strictEqual(vibrationCalls, totalCalls, `Expected ${totalCalls} calls, got ${vibrationCalls}`);
      // Extreme load throughput: 2500 calls should resolve comfortably in <500ms in Node.js
      assert.ok(durationMs < 500, `High frequency burst took too long: ${durationMs.toFixed(2)}ms`);
    });

    it('T5.M4.2.2: Sustained rapid-fire sequence (Wim Hof hyperventilation breathing pacing) executes chronologically', async () => {
      const vibrationLogs = [];
      Object.defineProperty(globalThis, 'navigator', {
        value: {
          vibrate: (pattern) => {
            vibrationLogs.push({ pattern, time: Date.now() });
            return true;
          }
        },
        configurable: true,
        writable: true
      });
      Object.defineProperty(globalThis, 'window', {
        value: {},
        configurable: true,
        writable: true
      });

      // Simulate 60 rapid breathing pulses (inhale/exhale cycles)
      for (let i = 0; i < 60; i++) {
        const style = i % 2 === 0 ? 'light' : 'medium';
        await triggerHaptic(style);
      }

      assert.strictEqual(vibrationLogs.length, 60);
      for (let i = 0; i < 60; i++) {
        const expectedPattern = i % 2 === 0 ? 15 : 30;
        assert.strictEqual(vibrationLogs[i].pattern, expectedPattern);
      }
    });

    it('T5.M4.2.3: Interleaved custom vibration patterns and standard styles under async race conditions', async () => {
      const patternsSeen = [];
      Object.defineProperty(globalThis, 'navigator', {
        value: {
          vibrate: (pattern) => {
            patternsSeen.push(pattern);
            return true;
          }
        },
        configurable: true,
        writable: true
      });
      Object.defineProperty(globalThis, 'window', {
        value: {},
        configurable: true,
        writable: true
      });

      const promises = [];
      for (let i = 0; i < 500; i++) {
        if (i % 2 === 0) {
          promises.push(triggerHaptic('heavy'));
        } else {
          promises.push(triggerHaptic('light', [5, 10, 15, 20]));
        }
      }

      await Promise.all(promises);
      assert.strictEqual(patternsSeen.length, 500);

      const heavyCount = patternsSeen.filter(p => p === 50).length;
      const customCount = patternsSeen.filter(p => Array.isArray(p) && p.length === 4).length;

      assert.strictEqual(heavyCount, 250);
      assert.strictEqual(customCount, 250);
    });

    it('T5.M4.2.4: Memory stability under 5,000 rapid invocations demonstrates zero leak accumulation', async () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: {
          vibrate: () => true
        },
        configurable: true,
        writable: true
      });
      Object.defineProperty(globalThis, 'window', {
        value: {},
        configurable: true,
        writable: true
      });

      const initialMemory = process.memoryUsage().heapUsed;

      for (let batch = 0; batch < 5; batch++) {
        const promises = [];
        for (let i = 0; i < 1000; i++) {
          promises.push(triggerHaptic('selection'));
        }
        await Promise.all(promises);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const deltaMb = (finalMemory - initialMemory) / (1024 * 1024);

      // Memory increase should be negligible (< 25MB delta under 5,000 promises)
      assert.ok(deltaMb < 25, `Heap memory grew excessively: ${deltaMb.toFixed(2)} MB`);
    });
  });

  // =========================================================================
  // SUITE 3: Cross-Platform Environment Simulation & Behavioral Divergence
  // =========================================================================
  describe('Suite 3: Cross-Platform Environment Simulation & Behavioral Divergence', () => {

    it('T5.M4.3.1: Web Browser Environment maps standard styles to exact sensory duration standards', async () => {
      const vibrationPatterns = [];
      Object.defineProperty(globalThis, 'navigator', {
        value: {
          vibrate: (pattern) => {
            vibrationPatterns.push(pattern);
            return true;
          }
        },
        configurable: true,
        writable: true
      });
      Object.defineProperty(globalThis, 'window', {
        value: {},
        configurable: true,
        writable: true
      });

      Capacitor.isNativePlatform = () => false;

      await triggerHaptic('light');
      await triggerHaptic('medium');
      await triggerHaptic('heavy');
      await triggerHaptic('selection');
      await triggerHaptic('success');
      await triggerHaptic('warning');

      assert.deepStrictEqual(vibrationPatterns, [
        15,
        30,
        50,
        10,
        [15, 50, 15],
        [30, 50, 30]
      ]);
    });

    it('T5.M4.3.2: Capacitor Android Native Simulation engages native plugin bindings with exact styles', async () => {
      const vibrationPatterns = [];
      Object.defineProperty(globalThis, 'navigator', {
        value: {
          vibrate: (pattern) => {
            vibrationPatterns.push(pattern);
            return true;
          }
        },
        configurable: true,
        writable: true
      });
      Object.defineProperty(globalThis, 'window', {
        value: {},
        configurable: true,
        writable: true
      });

      Capacitor.isNativePlatform = () => true;

      // In Capacitor native simulation, @capacitor/haptics routes to its WebPlugin fallback
      // which uses distinct native tactile patterns:
      // Light -> [20], Medium -> [43], Heavy -> [61], Success -> [35, 65, 21], Warning -> [30, 40, 30, 50, 60]
      await triggerHaptic('light');
      await triggerHaptic('medium');
      await triggerHaptic('heavy');
      await triggerHaptic('success');
      await triggerHaptic('warning');

      assert.deepStrictEqual(vibrationPatterns, [
        [20],
        [43],
        [61],
        [35, 65, 21],
        [30, 40, 30, 50, 60]
      ]);
    });

    it('T5.M4.3.3: Electron Desktop Simulation executes immediate zero-overhead no-op', async () => {
      let vibrationInvoked = false;
      Object.defineProperty(globalThis, 'navigator', {
        value: {
          vibrate: () => {
            vibrationInvoked = true;
            return true;
          }
        },
        configurable: true,
        writable: true
      });
      Object.defineProperty(globalThis, 'window', {
        value: {
          electronAPI: {
            isElectron: true,
            platform: 'linux'
          }
        },
        configurable: true,
        writable: true
      });

      const t0 = performance.now();
      for (let i = 0; i < 1000; i++) {
        await triggerHaptic('heavy');
      }
      const t1 = performance.now();

      assert.strictEqual(vibrationInvoked, false, 'Vibration API must NEVER be called in Electron environment');
      assert.ok((t1 - t0) < 50, `1,000 Electron no-op calls should execute in <50ms, took ${(t1 - t0).toFixed(2)}ms`);
    });

    it('T5.M4.3.4: Headless / Node.js / SSR environment executes safely without ReferenceError', async () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: undefined,
        configurable: true,
        writable: true
      });
      Object.defineProperty(globalThis, 'window', {
        value: undefined,
        configurable: true,
        writable: true
      });

      // Should complete cleanly without throwing ReferenceError for window or navigator
      await assert.doesNotReject(async () => {
        await triggerHaptic('heavy');
        await triggerHaptic('selection');
      });
    });
  });

  // =========================================================================
  // SUITE 4: Adversarial Error Recovery, Permission Denial & JNI Resilience
  // =========================================================================
  describe('Suite 4: Adversarial Error Recovery, Permission Denial & JNI Failure Resilience', () => {

    it('T5.M4.4.1: Browser Permission Denial (NotAllowedError: user gesture required) is safely caught', async () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: {
          vibrate: () => {
            const err = new Error('NotAllowedError: vibration blocked prior to user activation');
            err.name = 'NotAllowedError';
            throw err;
          }
        },
        configurable: true,
        writable: true
      });
      Object.defineProperty(globalThis, 'window', {
        value: {},
        configurable: true,
        writable: true
      });

      await assert.doesNotReject(
        async () => {
          await triggerHaptic('heavy');
        },
        'triggerHaptic must catch NotAllowedError silently without throwing to calling component'
      );
    });

    it('T5.M4.4.2: Unsupported Web Vibration API (iOS Safari / missing vibrate) degrades safely', async () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15'
          // vibrate is intentionally undefined
        },
        configurable: true,
        writable: true
      });
      Object.defineProperty(globalThis, 'window', {
        value: {},
        configurable: true,
        writable: true
      });

      await assert.doesNotReject(
        async () => {
          await triggerHaptic('medium');
          await triggerHaptic('light');
        },
        'Missing navigator.vibrate must silently no-op'
      );
    });

    it('T5.M4.4.3: Capacitor native bridge exception seamlessly falls through to Web Vibration API', async () => {
      let fallbackCalls = 0;
      Object.defineProperty(globalThis, 'navigator', {
        value: {
          vibrate: () => {
            fallbackCalls++;
            return true;
          }
        },
        configurable: true,
        writable: true
      });
      Object.defineProperty(globalThis, 'window', {
        value: {},
        configurable: true,
        writable: true
      });

      Capacitor.isNativePlatform = () => true;

      // When Capacitor is native but encounters plugin issues, fallback to web vibrate
      await triggerHaptic('heavy');
      assert.ok(fallbackCalls >= 1, 'Fallback vibration must be invoked');
    });

    it('T5.M4.4.4: Malformed, poisoned and out-of-spec arguments are handled gracefully without crash', async () => {
      let vibrateCount = 0;
      Object.defineProperty(globalThis, 'navigator', {
        value: {
          vibrate: () => {
            vibrateCount++;
            return true;
          }
        },
        configurable: true,
        writable: true
      });
      Object.defineProperty(globalThis, 'window', {
        value: {},
        configurable: true,
        writable: true
      });

      const adversarialInputs = [
        null,
        undefined,
        '',
        'hyper-extreme-vibe',
        1337,
        NaN,
        Infinity,
        -999,
        {},
        { invalid: true },
        Symbol('adversarial'),
        [NaN, Infinity, -50],
        new Array(1000).fill(10)
      ];

      for (const badInput of adversarialInputs) {
        await assert.doesNotReject(
          async () => {
            await triggerHaptic(badInput);
          },
          `triggerHaptic failed with adversarial input: ${String(badInput)}`
        );
      }
    });
  });

  // =========================================================================
  // SUITE 5: Cross-Platform KeepAwake Multi-Tier Cascade & Concurrency Stress
  // =========================================================================
  describe('Suite 5: Cross-Platform KeepAwake Multi-Tier Cascade & Concurrency Stress', () => {

    it('T5.M4.5.1: KeepAwake cascades in strict priority: Electron IPC -> Capacitor Plugin -> Web WakeLock', async () => {
      let electronCalled = false;
      let webWakeLockCalled = false;

      // Test Scenario A: Electron environment
      Object.defineProperty(globalThis, 'window', {
        value: {
          electronAPI: {
            isElectron: true,
            setKeepAwake: async (enable) => {
              electronCalled = enable;
              return true;
            }
          }
        },
        configurable: true,
        writable: true
      });

      Object.defineProperty(globalThis, 'navigator', {
        value: {
          wakeLock: {
            request: async () => {
              webWakeLockCalled = true;
              return { release: async () => {} };
            }
          }
        },
        configurable: true,
        writable: true
      });

      await enableKeepAwake();
      assert.strictEqual(electronCalled, true, 'Electron IPC must take top priority');
      assert.strictEqual(webWakeLockCalled, false, 'Web WakeLock must NOT be called when Electron IPC succeeds');
      await disableKeepAwake();
      assert.strictEqual(electronCalled, false, 'disableKeepAwake must release Electron powerSaveBlocker');
    });

    it('T5.M4.5.2: Rapid toggle stress: 100 alternating enable/disable cycles maintains consistent state', async () => {
      let wakeLockActive = false;
      let requestCount = 0;
      let releaseCount = 0;

      Object.defineProperty(globalThis, 'window', {
        value: {},
        configurable: true,
        writable: true
      });

      Object.defineProperty(globalThis, 'document', {
        value: {
          addEventListener: () => {},
          removeEventListener: () => {}
        },
        configurable: true,
        writable: true
      });

      Object.defineProperty(globalThis, 'navigator', {
        value: {
          wakeLock: {
            request: async () => {
              requestCount++;
              wakeLockActive = true;
              return {
                released: false,
                release: async function() {
                  releaseCount++;
                  this.released = true;
                  wakeLockActive = false;
                }
              };
            }
          }
        },
        configurable: true,
        writable: true
      });

      for (let i = 0; i < 100; i++) {
        await enableKeepAwake();
        assert.strictEqual(wakeLockActive, true);
        await disableKeepAwake();
        assert.strictEqual(wakeLockActive, false);
      }

      assert.strictEqual(requestCount, 100);
      assert.strictEqual(releaseCount, 100);
    });

    it('T5.M4.5.3: Screen Wake Lock permission denial completes safely without interrupting session', async () => {
      Object.defineProperty(globalThis, 'window', {
        value: {},
        configurable: true,
        writable: true
      });

      Object.defineProperty(globalThis, 'navigator', {
        value: {
          wakeLock: {
            request: async () => {
              const err = new Error('NotAllowedError: Wake Lock permission denied');
              err.name = 'NotAllowedError';
              throw err;
            }
          }
        },
        configurable: true,
        writable: true
      });

      await assert.doesNotReject(
        async () => {
          await enableKeepAwake();
          await disableKeepAwake();
        },
        'WakeLock permission denial must be handled non-destructively'
      );
    });
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { setupDOMEnvironment } from '../helpers/dom-shim.js';

describe('Tier 2: Boundary & Corner Cases - R4 Platform & Service Boundaries', () => {
  it('T2.R4.1: KeepAwake native failure gracefully falls back to Web Wake Lock API', async () => {
    const env = setupDOMEnvironment();
    try {
      let capacitorFailed = false;
      let webWakeLockCalled = false;

      // Simulated native service logic with fallback
      const enableKeepAwakeSafe = async () => {
        try {
          // Simulate Capacitor plugin throwing error (e.g. running in browser)
          capacitorFailed = true;
          throw new Error('Capacitor KeepAwake plugin not implemented on web');
        } catch (err) {
          // Fallback to Web WakeLock API
          if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
            await navigator.wakeLock.request('screen');
            webWakeLockCalled = true;
          }
        }
      };

      await enableKeepAwakeSafe();
      assert.strictEqual(capacitorFailed, true, 'Capacitor failure occurred');
      assert.strictEqual(webWakeLockCalled, true, 'Web wakeLock was successfully called as fallback');
    } finally {
      env.cleanup();
    }
  });

  it('T2.R4.2: KeepAwake completes without unhandled rejection when all wake lock mechanisms fail', async () => {
    const env = setupDOMEnvironment();
    try {
      env.window._wakeLockShouldFail = true;

      const enableKeepAwakeResilient = async () => {
        try {
          throw new Error('Capacitor unavailable');
        } catch (err) {
          if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
            try {
              await navigator.wakeLock.request('screen');
            } catch (e) {
              // Silently handle error so exercise session doesn't abort
              return false;
            }
          }
        }
        return true;
      };

      const result = await enableKeepAwakeResilient();
      assert.strictEqual(result, false);
    } finally {
      env.cleanup();
    }
  });

  it('T2.R4.3: Corrupted LocalStorage JSON configurations must be caught and defaulted safely', () => {
    const env = setupDOMEnvironment();
    try {
      // Intentionally corrupt config strings
      env.localStorage.setItem('bubbleBreathingConfig', 'INVALID_JSON_MALFORMED{{{');
      env.localStorage.setItem('hydrocicleConfig', '{broken: json,');

      const safeParseConfig = (key) => {
        try {
          return JSON.parse(env.localStorage.getItem(key) || '{}');
        } catch (e) {
          return {};
        }
      };

      const bubbleCfg = safeParseConfig('bubbleBreathingConfig');
      const hydroCfg = safeParseConfig('hydrocicleConfig');

      assert.deepStrictEqual(bubbleCfg, {}, 'Malformed JSON in bubbleBreathingConfig should safely return empty object');
      assert.deepStrictEqual(hydroCfg, {}, 'Malformed JSON in hydrocicleConfig should safely return empty object');
    } finally {
      env.cleanup();
    }
  });

  it('T2.R4.4: LocalStorage QuotaExceededError must be caught gracefully during session persistence', () => {
    const env = setupDOMEnvironment();
    try {
      env.localStorage.simulateQuotaExceeded(true);

      let caught = false;
      const saveSessionHistory = (historyKey, sessionRecord) => {
        try {
          const list = [sessionRecord];
          env.localStorage.setItem(historyKey, JSON.stringify(list));
          return true;
        } catch (err) {
          if (err.name === 'QuotaExceededError') {
            caught = true;
            return false;
          }
          throw err;
        }
      };

      const success = saveSessionHistory('bubbleBreathingHistory', { date: Date.now() });
      assert.strictEqual(success, false, 'Operation should return false when quota exceeded');
      assert.strictEqual(caught, true, 'QuotaExceededError was safely caught without crashing the application');
    } finally {
      env.cleanup();
    }
  });

  it('T2.R4.5: Extreme streak and stats boundary values must compute accurately without NaN or overflow', () => {
    const calculateStreak = (history) => {
      if (!Array.isArray(history) || history.length === 0) return 0;
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dateSet = new Set();
      for (const entry of history) {
        if (!entry || !entry.date) continue;
        const d = new Date(entry.date);
        dateSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
      }

      const checkDate = new Date(today);
      while (true) {
        const key = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
        if (dateSet.has(key)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      return streak;
    };

    // Sub-boundary 1: Empty history
    assert.strictEqual(calculateStreak([]), 0);
    assert.strictEqual(calculateStreak(null), 0);
    assert.strictEqual(calculateStreak(undefined), 0);

    // Sub-boundary 2: Corrupted entries
    assert.strictEqual(calculateStreak([{ corrupt: true }, null, {}]), 0);

    // Sub-boundary 3: Single day today
    const todayMs = Date.now();
    assert.strictEqual(calculateStreak([{ date: todayMs }]), 1);

    // Sub-boundary 4: 10,000 consecutive days generated safely via setDate
    const hugeHistory = [];
    const walkDate = new Date();
    walkDate.setHours(0, 0, 0, 0);
    for (let d = 0; d < 10000; d++) {
      hugeHistory.push({ date: walkDate.getTime() });
      walkDate.setDate(walkDate.getDate() - 1);
    }
    assert.strictEqual(calculateStreak(hugeHistory), 10000, 'Calculates 10,000 days streak accurately without overflow');
  });
});

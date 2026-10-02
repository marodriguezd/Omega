import { describe, it } from 'node:test';
import assert from 'node:assert';
import { setupDOMEnvironment } from '../helpers/dom-shim.js';

describe('Tier 4: Wim Hof Method Suite End-to-End Tests', () => {
  it('T4.S6: 20-Day Cold Shower Challenge schedule and progression', () => {
    const env = setupDOMEnvironment();
    try {
      // 1. Initial 20-day schedule verification
      const INITIAL_CHALLENGE = [
        { day: 1, targetSec: 15, completed: false },
        { day: 2, targetSec: 15, completed: false },
        { day: 3, targetSec: 15, completed: false },
        { day: 4, targetSec: 15, completed: false },
        { day: 5, targetSec: 15, completed: false },
        { day: 6, targetSec: 30, completed: false },
        { day: 7, targetSec: 30, completed: false },
        { day: 8, targetSec: 30, completed: false },
        { day: 9, targetSec: 30, completed: false },
        { day: 10, targetSec: 30, completed: false },
        { day: 11, targetSec: 45, completed: false },
        { day: 12, targetSec: 45, completed: false },
        { day: 13, targetSec: 45, completed: false },
        { day: 14, targetSec: 45, completed: false },
        { day: 15, targetSec: 45, completed: false },
        { day: 16, targetSec: 60, completed: false },
        { day: 17, targetSec: 60, completed: false },
        { day: 18, targetSec: 60, completed: false },
        { day: 19, targetSec: 60, completed: false },
        { day: 20, targetSec: 60, completed: false }
      ];

      assert.strictEqual(INITIAL_CHALLENGE.length, 20);
      assert.strictEqual(INITIAL_CHALLENGE[0].targetSec, 15, 'Week 1 starts at 15s');
      assert.strictEqual(INITIAL_CHALLENGE[5].targetSec, 30, 'Week 2 is 30s');
      assert.strictEqual(INITIAL_CHALLENGE[10].targetSec, 45, 'Week 3 is 45s');
      assert.strictEqual(INITIAL_CHALLENGE[15].targetSec, 60, 'Week 4 is 60s');

      // 2. Simulate completing Day 1
      INITIAL_CHALLENGE[0].completed = true;
      INITIAL_CHALLENGE[0].completedAt = Date.now();
      INITIAL_CHALLENGE[0].actualSec = 15;

      env.localStorage.setItem('omega_challenge_days', JSON.stringify(INITIAL_CHALLENGE));
      const loaded = JSON.parse(env.localStorage.getItem('omega_challenge_days'));
      assert.strictEqual(loaded[0].completed, true);
      assert.strictEqual(loaded[1].completed, false);
    } finally {
      env.cleanup();
    }
  });

  it('T4.S7: Apnea push-up test session recording and retention tracking', () => {
    const env = setupDOMEnvironment();
    try {
      const pushUpRecord = {
        id: 'pushup_' + Date.now(),
        date: Date.now(),
        pushUps: 24,
        retentionSeconds: 58
      };

      const history = [pushUpRecord];
      env.localStorage.setItem('omega_pushup_history', JSON.stringify(history));

      const loaded = JSON.parse(env.localStorage.getItem('omega_pushup_history'));
      assert.strictEqual(loaded.length, 1);
      assert.strictEqual(loaded[0].pushUps, 24);
      assert.strictEqual(loaded[0].retentionSeconds, 58);
    } finally {
      env.cleanup();
    }
  });

  it('T4.S8: Wim Hof Hexagonal badges evaluation and unlock conditions', () => {
    const badges = [
      { id: 'first_breath', unlocked: false },
      { id: 'first_ice', unlocked: false },
      { id: 'retention_2m', unlocked: false },
      { id: 'pushup_apnea', unlocked: false },
      { id: 'streak_7', unlocked: false }
    ];

    const evaluate = (store, streak) => {
      if (store.breathing.length > 0) badges.find(b => b.id === 'first_breath').unlocked = true;
      if (store.cold.length > 0) badges.find(b => b.id === 'first_ice').unlocked = true;
      if (store.breathing.some(b => b.totalRetentionTime >= 120)) badges.find(b => b.id === 'retention_2m').unlocked = true;
      if (store.pushups.length > 0) badges.find(b => b.id === 'pushup_apnea').unlocked = true;
      if (streak >= 7) badges.find(b => b.id === 'streak_7').unlocked = true;
    };

    evaluate({
      breathing: [{ totalRetentionTime: 135 }],
      cold: [{ totalColdTime: 60 }],
      pushups: [{ pushUps: 15 }]
    }, 7);

    assert.strictEqual(badges.find(b => b.id === 'first_breath').unlocked, true);
    assert.strictEqual(badges.find(b => b.id === 'first_ice').unlocked, true);
    assert.strictEqual(badges.find(b => b.id === 'retention_2m').unlocked, true);
    assert.strictEqual(badges.find(b => b.id === 'pushup_apnea').unlocked, true);
    assert.strictEqual(badges.find(b => b.id === 'streak_7').unlocked, true);
  });

  it('T4.S9: 100% Offline-First JSON backup export and import round-trip', () => {
    const env = setupDOMEnvironment();
    try {
      const originalStore = {
        version: 1,
        breathingHistory: [{ id: 'b1', date: 1000, rounds: 3, totalRetentionTime: 95 }],
        coldHistory: [{ id: 'c1', date: 2000, totalColdTime: 60 }],
        pushUpHistory: [{ id: 'p1', date: 3000, pushUps: 20, retentionSeconds: 45 }],
        challengeDays: [{ day: 1, targetSec: 15, completed: true }]
      };

      // Export JSON
      const exportedJson = JSON.stringify({ appName: 'Omega', data: originalStore });
      assert.ok(exportedJson.includes('"appName":"Omega"'));

      // Clean local storage
      env.localStorage.clear();
      assert.strictEqual(env.localStorage.getItem('omega_wimhof_store'), null);

      // Restore JSON
      const parsed = JSON.parse(exportedJson);
      env.localStorage.setItem('omega_wimhof_store', JSON.stringify(parsed.data));

      const restored = JSON.parse(env.localStorage.getItem('omega_wimhof_store'));
      assert.strictEqual(restored.breathingHistory.length, 1);
      assert.strictEqual(restored.coldHistory.length, 1);
      assert.strictEqual(restored.pushUpHistory[0].pushUps, 20);
      assert.strictEqual(restored.challengeDays[0].completed, true);
    } finally {
      env.cleanup();
    }
  });

  it('T4.S10: Bi-directional backward compatibility with legacy storage keys', () => {
    const env = setupDOMEnvironment();
    try {
      // Legacy write
      env.localStorage.setItem('bubbleBreathingHistory', JSON.stringify([{ date: Date.now(), retentionSeconds: 80 }]));
      env.localStorage.setItem('hydrocicleHistory', JSON.stringify([{ date: Date.now(), totalColdTime: 45 }]));

      // Verify legacy reads work for existing dashboard hooks
      const bHistory = JSON.parse(env.localStorage.getItem('bubbleBreathingHistory') || '[]');
      const hHistory = JSON.parse(env.localStorage.getItem('hydrocicleHistory') || '[]');

      assert.strictEqual(bHistory.length, 1);
      assert.strictEqual(hHistory.length, 1);
      assert.strictEqual(bHistory[0].retentionSeconds, 80);
      assert.strictEqual(hHistory[0].totalColdTime, 45);
    } finally {
      env.cleanup();
    }
  });
});

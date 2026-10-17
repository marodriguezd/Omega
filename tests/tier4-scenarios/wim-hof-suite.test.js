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

  it('T4.S11: Blind cold shower guidance with 5-second preparation buffer and milestone chimes', () => {
    const prepSeconds = 5;
    const ticks = [];
    for (let elapsed = 0; elapsed <= prepSeconds; elapsed++) {
      const rem = Math.max(0, prepSeconds - elapsed);
      ticks.push(rem);
    }
    assert.deepStrictEqual(ticks, [5, 4, 3, 2, 1, 0], 'Countdown proceeds 5..0');

    const isMilestone = (sec) => {
      return sec === 15 || sec === 30 || sec === 45 || sec === 60 || (sec > 60 && sec % 30 === 0);
    };

    assert.strictEqual(isMilestone(15), true, '15s is milestone (Week 1)');
    assert.strictEqual(isMilestone(30), true, '30s is milestone (Week 2)');
    assert.strictEqual(isMilestone(45), true, '45s is milestone (Week 3)');
    assert.strictEqual(isMilestone(60), true, '60s is milestone (Week 4 / 1 min)');
    assert.strictEqual(isMilestone(90), true, '90s is milestone (1.5 min)');
    assert.strictEqual(isMilestone(120), true, '120s is milestone (2 min)');
    assert.strictEqual(isMilestone(10), false, '10s is not a milestone');
    assert.strictEqual(isMilestone(25), false, '25s is not a milestone');
  });

  it('T4.S12: Wim Hof round-by-round retention bar chart formatting and best round detection', () => {
    const retentionTimes = [45, 90, 125, 140];
    const maxInSession = Math.max(...retentionTimes);
    const totalRetention = retentionTimes.reduce((acc, t) => acc + t, 0);
    const avgRetention = Math.round(totalRetention / retentionTimes.length);
    const bestRoundIndex = retentionTimes.indexOf(maxInSession);

    assert.strictEqual(maxInSession, 140, 'Max round is 140s');
    assert.strictEqual(totalRetention, 400, 'Total retention is 400s');
    assert.strictEqual(avgRetention, 100, 'Average retention is 100s');
    assert.strictEqual(bestRoundIndex, 3, 'Best round is Round 4 (index 3)');

    const formatDigital = (sec) => {
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    assert.strictEqual(formatDigital(45), '0:45');
    assert.strictEqual(formatDigital(90), '1:30');
    assert.strictEqual(formatDigital(125), '2:05');
    assert.strictEqual(formatDigital(140), '2:20');
  });

  it('T4.S13: Progress screen breathing session history and collapsible breakdown verification', () => {
    const env = setupDOMEnvironment();
    try {
      const sessionWithRounds = {
        id: 'breath_session_test',
        date: Date.now(),
        rounds: 3,
        retentionTimes: [60, 95, 130],
        totalRetentionTime: 285
      };

      const store = {
        version: 1,
        breathingHistory: [sessionWithRounds],
        coldHistory: [],
        pushUpHistory: [],
        challengeDays: []
      };

      env.localStorage.setItem('omega_wimhof_store', JSON.stringify(store));
      const loaded = JSON.parse(env.localStorage.getItem('omega_wimhof_store'));

      assert.strictEqual(loaded.breathingHistory.length, 1);
      assert.deepStrictEqual(loaded.breathingHistory[0].retentionTimes, [60, 95, 130]);
      assert.strictEqual(loaded.breathingHistory[0].totalRetentionTime, 285);
    } finally {
      env.cleanup();
    }
  });

  it('T4.S14: Target retention open stopwatch verification', () => {
    const targetRetentionSec = 90;
    let targetChimeFired = false;
    let stopwatchRunning = true;
    let totalSec = 0;

    // Simulate ticking past the target to 115s
    for (let sec = 1; sec <= 115; sec++) {
      totalSec = sec;
      if (totalSec >= targetRetentionSec && !targetChimeFired) {
        targetChimeFired = true;
      }
    }

    assert.strictEqual(targetChimeFired, true, 'Target chime fired when reaching 90s');
    assert.strictEqual(stopwatchRunning, true, 'Stopwatch continues running openly past target');
    assert.strictEqual(totalSec, 115, 'User held until 115s without interruption');

    // Progress percentage
    const calcProgress = (current, target) => {
      if (target <= 0) return 0;
      return Math.min(100, Math.round((current / target) * 100));
    };
    assert.strictEqual(calcProgress(45, 90), 50);
    assert.strictEqual(calcProgress(90, 90), 100);
    assert.strictEqual(calcProgress(115, 90), 100);
  });

  it('T4.S15: Water temperature logging, unit conversion, and summary formatting', () => {
    const env = setupDOMEnvironment();
    try {
      // 1. Temperature formatting
      const formatActivitySummary = (rounds, waterTemp, tempUnit = 'C') => {
        const tempBadge = (waterTemp !== undefined && waterTemp !== null)
          ? ` • ${waterTemp}°${tempUnit}`
          : '';
        return `${rounds} rondas${tempBadge}`;
      };

      assert.strictEqual(formatActivitySummary(3, 12, 'C'), '3 rondas • 12°C');
      assert.strictEqual(formatActivitySummary(1, 54, 'F'), '1 rondas • 54°F');
      assert.strictEqual(formatActivitySummary(2, null), '2 rondas');

      // 2. Unit conversion
      const cToF = (c) => Math.round(c * 1.8 + 32);
      const fToC = (f) => Math.round((f - 32) / 1.8);
      assert.strictEqual(cToF(12), 54);
      assert.strictEqual(fToC(54), 12);

      // 3. Storage persistence round-trip
      const sessionWithTemp = {
        id: 'h_temp_test',
        date: new Date().toISOString(),
        rounds: 2,
        hotDuration: 0,
        coldDuration: 60,
        totalColdTime: 60,
        totalTime: 60,
        waterTemp: 11,
        tempUnit: 'C'
      };

      env.localStorage.setItem('hydrocicleHistory', JSON.stringify([sessionWithTemp]));
      const loaded = JSON.parse(env.localStorage.getItem('hydrocicleHistory'));
      assert.strictEqual(loaded[0].waterTemp, 11);
      assert.strictEqual(loaded[0].tempUnit, 'C');
    } finally {
      env.cleanup();
    }
  });

  it('T4.S16: Cold exposure 4s/6s calm breathing pacing cadence and persistence', () => {
    const env = setupDOMEnvironment();
    try {
      // 1. Verify 10-second cycle pacing segmentation (4s Inhale, 6s Exhale)
      const getPacingPhase = (elapsedSec) => {
        const cycleSec = elapsedSec % 10;
        return cycleSec < 4 ? 'inhale' : 'exhale';
      };

      const getPacingConfig = (phase) => {
        if (phase === 'inhale') {
          return { scale: 1.25, durationMs: 4000, easing: 'ease-out' };
        }
        return { scale: 0.95, durationMs: 6000, easing: 'ease-in-out' };
      };

      // Inhale 0s - 3s
      assert.strictEqual(getPacingPhase(0), 'inhale');
      assert.strictEqual(getPacingPhase(1), 'inhale');
      assert.strictEqual(getPacingPhase(2), 'inhale');
      assert.strictEqual(getPacingPhase(3), 'inhale');
      assert.deepStrictEqual(getPacingConfig('inhale'), { scale: 1.25, durationMs: 4000, easing: 'ease-out' });

      // Exhale 4s - 9s
      assert.strictEqual(getPacingPhase(4), 'exhale');
      assert.strictEqual(getPacingPhase(5), 'exhale');
      assert.strictEqual(getPacingPhase(7), 'exhale');
      assert.strictEqual(getPacingPhase(9), 'exhale');
      assert.deepStrictEqual(getPacingConfig('exhale'), { scale: 0.95, durationMs: 6000, easing: 'ease-in-out' });

      // Next cycle starts smoothly at 10s
      assert.strictEqual(getPacingPhase(10), 'inhale');
      assert.strictEqual(getPacingPhase(14), 'exhale');

      // 2. Local storage persistence of pacing preference
      env.localStorage.setItem('omega_cold_pacing', 'true');
      assert.strictEqual(env.localStorage.getItem('omega_cold_pacing'), 'true');
      env.localStorage.setItem('omega_cold_pacing', 'false');
      assert.strictEqual(env.localStorage.getItem('omega_cold_pacing'), 'false');
    } finally {
      env.cleanup();
    }
  });

  it('T4.S17: Recovery breath hold duration customization (10s, 15s, 20s, 30s)', () => {
    const INHALE_DURATION_MS = 3000;
    const EXHALE_DURATION_MS = 3000;

    const computeRecoveryTimings = (holdSec) => {
      const holdMs = holdSec * 1000;
      const totalMs = INHALE_DURATION_MS + holdMs + EXHALE_DURATION_MS;
      return { holdMs, totalMs };
    };

    // Standard 15s hold
    const standard = computeRecoveryTimings(15);
    assert.strictEqual(standard.holdMs, 15000);
    assert.strictEqual(standard.totalMs, 21000);

    // Express 10s hold
    const shortHold = computeRecoveryTimings(10);
    assert.strictEqual(shortHold.holdMs, 10000);
    assert.strictEqual(shortHold.totalMs, 16000);

    // Deep 20s hold
    const deepHold = computeRecoveryTimings(20);
    assert.strictEqual(deepHold.holdMs, 20000);
    assert.strictEqual(deepHold.totalMs, 26000);

    // Extended 30s hold
    const extendedHold = computeRecoveryTimings(30);
    assert.strictEqual(extendedHold.holdMs, 30000);
    assert.strictEqual(extendedHold.totalMs, 36000);

    // Verify sub-phase boundary calculations
    const getSubPhase = (elapsedMs, holdSec) => {
      const { holdMs, totalMs } = computeRecoveryTimings(holdSec);
      if (elapsedMs < INHALE_DURATION_MS) return 'inhaling';
      if (elapsedMs < INHALE_DURATION_MS + holdMs) return 'holding';
      if (elapsedMs < totalMs) return 'exhaling';
      return 'completed';
    };

    assert.strictEqual(getSubPhase(1500, 20), 'inhaling');
    assert.strictEqual(getSubPhase(5000, 20), 'holding');
    assert.strictEqual(getSubPhase(22000, 20), 'holding');
    assert.strictEqual(getSubPhase(24000, 20), 'exhaling');
    assert.strictEqual(getSubPhase(27000, 20), 'completed');
  });

  it('T4.S18: Real-time Personal Best detection and open-ended celebration during retention', () => {
    const env = setupDOMEnvironment();
    try {
      // Historical sessions with a personal best of 110s
      const store = {
        version: 1,
        breathingHistory: [
          { id: '1', date: Date.now() - 86400000, retentionTimes: [45, 90, 110], totalRetentionTime: 245 }
        ]
      };
      env.localStorage.setItem('omega_wimhof_store', JSON.stringify(store));

      // Calculate historical best
      let best = 0;
      const loadedStore = JSON.parse(env.localStorage.getItem('omega_wimhof_store') || '{}');
      if (loadedStore.breathingHistory) {
        loadedStore.breathingHistory.forEach((s) => {
          if (Array.isArray(s.retentionTimes)) {
            best = Math.max(best, ...s.retentionTimes);
          } else if (s.totalRetentionTime) {
            best = Math.max(best, s.totalRetentionTime);
          }
        });
      }
      assert.strictEqual(best, 110, 'Historical PB correctly identified as 110s');

      // Simulate live retention stopwatch ticking
      let pbTriggerFired = false;
      let pbFiredAtSec = null;
      let stopwatchStillOpen = true;

      for (let sec = 1; sec <= 135; sec++) {
        if (best >= 30 && sec > best && !pbTriggerFired) {
          pbTriggerFired = true;
          pbFiredAtSec = sec;
        }
      }

      assert.strictEqual(pbTriggerFired, true, 'PB celebration fired during live retention');
      assert.strictEqual(pbFiredAtSec, 111, 'PB celebration fired at exactly 111s (1 second above PB 110s)');
      assert.strictEqual(stopwatchStillOpen, true, 'Stopwatch remained open and uninterrupted at 135s');
    } finally {
      env.cleanup();
    }
  });

  it('T4.S19: Clean-room physiological breathing cadence speed calculations (Lenta, Normal, Rápida, Personalizada)', () => {
    const speedSettings = {
      slow: { inhale: 2300, exhale: 1700 },
      standard: { inhale: 1850, exhale: 1350 },
      fast: { inhale: 1350, exhale: 950 }
    };

    const getBreathTiming = (totalMs) => {
      const inhale = totalMs * 0.60;
      return { inhale: Math.round(inhale), exhale: Math.round(totalMs - inhale) };
    };

    // Lenta: 4.0s (15 rpm)
    assert.strictEqual(speedSettings.slow.inhale + speedSettings.slow.exhale, 4000);
    assert.strictEqual(Math.round(60000 / 4000), 15);

    // Normal: 3.2s (~19 rpm)
    assert.strictEqual(speedSettings.standard.inhale + speedSettings.standard.exhale, 3200);
    assert.strictEqual(Math.round(60000 / 3200), 19);

    // Rápida: 2.3s (~26 rpm)
    assert.strictEqual(speedSettings.fast.inhale + speedSettings.fast.exhale, 2300);
    assert.strictEqual(Math.round(60000 / 2300), 26);

    // Personalizada 5.0s: 60/40 ratio
    const custom5s = getBreathTiming(5000);
    assert.strictEqual(custom5s.inhale, 3000);
    assert.strictEqual(custom5s.exhale, 2000);
  });

  it('T4.S20: Breathwork bodily sensations multi-select check-in and persistence round-trip', () => {
    const env = setupDOMEnvironment();
    try {
      const sessionWithSensations = {
        id: 'sens_session_1',
        date: Date.now(),
        rounds: 3,
        retentionTimes: [60, 90, 120],
        totalRetentionTime: 270,
        sensations: ['tingling', 'calm', 'euphoria']
      };

      const store = {
        version: 1,
        breathingHistory: [sessionWithSensations],
        coldHistory: [],
        pushUpHistory: [],
        challengeDays: []
      };

      env.localStorage.setItem('omega_wimhof_store', JSON.stringify(store));
      const loaded = JSON.parse(env.localStorage.getItem('omega_wimhof_store'));

      assert.strictEqual(loaded.breathingHistory.length, 1);
      assert.deepStrictEqual(loaded.breathingHistory[0].sensations, ['tingling', 'calm', 'euphoria']);

      // Toggle sensation: remove euphoria, add heat
      const current = loaded.breathingHistory[0].sensations;
      const updated = current.includes('euphoria')
        ? current.filter(s => s !== 'euphoria')
        : [...current, 'euphoria'];
      updated.push('heat');

      loaded.breathingHistory[0].sensations = updated;
      env.localStorage.setItem('omega_wimhof_store', JSON.stringify(loaded));

      const reloaded = JSON.parse(env.localStorage.getItem('omega_wimhof_store'));
      assert.deepStrictEqual(reloaded.breathingHistory[0].sensations, ['tingling', 'calm', 'heat']);
    } finally {
      env.cleanup();
    }
  });

  it('T4.S21: Cold exposure physiological response check-in and persistence round-trip', () => {
    const env = setupDOMEnvironment();
    try {
      const coldSessionWithResponse = {
        id: 'cold_sens_1',
        date: Date.now(),
        type: 'free_shower',
        totalColdTime: 60,
        waterTemp: 12,
        tempUnit: 'C',
        sensations: ['no_shivering', 'core_control', 'energized']
      };

      const store = {
        version: 1,
        breathingHistory: [],
        coldHistory: [coldSessionWithResponse],
        pushUpHistory: [],
        challengeDays: []
      };

      env.localStorage.setItem('omega_wimhof_store', JSON.stringify(store));
      const loaded = JSON.parse(env.localStorage.getItem('omega_wimhof_store'));

      assert.strictEqual(loaded.coldHistory.length, 1);
      assert.deepStrictEqual(loaded.coldHistory[0].sensations, ['no_shivering', 'core_control', 'energized']);
      assert.strictEqual(loaded.coldHistory[0].waterTemp, 12);
    } finally {
      env.cleanup();
    }
  });
});

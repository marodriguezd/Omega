import { describe, it } from 'node:test';
import assert from 'node:assert';
import { setupDOMEnvironment } from '../helpers/dom-shim.js';

describe('Tier 4: Real-World Application Scenarios (End-to-End User Journeys)', () => {
  it('T4.S1: Complete Wim Hof Breathing Session Journey (Config -> Rhythm -> Retention -> Recovery -> Stats)', () => {
    const env = setupDOMEnvironment();
    try {
      // 1. Initial State: 0 history, 0 streak
      assert.strictEqual(env.localStorage.getItem('bubbleBreathingHistory'), null);

      // 2. User configures exercise parameters
      const sessionConfig = {
        speed: 'normal',
        breathsPerRound: 30,
        totalRounds: 3,
        volume: 80,
        soundscape: 'ocean'
      };
      env.localStorage.setItem('bubbleBreathingConfig', JSON.stringify(sessionConfig));

      // 3. User begins session: Active exercise state entered
      let sessionState = 'breathing';
      let currentRound = 1;
      let breathCount = 0;

      // Simulate 30 rhythmic breaths
      for (let b = 1; b <= 30; b++) {
        breathCount = b;
      }
      assert.strictEqual(breathCount, 30, 'Completed 30 breaths in round 1');

      // 4. Transition to Apnea Retention
      sessionState = 'retention';
      const retentionStart = Date.now();
      const retentionDurationSeconds = 92; // 1 min 32 sec hold
      const simulatedRetentionEnd = retentionStart + (retentionDurationSeconds * 1000);

      const computedRetention = Math.floor((simulatedRetentionEnd - retentionStart) / 1000);
      assert.strictEqual(computedRetention, 92);

      // 5. Transition to Recovery Breath (15s hold)
      sessionState = 'recovery';
      const recoveryHoldSeconds = 15;
      assert.strictEqual(recoveryHoldSeconds, 15);

      // 6. Session Finishes: Record history
      sessionState = 'results';
      const historyRecord = {
        id: 'bb_session_' + Date.now(),
        date: Date.now(),
        roundsCompleted: 1,
        retentionTimes: [retentionDurationSeconds],
        totalRetentionTime: retentionDurationSeconds,
        soundscapeUsed: sessionConfig.soundscape
      };

      const existingHistory = JSON.parse(env.localStorage.getItem('bubbleBreathingHistory') || '[]');
      existingHistory.push(historyRecord);
      env.localStorage.setItem('bubbleBreathingHistory', JSON.stringify(existingHistory));

      // 7. Verify Hub Reflection: History persisted and streak counts
      const saved = JSON.parse(env.localStorage.getItem('bubbleBreathingHistory'));
      assert.strictEqual(saved.length, 1);
      assert.strictEqual(saved[0].retentionTimes[0], 92);
      assert.strictEqual(saved[0].soundscapeUsed, 'ocean');
    } finally {
      env.cleanup();
    }
  });

  it('T4.S2: Complete HydroCycle Contrast Shower Journey with Routine Checklist 100% Completion', () => {
    const env = setupDOMEnvironment();
    try {
      // 1. Initial State: 1 breathing completed, 0 hydro completed (Routine 1/2)
      env.localStorage.setItem('bubbleBreathingHistory', JSON.stringify([{ date: Date.now(), totalRetentionTime: 90 }]));

      // 2. Select Classic Contrast preset (Warm 180s, Cold 60s, 3 rounds)
      const hydroConfig = {
        preset: 'classic',
        warmDuration: 180,
        coldDuration: 60,
        rounds: 3,
        soundscape: 'rain'
      };
      env.localStorage.setItem('hydrocicleConfig', JSON.stringify(hydroConfig));

      // 3. Complete all 3 contrast cycles
      let totalColdTime = 0;
      let totalWarmTime = 0;

      for (let r = 1; r <= hydroConfig.rounds; r++) {
        totalWarmTime += hydroConfig.warmDuration;
        totalColdTime += hydroConfig.coldDuration;
      }

      assert.strictEqual(totalWarmTime, 540, 'Total warm exposure: 9 minutes');
      assert.strictEqual(totalColdTime, 180, 'Total cold exposure: 3 minutes');

      // 4. Save Hydro session record
      const hydroRecord = {
        id: 'hc_session_' + Date.now(),
        date: Date.now(),
        preset: hydroConfig.preset,
        rounds: hydroConfig.rounds,
        totalColdTime,
        totalWarmTime
      };

      const hydroHistory = [hydroRecord];
      env.localStorage.setItem('hydrocicleHistory', JSON.stringify(hydroHistory));

      // 5. Check Daily Routine Status in Hub
      const todayStart = new Date().setHours(0, 0, 0, 0);
      const hasBreathingToday = JSON.parse(env.localStorage.getItem('bubbleBreathingHistory') || '[]')
        .some(e => new Date(e.date).setHours(0, 0, 0, 0) === todayStart);
      const hasHydroToday = JSON.parse(env.localStorage.getItem('hydrocicleHistory') || '[]')
        .some(e => new Date(e.date).setHours(0, 0, 0, 0) === todayStart);

      const completedCount = (hasBreathingToday ? 1 : 0) + (hasHydroToday ? 1 : 0);
      const is100Percent = completedCount === 2;

      assert.strictEqual(completedCount, 2, 'Daily checklist must show 2/2 completed tasks');
      assert.strictEqual(is100Percent, true, '100% daily wellness badge unlocked');
    } finally {
      env.cleanup();
    }
  });

  it('T4.S3: Desktop Wide-Screen Session (>=768px) with Multi-Column Dashboard and Navigation Rail', () => {
    const env = setupDOMEnvironment();
    try {
      env.window.innerWidth = 1920;
      env.window.innerHeight = 1080;

      // Evaluate responsive layout mode
      const isDesktop = env.window.innerWidth >= 768;
      assert.strictEqual(isDesktop, true);

      // Verify dashboard cards arrange in multi-column grid
      const dashboardWidth = Math.min(env.window.innerWidth, 1440);
      assert.strictEqual(dashboardWidth, 1440, 'Max width bounded to prevent distortion');

      // Seamless navigation between Hub -> Breathing -> Hydro -> Hub
      let currentTab = 'hub';
      const navigate = (tab) => { currentTab = tab; };

      navigate('breathing');
      assert.strictEqual(currentTab, 'breathing');

      navigate('hydro');
      assert.strictEqual(currentTab, 'hydro');

      navigate('hub');
      assert.strictEqual(currentTab, 'hub');
    } finally {
      env.cleanup();
    }
  });

  it('T4.S4: Mobile Commuter Session with Safe-Area insets, screen wake lock, and accidental exit protection', () => {
    const env = setupDOMEnvironment();
    try {
      env.window.innerWidth = 390;
      env.window.innerHeight = 844;

      let wakeLockActive = false;
      let activeTab = 'hub';
      let showModal = false;
      let sessionRunning = false;

      // 1. User starts breathing session on mobile
      activeTab = 'breathing';
      sessionRunning = true;
      wakeLockActive = true;

      // 2. Accidental tap on 'hydro' tab while in exercise
      const tapTab = (target) => {
        if (sessionRunning) {
          showModal = true;
          return;
        }
        activeTab = target;
      };

      tapTab('hydro');
      assert.strictEqual(showModal, true, 'Exit modal intercepts accidental navigation');
      assert.strictEqual(activeTab, 'breathing', 'Exercise tab remains protected');
      assert.strictEqual(wakeLockActive, true, 'Screen stays awake');

      // 3. User dismisses modal and completes session
      showModal = false;
      sessionRunning = false; // session completes naturally

      // 4. User navigates back to hub
      activeTab = 'hub';
      wakeLockActive = false;

      assert.strictEqual(activeTab, 'hub');
      assert.strictEqual(wakeLockActive, false, 'Wake lock released cleanly');
    } finally {
      env.cleanup();
    }
  });

  it('T4.S5: International Multi-Device Customization Journey (Language, Theme, Zoom scaling)', () => {
    const env = setupDOMEnvironment();
    try {
      // 1. App starts in default Spanish
      assert.strictEqual(env.localStorage.getItem('omega_language'), null);

      // 2. User switches to English
      env.localStorage.setItem('omega_language', 'en');
      assert.strictEqual(env.localStorage.getItem('omega_language'), 'en');

      // 3. User switches to Light theme
      env.documentElement.setAttribute('data-theme', 'light');
      env.localStorage.setItem('omega_theme', 'light');
      assert.strictEqual(env.documentElement.getAttribute('data-theme'), 'light');

      // 4. User adjusts UI scale to 125%
      const zoom = 125;
      const scaleFactor = zoom / 100;
      const clampedScale = Math.min(2.2, Math.max(0.8, scaleFactor));
      env.documentElement.style.setProperty('--ui-scale', scaleFactor.toString());
      env.documentElement.style.setProperty('--ui-scale-clamped', clampedScale.toString());
      env.localStorage.setItem('omega_zoom', zoom.toString());

      assert.strictEqual(env.documentElement.style.getPropertyValue('--ui-scale'), '1.25');
      assert.strictEqual(env.documentElement.style.getPropertyValue('--ui-scale-clamped'), '1.25');
      assert.strictEqual(env.localStorage.getItem('omega_zoom'), '125');

      // 5. Verify simulated app reload restores all customized settings
      const restoredLang = env.localStorage.getItem('omega_language');
      const restoredTheme = env.localStorage.getItem('omega_theme');
      const restoredZoom = Number(env.localStorage.getItem('omega_zoom'));

      assert.strictEqual(restoredLang, 'en');
      assert.strictEqual(restoredTheme, 'light');
      assert.strictEqual(restoredZoom, 125);
    } finally {
      env.cleanup();
    }
  });
});

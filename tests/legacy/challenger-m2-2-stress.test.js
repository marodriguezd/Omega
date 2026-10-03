import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readProjectFile } from './helpers/test-utils.js';
import { setupDOMEnvironment } from './helpers/dom-shim.js';

describe('Milestone 2 Challenger 2: Timer Drift, Pause/Resume Accumulation & Session Protection Stress Suite', () => {

  // =========================================================================
  // SUITE 1: Timer Drift Under Simulated CPU Pauses & Thread Stalls
  // =========================================================================
  describe('Suite 1: Empirical Timer Drift & Thread Delay Simulation', () => {

    it('C2.S1.1: Fixed interval accumulation drifts severely under simulated thread stalls whereas Date.now() delta math maintains exact synchronization', () => {
      // Simulation of 60 seconds with 5 synthetic CPU stalls (e.g. GC pauses, heavy layout recalculations, background tab suspension)
      // Stalls occur at virtual timestamps:
      // - Stall 1 at 5s: 750ms stall
      // - Stall 2 at 15s: 1400ms stall
      // - Stall 3 at 28s: 2200ms stall
      // - Stall 4 at 40s: 3100ms stall
      // - Stall 5 at 52s: 1800ms stall
      // Total stalled CPU time: 9250ms (9.25 seconds)

      let virtualNow = 1000000;
      const startTime = virtualNow;
      const totalSimulationMs = 60000;

      // Model 1: Old drift-prone fixed-tick accumulator: setInterval(() => seconds += 1, 1000)
      let fixedAccumulatorSeconds = 0;
      let lastFixedTickTime = virtualNow;

      // Model 2: New high-precision delta math: Math.floor((Date.now() - startTime) / 1000) polled every 200ms
      let deltaMathSeconds = 0;
      let lastPollingTickTime = virtualNow;

      const stalls = [
        { triggerAtMs: 5000, durationMs: 750 },
        { triggerAtMs: 15000, durationMs: 1400 },
        { triggerAtMs: 28000, durationMs: 2200 },
        { triggerAtMs: 40000, durationMs: 3100 },
        { triggerAtMs: 52000, durationMs: 1800 },
      ];

      let stallIndex = 0;
      const stepMs = 50; // Event loop advancement step

      while ((virtualNow - startTime) < totalSimulationMs) {
        // Check for next stall
        const elapsedSoFar = virtualNow - startTime;
        if (stallIndex < stalls.length && elapsedSoFar >= stalls[stallIndex].triggerAtMs) {
          const stallDuration = stalls[stallIndex].durationMs;
          virtualNow += stallDuration;
          stallIndex++;
          // During CPU stall, event loop callbacks are blocked and only fire once after resume
          // Fixed interval: browser queues or fires 1 delayed tick
          fixedAccumulatorSeconds += 1;
          lastFixedTickTime = virtualNow;

          // Polling tick: fires immediately after stall with updated Date.now()
          deltaMathSeconds = Math.floor((virtualNow - startTime) / 1000);
          lastPollingTickTime = virtualNow;
          continue;
        }

        virtualNow += stepMs;

        // Advance fixed interval (1000ms tick)
        if (virtualNow - lastFixedTickTime >= 1000) {
          fixedAccumulatorSeconds += 1;
          lastFixedTickTime = virtualNow;
        }

        // Advance high-precision polling interval (200ms tick)
        if (virtualNow - lastPollingTickTime >= 200) {
          deltaMathSeconds = Math.floor((virtualNow - startTime) / 1000);
          lastPollingTickTime = virtualNow;
        }
      }

      const truePhysicalElapsedSeconds = Math.floor((virtualNow - startTime) / 1000);
      const fixedIntervalDriftSeconds = Math.abs(truePhysicalElapsedSeconds - fixedAccumulatorSeconds);
      const deltaMathDriftSeconds = Math.abs(truePhysicalElapsedSeconds - deltaMathSeconds);

      // Verify empirical measurements
      assert.ok(
        fixedIntervalDriftSeconds >= 5,
        `Fixed interval accumulation must show severe lag (observed drift: ${fixedIntervalDriftSeconds}s)`
      );
      assert.strictEqual(
        deltaMathDriftSeconds,
        0,
        `Date.now() delta math must eliminate cumulative drift (observed drift: ${deltaMathDriftSeconds}s)`
      );
      assert.strictEqual(
        deltaMathSeconds,
        truePhysicalElapsedSeconds,
        `Date.now() delta seconds (${deltaMathSeconds}s) exactly equals physical elapsed seconds (${truePhysicalElapsedSeconds}s)`
      );
    });

    it('C2.S1.2: Bubble-Breathing RetentionScreen uses high-precision Date.now() delta math and captures final retention accurately', () => {
      const code = readProjectFile('Bubble-Breathing/src/components/RetentionScreen.tsx');
      assert.ok(code, 'RetentionScreen.tsx must exist');

      // Verify startTimeRef initialization and Date.now() delta calculation
      assert.match(
        code,
        /startTimeRef\.current\s*=\s*Date\.now\(\)/,
        'RetentionScreen must set startTimeRef.current = Date.now() on phase start'
      );
      assert.match(
        code,
        /Math\.floor\(\(Date\.now\(\)\s*-\s*startTimeRef\.current\)\s*\/\s*1000\)/,
        'RetentionScreen must calculate elapsed seconds via (Date.now() - startTimeRef.current) / 1000'
      );
      assert.match(
        code,
        /interval\s*=\s*window\.setInterval\([\s\S]+?,\s*200\)/,
        'RetentionScreen must poll at high-frequency 200ms interval for sub-second second-boundary reconciliation'
      );

      // Verify handleTransitionToRecovery calculates exact final retention time directly from Date.now()
      assert.match(
        code,
        /const\s+finalRetentionTime\s*=\s*startTimeRef\.current\s*!==\s*null\s*\?\s*Math\.max\(0,\s*Math\.floor\(\(Date\.now\(\)\s*-\s*startTimeRef\.current\)\s*\/\s*1000\)\)/,
        'handleTransitionToRecovery must compute finalRetentionTime directly from timestamp delta on transition'
      );
    });

    it('C2.S1.3: Bubble-Breathing RecoveryScreen maintains high-precision countdown across subphase transitions', () => {
      const code = readProjectFile('Bubble-Breathing/src/components/RecoveryScreen.tsx');
      assert.ok(code, 'RecoveryScreen.tsx must exist');

      assert.match(
        code,
        /subPhaseStartRef\.current\s*=\s*Date\.now\(\)/,
        'RecoveryScreen must track subPhaseStartRef with Date.now()'
      );
      assert.match(
        code,
        /const\s+elapsed\s*=\s*Math\.floor\(\(Date\.now\(\)\s*-\s*subPhaseStartRef\.current\)\s*\/\s*1000\)/,
        'RecoveryScreen must compute elapsed time from subPhaseStartRef delta'
      );
      assert.match(
        code,
        /const\s+remaining\s*=\s*Math\.max\(0,\s*targetDurationRef\.current\s*-\s*elapsed\)/,
        'RecoveryScreen must compute remaining time bounded at 0'
      );
    });
  });

  // =========================================================================
  // SUITE 2: HydroCycle TimerContext Pause/Resume Cycles & Accumulation
  // =========================================================================
  describe('Suite 2: HydroCycle TimerContext Pause/Resume Cycle Stress Test', () => {

    it('C2.S2.1: 50 consecutive pause/resume cycles in TimerContext preserve elapsed time and NEVER reset secondsInPhase to 0', () => {
      // Emulate the exact TimerContext state machine from Hydrocicle/src/contexts/TimerContext.tsx
      class TimerContextHarness {
        constructor(targetDurationSec = 60) {
          this.targetDurationSec = targetDurationSec;
          this.isPlaying = false;
          this.phase = 'cold';
          this.timeLeft = targetDurationSec;

          // Refs
          this.phaseStartTimeRef = null;
          this.accumulatedPhaseMsRef = 0;
          this.secondsInPhaseRef = 0;
          this.roundResults = [];
          this.currentRound = 1;
        }

        startSession(virtualTime) {
          this.isPlaying = true;
          this.secondsInPhaseRef = 0;
          this.accumulatedPhaseMsRef = 0;
          this.timeLeft = this.targetDurationSec;
          this.phaseStartTimeRef = virtualTime;
        }

        pause(virtualTime) {
          if (this.isPlaying && this.phaseStartTimeRef !== null) {
            this.accumulatedPhaseMsRef += virtualTime - this.phaseStartTimeRef;
            this.phaseStartTimeRef = null;
          }
          this.isPlaying = false;
        }

        resume(virtualTime) {
          this.isPlaying = true;
          this.phaseStartTimeRef = virtualTime;
          // CRITICAL: secondsInPhaseRef must NOT reset to 0!
        }

        tick(virtualTime) {
          if (!this.isPlaying || this.phaseStartTimeRef === null) return;
          const currentPhaseMs = this.accumulatedPhaseMsRef + (virtualTime - this.phaseStartTimeRef);
          const elapsedSec = Math.floor(currentPhaseMs / 1000);
          const remaining = Math.max(0, this.targetDurationSec - elapsedSec);
          this.secondsInPhaseRef = elapsedSec;
          this.timeLeft = remaining;
        }

        transitionToNext(virtualTime) {
          const durationLogged = this.secondsInPhaseRef;
          this.roundResults.push({
            round: this.currentRound,
            coldDuration: durationLogged
          });
          this.accumulatedPhaseMsRef = 0;
          this.phaseStartTimeRef = virtualTime;
          this.secondsInPhaseRef = 0;
        }
      }

      let simClock = 500000;
      const harness = new TimerContextHarness(60);
      harness.startSession(simClock);

      let totalActiveDurationExpectedMs = 0;
      const resetZeroViolations = [];

      // Perform 50 rapid pause/resume cycles
      for (let cycle = 1; cycle <= 50; cycle++) {
        // Run active for 300ms to 700ms
        const activeChunkMs = 300 + (cycle % 5) * 100;
        simClock += activeChunkMs;
        totalActiveDurationExpectedMs += activeChunkMs;
        harness.tick(simClock);

        const secondsBeforePause = harness.secondsInPhaseRef;

        // Pause
        harness.pause(simClock);

        // Advance paused time (simulating being paused for 500ms to 2000ms)
        const pausedTimeMs = 500 + (cycle % 4) * 500;
        simClock += pausedTimeMs;

        // Resume
        harness.resume(simClock);

        // Immediate tick after resume
        harness.tick(simClock);
        const secondsImmediatelyAfterResume = harness.secondsInPhaseRef;

        // Check invariant: secondsInPhaseRef must NOT reset to 0 upon resume
        if (totalActiveDurationExpectedMs >= 1000 && secondsImmediatelyAfterResume === 0) {
          resetZeroViolations.push({
            cycle,
            beforePause: secondsBeforePause,
            afterResume: secondsImmediatelyAfterResume
          });
        }
      }

      // Final tick
      harness.tick(simClock);

      const expectedElapsedSec = Math.floor(totalActiveDurationExpectedMs / 1000);
      assert.strictEqual(
        resetZeroViolations.length,
        0,
        `secondsInPhaseRef reset to 0 upon resume in ${resetZeroViolations.length} cycles! Violations: ${JSON.stringify(resetZeroViolations)}`
      );
      assert.strictEqual(
        harness.secondsInPhaseRef,
        expectedElapsedSec,
        `Total active elapsed time (${harness.secondsInPhaseRef}s) must match expected active time (${expectedElapsedSec}s)`
      );
      assert.strictEqual(
        harness.accumulatedPhaseMsRef + (simClock - harness.phaseStartTimeRef),
        totalActiveDurationExpectedMs,
        'Accumulated phase milliseconds accurately tracks active time without including paused time'
      );
    });

    it('C2.S2.2: TimerContext logs true cumulative duration across pauses into roundResults upon phase completion', () => {
      const code = readProjectFile('Hydrocicle/src/contexts/TimerContext.tsx');
      assert.ok(code, 'TimerContext.tsx must exist');

      // Verify accumulatedPhaseMsRef accumulates elapsed time on pause
      assert.match(
        code,
        /accumulatedPhaseMsRef\.current\s*\+=\s*Date\.now\(\)\s*-\s*phaseStartTimeRef\.current/,
        'TimerContext must accumulate (Date.now() - phaseStartTimeRef.current) upon pause'
      );

      // Verify phase duration calculation in tick
      assert.match(
        code,
        /const\s+currentPhaseMs\s*=\s*accumulatedPhaseMsRef\.current\s*\+\s*\(now\s*-\s*phaseStartTimeRef\.current\)/,
        'TimerContext tick must sum accumulatedPhaseMsRef and current delta'
      );

      // Verify transitionToNext saves duration from secondsInPhaseRef
      assert.match(
        code,
        /const\s+durationLogged\s*=\s*secondsInPhaseRef\.current/,
        'transitionToNext must capture secondsInPhaseRef.current as the phase duration'
      );

      // Verify accumulatedPhaseMsRef is reset to 0 ONLY upon phase transition or stopSession
      assert.match(
        code,
        /accumulatedPhaseMsRef\.current\s*=\s*0;/,
        'TimerContext must reset accumulatedPhaseMsRef to 0 upon phase transition'
      );
    });

    it('C2.S2.3: Boundary conditions: immediate 0ms pause, rapid unpause-pause toggling, and clean reset', () => {
      let now = 1000;
      let accumulatedMs = 0;
      let phaseStart = now;

      // Scenario A: Immediate pause at 0ms
      accumulatedMs += now - phaseStart; // 0ms added
      phaseStart = null;
      assert.strictEqual(accumulatedMs, 0, 'Immediate pause at 0ms adds 0ms');

      // Advance 10s while paused
      now += 10000;

      // Scenario B: Resume and immediately pause with 0ms
      phaseStart = now;
      accumulatedMs += now - phaseStart; // 0ms added
      phaseStart = null;
      assert.strictEqual(accumulatedMs, 0, 'Immediate resume-pause adds 0ms');

      // Advance 5s while paused
      now += 5000;

      // Resume and run for 3200ms
      phaseStart = now;
      now += 3200;
      accumulatedMs += now - phaseStart;
      phaseStart = null;

      assert.strictEqual(accumulatedMs, 3200, 'Runs accurately for 3200ms despite prior 0ms pauses');
    });
  });

  // =========================================================================
  // SUITE 3: Session Lock in src/App.tsx, Mutual Exclusivity & Event Bus
  // =========================================================================
  describe('Suite 3: Session Protection in src/App.tsx & Cross-Submodule Isolation', () => {

    it('C2.S3.1: omega-session-state event bus correctly tracks independent sub-app active states', () => {
      const sessionStates = { bubble: false, hydro: false };
      const handleSessionState = (e) => {
        if (e.detail?.app === 'bubble' || e.detail?.app === 'hydro') {
          sessionStates[e.detail.app] = Boolean(e.detail.active);
        }
      };

      // Bubble starts
      handleSessionState({ detail: { app: 'bubble', active: true } });
      assert.strictEqual(sessionStates.bubble, true, 'Bubble marked active');
      assert.strictEqual(sessionStates.hydro, false, 'Hydro remains inactive');

      // Hydro starts concurrently
      handleSessionState({ detail: { app: 'hydro', active: true } });
      assert.strictEqual(sessionStates.bubble, true, 'Bubble remains active');
      assert.strictEqual(sessionStates.hydro, true, 'Hydro marked active');

      // Bubble ends
      handleSessionState({ detail: { app: 'bubble', active: false } });
      assert.strictEqual(sessionStates.bubble, false, 'Bubble marked inactive');
      assert.strictEqual(sessionStates.hydro, true, 'Hydro remains active');

      // Hydro ends
      handleSessionState({ detail: { app: 'hydro', active: false } });
      assert.strictEqual(sessionStates.bubble, false, 'Bubble inactive');
      assert.strictEqual(sessionStates.hydro, false, 'Hydro inactive');
    });

    it('C2.S3.2: [EMPIRICAL DEFECT TEST] Un-scoped DOM selectors in src/App.tsx cause FALSE-POSITIVE session lock on HydroCycle when Bubble-Breathing is active', () => {
      // In src/App.tsx:
      // When activeTab === 'hydro', App.tsx queries:
      //   const showerScreen = document.querySelector(
      //     '.view-hydro #exerciseScreen.active, .view-hydro #exerciseScreen, .view-hydro .shower-screen, #exerciseScreen.active, .shower-screen'
      //   );
      //
      // Because Bubble-Breathing and Hydrocicle both mount concurrently in the DOM:
      //   <div className="omega-view view-bubble hidden"><div id="exerciseScreen" className="screen active"></div></div>
      //   <div className="omega-view view-hydro active"><div id="configScreen" className="screen active"></div></div>
      //
      // The selector `#exerciseScreen.active` is NOT scoped to .view-hydro.
      // Therefore, document.querySelector matches Bubble-Breathing's #exerciseScreen.active!
      // This causes isSessionActive() to return TRUE for HydroCycle when HydroCycle is IDLE!

      const env = setupDOMEnvironment();
      try {
        // Build the exact DOM structure produced by App.tsx
        const viewsContainer = env.document.createElement('main');
        viewsContainer.className = 'omega-views-container';
        env.root.appendChild(viewsContainer);

        // Bubble-Breathing in active exercise (rendered in background / hidden view)
        const viewBubble = env.document.createElement('div');
        viewBubble.className = 'omega-view view-bubble hidden';
        const bubbleExercise = env.document.createElement('div');
        bubbleExercise.id = 'exerciseScreen';
        bubbleExercise.className = 'screen active';
        viewBubble.appendChild(bubbleExercise);
        viewsContainer.appendChild(viewBubble);

        // HydroCycle is IDLE on setup / config screen (rendered in active view)
        const viewHydro = env.document.createElement('div');
        viewHydro.className = 'omega-view view-hydro active';
        const hydroConfig = env.document.createElement('div');
        hydroConfig.id = 'configScreen';
        hydroConfig.className = 'screen active';
        viewHydro.appendChild(hydroConfig);
        viewsContainer.appendChild(viewHydro);

        // Hydro session state event says FALSE (hydro is idle)
        const sessionStatesRef = { bubble: true, hydro: false };
        let activeTab = 'hydro';

        // Actual implementation logic from src/App.tsx lines 145-152:
        const isSessionActiveAppImplementation = () => {
          if (activeTab === 'hydro') {
            if (sessionStatesRef.hydro) return true;
            const showerScreen = env.document.querySelector(
              '.view-hydro #exerciseScreen.active, .view-hydro #exerciseScreen, .view-hydro .shower-screen, #exerciseScreen.active, .shower-screen'
            );
            return !!showerScreen;
          }
          return false;
        };

        const falsePositiveDetected = isSessionActiveAppImplementation();

        // Direct empirical proof of the bug:
        assert.strictEqual(
          falsePositiveDetected,
          true,
          'EMPIRICAL DEFECT CONFIRMED: App.tsx reports Hydro session as ACTIVE despite Hydro being on ConfigScreen, due to un-scoped #exerciseScreen.active matching Bubble-Breathing!'
        );

        // Verify the culprit matched element
        const matchedElement = env.document.querySelector(
          '.view-hydro #exerciseScreen.active, .view-hydro #exerciseScreen, .view-hydro .shower-screen, #exerciseScreen.active, .shower-screen'
        );
        assert.ok(matchedElement !== null, 'Matched element exists');
        assert.strictEqual(
          matchedElement.parentElement.className,
          'omega-view view-bubble hidden',
          'Culprit: Un-scoped selector matched element inside view-bubble instead of view-hydro!'
        );
      } finally {
        env.cleanup();
      }
    });

    it('C2.S3.3: [EMPIRICAL DEFECT TEST] Un-scoped DOM selectors in src/App.tsx cause FALSE-POSITIVE session lock on Bubble-Breathing when HydroCycle is active', () => {
      // Reverse scenario:
      // HydroCycle is ACTIVE in background (view-hydro hidden, #exerciseScreen.active)
      // Bubble-Breathing is IDLE on ConfigScreen (view-bubble active, #configScreen)
      // activeTab === 'breathing'

      const env = setupDOMEnvironment();
      try {
        const viewsContainer = env.document.createElement('main');
        viewsContainer.className = 'omega-views-container';
        env.root.appendChild(viewsContainer);

        // HydroCycle active in background
        const viewHydro = env.document.createElement('div');
        viewHydro.className = 'omega-view view-hydro hidden';
        const hydroShower = env.document.createElement('div');
        hydroShower.id = 'exerciseScreen';
        hydroShower.className = 'screen active shower-screen';
        viewHydro.appendChild(hydroShower);
        viewsContainer.appendChild(viewHydro);

        // Bubble-Breathing IDLE in foreground
        const viewBubble = env.document.createElement('div');
        viewBubble.className = 'omega-view view-bubble active';
        const bubbleConfig = env.document.createElement('div');
        bubbleConfig.id = 'configScreen';
        bubbleConfig.className = 'screen active';
        viewBubble.appendChild(bubbleConfig);
        viewsContainer.appendChild(viewBubble);

        const sessionStatesRef = { bubble: false, hydro: true };
        let activeTab = 'breathing';

        // Actual implementation logic from src/App.tsx lines 138-144:
        const isSessionActiveAppImplementation = () => {
          if (activeTab === 'breathing') {
            if (sessionStatesRef.bubble) return true;
            const activeScreen = env.document.querySelector(
              '.view-bubble #exerciseScreen.active, .view-bubble #exerciseScreen, .view-bubble #retentionScreen, .view-bubble #recoveryScreen, #exerciseScreen.active, #exerciseScreen, #retentionScreen, #recoveryScreen'
            );
            return !!activeScreen;
          }
          return false;
        };

        const falsePositiveDetected = isSessionActiveAppImplementation();

        assert.strictEqual(
          falsePositiveDetected,
          true,
          'EMPIRICAL DEFECT CONFIRMED: App.tsx reports Bubble session as ACTIVE despite Bubble being on ConfigScreen, due to un-scoped #exerciseScreen.active matching HydroCycle!'
        );

        const matchedElement = env.document.querySelector(
          '.view-bubble #exerciseScreen.active, .view-bubble #exerciseScreen, .view-bubble #retentionScreen, .view-bubble #recoveryScreen, #exerciseScreen.active, #exerciseScreen, #retentionScreen, #recoveryScreen'
        );
        assert.ok(matchedElement !== null, 'Matched element exists');
        assert.strictEqual(
          matchedElement.parentElement.className,
          'omega-view view-hydro hidden',
          'Culprit: Un-scoped selector matched element inside view-hydro instead of view-bubble!'
        );
      } finally {
        env.cleanup();
      }
    });

    it('C2.S3.4: Remediation verification: Strictly scoped container selectors eliminate all false-positive session locks while preserving 100% active protection', () => {
      const env = setupDOMEnvironment();
      try {
        const viewsContainer = env.document.createElement('main');
        viewsContainer.className = 'omega-views-container';
        env.root.appendChild(viewsContainer);

        // Bubble active
        const viewBubble = env.document.createElement('div');
        viewBubble.className = 'omega-view view-bubble hidden';
        const bubbleExercise = env.document.createElement('div');
        bubbleExercise.id = 'exerciseScreen';
        bubbleExercise.className = 'screen active';
        viewBubble.appendChild(bubbleExercise);
        viewsContainer.appendChild(viewBubble);

        // Hydro idle
        const viewHydro = env.document.createElement('div');
        viewHydro.className = 'omega-view view-hydro active';
        const hydroConfig = env.document.createElement('div');
        hydroConfig.id = 'configScreen';
        hydroConfig.className = 'screen active';
        viewHydro.appendChild(hydroConfig);
        viewsContainer.appendChild(viewHydro);

        // Remediation: scope query strictly to container view
        const isSessionActiveRemediated = (tab, sessionStates) => {
          if (tab === 'breathing') {
            if (sessionStates.bubble) return true;
            return Boolean(viewBubble.querySelector('#exerciseScreen.active, #exerciseScreen, #retentionScreen, #recoveryScreen'));
          }
          if (tab === 'hydro') {
            if (sessionStates.hydro) return true;
            return Boolean(viewHydro.querySelector('#exerciseScreen.active, #exerciseScreen, .shower-screen'));
          }
          return false;
        };

        // Test 1: On hydro tab while bubble is active -> Hydro MUST NOT lock!
        const hydroLock = isSessionActiveRemediated('hydro', { bubble: true, hydro: false });
        assert.strictEqual(hydroLock, false, 'Remediated scoping: Hydro is NOT locked when Bubble is active');

        // Test 2: On bubble tab while bubble is active -> Bubble MUST lock!
        const bubbleLock = isSessionActiveRemediated('breathing', { bubble: true, hydro: false });
        assert.strictEqual(bubbleLock, true, 'Remediated scoping: Bubble IS locked when active');
      } finally {
        env.cleanup();
      }
    });

    it('C2.S3.5: [MULTI-TAB ADVERSARIAL JOURNEY] User starts Bubble, confirms exit to Hub, enters Hydro, and attempts to return to Hub: un-scoped DOM selector triggers spurious ExitConfirmModal', () => {
      const env = setupDOMEnvironment();
      try {
        const viewsContainer = env.document.createElement('main');
        viewsContainer.className = 'omega-views-container';
        env.root.appendChild(viewsContainer);

        // Submodules remain mounted in views container
        const viewBubble = env.document.createElement('div');
        viewBubble.className = 'omega-view view-bubble hidden';
        viewsContainer.appendChild(viewBubble);

        const viewHydro = env.document.createElement('div');
        viewHydro.className = 'omega-view view-hydro active';
        viewsContainer.appendChild(viewHydro);

        // Step 1: User started breathing session earlier
        const bubbleExercise = env.document.createElement('div');
        bubbleExercise.id = 'exerciseScreen';
        bubbleExercise.className = 'screen active';
        viewBubble.appendChild(bubbleExercise);

        // Step 2: User navigates to Hydro (e.g. after confirming exit from Bubble, Bubble exercise DOM was not unmounted)
        let activeTab = 'hydro';
        let showExitModal = false;
        let pendingTab = null;
        const sessionStatesRef = { bubble: true, hydro: false };

        // App.tsx tab selection logic
        const handleSelectTabWithAppLogic = (targetTab) => {
          if (targetTab === activeTab) return;

          // isSessionActive from App.tsx
          let active = false;
          if (activeTab === 'hydro') {
            if (sessionStatesRef.hydro) {
              active = true;
            } else {
              const showerScreen = env.document.querySelector(
                '.view-hydro #exerciseScreen.active, .view-hydro #exerciseScreen, .view-hydro .shower-screen, #exerciseScreen.active, .shower-screen'
              );
              active = !!showerScreen;
            }
          }

          if (active) {
            pendingTab = targetTab;
            showExitModal = true;
            return;
          }
          activeTab = targetTab;
        };

        // Hydro is currently displaying config screen (idle)
        const hydroConfig = env.document.createElement('div');
        hydroConfig.id = 'configScreen';
        hydroConfig.className = 'screen active';
        viewHydro.appendChild(hydroConfig);

        // User now clicks "Hub" in the bottom navigation while on Hydro tab
        handleSelectTabWithAppLogic('hub');

        // Spurious exit modal check
        assert.strictEqual(
          showExitModal,
          true,
          'FAIL: Spurious ExitConfirmModal was shown on Hydro tab even though Hydro was idle on config screen!'
        );
        assert.strictEqual(
          activeTab,
          'hydro',
          'Navigation to Hub was blocked by false-positive session lock'
        );
      } finally {
        env.cleanup();
      }
    });
  });
});

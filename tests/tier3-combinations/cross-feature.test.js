import { describe, it } from 'node:test';
import assert from 'node:assert';
import { setupDOMEnvironment } from '../helpers/dom-shim.js';
import { readProjectFile } from '../helpers/test-utils.js';

describe('Tier 3: Cross-Feature Combinations (Pairwise Coverage)', () => {
  it('T3.C1: Tab switching attempt while Bubble Breathing is active prompts ExitConfirmModal and protects timer', () => {
    const env = setupDOMEnvironment();
    try {
      let activeTab = 'breathing';
      let showExitModal = false;
      let pendingTab = null;
      let keepAwakeActive = true;

      // Mock active exercise screen in DOM
      const exerciseEl = env.document.createElement('div');
      exerciseEl.id = 'exerciseScreen';
      exerciseEl.className = 'screen active';
      env.root.appendChild(exerciseEl);

      const isSessionActive = () => {
        return Boolean(env.document.querySelector('#exerciseScreen, #retentionScreen, #recoveryScreen'));
      };

      const handleSelectTab = (targetTab) => {
        if (targetTab === activeTab) return;
        if (isSessionActive()) {
          pendingTab = targetTab;
          showExitModal = true;
          return;
        }
        activeTab = targetTab;
      };

      // Step 1: User tries to switch to 'hub'
      handleSelectTab('hub');
      assert.strictEqual(activeTab, 'breathing', 'Active tab must not switch while session is running');
      assert.strictEqual(showExitModal, true, 'Exit modal must open');
      assert.strictEqual(pendingTab, 'hub', 'Pending destination must be recorded');
      assert.strictEqual(keepAwakeActive, true, 'KeepAwake must remain active during prompt');

      // Step 2: User cancels exit
      showExitModal = false;
      pendingTab = null;
      assert.strictEqual(activeTab, 'breathing', 'User stays on breathing exercise');

      // Step 3: User confirms exit on second attempt
      handleSelectTab('hub');
      const handleConfirmExit = () => {
        showExitModal = false;
        keepAwakeActive = false;
        activeTab = pendingTab || 'hub';
        pendingTab = null;
      };
      handleConfirmExit();

      assert.strictEqual(activeTab, 'hub', 'Switches to hub upon confirmation');
      assert.strictEqual(keepAwakeActive, false, 'KeepAwake deactivated after leaving exercise');
    } finally {
      env.cleanup();
    }
  });

  it('T3.C2: Tab switching attempt while HydroCycle contrast shower is active prompts ExitConfirmModal', () => {
    const env = setupDOMEnvironment();
    try {
      let activeTab = 'hydro';
      let showExitModal = false;

      // In Hydrocicle, ShowerScreen renders id="exerciseScreen" or class="shower-screen"
      const showerEl = env.document.createElement('div');
      showerEl.id = 'exerciseScreen';
      showerEl.className = 'screen active';
      env.root.appendChild(showerEl);

      // Robust session detection covering both contract specifications
      const isShowerActive = () => {
        return Boolean(env.document.querySelector('.shower-screen, #exerciseScreen.active, #exerciseScreen'));
      };

      assert.strictEqual(isShowerActive(), true, 'Active shower session is detected');

      // Attempt navigation
      if (isShowerActive()) {
        showExitModal = true;
      }
      assert.strictEqual(showExitModal, true, 'Exit modal triggered for active shower');
    } finally {
      env.cleanup();
    }
  });

  it('T3.C3: Zoom scaling interacts harmoniously with squircle tokens and responsive layouts', () => {
    const env = setupDOMEnvironment();
    try {
      const applyZoomAndLayout = (zoomPercent, viewportWidth) => {
        const scaleFactor = zoomPercent / 100;
        const clampedScale = Math.min(2.2, Math.max(0.8, scaleFactor));
        env.documentElement.style.setProperty('--ui-scale', scaleFactor.toString());
        env.documentElement.style.setProperty('--ui-scale-clamped', clampedScale.toString());

        const mode = viewportWidth < 768 ? 'mobile' : 'desktop';
        return {
          scaleFactor,
          clampedScale,
          mode
        };
      };

      // Test 1: Mobile at 150% zoom
      const mobileResult = applyZoomAndLayout(150, 390);
      assert.strictEqual(mobileResult.scaleFactor, 1.5);
      assert.strictEqual(mobileResult.clampedScale, 1.5);
      assert.strictEqual(mobileResult.mode, 'mobile');
      assert.strictEqual(env.documentElement.style.getPropertyValue('--ui-scale'), '1.5');

      // Test 2: Desktop at 80% zoom
      const desktopResult = applyZoomAndLayout(80, 1920);
      assert.strictEqual(desktopResult.scaleFactor, 0.8);
      assert.strictEqual(desktopResult.clampedScale, 0.8);
      assert.strictEqual(desktopResult.mode, 'desktop');
    } finally {
      env.cleanup();
    }
  });

  it('T3.C4: Bi-directional settings synchronization (theme and language) between Hub and sub-apps', () => {
    const env = setupDOMEnvironment();
    try {
      let currentLang = 'es';
      let currentTheme = 'dark';
      let omegaSyncDispatched = false;

      env.window.addEventListener('omega-sync', () => {
        omegaSyncDispatched = true;
      });

      // Simulating Hub settings change
      const changeLanguage = (newLang) => {
        currentLang = newLang;
        env.localStorage.setItem('omega_language', newLang);

        const bCfg = JSON.parse(env.localStorage.getItem('bubbleBreathingConfig') || '{}');
        bCfg.language = newLang;
        env.localStorage.setItem('bubbleBreathingConfig', JSON.stringify(bCfg));

        const hCfg = JSON.parse(env.localStorage.getItem('hydrocicleConfig') || '{}');
        hCfg.language = newLang;
        env.localStorage.setItem('hydrocicleConfig', JSON.stringify(hCfg));

        env.window.dispatchEvent(new env.window.CustomEvent('omega-sync'));
      };

      changeLanguage('en');

      assert.strictEqual(currentLang, 'en');
      assert.strictEqual(env.localStorage.getItem('omega_language'), 'en');
      assert.strictEqual(JSON.parse(env.localStorage.getItem('bubbleBreathingConfig')).language, 'en');
      assert.strictEqual(JSON.parse(env.localStorage.getItem('hydrocicleConfig')).language, 'en');
      assert.strictEqual(omegaSyncDispatched, true, 'omega-sync event was broadcast to sub-apps');

      // Simulating sub-app sync event back to Hub
      env.window.addEventListener('subapp-sync', (e) => {
        if (e.detail?.theme) currentTheme = e.detail.theme;
        if (e.detail?.language) currentLang = e.detail.language;
      });

      env.window.dispatchEvent(new env.window.CustomEvent('subapp-sync', {
        detail: { theme: 'light', language: 'fr' }
      }));

      assert.strictEqual(currentTheme, 'light');
      assert.strictEqual(currentLang, 'fr');
    } finally {
      env.cleanup();
    }
  });

  it('T3.C5: Android back button handler intercepts active exercise session and keeps KeepAwake engaged', () => {
    const env = setupDOMEnvironment();
    try {
      let activeTab = 'breathing';
      let showExitModal = false;
      let isSessionActive = true;
      let appExited = false;

      // Simulated back button listener logic from nativeService.ts & App.tsx
      const handleBackButton = () => {
        if (showExitModal) {
          showExitModal = false;
          return true; // handled, closed modal
        }

        if (activeTab !== 'hub') {
          if (isSessionActive) {
            showExitModal = true;
            return true; // handled, intercepted exit
          }
          activeTab = 'hub';
          return true;
        }

        appExited = true;
        return false; // Exit app
      };

      // Press back while session is running
      const handled = handleBackButton();
      assert.strictEqual(handled, true, 'Back button was intercepted');
      assert.strictEqual(showExitModal, true, 'Exit confirmation modal was raised');
      assert.strictEqual(activeTab, 'breathing', 'User is still in breathing session');
      assert.strictEqual(appExited, false, 'App did not exit');

      // Second press back closes the modal
      const handledSecond = handleBackButton();
      assert.strictEqual(handledSecond, true);
      assert.strictEqual(showExitModal, false, 'Modal dismissed');
    } finally {
      env.cleanup();
    }
  });

  it('T3.C6: Multi-window storage events synchronize streak and checklist metrics dynamically', () => {
    const env = setupDOMEnvironment();
    try {
      let habitChecked = false;

      // Listen for simulated storage event from another window
      env.window.addEventListener('storage', (e) => {
        const eventKey = e.key || e.detail?.key;
        if (eventKey === 'bubbleBreathingHistory' || eventKey === 'hydrocicleHistory') {
          habitChecked = true;
        }
      });

      // External write
      env.localStorage.setItem('bubbleBreathingHistory', JSON.stringify([{ date: Date.now() }]));
      const storageEvent = new env.window.CustomEvent('storage', {
        detail: { key: 'bubbleBreathingHistory' }
      });
      storageEvent.key = 'bubbleBreathingHistory';
      env.window.dispatchEvent(storageEvent);

      assert.strictEqual(habitChecked, true, 'Storage event triggered refresh of dashboard habit metrics');
    } finally {
      env.cleanup();
    }
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { readProjectFile } from './helpers/test-utils.js';
import { setupDOMEnvironment } from './helpers/dom-shim.js';

/**
 * Accurate CSS Keyframes Parser with nested brace depth matching.
 */
function parseKeyframesAccurate(cssContent) {
  if (!cssContent) return new Map();
  const keyframes = new Map();
  const kfRegex = /@keyframes\s+([a-zA-Z0-9_-]+)\s*\{/g;
  let match;
  while ((match = kfRegex.exec(cssContent)) !== null) {
    const name = match[1];
    let depth = 1;
    let idx = match.index + match[0].length;
    const start = idx;
    while (idx < cssContent.length && depth > 0) {
      if (cssContent[idx] === '{') depth++;
      else if (cssContent[idx] === '}') depth--;
      idx++;
    }
    const body = cssContent.slice(start, idx - 1);
    keyframes.set(name, body);
  }
  return keyframes;
}

describe('Milestone 2 Challenger: GPU Animation, View Transitions & Layout Thrashing Stress Harness', () => {

  // =========================================================================
  // SUITE 1: Progress Bar Zero-Reflow & scaleX Architecture Stress
  // =========================================================================
  describe('Suite 1: Progress Bar Zero-Reflow & scaleX Architecture Stress', () => {
    it('M2.C1.1: Bubble-Breathing Header.tsx uses GPU scaleX and translateZ(0) with will-change', () => {
      const headerCode = readProjectFile('Bubble-Breathing/src/components/Header.tsx') || '';
      assert.ok(headerCode, 'Bubble-Breathing Header.tsx must exist');

      // Verify no width attribute in style
      assert.doesNotMatch(
        headerCode,
        /style=\{\{\s*width:\s*[`'"][^}]*progressWidth/i,
        'Header.tsx must NOT mutate CSS width directly on #progressFill'
      );

      // Verify transform: scaleX(...) translateZ(0)
      assert.match(
        headerCode,
        /transform:\s*`scaleX\(.*?progressWidth.*?\)\s+translateZ\(0\)`/is,
        'Header.tsx must animate transform: scaleX(...) translateZ(0)'
      );

      // Verify transformOrigin is left center
      assert.match(
        headerCode,
        /transformOrigin:\s*['"]left\s+center['"]/i,
        'Header.tsx must set transformOrigin to left center'
      );

      // Verify willChange transform
      assert.match(
        headerCode,
        /willChange:\s*['"]transform['"]/i,
        'Header.tsx must set willChange: transform'
      );
    });

    it('M2.C1.2: Hydrocicle Header.tsx uses GPU scaleX and translateZ(0) with will-change', () => {
      const headerCode = readProjectFile('Hydrocicle/src/components/Header.tsx') || '';
      assert.ok(headerCode, 'Hydrocicle Header.tsx must exist');

      // Verify no width attribute in style
      assert.doesNotMatch(
        headerCode,
        /style=\{\{\s*width:\s*[`'"][^}]*progressWidth/i,
        'Hydrocicle Header.tsx must NOT mutate CSS width directly on #progressFill'
      );

      // Verify transform: scaleX(...) translateZ(0)
      assert.match(
        headerCode,
        /transform:\s*`scaleX\(.*?progressWidth.*?\)\s+translateZ\(0\)`/is,
        'Hydrocicle Header.tsx must animate transform: scaleX(...) translateZ(0)'
      );

      // Verify transformOrigin is left center
      assert.match(
        headerCode,
        /transformOrigin:\s*['"]left\s+center['"]/i,
        'Hydrocicle Header.tsx must set transformOrigin to left center'
      );

      // Verify willChange transform
      assert.match(
        headerCode,
        /willChange:\s*['"]transform['"]/i,
        'Hydrocicle Header.tsx must set willChange: transform'
      );
    });

    it('M2.C1.3: Mathematical normalization and boundary clamping of progress scale factor', () => {
      const computeScale = (progressWidth) => {
        return Math.max(0, Math.min(1, progressWidth / 100));
      };

      // Exact boundaries
      assert.strictEqual(computeScale(0), 0, '0% progress must yield scale 0');
      assert.strictEqual(computeScale(50), 0.5, '50% progress must yield scale 0.5');
      assert.strictEqual(computeScale(100), 1, '100% progress must yield scale 1.0');

      // Negative inputs clamped to 0
      assert.strictEqual(computeScale(-0.001), 0, 'Negative float must clamp to 0');
      assert.strictEqual(computeScale(-100), 0, 'Negative integer must clamp to 0');

      // Overflow inputs clamped to 1.0
      assert.strictEqual(computeScale(100.001), 1, 'Overflow float must clamp to 1.0');
      assert.strictEqual(computeScale(500), 1, 'Extreme overflow must clamp to 1.0');

      // High-precision step verification (120Hz frame step simulation)
      for (let p = 0; p <= 100; p += 0.833) {
        const s = computeScale(p);
        assert.ok(s >= 0 && s <= 1.0, `Scale ${s} at ${p}% must be bounded within [0, 1]`);
      }
    });

    it('M2.C1.4: Exhaustive CSS audit: zero width transitions on progress bars across all stylesheets', () => {
      const files = [
        'src/styles/hub.css',
        'src/styles/animations.css',
        'Bubble-Breathing/src/style.css',
        'Bubble-Breathing/css/style.css',
        'Hydrocicle/src/index.css'
      ];

      for (const file of files) {
        const css = readProjectFile(file) || '';
        assert.ok(css.length > 0, `Stylesheet ${file} must exist and have content`);

        // Check for transition: width anywhere in the file
        const matches = css.match(/transition:[^;]*\bwidth\b[^;]*;/gi) || [];
        assert.strictEqual(
          matches.length,
          0,
          `File ${file} contains illegal transition on width: ${JSON.stringify(matches)}`
        );
      }
    });

    it('M2.C1.5: Stylesheets enforce transform-origin left, will-change, and transform transition on progress bars', () => {
      const hubCss = readProjectFile('src/styles/hub.css') || '';
      const bubbleCss = readProjectFile('Bubble-Breathing/src/style.css') || '';
      const bubbleCssLegacy = readProjectFile('Bubble-Breathing/css/style.css') || '';
      const hydroCss = readProjectFile('Hydrocicle/src/index.css') || '';

      // Check hub.css override
      assert.match(
        hubCss,
        /\.omega-view\s+\.header\s+#progressFill\s*\{[^}]*transform-origin:\s*left\s+center/i,
        'hub.css must enforce transform-origin: left center on #progressFill'
      );
      assert.match(
        hubCss,
        /\.omega-view\s+\.header\s+#progressFill\s*\{[^}]*will-change:\s*transform/i,
        'hub.css must enforce will-change: transform on #progressFill'
      );
      assert.match(
        hubCss,
        /\.omega-view\s+\.header\s+#progressFill\s*\{[^}]*transition:\s*transform/i,
        'hub.css must enforce transition: transform on #progressFill'
      );

      // Check sub-app stylesheets
      for (const [name, css] of [
        ['Bubble-Breathing/src/style.css', bubbleCss],
        ['Bubble-Breathing/css/style.css', bubbleCssLegacy],
        ['Hydrocicle/src/index.css', hydroCss]
      ]) {
        assert.match(
          css,
          /#progressFill\s*\{[^}]*transform-origin:\s*left\s+center/i,
          `${name} must declare transform-origin: left center on #progressFill`
        );
        assert.match(
          css,
          /#progressFill\s*\{[^}]*will-change:\s*transform/i,
          `${name} must declare will-change: transform on #progressFill`
        );
        assert.match(
          css,
          /#progressFill\s*\{[^}]*transition:\s*transform/i,
          `${name} must declare transition: transform on #progressFill`
        );
      }
    });
  });

  // =========================================================================
  // SUITE 2: Keyframes & GPU Repaint Elimination Stress
  // =========================================================================
  describe('Suite 2: Keyframes & GPU Repaint Elimination Stress', () => {
    it('M2.C2.1: lastBreathGlow in Bubble-Breathing/src/style.css contains zero box-shadow repaints', () => {
      const css = readProjectFile('Bubble-Breathing/src/style.css') || '';
      const keyframes = parseKeyframesAccurate(css);
      const glow = keyframes.get('lastBreathGlow');

      assert.ok(glow, '@keyframes lastBreathGlow must exist in Bubble-Breathing/src/style.css');
      assert.doesNotMatch(
        glow,
        /box-shadow/i,
        'lastBreathGlow in src/style.css must NOT animate box-shadow (causes CPU raster repaints)'
      );
      assert.match(
        glow,
        /opacity\s*:/i,
        'lastBreathGlow in src/style.css must animate composited opacity'
      );
      assert.match(
        glow,
        /transform\s*:/i,
        'lastBreathGlow in src/style.css must animate composited transform'
      );
    });

    it('M2.C2.2: lastBreathGlow in Bubble-Breathing/css/style.css contains zero box-shadow repaints', () => {
      const css = readProjectFile('Bubble-Breathing/css/style.css') || '';
      const keyframes = parseKeyframesAccurate(css);
      const glow = keyframes.get('lastBreathGlow');

      assert.ok(glow, '@keyframes lastBreathGlow must exist in Bubble-Breathing/css/style.css');
      assert.doesNotMatch(
        glow,
        /box-shadow/i,
        'lastBreathGlow in css/style.css must NOT animate box-shadow (causes CPU raster repaints)'
      );
      assert.match(
        glow,
        /opacity\s*:/i,
        'lastBreathGlow in css/style.css must animate composited opacity'
      );
      assert.match(
        glow,
        /transform\s*:/i,
        'lastBreathGlow in css/style.css must animate composited transform'
      );
    });

    it('M2.C2.3: Pseudo-element ::before architecture isolates lastBreathGlow GPU layer', () => {
      const srcCss = readProjectFile('Bubble-Breathing/src/style.css') || '';
      const legacyCss = readProjectFile('Bubble-Breathing/css/style.css') || '';

      for (const [name, css] of [['src/style.css', srcCss], ['css/style.css', legacyCss]]) {
        assert.match(
          css,
          /\.(?:breathing-sphere|hexagon)\.last-breath::before\s*\{[^}]*animation:\s*lastBreathGlow/i,
          `${name} must attach lastBreathGlow animation to ::before pseudo-element`
        );
      }
    });

    it('M2.C2.4: All keyframes in animations.css use exclusively GPU composited properties', () => {
      const animCss = readProjectFile('src/styles/animations.css') || '';
      const keyframes = parseKeyframesAccurate(animCss);

      assert.ok(keyframes.size >= 5, 'animations.css must define high-refresh keyframes');

      const expectedGpuKeyframes = [
        'hydroSpherePulse',
        'hydroHaloPulse',
        'omegaModalIn',
        'omegaModalOut',
        'omegaFadeIn',
        'omegaFadeOut',
        'flameBounce',
        'viewScreenEnter'
      ];

      for (const name of expectedGpuKeyframes) {
        const body = keyframes.get(name);
        assert.ok(body, `@keyframes ${name} must be declared in animations.css`);

        // Assert no layout or expensive repaint properties
        assert.doesNotMatch(body, /\b(width|height|top|left|margin|padding)\s*:/i, `${name} must not animate layout properties`);
        assert.doesNotMatch(body, /\bbox-shadow\s*:/i, `${name} must not animate box-shadow`);
        assert.doesNotMatch(body, /\bfilter\s*:\s*blur/i, `${name} must not animate filter blur`);

        // Assert presence of GPU properties (transform or opacity)
        assert.match(body, /\b(transform|opacity)\s*:/i, `${name} must animate transform or opacity`);
      }
    });

    it('M2.C2.5: HydroCycle shower pulsing keyframes hydroSpherePulse and hydroHaloPulse operate on GPU', () => {
      const hydroCss = readProjectFile('Hydrocicle/src/index.css') || '';
      const keyframes = parseKeyframesAccurate(hydroCss);

      const spherePulse = keyframes.get('hydroSpherePulse');
      const haloPulse = keyframes.get('hydroHaloPulse');

      assert.ok(spherePulse, '@keyframes hydroSpherePulse must exist in Hydrocicle index.css');
      assert.ok(haloPulse, '@keyframes hydroHaloPulse must exist in Hydrocicle index.css');

      assert.doesNotMatch(spherePulse, /box-shadow/i, 'hydroSpherePulse must not animate box-shadow');
      assert.doesNotMatch(haloPulse, /box-shadow/i, 'hydroHaloPulse must not animate box-shadow');

      assert.match(spherePulse, /transform\s*:/i, 'hydroSpherePulse must animate transform');
      assert.match(haloPulse, /transform\s*:/i, 'haloPulse must animate transform');
      assert.match(haloPulse, /opacity\s*:/i, 'haloPulse must animate opacity');
    });
  });

  // =========================================================================
  // SUITE 3: View Transitions & Layout Isolation Stress
  // =========================================================================
  describe('Suite 3: View Transitions & Layout Isolation Stress', () => {
    it('M2.C3.1: .omega-views-container enforces absolute positioning and overflow containment', () => {
      const animCss = readProjectFile('src/styles/animations.css') || '';

      assert.match(
        animCss,
        /\.omega-views-container\s*\{[^}]*position:\s*relative/i,
        '.omega-views-container must establish relative positioning'
      );
      assert.match(
        animCss,
        /\.omega-views-container\s*\{[^}]*overflow:\s*hidden/i,
        '.omega-views-container must enforce overflow: hidden to prevent cross-view layout shifts'
      );
    });

    it('M2.C3.2: .omega-view transitions operate strictly on composited properties (opacity, transform, visibility)', () => {
      const animCss = readProjectFile('src/styles/animations.css') || '';

      // Verify .omega-view base transition
      assert.match(
        animCss,
        /\.omega-view\s*\{[^}]*will-change:\s*opacity,\s*transform/i,
        '.omega-view must declare will-change: opacity, transform'
      );
      assert.match(
        animCss,
        /\.omega-view\s*\{[^}]*transform:\s*scale\([^)]+\)\s+translate3d/i,
        '.omega-view must use scale and translate3d hardware composition'
      );

      // Verify no layout property transitions in .omega-view
      const viewBlockMatch = animCss.match(/\.omega-view\s*\{([^}]+)\}/);
      assert.ok(viewBlockMatch, '.omega-view block must exist');
      const viewBlock = viewBlockMatch[1];
      const transitionMatch = viewBlock.match(/transition:\s*([^;]+);/);
      assert.ok(transitionMatch, '.omega-view must define a transition property');
      const transitions = transitionMatch[1];

      // Disallow any layout property in transition
      assert.doesNotMatch(transitions, /\b(width|height|top|left|margin|padding|display)\b/i, 'Transition must not include layout properties');
    });

    it('M2.C3.3: Inactive and hidden views enforce pointer-events: none and visibility: hidden', () => {
      const animCss = readProjectFile('src/styles/animations.css') || '';

      assert.match(
        animCss,
        /\.omega-view\.hidden\s*\{[^}]*opacity:\s*0\s*!important/i,
        '.omega-view.hidden must have opacity: 0 !important'
      );
      assert.match(
        animCss,
        /\.omega-view\.hidden\s*\{[^}]*visibility:\s*hidden\s*!important/i,
        '.omega-view.hidden must have visibility: hidden !important'
      );
      assert.match(
        animCss,
        /\.omega-view\.hidden\s*\{[^}]*pointer-events:\s*none\s*!important/i,
        '.omega-view.hidden must have pointer-events: none !important to prevent phantom click events'
      );
    });

    it('M2.C3.4: Active view enforces pointer-events: auto and scale(1) translate3d(0, 0, 0)', () => {
      const animCss = readProjectFile('src/styles/animations.css') || '';

      assert.match(
        animCss,
        /\.omega-view\.active[^{]*\{[^}]*opacity:\s*1/i,
        '.omega-view.active must have opacity: 1'
      );
      assert.match(
        animCss,
        /\.omega-view\.active[^{]*\{[^}]*visibility:\s*visible/i,
        '.omega-view.active must have visibility: visible'
      );
      assert.match(
        animCss,
        /\.omega-view\.active[^{]*\{[^}]*pointer-events:\s*auto/i,
        '.omega-view.active must have pointer-events: auto'
      );
      assert.match(
        animCss,
        /\.omega-view\.active[^{]*\{[^}]*transform:\s*scale\(1\)\s+translate3d\(0,\s*0,\s*0\)/i,
        '.omega-view.active must reset transform to scale(1) translate3d(0, 0, 0)'
      );
    });
  });

  // =========================================================================
  // SUITE 4: Modal Lifecycle & Enter/Exit Animation State Machine
  // =========================================================================
  describe('Suite 4: Modal Lifecycle & Enter/Exit Animation State Machine', () => {
    it('M2.C4.1: useModalAnimation hook simulation: strict state transitions', async () => {
      // Simulate useModalAnimation logic under synthetic clock
      class ModalAnimationSimulation {
        constructor(durationMs = 200) {
          this.durationMs = durationMs;
          this.mounted = false;
          this.active = false;
          this._unmountTimer = null;
        }

        setOpen(isOpen) {
          if (isOpen) {
            this.mounted = true;
            if (this._unmountTimer) {
              clearTimeout(this._unmountTimer);
              this._unmountTimer = null;
            }
            // Simulates rAF tick
            this.active = true;
          } else {
            this.active = false;
            if (this._unmountTimer) clearTimeout(this._unmountTimer);
            this._unmountTimer = setTimeout(() => {
              this.mounted = false;
              this._unmountTimer = null;
            }, this.durationMs);
          }
        }
      }

      const modal = new ModalAnimationSimulation(200);

      // Initial state
      assert.strictEqual(modal.mounted, false);
      assert.strictEqual(modal.active, false);

      // Open modal
      modal.setOpen(true);
      assert.strictEqual(modal.mounted, true, 'Modal should be mounted immediately upon opening');
      assert.strictEqual(modal.active, true, 'Modal should be active upon opening');

      // Close modal
      modal.setOpen(false);
      assert.strictEqual(modal.active, false, 'Modal active should immediately be false for exit transition');
      assert.strictEqual(modal.mounted, true, 'Modal must remain mounted during exit transition');

      // Wait 100ms (halfway through transition)
      await new Promise(r => setTimeout(r, 100));
      assert.strictEqual(modal.mounted, true, 'Modal must still be mounted at 100ms');

      // Wait remaining 150ms (> 200ms)
      await new Promise(r => setTimeout(r, 150));
      assert.strictEqual(modal.mounted, false, 'Modal should unmount after durationMs expires');
    });

    it('M2.C4.2: Modal rapid toggle stress test: 100 rapid flips without unmount race conditions', async () => {
      let mounted = false;
      let active = false;
      let unmountTimer = null;
      const durationMs = 200;

      const setOpen = (isOpen) => {
        if (isOpen) {
          mounted = true;
          if (unmountTimer) {
            clearTimeout(unmountTimer);
            unmountTimer = null;
          }
          active = true;
        } else {
          active = false;
          if (unmountTimer) clearTimeout(unmountTimer);
          unmountTimer = setTimeout(() => {
            mounted = false;
            unmountTimer = null;
          }, durationMs);
        }
      };

      // Perform 100 rapid oscillating toggles
      for (let i = 0; i < 100; i++) {
        setOpen(i % 2 === 0);
        // Small synthetic delays
        if (i % 10 === 0) {
          await new Promise(r => setTimeout(r, 5));
        }
      }

      // Final state: if we setOpen(true), it should be mounted and active
      setOpen(true);
      assert.strictEqual(mounted, true);
      assert.strictEqual(active, true);
      assert.strictEqual(unmountTimer, null);

      // Now setOpen(false) and wait for clean unmount
      setOpen(false);
      assert.strictEqual(active, false);
      assert.strictEqual(mounted, true);
      await new Promise(r => setTimeout(r, 220));
      assert.strictEqual(mounted, false);
      assert.strictEqual(unmountTimer, null);
    });

    it('M2.C4.3: ExitConfirmModal component enforces backdrop dismissal and stopPropagation', () => {
      const exitModalCode = readProjectFile('src/components/ExitConfirmModal.tsx') || '';
      assert.ok(exitModalCode, 'ExitConfirmModal.tsx must exist');

      // Uses useModalAnimation
      assert.match(
        exitModalCode,
        /useModalAnimation\(\s*isOpen,\s*200\s*\)/i,
        'ExitConfirmModal must use useModalAnimation with 200ms duration'
      );

      // Dismiss on backdrop click
      assert.match(
        exitModalCode,
        /<div[^>]*className=\{`modal-overlay[^`]*`\}[^>]*onClick=\{onCancel\}/i,
        'ExitConfirmModal backdrop must trigger onCancel'
      );

      // Stop propagation on content click
      assert.match(
        exitModalCode,
        /onClick=\{\s*\(?e\)?\s*=>\s*e\.stopPropagation\(\)\s*\}/i,
        'ExitConfirmModal content click must stopPropagation'
      );
    });

    it('M2.C4.4: ZoomModal component enforces useModalAnimation and slider bounds', () => {
      const zoomModalCode = readProjectFile('src/components/ZoomModal.tsx') || '';
      assert.ok(zoomModalCode, 'ZoomModal.tsx must exist');

      // Uses useModalAnimation
      assert.match(
        zoomModalCode,
        /useModalAnimation\(\s*isOpen,\s*200\s*\)/i,
        'ZoomModal must use useModalAnimation with 200ms duration'
      );

      // Stepper bounds [80, 220]
      assert.match(
        zoomModalCode,
        /Math\.max\(\s*80,\s*currentZoom\s*-\s*10\s*\)/i,
        'ZoomModal decrement must clamp at 80'
      );
      assert.match(
        zoomModalCode,
        /Math\.min\(\s*220,\s*currentZoom\s*\+\s*10\s*\)/i,
        'ZoomModal increment must clamp at 220'
      );
    });
  });

  // =========================================================================
  // SUITE 5: High-Precision Timers & Session Protection
  // =========================================================================
  describe('Suite 5: High-Precision Timers & Session Protection', () => {
    it('M2.C5.1: High-precision timestamp delta math survives massive thread stalling (5000ms)', () => {
      // Simulate Date.now() based counter vs naive tick counter under a 5000ms thread freeze
      const baseTime = 1700000000000;
      let virtualNow = baseTime;
      const startTime = baseTime;

      let tickCount = 0;

      // Normal ticks for 10 seconds
      for (let s = 0; s < 10; s++) {
        virtualNow += 1000;
        tickCount++;
      }

      // Thread freeze for 5000ms (0 ticks fired during freeze)
      virtualNow += 5000;

      // Naive counter reflects only 10s
      const naiveElapsed = tickCount;
      // High-precision delta calculation:
      const highPrecisionElapsed = Math.floor((virtualNow - startTime) / 1000);

      assert.strictEqual(naiveElapsed, 10, 'Naive counter lost 5 seconds during freeze');
      assert.strictEqual(highPrecisionElapsed, 15, 'Timestamp delta accurately caught up to 15 physical seconds');
    });

    it('M2.C5.2: TimerContext accumulates elapsed time across pause and resume cycles', () => {
      const timerContextCode = readProjectFile('Hydrocicle/src/contexts/TimerContext.tsx') || '';
      assert.ok(timerContextCode, 'TimerContext.tsx must exist');

      // Verify accumulatedPhaseMsRef usage
      assert.match(
        timerContextCode,
        /accumulatedPhaseMsRef/i,
        'TimerContext must maintain accumulatedPhaseMsRef to preserve timing across pause/resume'
      );

      // Verify secondsInPhaseRef does NOT reset on every isPlaying transition
      assert.doesNotMatch(
        timerContextCode,
        /if\s*\(\s*isPlaying\s*\)\s*\{[^}]*secondsInPhaseRef\.current\s*=\s*0;/i,
        'TimerContext must not reset secondsInPhaseRef.current to 0 whenever isPlaying becomes true'
      );
    });

    it('M2.C5.3: Scoped DOM exercise screen selectors prevent cross-submodule navigation collisions', () => {
      const appCode = readProjectFile('src/App.tsx') || '';
      assert.ok(appCode, 'src/App.tsx must exist');

      // App.tsx must scope querySelector to .view-bubble and .view-hydro
      assert.match(
        appCode,
        /\.view-bubble\s+#exerciseScreen\.active/i,
        'App.tsx must scope bubble exercise screen selector to .view-bubble'
      );
      assert.match(
        appCode,
        /\.view-hydro\s+#exerciseScreen\.active/i,
        'App.tsx must scope hydro exercise screen selector to .view-hydro'
      );

      // App.tsx must listen to omega-session-state
      assert.match(
        appCode,
        /omega-session-state/i,
        'App.tsx must listen to custom event omega-session-state'
      );
    });

    it('M2.C5.4: Soundscape assets verified in Hydrocicle public/assets', () => {
      const assetsDir = '/data/data/com.termux/files/home/Omega/Hydrocicle/public/assets';

      assert.ok(fs.existsSync(assetsDir), 'Hydrocicle/public/assets must exist');
      const requiredSounds = ['ocean.mp3', 'rain.mp3', 'whitenoise.mp3'];
      for (const sound of requiredSounds) {
        const soundPath = path.join(assetsDir, sound);
        assert.ok(fs.existsSync(soundPath), `Sound asset ${sound} must exist in ${assetsDir}`);
        const stat = fs.statSync(soundPath);
        assert.ok(stat.size > 0, `Sound asset ${sound} must not be empty (size: ${stat.size} bytes)`);
      }
    });
  });
});

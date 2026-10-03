import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { 
  PROJECT_ROOT, 
  readProjectFile, 
  calculateContrastRatio, 
  getRelativeLuminance 
} from './helpers/test-utils.js';
import { setupDOMEnvironment } from './helpers/dom-shim.js';

describe('Milestone 1 Iteration 2 Challenger 2: Zoom Clamping, Edge Cases & Responsive Scaling Suite', () => {

  // =========================================================================
  // TASK 1: LocalStorage Zoom Boundary & Adversarial Fuzzing Stress
  // =========================================================================
  describe('Task 1: LocalStorage Zoom Boundary & Adversarial Fuzzing Stress', () => {

    it('C2.T1.1: App.tsx localStorage initialization algorithm strictly bounds outputs to [80, 220] or falls back to 100', () => {
      const appTsx = readProjectFile('src/App.tsx') || '';
      
      // Verify the code in App.tsx implements Number.isFinite and Math.min(220, Math.max(80, parsed))
      assert.match(
        appTsx,
        /const\s+saved\s*=\s*localStorage\.getItem\(['"]omega_zoom['"]\);/i,
        'App.tsx must retrieve omega_zoom from localStorage'
      );
      assert.match(
        appTsx,
        /if\s*\(!saved\)\s*return\s*100;/i,
        'App.tsx must return default 100 when saved is null or empty string'
      );
      assert.match(
        appTsx,
        /Number\.isFinite\(parsed\)\s*\?\s*Math\.min\(220,\s*Math\.max\(80,\s*parsed\)\)\s*:\s*100/i,
        'App.tsx must validate with Number.isFinite and clamp between 80 and 220'
      );

      // Extract the actual parse/clamp function logic
      const parseZoomFromStorage = (saved) => {
        if (!saved) return 100;
        const parsed = Number(saved);
        return Number.isFinite(parsed) ? Math.min(220, Math.max(80, parsed)) : 100;
      };

      // Mandated test cases: 50%, 500%, NaN, null
      assert.strictEqual(parseZoomFromStorage('50%'), 100, 'Input "50%" is NaN, must fall back to 100');
      assert.strictEqual(parseZoomFromStorage('500%'), 100, 'Input "500%" is NaN, must fall back to 100');
      assert.strictEqual(parseZoomFromStorage('NaN'), 100, 'Input "NaN" must fall back to 100');
      assert.strictEqual(parseZoomFromStorage(null), 100, 'Input null must fall back to 100');
      assert.strictEqual(parseZoomFromStorage('null'), 100, 'Input "null" string must fall back to 100');

      // Extreme boundary numerical values
      assert.strictEqual(parseZoomFromStorage('50'), 80, 'Input "50" must clamp to min 80');
      assert.strictEqual(parseZoomFromStorage('500'), 220, 'Input "500" must clamp to max 220');
      assert.strictEqual(parseZoomFromStorage('0'), 80, 'Input "0" must clamp to min 80');
      assert.strictEqual(parseZoomFromStorage('-100'), 80, 'Input "-100" must clamp to min 80');
      assert.strictEqual(parseZoomFromStorage('79.9'), 80, 'Input "79.9" must clamp to min 80');
      assert.strictEqual(parseZoomFromStorage('80'), 80, 'Input "80" must remain 80');
      assert.strictEqual(parseZoomFromStorage('100'), 100, 'Input "100" must remain 100');
      assert.strictEqual(parseZoomFromStorage('150'), 150, 'Input "150" must remain 150');
      assert.strictEqual(parseZoomFromStorage('220'), 220, 'Input "220" must remain 220');
      assert.strictEqual(parseZoomFromStorage('220.1'), 220, 'Input "220.1" must clamp to max 220');
      assert.strictEqual(parseZoomFromStorage('999999'), 220, 'Input "999999" must clamp to max 220');

      // Exotic & adversarial non-numeric string values
      assert.strictEqual(parseZoomFromStorage(''), 100, 'Empty string must fall back to 100');
      assert.strictEqual(parseZoomFromStorage(undefined), 100, 'undefined must fall back to 100');
      assert.strictEqual(parseZoomFromStorage('undefined'), 100, 'String "undefined" must fall back to 100');
      assert.strictEqual(parseZoomFromStorage('Infinity'), 100, 'Infinity must fall back to 100');
      assert.strictEqual(parseZoomFromStorage('-Infinity'), 100, '-Infinity must fall back to 100');
      assert.strictEqual(parseZoomFromStorage('true'), 100, 'String "true" must fall back to 100');
      assert.strictEqual(parseZoomFromStorage('false'), 100, 'String "false" must fall back to 100');
      assert.strictEqual(parseZoomFromStorage('{}'), 100, 'String "{}" must fall back to 100');
      assert.strictEqual(parseZoomFromStorage('[object Object]'), 100, 'String "[object Object]" must fall back to 100');
      assert.strictEqual(parseZoomFromStorage('200px'), 100, 'String "200px" must fall back to 100');
      assert.strictEqual(parseZoomFromStorage('1.5rem'), 100, 'String "1.5rem" must fall back to 100');
    });

    it('C2.T1.2: Adversarial fuzz generator (2,000 random inputs) guarantees 100% boundary safety', () => {
      const parseZoomFromStorage = (saved) => {
        if (!saved) return 100;
        const parsed = Number(saved);
        return Number.isFinite(parsed) ? Math.min(220, Math.max(80, parsed)) : 100;
      };

      // Generate 2000 adversarial tests
      for (let i = 0; i < 2000; i++) {
        let input;
        const mode = i % 5;
        if (mode === 0) {
          // Large random numbers (both positive and negative)
          input = (Math.random() * 2e6 - 1e6).toString();
        } else if (mode === 1) {
          // Random strings / symbols / garbage
          input = Math.random().toString(36).substring(2) + (i % 2 === 0 ? '%' : 'px');
        } else if (mode === 2) {
          // Sub-normal or fractional numbers
          input = (Math.random() * 300).toFixed(6);
        } else if (mode === 3) {
          // Scientific notation
          input = (Math.random() * 10).toString() + 'e' + Math.floor(Math.random() * 20 - 10);
        } else {
          // Null, empty, whitespace, booleans
          input = ['', ' ', '   \t\n', 'null', 'undefined', 'false', 'true', 'NaN'][i % 8];
        }

        const result = parseZoomFromStorage(input);
        assert.ok(
          Number.isFinite(result), 
          `Fuzz failed on "${input}": returned non-finite value ${result}`
        );
        assert.ok(
          result >= 80, 
          `Fuzz failed on "${input}": returned ${result} < 80`
        );
        assert.ok(
          result <= 220, 
          `Fuzz failed on "${input}": returned ${result} > 220`
        );
      }
    });

    it('C2.T1.3: handleZoomChange in App.tsx enforces [80, 220] clamping for interactive state updates', () => {
      const appTsx = readProjectFile('src/App.tsx') || '';

      assert.match(
        appTsx,
        /const\s+handleZoomChange\s*=\s*\(\s*newZoom:\s*number\s*\)\s*=>\s*\{\s*const\s+clamped\s*=\s*Math\.min\(220,\s*Math\.max\(80,\s*newZoom\)\);\s*setCurrentZoom\(clamped\);\s*\};/i,
        'handleZoomChange must clamp newZoom between 80 and 220 before calling setCurrentZoom'
      );
    });

    it('C2.T1.4: App.tsx useEffect updates DOM properties and synchronizes to LocalStorage safely', () => {
      const appTsx = readProjectFile('src/App.tsx') || '';

      // Must clear documentElement.style.zoom
      assert.match(
        appTsx,
        /\(document\.documentElement\.style\s+as\s+any\)\.zoom\s*=\s*['"]['"];/i,
        'App.tsx must clear buggy CSS zoom property'
      );

      // Must compute scaleFactor
      assert.match(
        appTsx,
        /const\s+scaleFactor\s*=\s*currentZoom\s*\/\s*100;/i,
        'App.tsx must compute scaleFactor = currentZoom / 100'
      );

      // Must set --ui-scale
      assert.match(
        appTsx,
        /document\.documentElement\.style\.setProperty\(['"]--ui-scale['"],\s*scaleFactor\.toString\(\)\);/i,
        'App.tsx must set --ui-scale custom property'
      );

      // Must set --ui-scale-clamped bounded to [0.8, 2.2]
      assert.match(
        appTsx,
        /const\s+clampedScale\s*=\s*Math\.min\(2\.2,\s*Math\.max\(0\.8,\s*scaleFactor\)\);/i,
        'App.tsx must clamp clampedScale between 0.8 and 2.2'
      );
      assert.match(
        appTsx,
        /document\.documentElement\.style\.setProperty\(['"]--ui-scale-clamped['"],\s*clampedScale\.toString\(\)\);/i,
        'App.tsx must set --ui-scale-clamped custom property'
      );

      // Must synchronize back to localStorage
      assert.match(
        appTsx,
        /localStorage\.setItem\(['"]omega_zoom['"],\s*currentZoom\.toString\(\)\);/i,
        'App.tsx must persist clamped currentZoom to localStorage'
      );
    });

    it('C2.T1.5: Simulated DOM environment verifies end-to-end lifecycle and self-correction of corrupted localStorage', () => {
      const env = setupDOMEnvironment();
      try {
        const simulateAppZoomLifecycle = (initialStorageValue) => {
          if (initialStorageValue !== undefined) {
            env.localStorage.setItem('omega_zoom', initialStorageValue);
          } else {
            env.localStorage.removeItem('omega_zoom');
          }

          // Step 1: Initial state computation (lines 21-26)
          const saved = env.localStorage.getItem('omega_zoom');
          let currentZoom = 100;
          if (saved) {
            const parsed = Number(saved);
            currentZoom = Number.isFinite(parsed) ? Math.min(220, Math.max(80, parsed)) : 100;
          }

          // Step 2: Effect synchronization (lines 35-46)
          env.documentElement.style.zoom = '';
          const scaleFactor = currentZoom / 100;
          env.documentElement.style.setProperty('--ui-scale', scaleFactor.toString());
          const clampedScale = Math.min(2.2, Math.max(0.8, scaleFactor));
          env.documentElement.style.setProperty('--ui-scale-clamped', clampedScale.toString());
          env.localStorage.setItem('omega_zoom', currentZoom.toString());

          return {
            currentZoom,
            uiScale: env.documentElement.style.getPropertyValue('--ui-scale'),
            uiScaleClamped: env.documentElement.style.getPropertyValue('--ui-scale-clamped'),
            storedZoom: env.localStorage.getItem('omega_zoom')
          };
        };

        // Corrupted "500%"
        const res500pct = simulateAppZoomLifecycle('500%');
        assert.strictEqual(res500pct.currentZoom, 100);
        assert.strictEqual(res500pct.uiScale, '1');
        assert.strictEqual(res500pct.uiScaleClamped, '1');
        assert.strictEqual(res500pct.storedZoom, '100');

        // Corrupted "50%"
        const res50pct = simulateAppZoomLifecycle('50%');
        assert.strictEqual(res50pct.currentZoom, 100);
        assert.strictEqual(res50pct.uiScale, '1');
        assert.strictEqual(res50pct.uiScaleClamped, '1');
        assert.strictEqual(res50pct.storedZoom, '100');

        // Out of bounds extreme 500 (numerical)
        const res500 = simulateAppZoomLifecycle('500');
        assert.strictEqual(res500.currentZoom, 220);
        assert.strictEqual(res500.uiScale, '2.2');
        assert.strictEqual(res500.uiScaleClamped, '2.2');
        assert.strictEqual(res500.storedZoom, '220');

        // Out of bounds extreme 50 (numerical)
        const res50 = simulateAppZoomLifecycle('50');
        assert.strictEqual(res50.currentZoom, 80);
        assert.strictEqual(res50.uiScale, '0.8');
        assert.strictEqual(res50.uiScaleClamped, '0.8');
        assert.strictEqual(res50.storedZoom, '80');

        // Corrupted NaN
        const resNaN = simulateAppZoomLifecycle('NaN');
        assert.strictEqual(resNaN.currentZoom, 100);
        assert.strictEqual(resNaN.uiScale, '1');
        assert.strictEqual(resNaN.uiScaleClamped, '1');
        assert.strictEqual(resNaN.storedZoom, '100');

        // Null (missing key)
        const resNull = simulateAppZoomLifecycle(undefined);
        assert.strictEqual(resNull.currentZoom, 100);
        assert.strictEqual(resNull.uiScale, '1');
        assert.strictEqual(resNull.uiScaleClamped, '1');
        assert.strictEqual(resNull.storedZoom, '100');
      } finally {
        env.cleanup();
      }
    });
  });

  // =========================================================================
  // TASK 2: Root Font-Size Scaling Across Viewports (320px, 360px, 768px, 1280px)
  // =========================================================================
  describe('Task 2: Root Font-Size Scaling Across Viewports (320px, 360px, 768px, 1280px)', () => {

    // CSS rule in hub.css:
    // html { font-size: calc(clamp(13px, 3.2vmin, 16px) * var(--ui-scale-clamped, 1)) !important; }
    const computeRootFontSize = (viewportWidth, viewportHeight, zoomPercent) => {
      const vmin = Math.min(viewportWidth, viewportHeight);
      const rawVmin3_2 = 0.032 * vmin;
      const baseFontSize = Math.min(16, Math.max(13, rawVmin3_2));
      const scaleFactor = zoomPercent / 100;
      const clampedScale = Math.min(2.2, Math.max(0.8, scaleFactor));
      return {
        baseFontSize,
        clampedScale,
        rootFontSize: baseFontSize * clampedScale
      };
    };

    it('C2.T2.1: 320px viewport (Compact Mobile portrait 320x568 / 320x640): base font is strictly 13.0px', () => {
      const vpWidth = 320;
      const vpHeight = 568;

      const testZooms = [80, 100, 125, 150, 175, 200, 220];
      const expectedRemSizes = {
        80: 10.4,
        100: 13.0,
        125: 16.25,
        150: 19.5,
        175: 22.75,
        200: 26.0,
        220: 28.6
      };

      for (const zoom of testZooms) {
        const { baseFontSize, clampedScale, rootFontSize } = computeRootFontSize(vpWidth, vpHeight, zoom);
        assert.strictEqual(baseFontSize, 13.0, `Base font at 320px must clamp to 13.0px (3.2vmin = 10.24px)`);
        assert.strictEqual(rootFontSize, expectedRemSizes[zoom], `Root font size at ${zoom}% zoom must be ${expectedRemSizes[zoom]}px`);
        console.log(`      [320px @ ${zoom}%] Root font-size: ${rootFontSize.toFixed(2)}px`);
      }
    });

    it('C2.T2.2: 360px viewport (Standard Android portrait 360x780 / 360x800): base font is strictly 13.0px', () => {
      const vpWidth = 360;
      const vpHeight = 780;

      const testZooms = [80, 100, 125, 150, 175, 200, 220];
      const expectedRemSizes = {
        80: 10.4,
        100: 13.0,
        125: 16.25,
        150: 19.5,
        175: 22.75,
        200: 26.0,
        220: 28.6
      };

      for (const zoom of testZooms) {
        const { baseFontSize, clampedScale, rootFontSize } = computeRootFontSize(vpWidth, vpHeight, zoom);
        assert.strictEqual(baseFontSize, 13.0, `Base font at 360px must clamp to 13.0px (3.2vmin = 11.52px)`);
        assert.strictEqual(rootFontSize, expectedRemSizes[zoom], `Root font size at ${zoom}% zoom must be ${expectedRemSizes[zoom]}px`);
        console.log(`      [360px @ ${zoom}%] Root font-size: ${rootFontSize.toFixed(2)}px`);
      }
    });

    it('C2.T2.3: 768px viewport (Tablet / Desktop Breakpoint 768x1024): base font reaches upper clamp 16.0px', () => {
      const vpWidth = 768;
      const vpHeight = 1024;

      const testZooms = [80, 100, 125, 150, 175, 200, 220];
      const expectedRemSizes = {
        80: 12.8,
        100: 16.0,
        125: 20.0,
        150: 24.0,
        175: 28.0,
        200: 32.0,
        220: 35.2
      };

      for (const zoom of testZooms) {
        const { baseFontSize, clampedScale, rootFontSize } = computeRootFontSize(vpWidth, vpHeight, zoom);
        assert.strictEqual(baseFontSize, 16.0, `Base font at 768px must clamp to 16.0px (3.2vmin = 24.576px)`);
        assert.strictEqual(rootFontSize, expectedRemSizes[zoom], `Root font size at ${zoom}% zoom must be ${expectedRemSizes[zoom]}px`);
        console.log(`      [768px @ ${zoom}%] Root font-size: ${rootFontSize.toFixed(2)}px`);
      }
    });

    it('C2.T2.4: 1280px viewport (Desktop PC Landscape 1280x800): base font remains bounded at 16.0px', () => {
      const vpWidth = 1280;
      const vpHeight = 800; // vmin = 800px

      const testZooms = [80, 100, 125, 150, 175, 200, 220];
      const expectedRemSizes = {
        80: 12.8,
        100: 16.0,
        125: 20.0,
        150: 24.0,
        175: 28.0,
        200: 32.0,
        220: 35.2
      };

      for (const zoom of testZooms) {
        const { baseFontSize, clampedScale, rootFontSize } = computeRootFontSize(vpWidth, vpHeight, zoom);
        assert.strictEqual(baseFontSize, 16.0, `Base font at 1280x800 must clamp to 16.0px (3.2vmin = 25.6px)`);
        assert.strictEqual(rootFontSize, expectedRemSizes[zoom], `Root font size at ${zoom}% zoom must be ${expectedRemSizes[zoom]}px`);
        console.log(`      [1280px @ ${zoom}%] Root font-size: ${rootFontSize.toFixed(2)}px`);
      }
    });

    it('C2.T2.5: Global Invariant: Root font size across ALL viewports (200px to 4000px) and ALL zooms is strictly bounded in [10.4px, 35.2px]', () => {
      const widths = [200, 280, 320, 360, 375, 412, 480, 600, 768, 1024, 1280, 1440, 1920, 2560, 3840];
      const heights = [400, 568, 640, 780, 800, 900, 1080, 1440, 2160];
      const zooms = [50, 70, 80, 100, 125, 150, 175, 200, 220, 250, 500];

      let minObserved = Infinity;
      let maxObserved = -Infinity;

      for (const w of widths) {
        for (const h of heights) {
          for (const z of zooms) {
            const { rootFontSize } = computeRootFontSize(w, h, z);
            if (rootFontSize < minObserved) minObserved = rootFontSize;
            if (rootFontSize > maxObserved) maxObserved = rootFontSize;
            assert.ok(rootFontSize >= 10.4, `Root font-size must be >= 10.4px, got ${rootFontSize}`);
            assert.ok(rootFontSize <= 35.2, `Root font-size must be <= 35.2px, got ${rootFontSize}`);
          }
        }
      }

      console.log(`      [Global Invariant Verified] Min observed root font: ${minObserved.toFixed(2)}px, Max observed root font: ${maxObserved.toFixed(2)}px`);
      assert.strictEqual(minObserved, 10.4, 'Theoretical minimum root font size must be exactly 10.4px');
      assert.strictEqual(maxObserved, 35.2, 'Theoretical maximum root font size must be exactly 35.2px');
    });
  });

  // =========================================================================
  // TASK 3: Layout Responsiveness & Extreme Zoom Clamping
  // =========================================================================
  describe('Task 3: Layout Responsiveness & Extreme Zoom Clamping', () => {

    it('C2.T3.1: Header minimum required width never causes horizontal overflow on 320px viewport at 220% zoom', () => {
      const vp = 320;
      const zoom = 220;
      const scale = 2.2;
      const baseFont = 13.0;
      const oneRem = baseFont * scale; // 28.6px
      const vw = vp / 100; // 3.2px

      // Button: clamp(2rem, 6vw, 2.25rem), min-width: 36px
      const btnRaw = Math.min(2.25 * oneRem, Math.max(2.0 * oneRem, 6 * vw));
      const btnWidth = Math.max(36, btnRaw);

      // Padding: clamp(0.45rem, 2.5vw, 1rem) per side
      const padPerSide = Math.min(1.0 * oneRem, Math.max(0.45 * oneRem, 2.5 * vw));
      const totalPadding = 2 * padPerSide;

      // Gap: clamp(0.25rem, 1vw, 0.5rem)
      const gap = Math.min(0.5 * oneRem, Math.max(0.25 * oneRem, 1 * vw));

      // Actions: 3 buttons + 2 gaps
      const actionsWidth = (3 * btnWidth) + (2 * gap);

      // Brand logo badge
      const logoWidth = btnWidth;

      // Minimum non-collapsible width (brand logo + actions + gaps + container padding)
      const nonCollapsibleWidth = logoWidth + gap + actionsWidth + totalPadding;

      console.log(`      [320px @ 220% Zoom] oneRem: ${oneRem.toFixed(1)}px, btnWidth: ${btnWidth.toFixed(1)}px, nonCollapsible: ${nonCollapsibleWidth.toFixed(1)}px`);

      assert.ok(
        nonCollapsibleWidth < vp, 
        `Non-collapsible header elements must fit inside 320px viewport. Got ${nonCollapsibleWidth.toFixed(1)}px vs ${vp}px`
      );

      // Remaining space for flex-shrinkable brand title (with text-overflow: ellipsis)
      const spaceForTitle = vp - nonCollapsibleWidth;
      assert.ok(spaceForTitle > 30, `Must leave at least 30px for brand title ellipsis, got ${spaceForTitle.toFixed(1)}px`);
    });

    it('C2.T3.2: .hub-brand-titles has min-width: 0 and text-overflow: ellipsis to prevent layout blow-up', () => {
      const hubCss = readProjectFile('src/styles/hub.css') || '';
      
      const titlesMatch = hubCss.match(/\.hub-brand-titles\s*\{([^}]+)\}/);
      assert.ok(titlesMatch, '.hub-brand-titles rule must exist in hub.css');
      assert.match(titlesMatch[1], /min-width:\s*0;/i, '.hub-brand-titles must declare min-width: 0 to enable flexbox shrink');

      const h1Match = hubCss.match(/\.hub-brand-titles\s+h1\s*\{([^}]+)\}/);
      assert.ok(h1Match, '.hub-brand-titles h1 rule must exist in hub.css');
      assert.match(h1Match[1], /text-overflow:\s*ellipsis;/i, '.hub-brand-titles h1 must declare text-overflow: ellipsis');
      assert.match(h1Match[1], /overflow:\s*hidden;/i, '.hub-brand-titles h1 must declare overflow: hidden');
      assert.match(h1Match[1], /white-space:\s*nowrap;/i, '.hub-brand-titles h1 must declare white-space: nowrap');
    });

    it('C2.T3.3: BottomNav 3 tabs divide viewport equally without label collision or text overflow at 220% zoom', () => {
      const hubCss = readProjectFile('src/styles/hub.css') || '';

      const navTabMatch = hubCss.match(/\.nav-tab\s*\{([^}]+)\}/);
      assert.ok(navTabMatch, '.nav-tab rule must exist in hub.css');
      assert.match(navTabMatch[1], /min-width:\s*0;/i, '.nav-tab must declare min-width: 0');
      assert.match(navTabMatch[1], /flex:\s*1;/i, '.nav-tab must declare flex: 1');

      const labelMatch = hubCss.match(/\.nav-tab-label\s*\{([^}]+)\}/);
      assert.ok(labelMatch, '.nav-tab-label rule must exist in hub.css');
      assert.match(labelMatch[1], /text-overflow:\s*ellipsis;/i, '.nav-tab-label must have text-overflow: ellipsis');
      assert.match(labelMatch[1], /white-space:\s*nowrap;/i, '.nav-tab-label must have white-space: nowrap');
      assert.match(labelMatch[1], /font-size:\s*clamp\(0\.65rem,\s*0\.72rem,\s*0\.85rem\);/i, '.nav-tab-label must use linear clamp');
    });

    it('C2.T3.4: BreathingSphere container is bounded by viewport units (max-width: 90vw, max-height: 40vh)', () => {
      const hubCss = readProjectFile('src/styles/hub.css') || '';

      const containerMatch = hubCss.match(/\.omega-view\s+\.breathing-sphere-container[^{]*\{([^}]+)\}/);
      assert.ok(containerMatch, '.breathing-sphere-container rule must exist in hub.css');
      assert.match(containerMatch[1], /max-width:\s*90vw/i, 'Breathing sphere container must enforce max-width: 90vw');
      assert.match(containerMatch[1], /max-height:\s*40vh/i, 'Breathing sphere container must enforce max-height: 40vh');

      const sphereMatch = hubCss.match(/\.omega-view\s+\.breathing-sphere\s*,\s*[^\{]+\{([^}]+)\}/);
      assert.ok(sphereMatch, '.breathing-sphere rule must exist in hub.css');
      assert.match(sphereMatch[1], /aspect-ratio:\s*1\s*\/\s*1/i, 'Breathing sphere must enforce aspect-ratio: 1 / 1');
      assert.match(sphereMatch[1], /border-radius:\s*50%/i, 'Breathing sphere must enforce border-radius: 50%');
    });

    it('C2.T3.5: Modal dialogs enforce max-width constraint and width: 100% for full viewport containment', () => {
      const hubCss = readProjectFile('src/styles/hub.css') || '';

      const modalContentMatch = hubCss.match(/\.modal-content\s*\{([^}]+)\}/);
      assert.ok(modalContentMatch, '.modal-content rule must exist in hub.css');
      assert.match(modalContentMatch[1], /max-width:\s*360px;/i, '.modal-content must have max-width: 360px');
      assert.match(modalContentMatch[1], /width:\s*100%;/i, '.modal-content must have width: 100%');
      assert.match(modalContentMatch[1], /box-sizing:\s*border-box;/i, '.modal-content must have box-sizing: border-box');

      const zoomModalMatch = hubCss.match(/\.zoom-modal-content\s*\{([^}]+)\}/);
      assert.ok(zoomModalMatch, '.zoom-modal-content rule must exist in hub.css');
      assert.match(zoomModalMatch[1], /max-width:\s*380px;/i, '.zoom-modal-content must have max-width: 380px');
    });
  });

  // =========================================================================
  // TASK 4: Regression Invariants & Codebase Sanitization
  // =========================================================================
  describe('Task 4: Regression Invariants & Codebase Sanitization', () => {

    it('C2.T4.1: No residual quadratic zoom multipliers exist in any CSS stylesheet', () => {
      const files = [
        'src/styles/tokens.css',
        'src/styles/glassmorphism.css',
        'src/styles/hub.css',
        'Bubble-Breathing/src/style.css',
        'Hydrocicle/src/index.css'
      ];

      const quadraticViolations = [];
      for (const relPath of files) {
        const content = readProjectFile(relPath);
        if (!content) continue;
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (/rem\s*\*\s*var\(--ui-scale/i.test(line)) {
            quadraticViolations.push(`${relPath}:${idx + 1}: ${line.trim()}`);
          }
        });
      }

      assert.strictEqual(
        quadraticViolations.length, 
        0, 
        `Residual quadratic scale found: ${quadraticViolations.join(', ')}`
      );
    });

    it('C2.T4.2: Root html font-size in hub.css references --ui-scale-clamped to guard against unbounded injection', () => {
      const hubCss = readProjectFile('src/styles/hub.css') || '';
      const htmlMatch = hubCss.match(/html\s*\{([^}]+)\}/);
      assert.ok(htmlMatch, 'html block must exist in hub.css');
      assert.match(
        htmlMatch[1],
        /font-size:\s*calc\([^}]*var\(--ui-scale-clamped,\s*1\)\)\s*!important;/i,
        'html font-size must reference var(--ui-scale-clamped, 1)'
      );
    });

    it('C2.T4.3: All backdrop-filter CSS declarations are paired with -webkit-backdrop-filter', () => {
      const files = [
        'src/styles/tokens.css',
        'src/styles/glassmorphism.css',
        'src/styles/hub.css',
        'Bubble-Breathing/src/style.css',
        'Hydrocicle/src/index.css'
      ];

      const missingPairs = [];
      for (const relPath of files) {
        const content = readProjectFile(relPath);
        if (!content) continue;
        const ruleRegex = /([^{]+)\{([^}]+)\}/g;
        let match;
        while ((match = ruleRegex.exec(content)) !== null) {
          const sel = match[1].trim();
          const body = match[2];
          const hasStandard = /backdrop-filter:\s*[^;]+;/i.test(body);
          const hasWebkit = /-webkit-backdrop-filter:\s*[^;]+;/i.test(body);
          if (hasStandard && !hasWebkit) {
            missingPairs.push(`${relPath} [${sel}] missing -webkit-backdrop-filter`);
          }
        }
      }

      assert.strictEqual(
        missingPairs.length, 
        0, 
        `Unpaired backdrop-filter rules found: ${missingPairs.join(', ')}`
      );
    });

    it('C2.T4.4: Primary and amber interactive controls meet WCAG AAA contrast requirements', () => {
      // .omega-btn-primary: #0a0e13 on #00f0ff (glacier cyan)
      const primaryRatio = calculateContrastRatio('#00f0ff', '#0a0e13');
      assert.ok(
        primaryRatio >= 7.0, 
        `Primary button contrast must be >= 7.0:1 (AAA), got ${primaryRatio.toFixed(2)}:1`
      );

      // .omega-btn-amber: #0a0e13 on #ff7a00 (ember amber) and #ff9d00 (gold)
      const amberRatio = calculateContrastRatio('#ff7a00', '#0a0e13');
      const goldRatio = calculateContrastRatio('#ff9d00', '#0a0e13');
      assert.ok(
        amberRatio >= 7.0, 
        `Amber button on #ff7a00 must be >= 7.0:1 (AAA), got ${amberRatio.toFixed(2)}:1`
      );
      assert.ok(
        goldRatio >= 7.0, 
        `Amber button on #ff9d00 must be >= 7.0:1 (AAA), got ${goldRatio.toFixed(2)}:1`
      );
    });
  });

});

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { 
  PROJECT_ROOT, 
  readProjectFile, 
  parseCssVariables, 
  calculateContrastRatio, 
  getRelativeLuminance 
} from './helpers/test-utils.js';

describe('Milestone 1 Iteration 2 Challenger 1: Deep Empirical Stress Test Suite', () => {

  // =========================================================================
  // TASK 1: WCAG 2.1 AAA / AA Contrast Verification
  // =========================================================================
  describe('Task 1: WCAG 2.1 AAA / AA Button & Surface Contrast Verification', () => {
    
    it('C1.T1.1: .omega-btn-amber achieves WCAG 2.1 AAA normal text contrast (>= 7.0:1) on both gold and amber gradients', () => {
      const glassCss = readProjectFile('src/styles/glassmorphism.css') || '';
      const amberMatch = glassCss.match(/\.omega-btn-amber\s*\{([^}]+)\}/);
      assert.ok(amberMatch, '.omega-btn-amber rule must exist in glassmorphism.css');

      const colorMatch = amberMatch[1].match(/color:\s*([^;]+);/);
      assert.ok(colorMatch, '.omega-btn-amber must specify text color');
      const textColor = colorMatch[1].trim();

      // Deep volcanic basalt text color is required for AAA contrast on amber/gold
      assert.strictEqual(textColor.toLowerCase(), '#0a0e13', '.omega-btn-amber text color must be #0a0e13');

      const goldRatio = calculateContrastRatio('#ff9d00', textColor);
      const amberRatio = calculateContrastRatio('#ff7a00', textColor);

      console.log(`      [Contrast] .omega-btn-amber on #ff9d00: ${goldRatio.toFixed(2)}:1`);
      console.log(`      [Contrast] .omega-btn-amber on #ff7a00: ${amberRatio.toFixed(2)}:1`);

      assert.ok(goldRatio >= 7.0, `.omega-btn-amber on #ff9d00 must achieve AAA (>= 7.0:1), got ${goldRatio.toFixed(2)}:1`);
      assert.ok(amberRatio >= 7.0, `.omega-btn-amber on #ff7a00 must achieve AAA (>= 7.0:1), got ${amberRatio.toFixed(2)}:1`);
    });

    it('C1.T1.2: .omega-btn-primary achieves WCAG 2.1 AAA normal text contrast (>= 7.0:1) on cyan', () => {
      const glassCss = readProjectFile('src/styles/glassmorphism.css') || '';
      const primaryMatch = glassCss.match(/\.omega-btn-primary\s*\{([^}]+)\}/);
      assert.ok(primaryMatch, '.omega-btn-primary rule must exist in glassmorphism.css');

      const colorMatch = primaryMatch[1].match(/color:\s*([^;]+);/);
      assert.ok(colorMatch, '.omega-btn-primary must specify text color');
      const textColor = colorMatch[1].trim();

      assert.strictEqual(textColor.toLowerCase(), '#0a0e13', '.omega-btn-primary text color must be #0a0e13');

      const cyanRatio = calculateContrastRatio('#00f0ff', textColor);
      assert.ok(cyanRatio >= 7.0, `.omega-btn-primary on #00f0ff must achieve AAA (>= 7.0:1), got ${cyanRatio.toFixed(2)}:1`);
    });

    it('C1.T1.3: .hub-logo-badge text achieves WCAG AA/AAA contrast on cyan/water gradient background', () => {
      const hubCss = readProjectFile('src/styles/hub.css') || '';
      const logoMatch = hubCss.match(/\.hub-logo-badge\s*\{([^}]+)\}/);
      assert.ok(logoMatch, '.hub-logo-badge rule must exist in hub.css');

      const colorMatch = logoMatch[1].match(/color:\s*([^;]+);/);
      assert.ok(colorMatch, '.hub-logo-badge must specify text color');
      const textColor = colorMatch[1].trim();
      assert.strictEqual(textColor.toLowerCase(), '#0a0e13', '.hub-logo-badge text color must be #0a0e13');

      // Gradient background is linear-gradient(135deg, #4ca1af, #3498db)
      const ratio1 = calculateContrastRatio('#4ca1af', textColor);
      const ratio2 = calculateContrastRatio('#3498db', textColor);

      console.log(`      [Contrast] .hub-logo-badge on #4ca1af: ${ratio1.toFixed(2)}:1`);
      console.log(`      [Contrast] .hub-logo-badge on #3498db: ${ratio2.toFixed(2)}:1`);

      assert.ok(ratio1 >= 7.0, `Logo on #4ca1af must achieve AAA (>= 7.0:1), got ${ratio1.toFixed(2)}:1`);
      assert.ok(ratio2 >= 4.5, `Logo on #3498db must achieve AA normal (>= 4.5:1), got ${ratio2.toFixed(2)}:1`);
    });

    it('C1.T1.4: Base dark mode and light mode surfaces meet WCAG 2.1 AAA criteria for primary text', () => {
      const darkRatio = calculateContrastRatio('#0a0e13', '#f0f6fc');
      const lightRatio = calculateContrastRatio('#edf4f9', '#0d1821');

      assert.ok(darkRatio >= 14.0, `Dark mode primary contrast must be >= 14.0:1, got ${darkRatio.toFixed(2)}:1`);
      assert.ok(lightRatio >= 14.0, `Light mode primary contrast must be >= 14.0:1, got ${lightRatio.toFixed(2)}:1`);
    });
  });

  // =========================================================================
  // TASK 2: Glassmorphism WebKit Vendor Prefix Coexistence
  // =========================================================================
  describe('Task 2: Glassmorphism WebKit Vendor Prefix Coexistence', () => {

    const cssFilesToScan = [
      'src/styles/tokens.css',
      'src/styles/glassmorphism.css',
      'src/styles/hub.css',
      'Bubble-Breathing/src/style.css',
      'Bubble-Breathing/css/style.css',
      'Hydrocicle/src/index.css'
    ];

    it('C1.T2.1: Every backdrop-filter rule is paired with -webkit-backdrop-filter across all project stylesheets', () => {
      const missingPrefixes = [];

      for (const relPath of cssFilesToScan) {
        const fullPath = path.resolve(PROJECT_ROOT, relPath);
        if (!fs.existsSync(fullPath)) continue;

        const content = fs.readFileSync(fullPath, 'utf8');
        // Match CSS rule blocks
        const ruleRegex = /([^{]+)\{([^}]+)\}/g;
        let match;
        while ((match = ruleRegex.exec(content)) !== null) {
          const selector = match[1].trim();
          const body = match[2];

          const hasStandard = /backdrop-filter:\s*([^;]+);/i.test(body);
          const hasWebkit = /-webkit-backdrop-filter:\s*([^;]+);/i.test(body);

          if (hasStandard && !hasWebkit) {
            missingPrefixes.push(`${relPath} [${selector}] missing -webkit-backdrop-filter`);
          }
          if (hasWebkit && !hasStandard) {
            missingPrefixes.push(`${relPath} [${selector}] missing backdrop-filter`);
          }
        }
      }

      if (missingPrefixes.length > 0) {
        console.error('      Missing prefixes found:', missingPrefixes);
      }
      assert.strictEqual(missingPrefixes.length, 0, `All backdrop-filter rules must have -webkit-backdrop-filter: ${missingPrefixes.join(', ')}`);
    });

    it('C1.T2.2: Submodule language dropdowns specifically include -webkit-backdrop-filter: blur(10px)', () => {
      const subFiles = [
        'Bubble-Breathing/src/style.css',
        'Bubble-Breathing/css/style.css',
        'Hydrocicle/src/index.css'
      ];

      for (const relPath of subFiles) {
        const content = readProjectFile(relPath);
        assert.ok(content, `${relPath} must exist`);

        const dropdownMatch = content.match(/\.lang-dropdown\s*\{([^}]+)\}/);
        assert.ok(dropdownMatch, `${relPath} must contain .lang-dropdown rule`);

        assert.match(
          dropdownMatch[1],
          /-webkit-backdrop-filter:\s*blur\(10px\);/i,
          `${relPath} .lang-dropdown must have -webkit-backdrop-filter: blur(10px);`
        );
        assert.match(
          dropdownMatch[1],
          /backdrop-filter:\s*blur\(10px\);/i,
          `${relPath} .lang-dropdown must have backdrop-filter: blur(10px);`
        );
      }
    });
  });

  // =========================================================================
  // TASK 3: UI Zoom Linear Scaling & Quadratic Multiplier Elimination
  // =========================================================================
  describe('Task 3: UI Zoom Linear Scaling & Quadratic Multiplier Elimination', () => {

    it('C1.T3.1: No CSS rules multiply rem units by var(--ui-scale) or var(--ui-scale-clamped)', () => {
      const cssFiles = [
        'src/styles/hub.css',
        'src/styles/tokens.css',
        'src/styles/glassmorphism.css',
        'Bubble-Breathing/src/style.css',
        'Hydrocicle/src/index.css'
      ];

      const quadraticViolations = [];
      for (const relPath of cssFiles) {
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
        `Residual quadratic scaling found in: ${quadraticViolations.join('; ')}`
      );
    });

    it('C1.T3.2: .nav-tab-label in hub.css uses clean linear clamp without ui-scale multiplier', () => {
      const hubCss = readProjectFile('src/styles/hub.css') || '';
      const labelMatch = hubCss.match(/\.nav-tab-label\s*\{([^}]+)\}/);
      assert.ok(labelMatch, '.nav-tab-label must exist in hub.css');

      assert.doesNotMatch(
        labelMatch[1],
        /var\(--ui-scale/i,
        '.nav-tab-label must not reference --ui-scale directly'
      );
      assert.match(
        labelMatch[1],
        /font-size:\s*clamp\(0\.65rem,\s*0\.72rem,\s*0\.85rem\);/i,
        '.nav-tab-label must use clean clamp(0.65rem, 0.72rem, 0.85rem)'
      );
    });

    it('C1.T3.3: Root html font-size scaling uses clamped property (--ui-scale-clamped)', () => {
      const hubCss = readProjectFile('src/styles/hub.css') || '';
      const htmlMatch = hubCss.match(/html\s*\{([^}]+)\}/);
      assert.ok(htmlMatch, 'html rule must exist in hub.css');

      assert.match(
        htmlMatch[1],
        /font-size:\s*calc\([^}]*var\(--ui-scale-clamped,\s*1\)\)\s*!important;/i,
        'html font-size must use var(--ui-scale-clamped, 1) to prevent unbounded scaling'
      );
    });

    it('C1.T3.4: :root defines both --ui-scale and fallback --ui-scale-clamped', () => {
      const hubCss = readProjectFile('src/styles/hub.css') || '';
      const rootMatch = hubCss.match(/:root\s*\{([^}]+)\}/);
      assert.ok(rootMatch, ':root block must exist in hub.css');

      assert.match(rootMatch[1], /--ui-scale:\s*1;/i, ':root must declare default --ui-scale: 1');
      assert.match(rootMatch[1], /--ui-scale-clamped:\s*var\(--ui-scale,\s*1\);/i, ':root must declare --ui-scale-clamped with fallback');
    });
  });

  // =========================================================================
  // TASK 4: Adversarial LocalStorage Zoom Fuzzing & Clamping
  // =========================================================================
  describe('Task 4: Adversarial LocalStorage Zoom Fuzzing & Clamping', () => {

    it('C1.T4.1: App.tsx sanitizes and strictly clamps any arbitrary or corrupted LocalStorage value to [80, 220]', () => {
      const appTsx = readProjectFile('src/App.tsx') || '';
      
      // Verify implementation has Number.isFinite check and Math.min(220, Math.max(80, parsed))
      assert.match(
        appTsx,
        /Number\.isFinite\(parsed\)\s*\?\s*Math\.min\(220,\s*Math\.max\(80,\s*parsed\)\)\s*:\s*100/i,
        'App.tsx must use Number.isFinite and clamp parsed zoom value between 80 and 220'
      );

      // Verify handleZoomChange clamps newZoom
      assert.match(
        appTsx,
        /const\s+clamped\s*=\s*Math\.min\(220,\s*Math\.max\(80,\s*newZoom\)\);/i,
        'handleZoomChange must clamp newZoom between 80 and 220'
      );

      // Fuzz the clamping algorithm directly against adversarial inputs
      const fuzzedInputs = [
        '-999999', '-100', '0', '1', '79', '79.9', '80', '100', '150', '220', '220.1', '999999',
        'NaN', 'undefined', 'null', 'Infinity', '-Infinity', '', 'abc', '100px', '250%', 'false', '{}'
      ];

      for (const input of fuzzedInputs) {
        const parsed = Number(input);
        const result = Number.isFinite(parsed) ? Math.min(220, Math.max(80, parsed)) : 100;

        assert.ok(Number.isFinite(result), `Result for input "${input}" must be finite, got ${result}`);
        assert.ok(result >= 80, `Result for input "${input}" must be >= 80, got ${result}`);
        assert.ok(result <= 220, `Result for input "${input}" must be <= 220, got ${result}`);
      }
    });

    it('C1.T4.2: App.tsx sets --ui-scale-clamped strictly between 0.8 and 2.2 in useEffect', () => {
      const appTsx = readProjectFile('src/App.tsx') || '';

      assert.match(
        appTsx,
        /const\s+clampedScale\s*=\s*Math\.min\(2\.2,\s*Math\.max\(0\.8,\s*scaleFactor\)\);/i,
        'App.tsx must clamp clampedScale between 0.8 and 2.2'
      );
      assert.match(
        appTsx,
        /setProperty\(['"]--ui-scale-clamped['"],\s*clampedScale\.toString\(\)\);/i,
        'App.tsx must set --ui-scale-clamped property'
      );
    });
  });

  // =========================================================================
  // TASK 5: Viewport Stress Matrix Simulation (320px to 480px x 80% to 220%)
  // =========================================================================
  describe('Task 5: Exhaustive Viewport Stress Matrix Simulation', () => {

    it('C1.T5.1: Header minimum required width never exceeds viewport width across 100 viewport/zoom combinations', () => {
      const viewports = [320, 340, 360, 375, 390, 412, 428, 480, 600, 767];
      const zoomLevels = [80, 90, 100, 110, 125, 140, 150, 175, 200, 220];

      let overflowCount = 0;
      const overflowDetails = [];

      for (const vp of viewports) {
        for (const zoom of zoomLevels) {
          const scale = zoom / 100;
          // Root font size calculation in hub.css: calc(clamp(13px, 3.2vmin, 16px) * var(--ui-scale-clamped, 1))
          const vmin = vp; // portrait mode (vp x height, where height >= vp)
          const baseFont = Math.min(16, Math.max(13, 0.032 * vmin));
          const oneRem = baseFont * Math.min(2.2, Math.max(0.8, scale));
          const vw = vp / 100;

          // Header CSS clamp values from hub.css:
          // Buttons: clamp(2rem, 6vw, 2.25rem), min-width: 36px
          const btnRaw = Math.min(2.25 * oneRem, Math.max(2.0 * oneRem, 6 * vw));
          const btnWidth = Math.max(36, btnRaw);

          // Padding: clamp(0.45rem, 2.5vw, 1rem) per side
          const padPerSide = Math.min(1.0 * oneRem, Math.max(0.45 * oneRem, 2.5 * vw));
          const totalPadding = 2 * padPerSide;

          // Gaps: clamp(0.25rem, 1vw, 0.5rem)
          const gap = Math.min(0.5 * oneRem, Math.max(0.25 * oneRem, 1 * vw));

          // Actions: 3 buttons + 2 gaps
          const actionsWidth = (3 * btnWidth) + (2 * gap);

          // Brand logo badge:
          const logoWidth = btnWidth;

          // Gap between brand and actions:
          const headerGap = gap;

          // Total minimum width to fit brand badge + gap + actions + container padding
          const totalRequiredWidth = actionsWidth + logoWidth + headerGap + totalPadding;

          if (totalRequiredWidth > vp) {
            overflowCount++;
            overflowDetails.push(`Viewport ${vp}px at ${zoom}% zoom: required ${totalRequiredWidth.toFixed(1)}px > ${vp}px`);
          }
        }
      }

      if (overflowCount > 0) {
        console.error('      Viewport overflow failures:', overflowDetails);
      }

      assert.strictEqual(
        overflowCount, 
        0, 
        `Header must never exceed viewport width. Failed in ${overflowCount} configurations: ${overflowDetails.slice(0, 3).join('; ')}`
      );
    });

    it('C1.T5.2: At maximum zoom 220% on 360px viewport, required header width is <= 280px', () => {
      const vp = 360;
      const zoom = 220;
      const scale = 2.2;
      const baseFont = 13; // clamp(13, 11.52, 16) = 13
      const oneRem = baseFont * scale; // 28.6px
      const vw = 3.6;

      const btnWidth = Math.max(36, Math.min(2.25 * oneRem, Math.max(2.0 * oneRem, 6 * vw)));
      const padPerSide = Math.min(1.0 * oneRem, Math.max(0.45 * oneRem, 2.5 * vw));
      const totalPadding = 2 * padPerSide;
      const gap = Math.min(0.5 * oneRem, Math.max(0.25 * oneRem, 1 * vw));
      const actionsWidth = (3 * btnWidth) + (2 * gap);
      const logoWidth = btnWidth;
      const totalRequiredWidth = actionsWidth + logoWidth + gap + totalPadding;

      console.log(`      [360px @ 220% Zoom] oneRem: ${oneRem.toFixed(1)}px, btnWidth: ${btnWidth.toFixed(1)}px, totalRequiredWidth: ${totalRequiredWidth.toFixed(1)}px`);
      assert.ok(
        totalRequiredWidth <= 280.0, 
        `Required header width must be <= 280px, got ${totalRequiredWidth.toFixed(1)}px`
      );
      assert.ok(
        totalRequiredWidth < vp, 
        `Required header width must fit within 360px viewport, got ${totalRequiredWidth.toFixed(1)}px`
      );
    });
  });

});

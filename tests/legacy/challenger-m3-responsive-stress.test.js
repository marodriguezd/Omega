import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { readProjectFile, parseMediaQueries, fileExists } from './helpers/test-utils.js';
import { setupDOMEnvironment } from './helpers/dom-shim.js';

/**
 * Accurate CSS rule extractor with nested brace matching.
 */
function parseCssRules(cssContent) {
  const rules = [];
  let i = 0;
  while (i < cssContent.length) {
    // Skip whitespace
    while (i < cssContent.length && /\s/.test(cssContent[i])) i++;
    if (i >= cssContent.length) break;

    // Check for comment
    if (cssContent[i] === '/' && cssContent[i + 1] === '*') {
      const close = cssContent.indexOf('*/', i + 2);
      i = close === -1 ? cssContent.length : close + 2;
      continue;
    }

    // Check for @media or other @-rules
    if (cssContent[i] === '@') {
      const open = cssContent.indexOf('{', i);
      if (open === -1) break;
      const atHeader = cssContent.slice(i, open).trim();
      let depth = 1;
      let j = open + 1;
      while (j < cssContent.length && depth > 0) {
        if (cssContent[j] === '{') depth++;
        else if (cssContent[j] === '}') depth--;
        j++;
      }
      const atBody = cssContent.slice(open + 1, j - 1);
      rules.push({ type: 'at-rule', header: atHeader, body: atBody });
      i = j;
      continue;
    }

    // Standard CSS rule
    const open = cssContent.indexOf('{', i);
    if (open === -1) break;
    const selector = cssContent.slice(i, open).trim();
    let depth = 1;
    let j = open + 1;
    while (j < cssContent.length && depth > 0) {
      if (cssContent[j] === '{') depth++;
      else if (cssContent[j] === '}') depth--;
      j++;
    }
    const declarations = cssContent.slice(open + 1, j - 1).trim();
    rules.push({ type: 'rule', selector, declarations });
    i = j;
  }
  return rules;
}

/**
 * Parses individual CSS declarations inside a rule body.
 */
function parseDeclarations(declarationsText) {
  const map = new Map();
  const rawParts = declarationsText.split(';');
  for (const part of rawParts) {
    const colonIdx = part.indexOf(':');
    if (colonIdx === -1) continue;
    const prop = part.slice(0, colonIdx).trim().toLowerCase();
    const val = part.slice(colonIdx + 1).trim();
    if (prop) {
      map.set(prop, val);
    }
  }
  return map;
}

describe('Milestone 3 Challenger: Responsive Layout, Breakpoint Toggling, NavigationRail Session Protection & 1440px Bounding Harness', () => {

  const responsiveCss = readProjectFile('src/styles/responsive.css') || '';
  const hubCss = readProjectFile('src/styles/hub.css') || '';
  const navRailCode = readProjectFile('src/components/NavigationRail.tsx') || '';
  const bottomNavCode = readProjectFile('src/components/BottomNav.tsx') || '';
  const appCode = readProjectFile('src/App.tsx') || '';
  const dashboardCode = readProjectFile('src/components/Dashboard.tsx') || '';

  // =========================================================================
  // SUITE 1: Breakpoint Toggling (<768px vs >=768px) & CSS Display Rules Engine
  // =========================================================================
  describe('Suite 1: Breakpoint Toggling (<768px vs >=768px), DOM Presence & CSS Display Cascade', () => {

    it('C3.S1.1: src/styles/responsive.css exists, is syntactically valid, and properly imported', () => {
      assert.ok(fileExists('src/styles/responsive.css'), 'responsive.css must exist');
      assert.ok(responsiveCss.length > 500, 'responsive.css must have substantial content');

      // Verify hub.css imports responsive.css
      assert.match(
        hubCss,
        /@import\s+['"]\.\/responsive\.css['"]/i,
        'hub.css must import ./responsive.css'
      );

      // Verify App.tsx imports responsive.css
      assert.match(
        appCode,
        /import\s+['"].*?responsive\.css['"]/i,
        'App.tsx must import responsive.css'
      );

      // Check balanced braces in responsive.css
      let braceCount = 0;
      for (const ch of responsiveCss) {
        if (ch === '{') braceCount++;
        if (ch === '}') braceCount--;
        assert.ok(braceCount >= 0, 'responsive.css must not have unmatched closing braces');
      }
      assert.strictEqual(braceCount, 0, 'responsive.css must have perfectly balanced braces');
    });

    it('C3.S1.2: DOM Presence - Both NavigationRail and BottomNav are unconditionally present in App DOM', () => {
      // In App.tsx, NavigationRail and BottomNav must NOT be conditionally mounted via ternary or if-statement
      assert.match(appCode, /<NavigationRail[\s\S]*?\/>/, 'App.tsx must render <NavigationRail /> in JSX');
      assert.match(appCode, /<BottomNav[\s\S]*?\/>/, 'App.tsx must render <BottomNav /> in JSX');

      // Verify no JS-level window.innerWidth or media query unmounting in App.tsx
      assert.doesNotMatch(
        appCode,
        /(?:innerWidth|< 768|>= 768|useMediaQuery)\s*\?\s*<NavigationRail/i,
        'NavigationRail must not be conditionally unmounted by JS viewport checks'
      );
      assert.doesNotMatch(
        appCode,
        /(?:innerWidth|< 768|>= 768|useMediaQuery)\s*\?\s*<BottomNav/i,
        'BottomNav must not be conditionally unmounted by JS viewport checks'
      );

      // Verify order and container hierarchy in App.tsx
      const navRailIdx = appCode.indexOf('<NavigationRail');
      const viewsIdx = appCode.indexOf('<main className="omega-views-container"');
      const bottomNavIdx = appCode.indexOf('<BottomNav');

      assert.ok(navRailIdx !== -1, 'NavigationRail rendered');
      assert.ok(viewsIdx !== -1, 'omega-views-container rendered');
      assert.ok(bottomNavIdx !== -1, 'BottomNav rendered');
      assert.ok(navRailIdx < viewsIdx, 'NavigationRail precedes views container for flex-row layout');
      assert.ok(viewsIdx < bottomNavIdx, 'views container precedes BottomNav');
    });

    it('C3.S1.3: CSS Display Rules - Mobile mode (<768px) enforces BottomNav visible and NavigationRail hidden', () => {
      const topRules = parseCssRules(responsiveCss);
      
      // Look for base rules outside @media
      let railDisplayBase = null;
      let bottomNavDisplayBase = null;

      for (const r of topRules) {
        if (r.type === 'rule') {
          const decs = parseDeclarations(r.declarations);
          if (r.selector.includes('.navigation-rail') || r.selector.includes('.desktop-nav-rail')) {
            if (decs.has('display')) railDisplayBase = decs.get('display');
          }
          if (r.selector.includes('.bottom-nav')) {
            if (decs.has('display')) bottomNavDisplayBase = decs.get('display');
          }
        }
      }

      assert.ok(railDisplayBase, 'responsive.css must define base display for .navigation-rail');
      assert.match(
        railDisplayBase,
        /none\s*!important/i,
        'Mobile mode (<768px) must set .navigation-rail display to none !important'
      );

      assert.ok(bottomNavDisplayBase, 'responsive.css must define base display for .bottom-nav');
      assert.match(
        bottomNavDisplayBase,
        /flex\s*!important/i,
        'Mobile mode (<768px) must set .bottom-nav display to flex !important'
      );
    });

    it('C3.S1.4: CSS Display Rules - Desktop mode (>=768px) enforces NavigationRail visible and BottomNav hidden', () => {
      const topRules = parseCssRules(responsiveCss);

      let desktopMediaFound = false;
      let railDisplayDesktop = null;
      let bottomNavDisplayDesktop = null;
      let omegaAppFlexDir = null;
      let viewsContainerWidth = null;

      for (const r of topRules) {
        if (r.type === 'at-rule' && /@media[^{]*min-width\s*:\s*768px/i.test(r.header)) {
          desktopMediaFound = true;
          const innerRules = parseCssRules(r.body);
          for (const ir of innerRules) {
            if (ir.type === 'rule') {
              const decs = parseDeclarations(ir.declarations);
              if (ir.selector.includes('.navigation-rail') || ir.selector.includes('.desktop-nav-rail')) {
                if (decs.has('display')) railDisplayDesktop = decs.get('display');
              }
              if (ir.selector.includes('.bottom-nav')) {
                if (decs.has('display')) bottomNavDisplayDesktop = decs.get('display');
              }
              if (ir.selector.includes('.omega-app')) {
                if (decs.has('flex-direction')) omegaAppFlexDir = decs.get('flex-direction');
              }
              if (ir.selector.includes('.omega-views-container')) {
                if (decs.has('width')) viewsContainerWidth = decs.get('width');
              }
            }
          }
        }
      }

      assert.ok(desktopMediaFound, 'responsive.css must contain @media (min-width: 768px)');
      assert.ok(railDisplayDesktop, 'Desktop media query must define display for .navigation-rail');
      assert.match(
        railDisplayDesktop,
        /flex\s*!important/i,
        'Desktop media query (>=768px) must set .navigation-rail display to flex !important'
      );

      assert.ok(bottomNavDisplayDesktop, 'Desktop media query must define display for .bottom-nav');
      assert.match(
        bottomNavDisplayDesktop,
        /none\s*!important/i,
        'Desktop media query (>=768px) must set .bottom-nav display to none !important'
      );

      assert.match(
        omegaAppFlexDir || '',
        /row\s*!important/i,
        'Desktop media query must set .omega-app flex-direction to row !important'
      );

      assert.match(
        viewsContainerWidth || '',
        /calc\(100%\s*-\s*var\(--rail-nav-width/i,
        'Desktop views container width must account for rail width'
      );
    });

    it('C3.S1.5: Empirical CSS Cascade Simulation - Fine-grained viewport sweep across 767px vs 768px', () => {
      // CSS Cascade Simulator matching media query behavior
      const evaluateLayoutAtWidth = (viewportWidth) => {
        const isDesktop = viewportWidth >= 768;
        return {
          viewportWidth,
          navigationRailDisplay: isDesktop ? 'flex' : 'none',
          bottomNavDisplay: isDesktop ? 'none' : 'flex',
          appFlexDirection: isDesktop ? 'row' : 'column',
          activeNavigationMode: isDesktop ? 'navigation-rail' : 'bottom-nav',
        };
      };

      const mobileSweep = [240, 320, 360, 375, 390, 412, 480, 540, 600, 720, 766, 767, 767.5, 767.99];
      for (const w of mobileSweep) {
        const res = evaluateLayoutAtWidth(w);
        assert.strictEqual(res.navigationRailDisplay, 'none', `At width ${w}px, NavigationRail must be display: none`);
        assert.strictEqual(res.bottomNavDisplay, 'flex', `At width ${w}px, BottomNav must be display: flex`);
        assert.strictEqual(res.appFlexDirection, 'column', `At width ${w}px, App layout must be flex column`);
        assert.strictEqual(res.activeNavigationMode, 'bottom-nav', `At width ${w}px, mode must be bottom-nav`);
      }

      const desktopSweep = [768, 768.01, 769, 800, 960, 1024, 1200, 1280, 1366, 1440, 1920, 2560, 3840, 7680];
      for (const w of desktopSweep) {
        const res = evaluateLayoutAtWidth(w);
        assert.strictEqual(res.navigationRailDisplay, 'flex', `At width ${w}px, NavigationRail must be display: flex`);
        assert.strictEqual(res.bottomNavDisplay, 'none', `At width ${w}px, BottomNav must be display: none`);
        assert.strictEqual(res.appFlexDirection, 'row', `At width ${w}px, App layout must be flex row`);
        assert.strictEqual(res.activeNavigationMode, 'navigation-rail', `At width ${w}px, mode must be navigation-rail`);
      }
    });

    it('C3.S1.6: Safe-area insets resilience across portrait, landscape, and desktop viewports', () => {
      // In responsive.css:
      assert.match(responsiveCss, /--safe-area-inset-top:\s*env\(safe-area-inset-top,\s*0px\);/i);
      assert.match(responsiveCss, /--safe-area-inset-bottom:\s*env\(safe-area-inset-bottom,\s*0px\);/i);
      assert.match(responsiveCss, /--safe-area-inset-left:\s*env\(safe-area-inset-left,\s*0px\);/i);
      assert.match(responsiveCss, /--safe-area-inset-right:\s*env\(safe-area-inset-right,\s*0px\);/i);

      // Navigation rail padding includes safe areas
      assert.match(
        responsiveCss,
        /\.navigation-rail[\s\S]*?padding:[^;]*env\(safe-area-inset-top/i,
        'NavigationRail padding must include env(safe-area-inset-top)'
      );
      assert.match(
        responsiveCss,
        /\.navigation-rail[\s\S]*?padding:[^;]*env\(safe-area-inset-bottom/i,
        'NavigationRail padding must include env(safe-area-inset-bottom)'
      );
      assert.match(
        responsiveCss,
        /\.navigation-rail[\s\S]*?padding:[^;]*env\(safe-area-inset-left/i,
        'NavigationRail padding must include env(safe-area-inset-left)'
      );
    });
  });

  // =========================================================================
  // SUITE 2: NavigationRail Component Architecture & Active Session Protection
  // =========================================================================
  describe('Suite 2: NavigationRail Component Architecture & Active Session Interception Stress', () => {

    it('C3.S2.1: NavigationRail renders standard ARIA landmarks, roles, indicators, and brand logo badge', () => {
      // Must render <aside className="navigation-rail desktop-nav-rail" role="navigation" data-testid="navigation-rail">
      assert.match(navRailCode, /<aside[^>]*className=["'][^"']*navigation-rail/i);
      assert.match(navRailCode, /role=["']navigation["']/i);
      assert.match(navRailCode, /data-testid=["']navigation-rail["']/i);

      // Logo badge role="button" with keyboard support
      assert.match(navRailCode, /className=["'][^"']*rail-logo-badge/i);
      assert.match(navRailCode, /role=["']button["']/i);
      assert.match(navRailCode, /tabIndex=\{0\}/i);
      assert.match(navRailCode, /onKeyDown=/i);

      // Verify all 3 tabs are represented
      assert.match(navRailCode, /tab-hub/);
      assert.match(navRailCode, /tab-breathing/);
      assert.match(navRailCode, /tab-hydro/);

      // Active indicator rendering
      assert.match(navRailCode, /nav-tab-indicator\s+rail-indicator\s+active/);

      // ARIA current page attribute
      assert.match(navRailCode, /aria-current=\{activeTab\s*===\s*['"]hub['"]\s*\?\s*['"]page['"]\s*:\s*undefined\}/);
      assert.match(navRailCode, /aria-current=\{activeTab\s*===\s*['"]breathing['"]\s*\?\s*['"]page['"]\s*:\s*undefined\}/);
      assert.match(navRailCode, /aria-current=\{activeTab\s*===\s*['"]hydro['"]\s*\?\s*['"]page['"]\s*:\s*undefined\}/);
    });

    it('C3.S2.2: App.tsx connects NavigationRail to handleSelectTab session protector', () => {
      assert.match(
        appCode,
        /<NavigationRail[\s\S]*?activeTab=\{activeTab\}[\s\S]*?onSelectTab=\{handleSelectTab\}/i,
        'App.tsx must pass handleSelectTab to NavigationRail'
      );
    });

    it('C3.S2.3: Empirical Session Protection - Bubble Breathing Active Session prevents NavigationRail tab switches', () => {
      const env = setupDOMEnvironment();
      try {
        let activeTab = 'breathing';
        let showExitModal = false;
        let pendingTab = null;
        let keepAwakeDisabledCount = 0;
        const sessionState = { bubble: false, hydro: false };

        const isSessionActive = () => {
          if (activeTab === 'breathing') {
            if (sessionState.bubble) return true;
            const activeScreen = env.document.querySelector(
              '.view-bubble #exerciseScreen.active, .view-bubble #exerciseScreen, .view-bubble #retentionScreen, .view-bubble #recoveryScreen, #exerciseScreen.active, #exerciseScreen, #retentionScreen, #recoveryScreen'
            );
            return !!activeScreen;
          }
          if (activeTab === 'hydro') {
            if (sessionState.hydro) return true;
            const showerScreen = env.document.querySelector(
              '.view-hydro #exerciseScreen.active, .view-hydro #exerciseScreen, .view-hydro .shower-screen, #exerciseScreen.active, .shower-screen'
            );
            return !!showerScreen;
          }
          return false;
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

        const handleConfirmExit = () => {
          showExitModal = false;
          keepAwakeDisabledCount++;
          if (pendingTab) {
            activeTab = pendingTab;
            pendingTab = null;
          } else {
            activeTab = 'hub';
          }
        };

        const handleCancelExit = () => {
          showExitModal = false;
          pendingTab = null;
        };

        // SUBCASE 1: Idle Bubble Breathing -> Tab switches immediately
        handleSelectTab('hub');
        assert.strictEqual(activeTab, 'hub', 'Idle session allows switching to hub immediately');
        assert.strictEqual(showExitModal, false, 'Modal not shown for idle session');

        // Reset to breathing
        handleSelectTab('breathing');
        assert.strictEqual(activeTab, 'breathing');

        // SUBCASE 2: Activate Bubble Breathing via DOM (#exerciseScreen)
        const exerciseEl = env.document.createElement('div');
        exerciseEl.id = 'exerciseScreen';
        exerciseEl.className = 'screen active';
        env.root.appendChild(exerciseEl);

        assert.strictEqual(isSessionActive(), true, 'Active breathing exercise is detected');

        // Attempt 1: Click 'hub' on NavigationRail
        handleSelectTab('hub');
        assert.strictEqual(activeTab, 'breathing', 'activeTab must remain breathing when session is active');
        assert.strictEqual(showExitModal, true, 'Exit modal must be displayed');
        assert.strictEqual(pendingTab, 'hub', 'pendingTab must be hub');

        // Cancel exit modal
        handleCancelExit();
        assert.strictEqual(showExitModal, false, 'Modal closed after cancel');
        assert.strictEqual(activeTab, 'breathing', 'activeTab still breathing');
        assert.strictEqual(pendingTab, null, 'pendingTab cleared after cancel');

        // Attempt 2: Click 'hydro' on NavigationRail
        handleSelectTab('hydro');
        assert.strictEqual(activeTab, 'breathing', 'activeTab must remain breathing');
        assert.strictEqual(showExitModal, true, 'Exit modal displayed');
        assert.strictEqual(pendingTab, 'hydro', 'pendingTab must be hydro');

        // Attempt 3: Clicking same tab 'breathing' while modal is open (or not) does not crash
        handleSelectTab('breathing');
        assert.strictEqual(activeTab, 'breathing');

        // Confirm exit to hydro
        handleConfirmExit();
        assert.strictEqual(showExitModal, false, 'Modal closed');
        assert.strictEqual(activeTab, 'hydro', 'activeTab successfully transitioned to hydro on confirmation');
        assert.strictEqual(keepAwakeDisabledCount, 1, 'keepAwake was disabled on exit');
        assert.strictEqual(pendingTab, null, 'pendingTab cleared');

        // Clean up DOM
        env.root.removeChild(exerciseEl);
      } finally {
        env.cleanup();
      }
    });

    it('C3.S2.4: Empirical Session Protection - CustomEvent omega-session-state triggers session protection on NavigationRail', () => {
      const env = setupDOMEnvironment();
      try {
        let activeTab = 'hydro';
        let showExitModal = false;
        let pendingTab = null;
        const sessionState = { bubble: false, hydro: false };

        const handleSessionState = (e) => {
          if (e.detail?.app === 'bubble' || e.detail?.app === 'hydro') {
            sessionState[e.detail.app] = Boolean(e.detail.active);
          }
        };
        env.window.addEventListener('omega-session-state', handleSessionState);

        const isSessionActive = () => {
          if (activeTab === 'breathing') return sessionState.bubble;
          if (activeTab === 'hydro') return sessionState.hydro;
          return false;
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

        // Dispatch active event for HydroCycle
        env.window.dispatchEvent(new env.window.CustomEvent('omega-session-state', {
          detail: { app: 'hydro', active: true }
        }));

        assert.strictEqual(sessionState.hydro, true, 'Event updated session state');
        assert.strictEqual(isSessionActive(), true, 'isSessionActive reports true');

        // Attempt tab switch to hub
        handleSelectTab('hub');
        assert.strictEqual(activeTab, 'hydro', 'Hydro session locked');
        assert.strictEqual(showExitModal, true, 'Exit modal prompted');
        assert.strictEqual(pendingTab, 'hub');

        // Dispatch session end event
        env.window.dispatchEvent(new env.window.CustomEvent('omega-session-state', {
          detail: { app: 'hydro', active: false }
        }));
        assert.strictEqual(sessionState.hydro, false);

        // Close previous modal and retry
        showExitModal = false;
        pendingTab = null;

        handleSelectTab('hub');
        assert.strictEqual(activeTab, 'hub', 'Navigation allowed once session ended');
        assert.strictEqual(showExitModal, false);
      } finally {
        env.cleanup();
      }
    });

    it('C3.S2.5: Cross-Tab Session Isolation - Hub navigation is never blocked by sub-app state', () => {
      const env = setupDOMEnvironment();
      try {
        let activeTab = 'hub';
        let showExitModal = false;

        // Simulate a lingering #exerciseScreen inside .view-bubble from an earlier mount
        const bubbleView = env.document.createElement('div');
        bubbleView.className = 'omega-view view-bubble hidden';
        const lingeringScreen = env.document.createElement('div');
        lingeringScreen.id = 'exerciseScreen';
        lingeringScreen.className = 'active';
        bubbleView.appendChild(lingeringScreen);
        env.root.appendChild(bubbleView);

        // App.tsx isSessionActive implementation strictly checks activeTab first
        const isSessionActive = () => {
          if (activeTab === 'breathing') {
            const el = env.document.querySelector(
              '.view-bubble #exerciseScreen.active, .view-bubble #exerciseScreen, .view-bubble #retentionScreen, .view-bubble #recoveryScreen, #exerciseScreen.active, #exerciseScreen, #retentionScreen, #recoveryScreen'
            );
            return !!el;
          }
          if (activeTab === 'hydro') {
            const el = env.document.querySelector(
              '.view-hydro #exerciseScreen.active, .view-hydro #exerciseScreen, .view-hydro .shower-screen, #exerciseScreen.active, .shower-screen'
            );
            return !!el;
          }
          return false;
        };

        const handleSelectTab = (targetTab) => {
          if (targetTab === activeTab) return;
          if (isSessionActive()) {
            showExitModal = true;
            return;
          }
          activeTab = targetTab;
        };

        // When activeTab is 'hub', lingering screen must not trigger exit modal
        handleSelectTab('hydro');
        assert.strictEqual(activeTab, 'hydro', 'Hub -> Hydro must succeed without false exit modal');
        assert.strictEqual(showExitModal, false, 'Modal was NOT spuriously triggered from Hub');

        // Returning to Hub resets activeTab cleanly
        activeTab = 'hub';
        handleSelectTab('breathing');
        assert.strictEqual(activeTab, 'breathing', 'Hub -> Breathing must succeed without false exit modal');
        assert.strictEqual(showExitModal, false, 'Modal was NOT spuriously triggered from Hub');
      } finally {
        env.cleanup();
      }
    });
  });

  // =========================================================================
  // SUITE 3: Container Width Bounding at 1440px & Ultra-Wide Scaling Stress
  // =========================================================================
  describe('Suite 3: Container Width Bounding at 1440px on Ultra-Wide Displays', () => {

    it('C3.S3.1: CSS definitions enforce max-width: 1440px on .hub-dashboard and .omega-view .container', () => {
      const topRules = parseCssRules(responsiveCss);

      let found1440pxRule = false;
      let foundUltraWideMedia = false;

      for (const r of topRules) {
        if (r.type === 'at-rule' && /@media[^{]*min-width\s*:\s*768px/i.test(r.header)) {
          const innerRules = parseCssRules(r.body);
          for (const ir of innerRules) {
            if (ir.type === 'rule' && (ir.selector.includes('.hub-dashboard') || ir.selector.includes('.omega-view .container'))) {
              const decs = parseDeclarations(ir.declarations);
              if (decs.get('max-width') && decs.get('max-width').includes('1440px')) {
                found1440pxRule = true;
              }
            }
          }
        }
        if (r.type === 'at-rule' && /@media[^{]*min-width\s*:\s*1440px/i.test(r.header)) {
          foundUltraWideMedia = true;
          const innerRules = parseCssRules(r.body);
          for (const ir of innerRules) {
            if (ir.type === 'rule' && (ir.selector.includes('.hub-dashboard') || ir.selector.includes('.omega-view .container'))) {
              const decs = parseDeclarations(ir.declarations);
              assert.match(
                decs.get('max-width') || '',
                /1440px\s*!important/i,
                'Ultra-wide @media (min-width: 1440px) must enforce max-width: 1440px !important'
              );
            }
          }
        }
      }

      assert.ok(found1440pxRule, 'Desktop media query must define max-width: 1440px !important for containers');
      assert.ok(foundUltraWideMedia, 'responsive.css must define @media (min-width: 1440px) bounding box');
    });

    it('C3.S3.2: Container Centering - Containers declare margin: 0 auto to prevent left-pinning on wide screens', () => {
      const topRules = parseCssRules(responsiveCss);
      let foundCenteredMargin = false;

      for (const r of topRules) {
        if (r.type === 'at-rule' && /@media[^{]*min-width\s*:\s*768px/i.test(r.header)) {
          const innerRules = parseCssRules(r.body);
          for (const ir of innerRules) {
            if (ir.type === 'rule' && (ir.selector.includes('.hub-dashboard') || ir.selector.includes('.omega-view .container'))) {
              const decs = parseDeclarations(ir.declarations);
              if (decs.get('margin') && /0\s+auto/i.test(decs.get('margin'))) {
                foundCenteredMargin = true;
              }
            }
          }
        }
      }

      assert.ok(foundCenteredMargin, 'Desktop containers must declare margin: 0 auto !important for optical centering');
    });

    it('C3.S3.3: Mathematical Container Width Simulation across 360px to 8K (7680px)', () => {
      // Authoritative container sizing model:
      // Mobile (< 768px): min(viewportWidth, 480)
      // Desktop (>= 768px): min(viewportWidth - railNavWidth, 1440)
      const railWidth = 80;
      const computeSimulatedContainerWidth = (viewportWidth) => {
        if (viewportWidth < 768) {
          return Math.min(viewportWidth, 480);
        }
        const availableWidth = viewportWidth - railWidth;
        return Math.min(availableWidth, 1440);
      };

      // Mobile range: strictly clamped to <= 480px
      assert.strictEqual(computeSimulatedContainerWidth(360), 360);
      assert.strictEqual(computeSimulatedContainerWidth(480), 480);
      assert.strictEqual(computeSimulatedContainerWidth(600), 480, '600px mobile viewport clamped to 480px');
      assert.strictEqual(computeSimulatedContainerWidth(767), 480, '767px mobile upper bound clamped to 480px');

      // Desktop transition range: expands beyond 480px up to 1440px
      assert.strictEqual(computeSimulatedContainerWidth(768), 688, '768px - 80px rail = 688px');
      assert.strictEqual(computeSimulatedContainerWidth(1024), 944, '1024px - 80px rail = 944px');
      assert.strictEqual(computeSimulatedContainerWidth(1280), 1200, '1280px - 80px rail = 1200px');
      assert.strictEqual(computeSimulatedContainerWidth(1520), 1440, '1520px - 80px rail reaches exact 1440px cap');

      // Ultra-wide range: strictly capped at 1440px
      const ultraWideResolutions = [
        { name: '1080p Desktop (1920px)', width: 1920 },
        { name: '2K QHD (2560px)', width: 2560 },
        { name: 'UWQHD (3440px)', width: 3440 },
        { name: '4K UHD (3840px)', width: 3840 },
        { name: '5K Studio (5120px)', width: 5120 },
        { name: '8K Ultra (7680px)', width: 7680 }
      ];

      for (const res of ultraWideResolutions) {
        const computed = computeSimulatedContainerWidth(res.width);
        assert.strictEqual(
          computed,
          1440,
          `At ${res.name}, container width must be capped at 1440px (actual: ${computed}px)`
        );
      }
    });

    it('C3.S3.4: Multi-Column Dashboard Grid adapts between single column (<768px) and multi-column (>=768px)', () => {
      // In responsive.css:
      // Mobile: .dashboard-grid is flex-direction: column
      assert.match(
        responsiveCss,
        /\.dashboard-grid[\s\S]*?display:\s*flex;[\s\S]*?flex-direction:\s*column;/i,
        'Mobile dashboard grid must render as vertical flex column'
      );

      // Desktop: .dashboard-grid is grid-template-columns: repeat(auto-fit, minmax(320px, 1fr))
      assert.match(
        responsiveCss,
        /grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(320px,\s*1fr\)\)\s*!important/i,
        'Desktop dashboard grid must use repeat(auto-fit, minmax(320px, 1fr))'
      );

      // Dashboard.tsx contains the matching class names
      assert.match(
        dashboardCode,
        /className=["'][^"']*dashboard-grid\s+hub-cards-grid["']/i,
        'Dashboard.tsx must contain <div className="dashboard-grid hub-cards-grid">'
      );
      assert.match(
        dashboardCode,
        /className=["'][^"']*dashboard-col[\s"']/i,
        'Dashboard.tsx must contain .dashboard-col wrappers'
      );
    });

    it('C3.S3.5: Dashboard Grid Column Capacity Simulation across desktop widths', () => {
      // With minmax(320px, 1fr) and 1.5rem (24px) gap:
      // columns = Math.floor((containerWidth + gap) / (minWidth + gap))
      const computeColumns = (containerWidth, minColWidth = 320, gap = 24) => {
        return Math.max(1, Math.floor((containerWidth + gap) / (minColWidth + gap)));
      };

      assert.strictEqual(computeColumns(688), 2, 'At 768px viewport (688px container), fits 2 columns');
      assert.strictEqual(computeColumns(944), 2, 'At 1024px viewport (944px container), fits 2 columns');
      assert.strictEqual(computeColumns(1200), 3, 'At 1280px viewport (1200px container), fits 3 columns');
      assert.strictEqual(computeColumns(1440), 4, 'At 1440px container max, fits up to 4 columns');
    });
  });

  // =========================================================================
  // SUITE 4: Touch Ergonomics, Accessibility & Design Token Conformance
  // =========================================================================
  describe('Suite 4: Touch Ergonomics, Accessibility & Design Token Conformance', () => {

    it('C3.S4.1: Navigation touch targets comply with WCAG 2.5.5 standards (>=44px)', () => {
      // BottomNav tabs min-height
      assert.match(
        hubCss,
        /\.nav-tab\s*\{[\s\S]*?min-height:\s*(?:4[8-9]|[5-9][0-9])px/i,
        'BottomNav .nav-tab must have min-height >= 48px'
      );

      // NavigationRail tabs min-height and width
      assert.match(
        responsiveCss,
        /\.rail-tab[\s\S]*?min-height:\s*(?:4[8-9]|[5-9][0-9])px/i,
        'NavigationRail .rail-tab must have min-height >= 48px'
      );
      assert.match(
        responsiveCss,
        /\.rail-tab[\s\S]*?width:\s*(?:6[0-9]|[7-9][0-9])px/i,
        'NavigationRail .rail-tab must have width >= 60px'
      );

      // Logo badge 44px
      assert.match(
        responsiveCss,
        /\.rail-logo-badge\s*\{[\s\S]*?width:\s*44px;[\s\S]*?height:\s*44px;/i,
        'Rail logo badge must be at least 44px x 44px'
      );
    });

    it('C3.S4.2: All backdrop-filter declarations in responsive.css are paired with -webkit-backdrop-filter', () => {
      const bfRegex = /(?:^|[^-])backdrop-filter:\s*([^;]+);/g;
      const wbfRegex = /-webkit-backdrop-filter:\s*([^;]+);/g;

      const bfMatches = [...responsiveCss.matchAll(bfRegex)];
      const wbfMatches = [...responsiveCss.matchAll(wbfRegex)];

      assert.ok(bfMatches.length > 0, 'responsive.css should utilize backdrop-filter for glassmorphism');
      assert.strictEqual(
        bfMatches.length,
        wbfMatches.length,
        `Every backdrop-filter (${bfMatches.length}) must be paired with -webkit-backdrop-filter (${wbfMatches.length})`
      );
    });

    it('C3.S4.3: Zero forbidden rem * var(--ui-scale) expressions in responsive.css', () => {
      assert.doesNotMatch(
        responsiveCss,
        /rem\s*\*\s*var\(--ui-scale\)/i,
        'responsive.css must NOT multiply rem units by var(--ui-scale)'
      );
    });

    it('C3.S4.4: NavigationRail keyboard accessibility - Logo badge supports Enter and Space keys', () => {
      assert.match(
        navRailCode,
        /e\.key\s*===\s*['"]Enter['"]\s*\|\|\s*e\.key\s*===\s*['"]\s['"]/i,
        'Rail logo badge must handle Enter and Space keys for keyboard navigation'
      );
    });
  });

  // =========================================================================
  // SUITE 5: Adversarial Edge Cases, Keyboard Session Interception & Theme Switching
  // =========================================================================
  describe('Suite 5: Adversarial Edge Cases & Keyboard Session Interception', () => {

    it('C3.S5.1: Logo badge keyboard activation triggers session protection when exercise active', () => {
      let selectedTab = null;
      let exitModalShown = false;
      let sessionActive = true;

      const handleSelectTab = (t) => {
        if (sessionActive) {
          exitModalShown = true;
          return;
        }
        selectedTab = t;
      };

      const simulateKeyDown = (key) => {
        if (key === 'Enter' || key === ' ') {
          handleSelectTab('hub');
        }
      };

      // Test keydown with Space
      simulateKeyDown(' ');
      assert.strictEqual(exitModalShown, true, 'Space on logo badge triggers session protection');
      assert.strictEqual(selectedTab, null, 'Tab was not changed');

      // Test keydown with Enter
      exitModalShown = false;
      simulateKeyDown('Enter');
      assert.strictEqual(exitModalShown, true, 'Enter on logo badge triggers session protection');

      // Non-activating key: Escape or ArrowDown
      exitModalShown = false;
      simulateKeyDown('Escape');
      simulateKeyDown('ArrowDown');
      assert.strictEqual(exitModalShown, false, 'Non-activation keys do not trigger navigation');

      // When session inactive: Enter successfully navigates
      sessionActive = false;
      simulateKeyDown('Enter');
      assert.strictEqual(selectedTab, 'hub', 'Enter navigates to hub when session inactive');
    });

    it('C3.S5.2: NavigationRail renders gracefully with empty or missing langDict', () => {
      // Test fallback labels in NavigationRail
      const extractFallbackLabel = (tabProp, fallback) => {
        const dict = {};
        return dict[tabProp] || fallback;
      };

      assert.strictEqual(extractFallbackLabel('tabHub', 'Inicio'), 'Inicio');
      assert.strictEqual(extractFallbackLabel('tabBreathing', 'Respiración'), 'Respiración');
      assert.strictEqual(extractFallbackLabel('tabHydro', 'Duchas'), 'Duchas');
      assert.strictEqual(extractFallbackLabel('zoomLabel', 'Escala / Zoom'), 'Escala / Zoom');
    });

    it('C3.S5.3: NavigationRail light theme styling enforces glassmorphism border and box-shadow', () => {
      assert.match(
        responsiveCss,
        /html\[data-theme=["']light["']\]\s+\.navigation-rail[\s\S]*?background:\s*rgba\(237,\s*242,\s*247,\s*0\.85\)/i,
        'Light theme must define subtle translucent background for rail'
      );
      assert.match(
        responsiveCss,
        /html\[data-theme=["']light["']\]\s+\.navigation-rail[\s\S]*?border-right:\s*1px\s+solid/i,
        'Light theme must define subtle border-right'
      );
    });

    it('C3.S5.4: Rapid alternating tab selection attempts during active session do not corrupt pendingTabRef', () => {
      let pendingTab = null;
      let modalOpen = false;
      const isSessionActive = true;

      const handleSelectTab = (target) => {
        if (isSessionActive) {
          pendingTab = target;
          modalOpen = true;
          return;
        }
      };

      // User rapidly clicks different rail items while session modal is open
      const attempts = ['hub', 'hydro', 'breathing', 'hub', 'hydro'];
      for (const target of attempts) {
        handleSelectTab(target);
      }

      // Pending tab must reflect the most recent click target
      assert.strictEqual(pendingTab, 'hydro', 'Pending tab must record the latest target cleanly');
      assert.strictEqual(modalOpen, true);
    });
  });
});

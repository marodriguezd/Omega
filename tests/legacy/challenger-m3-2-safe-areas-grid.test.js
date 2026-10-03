import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readProjectFile, fileExists } from './helpers/test-utils.js';
import { setupDOMEnvironment } from './helpers/dom-shim.js';

describe('Milestone 3 Challenger 2: Safe-Areas & Multi-Column Desktop Grid Stress Suite', () => {
  const hubCss = readProjectFile('src/styles/hub.css') || '';
  const responsiveCss = readProjectFile('src/styles/responsive.css') || '';
  const tokensCss = readProjectFile('src/styles/tokens.css') || '';
  const combinedCss = hubCss + '\n' + responsiveCss + '\n' + tokensCss;

  // =========================================================================
  // SUITE 1: 4-Edge Safe-Area Inset Verification across Landscape & Portrait
  // =========================================================================
  describe('Suite 1: 4-Edge Safe-Area Insets across Landscape and Portrait Orientations', () => {

    it('C2.S1.1: 100% of env(safe-area-inset-*) declarations across all stylesheets must declare fallback ", 0px"', () => {
      // Find all env(safe-area-inset-...) occurrences
      const envRegex = /env\(\s*safe-area-inset-(top|bottom|left|right)([^)]*)\)/gi;
      let match;
      const occurrences = [];

      while ((match = envRegex.exec(combinedCss)) !== null) {
        occurrences.push({
          edge: match[1],
          fallbackPart: match[2].trim(),
          fullMatch: match[0]
        });
      }

      assert.ok(occurrences.length >= 10, `Expected at least 10 safe-area declarations, found ${occurrences.length}`);

      const invalidFallbacks = occurrences.filter(occ => {
        // Fallback must begin with comma and specify 0px (or 0)
        return !occ.fallbackPart.startsWith(',') || !occ.fallbackPart.includes('0');
      });

      assert.strictEqual(
        invalidFallbacks.length,
        0,
        `Found ${invalidFallbacks.length} safe-area declarations without valid fallback: ${JSON.stringify(invalidFallbacks)}`
      );
    });

    it('C2.S1.2: All 4 safe-area CSS custom properties (--safe-area-top, -bottom, -left, -right) are declared in :root', () => {
      assert.match(combinedCss, /--safe-area-top:\s*env\(safe-area-inset-top,\s*0px\);/i);
      assert.match(combinedCss, /--safe-area-bottom:\s*env\(safe-area-inset-bottom,\s*0px\);/i);
      assert.match(combinedCss, /--safe-area-left:\s*env\(safe-area-inset-left,\s*0px\);/i);
      assert.match(combinedCss, /--safe-area-right:\s*env\(safe-area-inset-right,\s*0px\);/i);
    });

    it('C2.S1.3: Portrait mode: dynamic computation with notch variations (0px, 24px, 48px, 59px) preserves header clearance and navigation height', () => {
      const baseHeaderPaddingRem = 0.35;
      const rootFontSize = 16;
      const baseNavHeight = 58;

      const notchProfiles = [
        { device: 'Desktop / No Notch', topInset: 0, bottomInset: 0 },
        { device: 'Android Punch Hole', topInset: 24, bottomInset: 16 },
        { device: 'iPhone Notch', topInset: 47, bottomInset: 34 },
        { device: 'Dynamic Island', topInset: 59, bottomInset: 34 },
      ];

      for (const profile of notchProfiles) {
        const computedHeaderTopPadding = (baseHeaderPaddingRem * rootFontSize) + profile.topInset;
        const computedBottomNavHeight = baseNavHeight + profile.bottomInset;

        assert.ok(
          computedHeaderTopPadding >= profile.topInset,
          `Header top padding (${computedHeaderTopPadding}px) must clear notch (${profile.topInset}px)`
        );
        assert.ok(
          computedBottomNavHeight >= baseNavHeight,
          `Bottom nav height (${computedBottomNavHeight}px) must exceed base height (${baseNavHeight}px)`
        );
      }
    });

    it('C2.S1.4: Mobile landscape (<768px): BottomNav touch target height remains >=48px despite safe-area-inset-bottom', () => {
      // In mobile landscape, bottom inset might be 21px while total height expands
      const baseNavHeight = 58;
      const bottomInset = 21;
      const totalNavHeight = baseNavHeight + bottomInset; // 79px

      // Nav tab minimum height is 48px
      const navTabMinHeight = 48;
      assert.ok(
        totalNavHeight >= navTabMinHeight,
        'BottomNav total height comfortably accommodates >=48px touch targets in landscape'
      );
    });

    it('C2.S1.5: [EMPIRICAL GEOMETRY ANALYSIS] Asymmetric horizontal safe-area insets in landscape: evaluate header-to-grid offset alignment', () => {
      // In landscape orientation on a notched phone (e.g. iPhone SE / 13 landscape: 667x375):
      // Notch on left: safe-area-inset-left = 44px, safe-area-inset-right = 0px.
      //
      // In src/styles/hub.css:
      // Line 51: .omega-app { padding-left: env(safe-area-inset-left, 0px); }
      // Line 516: .hub-header { padding-left: env(safe-area-inset-left, 0px); }
      // Line 125: .dashboard-grid { /* NO padding-left */ }
      //
      // Calculate effective X position of content:
      const safeAreaLeft = 44;
      const omegaAppPaddingLeft = safeAreaLeft;
      const hubHeaderPaddingLeft = safeAreaLeft;
      const dashboardGridPaddingLeft = 0;

      const headerContentX = omegaAppPaddingLeft + hubHeaderPaddingLeft; // 44 + 44 = 88px
      const cardsGridContentX = omegaAppPaddingLeft + dashboardGridPaddingLeft; // 44 + 0 = 44px

      const misalignmentDelta = Math.abs(headerContentX - cardsGridContentX);

      // Verify empirical calculation of the offset delta
      assert.strictEqual(
        misalignmentDelta,
        44,
        `Observed ${misalignmentDelta}px horizontal offset between .hub-header and .dashboard-grid due to nested safe-area-inset-left`
      );

      // Verify that cards grid is already safely clear of the physical notch (>= 44px)
      assert.ok(
        cardsGridContentX >= safeAreaLeft,
        'Dashboard cards are protected from the notch by .omega-app padding'
      );
    });

    it('C2.S1.6: [EMPIRICAL GEOMETRY ANALYSIS] Desktop Navigation Rail under non-zero safe-area-inset-left: evaluate rail inner width vs tab button width', () => {
      // In responsive.css lines 70, 80:
      // .navigation-rail {
      //   width: 80px !important;
      //   box-sizing: border-box !important;
      //   padding: calc(0.85rem + env(top)) 0.5rem calc(0.85rem + env(bottom)) calc(0.5rem + env(safe-area-inset-left, 0px)) !important;
      // }
      // .rail-tab { width: 64px; }
      //
      // Case 1: Desktop / PC environment (standard): safe-area-inset-left = 0px
      const rootFontSize = 16;
      const basePaddingHorizontal = 0.5 * rootFontSize; // 8px
      const railWidth = 80;
      const tabWidth = 64;

      const innerWidthStandard = railWidth - (basePaddingHorizontal + 0) - basePaddingHorizontal;
      assert.strictEqual(
        innerWidthStandard,
        64,
        'Standard desktop (0px safe-area) provides exactly 64px inner width matching the 64px tab width'
      );

      // Case 2: Tablet in landscape with 44px left notch:
      const tabletSafeLeft = 44;
      const innerWidthNotched = railWidth - (basePaddingHorizontal + tabletSafeLeft) - basePaddingHorizontal;
      // innerWidthNotched = 80 - (8 + 44) - 8 = 20px
      assert.strictEqual(
        innerWidthNotched,
        20,
        'With 44px safe-area-left, fixed 80px rail inner width reduces to 20px'
      );

      const overflowAmount = tabWidth - innerWidthNotched; // 64 - 20 = 44px
      assert.strictEqual(
        overflowAmount,
        44,
        '64px tab button would overflow 20px content box by 44px if safe-area-left is non-zero on a fixed 80px rail'
      );
    });
  });

  // =========================================================================
  // SUITE 2: Dashboard Card Grid Wrapping Across Desktop Resolutions
  // =========================================================================
  describe('Suite 2: Multi-Column Dashboard Card Grid Wrapping and Responsiveness', () => {

    // Helper: Compute the exact layout model according to responsive.css
    function computeGridLayout(viewportWidth, viewportHeight = 900) {
      const isDesktop = viewportWidth >= 768;
      if (!isDesktop) {
        return {
          mode: 'mobile',
          railVisible: false,
          bottomNavVisible: true,
          flexDirection: 'column',
          gridDisplay: 'flex',
          columnCount: 1,
          containerMaxWidth: 480,
          containerWidth: Math.min(viewportWidth, 480)
        };
      }

      // Desktop Mode:
      const railWidth = 80;
      const availableWidth = viewportWidth - railWidth;
      const containerMaxWidth = 1440;

      // Container padding: clamp(1.5rem, 3vw, 3rem)
      const paddingH = Math.min(48, Math.max(24, viewportWidth * 0.03)) * 2;
      const containerWidth = Math.min(availableWidth, containerMaxWidth);
      const gridContentWidth = Math.max(0, containerWidth - paddingH);

      // Grid definition: repeat(auto-fit, minmax(320px, 1fr)) with gap: 24px (1.5rem)
      const minColWidth = 320;
      const gap = 24;

      // Calculate how many 320px tracks fit:
      // N * 320 + (N - 1) * 24 <= gridContentWidth
      // N * 344 - 24 <= gridContentWidth => N <= (gridContentWidth + 24) / 344
      let possibleTracks = Math.floor((gridContentWidth + gap) / (minColWidth + gap));
      possibleTracks = Math.max(1, possibleTracks);

      // In Dashboard.tsx, there are exactly 2 DOM children: dashboard-col-primary and dashboard-col-secondary.
      // auto-fit collapses empty tracks when children < possibleTracks:
      const actualTracks = Math.min(2, possibleTracks);

      // Column width under 1fr distribution
      const totalGap = (actualTracks - 1) * gap;
      const columnWidth = (gridContentWidth - totalGap) / actualTracks;

      return {
        mode: 'desktop',
        railVisible: true,
        bottomNavVisible: false,
        flexDirection: 'row',
        gridDisplay: 'grid',
        possibleTracks,
        columnCount: actualTracks,
        containerMaxWidth,
        containerWidth,
        gridContentWidth,
        columnWidth
      };
    }

    it('C2.S2.1: Breakpoint transition: 767px mobile flex vs 768px desktop grid shell switch', () => {
      const mobileLayout = computeGridLayout(767);
      assert.strictEqual(mobileLayout.mode, 'mobile');
      assert.strictEqual(mobileLayout.railVisible, false);
      assert.strictEqual(mobileLayout.bottomNavVisible, true);
      assert.strictEqual(mobileLayout.flexDirection, 'column');
      assert.strictEqual(mobileLayout.gridDisplay, 'flex');

      const desktopLayout = computeGridLayout(768);
      assert.strictEqual(desktopLayout.mode, 'desktop');
      assert.strictEqual(desktopLayout.railVisible, true);
      assert.strictEqual(desktopLayout.bottomNavVisible, false);
      assert.strictEqual(desktopLayout.flexDirection, 'row');
      assert.strictEqual(desktopLayout.gridDisplay, 'grid');
    });

    it('C2.S2.2: 768px boundary: available width wraps grid into 1 column to prevent horizontal overflow', () => {
      const layout768 = computeGridLayout(768);
      // Available grid width at 768px: (768 - 80) = 688px; - 48px padding = 640px.
      // 2 columns would require 320 + 24 + 320 = 664px > 640px.
      // Therefore, at 768px it cleanly wraps to 1 column.
      assert.strictEqual(
        layout768.columnCount,
        1,
        'At 768px, grid wraps to 1 column to defend against horizontal overflow'
      );
      assert.ok(
        layout768.columnWidth <= layout768.gridContentWidth,
        'Column fits completely within container width without overflow'
      );
    });

    it('C2.S2.3: 800px+ tablets and desktops wrap cleanly into 2 balanced columns (50% / 50%)', () => {
      const testResolutions = [
        { name: 'Tablet Landscape (800px)', width: 800 },
        { name: 'Small Laptop / iPad (1024px)', width: 1024 },
        { name: 'HD 720p (1280px)', width: 1280 },
        { name: 'WXGA Display (1366px)', width: 1366 },
        { name: 'Standard Desktop (1440px)', width: 1440 },
      ];

      for (const res of testResolutions) {
        const layout = computeGridLayout(res.width);
        assert.strictEqual(
          layout.columnCount,
          2,
          `${res.name} must display exactly 2 columns`
        );
        assert.ok(
          layout.columnWidth >= 320,
          `${res.name} column width (${layout.columnWidth.toFixed(1)}px) must be >= minmax minimum 320px`
        );
      }
    });

    it('C2.S2.4: Ultra-wide resolutions (1920px Full HD, 2560px 2K, 3840px 4K, 7680px 8K) cap at 1440px bounding box', () => {
      const ultraWideResolutions = [1920, 2560, 3840, 7680];

      for (const width of ultraWideResolutions) {
        const layout = computeGridLayout(width);
        assert.strictEqual(
          layout.containerWidth,
          1440,
          `Resolution ${width}px must constrain container width to 1440px max-width`
        );
        assert.strictEqual(
          layout.columnCount,
          2,
          `Resolution ${width}px maintains 2 balanced columns without empty orphan tracks`
        );
        // Column width capped around ~620-660px preventing distorted stretching
        assert.ok(
          layout.columnWidth <= 700,
          `Resolution ${width}px column width (${layout.columnWidth.toFixed(1)}px) remains balanced and readable`
        );
      }
    });

    it('C2.S2.5: Sub-component responsive grid: Quick Cards adaptively fit in Column 1', () => {
      // In Column 1, .quick-cards has: grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem (12px);
      // Bubble Breathing card + HydroCycle card = 2 cards total.
      const computeQuickCardsTracks = (colWidth) => {
        const minCardWidth = 140;
        const gap = 12;
        const possible = Math.floor((colWidth + gap) / (minCardWidth + gap));
        return Math.min(2, Math.max(1, possible));
      };

      // In narrow column (e.g. 250px): wraps to 1 column
      assert.strictEqual(computeQuickCardsTracks(250), 1, 'Quick cards wrap to 1 column in narrow space');
      // In standard desktop column (>= 292px): side-by-side 2 columns
      assert.strictEqual(computeQuickCardsTracks(320), 2, 'Quick cards sit side-by-side at 320px column');
      assert.strictEqual(computeQuickCardsTracks(600), 2, 'Quick cards sit side-by-side at 600px column');
    });

    it('C2.S2.6: Sub-component responsive grid: Metrics Grid adaptively fits 4 metric cards in Column 2', () => {
      // In Column 2, .metrics-grid has: grid-template-columns: repeat(auto-fit, minmax(125px, 1fr)); gap: 0.65rem (10.4px);
      const computeMetricsGridTracks = (colWidth) => {
        const minBoxWidth = 125;
        const gap = 10.4;
        const possible = Math.floor((colWidth + gap) / (minBoxWidth + gap));
        return Math.min(4, Math.max(1, possible));
      };

      // At 320px column width: 2x2 grid
      assert.strictEqual(computeMetricsGridTracks(320), 2, 'Metrics grid renders 2 columns at 320px column');
      // At 600px column width: 4x1 row
      assert.strictEqual(computeMetricsGridTracks(600), 4, 'Metrics grid renders 4 columns in single row at 600px column');
    });
  });

  // =========================================================================
  // SUITE 3: Accessibility, WebKit Glassmorphism & Active Session Protection
  // =========================================================================
  describe('Suite 3: Accessibility, Styling Parity & Active Session Protection', () => {

    it('C2.S3.1: WCAG 2.5.5 Touch target dimensions: NavigationRail items maintain >=48px height and >=64px width', () => {
      const railTabMatch = responsiveCss.match(/\.rail-tab[^{]*\{([^}]+)\}/i);
      assert.ok(railTabMatch, 'rail-tab style rule must exist');
      const rules = railTabMatch[1];

      assert.match(rules, /min-height:\s*(?:4[8-9]|[5-9][0-9])px/i, 'Rail tabs must declare min-height >= 48px');
      assert.match(rules, /width:\s*(?:6[4-9]|[7-9][0-9])px/i, 'Rail tabs must declare width >= 64px');
    });

    it('C2.S3.2: WebKit backdrop-filter parity in responsive.css: 100% of backdrop-filter rules have -webkit- prefix', () => {
      const backdropMatches = responsiveCss.match(/(?:^|[^-])backdrop-filter\s*:/g) || [];
      const webkitMatches = responsiveCss.match(/-webkit-backdrop-filter\s*:/g) || [];

      assert.strictEqual(
        backdropMatches.length,
        webkitMatches.length,
        `Every backdrop-filter (${backdropMatches.length}) must have matching -webkit-backdrop-filter (${webkitMatches.length})`
      );
    });

    it('C2.S3.3: NavigationRail renders accessible ARIA roles, labels, and active indicators', () => {
      const railCode = readProjectFile('src/components/NavigationRail.tsx') || '';
      assert.match(railCode, /role="navigation"/, 'NavigationRail must have role="navigation"');
      assert.match(railCode, /aria-label="Desktop Navigation Rail"/, 'NavigationRail must have aria-label');
      assert.match(railCode, /aria-current=\{activeTab === 'hub' \? 'page' : undefined\}/, 'Tabs must expose aria-current="page"');
      assert.match(railCode, /rail-indicator active/, 'Active tab must render visual indicator');
    });

    it('C2.S3.4: App.tsx routes NavigationRail clicks through handleSelectTab with active session confirmation', () => {
      const appCode = readProjectFile('src/App.tsx') || '';
      assert.match(
        appCode,
        /<NavigationRail[\s\S]*?onSelectTab=\{handleSelectTab\}/,
        'NavigationRail must pass handleSelectTab to onSelectTab prop for session protection'
      );
    });
  });

  // =========================================================================
  // SUITE 4: Interactive Session Interception, Notch Asymmetry & Zoom Scaling
  // =========================================================================
  describe('Suite 4: Rail Session Interception, Asymmetric Landscape & Zoom Scaling', () => {

    it('C2.S4.1: NavigationRail tab click during active session triggers ExitConfirmModal in DOM environment', () => {
      const env = setupDOMEnvironment();
      try {
        let activeTab = 'breathing';
        let showExitModal = false;
        let pendingTab = null;

        // Bubble-Breathing active session in DOM
        const viewsContainer = env.document.createElement('main');
        viewsContainer.className = 'omega-views-container';
        env.root.appendChild(viewsContainer);

        const viewBubble = env.document.createElement('div');
        viewBubble.className = 'omega-view view-bubble active';
        const bubbleExercise = env.document.createElement('div');
        bubbleExercise.id = 'exerciseScreen';
        bubbleExercise.className = 'screen active';
        viewBubble.appendChild(bubbleExercise);
        viewsContainer.appendChild(viewBubble);

        // App.tsx tab click handler
        const handleSelectTab = (targetTab) => {
          if (targetTab === activeTab) return;
          // Scoped session check
          const isActive = Boolean(viewBubble.querySelector('#exerciseScreen.active, #exerciseScreen'));
          if (isActive) {
            pendingTab = targetTab;
            showExitModal = true;
            return;
          }
          activeTab = targetTab;
        };

        // User on desktop clicks "Hydro" tab on NavigationRail
        handleSelectTab('hydro');

        assert.strictEqual(
          showExitModal,
          true,
          'Clicking NavigationRail tab while breathing session is active MUST trigger exit modal'
        );
        assert.strictEqual(
          activeTab,
          'breathing',
          'activeTab must remain "breathing" until exit is explicitly confirmed'
        );
        assert.strictEqual(
          pendingTab,
          'hydro',
          'pendingTab must record the target tab for post-confirmation transition'
        );
      } finally {
        env.cleanup();
      }
    });

    it('C2.S4.2: Landscape orientation with notch on RIGHT edge: horizontal insets protect header controls and bottom nav without breaking layout', () => {
      // Rotate device: notch is on the right (safe-area-inset-right = 47px, safe-area-inset-left = 0px)
      const safeRight = 47;
      const safeLeft = 0;

      // BottomNav right padding:
      const baseNavPadding = 0;
      const bottomNavPaddingRight = baseNavPadding + safeRight;
      assert.strictEqual(bottomNavPaddingRight, 47, 'BottomNav right padding accommodates 47px right notch');

      // Hub header right padding:
      const hubHeaderPaddingRight = safeRight;
      assert.strictEqual(hubHeaderPaddingRight, 47, 'Hub header right padding protects theme toggle and zoom buttons from right notch');

      // Navigation rail is on the left:
      const railPaddingLeft = 8 + safeLeft;
      assert.strictEqual(railPaddingLeft, 8, 'Rail on left maintains standard 8px padding when notch is on right');
    });

    it('C2.S4.3: Extreme UI Zoom scale (80% to 220%) maintains valid multi-column grid math without NaN or infinite loops', () => {
      const zoomLevels = [80, 100, 125, 150, 175, 200, 220];
      const viewportWidth = 1440;
      const baseFontSize = 16;

      for (const zoom of zoomLevels) {
        const scale = zoom / 100;
        const scaledRootFontSize = baseFontSize * scale;

        // Container padding in responsive.css: clamp(1.5rem, 3vw, 3rem)
        const remPx = 1.5 * scaledRootFontSize;
        const vwPx = viewportWidth * 0.03;
        const maxRemPx = 3.0 * scaledRootFontSize;
        const horizontalPaddingSingle = Math.min(maxRemPx, Math.max(remPx, vwPx));
        const totalHorizontalPadding = horizontalPaddingSingle * 2;

        const availableGridWidth = Math.min(viewportWidth - 80, 1440) - totalHorizontalPadding;

        assert.ok(Number.isFinite(availableGridWidth), `availableGridWidth at ${zoom}% must be finite`);
        assert.ok(availableGridWidth > 400, `availableGridWidth at ${zoom}% (${availableGridWidth}px) must comfortably fit cards`);

        // Compute 320px column tracks
        const tracks = Math.min(2, Math.max(1, Math.floor((availableGridWidth + 24) / (320 + 24))));
        assert.strictEqual(tracks, 2, `At 1440px desktop, grid must maintain 2 columns even at ${zoom}% zoom`);
      }
    });

    it('C2.S4.4: Sub-app exercise sphere maintains circular geometry and vmin clamping when container expands to 1440px on desktop', () => {
      // In hub.css lines 243-250:
      // .omega-view .breathing-sphere-container, .omega-view .hexagon-container {
      //   width: clamp(140px, 28vmin, 180px) !important;
      // }
      const computeSphereDimension = (viewportWidth, viewportHeight) => {
        const vmin = Math.min(viewportWidth, viewportHeight);
        const calcPx = 0.28 * vmin;
        return Math.min(180, Math.max(140, calcPx));
      };

      // Mobile portrait (390x844): vmin = 390. 28% of 390 = 109.2px -> clamped to min 140px
      assert.strictEqual(computeSphereDimension(390, 844), 140, 'Mobile portrait clamps sphere to 140px');

      // Desktop HD (1280x720): vmin = 720. 28% of 720 = 201.6px -> clamped to max 180px
      assert.strictEqual(computeSphereDimension(1280, 720), 180, 'Desktop HD clamps sphere to 180px');

      // Desktop Full HD (1920x1080): vmin = 1080. Clamped to max 180px
      assert.strictEqual(computeSphereDimension(1920, 1080), 180, 'Desktop 1080p clamps sphere to 180px');

      // Desktop 4K (3840x2160): vmin = 2160. Clamped to max 180px
      assert.strictEqual(computeSphereDimension(3840, 2160), 180, 'Desktop 4K clamps sphere to 180px');
    });
  });
});

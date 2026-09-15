import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readProjectFile, fileExists } from '../helpers/test-utils.js';

describe('Tier 1: Feature Coverage - R3 Adaptive & Responsive Layout (<768px vs >=768px)', () => {
  const hubCss = readProjectFile('src/styles/hub.css') || '';
  const responsiveCss = readProjectFile('src/styles/responsive.css') || '';
  const combinedCss = hubCss + '\n' + responsiveCss;

  it('T1.R3.1: Mobile navigation shell (<768px) must render BottomNav with safe-area insets and touch targets >=44px', () => {
    // Authoritative source: ORIGINAL_REQUEST.md lines 21-22 & PROJECT.md lines 22, 119
    const bottomNavFile = readProjectFile('src/components/BottomNav.tsx');
    assert.ok(bottomNavFile, 'BottomNav.tsx must exist');

    // Verify safe area inset usage for mobile bottom navigation
    assert.match(
      combinedCss,
      /env\(safe-area-inset-bottom/i,
      'Bottom navigation must incorporate env(safe-area-inset-bottom) for home indicator clearance'
    );

    // Verify touch target height is at least 44px (WCAG 2.5.5 / mobile UX standards)
    // In hub.css: --bottom-nav-base-height: 58px or buttons min-height >= 44px
    const hasAdequateHeight = /--bottom-nav-base-height:\s*(?:4[4-9]|[5-9][0-9])px|height:\s*(?:4[4-9]|[5-9][0-9])px/i.test(combinedCss);
    assert.ok(
      hasAdequateHeight,
      'Mobile navigation tabs must maintain touch targets of at least 44px height'
    );
  });

  it('T1.R3.2: Desktop layout (>=768px) must incorporate Navigation Rail / Sidebar', () => {
    // Authoritative source: ORIGINAL_REQUEST.md line 23 & PROJECT.md lines 23, 121
    const navigationRailFile = fileExists('src/components/NavigationRail.tsx');
    const has768Breakpoint = /@media[^{]*\(\s*min-width\s*:\s*768px\s*\)/i.test(combinedCss);

    assert.ok(
      navigationRailFile || has768Breakpoint,
      'Desktop navigation rail component or >=768px media query must be implemented'
    );

    // Verify App.tsx or shell mounts NavigationRail conditionally or in responsive grid
    const appTsx = readProjectFile('src/App.tsx') || '';
    const mountsRail = /NavigationRail/i.test(appTsx);
    assert.ok(
      mountsRail,
      'App.tsx shell must import and render NavigationRail for desktop viewports'
    );
  });

  it('T1.R3.3: Dashboard layout on viewports >=768px must utilize multi-column grid without 480px artificial clamping', () => {
    // Authoritative source: ORIGINAL_REQUEST.md line 23 & Survey 2 lines 24-25
    // Mobile applies max-width: 480px, but >=768px must expand to fluid/multi-column grid
    const hasDesktopGrid = /@media[^{]*\(\s*min-width\s*:\s*768px\s*\)[\s\S]*?(?:grid-template-columns|max-width:\s*(?:none|1[0-9]{3}px|100%|1200px))/i.test(combinedCss);
    assert.ok(
      hasDesktopGrid,
      'Stylesheet must define multi-column dashboard grid or relaxed max-width in >=768px media query'
    );
  });

  it('T1.R3.4: Safe-area insets must be comprehensively handled for all 4 edges (top, bottom, left, right)', () => {
    // Authoritative source: ORIGINAL_REQUEST.md line 22 & Survey 2 line 27
    const hasTopInset = /env\(safe-area-inset-top/i.test(combinedCss);
    const hasBottomInset = /env\(safe-area-inset-bottom/i.test(combinedCss);
    const hasLeftInset = /env\(safe-area-inset-left/i.test(combinedCss);
    const hasRightInset = /env\(safe-area-inset-right/i.test(combinedCss);

    assert.ok(hasTopInset, 'CSS must handle env(safe-area-inset-top) for status bar / camera punch hole');
    assert.ok(hasBottomInset, 'CSS must handle env(safe-area-inset-bottom) for gesture navigation bar');
    assert.ok(hasLeftInset, 'CSS must handle env(safe-area-inset-left) for landscape orientation');
    assert.ok(hasRightInset, 'CSS must handle env(safe-area-inset-right) for landscape orientation');
  });

  it('T1.R3.5: Navigation items must expose active tab indicators and accessible labels across layouts', () => {
    // Authoritative source: PROJECT.md lines 14-26 & BottomNav.tsx
    const bottomNav = readProjectFile('src/components/BottomNav.tsx') || '';

    // Verify aria-label support
    assert.match(
      bottomNav,
      /aria-label=/i,
      'Navigation items must provide aria-label for accessibility'
    );

    // Verify visual active indicator element or class
    assert.match(
      bottomNav,
      /nav-tab-indicator|active/i,
      'Navigation must provide an active state indicator'
    );
  });
});

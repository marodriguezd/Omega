import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readProjectFile, parseCssVariables, fileExists } from '../helpers/test-utils.js';

describe('Tier 1: Feature Coverage - R1 Unified Design System & Tokens', () => {
  // Read token sources: either tokens.css (M1 target) or hub.css / embedded styles
  const tokensCss = readProjectFile('src/styles/tokens.css') || '';
  const hubCss = readProjectFile('src/styles/hub.css') || '';
  const combinedCss = tokensCss + '\n' + hubCss;
  const variables = parseCssVariables(combinedCss);

  it('T1.R1.1: Wim Hof palette tokens must be defined with exact hex color specifications', () => {
    // Authoritative source: PROJECT.md lines 81-94
    const requiredColors = {
      '--omega-bg-base': '#0a0e13',
      '--omega-primary-cyan': '#00f0ff',
      '--omega-warm-amber': '#ff7a00',
      '--omega-cold-blue': '#00d2ff',
      '--omega-text-primary': '#f0f6fc'
    };

    for (const [tokenName, expectedValue] of Object.entries(requiredColors)) {
      const val = variables.get(tokenName);
      assert.ok(
        val !== undefined,
        `Expected token "${tokenName}" to be declared in tokens.css or hub.css`
      );
      assert.strictEqual(
        val.toLowerCase(),
        expectedValue.toLowerCase(),
        `Token "${tokenName}" expected ${expectedValue}, got "${val}"`
      );
    }
  });

  it('T1.R1.2: Continuous squircle border-radius tokens must match Android 17 specifications', () => {
    // Authoritative source: PROJECT.md lines 94-98
    const requiredRadii = {
      '--omega-radius-squircle-sm': '12px',
      '--omega-radius-squircle-md': '20px',
      '--omega-radius-squircle-lg': '28px',
      '--omega-radius-bubble': '50%'
    };

    for (const [tokenName, expectedValue] of Object.entries(requiredRadii)) {
      const val = variables.get(tokenName);
      assert.ok(
        val !== undefined,
        `Expected squircle token "${tokenName}" to be declared`
      );
      assert.strictEqual(
        val,
        expectedValue,
        `Squircle token "${tokenName}" expected "${expectedValue}", got "${val}"`
      );
    }
  });

  it('T1.R1.3: Frosted glassmorphism tokens and luminous borders must be declared', () => {
    // Authoritative source: PROJECT.md lines 99-102
    assert.ok(
      variables.has('--omega-glass-blur'),
      'Expected "--omega-glass-blur" token to be defined'
    );
    assert.strictEqual(
      variables.get('--omega-glass-blur'),
      'blur(16px)',
      'Glass blur must specify blur(16px)'
    );

    assert.ok(
      variables.has('--omega-border-luminous'),
      'Expected "--omega-border-luminous" token to be defined'
    );
    assert.match(
      variables.get('--omega-border-luminous'),
      /rgba\(\s*0\s*,\s*240\s*,\s*255/i,
      'Luminous border must use glacier cyan tint rgba(0, 240, 255, ...)'
    );
  });

  it('T1.R1.4: Unified UI controls (buttons, modals, switches) must apply design tokens and glassmorphism', () => {
    // Authoritative source: ORIGINAL_REQUEST.md line 15 & PROJECT.md lines 84-86
    const glassStyle = readProjectFile('src/styles/glassmorphism.css') || combinedCss;

    // Check for backdrop-filter blur usage on cards or modals
    const hasBackdropBlur = /backdrop-filter:\s*var\(--omega-glass-blur\)|backdrop-filter:\s*blur\(/i.test(glassStyle);
    assert.ok(
      hasBackdropBlur,
      'Frosted glass elements must implement backdrop-filter blur'
    );

    // Check for glass surface background definition
    assert.ok(
      variables.has('--omega-bg-glass') || /rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.0[3-8]\)/.test(combinedCss),
      'Unified controls must share translucent glass surface tokens'
    );
  });

  it('T1.R1.5: Breathing sphere geometry must be organic and circular, eliminating sharp polygons', () => {
    // Authoritative source: PROJECT.md lines 51, 98 & ORIGINAL_REQUEST.md line 14
    const breathingSphereComponent = readProjectFile('src/components/BreathingSphere.tsx');
    const bubbleExerciseScreen = readProjectFile('Bubble-Breathing/src/components/ExerciseScreen.tsx') || '';

    // If BreathingSphere.tsx exists, verify it uses rounded/spherical styling
    if (breathingSphereComponent) {
      assert.match(
        breathingSphereComponent,
        /border-radius:\s*(?:50%|var\(--omega-radius-bubble\))|rounded-full|radius-bubble/i,
        'BreathingSphere must use circular border-radius (50%)'
      );
    }

    // In target unified state, ExerciseScreen must not rely on sharp 6-point clip-path polygon
    const usesSharpPolygon = /clip-path:\s*polygon\(50%\s*0%,\s*100%\s*25%/i.test(bubbleExerciseScreen);
    assert.ok(
      !usesSharpPolygon,
      'Sharp 6-point polygon clip-path must be replaced with organic breathing sphere'
    );
  });
});

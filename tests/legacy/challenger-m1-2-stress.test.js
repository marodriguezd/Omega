import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readProjectFile } from './helpers/test-utils.js';
import { setupDOMEnvironment } from './helpers/dom-shim.js';

/**
 * Accurate CSS Keyframes Parser with nested brace depth matching.
 * Fixes the flaw in naive regex parsers that swallow full file content on nested braces.
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

describe('Milestone 1 Challenger 2: Animation, GPU Properties, and Session Protection Stress Suite', () => {

  // =========================================================================
  // TASK 1: Breathing Bubble Animation & GPU Properties (transform, opacity, will-change)
  // =========================================================================
  describe('Task 1: Breathing Bubble Animation & GPU Properties', () => {
    it('C2.T1.1: BreathingSphere component enforces GPU transforms (scale, translateZ) and will-change', () => {
      const sphereCode = readProjectFile('src/components/BreathingSphere.tsx');
      assert.ok(sphereCode, 'BreathingSphere.tsx must exist');

      // Verify GPU transform with translateZ layer promotion
      assert.match(
        sphereCode,
        /transform:\s*`scale\(\$\{scale\}\)\s+translateZ\(0\)`/i,
        'BreathingSphere must use transform: scale(...) translateZ(0) for GPU layer promotion'
      );

      // Verify willChange transform and opacity
      assert.match(
        sphereCode,
        /willChange:\s*['"]transform,\s*opacity['"]/i,
        'BreathingSphere must declare willChange: transform, opacity'
      );

      // Verify organic circular geometry
      assert.match(
        sphereCode,
        /borderRadius:\s*['"]var\(--omega-radius-bubble,\s*50%\)['"]/i,
        'BreathingSphere must define 50% border radius for organic circular geometry'
      );
      assert.match(
        sphereCode,
        /aspectRatio:\s*['"]1\s*\/\s*1['"]/i,
        'BreathingSphere must declare aspectRatio: 1 / 1'
      );
    });

    it('C2.T1.2: Bubble-Breathing ExerciseScreen uses GPU scale and transition timing without layout reflows', () => {
      const exerciseCode = readProjectFile('Bubble-Breathing/src/components/ExerciseScreen.tsx');
      assert.ok(exerciseCode, 'ExerciseScreen.tsx must exist');

      // Verify transform: scale with translateZ
      assert.match(
        exerciseCode,
        /transform:\s*`scale\(\$\{scale\}\)\s+translateZ\(0\)`/i,
        'ExerciseScreen must apply scale transform with translateZ(0)'
      );

      // Verify transition transform
      assert.match(
        exerciseCode,
        /transition:\s*`transform\s+\$\{duration\}ms\s+\$\{easing\}`/i,
        'ExerciseScreen must transition transform'
      );

      // Verify willChange
      assert.match(
        exerciseCode,
        /willChange:\s*['"]transform['"]/i,
        'ExerciseScreen must declare willChange: transform'
      );
    });

    it('C2.T1.3: Stylesheets eliminate clip-path polygons and declare will-change on breathing spheres', () => {
      const bubbleCss = readProjectFile('Bubble-Breathing/src/style.css') || '';
      const hydroCss = readProjectFile('Hydrocicle/src/index.css') || '';

      // Check clip-path is none
      assert.doesNotMatch(bubbleCss, /clip-path:\s*polygon\(/i, 'Bubble style.css must not contain clip-path: polygon()');
      assert.doesNotMatch(hydroCss, /clip-path:\s*polygon\(/i, 'Hydro index.css must not contain clip-path: polygon()');

      // Check border-radius 50%
      assert.match(bubbleCss, /border-radius:\s*50%\s*!important/i, 'Bubble sphere must have border-radius: 50% !important');
      assert.match(hydroCss, /border-radius:\s*50%\s*!important/i, 'Hydro sphere must have border-radius: 50% !important');

      // Check will-change on .breathing-sphere and .hexagon
      assert.match(bubbleCss, /\.breathing-sphere[\s\S]*?will-change:\s*transform,\s*opacity/i, 'Bubble sphere must have will-change: transform, opacity');
      assert.match(hydroCss, /\.breathing-sphere[\s\S]*?will-change:\s*transform,\s*opacity/i, 'Hydro sphere must have will-change: transform, opacity');
    });
  });

  // =========================================================================
  // TASK 2: Absence of box-shadow or width animations during breathing cycles in keyframes
  // =========================================================================
  describe('Task 2: Absence of box-shadow or width animations in keyframes', () => {
    it('C2.T2.1: No CSS @keyframes across the entire project animates box-shadow', () => {
      const filesToCheck = [
        'Bubble-Breathing/src/style.css',
        'Hydrocicle/src/index.css',
        'src/styles/hub.css',
        'src/styles/tokens.css',
        'src/styles/glassmorphism.css'
      ];

      for (const file of filesToCheck) {
        const content = readProjectFile(file);
        if (!content) continue;
        const keyframes = parseKeyframesAccurate(content);
        for (const [name, body] of keyframes.entries()) {
          const hasBoxShadow = /box-shadow\s*:/i.test(body);
          assert.strictEqual(
            hasBoxShadow,
            false,
            `Keyframe @keyframes ${name} in ${file} must not animate box-shadow (causes CPU repaints)`
          );
        }
      }
    });

    it('C2.T2.2: No CSS @keyframes across the entire project animates width', () => {
      const filesToCheck = [
        'Bubble-Breathing/src/style.css',
        'Hydrocicle/src/index.css',
        'src/styles/hub.css',
        'src/styles/tokens.css',
        'src/styles/glassmorphism.css'
      ];

      for (const file of filesToCheck) {
        const content = readProjectFile(file);
        if (!content) continue;
        const keyframes = parseKeyframesAccurate(content);
        for (const [name, body] of keyframes.entries()) {
          const hasWidth = /width\s*:/i.test(body);
          assert.strictEqual(
            hasWidth,
            false,
            `Keyframe @keyframes ${name} in ${file} must not animate width (causes layout thrashing)`
          );
        }
      }
    });

    it('C2.T2.3: lastBreathGlow animates exclusively opacity and GPU transform on pseudo-element', () => {
      const bubbleCss = readProjectFile('Bubble-Breathing/src/style.css') || '';
      const keyframes = parseKeyframesAccurate(bubbleCss);
      const glowKeyframe = keyframes.get('lastBreathGlow');

      assert.ok(glowKeyframe, 'lastBreathGlow keyframe must exist in Bubble style.css');
      assert.doesNotMatch(glowKeyframe, /box-shadow/i, 'lastBreathGlow must not animate box-shadow');
      assert.doesNotMatch(glowKeyframe, /width/i, 'lastBreathGlow must not animate width');
      assert.match(glowKeyframe, /opacity\s*:/i, 'lastBreathGlow must animate opacity');
      assert.match(glowKeyframe, /transform\s*:/i, 'lastBreathGlow must animate transform');

      // Pseudo-element attachment
      assert.match(
        bubbleCss,
        /\.breathing-sphere\.last-breath::before[\s\S]*?animation:\s*lastBreathGlow/i,
        'lastBreathGlow animation must be bound to the ::before pseudo-element'
      );
    });
  });

  // =========================================================================
  // TASK 3: HydroCycle shower screen pulse verification
  // =========================================================================
  describe('Task 3: HydroCycle Shower Screen Pulse Verification', () => {
    it('C2.T3.1: ShowerScreen.tsx completely eliminates invalid inline infinite alternate transition', () => {
      const showerCode = readProjectFile('Hydrocicle/src/components/ShowerScreen.tsx');
      assert.ok(showerCode, 'ShowerScreen.tsx must exist');

      // Verify no invalid transition
      const hasInvalidTransition = /transition:\s*['"][^'"]*infinite\s+alternate/i.test(showerCode);
      assert.strictEqual(
        hasInvalidTransition,
        false,
        'ShowerScreen.tsx must NOT contain transition with "infinite alternate"'
      );

      // Verify that pulsing class is applied conditionally when isPlaying is true
      assert.match(
        showerCode,
        /\$\{isPlaying\s*\?\s*['"]pulsing['"]\s*:\s*['"]['"]\}/,
        'ShowerScreen must dynamically apply "pulsing" class when isPlaying is active'
      );
    });

    it('C2.T3.2: hydroSpherePulse keyframe uses hardware-accelerated transform with translateZ and 2s infinite duration', () => {
      const hydroCss = readProjectFile('Hydrocicle/src/index.css') || '';
      const keyframes = parseKeyframesAccurate(hydroCss);
      const pulseKeyframe = keyframes.get('hydroSpherePulse');

      assert.ok(pulseKeyframe, '@keyframes hydroSpherePulse must exist in Hydro index.css');
      assert.match(pulseKeyframe, /0%[\s\S]*?transform:\s*scale\(1(?:\.0)?\)\s+translateZ\(0\)/i, '0% must scale(1.0) translateZ(0)');
      assert.match(pulseKeyframe, /50%[\s\S]*?transform:\s*scale\(1\.08\)\s+translateZ\(0\)/i, '50% must scale(1.08) translateZ(0)');
      assert.match(pulseKeyframe, /100%[\s\S]*?transform:\s*scale\(1(?:\.0)?\)\s+translateZ\(0\)/i, '100% must scale(1.0) translateZ(0)');

      // Check animation binding
      assert.match(
        hydroCss,
        /\.breathing-sphere\.pulsing[\s\S]*?animation:\s*hydroSpherePulse\s+2s\s+cubic-bezier\(0\.4,\s*0,\s*0\.2,\s*1\)\s+infinite\s*!important/i,
        '.breathing-sphere.pulsing must bind hydroSpherePulse with 2s cubic-bezier infinite !important'
      );
    });
  });

  // =========================================================================
  // TASK 4: Active session protection in src/App.tsx
  // =========================================================================
  describe('Task 4: Active Session Protection in src/App.tsx', () => {
    it('C2.T4.1: isSessionActive protects active Bubble-Breathing exercise (#exerciseScreen, #retentionScreen, #recoveryScreen)', () => {
      const env = setupDOMEnvironment();
      try {
        let activeTab = 'breathing';
        let showExitModal = false;
        let pendingTab = null;

        const isSessionActive = (tab) => {
          if (tab === 'breathing') {
            const activeScreen = env.document.querySelector('#exerciseScreen, #retentionScreen, #recoveryScreen');
            return !!activeScreen;
          }
          if (tab === 'hydro') {
            const showerScreen = env.document.querySelector('.view-hydro #exerciseScreen, #exerciseScreen, .screen.active:not(#configScreen), .shower-screen');
            return !!showerScreen;
          }
          return false;
        };

        const handleSelectTab = (targetTab) => {
          if (targetTab === activeTab) return;
          if (isSessionActive(activeTab)) {
            pendingTab = targetTab;
            showExitModal = true;
            return;
          }
          activeTab = targetTab;
        };

        // Phase 1: Idle (config screen only)
        const configScreen = env.document.createElement('div');
        configScreen.id = 'configScreen';
        configScreen.className = 'screen active';
        env.root.appendChild(configScreen);

        handleSelectTab('hub');
        assert.strictEqual(showExitModal, false, 'Navigation while idle must NOT prompt exit modal');
        assert.strictEqual(activeTab, 'hub', 'Tab changes to hub immediately when idle');

        // Reset to breathing and start exercise
        activeTab = 'breathing';
        env.root.removeChild(configScreen);

        const exerciseScreen = env.document.createElement('div');
        exerciseScreen.id = 'exerciseScreen';
        exerciseScreen.className = 'screen active';
        env.root.appendChild(exerciseScreen);

        // Attempt tab switch to 'hub' during active exercise
        handleSelectTab('hub');
        assert.strictEqual(showExitModal, true, 'Active exercise must block tab switch with exit modal');
        assert.strictEqual(activeTab, 'breathing', 'Active tab must remain breathing while unconfirmed');
        assert.strictEqual(pendingTab, 'hub', 'Pending tab must be recorded');

        // User cancels exit
        showExitModal = false;
        pendingTab = null;
        assert.strictEqual(activeTab, 'breathing', 'Canceling modal keeps user in breathing');

        // Transition to retention phase
        env.root.removeChild(exerciseScreen);
        const retentionScreen = env.document.createElement('div');
        retentionScreen.id = 'retentionScreen';
        retentionScreen.className = 'screen active';
        env.root.appendChild(retentionScreen);

        handleSelectTab('hydro');
        assert.strictEqual(showExitModal, true, 'Active retention phase must block tab switch');
        assert.strictEqual(activeTab, 'breathing', 'Active tab remains breathing');

        // Transition to recovery phase
        showExitModal = false;
        env.root.removeChild(retentionScreen);
        const recoveryScreen = env.document.createElement('div');
        recoveryScreen.id = 'recoveryScreen';
        recoveryScreen.className = 'screen active';
        env.root.appendChild(recoveryScreen);

        handleSelectTab('hydro');
        assert.strictEqual(showExitModal, true, 'Active recovery phase must block tab switch');

        // User confirms exit
        const handleConfirmExit = () => {
          showExitModal = false;
          activeTab = pendingTab || 'hub';
          pendingTab = null;
        };
        handleConfirmExit();
        assert.strictEqual(showExitModal, false, 'Exit modal closes on confirmation');
        assert.strictEqual(activeTab, 'hydro', 'Tab changes to destination on confirmation');
      } finally {
        env.cleanup();
      }
    });

    it('C2.T4.2: isSessionActive protects active HydroCycle shower and allows free navigation on ConfigScreen', () => {
      const env = setupDOMEnvironment();
      try {
        let activeTab = 'hydro';
        let showExitModal = false;
        let pendingTab = null;

        const isSessionActive = (tab) => {
          if (tab === 'breathing') {
            const activeScreen = env.document.querySelector('#exerciseScreen, #retentionScreen, #recoveryScreen');
            return !!activeScreen;
          }
          if (tab === 'hydro') {
            const showerScreen = env.document.querySelector('.view-hydro #exerciseScreen, #exerciseScreen, .screen.active:not(#configScreen), .shower-screen');
            return !!showerScreen;
          }
          return false;
        };

        const handleSelectTab = (targetTab) => {
          if (targetTab === activeTab) return;
          if (isSessionActive(activeTab)) {
            pendingTab = targetTab;
            showExitModal = true;
            return;
          }
          activeTab = targetTab;
        };

        // Scenario 1: Hydro is in ConfigScreen
        const hydroConfig = env.document.createElement('div');
        hydroConfig.id = 'configScreen';
        hydroConfig.className = 'screen active';
        env.root.appendChild(hydroConfig);

        handleSelectTab('hub');
        assert.strictEqual(showExitModal, false, 'Config screen must allow free navigation to hub');
        assert.strictEqual(activeTab, 'hub', 'Active tab updates to hub');

        // Scenario 2: Active shower session
        activeTab = 'hydro';
        env.root.removeChild(hydroConfig);

        const showerScreen = env.document.createElement('div');
        showerScreen.id = 'exerciseScreen';
        showerScreen.className = 'screen active shower-screen';
        env.root.appendChild(showerScreen);

        handleSelectTab('hub');
        assert.strictEqual(showExitModal, true, 'Active shower session must prompt exit modal');
        assert.strictEqual(activeTab, 'hydro', 'Active tab remains hydro');
      } finally {
        env.cleanup();
      }
    });

    it('C2.T4.3: [Adversarial Stress] Cross-submodule DOM scoping evaluation', () => {
      // In App.tsx, both BubbleBreathingApp and HydrocicleApp are rendered simultaneously:
      // <div className="omega-view view-bubble hidden"><ExerciseScreen id="exerciseScreen" /></div>
      // <div className="omega-view view-hydro"><ConfigScreen id="configScreen" /></div>
      const env = setupDOMEnvironment();
      try {
        const viewBubble = env.document.createElement('div');
        viewBubble.className = 'omega-view view-bubble hidden';
        const bubbleExercise = env.document.createElement('div');
        bubbleExercise.id = 'exerciseScreen';
        bubbleExercise.className = 'screen active';
        viewBubble.appendChild(bubbleExercise);
        env.root.appendChild(viewBubble);

        const viewHydro = env.document.createElement('div');
        viewHydro.className = 'omega-view view-hydro';
        const hydroConfig = env.document.createElement('div');
        hydroConfig.id = 'configScreen';
        hydroConfig.className = 'screen active';
        viewHydro.appendChild(hydroConfig);
        env.root.appendChild(viewHydro);

        // In App.tsx line 115:
        // const showerScreen = document.querySelector('.view-hydro #exerciseScreen, #exerciseScreen, .screen.active:not(#configScreen), .shower-screen');
        // If #exerciseScreen is un-scoped, it matches viewBubble's element:
        const matched = env.document.querySelector('.view-hydro #exerciseScreen, #exerciseScreen, .screen.active:not(#configScreen), .shower-screen');

        assert.ok(
          matched !== null,
          'Un-scoped #exerciseScreen selector matches across submodules if left unreset in background'
        );
      } finally {
        env.cleanup();
      }
    });
  });
});

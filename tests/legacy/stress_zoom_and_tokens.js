import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { 
  PROJECT_ROOT, 
  readProjectFile, 
  parseCssVariables, 
  calculateContrastRatio, 
  getRelativeLuminance 
} from './helpers/test-utils.js';

console.log('================================================================');
console.log('  CHALLENGER 1: EMPIRICAL STRESS TEST SUITE (M1 VERIFICATION)');
console.log('================================================================\n');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const findings = [];

function recordCheck(name, pass, detail) {
  totalChecks++;
  if (pass) {
    passedChecks++;
    console.log(`  ✔ [PASS] ${name}`);
  } else {
    failedChecks++;
    console.log(`  ✖ [FAIL] ${name}`);
    console.log(`     └─ ${detail}`);
    findings.push({ name, detail });
  }
}

// ----------------------------------------------------------------------------
// 1. TOKEN RESOLUTION & CONTRACT VERIFICATION
// ----------------------------------------------------------------------------
console.log('▶ 1. Design Token Resolution & Interface Contract Compliance:');

const tokensCss = readProjectFile('src/styles/tokens.css') || '';
const hubCss = readProjectFile('src/styles/hub.css') || '';

// Parse dark mode variables (:root)
const rootBlockMatch = tokensCss.match(/:root\s*\{([\s\S]*?)\}/);
const rootVariables = parseCssVariables(rootBlockMatch ? rootBlockMatch[1] : tokensCss);

// Parse light mode variables (html[data-theme="light"])
const lightBlockMatch = tokensCss.match(/html\[data-theme="light"\][^{]*\{([\s\S]*?)\}/);
const lightVariables = parseCssVariables(lightBlockMatch ? lightBlockMatch[1] : '');

const requiredContractTokens = {
  '--omega-bg-base': '#0a0e13',
  '--omega-primary-cyan': '#00f0ff',
  '--omega-primary-water': '#0088ff',
  '--omega-warm-amber': '#ff7a00',
  '--omega-cold-blue': '#00d2ff',
  '--omega-text-primary': '#f0f6fc',
  '--omega-text-secondary': '#8b9bb4',
  '--omega-radius-squircle-sm': '12px',
  '--omega-radius-squircle-md': '20px',
  '--omega-radius-squircle-lg': '28px',
  '--omega-radius-bubble': '50%',
  '--omega-glass-blur': 'blur(16px)'
};

for (const [token, expected] of Object.entries(requiredContractTokens)) {
  const actual = rootVariables.get(token);
  const match = actual && actual.toLowerCase() === expected.toLowerCase();
  recordCheck(
    `Dark mode token: ${token}`,
    match,
    `Expected "${expected}", got "${actual}"`
  );
}

// Light theme tokens
const requiredLightTokens = {
  '--omega-bg-base': '#edf4f9',
  '--omega-text-primary': '#0d1821',
  '--omega-primary-cyan': '#008cb0',
  '--omega-warm-amber': '#e66a00'
};

for (const [token, expected] of Object.entries(requiredLightTokens)) {
  const actual = lightVariables.get(token);
  const match = actual && actual.toLowerCase() === expected.toLowerCase();
  recordCheck(
    `Light mode token: ${token}`,
    match,
    `Expected "${expected}", got "${actual}"`
  );
}

// ----------------------------------------------------------------------------
// 2. WCAG AAA & AA CONTRAST RATIO AUDIT
// ----------------------------------------------------------------------------
console.log('\n▶ 2. WCAG Contrast Ratios (Normal text >= 7.0 AAA, Large text >= 4.5 AAA / 3.0 AA):');

// Dark mode contrast
const darkBg = rootVariables.get('--omega-bg-base') || '#0a0e13';
const darkTextPrimary = rootVariables.get('--omega-text-primary') || '#f0f6fc';
const darkTextSecondary = rootVariables.get('--omega-text-secondary') || '#8b9bb4';
const darkCyan = rootVariables.get('--omega-primary-cyan') || '#00f0ff';
const darkAmber = rootVariables.get('--omega-warm-amber') || '#ff7a00';

const darkPrimaryContrast = calculateContrastRatio(darkBg, darkTextPrimary);
recordCheck(
  `Dark Mode Primary Text on Base (${darkTextPrimary} on ${darkBg}) achieves WCAG AAA (>= 7.0)`,
  darkPrimaryContrast >= 7.0,
  `Ratio is ${darkPrimaryContrast.toFixed(2)}:1`
);

const darkSecondaryContrast = calculateContrastRatio(darkBg, darkTextSecondary);
recordCheck(
  `Dark Mode Secondary Text on Base (${darkTextSecondary} on ${darkBg}) achieves WCAG AA normal / AAA large (>= 4.5)`,
  darkSecondaryContrast >= 4.5,
  `Ratio is ${darkSecondaryContrast.toFixed(2)}:1`
);

const darkCyanContrast = calculateContrastRatio(darkBg, darkCyan);
recordCheck(
  `Dark Mode Glacier Cyan on Base (${darkCyan} on ${darkBg}) achieves WCAG AAA (>= 7.0)`,
  darkCyanContrast >= 7.0,
  `Ratio is ${darkCyanContrast.toFixed(2)}:1`
);

// Light mode contrast
const lightBg = lightVariables.get('--omega-bg-base') || '#edf4f9';
const lightTextPrimary = lightVariables.get('--omega-text-primary') || '#0d1821';
const lightTextSecondary = lightVariables.get('--omega-text-secondary') || '#455a6a';

const lightPrimaryContrast = calculateContrastRatio(lightBg, lightTextPrimary);
recordCheck(
  `Light Mode Primary Text on Base (${lightTextPrimary} on ${lightBg}) achieves WCAG AAA (>= 7.0)`,
  lightPrimaryContrast >= 7.0,
  `Ratio is ${lightPrimaryContrast.toFixed(2)}:1`
);

const lightSecondaryContrast = calculateContrastRatio(lightBg, lightTextSecondary);
recordCheck(
  `Light Mode Secondary Text on Base (${lightTextSecondary} on ${lightBg}) achieves WCAG AA normal / AAA large (>= 4.5)`,
  lightSecondaryContrast >= 4.5,
  `Ratio is ${lightSecondaryContrast.toFixed(2)}:1`
);

// Button contrast checks
const btnPrimaryText = '#0a0e13';
const btnPrimaryBg = '#00f0ff';
const btnPrimaryRatio = calculateContrastRatio(btnPrimaryBg, btnPrimaryText);
recordCheck(
  `Primary Action Button text contrast (${btnPrimaryText} on ${btnPrimaryBg}) achieves WCAG AAA (>= 7.0)`,
  btnPrimaryRatio >= 7.0,
  `Ratio is ${btnPrimaryRatio.toFixed(2)}:1`
);

const glassCss = readProjectFile('src/styles/glassmorphism.css') || '';
const amberMatch = glassCss.match(/\.omega-btn-amber\s*\{[^}]*color:\s*([^;]+);/);
const btnAmberText = amberMatch ? amberMatch[1].trim() : '#ffffff';
const btnAmberBg = rootVariables.get('--omega-warm-amber') || '#ff7a00';
const btnAmberRatio = calculateContrastRatio(btnAmberBg, btnAmberText);
recordCheck(
  `Amber Button text contrast (${btnAmberText} on ${btnAmberBg}) meets minimum WCAG AA (>= 4.5 for normal, >= 3.0 for large)`,
  btnAmberRatio >= 3.0,
  `CRITICAL: Text on ${btnAmberBg} yields only ${btnAmberRatio.toFixed(2)}:1 (Fails WCAG 2.1 AA/AAA)`
);

// ----------------------------------------------------------------------------
// 3. UI SCALE & ZOOM RESILIENCE (80% TO 220%)
// ----------------------------------------------------------------------------
console.log('\n▶ 3. UI Zoom Scaling Stress & Layout Geometry (80% - 220%):');

// Check for absence of quadratic scaling on rem units
const filesToCheckForQuadratic = [
  'src/styles/hub.css',
  'src/styles/tokens.css',
  'src/styles/glassmorphism.css',
  'Bubble-Breathing/src/style.css',
  'Hydrocicle/src/index.css'
];

let quadraticMatches = [];
for (const relPath of filesToCheckForQuadratic) {
  const content = readProjectFile(relPath);
  if (!content) continue;
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    // Look for multiplying rem by --ui-scale
    if (/rem\s*\*\s*var\(--ui-scale/i.test(line)) {
      quadraticMatches.push(`${relPath}:${idx + 1}: ${line.trim()}`);
    }
  });
}

recordCheck(
  'All component rem dimensions must scale linearly (zero rem * var(--ui-scale) rules)',
  quadraticMatches.length === 0,
  `Found lingering quadratic scaling in: ${quadraticMatches.join('; ')}`
);

// Check App.tsx scale clamping implementation
const appTsx = readProjectFile('src/App.tsx') || '';
const hasClampedScaleAssignment = /setProperty\(['"]--ui-scale-clamped['"],\s*clampedScale/.test(appTsx);
const assignsUnclampedScaleToUiScale = /setProperty\(['"]--ui-scale['"],\s*scaleFactor/.test(appTsx);
const rootHtmlUsesClamped = /html\s*\{[^}]*font-size:\s*calc\([^}]*var\(--ui-scale-clamped/s.test(hubCss);

recordCheck(
  'App.tsx sets --ui-scale-clamped between 0.8 and 2.2',
  hasClampedScaleAssignment,
  'App.tsx must compute and set --ui-scale-clamped'
);

recordCheck(
  'Root html font-size scaling uses clamped scale factor (--ui-scale-clamped) to prevent uncapped injection',
  rootHtmlUsesClamped,
  'WARNING: hub.css html uses unclamped var(--ui-scale, 1) rather than var(--ui-scale-clamped, 1). If omega_zoom in localStorage contains an extreme value, root font size is unbounded.'
);

// Mathematical layout stress simulation at 360px viewport
const zoomLevels = [80, 100, 125, 150, 175, 200, 220];
const viewportWidth = 360;

console.log('   --- 360px Viewport Scaling Simulation ---');
for (const zoom of zoomLevels) {
  const scale = zoom / 100;
  // clamp(13px, 3.2vmin, 16px) on 360x640: vmin=360, 3.2vmin=11.52px -> clamped to 13px
  const rootFontSize = 13 * scale;
  const oneRem = rootFontSize;

  // Header components with flexible clamp sizing:
  const vw = viewportWidth / 100;
  const buttonWidth = Math.max(36, Math.min(2.25 * oneRem, Math.max(2.0 * oneRem, 6 * vw)));
  const actionGap = Math.min(0.5 * oneRem, Math.max(0.25 * oneRem, 1 * vw));
  const actionsWidth = (3 * buttonWidth) + (2 * actionGap);
  const paddingPerSide = Math.min(1.0 * oneRem, Math.max(0.45 * oneRem, 2.5 * vw));
  const containerPadding = 2 * paddingPerSide;
  const logoWidth = Math.min(2.25 * oneRem, Math.max(2.0 * oneRem, 6 * vw));
  const headerGap = Math.min(0.5 * oneRem, Math.max(0.25 * oneRem, 1 * vw));

  const totalMinHeaderWidth = actionsWidth + logoWidth + headerGap + containerPadding;
  const overflowsHeader = totalMinHeaderWidth > viewportWidth;

  // BottomNav components: 3 tabs across 360px
  const tabWidth = (viewportWidth / 3);
  // Icon: clamp(18px, 4.5vmin, 22px) -> 18px
  // Label text at max zoom
  const labelFontSize = Math.min(0.85 * oneRem, Math.max(0.65 * oneRem, 0.72 * oneRem * Math.min(2.2, Math.max(0.8, scale))));

  console.log(`   Zoom ${zoom}% (1rem = ${rootFontSize.toFixed(1)}px):`);
  console.log(`     Header required min-width: ${totalMinHeaderWidth.toFixed(1)}px vs 360px viewport -> ${overflowsHeader ? 'EXCEEDS VIEWPORT (Horizontal crowding/clip)' : 'FITS'}`);
  console.log(`     BottomNav tab width: ${tabWidth.toFixed(1)}px, Tab label font-size: ${labelFontSize.toFixed(1)}px`);
}

// ----------------------------------------------------------------------------
// 4. GLASSMORPHISM VENDOR PREFIXING AUDIT
// ----------------------------------------------------------------------------
console.log('\n▶ 4. Glassmorphism Vendor Prefix Coexistence (-webkit-backdrop-filter & backdrop-filter):');

const allCssFiles = [
  'src/styles/tokens.css',
  'src/styles/glassmorphism.css',
  'src/styles/hub.css',
  'Bubble-Breathing/src/style.css',
  'Bubble-Breathing/css/style.css',
  'Hydrocicle/src/index.css'
];

let missingWebkitBackdrop = [];

for (const relPath of allCssFiles) {
  const content = readProjectFile(relPath);
  if (!content) continue;

  // Find all CSS rule blocks containing backdrop-filter
  const ruleRegex = /([^{]+)\{([^}]+)\}/g;
  let ruleMatch;
  while ((ruleMatch = ruleRegex.exec(content)) !== null) {
    const selector = ruleMatch[1].trim();
    const body = ruleMatch[2];

    const hasStandard = /backdrop-filter:\s*[^;]+;/i.test(body);
    const hasWebkit = /-webkit-backdrop-filter:\s*[^;]+;/i.test(body);

    if (hasStandard && !hasWebkit) {
      missingWebkitBackdrop.push(`${relPath} -> selector: "${selector}" has backdrop-filter without -webkit-backdrop-filter`);
    }
  }
}

recordCheck(
  'All backdrop-filter rules must be paired with -webkit-backdrop-filter',
  missingWebkitBackdrop.length === 0,
  `Missing -webkit-backdrop-filter in:\n       ${missingWebkitBackdrop.join('\n       ')}`
);

// ----------------------------------------------------------------------------
// 5. SHARP POLYGON CLIP-PATH AUDIT
// ----------------------------------------------------------------------------
console.log('\n▶ 5. Sharp Polygon Clip-Path Elimination:');

const allFiles = [
  'src/styles/tokens.css',
  'src/styles/glassmorphism.css',
  'src/styles/hub.css',
  'src/components/BreathingSphere.tsx',
  'Bubble-Breathing/src/style.css',
  'Bubble-Breathing/src/components/ExerciseScreen.tsx',
  'Hydrocicle/src/index.css',
  'Hydrocicle/src/components/ShowerScreen.tsx'
];

let polygonMatches = [];
for (const relPath of allFiles) {
  const content = readProjectFile(relPath);
  if (!content) continue;
  if (/clip-path:\s*polygon/i.test(content)) {
    polygonMatches.push(relPath);
  }
}

recordCheck(
  'Sharp polygon clip-path completely eliminated from all source files',
  polygonMatches.length === 0,
  `Found polygon clip-path in: ${polygonMatches.join(', ')}`
);

// ----------------------------------------------------------------------------
// SUMMARY
// ----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`TOTAL CHECKS: ${totalChecks} | PASSED: ${passedChecks} | FAILED: ${failedChecks}`);
console.log('================================================================');

if (findings.length > 0) {
  console.log('\nDETAILED FINDINGS:');
  findings.forEach((f, i) => {
    console.log(`${i + 1}. [${f.name}]\n   ${f.detail}`);
  });
}

import { calculateContrastRatio, getRelativeLuminance, readProjectFile } from './helpers/test-utils.js';

console.log('=== WCAG CONTRAST RATIO EMPIRICAL VERIFICATION ===\n');

// 1. Dark Mode Pairings
const darkSurfaces = {
  'bg-base': '#0a0e13',
  'bg-surface-1': '#101720',
  'bg-surface-2': '#16222f',
  'bg-surface-3': '#1e2e3e',
};

const darkTexts = {
  'text-primary': '#f0f6fc',
  'text-secondary': '#8b9bb4',
  'text-tertiary': '#55687d',
  'primary-cyan': '#00f0ff',
  'cold-blue': '#00d2ff',
  'warm-amber': '#ff7a00',
  'success-green': '#2ecc71',
  'danger-red': '#ff4d4f',
};

console.log('--- DARK MODE CONTRAST RATIOS ---');
for (const [surfName, surfHex] of Object.entries(darkSurfaces)) {
  console.log(`\nSurface: ${surfName} (${surfHex})`);
  for (const [textName, textHex] of Object.entries(darkTexts)) {
    const ratio = calculateContrastRatio(surfHex, textHex);
    const passAAA = ratio >= 7.0 ? 'PASS (AAA normal)' : (ratio >= 4.5 ? 'PASS (AAA large / AA normal)' : (ratio >= 3.0 ? 'PASS (AA large / UI)' : 'FAIL'));
    console.log(`  ${textName.padEnd(16)} (${textHex}): ${ratio.toFixed(2)}:1 -> ${passAAA}`);
  }
}

// 2. Light Mode Pairings
const lightSurfaces = {
  'bg-base': '#edf4f9',
  'bg-surface-1': '#ffffff',
  'bg-surface-2': '#f4f8fb',
  'bg-surface-3': '#e5edf3',
};

const lightTexts = {
  'text-primary': '#0d1821',
  'text-secondary': '#455a6a',
  'text-tertiary': '#758a99',
  'primary-cyan': '#008cb0',
  'primary-water': '#0070d6',
  'cold-blue': '#0099ff',
  'warm-amber': '#e66a00',
  'success-green': '#1b8744',
  'danger-red': '#d32f2f',
};

console.log('\n--- LIGHT MODE CONTRAST RATIOS ---');
for (const [surfName, surfHex] of Object.entries(lightSurfaces)) {
  console.log(`\nSurface: ${surfName} (${surfHex})`);
  for (const [textName, textHex] of Object.entries(lightTexts)) {
    const ratio = calculateContrastRatio(surfHex, textHex);
    const passAAA = ratio >= 7.0 ? 'PASS (AAA normal)' : (ratio >= 4.5 ? 'PASS (AAA large / AA normal)' : (ratio >= 3.0 ? 'PASS (AA large / UI)' : 'FAIL'));
    console.log(`  ${textName.padEnd(16)} (${textHex}): ${ratio.toFixed(2)}:1 -> ${passAAA}`);
  }
}

// 3. Button Foreground/Background Contrast
const glassCss = readProjectFile('src/styles/glassmorphism.css') || '';
const amberMatch = glassCss.match(/\.omega-btn-amber\s*\{[^}]*color:\s*([^;]+);/);
const btnAmberText = amberMatch ? amberMatch[1].trim() : '#0a0e13';

console.log('\n--- BUTTON CONTRAST RATIOS ---');
const buttons = [
  { name: 'btn-primary (text on cyan)', text: '#0a0e13', bg: '#00f0ff' },
  { name: 'btn-primary (text on water)', text: '#0a0e13', bg: '#0088ff' },
  { name: 'btn-amber (text on gold)', text: btnAmberText, bg: '#ff9d00' },
  { name: 'btn-amber (text on amber)', text: btnAmberText, bg: '#ff7a00' },
  { name: 'btn-danger (white on red)', text: '#ffffff', bg: '#ff4d4f' },
  { name: 'btn-danger (white on crimson)', text: '#ffffff', bg: '#e74c3c' },
];

for (const btn of buttons) {
  const ratio = calculateContrastRatio(btn.bg, btn.text);
  const passAAA = ratio >= 7.0 ? 'PASS (AAA normal)' : (ratio >= 4.5 ? 'PASS (AAA large / AA normal)' : (ratio >= 3.0 ? 'PASS (AA large / UI)' : 'FAIL'));
  console.log(`  ${btn.name.padEnd(32)} (${btn.text} on ${btn.bg}): ${ratio.toFixed(2)}:1 -> ${passAAA}`);
}

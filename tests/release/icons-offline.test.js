import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { readProjectFile, fileExists, PROJECT_ROOT } from '../helpers/test-utils.js';

function magic(rel) {
  const buf = fs.readFileSync(path.join(PROJECT_ROOT, rel));
  return buf.subarray(0, 8);
}

describe('Release hardening — native icons and offline fonts', () => {
  it('R9. per-target desktop icons exist and reference the builder config', () => {
    const pkg = JSON.parse(readProjectFile('package.json') || '{}');
    assert.ok(fileExists('build/icon.icns'), 'build/icon.icns required for macOS');
    assert.ok(fileExists('build/icons/512x512.png'), 'Linux PNG set required');
    assert.ok(fileExists('build/icon.ico'), 'build/icon.ico required for Windows');
    assert.strictEqual(pkg?.build?.mac?.icon, 'build/icon.icns');
    assert.strictEqual(pkg?.build?.win?.icon, 'build/icon.ico');
    assert.strictEqual(pkg?.build?.linux?.icon, 'build/icons/512x512.png');
    for (const size of [16, 32, 48, 64, 128, 256, 512]) {
      assert.ok(fileExists(`build/icons/${size}x${size}.png`), `Linux ${size}px icon missing`);
    }
  });

  it('R10. icon binaries carry genuine native magic bytes', () => {
    // ICNS header: 'icns' magic; ICO header: 00 00 01 00.
    assert.strictEqual(magic('build/icon.icns').subarray(0, 4).toString('ascii'), 'icns');
    const ico = magic('build/icon.ico');
    assert.deepStrictEqual([ico[0], ico[1], ico[2], ico[3]], [0, 0, 1, 0]);
    const png = magic('build/icons/512x512.png');
    assert.deepStrictEqual([...png.subarray(0, 4)], [0x89, 0x50, 0x4e, 0x47]);
  });

  it('R11. Android launcher icons cover every density', () => {
    for (const density of ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi']) {
      assert.ok(
        fileExists(`android/app/src/main/res/mipmap-${density}/ic_launcher.png`),
        `mipmap-${density} launcher missing`,
      );
    }
  });

  it('R12. fonts are bundled locally — no remote font dependency', () => {
    const html = readProjectFile('index.html') || '';
    assert.doesNotMatch(html, /fonts\.googleapis\.com/, 'index.html must not load remote fonts');
    assert.doesNotMatch(html, /fonts\.gstatic\.com/, 'index.html must not reference remote font files');
    const fontsCss = readProjectFile('src/styles/fonts.css') || '';
    assert.match(fontsCss, /@font-face/, 'bundled @font-face declarations required');
    assert.match(fontsCss, /font-display:\s*swap/, 'font-display: swap required for deterministic fallback');
    assert.ok(fileExists('src/assets/fonts/outfit-latin.woff2'), 'latin woff2 must be bundled');
    assert.ok(fileExists('src/assets/fonts/outfit-latin-ext.woff2'), 'latin-ext woff2 must be bundled');
    const app = readProjectFile('src/App.tsx') || '';
    assert.match(app, /styles\/fonts\.css/, 'App must import the bundled fonts stylesheet');
    // Deterministic fallback stack survives even if woff2 files are blocked.
    const tokens = readProjectFile('src/styles/tokens.css') || '';
    assert.match(tokens, /--omega-font-family:.*sans-serif/, 'system fallback stack must remain defined');
  });
});

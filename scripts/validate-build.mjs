#!/usr/bin/env node
/**
 * Omega build/packaging validator.
 * Fails (exit 1) when any required production target or config is missing.
 * Run: pnpm run validate
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const errors = [];
const warnings = [];

function read(rel) {
  try {
    return fs.readFileSync(path.join(ROOT, rel), 'utf8');
  } catch {
    return null;
  }
}
function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}
function check(cond, msg) {
  if (!cond) errors.push(msg);
}
function warn(cond, msg) {
  if (!cond) warnings.push(msg);
}

// --- package.json / electron-builder ---
const pkgRaw = read('package.json');
check(pkgRaw, 'package.json is missing');
let pkg = {};
try {
  pkg = JSON.parse(pkgRaw ?? '{}');
} catch {
  errors.push('package.json is not valid JSON');
}
check(pkg?.build?.appId === 'com.marodriguezd.omega', 'electron-builder appId must be com.marodriguezd.omega');
check(pkg?.build?.productName === 'Omega', 'electron-builder productName must be Omega');
check(pkg?.main === 'electron/main.cjs', 'package.json main must be electron/main.cjs');
const macTargets = JSON.stringify(pkg?.build?.mac ?? {});
const winTargets = JSON.stringify(pkg?.build?.win ?? {});
const linuxTargets = JSON.stringify(pkg?.build?.linux ?? {});
check(/dmg/i.test(macTargets), 'mac target must include dmg');
check(/msi/i.test(winTargets), 'win target must include msi');
check(/AppImage/i.test(linuxTargets), 'linux target must include AppImage');
for (const s of ['dist:mac', 'dist:win', 'dist:linux', 'electron:dev', 'electron:build', 'android:sync', 'android:build', 'validate', 'icons', 'release:meta', 'checksums', 'test:platform', 'test:release']) {
  check(pkg?.scripts?.[s], `package.json script "${s}" is missing`);
}
// Release metadata: repository / homepage / license / version source of truth
check(pkg?.license === 'MIT', 'package.json license must be MIT');
check(pkg?.repository?.url === 'https://github.com/marodriguezd/Omega.git', 'package.json repository must point at marodriguezd/Omega');
check(pkg?.homepage === 'https://github.com/marodriguezd/Omega', 'package.json homepage must be set');
check(/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(pkg?.version ?? ''), 'package.json version must be semver (single source of truth)');
check(pkg?.build?.win?.executableName === 'Omega', 'win executableName must be Omega');
check(pkg?.build?.linux?.executableName === 'Omega', 'linux executableName must be Omega');
// Artifact naming must derive from ${version} on every target
for (const section of ['mac', 'win', 'linux', 'dmg', 'msi']) {
  const name = pkg?.build?.[section]?.artifactName ?? '';
  check(/Omega-\$\{version\}/.test(name), `build.${section}.artifactName must be Omega-\${version}.\${ext}`);
}
// Native icons per target (generated from public/assets/icon.png)
check(exists('build/icon.png'), 'build/icon.png is missing (authoritative 512x512 copy)');
check(exists('build/icon.icns'), 'build/icon.icns is missing for macOS (run pnpm run icons)');
check(exists('build/icon.ico'), 'build/icon.ico is missing for Windows (run pnpm run icons)');
check(exists('build/icons/512x512.png'), 'build/icons/512x512.png is missing for Linux (run pnpm run icons)');
check((pkg?.build?.mac?.icon ?? '') === 'build/icon.icns', 'mac icon must be build/icon.icns');
check((pkg?.build?.win?.icon ?? '') === 'build/icon.ico', 'win icon must be build/icon.ico');
check((pkg?.build?.linux?.icon ?? '') === 'build/icons/512x512.png', 'linux icon must be build/icons/512x512.png');
check(exists('electron/main.cjs'), 'electron/main.cjs is missing');
check(exists('electron/preload.cjs'), 'electron/preload.cjs is missing');

// --- Electron security ---
const main = read('electron/main.cjs') ?? '';
check(/contextIsolation:\s*true/.test(main), 'electron main must set contextIsolation: true');
check(/nodeIntegration:\s*false/.test(main), 'electron main must set nodeIntegration: false');
check(/sandbox:\s*true/.test(main), 'electron main must set sandbox: true');
check(/webviewTag:\s*false/.test(main), 'electron main must disable webviewTag');
check(/allowRunningInsecureContent:\s*false/.test(main), 'electron main must set allowRunningInsecureContent: false');
check(/typeof enable !== ['"]boolean['"]/.test(main), 'electron main must validate IPC boolean payload');
check(/setWindowOpenHandler/.test(main), 'electron main must restrict new windows via setWindowOpenHandler');
check(/shell\.openExternal/.test(main), 'electron main must open external https links via shell.openExternal');
check(/will-navigate/.test(main), 'electron main must guard will-navigate');
check(/setPermissionRequestHandler/.test(main), 'electron main must deny permission requests');
check(/app\.isPackaged/.test(main), 'electron main must gate dev behavior on app.isPackaged');
const preload = read('electron/preload.cjs') ?? '';
check(/contextBridge\.exposeInMainWorld/.test(preload), 'preload must use contextBridge.exposeInMainWorld');
check(/electronAPI/.test(preload), 'preload must expose window.electronAPI allowlist');
check(/setKeepAwake/.test(preload), 'preload must expose setKeepAwake');
check(!/exposeInMainWorld\(\s*['"]ipc/i.test(preload), 'preload must not expose raw ipcRenderer');
check(!/ipcRenderer\s*[:,]\s*ipcRenderer/.test(preload), 'preload must not expose raw ipcRenderer object');
check(/typeof value !== ['"]boolean['"]|typeof enable !== ['"]boolean['"]/.test(preload), 'preload must validate boolean payload');
check(!/require\(['"]electron['"]\)\s*;?\s*\n.*expose.*require/i.test(preload), 'preload must not leak require() to renderer');

// --- Capacitor Android ---
const cap = read('capacitor.config.ts') ?? '';
check(/appId:\s*['"]com\.marodriguezd\.omega['"]/.test(cap), 'capacitor appId must be com.marodriguezd.omega');
check(/webDir:\s*['"]dist['"]/.test(cap), 'capacitor webDir must be dist');
const manifest = read('android/app/src/main/AndroidManifest.xml') ?? '';
check(/WAKE_LOCK/.test(manifest), 'AndroidManifest must declare WAKE_LOCK');
check(/VIBRATE/.test(manifest), 'AndroidManifest must declare VIBRATE');
check(/INTERNET/.test(manifest), 'AndroidManifest must declare INTERNET');
// Android launcher icons at every density
for (const density of ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi']) {
  check(
    exists(`android/app/src/main/res/mipmap-${density}/ic_launcher.png`),
    `Android mipmap-${density}/ic_launcher.png is missing`,
  );
}

// --- Platform abstraction ---
for (const f of [
  'src/platform/index.ts',
  'src/platform/types.ts',
  'src/platform/runtime.ts',
  'src/platform/storage.ts',
  'src/platform/keepAwake.ts',
  'src/platform/haptics.ts',
  'src/platform/lifecycle.ts',
]) {
  check(exists(f), `${f} is missing`);
}
const index = read('src/platform/index.ts') ?? '';
for (const sym of ['enableKeepAwake', 'disableKeepAwake', 'triggerHaptic', 'registerBackButtonHandler', 'platformStorage', 'getRuntimeKind', 'getPlatformInfo']) {
  check(index.includes(sym), `src/platform/index.ts must export ${sym}`);
}
const native = read('src/services/nativeService.ts') ?? '';
check(/triggerHaptic/.test(native), 'nativeService must preserve triggerHaptic export');

// --- Vite base for file:// ---
const vite = read('vite.config.ts') ?? '';
check(/base:\s*['"]\.\/['"]/.test(vite), 'vite base must be "./" for Electron file://');

// --- dist (warning only; build may not have run yet) ---
warn(exists('dist/index.html'), 'dist/index.html not found — run pnpm run build first');

console.log('\nOmega build validation');
console.log('----------------------');
if (warnings.length > 0) {
  console.log('Warnings:');
  for (const w of warnings) console.log(`  ~ ${w}`);
}
if (errors.length > 0) {
  console.log('Errors:');
  for (const e of errors) console.log(`  ✖ ${e}`);
  console.log(`\nValidation FAILED (${errors.length} error(s)).`);
  process.exit(1);
}
console.log('All required targets and configurations present. Validation PASSED.');

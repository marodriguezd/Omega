import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { readProjectFile, fileExists, PROJECT_ROOT } from '../helpers/test-utils.js';

describe('Release hardening — Electron production security', () => {
  const main = readProjectFile('electron/main.cjs') || '';
  const preload = readProjectFile('electron/preload.cjs') || '';

  it('R5. BrowserWindow keeps secure defaults and no Node leakage', () => {
    assert.match(main, /contextIsolation:\s*true/);
    assert.match(main, /nodeIntegration:\s*false/);
    assert.match(main, /sandbox:\s*true/);
    assert.match(main, /webviewTag:\s*false/);
    assert.match(main, /allowRunningInsecureContent:\s*false/);
  });

  it('R6. IPC stays allowlisted with strict boolean validation', () => {
    assert.match(main, /omega:set-keep-awake/, 'canonical channel must be defined');
    assert.match(main, /typeof enable !== ['"]boolean['"]/, 'main must reject non-boolean payloads');
    assert.match(preload, /contextBridge\.exposeInMainWorld/, 'preload must use contextBridge');
    assert.match(preload, /typeof (value|enable) !== ['"]boolean['"]/, 'preload must validate booleans');
    assert.doesNotMatch(preload, /exposeInMainWorld\(\s*['"]ipc/i, 'no raw ipc exposure');
  });

  it('R7. navigation is locked to the bundled app', () => {
    assert.match(main, /setWindowOpenHandler/, 'popups must be intercepted');
    assert.match(main, /shell\.openExternal/, 'external https must open in OS browser');
    assert.match(main, /will-navigate/, 'in-page navigation must be guarded');
    assert.match(main, /setPermissionRequestHandler/, 'permissions must be denied');
    assert.match(main, /app\.isPackaged/, 'dev behavior must be gated on packaged state');
  });

  it('R8. no dev-server URL can leak into packaged production', () => {
    // loadURL with a dev server must only happen when unpackaged.
    const devLoad = [...main.matchAll(/loadURL\(([^)]+)\)/g)].map((m) => m[0]);
    assert.ok(devLoad.length > 0, 'expected dev loadURL branches to exist');
    assert.match(main, /!app\.isPackaged[\s\S]*loadURL/, 'dev loadURL must sit behind !app.isPackaged');
    assert.match(main, /loadFile\(path\.join\(__dirname,\s*['"]\.\.\/dist\/index\.html['"]\)\)/, 'production must load the bundled file');
  });
});

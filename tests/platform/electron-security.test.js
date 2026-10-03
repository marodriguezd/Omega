import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readProjectFile } from '../helpers/test-utils.js';

describe('Electron security (main + preload)', () => {
  it('P8. Main process uses secure BrowserWindow defaults', () => {
    const main = readProjectFile('electron/main.cjs') || '';
    assert.match(main, /contextIsolation:\s*true/, 'main must set contextIsolation: true');
    assert.match(main, /nodeIntegration:\s*false/, 'main must set nodeIntegration: false');
    assert.match(main, /sandbox:\s*true/, 'main must set sandbox: true');
    assert.match(main, /webviewTag:\s*false/, 'main must disable webviewTag');
  });

  it('P9. Main process validates IPC payloads and allowlists channels', () => {
    const main = readProjectFile('electron/main.cjs') || '';
    assert.match(main, /typeof enable !== ['"]boolean['"]/, 'main must reject non-boolean IPC payloads');
    assert.match(main, /omega:set-keep-awake/, 'main must define a canonical allowlisted channel');
    assert.match(main, /powerSaveBlocker/, 'main must drive keep-awake via powerSaveBlocker');
  });

  it('P10. Preload exposes a minimal allowlisted bridge with no Node leakage', () => {
    const preload = readProjectFile('electron/preload.cjs') || '';
    assert.match(preload, /contextBridge\.exposeInMainWorld/, 'preload must use contextBridge');
    assert.match(preload, /electronAPI/, 'preload must expose electronAPI');
    assert.match(preload, /setKeepAwake/, 'preload must expose setKeepAwake');
    assert.match(preload, /typeof (value|enable) !== ['"]boolean['"]/, 'preload must validate boolean payload');
    assert.doesNotMatch(preload, /exposeInMainWorld\(\s*['"]ipc/i, 'preload must not expose raw ipc channels');
  });
});

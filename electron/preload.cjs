/**
 * Omega Electron preload — minimal allowlisted bridge.
 *
 * Exposes ONLY `window.electronAPI` with three read-only members:
 *   - isElectron: true (presence flag for runtime detection)
 *   - platform: Node process.platform string (darwin|win32|linux)
 *   - setKeepAwake(enable: boolean): strict boolean validation, no coercion
 *
 * No Node.js, no ipcRenderer, no arbitrary IPC is exposed to the renderer.
 */
const { contextBridge, ipcRenderer } = require('electron');

const KEEP_AWAKE_CHANNEL = 'omega:set-keep-awake';

function assertBoolean(value) {
  if (typeof value !== 'boolean') {
    throw new TypeError('electronAPI.setKeepAwake expects a boolean');
  }
}

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  setKeepAwake: (enable) => {
    assertBoolean(enable);
    return ipcRenderer.invoke(KEEP_AWAKE_CHANNEL, enable);
  },
});

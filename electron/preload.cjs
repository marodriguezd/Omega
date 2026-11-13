// ContextBridge exposing isolated keep-awake API to renderer.
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

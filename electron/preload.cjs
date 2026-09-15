const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  setKeepAwake: (enable) => ipcRenderer.invoke('set-keep-awake', Boolean(enable)),
});

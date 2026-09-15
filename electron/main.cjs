const { app, BrowserWindow, ipcMain, powerSaveBlocker, Menu } = require('electron');
const path = require('path');

let mainWindow = null;
let keepAwakeBlockerId = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 768,
    minHeight: 520,
    backgroundColor: '#0a0e13',
    title: 'Omega — Unified Wellbeing Platform',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Remove default application menu for immersive glassmorphism experience
  Menu.setApplicationMenu(null);

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else if (!app.isPackaged && process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (keepAwakeBlockerId !== null) {
      if (powerSaveBlocker.isStarted(keepAwakeBlockerId)) {
        powerSaveBlocker.stop(keepAwakeBlockerId);
      }
      keepAwakeBlockerId = null;
    }
  });
}

// Handler function for KeepAwake using Electron powerSaveBlocker
async function handleSetKeepAwake(_event, enable) {
  try {
    if (enable) {
      if (keepAwakeBlockerId === null || !powerSaveBlocker.isStarted(keepAwakeBlockerId)) {
        keepAwakeBlockerId = powerSaveBlocker.start('prevent-display-sleep');
      }
      return true;
    } else {
      if (keepAwakeBlockerId !== null) {
        if (powerSaveBlocker.isStarted(keepAwakeBlockerId)) {
          powerSaveBlocker.stop(keepAwakeBlockerId);
        }
        keepAwakeBlockerId = null;
      }
      return false;
    }
  } catch (err) {
    console.error('Failed to toggle powerSaveBlocker:', err);
    return false;
  }
}

// Support both 'set-keep-awake' and 'power:keep-awake' IPC channels
ipcMain.handle('set-keep-awake', handleSetKeepAwake);
ipcMain.handle('power:keep-awake', handleSetKeepAwake);

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', () => {
  if (keepAwakeBlockerId !== null) {
    if (powerSaveBlocker.isStarted(keepAwakeBlockerId)) {
      powerSaveBlocker.stop(keepAwakeBlockerId);
    }
    keepAwakeBlockerId = null;
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

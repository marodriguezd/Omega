// Electron main process configured with sandboxed browser window and restricted IPC.
const { app, BrowserWindow, ipcMain, powerSaveBlocker, Menu, shell, session } = require('electron');
const path = require('path');

let mainWindow = null;
let keepAwakeBlockerId = null;

// Canonical and legacy IPC channel names for keep-awake.
const CHANNEL_KEEP_AWAKE_CANONICAL = 'omega:set-keep-awake';
const CHANNEL_KEEP_AWAKE_ALIASES = ['set-keep-awake', 'power:keep-awake'];

function stopKeepAwakeBlocker() {
  if (keepAwakeBlockerId !== null) {
    try {
      if (powerSaveBlocker.isStarted(keepAwakeBlockerId)) {
        powerSaveBlocker.stop(keepAwakeBlockerId);
      }
    } catch {
      // Safe no-op if blocker is already stopped.
    }
    keepAwakeBlockerId = null;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 768,
    minHeight: 520,
    backgroundColor: '#0a0e13',
    title: 'Omega',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      webviewTag: false,
    },
  });

  Menu.setApplicationMenu(null);

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  const isDev = !app.isPackaged && (devUrl || process.env.NODE_ENV === 'development');
  if (isDev && devUrl) {
    mainWindow.loadURL(devUrl);
  } else if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  lockDownWindow(mainWindow, isDev);

  mainWindow.on('closed', () => {
    mainWindow = null;
    stopKeepAwakeBlocker();
  });
}

// Restrict navigation, popups, and permissions to bundled application.
function lockDownWindow(win, isDev) {
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//.test(url)) {
      shell.openExternal(url).catch(() => {});
    }
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedNavigationTarget(url)) {
      event.preventDefault();
    }
  });

  win.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });

  win.webContents.on('before-input-event', (event, input) => {
    if (!isDev && (input.key === 'F12' || ((input.control || input.meta) && input.shift && input.key.toLowerCase() === 'i'))) {
      event.preventDefault();
    }
  });
}

// Allow local development server and bundled file:// protocol targets only.
function isAllowedNavigationTarget(url) {
  if (url.startsWith('file://')) return true;
  if (/^https?:\/\/localhost(:\d+)?\//.test(url)) return true;
  if (/^https?:\/\/127\.0\.0\.1(:\d+)?\//.test(url)) return true;
  return false;
}

// Validate boolean payload and toggle display sleep blocker.
async function handleSetKeepAwake(_event, enable) {
  if (typeof enable !== 'boolean') {
    throw new TypeError('omega:set-keep-awake expects a boolean payload');
  }
  try {
    if (enable) {
      if (keepAwakeBlockerId === null || !powerSaveBlocker.isStarted(keepAwakeBlockerId)) {
        stopKeepAwakeBlocker();
        keepAwakeBlockerId = powerSaveBlocker.start('prevent-display-sleep');
      }
      return true;
    }
    stopKeepAwakeBlocker();
    return false;
  } catch (err) {
    console.error('Failed to toggle powerSaveBlocker:', err);
    return false;
  }
}

// Register canonical channel and compatibility aliases.
ipcMain.handle(CHANNEL_KEEP_AWAKE_CANONICAL, handleSetKeepAwake);
for (const alias of CHANNEL_KEEP_AWAKE_ALIASES) {
  ipcMain.handle(alias, handleSetKeepAwake);
}

app.whenReady().then(() => {
  // App-wide permission request denial.
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', () => {
  stopKeepAwakeBlocker();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

module.exports = {
  CHANNEL_KEEP_AWAKE_CANONICAL,
  CHANNEL_KEEP_AWAKE_ALIASES,
  isAllowedNavigationTarget,
};

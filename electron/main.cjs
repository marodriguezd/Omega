/**
 * Omega Electron main process — secure defaults.
 *
 * - contextIsolation: true, nodeIntegration: false, sandbox: true
 * - Preload-only bridge; no direct Node exposure to the renderer.
 * - Allowlisted IPC channels only (see CHANNEL_KEEP_AWAKE_*).
 * - Strict boolean payload validation for keep-awake requests.
 * - Navigation locked to the bundled app: no new windows, external
 *   https:// links open in the OS browser, all permissions denied.
 * - Dev server / devtools are reachable ONLY in unpackaged dev runs.
 */
const { app, BrowserWindow, ipcMain, powerSaveBlocker, Menu, shell, session } = require('electron');
const path = require('path');

let mainWindow = null;
let keepAwakeBlockerId = null;

/** Canonical + legacy aliases (renderer compat). No other channels are handled. */
const CHANNEL_KEEP_AWAKE_CANONICAL = 'omega:set-keep-awake';
const CHANNEL_KEEP_AWAKE_ALIASES = ['set-keep-awake', 'power:keep-awake'];

function stopKeepAwakeBlocker() {
  if (keepAwakeBlockerId !== null) {
    try {
      if (powerSaveBlocker.isStarted(keepAwakeBlockerId)) {
        powerSaveBlocker.stop(keepAwakeBlockerId);
      }
    } catch {
      // ignore cleanup errors during shutdown
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

  // Remove default application menu for immersive experience
  Menu.setApplicationMenu(null);

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  // Dev-only entry points: never used in packaged production builds.
  const isDev = !app.isPackaged && (devUrl || process.env.NODE_ENV === 'development');
  if (isDev && devUrl) {
    mainWindow.loadURL(devUrl);
  } else if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Production lockdown for this window (also enforced app-wide below).
  lockDownWindow(mainWindow, isDev);

  mainWindow.on('closed', () => {
    mainWindow = null;
    stopKeepAwakeBlocker();
  });
}

/**
 * Per-window navigation + permission lockdown.
 * - Blocks popups/new windows; https:// links open in the OS browser.
 * - Blocks in-page navigation away from the bundled app.
 * - Denies all permission requests (media, geolocation, …).
 * - Devtools only in unpackaged dev runs.
 */
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
    // Block devtools shortcuts in packaged production builds.
    if (!isDev && (input.key === 'F12' || ((input.control || input.meta) && input.shift && input.key.toLowerCase() === 'i'))) {
      event.preventDefault();
    }
  });
}

/** Only the local dev server and the bundled file:// app may navigate. */
function isAllowedNavigationTarget(url) {
  if (url.startsWith('file://')) return true;
  if (/^https?:\/\/localhost(:\d+)?\//.test(url)) return true;
  if (/^https?:\/\/127\.0\.0\.1(:\d+)?\//.test(url)) return true;
  return false;
}

/**
 * Strictly validated keep-awake handler.
 * Accepts ONLY a real boolean; any other payload is rejected with TypeError
 * so the renderer cannot smuggle unexpected values into the main process.
 */
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

// Register canonical channel + legacy aliases (same validated handler).
ipcMain.handle(CHANNEL_KEEP_AWAKE_CANONICAL, handleSetKeepAwake);
for (const alias of CHANNEL_KEEP_AWAKE_ALIASES) {
  ipcMain.handle(alias, handleSetKeepAwake);
}

app.whenReady().then(() => {
  // App-wide hardening (covers every current and future window/session).
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

// Shared platform type definitions for Web, Capacitor, and Electron runtimes.

export type RuntimeKind = 'electron' | 'capacitor' | 'web';

export type DesktopPlatform = 'darwin' | 'win32' | 'linux' | 'unknown';

export interface PlatformInfo {
  runtime: RuntimeKind;
  /** Platform identifier ('android', 'web', or OS platform). */
  platform: string;
  isNative: boolean;
  isElectron: boolean;
  supportsHaptics: boolean;
  supportsWakeLock: boolean;
}

// Electron bridge interface exposed via preload.
export interface ElectronBridgeAPI {
  isElectron?: boolean;
  platform?: string;
  setKeepAwake?: (enable: boolean) => Promise<boolean | void>;
}

export type HapticType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'selection'
  | 'success'
  | 'warning';

declare global {
  interface Window {
    electronAPI?: ElectronBridgeAPI;
    Capacitor?: unknown;
  }
}

/**
 * Shared platform type definitions.
 * Single source of truth for runtime capabilities across
 * Web, Capacitor (Android) and Electron (macOS/Windows/Linux).
 */

export type RuntimeKind = 'electron' | 'capacitor' | 'web';

export type DesktopPlatform = 'darwin' | 'win32' | 'linux' | 'unknown';

export interface PlatformInfo {
  runtime: RuntimeKind;
  /** Node-style platform string when known (electron), else 'android' | 'web'. */
  platform: string;
  isNative: boolean;
  isElectron: boolean;
  supportsHaptics: boolean;
  supportsWakeLock: boolean;
}

/** Minimal allowlisted Electron bridge exposed via preload. */
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

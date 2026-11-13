// Platform capability facade delegating to ../platform.
// Routes KeepAwake (electronAPI / powerSaveBlocker -> wakeLock) and Haptics.
export type { HapticType } from '../platform/types';
export {
  enableKeepAwake,
  disableKeepAwake,
  triggerHaptic,
  registerBackButtonHandler,
} from '../platform/index';

// Global window declaration for Electron bridge interface.
declare global {
  interface Window {
    electronAPI?: {
      isElectron?: boolean;
      setKeepAwake?: (enable: boolean) => Promise<boolean | void>;
      platform?: string;
    };
    Capacitor?: unknown;
  }
}

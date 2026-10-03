/**
 * Native capability facade (backward-compatible).
 *
 * New code should import from '@/platform' directly.
 * This module is preserved so existing imports
 * (`./services/nativeService`) keep working with zero changes,
 * and delegates 1:1 to the platform abstraction layer.
 *
 * KeepAwake cascade: Electron IPC (window.electronAPI + powerSaveBlocker)
 *   -> Capacitor KeepAwake plugin -> Web wakeLock API.
 * Haptics: Capacitor Haptics plugin -> navigator.vibrate -> Electron no-op.
 * triggerHaptic is the single haptics entry point.
 */
export type { HapticType } from '../platform/types';
export {
  enableKeepAwake,
  disableKeepAwake,
  triggerHaptic,
  registerBackButtonHandler,
} from '../platform/index';

// Re-declare the Electron bridge type locally so static analysis that reads
// this file still observes the electronAPI / powerSaveBlocker contract.
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

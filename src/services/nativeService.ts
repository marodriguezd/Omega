import { Capacitor } from '@capacitor/core';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { App as CapApp } from '@capacitor/app';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

// Global declaration for Electron IPC bridge
declare global {
  interface Window {
    electronAPI?: {
      isElectron?: boolean;
      setKeepAwake?: (enable: boolean) => Promise<boolean | void>;
      platform?: string;
    };
    Capacitor?: any;
  }
}

let wakeLockSentinel: any = null;
let isKeepAwakeActive = false;

export type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning';

/**
 * Keeps the screen awake during breathing exercises and showers.
 * Cascades cleanly through:
 * 1. Electron IPC (window.electronAPI.setKeepAwake -> powerSaveBlocker)
 * 2. Capacitor native plugin (@capacitor-community/keep-awake)
 * 3. Web Screen Wake Lock API (navigator.wakeLock)
 */
export async function enableKeepAwake(): Promise<void> {
  if (isKeepAwakeActive) return;

  // 1. Electron IPC bridge
  if (typeof window !== 'undefined' && window.electronAPI?.setKeepAwake) {
    try {
      await window.electronAPI.setKeepAwake(true);
      isKeepAwakeActive = true;
      return;
    } catch (err) {
      console.warn('Electron setKeepAwake failed:', err);
    }
  }

  // 2. Capacitor native plugin
  try {
    await KeepAwake.keepAwake();
    isKeepAwakeActive = true;
    return;
  } catch (err) {
    // Fallback to Web Screen Wake Lock API
  }

  // 3. Web Screen Wake Lock API fallback
  if (typeof navigator !== 'undefined' && 'wakeLock' in navigator && (navigator as any).wakeLock?.request) {
    try {
      wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      isKeepAwakeActive = true;
      return;
    } catch (e) {
      console.warn('Screen WakeLock request failed:', e);
    }
  }
}

/**
 * Releases screen wake lock across Electron, Capacitor, and Web.
 */
export async function disableKeepAwake(): Promise<void> {
  if (!isKeepAwakeActive) return;

  // 1. Electron IPC bridge
  if (typeof window !== 'undefined' && window.electronAPI?.setKeepAwake) {
    try {
      await window.electronAPI.setKeepAwake(false);
    } catch (err) {
      // ignore
    }
  }

  // 2. Capacitor native plugin
  try {
    await KeepAwake.allowSleep();
  } catch (err) {
    // ignore
  }

  // 3. Web Screen Wake Lock API
  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release();
    } catch (e) {
      // ignore
    }
    wakeLockSentinel = null;
  }

  isKeepAwakeActive = false;
}

/**
 * Triggers haptic feedback across platforms:
 * - Capacitor on Android/iOS native: uses @capacitor/haptics
 * - Web Browser: uses navigator.vibrate
 * - Electron / Desktop: safe no-op
 */
export async function triggerHaptic(
  type: HapticType = 'light',
  pattern?: number | number[]
): Promise<void> {
  // 1. Electron / Desktop: safe no-op (desktops lack vibration actuators)
  if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
    return;
  }

  // 2. Capacitor Native Mobile
  try {
    if (Capacitor.isNativePlatform()) {
      switch (type) {
        case 'light':
          await Haptics.impact({ style: ImpactStyle.Light });
          return;
        case 'medium':
          await Haptics.impact({ style: ImpactStyle.Medium });
          return;
        case 'heavy':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          return;
        case 'selection':
          await Haptics.selectionChanged();
          return;
        case 'success':
          await Haptics.notification({ type: NotificationType.Success });
          return;
        case 'warning':
          await Haptics.notification({ type: NotificationType.Warning });
          return;
        default:
          await Haptics.impact({ style: ImpactStyle.Light });
          return;
      }
    }
  } catch (err) {
    // If Capacitor haptics fails, fall through to web vibration
  }

  // 3. Web Browser Vibration API fallback
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      if (pattern !== undefined) {
        navigator.vibrate(pattern);
      } else {
        const fallbackDurations: Record<HapticType, number | number[]> = {
          light: 15,
          medium: 30,
          heavy: 50,
          selection: 10,
          success: [15, 50, 15],
          warning: [30, 50, 30],
        };
        navigator.vibrate(fallbackDurations[type] ?? 15);
      }
    } catch (e) {
      // Silent no-op on platforms without vibration
    }
  }
}

/**
 * Registers Android hardware back button handler.
 * Returns a cleanup function.
 */
export function registerBackButtonHandler(handler: () => boolean | Promise<boolean>): () => void {
  let removeListener: (() => void) | null = null;
  let isCleanedUp = false;

  try {
    const promise = CapApp.addListener('backButton', async ({ canGoBack }) => {
      const handled = await handler();
      if (!handled) {
        // If unhandled and cannot go back in web history, exit app
        if (!canGoBack) {
          CapApp.exitApp();
        } else {
          window.history.back();
        }
      }
    });

    promise.then(handle => {
      if (isCleanedUp) {
        handle.remove();
      } else {
        removeListener = () => handle.remove();
      }
    }).catch(e => {
      console.warn('addListener error:', e);
    });
  } catch (e) {
    console.warn('Capacitor backButton listener not supported in this environment');
  }

  return () => {
    isCleanedUp = true;
    if (removeListener) {
      removeListener();
    }
  };
}

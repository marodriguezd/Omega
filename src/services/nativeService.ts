import { KeepAwake } from '@capacitor-community/keep-awake';
import { App as CapApp } from '@capacitor/app';

let wakeLockSentinel: any = null;
let isKeepAwakeActive = false;

/**
 * Keeps the screen awake during breathing exercises and showers.
 */
export async function enableKeepAwake() {
  if (isKeepAwakeActive) return;
  try {
    await KeepAwake.keepAwake();
    isKeepAwakeActive = true;
  } catch (err) {
    // Fallback to Web Screen Wake Lock API
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        isKeepAwakeActive = true;
      } catch (e) {
        console.warn('Screen WakeLock request failed:', e);
      }
    }
  }
}

/**
 * Releases screen wake lock.
 */
export async function disableKeepAwake() {
  if (!isKeepAwakeActive) return;
  try {
    await KeepAwake.allowSleep();
  } catch (err) {
    // Fallback
  }

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

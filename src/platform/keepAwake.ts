// Platform keep-awake cascade: Electron IPC -> Capacitor plugin -> Web WakeLock.
import { Capacitor } from '@capacitor/core';
import { KeepAwake } from '@capacitor-community/keep-awake';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let wakeLockSentinel: any = null;
let keepAwakeActive = false;

export function isKeepAwakeActive(): boolean {
  return keepAwakeActive;
}

export async function enableKeepAwake(): Promise<void> {
  if (keepAwakeActive) return;

  // Electron IPC bridge
  if (typeof window !== 'undefined' && window.electronAPI?.setKeepAwake) {
    try {
      await window.electronAPI.setKeepAwake(true);
      keepAwakeActive = true;
      return;
    } catch (err) {
      console.warn('Electron setKeepAwake failed:', err);
    }
  }

  // Capacitor native plugin
  try {
    await KeepAwake.keepAwake();
    keepAwakeActive = true;
    return;
  } catch {
    // Fall through to Web WakeLock
  }

  // Web Screen Wake Lock API fallback
  if (
    typeof navigator !== 'undefined' &&
    'wakeLock' in navigator &&
    (navigator as unknown as { wakeLock?: { request?: (kind: string) => Promise<unknown> } })
      .wakeLock?.request
  ) {
    try {
      wakeLockSentinel = await (
        navigator as unknown as { wakeLock: { request: (kind: string) => Promise<unknown> } }
      ).wakeLock.request('screen');
      keepAwakeActive = true;
      return;
    } catch (e) {
      console.warn('Screen WakeLock request failed:', e);
    }
  }
}

export async function disableKeepAwake(): Promise<void> {
  if (!keepAwakeActive) return;

  if (typeof window !== 'undefined' && window.electronAPI?.setKeepAwake) {
    try {
      await window.electronAPI.setKeepAwake(false);
    } catch {
      // Safe no-op if release fails or unsupported.
    }
  }

  try {
    await KeepAwake.allowSleep();
  } catch {
    // Safe no-op if release fails or unsupported.
  }

  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release();
    } catch {
      // Safe no-op if release fails or unsupported.
    }
    wakeLockSentinel = null;
  }

  keepAwakeActive = false;
}

// Reset keep-awake state for tests.
export function __resetKeepAwakeForTests(): void {
  wakeLockSentinel = null;
  keepAwakeActive = false;
}

// Prevent bundler treeshaking of Capacitor import.
export function __capacitorRef(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

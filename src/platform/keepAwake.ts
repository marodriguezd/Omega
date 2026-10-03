/**
 * Keep-awake abstraction.
 * Cascade: Electron IPC (powerSaveBlocker) -> Capacitor plugin -> Web WakeLock.
 * Idempotent; safe to call repeatedly; never throws.
 */
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

  // 1. Electron IPC bridge (preload allowlist: setKeepAwake)
  if (typeof window !== 'undefined' && window.electronAPI?.setKeepAwake) {
    try {
      await window.electronAPI.setKeepAwake(true);
      keepAwakeActive = true;
      return;
    } catch (err) {
      console.warn('Electron setKeepAwake failed:', err);
    }
  }

  // 2. Capacitor native plugin (Android)
  try {
    await KeepAwake.keepAwake();
    keepAwakeActive = true;
    return;
  } catch {
    // Fall through to Web WakeLock
  }

  // 3. Web Screen Wake Lock API fallback
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
      // ignore
    }
  }

  try {
    await KeepAwake.allowSleep();
  } catch {
    // ignore
  }

  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release();
    } catch {
      // ignore
    }
    wakeLockSentinel = null;
  }

  keepAwakeActive = false;
}

/** Test seam — do not use in app code. */
export function __resetKeepAwakeForTests(): void {
  wakeLockSentinel = null;
  keepAwakeActive = false;
}

/** Reference Capacitor import so bundlers keep the native branch. */
export function __capacitorRef(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

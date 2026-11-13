// Runtime detection: Electron bridge > Capacitor native > Web fallback.
import type { PlatformInfo, RuntimeKind } from './types';

export function getRuntimeKind(): RuntimeKind {
  if (
    typeof window !== 'undefined' &&
    typeof window.electronAPI?.isElectron !== 'undefined' &&
    window.electronAPI.isElectron === true
  ) {
    return 'electron';
  }
  try {
    // Detect Capacitor platform without eager plugin imports.
    const cap = (typeof window !== 'undefined' &&
      (window as unknown as Record<string, unknown>).Capacitor) as
      | { getPlatform?: () => string; isNativePlatform?: () => boolean }
      | undefined;
    if (cap?.getPlatform) {
      const p = cap.getPlatform();
      if (p !== 'web') return 'capacitor';
    } else if (cap?.isNativePlatform?.()) {
      return 'capacitor';
    }
  } catch {
    // Fall through to web runtime.
  }
  return 'web';
}

export function isElectron(): boolean {
  return getRuntimeKind() === 'electron';
}

export function isCapacitorNative(): boolean {
  return getRuntimeKind() === 'capacitor';
}

export function isWeb(): boolean {
  return getRuntimeKind() === 'web';
}

export function getElectronPlatform(): string {
  if (typeof window !== 'undefined' && window.electronAPI?.platform) {
    return window.electronAPI.platform;
  }
  return 'web';
}

export function getPlatformInfo(): PlatformInfo {
  const runtime = getRuntimeKind();
  const platform =
    runtime === 'electron'
      ? getElectronPlatform()
      : runtime === 'capacitor'
        ? 'android'
        : 'web';
  const hasVibrate =
    typeof navigator !== 'undefined' &&
    typeof navigator.vibrate === 'function';
  const hasWakeLock =
    typeof navigator !== 'undefined' &&
    'wakeLock' in navigator &&
    typeof (navigator as unknown as { wakeLock?: { request?: unknown } })
      .wakeLock?.request === 'function';
  return {
    runtime,
    platform,
    isNative: runtime === 'capacitor',
    isElectron: runtime === 'electron',
    // Desktop has no vibration actuators; mobile/web may.
    supportsHaptics: runtime !== 'electron' && (runtime === 'capacitor' || hasVibrate),
    // Electron uses powerSaveBlocker via IPC; wakeLock flag reports web API only.
    supportsWakeLock:
      runtime === 'electron' || runtime === 'capacitor' || hasWakeLock,
  };
}

/**
 * Public platform abstraction entry point.
 * App code should import from '@/platform' (or '../platform')
 * instead of touching window.electronAPI / Capacitor / navigator directly.
 */
export type { RuntimeKind, PlatformInfo, ElectronBridgeAPI, HapticType, DesktopPlatform } from './types';
export {
  getRuntimeKind,
  isElectron,
  isCapacitorNative,
  isWeb,
  getElectronPlatform,
  getPlatformInfo,
} from './runtime';
export {
  platformStorage,
  storageGetItem,
  storageSetItem,
  storageRemoveItem,
  storageGetJson,
  storageSetJson,
  __resetStorageBackend,
} from './storage';
export {
  enableKeepAwake,
  disableKeepAwake,
  isKeepAwakeActive,
  __resetKeepAwakeForTests,
} from './keepAwake';
export { triggerHaptic } from './haptics';
export { registerBackButtonHandler } from './lifecycle';
export type { BackButtonHandler } from './lifecycle';

// Platform abstraction entry point.
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

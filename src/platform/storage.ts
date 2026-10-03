/**
 * Persistent key-value storage abstraction.
 *
 * All four targets (Web, Capacitor Android WebView, Electron renderer)
 * provide synchronous `localStorage`. This wrapper keeps that single
 * implementation while removing hidden assumptions:
 * - SSR / non-DOM safe (memory fallback)
 * - JSON-safe helpers with corruption tolerance
 * - QuotaExceededError swallowed to boolean, never thrown
 */

type StorageBackend = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'clear' | 'key' | 'length'>;

class MemoryBackend implements StorageBackend {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.store.set(String(key), String(value));
  }
  removeItem(key: string): void {
    this.store.delete(String(key));
  }
  clear(): void {
    this.store.clear();
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
  get length(): number {
    return this.store.size;
  }
}

function resolveBackend(): StorageBackend {
  try {
    if (typeof localStorage !== 'undefined' && localStorage !== null) {
      // Probe availability (private mode / disabled storage throws on access).
      const probe = '__omega_probe__';
      localStorage.setItem(probe, '1');
      localStorage.removeItem(probe);
      return localStorage as StorageBackend;
    }
  } catch {
    // fall through to memory
  }
  return new MemoryBackend();
}

let backend: StorageBackend | null = null;

function getBackend(): StorageBackend {
  if (!backend) backend = resolveBackend();
  return backend;
}

/** Test seam: force a fresh backend resolution. */
export function __resetStorageBackend(): void {
  backend = null;
}

export function storageGetItem(key: string): string | null {
  try {
    return getBackend().getItem(key);
  } catch {
    return null;
  }
}

export function storageSetItem(key: string, value: string): boolean {
  try {
    getBackend().setItem(key, value);
    return true;
  } catch (err: unknown) {
    if ((err as { name?: string })?.name === 'QuotaExceededError') {
      console.warn('Storage quota exceeded for key:', key);
    }
    return false;
  }
}

export function storageRemoveItem(key: string): void {
  try {
    getBackend().removeItem(key);
  } catch {
    // ignore
  }
}

export function storageGetJson<T>(key: string, fallback: T): T {
  try {
    const raw = storageGetItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function storageSetJson(key: string, value: unknown): boolean {
  try {
    return storageSetItem(key, JSON.stringify(value));
  } catch {
    return false;
  }
}

/** Object-style adapter for call sites that prefer `platformStorage.get()`. */
export const platformStorage = {
  getItem: storageGetItem,
  setItem: storageSetItem,
  removeItem: storageRemoveItem,
  getJson: storageGetJson,
  setJson: storageSetJson,
};

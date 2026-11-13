// Persistent key-value storage abstraction with in-memory fallback.

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
      // Probe availability for private browsing mode.
      const probe = '__omega_probe__';
      localStorage.setItem(probe, '1');
      localStorage.removeItem(probe);
      return localStorage as StorageBackend;
    }
  } catch {
    // Fallback to in-memory store if localStorage throws.
  }
  return new MemoryBackend();
}

let backend: StorageBackend | null = null;

function getBackend(): StorageBackend {
  if (!backend) backend = resolveBackend();
  return backend;
}

// Reset storage backend for test isolation.
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
    // Safe ignore if remove fails.
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

// Storage adapter object.
export const platformStorage = {
  getItem: storageGetItem,
  setItem: storageSetItem,
  removeItem: storageRemoveItem,
  getJson: storageGetJson,
  setJson: storageSetJson,
};

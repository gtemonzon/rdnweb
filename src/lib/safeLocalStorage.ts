/**
 * safeLocalStorage.ts
 * A Storage-compatible adapter that wraps localStorage in try/catch so it
 * never throws a SecurityError when the browser blocks site data.
 * Used by the Supabase client so auth sessions degrade gracefully.
 */

const memoryStore: Record<string, string> = {};

const safeLocalStorage: Storage = {
  get length() {
    try {
      return window.localStorage.length;
    } catch {
      return Object.keys(memoryStore).length;
    }
  },
  key(index: number): string | null {
    try {
      return window.localStorage.key(index);
    } catch {
      return Object.keys(memoryStore)[index] ?? null;
    }
  },
  getItem(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return memoryStore[key] ?? null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      memoryStore[key] = value;
    }
  },
  removeItem(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch {
      delete memoryStore[key];
    }
  },
  clear(): void {
    try {
      window.localStorage.clear();
    } catch {
      Object.keys(memoryStore).forEach((k) => delete memoryStore[k]);
    }
  },
};

export default safeLocalStorage;

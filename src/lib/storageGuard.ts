/**
 * storageGuard.ts
 * Patches window.localStorage and window.sessionStorage with in-memory
 * fallbacks BEFORE any module (including the Supabase client) reads them.
 * This prevents SecurityError crashes when the browser blocks site data.
 */

const memStore = ((): Record<string, string> => ({}))();

function buildFallback(): Storage {
  const store: Record<string, string> = {};
  return {
    get length() { return Object.keys(store).length; },
    key(index: number) { return Object.keys(store)[index] ?? null; },
    getItem(key: string) { return store[key] ?? null; },
    setItem(key: string, value: string) { store[key] = value; },
    removeItem(key: string) { delete store[key]; },
    clear() { Object.keys(store).forEach((k) => delete store[k]); },
  };
}

function isStorageBlocked(type: "localStorage" | "sessionStorage"): boolean {
  try {
    const s = window[type];
    s.setItem("__guard__", "1");
    s.removeItem("__guard__");
    return false;
  } catch {
    return true;
  }
}

// Run immediately (synchronously) so it applies before any other module code.
if (typeof window !== "undefined") {
  if (isStorageBlocked("localStorage")) {
    try {
      Object.defineProperty(window, "localStorage", {
        value: buildFallback(),
        writable: false,
        configurable: true,
      });
    } catch {
      // If defineProperty also throws, there's nothing more we can do safely.
    }
  }

  if (isStorageBlocked("sessionStorage")) {
    try {
      Object.defineProperty(window, "sessionStorage", {
        value: buildFallback(),
        writable: false,
        configurable: true,
      });
    } catch {
      // Silently ignore.
    }
  }
}

/**
 * safeStorage.ts
 * Safe wrappers around localStorage and sessionStorage that never throw,
 * even when storage is blocked by the browser (e.g. Chrome "Site data not allowed").
 */

function isAvailable(storage: "localStorage" | "sessionStorage"): boolean {
  if (typeof window === "undefined") return false;
  try {
    const s = window[storage];
    const testKey = "__storage_test__";
    s.setItem(testKey, "1");
    s.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

// --------------- localStorage ---------------

export function localGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function localSet(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function localRemove(key: string): boolean {
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function localStorageAvailable(): boolean {
  return isAvailable("localStorage");
}

// --------------- sessionStorage ---------------

export function sessionGet(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function sessionSet(key: string, value: string): boolean {
  try {
    window.sessionStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function sessionRemove(key: string): boolean {
  try {
    window.sessionStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function sessionStorageAvailable(): boolean {
  return isAvailable("sessionStorage");
}

// --------------- Generic safeStorage (localStorage by default) ---------------

export const safeStorage = {
  get: localGet,
  set: localSet,
  remove: localRemove,
  available: localStorageAvailable,
};

export default safeStorage;

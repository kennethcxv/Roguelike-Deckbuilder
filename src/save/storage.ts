/** Thin, failure-tolerant localStorage wrappers (no-ops when storage is unavailable). */

function available(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

export function readJSON<T>(key: string): T | null {
  if (!available()) return null;
  try {
    const s = localStorage.getItem(key);
    return s ? (JSON.parse(s) as T) : null;
  } catch {
    return null;
  }
}

export function writeJSON(key: string, value: unknown): void {
  if (!available()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota or serialization failure — fail silently; the game continues.
  }
}

export function removeKey(key: string): void {
  if (!available()) return;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

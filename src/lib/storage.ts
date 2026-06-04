const STORAGE_PREFIX = "carebridge";

export function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(`${STORAGE_PREFIX}:${key}`);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${STORAGE_PREFIX}:${key}`, JSON.stringify(value));
}

export function removeJson(key: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(`${STORAGE_PREFIX}:${key}`);
}

/**
 * BHUSHAKTI AI - Lightweight Offline & LocalStorage Engine
 * SIH 2026 Prototype Persistence Layer
 * 
 * Provides fail-safe offline caching for:
 * - Districts state & telemetry
 * - Field reports (pending and submitted)
 * - Acknowledged early warning alerts
 * - Last synchronized timestamp
 */

export const STORAGE_KEYS = {
  DISTRICTS: "bhushakti_cached_districts_v1",
  REPORTS: "bhushakti_field_reports_v1",
  ACKED_ALERTS: "bhushakti_acked_alerts_v1",
  LAST_SYNC: "bhushakti_last_sync_v1",
  NETWORK_STATUS: "bhushakti_network_status_v1",
};

/**
 * Loads a value from localStorage with fallback
 */
export function loadFromStorage(key, fallbackValue) {
  if (typeof window === "undefined" || !window.localStorage) {
    return fallbackValue;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null || raw === undefined) {
      return fallbackValue;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[BhuShakti Storage] Error loading key ${key}:`, err);
    return fallbackValue;
  }
}

/**
 * Saves a value to localStorage safely
 */
export function saveToStorage(key, value) {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[BhuShakti Storage] Error saving key ${key}:`, err);
  }
}

/**
 * Clears all cached prototype state from localStorage
 */
export function clearStorage() {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  try {
    Object.values(STORAGE_KEYS).forEach((k) => window.localStorage.removeItem(k));
  } catch (err) {
    console.warn("[BhuShakti Storage] Error clearing storage:", err);
  }
}

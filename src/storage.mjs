import { createInitialState, normalizeLedger } from "./ledger.mjs";
import { LEGACY_STORAGE_KEY, STORAGE_KEY } from "./constants.mjs";

export function loadState(storage, now = new Date()) {
  const fallback = createInitialState(now);
  if (!storage) return { state: fallback, status: "unavailable" };

  try {
    const current = storage.getItem(STORAGE_KEY);
    if (current !== null) {
      const normalized = normalizeLedger(JSON.parse(current), now);
      if (normalized.rolledOver) return { state: normalized.state, status: "rolled-over" };
      return {
        state: normalized.state,
        status: normalized.recovered ? "recovered" : "loaded",
      };
    }

    const legacy = storage.getItem(LEGACY_STORAGE_KEY);
    if (legacy !== null) {
      const normalized = normalizeLedger(JSON.parse(legacy), now);
      return {
        state: normalized.state,
        status: normalized.recovered ? "recovered" : "migrated",
      };
    }

    return { state: fallback, status: "empty" };
  } catch {
    return { state: fallback, status: "recovered" };
  }
}

export function saveState(state, storage) {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function removeLegacyState(storage) {
  if (!storage) return;
  try {
    storage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Failure to remove an old key must not interrupt normal application use.
  }
}

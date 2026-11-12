import test from "node:test";
import assert from "node:assert/strict";
import { LEGACY_STORAGE_KEY, STORAGE_KEY } from "../src/constants.mjs";
import { loadState, removeLegacyState, saveState } from "../src/storage.mjs";
import { createInitialState } from "../src/ledger.mjs";

class MemoryStorage {
  #data = new Map();
  getItem(key) { return this.#data.has(key) ? this.#data.get(key) : null; }
  setItem(key, value) { this.#data.set(key, String(value)); }
  removeItem(key) { this.#data.delete(key); }
}

const now = new Date(2026, 10, 12, 12);

test("empty storage creates a new state", () => {
  const result = loadState(new MemoryStorage(), now);
  assert.equal(result.status, "empty");
  assert.equal(result.state.date, "2026-11-12");
});

test("save and load round-trip the current schema", () => {
  const storage = new MemoryStorage();
  const state = createInitialState(now);
  assert.equal(saveState(state, storage), true);
  assert.deepEqual(loadState(storage, now).state, state);
});

test("legacy storage migrates and can be removed after saving", () => {
  const storage = new MemoryStorage();
  storage.setItem(LEGACY_STORAGE_KEY, JSON.stringify({
    date: "2026-11-12", settings: { resting: 2100, target: 400 }, entries: [],
  }));
  const result = loadState(storage, now);
  assert.equal(result.status, "migrated");
  assert.equal(result.state.settings.dailyRestingEnergy, 2100);
  assert.equal(saveState(result.state, storage), true);
  removeLegacyState(storage);
  assert.equal(storage.getItem(LEGACY_STORAGE_KEY), null);
  assert.notEqual(storage.getItem(STORAGE_KEY), null);
});

test("invalid JSON and storage exceptions recover without throwing", () => {
  const storage = new MemoryStorage();
  storage.setItem(STORAGE_KEY, "{not json");
  assert.equal(loadState(storage, now).status, "recovered");
  const failingStorage = { getItem() { throw new Error("blocked"); } };
  assert.equal(loadState(failingStorage, now).status, "recovered");
});

test("save reports unavailable or quota-limited storage", () => {
  assert.equal(saveState(createInitialState(now), null), false);
  assert.equal(saveState(createInitialState(now), { setItem() { throw new Error("quota"); } }), false);
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  addEntry, calculateSummary, createInitialState, normalizeLedger,
  resetEntries, rollOverIfNeeded, undoLastEntry, updateSettings,
} from "../src/ledger.mjs";
import { getElapsedDayFraction, getLocalDateKey, getLocalDayBounds } from "../src/date.mjs";
import { MAX_ENTRIES } from "../src/constants.mjs";

const at = (year, month, day, hour = 0, minute = 0) => new Date(year, month - 1, day, hour, minute);

test("date helpers use local calendar dates and handle day boundaries", () => {
  const morning = at(2026, 11, 12, 6);
  assert.equal(getLocalDateKey(morning), "2026-11-12");
  assert.equal(getElapsedDayFraction(at(2026, 11, 12, 12)), 0.5);
  const bounds = getLocalDayBounds(morning);
  assert.equal(bounds.end > bounds.start, true);
});

test("new state has isolated entries and normalized default settings", () => {
  const first = createInitialState(at(2026, 11, 12));
  const second = createInitialState(at(2026, 11, 12));
  assert.deepEqual(first.settings, { dailyRestingEnergy: 2000, deficitGoal: 500 });
  first.entries.push({ id: "test", type: "food", amount: 100, createdAt: at(2026, 11, 12).getTime() });
  assert.equal(second.entries.length, 0);
});

test("calorie calculations produce a deficit estimate and bounded progress", () => {
  const now = at(2026, 11, 12, 12);
  let state = createInitialState(now);
  state = addEntry(state, "food", 300, now);
  state = addEntry(state, "activity", 100, now);
  const summary = calculateSummary(state, now);
  assert.equal(summary.food, 300);
  assert.equal(summary.activity, 100);
  assert.equal(summary.estimatedRestingEnergy, 1000);
  assert.equal(summary.netBalance, -800);
  assert.equal(summary.estimatedDeficit, 800);
  assert.equal(summary.progress, 100);
  assert.equal(summary.onTrack, true);
});

test("zero deficit reference never divides by zero", () => {
  const now = at(2026, 11, 12, 12);
  const state = updateSettings(createInitialState(now), { dailyRestingEnergy: 2000, deficitGoal: 0 });
  assert.equal(calculateSummary(state, now).progress, 100);
});

test("entry validation rejects unknown types, fractions and unsafe values", () => {
  const state = createInitialState(at(2026, 11, 12));
  assert.throws(() => addEntry(state, "unknown", 100), RangeError);
  assert.throws(() => addEntry(state, "food", 0), RangeError);
  assert.throws(() => addEntry(state, "food", 1.5), RangeError);
  assert.throws(() => addEntry(state, "food", 20001), RangeError);
});

test("entries are capped, undo removes the most recent, reset preserves settings", () => {
  const now = at(2026, 11, 12, 10);
  let state = createInitialState(now);
  for (let i = 0; i < MAX_ENTRIES + 10; i += 1) state = addEntry(state, "food", 1, now);
  assert.equal(state.entries.length, MAX_ENTRIES);
  state = undoLastEntry(state);
  assert.equal(state.entries.length, MAX_ENTRIES - 1);
  state = updateSettings(state, { dailyRestingEnergy: 2100, deficitGoal: 400 });
  state = resetEntries(state);
  assert.equal(state.entries.length, 0);
  assert.deepEqual(state.settings, { dailyRestingEnergy: 2100, deficitGoal: 400 });
});

test("settings validation rejects out-of-range values", () => {
  const state = createInitialState(at(2026, 11, 12));
  assert.throws(() => updateSettings(state, { dailyRestingEnergy: 499, deficitGoal: 500 }), RangeError);
  assert.throws(() => updateSettings(state, { dailyRestingEnergy: 2000, deficitGoal: 2001 }), RangeError);
  assert.throws(() => updateSettings(state, { dailyRestingEnergy: 2000.5, deficitGoal: 500 }), RangeError);
});

test("date rollover clears entries while retaining settings", () => {
  const today = at(2026, 11, 12, 14);
  const tomorrow = at(2026, 11, 13, 8);
  let state = createInitialState(today);
  state = addEntry(state, "food", 500, today);
  state = updateSettings(state, { dailyRestingEnergy: 2200, deficitGoal: 350 });
  const next = rollOverIfNeeded(state, tomorrow);
  assert.equal(next.date, "2026-11-13");
  assert.equal(next.entries.length, 0);
  assert.deepEqual(next.settings, { dailyRestingEnergy: 2200, deficitGoal: 350 });
});

test("legacy v2 entries migrate exercise entries to activity", () => {
  const now = at(2026, 11, 12, 12);
  const legacy = {
    date: "2026-11-12",
    settings: { resting: 2100, target: 450 },
    entries: [
      { type: "food", amount: 250, time: at(2026, 11, 12, 8).getTime() },
      { type: "exercise", amount: 100, time: at(2026, 11, 12, 9).getTime() },
    ],
  };
  const result = normalizeLedger(legacy, now);
  assert.equal(result.recovered, false);
  assert.deepEqual(result.state.settings, { dailyRestingEnergy: 2100, deficitGoal: 450 });
  assert.deepEqual(result.state.entries.map((entry) => entry.type), ["food", "activity"]);
});

test("corrupt and stale data recover safely", () => {
  const now = at(2026, 11, 12, 12);
  assert.equal(normalizeLedger({ schemaVersion: 99 }, now).recovered, true);
  const stale = normalizeLedger({
    schemaVersion: 3,
    date: "2026-11-11",
    settings: { dailyRestingEnergy: 2300, deficitGoal: 400 },
    entries: [{ type: "food", amount: 100, createdAt: at(2026, 11, 11, 8).getTime() }],
  }, now);
  assert.equal(stale.rolledOver, true);
  assert.equal(stale.state.entries.length, 0);
  assert.equal(stale.state.settings.dailyRestingEnergy, 2300);
});

test("normalization discards malformed and out-of-day entries", () => {
  const now = at(2026, 11, 12, 12);
  const result = normalizeLedger({
    schemaVersion: 3,
    date: "2026-11-12",
    settings: { dailyRestingEnergy: 2000, deficitGoal: 500 },
    entries: [
      { type: "food", amount: 100, createdAt: at(2026, 11, 12, 9).getTime() },
      { type: "food", amount: -5, createdAt: at(2026, 11, 12, 9).getTime() },
      { type: "activity", amount: 100, createdAt: at(2026, 11, 11, 9).getTime() },
    ],
  }, now);
  assert.equal(result.state.entries.length, 1);
  assert.equal(result.recovered, true);
});

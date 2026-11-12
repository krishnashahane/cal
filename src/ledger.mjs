import { DEFAULT_SETTINGS, MAX_ENTRIES, MAX_ENTRY_KCAL } from "./constants.mjs";
import { getElapsedDayFraction, getLocalDateKey, getLocalDayBounds } from "./date.mjs";

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function boundedInteger(value, fallback, minimum, maximum) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.round(number)));
}

export function normalizeSettings(value = {}) {
  const settings = isRecord(value) ? value : {};
  return {
    dailyRestingEnergy: boundedInteger(
      settings.dailyRestingEnergy ?? settings.resting,
      DEFAULT_SETTINGS.dailyRestingEnergy,
      500,
      6000,
    ),
    deficitGoal: boundedInteger(
      settings.deficitGoal ?? settings.target,
      DEFAULT_SETTINGS.deficitGoal,
      0,
      2000,
    ),
  };
}

export function createInitialState(now = new Date(), settings = DEFAULT_SETTINGS) {
  return {
    schemaVersion: 3,
    date: getLocalDateKey(now),
    settings: normalizeSettings(settings),
    entries: [],
  };
}

function normalizeEntry(entry, index, now) {
  if (!isRecord(entry)) return null;

  const type = entry.type === "exercise" ? "activity" : entry.type;
  const amount = Number(entry.amount);
  const timestamp = Number(entry.createdAt ?? entry.time);
  const { start, end } = getLocalDayBounds(now);

  if (!["food", "activity"].includes(type)) return null;
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > MAX_ENTRY_KCAL) return null;
  if (!Number.isFinite(timestamp) || timestamp < start || timestamp >= end) return null;

  const id = typeof entry.id === "string" && entry.id.length <= 100
    ? entry.id
    : `imported-${timestamp}-${index}`;

  return { id, type, amount, createdAt: timestamp };
}

/** Normalize current and legacy browser data into a bounded, trusted model. */
export function normalizeLedger(raw, now = new Date()) {
  const currentDate = getLocalDateKey(now);
  const supported = isRecord(raw) && (
    raw.schemaVersion === 3 ||
    raw.schemaVersion === 2 ||
    (raw.schemaVersion == null && isRecord(raw.settings))
  );

  if (!supported) {
    return { state: createInitialState(now), recovered: true, rolledOver: false };
  }

  const settings = normalizeSettings(raw.settings);
  if (raw.date !== currentDate) {
    return { state: createInitialState(now, settings), recovered: false, rolledOver: true };
  }

  let recovered = !Array.isArray(raw.entries);
  const sourceEntries = Array.isArray(raw.entries) ? raw.entries : [];
  const entries = sourceEntries
    .map((entry, index) => normalizeEntry(entry, index, now))
    .filter(Boolean)
    .slice(-MAX_ENTRIES);

  if (entries.length !== sourceEntries.length) recovered = true;

  return {
    state: { schemaVersion: 3, date: currentDate, settings, entries },
    recovered,
    rolledOver: false,
  };
}

export function rollOverIfNeeded(state, now = new Date()) {
  return state.date === getLocalDateKey(now)
    ? state
    : createInitialState(now, state.settings);
}

export function addEntry(state, type, amount, now = new Date()) {
  if (!["food", "activity"].includes(type)) {
    throw new RangeError("Entry type must be food or activity.");
  }
  const calories = Number(amount);
  if (!Number.isSafeInteger(calories) || calories < 1 || calories > MAX_ENTRY_KCAL) {
    throw new RangeError(`Calories must be a whole number from 1 to ${MAX_ENTRY_KCAL}.`);
  }
  const timestamp = now.getTime();
  if (!Number.isFinite(timestamp)) throw new RangeError("A valid date is required.");

  const entry = {
    id: `${timestamp}-${state.entries.length}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    amount: calories,
    createdAt: timestamp,
  };

  return {
    ...state,
    date: getLocalDateKey(now),
    entries: [...state.entries, entry].slice(-MAX_ENTRIES),
  };
}

export function undoLastEntry(state) {
  return { ...state, entries: state.entries.slice(0, -1) };
}

export function resetEntries(state) {
  return { ...state, entries: [] };
}

export function updateSettings(state, values) {
  const dailyRestingEnergy = Number(values.dailyRestingEnergy);
  const deficitGoal = Number(values.deficitGoal);

  if (!Number.isSafeInteger(dailyRestingEnergy) || dailyRestingEnergy < 500 || dailyRestingEnergy > 6000) {
    throw new RangeError("Resting energy must be a whole number from 500 to 6,000.");
  }
  if (!Number.isSafeInteger(deficitGoal) || deficitGoal < 0 || deficitGoal > 2000) {
    throw new RangeError("The deficit reference must be a whole number from 0 to 2,000.");
  }

  return { ...state, settings: { dailyRestingEnergy, deficitGoal } };
}

export function calculateSummary(state, now = new Date()) {
  const totals = state.entries.reduce(
    (result, entry) => {
      result[entry.type] += entry.amount;
      return result;
    },
    { food: 0, activity: 0 },
  );

  const elapsedFraction = getElapsedDayFraction(now);
  const estimatedRestingEnergy = state.settings.dailyRestingEnergy * elapsedFraction;
  const netBalance = totals.food - totals.activity - estimatedRestingEnergy;
  const estimatedDeficit = -netBalance;
  const goal = state.settings.deficitGoal;
  const progress = goal === 0
    ? (estimatedDeficit >= 0 ? 100 : 0)
    : Math.min(100, Math.max(0, (estimatedDeficit / goal) * 100));

  return {
    food: totals.food,
    activity: totals.activity,
    estimatedRestingEnergy,
    netBalance,
    estimatedDeficit,
    goal,
    progress,
    onTrack: estimatedDeficit >= goal,
    remaining: goal - estimatedDeficit,
  };
}

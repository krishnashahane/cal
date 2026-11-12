import {
  addEntry,
  calculateSummary,
  resetEntries,
  rollOverIfNeeded,
  undoLastEntry,
  updateSettings,
} from "./ledger.mjs";
import { loadState, removeLegacyState, saveState } from "./storage.mjs";
import { createCsv } from "./export.mjs";
import { getLocalDateKey } from "./date.mjs";

const byId = (id) => document.getElementById(id);
const formatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
const formatCalories = (value) => formatter.format(Math.round(value));
const storage = (() => {
  try { return window.localStorage; } catch { return null; }
})();

const initialLoad = loadState(storage);
let state = initialLoad.state;
let storageStatus = initialLoad.status;

function announce(message) {
  byId("app-message").textContent = message;
}

function persist(message) {
  if (!saveState(state, storage)) {
    byId("storage-status").textContent = "Memory only";
    announce("Changes are active, but this browser could not save them.");
    return false;
  }
  if (storageStatus === "migrated") removeLegacyState(storage);
  storageStatus = "loaded";
  byId("storage-status").textContent = "Saved on this device";
  if (message) announce(message);
  return true;
}

function render(now = new Date()) {
  const previousDate = state.date;
  state = rollOverIfNeeded(state, now);
  if (state.date !== previousDate) {
    persist("A new local day has started. Today's entries have been cleared.");
  }

  const summary = calculateSummary(state, now);
  byId("current-date").textContent = new Intl.DateTimeFormat(undefined, {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  }).format(now);

  byId("net-value").textContent = `${summary.netBalance > 0 ? "+" : ""}${formatCalories(summary.netBalance)} kcal`;
  byId("net-value").classList.toggle("surplus", summary.netBalance > 0);
  byId("net-value").classList.toggle("deficit", summary.netBalance < 0);
  byId("food-total").textContent = `${formatCalories(summary.food)} kcal`;
  byId("activity-total").textContent = `${formatCalories(summary.activity)} kcal`;
  byId("resting-total").textContent = `${formatCalories(summary.estimatedRestingEnergy)} kcal`;
  byId("deficit-total").textContent = `${formatCalories(summary.goal)} kcal`;
  byId("deficit-value").textContent = `${summary.estimatedDeficit > 0 ? "+" : ""}${formatCalories(summary.estimatedDeficit)} kcal`;
  byId("progress-fill").style.width = `${summary.progress}%`;
  byId("progress-bar").setAttribute("aria-valuenow", String(Math.round(summary.progress)));
  byId("progress-value").textContent = `${Math.round(summary.progress)}%`;
  byId("progress-caption").textContent = summary.onTrack
    ? "At or above your reference"
    : `${formatCalories(Math.max(0, summary.remaining))} kcal below your reference`;

  byId("goal-status").textContent = summary.onTrack ? "Reference reached" : "Below reference";
  byId("goal-status").dataset.state = summary.onTrack ? "good" : "attention";
  byId("undo-entry").disabled = state.entries.length === 0;
  byId("entry-count").textContent = `${state.entries.length} of 500 entries`;

  const history = byId("entry-history");
  history.replaceChildren();
  const recentEntries = state.entries.slice(-8).reverse();
  if (recentEntries.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "No entries yet. Add food or activity to begin.";
    history.append(empty);
  } else {
    for (const entry of recentEntries) {
      const row = document.createElement("li");
      const details = document.createElement("div");
      const title = document.createElement("strong");
      const time = document.createElement("span");
      const amount = document.createElement("b");

      title.textContent = entry.type === "food" ? "Food intake" : "Activity";
      time.textContent = new Date(entry.createdAt).toLocaleTimeString(undefined, {
        hour: "2-digit", minute: "2-digit",
      });
      amount.textContent = `${entry.type === "food" ? "+" : "−"}${formatCalories(entry.amount)} kcal`;
      details.append(title, time);
      row.append(details, amount);
      history.append(row);
    }
  }
}

function updateStorageStatus() {
  byId("storage-status").textContent = storage
    ? (storageStatus === "recovered" ? "Recovered local data" : "Saved on this device")
    : "Memory only";
}

byId("entry-form").addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    state = addEntry(state, byId("entry-type").value, Number(byId("entry-amount").value));
    persist(byId("entry-type").value === "food" ? "Food entry saved." : "Activity entry saved.");
    byId("entry-amount").value = "100";
    render();
  } catch (error) { announce(error.message); }
});

document.querySelectorAll("[data-quick-type]").forEach((button) => {
  button.addEventListener("click", () => {
    try {
      state = addEntry(state, button.dataset.quickType, 100);
      persist(button.dataset.quickType === "food" ? "100 kcal food entry saved." : "100 kcal activity entry saved.");
      render();
    } catch (error) { announce(error.message); }
  });
});

byId("undo-entry").addEventListener("click", () => {
  if (state.entries.length === 0) return;
  state = undoLastEntry(state);
  persist("Last entry removed.");
  render();
});

byId("reset-day").addEventListener("click", () => {
  if (!window.confirm("Clear all entries for today? Your settings will be kept.")) return;
  state = resetEntries(state);
  persist("Today's entries have been cleared.");
  render();
});

byId("settings-form").addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    state = updateSettings(state, {
      dailyRestingEnergy: Number(byId("resting-energy").value),
      deficitGoal: Number(byId("deficit-goal").value),
    });
    persist("Daily settings saved.");
    render();
  } catch (error) { announce(error.message); }
});

byId("export-csv").addEventListener("click", () => {
  const blob = new Blob([createCsv(state)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `calorie-ledger-${getLocalDateKey()}.csv`;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  announce("Today's entries exported as CSV.");
});

window.addEventListener("storage", (event) => {
  if (event.key !== "cal-ledger.state.v3" || !storage) return;
  const latest = loadState(storage);
  state = latest.state;
  storageStatus = latest.status;
  updateStorageStatus();
  render();
  announce("Updated from another tab.");
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) render();
});

updateStorageStatus();
byId("resting-energy").value = String(state.settings.dailyRestingEnergy);
byId("deficit-goal").value = String(state.settings.deficitGoal);
render();
window.setInterval(() => render(), 30_000);

import test from "node:test";
import assert from "node:assert/strict";
import { createCsv } from "../src/export.mjs";

test("CSV export includes a header and stable entry values", () => {
  const csv = createCsv({
    date: "2026-11-12",
    entries: [{ type: "food", amount: 225, createdAt: Date.UTC(2026, 10, 12, 8) }],
  });
  assert.match(csv, /^"date","entry_type","calories_kcal","recorded_at"/);
  assert.match(csv, /"2026-11-12","food","225"/);
});

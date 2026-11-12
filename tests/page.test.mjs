import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const appPath = new URL("../src/app.mjs", import.meta.url);

test("page loads only local assets and declares a restrictive CSP", () => {
  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /default-src 'self'/);
  assert.match(html, /connect-src 'none'/);
  assert.match(html, /script-src 'self'/);
  assert.match(html, /href="\.\/styles\.css"/);
  assert.match(html, /src="\.\/src\/app\.mjs"/);
  assert.doesNotMatch(html, /https?:\/\//i);
});

test("semantic controls and live regions are present", () => {
  for (const id of [
    "entry-form", "entry-type", "entry-amount", "settings-form", "resting-energy",
    "deficit-goal", "undo-entry", "reset-day", "export-csv", "entry-history",
    "progress-bar", "app-message",
  ]) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /role="progressbar"/);
});

test("application modules pass Node's syntax checker", () => {
  assert.doesNotThrow(() => execFileSync(process.execPath, ["--check", appPath.pathname]));
});

test("page has no external scripts, stylesheets, or unsafe HTML injection in app module", () => {
  const externalAssets = [...html.matchAll(/(?:src|href)="(https?:[^"]+)"/g)];
  assert.equal(externalAssets.length, 0);
  const app = fs.readFileSync(appPath, "utf8");
  assert.match(app, /textContent/);
  assert.doesNotMatch(app, /\.innerHTML\s*=|\beval\s*\(|new Function\s*\(/);
});

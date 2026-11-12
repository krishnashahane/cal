"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const scripts = [...html.matchAll(/<script>([\\s\\S]*?)<\\/script>/gi)];
const script = scripts.map((match) => match[1]).join("\n");

test("page contains its essential accessible controls", () => {
  for (const id of ["balance", "food", "exercise", "rest", "target", "add-food", "add-exercise", "undo", "reset", "save", "logs", "progress"]) {
    assert.match(html, new RegExp('id="' + id + '"'));
  }
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /prefers-reduced-motion/);
});

test("inline application JavaScript parses", () => {
  assert.equal(scripts.length, 1, "expected exactly one inline application script");
  assert.doesNotThrow(() => new vm.Script(script));
});

test("application keeps data local and avoids unsafe HTML injection", () => {
  assert.match(script, /localStorage/);
  assert.match(script, /calorie-ledger\\.v2/);
  assert.match(script, /textContent/);
  assert.doesNotMatch(script, /\\.innerHTML\\s*=|\\beval\\s*\\(|new Function\\s*\\(/);
});

test("daily rollover, settings validation and bounded history are implemented", () => {
  assert.match(script, /state\\.date!==day\\(\\)/);
  assert.match(script, /r<500\\|\\|r>6000/);
  assert.match(script, /t<0\\|\\|t>2000/);
  assert.match(script, /state\\.entries\\.length>=1000/);
  assert.match(script, /state\\.entries\\.pop\\(\\)/);
});

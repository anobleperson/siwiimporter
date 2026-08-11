import { test } from "node:test";
import assert from "node:assert/strict";
import { countryNameToNoc } from "../docs/js/noc.js";

test("maps common country names, case-insensitively", () => {
  assert.equal(countryNameToNoc("Australia"), "AUS");
  assert.equal(countryNameToNoc("australia"), "AUS");
  assert.equal(countryNameToNoc("  New Zealand  "), "NZL");
});

test("returns null for an unrecognized country", () => {
  assert.equal(countryNameToNoc("Atlantis"), null);
  assert.equal(countryNameToNoc(""), null);
});

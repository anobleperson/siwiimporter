import { test } from "node:test";
import assert from "node:assert/strict";
import { CLUB_BASE_ABBREVIATIONS, buildScopedAbbreviations } from "../docs/js/clubs.js";

test("CLUB_BASE_ABBREVIATIONS has un-disambiguated abbreviations, including duplicates", () => {
  assert.equal(CLUB_BASE_ABBREVIATIONS.get("CL000229"), "DCC"); // Derwent Canoe Club
  assert.equal(CLUB_BASE_ABBREVIATIONS.get("CL000335"), "DCC"); // Darwin Canoe Club
});

test("buildScopedAbbreviations suffixes both clubs when both share an abbreviation", () => {
  const result = buildScopedAbbreviations(["CL000229", "CL000335"]);
  assert.equal(result.get("CL000229"), "DCC-229");
  assert.equal(result.get("CL000335"), "DCC-335");
});

test("buildScopedAbbreviations leaves a club unsuffixed when the clashing club isn't in scope", () => {
  const result = buildScopedAbbreviations(["CL000229"]);
  assert.equal(result.get("CL000229"), "DCC");
  assert.equal(result.has("CL000335"), false);
});

test("buildScopedAbbreviations ignores repeats of the same club ID (not a clash)", () => {
  const result = buildScopedAbbreviations(["CL000229", "CL000229", "CL000229"]);
  assert.equal(result.get("CL000229"), "DCC");
});

test("buildScopedAbbreviations omits club IDs not in the directory", () => {
  const result = buildScopedAbbreviations(["CL999999"]);
  assert.equal(result.has("CL999999"), false);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { toUpperFamilyCase, toTitleGivenCase, normalizeRowNames } from "../docs/js/nameCase.js";

test("toUpperFamilyCase upper-cases the whole value", () => {
  assert.equal(toUpperFamilyCase("smith"), "SMITH");
  assert.equal(toUpperFamilyCase(""), "");
});

test("toTitleGivenCase capitalizes after the start, spaces, and hyphens", () => {
  assert.equal(toTitleGivenCase("john"), "John");
  assert.equal(toTitleGivenCase("MARY-JANE"), "Mary-Jane");
  assert.equal(toTitleGivenCase("van der berg"), "Van Der Berg");
  assert.equal(toTitleGivenCase(""), "");
});

test("normalizeRowNames applies casing to both crew members' names only", () => {
  const row = {
    familyName: "smith",
    givenName: "john",
    familyName2: "jones",
    givenName2: "alex",
    classId: "MK1",
    category: "MK1OPN",
  };
  const normalized = normalizeRowNames(row);
  assert.equal(normalized.familyName, "SMITH");
  assert.equal(normalized.givenName, "John");
  assert.equal(normalized.familyName2, "JONES");
  assert.equal(normalized.givenName2, "Alex");
  assert.equal(normalized.classId, "MK1");
  assert.equal(normalized.category, "MK1OPN");
});

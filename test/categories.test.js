import { test } from "node:test";
import assert from "node:assert/strict";
import { findCategory } from "../docs/js/categories.js";

test("findCategory selects the range covering the given age", () => {
  const classDef = {
    categories: [
      { catId: "U12", firstYear: 11, lastYear: 12 },
      { catId: "U14", firstYear: 13, lastYear: 14 },
    ],
  };
  assert.equal(findCategory(classDef, 13).catId, "U14");
  assert.equal(findCategory(classDef, 30), null);
});

test("findCategory returns null for a class with no categories", () => {
  assert.equal(findCategory({ categories: [] }, 20), null);
});

test("findCategory returns null when classDef is missing", () => {
  assert.equal(findCategory(undefined, 20), null);
});

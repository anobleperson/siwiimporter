import { test } from "node:test";
import assert from "node:assert/strict";
import { CANONICAL_CLASSES } from "../docs/js/canonicalClasses.js";

test("contains all 14 classes from CategoryExplorationEmpty.xml", () => {
  assert.deepEqual(
    [...CANONICAL_CLASSES.keys()],
    ["MK1", "WK1", "MC1", "WC1", "XC2", "MX1", "WX1", "MK1x3", "WK1x3", "MC1x3", "WC1x3", "XC2x3", "FR", "NA"]
  );
});

test("the four single-boat classes each have the standard 10 age categories", () => {
  for (const classId of ["MK1", "WK1", "MC1", "WC1"]) {
    const classDef = CANONICAL_CLASSES.get(classId);
    assert.equal(classDef.categories.length, 10);
    assert.deepEqual(classDef.categories[0], { catId: `${classId}U10`, firstYear: 1, lastYear: 10 });
    assert.deepEqual(classDef.categories.at(-1), { catId: `${classId}VINT`, firstYear: 55, lastYear: 100 });
  }
});

test("XC2, kayak cross, team, forerunner, and not-assigned classes have no categories", () => {
  for (const classId of ["XC2", "MX1", "WX1", "MK1x3", "WK1x3", "MC1x3", "WC1x3", "XC2x3", "FR", "NA"]) {
    assert.deepEqual(CANONICAL_CLASSES.get(classId).categories, []);
  }
});

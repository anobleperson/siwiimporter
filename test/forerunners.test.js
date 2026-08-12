import { test } from "node:test";
import assert from "node:assert/strict";
import { buildForerunnerRows } from "../docs/js/forerunners.js";

test("buildForerunnerRows produces exactly two FR rows in order", () => {
  const rows = buildForerunnerRows();
  assert.equal(rows.length, 2);
  assert.equal(rows[0].familyName, "Fore Runner 1");
  assert.equal(rows[1].familyName, "Fore Runner 2");
  for (const row of rows) {
    assert.equal(row.classId, "FR");
    assert.equal(row.givenName, "");
    assert.equal(row.category, "");
    assert.equal(row.categoryAge, null);
  }
});

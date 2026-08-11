// Hand-crafted C2 fixtures — the real example files contain no C2 usage,
// so this exercises the pairing logic against constructed records.
import { test } from "node:test";
import assert from "node:assert/strict";
import { generateImportRows } from "../docs/js/transform.js";

function record(overrides) {
  return {
    firstName: "First",
    lastName: "Last",
    dob: "1/1/2000",
    gender: "Male",
    country: "Australia",
    organisation: "Some Club",
    classTokens: [],
    c2PartnerName: "",
    sourceRowIndex: 1,
    ...overrides,
  };
}

function siwiConfigWithC2() {
  return {
    classes: new Map([
      ["MC2", { classId: "MC2", categories: [{ catId: "MC2OPN", firstYear: 15, lastYear: 99 }] }],
      ["WC2", { classId: "WC2", categories: [{ catId: "WC2OPN", firstYear: 15, lastYear: 99 }] }],
    ]),
    competitionYear: 2025,
  };
}

test("valid C2 pair produces a single combined row, older paddler sets category", () => {
  const alice = record({
    firstName: "Alice",
    lastName: "Anderson",
    dob: "1/1/1990", // older -> age 35
    gender: "Female",
    classTokens: ["C2"],
    c2PartnerName: "Beth Brown",
    sourceRowIndex: 1,
  });
  const beth = record({
    firstName: "Beth",
    lastName: "Brown",
    dob: "1/1/2005", // younger -> age 20
    gender: "Female",
    classTokens: ["C2"],
    c2PartnerName: "Alice Anderson",
    sourceRowIndex: 2,
  });

  const { rows, errors } = generateImportRows([alice, beth], siwiConfigWithC2());

  assert.deepEqual(errors, []);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].classId, "WC2");
  assert.equal(rows[0].familyName, "Anderson");
  assert.equal(rows[0].familyName2, "Brown");
  // Older paddler (Alice, age 35 in 2025) determines category; if the
  // younger paddler's age (20) had been used it would still fall in the
  // same OPN bucket here, so also assert the birthdate came from the
  // initiator to confirm which record drove the row.
  assert.equal(rows[0].birthdate, "1990-01-01");
});

test("partner's other solo class still emitted; pair not duplicated", () => {
  const alice = record({
    firstName: "Alice",
    lastName: "Anderson",
    dob: "1/1/1990",
    gender: "Female",
    classTokens: ["C2"],
    c2PartnerName: "Beth Brown",
    sourceRowIndex: 1,
  });
  const beth = record({
    firstName: "Beth",
    lastName: "Brown",
    dob: "1/1/2005",
    gender: "Female",
    classTokens: ["K1", "C2"],
    c2PartnerName: "Alice Anderson",
    sourceRowIndex: 2,
  });
  const siwiConfig = siwiConfigWithC2();
  siwiConfig.classes.set("WK1", {
    classId: "WK1",
    categories: [{ catId: "WK1U23", firstYear: 15, lastYear: 23 }],
  });

  const { rows, errors } = generateImportRows([alice, beth], siwiConfig);

  assert.deepEqual(errors, []);
  const c2Rows = rows.filter((r) => r.classId === "WC2");
  const k1Rows = rows.filter((r) => r.classId === "WK1");
  assert.equal(c2Rows.length, 1, "exactly one combined C2 row, not two");
  assert.equal(k1Rows.length, 1, "Beth's own solo K1 class still processed");
  assert.equal(k1Rows[0].familyName, "Brown");
});

test("blank partner name is a blocking error", () => {
  const alice = record({ classTokens: ["C2"], c2PartnerName: "" });
  const { rows, errors } = generateImportRows([alice], siwiConfigWithC2());
  assert.equal(rows.length, 0);
  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /no partner name/);
});

test("partner not found is a blocking error", () => {
  const alice = record({ classTokens: ["C2"], c2PartnerName: "Nobody Here" });
  const { rows, errors } = generateImportRows([alice], siwiConfigWithC2());
  assert.equal(rows.length, 0);
  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /not found/);
});

test("ambiguous partner match (duplicate name in roster) is a blocking error", () => {
  const alice = record({
    firstName: "Alice",
    lastName: "Anderson",
    classTokens: ["C2"],
    c2PartnerName: "Beth Brown",
    sourceRowIndex: 1,
  });
  const beth1 = record({ firstName: "Beth", lastName: "Brown", sourceRowIndex: 2 });
  const beth2 = record({ firstName: "Beth", lastName: "Brown", sourceRowIndex: 3 });

  const { rows, errors } = generateImportRows([alice, beth1, beth2], siwiConfigWithC2());
  assert.equal(rows.length, 0);
  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /multiple entries/);
});

test("mismatched genders in a crew is a blocking error", () => {
  const alice = record({
    firstName: "Alice",
    lastName: "Anderson",
    gender: "Female",
    classTokens: ["C2"],
    c2PartnerName: "Bob Brown",
    sourceRowIndex: 1,
  });
  const bob = record({
    firstName: "Bob",
    lastName: "Brown",
    gender: "Male",
    classTokens: ["C2"],
    c2PartnerName: "Alice Anderson",
    sourceRowIndex: 2,
  });

  const { rows, errors } = generateImportRows([alice, bob], siwiConfigWithC2());
  assert.equal(rows.length, 0);
  // Both sides independently attempt pairing and both fail on the same
  // root cause — surfaced once per person rather than deduplicated, so
  // each of Alice's and Bob's rows is individually flagged.
  assert.equal(errors.length, 2);
  assert.ok(errors.every((e) => /mismatched genders/.test(e.message)));
  assert.deepEqual(
    errors.map((e) => e.person).sort(),
    ["Alice Anderson", "Bob Brown"]
  );
});

test("missing crew ClassId in the project is a blocking error", () => {
  const alice = record({
    firstName: "Alice",
    lastName: "Anderson",
    classTokens: ["C2"],
    c2PartnerName: "Beth Brown",
    sourceRowIndex: 1,
  });
  const beth = record({
    firstName: "Beth",
    lastName: "Brown",
    classTokens: ["C2"],
    c2PartnerName: "Alice Anderson",
    sourceRowIndex: 2,
  });
  const siwiConfig = { classes: new Map(), competitionYear: 2025 }; // no MC2 defined

  const { rows, errors } = generateImportRows([alice, beth], siwiConfig);
  assert.equal(rows.length, 0);
  // Same root cause surfaced once per person, as above.
  assert.equal(errors.length, 2);
  assert.ok(errors.every((e) => /not a recognized class/.test(e.message)));
});

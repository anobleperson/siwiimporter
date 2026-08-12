import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseJustGoCsv } from "../docs/js/justgo.js";
import { CANONICAL_CLASSES } from "../docs/js/canonicalClasses.js";
import { generateImportRows, rowToCsvArray } from "../docs/js/transform.js";

const justgoPath = path.join(
  import.meta.dirname,
  "..",
  "examples",
  "Attendees - SLA Broken Bridge Simple Slalom 23rd August.csv"
);

// The real example CSV was captured for the Forth 30 March 2025 event, so
// hardcode that competition year to keep the expected categories below
// matching what the original Siwi-project-derived fixture produced.
function loadRealFixtures() {
  const records = parseJustGoCsv(readFileSync(justgoPath, "utf8"));
  const classesConfig = { classes: CANONICAL_CLASSES, competitionYear: 2025 };
  return { records, classesConfig };
}

test("end-to-end against the real example JustGo CSV: 6 rows, no errors, no warnings", () => {
  const { records, classesConfig } = loadRealFixtures();
  const { rows, errors, warnings } = generateImportRows(records, classesConfig);

  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
  assert.equal(rows.length, 6);

  const byName = (given, family) =>
    rows.filter((r) => r.givenName === given && r.familyName === family);

  assert.equal(byName("Person1FirstName", "Person1FamilyName").length, 1);
  assert.equal(byName("Person1FirstName", "Person1FamilyName")[0].classId, "MK1");
  assert.equal(byName("Person1FirstName", "Person1FamilyName")[0].category, "MK1U12");

  const person7 = byName("Person7FirstName", "Person7FamilyName");
  assert.equal(person7.length, 2);
  assert.deepEqual(
    person7.map((r) => r.classId).sort(),
    ["MC1", "MK1"]
  );
  assert.deepEqual(
    person7.map((r) => r.category).sort(),
    ["MC1U16", "MK1U16"]
  );

  // Darwin Canoe Club (also "DCC") never appears in this fixture, so no
  // disambiguating suffix is needed for Derwent Canoe Club here.
  assert.equal(byName("Person6FirstName", "Person6FamilyName")[0].club, "DCC,TSCC");

  // Non-paddlers / blank-classes rows never appear.
  const names = rows.map((r) => `${r.givenName}|${r.familyName}`);
  assert.ok(!names.some((n) => n.includes("Person2FirstName")));
  assert.ok(!names.some((n) => n.includes("Person3FirstName")));
  assert.ok(!names.some((n) => n.includes("Person9FirstName")));
});

test("output rows serialize with the expected 9-column shape", () => {
  const { records, classesConfig } = loadRealFixtures();
  const { rows } = generateImportRows(records, classesConfig);
  for (const row of rows) {
    assert.equal(rowToCsvArray(row).length, 9);
  }
});

test("a class not in the known class list produces a blocking error, not a crash", () => {
  const records = [
    {
      firstName: "Test",
      lastName: "Paddler",
      dob: "1/1/2000",
      gender: "Male",
      country: "Australia",
      organisation: "Some Club",
      classTokens: ["ZZ9"],
      c2PartnerName: "",
      sourceRowIndex: 1,
    },
  ];
  const classesConfig = { classes: new Map(), competitionYear: 2025 };

  const { rows, errors } = generateImportRows(records, classesConfig);
  assert.equal(rows.length, 0);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].severity, "error");
  assert.match(errors[0].message, /not a recognized class/);
});

test("an age with no matching category produces a blocking error", () => {
  const records = [
    {
      firstName: "Test",
      lastName: "Paddler",
      dob: "1/1/1900",
      gender: "Male",
      country: "Australia",
      organisation: "Some Club",
      classTokens: ["K1"],
      c2PartnerName: "",
      sourceRowIndex: 1,
    },
  ];
  const classesConfig = {
    classes: new Map([["MK1", { classId: "MK1", categories: [{ catId: "MK1U16", firstYear: 15, lastYear: 16 }] }]]),
    competitionYear: 2025,
  };

  const { rows, errors } = generateImportRows(records, classesConfig);
  assert.equal(rows.length, 0);
  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /No category/);
});

test("a canonical class with no categories produces a row with a blank category and no error", () => {
  const records = [
    {
      firstName: "Test",
      lastName: "Crosser",
      dob: "1/1/2000",
      gender: "Male",
      country: "Australia",
      organisation: "Some Club",
      classTokens: ["X1"], // Kayak Cross — no age categories in the canonical set
      c2PartnerName: "",
      sourceRowIndex: 1,
    },
  ];
  const classesConfig = { classes: CANONICAL_CLASSES, competitionYear: 2025 };

  const { rows, errors } = generateImportRows(records, classesConfig);
  assert.deepEqual(errors, []);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].classId, "MX1");
  assert.equal(rows[0].category, "");
});

test("an unrecognized country produces a non-blocking warning and a row is still generated", () => {
  const records = [
    {
      firstName: "Test",
      lastName: "Paddler",
      dob: "1/1/2010",
      gender: "Male",
      country: "Atlantis",
      organisation: "Some Club",
      classTokens: ["K1"],
      c2PartnerName: "",
      sourceRowIndex: 1,
    },
  ];
  const classesConfig = {
    classes: new Map([["MK1", { classId: "MK1", categories: [{ catId: "MK1OPN", firstYear: 15, lastYear: 34 }] }]]),
    competitionYear: 2025,
  };

  const { rows, errors, warnings } = generateImportRows(records, classesConfig);
  assert.equal(errors.length, 0);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].noc, "");
  assert.equal(warnings.length, 1);
  assert.equal(warnings[0].severity, "warning");
});

function paddlerRecord({ firstName, lastName, organisation, sourceRowIndex }) {
  return {
    firstName,
    lastName,
    dob: "1/1/2000",
    gender: "Male",
    country: "Australia",
    organisation,
    classTokens: ["K1"],
    c2PartnerName: "",
    sourceRowIndex,
  };
}

test("club abbreviation clash is only disambiguated when both clubs are actually in this event's roster", () => {
  const records = [
    // Fairfield Canoe Club (CL000234) and Fitzroy Canoe Club (CL000236)
    // both abbreviate to "FCC" in the directory — both are entered here, so
    // both must be disambiguated.
    paddlerRecord({ firstName: "A", lastName: "One", organisation: "Fairfield Canoe Club (CL000234)", sourceRowIndex: 1 }),
    paddlerRecord({ firstName: "B", lastName: "Two", organisation: "Fitzroy Canoe Club (CL000236)", sourceRowIndex: 2 }),
  ];
  const classesConfig = { classes: CANONICAL_CLASSES, competitionYear: 2025 };

  const { rows, errors } = generateImportRows(records, classesConfig);
  assert.deepEqual(errors, []);
  assert.equal(rows.find((r) => r.givenName === "A").club, "FCC-234");
  assert.equal(rows.find((r) => r.givenName === "B").club, "FCC-236");
});

test("club abbreviation clash elsewhere in the directory is irrelevant when only one side is entered", () => {
  const records = [
    // Fairfield Canoe Club (CL000234) is entered alone; Fitzroy and
    // Footscray (the other two "FCC" clubs) aren't in this roster at all,
    // so no disambiguating suffix should be added.
    paddlerRecord({ firstName: "A", lastName: "One", organisation: "Fairfield Canoe Club (CL000234)", sourceRowIndex: 1 }),
  ];
  const classesConfig = { classes: CANONICAL_CLASSES, competitionYear: 2025 };

  const { rows, errors } = generateImportRows(records, classesConfig);
  assert.deepEqual(errors, []);
  assert.equal(rows[0].club, "FCC");
});

test("a non-competing record's club membership doesn't influence disambiguation", () => {
  const records = [
    paddlerRecord({ firstName: "A", lastName: "One", organisation: "Fairfield Canoe Club (CL000234)", sourceRowIndex: 1 }),
    {
      ...paddlerRecord({ firstName: "B", lastName: "Two", organisation: "Fitzroy Canoe Club (CL000236)", sourceRowIndex: 2 }),
      classTokens: [], // not competing — silently skipped, per FR4
    },
  ];
  const classesConfig = { classes: CANONICAL_CLASSES, competitionYear: 2025 };

  const { rows, errors } = generateImportRows(records, classesConfig);
  assert.deepEqual(errors, []);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].club, "FCC");
});

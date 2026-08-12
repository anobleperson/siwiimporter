import { test } from "node:test";
import assert from "node:assert/strict";
import { allocateBibs } from "../docs/js/bibAllocation.js";
import { buildForerunnerRows } from "../docs/js/forerunners.js";

function row({ familyName, givenName, classId, categoryAge }) {
  return { familyName, givenName, familyName2: "", givenName2: "", classId, categoryAge, category: "" };
}

test("returns rows reordered into bib order, not upload order", () => {
  // Men appear first in "upload order" here, women second — the returned
  // array should still come back Forerunners, then Women, then Men.
  const rows = [
    row({ familyName: "Xray", givenName: "M", classId: "MK1", categoryAge: 20 }),
    row({ familyName: "Alpha", givenName: "W", classId: "WK1", categoryAge: 20 }),
  ];
  const result = allocateBibs(rows);
  assert.equal(result.length, 2);
  assert.equal(result[0].classId, "WK1");
  assert.equal(result[0].bib, 1);
  assert.equal(result[1].classId, "MK1");
  assert.equal(result[1].bib, 5);
});

test("forerunners get bibs 1 and 2 in their defined order", () => {
  const rows = buildForerunnerRows();
  allocateBibs(rows);
  assert.equal(rows[0].bib, 1);
  assert.equal(rows[1].bib, 2);
});

test("no forerunners means the women's group starts at bib 1", () => {
  const rows = [row({ familyName: "Jones", givenName: "Bea", classId: "WK1", categoryAge: 20 })];
  allocateBibs(rows);
  assert.equal(rows[0].bib, 1);
});

test("within a group, sorts youngest-first then by family name, then given name", () => {
  const rows = [
    row({ familyName: "Zeta", givenName: "Amy", classId: "WK1", categoryAge: 20 }),
    row({ familyName: "Alpha", givenName: "Bob", classId: "WK1", categoryAge: 15 }),
    row({ familyName: "Beta", givenName: "Cara", classId: "WC1", categoryAge: 15 }),
  ];
  allocateBibs(rows);
  const [zeta, alpha, beta] = rows;
  assert.equal(alpha.bib, 1); // age 15, "Alpha" < "Beta"
  assert.equal(beta.bib, 2); // age 15, "Beta"
  assert.equal(zeta.bib, 3); // age 20, sorts after both age-15 rows
});

test("a person appearing on two rows gets one shared bib, not two", () => {
  const rows = [
    row({ familyName: "Smith", givenName: "Ann", classId: "WK1", categoryAge: 20 }),
    row({ familyName: "Smith", givenName: "Ann", classId: "WC1", categoryAge: 20 }),
    row({ familyName: "Jones", givenName: "Bea", classId: "WK1", categoryAge: 20 }),
  ];
  allocateBibs(rows);
  const [smithK1, smithC1, jones] = rows;
  assert.equal(jones.bib, 1); // "Jones" < "Smith" alphabetically, same age
  assert.equal(smithK1.bib, 2);
  assert.equal(smithC1.bib, 2); // same person as smithK1, same bib
});

test("rounds up to the next multiple of 5 between women and men, even off an exact multiple", () => {
  // 5 distinct women -> bibs 1-5 (an exact multiple of 5).
  const women = ["Alpha", "Bravo", "Charlie", "Delta", "Echo"].map((familyName, i) =>
    row({ familyName, givenName: "W", classId: "WK1", categoryAge: 20 + i })
  );
  const men = [row({ familyName: "Zulu", givenName: "M", classId: "MK1", categoryAge: 20 })];
  const rows = [...women, ...men];
  allocateBibs(rows);
  assert.equal(women[4].bib, 5);
  assert.equal(men[0].bib, 10); // never reuses the boundary at 5
});

test("last women bib 7 rounds men up to 10; last bib 12 rounds up to 15", () => {
  // Distinct ascending ages, so sort order is unambiguous regardless of
  // family-name string ordering (e.g. "W10" sorts before "W2" lexically).
  const sevenWomen = Array.from({ length: 7 }, (_, i) =>
    row({ familyName: `W${i}`, givenName: "W", classId: "WK1", categoryAge: 20 + i })
  );
  const men1 = [row({ familyName: "Zulu", givenName: "M", classId: "MK1", categoryAge: 20 })];
  const rows1 = [...sevenWomen, ...men1];
  allocateBibs(rows1);
  assert.equal(sevenWomen[6].bib, 7);
  assert.equal(men1[0].bib, 10);

  const twelveWomen = Array.from({ length: 12 }, (_, i) =>
    row({ familyName: `W${i}`, givenName: "W", classId: "WK1", categoryAge: 20 + i })
  );
  const men2 = [row({ familyName: "Zulu", givenName: "M", classId: "MK1", categoryAge: 20 })];
  const rows2 = [...twelveWomen, ...men2];
  allocateBibs(rows2);
  assert.equal(twelveWomen[11].bib, 12);
  assert.equal(men2[0].bib, 15);
});

test("an empty women's group still lets men round up from the forerunners' highest bib", () => {
  const rows = [...buildForerunnerRows(), row({ familyName: "Zulu", givenName: "M", classId: "MK1", categoryAge: 20 })];
  allocateBibs(rows);
  const menRow = rows[rows.length - 1];
  assert.equal(menRow.bib, 5); // forerunners end at 2, next multiple of 5 above 2 is 5
});

test("no forerunners and no women means men start at bib 1", () => {
  const rows = [row({ familyName: "Zulu", givenName: "M", classId: "MK1", categoryAge: 20 })];
  allocateBibs(rows);
  assert.equal(rows[0].bib, 1);
});

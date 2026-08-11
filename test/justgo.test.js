import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  parseJustGoCsv,
  parseAustralianDate,
  stripClubCode,
  assertStableHeader,
} from "../docs/js/justgo.js";

const fixturePath = path.join(
  import.meta.dirname,
  "..",
  "examples",
  "Attendees - SLA Broken Bridge Simple Slalom 23rd August.csv"
);

test("parseAustralianDate parses D/M/YYYY", () => {
  assert.deepEqual(parseAustralianDate("13/4/2013"), { year: 2013, month: 4, day: 13 });
});

test("parseAustralianDate returns null for unparseable input", () => {
  assert.equal(parseAustralianDate("not a date"), null);
  assert.equal(parseAustralianDate(""), null);
});

test("stripClubCode strips only a trailing club code", () => {
  assert.equal(stripClubCode("Derwent Canoe Club (CL000229)"), "Derwent Canoe Club");
  assert.equal(
    stripClubCode("Derwent Canoe Club (CL000229),Tasmanian Sea Canoeing Club Inc. (CL000312)"),
    "Derwent Canoe Club (CL000229),Tasmanian Sea Canoeing Club Inc."
  );
});

test("assertStableHeader throws on an unexpected layout", () => {
  assert.throws(() => assertStableHeader(["Wrong", "Header"]));
});

test("parseJustGoCsv parses the real example file end-to-end", () => {
  const text = readFileSync(fixturePath, "utf8");
  const records = parseJustGoCsv(text);

  assert.equal(records.length, 9);

  const person1 = records.find((r) => r.firstName === "Person1FirstName");
  assert.deepEqual(person1.classTokens, ["K1"]);
  assert.equal(person1.gender, "Male");
  assert.equal(person1.dob, "18/5/2013");

  const person7 = records.find((r) => r.lastName === "Person7FamilyName");
  assert.deepEqual(person7.classTokens, ["K1", "C1"]);

  const person2 = records.find((r) => r.firstName === "Person2FirstName");
  assert.deepEqual(person2.classTokens, []);

  const person9 = records.find((r) => r.firstName === "Person9FirstName");
  assert.deepEqual(person9.classTokens, []);

  const person6 = records.find((r) => r.firstName === "Person6FirstName");
  assert.equal(
    person6.organisation,
    "Derwent Canoe Club (CL000229),Tasmanian Sea Canoeing Club Inc. (CL000312)"
  );
});

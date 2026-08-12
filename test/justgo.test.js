import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  parseJustGoCsv,
  parseAustralianDate,
  resolveClubField,
  extractClubIds,
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

test("resolveClubField resolves a single club using the given abbreviation map", () => {
  const abbreviations = new Map([["CL000229", "DCC"]]);
  assert.deepEqual(resolveClubField("Derwent Canoe Club (CL000229)", abbreviations), {
    club: "DCC",
    unknownClubIds: [],
  });
});

test("resolveClubField resolves a multi-club value to a comma-separated list of abbreviations", () => {
  const abbreviations = new Map([
    ["CL000229", "DCC-229"],
    ["CL000312", "TSCC"],
  ]);
  assert.deepEqual(
    resolveClubField("Derwent Canoe Club (CL000229),Tasmanian Sea Canoeing Club Inc. (CL000312)", abbreviations),
    { club: "DCC-229,TSCC", unknownClubIds: [] }
  );
});

test("resolveClubField falls back to the plain name and reports unknown club IDs", () => {
  assert.deepEqual(resolveClubField("Some New Club (CL999999)", new Map()), {
    club: "Some New Club",
    unknownClubIds: ["CL999999"],
  });
});

test("resolveClubField leaves a value with no club code untouched", () => {
  assert.deepEqual(resolveClubField("Some Club", new Map()), { club: "Some Club", unknownClubIds: [] });
});

test("extractClubIds pulls club IDs out of a multi-club organisation value", () => {
  assert.deepEqual(
    extractClubIds("Derwent Canoe Club (CL000229),Tasmanian Sea Canoeing Club Inc. (CL000312)"),
    ["CL000229", "CL000312"]
  );
});

test("extractClubIds returns an empty array when there's no club code", () => {
  assert.deepEqual(extractClubIds("Some Club"), []);
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

import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCsv, serializeCsv } from "../docs/js/csv.js";

test("parses simple comma-separated rows", () => {
  const rows = parseCsv("a,b,c\n1,2,3");
  assert.deepEqual(rows, [
    ["a", "b", "c"],
    ["1", "2", "3"],
  ]);
});

test("handles a quoted field containing a comma", () => {
  const rows = parseCsv('name,org\nPerson6FirstName,"Derwent Canoe Club (CL000229),Tasmanian Sea Canoeing Club Inc. (CL000312)"');
  assert.deepEqual(rows[1], [
    "Person6FirstName",
    "Derwent Canoe Club (CL000229),Tasmanian Sea Canoeing Club Inc. (CL000312)",
  ]);
});

test("handles doubled-quote escaping inside a quoted field", () => {
  const rows = parseCsv('a,b\n"say ""hi""",2');
  assert.deepEqual(rows[1], ['say "hi"', "2"]);
});

test("treats the observed \\r\\r\\n record separator as producing a blank row between records", () => {
  const rows = parseCsv("a,b\r\r\n1,2\r\r\n3,4");
  // The stray extra \r is itself a row terminator, producing an empty row
  // between each real record — callers are expected to filter these.
  assert.deepEqual(rows, [
    ["a", "b"],
    [""],
    ["1", "2"],
    [""],
    ["3", "4"],
  ]);
});

test("serializeCsv quotes fields containing commas, quotes, or newlines", () => {
  const csv = serializeCsv([
    ["Family Name", "Club"],
    ["Smith", "Club A, Club B"],
    ["O'Brien", 'Say "hi"'],
  ]);
  assert.equal(
    csv,
    'Family Name,Club\r\nSmith,"Club A, Club B"\r\nO\'Brien,"Say ""hi"""'
  );
});

test("round-trips parse -> serialize -> parse", () => {
  const original = [
    ["Family Name", "Club"],
    ["Person6FamilyName", "Derwent Canoe Club (CL000229),Tasmanian Sea Canoeing Club Inc."],
  ];
  const parsed = parseCsv(serializeCsv(original));
  assert.deepEqual(parsed, original);
});

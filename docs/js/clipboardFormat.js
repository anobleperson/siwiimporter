// Formats OutputRow[] for pasting into Canoe123's Import tab grid. Pure, DOM-free.
//
// Canoe123's paste handler enforces tab-delimited fields, CRLF row endings,
// no header row (columns are mapped positionally by the operator after
// pasting), and no quoting — see
// docs/import-tab-clipboard-format.md in the Canoe123 source tree for the
// full spec this was derived from.

// FamilyName, GivenName, NOC, Birthdate, Club, Class, Category, Bib, Ranking, StartOrder.
// Bib/Ranking/StartOrder are always blank — this app doesn't produce them —
// but the columns are kept so positional mapping stays consistent.
const CLIPBOARD_COLUMN_COUNT = 10;

/**
 * @param {import("./transform.js").OutputRow[]} rows
 * @returns {string}
 */
export function formatClipboardRows(rows) {
  const lines = [];
  for (const row of rows) {
    lines.push(
      clipboardRow([row.familyName, row.givenName, row.noc, row.birthdate, row.club, row.classId, row.category])
    );
    if (row.familyName2) {
      // C2 crew: partner's name goes on its own row, name fields only —
      // requires "2nd C2 Name in 2nd row" enabled in Canoe123.
      lines.push(clipboardRow([row.familyName2, row.givenName2]));
    }
  }
  return lines.join("\r\n");
}

function clipboardRow(fields) {
  const padded = fields.map(sanitizeField);
  while (padded.length < CLIPBOARD_COLUMN_COUNT) padded.push("");
  return padded.join("\t");
}

// The paste format has no quoting mechanism, so a stray tab/CR/LF in a
// field would silently split it into the wrong column.
function sanitizeField(value) {
  return String(value ?? "").replace(/[\t\r\n]+/g, " ").trim();
}

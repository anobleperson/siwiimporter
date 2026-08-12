// Formats OutputRow[] for pasting into Canoe123's Import tab grid. Pure, DOM-free.
//
// Canoe123's paste handler enforces tab-delimited fields, CRLF row endings,
// and no quoting; columns are mapped positionally by the operator via a
// per-column dropdown after pasting — the app itself never auto-detects a
// header row. See docs/import-tab-clipboard-format.md in the Canoe123
// source tree for the full spec this was derived from.

// FamilyName, GivenName, NOC, Birthdate, Club, Class, Category, Bib, Ranking, StartOrder.
// Ranking/StartOrder are always blank — this app doesn't produce them — and
// Bib is blank too unless the optional "Allocate Bibs" feature (FR19) set
// row.bib. The columns are kept regardless so positional mapping stays
// consistent whether or not that feature is on.
const CLIPBOARD_COLUMN_COUNT = 10;

// Matches the column labels shown in Canoe123's own Import tab dropdown
// chooser (documentation/siwi-import-format.md), not the app's own naming.
const CLIPBOARD_HEADER = [
  "Family Name",
  "G.Name",
  "Ctry.",
  "Birthdate",
  "Club",
  "Class",
  "Category",
  "Bib\\No.",
  "Ranking",
  "Start\\Order",
];

/**
 * @param {import("./transform.js").OutputRow[]} rows
 * @returns {string}
 */
export function formatClipboardRows(rows) {
  // Canoe123 doesn't recognize this as a header — it lands as grid row 1
  // like any other pasted row. It's included anyway so the operator has
  // column labels to map against on the first paste; delete that row
  // before "Save to Participants" or it'll be saved as a bogus entry.
  const lines = [clipboardRow(CLIPBOARD_HEADER)];
  for (const row of rows) {
    lines.push(
      clipboardRow([
        row.familyName,
        row.givenName,
        row.noc,
        row.birthdate,
        row.club,
        row.classId,
        row.category,
        row.bib ?? "",
      ])
    );
    if (row.familyName2) {
      // C2 crew: partner's name goes on its own row, name fields only, no
      // bib of their own (the crew shares the primary paddler's bib above —
      // see the open question on this in FR19) — requires "2nd C2 Name in
      // 2nd row" enabled in Canoe123.
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

// Generic RFC4180-ish CSV parsing/serialization. Pure, DOM-free.
//
// parseCsv is a character-level state machine rather than a split()-based
// parser because real-world exports (e.g. JustGo) can contain quoted fields
// with embedded commas, and can use inconsistent/duplicated line endings
// (observed: `\r\r\n` between records). Any of `\r\n`, `\r`, or `\n` is
// treated as a row terminator, which means some genuinely blank rows will
// be emitted for such files — callers are expected to filter those out.

/**
 * @param {string} text
 * @returns {string[][]}
 */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const len = text.length;

  function endField() {
    row.push(field);
    field = "";
  }

  function endRow() {
    endField();
    rows.push(row);
    row = [];
  }

  while (i < len) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }

    if (ch === ",") {
      endField();
      i += 1;
      continue;
    }

    if (ch === "\r" || ch === "\n") {
      endRow();
      if (ch === "\r" && text[i + 1] === "\n") {
        i += 2;
      } else {
        i += 1;
      }
      continue;
    }

    field += ch;
    i += 1;
  }

  // Trailing field/row (file may or may not end with a terminator).
  if (field.length > 0 || row.length > 0) {
    endRow();
  }

  return rows;
}

/**
 * @param {string[][]} rows
 * @returns {string}
 */
export function serializeCsv(rows) {
  return rows
    .map((row) => row.map(serializeField).join(","))
    .join("\r\n");
}

function serializeField(value) {
  const str = String(value ?? "");
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

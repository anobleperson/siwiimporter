// Name-casing normalization for the optional "Normalize Names" output
// feature (FR17). Pure, DOM-free.

/**
 * @param {string} value
 * @returns {string}
 */
export function toUpperFamilyCase(value) {
  return String(value ?? "").toUpperCase();
}

// Simple title case: capitalizes the character at the start of the string
// and after each space/hyphen, lowercases everything else. Doesn't
// special-case apostrophes (e.g. "O'Brien") or embedded capitals (e.g.
// "McDonald") — see FR17 in documentation/specification.md.
/**
 * @param {string} value
 * @returns {string}
 */
export function toTitleGivenCase(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/(^|[\s-])([a-z])/g, (_match, sep, ch) => sep + ch.toUpperCase());
}

/**
 * @param {import("./transform.js").OutputRow} row
 * @returns {import("./transform.js").OutputRow}
 */
export function normalizeRowNames(row) {
  return {
    ...row,
    familyName: toUpperFamilyCase(row.familyName),
    givenName: toTitleGivenCase(row.givenName),
    familyName2: toUpperFamilyCase(row.familyName2),
    givenName2: toTitleGivenCase(row.givenName2),
  };
}

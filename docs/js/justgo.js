// JustGo attendee CSV adapter. Pure, DOM-free.
//
// Column positions are fixed indices rather than header-name lookups,
// because the "Simple Slalom Classes" column's header text embeds the
// event's specific offered classes (e.g. "Simple Slalom Classes K1 C1")
// and will differ per event even though its position in the export
// shouldn't. assertStableHeader() sanity-checks a handful of columns that
// should never move as cheap insurance against a JustGo export layout
// change going undetected.

import { parseCsv } from "./csv.js";
import { CLUB_ABBREVIATIONS } from "./clubs.js";

export const JUSTGO_COLUMNS = {
  firstName: 0,
  lastName: 1,
  dob: 3,
  gender: 6,
  country: 10,
  organisation: 35,
  classes: 44,
  c2PartnerName: 49,
};

const STABLE_HEADER_CHECKS = [
  [0, "FirstName"],
  [1, "LastName"],
  [3, "DOB"],
  [6, "Gender"],
  [10, "Country"],
];

/**
 * @param {string[]} header
 */
export function assertStableHeader(header) {
  for (const [index, expected] of STABLE_HEADER_CHECKS) {
    const actual = (header[index] ?? "").trim();
    if (actual !== expected) {
      throw new Error(
        `Unexpected JustGo CSV layout: column ${index} is "${actual}", expected "${expected}". ` +
          `The export format may have changed.`
      );
    }
  }
}

/**
 * @typedef {Object} JustGoRecord
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} dob
 * @property {string} gender
 * @property {string} country
 * @property {string} organisation
 * @property {string[]} classTokens
 * @property {string} c2PartnerName
 * @property {number} sourceRowIndex 1-based data-row index, for error messages
 */

/**
 * @param {string} text
 * @returns {JustGoRecord[]}
 */
export function parseJustGoCsv(text) {
  const rows = parseCsv(text).filter((row) => !isBlankRow(row));
  if (rows.length === 0) {
    throw new Error("JustGo CSV is empty.");
  }
  const [header, ...dataRows] = rows;
  assertStableHeader(header);
  return dataRows.map((row, i) => toRecord(row, i + 1));
}

function isBlankRow(row) {
  return row.length === 0 || (row.length === 1 && row[0].trim() === "");
}

/**
 * @param {string[]} row
 * @param {number} sourceRowIndex
 * @returns {JustGoRecord}
 */
function toRecord(row, sourceRowIndex) {
  const cell = (index) => (row[index] ?? "").trim();
  const classesRaw = cell(JUSTGO_COLUMNS.classes);
  const classTokens = classesRaw
    ? classesRaw
        .split("|")
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
    : [];

  return {
    firstName: cell(JUSTGO_COLUMNS.firstName),
    lastName: cell(JUSTGO_COLUMNS.lastName),
    dob: cell(JUSTGO_COLUMNS.dob),
    gender: cell(JUSTGO_COLUMNS.gender),
    country: cell(JUSTGO_COLUMNS.country),
    organisation: cell(JUSTGO_COLUMNS.organisation),
    classTokens,
    c2PartnerName: cell(JUSTGO_COLUMNS.c2PartnerName),
    sourceRowIndex,
  };
}

/**
 * Parses a JustGo-style D/M/YYYY date. Returns null (not throw) on
 * unparseable input so callers can raise a proper aggregated error.
 * @param {string} d
 * @returns {{year: number, month: number, day: number} | null}
 */
export function parseAustralianDate(d) {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec((d ?? "").trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

/**
 * Resolves a JustGo `Organisation` value — one or more comma-separated
 * "Name (CLxxxxx)" club memberships — into a comma-separated list of club
 * abbreviations (FR20). A segment whose club ID isn't in the abbreviation
 * directory falls back to its plain name with the code stripped, and is
 * reported in `unknownClubIds` so the caller can raise a warning.
 * @param {string} org
 * @returns {{club: string, unknownClubIds: string[]}}
 */
export function resolveClubField(org) {
  const segments = (org ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const unknownClubIds = [];

  const club = segments
    .map((segment) => {
      const match = /^(.*?)\s*\(CL(\d+)\)$/.exec(segment);
      if (!match) return segment;

      const clubId = `CL${match[2]}`;
      const abbreviation = CLUB_ABBREVIATIONS.get(clubId);
      if (abbreviation) return abbreviation;

      unknownClubIds.push(clubId);
      return match[1];
    })
    .join(",");

  return { club, unknownClubIds };
}

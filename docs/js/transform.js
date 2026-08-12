// Core cross-reference pipeline: JustGo records + class/category config ->
// Canoe123 import rows. Pure, DOM-free.
//
// Design: never early-return on a per-row/per-token problem. Every issue is
// collected into `errors` (blocking) or `warnings` (non-blocking) so the
// caller can show the user everything wrong in one pass, per the confirmed
// "raise an error, don't create the file, explain what field and the
// issue was" requirement.

import { parseAustralianDate, resolveClubField, extractClubIds } from "./justgo.js";
import { buildScopedAbbreviations } from "./clubs.js";
import { findCategory } from "./categories.js";
import { countryNameToNoc } from "./noc.js";

export const OUTPUT_HEADER = [
  "Family Name",
  "G.Name",
  "2nd Family Name",
  "2nd G. Name",
  "Ctry",
  "Birthdate",
  "Club",
  "Class",
  "Category",
];

/**
 * @typedef {Object} Issue
 * @property {"error"|"warning"} severity
 * @property {number} sourceRowIndex
 * @property {string} person
 * @property {string} field
 * @property {string} [derivedValue]
 * @property {string} message
 *
 * @typedef {Object} OutputRow
 * @property {string} familyName
 * @property {string} givenName
 * @property {string} familyName2
 * @property {string} givenName2
 * @property {string} noc
 * @property {string} birthdate
 * @property {string} club
 * @property {string} classId
 * @property {string} category
 * @property {number|null} categoryAge - age used for the category calculation
 *   (or would have been, for a no-category class); null only if no race year
 *   was available. Used by bibAllocation.js to sort youngest-first.
 */

/**
 * @param {import("./justgo.js").JustGoRecord[]} records
 * @param {{classes: Map<string, import("./categories.js").ClassDef>, competitionYear: number}} classesConfig
 * @returns {{rows: OutputRow[], errors: Issue[], warnings: Issue[]}}
 */
export function generateImportRows(records, classesConfig) {
  const rows = [];
  const errors = [];
  const warnings = [];
  const nameIndex = buildNameIndex(records);
  const consumedC2 = new Set();

  // Disambiguation (FR10) is scoped to this event's actual participants —
  // records with no class tokens never produce a Club output cell, so their
  // club memberships mustn't influence whether another club's abbreviation
  // gets a "-<club number>" suffix.
  const competingClubIds = records
    .filter((record) => record.classTokens.length > 0)
    .flatMap((record) => extractClubIds(record.organisation));
  const clubAbbreviations = buildScopedAbbreviations(competingClubIds);

  const ctx = { classesConfig, rows, errors, warnings, clubAbbreviations };

  for (const record of records) {
    if (record.classTokens.length === 0) continue; // not competing, silent skip

    for (const token of record.classTokens) {
      const normalized = normalizeClassToken(token);
      if (normalized === "C2") {
        processC2(record, nameIndex, consumedC2, ctx);
      } else {
        processSolo(record, normalized, ctx);
      }
    }
  }

  return { rows, errors, warnings };
}

/**
 * @param {OutputRow} row
 * @returns {string[]}
 */
export function rowToCsvArray(row) {
  return [
    row.familyName,
    row.givenName,
    row.familyName2,
    row.givenName2,
    row.noc,
    row.birthdate,
    row.club,
    row.classId,
    row.category,
  ];
}

export function normalizeClassToken(token) {
  return token.trim().toUpperCase().replace(/[\s-]+/g, "");
}

export function genderLetter(gender) {
  const g = (gender ?? "").trim().toLowerCase();
  if (g === "male") return "M";
  if (g === "female") return "W";
  return null;
}

export function normalizeName(first, last) {
  return `${first} ${last}`.trim().toLowerCase().replace(/\s+/g, " ");
}

export function buildNameIndex(records) {
  const index = new Map();
  for (const record of records) {
    const key = normalizeName(record.firstName, record.lastName);
    if (!index.has(key)) index.set(key, []);
    index.get(key).push(record);
  }
  return index;
}

function processSolo(record, classToken, ctx) {
  const letter = genderLetter(record.gender);
  if (!letter) {
    ctx.errors.push(
      issue(record, "Gender", record.gender, `Unrecognized gender "${record.gender}" (expected Male/Female).`)
    );
    return;
  }

  const classId = letter + classToken;
  const classDef = ctx.classesConfig.classes.get(classId);
  if (!classDef) {
    ctx.errors.push(issue(record, "Class", classId, `Class "${classId}" is not a recognized class.`));
    return;
  }

  const dob = parseAustralianDate(record.dob);
  if (!dob) {
    ctx.errors.push(issue(record, "DOB", record.dob, `Unparseable birthdate "${record.dob}".`));
    return;
  }

  // Computed whenever a race year is available, even for classes with no
  // categories — bibAllocation.js (FR19) sorts youngest-first using this,
  // not just the category id, since not every class has one.
  const age = ctx.classesConfig.competitionYear == null ? null : ctx.classesConfig.competitionYear - dob.year;

  // Some classes (e.g. team/forerunner/mixed-double classes) have no
  // categories defined at all — there's nothing to compute an age bracket
  // against, so those paddlers simply get no category, not an error.
  let category = null;
  if (classDef.categories.length > 0) {
    if (age == null) {
      ctx.errors.push(issue(record, "Race year", undefined, "No race year was selected."));
      return;
    }

    category = findCategory(classDef, age);
    if (!category) {
      ctx.errors.push(
        issue(record, "Category", String(age), `No category in class "${classId}" covers age ${age}.`)
      );
      return;
    }
  }

  const noc = countryNameToNoc(record.country);
  if (record.country && !noc) {
    ctx.warnings.push(
      issue(record, "Country", record.country, `Country "${record.country}" has no known NOC code; Ctry left blank.`, "warning")
    );
  }

  ctx.rows.push({
    familyName: record.lastName,
    givenName: record.firstName,
    familyName2: "",
    givenName2: "",
    noc: noc ?? "",
    birthdate: formatIsoDate(dob),
    club: resolveClub(record, ctx),
    classId,
    category: category ? category.catId : "",
    categoryAge: age,
  });
}

function processC2(record, nameIndex, consumedC2, ctx) {
  if (consumedC2.has(record)) return; // already paired via a partner's row

  const partnerNameRaw = record.c2PartnerName;
  if (!partnerNameRaw) {
    ctx.errors.push(
      issue(record, "C2 Partner Name", undefined, "C2 class selected but no partner name was given.")
    );
    return;
  }

  const key = partnerNameRaw.trim().toLowerCase().replace(/\s+/g, " ");
  const candidates = (nameIndex.get(key) ?? []).filter((r) => r !== record);

  if (candidates.length === 0) {
    ctx.errors.push(
      issue(record, "C2 Partner Name", partnerNameRaw, `C2 partner "${partnerNameRaw}" was not found among the entries.`)
    );
    return;
  }
  if (candidates.length > 1) {
    ctx.errors.push(
      issue(
        record,
        "C2 Partner Name",
        partnerNameRaw,
        `C2 partner name "${partnerNameRaw}" matches multiple entries; cannot determine which one.`
      )
    );
    return;
  }

  const partner = candidates[0];
  if (consumedC2.has(partner)) {
    ctx.errors.push(
      issue(record, "C2 Partner Name", partnerNameRaw, `C2 partner "${partnerNameRaw}" is already paired with someone else.`)
    );
    return;
  }

  const letter = genderLetter(record.gender);
  if (!letter) {
    ctx.errors.push(
      issue(record, "Gender", record.gender, `Unrecognized gender "${record.gender}" (expected Male/Female).`)
    );
    return;
  }
  const partnerLetter = genderLetter(partner.gender);
  if (letter !== partnerLetter) {
    ctx.errors.push(
      issue(
        record,
        "Gender",
        undefined,
        `C2 crew with "${partnerNameRaw}" has mismatched genders (${record.gender} / ${partner.gender}); mixed crews aren't supported.`
      )
    );
    return;
  }

  const crewClassId = letter + "C2";
  const classDef = ctx.classesConfig.classes.get(crewClassId);
  if (!classDef) {
    ctx.errors.push(issue(record, "Class", crewClassId, `Class "${crewClassId}" is not a recognized class.`));
    return;
  }

  const dobA = parseAustralianDate(record.dob);
  if (!dobA) {
    ctx.errors.push(issue(record, "DOB", record.dob, `Unparseable birthdate "${record.dob}".`));
    return;
  }
  const dobB = parseAustralianDate(partner.dob);
  if (!dobB) {
    ctx.errors.push(issue(partner, "DOB", partner.dob, `Unparseable birthdate "${partner.dob}".`));
    return;
  }

  // Computed whenever a race year is available, even for classes with no
  // categories — see the matching comment in processSolo.
  const olderBirthYear = Math.min(dobA.year, dobB.year);
  const age = ctx.classesConfig.competitionYear == null ? null : ctx.classesConfig.competitionYear - olderBirthYear;

  // As with solo classes, a crew class with no categories defined (e.g.
  // Mixed C2 in the canonical set) simply has no category, not an error.
  let category = null;
  if (classDef.categories.length > 0) {
    if (age == null) {
      ctx.errors.push(issue(record, "Race year", undefined, "No race year was selected."));
      return;
    }

    category = findCategory(classDef, age);
    if (!category) {
      ctx.errors.push(
        issue(record, "Category", String(age), `No category in class "${crewClassId}" covers age ${age}.`)
      );
      return;
    }
  }

  consumedC2.add(record);
  consumedC2.add(partner);

  const noc = countryNameToNoc(record.country);
  if (record.country && !noc) {
    ctx.warnings.push(
      issue(record, "Country", record.country, `Country "${record.country}" has no known NOC code; Ctry left blank.`, "warning")
    );
  }

  ctx.rows.push({
    familyName: record.lastName,
    givenName: record.firstName,
    familyName2: partner.lastName,
    givenName2: partner.firstName,
    noc: noc ?? "",
    birthdate: formatIsoDate(dobA),
    club: resolveClub(record, ctx),
    classId: crewClassId,
    category: category ? category.catId : "",
    categoryAge: age,
  });
}

function resolveClub(record, ctx) {
  const { club, unknownClubIds } = resolveClubField(record.organisation, ctx.clubAbbreviations);
  for (const clubId of unknownClubIds) {
    ctx.warnings.push(
      issue(
        record,
        "Club",
        clubId,
        `Club ID "${clubId}" is not in the club abbreviation directory; using the club name instead.`,
        "warning"
      )
    );
  }
  return club;
}

function formatIsoDate({ year, month, day }) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}`;
}

function issue(record, field, derivedValue, message, severity = "error") {
  return {
    severity,
    sourceRowIndex: record.sourceRowIndex,
    person: `${record.firstName} ${record.lastName}`.trim(),
    field,
    derivedValue,
    message,
  };
}

// Bib allocation for the optional "Allocate Bibs" output feature (FR19).
// Pure, DOM-free.

import { normalizeName } from "./transform.js";

/**
 * Assigns a `bib` number to every row and returns a new array reordered to
 * match: Forerunners (ClassId "FR"), then Women (ClassId starting "W"),
 * then Men (ClassId starting "M") — this is a start-list feature, so the
 * output order follows bib order rather than preserving upload order. Any
 * row matching none of those three (shouldn't happen with the canonical
 * class list, but not dropped either) is appended at the end, unbibbed.
 *
 * Forerunners keep their given order; Women/Men are sorted youngest-first
 * (by `categoryAge`), then alphabetically by familyName/givenName. One bib
 * per unique person (by normalized name) — a person appearing on multiple
 * rows gets the same bib on all of them, and doesn't consume a second
 * number. Before Women and before Men, the bib counter rounds up to the
 * lowest multiple of 5 strictly greater than the highest bib assigned so
 * far (or starts at 1 if nothing has been assigned yet).
 *
 * @param {import("./transform.js").OutputRow[]} rows
 * @returns {import("./transform.js").OutputRow[]}
 */
export function allocateBibs(rows) {
  const forerunnerRows = rows.filter((row) => row.classId === "FR");
  const womenRows = sortByAgeThenName(rows.filter((row) => row.classId.startsWith("W")));
  const menRows = sortByAgeThenName(rows.filter((row) => row.classId.startsWith("M")));
  const otherRows = rows.filter(
    (row) => row.classId !== "FR" && !row.classId.startsWith("W") && !row.classId.startsWith("M")
  );

  const bibByPerson = new Map();
  let nextBib = 1;
  let highestBib = 0;

  const assignGroup = (groupRows) => {
    for (const row of groupRows) {
      const key = normalizeName(row.givenName, row.familyName);
      if (!bibByPerson.has(key)) {
        bibByPerson.set(key, nextBib);
        highestBib = nextBib;
        nextBib += 1;
      }
      row.bib = bibByPerson.get(key);
    }
  };

  assignGroup(forerunnerRows);
  nextBib = nextGroupStart(highestBib);
  assignGroup(womenRows);
  nextBib = nextGroupStart(highestBib);
  assignGroup(menRows);

  return [...forerunnerRows, ...womenRows, ...menRows, ...otherRows];
}

function nextGroupStart(highestBib) {
  if (highestBib === 0) return 1;
  return Math.floor(highestBib / 5) * 5 + 5;
}

function sortByAgeThenName(rows) {
  return [...rows].sort((a, b) => {
    const ageA = a.categoryAge ?? Infinity;
    const ageB = b.categoryAge ?? Infinity;
    if (ageA !== ageB) return ageA - ageB;
    const familyCmp = a.familyName.localeCompare(b.familyName, undefined, { sensitivity: "base" });
    if (familyCmp !== 0) return familyCmp;
    return a.givenName.localeCompare(b.givenName, undefined, { sensitivity: "base" });
  });
}

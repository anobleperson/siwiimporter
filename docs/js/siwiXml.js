// SiwiData (Canoe123) project XML extraction.
//
// The document uses a default namespace and has many repeated sibling
// top-level elements (multiple <Classes>, multiple <Schedule>, etc. — not
// wrapped in a single collection element). Crucially, <StartTime> appears
// in two unrelated places: once inside each <Schedule> (a full date+time,
// e.g. "2025-03-30T09:00:00+11:00" — what we want) and once inside each
// <Results> (a time-only race start, e.g. "9:16:00" — NOT a date). Reading
// this must only ever look at a <Schedule> element's own direct <StartTime>
// child, never a document-wide query, or it will pick up the Results one.
//
// DOMParserImpl is injectable so this module can be unit-tested in Node
// (via @xmldom/xmldom) using the exact same code path the browser uses.

const NS = "http://siwidata.com/Canoe123/Data.xsd";

/**
 * @typedef {Object} CategoryDef
 * @property {string} catId
 * @property {number} firstYear
 * @property {number} lastYear
 *
 * @typedef {Object} ClassDef
 * @property {string} classId
 * @property {CategoryDef[]} categories
 *
 * @typedef {Object} SiwiConfig
 * @property {Map<string, ClassDef>} classes
 * @property {number | null} competitionYear
 */

/**
 * @param {string} xmlText
 * @param {typeof DOMParser} [DOMParserImpl]
 * @returns {SiwiConfig}
 */
export function parseSiwiProject(xmlText, DOMParserImpl = globalThis.DOMParser) {
  if (!DOMParserImpl) {
    throw new Error("No DOMParser implementation available.");
  }
  const parser = new DOMParserImpl();
  const doc = parser.parseFromString(xmlText, "application/xml");
  const root = doc.documentElement;
  if (!root || root.localName !== "Canoe123Data") {
    throw new Error(
      "This doesn't look like a SiwiData Canoe123 project file (missing <Canoe123Data> root)."
    );
  }

  const classes = new Map();
  for (const classEl of directChildren(root, "Classes")) {
    const classId = textOf(directChild(classEl, "ClassId"));
    if (!classId) continue;
    const categories = directChildren(classEl, "Categories").map((catEl) => ({
      catId: textOf(directChild(catEl, "CatId")),
      firstYear: Number(textOf(directChild(catEl, "FirstYear"))),
      lastYear: Number(textOf(directChild(catEl, "LastYear"))),
    }));
    classes.set(classId, { classId, categories });
  }

  const competitionYear = findCompetitionYear(root);

  return { classes, competitionYear };
}

/**
 * @param {ClassDef | undefined} classDef
 * @param {number} age
 * @returns {CategoryDef | null}
 */
export function findCategory(classDef, age) {
  if (!classDef) return null;
  for (const cat of classDef.categories) {
    if (age >= cat.firstYear && age <= cat.lastYear) return cat;
  }
  return null;
}

/**
 * Merges a project's own classes with a canonical fallback set. A class
 * defined in `primary` (the uploaded Siwi project) always wins outright —
 * this fills in only the classes the project itself didn't define, it does
 * not merge categories within a class both sources happen to share.
 * @param {Map<string, ClassDef>} primary
 * @param {Map<string, ClassDef>} fallback
 * @returns {Map<string, ClassDef>}
 */
export function mergeClassesWithFallback(primary, fallback) {
  const merged = new Map(fallback);
  for (const [classId, classDef] of primary) {
    merged.set(classId, classDef);
  }
  return merged;
}

function findCompetitionYear(root) {
  let earliest = null; // { time: number, raw: string }
  for (const scheduleEl of directChildren(root, "Schedule")) {
    const startTimeEl = directChild(scheduleEl, "StartTime");
    if (!startTimeEl) continue;
    const raw = textOf(startTimeEl);
    if (!raw) continue;
    const time = Date.parse(raw);
    if (Number.isNaN(time)) continue;
    if (!earliest || time < earliest.time) {
      earliest = { time, raw };
    }
  }
  return earliest ? extractYearFromIso(earliest.raw) : null;
}

function extractYearFromIso(text) {
  const match = /^(\d{4})-/.exec(text.trim());
  return match ? Number(match[1]) : null;
}

function directChildren(el, localName) {
  const results = [];
  for (const node of Array.from(el.childNodes)) {
    if (
      node.nodeType === 1 &&
      node.localName === localName &&
      (node.namespaceURI === NS || node.namespaceURI == null)
    ) {
      results.push(node);
    }
  }
  return results;
}

function directChild(el, localName) {
  return directChildren(el, localName)[0] ?? null;
}

function textOf(el) {
  return el ? (el.textContent ?? "").trim() : "";
}

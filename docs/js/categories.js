// Class/category lookup against the canonical Canoe123 class scheme
// (see canonicalClasses.js). Pure, no DOM/XML dependency.

/**
 * @typedef {Object} CategoryDef
 * @property {string} catId
 * @property {number} firstYear
 * @property {number} lastYear
 *
 * @typedef {Object} ClassDef
 * @property {string} classId
 * @property {CategoryDef[]} categories
 */

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

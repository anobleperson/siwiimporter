// Synthetic Forerunner entries for the optional "Forerunner" output
// feature (FR18). Pure, DOM-free.

const FORERUNNER_COUNT = 2;

/**
 * @returns {import("./transform.js").OutputRow[]}
 */
export function buildForerunnerRows() {
  const rows = [];
  for (let n = 1; n <= FORERUNNER_COUNT; n++) {
    rows.push({
      familyName: `Fore Runner ${n}`,
      givenName: "",
      familyName2: "",
      givenName2: "",
      noc: "",
      birthdate: "",
      club: "",
      classId: "FR",
      category: "",
      categoryAge: null,
    });
  }
  return rows;
}

// Country name -> IOC/NOC 3-letter code lookup. Pure.
//
// Covers common countries likely to appear in canoe slalom entries. A miss
// is expected to be a non-fatal warning by callers (blank Ctry cell), not a
// hard error — NOC isn't a required Canoe123 import field.

const COUNTRY_TO_NOC = {
  australia: "AUS",
  "new zealand": "NZL",
  "united kingdom": "GBR",
  "great britain": "GBR",
  england: "GBR",
  scotland: "GBR",
  wales: "GBR",
  "united states": "USA",
  "united states of america": "USA",
  usa: "USA",
  canada: "CAN",
  france: "FRA",
  germany: "GER",
  italy: "ITA",
  spain: "ESP",
  switzerland: "SUI",
  austria: "AUT",
  slovenia: "SLO",
  slovakia: "SVK",
  "czech republic": "CZE",
  czechia: "CZE",
  poland: "POL",
  netherlands: "NED",
  belgium: "BEL",
  ireland: "IRL",
  japan: "JPN",
  "south korea": "KOR",
  "korea, republic of": "KOR",
  china: "CHN",
  brazil: "BRA",
  argentina: "ARG",
  "south africa": "RSA",
  denmark: "DEN",
  norway: "NOR",
  sweden: "SWE",
  finland: "FIN",
  portugal: "POR",
  hungary: "HUN",
  romania: "ROU",
  "papua new guinea": "PNG",
  fiji: "FIJ",
  samoa: "SAM",
  "solomon islands": "SOL",
};

/**
 * @param {string} name
 * @returns {string | null}
 */
export function countryNameToNoc(name) {
  const key = (name ?? "").trim().toLowerCase();
  if (!key) return null;
  return COUNTRY_TO_NOC[key] ?? null;
}

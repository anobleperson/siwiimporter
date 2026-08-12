// Club ID -> output abbreviation directory. FR20 (see specification.md):
// the Club output field uses these abbreviations instead of full club
// names. `documentation/club-abbreviations.md` is the human-readable
// reference for this same data — keep the two in sync when editing.
//
// Abbreviations here are the club's own, un-disambiguated abbreviation.
// Any abbreviation shared by more than one club anywhere in this directory
// is automatically suffixed with "-<club number>" by buildAbbreviationMap
// below, so entries never need to be hand-edited just because another club
// elsewhere in the list happens to collide.
const CLUB_DIRECTORY = [
  ["CL000382", "4670SC"],
  ["CL000202", "ACC"],
  ["CL000203", "AKC"],
  ["CL000204", "AKC"],
  ["CL000205", "BACC"],
  ["CL000208", "BPC"],
  ["CL000209", "BP"],
  ["CL000210", "BCC"],
  ["CL000211", "BRGC"],
  ["CL000212", "BCKC"],
  ["CL000213", "BC"],
  ["CL000214", "BPC"],
  ["CL000215", "BWP"],
  ["CL000383", "BrisSUP"],
  ["CL000216", "BPCC"],
  ["CL000217", "BCC"],
  ["CL000331", "BSPC"],
  ["CL000218", "BGCC"],
  ["CL000220", "CRCC"],
  ["CL000221", "CPRT"],
  ["CL000222", "CCP"],
  ["CL000337", "CDCC"],
  ["CL000223", "CLBC"],
  ["CL000225", "CBCC"],
  ["CL000226", "CSKC"],
  ["CL000227", "CCPC"],
  ["CL000335", "DCC"],
  ["CL000229", "DCC"],
  ["CL000230", "EMCC"],
  ["CL000232", "EP"],
  ["CL000233", "ECC"],
  ["CL000234", "FCC"],
  ["CL000235", "FNCCC"],
  ["CL000387", "FSCP"],
  ["CL000236", "FCC"],
  ["CL000238", "FCC"],
  ["CL000394", "FCOCC"],
  ["CL000392", "FCRDBC"],
  ["CL000239", "GCC"],
  ["CL000342", "GCOCC"],
  ["CL000241", "GCPC"],
  ["CL000242", "GP"],
  ["CL000244", "GLPC"],
  ["CL000390", "HOCC"],
  ["CL000246", "HBPC"],
  ["CL000247", "HVPC"],
  ["CL000347", "HPC"],
  ["CL000248", "ICC"],
  ["CL000252", "INCC"],
  ["CL000249", "IOP"],
  ["CL000254", "KCCC"],
  ["CL000255", "KDKCC"],
  ["CL000256", "KWCC"],
  ["CL000257", "KSC"],
  ["CL000258", "KKC"],
  ["CL000260", "LCRK"],
  ["CL000262", "MRPC"],
  ["CL000264", "MPS"],
  ["CL000368", "MSKC"],
  ["CL000267", "MWKC"],
  ["CL000268", "MCC"],
  ["CL000363", "MPA"],
  ["CL000270", "MCC"],
  ["CL000271", "MKC"],
  ["CL000272", "MDCC"],
  ["CL000273", "MMCC"],
  ["CL000362", "MPP"],
  ["CL000274", "NWCC"],
  ["CL000275", "NP"],
  ["CL000276", "NECC"],
  ["CL000277", "NWCC"],
  ["CL000278", "NBOCC"],
  ["CL000279", "NDCC"],
  ["CL000280", "OCC"],
  ["CL000334", "POP"],
  ["CL000283", "PC"],
  ["CL000286", "PLCC"],
  ["CL000372", "PAC"],
  ["CL000287", "PVC"],
  ["CL000288", "PP"],
  ["CL000391", "QOCC"],
  ["CL000291", "QSKC"],
  ["CL000292", "RCCN"],
  ["CL000370", "RRPC"],
  ["CL000296", "SPC"],
  ["CL000393", "SSOCC"],
  ["CL000371", "SCP"],
  ["CL000297", "SKCW"],
  ["CL000298", "SIP"],
  ["CL000299", "SCC"],
  ["CL000300", "SCKC"],
  ["CL000301", "SP"],
  ["CL000302", "SCCC"],
  ["CL000385", "SUPWA"],
  ["CL000303", "SCPC"],
  ["CL000384", "SCSUPC"],
  ["CL000304", "SSPC"],
  ["CL000305", "SCC"],
  ["CL000306", "SHCC"],
  ["CL000386", "SCPC"],
  ["CL000307", "SNBKC"],
  ["CL000309", "TCC"],
  ["CL000311", "TCC"],
  ["CL000312", "TSCC"],
  ["CL000373", "RAPC"],
  ["CL000314", "TCC"],
  ["CL000315", "TKC"],
  ["CL000317", "VLPC"],
  ["CL000338", "VPA"],
  ["CL000318", "VCC"],
  ["CL000349", "VYPA"],
  ["CL000357", "WAVE"],
  ["CL000320", "WBCC"],
  ["CL000321", "WKC"],
  ["CL000365", "WCPC"],
  ["CL000323", "WECC"],
  ["CL000324", "WLPS"],
  ["CL000325", "WP"],
  ["CL000350", "WSWC"],
  ["CL000326", "WCC"],
  ["CL000327", "WPC"],
  ["CL000360", "WYC"],
  ["CL000328", "WRCC"],
  ["CL000330", "YMACC"],
];

/** Club ID (e.g. "CL000229") -> the club's own, un-disambiguated abbreviation. */
export const CLUB_BASE_ABBREVIATIONS = new Map(CLUB_DIRECTORY);

/**
 * Builds a Club ID -> output abbreviation map scoped to just the given club
 * IDs — e.g. every club actually referenced in one event's participant
 * list. An abbreviation is only suffixed with "-<club number>" when two or
 * more *distinct* clubs among the given IDs share it; a same-abbreviation
 * clash elsewhere in the full directory that nobody in this event belongs
 * to is irrelevant and must not add noise to the output.
 * @param {Iterable<string>} clubIds
 * @returns {Map<string, string>}
 */
export function buildScopedAbbreviations(clubIds) {
  const uniqueIds = [...new Set(clubIds)].filter((id) => CLUB_BASE_ABBREVIATIONS.has(id));

  const counts = new Map();
  for (const id of uniqueIds) {
    const abbreviation = CLUB_BASE_ABBREVIATIONS.get(id);
    counts.set(abbreviation, (counts.get(abbreviation) ?? 0) + 1);
  }

  const map = new Map();
  for (const id of uniqueIds) {
    const abbreviation = CLUB_BASE_ABBREVIATIONS.get(id);
    const clubNumber = Number(id.slice(2));
    map.set(id, counts.get(abbreviation) > 1 ? `${abbreviation}-${clubNumber}` : abbreviation);
  }
  return map;
}

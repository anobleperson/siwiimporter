# Club abbreviations — first pass

Reference table of club IDs, abbreviations, and states. Existing abbreviations
(as provided) are kept as-is; blanks were filled in with a first-pass guess by
taking initials of significant words, dropping "Inc"/"Incorporated"/"of"/
"and"/"&"/"The". This is a starting point, and worth reviewing further — see
**Worth a manual look** below for entries that were judgment calls.

This is the human-readable mirror of the `CLUB_DIRECTORY` data actually
consumed by the app, in `docs/js/clubs.js` (FR10 in
[`specification.md`](specification.md)) — **the two must be kept in sync by
hand**; there's no build step that generates one from the other. If you edit
a club's abbreviation here, make the matching edit in `clubs.js`.

## Disambiguation rule

When a club's abbreviation is shared by another club **anywhere in this list**
(not just within one player's memberships, and regardless of state — a
player's club list can mix clubs from different states, so disambiguation
must be global), the output abbreviation for **every** club sharing that
abbreviation is suffixed with `-<club number>`, where `<club number>` is the
numeric part of the Club ID with leading zeros stripped (e.g. `CL000229` → `229`).
Clubs with a unique abbreviation are output as-is, with no suffix.

Example — JustGo field:
`Derwent Canoe Club (CL000229),Tasmanian Sea Canoeing Club Inc. (CL000312)`

- `TSCC` is unique → stays `TSCC`.
- `DCC` is shared with Darwin Canoe Club (CL000335) → becomes `DCC-229`.
- Output: `DCC-229,TSCC`

Another example — Swan Canoe Club (CL000305) shares `SCC` with Shepparton
Canoe Club (CL000299), so it is output as `SCC-305` (not `SCC`).

| Club ID | Abbreviation | Club Name | State |
|---|---|---|---|
| CL000382 | 4670SC | 4670 SUP Club Inc | Queensland |
| CL000202 | ACC | Adelaide Canoe Club | South Australia |
| CL000203 | AKC | Ascot Kayak Club | Western Australia |
| CL000204 | AKC | Avoca Kayak Club Inc | New South Wales |
| CL000205 | BACC | Ballarat Amateur Canoe Club Incorporated | Victoria |
| CL000208 | BPC | Bayswater Paddlesports Club | Western Australia |
| CL000209 | BP | Bellarine Paddlers | Victoria |
| CL000210 | BCC | Bendigo Canoe Club | Victoria |
| CL000211 | BRGC | Big River Canoe Club | New South Wales |
| CL000212 | BCKC | Bonville Creek Kayak Club Inc | New South Wales |
| CL000213 | BC | Brisbane Canoeing Inc. | Queensland |
| CL000214 | BPC | Brisbane Paddling Club | Queensland |
| CL000215 | BWP | Brisbane Water Paddlers | New South Wales |
| CL000383 | BrisSUP | BrisSUP Inc | Queensland |
| CL000216 | BPCC | Broken Paddle Canoe Club | Queensland |
| CL000217 | BCC | Brothers Canoe Club | Queensland |
| CL000331 | BSPC | Bulimba Social Paddle Club | Queensland |
| CL000218 | BGCC | Burley Griffin Canoe Club Inc | New South Wales |
| CL000220 | CRCC | Canning River Canoe Club | Western Australia |
| CL000221 | CPRT | Canoes Plus Racing Team | Victoria |
| CL000222 | CCP | Central Coast Paddlers | New South Wales |
| CL000337 | CDCC | Central Desert Canoe Club | Northern Territory |
| CL000223 | CLBC | Champion Lakes Boating Club | Western Australia |
| CL000225 | CBCC | Cobram-Barooga Canoe Club | Victoria |
| CL000226 | CSKC | Cronulla Sutherland Kayak Club Inc | New South Wales |
| CL000227 | CCPC | Currumbin Creek Paddlers Club | Queensland |
| CL000335 | DCC | Darwin Canoe Club | Northern Territory |
| CL000229 | DCC | Derwent Canoe Club | Tasmania |
| CL000230 | EMCC | Echuca Moama Canoe Club | Victoria |
| CL000232 | EP | Encounter Paddling | South Australia |
| CL000233 | ECC | Essendon Canoe Club | Victoria |
| CL000234 | FCC | Fairfield Canoe Club | Victoria |
| CL000235 | FNCCC | Far North Coast Canoe Club | New South Wales |
| CL000387 | FSCP | Far South Coast Paddlers Inc | New South Wales |
| CL000236 | FCC | Fitzroy Canoe Club | Queensland |
| CL000238 | FCC | Footscray Canoe Club | Victoria |
| CL000394 | FCOCC | Fraser Coast Outrigger Canoe Club | Queensland |
| CL000392 | FCRDBC | Fraser Coast Red Dragons Boat Club | Queensland |
| CL000239 | GCC | Geelong Canoe Club | Victoria |
| CL000342 | GCOCC | Gold Coast Outrigger Canoe Club | Queensland |
| CL000241 | GCPC | Gold Coast Paddlesports K&C Club | Queensland |
| CL000242 | GP | Goldfields Paddlers Inc | Victoria |
| CL000244 | GLPC | Greater Logan Paddlers Club | Queensland |
| CL000390 | HOCC | Hobart Outrigger and Canoe Club | Tasmania |
| CL000246 | HBPC | Holdfast Bay Paddlesports Club | South Australia |
| CL000247 | HVPC | Hunter Valley Paddlesports Club Inc | New South Wales |
| CL000347 | HPC | Hurricane Paddling Crew | Western Australia |
| CL000248 | ICC | Illawarra Canoe Club Inc. | New South Wales |
| CL000252 | INCC | INCC Yarra Paddlers | Victoria |
| CL000249 | IOP | Indian Ocean Paddlers Club | Western Australia |
| CL000254 | KCCC | Kananook Creek Canoe Club | Victoria |
| CL000255 | KDKCC | Karana District Kayak & Canoe Club | Queensland |
| CL000256 | KWCC | Kawana Waters Canoe Club | Queensland |
| CL000257 | KSC | Kayak Share Club Inc | New South Wales |
| CL000258 | KKC | Kirinari Kayak Club | Victoria |
| CL000260 | LCRK | Lane Cove River Kayakers Inc | New South Wales |
| CL000262 | MRPC | Macquarie River Paddle Club | New South Wales |
| CL000264 | MPS | Makai Paddlers Society Inc | New South Wales |
| CL000368 | MSKC | Mandurah Ski and Kayak Club Incorporated | Western Australia |
| CL000267 | MWKC | Manly Warringah Kayak Club Inc | New South Wales |
| CL000268 | MCC | Marathon Canoe Club | South Australia |
| CL000363 | MPA | Marathon Paddling Academy | New South Wales |
| CL000270 | MCC | Melbourne Canoe Club | Victoria |
| CL000271 | MKC | Mercantile Kayak Club | Victoria |
| CL000272 | MDCC | Mildura District Canoe Club | Victoria |
| CL000273 | MMCC | Mitta Mitta Canoe Club | Victoria |
| CL000362 | MPP | MP Paddlers Inc | Victoria |
| CL000274 | NWCC | Newport Waters Canoe Club Inc. | Queensland |
| CL000275 | NP | Newy Paddlers Inc | New South Wales |
| CL000276 | NECC | North East Canoe Club | Victoria |
| CL000277 | NWCC | North West Canoe Club | Queensland |
| CL000278 | NBOCC | Northern Beaches Outrigger Canoe Club | New South Wales |
| CL000279 | NDCC | Northern Districts Canoe Club | South Australia |
| CL000280 | OCC | Onkaparinga Canoe Club | South Australia |
| CL000334 | POP | Pacifica Ocean Paddling | New South Wales |
| CL000283 | PC | Paddle Capricornia Incorporated | Queensland |
| CL000286 | PLCC | Patterson Lakes Canoe Club | Victoria |
| CL000372 | PAC | Peninsula Aquatic Club | Tasmania |
| CL000287 | PVC | Penrith Valley Canoeing Inc | New South Wales |
| CL000288 | PP | Perth Paddlers | Western Australia |
| CL000391 | QOCC | Queensland Outrigger and Canoe Club | Queensland |
| CL000291 | QSKC | Queensland Sea Kayak Club Inc | Queensland |
| CL000292 | RCCN | River Canoe Club of NSW Inc | New South Wales |
| CL000370 | RRPC | River Rats Paddling Club Incorporated | Victoria |
| CL000296 | SPC | Sandgate Paddling Club Inc | Queensland |
| CL000393 | SSOCC | Sandy Straits Outrigger Canoe Club Inc | Queensland |
| CL000371 | SCP | Sea Cliff Paddlers Inc | New South Wales |
| CL000297 | SKCW | Sea Kayak Club WA Inc. | Western Australia |
| CL000298 | SIP | Shark Island Paddlers Inc | New South Wales |
| CL000299 | SCC | Shepparton Canoe Club | Victoria |
| CL000300 | SCKC | Shoalhaven Canoe & Kayak Club Inc | New South Wales |
| CL000301 | SP | Southside Paddlers Inc | New South Wales |
| CL000302 | SCCC | Springfield Centenary Canoe Club | Queensland |
| CL000385 | SUPWA | Stand Up Paddle WA | Western Australia |
| CL000303 | SCPC | Sunshine Coast Paddlesports Club Inc | Queensland |
| CL000384 | SCSUPC | Sunshine Coast Stand Up Paddle Club | Queensland |
| CL000304 | SSPC | Sutherland Shire Paddle Club | New South Wales |
| CL000305 | SCC | Swan Canoe Club | Western Australia |
| CL000306 | SHCC | Swan Hill Canoe Club | Victoria |
| CL000386 | SCPC | Sydney Canoe Polo Club | New South Wales |
| CL000307 | SNBKC | Sydney Northern Beaches Kayak Club | New South Wales |
| CL000309 | TCC | Tamar Canoe Club Inc. | Tasmania |
| CL000311 | TCC | Tasmanian Canoe Club | Tasmania |
| CL000312 | TSCC | Tasmanian Sea Canoeing Club Inc. | Tasmania |
| CL000373 | RAPC | The Ripple Affect Paddle Club Incorporated | Victoria |
| CL000314 | TCC | Tinaroo Canoe Club | Queensland |
| CL000315 | TKC | Townsville Kayak Club | Queensland |
| CL000317 | VLPC | Varsity Lakes Paddlers Club Inc | Queensland |
| CL000338 | VPA | Veteran Paddlesports Australia | New South Wales |
| CL000318 | VCC | Victorian Canoe Club | Victoria |
| CL000349 | VYPA | Victorian Youth Polo Academy | Victoria |
| CL000357 | WAVE | W.A.V.E Academy Outrigger Canoe Club | Queensland |
| CL000320 | WBCC | Wagga Bidgee Canoe Club | New South Wales |
| CL000321 | WKC | Warrnambool Kayak Club | Victoria |
| CL000365 | WCPC | West Coast Paddle Club | Tasmania |
| CL000323 | WECC | West End Canoe Club | Queensland |
| CL000324 | WLPS | West Lakes Paddle Sports | South Australia |
| CL000325 | WP | Western Paddlers | New South Wales |
| CL000350 | WSWC | Western Sydney Whitewater Club | New South Wales |
| CL000326 | WCC | Whitehorse Canoe Club | Victoria |
| CL000327 | WPC | Windsor Paddlesports Club | New South Wales |
| CL000360 | WYC | WYC Paddlers | Tasmania |
| CL000328 | WRCC | Wynnum Redlands Canoe Club | Queensland |
| CL000330 | YMACC | Yarrawonga Mulwala Amateur Canoe Club | Victoria |

## Worth a manual look

These aren't blocking issues (the disambiguation rule above resolves every
clash automatically), just entries whose abbreviation was a judgment call
worth a second opinion:

- **GCPC** for "Gold Coast Paddlesports K&C Club" — the "K&C" portion was
  dropped for readability and may need to be represented.
- **AKC**, **BCC**, **DCC**, **FCC**, **MCC**, **NWCC**, **SCC**, **SCPC**,
  **TCC** are each shared by two or three clubs (see the table above) — in
  the app's output these are automatically disambiguated as e.g. `FCC-234`
  vs. `FCC-236`, but if any of these clubs would rather have a short,
  human-chosen abbreviation instead of a numeric suffix, edit its entry in
  `docs/js/clubs.js` directly.

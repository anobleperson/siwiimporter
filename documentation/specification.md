# SIWI Importer — Specification

Status: reflects the code in the repo as of 2026-08-12 (58/58 tests
passing). `clipboardFormat.js` (FR15) is still verified manually only —
see [§5](#5-testing-strategy).

## 1. Purpose

The user runs canoe slalom events using SiwiData's Canoe123 desktop software
for timing/results, but collects registrations through JustGo (an external
event platform). Getting JustGo attendees into Canoe123 currently means
manually re-typing each paddler's class and category. This app closes that
gap: it takes a JustGo attendee CSV export, cross-references each entrant
against Canoe123's standard classes/categories, and produces output ready
for Canoe123's Import tab two ways: a downloadable CSV, or a "Copy to
clipboard" button that pastes directly into the Import tab grid (column
conventions documented in [`siwi-import-format.md`](siwi-import-format.md)).

## 2. Requirements

### 2.1 Functional requirements

- **FR1 — Input.** Accept one file: a JustGo attendee CSV export. (There is
  no Siwi project XML upload — see [§4.2](#42-why-no-siwi-project-upload).)
- **FR2 — Race year selection.** The user picks "This year" or "Next year"
  via a radio control, each labelled with the computed calendar year. This
  year is the default. The choice becomes the single `competitionYear` used
  for every participant's age calculation.
- **FR3 — Class extraction.** Only the JustGo column literally named `Simple
  Slalom Classes K1 C1  - Club:Classes` (fixed index 44) is read, split on
  `|` into one or more class tokens per row (e.g. `K1|C1` → two entries). The
  parallel `2026 slalom Registration Compatible with Siwi - Club:*` columns
  (45–48) are ignored entirely. Column 49 (`C2 Partner Name`) is used only
  for C2 pairing.
- **FR4 — Row filtering.** A row with a blank class column is not competing
  and is silently skipped — not an error or warning.
- **FR5 — Class/category validation.** Each class token is mapped to a
  `ClassId` (gender letter + normalized token) and checked against the
  built-in canonical class list. If the age (see FR7) falls outside every
  category range defined for that class, or the `ClassId` doesn't exist at
  all, generation is blocked with a per-row error. Errors are collected
  across the *entire* file in one pass — the tool never stops at the first
  problem — so the user can fix everything at once before re-uploading.
- **FR6 — Classes with no categories.** A handful of canonical classes
  (team/forerunner/mixed-double classes) define zero categories. Paddlers
  assigned to these get a blank Category cell — this is not an error.
- **FR7 — Age/category calculation.** `age = competitionYear − birth year`
  (calendar-year arithmetic, not exact chronological age — see
  [§4.1](#41-age-is-by-calendar-year-not-exact-age)). The category is the
  range in the class definition whose `[firstYear, lastYear]` covers that
  age.
- **FR8 — C2 crew pairing.** A class token normalizing to `C2` (accepts
  `C2`/`C 2`/`C-2`) triggers partner lookup via the row's `C2 Partner Name`
  column, matched case-insensitively/whitespace-trimmed against other rows'
  First+Last name in the same file. A valid pair requires exactly one name
  match, matching `Gender` on both sides, and a crew `ClassId` (gender
  letter + `C2`) that exists in the canonical class list. A valid pair
  produces one combined output row (`2nd Family Name`/`2nd G.Name` filled
  in); both source rows are marked consumed *for that token only* — a
  partner's other solo class tokens on their own row still process
  normally. Category uses the **older** paddler's birth year. Any pairing
  failure (partner missing, ambiguous, gender mismatch, no crew `ClassId`)
  is a blocking error, not a warning.
- **FR9 — Country → NOC.** Country name is looked up against a small
  built-in table to produce a 3-letter NOC/IOC code. A miss is a
  **non-blocking warning** (Ctry cell left blank) — NOC isn't a required
  Canoe123 import field.
- **FR10 — Club.** JustGo's `Organisation` column — one or more
  comma-separated `"Name (CLxxxxx)"` club memberships — is converted to a
  comma-separated list of club **abbreviations**, one per membership, via
  the built-in club directory in `clubs.js` (`resolveClubField` in
  `justgo.js`). When an abbreviation is shared by more than one club, every
  club sharing it is disambiguated with a `-<club number>` suffix (the
  numeric part of its Club ID, e.g. `CL000229` → `229`) — but **only when
  both clashing clubs actually appear among this event's competing entrants**
  (`generateImportRows` computes this scope up front via
  `extractClubIds`/`buildScopedAbbreviations`, over every record with at
  least one class token — see FR4). A clash elsewhere in the full directory
  that nobody in this event belongs to must not add a suffix; see
  [`club-abbreviations.md`](club-abbreviations.md) for the full directory and
  worked examples. A club ID not found in the directory is a **non-blocking
  warning**; that membership falls back to its plain name with the code
  stripped, rather than blocking generation. A membership with no `(CLxxxxx)`
  code at all is passed through unchanged.
- **FR11 — Birthdate output.** ISO `YYYY-MM-DD` format, to avoid
  locale-ambiguous `DateTime.TryParse` behavior on the Canoe123 side.
- **FR12 — Output shape (CSV download).** Header row: `Family Name, G.Name,
  2nd Family Name, 2nd G. Name, Ctry, Birthdate, Club, Class, Category` —
  matching the UI labels in [`siwi-import-format.md`](siwi-import-format.md)
  so they're recognizable in Canoe123's manual column-chooser dropdown.
  Comma-delimited, RFC4180-ish quoting via `csv.serializeCsv`.
- **FR13 — Error/warning reporting.** Errors block generation entirely (no
  partial/best-effort CSV or clipboard output) and are shown with enough
  detail to act on: which person, which source row, which field, and what
  was wrong. Warnings never block generation.
- **FR14 — Download.** Once generation succeeds with zero errors, a preview
  table is shown and a "Download CSV" button becomes available, triggering a
  browser file download of the generated CSV.
- **FR15 — Copy to clipboard.** Alongside the download button, a "Copy to
  clipboard" button becomes available under the same success condition,
  copying output formatted for a direct paste into Canoe123's Import tab
  grid rather than the CSV shape used for download:
  - Tab-delimited fields, `\r\n` row endings, no CSV-style quoting — matches
    the paste handler's parsing rules (`CheckAndTransformClipboardContent` /
    `TransformClipboard` in `frmCanoe123.cs`), which has no escaping
    mechanism at all.
  - Row 1 is a label row using Canoe123's own column names — `Family Name,
    G.Name, Ctry., Birthdate, Club, Class, Category, Bib\No., Ranking,
    Start\Order` — for the operator's one-time positional column mapping.
    Canoe123 doesn't auto-detect this as a header (every pasted row is
    data), so it must be deleted before "Save to Participants" or it saves
    as a bogus entry.
  - Fixed 10-column positional order per row: Family Name, Given Name, NOC,
    Birthdate, Club, Class, Category, Bib, Ranking, Start Order. The last
    three are always blank (this app has no bib/ranking/start-order data)
    but the columns are kept for alignment.
  - C2 crews: unlike the CSV download (which uses dedicated "2nd Family
    Name"/"2nd G.Name" columns), the clipboard format has no such columns —
    Canoe123's paste handler instead expects the second crew member's name
    on its own row directly below, name fields only. This requires the "2nd
    C2 Name in 2nd row" toggle enabled in Canoe123, which is UI state this
    app cannot set — documented as a prerequisite in the in-page hint text.
  - Clicking the button shows transient "Copied!"/"Copy failed" feedback on
    the button label for 1.5s.
- **FR16 — Malformed-input handling.** A thrown parse error (unparseable
  file, `assertStableHeader` failure because JustGo's export layout
  changed) is caught and shown as a single fatal message, distinct from
  per-row issues.

The following three are **optional, checkbox-controlled outputs, checked
by default.** Unchecking all three leaves the generated output byte-for-byte
unchanged from FR12/FR15. They're independent of each other and may be
combined in any combination; toggling any of them re-runs generation
immediately, like the race-year radios.

- **FR17 — Normalize Names.** When checked, every row's Family Name is
  upper-cased and Given Name is put in simple title case (the character
  after the start of the string or after each space/hyphen is capitalized,
  everything else lowercased — this doesn't special-case apostrophes like
  `O'Brien` or embedded capitals like `McDonald`; expect to revisit the
  algorithm once checked against real names). Applies to
  `familyName`/`givenName`/`familyName2`/`givenName2` on every row,
  including the synthetic Forerunner rows from FR18 if both are enabled
  together (their Family Name becomes e.g. `FORE RUNNER 1`). Applied last,
  after FR18/FR19, so it never affects sorting/grouping upstream of it.
- **FR18 — Forerunner.** When checked, exactly two synthetic rows are added
  ahead of every JustGo-derived row: Family Name `Fore Runner 1` / `Fore
  Runner 2`, Given Name blank, Class `FR` (the existing ungendered canonical
  class with zero categories — see `canonicalClasses.js`), every other
  field (NOC, Birthdate, Club, Category, 2nd Family/Given Name) blank.
  These two rows always exist together or not at all — there's no way to
  add just one — and aren't validated against JustGo data since they don't
  come from it.
- **FR19 — Allocate Bibs.** When checked, every row (including FR18's
  Forerunner rows, if also enabled) gets a Bib number, added as a new Bib
  column to both the CSV download (FR12) and the clipboard paste output
  (FR15) — the column only appears when this box is checked. **The output
  row order itself also changes** to match bib order (Forerunners, then
  Women, then Men) rather than preserving JustGo upload order — this is a
  start-list feature, so rows sorted any other way while carrying
  sequential bibs would read as broken.

  Allocation runs in three fixed groups, in this order:
  1. **Forerunners** (if FR18 is enabled) — bib 1, then 2, in the order
     they're defined (`Fore Runner 1`, `Fore Runner 2`). If FR18 is off,
     this group simply doesn't exist.
  2. **Women** — every row whose `ClassId` starts with `W`.
  3. **Men** — every row whose `ClassId` starts with `M`.

  Within the Women and Men groups, rows are sorted youngest-first by the
  age already used for that row's category calculation (`competitionYear −
  birthYear`; for a C2 crew row, this is the older partner's age per FR8),
  then alphabetically by Family Name, then Given Name, to break ties. This
  sorts correctly even for classes with no defined category (FR6), since
  age is computed from birthdate directly (`categoryAge` on `OutputRow`)
  rather than parsed from the category id.

  Bib numbers are assigned sequentially starting at 1, one bib per unique
  person (matched via the same normalized-name key FR8 already uses for C2
  partner lookup) — a person who appears in multiple rows (e.g. entered two
  classes) gets a single bib number written on every row for them, not a
  separate number per row.

  Before starting the Women group and before starting the Men group, the
  bib counter is rounded up to the lowest multiple of 5 that's *strictly
  greater* than the highest bib assigned so far (never reused, even when
  the highest bib already happens to be an exact multiple of 5): last bib 7
  → next group starts at 10; last bib 12 → starts at 15; last bib exactly
  10 → next group starts at 15, not 10. If a group turns out empty (e.g.
  Allocate Bibs is on but Forerunner is off, or there are zero women in the
  file), the following group's start is computed from whatever the highest
  bib assigned so far actually is — there's no separate "skip an empty
  group" case to handle, since the rounding rule already only cares about
  the running highest bib, not which named group produced it.

  **Open question, not yet confirmed** (see [§4.4](#44-open-question--c2-crew-bib-allocation)):
  a C2 crew is written as one combined row. The current behavior is that
  row's Bib reflects the *primary* paddler's bib only; the partner doesn't
  get a bib of their own on that row.

### 2.2 Non-functional requirements

- **NFR1 — Fully static, client-side only.** No backend, no data leaves the
  browser. Deployed via GitHub Pages from `/docs` on a free (public-only)
  plan.
- **NFR2 — Zero build step.** Plain HTML/CSS/JS using ES modules, loaded
  directly by the browser.
- **NFR3 — Testability.** Core logic (parsing, validation, transformation)
  is DOM-free and pure so it's unit-testable under Node without a browser.
- **NFR4 — No PII in the repo.** Real attendee data must never enter git
  history (enforced separately by [`CLAUDE.md`](../CLAUDE.md) and
  `.gitignore`). Test fixtures are synthetic/hand-crafted, not trimmed real
  exports.
- **NFR5 — Graceful `file://` failure.** Opening `index.html` directly
  (double-click) rather than via HTTP silently fails to load ES modules in
  Chrome/Edge; the app must detect this and explain it rather than showing a
  blank/broken page.

## 3. Architecture

### 3.1 File layout

```
docs/
  index.html            entry point, <script type="module" src="js/app.js">
  styles.css
  TasmaniaAgedCompetition.tpl   downloadable Canoe123 starter project (not used by the app itself)
  js/
    csv.js               generic CSV parse/serialize, pure
    justgo.js             JustGo column adapter, pure
    clubs.js               FR10: club ID -> abbreviation directory, pure
    categories.js         findCategory(classDef, age), pure — no XML/DOM
    canonicalClasses.js   built-in CANONICAL_CLASSES class/category data
    noc.js                country-name -> IOC/NOC code table, pure
    transform.js           core cross-reference pipeline incl. C2 pairing, pure
    download.js            Blob/anchor download trigger, DOM-only
    clipboard.js            navigator.clipboard.writeText wrapper w/ execCommand fallback, DOM-only
    clipboardFormat.js      OutputRow[] -> Canoe123 Import-tab paste text, pure
    nameCase.js             FR17: family/given name casing, pure
    forerunners.js          FR18: synthetic Forerunner OutputRow builder, pure
    bibAllocation.js        FR19: bib numbering + group reordering, pure
    app.js                 wires file input + race-year radios + option checkboxes, orchestrates, renders results
documentation/            reference docs, not deployed by GitHub Pages
  specification.md         this document
  siwi-import-format.md     Canoe123 Import-tab column reference
  classes-and-categories.md human-readable canonical class/category list
  club-abbreviations.md     human-readable mirror of clubs.js's directory
test/                      dev-only, not deployed
  csv.test.js
  justgo.test.js
  clubs.test.js
  categories.test.js
  canonicalClasses.test.js
  noc.test.js
  transform.test.js
  transform.c2.test.js     hand-crafted fixtures (example JustGo file has no C2 usage)
  nameCase.test.js
  forerunners.test.js
  bibAllocation.test.js
examples/                  gitignored — real attendee exports, PII (see CLAUDE.md)
package.json               no runtime/test dependencies; `npm test` only
```

### 3.2 Data flow

```
JustGo CSV file
      │  (FileReader .text())
      ▼
justgo.parseJustGoCsv()  ──uses──▶ csv.parseCsv()
      │  JustGoRecord[]
      ▼
transform.generateImportRows(records, {classes: CANONICAL_CLASSES, competitionYear})
      │  uses categories.findCategory(), noc.countryNameToNoc(), justgo.parseAustralianDate()/extractClubIds()/resolveClubField() (scoped via clubs.buildScopedAbbreviations())
      ▼
{ rows, errors, warnings }
      │
      ├─ errors.length > 0 → render errors panel, download+copy disabled, no output built
      └─ errors.length === 0 → optional steps, each gated on its checkbox (FR17-19):
                                  forerunners.buildForerunnerRows() prepended (FR18)
                                  → bibAllocation.allocateBibs() adds .bib, reorders into bib order (FR19)
                                  → rows.map(nameCase.normalizeRowNames) (FR17, applied last)
                                → csv.serializeCsv(header + rows) held in memory
                                  → "Download CSV" button → download.triggerDownload()
                                clipboardFormat.formatClipboardRows(rows) held in memory
                                  → "Copy to clipboard" button → clipboard.copyToClipboard()
```

`app.js` is the only module that touches the DOM outside of `download.js`
and `clipboard.js`; every other module is pure functions on plain data,
which is what makes them unit-testable under Node.

### 3.3 Module responsibilities

- **`csv.js`** — `parseCsv(text)`: character-level state machine handling
  `"`-quoting/`""`-escaping and treating any of `\r\n`/`\r`/`\n` as a row
  terminator (required for JustGo's observed `\r\r\n` record separator;
  produces some empty rows that callers filter). `serializeCsv(rows)`:
  quotes fields containing comma/quote/newline, joins with `\r\n`.
- **`justgo.js`** — fixed 0-based column-index map (`firstName:0, lastName:1,
  dob:3, gender:6, country:10, organisation:35, classes:44,
  c2PartnerName:49`) — index-based rather than header-name-based, since
  column 44's header text embeds the event's offered classes and changes
  per event. `assertStableHeader(header)` sanity-checks a few known-stable
  early columns (FirstName/LastName/DOB/Gender/Country) by name and throws a
  clear error if JustGo's layout ever shifts. `parseJustGoCsv(text)` →
  `JustGoRecord[]`. `parseAustralianDate(d)` parses `D/M/YYYY`, returning
  `null` (not throwing) on bad input. `extractClubIds(org)` (FR10) pulls just
  the club IDs out of a `"Name (CLxxxxx)"` list, with no abbreviation lookup
  — used up front to compute the disambiguation scope. `resolveClubField(org,
  abbreviations)` (FR10) then maps each club ID in the same list through the
  given `Map<clubId, abbreviation>` and returns `{club, unknownClubIds}` —
  the latter surfaced by `transform.js` as non-blocking warnings. Both share
  a private `parseOrganisationSegments(org)` helper.
- **`clubs.js`** — `CLUB_DIRECTORY`: hand-maintained `[clubId, abbreviation]`
  pairs (kept in sync with [`club-abbreviations.md`](club-abbreviations.md)),
  exposed un-disambiguated as `CLUB_BASE_ABBREVIATIONS: Map<clubId,
  string>`. `buildScopedAbbreviations(clubIds)` takes just the club IDs
  actually present in one call's scope and suffixes an abbreviation with
  `-<club number>` only for the *distinct* clubs among that given set that
  share it — a clash elsewhere in the full directory that nobody in this
  scope belongs to is irrelevant. `transform.js` calls this once per
  `generateImportRows` call, scoped to every club referenced by a competing
  entrant (FR4), not the whole directory.
- **`categories.js`** — `findCategory(classDef, age)` linear-scans a class's
  `categories: [{catId, firstYear, lastYear}]` for `firstYear <= age <=
  lastYear`, returning `null` on no match. Pure, no XML/DOM dependency —
  classes and categories come solely from `canonicalClasses.js`.
- **`canonicalClasses.js`** — `CANONICAL_CLASSES: Map<ClassId, ClassDef>`,
  the sole class/category data source (see
  [§4.2](#42-why-no-siwi-project-upload) and
  [`classes-and-categories.md`](classes-and-categories.md) for contents and
  regeneration instructions).
- **`noc.js`** — `countryNameToNoc(name)`: case/whitespace-normalized lookup
  against a common-country table, `null` on miss.
- **`transform.js`** — `generateImportRows(records, {classes,
  competitionYear})` → `{rows, errors, warnings}`, the orchestrator. Per
  record: skip if no class tokens. Per token: solo tokens map `genderLetter +
  normalizedToken` (Male→M, Female→W; `C2`/`C 2`/`C-2` normalize to `C2`)
  and validate against `classes`/`findCategory`, pushing an `Issue` on any
  miss. C2 tokens run the pairing logic from FR8, using a
  `Map<normalizedFullName, JustGoRecord[]>` name index built once and a
  `consumedC2` set to prevent double-emission while still letting a
  partner's other solo tokens process normally. Never early-returns on
  error at the file level — always finishes the full pass so `errors` is
  complete. `Issue` shape: `{severity, sourceRowIndex, person, field,
  derivedValue?, message}`. Every `OutputRow` also carries `categoryAge`
  (`competitionYear − birth year`, computed whenever a race year is
  available, even for classes with no `Category` — see FR19) and exports
  `normalizeName(first, last)`, the same normalized-name key FR8 uses for
  C2 partner lookup, reused by `bibAllocation.js` for per-person dedup.
- **`download.js`** — `triggerDownload(csvText, filename)` via `Blob` +
  temporary `<a>` click.
- **`clipboardFormat.js`** — `formatClipboardRows(rows)` → tab-delimited,
  `\r\n`-joined text per FR15: a Canoe123-labeled header row, then per row
  the 10-column positional layout (with `row.bib`, if set by FR19, written
  into the Bib column), with a C2 partner's name emitted as a separate
  following row, unbibbed. `sanitizeField` strips stray tab/CR/LF from a
  value (the paste format has no quoting mechanism to protect against
  those splitting a row into the wrong columns).
- **`clipboard.js`** — `copyToClipboard(text)`: `navigator.clipboard.writeText`
  where available, else a temporary off-screen `<textarea>` +
  `document.execCommand("copy")` fallback for non-secure/older contexts.
- **`nameCase.js`** — FR17. `toUpperFamilyCase(value)`/`toTitleGivenCase(value)`:
  simple case transforms (see FR17 for the exact algorithm and its known
  gaps). `normalizeRowNames(row)` applies both to
  `familyName`/`givenName`/`familyName2`/`givenName2` on a copy of the row.
- **`forerunners.js`** — FR18. `buildForerunnerRows()` returns the two
  fixed `OutputRow`-shaped Forerunner entries (`classId: "FR"`,
  `categoryAge: null`) in order.
- **`bibAllocation.js`** — FR19. `allocateBibs(rows)` groups rows by
  `classId` (`"FR"` exactly, else starting `"W"`, else starting `"M"`; any
  other `classId` is passed through unbibbed at the end — not expected to
  occur, but not silently dropped either), sorts Women/Men groups
  youngest-first then by name, assigns sequential bib numbers per unique
  person (via `transform.normalizeName`) with the multiple-of-5 rounding
  between groups, and **returns a new array in the reordered
  Forerunners→Women→Men sequence** (not the original row order) since bib
  numbers only make sense presented in that order.
- **`app.js`** — file-input + race-year radio + option-checkbox listeners →
  read the JustGo file → `justgo.parseJustGoCsv` → build `{classes:
  CANONICAL_CLASSES, competitionYear}` (from the selected radio) →
  `transform.generateImportRows` → render an errors panel (blocks/hides the
  download and copy buttons when non-empty) and a warnings panel (never
  blocks). On success, applies whichever of FR17-19 are checked — Forerunner
  rows prepended, then bib allocation (which also reorders), then name
  casing last — to a working copy of `rows`, then renders the preview table
  and builds both outputs from that same processed set: download button
  calls `csv.serializeCsv` + `download.triggerDownload`, copy button calls
  `clipboardFormat.formatClipboardRows` + `clipboard.copyToClipboard` and
  shows transient "Copied!"/"Copy failed" feedback. The CSV header and the
  preview table both grow a trailing "Bib" column only when FR19 is
  checked. A thrown parse error is caught and shown as a single fatal
  message.

## 4. Key design decisions

### 4.1 Age is by calendar year, not exact age

`age = competitionYear − birthYear`. This was verified directly against a
real example: a paddler born 2010-10-28 was entered as `U16` (age range
15–16) for a 2025-03-30 event — `2025 − 2010 = 15`, even though their
October birthday hadn't occurred yet by race day. Category brackets in
[`classes-and-categories.md`](classes-and-categories.md) are defined in
these calendar-year terms.

### 4.2 Why no Siwi project upload

Earlier in development the app additionally accepted a Siwi Canoe123
project XML upload and read classes/categories/competition-date from it
(e.g. the project XML's `<StartTime>` appears both inside `<Schedule>`,
which is wanted, and inside `<Results>`, a race-run time that must not be
confused with it). This was removed:

- **Classes/categories** now always come from the built-in
  `CANONICAL_CLASSES` table (captured once from
  `examples/CategoryExplorationEmpty.xml`, an empty template enumerating
  every standard class this Canoe123 installation supports — see
  [`classes-and-categories.md`](classes-and-categories.md) for the
  regeneration procedure). No per-event project file is uploaded or parsed
  at runtime.
- **Competition year** is chosen directly via the "This year"/"Next year"
  UI control instead of being derived from a project's schedule. This also
  covers the edge case of preparing this year for a race that actually runs
  next year.
- The "Siwi templates" download section in the UI is unrelated to this and
  stays — it offers a starter Canoe123 project file to open directly in
  Canoe123, it's just no longer also accepted as an upload here.

### 4.3 Known open issue — same-gender C2 crews

The canonical class scheme (`classes-and-categories.md`) models C2 (double
canoe) as a single **mixed**-gender class, `XC2`, with no separate `MC2`/
`WC2`. The app's C2 pairing logic (FR8, `transform.js`) still requires both
crew members to share a gender and computes the crew's class as `MC2`/`WC2`
— classes that don't exist in `CANONICAL_CLASSES`, so a same-gender C2 pair
currently always produces a blocking "not a recognized class" error. This is
a real gap, not yet reconciled: the user has flagged they likely still need
`MC2`/`WC2` support and this needs confirming before the gender-matching
logic (or the canonical class table) is changed. Do not silently change
this behavior.

### 4.4 Open question — C2 crew bib allocation

FR19's Bib column and a C2 crew row don't fully reconcile yet. A C2 crew is
written as one combined row (`familyName`/`givenName` for the primary
paddler, `familyName2`/`givenName2` for the partner) — `bibAllocation.js`
assigns that row's `bib` from the primary paddler's normalized name only,
so the row's Bib reflects the primary paddler; the partner doesn't get a
bib of their own on that row, and if they also race solo elsewhere and get
a bib there, the two aren't reconciled. This is low-stakes today since
same-gender C2 crews can't currently generate successfully at all
([§4.3](#43-known-open-issue--same-gender-c2-crews)) — revisit once that's
resolved.

## 5. Testing strategy

`node --test test/*.test.js` (`npm test`), Node's built-in test runner, no
external devDependencies. 58/58 passing as of this writing.

| File | Covers |
|---|---|
| `csv.test.js` | quoted-comma fields, `""`-escaping, the `\r\r\n` artifact, serialize round-trip |
| `justgo.test.js` | Australian date parsing, `extractClubIds`/`resolveClubField` (multi-club splitting, unknown-club fallback, no-code passthrough), `assertStableHeader`, end-to-end parse of the real example CSV |
| `clubs.test.js` | `CLUB_BASE_ABBREVIATIONS` un-disambiguated lookups, `buildScopedAbbreviations` suffixing both clubs on an in-scope clash, leaving an out-of-scope clash unsuffixed, ignoring repeats of one club ID, omitting unknown club IDs |
| `categories.test.js` | `findCategory` range selection, no-categories case, missing classDef |
| `canonicalClasses.test.js` | shape of the built-in table (14 classes; the 4 with 10 categories each; the 10 with none) |
| `transform.test.js` | full end-to-end against the real example CSV (6 rows, zero errors/warnings), output row shape, unrecognized-class error, out-of-range-age error, no-categories class producing a blank category (not an error), unmapped-country warning, club-abbreviation disambiguation scoped to competing entrants (in-scope clash, out-of-scope clash, non-competing record excluded from scope) |
| `transform.c2.test.js` | hand-crafted fixtures (the real example file has no C2 usage): valid pair, partner's other solo class still emitted separately, blank/not-found/ambiguous partner name, gender mismatch, missing crew `ClassId` |
| `nameCase.test.js` | `toUpperFamilyCase`/`toTitleGivenCase` on plain and hyphenated/multi-word values, `normalizeRowNames` touching only the four name fields |
| `forerunners.test.js` | `buildForerunnerRows` shape and order (2 rows, `classId: "FR"`, blank Given Name/Category, `categoryAge: null`) |
| `bibAllocation.test.js` | forerunner ordering, sorting youngest-first then by name, one shared bib per person across multiple rows, the multiple-of-5 rounding (including off an exact multiple), an empty group not breaking the rounding, no-forerunners/no-women edge cases, and that the returned array is reordered into bib order rather than preserving upload order |

`clipboardFormat.js` (FR15) still has no automated unit test — it's
currently verified manually only (see [§5.1](#51-manual-end-to-end-verification),
step 4a). A follow-up test file (`clipboardFormat.test.js`) covering the
label row, 10-column layout, the C2 partner-on-next-row case, and the Bib
column populated by FR19 would close that gap.

Representative fixtures use real people from the example JustGo export by
first name only where useful for readability; no PII beyond what's already
present in the gitignored `examples/` files is embedded in tracked test
code.

### 5.1 Manual end-to-end verification

1. `cd docs && python3 -m http.server 8000` (must be served over HTTP — ES
   module imports are blocked under `file://`, see NFR5). Open
   `http://localhost:8000/`.
2. Upload the example JustGo CSV with "This year" selected. Expect **zero
   errors, zero warnings** and **exactly 6 output rows** (5 paddlers, one of
   whom enters two classes and so produces two rows).
3. Confirm the 4 rows with a blank class column don't appear in the output.
4. Download the CSV; confirm the header matches the 9 labels in FR12
   exactly, line count is 7, and a multi-club `Organisation` value
   round-trips through quoting without corruption.
4a. Click "Copy to clipboard"; confirm the clipboard content (FR15) has no
    commas, is tab-delimited with `\r\n` row endings, row 1 reads `Family
    Name  G.Name  Ctry.  Birthdate  Club  Class  Category  Bib\No.  Ranking
    Start\Order`, and each data row has the fixed 10-column layout with the
    last three columns blank.
5. Toggle "Next year" and re-run; confirm the preview regenerates using
   `competitionYear = thisYear + 1` (rows may shift category or start
   erroring if a paddler ages out of every bracket — expected).
6. For the C2 path (unexercisable by the given example): hand-edit a
   throw-away copy of the CSV with two rows sharing a `C2` token and
   matching partner names/gender, and confirm the app reports the known
   "not a recognized class" error for `MC2`/`WC2` per [§4.3](#43-known-open-issue--same-gender-c2-crews)
   rather than crashing.
6a. With the example CSV loaded, confirm all three "Optional output" boxes
    (FR17-19) are checked by default and that: the preview and both outputs
    have a trailing Bib column; two `FORE RUNNER 1`/`FORE RUNNER 2` rows
    (class `FR`, bib 1/2) appear first; every name is upper/title-cased;
    rows are grouped Women then Men rather than in upload order, sorted
    youngest-first within each group; and the first Men bib rounds up to
    the next multiple of 5 past the last Women bib (never landing exactly
    on the boundary). Uncheck each independently and confirm the output
    reverts correctly, and that unchecking all three reproduces FR12/FR15
    byte-for-byte.
7. `npm test` passes.

## 6. Related documents

- [`siwi-import-format.md`](siwi-import-format.md) — reverse-engineered
  reference for Canoe123's own Import tab column conventions
  (`frmCanoe123.cs`), which FR12's CSV header and FR15's clipboard label row
  are both built to match.
- [`classes-and-categories.md`](classes-and-categories.md) — full canonical
  class/category listing and the `canonicalClasses.js` regeneration
  procedure.
- Canoe123's Import-tab *paste-handling* rules (delimiter priority, row
  terminator handling, the C2-partner-on-next-row behavior) were
  reverse-engineered separately from `frmCanoe123.cs`
  (`CheckAndTransformClipboardContent`/`TransformClipboard`/
  `ProcessImportData`) and aren't re-derivable from this repo alone; FR15
  above is the durable record of those findings inside this project.

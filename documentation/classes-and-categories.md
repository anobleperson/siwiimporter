# Canonical classes and categories

The app validates every JustGo class selection against a fixed, built-in list
of classes/categories — no per-event Siwi project file is uploaded or
consulted. This list was originally captured from
`examples/CategoryExplorationEmpty.xml`, an empty Siwi project template
enumerating every standard class this Canoe123 installation supports.

The list is checked into the app as
[`docs/js/canonicalClasses.js`](../docs/js/canonicalClasses.js) — see the
regeneration command at the bottom of this file if the underlying class
scheme ever changes and needs re-capturing from an updated template.

## Classes with age categories

`MK1`, `WK1`, `MC1`, `WC1` each define the same 10 age brackets. The bracket
is chosen by `competition year − birth year` (not exact chronological age —
see [`specification.md`](specification.md#41-age-is-by-calendar-year-not-exact-age)
for why), and the ranges cover the calendar age a
paddler turns *during* the competition year:

| CatId suffix | Age range | Example (MK1) |
|---|---|---|
| `U10` | 1–10 | `MK1U10` |
| `U12` | 11–12 | `MK1U12` |
| `U14` | 13–14 | `MK1U14` |
| `U16` | 15–16 | `MK1U16` |
| `U18` | 17–18 | `MK1U18` |
| `U23` | 19–23 | `MK1U23` |
| `OPN` (Open) | 24–34 | `MK1OPN` |
| `MAS` (Masters) | 35–44 | `MK1MAS` |
| `VET` (Veteran) | 45–54 | `MK1VET` |
| `VINT` (Vintage) | 55–100 | `MK1VINT` |

Swap the `MK1` prefix for `WK1`, `MC1`, or `WC1` for the other three classes
— same 10 brackets, same age ranges, just a different `CatId` prefix.

| ClassId | Class | Long title |
|---|---|---|
| `MK1` | Men's K1 | Men's Kayak |
| `WK1` | Women's K1 | Women's Kayak |
| `MC1` | Men's C1 | Men's Canoe |
| `WC1` | Women's C1 | Women's Canoe |

## Classes with no age categories

These classes have no `<Categories>` defined in the canonical project at
all — paddlers assigned to them get a **blank Category** (not an error; see
`docs/js/transform.js`'s handling of `classDef.categories.length === 0`).

| ClassId | Class | Long title |
|---|---|---|
| `XC2` | Mixed C2 | Mixed Canoe Double |
| `MX1` | Men's Kayak Cross | Men's Kayak Cross |
| `WX1` | Women's Kayak Cross | Women's Kayak Cross |
| `MK1x3` | Men's K1 Team | Men's Kayak Team |
| `WK1x3` | Women's K1 Team | Women's Kayak Team |
| `MC1x3` | Men's C1 Team | Men's Canoe Team |
| `WC1x3` | Women's C1 Team | Women's Canoe Team |
| `XC2x3` | Mixed C2 Team | Mixed Canoe Double Team |
| `FR` | Forerunners | Forerunners |
| `NA` | Not entered/assigned | Not entered or not assigned |

**Note on `XC2`:** the canonical scheme models C2 (double canoe) as a single
*mixed*-gender class, not separate `MC2`/`WC2` classes. The app's current C2
pairing logic (in `docs/js/transform.js`) still requires both crew members
to share a gender and computes the crew's class as `MC2`/`WC2` — this is a
known open question, not yet reconciled with the canonical scheme above. See
[`specification.md`](specification.md#43-known-open-issue--same-gender-c2-crews)
for status.

## Regenerating `canonicalClasses.js`

The app itself no longer parses Siwi project XML (see
[`specification.md`](specification.md#42-why-no-siwi-project-upload)), so
this is a one-off dev script, not app code. If
`examples/CategoryExplorationEmpty.xml` (or an updated equivalent template)
changes, regenerate the data module from it with a throwaway parse (run from
the repo root, after `npm install --no-save @xmldom/xmldom`):

```js
node -e '
import("@xmldom/xmldom").then(async ({ DOMParser }) => {
  const fs = await import("node:fs");
  const NS = "http://siwidata.com/Canoe123/Data.xsd";
  const text = fs.readFileSync("examples/CategoryExplorationEmpty.xml", "utf8");
  const doc = new DOMParser().parseFromString(text, "application/xml");
  const root = doc.documentElement;

  const directChildren = (el, name) =>
    Array.from(el.childNodes).filter(
      (n) => n.nodeType === 1 && n.localName === name && (n.namespaceURI === NS || n.namespaceURI == null)
    );
  const directChild = (el, name) => directChildren(el, name)[0] ?? null;
  const textOf = (el) => (el ? (el.textContent ?? "").trim() : "");

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

  const lines = [
    "// Canonical Canoe123 class/category reference data.",
    "//",
    "// Generated from examples/CategoryExplorationEmpty.xml (an empty Siwi",
    "// project template enumerating every standard class this installation",
    "// supports, independent of any specific event). See",
    "// documentation/classes-and-categories.md for the human-readable list and",
    "// how this file was produced.",
    "//",
    "// This is the sole source of classes/categories for the importer — no",
    "// per-event Siwi project file is uploaded or consulted.",
    "",
    "/** @type {[string, {classId: string, categories: {catId: string, firstYear: number, lastYear: number}[]}][]} */",
    "const ENTRIES = [",
    ...[...classes].map(([id, def]) => {
      const cats = def.categories.map(c => `{ catId: ${JSON.stringify(c.catId)}, firstYear: ${c.firstYear}, lastYear: ${c.lastYear} }`).join(", ");
      return `  [${JSON.stringify(id)}, { classId: ${JSON.stringify(id)}, categories: [${cats}] }],`;
    }),
    "];",
    "",
    "export const CANONICAL_CLASSES = new Map(ENTRIES);",
    "",
  ];
  fs.writeFileSync("docs/js/canonicalClasses.js", lines.join("\n"));
  console.log("written docs/js/canonicalClasses.js");
});
'
```

Then run `npm uninstall @xmldom/xmldom` (it's not a runtime or test
dependency) and `npm test` — `test/canonicalClasses.test.js` checks the
generated file's shape (14 classes, the 4 with 10 categories each, the 10
with none).

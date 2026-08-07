import { parseJustGoCsv } from "./justgo.js";
import { parseSiwiProject, mergeClassesWithFallback } from "./siwiXml.js";
import { CANONICAL_CLASSES } from "./canonicalClasses.js";
import { generateImportRows, OUTPUT_HEADER, rowToCsvArray } from "./transform.js";
import { serializeCsv } from "./csv.js";
import { triggerDownload } from "./download.js";

const justgoInput = document.getElementById("justgo-file");
const siwiInput = document.getElementById("siwi-file");
const fatalEl = document.getElementById("fatal");
const errorsEl = document.getElementById("errors");
const errorsListEl = document.getElementById("errors-list");
const warningsEl = document.getElementById("warnings");
const warningsListEl = document.getElementById("warnings-list");
const previewEl = document.getElementById("preview");
const downloadBtn = document.getElementById("download-btn");
const statusEl = document.getElementById("status");

let latestCsvText = "";

justgoInput.addEventListener("change", run);
siwiInput.addEventListener("change", run);
downloadBtn.addEventListener("click", () => {
  triggerDownload(latestCsvText, "siwi-import.csv");
});

// Signals to the file:// fallback check in index.html that this module
// script actually loaded and ran (it silently fails to load at all under
// file:// in Chrome/Edge, since they block ES module fetches from a file
// origin — see the inline script in index.html).
window.__siwiImporterReady = true;

async function run() {
  clear();

  const justgoFile = justgoInput.files[0];
  const siwiFile = siwiInput.files[0];
  if (!justgoFile || !siwiFile) {
    statusEl.textContent = "Upload both files to begin.";
    return;
  }

  statusEl.textContent = "Processing…";

  let records, siwiConfig;
  try {
    const [justgoText, siwiText] = await Promise.all([justgoFile.text(), siwiFile.text()]);
    records = parseJustGoCsv(justgoText);
    const project = parseSiwiProject(siwiText);
    siwiConfig = {
      classes: mergeClassesWithFallback(project.classes, CANONICAL_CLASSES),
      competitionYear: project.competitionYear,
    };
  } catch (err) {
    statusEl.textContent = "";
    renderFatal(err);
    return;
  }

  const { rows, errors, warnings } = generateImportRows(records, siwiConfig);

  renderIssues(errorsEl, errorsListEl, errors);
  renderIssues(warningsEl, warningsListEl, warnings);
  renderPreview(rows);

  if (errors.length > 0) {
    statusEl.textContent = `${errors.length} error${errors.length === 1 ? "" : "s"} found — fix these in your source files and re-upload.`;
    downloadBtn.disabled = true;
    latestCsvText = "";
    return;
  }

  latestCsvText = serializeCsv([OUTPUT_HEADER, ...rows.map(rowToCsvArray)]);
  downloadBtn.disabled = rows.length === 0;
  statusEl.textContent = `${rows.length} row${rows.length === 1 ? "" : "s"} ready to download.`;
}

function clear() {
  fatalEl.hidden = true;
  fatalEl.textContent = "";
  errorsEl.hidden = true;
  errorsListEl.innerHTML = "";
  warningsEl.hidden = true;
  warningsListEl.innerHTML = "";
  previewEl.innerHTML = "";
  downloadBtn.disabled = true;
  latestCsvText = "";
}

function renderFatal(err) {
  fatalEl.hidden = false;
  fatalEl.textContent = err.message ?? String(err);
}

function renderIssues(panel, listContainer, issues) {
  if (issues.length === 0) return;
  panel.hidden = false;
  const list = document.createElement("ul");
  for (const issue of issues) {
    const li = document.createElement("li");
    li.textContent = `${issue.person} (row ${issue.sourceRowIndex}), ${issue.field}: ${issue.message}`;
    list.appendChild(li);
  }
  listContainer.appendChild(list);
}

function renderPreview(rows) {
  if (rows.length === 0) return;
  const table = document.createElement("table");

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  for (const label of OUTPUT_HEADER) {
    const th = document.createElement("th");
    th.textContent = label;
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (const row of rows) {
    const tr = document.createElement("tr");
    for (const value of rowToCsvArray(row)) {
      const td = document.createElement("td");
      td.textContent = value;
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);

  previewEl.appendChild(table);
}

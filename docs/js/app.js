import { parseJustGoCsv } from "./justgo.js";
import { CANONICAL_CLASSES } from "./canonicalClasses.js";
import { generateImportRows, OUTPUT_HEADER, rowToCsvArray } from "./transform.js";
import { serializeCsv } from "./csv.js";
import { triggerDownload } from "./download.js";
import { copyToClipboard } from "./clipboard.js";
import { formatClipboardRows } from "./clipboardFormat.js";
import { normalizeRowNames } from "./nameCase.js";
import { buildForerunnerRows } from "./forerunners.js";
import { allocateBibs } from "./bibAllocation.js";

const justgoInput = document.getElementById("justgo-file");
const yearInputs = document.querySelectorAll('input[name="race-year"]');
const normalizeNamesInput = document.getElementById("normalize-names");
const forerunnerInput = document.getElementById("forerunner");
const allocateBibsInput = document.getElementById("allocate-bibs");
const fatalEl = document.getElementById("fatal");
const errorsEl = document.getElementById("errors");
const errorsListEl = document.getElementById("errors-list");
const warningsEl = document.getElementById("warnings");
const warningsListEl = document.getElementById("warnings-list");
const previewEl = document.getElementById("preview");
const downloadBtn = document.getElementById("download-btn");
const copyBtn = document.getElementById("copy-btn");
const statusEl = document.getElementById("status");
const copyBtnDefaultLabel = copyBtn.textContent;
let copyBtnResetTimer = null;

let latestCsvText = "";
let latestClipboardText = "";

const thisYear = new Date().getFullYear();
for (const input of yearInputs) {
  const label = input.closest("label")?.querySelector(".year-value");
  if (!label) continue;
  label.textContent = input.value === "next" ? String(thisYear + 1) : String(thisYear);
}

justgoInput.addEventListener("change", run);
for (const input of yearInputs) {
  input.addEventListener("change", run);
}
normalizeNamesInput.addEventListener("change", run);
forerunnerInput.addEventListener("change", run);
allocateBibsInput.addEventListener("change", run);
downloadBtn.addEventListener("click", () => {
  triggerDownload(latestCsvText, "siwi-import.csv");
});
copyBtn.addEventListener("click", async () => {
  try {
    await copyToClipboard(latestClipboardText);
    showCopyFeedback("Copied!");
  } catch (err) {
    showCopyFeedback("Copy failed");
  }
});

// Signals to the file:// fallback check in index.html that this module
// script actually loaded and ran (it silently fails to load at all under
// file:// in Chrome/Edge, since they block ES module fetches from a file
// origin — see the inline script in index.html).
window.__siwiImporterReady = true;

function selectedRaceYear() {
  const checked = Array.from(yearInputs).find((input) => input.checked);
  return checked?.value === "next" ? thisYear + 1 : thisYear;
}

async function run() {
  clear();

  const justgoFile = justgoInput.files[0];
  if (!justgoFile) {
    statusEl.textContent = "Upload a JustGo attendee CSV to begin.";
    return;
  }

  statusEl.textContent = "Processing…";

  let records;
  try {
    const justgoText = await justgoFile.text();
    records = parseJustGoCsv(justgoText);
  } catch (err) {
    statusEl.textContent = "";
    renderFatal(err);
    return;
  }

  const classesConfig = { classes: CANONICAL_CLASSES, competitionYear: selectedRaceYear() };
  const { rows, errors, warnings } = generateImportRows(records, classesConfig);

  renderIssues(errorsEl, errorsListEl, errors);
  renderIssues(warningsEl, warningsListEl, warnings);

  if (errors.length > 0) {
    renderPreview(rows, false);
    statusEl.textContent = `${errors.length} error${errors.length === 1 ? "" : "s"} found — fix these in your JustGo CSV and re-upload.`;
    downloadBtn.disabled = true;
    copyBtn.disabled = true;
    latestCsvText = "";
    latestClipboardText = "";
    return;
  }

  // Optional output features (FR17-19): Forerunner rows first (so bib
  // allocation sees them), then bib numbers, then name-casing last so it
  // doesn't affect sorting/grouping upstream of it.
  let outputRows = rows;
  if (forerunnerInput.checked) {
    outputRows = [...buildForerunnerRows(), ...outputRows];
  }
  if (allocateBibsInput.checked) {
    outputRows = allocateBibs(outputRows);
  }
  if (normalizeNamesInput.checked) {
    outputRows = outputRows.map(normalizeRowNames);
  }

  const bibEnabled = allocateBibsInput.checked;
  renderPreview(outputRows, bibEnabled);

  const header = bibEnabled ? [...OUTPUT_HEADER, "Bib"] : OUTPUT_HEADER;
  const toCsvRow = bibEnabled ? (row) => [...rowToCsvArray(row), String(row.bib ?? "")] : rowToCsvArray;
  latestCsvText = serializeCsv([header, ...outputRows.map(toCsvRow)]);
  latestClipboardText = formatClipboardRows(outputRows);
  downloadBtn.disabled = outputRows.length === 0;
  copyBtn.disabled = outputRows.length === 0;
  statusEl.textContent = `${outputRows.length} row${outputRows.length === 1 ? "" : "s"} ready to download.`;
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
  copyBtn.disabled = true;
  latestCsvText = "";
  latestClipboardText = "";
}

function showCopyFeedback(message) {
  window.clearTimeout(copyBtnResetTimer);
  copyBtn.textContent = message;
  copyBtnResetTimer = window.setTimeout(() => {
    copyBtn.textContent = copyBtnDefaultLabel;
  }, 1500);
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

function renderPreview(rows, bibEnabled) {
  if (rows.length === 0) return;
  const table = document.createElement("table");
  const header = bibEnabled ? [...OUTPUT_HEADER, "Bib"] : OUTPUT_HEADER;
  const toCsvRow = bibEnabled ? (row) => [...rowToCsvArray(row), String(row.bib ?? "")] : rowToCsvArray;

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  for (const label of header) {
    const th = document.createElement("th");
    th.textContent = label;
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (const row of rows) {
    const tr = document.createElement("tr");
    for (const value of toCsvRow(row)) {
      const td = document.createElement("td");
      td.textContent = value;
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);

  previewEl.appendChild(table);
}

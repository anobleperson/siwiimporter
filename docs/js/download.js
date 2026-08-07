// Triggers a browser file download from in-memory CSV text. DOM-only.

/**
 * @param {string} csvText
 * @param {string} filename
 */
export function triggerDownload(csvText, filename) {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

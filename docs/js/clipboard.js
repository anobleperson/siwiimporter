// Copies in-memory CSV text to the system clipboard. DOM-only.

/**
 * @param {string} text
 * @returns {Promise<void>}
 */
export async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  // Fallback for browsers/contexts without the async Clipboard API
  // (e.g. non-secure origins).
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    if (!document.execCommand("copy")) {
      throw new Error("Copy command was not successful.");
    }
  } finally {
    textarea.remove();
  }
}

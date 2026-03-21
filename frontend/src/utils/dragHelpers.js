/**
 * dragHelpers.js — Shared utilities for the HTML5 drag-to-action system.
 */

/**
 * Parse the drop data from a drag event.
 * Reads the custom MIME type 'application/quantixone-node'.
 * Returns the parsed node data object, or null if nothing valid was dragged.
 */
export function parseDropData(e) {
  try {
    const raw = e.dataTransfer.getData('application/quantixone-node');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

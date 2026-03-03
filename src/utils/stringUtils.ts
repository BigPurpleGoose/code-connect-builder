/**
 * String utilities for the Code Connect Builder.
 */

/** Convert any string to camelCase. Removes spaces, question marks, hyphens. */
export function toCamelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)/g, (_, char) => char.toUpperCase())
    .replace(/[^a-zA-Z0-9$_]/g, '')
    .replace(/^[A-Z]/, (c) => c.toLowerCase());
}

/** Check if a string is a valid JS identifier. */
export function isValidIdentifier(str: string): boolean {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(str);
}

/** Return true if the string looks like a Figma design file URL or a node ID. */
export function isFigmaUrl(str: string): boolean {
  if (!str.trim()) return false;
  // Normalize percent-encoded colons before checking
  const normalized = str.trim().replace(/%3A/gi, ':');
  return (
    normalized.startsWith('https://www.figma.com/') ||
    normalized.startsWith('https://figma.com/') ||
    /^\d+:\d+$/.test(normalized) // node ID format e.g. "123:456"
  );
}

/** Generate a random ID (short, collision-unlikely for UI IDs). */
export function genId(): string {
  return Math.random().toString(36).slice(2, 9);
}

/**
 * Escape a string value for use inside a JS string literal.
 * E.g. wraps in single quotes and escapes internal single quotes.
 */
export function toStringLiteral(val: string): string {
  return `'${val.replace(/'/g, "\\'")}'`;
}

/**
 * Normalize a Figma URL pasted from the browser or Figma app:
 * - Decodes percent-encoded colons (%3A → :) produced by some Figma copy actions
 * - Trims whitespace
 */
export function normalizeFigmaUrl(url: string): string {
  return url.trim().replace(/%3A/gi, ':');
}

/**
 * Return true if a string requires quotes as an object key (i.e., it is NOT
 * a plain JavaScript identifier). Figma variant names like "With Icon" need
 * quotes; simple names like "Primary" do not.
 */
export function needsQuotes(str: string): boolean {
  return !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(str);
}

/** Indent each line of a multiline string by `n` spaces. */
export function indent(str: string, n: number): string {
  const pad = ' '.repeat(n);
  return str
    .split('\n')
    .map((line) => (line.trim() ? pad + line : line))
    .join('\n');
}

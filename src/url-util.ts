/**
 * Strip every trailing `/` from a base URL without a backtracking regex.
 *
 * The previous `s.replace(/\/+$/, '')` is flagged by CodeQL (js/polynomial-redos): on inputs
 * shaped like `////…x` the `\/+$` pattern re-scans quadratically. Base URLs here come from
 * caller configuration, not from the wire, so the exposure is small — but a loop is both
 * linear and clearer, and it removes the finding at the source for every client that shares it.
 */
export function stripTrailingSlashes(input: string): string {
  let end = input.length;
  while (end > 0 && input.charCodeAt(end - 1) === 47 /* '/' */) end--;
  return end === input.length ? input : input.slice(0, end);
}

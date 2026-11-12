#!/usr/bin/env node
/**
 * check-package-description-maturity.mjs: fail when a published description claims
 * more maturity than the package has (WAVE-24383, WAVE-36523).
 *
 * WAVE is pre-GA. A registry description is the first line a developer reads, so
 * "Official WAVE SDK" with no preview tag reads as a general-availability claim.
 * This check reads every description this repo publishes and fails when one makes a
 * maturity claim (official, GA, production-ready, enterprise-grade) without
 * also carrying a maturity qualifier (private preview, preview, beta, alpha,
 * experimental, early access, not yet GA).
 *
 * Files read (missing optional files are skipped, never passed silently):
 *   package.json       description (required)
 *   plugin.json        description (optional)
 *
 * Prints one `PASS|FAIL|UNKNOWN <file>: <detail>` line per description.
 *
 * EXIT CODES
 *   0  every description passed
 *   1  the check ran and at least one description is FAIL or UNKNOWN
 *   2  the check could not run (unreadable or invalid JSON)
 *
 * Usage:  node scripts/maturity/check-package-description-maturity.mjs [--dir .]
 */

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Words that claim maturity. Matched as whole words, case-insensitive. */
export const CLAIMS = [
  /\bofficial\b/i,
  /\bGA\b/,
  /\bgenerally available\b/i,
  /\bproduction[- ]ready\b/i,
  /\bproduction[- ]grade\b/i,
  /\benterprise[- ]grade\b/i,
  /\bbattle[- ]tested\b/i,
];

/** Qualifiers that state the real maturity. Any one is enough. */
export const QUALIFIERS = [
  /\bprivate preview\b/i,
  /\bpublic preview\b/i,
  /\bpreview\b/i,
  /\bbeta\b/i,
  /\balpha\b/i,
  /\bexperimental\b/i,
  /\bearly access\b/i,
  /\bnot yet GA\b/i,
  /\bpre-GA\b/i,
];

/**
 * Classify one description.
 * @param {unknown} description
 * @returns {{ verdict: 'PASS'|'FAIL'|'UNKNOWN', detail: string }}
 */
export function checkDescription(description) {
  if (typeof description !== 'string' || description.trim() === '') {
    return { verdict: 'UNKNOWN', detail: 'no description to check' };
  }
  // A "not yet GA" qualifier contains "GA"; strip qualifiers before looking for claims.
  let rest = description;
  const qualifier = QUALIFIERS.find((q) => q.test(description));
  for (const q of QUALIFIERS) rest = rest.replace(new RegExp(q.source, q.flags.includes('g') ? q.flags : q.flags + 'g'), ' ');
  const claim = CLAIMS.map((c) => rest.match(c)).find(Boolean);
  if (!claim) return { verdict: 'PASS', detail: 'no maturity claim' };
  if (qualifier) return { verdict: 'PASS', detail: `claim "${claim[0]}" is qualified` };
  return {
    verdict: 'FAIL',
    detail: `claims "${claim[0]}" with no maturity qualifier (add e.g. "private preview")`,
  };
}

/**
 * Check every description file under dir.
 * @param {string} dir
 * @returns {{ results: Array<{file: string, verdict: string, detail: string}>, exitCode: number }}
 */
export function checkRepo(dir) {
  const files = [
    { file: 'package.json', required: true },
    { file: 'plugin.json', required: false },
  ];
  const results = [];
  for (const { file, required } of files) {
    const p = path.join(dir, file);
    if (!existsSync(p)) {
      if (required) results.push({ file, verdict: 'UNKNOWN', detail: 'file missing' });
      continue;
    }
    let json;
    try {
      json = JSON.parse(readFileSync(p, 'utf8'));
    } catch (e) {
      return { results: [{ file, verdict: 'ERROR', detail: `cannot read JSON: ${e.message}` }], exitCode: 2 };
    }
    results.push({ file, ...checkDescription(json.description) });
  }
  const exitCode = results.every((r) => r.verdict === 'PASS') ? 0 : 1;
  return { results, exitCode };
}

function main(argv) {
  const i = argv.indexOf('--dir');
  const dir = i >= 0 && argv[i + 1] ? argv[i + 1] : '.';
  const { results, exitCode } = checkRepo(dir);
  for (const r of results) console.log(`${r.verdict} ${r.file}: ${r.detail}`);
  return exitCode;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}

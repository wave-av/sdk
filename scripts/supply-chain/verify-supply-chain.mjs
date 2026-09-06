#!/usr/bin/env node
/**
 * verify-supply-chain.mjs — SUPPLY-001 evidence harness.
 *
 * Answers one question for every artifact WAVE publishes, against the LIVE registry
 * rather than the repo that claims to publish it:
 *
 *   1. Is there a signed build-provenance attestation on the published artifact?
 *      (npm: `dist.attestations` with a SLSA provenance predicate, minted by
 *       `npm publish --provenance` under an OIDC identity.
 *       PyPI: PEP 740 attestations on the published files.)
 *   2. Is the tarball registry-signed?  (npm `dist.signatures`.)
 *   3. Is an SBOM published as an asset on the corresponding GitHub Release?
 *
 * A repo's workflow saying `--provenance` proves nothing about what is ON the registry:
 * every artifact published before that workflow landed still has no attestation. This
 * script reads the registry, so it cannot be fooled by an aspirational workflow or by a
 * PROVENANCE.md that declares `sbom: cyclonedx` while no release carries one.
 *
 * Usage:
 *   node scripts/supply-chain/verify-supply-chain.mjs              # all targets, human table
 *   node scripts/supply-chain/verify-supply-chain.mjs --json       # machine receipt
 *   node scripts/supply-chain/verify-supply-chain.mjs --target npm:@wave-av/sdk
 *   node scripts/supply-chain/verify-supply-chain.mjs --targets ./scripts/supply-chain/targets.json
 *
 * Exit code: 0 when every target meets its declared `expect`, 1 otherwise, 2 on a
 * harness error (bad target file, network failure). Non-zero is the point — this is a
 * gate, not a report.
 *
 * Network: unauthenticated GETs to registry.npmjs.org, pypi.org and api.github.com.
 * GITHUB_TOKEN, if present in the environment, is sent to api.github.com ONLY, purely to
 * lift the 60-req/hour anonymous rate limit. No token is ever sent to a package registry.
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// --- Input validation -------------------------------------------------------
// Every value below is interpolated into a URL. Validate before constructing one so a
// malformed or hostile targets file cannot redirect a request at another host (SSRF) —
// `..%2f` or a scheme-bearing name is rejected here rather than encoded away downstream.

/** npm package name: optional `@scope/`, lowercase, no path traversal. */
export const NPM_NAME_RE = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/;
/** PyPI project name per PEP 508. */
export const PYPI_NAME_RE = /^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$/;
/** GitHub `owner/repo`. */
export const GH_REPO_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*\/[A-Za-z0-9][A-Za-z0-9._-]*$/;

/**
 * Validate an identifier destined for a URL path.
 * @param {'npm'|'pypi'|'repo'} kind
 * @param {unknown} value
 * @returns {string} the validated value
 */
export function assertName(kind, value) {
  const re = kind === 'npm' ? NPM_NAME_RE : kind === 'pypi' ? PYPI_NAME_RE : GH_REPO_RE;
  if (typeof value !== 'string' || !re.test(value)) {
    throw new Error(`invalid ${kind} identifier: ${JSON.stringify(value)}`);
  }
  return value;
}

// --- Pure evaluators --------------------------------------------------------
// Separated from I/O so they are unit-testable against recorded registry responses.

/**
 * Evaluate an npm `dist` object for provenance and registry signatures.
 * @param {Record<string, any> | null | undefined} dist the `dist` of one published version
 */
export function evaluateNpmDist(dist) {
  const attestations = dist?.attestations ?? null;
  const predicateType = attestations?.provenance?.predicateType ?? null;
  return {
    // A provenance attestation is only real when it declares a SLSA provenance predicate.
    // An `attestations` object with a publish-attestation-only predicate is NOT build provenance.
    provenance: typeof predicateType === 'string' && predicateType.includes('slsa.dev/provenance'),
    predicateType,
    attestationUrl: attestations?.url ?? null,
    signatures: Array.isArray(dist?.signatures) && dist.signatures.length > 0,
    shasum: dist?.shasum ?? null,
  };
}

/**
 * Evaluate PyPI file records for PEP 740 attestations.
 * @param {Array<Record<string, any>> | null | undefined} urls the `urls` array of a PyPI JSON response
 */
export function evaluatePyPiFiles(urls) {
  const files = Array.isArray(urls) ? urls : [];
  const attested = files.filter((f) => f?.provenance != null);
  return {
    // PyPI publishes provenance per-file; the artifact is attested only when EVERY
    // distributed file carries one. A signed wheel beside an unsigned sdist is a gap.
    provenance: files.length > 0 && attested.length === files.length,
    fileCount: files.length,
    attestedCount: attested.length,
    filenames: files.map((f) => f?.filename).filter(Boolean),
  };
}

/** Asset names that count as a published SBOM. */
export const SBOM_ASSET_RE = /(sbom|cyclonedx|bom\.json|spdx)/i;

/**
 * Evaluate GitHub Release assets for a published SBOM.
 * @param {Array<Record<string, any>> | null | undefined} assets
 */
export function evaluateReleaseAssets(assets) {
  const list = Array.isArray(assets) ? assets : [];
  const names = list.map((a) => a?.name).filter((n) => typeof n === 'string');
  const matches = names.filter((n) => SBOM_ASSET_RE.test(n));
  const formats = [];
  if (matches.some((n) => /cyclonedx|bom\.json/i.test(n))) formats.push('cyclonedx');
  if (matches.some((n) => /spdx/i.test(n))) formats.push('spdx');
  return { sbom: matches.length > 0, matches, formats, assetCount: list.length, names };
}

/**
 * Compare an observed result against the target's declared expectation.
 * @param {Record<string, any>} expect
 * @param {Record<string, any>} observed
 * @returns {{ ok: boolean, failures: string[] }}
 */
export function diffExpectation(expect = {}, observed = {}) {
  const failures = [];
  for (const key of ['provenance', 'signatures', 'sbom']) {
    if (expect[key] === true && observed[key] !== true) failures.push(key);
  }
  return { ok: failures.length === 0, failures };
}

// --- I/O --------------------------------------------------------------------

/** @param {string} url @param {Record<string,string>} [headers] */
async function getJson(url, headers = {}) {
  const res = await fetch(url, {
    headers: { accept: 'application/json', 'user-agent': 'wave-supply-chain-verifier', ...headers },
  });
  if (!res.ok) {
    const err = new Error(`GET ${url} -> ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/**
 * Resolve one target against the live registries.
 * @param {Record<string, any>} target
 * @param {{ fetchJson?: typeof getJson, githubToken?: string }} [deps]
 */
export async function verifyTarget(target, deps = {}) {
  const fetchJson = deps.fetchJson ?? getJson;
  const githubToken = deps.githubToken ?? process.env.GITHUB_TOKEN ?? '';
  const result = {
    id: target.id,
    registry: target.registry,
    name: target.name,
    repo: target.repo ?? null,
    version: null,
    provenance: false,
    predicateType: null,
    signatures: false,
    sbom: false,
    sbomFormats: [],
    release: null,
    notes: [],
  };

  if (target.registry === 'npm') {
    const name = assertName('npm', target.name);
    const meta = await fetchJson(`https://registry.npmjs.org/${encodeURIComponent(name)}`);
    const version = meta?.['dist-tags']?.latest;
    if (!version) throw new Error(`${name}: registry returned no dist-tags.latest`);
    result.version = version;
    const dist = meta?.versions?.[version]?.dist;
    const npmEval = evaluateNpmDist(dist);
    result.provenance = npmEval.provenance;
    result.predicateType = npmEval.predicateType;
    result.signatures = npmEval.signatures;
    result.publishedAt = meta?.time?.[version] ?? null;
  } else if (target.registry === 'pypi') {
    const name = assertName('pypi', target.name);
    const meta = await fetchJson(`https://pypi.org/pypi/${encodeURIComponent(name)}/json`);
    result.version = meta?.info?.version ?? null;
    const pyEval = evaluatePyPiFiles(meta?.urls);
    result.provenance = pyEval.provenance;
    result.predicateType = pyEval.provenance ? 'pep740' : null;
    result.signatures = false; // PyPI retired PGP signatures; PEP 740 attestation is the signal.
    result.notes.push(`${pyEval.attestedCount}/${pyEval.fileCount} files attested`);
  } else {
    throw new Error(`unknown registry for ${target.id}: ${target.registry}`);
  }

  // SBOM lives on the GitHub Release, not the package registry.
  if (target.repo) {
    const repo = assertName('repo', target.repo);
    try {
      const rel = await fetchJson(
        `https://api.github.com/repos/${repo}/releases/latest`,
        githubToken ? { authorization: `Bearer ${githubToken}` } : {},
      );
      const relEval = evaluateReleaseAssets(rel?.assets);
      result.sbom = relEval.sbom;
      result.sbomFormats = relEval.formats;
      result.release = { tag: rel?.tag_name ?? null, assetCount: relEval.assetCount, assets: relEval.names };
    } catch (err) {
      if (err?.status === 404) {
        result.notes.push('no GitHub Release published');
        result.release = { tag: null, assetCount: 0, assets: [] };
      } else {
        throw err;
      }
    }
  }

  const { ok, failures } = diffExpectation(target.expect, result);
  result.ok = ok;
  result.failures = failures;
  return result;
}

// --- Rendering --------------------------------------------------------------

const YES = 'yes';
const NO = 'NO';

/** @param {Array<Record<string, any>>} results */
export function formatTable(results) {
  const rows = results.map((r) => [
    r.ok ? 'PASS' : 'FAIL',
    r.id,
    r.version ?? '?',
    r.provenance ? YES : NO,
    r.signatures ? YES : NO,
    r.sbom ? (r.sbomFormats.join('+') || YES) : NO,
    r.failures?.length ? `missing: ${r.failures.join(', ')}` : '',
  ]);
  const header = ['', 'ARTIFACT', 'VERSION', 'PROVENANCE', 'SIGNED', 'SBOM', 'GAP'];
  const widths = header.map((h, i) => Math.max(h.length, ...rows.map((row) => String(row[i]).length)));
  const line = (cells) => cells.map((c, i) => String(c).padEnd(widths[i])).join('  ').trimEnd();
  return [line(header), line(widths.map((w) => '-'.repeat(w))), ...rows.map(line)].join('\n');
}

// --- CLI --------------------------------------------------------------------

async function main(argv) {
  const args = argv.slice(2);
  const jsonOut = args.includes('--json');
  const only = args.includes('--target') ? args[args.indexOf('--target') + 1] : null;
  const here = path.dirname(fileURLToPath(import.meta.url));
  const targetsPath = args.includes('--targets')
    ? args[args.indexOf('--targets') + 1]
    : path.join(here, 'targets.json');

  let targets;
  try {
    const parsed = JSON.parse(await readFile(targetsPath, 'utf8'));
    targets = parsed.targets;
    if (!Array.isArray(targets) || targets.length === 0) throw new Error('no targets');
  } catch (err) {
    process.stderr.write(`verify-supply-chain: cannot read targets from ${targetsPath}: ${err.message}\n`);
    return 2;
  }
  if (only) {
    targets = targets.filter((t) => t.id === only);
    if (targets.length === 0) {
      process.stderr.write(`verify-supply-chain: no target with id ${only}\n`);
      return 2;
    }
  }

  const results = [];
  for (const target of targets) {
    try {
      results.push(await verifyTarget(target));
    } catch (err) {
      process.stderr.write(`verify-supply-chain: ${target.id}: ${err.message}\n`);
      return 2;
    }
  }

  const failed = results.filter((r) => !r.ok);
  if (jsonOut) {
    process.stdout.write(
      `${JSON.stringify(
        { criterion: 'SUPPLY-001', checkedAt: new Date().toISOString(), pass: failed.length === 0, results },
        null,
        2,
      )}\n`,
    );
  } else {
    process.stdout.write(`SUPPLY-001 — provenance and SBOM on every published artifact\n`);
    process.stdout.write(`checked ${new Date().toISOString()} against the live registries\n\n`);
    process.stdout.write(`${formatTable(results)}\n\n`);
    for (const r of results) {
      if (r.notes?.length) process.stdout.write(`  ${r.id}: ${r.notes.join('; ')}\n`);
    }
    process.stdout.write(
      failed.length === 0
        ? `\nSUPPLY-001: PASS — ${results.length}/${results.length} artifacts attested and accompanied by an SBOM.\n`
        : `\nSUPPLY-001: FAIL — ${failed.length}/${results.length} artifacts below the bar: ${failed
            .map((r) => `${r.id} (${r.failures.join(', ')})`)
            .join('; ')}\n`,
    );
  }
  return failed.length === 0 ? 0 : 1;
}

// Run only when executed directly, so tests can import the pure functions.
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv).then(
    (code) => process.exit(code),
    (err) => {
      process.stderr.write(`verify-supply-chain: ${err?.stack ?? err}\n`);
      process.exit(2);
    },
  );
}

#!/usr/bin/env node
/**
 * ga-evidence.mjs — GA-evidence producer for wave-av/sdk (WAVE-GA-gate-spec-v1.0.0).
 *
 * Runs this repo's GA criterion checks and writes:
 *   ga-out/ga-report.json                       full detail (for debugging/triage)
 *   ga-out/wave-av__sdk.ga-evidence.json         governance/schema/ga-evidence.schema.json
 *                                                shape, ready to hand to the intake repo
 *
 * CRITERIA EMITTED
 *   VER-001  always — see scripts/ga/check-ver-001.mjs.
 *   CONTRACT-001  NEVER, today. This repo does not record which api-spec revision/contract
 *     hash it was generated from (no openapi/spec-hash pin anywhere in the tree — checked
 *     2026-09-05: no match for openapi/contract-hash/spec-revision/codegen pins, and
 *     capabilities.json's `consumes.waveProducts` names the api-spec repo with no revision
 *     or hash). Emitting an `unknown` with nothing observed would be noise per the intake
 *     contract's own rule — so this producer emits nothing for CONTRACT-001 rather than a
 *     manufactured status. If a contract-hash pin is added later, add a matching
 *     check-CONTRACT-001.sh and wire it in here.
 *
 * EXIT CODES — mirrors the underlying checks: 0 all criteria verified pass, 1 at least one
 * criterion is fail/unknown, 2 the producer itself could not run.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkVer001, REPO_ROOT } from './check-ver-001.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SPEC_VERSION = '1.0.0';
const REPOSITORY = 'wave-av/sdk';
const EVIDENCE_URI = 'ci://wave-av/sdk/.github/workflows/ga-evidence.yml#ga-report.json';

function parseArgs(argv) {
  const out = { outDir: resolve(REPO_ROOT, 'ga-out') };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--out-dir') out.outDir = resolve(argv[++i]);
    else throw new Error(`unknown argument: ${argv[i]}`);
  }
  return out;
}

function gitRevision() {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
  } catch {
    return process.env.GITHUB_SHA || 'unknown';
  }
}

function statusFor(checks) {
  if (checks.some((c) => c.status === 'FAIL')) return 'fail';
  if (checks.some((c) => c.status === 'UNKNOWN')) return 'unknown';
  return 'pass';
}

/**
 * Fingerprint deliberately excludes timestamps, temp paths and durations (gate spec
 * idempotency rule): two runs observing the same shipped artifacts must produce the same
 * digest. Inputs are criterion ids, per-check names + ok flags, and observed version
 * strings — never a raw command output or response body.
 */
function fingerprint(criterionResults) {
  const canonical = criterionResults
    .map((r) => ({
      criterion_id: r.criterion_id,
      status: r.status,
      checks: r.checks.map((c) => [c.name, c.ok]).sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)),
      targets_observed: [...r.targetsObserved].sort(),
    }))
    .sort((a, b) => (a.criterion_id < b.criterion_id ? -1 : a.criterion_id > b.criterion_id ? 1 : 0));
  return createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const revision = gitRevision();
  const verifiedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

  const criterionResults = [];
  let couldNotRun = false;
  let ver001;
  try {
    ver001 = await checkVer001();
    process.stdout.write('-- VER-001 --\n');
    for (const c of ver001.checks) process.stdout.write(`${c.status} ${c.name}: ${c.detail}\n`);
  } catch (e) {
    couldNotRun = true;
    process.stdout.write(`-- VER-001 --\nUNKNOWN ver-001-gate: could not run — ${e.message || e}\n`);
  }

  if (ver001) {
    const status = statusFor(ver001.checks);
    const failing = ver001.checks
      .filter((c) => c.status !== 'PASS')
      .map((c) => `${c.name}: ${c.detail}`);
    criterionResults.push({
      criterion_id: 'VER-001',
      status,
      checks: ver001.checks,
      targetsObserved: ver001.targetsObserved,
      failing_checks: failing,
      detail: {
        headVersion: ver001.headVersion,
        npmLatest: ver001.npmLatest,
        newestTag: ver001.tag,
        githubRelease: ver001.release,
        tarballVersion: ver001.tarballVersion,
      },
    });
  }

  const evidenceSha256 = criterionResults.length > 0 ? fingerprint(criterionResults) : null;

  const results = criterionResults
    .slice()
    .sort((a, b) => (a.criterion_id < b.criterion_id ? -1 : 1))
    .map((r) => ({
      criterion_id: r.criterion_id,
      status: r.status,
      command: 'bash scripts/ga/check-VER-001.sh',
      evidence_sha256: evidenceSha256,
      evidence_uri: EVIDENCE_URI,
      verified_at: verifiedAt,
      targets_observed: r.targetsObserved,
      failing_checks: r.failing_checks,
    }));

  const evidenceDoc = {
    spec_version: SPEC_VERSION,
    repository: REPOSITORY,
    revision,
    results: results.length > 0 ? results : [{
      criterion_id: 'VER-001',
      status: 'unknown',
      command: 'bash scripts/ga/check-VER-001.sh',
      evidence_sha256: createHash('sha256').update('ga-evidence:could-not-run').digest('hex'),
      evidence_uri: EVIDENCE_URI,
      verified_at: verifiedAt,
      failing_checks: ['ver-001-gate: producer could not run — see ga-report.json'],
    }],
  };

  const fullReport = {
    schema: 'wave-av-sdk-ga-evidence/1',
    spec_version: SPEC_VERSION,
    repository: REPOSITORY,
    revision,
    verified_at: verifiedAt,
    evidence_sha256: evidenceSha256,
    runner: { node: process.version, platform: process.platform },
    contract_001: {
      emitted: false,
      reason: 'No openapi/contract-hash/spec-revision pin found anywhere in the tree; '
        + 'capabilities.json names api-spec as a consumed product with no revision or hash. '
        + 'Emitting an evidence-less unknown would be noise, per the intake README’s own rule.',
    },
    criteria: criterionResults,
  };

  mkdirSync(args.outDir, { recursive: true });
  writeFileSync(join(args.outDir, 'ga-report.json'), `${JSON.stringify(fullReport, null, 2)}\n`);
  writeFileSync(join(args.outDir, 'wave-av__sdk.ga-evidence.json'), `${JSON.stringify(evidenceDoc, null, 2)}\n`);

  process.stdout.write(`${'-'.repeat(78)}\n`);
  for (const row of evidenceDoc.results) {
    process.stdout.write(`${row.criterion_id}: ${row.status.toUpperCase()}\n`);
  }
  process.stdout.write(`\nwrote ${join(args.outDir, 'ga-report.json')} and ${join(args.outDir, 'wave-av__sdk.ga-evidence.json')}\n`);

  if (couldNotRun) {
    process.exitCode = 2;
    return;
  }
  const anyFail = evidenceDoc.results.some((r) => r.status === 'fail');
  const anyUnknown = evidenceDoc.results.some((r) => r.status === 'unknown');
  if (anyFail) {
    process.stdout.write('\nGA EVIDENCE: at least one criterion FAILED\n');
    process.exitCode = 1;
  } else if (anyUnknown) {
    process.stdout.write('\nGA EVIDENCE: at least one criterion is UNKNOWN (not verified)\n');
    process.exitCode = 1;
  } else {
    process.stdout.write('\nGA EVIDENCE: all emitted criteria pass\n');
    process.exitCode = 0;
  }
}

main().catch((e) => {
  process.stderr.write(`ga-evidence could not run: ${e?.stack || e}\n`);
  process.exit(2);
});

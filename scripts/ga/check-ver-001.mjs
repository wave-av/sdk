#!/usr/bin/env node
/**
 * check-ver-001.mjs — VER-001 ("Version and release truth agree from source through
 * deployment") for @wave-av/sdk.
 *
 * Builds a small release ledger and checks that every entry agrees:
 *   - HEAD package.json version                 (this checkout, never trusted alone)
 *   - npm dist-tag `latest` for @wave-av/sdk     (public registry, no auth)
 *   - the newest v-prefixed (v* or sdk-v*) git tag on `origin` (git ls-remote, no tag checkout)
 *   - the GitHub release for that tag            (public REST API, no auth required)
 *   - the published tarball's package.json       (npm pack from the registry into a temp
 *                                                  dir — never the checkout)
 *
 * WHY NOT JUST DIFF PACKAGE.JSON AGAINST npm view: every artifact regression this gate
 * exists to catch was a case where the DECLARED version was fine and something else in the
 * chain (a missing release, an untagged publish, a stale tarball) disagreed. Each leg is
 * fetched independently and none is allowed to stand in for another.
 *
 * HEAD AHEAD OF LATEST: a release-in-progress PR legitimately bumps package.json before the
 * tag/release/publish happen. That is not a lie about what is deployed — it is unreleased
 * source — so it is reported UNKNOWN, never FAIL. HEAD BEHIND the shipped ledger (older
 * source claiming to be current) is the actual defect VER-001 exists to catch, and fails.
 *
 * EXIT CODES (this script; the .sh wrapper mirrors them)
 *   0  every check passed
 *   1  the gate ran and at least one check is FAIL or UNKNOWN (not fully verified — never a pass)
 *   2  the gate could not run at all (registry/API fetch failed, git/npm missing, bad JSON)
 *
 * TEST-ONLY OVERRIDE (never set by the real workflow): GA_TEST_PIN_HEAD_VERSION pins the
 * "HEAD version" used in the comparison to an arbitrary string instead of reading
 * package.json, so a deliberately wrong value can prove the gate actually fails when the
 * ledger disagrees, e.g.:
 *   GA_TEST_PIN_HEAD_VERSION=1.0.0 node scripts/ga/check-ver-001.mjs
 * flips `head-matches-shipped` to FAIL and the process exit code to 1.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compareSemver, newestTag, parseSemver, stripTagPrefix } from './lib/semver.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(HERE, '..', '..');
export const PACKAGE_NAME = '@wave-av/sdk';
export const GH_REPO = 'wave-av/sdk';
export const NPM_REGISTRY = 'https://registry.npmjs.org';
const FETCH_TIMEOUT_MS = 20_000;

function ok(name, detail) {
  return { name, ok: true, status: 'PASS', detail };
}
function fail(name, detail) {
  return { name, ok: false, status: 'FAIL', detail };
}
function unknown(name, detail) {
  return { name, ok: false, status: 'UNKNOWN', detail };
}

/** A tooling/read failure distinct from a verified FAIL — always exit 2, never exit 0/1. */
class CouldNotRun extends Error {}

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { encoding: 'utf8', timeout: FETCH_TIMEOUT_MS, ...opts });
}

function readHeadVersion() {
  if (process.env.GA_TEST_PIN_HEAD_VERSION) {
    return process.env.GA_TEST_PIN_HEAD_VERSION;
  }
  let pkg;
  try {
    pkg = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8'));
  } catch (e) {
    throw new CouldNotRun(`could not read/parse package.json at HEAD: ${e.message}`);
  }
  if (!pkg.version || !parseSemver(pkg.version)) {
    throw new CouldNotRun(`package.json version is missing or not semver: ${JSON.stringify(pkg.version)}`);
  }
  return pkg.version;
}

function npmViewLatest() {
  let out;
  try {
    out = run('npm', [
      'view', PACKAGE_NAME, 'dist-tags.latest', '--json',
      `--registry=${NPM_REGISTRY}`,
      `--@wave-av:registry=${NPM_REGISTRY}`,
    ]);
  } catch (e) {
    throw new CouldNotRun(`npm view dist-tags.latest failed: ${String(e.message || e).split('\n')[0]}`);
  }
  let version;
  try {
    version = JSON.parse(out.trim());
  } catch (e) {
    throw new CouldNotRun(`npm view returned non-JSON output: ${e.message}`);
  }
  if (typeof version !== 'string' || !parseSemver(version)) {
    throw new CouldNotRun(`npm dist-tag 'latest' is not a semver string: ${JSON.stringify(version)}`);
  }
  return version;
}

function gitNewestTag() {
  let out;
  try {
    out = run('git', ['ls-remote', '--tags', 'origin'], { cwd: REPO_ROOT });
  } catch (e) {
    throw new CouldNotRun(`git ls-remote --tags origin failed: ${String(e.message || e).split('\n')[0]}`);
  }
  const names = out
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.split('\t')[1])
    .filter((ref) => ref && ref.startsWith('refs/tags/') && !ref.endsWith('^{}'))
    .map((ref) => ref.slice('refs/tags/'.length));
  const found = newestTag(names);
  if (!found) throw new CouldNotRun('no semver-shaped tags found on origin');
  return found; // { tag, version }
}

async function fetchGithubRelease(tagName) {
  const url = `https://api.github.com/repos/${GH_REPO}/releases/tags/${encodeURIComponent(tagName)}`;
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'wave-av-sdk-ga-evidence' };
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let res;
  try {
    res = await fetch(url, { headers, signal: controller.signal });
  } catch (e) {
    throw new CouldNotRun(`GitHub releases API request failed: ${e.message}`);
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 404) {
    return { found: false };
  }
  if (!res.ok) {
    throw new CouldNotRun(`GitHub releases API returned HTTP ${res.status}`);
  }
  let body;
  try {
    body = await res.json();
  } catch (e) {
    throw new CouldNotRun(`GitHub releases API returned non-JSON body: ${e.message}`);
  }
  return { found: true, tagName: body.tag_name, draft: !!body.draft, prerelease: !!body.prerelease };
}

function npmPackVersion(pinnedVersion) {
  const spec = `${PACKAGE_NAME}@${pinnedVersion}`;
  const dir = mkdtempSync(join(tmpdir(), 'ga-ver001-pack-'));
  try {
    let filename;
    try {
      filename = run('npm', [
        'pack', spec, '--silent',
        `--registry=${NPM_REGISTRY}`,
        `--@wave-av:registry=${NPM_REGISTRY}`,
        `--pack-destination=${dir}`,
      ]).trim().split('\n').pop();
    } catch (e) {
      throw new CouldNotRun(`npm pack ${spec} failed: ${String(e.message || e).split('\n')[0]}`);
    }
    try {
      run('tar', ['-xzf', join(dir, filename), '-C', dir]);
    } catch (e) {
      throw new CouldNotRun(`could not extract packed tarball ${filename}: ${e.message}`);
    }
    let pkg;
    try {
      pkg = JSON.parse(readFileSync(join(dir, 'package', 'package.json'), 'utf8'));
    } catch (e) {
      throw new CouldNotRun(`could not read package.json inside packed tarball: ${e.message}`);
    }
    if (!pkg.version || !parseSemver(pkg.version)) {
      throw new CouldNotRun(`packed tarball package.json version is not semver: ${JSON.stringify(pkg.version)}`);
    }
    return pkg.version;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Runs every leg of the ledger and returns { checks, headVersion, shippedVersion,
 * targetsObserved }. Throws CouldNotRun if any leg could not be read at all — the caller
 * turns that into exit 2, distinct from a verified FAIL.
 */
export async function checkVer001() {
  const headVersion = readHeadVersion();
  const npmLatest = npmViewLatest();
  const tag = gitNewestTag();
  const release = await fetchGithubRelease(tag.tag);
  const tarballVersion = npmPackVersion(npmLatest);

  const checks = [];

  // Leg 1: newest tag agrees with the published dist-tag.
  if (tag.version === npmLatest) {
    checks.push(ok('tag-matches-npm-latest', `tag ${tag.tag} (${tag.version}) = npm latest ${npmLatest}`));
  } else {
    checks.push(fail('tag-matches-npm-latest', `newest tag ${tag.tag} (${tag.version}) != npm dist-tag latest ${npmLatest}`));
  }

  // Leg 2: a GitHub release exists for that tag.
  if (!release.found) {
    checks.push(fail('release-exists-for-tag', `no GitHub release found for tag ${tag.tag} (repo ${GH_REPO})`));
  } else if (release.tagName !== tag.tag) {
    // Should not happen (we queried by exact tag name) — defensive.
    checks.push(fail('release-exists-for-tag', `release lookup for ${tag.tag} returned tag_name ${release.tagName}`));
  } else if (release.draft) {
    checks.push(fail('release-exists-for-tag', `release for ${tag.tag} exists but is a draft, not published`));
  } else {
    checks.push(ok('release-exists-for-tag', `published GitHub release exists for tag ${tag.tag}`));
  }

  // Leg 3: the published tarball's own package.json agrees with the dist-tag it was
  // packed under.
  if (tarballVersion === npmLatest) {
    checks.push(ok('tarball-matches-npm-latest', `packed tarball package.json ${tarballVersion} = npm latest ${npmLatest}`));
  } else {
    checks.push(fail('tarball-matches-npm-latest', `packed tarball package.json ${tarballVersion} != npm dist-tag latest ${npmLatest}`));
  }

  // Leg 4: HEAD source vs. the shipped ledger. Ahead-by-a-bump is UNKNOWN
  // ("unreleased source"), not FAIL; behind or otherwise different is FAIL.
  if (headVersion === npmLatest) {
    checks.push(ok('head-matches-shipped', `HEAD package.json ${headVersion} = shipped ${npmLatest}`));
  } else if (compareSemver(headVersion, npmLatest) > 0) {
    checks.push(unknown(
      'head-matches-shipped',
      `HEAD package.json ${headVersion} is ahead of shipped ${npmLatest} — unreleased source (e.g. an in-flight release PR); cannot verify it matches deployment until it ships`,
    ));
  } else {
    checks.push(fail('head-matches-shipped', `HEAD package.json ${headVersion} disagrees with shipped ${npmLatest} (not an ahead-of-latest bump)`));
  }

  const targetsObserved = [...new Set([
    `${PACKAGE_NAME}@${headVersion}`,
    `${PACKAGE_NAME}@${npmLatest}`,
    `${PACKAGE_NAME}@${tarballVersion}`,
    `${PACKAGE_NAME}@${stripTagPrefix(tag.version)}`,
  ])].sort();

  return {
    checks,
    headVersion,
    npmLatest,
    tag,
    release,
    tarballVersion,
    targetsObserved,
  };
}

async function main() {
  let result;
  try {
    result = await checkVer001();
  } catch (e) {
    if (e instanceof CouldNotRun) {
      process.stdout.write(`UNKNOWN ver-001-gate: could not run — ${e.message}\n`);
      process.exit(2);
    }
    process.stdout.write(`UNKNOWN ver-001-gate: unexpected error — ${e.stack || e}\n`);
    process.exit(2);
    return;
  }
  for (const c of result.checks) {
    process.stdout.write(`${c.status} ${c.name}: ${c.detail}\n`);
  }
  const anyFail = result.checks.some((c) => c.status === 'FAIL');
  const anyUnknown = result.checks.some((c) => c.status === 'UNKNOWN');
  if (anyFail || anyUnknown) {
    process.exitCode = 1;
  } else {
    process.exitCode = 0;
  }
}

// Only run the CLI when this file is the entry point (ga-evidence.mjs imports checkVer001
// directly instead, so it does not fork a second npm/git/fetch round-trip).
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

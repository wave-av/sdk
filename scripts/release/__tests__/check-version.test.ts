import { describe, it, expect, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Regression test for the release.yml backfill bug (2026-09-06): a
 * `workflow_dispatch` backfill of a pre-#121 `sdk-v*` tag failed with
 * "scripts/release/check-version.sh: No such file or directory" because the
 * tag's checked-out tree predates this script. The fix relocates the script
 * itself to a separate "tooling" checkout (pinned to the workflow's own ref)
 * while the package it asserts against stays pinned to the tag's checkout —
 * which means this script can no longer assume its own directory sits next
 * to the package.json it's checking. `RELEASE_PKG_ROOT` is the seam that
 * makes that split possible; this test locks its contract down directly
 * against the real script (not a reimplementation), so a future edit that
 * silently reverts to the old dirname-relative-only ROOT cannot regress this.
 */
const SCRIPT = join(__dirname, '..', 'check-version.sh');

function run(args: string[], env: Record<string, string> = {}) {
  return execFileSync('bash', [SCRIPT, ...args], {
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

function runExpectFailure(args: string[], env: Record<string, string> = {}) {
  try {
    run(args, env);
    throw new Error('expected check-version.sh to exit non-zero, but it succeeded');
  } catch (e) {
    return e as { status: number; stderr: string; stdout: string };
  }
}

describe('check-version.sh', () => {
  const tmpDirs: string[] = [];
  afterEach(() => {
    while (tmpDirs.length) rmSync(tmpDirs.pop()!, { recursive: true, force: true });
  });

  it('defaults ROOT to its own repo (dirname-relative) when RELEASE_PKG_ROOT is unset — this repo is at 2.1.3', () => {
    const out = run(['sdk-v2.1.3']);
    expect(out).toMatch(/OK: tag version matches package\.json version \(2\.1\.3\)/);
  });

  it('rejects a tag/package.json mismatch against the default (in-tree) root', () => {
    const err = runExpectFailure(['sdk-v9.9.9']);
    expect(err.status).toBe(1);
    expect(err.stderr).toMatch(/tag sdk-v9\.9\.9 implies version 9\.9\.9 but package\.json is 2\.1\.3/);
  });

  it('RELEASE_PKG_ROOT overrides the dirname-relative default — the exact seam release.yml relies on when the script is checked out to .release-tooling, separate from the tag-pinned package.json it must assert against', () => {
    const root = mkdtempSync(join(tmpdir(), 'sdk-release-tooling-test-'));
    tmpDirs.push(root);
    writeFileSync(join(root, 'package.json'), JSON.stringify({ version: '3.4.5' }));

    // Would fail against THIS repo's real package.json (2.1.3) if the
    // override were ignored — proves RELEASE_PKG_ROOT, not the script's own
    // location, decides which package.json gets checked.
    const out = run(['sdk-v3.4.5'], { RELEASE_PKG_ROOT: root });
    expect(out).toMatch(/OK: tag version matches package\.json version \(3\.4\.5\)/);
  });

  it('still fails loud on mismatch when RELEASE_PKG_ROOT is set', () => {
    const root = mkdtempSync(join(tmpdir(), 'sdk-release-tooling-test-'));
    tmpDirs.push(root);
    writeFileSync(join(root, 'package.json'), JSON.stringify({ version: '3.4.5' }));

    const err = runExpectFailure(['sdk-v1.0.0'], { RELEASE_PKG_ROOT: root });
    expect(err.status).toBe(1);
    expect(err.stderr).toMatch(/tag sdk-v1\.0\.0 implies version 1\.0\.0 but package\.json is 3\.4\.5/);
  });

  it('still refuses a malformed tag before ever touching ROOT', () => {
    const err = runExpectFailure(['not-a-tag']);
    expect(err.status).toBe(1);
    expect(err.stderr).toMatch(/does not match the required 'sdk-v<semver>' pattern/);
  });
});

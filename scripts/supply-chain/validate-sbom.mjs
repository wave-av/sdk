#!/usr/bin/env node
/**
 * validate-sbom.mjs — fail closed on an SBOM that would be worse than none.
 *
 * An empty, malformed, or version-mismatched SBOM attached to a release is actively
 * harmful: the SUPPLY-001 verifier sees an asset whose name matches and counts the
 * artifact as covered, so a broken document launders a gap into a pass. This runs in the
 * release path, before upload, and refuses to let that happen.
 *
 * Checks:
 *   1. package.json version equals the version encoded in the release tag.
 *   2. The CycloneDX document really is CycloneDX, and its root component is THIS version.
 *   3. The SPDX document lists at least one package.
 *
 * Usage:  TAG=sdk-v2.1.3 node scripts/supply-chain/validate-sbom.mjs
 *         node scripts/supply-chain/validate-sbom.mjs --tag sdk-v2.1.3 --dir .
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';

/** Strip the repo's `sdk-v` (or bare `v`) tag prefix to get the semver. */
export function versionFromTag(tag) {
  if (typeof tag !== 'string' || tag.length === 0) throw new Error('no release tag supplied');
  const version = tag.replace(/^sdk-v/, '').replace(/^v/, '');
  if (!/^\d+\.\d+\.\d+/.test(version)) throw new Error(`cannot read a semver out of tag '${tag}'`);
  return version;
}

/**
 * Validate both SBOM documents against the version being released.
 * @param {{ tag: string, pkg: any, cyclonedx: any, spdx: any }} input
 * @returns {{ version: string, componentCount: number, spdxPackageCount: number, specVersion: string }}
 */
export function validateSboms({ tag, pkg, cyclonedx, spdx }) {
  const version = versionFromTag(tag);

  if (pkg?.version !== version) {
    throw new Error(`package.json version ${pkg?.version} does not match tag ${tag}`);
  }

  if (cyclonedx?.bomFormat !== 'CycloneDX') {
    throw new Error(`cyclonedx: bomFormat is ${JSON.stringify(cyclonedx?.bomFormat)}, expected "CycloneDX"`);
  }
  const rootVersion = cyclonedx?.metadata?.component?.version;
  if (rootVersion !== version) {
    throw new Error(`cyclonedx: root component version ${rootVersion} != ${version}`);
  }
  if (!Array.isArray(cyclonedx?.components)) {
    throw new Error('cyclonedx: document has no components array');
  }

  if (!Array.isArray(spdx?.packages) || spdx.packages.length === 0) {
    throw new Error('spdx: document lists no packages');
  }

  return {
    version,
    componentCount: cyclonedx.components.length,
    spdxPackageCount: spdx.packages.length,
    specVersion: cyclonedx.specVersion ?? 'unknown',
  };
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function main(argv) {
  const args = argv.slice(2);
  const tag = args.includes('--tag') ? args[args.indexOf('--tag') + 1] : process.env.TAG;
  const dir = args.includes('--dir') ? args[args.indexOf('--dir') + 1] : '.';
  const summary = validateSboms({
    tag,
    pkg: readJson(path.join(dir, 'package.json')),
    cyclonedx: readJson(path.join(dir, 'sbom.cyclonedx.json')),
    spdx: readJson(path.join(dir, 'sbom.spdx.json')),
  });
  process.stdout.write(
    `cyclonedx ${summary.specVersion}: ${summary.componentCount} runtime components; ` +
      `spdx: ${summary.spdxPackageCount} packages; root ${summary.version}\n`,
  );
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  try {
    main(process.argv);
  } catch (err) {
    process.stderr.write(`validate-sbom: ${err.message}\n`);
    process.exit(1);
  }
}

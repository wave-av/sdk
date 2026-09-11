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
 *   4. EVERY runtime dependency package.json declares (`dependencies` keys) appears in the
 *      SPDX document with a real versionInfo AND as a CycloneDX component, and the SPDX
 *      document carries a versioned entry for the package itself. Both SBOMs are generated
 *      from the INSTALLED tree (`npm ci` then `npm sbom --omit dev`); a document produced
 *      from an uninstalled checkout has one self-describing entry and zero dependencies,
 *      which check 3 alone would wave through. The floor is derived from package.json, never
 *      hardcoded, so it tracks dependency changes on its own. A package that declares no
 *      runtime dependencies is refused outright (a floor of 0 validates nothing).
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

const NO_VERSION = new Set(['', 'NOASSERTION']);

/** Sorted names of the runtime dependencies package.json declares (never devDependencies). */
export function declaredDependencies(pkg) {
  const deps = pkg && typeof pkg.dependencies === 'object' && pkg.dependencies !== null ? pkg.dependencies : {};
  return Object.keys(deps).sort();
}

/** Names of SPDX packages[] entries that carry a real versionInfo (not missing/empty/NOASSERTION). */
export function spdxVersionedNames(spdx) {
  const names = new Set();
  for (const p of Array.isArray(spdx?.packages) ? spdx.packages : []) {
    const version = typeof p?.versionInfo === 'string' ? p.versionInfo : '';
    if (typeof p?.name === 'string' && p.name && !NO_VERSION.has(version)) names.add(p.name);
  }
  return names;
}

/**
 * Names of CycloneDX components, from `name` when present or else from the purl
 * (`pkg:npm/%40scope%2Fname@1.2.3` -> `@scope/name`), since `npm sbom` emits both.
 */
export function cyclonedxComponentNames(cyclonedx) {
  const names = new Set();
  for (const c of Array.isArray(cyclonedx?.components) ? cyclonedx.components : []) {
    if (typeof c?.name === 'string' && c.name) names.add(c.name);
    const m = typeof c?.purl === 'string' ? /^pkg:npm\/(.+?)(?:@[^@]*)?(?:\?.*)?$/.exec(c.purl) : null;
    if (m) names.add(decodeURIComponent(m[1]));
  }
  return names;
}

/**
 * Validate both SBOM documents against the version being released.
 * @param {{ tag: string, pkg: any, cyclonedx: any, spdx: any }} input
 * @returns {{ version: string, componentCount: number, spdxPackageCount: number, specVersion: string, declaredDependencyCount: number }}
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

  // Every declared runtime dependency must actually be enumerated -- by name, with a real
  // version -- in BOTH documents. This is the check that distinguishes an SBOM generated
  // from the installed tree from one generated before install.
  const declared = declaredDependencies(pkg);
  if (declared.length === 0) {
    throw new Error(
      'package.json declares no runtime dependencies -- refusing to validate against a floor of 0',
    );
  }
  const spdxNames = spdxVersionedNames(spdx);
  if (typeof pkg?.name === 'string' && pkg.name && !spdxNames.has(pkg.name)) {
    throw new Error(`spdx: no versioned package entry for the package itself, ${pkg.name}@${version}`);
  }
  const missingSpdx = declared.filter((dep) => !spdxNames.has(dep));
  if (missingSpdx.length > 0) {
    throw new Error(
      `spdx: no versioned package entry for declared runtime dependency(ies): ${missingSpdx.join(', ')} ` +
        '-- the SBOM was likely generated from an uninstalled tree',
    );
  }
  const cdxNames = cyclonedxComponentNames(cyclonedx);
  const missingCdx = declared.filter((dep) => !cdxNames.has(dep));
  if (missingCdx.length > 0) {
    throw new Error(
      `cyclonedx: no component for declared runtime dependency(ies): ${missingCdx.join(', ')} ` +
        '-- the SBOM was likely generated from an uninstalled tree',
    );
  }

  return {
    version,
    componentCount: cyclonedx.components.length,
    spdxPackageCount: spdx.packages.length,
    specVersion: cyclonedx.specVersion ?? 'unknown',
    declaredDependencyCount: declared.length,
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
      `spdx: ${summary.spdxPackageCount} packages; root ${summary.version}; ` +
      `all ${summary.declaredDependencyCount} declared runtime dependencies enumerated in both\n`,
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

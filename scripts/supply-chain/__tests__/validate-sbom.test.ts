import { describe, it, expect } from 'vitest';
// @ts-expect-error -- plain ESM script, no type declarations by design
import { versionFromTag, validateSboms, cyclonedxComponentNames, spdxVersionedNames } from '../validate-sbom.mjs';

/**
 * The CycloneDX fixture mirrors the document `npm sbom --sbom-format cyclonedx --omit dev`
 * actually produced for @wave-av/sdk@2.1.3 on 2026-09-03 (CycloneDX 1.5, one runtime
 * component: eventemitter3 — the SDK's single production dependency). The SPDX fixture
 * likewise carries the versionInfo `npm sbom --sbom-format spdx` emits for each package.
 */
const CDX = {
  bomFormat: 'CycloneDX',
  specVersion: '1.5',
  metadata: { component: { name: '@wave-av/sdk', version: '2.1.3' } },
  components: [{ purl: 'pkg:npm/eventemitter3@5.0.4' }],
};
const SPDX = {
  packages: [
    { name: '@wave-av/sdk', versionInfo: '2.1.3' },
    { name: 'eventemitter3', versionInfo: '5.0.4' },
  ],
};
const PKG = { name: '@wave-av/sdk', version: '2.1.3', dependencies: { eventemitter3: '^5.0.4' } };

describe('versionFromTag', () => {
  it("strips this repo's sdk-v prefix and a bare v", () => {
    expect(versionFromTag('sdk-v2.1.3')).toBe('2.1.3');
    expect(versionFromTag('v1.0.15')).toBe('1.0.15');
    expect(versionFromTag('sdk-v2.1.0-next.4')).toBe('2.1.0-next.4');
  });

  it('refuses a tag with no semver in it, rather than guessing', () => {
    for (const bad of ['', 'latest', 'sdk-vNEXT', null, undefined]) {
      expect(() => versionFromTag(bad as never)).toThrow();
    }
  });
});

describe('validateSboms', () => {
  it('accepts the real 2.1.3 documents', () => {
    const s = validateSboms({ tag: 'sdk-v2.1.3', pkg: PKG, cyclonedx: CDX, spdx: SPDX });
    expect(s).toMatchObject({ version: '2.1.3', componentCount: 1, spdxPackageCount: 2, specVersion: '1.5' });
  });

  it('fails when the tag and package.json disagree — a stale tag must not ship an SBOM', () => {
    expect(() => validateSboms({ tag: 'sdk-v2.1.4', pkg: PKG, cyclonedx: CDX, spdx: SPDX })).toThrow(
      /package.json version 2.1.3 does not match tag sdk-v2.1.4/,
    );
  });

  it('fails when the CycloneDX root component describes a different version', () => {
    const stale = { ...CDX, metadata: { component: { name: '@wave-av/sdk', version: '2.1.0' } } };
    expect(() => validateSboms({ tag: 'sdk-v2.1.3', pkg: PKG, cyclonedx: stale, spdx: SPDX })).toThrow(
      /root component version 2.1.0 != 2.1.3/,
    );
  });

  it('rejects a document that is not CycloneDX at all', () => {
    expect(() =>
      validateSboms({ tag: 'sdk-v2.1.3', pkg: PKG, cyclonedx: { specVersion: '1.5' }, spdx: SPDX }),
    ).toThrow(/bomFormat/);
  });

  it('rejects an EMPTY SPDX document — the case that would launder a gap into a pass', () => {
    expect(() => validateSboms({ tag: 'sdk-v2.1.3', pkg: PKG, cyclonedx: CDX, spdx: { packages: [] } })).toThrow(
      /spdx: document lists no packages/,
    );
    expect(() => validateSboms({ tag: 'sdk-v2.1.3', pkg: PKG, cyclonedx: CDX, spdx: {} })).toThrow(
      /spdx: document lists no packages/,
    );
  });

  it('rejects a CycloneDX document with no components array', () => {
    const noComponents = { ...CDX, components: undefined };
    expect(() => validateSboms({ tag: 'sdk-v2.1.3', pkg: PKG, cyclonedx: noComponents, spdx: SPDX })).toThrow(
      /no components array/,
    );
  });

  // The install-before-scan regression: an SBOM produced from an uninstalled checkout has one
  // self-describing entry and none of the declared dependencies. "packages[] is non-empty"
  // accepted that; the per-name check below must not.
  it('fails when a declared runtime dependency is missing from the SPDX document', () => {
    const uninstalled = { packages: [{ name: '@wave-av/sdk', versionInfo: '2.1.3' }] };
    expect(() => validateSboms({ tag: 'sdk-v2.1.3', pkg: PKG, cyclonedx: CDX, spdx: uninstalled })).toThrow(
      /spdx: no versioned package entry for declared runtime dependency\(ies\): eventemitter3/,
    );
  });

  it('does not count an SPDX entry whose versionInfo is missing or NOASSERTION', () => {
    for (const bad of [{ name: 'eventemitter3' }, { name: 'eventemitter3', versionInfo: 'NOASSERTION' }]) {
      const spdx = { packages: [{ name: '@wave-av/sdk', versionInfo: '2.1.3' }, bad] };
      expect(() => validateSboms({ tag: 'sdk-v2.1.3', pkg: PKG, cyclonedx: CDX, spdx })).toThrow(
        /declared runtime dependency\(ies\): eventemitter3/,
      );
    }
  });

  it('fails when a declared runtime dependency is missing from the CycloneDX components', () => {
    const noDeps = { ...CDX, components: [] };
    expect(() => validateSboms({ tag: 'sdk-v2.1.3', pkg: PKG, cyclonedx: noDeps, spdx: SPDX })).toThrow(
      /cyclonedx: no component for declared runtime dependency\(ies\): eventemitter3/,
    );
  });

  it('fails when the SPDX document has no versioned entry for the package itself', () => {
    const noRoot = { packages: [{ name: 'eventemitter3', versionInfo: '5.0.4' }] };
    expect(() => validateSboms({ tag: 'sdk-v2.1.3', pkg: PKG, cyclonedx: CDX, spdx: noRoot })).toThrow(
      /no versioned package entry for the package itself, @wave-av\/sdk@2.1.3/,
    );
  });

  it('refuses a package.json that declares no runtime dependencies — a floor of 0 validates nothing', () => {
    const bare = { name: '@wave-av/sdk', version: '2.1.3' };
    expect(() => validateSboms({ tag: 'sdk-v2.1.3', pkg: bare, cyclonedx: CDX, spdx: SPDX })).toThrow(
      /declares no runtime dependencies/,
    );
  });

  it('reports the declared dependency count on success', () => {
    expect(validateSboms({ tag: 'sdk-v2.1.3', pkg: PKG, cyclonedx: CDX, spdx: SPDX })).toMatchObject({
      declaredDependencyCount: 1,
    });
  });
});

describe('name extraction helpers', () => {
  it('reads CycloneDX component names from `name` or a (possibly scoped, percent-encoded) npm purl', () => {
    const names = cyclonedxComponentNames({
      components: [
        { purl: 'pkg:npm/eventemitter3@5.0.4' },
        { purl: 'pkg:npm/%40wave-av/sdk@2.1.3' },
        { name: 'ws', purl: 'pkg:npm/ws@8.18.0?vcs_url=x' },
      ],
    });
    expect([...names].sort()).toEqual(['@wave-av/sdk', 'eventemitter3', 'ws']);
  });

  it('only counts SPDX packages that carry a real versionInfo', () => {
    const names = spdxVersionedNames({
      packages: [{ name: 'a', versionInfo: '1.0.0' }, { name: 'b' }, { name: 'c', versionInfo: 'NOASSERTION' }, { name: 'd', versionInfo: '' }],
    });
    expect([...names]).toEqual(['a']);
  });
});

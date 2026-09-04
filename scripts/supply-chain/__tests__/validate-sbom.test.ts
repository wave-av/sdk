import { describe, it, expect } from 'vitest';
// @ts-expect-error -- plain ESM script, no type declarations by design
import { versionFromTag, validateSboms } from '../validate-sbom.mjs';

/**
 * The CycloneDX fixture mirrors the document `npm sbom --sbom-format cyclonedx --omit dev`
 * actually produced for @wave-av/sdk@2.1.3 on 2026-09-03 (CycloneDX 1.5, one runtime
 * component: eventemitter3 — the SDK's single production dependency).
 */
const CDX = {
  bomFormat: 'CycloneDX',
  specVersion: '1.5',
  metadata: { component: { name: '@wave-av/sdk', version: '2.1.3' } },
  components: [{ purl: 'pkg:npm/eventemitter3@5.0.4' }],
};
const SPDX = { packages: [{ name: '@wave-av/sdk' }, { name: 'eventemitter3' }] };
const PKG = { version: '2.1.3' };

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
});

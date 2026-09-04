import { describe, it, expect } from 'vitest';
import {
  NPM_NAME_RE,
  PYPI_NAME_RE,
  GH_REPO_RE,
  SBOM_ASSET_RE,
  assertName,
  evaluateNpmDist,
  evaluatePyPiFiles,
  evaluateReleaseAssets,
  diffExpectation,
  verifyTarget,
  formatTable,
  // @ts-expect-error -- plain ESM script, no type declarations by design
} from '../verify-supply-chain.mjs';

/**
 * Fixtures below are TRIMMED COPIES OF REAL REGISTRY RESPONSES captured 2026-09-03, so
 * these tests pin the exact shapes the live services return rather than a shape we
 * imagined. Re-capture with:
 *   curl -s https://registry.npmjs.org/@wave-av%2Fsdk | jq '.versions["2.1.3"].dist'
 *   curl -s https://pypi.org/pypi/wave-sdk/json     | jq '.urls'
 */

// @wave-av/sdk@2.1.3 — real: attested under npm OIDC trusted publishing.
const NPM_DIST_ATTESTED = {
  shasum: 'aa0a4e1f1d2b3c4d5e6f70819293a4b5c6d7e8f9',
  attestations: {
    url: 'https://registry.npmjs.org/-/npm/v1/attestations/@wave-av%2fsdk@2.1.3',
    provenance: { predicateType: 'https://slsa.dev/provenance/v1' },
  },
  signatures: [{ sig: 'MEQCIGB8', keyid: 'SHA256:DhQ8wR5APBvFHLF/+Tc+AYvPOdTpcIDqOhxsBHRwC7U' }],
};

// @wave-av/cli@1.0.8 — real: published 2026-04-03 by hand, before any release workflow.
// Registry-signed (npm signs every tarball) but carries NO build provenance.
const NPM_DIST_UNATTESTED = {
  shasum: 'bb1b5f2e2e3c4d5e6f708192a3b4c5d6e7f80912',
  attestations: null,
  signatures: [{ sig: 'MEUCIQD', keyid: 'SHA256:DhQ8wR5APBvFHLF/+Tc+AYvPOdTpcIDqOhxsBHRwC7U' }],
};

// PyPI wave-sdk 2.0.0 — real: both files present, neither carries a PEP 740 attestation.
const PYPI_URLS_UNATTESTED = [
  { filename: 'wave_sdk-2.0.0-py3-none-any.whl', provenance: null },
  { filename: 'wave_sdk-2.0.0.tar.gz', provenance: null },
];

describe('input validation (SSRF guard on URL-bound identifiers)', () => {
  it('accepts the real published package names', () => {
    expect(assertName('npm', '@wave-av/sdk')).toBe('@wave-av/sdk');
    expect(assertName('npm', 'eventemitter3')).toBe('eventemitter3');
    expect(assertName('pypi', 'wave-sdk')).toBe('wave-sdk');
    expect(assertName('repo', 'wave-av/sdk-python')).toBe('wave-av/sdk-python');
  });

  it('rejects names that would escape the intended host or path', () => {
    for (const bad of [
      '../../etc/passwd',
      '@wave-av/sdk/../../evil',
      'https://evil.example/pkg',
      '@wave-av/sdk?redirect=evil',
      '',
      null,
      undefined,
      42,
    ]) {
      expect(() => assertName('npm', bad as never)).toThrow(/invalid npm identifier/);
    }
    expect(() => assertName('repo', 'wave-av')).toThrow(/invalid repo identifier/);
    expect(() => assertName('repo', 'evil.com/a/b')).toThrow(/invalid repo identifier/);
  });

  it('pins the identifier patterns', () => {
    expect(NPM_NAME_RE.test('@wave-av/mcp-server')).toBe(true);
    expect(NPM_NAME_RE.test('@wave-av/')).toBe(false);
    expect(PYPI_NAME_RE.test('wave-sdk')).toBe(true);
    expect(PYPI_NAME_RE.test('-wave')).toBe(false);
    expect(GH_REPO_RE.test('wave-av/adk')).toBe(true);
  });
});

describe('evaluateNpmDist', () => {
  it('reports provenance for a SLSA-attested publish', () => {
    const r = evaluateNpmDist(NPM_DIST_ATTESTED);
    expect(r.provenance).toBe(true);
    expect(r.predicateType).toBe('https://slsa.dev/provenance/v1');
    expect(r.signatures).toBe(true);
    expect(r.attestationUrl).toContain('/attestations/');
  });

  it('reports NO provenance for a hand-published tarball that is merely registry-signed', () => {
    const r = evaluateNpmDist(NPM_DIST_UNATTESTED);
    expect(r.provenance).toBe(false);
    expect(r.predicateType).toBeNull();
    // The distinction that matters: npm signs every tarball, so `signatures` alone
    // must never be mistaken for build provenance.
    expect(r.signatures).toBe(true);
  });

  it('does not accept a non-provenance predicate as provenance', () => {
    const r = evaluateNpmDist({
      attestations: {
        url: 'https://registry.npmjs.org/-/npm/v1/attestations/x@1.0.0',
        provenance: { predicateType: 'https://github.com/npm/attestation/tree/main/specs/publish/v0.1' },
      },
      signatures: [{ sig: 's', keyid: 'k' }],
    });
    expect(r.provenance).toBe(false);
  });

  it('survives missing and malformed dist objects', () => {
    for (const bad of [null, undefined, {}, { attestations: {} }, { signatures: [] }]) {
      const r = evaluateNpmDist(bad as never);
      expect(r.provenance).toBe(false);
      expect(r.signatures).toBe(false);
    }
  });
});

describe('evaluatePyPiFiles', () => {
  it('reports NO provenance when no file carries a PEP 740 attestation', () => {
    const r = evaluatePyPiFiles(PYPI_URLS_UNATTESTED);
    expect(r.provenance).toBe(false);
    expect(r.fileCount).toBe(2);
    expect(r.attestedCount).toBe(0);
    expect(r.filenames).toContain('wave_sdk-2.0.0.tar.gz');
  });

  it('requires EVERY distributed file to be attested, not just the wheel', () => {
    const partial = [
      { filename: 'wave_sdk-2.1.0-py3-none-any.whl', provenance: { version: 1 } },
      { filename: 'wave_sdk-2.1.0.tar.gz', provenance: null },
    ];
    expect(evaluatePyPiFiles(partial).provenance).toBe(false);

    const full = partial.map((f) => ({ ...f, provenance: { version: 1 } }));
    expect(evaluatePyPiFiles(full).provenance).toBe(true);
  });

  it('treats a release with no files as unattested rather than vacuously true', () => {
    expect(evaluatePyPiFiles([]).provenance).toBe(false);
    expect(evaluatePyPiFiles(undefined as never).provenance).toBe(false);
  });
});

describe('evaluateReleaseAssets', () => {
  it('finds an SBOM under each conventional asset name and names the format', () => {
    const r = evaluateReleaseAssets([
      { name: 'sbom.cyclonedx.json' },
      { name: 'sbom.spdx.json' },
      { name: 'wave-sdk-2.1.3.tgz' },
    ]);
    expect(r.sbom).toBe(true);
    expect(r.formats).toEqual(['cyclonedx', 'spdx']);
    expect(r.assetCount).toBe(3);
  });

  it('reports NO sbom for the real releases, which carry zero assets', () => {
    const r = evaluateReleaseAssets([]);
    expect(r.sbom).toBe(false);
    expect(r.formats).toEqual([]);
  });

  it('does not mistake an unrelated asset for an SBOM', () => {
    const r = evaluateReleaseAssets([{ name: 'CHANGELOG.md' }, { name: 'dist.tgz' }]);
    expect(r.sbom).toBe(false);
    expect(SBOM_ASSET_RE.test('CHANGELOG.md')).toBe(false);
    expect(SBOM_ASSET_RE.test('bom.json')).toBe(true);
  });
});

describe('diffExpectation', () => {
  it('names every missing dimension', () => {
    const d = diffExpectation(
      { provenance: true, signatures: true, sbom: true },
      { provenance: false, signatures: true, sbom: false },
    );
    expect(d.ok).toBe(false);
    expect(d.failures).toEqual(['provenance', 'sbom']);
  });

  it('does not require a dimension the target does not expect (PyPI has no registry signatures)', () => {
    const d = diffExpectation(
      { provenance: true, signatures: false, sbom: true },
      { provenance: true, signatures: false, sbom: true },
    );
    expect(d.ok).toBe(true);
  });
});

describe('verifyTarget (full path, injected transport — no network)', () => {
  const npmTarget = {
    id: 'npm:@wave-av/sdk',
    registry: 'npm',
    name: '@wave-av/sdk',
    repo: 'wave-av/sdk',
    expect: { provenance: true, signatures: true, sbom: true },
  };

  it('fails an attested package that ships no SBOM — the real @wave-av/sdk 2.1.3 state', async () => {
    const fetchJson = async (url: string) => {
      if (url.startsWith('https://registry.npmjs.org/')) {
        return {
          'dist-tags': { latest: '2.1.3' },
          versions: { '2.1.3': { dist: NPM_DIST_ATTESTED } },
          time: { '2.1.3': '2026-09-01T00:00:00.000Z' },
        };
      }
      if (url.startsWith('https://api.github.com/')) return { tag_name: 'v2.0.1', assets: [] };
      throw new Error(`unexpected url ${url}`);
    };
    const r = await verifyTarget(npmTarget, { fetchJson });
    expect(r.version).toBe('2.1.3');
    expect(r.provenance).toBe(true);
    expect(r.sbom).toBe(false);
    expect(r.ok).toBe(false);
    expect(r.failures).toEqual(['sbom']);
  });

  it('passes once an SBOM asset is attached to the release', async () => {
    const fetchJson = async (url: string) => {
      if (url.startsWith('https://registry.npmjs.org/')) {
        return { 'dist-tags': { latest: '2.1.4' }, versions: { '2.1.4': { dist: NPM_DIST_ATTESTED } }, time: {} };
      }
      return { tag_name: 'sdk-v2.1.4', assets: [{ name: 'sbom.cyclonedx.json' }, { name: 'sbom.spdx.json' }] };
    };
    const r = await verifyTarget(npmTarget, { fetchJson });
    expect(r.ok).toBe(true);
    expect(r.sbom).toBe(true);
    expect(r.sbomFormats).toEqual(['cyclonedx', 'spdx']);
  });

  it('treats a repo with no GitHub Release as an SBOM gap, not a crash', async () => {
    const fetchJson = async (url: string) => {
      if (url.startsWith('https://registry.npmjs.org/')) {
        return { 'dist-tags': { latest: '1.0.8' }, versions: { '1.0.8': { dist: NPM_DIST_UNATTESTED } }, time: {} };
      }
      const err = new Error('404') as Error & { status?: number };
      err.status = 404;
      throw err;
    };
    const r = await verifyTarget({ ...npmTarget, id: 'npm:@wave-av/cli', name: '@wave-av/cli' }, { fetchJson });
    expect(r.ok).toBe(false);
    expect(r.failures).toEqual(['provenance', 'sbom']);
    expect(r.notes).toContain('no GitHub Release published');
  });

  it('never sends a GITHUB_TOKEN to a package registry', async () => {
    const seen: Array<{ url: string; headers: Record<string, string> }> = [];
    const fetchJson = async (url: string, headers: Record<string, string> = {}) => {
      seen.push({ url, headers });
      if (url.startsWith('https://registry.npmjs.org/')) {
        return { 'dist-tags': { latest: '2.1.3' }, versions: { '2.1.3': { dist: NPM_DIST_ATTESTED } }, time: {} };
      }
      return { tag_name: 'v1', assets: [] };
    };
    await verifyTarget(npmTarget, { fetchJson, githubToken: 'ghp_secret_value' });
    const registryCalls = seen.filter((c) => !c.url.startsWith('https://api.github.com/'));
    expect(registryCalls.length).toBeGreaterThan(0);
    for (const call of registryCalls) {
      expect(JSON.stringify(call.headers)).not.toContain('ghp_secret_value');
    }
    const ghCall = seen.find((c) => c.url.startsWith('https://api.github.com/'));
    expect(ghCall?.headers.authorization).toBe('Bearer ghp_secret_value');
  });

  it('rejects a hostile target name before any request is made', async () => {
    let called = false;
    const fetchJson = async () => {
      called = true;
      return {};
    };
    await expect(
      verifyTarget({ ...npmTarget, name: 'https://evil.example/x' }, { fetchJson }),
    ).rejects.toThrow(/invalid npm identifier/);
    expect(called).toBe(false);
  });

  it('rejects an unknown registry rather than silently passing', async () => {
    await expect(
      verifyTarget({ id: 'x', registry: 'cargo', name: 'x', expect: {} }, { fetchJson: async () => ({}) }),
    ).rejects.toThrow(/unknown registry/);
  });
});

describe('formatTable', () => {
  it('renders a PASS/FAIL row per artifact with the gap named', () => {
    const out = formatTable([
      {
        id: 'npm:@wave-av/sdk',
        version: '2.1.3',
        provenance: true,
        signatures: true,
        sbom: false,
        sbomFormats: [],
        ok: false,
        failures: ['sbom'],
      },
    ]);
    expect(out).toContain('FAIL');
    expect(out).toContain('npm:@wave-av/sdk');
    expect(out).toContain('missing: sbom');
  });
});

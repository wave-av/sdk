import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
// @ts-expect-error -- plain ESM script, no type declarations by design
import { checkDescription, checkRepo } from '../check-package-description-maturity.mjs';

/** The description main carried on 2026-11-12 (package.json at sdk 2.1.3). */
const MAIN_2026_11_12 =
  'Official WAVE SDK - 35 API modules covering streaming, production, device management, analytics, content, monetization, and more';

describe('checkDescription', () => {
  it('fails the unqualified "Official" description main carries today', () => {
    expect(checkDescription(MAIN_2026_11_12)).toMatchObject({ verdict: 'FAIL' });
  });

  it('passes the same claim once it carries a maturity qualifier', () => {
    for (const q of ['(private preview)', '(beta)', '- early access', '(alpha)', 'Not yet GA.']) {
      expect(checkDescription(`Official WAVE SDK ${q} - TypeScript client`)).toMatchObject({ verdict: 'PASS' });
    }
  });

  it('fails other maturity claims with no qualifier', () => {
    for (const d of [
      'Production-ready TypeScript client for WAVE',
      'Generally available WAVE client',
      'WAVE SDK, now GA',
      'Enterprise-grade streaming SDK',
    ]) {
      expect(checkDescription(d)).toMatchObject({ verdict: 'FAIL' });
    }
  });

  it('does not read "not yet GA" itself as a GA claim', () => {
    expect(checkDescription('WAVE SDK for TypeScript. Not yet GA.')).toMatchObject({ verdict: 'PASS' });
  });

  it('passes a plain description that claims nothing', () => {
    expect(checkDescription('TypeScript client for WAVE streaming and production')).toMatchObject({
      verdict: 'PASS',
    });
  });

  it('matches whole words only', () => {
    // "officially" and "GAP" are not claims.
    expect(checkDescription('Closes the GAP between streams, officially documented')).toMatchObject({
      verdict: 'PASS',
    });
  });

  it('reports UNKNOWN, never PASS, when there is no description', () => {
    for (const d of [undefined, null, '', '   ', 42]) {
      expect(checkDescription(d as never)).toMatchObject({ verdict: 'UNKNOWN' });
    }
  });
});

describe('checkRepo', () => {
  const withRepo = (files: Record<string, string>, fn: (dir: string) => void) => {
    const dir = mkdtempSync(path.join(tmpdir(), 'maturity-'));
    try {
      for (const [name, body] of Object.entries(files)) writeFileSync(path.join(dir, name), body);
      fn(dir);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  };

  it('exits 1 when package.json overclaims', () => {
    withRepo({ 'package.json': JSON.stringify({ description: MAIN_2026_11_12 }) }, (dir) => {
      expect(checkRepo(dir).exitCode).toBe(1);
    });
  });

  it('exits 0 when every description is qualified or claims nothing', () => {
    withRepo(
      {
        'package.json': JSON.stringify({ description: 'Official WAVE SDK (private preview)' }),
        'plugin.json': JSON.stringify({ description: 'WAVE Runtime: one runtime underneath any harness' }),
      },
      (dir) => {
        expect(checkRepo(dir)).toMatchObject({ exitCode: 0 });
      },
    );
  });

  it('checks plugin.json too', () => {
    withRepo(
      {
        'package.json': JSON.stringify({ description: 'WAVE SDK (beta)' }),
        'plugin.json': JSON.stringify({ description: 'Production-ready WAVE runtime' }),
      },
      (dir) => {
        const r = checkRepo(dir);
        expect(r.exitCode).toBe(1);
        expect(r.results.find((x: { file: string }) => x.file === 'plugin.json')).toMatchObject({ verdict: 'FAIL' });
      },
    );
  });

  it('exits 1 with UNKNOWN when package.json is missing', () => {
    withRepo({}, (dir) => {
      expect(checkRepo(dir)).toMatchObject({ exitCode: 1, results: [{ file: 'package.json', verdict: 'UNKNOWN' }] });
    });
  });

  it('exits 2 on invalid JSON rather than passing', () => {
    withRepo({ 'package.json': '{not json' }, (dir) => {
      expect(checkRepo(dir).exitCode).toBe(2);
    });
  });
});

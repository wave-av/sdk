import { describe, expect, it } from 'vitest';
import { stripTrailingSlashes } from '../url-util';

describe('stripTrailingSlashes', () => {
  it('removes one or many trailing slashes', () => {
    expect(stripTrailingSlashes('https://api.wave.online/')).toBe('https://api.wave.online');
    expect(stripTrailingSlashes('https://api.wave.online///')).toBe('https://api.wave.online');
  });

  it('leaves inputs without a trailing slash untouched (same reference)', () => {
    const s = 'wss://rt.wave.online/v1';
    expect(stripTrailingSlashes(s)).toBe(s);
  });

  it('handles empty and all-slash inputs', () => {
    expect(stripTrailingSlashes('')).toBe('');
    expect(stripTrailingSlashes('////')).toBe('');
  });

  it('stays linear on the pathological shape the regex was flagged for', () => {
    const hostile = '/'.repeat(200_000) + 'x';
    const t0 = performance.now();
    expect(stripTrailingSlashes(hostile)).toBe(hostile);
    expect(performance.now() - t0).toBeLessThan(200);
  });
});

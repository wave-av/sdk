/**
 * semver.mjs — tiny stdlib-only semver parse/compare, enough for VER-001's needs.
 *
 * Not a full semver implementation (no build-metadata handling beyond stripping it, no
 * range matching). It exists so ga-evidence.mjs never needs an npm dependency to answer
 * "is version A newer than version B" and "which of these tag names is the newest release".
 */

const SEMVER_RE = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$/;

/** Parse a semver-ish string. Returns null if it does not look like one. */
export function parseSemver(raw) {
  if (typeof raw !== 'string') return null;
  const m = SEMVER_RE.exec(raw.trim());
  if (!m) return null;
  return {
    major: Number(m[1]),
    minor: Number(m[2]),
    patch: Number(m[3]),
    prerelease: m[4] ? m[4].split('.') : [],
    raw: raw.trim(),
  };
}

function comparePrereleaseIdentifier(a, b) {
  const aNum = /^\d+$/.test(a);
  const bNum = /^\d+$/.test(b);
  if (aNum && bNum) return Number(a) - Number(b);
  if (aNum) return -1; // numeric identifiers have lower precedence than alphanumeric
  if (bNum) return 1;
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Standard semver precedence: compare major.minor.patch, then prerelease identifiers
 * left-to-right; a version WITHOUT a prerelease has higher precedence than one with,
 * given equal major.minor.patch.
 */
export function compareSemver(a, b) {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) throw new Error(`compareSemver: not a semver string (${JSON.stringify(a)}, ${JSON.stringify(b)})`);
  if (pa.major !== pb.major) return pa.major - pb.major;
  if (pa.minor !== pb.minor) return pa.minor - pb.minor;
  if (pa.patch !== pb.patch) return pa.patch - pb.patch;
  if (pa.prerelease.length === 0 && pb.prerelease.length === 0) return 0;
  if (pa.prerelease.length === 0) return 1; // a is a release, b is a prerelease -> a wins
  if (pb.prerelease.length === 0) return -1;
  const len = Math.max(pa.prerelease.length, pb.prerelease.length);
  for (let i = 0; i < len; i += 1) {
    if (pa.prerelease[i] === undefined) return -1;
    if (pb.prerelease[i] === undefined) return 1;
    const c = comparePrereleaseIdentifier(pa.prerelease[i], pb.prerelease[i]);
    if (c !== 0) return c;
  }
  return 0;
}

/** Strip a leading tag prefix such as "sdk-v" or "v" down to a bare semver string. */
export function stripTagPrefix(tagName) {
  return tagName.replace(/^(?:[a-zA-Z][a-zA-Z0-9_-]*-)?v/, '');
}

/** Given a list of git tag names (any mix of "sdk-vX.Y.Z" / "vX.Y.Z"), return the one
 * with the highest semver precedence, or null if none parse. */
export function newestTag(tagNames) {
  let best = null;
  let bestVersion = null;
  for (const name of tagNames) {
    const version = stripTagPrefix(name);
    if (!parseSemver(version)) continue;
    if (best === null || compareSemver(version, bestVersion) > 0) {
      best = name;
      bestVersion = version;
    }
  }
  return best === null ? null : { tag: best, version: bestVersion };
}

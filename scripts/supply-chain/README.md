# Supply-chain verification (SUPPLY-001)

> **SUPPLY-001** — provenance and SBOM on every published artifact.

Two things have to be true of everything WAVE publishes:

1. **Provenance** — the artifact carries a signed attestation binding it to the source
   commit and the workflow that built it (npm: a SLSA provenance predicate minted by
   `npm publish --provenance` under OIDC trusted publishing; PyPI: a PEP 740 attestation).
2. **SBOM** — a machine-readable bill of materials for the dependency tree the artifact was
   built from, published as an asset on the corresponding GitHub Release.

## Verify a published artifact

`verify-supply-chain.mjs` reads the **live registries**, not the repo. This distinction is
the whole point: a workflow containing `--provenance` proves nothing about what is already
on npm, because every version published before that workflow landed still has no
attestation. Zero dependencies, no build step.

```bash
node scripts/supply-chain/verify-supply-chain.mjs            # all targets, human table
node scripts/supply-chain/verify-supply-chain.mjs --json     # machine receipt
node scripts/supply-chain/verify-supply-chain.mjs --target npm:@wave-av/sdk
```

Exit `0` when every target meets the expectation declared in `targets.json`, `1` when any
artifact is below the bar, `2` on a harness error. It is a gate, not a report.

Network access is unauthenticated `GET` to `registry.npmjs.org`, `pypi.org` and
`api.github.com`. `GITHUB_TOKEN`, if set, is sent **only** to `api.github.com`, purely to
lift the 60-request/hour anonymous rate limit; no token is ever sent to a package registry.

### Measured 2026-09-03

```
      ARTIFACT                 VERSION  PROVENANCE  SIGNED  SBOM  GAP
----  -----------------------  -------  ----------  ------  ----  -------------------------
FAIL  npm:@wave-av/sdk         2.1.3    yes         yes     NO    missing: sbom
FAIL  npm:@wave-av/cli         1.0.8    NO          yes     NO    missing: provenance, sbom
FAIL  npm:@wave-av/mcp-server  0.2.0    yes         yes     NO    missing: sbom
FAIL  npm:@wave-av/adk         1.0.15   yes         yes     NO    missing: sbom
FAIL  pypi:wave-sdk            2.0.0    NO          NO      NO    missing: provenance, sbom
```

Reading of that run:

- **Provenance is real on three of five.** sdk, mcp-server and adk are genuinely attested.
- **The two `NO`s are historical, not workflow defects.** `@wave-av/cli@1.0.8` was published
  2026-04-03 by hand; its `release.yml` (with `--provenance`) landed 2026-09-03. PyPI
  `wave-sdk 2.0.0` was published 2026-04-03; `sdk-python`'s OIDC `release.yml` landed the
  same day. Both are fixed by the next tagged release, not by a code change.
- **No artifact anywhere carries an SBOM** — including in the two repos whose
  `PROVENANCE.md` declares `sbom: cyclonedx`. That claim had no backing until `sbom.yml`.

Re-run the command to replace this table; it is a dated measurement, not a standing claim.

## Generating the SBOM

`.github/workflows/sbom.yml` runs on `release: published` and generates both documents from
the real installed tree using npm's native `npm sbom` (npm >= 10.4) — no third-party
scanner to pin or trust:

```bash
npm ci
npm sbom --sbom-format cyclonedx --omit dev > sbom.cyclonedx.json
npm sbom --sbom-format spdx      --omit dev > sbom.spdx.json
node scripts/supply-chain/validate-sbom.mjs     # TAG=sdk-v<semver>
```

`npm sbom` refuses to run against an incomplete tree, so a drifted lockfile fails the job
rather than emitting a bill of materials that silently omits packages.

`validate-sbom.mjs` then fails closed on a document that would be **worse than none** — an
empty or version-mismatched SBOM whose filename still matches, which would make the
verifier above count the artifact as covered and launder a gap into a pass.

Backfill an existing release without cutting a version:

```bash
gh workflow run sbom.yml --repo wave-av/sdk -f tag=v2.0.1
```

Two facts about the trigger worth knowing, both measured rather than assumed:

- **No workflow in this repo creates a GitHub Release.** `release.yml` publishes to npm off a
  `sdk-v*` tag and stops; the Releases that exist were cut by hand. `release: published`
  therefore fires only on a manual publish, which makes `workflow_dispatch` the load-bearing
  path today — and means an SBOM cannot appear on a release nobody created.
- **Both tag conventions are live.** `release.yml` triggers on `sdk-v*`, but every Release cut
  so far is named `v*` (latest `v2.0.1`). The workflow accepts either and refuses anything
  else before the value reaches `git` or `gh`.

## Tests

```bash
npx vitest run scripts/supply-chain
```

The fixtures are trimmed copies of real registry responses captured 2026-09-03, so the
tests pin the shapes the live services actually return rather than shapes we imagined.

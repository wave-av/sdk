# Package description maturity check

`scripts/check-package-description-maturity.sh --ci` fails when `package.json` or
`plugin.json` describes the package as official, GA, production-ready or
enterprise-grade without a maturity qualifier such as "private preview" or "beta".
WAVE is pre-GA, and the registry description is the first thing a developer reads
(WAVE-24383).

| Exit | Meaning |
|---|---|
| 0 | every description passed |
| 1 | a description is FAIL, or UNKNOWN (missing) |
| 2 | the check could not run (unreadable JSON) |

Tests: `npx vitest run scripts/maturity`.

## Current result on main

`package.json` fails today ("Official WAVE SDK - ..." with no qualifier). The
description fix is WAVE-36520. Until it lands, the check against the real
package.json is not wired into `npm test`; the unit tests (fixtures only) are.

## Buildkite

This repo has no Buildkite pipeline yet. In wave-ci `repos.yaml`, wave-av/sdk is
`pipeline: blocked-until-jake-ok`. Once the node-lib pipeline is enabled and the
description is fixed, add the check as a wave-ci `extra_steps` entry whose
`script` is `scripts/check-package-description-maturity.sh` (agents run with
`no-command-eval`, so the step must name a repo script, and that file needs its
executable bit set in git).

No GitHub Actions workflow is added for this check.

# sdk on Buildkite (shadow mode)

This directory ports this repository's GitHub Actions CI to Buildkite (wave-ci migration issue #55).
Steps run on self-hosted agents, each inside a disposable, isolated guest VM.

**Nothing under `.github/` changes.** The GH workflows stay the gate until the Buildkite pipeline has
been green for 7 consecutive days; swapping the required checks is a separate, operator-gated change.
No Buildkite pipeline exists for this repository yet, and this PR does not create one.

## Fork pull requests never build here

This repository is public, so anyone can open a pull request from a fork. **A fork PR never runs on
these agents.** That rests on one pipeline setting, backed by two more checks:

1. **Pipeline setting `build_pull_request_forks: false` (the boundary).** Buildkite never starts a build
   for a fork PR, so no fork-controlled file (including `.buildkite/wave-ci.sh` itself) ever executes.
   The wave-ci pipeline wrapper sends this setting explicitly and re-verifies it after every write; it
   must stay `false` for this pipeline. The wave-ci approved-fork path (a `ci:approved` label) must not
   be enabled for this pipeline either. (The wrapper refuses public repositories today, so it needs a
   reviewed change before it can create this pipeline at all.)
2. **Render refusal.** `wave-ci.json` declares `"visibility": "public"`. The renderer treats any PR whose
   head repository is not `wave-av/sdk` as a fork (unknown counts as a fork) and refuses to render it
   without the approval label.
3. **Every repo script refuses a fork PR** (`bk_refuse_fork_pr` in `scripts/lib/common.sh`). This only
   guards against a misconfigured pipeline: a fork could edit the script, which is why (1) is the boundary.

No step holds a secret, so a same-repository PR build has nothing to leak either.
`bk_refuse_credentials` ends any step whose environment carries a credential.

## Layout

| path | role |
|---|---|
| `pipeline.yml` | The wave-ci thin uploader, byte-identical to the wave-ci repo-kit copy. Its one step runs `wave-ci.sh` with `WAVE_JOB_ACTION=upload`, which renders the pipeline from `wave-ci.json`, caps-lints it with the host's read-only linter, and only then uploads it. Do not edit it. |
| `wave-ci.sh` | The fixed wave-ci shim, byte-identical to the repo-kit copy, mode 755. It accepts only a full 40-hex `wave_ci` pin and, inside a job, runs only the image's verified wave-ci checkout. Do not edit it. |
| `wave-ci.json` | The settings: template `node-lib`, `visibility: public`, node 24, the `lint` / `typecheck` / `test` built-ins, six `extra_steps`, one `schedules` entry. Pinned to wave-ci main `296cc0cf4faf1f06d0acd4c2a767d6c111d2adf3`. |
| `wave-ci.deferred.json` | NOT rendered. Every parked job, with its reason and blocker, plus the parked schedule. |
| `scripts/<step>.sh` | The checked-in scripts the `extra_steps` run. `command:` is only ever a script path (agents run with no-command-eval). |
| `scripts/lib/common.sh` | Strict mode, the fork and credential refusals, toolchain selection from the image's mise (never a download), a deterministic public-registry `npm ci`, the gate runner. |

This branch replaces the hand-written shadow pipeline that PR #152 first opened (`.buildkite/steps/*`,
`.buildkite/lib/common.sh`) with the templated form. The three checks it ported keep their step keys
(`gate-checks`, `gate-skill-validate`, `secrets-content-policy`). Its refusal of a secrets-manager CLI
binary on PATH is replaced by the credential-variable refusal: the guest image ships such binaries
without any token, so the binary check would fail every build.

## Parity: every GitHub workflow job

13 workflow files, 21 jobs. Ported: 8 jobs, as 9 steps and 1 schedule. Parked: 13 jobs, plus two
secret-bearing legs of ported jobs. Every parked item is recorded in `wave-ci.deferred.json`.

| workflow | job | Buildkite | notes |
|---|---|---|---|
| `_checks.yml` (via `foundation-gate.yml`) | `checks` | `gate-checks` | secret scan + file-size gate (max 800). Prints `path:line` only, never the matched line |
| `_checks.yml` | `skill-validate` | `gate-skill-validate` | python 3.14 from the image; PyYAML is baked (pinned-wheel fallback in a job venv) |
| `_checks.yml` | `verify-routes` | `gate-checks` | URL-convention gate; a no-op today (no `wrangler.toml`) |
| `foundation-gate.yml` | `gate` | the three rows above | its `merge_group` trigger is parked (no Buildkite merge queue) |
| `lint.yml` | `lint` | `lint`, `typecheck`, `test` | wave-ci built-ins on node 24: `npm run lint`, `npm run type-check`; the CAP-001 capabilities test runs inside `test` (`vitest run`, the full suite) |
| `smoke-install.yml` | `smoke` (node 20) | `smoke-install-node-20` | build, pack, fresh install, ESM + CJS checks |
| `smoke-install.yml` | `smoke` (node 22) | `smoke-install-node-22` | same. The live-gateway quickstart leg is parked (needs `WAVE_GATEWAY_API_KEY`) |
| `ga-evidence.yml` | `ga-evidence` | `ga-evidence` + schedule `ga-evidence-daily` (`31 9 * * *`) | same exit contract (exit 1 is a warning on PRs only); `ga-out/**` is a step artifact |
| `public-repo-guard.yml` | `guard` | `secrets-content-policy` | gitleaks 8.30.1 (image binary, version checked), content-policy.sh, body-policy fixtures. The private-repo-name rule is parked (needs `GUARD_PRIVATE_REPOS`) |
| `public-repo-guard.yml` | `body-guard` | parked | scans PR/issue/comment/review TEXT from the GitHub event; waits on the GitHub-event bridge (RUN-231, wave-ci #132) |
| `governance-enforce.yml` | `enforce` | parked | installs `@wave-av/governance` from GitHub Packages (E403, billing); waits on the self-hosted registry (ruling WGL-0928-18) and a read credential |
| `release-drift.yml` | `drift-check` | parked, with its schedule (`17 6 * * *`) | `gh release view` needs a GitHub token; no secret is allowlisted for a public repo |
| `release.yml` | `resolve-ref`, `secret-scan`, `verify`, `publish`, `release`, `sbom` | parked | tag-triggered npm publish + GitHub Release. Publishing is deploy-class and waits for Jake to name it (ruling WGL-0928-00 allows public SDK publishing; not enabled now). Its checks already run on every build: `secret-scan` = `secrets-content-policy`; `verify` = `lint` + `typecheck` + `test` + `smoke-install-*` |
| `sbom.yml` | `sbom` | parked | release-event SBOM upload to a GitHub Release (contents: write) |
| `auto-merge.yml` | `auto-merge` | parked | event bot (labels, check_suite) with a GitHub App key; waits on the event bridge |
| `pr-agent.yml` | `pr_agent` | parked | event bot (PR + comment events) with an LLM key; waits on the event bridge |
| `issue-ops-triage.yml` | `triage` | parked | event bot (issues) with a PAT + App key; waits on the event bridge |

## Differences from GH, on purpose

- **Toolchains come from the guest image, never a download.** Node 20/22/24 and python 3.14 resolve
  through the image's mise (`mise where`, from `/`, repo config files ignored) and must sit under the
  image's root-owned installs. gitleaks and ripgrep are the image's pinned binaries.
- **No path filters.** No ported workflow has `on.paths`, so no step has `paths`.
- **Triggers.** Buildkite builds `main` pushes and same-repository PRs. `ga-evidence` therefore also
  runs on `main` pushes (GH: PRs and the schedule only), a strict superset. The `master` and `staging`
  push triggers are dropped (neither branch exists). `workflow_dispatch` becomes a manual build of `main`.
- **One run reports every failure.** A script runs all of its gates and summarises, where GH stopped at
  the first failing step.
- **Secret-scan output.** `gate-checks` prints `path:line` for a hit, never the line (the GH step
  prints the full line into a public log).

## Guest-image prerequisites

- linux x86_64; node 24 (default) plus node 20 and 22 in the image's mise; python 3.14 in mise, with
  PyYAML; gitleaks 8.30.1; ripgrep with PCRE2; `git`, `bash`, `grep`, `sed`, `cut`, `sort`, `tr`, `wc`.
- Egress: `registry.npmjs.org` (installs and the fresh-install smoke), `github.com` (`ga-evidence` runs
  `git ls-remote --tags origin`), `api.github.com` (anonymous release lookup), and PyPI only if PyYAML
  is missing from the image.

## Credentials

None. No step declares a secret, so every step runs on the no-secrets queue and
`wave-ci-render.mjs --allowlist-rows` prints no row. The parked legs that would need one are listed in
`wave-ci.deferred.json` for a decision; each would be a `main_only` step.

## Caps

caps-lint passes on the uploader and on every render (PR, main, schedule): 9 steps, at most 27
worst-case jobs, one file. Every step sets `agents.queue`, `timeout_in_minutes` (5 to 15) and the
agent-loss-only retry; no plugins, no secret values, no `cancel_on_build_failing`.

## Run locally

```sh
node <wave-ci>/bin/wave-ci-render.mjs --settings .buildkite/wave-ci.json --context <ctx.json> --out-dir <dir>
node <wave-ci>/tools/caps-lint/bin/caps-lint.mjs --warnings-as-errors <dir>/part-1.yml
node <wave-ci>/tools/caps-lint/bin/caps-lint.mjs --warnings-as-errors .buildkite
.buildkite/scripts/gate-checks.sh            # no install, no network
.buildkite/scripts/secrets-content-policy.sh # needs gitleaks 8.30.1 and rg on PATH
```

Steps that select a toolchain need the image's mise layout. Off the image, point
`BK_TEST_MISE_INSTALLS` at a tree of `<tool>/<version>/bin` directories and put a `mise` on PATH whose
`mise where <tool>@<version>` prints the matching directory (the override is ignored inside any
Buildkite job). Run every script with a clean environment: each refuses to start when a credential variable is set.

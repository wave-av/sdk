# sdk on Buildkite (shadow mode)

This directory ports this repository's GitHub Actions CI to Buildkite. Steps run on self-hosted
agents, each inside a disposable, isolated guest VM.

**Nothing under `.github/` changes.** The GH workflows stay the gate until the Buildkite pipeline has
been green for 7 consecutive days; swapping the required checks is a separate, owner-gated change.
No Buildkite pipeline exists for this repository yet, and this change does not create one.

## Fork pull requests never build here

This repository is public, so anyone can open a pull request from a fork. **A fork PR never runs on
these agents.** That rests on one pipeline setting, backed by two more checks:

1. **Pipeline setting `build_pull_request_forks: false` (the boundary).** Buildkite never starts a build
   for a fork PR, so no fork-controlled file (including any script in this directory) ever
   executes. The setting must stay `false` for this pipeline, and the renderer's approved-fork path (a
   `ci:approved` label) must not be enabled for it either.
2. **Render refusal.** The settings declare `"visibility": "public"`. The renderer treats any PR whose
   head repository is not `wave-av/sdk` as a fork (unknown counts as a fork) and refuses to render it
   without the approval label.
3. **Every repo script refuses a fork PR** (`bk_refuse_fork_pr` in `scripts/lib/common.sh`). This only
   guards against a misconfigured pipeline: a fork could edit the script, which is why (1) is the boundary.

No step holds a secret, so a same-repository PR build has nothing to leak either.
`bk_refuse_credentials` ends any step whose environment carries a credential.

## Layout

| path | role |
|---|---|
| pipeline wiring | Not part of this change. The uploader pipeline file, its fixed shim and the template settings are added when WAVE's shared CI templates ship their public-repository profile. Until then nothing in this directory runs on Buildkite. |
| `parked.json` | NOT rendered. Every parked job, with its reason and what unblocks it, plus the parked schedule. |
| `scripts/<step>.sh` | The checked-in scripts the steps run. `command:` is only ever a script path (agents run with no-command-eval). |
| `scripts/lib/common.sh` | Strict mode, the fork and credential refusals, toolchain selection from the guest image's mise (never a download), a deterministic public-registry `npm ci`, the gate runner. |

This port replaces an earlier hand-written shadow pipeline (`.buildkite/steps/*`,
`.buildkite/lib/common.sh`) with the templated form. The three checks it ported keep their step keys
(`gate-checks`, `gate-skill-validate`, `secrets-content-policy`). Its refusal of a secrets-manager CLI
binary on PATH is replaced by the credential-variable refusal: the guest image ships such binaries
without any token, so the binary check would fail every build.

## Parity: every GitHub workflow job

13 workflow files, 21 jobs. Ported: 8 jobs, as 9 steps and 1 schedule. Parked: 13 jobs, plus two
secret-bearing legs of ported jobs. Every parked item is recorded in `parked.json`.

| workflow | job | Buildkite | notes |
|---|---|---|---|
| `_checks.yml` (via `foundation-gate.yml`) | `checks` | `gate-checks` | secret scan + file-size gate (max 800). Prints `path:line` only, never the matched line |
| `_checks.yml` | `skill-validate` | `gate-skill-validate` | python 3.14 from the image; PyYAML is baked (pinned-wheel fallback in a job venv) |
| `_checks.yml` | `verify-routes` | `gate-checks` | URL-convention gate; a no-op today (no `wrangler.toml`) |
| `foundation-gate.yml` | `gate` | the three rows above | its `merge_group` trigger is parked (no Buildkite merge queue) |
| `lint.yml` | `lint` | `lint`, `typecheck`, `test` | built-in steps on node 24: `npm run lint`, `npm run type-check`; the CAP-001 capabilities test runs inside `test` (`vitest run`, the full suite) |
| `smoke-install.yml` | `smoke` (node 20) | `smoke-install-node-20` | build, pack, fresh install, ESM + CJS checks |
| `smoke-install.yml` | `smoke` (node 22) | `smoke-install-node-22` | same. The live-gateway quickstart leg is parked (needs `WAVE_GATEWAY_API_KEY`) |
| `ga-evidence.yml` | `ga-evidence` | `ga-evidence` + schedule `ga-evidence-daily` (`31 9 * * *`) | same exit contract (exit 1 is a warning on PRs only); `ga-out/**` is a step artifact |
| `public-repo-guard.yml` | `guard` | `secrets-content-policy` | gitleaks 8.30.1 (image binary, version checked), ripgrep PCRE2 probe, content-policy.sh, body-policy fixtures. The private-repo-name rule is parked (needs `GUARD_PRIVATE_REPOS`) |
| `public-repo-guard.yml` | `body-guard` | parked | scans PR/issue/comment/review TEXT from the GitHub event; waits on a GitHub-event bridge |
| `governance-enforce.yml` | `enforce` | parked | installs `@wave-av/governance` from GitHub Packages (E403, billing); waits on a self-hosted npm registry and a read credential |
| `release-drift.yml` | `drift-check` | parked, with its schedule (`17 6 * * *`) | `gh release view` needs a GitHub token; no secret is granted to this public pipeline |
| `release.yml` | `resolve-ref`, `secret-scan`, `verify`, `publish`, `release`, `sbom` | parked | tag-triggered npm publish + GitHub Release. Publishing is deploy-class and stays off until the owner enables it. Its checks already run on every build: `secret-scan` = `secrets-content-policy`; `verify` = `lint` + `typecheck` + `test` + `smoke-install-*` |
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

None. No step declares a secret, so every step runs on the no-secrets queue and the renderer's
`--allowlist-rows` prints no row. The parked legs that would need one are listed in `parked.json` for
a decision; each would be a `main_only` step.

## Caps

caps-lint passed on every render (PR, main and the schedule: 9 steps, at most 27 worst-case jobs, one file). Every step sets `agents.queue`,
`timeout_in_minutes` and the agent-loss-only retry; no plugins, no secret values, no
`cancel_on_build_failing`.

## Run locally

Once the pipeline wiring is in place, with the template repository checked out at its pin as `<tpl>`:

```sh
node <tpl>/bin/<render script> --settings <settings json> --context <ctx.json> --out-dir <dir>
node <tpl>/tools/caps-lint/bin/caps-lint.mjs --warnings-as-errors <dir>/part-1.yml
node <tpl>/tools/caps-lint/bin/caps-lint.mjs --warnings-as-errors .buildkite
.buildkite/scripts/gate-checks.sh            # no install, no network
.buildkite/scripts/secrets-content-policy.sh # needs gitleaks 8.30.1 and rg on PATH
```

Steps that select a toolchain need the guest image's mise layout. Off the image, point
`BK_TEST_MISE_INSTALLS` at a tree of `<tool>/<version>/bin` directories and put a `mise` on PATH whose
`mise where <tool>@<version>` prints the matching directory (the override is ignored inside any
Buildkite job). Run every script with a clean environment: each refuses to start when a credential
variable is set.

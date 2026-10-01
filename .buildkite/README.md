# sdk on Buildkite (shadow mode)

This directory ports sdk's three **required** GitHub status checks to Buildkite, on the `fpc-isolated`
queue, each step in its own disposable guest.

**The GH checks stay required until this pipeline has been green for 7 consecutive days.** Nothing
under `.github/` changes in this port, and branch protection is not touched. Buildkite statuses are
informational until an operator swaps the required contexts, which is a separate, operator-gated
ruleset change.

## Layout

| path | role |
|---|---|
| `pipeline.yml` | Three parallel command steps, `agents.queue: fpc-isolated` at the pipeline level. |
| `steps/upload.sh` | The pipeline's UI settings-step command (vendored from `wave-av/ci-smoke`). `agent no-command-eval` requires a step's command to be one checked-in script path, so the settings step cannot run a bare `buildkite-agent pipeline upload …` directly. |
| `steps/<key>.sh` | One checked-in script per required-check port. |
| `lib/common.sh` | Strict mode, log groups, the gate runner (`bk_gate` / `bk_gates_summary`), job-local temp dirs cleaned on exit, and the Doppler fence. Trimmed and vendored from the fleet's shared Buildkite shadow-port pattern (see `wave-av/wave-opencode` PR #222) — sdk needs no Node toolchain or npm credential for these three checks, so the Node/npm helpers are dropped. |

sdk is **PUBLIC** and `wave-av/wave-foundation` (which holds `buildkite/template/v0`, PR #1570) is
**PRIVATE**, so nothing here references or fetches from it. `lib/common.sh` is vendored and trimmed
instead, with a `TODO(buildkite-template)` to re-vendor once/if that template becomes consumable from a
public repo.

## What is ported

| step key | script | shadows (GH required context / workflow / job) | timeout |
|---|---|---|---|
| `gate-checks` | `gate-checks.sh` | **gate / checks** — `.github/workflows/_checks.yml` job `checks`, called by `foundation-gate.yml` | 10 |
| `gate-skill-validate` | `gate-skill-validate.sh` | **gate / skill-validate** — `_checks.yml` job `skill-validate` | 5 |
| `secrets-content-policy` | `secrets-content-policy.sh` | **Secrets + content policy** — `.github/workflows/public-repo-guard.yml` job `guard` (tree scan only; see below) | 10 |

Each script's command body is copied **byte-for-byte** from the shadowed GH workflow — the secret-regex
grep and its exclude/allowlist plumbing, the file-size loop, the `git ls-files '*SKILL.md'` call and the
inline python3 frontmatter validator, and the pinned gitleaks version + sha256 + exact `gitleaks detect`
invocation. Only the wrapping differs: every gate runs inside `bk_gate` and a single build reports every
failing gate, instead of GH Actions' default of skipping a later step once an earlier one in the same
job fails.

### `gate-checks`

Two gates from `_checks.yml` job `checks`: the secret-regex grep (fail-closed, `.github/.secret-allowlist`-
aware — sdk has no such file today, so every hit is currently live) and the file-size gate (`git ls-files
'*.ts' '*.tsx' '*.js' '*.py'`, excluding `*.d.ts` / `*.types.ts`, `MAX=800`, `.github/.filesize-allowlist`-
aware — sdk's allowlist currently holds one entry, `dist/index.js`).

### `gate-skill-validate`

`git ls-files '*SKILL.md'` plus the inline python3 validator (needs `pyyaml`, installed with `pip
install pyyaml` — no lockfile/version pin in the GH job either, matched here). No-op if the repo carries
no `*SKILL.md` (true for sdk today).

### `secrets-content-policy`

gitleaks `8.30.1`, installed with the **same sha256 verification** `public-repo-guard.yml` uses
(`gitleaks_8.30.1_linux_x64.tar.gz`, sha256 `551f6fc8…f2470eb`), then `gitleaks detect --no-git --source
. --config .gitleaks.toml --redact --exit-code 1`, then `bash scripts/public-repo-guard/content-policy.sh
.`. `.gitleaks.toml` and `scripts/public-repo-guard/content-policy.sh` are **not** vendored into
`.buildkite/`: both already live in this repo's tree (that is the whole point of
`public-repo-guard.yml`'s "self-contained by design" header) and are invoked straight from the checkout,
exactly as the GH job does.

One deliberate difference: the pinned tarball is installed into a job-local temp dir instead of
`/usr/local/bin` via `sudo install`, since a disposable Buildkite guest has no reason to need root or to
leave a binary behind. The download URL, the version, and the sha256 are unchanged.

**`GUARD_PRIVATE_REPOS`**: the workflow reads this from an org-level GitHub Actions variable
(`vars.GUARD_PRIVATE_REPOS`) and passes it through as a plain env var to `content-policy.sh`, which skips
its private-repo-name rule when the variable is unset. This script does the same — it never hardcodes,
prints, or writes the value; it only passes through whatever is already in the job's environment. On
Buildkite, the `secrets-content-policy` step's `secrets: [GUARD_PRIVATE_REPOS]` attribute in
`pipeline.yml` exports the Buildkite cluster secret of that name (org `wave`, cluster "WAVE self-hosted
CI") as the `GUARD_PRIVATE_REPOS` env var for that step only — Buildkite redacts the value from build
logs if it is ever printed. Never set this from a literal value in `pipeline.yml` or a committed script —
baking that list into a public repo's tree would itself be exactly the leak `content-policy.sh` exists to
catch.

**The cluster secret must exist, not merely be unset.** The Buildkite agent fetches every key named in
a step's `secrets:` list before the step's command runs at all; a key that does not exist in the
cluster fails that fetch and the job never starts — `secrets-content-policy.sh` never runs, so its own
"unset → skip the rule" fallback never gets a chance to apply. That differs from the GH Actions
variable, which really can be left undefined. To get the GH-equivalent behavior on Buildkite ("rule
skipped"), the cluster secret must exist with an **empty string** value, not be absent.

**Same-repo PR builds receive this secret.** This pipeline builds pushes and same-repo (non-fork) pull
requests (see step 4 below); fork PRs never get a Buildkite agent at all, so only contributors who can
push a branch in `wave-av/sdk` can trigger a build that sees `GUARD_PRIVATE_REPOS`. That is the same
trust boundary every other step on this queue already operates under — this secret does not widen it.
It is also a low-sensitivity value: GitHub itself stores the equivalent as a plain, unmasked Actions
**variable**, not a secret, so step-scoped injection plus automatic log redaction here is already
stricter than the GH baseline. Restricting the secret to protected-branch-only builds was considered
and rejected: this step's job is to scan each PR's own content for policy violations, including a PR
that edits the step itself — running it only from a trusted ref would defeat that purpose.

**Not ported**: `body-guard`, the other job in `public-repo-guard.yml`. It scans PR/issue/comment/review
**text** read from the GitHub event payload (`$GITHUB_EVENT_PATH`), which has no Buildkite equivalent —
Buildkite builds a git ref, not a webhook payload with a title/body/comment. `body-guard` is not one of
sdk's three required contexts (only `guard`'s check-run, "Secrets + content policy", is required), so
GitHub Actions stays its only enforcer; this port does not weaken it.

## What is deferred, and why

`verify-routes`, the fourth job in `_checks.yml`, is **not** a required context on sdk (branch
protection lists exactly `gate / checks`, `gate / skill-validate`, `Secrets + content policy`) and sdk
has no `wrangler.toml`, so it is out of scope for this port.

## Guest-image prerequisites

- `bash`, `git`, `grep`, `wc` — `gate-checks`.
- `python3` with network access to install `pyyaml` via `pip` — `gate-skill-validate`. (Matches the GH
  job: no version pin on `pyyaml` there either.)
- `curl`, `sha256sum`, `tar`, `rg` (ripgrep, required by `content-policy.sh` itself) — `secrets-content-policy`.
- **linux/x86_64**, matching `public-repo-guard.yml`'s pinned gitleaks asset and every other fpc-isolated
  step in the fleet.
- **No Doppler.** Every step fails closed if the `doppler` CLI is on `PATH` or `DOPPLER_TOKEN` is set
  (see `lib/common.sh` `bk_refuse_doppler`). None of these three checks need a secret; a Doppler
  credential appearing in their environment would be a guest-image bug, not a feature.
- Egress: `registry.npmjs.org` is **not** needed (no `npm ci` in this pipeline — sdk needs no npm
  credential for these checks, `BK_NPM_AUTH: none` per wave-foundation's per-repo parameter table).
  `pypi.org` and `files.pythonhosted.org` for `pip install pyyaml` (PyPI serves the actual wheel/sdist
  from `files.pythonhosted.org`, not `pypi.org` itself), and `github.com`/`objects.githubusercontent.com`
  for the pinned gitleaks release tarball.
- No sudo, global installs, services, GPU or macOS are needed.

## Pipeline settings (Buildkite UI, not YAML) — operator steps still needed

This PR does **not** create the Buildkite pipeline, connect the GitHub App, or touch branch protection.
An operator still needs to:

1. **Create the pipeline** in the Buildkite UI, repository `wave-av/sdk`, and connect the **GitHub App**
   integration (not a deploy key) so Buildkite can report commit statuses.
2. **GitHub provider settings — required for PER-STEP contexts.** By default a GitHub-App-connected
   Buildkite pipeline posts exactly **one pipeline-level** commit status; connecting the app alone does
   **not** produce the three `buildkite/<slug>/<step-key>` contexts this README documents. Under
   **Pipeline Settings → GitHub**, enable all three:
   - `publish_commit_status`
   - `publish_commit_status_per_step`
   - `use_step_key_as_commit_status` (so each context is named from the step's `key:` — `gate-checks`,
     `gate-skill-validate`, `secrets-content-policy` — not from its `label:`)

   See <https://buildkite.com/docs/pipelines/source-control/github> ("GitHub commit statuses"). Without
   all three, step 9 below (swapping the required contexts) has nothing matching to swap to. (Caught on
   the sibling wave-monitor shadow port, PR #102, CodeRabbit — the same gap applies here and is
   documented pre-emptively rather than left for the operator to rediscover.)
3. **Settings → Steps**: paste the one settings step below. It is the only YAML that lives outside this
   repo, so a PR here cannot edit it.
   ```
   command: .buildkite/steps/upload.sh
   agents:
     queue: fpc-isolated
   timeout_in_minutes: 5
   retry:
     manual: false
   ```
4. **GitHub triggers**: build on push (`main`) and pull_request. **Build PRs from forks: off** — sdk is
   public, and none of these three steps need a credential, but fork builds are still left off to match
   fleet convention and to keep the guest-image/Doppler-fence posture uniform across repos.
5. **Visibility**: sdk is a public GitHub repo; the Buildkite pipeline's own visibility is an
   organization policy choice independent of this PR — set it per the org's existing fpc-isolated
   pipelines.
6. **Cancel/skip intermediate builds** on `!main`, mirroring `foundation-gate.yml`'s
   `cancel-in-progress: true` per ref.
7. **Run a Buildkite Agent v3.106.0 or later on queue `fpc-isolated`** (or confirm one already polling
   it meets that minimum) so builds are not stuck pending — v3.106.0+ is required for the
   pipeline-YAML `secrets:` attribute `secrets-content-policy` uses
   (<https://buildkite.com/docs/pipelines/security/secrets/buildkite-secrets>).
8. **Observe a green build** — all three steps (`gate-checks`, `gate-skill-validate`,
   `secrets-content-policy`) passing on both a push to `main` and a PR build, **and** confirm all three
   post as distinct `buildkite/<slug>/<step-key>` commit statuses on the PR (not one pipeline-level
   status) — that confirms step 2's settings actually took effect.
9. Only after 7 consecutive green days: **switch the required contexts** in branch protection from the
   three GitHub check names to the three `buildkite/<pipeline-slug>/<step-key>` contexts below. That is
   a separate, operator-gated ruleset change — not part of this PR.

   **Fork-PR gap this swap opens.** Step 4 leaves "Build PRs from forks" **off** on purpose — sdk is
   public, and a fork PR's branch/workflow content is attacker-controlled, so it must not get a
   Buildkite agent on `fpc-isolated` (secrets/agent safety beats convenience here; this stays off even
   after the swap). Buildkite therefore never builds an external fork PR and never posts its three
   `buildkite/<slug>/<step-key>` statuses for one. Once step 9 makes those contexts **required**, an
   external fork PR has no automatic producer for them and sits permanently un-mergeable ("Expected"),
   even though the shadowed GH Actions checks (which do run on fork PRs) would have passed. There is no
   required-status "OR": GitHub branch protection requires every listed context, so leaving a GH check
   required alongside the Buildkite ones does not give forks a way through. A fork PR only gets
   real coverage once a maintainer re-pushes its branch/commit into `wave-av/sdk` (e.g. `git push` to a
   same-repo branch, or `gh pr checkout` + repush) or triggers a Buildkite build for that commit
   manually — either creates a same-repo build Buildkite (and thus the required contexts) can see. An
   operator making this swap must accept that gap or keep it in mind for fork-originated contributions.

## Contexts this pipeline would post (once connected)

With step 2's three GitHub provider settings enabled (`publish_commit_status`,
`publish_commit_status_per_step`, `use_step_key_as_commit_status`), Buildkite posts one commit status
per step, named `buildkite/<pipeline-slug>/<step-key>`. Assuming the pipeline is created with slug `sdk`
(Buildkite's default from the repo name):

| shadows (current required GH context) | would post as |
|---|---|
| `gate / checks` | `buildkite/sdk/gate-checks` |
| `gate / skill-validate` | `buildkite/sdk/gate-skill-validate` |
| `Secrets + content policy` | `buildkite/sdk/secrets-content-policy` |

If the operator picks a different pipeline slug, substitute it in the contexts above before wiring the
ruleset change in step 9. If step 2 is skipped or misconfigured, Buildkite posts a single pipeline-level
status instead of these three, and step 9 has nothing matching to swap to.

## Run locally

From the repo root, with `doppler` off `PATH` and `DOPPLER_TOKEN` unset (the steps refuse to run
otherwise, and that refusal is the point):

```sh
python3 -c 'import yaml; yaml.safe_load(open(".buildkite/pipeline.yml"))'   # pipeline YAML validity
env -u DOPPLER_TOKEN .buildkite/steps/gate-checks.sh
env -u DOPPLER_TOKEN .buildkite/steps/gate-skill-validate.sh
env -u DOPPLER_TOKEN .buildkite/steps/secrets-content-policy.sh
```

`secrets-content-policy.sh` downloads the pinned `linux_x64` gitleaks tarball, which will not execute on
a non-Linux workstation. On macOS, use a locally installed gitleaks of the **same pinned version**
(`gitleaks version` should print `8.30.1`) to exercise the `gitleaks detect` + `content-policy.sh` logic;
the download-and-verify step itself can still be checked independently with `curl` + `sha256sum -c`
against the same URL and hash the script uses.

## Exit criterion for the soak

Buildkite `gate-checks`, `gate-skill-validate` and `secrets-content-policy` run green alongside the three
GH required checks for 7 consecutive days. After that, the required-context swap (step 9 above) and any
retirement of the GH workflows are separate, operator-gated changes.

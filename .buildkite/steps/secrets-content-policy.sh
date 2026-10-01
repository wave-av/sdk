#!/usr/bin/env bash
# Step `secrets-content-policy`: shadow-ports the required GitHub context "Secrets + content policy" —
# job `guard` in .github/workflows/public-repo-guard.yml. This is the TREE half only: `body-guard` (the
# workflow's other job) scans PR/issue/comment/review TEXT read from the GitHub event payload, which has
# no Buildkite equivalent and is out of scope for a shadow port — GitHub Actions stays the only enforcer
# of that surface. gitleaks is pinned at the exact version and installed with the exact sha256
# verification public-repo-guard.yml uses. .gitleaks.toml and scripts/public-repo-guard/content-policy.sh
# are NOT vendored into .buildkite/: both already live in this repo's tree and are invoked from the
# checkout, exactly as the GH job does (their own provenance and self-containment guarantees, documented
# in public-repo-guard.yml's header, are unaffected by this port).
#
# GUARD_PRIVATE_REPOS: passed through from this job's environment, unmodified and never printed or
# written to a file here, exactly as the workflow does with `env: GUARD_PRIVATE_REPOS: ${{
# vars.GUARD_PRIVATE_REPOS }}`. On GH it comes from an org-level Actions variable; on Buildkite it must
# come from the agent environment hook (org-scoped), never from pipeline.yml or a script default. Unset
# -> content-policy.sh skips that one rule on its own (see its "Unset locally" comment); this script does
# not change that behaviour.
#
# Would post as buildkite/<pipeline-slug>/secrets-content-policy (shadow mode; GitHub's
# "Secrets + content policy" stays the required context until an operator swaps it — see
# .buildkite/README.md).
set -euo pipefail
# shellcheck source-path=SCRIPTDIR source=../lib/common.sh
source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

cd "$BK_REPO_ROOT"
bk_refuse_doppler
bk_require_tools curl sha256sum tar rg bash

# Verbatim from public-repo-guard.yml, step "Install gitleaks (pinned + checksum-verified)".
GITLEAKS_VERSION="8.30.1"
GITLEAKS_SHA256="551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb"

bk_section "install gitleaks ${GITLEAKS_VERSION} (pinned + checksum-verified, job-local, no sudo)"
gl_dir=""
bk_mktemp_dir gl_dir
# fpc-isolated agents run linux/x86_64, the one platform public-repo-guard.yml's pin covers. Installed
# into a job-local temp dir instead of /usr/local/bin (no sudo needed in a disposable guest); everything
# else about the download and verification is unchanged from the workflow.
(
  cd "$gl_dir"
  curl -fsSL --proto '=https' --tlsv1.2 -o gitleaks.tar.gz \
    "https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz"
  echo "${GITLEAKS_SHA256}  gitleaks.tar.gz" | sha256sum -c -
  tar -xzf gitleaks.tar.gz gitleaks
  chmod 0755 gitleaks
  rm -f gitleaks.tar.gz
)
gitleaks_bin="${gl_dir}/gitleaks"
"$gitleaks_bin" version

# Verbatim from public-repo-guard.yml, step "gitleaks (secret scan — published tree)".
bk_gate "gitleaks (secret scan — published tree)" \
  "$gitleaks_bin" detect --no-git --source . --config .gitleaks.toml --redact --exit-code 1

# Verbatim from public-repo-guard.yml, step "content policy (WAVE trade-secret / internal-leak gate)".
bk_gate "content policy (WAVE trade-secret / internal-leak gate)" \
  env GUARD_PRIVATE_REPOS="${GUARD_PRIVATE_REPOS:-}" bash scripts/public-repo-guard/content-policy.sh .

bk_gates_summary

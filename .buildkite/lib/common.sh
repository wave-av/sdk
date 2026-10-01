#!/usr/bin/env bash
# Shared helpers for .buildkite/steps/*.sh. SOURCED by every step script, never run directly.
#
# Trimmed and vendored from the fleet's shared Buildkite shadow-port lib/common.sh pattern, by way of
# wave-av/wave-opencode PR #222 (an earlier repo in the same shadow-port series). sdk needs no Node
# toolchain and no npm credential for the three checks this pipeline shadows (secret-regex grep,
# file-size gate, SKILL.md frontmatter, gitleaks, content-policy.sh), so bk_assert_node_major and the
# npm helpers are dropped here — only bk_section / bk_err / bk_gate / bk_gates_summary / bk_mktemp_dir /
# bk_require_tools / bk_refuse_doppler are kept, unchanged in behaviour from the vendored source.
# TODO(buildkite-template): re-vendor from wave-av/wave-foundation buildkite/template/v0 lib/common.sh
# once sdk (a PUBLIC repo) can consume it — that repo is PRIVATE today, so nothing here references it.
#
# Contract every step script inherits from here:
#   - `set -euo pipefail`, and never `set -x` (xtrace would print expanded values into the build log).
#   - Never print an environment variable's VALUE. Errors name the variable, never its contents. This
#     matters doubly here: GUARD_PRIVATE_REPOS (read by content-policy.sh, not by this file) holds
#     private WAVE repo names, and sdk is the PUBLIC repo the content-policy gate protects.
#   - BUILDKITE_BRANCH / BUILDKITE_MESSAGE / PR titles are untrusted data: never eval'd, never
#     interpolated into a command string.
#   - Temp dirs are job-local and removed on exit, so a disposable guest has nothing left to leak.
set -euo pipefail

BK_REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
export BK_REPO_ROOT

_bk_cleanup_paths=()
_bk_failed_gates=()

bk_cleanup_on_exit() {
  local p
  for p in "${_bk_cleanup_paths[@]+"${_bk_cleanup_paths[@]}"}"; do
    rm -rf -- "$p"
  done
}
trap bk_cleanup_on_exit EXIT

# Buildkite log group. `---` is collapsed; bk_gate expands the group again when its gate fails.
bk_section() {
  printf -- '--- %s\n' "$*"
}

bk_err() {
  printf 'error: %s\n' "$*" >&2
}

# bk_mktemp_dir <var>: create a job-local temp dir, register it for cleanup and store its path in <var>.
# It sets a variable instead of printing the path, because a $(...) subshell would lose the
# cleanup registration.
bk_mktemp_dir() {
  local __dir
  __dir="$(mktemp -d "${TMPDIR:-/tmp}/bk.XXXXXX")"
  _bk_cleanup_paths+=("$__dir")
  printf -v "$1" '%s' "$__dir"
}

bk_require_tools() {
  local tool missing=0
  for tool in "$@"; do
    if ! command -v "$tool" >/dev/null 2>&1; then
      bk_err "required tool '$tool' is not on PATH (guest-image prerequisite, see .buildkite/README.md)"
      missing=1
    fi
  done
  return "$missing"
}

# The Doppler fence. None of the three gates this pipeline shadows need a secret — the whole point of
# "gate / checks", "gate / skill-validate" and "Secrets + content policy" is that they run with none. A
# CI guest must therefore never have the Doppler CLI or a Doppler token in scope: refuse to run rather
# than let a supposedly secret-free gate silently gain access to one. Names only, never values.
bk_refuse_doppler() {
  local leaked=0
  if command -v doppler >/dev/null 2>&1; then
    bk_err "the doppler CLI is on PATH; CI guests must not carry it. Remove it from the guest image."
    leaked=1
  fi
  if [[ -n "${DOPPLER_TOKEN+x}" ]]; then
    bk_err "DOPPLER_TOKEN is set in this job's environment; CI steps must not hold a Doppler credential. Remove it from the agent environment hook."
    leaked=1
  fi
  return "$leaked"
}

# bk_gate <name> <command...>: run one gate in its own log group and record a failure without
# stopping, so a single build reports every failing gate. Each gate is one external command, because
# errexit is suspended inside `||` and a multi-command body would hide an early failure.
bk_gate() {
  local name="$1"
  shift
  bk_section "$name"
  local rc=0
  "$@" || rc=$?
  if (( rc != 0 )); then
    printf '^^^ +++\n'
    bk_err "gate failed: ${name} (exit ${rc})"
    _bk_failed_gates+=("${name} (exit ${rc})")
  fi
}

# Last call of a gate-running script: exits non-zero when any bk_gate failed, listing each one.
bk_gates_summary() {
  if (( ${#_bk_failed_gates[@]} > 0 )); then
    printf '+++ %s gate(s) failed\n' "${#_bk_failed_gates[@]}"
    printf '  - %s\n' "${_bk_failed_gates[@]}"
    return 1
  fi
  printf '+++ all gates passed\n'
}

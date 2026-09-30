#!/usr/bin/env bash
# Step `gate-checks`: shadow-ports the required GitHub context "gate / checks" — job `checks` in
# .github/workflows/_checks.yml (called by foundation-gate.yml). Two gates, copied BYTE-FOR-BYTE from
# that workflow: the secret-regex grep (allowlist-aware) and the file-size gate (<= 800 lines for
# tracked .ts/.tsx/.js/.py, excluding *.d.ts and *.types.ts). Only the wrapping differs: both gates run
# in their own bk_gate log group and a single build reports every failure, instead of GH Actions'
# default of skipping the second step once the first fails.
#
# DELIBERATE DIVERGENCE from _checks.yml (not byte-faithful here, on purpose): the secret-scan gate
# below prints only `path:line` for a hit, never the matched line's CONTENT. _checks.yml's `echo "$HITS"`
# prints the full credential-bearing line into the GH Actions log; on Buildkite that log is streamed and
# often held for a build-retention window, so a real credential that survives the regex+allowlist would
# sit in plain text in build history. Flagged on the sibling wave-monitor shadow port (PR #102,
# CodeRabbit, CWE-532 "Insertion of Sensitive Information into Log File"); applied here pre-emptively.
# The detection logic (the regex, the exclude-dirs, the allowlist plumbing, the exit code) is unchanged.
#
# Would post as buildkite/<pipeline-slug>/gate-checks (shadow mode; GitHub's "gate / checks" stays the
# required context until an operator swaps it — see .buildkite/README.md).
set -euo pipefail
# shellcheck source-path=SCRIPTDIR source=../lib/common.sh
source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

cd "$BK_REPO_ROOT"
bk_refuse_doppler
bk_require_tools grep git wc

# _checks.yml's workflow_call input default (inputs.max_lines), as set by foundation-gate.yml's
# `with: max_lines: 800`.
MAX="${MAX:-800}"

# Detection logic verbatim from _checks.yml, step "Secret scan (fail-closed, allowlist-aware)". Output
# handling DIVERGES on purpose (see header comment): only `path:line` is ever printed for a hit, never
# grep's matched line content, so a real credential that reaches $HITS never reaches the build log.
# shellcheck disable=SC2016 # single-quoted on purpose: expansion happens in the inner bash -c, not here
bk_gate "Secret scan (fail-closed, allowlist-aware)" bash -c '
  HITS=$(grep -rIEn "(sk-[A-Za-z0-9]{20}|sk_(live|test)_[A-Za-z0-9]{20}|npm_[A-Za-z0-9]{30}|sbp_[a-f0-9]{40}|github_pat_[A-Za-z0-9_]{40}|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{30}|AIzaSy[A-Za-z0-9_-]{20}|xai-[A-Za-z0-9]{40}|xoxb-[A-Za-z0-9-]+|-----BEGIN [A-Z ]*PRIVATE KEY)" \
      --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=dist . | grep -v "allowlist secret" \
      | { [ -f .github/.secret-allowlist ] && grep -vFf .github/.secret-allowlist || cat; } || true)
  if [ -n "$HITS" ]; then
    echo "::error::secret-like pattern found — do not commit credentials (value redacted; see path:line below)"
    printf "%s\n" "$HITS" | cut -d: -f1,2 | sed "s/^/  - /"
    exit 1
  fi
  echo "secret-scan clean"
'

# Verbatim from _checks.yml, step "File-size gate" (env.MAX = inputs.max_lines).
# shellcheck disable=SC2016 # single-quoted on purpose: expansion happens in the inner bash -c, not here
bk_gate "File-size gate (<= ${MAX} lines)" env MAX="$MAX" bash -c '
  fail=0
  while IFS= read -r f; do
    grep -qxF "$f" .github/.filesize-allowlist 2>/dev/null && continue   # justified exception
    n=$(wc -l < "$f")
    if [ "$n" -gt "$MAX" ]; then echo "::error::$f has $n lines (> $MAX)"; fail=1; fi
  done < <(git ls-files "*.ts" "*.tsx" "*.js" "*.py" | grep -vE "\.(types|d)\.ts$")
  if [ "$fail" = 0 ]; then echo "file-size gate passed (all <= $MAX lines)"; fi
  exit "$fail"
'

bk_gates_summary

#!/usr/bin/env bash
# check-package-description-maturity.sh: fixed CLI entrypoint for the package
# description maturity check (WAVE-24383, WAVE-36523). See
# scripts/maturity/check-package-description-maturity.mjs for the rules.
#
# --ci is accepted for the Buildkite step and changes nothing: the check is
# already non-interactive and exits non-zero on any FAIL or UNKNOWN.
#
# EXIT CODES
#   0  every description passed
#   1  at least one description is FAIL or UNKNOWN
#   2  the check could not run
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
for arg in "$@"; do
  case "$arg" in
    --ci) ;;
    *) echo "usage: $0 [--ci]" >&2; exit 2 ;;
  esac
done
exec node "$HERE/maturity/check-package-description-maturity.mjs" --dir "$ROOT"

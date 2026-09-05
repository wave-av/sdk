#!/usr/bin/env bash
# check-VER-001.sh — VER-001 ("Version and release truth agree from source through
# deployment") for @wave-av/sdk. See scripts/ga/check-ver-001.mjs for the full checks and
# their rationale; this file is the fixed CLI entrypoint the GA gate spec's
# `runnable_command` and the ga-evidence producer both invoke.
#
# Prints one `PASS|FAIL|UNKNOWN <check-name>: <detail>` line per check.
#
# EXIT CODES
#   0  every check passed
#   1  the gate ran and at least one check is FAIL or UNKNOWN (never read as a pass)
#   2  the gate could not run at all (registry/API fetch failed, git/npm missing, bad JSON)
set -uo pipefail
HERE="$(dirname "${BASH_SOURCE[0]}")"
exec node "$HERE/check-ver-001.mjs"

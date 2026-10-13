#!/usr/bin/env bash
# Step `ga-evidence`: .github/workflows/ga-evidence.yml job `ga-evidence` (VER-001). Runs on every build
# (the workflow runs on pull_request) and on the daily schedule `ga-evidence-daily` (cron 31 9 * * *,
# declared in the pipeline settings `schedules`).
#
# Same contract as the workflow's Enforce step:
#   exit 0 -> pass
#   exit 1 -> a live criterion failed or is unknown: a warning (step passes) on a PR build, a failure
#             on every other build (main push, schedule, manual)
#   exit 2 -> the producer could not run: always a failure
# The evidence directory ga-out/ is a Buildkite artifact of this step (the GH upload-artifact step).
#
# The workflow passes the ambient GITHUB_TOKEN only to raise the GitHub REST rate limit for the release
# lookup; the producer treats it as optional. This step holds no secret and calls the API anonymously.
set -euo pipefail
# shellcheck source-path=SCRIPTDIR source=lib/common.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib/common.sh"

bk_preflight
bk_use_node 24

bk_section "GA evidence producer (VER-001)"
code=0
node scripts/ga/ga-evidence.mjs || code=$?
printf 'producer exit code %s (0 = pass, 1 = a criterion is fail or unknown, 2 = the producer could not run)\n' "$code"

if [[ "$code" == 0 ]]; then
  printf 'GA evidence: all emitted criteria pass\n'
  exit 0
fi
if [[ "$code" == 1 && "${BUILDKITE_PULL_REQUEST:-false}" != "false" ]]; then
  printf '+++ WARNING: the GA evidence producer reports a failing live criterion (exit 1). This does not fail the PR: the criterion is a property of the live surface, not of this change.\n'
  exit 0
fi
bk_err "GA evidence producer reported a non-pass result (exit ${code})"
exit 1

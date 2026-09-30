#!/usr/bin/env bash
# sdk pipeline upload step, vendored from wave-av/ci-smoke .buildkite/steps/upload.sh. The pipeline's
# only settings step (held in Buildkite pipeline settings, not in this repo) runs
# `command: .buildkite/steps/upload.sh`. fpc-isolated agents run with no-command-eval, so a step's
# command must be one script path inside the checkout (mode 100755, no arguments); the usual bare
# `buildkite-agent pipeline upload` command would be refused before it runs.
#   --no-interpolation       nothing from the job environment is substituted into the uploaded steps
#   --reject-parse-warnings  an unknown key or any other parse warning fails the upload
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
exec buildkite-agent pipeline upload --no-interpolation --reject-parse-warnings "$root/.buildkite/pipeline.yml"

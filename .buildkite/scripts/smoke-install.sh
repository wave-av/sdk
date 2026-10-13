#!/usr/bin/env bash
# Steps `smoke-install-node-20` and `smoke-install-node-22`: .github/workflows/smoke-install.yml job
# `smoke` (matrix node-version 20, 22; fail-fast off, so each leg is its own step). The node major comes
# from the agent-set BUILDKITE_STEP_KEY, checked against the two legs, never from the build's env.
#
#   npm ci, npm run build, npm pack, a fresh install of the packed tarball into an empty consumer
#   project, then the ESM import check and the CJS require check, as in the workflow.
#
# The workflow's last step (README quickstart against the live gateway) needs WAVE_GATEWAY_API_KEY and
# skips itself when the key is absent (forks, unset). This step holds no secret, so it always takes that
# skip; the live leg is parked in .buildkite/wave-ci.deferred.json (see README, "Parked").
set -euo pipefail
# shellcheck source-path=SCRIPTDIR source=lib/common.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib/common.sh"

bk_preflight
case "${BUILDKITE_STEP_KEY:-}" in
  smoke-install-node-20) node_major=20 ;;
  smoke-install-node-22) node_major=22 ;;
  *) bk_err "run this script as step smoke-install-node-20 or smoke-install-node-22 (BUILDKITE_STEP_KEY)"; exit 2 ;;
esac
bk_use_node "$node_major"

bk_npm_ci
bk_section "npm run build"
npm run build

bk_section "npm pack"
work=""
bk_mktemp_dir work
name="$(npm pack --silent --pack-destination "$work")"
tarball="${work}/${name}"
[[ -f "$tarball" ]] || { bk_err "npm pack did not produce a tarball"; exit 1; }
printf 'packed: %s\n' "$name"

bk_section "fresh install of the packed tarball"
smoke="${work}/smoke"
mkdir -p "$smoke"
npmrc="${work}/npmrc"
printf '%s\n' 'registry=https://registry.npmjs.org/' >"$npmrc"
(cd "$smoke" && npm init -y >/dev/null &&
  NPM_CONFIG_USERCONFIG="$npmrc" NPM_CONFIG_GLOBALCONFIG=/dev/null npm i --no-audit --no-fund "$tarball")

bk_section "ESM import check"
cat >"${smoke}/esm-check.mjs" <<'EOF'
process.on('unhandledRejection', (e) => { console.error('UNHANDLED', e); process.exitCode = 1; });
const m = await import('@wave-av/sdk');
const count = Object.keys(m).length;
console.log('ESM import ok:', count, 'exports');
if (count < 1) {
  console.error('FAIL: no exports from ESM import');
  process.exit(1);
}
EOF
(cd "$smoke" && node esm-check.mjs)

bk_section "CJS require check"
exports_field="$(cd "$smoke" && node -e "console.log(require('./node_modules/@wave-av/sdk/package.json').exports['.'].require ? 'yes' : 'no')")"
if [[ "$exports_field" != "yes" ]]; then
  printf 'skipped: package does not claim a CJS require() entry point\n'
else
  cat >"${smoke}/cjs-check.cjs" <<'EOF'
const m = require('@wave-av/sdk');
const count = Object.keys(m).length;
console.log('CJS require ok:', count, 'exports');
if (count < 1) {
  console.error('FAIL: no exports from CJS require');
  process.exit(1);
}
EOF
  (cd "$smoke" && node cjs-check.cjs)
fi

bk_section "README quickstart against the live gateway"
printf 'skipped: WAVE_GATEWAY_API_KEY is not provided to this public pipeline (parked; see README)\n'

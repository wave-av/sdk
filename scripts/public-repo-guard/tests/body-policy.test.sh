#!/usr/bin/env bash
# Fixture tests for body-policy.sh.
#
# Deliberately fixture-only: the gate is NEVER proved by writing a real leak into a
# live public PR body, because doing so would publish the exact thing it guards.
#
# The negatives here are the load-bearing half. A leak gate that blocks everything
# is trivially "correct" and useless — it gets disabled within a week. The bare
# cross-reference case below is the one that keeps this gate deployable.
set -uo pipefail

SCRIPT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/body-policy.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# The names the real gate is configured with come from an org variable; the tests
# pin their own so they are hermetic and do not depend on CI configuration. The
# names (and every credential name / count in the fixtures below) are DELIBERATELY
# synthetic: this file is public, and body-policy.sh's own rule is that real
# private-repo names are never hardcoded. The tests only need self-consistency
# between this variable and the fixture text.
export GUARD_PRIVATE_REPOS="example-private-a, example-private-b, example-private-c"

PASS=0; FAIL=0

# expect <exit-code> <name> <body-text>
expect() {
  local want="$1" name="$2" body="$3" out rc
  printf '%s\n' "$body" > "$TMP/body.txt"
  out="$(bash "$SCRIPT" "$TMP/body.txt" 2>&1)"; rc=$?
  if [[ "$rc" == "$want" ]]; then
    PASS=$((PASS+1)); printf '  ok   %s\n' "$name"
  else
    FAIL=$((FAIL+1)); printf '  FAIL %s — want exit %s, got %s\n%s\n' "$name" "$want" "$rc" "$out"
  fi
  # The annotation is world-readable; a hit must never echo the matched text.
  if [[ "$rc" == 1 ]] && printf '%s' "$out" | grep -qF "$body"; then
    FAIL=$((FAIL+1)); printf '  FAIL %s — LEAKED the matched text into the annotation\n' "$name"
  fi
}

echo "body-policy fixtures"

# --- must BLOCK ---------------------------------------------------------------
expect 1 'private repo + credential name' \
  'Flip is live: EXAMPLE_LEASE_SECRET is bound on example-private-a now.'
expect 1 'private repo + credential name, reverse order' \
  'The EXAMPLE_JOIN_SECRET was added; example-private-b picks it up on deploy.'
expect 1 'private repo + secret count' \
  'example-private-a went from 12 secrets to 13 after this change.'
expect 1 'private repo + service binding' \
  'This adds a service binding from the worker to example-private-c.'
expect 1 'operator home path' \
  'Repro: run it from /Users/someoperator/Documents/notes and it fails.'  # enforce-ignore (fixture)
expect 1 'internal-only marker' \
  'Attaching the internal-only rollout plan for context.'
# Assembled at run time rather than written as a literal: a fixture that LOOKS like
# a live AWS key trips this repo's own pre-commit secret scanners (it did, on the
# first draft). Splitting the prefix keeps the fixture exercising the real regex
# without parking a credential-shaped string in source.
AKID_FIXTURE="AKI""A1234567890ABCDEF"
expect 1 'AWS access key id' \
  "The failing job had ${AKID_FIXTURE} configured."
# Credential rules are --no-exempt: no line-level context makes a live key OK.
expect 1 'guard:allow does NOT exempt a credential' \
  "Example key: ${AKID_FIXTURE} — guard:allow documented-example"
expect 1 'talking about the control does NOT exempt a credential' \
  "body-policy caught ${AKID_FIXTURE} in a comment last week."
expect 1 'internal tailscale IP' \
  'It resolves to 100.71.4.19 from inside the fleet.'

# --- must PASS (precision — these keep the gate deployable) -------------------
expect 0 'bare private-repo cross-reference' \
  'This is the companion change to example-private-b#260; merge that one first.'
expect 0 'two private repos, no operational detail' \
  'Both example-private-a and example-private-b will need a follow-up for this.'
expect 0 'credential NAME with no private repo nearby' \
  'The handler now reads SOME_API_TOKEN from the environment instead of a literal.'
# Regression: a leading (?i) once spilled case-insensitivity across the whole
# private-repo-ops pattern, so a lowercase everyday word like `api_key` counted
# as operational detail and blocked any body that also named a private repo.
expect 0 'lowercase identifier near a private repo is not operational detail' \
  'Fix example-private-a: the api_key header is now lowercase.'
expect 0 'lowercase token word near a private repo is not operational detail' \
  'Docs for example-private-b: pass your access_token to the client.'
expect 0 'public runner path is not an operator path' \
  'CI checks out to /home/runner/work/repo/repo before the scan runs.'  # enforce-ignore (fixture)
expect 0 'talking about the control' \
  'body-policy blocks a private repo named next to a SECRET_TOKEN; that is intended.'
expect 0 'explicit guard:allow with a reason' \
  'Example for the docs: example-private-a holds EXAMPLE_SECRET — guard:allow documented-example'
expect 0 'ordinary clean body' \
  'Bumps the draft revision and regenerates the fixtures. No behaviour change.'
# Regression: the first CI run of this job failed on its own PR, because a review
# bot edited the body to summarize the change and quoted the marker verbatim.
expect 0 'marker MENTIONED in straight quotes is a description' \
  'Blocks infra identifiers and markers (account_id, home paths, "internal-only" text).'
expect 0 'marker MENTIONED in a code span' \
  'The rule matches `internal-only` and `for internal use` in body text.'
expect 0 'marker MENTIONED in smart quotes' \
  'Blocks operator home paths and “internal-only” text.'
expect 1 'marker USED unquoted still blocks' \
  'Attaching the internal-only rollout plan; do not share outside the team.'

# --- fail closed --------------------------------------------------------------
# GUARD_PRIVATE_REPOS is the one rule fed by configuration, so a configuration
# mistake must go red in CI, never green: an unset/mis-typed org variable would
# otherwise disable the headline rule while the check still reports a pass. The
# silent skip stays local-only, where the org's private-repo list is unknowable.
printf '%s\n' 'Bumps the draft revision. No behaviour change.' > "$TMP/clean.txt"
# guardcfg <exit-code> <name> <env pairs...>
guardcfg() {
  local want="$1" name="$2"; shift 2
  env -u GUARD_PRIVATE_REPOS -u GITHUB_ACTIONS "$@" bash "$SCRIPT" "$TMP/clean.txt" >/dev/null 2>&1
  local rc=$?
  if [[ "$rc" == "$want" ]]; then
    PASS=$((PASS+1)); printf '  ok   %s → exit %s\n' "$name" "$want"
  else
    FAIL=$((FAIL+1)); printf '  FAIL %s — want exit %s, got %s\n' "$name" "$want" "$rc"
  fi
}
guardcfg 2 'unset GUARD_PRIVATE_REPOS in CI fails closed'            GITHUB_ACTIONS=true
guardcfg 2 'whitespace-only GUARD_PRIVATE_REPOS in CI fails closed'  GITHUB_ACTIONS=true GUARD_PRIVATE_REPOS=' , '
guardcfg 0 'unset GUARD_PRIVATE_REPOS locally skips the rule'

# Invoked directly, not through expect(): expect() always materializes a file, so
# it cannot reach these paths. A gate that returns "OK" when it was handed nothing
# to scan is the failure mode this whole file exists to prevent.
for case in "no argument at all::" "nonexistent path::$TMP/does-not-exist.txt"; do
  name="${case%%::*}"; arg="${case##*::}"
  if [[ -n "$arg" ]]; then bash "$SCRIPT" "$arg" >/dev/null 2>&1; else bash "$SCRIPT" >/dev/null 2>&1; fi
  rc=$?
  if [[ "$rc" == 2 ]]; then
    PASS=$((PASS+1)); printf '  ok   %s → exit 2 (fails closed)\n' "$name"
  else
    FAIL=$((FAIL+1)); printf '  FAIL %s — want exit 2, got %s\n' "$name" "$rc"
  fi
done

echo "  ---"
if (( FAIL > 0 )); then
  echo "  $PASS passed, $FAIL FAILED"; exit 1
fi
echo "  $PASS passed, 0 failed"

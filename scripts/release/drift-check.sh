#!/usr/bin/env bash
# scripts/release/drift-check.sh
#
# Codified GA release-integrity check for @wave-av/sdk. Compares independent
# sources of truth and fails loud on any disagreement. Used by
# .github/workflows/release-drift.yml (push to main / daily schedule /
# workflow_dispatch) and safe to run locally against the live registry.
#
# Checks:
#   1. latest stable sdk-v* git tag (excludes -next.* prereleases)
#   2. package.json version in the current checkout (defaults to the working
#      tree; pass --ref <ref> to check a specific ref's committed package.json
#      instead, e.g. origin/main)
#   3. npm registry.npmjs.org dist-tag "latest" version for @wave-av/sdk
#      (explicitly pinned to registry.npmjs.org — never a scoped-registry
#      override such as a GitHub Packages mirror)
#   4. existence of a GitHub Release for that latest tag (gh release view)
#   5. presence of a provenance attestation on the published npm version
#
# Exit 0 = everything in sync.
# Exit 1 = drift detected (any of the above disagree, or provenance missing).
# Exit 2 = a source could not be read at all (network/auth/gh failure). NEVER
#          exit 0 or "looks fine" when a source was unreadable — an outage must
#          never be reported as "in sync".
set -euo pipefail

PKG="@wave-av/sdk"
REPO="wave-av/sdk"
REGISTRY="https://registry.npmjs.org"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REF=""

while [ $# -gt 0 ]; do
  case "$1" in
    --ref)
      REF="${2:?--ref requires a value}"
      shift 2
      ;;
    *)
      echo "::error::unknown argument '$1'" >&2
      exit 2
      ;;
  esac
done

STATUS=0
say() { echo "[drift-check] $*"; }
warn_drift() { echo "[drift-check] DRIFT: $*"; STATUS=1; }
fail_unreadable() { echo "[drift-check] UNREADABLE: $*" >&2; exit 2; }

# --- 1. latest stable sdk-v* tag -----------------------------------------------------
git -C "$ROOT" fetch --tags --quiet origin >/dev/null 2>&1 || true
LATEST_TAG="$(git -C "$ROOT" tag -l 'sdk-v*' | grep -vE -- '-next\.' | sort -V | tail -n1 || true)"
if [ -z "$LATEST_TAG" ]; then
  fail_unreadable "no stable sdk-v* tags found in local git repo — run 'git fetch --tags' first"
fi
TAG_VERSION="${LATEST_TAG#sdk-v}"
say "latest stable tag: $LATEST_TAG (version $TAG_VERSION)"

# --- 2. package.json version -----------------------------------------------------------
if [ -n "$REF" ]; then
  PKG_JSON_VERSION="$(git -C "$ROOT" show "${REF}:package.json" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).version))")"
  say "package.json version at $REF: $PKG_JSON_VERSION"
else
  PKG_JSON_VERSION="$(node -p "require('$ROOT/package.json').version")"
  say "package.json version (working tree): $PKG_JSON_VERSION"
fi
if [ "$PKG_JSON_VERSION" != "$TAG_VERSION" ]; then
  warn_drift "package.json version ($PKG_JSON_VERSION) != latest tag version ($TAG_VERSION)"
fi

# --- 3. npm dist-tag latest -------------------------------------------------------------
NPM_ERR="$(mktemp)"
if NPM_LATEST="$(npm view "$PKG" version --registry="$REGISTRY" --@wave-av:registry="$REGISTRY" 2>"$NPM_ERR")"; then
  say "npm registry (registry.npmjs.org) dist-tag latest: $NPM_LATEST"
else
  ERR_BODY="$(cat "$NPM_ERR")"
  rm -f "$NPM_ERR"
  fail_unreadable "npm view $PKG failed: $ERR_BODY"
fi
rm -f "$NPM_ERR"

if [ "$NPM_LATEST" != "$TAG_VERSION" ]; then
  warn_drift "npm latest ($NPM_LATEST) != latest tag version ($TAG_VERSION)"
fi

# --- 4. GitHub Release for the latest tag ------------------------------------------------
if ! command -v gh >/dev/null 2>&1; then
  fail_unreadable "gh CLI not available — cannot verify GitHub Release existence"
fi
GH_ERR="$(mktemp)"
if gh release view "$LATEST_TAG" --repo "$REPO" >/dev/null 2>"$GH_ERR"; then
  say "GitHub Release exists for $LATEST_TAG"
else
  GH_ERR_BODY="$(cat "$GH_ERR")"
  rm -f "$GH_ERR"
  if echo "$GH_ERR_BODY" | grep -qi "release not found\|not found"; then
    warn_drift "no GitHub Release exists for $LATEST_TAG"
  else
    fail_unreadable "gh release view $LATEST_TAG failed: $GH_ERR_BODY"
  fi
fi
[ -f "$GH_ERR" ] && rm -f "$GH_ERR"

# --- 5. provenance attestation on the published npm version -------------------------------
ATT_FILE="$(mktemp)"
CURL_ERR="$(mktemp)"
if curl -fsS "${REGISTRY}/@wave-av%2Fsdk/${NPM_LATEST}" >"$ATT_FILE" 2>"$CURL_ERR"; then
  if node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));process.exit(j.dist && j.dist.attestations && j.dist.attestations.provenance ? 0 : 1);" "$ATT_FILE"; then
    say "provenance attestation present for ${PKG}@${NPM_LATEST}"
  else
    warn_drift "no provenance attestation found for ${PKG}@${NPM_LATEST}"
  fi
else
  CURL_ERR_BODY="$(cat "$CURL_ERR")"
  rm -f "$ATT_FILE" "$CURL_ERR"
  fail_unreadable "could not read npm registry metadata for ${PKG}@${NPM_LATEST}: $CURL_ERR_BODY"
fi
rm -f "$ATT_FILE" "$CURL_ERR"

if [ "$STATUS" -eq 0 ]; then
  say "IN SYNC: tag=$LATEST_TAG package.json=$PKG_JSON_VERSION npm-latest=$NPM_LATEST release=present provenance=present"
else
  say "DRIFT DETECTED — see DRIFT lines above"
fi

exit "$STATUS"

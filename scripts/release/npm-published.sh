#!/usr/bin/env bash
# scripts/release/npm-published.sh <version>
#
# Checks whether @wave-av/sdk@<version> already exists on the REAL npm registry
# (registry.npmjs.org — explicitly, both as the default registry AND as the
# @wave-av scope override). This explicit double-pin matters: a machine or CI
# runner with a scoped `@wave-av:registry` pointed at a different registry (e.g.
# GitHub Packages) would otherwise silently query the wrong registry and report
# a false "not published", causing a duplicate/failed publish attempt.
#
# Exit 0 = already published (safe to SKIP `npm publish` — idempotent backfill).
# Exit 1 = not published (proceed to publish).
# Exit 2 = registry unreadable (network/auth/5xx) — NEVER treat this as "not
#          published"; the caller must fail loud rather than guess.
set -euo pipefail

VERSION="${1:?usage: npm-published.sh <version>}"
PKG="@wave-av/sdk"
REGISTRY="https://registry.npmjs.org"

ERR_FILE="$(mktemp)"
trap 'rm -f "$ERR_FILE"' EXIT

if OUT="$(npm view "${PKG}@${VERSION}" version \
    --registry="$REGISTRY" \
    --@wave-av:registry="$REGISTRY" \
    --json 2>"$ERR_FILE")"; then
  if [ -n "$OUT" ]; then
    echo "PUBLISHED: ${PKG}@${VERSION} already exists on ${REGISTRY}"
    exit 0
  fi
fi

ERR="$(cat "$ERR_FILE")"

if echo "$ERR" | grep -q "E404"; then
  echo "NOT PUBLISHED: ${PKG}@${VERSION} not found on ${REGISTRY} (404)"
  exit 1
fi

echo "::error::registry unreadable while checking ${PKG}@${VERSION} — refusing to guess" >&2
echo "$ERR" >&2
exit 2

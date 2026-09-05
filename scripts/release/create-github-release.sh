#!/usr/bin/env bash
# scripts/release/create-github-release.sh <sdk-vX.Y.Z tag>
#
# Idempotently ensures a GitHub Release exists for <tag>: creates it with
# generated notes + the packed npm tarball if missing, or re-uploads the
# tarball (--clobber) if the release already exists. Never fails just because
# the release is already there — the same command must succeed on a fresh tag
# push AND on a `workflow_dispatch` backfill replay of an old tag.
#
# Requires: gh CLI authenticated (GH_TOKEN env), run from the package root with
# the tag's tree checked out and `dist/` already built.
set -euo pipefail

TAG="${1:?usage: create-github-release.sh <sdk-vX.Y.Z tag>}"
REPO="${GH_REPO:-wave-av/sdk}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if [[ ! "$TAG" =~ ^sdk-v[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.]+)?$ ]]; then
  echo "::error::refusing to create a release for tag '$TAG' — expected sdk-v<semver>" >&2
  exit 1
fi

cd "$ROOT"

TARBALL="$(npm pack --silent | tail -n1)"
echo "packed: $TARBALL"

if gh release view "$TAG" --repo "$REPO" >/dev/null 2>&1; then
  echo "release $TAG already exists — uploading tarball (idempotent path, --clobber)"
  gh release upload "$TAG" "$TARBALL" --repo "$REPO" --clobber
else
  echo "release $TAG does not exist — creating with generated notes"
  gh release create "$TAG" "$TARBALL" \
    --repo "$REPO" \
    --title "$TAG" \
    --generate-notes
fi

echo "verifying the release exists and carries the tarball"
ASSETS="$(gh release view "$TAG" --repo "$REPO" --json assets --jq '[.assets[].name] | join(" ")')"
echo "release assets: $ASSETS"
case "$ASSETS" in
  *"$TARBALL"*) ;;
  *)
    echo "::error::$TARBALL missing from release $TAG after upload" >&2
    exit 1
    ;;
esac

echo "VER-001: GitHub Release for $TAG exists and carries the packed tarball."

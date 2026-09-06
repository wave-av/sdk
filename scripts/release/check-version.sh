#!/usr/bin/env bash
# scripts/release/check-version.sh <sdk-vX.Y.Z tag>
#
# Asserts that package.json's "version" matches the semver embedded in an `sdk-v*`
# tag. Used by release.yml's `verify` job (and re-used by `publish` for
# defense-in-depth) so a tag/package.json mismatch is caught BEFORE anything is
# built, tested, or published — one codified check, not four hand-written copies
# that can drift from each other.
#
# Exit 0 = match. Exit 1 = bad tag shape or version mismatch. Fails loud — never
# a silent pass.
set -euo pipefail

TAG="${1:?usage: check-version.sh <sdk-vX.Y.Z tag>}"
# Package root: defaults to this script's own repo (dirname-relative — correct
# when the script runs from its normal in-tree location, e.g. local dev). CI
# overrides this via $RELEASE_PKG_ROOT when the script has been checked out to
# a SEPARATE path from the package code it's asserting against — see
# release.yml's ".release-tooling" checkout (backfilling a pre-#121 tag whose
# tree predates this script: the tag's checkout has the package.json, this
# script is pinned to the workflow's own ref instead).
ROOT="${RELEASE_PKG_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"

if [[ ! "$TAG" =~ ^sdk-v[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.]+)?$ ]]; then
  echo "::error::tag '$TAG' does not match the required 'sdk-v<semver>' pattern" >&2
  exit 1
fi

TAG_VERSION="${TAG#sdk-v}"
PKG_VERSION="$(node -p "require('$ROOT/package.json').version")"

echo "tag=$TAG tag-version=$TAG_VERSION package.json-version=$PKG_VERSION"

if [ "$TAG_VERSION" != "$PKG_VERSION" ]; then
  echo "::error::tag $TAG implies version $TAG_VERSION but package.json is $PKG_VERSION — refusing to proceed" >&2
  exit 1
fi

echo "OK: tag version matches package.json version ($PKG_VERSION)"

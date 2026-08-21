#!/usr/bin/env bash
# WAVE public-repo BODY policy — the internal-leak gate for PR/issue/comment text.
#
# Companion to content-policy.sh. That script scans the published working TREE;
# this one scans the other half of a public repo's surface: pull-request titles
# and bodies, issue bodies, and comment bodies. Those are equally world-readable
# and, until this script existed, were scanned by NOTHING server-side. That gap
# was not theoretical — a PR was merged whose wrangler.toml was correctly BLOCKED
# for naming a private repo while the PR body named the same repo, with more
# operational detail attached, and sailed through.
#
# Usage: scripts/public-repo-guard/body-policy.sh <file>
#   <file> holds the untrusted text, already materialized to disk. It is passed as
#   a PATH and only ever read — the body is never interpolated into a command line
#   or an environment variable, so no amount of shell metacharacters in a PR body
#   can influence what runs here.
#
# Exit: 0 clean · 1 blocking violation · 2 scanner error (fail closed).
#
# Allowlisting: a line carrying `guard:allow <reason>` is exempt (an accidental
# leak never carries the marker; a deliberate one is visible in a public diff), as
# is any line matching the ABOUT-THE-CONTROL allowlist below. EXCEPTION: rules
# declared `--no-exempt` (the credential formats) ignore both allowlists — a real
# secret is never legitimate in prose, so no marker or discussion context can
# make publishing one acceptable.
set -uo pipefail

FILE="${1:-}"
[[ -n "$FILE" && -f "$FILE" ]] || { echo "::error::body-policy: usage: body-policy.sh <file>"; exit 2; }
command -v rg >/dev/null 2>&1 || { echo "::error::body-policy: ripgrep (rg) required"; exit 2; }

VIOLATIONS=0

# Lines that TALK ABOUT the control rather than leaking through it. Without this,
# the gate blocks its own pull requests and every security discussion — the
# self-referential trap that gets a gate switched off. Ported verbatim in intent
# from the client-side gate's allowlist, which was built for exactly this.
ABOUT_THE_CONTROL='(public-repo-guard|body-policy|content-policy|public-github-write-gate|\bNDA\s+(gate|guard|policy|denylist|sweep|scan|hook)\b|\bno\s+NDA\b|responsib\w*\s+disclos|SECURITY\.md)'

# check [--no-exempt] <BLOCK|WARN> <name> <regex> <why>
#   --no-exempt: skip the guard:allow / ABOUT_THE_CONTROL line exemptions. For
#   credential formats: a live key is a leak even on a line that names this gate
#   or carries an allow marker, so no line-level context may suppress the hit.
check() {
  local exempt=1
  [[ "$1" == "--no-exempt" ]] && { exempt=0; shift; }
  local sev="$1" name="$2" re="$3" why="$4"
  [[ -z "$re" ]] && { echo "::error::body-policy: internal bug — empty regex for rule '$name'"; exit 2; }
  # rg exit: 0=match, 1=no match, >=2=real error → FAIL CLOSED. A gate that passes
  # because its scanner broke is worse than no gate: it reports success.
  local raw rc
  raw="$(rg -nP --no-filename -- "$re" "$FILE" 2>/dev/null)"; rc=$?
  if (( rc >= 2 )); then
    echo "::error title=public-repo-guard ($name)::ripgrep failed (exit $rc) scanning rule '$name' — failing closed."
    exit 2
  fi
  # Filter with rg, not grep: BSD/macOS grep has no -P, so a `grep -P` allowlist
  # silently errors out locally while working on GNU/CI — the gate would then
  # disagree with itself depending on where it ran. rg is already required above.
  # Each filter's exit code is checked the same way as the primary scan: 1 (all
  # lines filtered) is a clean result, but >=2 is a scanner error and FAILS
  # CLOSED — a swallowed filter error would empty `matches` and pass the rule.
  local matches
  if (( exempt )); then
    matches="$(printf '%s' "$raw" | rg -vN -- 'guard:allow[[:space:]]+[^[:space:]]')"; rc=$?
    if (( rc >= 2 )); then
      echo "::error title=public-repo-guard ($name)::ripgrep failed (exit $rc) applying the guard:allow exemption for rule '$name' — failing closed."
      exit 2
    fi
    matches="$(printf '%s' "$matches" | rg -vNiP -- "$ABOUT_THE_CONTROL")"; rc=$?
    if (( rc >= 2 )); then
      echo "::error title=public-repo-guard ($name)::ripgrep failed (exit $rc) applying the about-the-control exemption for rule '$name' — failing closed."
      exit 2
    fi
  else
    matches="$raw"
  fi
  [[ -z "$matches" ]] && return 0
  local count; count="$(printf '%s\n' "$matches" | grep -c '')"
  # Print the LINE NUMBER only — never the matched text. This annotation is itself
  # world-readable, so echoing the hit would re-publish the very thing we caught.
  echo "::group::[$sev] $name — $why"
  printf '%s\n' "$matches" | sed -E 's/^([0-9]+):.*/  line \1: «match redacted — view the body to see it»/'
  echo "::endgroup::"
  if [[ "$sev" == "BLOCK" ]]; then
    echo "::error title=public-repo-guard ($name)::$why — $count occurrence(s) in the title/body. Edit the body to remove it, then re-run."
    VIOLATIONS=$((VIOLATIONS+1))
  else
    echo "::warning title=public-repo-guard ($name)::$why — $count occurrence(s) (non-blocking; review)."
  fi
}

# --- Credential formats — never legitimate in prose --------------------------
# --no-exempt: these formats match REAL secrets, not discussion of secrets, so
# neither `guard:allow` nor talking about the control may suppress a hit. If a
# doc genuinely needs a key-shaped example, truncate it below the rule's floor.
check --no-exempt BLOCK stripe-live-key  '(sk|rk)_live_[A-Za-z0-9]{16,}'                 'Live Stripe secret/restricted key'
check --no-exempt BLOCK stripe-account   'acct_[A-Za-z0-9]{16,}'                         'Live Stripe account ID — financial infra, never publish'
check --no-exempt BLOCK anthropic-key    'sk-ant-(api|admin)[0-9]{2}-[A-Za-z0-9_-]{20,}' 'Real Anthropic API/admin key'
check --no-exempt BLOCK github-pat       'github_pat_[A-Za-z0-9_]{30,}'                  'GitHub fine-grained PAT'
check --no-exempt BLOCK supabase-pat     'sbp_[a-f0-9]{40}'                              'Supabase personal access token'
check --no-exempt BLOCK aws-akid         'AKIA[0-9A-Z]{16}'                              'AWS access key ID'
check --no-exempt BLOCK private-key      '-----BEGIN [A-Z ]*PRIVATE KEY-----'            'Embedded private key material'

# --- Infrastructure identifiers ----------------------------------------------
# shellcheck disable=SC2016  # $CLOUDFLARE_ACCOUNT_ID is literal guidance text
check BLOCK cf-account-id    'account_id\s*[:=]\s*["'"'"']?[0-9a-f]{32}'      'Hardcoded Cloudflare account_id — reference the env var instead'
check BLOCK internal-ip      '100\.(6[4-9]|[7-9][0-9]|1[01][0-9]|12[0-7])\.[0-9]{1,3}\.[0-9]{1,3}'  'Internal Tailscale-CGNAT IP (100.64.0.0/10) — internal fleet address'
# shellcheck disable=SC2016  # $HOME is literal guidance text
check BLOCK abs-user-path    '/(Users|home)/(?!runner/)[a-z][a-z0-9._-]+/'    'Operator absolute home path — leaks identity and local layout'

# --- Self-identified internal material ---------------------------------------
# USE vs MENTION. A body that SAYS "internal-only" is leaking; a body that QUOTES
# the phrase is describing a policy — including this one. The lookarounds exempt a
# marker wrapped in straight, smart, or backtick quotes.
#
# Not hypothetical: the first run of this job failed on its own pull request,
# because a review bot had edited the PR body to summarize the change and its
# summary quoted the phrase verbatim. The line-level allowlist could not help —
# that line named no gate. Only use-vs-mention separates the two.
#
# A quoted marker is also a trivial bypass, and that is an accepted trade. The
# threat here is the ACCIDENTAL paste; a deliberate evader has easier routes, and
# `guard:allow <reason>` already exists as the honest, visible one.
check BLOCK internal-marker  '(?<![“"'"'"'`])\b(internal[- ]only|do\s+not\s+(share|publish|distribute)|for\s+internal\s+use)\b(?![”"'"'"'`])' 'Text self-identifies as not-for-public'

# --- Private repo + operational detail (PROXIMITY, not bare name) ------------
# The BODY profile deliberately DIVERGES from the FILE profile here, and the
# divergence is the whole design. content-policy.sh blocks a bare private-repo
# name outright, which is right for a checked-in file. Applying that to bodies
# would be unusable: a sweep of public issues found 134 LEGITIMATE cross-repo
# references ("companion to <private-repo>#260"). A gate that fires on all of
# those gets switched off, and then it protects nothing.
#
# So a bare mention stays silent. What fires is a private repo name within ~140
# characters of INTERNAL OPERATIONAL DETAIL — a SCREAMING_CASE credential NAME, a
# secret-binding verb, a service binding, or a secret COUNT. That is the topology
# of what is wired to what, and it is the shape that actually leaked.
#
# Names are NOT hardcoded (this file is public); CI injects them via the
# GUARD_PRIVATE_REPOS variable. This is the one rule whose existence depends on
# configuration, so its absence is graded by WHERE the script runs: unset locally
# → skipped (developers cannot know the org's private-repo list, and a hook that
# demands org secrets to run at all gets bypassed); unset or empty IN CI → exit 2.
# Everything else in this file fails closed, and the headline rule must not be
# the exception: a mis-typed or unset vars.GUARD_PRIVATE_REPOS would otherwise
# turn the gate into a green rubber stamp that enforces nothing.
OPS_DETAIL='(?:[A-Z][A-Z0-9]*_(?:SECRET|TOKEN|KEY|PASSWORD)|wrangler\s+secret|secret\s+(?:is\s+)?(?:bound|binding|list)|(?:is\s+)?bound\s+on|service\s+binding|\d{2,}\s+secrets)'
_ALT=''
if [[ -n "${GUARD_PRIVATE_REPOS:-}" ]]; then
  IFS=', ' read -r -a _PRIV <<< "$GUARD_PRIVATE_REPOS"
  for _name in "${_PRIV[@]}"; do
    [[ -z "$_name" ]] && continue
    # Regex-escape so metacharacters in a name match literally.
    _esc="$(printf '%s' "$_name" | sed -E 's/[][(){}.^$*+?|\\]/\\&/g')"
    _ALT="${_ALT:+$_ALT|}${_esc}"
  done
fi
if [[ -n "$_ALT" ]]; then
  # Both orders: name-then-detail and detail-then-name. Case-insensitivity is
  # scoped to the repo-name alternation with (?i:...) — a leading (?i) would
  # spill across the whole pattern and make the deliberately SCREAMING_CASE-only
  # OPS_DETAIL match everyday prose like `api_key`.
  #
  # No \b brackets OPS_DETAIL in either direction. Its credential alternative
  # cannot span an underscore, so inside a multi-part name like WAVE_API_TOKEN
  # the only sub-match (API_TOKEN) sits after `_`, a word character, and a
  # leading \b silently killed the name-first direction for exactly those
  # names. The alternation's own anchors ([A-Z] start, keyword tail) already
  # bound what it can touch, and the detail-then-name direction never had one.
  check BLOCK private-repo-ops \
    "\\b(?i:${_ALT})\\b[^\\n]{0,140}?${OPS_DETAIL}|${OPS_DETAIL}[^\\n]{0,140}?\\b(?i:${_ALT})\\b" \
    'A private WAVE repo named alongside internal operational detail (credential name, secret binding, or secret count) — the wiring topology is not public'
elif [[ "${GITHUB_ACTIONS:-}" == "true" ]]; then
  echo "::error title=public-repo-guard (private-repo-ops)::GUARD_PRIVATE_REPOS resolved empty in CI — the private-repo proximity rule would silently not run. Set the org/repo Actions variable vars.GUARD_PRIVATE_REPOS; failing closed rather than reporting a pass that enforces nothing."
  exit 2
fi

if (( VIOLATIONS > 0 )); then
  echo "::error::public-repo-guard: $VIOLATIONS blocking body-policy violation(s) — see annotations above."
  exit 1
fi
echo "public-repo-guard: body policy OK"

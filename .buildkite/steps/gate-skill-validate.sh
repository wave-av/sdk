#!/usr/bin/env bash
# Step `gate-skill-validate`: shadow-ports the required GitHub context "gate / skill-validate" — job
# `skill-validate` in .github/workflows/_checks.yml. Validates every tracked *SKILL.md's frontmatter
# (name == directory name, non-empty description, no empty allowed-tools/hooks, no duplicate frontmatter
# keys). Auto-discovers *SKILL.md; a no-op pass if the repo has none. The `git ls-files` call and the
# inline python3 validator are copied BYTE-FOR-BYTE from _checks.yml.
#
# Would post as buildkite/<pipeline-slug>/gate-skill-validate (shadow mode; GitHub's
# "gate / skill-validate" stays the required context until an operator swaps it — see
# .buildkite/README.md).
set -euo pipefail
# shellcheck source-path=SCRIPTDIR source=../lib/common.sh
source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

cd "$BK_REPO_ROOT"
bk_refuse_doppler
bk_require_tools python3 git

bk_section "pip install pyyaml"
python3 -m pip install --quiet --disable-pip-version-check pyyaml

# Verbatim from _checks.yml, step "Skill frontmatter gate".
bk_gate "Skill frontmatter gate" python3 - <<'PY'
import sys, os, re, subprocess
import yaml
allf = subprocess.run(["git","ls-files","*SKILL.md"], capture_output=True, text=True).stdout.splitlines()
# Only validate invocable skills; skip nested reference/vendored SKILL.md.
skip = ("/references/", "/_external/", "/_consolidated", "/_archived", "/node_modules/", "/dist/")
files = [f for f in allf if not any(s in "/" + f for s in skip)]
if not files:
    print("no SKILL.md in repo — skill gate is a no-op"); sys.exit(0)
errs = []
for p in files:
    d = os.path.basename(os.path.dirname(p))
    t = open(p, encoding="utf-8", errors="replace").read()
    m = re.match(r"^---\s*\n(.*?)\n---", t, re.S)
    if not m:
        errs.append(f"{p}: no frontmatter block"); continue
    fm = m.group(1)
    seen, dup = set(), set()
    for line in fm.split("\n"):
        k = re.match(r"^([A-Za-z_][\w-]*):", line)
        if k: (dup if k.group(1) in seen else seen).add(k.group(1))
    if dup: errs.append(f"{p}: duplicate frontmatter keys: {', '.join(sorted(dup))}")
    try:
        data = yaml.safe_load(fm) or {}
    except yaml.YAMLError as e:
        errs.append(f"{p}: invalid YAML frontmatter: {e}"); continue
    if not isinstance(data, dict):
        errs.append(f"{p}: frontmatter is not a mapping"); continue
    if data.get("name") != d:
        errs.append(f"{p}: name '{data.get('name')}' != directory '{d}'")
    if not str(data.get("description") or "").strip():
        errs.append(f"{p}: missing/empty description")
    for key in ("allowed-tools", "hooks"):
        if key in data:
            v = data[key]
            if v is None or (isinstance(v, (list, dict, str)) and len(v) == 0):
                errs.append(f"{p}: '{key}' present but EMPTY")
for e in errs:
    print(f"::error::{e}")
print(f"validated {len(files)} skills — {len(errs)} errors")
sys.exit(1 if errs else 0)
PY

bk_gates_summary

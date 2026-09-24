#!/bin/bash
# checkout-gate.sh REPO_ROOT PREP_DIR [ALLOWED_ROOT ...]  (peer #15-REV D15-1,
# #16 follow-ups): end-of-job checkout immutability gate, fail closed.
# (a) tracked/staged modifications -> E_CHECKOUT_MUTATED 97.
# (b) every untracked path must sit under the exact per-lane allowlist of
#     ceremony output roots (full repo-relative) - anything else named, 97.
#     Untracked paths are read NUL-delimited (-z): no quoting surprises.
#     Symlinks under allowed roots are rejected (K2 alignment) - nothing may
#     link the output roots elsewhere.
# (c) a surviving PREP_DIR (throwaway keys) -> E_PREP_LEFT_BEHIND 98.
# No .gitignore anywhere: the gate must SEE what the run left behind.
set -eEuo pipefail
[ $# -ge 2 ] || { echo "E_GATE_USAGE checkout-gate.sh REPO_ROOT PREP_DIR [ALLOWED_ROOT ...]" >&2; exit 97; }
ROOT=$1; PREP=$2; shift 2
cd "$ROOT"
git diff --quiet HEAD -- || { echo "E_CHECKOUT_MUTATED tracked file modified:" >&2; git diff --name-only HEAD -- >&2; exit 97; }
git diff --cached --quiet || { echo "E_CHECKOUT_MUTATED staged change present:" >&2; git diff --cached --name-only >&2; exit 97; }
[ ! -e "$PREP" ] || { echo "E_PREP_LEFT_BEHIND $PREP survives at job end (throwaway keys)" >&2; exit 98; }
bad=0
while IFS= read -r -d '' entry; do
  # B3: no blind slicing - only untracked "?? " entries may reach the allowlist
  case "$entry" in
    "?? "*) p=${entry:3} ;;
    *) echo "E_CHECKOUT_MUTATED unexpected git status entry: $entry" >&2; bad=1; continue ;;
  esac
  ok=0
  for allowed in "$@"; do
    # B2: exact root or a path BELOW it - never a sibling prefix
    case "$p" in "$allowed"|"$allowed/"*) ok=1; break ;; esac
  done
  [ "$ok" = "1" ] || { echo "E_CHECKOUT_MUTATED unexpected untracked path: $p" >&2; bad=1; }
done < <(git status --porcelain=v1 -z --untracked-files=all)
[ "$bad" = "0" ] || exit 97
for allowed in "$@"; do
  [ -d "$allowed" ] || continue
  _frc=0; link=$(find "$allowed" -type l -print -quit 2>/dev/null) || _frc=$?
  [ "$_frc" = "0" ] || { echo "E_CHECKOUT_SCAN find rc=$_frc under $allowed" >&2; exit 97; }
  [ -z "$link" ] || { echo "E_CHECKOUT_MUTATED symlink under allowed root: $link" >&2; exit 97; }
done

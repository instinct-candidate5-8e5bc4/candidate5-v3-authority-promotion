#!/bin/bash
# Checkout immutability gate (peer D15-1): runs as the LAST step of every
# checkout-bearing job (if: !cancelled()). ONE definition shared by every lane and
# by the scratch negative tests (which run it on COPIES, never the real checkout).
# Usage: checkout-gate.sh REPO_ROOT PREP_DIR [ALLOWED_UNTRACKED_ROOT ...]
#   (a) TRACKED: any tracked modification or staged change -> E_CHECKOUT_MUTATED 97.
#   (b) UNTRACKED: every ?? path must fall under an EXACT allowlist of ceremony
#       output roots given as full repo-relative paths - anything else (stray
#       files, __pycache__, *.pyc) -> E_CHECKOUT_MUTATED naming the path, 97.
#   (c) PREP_DIR surviving at job end -> E_PREP_LEFT_BEHIND 98 (throwaway keys).
# No .gitignore is added anywhere: the gate must SEE every path.
set -euo pipefail
[ "$#" -ge 2 ] || { echo "E_GATE_USAGE expected REPO_ROOT PREP_DIR [ALLOWED_ROOT ...]"; exit 97; }
ROOT="$1"; PREP="$2"; shift 2
cd "$ROOT"
git diff --quiet HEAD -- || { echo "E_CHECKOUT_MUTATED tracked file modified:"; git diff --name-only HEAD --; exit 97; }
git diff --cached --quiet || { echo "E_CHECKOUT_MUTATED staged change present:"; git diff --cached --name-only; exit 97; }
if [ -d "$PREP" ]; then
  echo "E_PREP_LEFT_BEHIND $PREP holds throwaway key material and must not survive the job"
  exit 98
fi
bad=0
while IFS= read -r p; do
  [ -n "$p" ] || continue
  ok=0
  for a in "$@"; do
    case "$p" in
      "$a"|"$a/"*) ok=1; break ;;
    esac
  done
  if [ "$ok" = "0" ]; then
    echo "E_CHECKOUT_MUTATED unexpected untracked path: $p"
    bad=1
  fi
done < <(git status --porcelain --untracked-files=all | sed -n 's/^?? //p')
[ "$bad" = "0" ] || exit 97
echo "checkout immutability OK: tracked clean, untracked only under the allowed ceremony roots ($# root(s))"

#!/bin/bash
# resolve-lane-path.sh PATH PREFIX (peer #16 D15-2): the ONE place holding the
# canonical committed-config /tmp prefix literal. Maps a config-canonical path
# to the caller's lane. Idempotent for already-lane paths; anything else fails
# closed. Shared scripts call this; workflows never carry the literal.
set -eEuo pipefail
CANON=/tmp/NON_CERTIFYING_REHEARSAL-
[ $# -eq 2 ] || { echo "E_LANE_PATH_USAGE resolve-lane-path.sh PATH PREFIX" >&2; exit 97; }
P=$1; PREFIX=$2
case "$PREFIX" in NON_CERTIFYING_*) ;; *) echo "E_LANE_PATH bad lane prefix: $PREFIX" >&2; exit 97;; esac
case "$P" in
  "$CANON"*) OUT="/tmp/$PREFIX-${P#$CANON}" ;;
  "/tmp/$PREFIX-"*) OUT="$P" ;;
  *) echo "E_LANE_PATH_NOT_CANON $P" >&2; exit 97 ;;
esac
case "$OUT" in
  "/tmp/$PREFIX-"*) printf '%s\n' "$OUT" ;;
  *) echo "E_LANE_PATH resolved path escapes lane: $OUT" >&2; exit 97 ;;
esac

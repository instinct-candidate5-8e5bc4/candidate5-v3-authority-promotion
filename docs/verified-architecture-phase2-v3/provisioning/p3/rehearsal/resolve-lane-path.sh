#!/bin/bash
# resolve-lane-path.sh PATH PREFIX (peer #16 D15-2; #18 F1: thin caller over lane_resolve.py,
# the SINGLE resolver definition - component-wise mapping for canonical absolute /tmp lane
# paths, fail-closed everywhere else). Interface, stdout contract, and named codes unchanged;
# shared scripts call this; workflows never carry the canonical literal.
set -eEuo pipefail
[ $# -eq 2 ] || { echo "E_LANE_PATH_USAGE resolve-lane-path.sh PATH PREFIX" >&2; exit 97; }
exec python3 "$(cd "$(dirname "$0")" && pwd)/lane_resolve.py" resolve "$1" "$2"

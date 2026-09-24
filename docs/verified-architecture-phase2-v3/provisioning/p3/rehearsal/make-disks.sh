#!/bin/bash
# NON_CERTIFYING_REHEARSAL v3 disk set: six deterministic zeroed 1 MiB raw disks with
# honest virtio serials. The adapter exits 98 (E_PROVIDER_NAMESPACE / E_PROVIDER_LINK_MISSING)
# before any v3 device is used; these disks exist to prove that v3-named virtio devices
# do NOT satisfy the google- provider namespace on non-Google hardware.
# usage: make-disks.sh <fresh_disk_dir>
set -eEuo pipefail
# peer run-11: every otherwise-bare bash failure is NAMED (script/line/rc/command), exit 97.
trap '_rc=$?; echo "E_BASH_ERRTRAP make-disks.sh line $LINENO rc=$_rc cmd: $BASH_COMMAND" >&2; exit 97' ERR
D=${1:?usage: make-disks.sh <fresh_disk_dir>}
[ -e "$D" ] && { echo "E_DIR_EXISTS"; exit 1; }
mkdir -p "$D"
for i in 0 1 2 3 4 5; do truncate -s 1048576 "$D/disk$i.raw"; done
sha256sum "$D"/disk*.raw

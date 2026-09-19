#!/bin/sh
# Deterministic early-init realization of the pinned GCE SCSI rule.
set -eu
BB=/bin/busybox
SCSI=/sbin/scsi_id
OUT=/dev/disk/by-id
"$BB" mkdir -p "$OUT"
for dev in /dev/sd* /dev/vd*; do
 [ -b "$dev" ] || continue
 case "$dev" in *[0-9]) continue;; esac
 export=$($SCSI --export --whitelisted -d "$dev") || continue
 vendor= serial=
 vendor=$("$BB" printf '%s\n' "$export" | "$BB" sed -n 's/^ID_VENDOR=//p')
 serial=$("$BB" printf '%s\n' "$export" | "$BB" sed -n 's/^ID_SERIAL_SHORT=//p')
 [ "$vendor" = Google ] || continue
 case "$serial" in v3-rootfs-data|v3-rootfs-hash|v3-reviewed-root|v3-reviewed-input|v3-reviewed-output|v3-reviewed-evidence) :;; v3-*) "$BB" echo E_EXTRA_MANAGED_DEVICE >&2; exit 97;; *) continue;; esac
 link="$OUT/google-$serial"
 [ ! -e "$link" ] && [ ! -L "$link" ] || { "$BB" echo E_DUPLICATE_PROVIDER_ID >&2; exit 97; }
 "$BB" ln -s "$dev" "$link" || exit 97
done

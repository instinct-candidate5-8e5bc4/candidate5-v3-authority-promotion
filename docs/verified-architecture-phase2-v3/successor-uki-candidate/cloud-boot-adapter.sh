#!/bin/sh
# Candidate bytes only. Not authorized for production execution or boot.
set -eu
BB=/bin/busybox
fail() { "$BB" echo "$1" >&2; exit 98; }
OLD_INIT_SHA256=dd2a9125ad93defb945948ff30e75a7de4f2e9ab285a418cf0be81314fbbc955
EXPECTED='v3-rootfs-data v3-rootfs-hash v3-reviewed-root v3-reviewed-input v3-reviewed-output v3-reviewed-evidence'
BYID=/dev/disk/by-id
[ -d /proc ] || "$BB" mkdir -m 0555 /proc
[ -d /sys ] || "$BB" mkdir -m 0555 /sys
[ -d /dev ] || "$BB" mkdir -m 0755 /dev
[ -r /proc/mounts ] || "$BB" mount -t proc -o nosuid,nodev,noexec proc /proc || fail E_PROC_MOUNT
"$BB" grep -q ' /sys sysfs ' /proc/mounts || "$BB" mount -t sysfs -o nosuid,nodev,noexec,ro sysfs /sys || fail E_SYS_MOUNT
"$BB" grep -q ' /dev devtmpfs ' /proc/mounts || "$BB" mount -t devtmpfs -o nosuid devtmpfs /dev || fail E_DEV_MOUNT
/bin/sh /bin/gce-by-id-producer || fail E_PROVIDER_NAMESPACE
resolve() {
 want=$1; link="$BYID/google-$want"
 [ -L "$link" ] || fail E_PROVIDER_LINK_MISSING
 target=$("$BB" readlink -f "$link") || fail E_PROVIDER_LINK_RESOLVE
 case "$target" in /dev/*) :;; *) fail E_PROVIDER_LINK_TARGET;; esac
 [ -b "$target" ] || fail E_DEVICE_NODE
 [ "$link" -ef "$target" ] || fail E_PROVIDER_LINK_SUBSTITUTION
 "$BB" printf '%s' "$target"
}
for link in "$BYID"/google-v3-*; do
 [ -e "$link" ] || [ -L "$link" ] || continue
 [ -L "$link" ] || fail E_PROVIDER_LINK_SUBSTITUTION
 name=${link##*/}; name=${name#google-}
 case " $EXPECTED " in *" $name "*) :;; *) fail E_EXTRA_MANAGED_DEVICE;; esac
done
DATA=$(resolve v3-rootfs-data); HASH=$(resolve v3-rootfs-hash)
REVIEWED_ROOT=$(resolve v3-reviewed-root); REVIEWED_INPUT=$(resolve v3-reviewed-input)
REVIEWED_OUTPUT=$(resolve v3-reviewed-output); REVIEWED_EVIDENCE=$(resolve v3-reviewed-evidence)
set -- "$DATA" "$HASH" "$REVIEWED_ROOT" "$REVIEWED_INPUT" "$REVIEWED_OUTPUT" "$REVIEWED_EVIDENCE"
for a in "$@"; do for b in "$@"; do [ "$a" = "$b" ] && continue; [ ! "$a" -ef "$b" ] || fail E_DEVICE_ALIAS; done; done
"$BB" ln -s "$DATA" /dev/v3-rootfs-data || fail E_DATA_ALIAS
"$BB" ln -s "$HASH" /dev/v3-rootfs-hash || fail E_HASH_ALIAS
for n in reviewed-root reviewed-input reviewed-output reviewed-evidence; do [ ! -e "/$n" ] || fail E_MOUNT_TARGET_EXISTS; "$BB" mkdir -m 0700 "/$n"; done
check_mount() {
 source=$1 target=$2 access=$3
 "$BB" awk -v s="$source" -v t="$target" -v a="$access" '
 function has(o,x,n,i,v){n=split(o,v,",");for(i=1;i<=n;i++)if(v[i]==x)return 1;return 0}
 $1==s&&$2==t&&$3=="ext4"{n++;o=$4}
 END{if(n!=1||!has(o,a)||!has(o,"nodev")||!has(o,"nosuid")||!has(o,"noexec")||has(o,"dev")||has(o,"suid")||has(o,"exec"))exit 1}' /proc/mounts || fail E_MOUNT_IDENTITY_OPTIONS
}
probe() {
 dev=$1 role=$2 target=$3 final=$4
 "$BB" mount -t ext4 -o ro,nodev,nosuid,noexec "$dev" "$target" || fail E_ROLE_PROBE_MOUNT
 check_mount "$dev" "$target" ro
 [ -f "$target/.v3-volume-role" ] || fail E_ROLE_MARKER_MISSING
 [ "$("$BB" cat "$target/.v3-volume-role")" = "$role" ] || fail E_ROLE_MARKER_MISMATCH
 if [ "$final" = rw ]; then "$BB" umount "$target" || fail E_ROLE_UNMOUNT; "$BB" mount -t ext4 -o rw,nodev,nosuid,noexec "$dev" "$target" || fail E_ROLE_RW_MOUNT; check_mount "$dev" "$target" rw; fi
}
probe "$REVIEWED_ROOT" reviewed-root /reviewed-root ro
probe "$REVIEWED_INPUT" reviewed-input /reviewed-input ro
probe "$REVIEWED_OUTPUT" reviewed-output /reviewed-output rw
probe "$REVIEWED_EVIDENCE" reviewed-evidence /reviewed-evidence rw
for n in reviewed-output reviewed-evidence; do "$BB" chown 0:0 "/$n"; "$BB" chmod 0700 "/$n"; done
[ "$("$BB" sha256sum /init.root-admitter | "$BB" cut -d' ' -f1)" = "$OLD_INIT_SHA256" ] || fail E_OLD_INIT_IDENTITY
{
 "$BB" printf '%s\n' 'schema=v3.cloud-boot-adapter-evidence.v2'
 "$BB" printf '%s\n' 'result=ADAPTER_ENVIRONMENT_READY'
 for role in v3-rootfs-data v3-rootfs-hash v3-reviewed-root v3-reviewed-input v3-reviewed-output v3-reviewed-evidence; do
  link="$BYID/google-$role"; target=$("$BB" readlink -f "$link") || fail E_EVIDENCE_IDENTITY
  mm=$("$BB" stat -c '%t:%T' "$target") || fail E_EVIDENCE_IDENTITY
  "$BB" printf 'device.%s=google-%s;%s\n' "$role" "$role" "$mm"
 done
 "$BB" printf 'oldInitSha256=%s\n' "$OLD_INIT_SHA256"
} > /reviewed-evidence/cloud-boot-adapter.v2 || fail E_EVIDENCE_WRITE
"$BB" sync /reviewed-evidence/cloud-boot-adapter.v2 2>/dev/null || "$BB" sync || fail E_EVIDENCE_SYNC
exec /init.root-admitter || fail E_OLD_INIT_EXEC

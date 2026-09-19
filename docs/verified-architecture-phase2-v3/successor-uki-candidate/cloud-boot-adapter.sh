#!/bin/sh
# Candidate bytes only. Not authorized for execution or boot.
set -eu
BB=/bin/busybox
fail() { "$BB" echo "$1" >&2; exit 98; }
OLD_INIT_SHA256=6f6b504525b8f4f87a36422e5cc48c570220f1103514a204c36f3d70a8f2663f
EXPECTED='v3-rootfs-data v3-rootfs-hash v3-reviewed-root v3-reviewed-input v3-reviewed-output v3-reviewed-evidence'
BYID=/dev/disk/by-id

resolve() {
 want=$1; link="$BYID/google-$want"
 [ -L "$link" ] || fail E_PROVIDER_LINK_MISSING
 target=$("$BB" readlink -f "$link") || fail E_PROVIDER_LINK_RESOLVE
 case "$target" in /dev/*) :;; *) fail E_PROVIDER_LINK_TARGET;; esac
 [ -b "$target" ] || fail E_DEVICE_NODE
 # The provider link itself and its fully resolved object must agree.
 [ "$link" -ef "$target" ] || fail E_PROVIDER_LINK_SUBSTITUTION
 "$BB" printf '%s' "$target"
}


# Reject extra provider-managed identities in the reserved v3 namespace.
for link in "$BYID"/google-v3-*; do
 [ -e "$link" ] || [ -L "$link" ] || continue
 [ -L "$link" ] || fail E_PROVIDER_LINK_SUBSTITUTION
 base=${link##*/}; name=${base#google-}
 case " $EXPECTED " in *" $name "*) :;; *) fail E_EXTRA_MANAGED_DEVICE;; esac
done

DATA=$(resolve v3-rootfs-data)
HASH=$(resolve v3-rootfs-hash)
REVIEWED_ROOT=$(resolve v3-reviewed-root)
REVIEWED_INPUT=$(resolve v3-reviewed-input)
REVIEWED_OUTPUT=$(resolve v3-reviewed-output)
REVIEWED_EVIDENCE=$(resolve v3-reviewed-evidence)
[ "$DATA" != "$HASH" ] && [ "$DATA" != "$REVIEWED_ROOT" ] && [ "$DATA" != "$REVIEWED_INPUT" ] && [ "$DATA" != "$REVIEWED_OUTPUT" ] && [ "$DATA" != "$REVIEWED_EVIDENCE" ] || fail E_DEVICE_ALIAS
[ "$HASH" != "$REVIEWED_ROOT" ] && [ "$HASH" != "$REVIEWED_INPUT" ] && [ "$HASH" != "$REVIEWED_OUTPUT" ] && [ "$HASH" != "$REVIEWED_EVIDENCE" ] || fail E_DEVICE_ALIAS
[ "$REVIEWED_ROOT" != "$REVIEWED_INPUT" ] && [ "$REVIEWED_ROOT" != "$REVIEWED_OUTPUT" ] && [ "$REVIEWED_ROOT" != "$REVIEWED_EVIDENCE" ] || fail E_DEVICE_ALIAS
[ "$REVIEWED_INPUT" != "$REVIEWED_OUTPUT" ] && [ "$REVIEWED_INPUT" != "$REVIEWED_EVIDENCE" ] && [ "$REVIEWED_OUTPUT" != "$REVIEWED_EVIDENCE" ] || fail E_DEVICE_ALIAS

"$BB" ln -s "$DATA" /dev/v3-rootfs-data || fail E_DATA_ALIAS
"$BB" ln -s "$HASH" /dev/v3-rootfs-hash || fail E_HASH_ALIAS
for n in reviewed-root reviewed-input reviewed-output reviewed-evidence; do
 [ ! -e "/$n" ] || fail E_MOUNT_TARGET_EXISTS
 "$BB" mkdir -m 0700 "/$n" || fail E_MOUNT_TARGET
 done
"$BB" mount -t ext4 -o ro,nodev,nosuid,noexec "$REVIEWED_ROOT" /reviewed-root || fail E_REVIEWED_ROOT_MOUNT
"$BB" mount -t ext4 -o ro,nodev,nosuid,noexec "$REVIEWED_INPUT" /reviewed-input || fail E_REVIEWED_INPUT_MOUNT
"$BB" mount -t ext4 -o rw,nodev,nosuid,noexec "$REVIEWED_OUTPUT" /reviewed-output || fail E_REVIEWED_OUTPUT_MOUNT
"$BB" mount -t ext4 -o rw,nodev,nosuid,noexec "$REVIEWED_EVIDENCE" /reviewed-evidence || fail E_REVIEWED_EVIDENCE_MOUNT

for n in reviewed-root reviewed-input; do
 case "$n" in reviewed-root) source=$REVIEWED_ROOT;; reviewed-input) source=$REVIEWED_INPUT;; esac
 "$BB" grep -q "^$source /$n ext4 ro," /proc/mounts || fail E_MOUNT_IDENTITY_OPTIONS
 done
for n in reviewed-output reviewed-evidence; do
 case "$n" in reviewed-output) source=$REVIEWED_OUTPUT;; reviewed-evidence) source=$REVIEWED_EVIDENCE;; esac
 "$BB" grep -q "^$source /$n ext4 rw," /proc/mounts || fail E_MOUNT_IDENTITY_OPTIONS
 "$BB" chown 0:0 "/$n" || fail E_RW_OWNER
 "$BB" chmod 0700 "/$n" || fail E_RW_MODE
 done

{
 "$BB" printf '%s\n' 'schema=v3.cloud-boot-adapter-evidence.v1'
 "$BB" printf '%s\n' 'result=ADAPTER_ENVIRONMENT_READY'
 "$BB" printf 'rootfsData=%s\n' "$DATA"
 "$BB" printf 'rootfsHash=%s\n' "$HASH"
 "$BB" printf 'reviewedRoot=%s\n' "$REVIEWED_ROOT"
 "$BB" printf 'reviewedInput=%s\n' "$REVIEWED_INPUT"
 "$BB" printf 'reviewedOutput=%s\n' "$REVIEWED_OUTPUT"
 "$BB" printf 'reviewedEvidence=%s\n' "$REVIEWED_EVIDENCE"
 "$BB" printf 'oldInitSha256=%s\n' "$OLD_INIT_SHA256"
} > /reviewed-evidence/cloud-boot-adapter.v1 || fail E_EVIDENCE_WRITE
"$BB" sync || fail E_EVIDENCE_SYNC
[ "$("$BB" sha256sum /init.root-admitter | "$BB" cut -d' ' -f1)" = "$OLD_INIT_SHA256" ] || fail E_OLD_INIT_IDENTITY
exec /init.root-admitter || fail E_OLD_INIT_EXEC

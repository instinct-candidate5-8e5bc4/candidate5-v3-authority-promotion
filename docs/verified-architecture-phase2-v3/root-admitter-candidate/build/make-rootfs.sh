#!/bin/bash
set -eu
root=$1 out=$2
: "${LIBFAKETIME:?point LIBFAKETIME to pinned libfaketime.so.1}"
export LD_PRELOAD="$LIBFAKETIME" FAKETIME="@1970-01-01 00:00:01"
export LC_ALL=C TZ=UTC E2FSPROGS_FAKE_TIME=1
truncate -s 8388608 "$out"
/usr/sbin/mke2fs -q -t ext4 -b 4096 -I 256 -U 00000000-0000-0000-0000-000000000001 -E hash_seed=00000000-0000-0000-0000-000000000002,lazy_itable_init=0,lazy_journal_init=0 -O ^has_journal,^metadata_csum_seed -d "$root" "$out" 2048
cmd=$(mktemp);trap 'rm -f "$cmd"' EXIT
find "$root" -printf '%P\0' | LC_ALL=C sort -z | while IFS= read -r -d '' p; do [ -n "$p" ] || continue; printf 'set_inode_field "/%s" uid 0\nset_inode_field "/%s" gid 0\nset_inode_field "/%s" atime 1\nset_inode_field "/%s" ctime 1\nset_inode_field "/%s" mtime 1\nset_inode_field "/%s" crtime 1\n' "$p" "$p" "$p" "$p" "$p" "$p"; done >"$cmd"
/usr/sbin/debugfs -w -f "$cmd" "$out" >/dev/null 2>&1

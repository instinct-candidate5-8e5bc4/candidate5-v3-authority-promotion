#!/bin/bash
# NON_CERTIFYING_REHEARSAL canonical bwrap namespace argv (D1): the ONE shared argv used by
# build-ovmf-debug.sh (canonical AND hostile modes) and by the workflow userns preflight.
# usage: bwrap-argv.sh MODE BWRAP REALWORK -- CMD [ARGS...]
#   canonical: merged-/usr set + --unshare-net + --dir /build --bind REALWORK /build
#   hostile:   same merged-/usr set + --unshare-net, NO /build (pass REALWORK as -)
#   preflight: canonical against a temporary realwork, with `-- true`
set -eEuo pipefail
# peer run-11: every otherwise-bare bash failure is NAMED (script/line/rc/command), exit 97.
trap '_rc=$?; echo "E_BASH_ERRTRAP bwrap-argv.sh line $LINENO rc=$_rc cmd: $BASH_COMMAND" >&2; exit 97' ERR
MODE=${1:?}; BWRAP=${2:?}; RW=${3:?}; shift 3
[ "${1:-}" = "--" ] && shift
COMMON=(--unshare-net --ro-bind /usr /usr --symlink usr/bin /bin --symlink usr/sbin /sbin
  --symlink usr/lib /lib --symlink usr/lib64 /lib64 --ro-bind /etc /etc
  --bind /tmp /tmp --bind /home /home --bind /var /var --proc /proc --dev /dev)
case "$MODE" in
  canonical)
    [ "$RW" != "-" ] && [ -n "$RW" ] || { echo "E_REALWORK_REQUIRED"; exit 1; }
    exec "$BWRAP" "${COMMON[@]}" --dir /build --bind "$RW" /build -- "$@";;
  hostile)
    exec "$BWRAP" "${COMMON[@]}" -- "$@";;
  *) echo "E_NS_MODE $MODE" >&2; exit 1;;
esac

#!/bin/bash
# NON_CERTIFYING_REHEARSAL tool shims: wrapper scripts that run staged binaries through the
# staged loader, so staged noble tools run under their own loader/glibc on ANY host
# (local sandbox or CI ubuntu-22.04 jammy runner alike). usage: make-shims.sh <stage_dir> <shim_dir>
set -eEuo pipefail
# peer run-11: every otherwise-bare bash failure is NAMED (script/line/rc/command), exit 97.
trap '_rc=$?; echo "E_BASH_ERRTRAP make-shims.sh line $LINENO rc=$_rc cmd: $BASH_COMMAND" >&2; exit 97' ERR
STAGE=${1:?}; SHIMS=${2:?}
RT="$STAGE/root"
LOADER="$RT/usr/lib/x86_64-linux-gnu/ld-linux-x86-64.so.2"
[ -x "$LOADER" ] || { echo "E_LOADER_MISSING $LOADER" >&2; exit 1; }
mkdir -p "$SHIMS"
LIBPATH="$RT/usr/lib/x86_64-linux-gnu:$RT/lib/x86_64-linux-gnu"
GCCDIR="$RT/usr/lib/gcc/x86_64-linux-gnu/13"
wrap() { # name, relpath, extra-args...
  local name=$1 rel=$2; shift 2
  { printf '#!/bin/sh\nexec "%s" --library-path "%s" --argv0 "%s" "%s" ' "$LOADER" "$LIBPATH" "$name" "$RT/$rel"
    for a in "$@"; do printf '"%s" ' "$a"; done
    printf '"$@"\n'; } > "$SHIMS/$name"
  chmod +x "$SHIMS/$name"
}
for t in as ar ranlib nm objcopy objdump ld ld.bfd cpp make nasm iasl sbsign sbverify mkfs.vfat mkfs.fat fsck.vfat truncate bwrap; do
  for d in usr/bin usr/sbin sbin; do
    [ -f "$RT/$d/$t" ] && { wrap "$t" "$d/$t"; break; }
  done
done
[ -f "$RT/sbin/sgdisk" ] && wrap sgdisk sbin/sgdisk
# B2: openssl and sbvarsign run with the STAGED ssl config + modules (never host /usr/lib/ssl)
wrap_ssl() { # name, relpath
  local name=$1 rel=$2
  [ -f "$RT/$rel" ] || return 0
  { printf '#!/bin/sh\nexport OPENSSL_CONF="%s/usr/lib/ssl/openssl.cnf"\nexport OPENSSL_MODULES="%s/usr/lib/x86_64-linux-gnu/ossl-modules"\nexec "%s" --library-path "%s" --argv0 "%s" "%s" "$@"\n' \
      "$RT" "$RT" "$LOADER" "$LIBPATH" "$name" "$RT/$rel"; } > "$SHIMS/$name"
  chmod +x "$SHIMS/$name"
}
wrap_ssl openssl usr/bin/openssl
wrap_ssl sbvarsign usr/bin/sbvarsign
# A3: the qemu shim itself carries the staged ROM/module resolution (sudo resets the
# environment, so this must live inside the shim): QEMU_MODULE_DIR for staged modules and
# -L for the staged qemu + seabios share dirs (no ipxe deb in the lock; do NOT add -vga none)
if [ -f "$RT/usr/bin/qemu-system-x86_64" ]; then
  { printf '#!/bin/sh\nexport QEMU_MODULE_DIR="%s/usr/lib/x86_64-linux-gnu/qemu"\nexec "%s" --library-path "%s" --argv0 qemu-system-x86_64 "%s/usr/bin/qemu-system-x86_64" -L "%s/usr/share/qemu" -L "%s/usr/share/seabios" "$@"\n' \
      "$RT" "$LOADER" "$LIBPATH" "$RT" "$RT" "$RT"; } > "$SHIMS/qemu-system-x86_64"
  chmod +x "$SHIMS/qemu-system-x86_64"
fi
# cc1/lto-wrapper live in libexec on noble; wrap them so gcc's execvp goes through the loader
for t in cc1 lto-wrapper; do
  [ -f "$RT/usr/libexec/gcc/x86_64-linux-gnu/13/$t" ] && wrap "$t" "usr/libexec/gcc/x86_64-linux-gnu/13/$t"
done
# the lto plugin execs lto-wrapper from the plugin's OWN directory (not PATH):
# move the real binary aside and install a loader-explicit wrapper in its place.
# this adapts the extracted staging tree (the locked debs remain the identity); on a native
# noble runner the wrapper is a no-op equivalent.
# make gcc load the STAGED lto plugin (a -B dir is searched for liblto_plugin.so);
# the plugin resolves lto-wrapper next to itself -> the wrapped one above / shims one
ln -sf "$RT/usr/libexec/gcc/x86_64-linux-gnu/13/liblto_plugin.so" "$SHIMS/liblto_plugin.so"
LWDIR="$RT/usr/libexec/gcc/x86_64-linux-gnu/13"
if [ -f "$LWDIR/lto-wrapper" ] && [ ! -f "$LWDIR/lto-wrapper.real" ]; then
  mv "$LWDIR/lto-wrapper" "$LWDIR/lto-wrapper.real"
  printf '#!/bin/sh\nexec "%s" --library-path "%s" --argv0 lto-wrapper "%s" "$@"\n'     "$LOADER" "$LIBPATH" "$LWDIR/lto-wrapper.real" > "$LWDIR/lto-wrapper"
  chmod +x "$LWDIR/lto-wrapper"
fi
# gcc needs -B so it finds cc1 (in shims), its own headers (GCCDIR), as/ld (in shims)
[ -f "$RT/usr/bin/gcc-13" ] && wrap gcc-13 usr/bin/gcc-13 -B"$SHIMS/" -B"$GCCDIR/"
ln -sf gcc-13 "$SHIMS/gcc"
ln -sf gcc-13 "$SHIMS/cc"
# B5: idempotence assert - regenerate into a scratch tree and require an identical tree
if [ "${MAKE_SHIMS_VERIFY:-}" != 1 ]; then
  TMPV=$(mktemp -d)
  MAKE_SHIMS_VERIFY=1 "$0" "$STAGE" "$TMPV" >/dev/null
  # shim content embeds the shim dir path (gcc -B); normalize the scratch path before diffing
  ( cd "$TMPV" && find . -type f -print0 | xargs -0 -r sed -i "s|$TMPV|$SHIMS|g" )
  diff -r "$SHIMS" "$TMPV" >/dev/null || { echo "E_SHIM_NONIDEMPOTENT" >&2; diff -r "$SHIMS" "$TMPV" >&2; rm -rf "$TMPV"; exit 2; }
  rm -rf "$TMPV"
fi
echo "shims: $(ls "$SHIMS" | tr '\n' ' ')"

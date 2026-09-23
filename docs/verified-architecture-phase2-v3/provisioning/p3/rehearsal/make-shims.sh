#!/bin/bash
# NON_CERTIFYING_REHEARSAL tool shims: wrapper scripts that run staged binaries through the
# staged loader, so staged tools work regardless of the host glibc (local jammy sandbox or
# CI noble runner). usage: make-shims.sh <stage_dir> <shim_dir>
set -euo pipefail
STAGE=${1:?}; SHIMS=${2:?}
RT="$STAGE/root"
LOADER="$RT/usr/lib/x86_64-linux-gnu/ld-linux-x86-64.so.2"
[ -x "$LOADER" ] || { echo "E_LOADER_MISSING $LOADER"; exit 1; }
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
for t in as ar ranlib nm objcopy objdump ld ld.bfd cpp make nasm iasl sbvarsign sbsign sbverify openssl mkfs.vfat mkfs.fat truncate bwrap; do
  for d in usr/bin usr/sbin sbin; do
    [ -f "$RT/$d/$t" ] && { wrap "$t" "$d/$t"; break; }
  done
done
[ -f "$RT/sbin/sgdisk" ] && wrap sgdisk sbin/sgdisk
[ -f "$RT/usr/bin/qemu-system-x86_64" ] && wrap qemu-system-x86_64 usr/bin/qemu-system-x86_64
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
echo "shims: $(ls "$SHIMS" | tr '\n' ' ')"

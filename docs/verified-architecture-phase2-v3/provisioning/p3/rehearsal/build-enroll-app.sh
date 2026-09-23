#!/bin/bash
# NON_CERTIFYING_REHEARSAL enroll-app dual build from the rehearsal tree source.
# Usage: build-enroll-app.sh STAGE OUTDIR_A OUTDIR_B
set -euo pipefail
STAGE="$1"; OUTA="$2"; OUTB="$3"
RT="$STAGE/root"
SRC_DIR="$(cd "$(dirname "$0")" && pwd)"
# D5: staged tools (gcc and its cc1, ld, objcopy) run ONLY through the loader-explicit shims
# (the same mechanism build-ovmf-debug.sh uses); host utilities stay host binaries on a
# clean host environment - no staged-root PATH prepend, no LD_LIBRARY_PATH.
SHIMS="$STAGE/shims"
"$(dirname "$0")/make-shims.sh" "$STAGE" "$SHIMS"
export PATH="$SHIMS:$PATH"
# fail-closed toolchain self-check BEFORE building
[ -z "${LD_LIBRARY_PATH:-}" ] || { echo "E_TOOLCHAIN_NOT_SHIMMED LD_LIBRARY_PATH is set"; exit 45; }
for t in gcc ld objcopy; do
  case "$(command -v "$t")" in
    "$SHIMS"/*) ;;
    *) echo "E_TOOLCHAIN_NOT_SHIMMED $t resolves to $(command -v "$t")"; exit 45;;
  esac
done
build_one() {
  local OUT="$1"; rm -rf "$OUT"; mkdir -p "$OUT"
  local OBJ="$OUT/enroll-app.o"
  gcc -I"$RT/usr/include/efi" -I"$RT/usr/include/efi/x86_64" -I"$RT/usr/include/efi/protocol" \
    -fpic -ffreestanding -fno-stack-protector -fno-stack-check -fshort-wchar -mno-red-zone \
    -maccumulate-outgoing-args -DEFI_FUNCTION_WRAPPER -O2 -Wall \
    -c "$SRC_DIR/enroll-app.c" -o "$OBJ"
  ld -nostdlib -znocombreloc -T "$RT/usr/lib/elf_x86_64_efi.lds" -shared -Bsymbolic \
    "$RT/usr/lib/crt0-efi-x86_64.o" "$OBJ" \
    -L"$RT/usr/lib" -lefi -lgnuefi -o "$OUT/enroll-app.so"
  objcopy -j .text -j .sdata -j .data -j .rodata -j .dynamic -j .dynsym -j .rel -j .rela \
    -j .rel.* -j .rela.* -j .reloc --target efi-app-x86_64 --subsystem=10 \
    "$OUT/enroll-app.so" "$OUT/enroll-app.efi"
  sha256sum "$OUT/enroll-app.efi"
}
build_one "$OUTA"
build_one "$OUTB"
cmp "$OUTA/enroll-app.efi" "$OUTB/enroll-app.efi" || { echo "E_APP_DUAL_BUILD_MISMATCH"; exit 44; }
# frozen output pin (C2, asserted at the source; both jobs also gate it in the workflows)
APP_SHA=$(sha256sum "$OUTA/enroll-app.efi" | cut -d' ' -f1)
[ "$APP_SHA" = "540b4fa3990f998cb803160482bd50e9670a47da3d534acc3ade91364a85f3ee" ] || { echo "E_APP_PIN_MISMATCH $APP_SHA"; exit 46; }

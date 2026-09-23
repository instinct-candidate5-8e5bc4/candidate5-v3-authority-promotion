#!/bin/bash
# NON_CERTIFYING_REHEARSAL enroll-app dual build from the rehearsal tree source.
# Usage: build-enroll-app.sh STAGE OUTDIR_A OUTDIR_B
set -euo pipefail
STAGE="$1"; OUTA="$2"; OUTB="$3"
RT="$STAGE/root"
export PATH="$RT/usr/bin:$PATH"
export LD_LIBRARY_PATH="$RT/usr/lib/x86_64-linux-gnu:${LD_LIBRARY_PATH:-}"
SRC_DIR="$(cd "$(dirname "$0")" && pwd)"
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

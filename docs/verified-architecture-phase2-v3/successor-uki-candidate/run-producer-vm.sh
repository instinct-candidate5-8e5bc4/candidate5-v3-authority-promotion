#!/bin/sh
set -eu
B=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
QEMU_ROOT=$1; KERNEL=$2; INITRD=$3; OUT=$4
sha(){ sha256sum "$1" | cut -d' ' -f1; }
[ "$(sha "$KERNEL")" = b253def256f2560ed9b658830ca9ec2783bb51f3c5dcb0d9b5c695b6554d70fb ] || exit 41
[ "$(sha "$INITRD")" = "$(sha "$B/producer-test-initramfs.cpio")" ] || exit 42
python3 - "$QEMU_ROOT" "$B/qemu-extracted-closure.v1.json" <<'PY'
import hashlib,json,pathlib,sys
r=pathlib.Path(sys.argv[1]);m=json.load(open(sys.argv[2]))
for x in m['files']:
 p=r/x['path'];assert p.stat().st_size==x['bytes'];assert hashlib.sha256(p.read_bytes()).hexdigest()==x['sha256']
PY
Q="$QEMU_ROOT/usr/bin/qemu-system-x86_64"
export LD_LIBRARY_PATH="$QEMU_ROOT/usr/lib/x86_64-linux-gnu:$QEMU_ROOT/lib/x86_64-linux-gnu"
export QEMU_MODULE_DIR="$QEMU_ROOT/usr/lib/x86_64-linux-gnu/qemu"
[ "$($Q --version | head -1)" = 'QEMU emulator version 6.2.0 (Debian 1:6.2+dfsg-2ubuntu6.31)' ] || exit 43
export LD_LIBRARY_PATH="$QEMU_ROOT/usr/lib/x86_64-linux-gnu:$QEMU_ROOT/lib/x86_64-linux-gnu"
export QEMU_MODULE_DIR="$QEMU_ROOT/usr/lib/x86_64-linux-gnu/qemu"
args='-device virtio-scsi-pci,id=scsi0'; i=0; mkdir -p "$OUT"
for n in rootfs-data rootfs-hash reviewed-root reviewed-input reviewed-output reviewed-evidence; do d="$OUT/v3-$n.img"; truncate -s 8388608 "$d"; args="$args -drive file=$d,format=raw,if=none,id=d$i -device scsi-hd,drive=d$i,bus=scsi0.0,serial=v3-$n,vendor=Google"; i=$((i+1)); done
{
 printf 'PREFLIGHT_QEMU_VERSION=QEMU emulator version 6.2.0 (Debian 1:6.2+dfsg-2ubuntu6.31)\n'
 printf 'PREFLIGHT_KERNEL_SHA256=b253def256f2560ed9b658830ca9ec2783bb51f3c5dcb0d9b5c695b6554d70fb\n'
 printf 'PREFLIGHT_INITRD_SHA256=%s\n' "$(sha "$INITRD")"
 printf 'PREFLIGHT_CLOSURE=PASS\n'
} >"$OUT/raw-serial.txt"
set +e
# shellcheck disable=SC2086
"$Q" -L "$QEMU_ROOT/usr/share/qemu" -accel tcg -nodefaults -no-reboot -nographic -serial stdio -monitor none -m 512 -kernel "$KERNEL" -initrd "$INITRD" -append 'console=ttyS0 panic=-1' $args >>"$OUT/raw-serial.txt" 2>&1
rc=$?
set -e
printf 'QEMU_WRAPPER_EXIT=%s\n' "$rc" >>"$OUT/raw-serial.txt"
[ "$rc" -eq 0 ]
[ "$(grep -aFc VM_BY_ID_PRODUCER_PASS "$OUT/raw-serial.txt")" -eq 1 ]
[ "$(grep -aFc VM_FAIL "$OUT/raw-serial.txt")" -eq 0 ]
[ "$(grep -aFc QEMU_WRAPPER_EXIT=0 "$OUT/raw-serial.txt")" -eq 1 ]
for n in v3-rootfs-data v3-rootfs-hash v3-reviewed-root v3-reviewed-input v3-reviewed-output v3-reviewed-evidence; do [ "$(grep -aFc "VM_LINK_PASS google-$n" "$OUT/raw-serial.txt")" -eq 1 ]; done
cp "$OUT/raw-serial.txt" "$B/producer-vm-raw-serial.txt"
sha256sum "$B/producer-vm-raw-serial.txt" >"$OUT/result.sha256"

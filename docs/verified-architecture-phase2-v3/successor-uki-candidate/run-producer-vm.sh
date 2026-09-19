#!/bin/sh
# Canonical bounded producer-positive harness. Requires the pinned extracted QEMU package tree.
set -eu
QEMU_ROOT=$1
KERNEL=$2
INITRD=$3
OUT=$4
Q="$QEMU_ROOT/usr/bin/qemu-system-x86_64"
export LD_LIBRARY_PATH="$QEMU_ROOT/usr/lib/x86_64-linux-gnu:$QEMU_ROOT/lib/x86_64-linux-gnu"
export QEMU_MODULE_DIR="$QEMU_ROOT/usr/lib/x86_64-linux-gnu/qemu"
args='-device virtio-scsi-pci,id=scsi0'
i=0
for n in rootfs-data rootfs-hash reviewed-root reviewed-input reviewed-output reviewed-evidence; do
 d="$OUT/v3-$n.img"; truncate -s 8388608 "$d"
 args="$args -drive file=$d,format=raw,if=none,id=d$i -device scsi-hd,drive=d$i,bus=scsi0.0,serial=v3-$n,vendor=Google"
 i=$((i+1))
done
# shellcheck disable=SC2086
"$Q" -L "$QEMU_ROOT/usr/share/qemu" -accel tcg -nodefaults -no-reboot -nographic -serial stdio -monitor none -m 512 -kernel "$KERNEL" -initrd "$INITRD" -append 'console=ttyS0 panic=-1' $args

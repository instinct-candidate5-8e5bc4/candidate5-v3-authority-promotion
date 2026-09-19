#!/bin/sh
set -eu
BB=/bin/busybox
$BB mkdir -p /proc /sys /dev /dev/disk/by-id
$BB mount -t proc proc /proc
$BB mount -t sysfs sysfs /sys
$BB mount -t devtmpfs devtmpfs /dev
$BB insmod /virtio_scsi.ko
$BB sleep 2
/bin/sh /bin/gce-by-id-producer
seen=''
for n in v3-rootfs-data v3-rootfs-hash v3-reviewed-root v3-reviewed-input v3-reviewed-output v3-reviewed-evidence; do
 link=/dev/disk/by-id/google-$n
 [ -L "$link" ] || { echo "VM_FAIL missing $n"; exec $BB poweroff -f; }
 target=$($BB readlink -f "$link")
 [ -b "$target" ] || { echo "VM_FAIL nonblock $n"; exec $BB poweroff -f; }
 case " $seen " in *" $target "*) echo "VM_FAIL duplicate $n"; exec $BB poweroff -f;; esac
 seen="$seen $target"
 echo "VM_LINK_PASS google-$n"
done
echo VM_BY_ID_PRODUCER_PASS
exec $BB poweroff -f

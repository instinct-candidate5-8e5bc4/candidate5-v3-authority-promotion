#!/bin/bash
# NON_CERTIFYING_REHEARSAL ESP variant builder: same deterministic layout recipe as the
# frozen ESP, but parameterized payload and variant-derived identities. Never collides
# with the frozen ESP GUIDs/name. usage: build-esp-variant.sh <payload.efi> <label> <fresh_work_dir>
set -eEuo pipefail
# peer run-11: every otherwise-bare bash failure is NAMED (script/line/rc/command), exit 97.
trap '_rc=$?; echo "E_BASH_ERRTRAP build-esp-variant.sh line $LINENO rc=$_rc cmd: $BASH_COMMAND" >&2; exit 97' ERR
export LC_ALL=C TZ=UTC
umask 022
readonly EPOCH=1789923381
readonly IMG_BYTES=10737418240
PAYLOAD=${1:?usage: build-esp-variant.sh <payload.efi> <label> <fresh_work_dir>}
LABEL=${2:?}
WORK=${3:?}
[ -e "$WORK" ] && { echo "E_WORK_EXISTS" >&2; exit 1; }
mkdir -p "$WORK"
PHASH=$(sha256sum "$PAYLOAD" | cut -d' ' -f1)
PSIZE=$(stat -c %s "$PAYLOAD")
# variant identities derived from the payload, prefixed to make derivation auditable
GHEX=$(printf 'NON_CERTIFYING_REHEARSAL-esp-variant:%s' "$PHASH" | sha256sum | cut -c1-32)
DISK_GUID="${GHEX:0:8}-${GHEX:8:4}-${GHEX:12:4}-${GHEX:16:4}-${GHEX:20:12}"
GHEX2=$(printf 'NON_CERTIFYING_REHEARSAL-esp-variant-part:%s' "$PHASH" | sha256sum | cut -c1-32)
PART_GUID="${GHEX2:0:8}-${GHEX2:8:4}-${GHEX2:12:4}-${GHEX2:16:4}-${GHEX2:20:12}"
VOLUME_ID=$(printf 'NON_CERTIFYING_REHEARSAL-volid:%s' "$PHASH" | sha256sum | cut -c1-8)
IMG="$WORK/NON_CERTIFYING_REHEARSAL-esp-${LABEL}.raw"
for t in sgdisk mkfs.vfat python3 truncate; do command -v "$t" >/dev/null || { echo "E_TOOL_MISSING $t" >&2; exit 1; }; done
truncate -s "$IMG_BYTES" "$IMG"
sgdisk -o -U "$DISK_GUID" -n 1:2048:+131072 -t 1:EF00 -u 1:"$PART_GUID" -c 1:"EFI System" "$IMG" >/dev/null
mkfs.vfat -F 32 -s 1 -S 512 -f 2 -R 32 -i "$VOLUME_ID" -n NCRVARIANT --offset 2048 "$IMG" 65536 >/dev/null
python3 - "$IMG" "$PAYLOAD" <<'PY'
import sys, struct, datetime
IMG, UKI = sys.argv[1], sys.argv[2]
dt = datetime.datetime.fromtimestamp(1789923381, datetime.timezone.utc)
FAT_DATE = ((dt.year-1980)<<9)|(dt.month<<5)|dt.day
FAT_TIME = (dt.hour<<11)|(dt.minute<<5)|(dt.second//2)
UKI_DATA = open(UKI,"rb").read()
with open(IMG,"r+b") as f:
    PART = 2048*512
    f.seek(PART); bpb = f.read(512)
    bps = struct.unpack_from("<H",bpb,11)[0]
    reserved = struct.unpack_from("<H",bpb,14)[0]
    nfats = bpb[16]
    fat_secs = struct.unpack_from("<I",bpb,36)[0]
    fat_start = PART + reserved*bps
    data_start = PART + (reserved + nfats*fat_secs)*bps
    clus_off = lambda n: data_start + (n-2)*bps
    n_file = -(-len(UKI_DATA)//bps)
    DIR_CLUS, BOOT_CLUS, FIRST_FILE_CLUS = 3, 4, 5
    last_file = FIRST_FILE_CLUS + n_file - 1
    f.seek(fat_start); fat = bytearray(f.read(fat_secs*bps))
    def setent(n, val): struct.pack_into("<I", fat, n*4, val & 0x0FFFFFFF)
    setent(2, 0x0FFFFFF8); setent(DIR_CLUS, 0x0FFFFFF8); setent(BOOT_CLUS, 0x0FFFFFF8)
    for c in range(FIRST_FILE_CLUS, last_file): setent(c, c+1)
    setent(last_file, 0x0FFFFFF8)
    for i in range(nfats):
        f.seek(fat_start + i*fat_secs*bps); f.write(fat)
    def dent(name83, attr, clus, size):
        e = bytearray(32); e[0:11] = name83; e[11] = attr
        struct.pack_into("<H", e, 14, FAT_TIME); struct.pack_into("<H", e, 16, FAT_DATE)
        struct.pack_into("<H", e, 18, FAT_DATE); struct.pack_into("<H", e, 20, (clus>>16)&0xFFFF)
        struct.pack_into("<H", e, 22, FAT_TIME); struct.pack_into("<H", e, 24, FAT_DATE)
        struct.pack_into("<I", e, 26, clus & 0xFFFF); struct.pack_into("<I", e, 28, size)
        return bytes(e)
    f.seek(clus_off(2)); f.write(dent(b"EFI        ", 0x10, DIR_CLUS, 0))
    f.seek(clus_off(DIR_CLUS)); f.write(dent(b"BOOT       ", 0x10, BOOT_CLUS, 0))
    f.seek(clus_off(BOOT_CLUS)); f.write(dent(b"BOOTX64 EFI", 0x20, FIRST_FILE_CLUS, len(UKI_DATA)))
    f.seek(clus_off(FIRST_FILE_CLUS)); f.write(UKI_DATA)
    f.seek(PART+512); fsi = bytearray(f.read(512))
    old_free = struct.unpack_from("<I", fsi, 488)[0]
    struct.pack_into("<I", fsi, 488, old_free - (2 + n_file))
    struct.pack_into("<I", fsi, 492, last_file+1)
    f.seek(PART+512); f.write(fsi)
PY
echo "payload $PSIZE $PHASH"
echo "image $(stat -c %s "$IMG") $(sha256sum "$IMG" | cut -d' ' -f1)"

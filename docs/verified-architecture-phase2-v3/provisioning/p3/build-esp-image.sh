#!/bin/bash
# build-esp-image.sh - deterministic construction of the ESP boot disk image for P3.
# Offline, no mounting, no root. Exactly one boot path: /EFI/BOOT/BOOTX64.EFI = signed UKI.
# usage: build-esp-image.sh <signed_uki.efi> <fresh_work_dir> <uki_sha256> <uki_bytes> <out_name>
# The signed-slot head parameterizes the pinned UKI identity + output name so the SAME reviewed
# builder constructs both the historical ESP (13309697.. -> c5-root-admitter-uki-v3-esp.raw)
# and the signed-slot ESP (0ea8dd7d.. -> c5-successor-to-certify-esp.raw); both callers pass the
# pin explicitly and out_name is allowlisted fail-closed.
set -eEuo pipefail
# peer run-11: every otherwise-bare bash failure is NAMED (script/line/rc/command), exit 97.
trap '_rc=$?; echo "E_BASH_ERRTRAP build-esp-image.sh line $LINENO rc=$_rc cmd: $BASH_COMMAND" >&2; exit 97' ERR
export LC_ALL=C TZ=UTC
umask 022
readonly EPOCH=1789923381
UKI_SHA256=${3:?usage: build-esp-image.sh <signed_uki.efi> <fresh_work_dir> <uki_sha256> <uki_bytes> <out_name>}
UKI_BYTES=${4:?}
OUT_NAME=${5:?}
case "$OUT_NAME" in
  c5-root-admitter-uki-v3-esp.raw|c5-successor-to-certify-esp.raw) ;;
  *) echo "E_ESP_NAME $OUT_NAME" >&2; exit 1;;
esac
[[ "$UKI_SHA256" =~ ^[0-9a-f]{64}$ ]] || { echo "E_UKI_PIN_FORMAT $UKI_SHA256" >&2; exit 1; }
[[ "$UKI_BYTES" =~ ^[0-9]+$ ]] || { echo "E_UKI_BYTES_FORMAT $UKI_BYTES" >&2; exit 1; }
readonly UKI_SHA256 UKI_BYTES OUT_NAME
readonly IMG_BYTES=10737418240            # 10 GiB sparse RAW
readonly DISK_GUID=a42ac99f-298e-71d7-54e9-69cea084f6d6   # sha256("candidate5-p3-esp:disk")[0:16]
readonly PART_GUID=a1eee143-302e-bfce-2da6-410baab6c2ea   # sha256("candidate5-p3-esp:partition")[0:16]
readonly VOLUME_ID=43350001
UKI=${1:?usage: build-esp-image.sh <signed_uki.efi> <fresh_work_dir>}
WORK=${2:?}
[ -e "$WORK" ] && { echo "E_WORK_EXISTS" >&2; exit 1; }
mkdir -p "$WORK"
fail(){ echo "FAIL $1" >&2; exit 1; }
echo "== build-esp-image.sh =="
echo "epoch=$EPOCH umask=$(umask) LC_ALL=$LC_ALL TZ=$TZ"
for t in sgdisk mkfs.vfat python3 truncate sha256sum; do
  p=$(command -v "$t") || fail "E_TOOL_MISSING $t"
  real="$p"
  # batch1r3 B3: when $t resolves to a make-shims shim, log the UNDERLYING staged
  # binary's hash (the shim is a fixed-format #!/bin/sh loader wrapper), not the shim's.
  if grep -q -- '--argv0' "$p" 2>/dev/null; then
    real=$(sed -n 's/.*--argv0 "[^"]*" "\([^"]*\)".*/\1/p' "$p")
    [ -n "$real" ] && [ -f "$real" ] || fail "E_SHIM_RESOLVE $t $p"
  fi
  printf 'tool %s %s %s\n' "$t" "$real" "$(sha256sum "$real" | cut -d' ' -f1)"
done
sgdisk --version 2>&1 | head -1 | sed 's/^/tool-version sgdisk /'
mkfs.vfat --help 2>&1 | head -1 | sed 's/^/tool-version mkfs.vfat /'
sz=$(stat -c %s "$UKI"); hz=$(sha256sum "$UKI" | cut -d' ' -f1)
[ "$sz" = "$UKI_BYTES" ] || fail "E_UKI_SIZE $sz"
[ "$hz" = "$UKI_SHA256" ] || fail "E_UKI_HASH $hz"
echo "uki $sz $hz"
IMG="$WORK/$OUT_NAME"
truncate -s "$IMG_BYTES" "$IMG"
sgdisk -o -U "$DISK_GUID" -n 1:2048:+131072 -t 1:EF00 -u 1:"$PART_GUID" -c 1:"EFI System" "$IMG" >/dev/null
mkfs.vfat -F 32 -s 1 -S 512 -f 2 -R 32 -i "$VOLUME_ID" -n C5ESP --offset 2048 "$IMG" 65536 >/dev/null
python3 - "$IMG" "$UKI" <<'PY'
import sys, struct, hashlib
IMG, UKI = sys.argv[1], sys.argv[2]
EPOCH = 1789923381
import datetime
dt = datetime.datetime.fromtimestamp(EPOCH, datetime.timezone.utc)
FAT_DATE = ((dt.year-1980)<<9)|(dt.month<<5)|dt.day
FAT_TIME = (dt.hour<<11)|(dt.minute<<5)|(dt.second//2)
UKI_DATA = open(UKI,"rb").read()
with open(IMG,"r+b") as f:
    PART = 2048*512
    f.seek(PART); bpb = f.read(512)
    bps = struct.unpack_from("<H",bpb,11)[0]
    spc = bpb[13]
    reserved = struct.unpack_from("<H",bpb,14)[0]
    nfats = bpb[16]
    fat_secs = struct.unpack_from("<I",bpb,36)[0]
    root_clus = struct.unpack_from("<I",bpb,44)[0]
    assert bps==512 and spc==1 and nfats==2 and root_clus==2, "BPB shape changed"
    fat_start = PART + reserved*bps
    data_start = PART + (reserved + nfats*fat_secs)*bps
    clus_off = lambda n: data_start + (n-2)*bps
    n_file = -(-len(UKI_DATA)//bps)          # clusters for file data
    DIR_CLUS, BOOT_CLUS, FIRST_FILE_CLUS = 3, 4, 5
    last_file = FIRST_FILE_CLUS + n_file - 1
    # FAT chains
    fat = bytearray(fat_secs*bps)
    f.seek(fat_start); fat = bytearray(f.read(fat_secs*bps))
    def setent(n, val):
        struct.pack_into("<I", fat, n*4, val & 0x0FFFFFFF)
    setent(2, 0x0FFFFFF8)                    # root dir, 1 cluster
    setent(DIR_CLUS, 0x0FFFFFF8)
    setent(BOOT_CLUS, 0x0FFFFFF8)
    for c in range(FIRST_FILE_CLUS, last_file): setent(c, c+1)
    setent(last_file, 0x0FFFFFF8)
    for i in range(nfats):
        f.seek(fat_start + i*fat_secs*bps); f.write(fat)
    def dent(name83, attr, clus, size):
        e = bytearray(32)
        e[0:11] = name83
        e[11] = attr
        struct.pack_into("<H", e, 14, FAT_TIME)   # create time
        struct.pack_into("<H", e, 16, FAT_DATE)   # create date
        struct.pack_into("<H", e, 18, FAT_DATE)   # last access
        struct.pack_into("<H", e, 20, (clus>>16)&0xFFFF)
        struct.pack_into("<H", e, 22, FAT_TIME)   # write time
        struct.pack_into("<H", e, 24, FAT_DATE)   # write date
        struct.pack_into("<I", e, 26, clus & 0xFFFF)
        struct.pack_into("<I", e, 28, size)
        return bytes(e)
    # root dir: EFI only
    f.seek(clus_off(2)); f.write(dent(b"EFI        ", 0x10, DIR_CLUS, 0))
    # /EFI: BOOT only
    f.seek(clus_off(DIR_CLUS)); f.write(dent(b"BOOT       ", 0x10, BOOT_CLUS, 0))
    # /EFI/BOOT: BOOTX64.EFI only
    f.seek(clus_off(BOOT_CLUS)); f.write(dent(b"BOOTX64 EFI", 0x20, FIRST_FILE_CLUS, len(UKI_DATA)))
    # file data
    f.seek(clus_off(FIRST_FILE_CLUS)); f.write(UKI_DATA)
    # FSInfo free count update (sector 1 of partition)
    f.seek(PART+512); fsi = bytearray(f.read(512))
    old_free = struct.unpack_from("<I", fsi, 488)[0]
    used_extra = 2 + n_file                  # EFI + BOOT dirs + file clusters
    struct.pack_into("<I", fsi, 488, old_free - used_extra)
    struct.pack_into("<I", fsi, 492, last_file+1)
    f.seek(PART+512); f.write(fsi)
print("fat-content written: clusters", 5, "to", last_file, "file bytes", len(UKI_DATA))
PY
echo "image $(stat -c %s "$IMG") $(sha256sum "$IMG" | cut -d' ' -f1)"
echo "== esp build complete =="

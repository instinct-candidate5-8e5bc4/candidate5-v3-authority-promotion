#!/bin/bash
# NON_CERTIFYING_REHEARSAL enrollment VM run: boots the enrollment app once on a
# pristine VARS copy, captures ENROLL.TXT, produces an enrolled VARS template.
# usage: rehearsal-enroll.sh <config.json> <prep_dir> <out_template.fd> <evidence_dir> [db2]
# MODE (sole|db2) also selects the frozen VARS predicate set checked by enroll-predicate-check.py.
set -euo pipefail
CFG=${1:?}; PREP=${2:?}; OUT=${3:?}; EVD=${4:?}; MODE=${5:-sole}
# Lane prefix resolution (scratch-3 ruling): committed config bytes keep the canonical
# NON_CERTIFYING_REHEARSAL prefix; the two canonical /tmp paths read below resolve to the
# running lane's /tmp/$PREFIX-. Identity in the rehearsal and certification lanes.
PREFIX="${PREFIX:-NON_CERTIFYING_REHEARSAL}"
CANON_TMP=/tmp/NON_CERTIFYING_REHEARSAL-; LANE_TMP=/tmp/$PREFIX-
[ -e /dev/kvm ] || { echo "E_NO_KVM" >&2; exit 90; }
[ -e "$EVD" ] && { echo "E_EVD_EXISTS" >&2; exit 1; }
mkdir -p "$EVD"
QEMU=$(python3 -c "import json;print(json.load(open('$CFG'))['qemu'])")
QEMU=${QEMU//$CANON_TMP/$LANE_TMP}
CPU=$(python3 -c "import json;print(json.load(open('$CFG'))['cpu_model'])")
FW=$(python3 -c "import json;print(json.load(open('$CFG'))['ovmf_code_debug'])")
PRISTINE=$(python3 -c "import json;print(json.load(open('$CFG'))['ovmf_vars_pristine'])")
PRISTINE=${PRISTINE//$CANON_TMP/$LANE_TMP}
APP=$(python3 -c "import json;print(json.load(open('$CFG'))['enroll_app'])")
# enrollment FAT32 image (64 MiB): app as /EFI/BOOT/BOOTX64.EFI + auth blobs at the VOLUME ROOT
# (G2/T5 F4: the app opens db.auth/kek.auth/pk.auth on the volume root and writes ENROLL.TXT there)
IMG="$EVD/enroll-fat.raw"
truncate -s 67108864 "$IMG"
mkfs.vfat -F 32 -s 1 -S 512 -f 2 -R 32 -i 45454E52 -n C5ENROLL "$IMG" >/dev/null
python3 - "$IMG" "$APP" "$PREP" "$MODE" <<'PY'
import sys, struct
img, app, prep, mode = sys.argv[1:5]
EPOCH_DATE = 0x5521  # 2022-01-01 fixed, matches rehearsal epoch convention
def load(img):
    f = open(img, "r+b"); d = f
    d.seek(0); bpb = d.read(512)
    bps = struct.unpack_from("<H", bpb, 11)[0]
    spc = bpb[13]
    reserved = struct.unpack_from("<H", bpb, 14)[0]
    nfats = bpb[16]
    fat_secs = struct.unpack_from("<I", bpb, 36)[0]
    assert bps == 512 and spc == 1 and nfats == 2, "BPB shape changed"
    fat_start = reserved * bps
    data_start = (reserved + nfats * fat_secs) * bps
    return d, bps, fat_start, data_start, fat_secs, nfats
d, bps, fat_start, data_start, fat_secs, nfats = load(img)
co = lambda n: data_start + (n - 2) * bps
d.seek(fat_start); fat = bytearray(d.read(fat_secs * bps))
def setent(n, val): struct.pack_into("<I", fat, n * 4, val & 0x0FFFFFFF)
def chain_write(clus, data):
    n = -(-len(data) // bps)
    for i in range(n):
        setent(clus + i, (clus + i + 1) if i < n - 1 else 0x0FFFFFF8)
    d.seek(co(clus)); d.write(data)
    return n
def dent(name83, attr, clus, size):
    e = bytearray(32); e[0:11] = name83; e[11] = attr
    struct.pack_into("<H", e, 14, 0); struct.pack_into("<H", e, 16, EPOCH_DATE)
    struct.pack_into("<H", e, 18, EPOCH_DATE); struct.pack_into("<H", e, 20, (clus >> 16) & 0xFFFF)
    struct.pack_into("<H", e, 22, 0); struct.pack_into("<H", e, 24, EPOCH_DATE)
    struct.pack_into("<I", e, 26, clus & 0xFFFF); struct.pack_into("<I", e, 28, size)
    return bytes(e)
setent(2, 0x0FFFFFF8)   # root dir
EFI_CLUS, BOOT_CLUS, APP_CLUS = 3, 4, 5
appdata = open(app, "rb").read()
n_app = chain_write(APP_CLUS, appdata)
cl = APP_CLUS + n_app
blobs = [("DB      AUTH", "db2.auth" if mode == "db2" else "db.auth"),
         ("KEK     AUTH", "kek.auth"), ("PK      AUTH", "pk.auth")]
blob_dents = []
for name83, src in blobs:
    data = open(prep + "/" + src, "rb").read()
    n = chain_write(cl, data)
    blob_dents.append(dent(name83.encode(), 0x20, cl, len(data)))
    cl += n
for i in range(nfats):
    d.seek(fat_start + i * fat_secs * bps); d.write(fat)
d.seek(co(2)); d.write(dent(b"EFI        ", 0x10, EFI_CLUS, 0))
for b in blob_dents: d.write(b)   # db.auth/kek.auth/pk.auth at the VOLUME ROOT (app opens them there)
d.seek(co(EFI_CLUS)); d.write(dent(b"BOOT       ", 0x10, BOOT_CLUS, 0))
d.seek(co(BOOT_CLUS)); d.write(dent(b"BOOTX64 EFI", 0x20, APP_CLUS, len(appdata)))
# FSInfo free-count update
d.seek(512); fsi = bytearray(d.read(512))
old_free = struct.unpack_from("<I", fsi, 488)[0]
struct.pack_into("<I", fsi, 488, old_free - (cl - 2))
struct.pack_into("<I", fsi, 492, cl)
d.seek(512); d.write(fsi)
d.close()
print("enrollment FAT32 built: app bytes", len(appdata), "blobs", len(blob_dents))
PY
cp "$PRISTINE" "$EVD/vars.fd"
"$QEMU" -machine q35,smm=on -accel kvm -cpu "$CPU" \
  -drive if=pflash,format=raw,unit=0,readonly=on,file="$FW" \
  -drive if=pflash,format=raw,unit=1,file="$EVD/vars.fd" \
  -global driver=cfi.pflash01,property=secure,value=on \
  -debugcon file:"$EVD/ovmf-debug.log" -global isa-debugcon.iobase=0x402 \
  -display none -serial none -nic none -no-reboot -m 512 \
  -drive file="$IMG",format=raw,if=none,id=enroll,readonly=off \
  -device virtio-blk-pci,drive=enroll,serial=c5-enroll \
  -pidfile "$EVD/qemu.pid" -daemonize
sleep 25
PID=$(cat "$EVD/qemu.pid")
kill -TERM "$PID" 2>/dev/null || true; sleep 2; kill -KILL "$PID" 2>/dev/null || true
# extract ENROLL.TXT from the VOLUME ROOT of the FAT32 image (G2/T5 F4: the app writes it there)
python3 - "$IMG" > "$EVD/ENROLL.TXT" <<'PY'
import sys, struct
d = open(sys.argv[1], "rb").read()
bps = struct.unpack_from("<H", d, 11)[0]
spc = d[13]
reserved = struct.unpack_from("<H", d, 14)[0]
nfats = d[16]
fat_secs = struct.unpack_from("<I", d, 36)[0]
fat_start = reserved * bps
data_start = (reserved + nfats * fat_secs) * bps
co = lambda n: data_start + (n - 2) * bps * spc
fat = d[fat_start:fat_start + fat_secs * bps]
def chain(s):
    out = []; c = s
    while c < 0x0FFFFFF8:
        out.append(c); c = struct.unpack_from("<I", fat, c * 4)[0] & 0x0FFFFFFF
    return out
def walk(clus):
    dd = d[co(clus):co(clus) + 512 * spc]
    for i in range(0, 512 * spc, 32):
        e = dd[i:i + 32]
        if e[0] == 0: return
        if e[0] == 0xE5 or e[11] == 0x0F: continue
        yield e
def find(name):
    for e in walk(2):
        if e[0] == 0xE5 or e[11] == 0x0F or (e[11] & 0x10): continue
        nm = e[0:8].decode().rstrip() + "." + e[8:11].decode().rstrip()
        if nm == name:
            cl = struct.unpack_from("<H", e, 26)[0]; sz = struct.unpack_from("<I", e, 28)[0]
            return b"".join(d[co(c):co(c) + 512] for c in chain(cl))[:sz]
    raise SystemExit("E_ENROLL_TXT_MISSING")
sys.stdout.buffer.write(find("ENROLL.TXT"))
PY
cp "$EVD/vars.fd" "$OUT"
# frozen enrollment predicate gate (requirement 5a/5b resolution): any deviation fails the run
HERE="$(cd "$(dirname "$0")" && pwd)"
python3 "$HERE/enroll-predicate-check.py" "$MODE" "$EVD/ENROLL.TXT" "$PREP" "$OUT" "$HERE/../parse-ovmf-vars.py" | tee "$EVD/enroll-predicate.json"
echo "enrollment run complete -> $OUT"

#!/bin/bash
# NON_CERTIFYING_REHEARSAL enrollment VM run: boots the enrollment app once on a
# pristine VARS copy, captures ENROLL.TXT, produces an enrolled VARS template.
# usage: rehearsal-enroll.sh <config.json> <prep_dir> <out_template.fd> <evidence_dir> [db2]
# MODE (sole|db2) also selects the frozen VARS predicate set checked by enroll-predicate-check.py.
set -euo pipefail
CFG=${1:?}; PREP=${2:?}; OUT=${3:?}; EVD=${4:?}; MODE=${5:-sole}
# peer N1: the enrollment QMP socket path is PINNED (argv-freeze.json enroll_qmp_sock_basename)
# and must fit the AF_UNIX sun_path limit (108 incl. NUL -> 107 usable, mirrors harness G1/T5 F3).
QMP_SOCK="$EVD/qmp.sock"
[ "${#QMP_SOCK}" -le 107 ] || { echo "E_QMP_PATH_TOO_LONG len=${#QMP_SOCK} max=107 path=$QMP_SOCK"; exit 97; }
# Lane prefix resolution (scratch-3 ruling): committed config bytes keep the canonical
# NON_CERTIFYING_REHEARSAL prefix; the two canonical /tmp paths read below resolve to the
# running lane's /tmp/$PREFIX-. Identity in the rehearsal and certification lanes.
PREFIX="${PREFIX:-}"
[ -n "$PREFIX" ] || { echo "E_PREFIX_UNSET"; exit 97; }
[ "$PREFIX" = "${ALLOWED_PREFIX:-}" ] || { echo "E_PREFIX_MISMATCH prefix=$PREFIX allowed=$ALLOWED_PREFIX"; exit 97; }
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
# chatter rule (peer): enroll-fat.raw is not hash-pinned in-log, so the mkfs output is
# preserved rather than suppressed.
mkfs.vfat -F 32 -s 1 -S 512 -f 2 -R 32 -i 45454E52 -n C5ENROLL "$IMG"
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
    tot_secs = struct.unpack_from("<I", bpb, 32)[0]
    assert bps == 512 and spc == 1 and nfats == 2, "BPB shape changed"
    fat_start = reserved * bps
    data_start = (reserved + nfats * fat_secs) * bps
    data_clusters = (tot_secs - reserved - nfats * fat_secs) // spc
    return d, bps, fat_start, data_start, fat_secs, nfats, data_clusters
d, bps, fat_start, data_start, fat_secs, nfats, data_clusters = load(img)
co = lambda n: data_start + (n - 2) * bps
d.seek(fat_start); fat = bytearray(d.read(fat_secs * bps))
def setent(n, val): struct.pack_into("<I", fat, n * 4, val & 0x0FFFFFFF)
def chain_write(clus, data):
    n = -(-len(data) // bps)
    for i in range(n):
        setent(clus + i, (clus + i + 1) if i < n - 1 else 0x0FFFFFF8)
    d.seek(co(clus)); d.write(data)
    return n
def wfail(code, msg):
    # named writer error (peer condition 3): never a bare AssertionError
    print("%s %s" % (code, msg)); sys.exit(97)
def dent(name83, attr, clus, size):
    # run-9 defect-2 fix: an 8.3 name is EXACTLY 11 bytes; a longer value silently
    # resized the bytearray and produced 33-byte entries, shifting every later entry
    # out of slot alignment (KEK/PK became unreachable orphans in the run-9 image).
    if len(name83) != 11:
        wfail("E_ENROLL_FAT_WRITER_NAME83", "8.3 name %r is %d bytes, need exactly 11" % (name83, len(name83)))
    e = bytearray(32); e[0:11] = name83; e[11] = attr
    struct.pack_into("<H", e, 14, 0); struct.pack_into("<H", e, 16, EPOCH_DATE)
    struct.pack_into("<H", e, 18, EPOCH_DATE); struct.pack_into("<H", e, 20, (clus >> 16) & 0xFFFF)
    struct.pack_into("<H", e, 22, 0); struct.pack_into("<H", e, 24, EPOCH_DATE)
    struct.pack_into("<H", e, 26, clus & 0xFFFF); struct.pack_into("<I", e, 28, size)
    if len(e) != 32:
        wfail("E_ENROLL_FAT_WRITER_DENT", "directory entry is %d bytes, need exactly 32" % len(e))
    return bytes(e)
def dirblock(label, *dents):
    b = b"".join(dents)
    if len(b) % 32 != 0:
        wfail("E_ENROLL_FAT_WRITER_DIRBLOCK", "%s block is %d bytes, not a multiple of 32" % (label, len(b)))
    return b
setent(2, 0x0FFFFFF8)   # root dir
EFI_CLUS, BOOT_CLUS, APP_CLUS = 3, 4, 5
# run-9 defect-1 fix: the directory clusters themselves must be ALLOCATED end-of-chain.
# The old writer left FAT[3]=FAT[4]=0 (FREE); OVMF rejects the free-in-chain directory
# with "FATDirSize: cluster chain corrupt" where fsck only warns and assumes EOF.
setent(EFI_CLUS, 0x0FFFFFF8)
setent(BOOT_CLUS, 0x0FFFFFF8)
appdata = open(app, "rb").read()
n_app = chain_write(APP_CLUS, appdata)
cl = APP_CLUS + n_app
# 8.3 names: "db.auth" -> DB.AUT, "db2.auth" -> DB2.AUT (extension truncates to 3).
blobs = [(b"DB      AUT", "db2.auth" if mode == "db2" else "db.auth"),
         (b"KEK     AUT", "kek.auth"), (b"PK      AUT", "pk.auth")]
blob_dents = []
for name83, src in blobs:
    data = open(prep + "/" + src, "rb").read()
    blob_dents.append(dent(name83, 0x20, cl, len(data)))
    cl += chain_write(cl, data)
for i in range(nfats):
    d.seek(fat_start + i * fat_secs * bps); d.write(fat)
# each directory is built as one contiguous block (fixed 32-byte entries, no gaps) and
# written once. Root: volume label (fsck requires it to match the boot-sector label),
# EFI, then the auth blobs at the VOLUME ROOT (G2/T5 F4: the app opens them there).
root = dirblock("root", dent(b"C5ENROLL   ", 0x08, 0, 0), dent(b"EFI        ", 0x10, EFI_CLUS, 0), *blob_dents)
d.seek(co(2)); d.write(root)
# "." / ".." entries (fsck 4.2 errors when absent); ".." of a directory whose parent is
# the ROOT points at cluster 0, not 2 (FAT spec).
efi = dirblock("/EFI", dent(b".          ", 0x10, EFI_CLUS, 0), dent(b"..         ", 0x10, 0, 0), dent(b"BOOT       ", 0x10, BOOT_CLUS, 0))
d.seek(co(EFI_CLUS)); d.write(efi)
boot = dirblock("/EFI/BOOT", dent(b".          ", 0x10, BOOT_CLUS, 0), dent(b"..         ", 0x10, EFI_CLUS, 0), dent(b"BOOTX64 EFI", 0x20, APP_CLUS, len(appdata)))
d.seek(co(BOOT_CLUS)); d.write(boot)
# FSInfo free-count update, derived from the BPB geometry (used clusters are 2..cl-1)
d.seek(512); fsi = bytearray(d.read(512))
struct.pack_into("<I", fsi, 488, data_clusters - (cl - 2))
struct.pack_into("<I", fsi, 492, cl)
d.seek(512); d.write(fsi)
d.close()
print("enrollment FAT32 built: app bytes", len(appdata), "blobs", len(blob_dents), "clusters used 2..%d" % (cl - 1))
# peer condition 1: the independent reader (gate 2 below) shares ZERO code, imports or
# copied helpers with this writer; its expectations come from the mode contract and the
# SOURCE files, never from anything this writer produced.
PY
# peer condition 4 (PF-1/PF-2 must-show): planted-fault injection, SCRATCH LANE ONLY.
# Any value outside the allowlist, or any use outside the scratch lane, fails closed.
ENROLL_PLANTED_FAULT="${ENROLL_PLANTED_FAULT:-}"
if [ -n "$ENROLL_PLANTED_FAULT" ]; then
  [ "$PREFIX" = "NON_CERTIFYING_SCRATCH" ] || { echo "E_PLANTED_FAULT_LANE faults are scratch-lane only (PREFIX=$PREFIX)"; exit 97; }
  case "$ENROLL_PLANTED_FAULT" in freemark|missingblob) ;; *) echo "E_PLANTED_FAULT_UNKNOWN $ENROLL_PLANTED_FAULT"; exit 97;; esac
  echo "PLANTED FAULT ACTIVE: $ENROLL_PLANTED_FAULT (scratch-lane gate must-show; this run certifies nothing)"
  python3 - "$IMG" "$ENROLL_PLANTED_FAULT" <<'PYF'
import sys, struct
img, fault = sys.argv[1:3]
f = open(img, "r+b"); f.seek(0); allb = bytearray(f.read())
bps = struct.unpack_from("<H", allb, 11)[0]
reserved = struct.unpack_from("<H", allb, 14)[0]; nfats = allb[16]
fat_secs = struct.unpack_from("<I", allb, 36)[0]
fat_start = reserved*bps; data_start = (reserved+nfats*fat_secs)*bps
co = lambda n: data_start + (n-2)*bps
def putfat(n, v):
    for i in range(nfats):
        struct.pack_into("<I", allb, fat_start + i*fat_secs*bps + n*4, v & 0x0FFFFFFF)
if fault == "freemark":
    putfat(3, 0); putfat(4, 0)  # PF-1: directory clusters marked FREE (run-9 defect-1 shape)
elif fault == "missingblob":
    base = co(2)
    for i in range(bps//32):
        e = allb[base+i*32 : base+(i+1)*32]
        if e[0:11] == b"PK      AUT":
            clus = struct.unpack_from("<H", e, 26)[0]
            n = -(-struct.unpack_from("<I", e, 28)[0] // bps)
            for k in range(clus, clus+n): putfat(k, 0)          # free the chain cleanly
            allb[base+i*32] = 0xE5                              # deleted entry
            fsi_free = struct.unpack_from("<I", allb, 512+488)[0]
            struct.pack_into("<I", allb, 512+488, fsi_free + n)  # FSInfo stays consistent
            break
f.seek(0); f.write(allb); f.close()
print("planted fault applied:", fault)
PYF
fi
# run-9 per-run image identity (peer: unpinned by design, logged every run)
echo "enroll-fat image sha256=$(sha256sum "$IMG" | cut -d' ' -f1) size=$(stat -c %s "$IMG") (unpinned by design; per-run logged)"
# peer run-9 FAT gate 1 (pre-boot): fsck diagnostics. The exit code is NOT the signal -
# dosfstools 4.2 returned rc=0 in one container and rc=1 in another on the SAME corrupt
# run-9 image; the gate fails on ANY line beyond the banner and the final summary.
# peer condition 6: the fsck.vfat shim is shown IN-LOG resolving to the staged binary it
# wraps (the staged root is hash-verified against platform.lock at staging time).
FSCK_SHIM=$(command -v fsck.vfat || true)
[ -n "$FSCK_SHIM" ] || { echo "E_ENROLL_FSCK_SHIM_MISSING fsck.vfat not on PATH"; exit 97; }
FSCK_BIN=/tmp/$PREFIX-stage/root/usr/sbin/fsck.vfat
[ -f "$FSCK_BIN" ] || { echo "E_ENROLL_FSCK_STAGED_MISSING $FSCK_BIN"; exit 97; }
grep -qF "$FSCK_BIN" "$FSCK_SHIM" || { echo "E_ENROLL_FSCK_SHIM_DRIFT shim $FSCK_SHIM does not wrap $FSCK_BIN"; exit 97; }
FSCK_REAL=$(readlink -f "$FSCK_BIN")
[ -f "$FSCK_REAL" ] || { echo "E_ENROLL_FSCK_STAGED_MISSING real target $FSCK_REAL"; exit 97; }
echo "fsck.vfat resolution: shim $FSCK_SHIM -> staged $FSCK_BIN -> $(basename "$FSCK_REAL") sha256=$(sha256sum "$FSCK_REAL" | cut -d' ' -f1) size=$(stat -Lc %s "$FSCK_BIN") (staged root hash-verified against platform.lock)"
_fsck_rc=0
fsck.vfat -n "$IMG" > "$EVD/enroll-fat-fsck.log" 2>&1 || _fsck_rc=$?
echo "----- begin enroll-fat-fsck.log (fsck.vfat -n rc=$_fsck_rc) -----"
cat "$EVD/enroll-fat-fsck.log"
echo "----- end enroll-fat-fsck.log -----"
if [ "$_fsck_rc" != 0 ] || \
   grep -Ev '^(fsck\.fat [0-9]+\.[0-9]+ \([0-9-]+\)|[^:]+: [0-9]+ files?, [0-9]+/[0-9]+ clusters)$' "$EVD/enroll-fat-fsck.log" | grep -q .; then
  echo "E_ENROLL_FAT_INVALID fsck.vfat -n reported diagnostics (rc=$_fsck_rc); full output in enroll-fat-fsck.log above"; exit 97
fi
# peer run-9 FAT gate 2 (pre-boot): independent directory round-trip against the CONTRACT
# (G2/T5 F4 + mode semantics: the app opens db.auth/kek.auth/pk.auth - db2.auth in db2
# mode - at the volume root; BOOTX64.EFI boots from /EFI/BOOT). Expected names, sizes and
# SHAs come from the mode and the SOURCE files, never from the produced image; anything
# missing, extra, or byte-different fails closed BEFORE boot.
_rt_rc=0
python3 - "$IMG" "$APP" "$PREP" "$MODE" > "$EVD/enroll-fat-roundtrip.log" <<'PY' || _rt_rc=$?
# INDEPENDENT READER (peer condition 1): shares zero code/imports/helpers with the
# writer; every expectation below is hardcoded from the mode contract and compared
# against SOURCE-file bytes, never against writer output or writer-side variables.
import sys, struct, hashlib
img, app, prep, mode = sys.argv[1:5]
d = open(img, "rb").read()
bps = struct.unpack_from("<H", d, 11)[0]
reserved = struct.unpack_from("<H", d, 14)[0]
nfats = d[16]
fat_secs = struct.unpack_from("<I", d, 36)[0]
fat = d[reserved*bps : reserved*bps + fat_secs*bps]
data_start = (reserved + nfats*fat_secs)*bps
ent = lambda n: struct.unpack_from("<I", fat, n*4)[0] & 0x0FFFFFFF
co = lambda n: data_start + (n-2)*bps
def fail(msg):
    print("round-trip FAIL:", msg); sys.exit(1)
def chain(n, guard=1<<20):
    out = []
    while n < 0x0FFFFFF8:
        out.append(n)
        if len(out) > guard: fail("chain loop at cluster %d" % n)
        n = ent(n)
    if not out: fail("file starts at a FREE cluster %d" % n)
    return out
def read_file(clus, size):
    if ent(clus) == 0: fail("file at FREE cluster %d" % clus)
    buf = b"".join(d[co(c):co(c)+bps] for c in chain(clus))
    return buf[:size]
def dents(clus, label):
    if ent(clus) == 0: fail("%s directory cluster %d is marked FREE in the FAT" % (label, clus))
    base = co(clus); out = []
    for i in range(bps//32):
        e = d[base+i*32 : base+(i+1)*32]
        if e[0] == 0x00: break
        if e[0] == 0xE5: continue
        out.append((e[0:11], e[11], struct.unpack_from("<H",e,26)[0] | (struct.unpack_from("<H",e,20)[0]<<16), struct.unpack_from("<I",e,28)[0]))
    return out
sha = lambda b: hashlib.sha256(b).hexdigest()
expected_root = [b"C5ENROLL   ", b"EFI        ", b"DB      AUT", b"KEK     AUT", b"PK      AUT"]
root = dents(2, "root")
names = [n for n,a,c,s in root if a != 0x08]
if [n for n,a,c,s in root] != expected_root:
    fail("root entries %r != contract %r" % ([n for n,a,c,s in root], expected_root))
blob_src = {b"DB      AUT": ("db2.auth" if mode == "db2" else "db.auth"),
            b"KEK     AUT": "kek.auth", b"PK      AUT": "pk.auth"}
for n,a,c,s in root:
    if a == 0x20:
        src = open(prep + "/" + blob_src[n], "rb").read()
        if s != len(src): fail("%s size %d != source %d" % (n, s, len(src)))
        back = read_file(c, s)
        if back != src: fail("%s bytes differ from source (sha %s vs %s)" % (n, sha(back), sha(src)))
        print("round-trip OK %-11s size=%d sha256=%s (source %s)" % (n.decode(), s, sha(back), blob_src[n]))
efi_clus = [c for n,a,c,s in root if n == b"EFI        "][0]
efi = dents(efi_clus, "/EFI")
if [n for n,a,c,s in efi] != [b".          ", b"..         ", b"BOOT       "]:
    fail("/EFI entries %r" % ([n for n,a,c,s in efi],))
if [c for n,a,c,s in efi if n == b"..         "][0] != 0:
    fail("/EFI '..' must point at cluster 0 (root parent)")
boot_clus = [c for n,a,c,s in efi if n == b"BOOT       "][0]
boot = dents(boot_clus, "/EFI/BOOT")
if [n for n,a,c,s in boot] != [b".          ", b"..         ", b"BOOTX64 EFI"]:
    fail("/EFI/BOOT entries %r" % ([n for n,a,c,s in boot],))
if [c for n,a,c,s in boot if n == b"..         "][0] != efi_clus:
    fail("/EFI/BOOT '..' must point at the /EFI cluster %d" % efi_clus)
an, aa, ac, asz = [t for t in boot if t[0] == b"BOOTX64 EFI"][0]
src = open(app, "rb").read()
if asz != len(src): fail("BOOTX64.EFI size %d != app %d" % (asz, len(src)))
back = read_file(ac, asz)
if back != src: fail("BOOTX64.EFI bytes differ from the enroll app (sha %s vs %s)" % (sha(back), sha(src)))
print("round-trip OK BOOTX64.EFI size=%d sha256=%s (source enroll_app)" % (asz, sha(back)))
print("directory round-trip: contract exact - names, sizes, SHAs verified; nothing missing, nothing extra")
PY
if [ "$_rt_rc" != 0 ]; then
  cat "$EVD/enroll-fat-roundtrip.log"
  echo "E_ENROLL_FAT_INVALID directory round-trip failed rc=$_rt_rc"; exit 97
fi
cat "$EVD/enroll-fat-roundtrip.log"
cp "$PRISTINE" "$EVD/vars.fd"
"$QEMU" -machine q35,smm=on -accel kvm -cpu "$CPU" \
  -drive if=pflash,format=raw,unit=0,readonly=on,file="$FW" \
  -drive if=pflash,format=raw,unit=1,file="$EVD/vars.fd" \
  -global driver=cfi.pflash01,property=secure,value=on \
  -debugcon file:"$EVD/ovmf-debug.log" -global isa-debugcon.iobase=0x402 \
  -display none -serial none -nic none -no-reboot -m 512 \
  -drive file="$IMG",format=raw,if=none,id=enroll,readonly=off \
  -device virtio-blk-pci,drive=enroll,serial=c5-enroll \
  -qmp unix:"$QMP_SOCK",server,nowait \
  -pidfile "$EVD/qemu.pid" -daemonize
# peer run-8 ask (1): runtime accelerator PROOF, never a TCG fallback - query-kvm over QMP,
# fail closed. (-accel kvm already refuses to start without KVM; this proves it in-log.)
python3 - "$EVD/qmp.sock" <<'PYQ'
import json, socket, sys
s=socket.socket(socket.AF_UNIX); s.settimeout(10); s.connect(sys.argv[1])
f=s.makefile("rw")
f.readline()
def cmd(c):
    f.write(json.dumps({"execute":c})+"\n"); f.flush()
    while True:
        r=json.loads(f.readline())
        if "return" in r or "error" in r: return r
cmd("qmp_capabilities")
r=cmd("query-kvm")
print("KVM PROOF query-kvm:", json.dumps(r.get("return")))
if r.get("return",{}).get("enabled") is not True:
    print("E_KVM_NOT_ACTIVE query-kvm enabled=%r (TCG fallback is forbidden)" % (r.get("return",{}).get("enabled"),)); sys.exit(97)
PYQ
# peer N1: a socket must never land in the evidence upload - unlink it right after query-kvm.
rm -f "$QMP_SOCK"
# peer N1b: prove the socket is actually gone (find -type f misses sockets; -e misses
# dangling symlinks, so both forms are checked).
[ ! -e "$QMP_SOCK" ] && [ ! -L "$QMP_SOCK" ] || { echo "E_QMP_SOCK_LEFTOVER $QMP_SOCK"; exit 97; }
sleep 25
PID=$(cat "$EVD/qemu.pid")
kill -TERM "$PID" 2>/dev/null || true; sleep 2; kill -KILL "$PID" 2>/dev/null || true
# extract ENROLL.TXT from the VOLUME ROOT of the FAT32 image (G2/T5 F4: the app writes it there)
_rc=0
python3 - "$IMG" > "$EVD/ENROLL.TXT" <<'PY' || _rc=$?
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
if [ "$_rc" != 0 ]; then
  # run-8 defect-2 evidence: the guest produced no ENROLL.TXT in the wait window; the
  # debugcon log is root-owned and was unreadable to the run-8 upload, so carry a bounded
  # tail into the tee'd ceremony log (runner-readable) on this failure path.
  echo "E_ENROLL_TXT_MISSING - no ENROLL.TXT on the enrollment volume after the 25s guest window"
  echo "----- begin ovmf-debug.log tail (last 200 lines) sha256=$(sha256sum "$EVD/ovmf-debug.log" | cut -d' ' -f1) size=$(stat -c %s "$EVD/ovmf-debug.log") -----"
  tail -n 200 "$EVD/ovmf-debug.log" || true
  echo "----- end ovmf-debug.log tail -----"
  exit 97
fi
cp "$EVD/vars.fd" "$OUT"
# frozen enrollment predicate gate (requirement 5a/5b resolution): any deviation fails the run
HERE="$(cd "$(dirname "$0")" && pwd)"
python3 "$HERE/enroll-predicate-check.py" "$MODE" "$EVD/ENROLL.TXT" "$PREP" "$OUT" "$HERE/../parse-ovmf-vars.py" | tee "$EVD/enroll-predicate.json"
echo "enrollment run complete -> $OUT"

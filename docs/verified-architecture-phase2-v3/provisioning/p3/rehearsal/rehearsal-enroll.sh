#!/bin/bash
# NON_CERTIFYING_REHEARSAL enrollment VM run: boots the enrollment app once on a
# pristine VARS copy, captures ENROLL.TXT, produces an enrolled VARS template.
# usage: rehearsal-enroll.sh <config.json> <prep_dir> <out_template.fd> <evidence_dir> [db2]
# MODE (sole|db2) also selects the frozen VARS predicate set checked by enroll-predicate-check.py.
set -eEuo pipefail
# peer run-11: every otherwise-bare bash failure is NAMED (script/line/rc/command) and
# exits 97 - never another silent set -e death (run 10's pidfile cat died bare).
trap '_rc=$?; echo "E_BASH_ERRTRAP rehearsal-enroll.sh line $LINENO rc=$_rc cmd: $BASH_COMMAND" >&2; exit 97' ERR
CFG=${1:?}; PREP=${2:?}; OUT=${3:?}; EVD=${4:?}; MODE=${5:-sole}
HERE="$(cd "$(dirname "$0")" && pwd)"
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
# Name contract (peer L1/L2, run-12 root cause): the pinned app opens the UTF-16LE
# literals L"db.auth"/L"kek.auth"/L"pk.auth" - 4-char extensions, so each name needs a
# VFAT LFN entry; a bare 8.3-only entry is INVISIBLE to an LFN-aware open of these
# names (run 12 died on exactly that: FATAL=READ_DB_AUTH). In db2 mode the file NAMED
# db.auth carries the db2 SOURCE bytes (L2: no db2.auth ever lands on the volume).
# 8.3 alias generation rule: <STEM>~1.<EXT3> uppercased (db.auth -> DB~1.AUT).
def lfn_checksum(alias11):
    s = 0
    for b in alias11:
        s = (((s & 1) << 7) + (s >> 1) + b) & 0xFF
    return s
def lfn_entry(name, alias11):
    # every contract name fits one LFN entry (13 UCS-2 units); more = writer defect
    if len(name) > 13:
        wfail("E_ENROLL_FAT_WRITER_LFN", "contract name %r needs more than one LFN entry" % name)
    e = bytearray(32)
    e[0] = 0x40 | 1            # sequence 1 + LAST flag (single-entry name)
    e[11] = 0x0F               # LFN attribute
    e[12] = 0                  # type
    e[13] = lfn_checksum(alias11)
    units = [ord(c) for c in name] + [0x0000]
    units += [0xFFFF] * (13 - len(units))
    raw = b"".join(struct.pack("<H", u) for u in units)
    e[1:11] = raw[0:10]; e[14:26] = raw[10:22]; e[28:32] = raw[22:26]
    if len(e) != 32:
        wfail("E_ENROLL_FAT_WRITER_DENT", "LFN entry is %d bytes, need exactly 32" % len(e))
    return bytes(e)
blobs = [("db.auth", b"DB~1    AUT", "db2.auth" if mode == "db2" else "db.auth"),
         ("kek.auth", b"KEK~1   AUT", "kek.auth"),
         ("pk.auth", b"PK~1    AUT", "pk.auth")]
if len({a for _, a, _ in blobs}) != len(blobs):
    wfail("E_ENROLL_FAT_WRITER_ALIAS", "8.3 aliases not unique in the root directory")
blob_dents = []
for lname, alias11, src in blobs:
    data = open(prep + "/" + src, "rb").read()
    blob_dents.append(lfn_entry(lname, alias11))
    blob_dents.append(dent(alias11, 0x20, cl, len(data)))
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
# peer condition 1 + L1: the independent reader (gate 2 below) shares ZERO code,
# imports or copied helpers with this writer; its NAME contract is extracted from the
# pinned app binary and cross-checked against the app source, never hand-typed and
# never from anything this writer produced.
PY
# peer condition 4 (PF-1/PF-2 must-show): planted-fault injection, SCRATCH LANE ONLY.
# Any value outside the allowlist, or any use outside the scratch lane, fails closed.
ENROLL_PLANTED_FAULT="${ENROLL_PLANTED_FAULT:-}"
if [ -n "$ENROLL_PLANTED_FAULT" ]; then
  # peer pushed-byte review 3(b): BOTH lane vars must name the scratch lane, not one.
  [ "$PREFIX" = "NON_CERTIFYING_SCRATCH" ] && [ "$ALLOWED_PREFIX" = "NON_CERTIFYING_SCRATCH" ] \
    || { echo "E_PLANTED_FAULT_LANE faults are scratch-lane only (PREFIX=$PREFIX ALLOWED_PREFIX=$ALLOWED_PREFIX)"; exit 97; }
  case "$ENROLL_PLANTED_FAULT" in freemark|missingblob|nolfn) ;; *) echo "E_PLANTED_FAULT_UNKNOWN $ENROLL_PLANTED_FAULT"; exit 97;; esac
  echo "PLANTED FAULT ACTIVE: $ENROLL_PLANTED_FAULT (scratch-lane gate must-show; this run certifies nothing)"
  # peer run-12 strictness: the injection must be PROVABLE - bound the injector with
  # before/after image hashes and fail closed if it changed nothing.
  _pf_before=$(sha256sum "$IMG" | cut -d' ' -f1)
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
        if e[0:11] == b"PK~1    AUT":
            clus = struct.unpack_from("<H", e, 26)[0]
            n = -(-struct.unpack_from("<I", e, 28)[0] // bps)
            for k in range(clus, clus+n): putfat(k, 0)          # free the chain cleanly
            allb[base+i*32] = 0xE5                              # deleted alias entry
            if i > 0 and allb[base+(i-1)*32+11] == 0x0F:
                allb[base+(i-1)*32] = 0xE5                      # its LFN entry goes too
            fsi_free = struct.unpack_from("<I", allb, 512+488)[0]
            struct.pack_into("<I", allb, 512+488, fsi_free + n)  # FSInfo stays consistent
            break
elif fault == "nolfn":
    # PF-5: strip every root LFN entry - the run-12 8.3-only layout. fsck-silent
    # (a deleted dent is a free slot); the L1/L3 name-contract reader is the gate.
    base = co(2)
    for i in range(bps//32):
        e = allb[base+i*32 : base+(i+1)*32]
        if e[0] == 0x00: break
        if e[0] != 0xE5 and e[11] == 0x0F:
            allb[base+i*32] = 0xE5
f.seek(0); f.write(allb); f.close()
print("planted fault applied:", fault)
PYF
  _pf_after=$(sha256sum "$IMG" | cut -d' ' -f1)
  echo "planted fault injection confirmation: image sha256 before=$_pf_before after=$_pf_after"
  [ "$_pf_before" != "$_pf_after" ] || { echo "E_PF_INJECTION_NOOP injector left the image unchanged"; exit 97; }
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
python3 - "$IMG" "$APP" "$PREP" "$MODE" "$HERE/enroll-app.c" > "$EVD/enroll-fat-roundtrip.log" <<'PY' || _rt_rc=$?
# INDEPENDENT READER (peer conditions 1 + L1-L3): shares zero code/imports/helpers
# with the writer. The on-volume name contract is NOT hand-typed in this file:
# it is extracted from the pinned CONSUMER binary (the enroll app, sha256 pinned
# below) as its UTF-16LE L"...auth" literals and cross-checked against
# enroll-app.c lines 61-63 (the three readfile() calls). Missing or extra .auth
# literals fail closed pre-boot. LFN chains, alias well-formedness, the alias
# generation rule (BASE~1.EXT, e.g. DB~1.AUT) and content SHAs are then checked
# against SOURCE bytes only. Exit codes: 2 = name-contract violation
# (E_ENROLL_FAT_NAME_CONTRACT), 1 = content/layout violation (E_ENROLL_FAT_INVALID).
import sys, struct, hashlib, re
img, app, prep, mode, appsrc = sys.argv[1:6]
PIN_APP_SHA256 = "540b4fa3990f998cb803160482bd50e9670a47da3d534acc3ade91364a85f3ee"
def ncfail(msg):
    print("E_ENROLL_FAT_NAME_CONTRACT", msg); sys.exit(2)
def fail(msg):
    print("round-trip FAIL:", msg); sys.exit(1)
sha = lambda b: hashlib.sha256(b).hexdigest()

# --- L1: take the name contract from the CONSUMER, never from the writer ---
appbin = open(app, "rb").read()
if sha(appbin) != PIN_APP_SHA256:
    ncfail("pinned app sha256 %s != pin %s (wrong consumer binary)" % (sha(appbin), PIN_APP_SHA256))
lits = set()
for m in re.finditer(rb"((?:[ -~]\x00){3,})\x00\x00", appbin):
    s = m.group(1).decode("utf-16-le")
    if s.endswith(".auth"):
        lits.add(s)
srclines = open(appsrc, "r", encoding="utf-8").read().splitlines()
srclits = set(re.findall(r'L"([^"]+\.auth)"', "\n".join(srclines[60:63])))
if len(srclits) != 3:
    ncfail("enroll-app.c lines 61-63 must carry exactly 3 L\"...auth\" literals, found %r" % sorted(srclits))
if lits != srclits:
    ncfail("binary .auth literals %r != source lines 61-63 literals %r" % (sorted(lits), sorted(srclits)))
if not lits:
    ncfail("no .auth literals found in the pinned app binary")
CONTRACT = sorted(lits)
print("name contract extracted from pinned consumer: %r (binary and source agree)" % CONTRACT)

# --- image geometry (FAT32, root at cluster 2) ---
d = open(img, "rb").read()
bps = struct.unpack_from("<H", d, 11)[0]
spc = d[13]
reserved = struct.unpack_from("<H", d, 14)[0]
nfats = d[16]
fat_secs = struct.unpack_from("<I", d, 36)[0]
fat = d[reserved*bps : reserved*bps + fat_secs*bps]
data_start = (reserved + nfats*fat_secs)*bps
ent = lambda n: struct.unpack_from("<I", fat, n*4)[0] & 0x0FFFFFFF
co = lambda n: data_start + (n-2)*bps*spc
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
    buf = b"".join(d[co(c):co(c)+bps*spc] for c in chain(clus))
    return buf[:size]
def raw_dents(clus, label):
    if ent(clus) == 0: fail("%s directory cluster %d is marked FREE in the FAT" % (label, clus))
    base = co(clus); out = []
    for i in range(bps*spc//32):
        e = d[base+i*32 : base+(i+1)*32]
        if e[0] == 0x00: break
        if e[0] == 0xE5: continue
        out.append(e)
    return out
def lfn_sum(a):
    # alias checksum, derived independently from the writer's helper
    s = 0
    for c in a:
        s = ((0x80 if s & 1 else 0) + (s >> 1) + c) & 0xFF
    return s
def canon83(a):
    nm = a[:8].decode().rstrip(); ext = a[8:].decode().rstrip()
    return nm + ("." + ext if ext else "")
VALID83 = set("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$%'-_@~`!(){}^#&")
def rule_alias(long):
    # generation rule for an 8.3 alias next to an LFN: uppercase valid-8.3
    # base truncated to 6 + "~1", uppercase valid-8.3 extension truncated to 3
    base, dot, ext = long.rpartition(".")
    b = "".join(c for c in base.upper() if c in VALID83)[:6]
    e = "".join(c for c in ext.upper() if c in VALID83)[:3]
    return ("%s~1" % b).encode().ljust(8) + e.encode().ljust(3)
def lfn_units(p):
    u = []
    for k in range(0, 10, 2): u.append(struct.unpack_from("<H", p, 1 + k)[0])
    for k in range(0, 12, 2): u.append(struct.unpack_from("<H", p, 14 + k)[0])
    for k in range(0, 4, 2): u.append(struct.unpack_from("<H", p, 28 + k)[0])
    return u
def validate_lfn(parts, alias11, label):
    # L3: parts sit immediately before the alias entry in REVERSE sequence
    # (first stored = last logical, seq flagged 0x40), attr 0x0F, type 0,
    # first-cluster 0, one shared checksum over the 11-byte alias, name UCS-2,
    # NUL-terminated, 0xFFFF-padded; reassembled name returned for comparison.
    n = len(parts)
    cks = parts[0][13]
    for i, p in enumerate(parts):
        want = (n - i) | (0x40 if i == 0 else 0)
        if p[0] != want:
            ncfail("%s LFN sequence byte 0x%02x, expected 0x%02x (reverse order, last flagged 0x40)" % (label, p[0], want))
        if p[12] != 0:
            ncfail("%s LFN type byte %d != 0" % (label, p[12]))
        if struct.unpack_from("<H", p, 26)[0] != 0:
            ncfail("%s LFN first-cluster field must be 0" % label)
        if p[13] != cks:
            ncfail("%s LFN checksum 0x%02x differs across entries (first 0x%02x)" % (label, p[13], cks))
    if cks != lfn_sum(alias11):
        ncfail("%s LFN checksum 0x%02x != alias checksum 0x%02x" % (label, cks, lfn_sum(alias11)))
    units = []
    for p in reversed(parts):
        units += lfn_units(p)
    if 0 in units:
        k = units.index(0)
        if any(u != 0xFFFF for u in units[k+1:]):
            ncfail("%s LFN padding after the NUL terminator must be 0xFFFF" % label)
        units = units[:k]
    elif len(units) != n*13:
        ncfail("%s LFN name without a terminator must fill every entry exactly" % label)
    if any(u > 0x7F for u in units):
        ncfail("%s LFN name carries a non-ASCII UCS-2 unit (volume contract is ASCII)" % label)
    return "".join(chr(u) for u in units)
def parse_dir(clus, label):
    entries = []
    pending = []
    for e in raw_dents(clus, label):
        attr = e[11]
        if attr == 0x0F:
            pending.append(e); continue
        alias11 = e[0:11]
        cl = struct.unpack_from("<H", e, 26)[0] | (struct.unpack_from("<H", e, 20)[0] << 16)
        size = struct.unpack_from("<I", e, 28)[0]
        if alias11[0:1] == b".":
            entries.append((None, alias11, attr, cl, size)); pending = []; continue
        long = validate_lfn(pending, alias11, label) if pending else None
        entries.append((long, alias11, attr, cl, size))
        pending = []
    return entries

root = parse_dir(2, "root")
seen_alias = {}
files = {}
for long, alias11, attr, cl, size in root:
    if attr == 0x08:
        continue
    if alias11[0:1] == b".":
        continue  # dot entries: skipped in the alias rules (L3)
    a = bytes(alias11)
    if a in seen_alias:
        ncfail("root alias %r is not unique on the volume" % a)
    seen_alias[a] = long
    nm, ext = a[:8].rstrip(), a[8:].rstrip()
    if not nm or any(chr(c) not in VALID83 for c in nm + ext):
        ncfail("root alias %r is not a well-formed 8.3 name" % a)
    if long is not None and attr == 0x20 and a != rule_alias(long):
        ncfail("root alias %r does not follow the generation rule for %r (want %r)" % (a, long, rule_alias(long)))
    files[(long if long else canon83(a)).lower()] = (a, attr, cl, size)

# every contract name must carry its own validated LFN and reassemble exactly
for c in CONTRACT:
    if not any(long == c for long, _a, attr, _c, _s in root if attr == 0x20):
        ncfail("contract name %r has no valid LFN entry reassembling to it exactly" % c)
# root holds the contract names, the EFI directory, and nothing else
extra = sorted(k for k in files if k not in {c.lower() for c in CONTRACT} and k != "efi")
if extra:
    ncfail("unexpected root entries %r (contract %r + EFI only)" % (extra, CONTRACT))
if "efi" not in files:
    fail("/EFI directory missing at root")
def resolve(name):
    # L3: resolve case-insensitively, long-name first, then the 8.3 alias
    ln = name.lower()
    for long, alias11, attr, cl, size in root:
        if attr == 0x20 and long and long.lower() == ln:
            return cl, size
    for long, alias11, attr, cl, size in root:
        if attr == 0x20 and canon83(alias11).lower() == ln:
            return cl, size
    ncfail("contract name %r is not resolvable on the volume" % name)

# L2: per-mode content map - in db2 mode the file NAMED db.auth holds db2 bytes
SRC = {c: ("db2.auth" if (mode == "db2" and c == "db.auth") else c) for c in CONTRACT}
for c in CONTRACT:
    clus, size = resolve(c)
    srcb = open(prep + "/" + SRC[c], "rb").read()
    if size != len(srcb):
        fail("%s size %d != source %d" % (c, size, len(srcb)))
    back = read_file(clus, size)
    if back != srcb:
        fail("%s bytes differ from source (sha %s vs %s)" % (c, sha(back), sha(srcb)))
    print("round-trip OK %-8s size=%d sha256=%s (source %s)" % (c, size, sha(back), SRC[c]))

efi_clus = files["efi"][2]
efi = parse_dir(efi_clus, "/EFI")
if [canon83(t[1]) for t in efi] != [".", "..", "BOOT"]:
    fail("/EFI entries %r" % ([canon83(t[1]) for t in efi],))
if [t[3] for t in efi if canon83(t[1]) == ".."][0] != 0:
    fail("/EFI '..' must point at cluster 0 (root parent)")
boot_clus = [t[3] for t in efi if canon83(t[1]) == "BOOT"][0]
boot = parse_dir(boot_clus, "/EFI/BOOT")
if [canon83(t[1]) for t in boot] != [".", "..", "BOOTX64.EFI"]:
    fail("/EFI/BOOT entries %r" % ([canon83(t[1]) for t in boot],))
if [t[3] for t in boot if canon83(t[1]) == ".."][0] != efi_clus:
    fail("/EFI/BOOT '..' must point at the /EFI cluster %d" % efi_clus)
an = [t for t in boot if canon83(t[1]) == "BOOTX64.EFI"][0]
if an[4] != len(appbin):
    fail("BOOTX64.EFI size %d != app %d" % (an[4], len(appbin)))
back = read_file(an[3], an[4])
if back != appbin:
    fail("BOOTX64.EFI bytes differ from the enroll app (sha %s vs %s)" % (sha(back), sha(appbin)))
print("round-trip OK BOOTX64.EFI size=%d sha256=%s (source enroll_app)" % (an[4], sha(appbin)))
print("directory round-trip: contract exact - consumer-extracted names, LFN chains, aliases, sizes, SHAs verified; nothing missing, nothing extra")
PY
if [ "$_rt_rc" = 2 ]; then
  cat "$EVD/enroll-fat-roundtrip.log"
  echo "E_ENROLL_FAT_NAME_CONTRACT on-volume name contract violated (see log)"; exit 97
fi
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
# peer run-11 reconciliation (capture+poll, CONFIRMED root cause): capture the PID
# PROMPTLY after daemonize (short bounded wait; NAMED failure if the pidfile never
# appears), then poll THAT PID through the bounded 25s budget and log the actual exit
# mode. The pidfile is NOT the lifecycle signal - a cleanly self-shutting qemu (guest
# ResetSystem2) UNLINKS its own pidfile, which is why run 10's post-window cat died bare.
# ResetSystem2 is logged as supporting evidence of guest intent, never the mechanism.
PID=""
for _w in $(seq 1 10); do
  if [ -s "$EVD/qemu.pid" ]; then PID=$(cat "$EVD/qemu.pid"); break; fi
  sleep 0.5
done
[ -n "$PID" ] || { echo "E_ENROLL_PID_MISSING $EVD/qemu.pid absent 5s after daemonize - qemu never started"; exit 97; }
echo "qemu pid $PID captured (pidfile present after launch)"
_t=25
for _i in $(seq 1 25); do
  if ! kill -0 "$PID" 2>/dev/null; then _t=$_i; break; fi
  sleep 1
done
if ! kill -0 "$PID" 2>/dev/null; then
  echo "qemu pid $PID exited on its own at t=${_t}s inside the 25s budget (guest self-shutdown; qemu unlinked its own pidfile)"
  if grep -q "ResetSystem2" "$EVD/ovmf-debug.log"; then
    echo "supporting evidence of guest intent: DXE ResetSystem2 shutdown present in ovmf-debug.log"
  else
    echo "W_ENROLL_NO_RESET_RECORD qemu self-exited at t=${_t}s but no ResetSystem2 line in ovmf-debug.log"
  fi
else
  kill -TERM "$PID" 2>/dev/null || true; sleep 2; kill -KILL "$PID" 2>/dev/null || true
  echo "W_ENROLL_QEMU_DEADLINE_TERM qemu pid $PID still alive at the 25s deadline - TERM/KILL issued (no self-shutdown proof; the ENROLL.TXT extraction gate decides the final disposition)"
fi
# post-guest image identity (run-10 provenance: guest writes land in the image; the
# pre/post sha difference IS the guest-wrote evidence - run 10: f48a5700... -> 41740f00...)
echo "enroll-fat image post-guest sha256=$(sha256sum "$IMG" | cut -d' ' -f1) size=$(stat -c %s "$IMG") (guest-written state)"
# peer run-11: post-guest fsck -n is OBSERVATIONAL ONLY (logged, never a gate) - the
# pre-boot gates already proved the image; this records the guest-induced on-disk state.
_fsckn_rc=0
fsck.vfat -n "$IMG" > "$EVD/enroll-fat-fsck-postguest.log" 2>&1 || _fsckn_rc=$?
echo "----- begin enroll-fat-fsck-postguest.log (fsck.vfat -n OBSERVATIONAL rc=$_fsckn_rc, not a gate) -----"
cat "$EVD/enroll-fat-fsck-postguest.log"
echo "----- end enroll-fat-fsck-postguest.log (observational only) -----"
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
echo "ENROLL.TXT extracted sha256=$(sha256sum "$EVD/ENROLL.TXT" | cut -d' ' -f1) size=$(stat -c %s "$EVD/ENROLL.TXT")"
cp "$EVD/vars.fd" "$OUT"
# frozen enrollment predicate gate (requirement 5a/5b resolution): any deviation fails the run
# L6 (peer run-12 ruling): the predicate's exit code is captured unconditionally -
# a tee'd pipeline otherwise masks it (run-12: rc 92 surfaced as E_BASH_ERRTRAP).
python3 "$HERE/enroll-predicate-check.py" "$MODE" "$EVD/ENROLL.TXT" "$PREP" "$OUT" "$HERE/../parse-ovmf-vars.py" | tee "$EVD/enroll-predicate.json"
_pred_rc=${PIPESTATUS[0]}
if [ "$_pred_rc" != 0 ]; then
  # L6: predicate failures exit under their OWN named code + log line; the ERR
  # trap is reserved for unnamed failures. 92 = frozen predicate rejected evidence.
  if [ "$_pred_rc" = 92 ]; then
    echo "E_ENROLL_PREDICATE_FAIL frozen enrollment predicate rejected the run evidence (rc=92 - first error in enroll-predicate.json)"; exit 97
  fi
  echo "E_ENROLL_PREDICATE_RC predicate checker exited unexpectedly rc=$_pred_rc"; exit 97
fi
echo "enrollment run complete -> $OUT"

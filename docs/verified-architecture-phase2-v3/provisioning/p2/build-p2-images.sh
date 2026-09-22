#!/bin/bash
# build-p2-images.sh - deterministic construction of the four P2 staging ext4 images.
# Contract: P2-STAGING-RECIPE.md (same directory). Offline construction only.
# No target mutation, no network use inside this script, no publishing.
# usage: build-p2-images.sh <repo_dir> <offline_input_dir> <evidence_dir> <fresh_work_dir>
set -euo pipefail

export LC_ALL=C
export TZ=UTC
umask 022

readonly EPOCH=1789923381
readonly REPO_COMMIT=92741cbdefaa78adc33bc3c74935a45f9558b88c
readonly REPO_TREE=9cc2e40fab25c2231d5a6cefa285d2e3e65a7bee
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PINS="$SCRIPT_DIR/offline-input-pins.v1.json"

P2_REPO=${1:?usage: build-p2-images.sh <repo_dir> <offline_input_dir> <evidence_dir> <fresh_work_dir>}
P2_INPUT_DIR=${2:?}
P2_EVIDENCE_DIR=${3:?}
WORK=${4:?}
[ -e "$WORK" ] && { echo "E_WORK_EXISTS $WORK" >&2; exit 1; }
mkdir -p "$WORK/images"

fail() { echo "FAIL $1" >&2; exit 1; }

echo "== build-p2-images.sh =="
echo "epoch=$EPOCH"
echo "umask=$(umask) LC_ALL=$LC_ALL TZ=$TZ"

echo "== tool identities =="
for t in mke2fs debugfs dumpe2fs e2fsck fakeroot python3 git tar truncate sha256sum; do
  p=$(command -v "$t") || fail "E_TOOL_MISSING $t"
  printf 'tool %s %s %s\n' "$t" "$p" "$(sha256sum "$p" | cut -d' ' -f1)"
done
mke2fs -V 2>&1 | head -1 | sed 's/^/tool-version mke2fs /'
debugfs -V 2>&1 | head -1 | sed 's/^/tool-version debugfs /'
e2fsck -V 2>&1 | head -1 | sed 's/^/tool-version e2fsck /'
fakeroot -v 2>&1 | head -1 | sed 's/^/tool-version fakeroot /'
python3 --version 2>&1 | sed 's/^/tool-version python3 /'
git --version | sed 's/^/tool-version git /'

echo "== input pin verification =="
python3 - "$PINS" "$P2_INPUT_DIR" "$P2_EVIDENCE_DIR" <<'PY'
import json,sys,hashlib,os
pins_fp,input_dir,ev_dir = sys.argv[1:4]
p=json.load(open(pins_fp))
def sha256(fp):
    h=hashlib.sha256()
    with open(fp,'rb') as f:
        for chunk in iter(lambda:f.read(1<<20),b''): h.update(chunk)
    return h.hexdigest()
bad=0
for group,base in (("offline_inputs",input_dir),("review_evidence",ev_dir)):
    for e in p[group]:
        fp=os.path.join(base,e["source_name"])
        if not os.path.isfile(fp):
            print("E_INPUT_MISSING",e["source_name"]); bad+=1; continue
        sz=os.path.getsize(fp); h=sha256(fp)
        if sz!=e["bytes"] or h!=e["sha256"]:
            print("E_INPUT_PIN_MISMATCH",e["source_name"],sz,h); bad+=1
        else:
            print("pin-ok",group,e["source_name"],e["bytes"],h)
if bad: sys.exit(1)
print("pin-verification: PASS", len(p["offline_inputs"]), "offline-inputs,", len(p["review_evidence"]), "review-evidence")
PY

echo "== repository identity =="
ct=$(git -C "$P2_REPO" show -s --format='%H %T %ct' "$REPO_COMMIT") || fail E_REPO_READ
[ "$ct" = "$REPO_COMMIT $REPO_TREE $EPOCH" ] || fail "E_REPO_IDENTITY $ct"
echo "repo $ct"

echo "== boot pair freeze + input manifest (from repo blobs) =="
python3 - "$PINS" "$P2_REPO" <<'PY'
import json,sys,hashlib,subprocess
pins_fp,repo = sys.argv[1:3]
p=json.load(open(pins_fp))
commit=p["accepted_source"]["commit"]
def blob_sha(path):
    data=subprocess.run(["git","-C",repo,"show",f"{commit}:{path}"],capture_output=True,check=True).stdout
    return len(data),hashlib.sha256(data).hexdigest()
bad=0
bp=p["boot_pair_freeze"]
for key in ("rootfs","verity","boot_policy"):
    n,h=blob_sha(bp[key]["repo_path"])
    if n!=bp[key]["bytes"] or h!=bp[key]["sha256"]:
        print("E_BOOT_PAIR",key,n,h); bad+=1
    else:
        print("freeze-ok",key,n,h)
dm=bp["dm_verity_metadata"]
n,h=blob_sha(dm["repo_path"])
if n!=dm["bytes"] or h!=dm["sha256"]:
    print("E_BOOT_PAIR dm_verity_metadata",n,h); bad+=1
else:
    print("freeze-ok dm_verity_metadata",n,h)
oim=p["offline_input_manifest"]
base="docs/verified-architecture-phase2-v3/bootstrap-concrete-candidates/"
for key in ("bin","sig","public_key"):
    e=oim[key]
    n,hh=blob_sha(base+e["source_name"])
    if n!=e["bytes"] or hh!=e["sha256"]:
        print("E_INPUT_MANIFEST",key,n,hh); bad+=1
    else:
        print("manifest-ok",key,n,hh)
if bad: sys.exit(1)
print("boot-pair-freeze + input-manifest: PASS")
PY

echo "== staging =="
# reviewed-root: /repo + /input-manifest + marker
SR="$WORK/stage-reviewed-root"
mkdir -p "$SR/repo" "$SR/input-manifest"
git -C "$P2_REPO" archive "$REPO_COMMIT" | tar -x -C "$SR/repo"
B="docs/verified-architecture-phase2-v3/bootstrap-concrete-candidates"
git -C "$P2_REPO" show "$REPO_COMMIT:$B/offline-input-manifest.v1.bin" > "$SR/input-manifest/offline-input-manifest.v1.bin"
git -C "$P2_REPO" show "$REPO_COMMIT:$B/offline-input-manifest.v1.sig" > "$SR/input-manifest/offline-input-manifest.v1.sig"
git -C "$P2_REPO" show "$REPO_COMMIT:$B/offline-root-ed25519-public.pem" > "$SR/input-manifest/offline-root-ed25519-public.pem"
printf '%s' 'reviewed-root' > "$SR/.v3-volume-role"

# reviewed-input: /offline-inputs + /review-evidence + /binding.v1.json + marker
SI="$WORK/stage-reviewed-input"
mkdir -p "$SI/offline-inputs" "$SI/review-evidence"
python3 - "$PINS" "$P2_INPUT_DIR" "$P2_EVIDENCE_DIR" "$SI" <<'PY'
import json,sys,shutil,os
pins_fp,input_dir,ev_dir,stage = sys.argv[1:5]
p=json.load(open(pins_fp))
for e in p["offline_inputs"]:
    shutil.copyfile(os.path.join(input_dir,e["source_name"]), stage+e["image_path"])
for e in p["review_evidence"]:
    shutil.copyfile(os.path.join(ev_dir,e["source_name"]), stage+e["image_path"])
binding={"binding_version":1,
 "accepted_source_commit":p["accepted_source"]["commit"],
 "accepted_source_tree":p["accepted_source"]["tree"],
 "offline_input_manifest_sha256":p["offline_input_manifest"]["bin"]["sha256"],
 "offline_input_manifest_sig_sha256":p["offline_input_manifest"]["sig"]["sha256"],
 "offline_root_ed25519_public_key_sha256":p["offline_input_manifest"]["public_key"]["sha256"],
 "review_evidence_zip_sha256":p["review_evidence_zip"]["sha256"],
 "review_evidence_zip_bytes":p["review_evidence_zip"]["bytes"],
 "review_evidence_zip_url":p["review_evidence_zip"]["url"],
 "evidence_manifest_sha256":p["review_evidence_zip"]["evidence_manifest_sha256"],
 "signed_uki_sha256":"133096976ee70a8c272cbcc8c28d369bfc65d93d994cbff4174b947df00239d1",
 "db_certificate_der_sha256":"7cda4ddc149849cc61191d4b5b3d218d14770c0401e9e66dd9617b82ba1ae441"}
data=json.dumps(binding, sort_keys=True, separators=(",",":"))+"\n"
open(stage+"/binding.v1.json","w").write(data)
import hashlib
print("binding.v1.json",len(data),hashlib.sha256(data.encode()).hexdigest())
PY
printf '%s' 'reviewed-input' > "$SI/.v3-volume-role"

# reviewed-output / reviewed-evidence: marker only
SO="$WORK/stage-reviewed-output"
SE="$WORK/stage-reviewed-evidence"
mkdir -p "$SO" "$SE"
printf '%s' 'reviewed-output' > "$SO/.v3-volume-role"
printf '%s' 'reviewed-evidence' > "$SE/.v3-volume-role"

build_image() { # name label uuid inodes size journal(0|1) stagedir rootmode
  local name=$1 label=$2 uuid=$3 inodes=$4 size=$5 journal=$6 stage=$7 rootmode=$8
  find "$stage" -type d -exec chmod 0755 {} +
  find "$stage" -type f -exec chmod 0444 {} +
  chmod "$rootmode" "$stage"
  find "$stage" -exec touch -h -d "@$EPOCH" {} +
  local img="images/$name.ext4"
  truncate -s "$size" "$WORK/$img"
  local opts=(-q -t ext4 -F -L "$label" -U "$uuid" -E "hash_seed=$uuid" -N "$inodes" -m 0 -b 4096 -d "$stage")
  [ "$journal" = 0 ] && opts+=(-O ^has_journal)
  fakeroot -- mke2fs "${opts[@]}" "$WORK/$img"
  { [ "$rootmode" != 0755 ] && printf 'sif <2> mode 04%s\n' "$rootmode"
    for i in $(seq 1 "$inodes"); do
      printf 'sif <%s> crtime @%s\nsif <%s> ctime @%s\nsif <%s> atime @%s\nsif <%s> mtime @%s\n' "$i" "$EPOCH" "$i" "$EPOCH" "$i" "$EPOCH" "$i" "$EPOCH"
    done
    printf 'ssv mtime @%s\nssv wtime @%s\nssv lastcheck @%s\nssv mkfs_time @%s\n' "$EPOCH" "$EPOCH" "$EPOCH" "$EPOCH"
  } | debugfs -w "$WORK/$img" >/dev/null 2>&1
  [ "$(debugfs -R 'stat <2>' "$WORK/$img" 2>/dev/null | grep -c "0x$(printf '%08x' "$EPOCH"):")" = 4 ] || fail "E_TIME_PIN $name"
  python3 - "$WORK/$img" "$EPOCH" <<'PY'
import sys,struct
img,epoch=sys.argv[1],int(sys.argv[2])
POLY=0x82F63B78
T=[]
for i in range(256):
    c=i
    for _ in range(8): c=(c>>1)^POLY if c&1 else c>>1
    T.append(c)
def raw_crc32c(data, init=0xFFFFFFFF):
    crc=init
    for b in data: crc=T[(crc^b)&0xFF]^(crc>>8)
    return crc
def backup_groups(groups, sparse):
    if not sparse: return set(range(groups))
    out=set()
    for base in (3,5,7):
        g=1
        while g<groups:
            out.add(g); g*=base
    return out
with open(img,"r+b") as f:
    f.seek(1024); primary=bytes(f.read(1024))
    block_count=struct.unpack_from("<I",primary,0x04)[0]
    log_bs=struct.unpack_from("<I",primary,0x18)[0]
    bs=1024<<log_bs
    bpg=struct.unpack_from("<I",primary,0x20)[0]
    first_data=struct.unpack_from("<I",primary,0x14)[0]
    ro_compat=struct.unpack_from("<I",primary,0x64)[0]
    sparse=bool(ro_compat&0x0001)
    groups=-(-(block_count-first_data)//bpg)
    locations=[1024]+[g*bpg*bs for g in sorted(backup_groups(groups,sparse))]
    for off0 in locations:
        f.seek(off0); sb=bytearray(f.read(1024))
        if struct.unpack_from("<H",sb,0x38)[0]!=0xEF53:
            print("E_SB_MAGIC",off0); sys.exit(1)
        for toff in (0x2C,0x30,0x40,0x108):    # mtime, wtime, lastcheck, mkfs_time
            struct.pack_into("<I",sb,toff,epoch)
        struct.pack_into("<I",sb,0x3FC,0)
        struct.pack_into("<I",sb,0x3FC,raw_crc32c(bytes(sb[:1020])))
        f.seek(off0); f.write(sb)
        f.seek(off0); chk=f.read(1024)
        for toff in (0x2C,0x30,0x40,0x108):
            if struct.unpack_from("<I",chk,toff)[0]!=epoch:
                print("E_SB_TIME_PIN",toff); sys.exit(1)
    print("sb-copies-pinned",len(locations))
PY
  e2fsck -fn "$WORK/$img" >/dev/null 2>&1 || fail "E_FSCK $name"
  printf 'image %s %s %s\n' "$name" "$(stat -c %s "$WORK/$img")" "$(sha256sum "$WORK/$img" | cut -d' ' -f1)"
}

build_image reviewed-root     v3-rev-root   639c6eaa-5345-d50e-9db5-736a6f06e730 2048 301989888 0 "$SR" 0755
build_image reviewed-input    v3-rev-input  58c398a0-c5a7-3f37-6e11-b9f38e20dab2  512 201326592 0 "$SI" 0755
build_image reviewed-output   v3-rev-output 6762c3c1-b7eb-a031-e02a-d5064c8e3ed8  128  16777216 1 "$SO" 0700
build_image reviewed-evidence v3-rev-evid   4031792a-6a3d-5acb-0f03-0d8f72dc8a4d  128  16777216 1 "$SE" 0700

rm -rf "$SR" "$SI" "$SO" "$SE"
echo "== build complete =="

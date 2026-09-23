#!/bin/bash
# NON_CERTIFYING_REHEARSAL ceremony runner. Runs under sudo unshare -n (network enforced off).
# usage: run-ceremony.sh CONFIG STAGE OUT   (run from the rehearsal directory)
set -euo pipefail
CONFIG="$1"; STAGE="$2"; OUT="$3"
HERE="$(cd "$(dirname "$0")" && pwd)"; cd "$HERE"
PREFIX="${PREFIX:-NON_CERTIFYING_REHEARSAL}"
# batch1r2 C1/T3-F8: fail closed on any pre-existing ceremony state (no silent reuse of
# stale build outputs, disks, or enrollment prep holding old throwaway keys).
for stale in build-output disks prep; do
  [ -e "$stale" ] && { echo "E_STALE_STATE $stale"; exit 93; }
done
mkdir -p "$OUT" build-output/esp build-output/esp-variant build-output/ovmf-debug build-output/enroll-app
"$HERE/make-shims.sh" "$STAGE" "$STAGE/shims" >/dev/null
export PATH="$STAGE/shims:$PATH"
# batch1r3 addendum2 (2b): the ceremony interpreter record, captured inside the sudo
# context; the workflow diffs it against the job-level host-inputs record.
pp=$(command -v python3); rp=$(realpath "$pp")
python3 - "$pp" "$rp" > "$OUT/$PREFIX-ceremony-python.txt" <<'PYEOF'
import sys, os, hashlib
pp, rp = sys.argv[1], sys.argv[2]
print("host-python path=" + pp)
print("host-python realpath=" + rp)
print("host-python realpath_sha256=" + hashlib.sha256(open(rp, "rb").read()).hexdigest())
print("host-python version=" + repr(sys.version))
print("host-python flags=" + repr(sys.flags))
print("host-python pythonhashseed=" + os.environ.get("PYTHONHASHSEED", "<unset>"))
PYEOF
[ -e /dev/kvm ] || { echo "E_NO_KVM"; exit 90; }
# inputs: disks, ESP variants, frozen ESP, DEBUG firmware
./make-disks.sh disks
for pair in "successor-unsigned.efi unsigned" "F-WRONGSIG.efi wrongsig" "F-HOSTILEUKI.efi hostile"; do
  set -- $pair
  ./build-esp-variant.sh "evidence/$1" "$2" "build-output/tmp-$2"
  mv "build-output/tmp-$2/NON_CERTIFYING_REHEARSAL-esp-$2.raw" build-output/esp-variant/
  rm -rf "build-output/tmp-$2"
done
# batch1r2 C1: the frozen ESP is copied from the dual-built workflow step, never rebuilt here
cp "/tmp/$PREFIX-esp-a/c5-root-admitter-uki-v3-esp.raw" build-output/esp/c5-root-admitter-uki-v3-esp.raw
cp "/tmp/$PREFIX-ovmf-a/OVMF_CODE.fd" build-output/ovmf-debug/OVMF_CODE.fd
cp "/tmp/$PREFIX-app-a/enroll-app.efi" build-output/enroll-app/enroll-app.efi
# batch1r2 C1: every config-declared ceremony input is hash-asserted before any enrollment or case
mapfile -t PINS < <(python3 - "$CONFIG" <<'PYEOF'
import json,sys
c=json.load(open(sys.argv[1]))
v=c["esp_variant_sha256"]
for h in (c["esp_sha256"],v["unsigned"],v["wrongsig"],v["hostile"],
          c["firmware_debug_sha256"],c["firmware_release_sha256"],c["enroll_app_sha256"]): print(h)
PYEOF
)
assert_sha() { local got; got=$(sha256sum "$1" | cut -d' ' -f1); [ "$got" = "$2" ] || { echo "E_INPUT_PIN_MISMATCH $1 $got"; exit 94; }; }
assert_sha build-output/esp/c5-root-admitter-uki-v3-esp.raw "${PINS[0]}"
assert_sha build-output/esp-variant/NON_CERTIFYING_REHEARSAL-esp-unsigned.raw "${PINS[1]}"
assert_sha build-output/esp-variant/NON_CERTIFYING_REHEARSAL-esp-wrongsig.raw "${PINS[2]}"
assert_sha build-output/esp-variant/NON_CERTIFYING_REHEARSAL-esp-hostile.raw "${PINS[3]}"
assert_sha build-output/ovmf-debug/OVMF_CODE.fd "${PINS[4]}"
assert_sha "$STAGE/root/usr/share/OVMF/OVMF_CODE_4M.secboot.fd" "${PINS[5]}"
assert_sha build-output/enroll-app/enroll-app.efi "${PINS[6]}"
# enrollments (three independent pristine VARS derivations, each a single enrollment invocation)
./enroll-prep.sh "$STAGE/root" prep evidence/c5-signing-cert.der evidence/C5-HOSTILE-FIXTURE.cer
trap 'rm -rf prep' EXIT
for mode in sole widened sole-fresh; do
  d="$OUT/$PREFIX-enroll-$mode"
  mkdir -p "$d"
  if [ "$mode" = widened ]; then
    ./rehearsal-enroll.sh "$CONFIG" prep "$d/vars-enrolled.fd" "$d/evidence" db2
  else
    ./rehearsal-enroll.sh "$CONFIG" prep "$d/vars-enrolled.fd" "$d/evidence"
  fi
done
# the throwaway PK/KEK private keys never leave the runner and are plain-deleted the moment
# the enrollment window closes; their DER hashes are already recorded in each enrollment's
# enroll-predicate.json evidence. (trap EXIT above also covers failure paths.)
rm -rf prep
# case suite (harness CLI: config + work_root)
python3 ./rehearsal-harness.py "$CONFIG" "$OUT/$PREFIX-cases"
# canonical ceremony manifest (streamed reads: never loads a full dump into memory)
python3 - "$OUT" <<'PYEOF'
import json, hashlib, os, sys
out=sys.argv[1]; entries=[]
for root,_,files in os.walk(out):
    for f in sorted(files):
        p=os.path.join(root,f); h=hashlib.sha256()
        with open(p,'rb') as fh:
            for chunk in iter(lambda: fh.read(1<<20), b''): h.update(chunk)
        entries.append({'path':os.path.relpath(p,out),'bytes':os.path.getsize(p),'sha256':h.hexdigest()})
man={'schema':'NON_CERTIFYING_REHEARSAL-manifest/v1',
     'note':'development rehearsal only; no certification semantics; closing marker must never appear',
     'files':sorted(entries,key=lambda e:e['path'])}
open(os.path.join(out,os.environ.get('PREFIX','NON_CERTIFYING_REHEARSAL')+'-manifest.json'),'w').write(json.dumps(man,indent=1,sort_keys=True)+'\n')
print('ceremony manifest:',len(entries),'evidence files')
PYEOF

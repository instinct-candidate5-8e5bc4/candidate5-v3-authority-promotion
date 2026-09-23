#!/bin/bash
# NON_CERTIFYING_REHEARSAL ceremony runner. Runs under sudo unshare -n (network enforced off).
# usage: run-ceremony.sh CONFIG STAGE OUT   (run from the rehearsal directory)
set -euo pipefail
CONFIG="$1"; STAGE="$2"; OUT="$3"
HERE="$(cd "$(dirname "$0")" && pwd)"; cd "$HERE"
mkdir -p "$OUT" build-output/esp build-output/esp-variant build-output/ovmf-debug build-output/enroll-app
"$HERE/make-shims.sh" "$STAGE" "$STAGE/shims" >/dev/null
export PATH="$STAGE/shims:$PATH"
[ -e /dev/kvm ] || { echo "E_NO_KVM"; exit 90; }
# inputs: disks, ESP variants, frozen ESP, DEBUG firmware
[ -d disks ] || ./make-disks.sh disks
for pair in "successor-unsigned.efi unsigned" "F-WRONGSIG.efi wrongsig" "F-HOSTILEUKI.efi hostile"; do
  set -- $pair
  [ -f "build-output/esp-variant/NON_CERTIFYING_REHEARSAL-esp-$2.raw" ] && continue
  rm -rf "build-output/tmp-$2"
  ./build-esp-variant.sh "evidence/$1" "$2" "build-output/tmp-$2"
  mv "build-output/tmp-$2/NON_CERTIFYING_REHEARSAL-esp-$2.raw" build-output/esp-variant/
  rm -rf "build-output/tmp-$2"
done
[ -f build-output/esp/c5-root-admitter-uki-v3-esp.raw ] || \
  ../build-esp-image.sh evidence/successor-signed.efi build-output/esp
[ -f build-output/ovmf-debug/OVMF_CODE.fd ] || \
  cp /tmp/NON_CERTIFYING_REHEARSAL-ovmf-a/OVMF_CODE.fd build-output/ovmf-debug/OVMF_CODE.fd
[ -f build-output/enroll-app/enroll-app.efi ] || \
  cp /tmp/NON_CERTIFYING_REHEARSAL-app-a/enroll-app.efi build-output/enroll-app/enroll-app.efi
# enrollments (three independent pristine VARS derivations, each a single enrollment invocation)
[ -d prep ] || ./enroll-prep.sh "$STAGE/root" prep evidence/c5-signing-cert.der evidence/C5-HOSTILE-FIXTURE.cer
for mode in sole widened sole-fresh; do
  d="$OUT/NON_CERTIFYING_REHEARSAL-enroll-$mode"
  [ -f "$d/vars-enrolled.fd" ] && continue
  mkdir -p "$d"
  if [ "$mode" = widened ]; then
    ./rehearsal-enroll.sh "$CONFIG" prep "$d/vars-enrolled.fd" "$d/evidence" db2
  else
    ./rehearsal-enroll.sh "$CONFIG" prep "$d/vars-enrolled.fd" "$d/evidence"
  fi
done
# reviewer ruling: the throwaway PK/KEK private keys never leave the runner and are
# plain-deleted the moment the enrollment window closes; their DER hashes are already
# recorded in each enrollment's enroll-predicate.json evidence.
rm -rf prep
# case suite (harness CLI: config + work_root)
python3 ./rehearsal-harness.py "$CONFIG" "$OUT/NON_CERTIFYING_REHEARSAL-cases"
# canonical ceremony manifest
python3 - "$OUT" <<'PYEOF'
import json, hashlib, os, sys
out=sys.argv[1]; entries=[]
for root,_,files in os.walk(out):
    for f in sorted(files):
        p=os.path.join(root,f)
        entries.append({'path':os.path.relpath(p,out),'bytes':os.path.getsize(p),
                        'sha256':hashlib.sha256(open(p,'rb').read()).hexdigest()})
man={'schema':'NON_CERTIFYING_REHEARSAL-manifest/v1',
     'note':'development rehearsal only; no certification semantics; closing marker must never appear',
     'files':sorted(entries,key=lambda e:e['path'])}
open(os.path.join(out,'NON_CERTIFYING_REHEARSAL-manifest.json'),'w').write(json.dumps(man,indent=1,sort_keys=True)+'\n')
print('ceremony manifest:',len(entries),'evidence files')
PYEOF

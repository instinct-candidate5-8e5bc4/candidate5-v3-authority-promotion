#!/bin/bash
# NON_CERTIFYING_REHEARSAL ceremony runner. Runs under sudo unshare -n (network enforced off).
# usage: run-ceremony.sh CONFIG STAGE OUT   (run from the rehearsal directory)
set -eEuo pipefail
# peer run-11: every otherwise-bare bash failure is NAMED (script/line/rc/command), exit 97.
trap '_rc=$?; echo "E_BASH_ERRTRAP run-ceremony.sh line $LINENO rc=$_rc cmd: $BASH_COMMAND" >&2; exit 97' ERR
# peer run-35959397469 ruling H5b: python children must never write bytecode inside the
# checkout; sudo env_reset strips the workflow-level PYTHONDONTWRITEBYTECODE, so set it here.
export PYTHONDONTWRITEBYTECODE=1
CONFIG="$1"; STAGE="$2"; OUT="$3"
HERE="$(cd "$(dirname "$0")" && pwd)"; cd "$HERE"
PREFIX="${PREFIX:-}"
[ -n "$PREFIX" ] || { echo "E_PREFIX_UNSET"; exit 97; }
[ "$PREFIX" = "${ALLOWED_PREFIX:-}" ] || { echo "E_PREFIX_MISMATCH prefix=$PREFIX allowed=$ALLOWED_PREFIX"; exit 97; }
# batch1r2 C1/T3-F8: fail closed on any pre-existing ceremony state (no silent reuse of
# stale build outputs, disks, or enrollment prep holding old throwaway keys).
for stale in build-output disks prep; do
  [ -e "$stale" ] && { echo "E_STALE_STATE $stale"; exit 93; }
done
mkdir -p "$OUT" build-output/esp build-output/esp-variant build-output/ovmf-debug build-output/enroll-app
# run-8 defect-1 fix: everything the ceremony writes as root under $OUT must be runner-
# readable for the runner-side evidence upload (run 8's zip died EACCES on the root-owned
# ovmf-debug.log and the whole evidence artifact was lost). Ephemeral CI output only -
# never hashed inputs; every change logged; explicit per-type modes (no -R, no capital X).
# peer run-8 ask (2): hash ALL evidence before any ownership/readability change, repair,
# hash again, assert equal. chown to the invoking user when under sudo (never root-upload);
# chmod fallback otherwise. The repair must never alter evidence BYTES.
_repair_out() {
  _rc=$?
  trap - ERR
  [ -d "$OUT" ] || return 0
  _before=$(find "$OUT" -type f -print0 | sort -z | xargs -0 -r sha256sum)
  _mode=chmod
  if [ -n "${SUDO_UID:-}" ] && [ -n "${SUDO_GID:-}" ]; then
    if chown -R "$SUDO_UID:$SUDO_GID" "$OUT"; then _mode=chown
    else echo "W_EVIDENCE_REPAIR_CHOWN chown failed rc=$? - falling back to chmod"; fi
  fi
  if [ "$_mode" = chmod ]; then
    find "$OUT" -type d ! -perm -005 -print -exec chmod o+rx {} + || true
    find "$OUT" -type f ! -perm -004 -print -exec chmod o+r {} + || true
  fi
  _after=$(find "$OUT" -type f -print0 | sort -z | xargs -0 -r sha256sum)
  # peer N3: the original named failure code is preserved - drift forces 96 ONLY when the
  # ceremony itself was succeeding; a primary failure (e.g. 97) is never masked to 0/96.
  if [ "$_before" != "$_after" ]; then
    echo "E_EVIDENCE_HASH_DRIFT readability repair altered evidence bytes"
    if [ "$_rc" -eq 0 ]; then exit 96; fi
    echo "W_EVIDENCE_HASH_DRIFT preserving primary failure exit=$_rc (drift exit 96 suppressed)"
  fi
  echo "evidence readability repair ($_mode): $(printf '%s' "$_after" | grep -c . || true) files, content hashes unchanged"
}
trap '_repair_out' EXIT
# peer-ordered #9 fix: make-shims output is evidence, never suppressed - captured to a
# named log under the out dir AND echoed; nonzero status preserved with a named error
# (the previous >/dev/null hid make-shims' E_LOADER_MISSING from the log).
SHIMS_LOG="$OUT/$PREFIX-ceremony-make-shims.log"
if "$HERE/make-shims.sh" "$STAGE" "$STAGE/shims" >"$SHIMS_LOG" 2>&1; then
  cat "$SHIMS_LOG"
else
  _rc=$?; cat "$SHIMS_LOG"; echo "E_CEREMONY_SHIMS make-shims.sh rc=$_rc log=$SHIMS_LOG"; exit 97
fi
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
# peer: logged-verdict network canary inside the ceremony's OWN unshare -n namespace, before
# any guest launch (the job-level canary only proved a fresh namespace). python3 raw-socket
# connect to a literal IP:443 - no DNS, no curl dependency, so a connect attempt ALWAYS
# happens (python3 is namespace-available: the ceremony python is cross-checked against the
# host record). The verdict is logged; no payload ever enters the log.
if python3 - <<'PYCANARY'
import socket, sys
s = socket.socket()
s.settimeout(5)
try:
    s.connect(("1.1.1.1", 443))
except OSError:
    sys.exit(0)  # connect failed: namespace is cut, as required
else:
    sys.exit(1)  # connect SUCCEEDED: leak
PYCANARY
then
  echo "network-cut canary (ceremony namespace, pre-guest): connect to 1.1.1.1:443 failed as required"
else
  echo "E_NET_CANARY_LEAK: network reachable inside the ceremony namespace"; exit 96
fi
# inputs: disks, ESP variants, frozen ESP, DEBUG firmware
./make-disks.sh disks
# peer 2026-09-24 route-(ii): the unsigned UKI and both fixtures are IN-RUN products
# (uki-build + c-fixtures steps; runner-ephemeral keys, nothing signed committed). Bind
# the fixture payload to the c-fixtures FIXTURE-SHASUMS record BEFORE building (fail
# closed on any drift), mirroring the c-sign SHASUMS binding below.
[ -f build-output/uki/successor-unsigned.efi ] || { echo "E_UKI_BUILD_MISSING build-output/uki/successor-unsigned.efi"; exit 94; }
[ -f build-output/c-sign/fixtures/FIXTURE-SHASUMS ] || { echo "E_FIXTURE_RECORD_MISSING build-output/c-sign/fixtures/FIXTURE-SHASUMS"; exit 94; }
( cd build-output/c-sign/fixtures && sha256sum -c FIXTURE-SHASUMS ) || { echo "E_FIXTURE_PAYLOAD_MISMATCH FIXTURE-SHASUMS"; exit 94; }
for pair in "build-output/uki/successor-unsigned.efi unsigned" "build-output/c-sign/fixtures/F-WRONGSIG.efi wrongsig" "build-output/c-sign/fixtures/F-HOSTILEUKI.efi hostile"; do
  set -- $pair
  ./build-esp-variant.sh "$1" "$2" "build-output/tmp-$2"
  mv "build-output/tmp-$2/NON_CERTIFYING_REHEARSAL-esp-$2.raw" build-output/esp-variant/
  rm -rf "build-output/tmp-$2"
done
# criterion C: the two runtime throwaway-signed ESP variants. Inputs are the c-sign step's
# outputs (in-run ephemeral key, plain-deleted there); they are NOT committed and NOT
# config-pinned. Bind them to the c-sign SHASUMS record BEFORE building (fail closed on
# any drift), then record the runtime ESP hashes into the ceremony evidence tree.
[ -f build-output/c-sign/SHASUMS ] || { echo "E_CSIGN_RECORD_MISSING build-output/c-sign/SHASUMS"; exit 94; }
( cd build-output/c-sign && sha256sum -c SHASUMS ) || { echo "E_THROWAWAY_PAYLOAD_MISMATCH c-sign SHASUMS"; exit 94; }
export C5_THROWAWAY_CERT_SHA256=$(awk '$2=="c5-throwaway-ci-cert.der"{print $1}' build-output/c-sign/SHASUMS)
[ -n "$C5_THROWAWAY_CERT_SHA256" ] || { echo "E_THROWAWAY_CERT_UNSET not in SHASUMS"; exit 94; }
for pair in "signed-ossl.efi ossl-throwaway" "signed-sbsign.efi sbsign-throwaway"; do
  set -- $pair
  ./build-esp-variant.sh "build-output/c-sign/$1" "$2" "build-output/tmp-$2"
  mv "build-output/tmp-$2/NON_CERTIFYING_REHEARSAL-esp-$2.raw" build-output/esp-variant/
  rm -rf "build-output/tmp-$2"
done
mkdir -p "$OUT"
( cd build-output && sha256sum esp-variant/NON_CERTIFYING_REHEARSAL-esp-ossl-throwaway.raw \
    esp-variant/NON_CERTIFYING_REHEARSAL-esp-sbsign-throwaway.raw c-sign/signed-ossl.efi \
    c-sign/signed-sbsign.efi c-sign/c5-throwaway-ci-cert.der ) > "$OUT/$PREFIX-throwaway-runtime.sha256"
# batch1r2 C1: the frozen ESP is copied from the dual-built workflow step, never rebuilt here
# scratch-8 peer ask: a missing/wrong-prefix source must FAIL with a NAMED error BEFORE cp
# (run 35931520373 died on cp's bare exit 1 with no gate code); print the exact path.
[ -f "/tmp/$PREFIX-esp-a/c5-root-admitter-uki-v3-esp.raw" ] || { echo "E_CEREMONY_SOURCE_ESP /tmp/$PREFIX-esp-a/c5-root-admitter-uki-v3-esp.raw"; exit 97; }
cp "/tmp/$PREFIX-esp-a/c5-root-admitter-uki-v3-esp.raw" build-output/esp/c5-root-admitter-uki-v3-esp.raw
[ -f "/tmp/$PREFIX-ovmf-a/OVMF_CODE.fd" ] || { echo "E_CEREMONY_SOURCE_OVMF /tmp/$PREFIX-ovmf-a/OVMF_CODE.fd"; exit 97; }
cp "/tmp/$PREFIX-ovmf-a/OVMF_CODE.fd" build-output/ovmf-debug/OVMF_CODE.fd
[ -f "/tmp/$PREFIX-app-a/enroll-app.efi" ] || { echo "E_CEREMONY_SOURCE_ENROLL /tmp/$PREFIX-app-a/enroll-app.efi"; exit 97; }
cp "/tmp/$PREFIX-app-a/enroll-app.efi" build-output/enroll-app/enroll-app.efi
# batch1r2 C1: every config-declared ceremony input is hash-asserted before any enrollment or case
mapfile -t PINS < <(python3 - "$CONFIG" <<'PYEOF'
import json,sys
c=json.load(open(sys.argv[1]))
# peer 2026-09-24 C2-route-(ii): ESP variants are built in-run from runner-ephemeral
# fixtures - their hashes are RECORDED below, never pinned; only the ceremony ESP
# (from the pinned history UKI), firmware, and enroll-app keep exact pins.
for h in (c["esp_sha256"],
          c["firmware_debug_sha256"],c["firmware_release_sha256"],c["enroll_app_sha256"]): print(h)
PYEOF
)
assert_sha() { local got; got=$(sha256sum "$1" | cut -d' ' -f1); [ "$got" = "$2" ] || { echo "E_INPUT_PIN_MISMATCH $1 $got"; exit 94; }; }
assert_sha build-output/esp/c5-root-admitter-uki-v3-esp.raw "${PINS[0]}"
( cd build-output && sha256sum esp-variant/NON_CERTIFYING_REHEARSAL-esp-unsigned.raw     esp-variant/NON_CERTIFYING_REHEARSAL-esp-wrongsig.raw     esp-variant/NON_CERTIFYING_REHEARSAL-esp-hostile.raw ) > "$OUT/$PREFIX-esp-variant-recorded.sha256"
assert_sha build-output/ovmf-debug/OVMF_CODE.fd "${PINS[1]}"
assert_sha "$STAGE/root/usr/share/OVMF/OVMF_CODE_4M.secboot.fd" "${PINS[2]}"
assert_sha build-output/enroll-app/enroll-app.efi "${PINS[3]}"
# #18 F3 (peer #17 final ruling): pre-guest static gate - every case vars_template must
# resolve (component-wise, the ONE resolver) into THIS ceremony's constructed enrolled-
# template set (F4 single source: lane_resolve.allowed_vars_templates); anything else dies
# named BEFORE any guest runs. Named exit codes pass up unchanged (L6 pattern).
_gate_rc=0
python3 ./lane_resolve.py gate "$CONFIG" "$OUT" || _gate_rc=$?
if [ "$_gate_rc" != 0 ]; then
  if [ "$_gate_rc" -ge 128 ]; then
    echo "E_BASH_ERRTRAP vars-template gate died on signal/trap rc=$_gate_rc"; exit 97
  fi
  exit "$_gate_rc"
fi
# enrollments (three independent pristine VARS derivations, each a single enrollment invocation)
./enroll-prep.sh "$STAGE/root" prep evidence/c5-signing-cert.der build-output/c-sign/fixtures/C5-HOSTILE-FIXTURE.cer
# criterion C: second prep whose db cert is the run's throwaway CI signing cert (wrong-signer
# fixture as the unused hostile arg, keeping the 2-cert prep shape). Same key hygiene: the
# throwaway PK/KEK private keys are plain-deleted with the prep dir below.
./enroll-prep.sh "$STAGE/root" prep-throwaway build-output/c-sign/c5-throwaway-ci-cert.der build-output/c-sign/fixtures/C5-WRONG-SIGNER-FIXTURE.cer
trap '_repair_out; rm -rf prep prep-throwaway' EXIT
for mode in sole widened sole-fresh throwaway; do
  d="$OUT/$PREFIX-enroll-$mode"
  mkdir -p "$d"
  _prep=prep; [ "$mode" = throwaway ] && _prep=prep-throwaway
  # L6 (peer run-12 ruling): the wrapper's NAMED exit code passes up unchanged;
  # E_BASH_ERRTRAP is reserved for signal/trap deaths (rc>=128), never for a
  # named gate failure (run-12: E_ENROLL_* rc 97 surfaced as E_BASH_ERRTRAP).
  _enroll_rc=0
  if [ "$mode" = widened ]; then
    ./rehearsal-enroll.sh "$CONFIG" "$_prep" "$d/vars-enrolled.fd" "$d/evidence" db2 || _enroll_rc=$?
  elif [ "$mode" = throwaway ]; then
    ./rehearsal-enroll.sh "$CONFIG" "$_prep" "$d/vars-enrolled.fd" "$d/evidence" throwaway || _enroll_rc=$?
  else
    ./rehearsal-enroll.sh "$CONFIG" "$_prep" "$d/vars-enrolled.fd" "$d/evidence" || _enroll_rc=$?
  fi
  if [ "$_enroll_rc" != 0 ]; then
    if [ "$_enroll_rc" -ge 128 ]; then
      echo "E_BASH_ERRTRAP enrollment mode=$mode died on signal/trap rc=$_enroll_rc"; exit 97
    fi
    echo "enrollment mode=$mode failed rc=$_enroll_rc (named gate code in its log above) - passing the failure up unchanged"
    exit "$_enroll_rc"
  fi
done
# the throwaway PK/KEK private keys never leave the runner and are plain-deleted the moment
# the enrollment window closes; their DER hashes are already recorded in each enrollment's
# enroll-predicate.json evidence. (trap EXIT above also covers failure paths.)
rm -rf prep prep-throwaway
# case suite (harness CLI: config + work_root + out_dir for the F4 allow-set construction)
# H4 (peer run-35959397469 ruling): the harness's NAMED exit code passes up unchanged
# (the L6 pattern from the F3 gate and enrollment wrappers); E_BASH_ERRTRAP is reserved
# for signal/trap deaths (rc>=128), never for a named harness failure (run 35959397469:
# harness rc 91 surfaced as E_BASH_ERRTRAP at this line).
_harness_rc=0
python3 ./rehearsal-harness.py "$CONFIG" "$OUT/$PREFIX-cases" "$OUT" || _harness_rc=$?
if [ "$_harness_rc" -ge 128 ]; then
  echo "E_BASH_ERRTRAP harness died on signal/trap rc=$_harness_rc"; exit 97
fi
if [ "$_harness_rc" -ne 0 ]; then
  echo "harness failed rc=$_harness_rc (named gate code in its output above) - passing the failure up unchanged"
  exit "$_harness_rc"
fi
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
man={'schema':'NON_CERTIFYING_REHEARSAL-manifest/v1','lane':os.environ['PREFIX'],
     'note':'development rehearsal only; no certification semantics; closing marker must never appear',
     'files':sorted(entries,key=lambda e:e['path'])}
open(os.path.join(out,os.environ['PREFIX']+'-manifest.json'),'w').write(json.dumps(man,indent=1,sort_keys=True)+'\n')
print('ceremony manifest:',len(entries),'evidence files')
PYEOF

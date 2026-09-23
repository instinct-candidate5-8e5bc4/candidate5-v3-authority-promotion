#!/bin/bash
# NON_CERTIFYING_REHEARSAL staging: downloads every deb in platform.lock.json, verifies
# each SHA-256, rejects any missing/extra/substituted package, extracts into a private tree.
# This is the ONLY network phase of the rehearsal. Usage: stage-platform.sh LOCK DEST
set -euo pipefail
LOCK="$1"; DEST="$2"
mkdir -p "$DEST/debs" "$DEST/root"
python3 - "$LOCK" "$DEST" <<'PYEOF'
import json, sys, urllib.request, hashlib, os
lock=json.load(open(sys.argv[1])); dest=sys.argv[2]
pkgs=lock['packages']
seen=set()
def fetch(e, fn):
    # hardened download (D3 ruling): explicit 60s per-request urllib timeout; at most 3
    # attempts, same lock-listed URL only (no mirror substitution); sha256 re-checked after
    # EVERY attempt; every attempt logged; final failure is E_LOCK_DOWNLOAD_FAILED exit 34.
    part=fn+'.part'
    for attempt in (1,2,3):
        print('download attempt %d/3: %s' % (attempt, e['name']), flush=True)
        try:
            with urllib.request.urlopen(e['url'], timeout=60) as r, open(part,'wb') as f:
                while True:
                    chunk=r.read(1<<20)
                    if not chunk: break
                    f.write(chunk)
        except Exception as ex:
            print('attempt %d/3 failed: %s: %s' % (attempt, e['name'], ex), file=sys.stderr, flush=True)
            if os.path.exists(part): os.unlink(part)
            continue
        d=hashlib.sha256(open(part,'rb').read()).hexdigest()
        if d==e['sha256']:
            print('verified %s (%d bytes)' % (e['name'], os.path.getsize(part)), flush=True)
            return
        print('attempt %d/3 sha256 mismatch: %s: got %s want %s' % (attempt, e['name'], d, e['sha256']), file=sys.stderr, flush=True)
        os.unlink(part)
    print('E_LOCK_DOWNLOAD_FAILED '+e['name'], file=sys.stderr)
    sys.exit(34)
for e in pkgs:
    fn=os.path.join(dest,'debs',e['url'].rsplit('/',1)[1])
    if os.path.exists(fn) and hashlib.sha256(open(fn,'rb').read()).hexdigest()==e['sha256']:
        seen.add(fn); continue
    fetch(e, fn)
    os.rename(fn+'.part', fn); seen.add(fn)
extra=[f for f in os.listdir(os.path.join(dest,'debs')) if os.path.join(dest,'debs',f) not in seen]
if extra:
    print('E_LOCK_EXTRA_FILES '+' '.join(extra), file=sys.stderr); sys.exit(32)
print('staged', len(seen), 'debs, all hashes verified')
PYEOF
for d in "$DEST"/debs/*.deb; do dpkg-deb -x "$d" "$DEST/root"; done
# extract the pristine VARS from the ovmf deb and record it
OVMF_VARS="$DEST/root/usr/share/OVMF/OVMF_VARS_4M.fd"
ACTUAL=$(sha256sum "$OVMF_VARS" | cut -d' ' -f1)
[ "$ACTUAL" = "5d2ac383371b408398accee7ec27c8c09ea5b74a0de0ceea6513388b15be5d1e" ] || { echo "E_VARS_PRISTINE_MISMATCH $ACTUAL" >&2; exit 33; }
echo "pristine OVMF_VARS_4M.fd verified: $ACTUAL"

# D4 source cache: edk2 + its pinned submodules are fetched ONCE here - staging is the ONLY
# network phase. Same policy as the debs: liveness timeout (http.lowSpeedLimit/lowSpeedTime)
# plus a hard per-attempt timeout(1), at most 3 attempts, always the SAME url (the edk2
# origin below; submodule urls come from .gitmodules AT the pinned commit - no mirror
# substitution), every attempt logged; final failure is E_SOURCE_STAGE_FAILED (exit 35).
# Pins: edk2 HEAD == EDK2_COMMIT and every submodule HEAD == the superproject gitlink, else
# E_SOURCE_PIN_MISMATCH (exit 36). Builds consume this cache OFFLINE only.
SRC="$DEST/sources"
EDK2_COMMIT=edc6681206c1a8791981a2f911d2fb8b3d2f5768   # edk2-stable202402 (same pin as build-ovmf-debug.sh)
EDK2_URL=https://github.com/tianocore/edk2.git
SUBMODULES="CryptoPkg/Library/OpensslLib/openssl CryptoPkg/Library/MbedTlsLib/mbedtls BaseTools/Source/C/BrotliCompress/brotli MdeModulePkg/Universal/RegularExpressionDxe/oniguruma MdeModulePkg/Library/BrotliCustomDecompressLib/brotli MdePkg/Library/MipiSysTLib/mipisyst MdePkg/Library/BaseFdtLib/libfdt ArmPkg/Library/ArmSoftFloatLib/berkeley-softfloat-3 RedfishPkg/Library/JsonLib/jansson"
src_fetch() { # desc, then git args (appended after the liveness -c options)
  local desc="$1"; shift
  local a
  for a in 1 2 3; do
    echo "source fetch attempt $a/3: $desc"
    if timeout 600 git -c http.lowSpeedLimit=10000 -c http.lowSpeedTime=60 "$@"; then
      return 0
    fi
    echo "source fetch attempt $a/3 failed: $desc" >&2
  done
  echo "E_SOURCE_STAGE_FAILED $desc" >&2
  exit 35
}
rm -rf "$SRC"; mkdir -p "$SRC"
git init -q "$SRC/edk2"
git -C "$SRC/edk2" remote add origin "$EDK2_URL"
src_fetch "edk2 $EDK2_COMMIT" -C "$SRC/edk2" fetch -q --depth 1 origin "$EDK2_COMMIT"
git -C "$SRC/edk2" checkout -q FETCH_HEAD
[ "$(git -C "$SRC/edk2" rev-parse HEAD)" = "$EDK2_COMMIT" ] || { echo "E_SOURCE_PIN_MISMATCH edk2 HEAD" >&2; exit 36; }
for sm in $SUBMODULES; do
  src_fetch "submodule $sm" -C "$SRC/edk2" submodule update -q --init --depth 1 -- "$sm"
done
for sm in $SUBMODULES; do
  want=$(git -C "$SRC/edk2" ls-tree HEAD -- "$sm" | awk '{print $3}')
  got=$(git -C "$SRC/edk2/$sm" rev-parse HEAD)
  [ "$want" = "$got" ] || { echo "E_SOURCE_PIN_MISMATCH $sm want $want got $got" >&2; exit 36; }
done
echo "source cache staged: edk2 $EDK2_COMMIT + $(echo $SUBMODULES | wc -w) submodules, all pins verified"

#!/bin/bash
# NON_CERTIFYING_REHEARSAL staging: downloads every deb in platform.lock.json, verifies
# each SHA-256, rejects any missing/extra/substituted package, extracts into a private tree.
# This is the ONLY network phase of the rehearsal. Usage: stage-platform.sh LOCK DEST
# batch1r3 D7: deb download fallback archive->snapshot.ubuntu.com (lock snapshot_ts); wrong bytes
# from any source fail immediately (E_LOCK_HASH_MISMATCH); per-deb source manifest is recorded.
set -euo pipefail
LOCK="$1"; DEST="$2"
mkdir -p "$DEST/debs" "$DEST/root"
python3 - "$LOCK" "$DEST" <<'PYEOF'
import json, sys, urllib.request, urllib.error, hashlib, os
lock=json.load(open(sys.argv[1])); dest=sys.argv[2]
# batch1r3 D7 (owner-approved snapshot.ubuntu.com fallback, 2026-09-23): ONE fixed
# snapshot_ts is frozen in the lock; the per-deb sha256/size in the lock remains the ONLY
# trust chain. Source order per deb: archive first (60s timeout, 3 attempts); the snapshot
# URL is tried only after the archive returns HTTP 404/410 or a network/timeout failure on
# all 3 attempts. Wrong bytes or wrong size from ANY source fail IMMEDIATELY
# (E_LOCK_HASH_MISMATCH exit 38, no retry, no fallback). Both sources unavailable:
# E_LOCK_DOWNLOAD_FAILED (exit 34). The per-deb source (archive|snapshot|preexisting-cache,
# final URL, attempts) is recorded in DEST/source-manifest.json; the source column is
# observational, the per-deb sha256 is deterministic evidence.
TS=lock.get('snapshot_ts')
if not TS: print('E_SNAPSHOT_TS missing in lock', file=sys.stderr); sys.exit(37)
pkgs=lock['packages']
seen=set(); sources=[]
def fetch_from(url, part):
    try:
        with urllib.request.urlopen(url, timeout=60) as r, open(part,'wb') as f:
            while True:
                chunk=r.read(1<<20)
                if not chunk: break
                f.write(chunk)
        return ('ok',)
    except urllib.error.HTTPError as ex:
        if os.path.exists(part): os.unlink(part)
        return ('http', ex.code)
    except Exception as ex:
        if os.path.exists(part): os.unlink(part)
        return ('net', str(ex))
def verify_bytes(e, part, url):
    if os.path.getsize(part)!=e['size']:
        print('E_LOCK_HASH_MISMATCH %s size %d != %d (%s)'%(e['name'],os.path.getsize(part),e['size'],url), file=sys.stderr); sys.exit(38)
    d=hashlib.sha256(open(part,'rb').read()).hexdigest()
    if d!=e['sha256']:
        print('E_LOCK_HASH_MISMATCH %s sha256 %s != %s (%s)'%(e['name'],d,e['sha256'],url), file=sys.stderr); sys.exit(38)
    return d
def fetch(e, fn):
    part=fn+'.part'
    pool=e['url'].split('/ubuntu/',1)[1]
    for source,url in (('archive',e['url']),
                       ('snapshot','https://snapshot.ubuntu.com/ubuntu/%s/%s'%(TS,pool))):
        last=None
        for a in (1,2,3):
            print('download attempt %d/3 [%s]: %s' % (a,source,e['name']), flush=True)
            res=fetch_from(url,part)
            if res[0]=='ok':
                d=verify_bytes(e,part,url)
                print('verified %s (%d bytes, %s)' % (e['name'],e['size'],source), flush=True)
                sources.append({'name':e['name'],'source':source,'url':url,'attempts':a,'sha256':d,'size':e['size']})
                return
            print('attempt %d/3 [%s] failed: %s: %s' % (a,source,e['name'],res[1]), file=sys.stderr, flush=True)
            last=res
        print('source unavailable [%s] for %s: %s' % (source,e['name'],last), file=sys.stderr, flush=True)
    print('E_LOCK_DOWNLOAD_FAILED '+e['name'], file=sys.stderr)
    sys.exit(34)
for e in pkgs:
    fn=os.path.join(dest,'debs',e['url'].rsplit('/',1)[1])
    if os.path.exists(fn) and hashlib.sha256(open(fn,'rb').read()).hexdigest()==e['sha256']:
        seen.add(fn)
        sources.append({'name':e['name'],'source':'preexisting-cache','url':e['url'],'attempts':0,'sha256':e['sha256'],'size':e['size']})
        continue
    fetch(e, fn)
    os.rename(fn+'.part', fn); seen.add(fn)
extra=[f for f in os.listdir(os.path.join(dest,'debs')) if os.path.join(dest,'debs',f) not in seen]
if extra:
    print('E_LOCK_EXTRA_FILES '+' '.join(extra), file=sys.stderr); sys.exit(32)
man={'schema':'NON_CERTIFYING_REHEARSAL-source-manifest/v1','snapshot_ts':TS,
     'note':'per-deb source is observational; the per-deb sha256 is the deterministic trust chain',
     'packages':sources}
open(os.path.join(dest,'source-manifest.json'),'w').write(json.dumps(man,indent=1,sort_keys=True)+'\n')
print('staged', len(seen), 'debs, all hashes verified; source manifest:', len(sources), 'entries')
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

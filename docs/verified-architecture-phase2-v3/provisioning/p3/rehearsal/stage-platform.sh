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
for e in pkgs:
    fn=os.path.join(dest,'debs',e['url'].rsplit('/',1)[1])
    if os.path.exists(fn) and hashlib.sha256(open(fn,'rb').read()).hexdigest()==e['sha256']:
        seen.add(fn); continue
    urllib.request.urlretrieve(fn and e['url'], fn+'.part')
    d=hashlib.sha256(open(fn+'.part','rb').read()).hexdigest()
    if d!=e['sha256']:
        os.unlink(fn+'.part'); print('E_LOCK_HASH_MISMATCH '+e['name'], file=sys.stderr); sys.exit(31)
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

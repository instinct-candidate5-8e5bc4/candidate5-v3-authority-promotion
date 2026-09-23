#!/bin/bash
# NON_CERTIFYING_REHEARSAL enrollment preparation: throwaway PK/KEK, ESLs, .auth blobs.
# Public inputs only; keys 0600 in a private dir, plain-deleted by the caller after use.
# usage: enroll-prep.sh <sbs_extract_dir> <work_dir> <production_cert.der> [hostile_cert.der]
set -euo pipefail
export LC_ALL=C TZ=UTC; umask 077
SBS=${1:?}; W=${2:?}; CERT=${3:?}; HOSTILE=${4:-}
# B1: sbvarsign runs ONLY through the loader-explicit shim (never the absolute staged path,
# which would bind host glibc/libcrypto); stderr is never discarded.
STAGE="$(dirname "$SBS")"
SHIMS="$STAGE/shims"
[ -x "$SHIMS/sbvarsign" ] || "$(dirname "$0")/make-shims.sh" "$STAGE" "$SHIMS"
SBV="$SHIMS/sbvarsign"
[ -x "$SBV" ] || { echo "E_NO_SBVARSIGN_SHIM $SBV" >&2; exit 92; }
[ -d "$W" ] && { echo "E_WORK_EXISTS" >&2; exit 1; }
mkdir -p "$W"
openssl req -new -newkey rsa:2048 -nodes -x509 -days 1 -subj "/CN=C5-THROWAWAY-PK/" -keyout "$W/pk.key" -out "$W/pk.crt" -sha256
openssl req -new -newkey rsa:2048 -nodes -x509 -days 1 -subj "/CN=C5-THROWAWAY-KEK/" -keyout "$W/kek.key" -out "$W/kek.crt" -sha256
openssl x509 -in "$W/pk.crt" -outform DER -out "$W/pk.cer"
openssl x509 -in "$W/kek.crt" -outform DER -out "$W/kek.cer"
python3 - "$CERT" "$W/kek.cer" "$W/pk.cer" "$HOSTILE" "$W" <<'PY'
import sys,struct
cert,kek,pk,hostile,W=sys.argv[1:6]
g=bytes.fromhex("a159c0a5e494a74a87b5ab155c2bf072")
disk=struct.pack("<IHH",int.from_bytes(g[0:4],'big'),int.from_bytes(g[4:6],'big'),int.from_bytes(g[6:8],'big'))+g[8:]
OWNER=struct.pack("<IHH",0xc501e570,0x0de0,0x0001)+bytes(8)
def esl(certs,out):
    # one EFI_SIGNATURE_LIST per distinct cert size, concatenated (spec-correct for mixed sizes)
    from collections import OrderedDict
    groups=OrderedDict()
    for c in certs:
        der=open(c,"rb").read()
        groups.setdefault(len(der),[]).append(der)
    blob=b""
    total=0
    for size,ders in groups.items():
        esz=16+size
        body=b"".join(OWNER+der for der in ders)
        lsz=28+len(body)
        blob+=disk+struct.pack("<III",lsz,0,esz)+body
        total+=len(ders)
    open(out,"wb").write(blob)
    print(out,"entries",total,"lists",len(groups),"bytes",len(blob))
esl([cert],f"{W}/db.esl")
esl([kek],f"{W}/kek.esl")
esl([pk],f"{W}/pk.esl")
if hostile: esl([cert,hostile],f"{W}/db2.esl")
PY
"$SBV" --key "$W/pk.key"  --cert "$W/pk.crt"  --output "$W/pk.auth"  PK  "$W/pk.esl"
"$SBV" --key "$W/pk.key"  --cert "$W/pk.crt"  --output "$W/kek.auth" KEK "$W/kek.esl"
"$SBV" --key "$W/kek.key" --cert "$W/kek.crt" --output "$W/db.auth"  db  "$W/db.esl"
if [ -n "$HOSTILE" ]; then
  "$SBV" --key "$W/kek.key" --cert "$W/kek.crt" --output "$W/db2.auth" db "$W/db2.esl"
fi
echo "enroll-prep complete (keys remain in $W for the enrollment window only)"

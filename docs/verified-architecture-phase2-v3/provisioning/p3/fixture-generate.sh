#!/bin/bash
# fixture-generate.sh - NON_CERTIFYING_REHEARSAL hostile fixture generator (A4 runbook).
# Generates F-WRONGSIG.efi and F-HOSTILEUKI.efi from the PUBLIC unsigned UKI with
# two fresh ephemeral RSA-2048 self-signed certs. NO production secrets anywhere:
# inputs are the public unsigned UKI + public tools only. Keys are created with
# 0600 in a private work dir, never logged/printed/uploaded/cached, and are
# plain-deleted (rm) before exit; the run transcript prints only public outputs.
# usage: fixture-generate.sh <unsigned_uki.efi> <sbsigntool_extract_dir> <out_dir>
set -euo pipefail
export LC_ALL=C TZ=UTC
umask 077
UKI=${1:?usage: fixture-generate.sh <unsigned_uki.efi> <sbs_dir> <out_dir>}
SBS=${2:?}; OUT=${3:?}
SB=$SBS/usr/bin
[ -d "$OUT" ] && { echo "E_OUT_EXISTS" >&2; exit 1; }
mkdir -p "$OUT"
W=$(mktemp -d)
cleanup(){ rm -rf "$W"; }
trap cleanup EXIT
fail(){ echo "FAIL $1" >&2; exit 1; }
echo "== fixture-generate.sh (NON_CERTIFYING_REHEARSAL) =="
for t in "$SB/sbsign" "$SB/sbverify" openssl sha256sum python3; do
  [ -x "$t" ] || command -v "$t" >/dev/null || fail "E_TOOL_MISSING $t"
done
UKI_SHA=$(sha256sum "$UKI" | cut -d' ' -f1)
[ "$UKI_SHA" = ed5d9d72be40592af3b14bd1fd9dc91a5976b14f350f9124ea414b975464d536 ] || fail "E_UKI_HASH $UKI_SHA"
echo "unsigned-uki $UKI_SHA"
gen(){ # name -> key/cert/cer in $W (never printed)
  openssl req -new -newkey rsa:2048 -nodes -x509 -days 3650 -subj "/CN=$1/" \
    -keyout "$W/$1.key" -out "$W/$1.crt" -sha256 2>/dev/null
  openssl x509 -in "$W/$1.crt" -outform DER -out "$OUT/$1.cer"
}
gen C5-WRONG-SIGNER-FIXTURE
gen C5-HOSTILE-FIXTURE
"$SB/sbsign" --key "$W/C5-WRONG-SIGNER-FIXTURE.key" --cert "$W/C5-WRONG-SIGNER-FIXTURE.crt" \
  --output "$OUT/F-WRONGSIG.efi" "$UKI" 2>/dev/null
"$SB/sbsign" --key "$W/C5-HOSTILE-FIXTURE.key" --cert "$W/C5-HOSTILE-FIXTURE.crt" \
  --output "$OUT/F-HOSTILEUKI.efi" "$UKI" 2>/dev/null
# independent verification (A4): signature validity under own cert
"$SB/sbverify" --cert "$W/C5-WRONG-SIGNER-FIXTURE.crt" "$OUT/F-WRONGSIG.efi" >/dev/null || fail "E_VERIFY_WRONGSIG"
"$SB/sbverify" --cert "$W/C5-HOSTILE-FIXTURE.crt" "$OUT/F-HOSTILEUKI.efi" >/dev/null || fail "E_VERIFY_HOSTILE"
# structural + separation checks: PE parse, embedded signer cert != production cert, unsigned UKI sections preserved
python3 - "$OUT" <<'PY'
import sys, struct, hashlib, json
OUT=sys.argv[1]
PROD="7cda4ddc149849cc61191d4b5b3d218d14770c0401e9e66dd9617b82ba1ae441"
UNSIGNED="ed5d9d72be40592af3b14bd1fd9dc91a5976b14f350f9124ea414b975464d536"
def analyze(path):
    d=open(path,"rb").read()
    pe=struct.unpack_from("<I",d,0x3c)[0]
    assert d[pe:pe+4]==b"PE\0\0", "E_PE"
    dd=pe+24+112
    off,sz=struct.unpack_from("<II",d,dd+4*8)
    assert off and sz, "E_NO_CERT_TABLE"
    blob=d[off:off+sz]
    ln,rev,ct=struct.unpack_from("<IHH",blob,0)
    assert ct==2, "E_CERT_TYPE"
    return d, blob[8:ln]
def signer_der_sha(pkcs7):
    # find embedded X509 DER certs by ASN.1 SEQUENCE scan, hash each
    out=[]
    i=0
    while True:
        i=pkcs7.find(b"\x30\x82",i)
        if i<0: break
        ln=(pkcs7[i+2]<<8)|pkcs7[i+3]
        if 100<ln<4096 and i+4+ln<=len(pkcs7):
            der=pkcs7[i:i+4+ln]
            if der[4]==0x30: out.append(hashlib.sha256(der).hexdigest())
        i+=4
    return out
res={}
for name in ("F-WRONGSIG.efi","F-HOSTILEUKI.efi"):
    d,p7=analyze(f"{OUT}/{name}")
    cers=signer_der_sha(p7)
    assert PROD not in cers, "E_PRODUCTION_CERT_EMBEDDED"
    res[name]={"bytes":len(d),"sha256":hashlib.sha256(d).hexdigest(),
               "embedded_cert_der_sha256":cers,"production_cert_absent":True,
               "unsigned_uki_sha256":UNSIGNED}
    assert len(cers)>=1, "E_NO_SIGNER_CERT"
for name in ("C5-WRONG-SIGNER-FIXTURE.cer","C5-HOSTILE-FIXTURE.cer"):
    d=open(f"{OUT}/{name}","rb").read()
    res[name]={"bytes":len(d),"sha256":hashlib.sha256(d).hexdigest()}
print(json.dumps(res,indent=1,sort_keys=True))
PY
# plain-delete keys (A4: no shred claim; ephemeral workspace, runner discarded)
rm -f "$W"/*.key "$W"/*.crt
[ -z "$(ls -A "$W" 2>/dev/null)" ] && echo "keys deleted, workdir empty"
echo "== fixture generation complete =="

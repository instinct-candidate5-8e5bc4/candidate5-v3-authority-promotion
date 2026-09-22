#!/bin/sh
# V3 Successor P1 evidence - SECOND, independent implementation of every signature
# check in verify-p1-evidence.py, using the OpenSSL CLI (3.x). Read-only, no network,
# no private material. Usage:
#   verify-p1-openssl.sh <signed-efi|-> <cert-der|-> <final-record|-> <detached-sig|-> <workdir>
# Sections with a "-" argument are skipped. A standalone PKCS#7 blob can be given
# via env P1_PKCS7=<path> (with all four arguments "-"). Pinned identities default
# to the accepted real evidence; fixture runs override via env:
#   P1_CERT_OFF P1_CERT_SIZE P1_PKCS7_BYTES P1_EXP_PE_DIGEST P1_EXP_PKCS7_SHA256
#   P1_EXP_CERT_SHA256 P1_EXP_SPC_CONTENT
#
# CMS verification is NOT openssl cms -verify: that decoder cannot process the
# accepted Microsoft SpcIndirectDataContent encoding (direct SEQUENCE eContent,
# OID 1.3.6.1.4.1.311.2.1.4). This script instead uses openssl asn1parse for
# structural extraction and then verifies independently: (1) embedded signer
# certificate byte equality, (2) SHA-256 of the exact SpcIndirectData content
# equals the signedAttrs messageDigest, (3) openssl dgst -sha256 -verify over the
# DER SET OF signedAttrs with the extracted 384-byte signature.
# Exit 0 with PASS lines; exit 1 with E_<CODE> on any mismatch.
set -eu
SIGNED=$1; CER=$2; FINAL=$3; SIG=$4; WORK=$5
EXP_CN='CN=V3 Successor UKI Secure Boot Authority'
P1_CERT_OFF=${P1_CERT_OFF:-21164544}
P1_CERT_SIZE=${P1_CERT_SIZE:-1872}
P1_PKCS7_BYTES=${P1_PKCS7_BYTES:-1864}
P1_EXP_PE_DIGEST=${P1_EXP_PE_DIGEST:-ab95a4c3fcf946679d2a46e87e64f28912ca5a7b27d642c70e6d5713f4065219}
P1_EXP_PKCS7_SHA256=${P1_EXP_PKCS7_SHA256:-440aebd415335218df88abbb9b858fabd3fa30d7d238c8e368f7adc6835de1e5}
P1_EXP_CERT_SHA256=${P1_EXP_CERT_SHA256:-7cda4ddc149849cc61191d4b5b3d218d14770c0401e9e66dd9617b82ba1ae441}
P1_EXP_SPC_CONTENT=${P1_EXP_SPC_CONTENT:-76}
P1_PKCS7=${P1_PKCS7:-}
die() { printf '%s %s\n' "$1" "$2" >&2; exit 1; }
off() { printf '%s' "$1" | cut -d: -f1 | tr -d ' '; }
hl()  { printf '%s' "$1" | sed 's/.*hl= *\([0-9][0-9]*\).*/\1/'; }
len() { printf '%s' "$1" | sed 's/.*l= *\([0-9][0-9]*\).*/\1/'; }
mkdir -p "$WORK"

# 1. Certificate identity and self-signature (OpenSSL) [skipped when CER=-]
if [ "$CER" != "-" ]; then
TXT=$WORK/cert.txt
openssl x509 -inform DER -in "$CER" -noout -text > "$TXT" || die E_CERT_PARSE openssl
grep -q "Public-Key: (3072 bit)" "$TXT" || die E_KEY_SIZE modulus
grep -q "Exponent: 65537" "$TXT" || die E_KEY_SIZE exponent
grep -q "Signature Algorithm: sha256WithRSAEncryption" "$TXT" || die E_CERT_ALG sigalg
ISS=$(openssl x509 -inform DER -in "$CER" -noout -issuer -nameopt RFC2253)
SUB=$(openssl x509 -inform DER -in "$CER" -noout -subject -nameopt RFC2253)
[ "$ISS" = "issuer=$EXP_CN" ] || die E_CERT_IDENTITY issuer
[ "$SUB" = "subject=$EXP_CN" ] || die E_CERT_IDENTITY subject
grep -A1 'X509v3 Key Usage: critical' "$TXT" | grep -q '^ *Digital Signature$' || die E_CERT_KU ku
grep -A1 'X509v3 Extended Key Usage:' "$TXT" | grep -q '^ *Code Signing$' || die E_CERT_EKU eku
grep -A1 'X509v3 Basic Constraints: critical' "$TXT" | grep -q '^ *CA:FALSE$' || die E_CERT_BC bc
openssl x509 -inform DER -in "$CER" -noout -pubkey > "$WORK/pub.pem" || die E_CERT_PARSE pubkey
# TBS + signature extraction via the independent ASN.1 parser
L2=$(openssl asn1parse -inform DER -in "$CER" | sed -n '2p')
TBS_OFF=$(off "$L2"); TBS_HL=$(hl "$L2"); TBS_L=$(len "$L2")
dd if="$CER" of="$WORK/tbs.der" bs=1 skip="$TBS_OFF" count=$((TBS_HL + TBS_L)) status=none
L3=$(openssl asn1parse -inform DER -in "$CER" | tail -1)
SIG_OFF=$(off "$L3"); SIG_HL=$(hl "$L3"); SIG_L=$(len "$L3")
dd if="$CER" of="$WORK/cersig.bin" bs=1 skip=$((SIG_OFF + SIG_HL + 1)) count=$((SIG_L - 1)) status=none
openssl dgst -sha256 -verify "$WORK/pub.pem" -signature "$WORK/cersig.bin" "$WORK/tbs.der" > "$WORK/certself.out" \
  || die E_CERT_SELF_SIG dgst
grep -q 'Verified OK' "$WORK/certself.out" || die E_CERT_SELF_SIG output
printf 'PASS cert-self-signature (openssl dgst)\n'
fi

# 2. PKCS#7 / Authenticode: asn1parse extraction + three independent checks
if [ -n "$P1_PKCS7" ]; then
  P7=$P1_PKCS7
else
  P7=$WORK/pkcs7.der
  dd if="$SIGNED" of="$P7" bs=1 skip=$((P1_CERT_OFF + 8)) count=$P1_PKCS7_BYTES status=none
fi
[ "$(stat -c%s "$P7")" = "$P1_PKCS7_BYTES" ] || die E_PKCS7 size
[ "$(sha256sum "$P7" | cut -d' ' -f1)" = "$P1_EXP_PKCS7_SHA256" ] || die E_PKCS7 identity
if [ "$SIGNED" != "-" ]; then
  [ "$(stat -c%s "$SIGNED")" = "$((P1_CERT_OFF + P1_CERT_SIZE))" ] || die E_AUTHENTICODE_TABLE eof
  GOT=$( { head -c 216 "$SIGNED"; tail -c +221 "$SIGNED" | head -c 76
           tail -c +305 "$SIGNED" | head -c $((P1_CERT_OFF - 304)); } | sha256sum | cut -d' ' -f1 )
  [ "$GOT" = "$P1_EXP_PE_DIGEST" ] || die E_AUTHENTICODE_DIGEST pe-recompute
  WL=$(tail -c +$((P1_CERT_OFF + 1)) "$SIGNED" | head -c 4 | od -An -tu4 | tr -d ' ')
  WR=$(tail -c +$((P1_CERT_OFF + 5)) "$SIGNED" | head -c 2 | od -An -tu2 | tr -d ' ')
  WT=$(tail -c +$((P1_CERT_OFF + 7)) "$SIGNED" | head -c 2 | od -An -tu2 | tr -d ' ')
  [ "$WL" = "$P1_CERT_SIZE" ] || die E_AUTHENTICODE_TABLE dwLength
  [ "$WR" = "512" ] || die E_AUTHENTICODE_TABLE revision
  [ "$WT" = "2" ] || die E_AUTHENTICODE_TABLE type
  printf 'PASS pe-authenticode-digest + certificate-table layout (sha256)\n'
fi
PARSE=$WORK/asn1.txt
openssl asn1parse -inform DER -in "$P7" > "$PARSE" || die E_PKCS7 asn1parse
ECT=$(grep -E 'd=4 +.*OBJECT' "$PARSE" | head -1 || true)
printf '%s' "$ECT" | grep -q '1\.3\.6\.1\.4\.1\.311\.2\.1\.4' || die E_PKCS7 eContentType-not-SpcIndirectDataContent
ALGS=$(awk '/d=3 .*cons: SET/{f=1;next} f==1&&/d=3 /{exit} f==1' "$PARSE")
N_ALG=$(printf '%s\n' "$ALGS" | grep -c 'cons: SEQUENCE' || true)
[ "$N_ALG" = "1" ] || die E_PKCS7 digestAlgorithms-count
printf '%s\n' "$ALGS" | grep -Eq ':sha256[[:space:]]*$' || die E_PKCS7 digestAlgorithms-oid
FORM=$(awk '/d=4 .*OBJECT.*311\.2\.1\.4/{f=1;next} f==1&&/d=4 .*cont \[ 0 \]/{f=2;next} f==2{print;exit}' "$PARSE")
printf '%s' "$FORM" | grep -q 'd=5 .*cons: SEQUENCE' || die E_PKCS7 eContent-not-direct-SEQUENCE
SPC_OFF=$(off "$FORM"); SPC_HL=$(hl "$FORM"); SPC_LEN=$(len "$FORM")
[ "$SPC_LEN" = "$P1_EXP_SPC_CONTENT" ] || die E_PKCS7 spc-content-length
dd if="$P7" of="$WORK/spc.bin" bs=1 skip=$((SPC_OFF + SPC_HL)) count=$SPC_LEN status=none
SPC_SHA=$(sha256sum "$WORK/spc.bin" | cut -d' ' -f1)
DI=$(grep -E 'd=7 .*OCTET STRING' "$PARSE" | head -1 || true)
[ -n "$DI" ] || die E_PKCS7 digestinfo-missing
dd if="$P7" of="$WORK/di.bin" bs=1 skip=$(( $(off "$DI") + $(hl "$DI") )) count=$(len "$DI") status=none
[ "$(od -An -tx1 "$WORK/di.bin" | tr -d ' \n')" = "$P1_EXP_PE_DIGEST" ] || die E_AUTHENTICODE_DIGEST digestinfo
ATT=$(grep -E 'd=5 .*cont \[ 0 \]' "$PARSE" | head -1 || true)
[ -n "$ATT" ] || die E_PKCS7 signedAttrs-missing
A_OFF=$(off "$ATT"); A_HL=$(hl "$ATT"); A_LEN=$(len "$ATT")
dd if="$P7" of="$WORK/attrs.der" bs=1 skip=$A_OFF count=$((A_HL + A_LEN)) status=none
printf '1' | dd of="$WORK/attrs.der" bs=1 count=1 conv=notrunc status=none   # 0x31 = ASCII '1'; dash printf has no \xHH
MDL=$(grep -E 'd=8 .*OCTET STRING' "$PARSE" | head -1 || true)
[ -n "$MDL" ] || die E_PKCS7 messageDigest-missing
dd if="$P7" of="$WORK/md.bin" bs=1 skip=$(( $(off "$MDL") + $(hl "$MDL") )) count=$(len "$MDL") status=none
[ "$(od -An -tx1 "$WORK/md.bin" | tr -d ' \n')" = "$SPC_SHA" ] || die E_AUTHENTICODE_DIGEST messageDigest
SIGL=$(grep -E 'd=5 .*OCTET STRING' "$PARSE" | head -1 || true)
[ -n "$SIGL" ] || die E_PKCS7 signature-missing
dd if="$P7" of="$WORK/cms-sig.bin" bs=1 skip=$(( $(off "$SIGL") + $(hl "$SIGL") )) count=$(len "$SIGL") status=none
openssl pkcs7 -print_certs -inform DER -in "$P7" -outform PEM -out "$WORK/p7-certs.pem" || die E_PKCS7 print_certs
openssl x509 -in "$WORK/p7-certs.pem" -outform DER -out "$WORK/p7-cert.der" || die E_PKCS7 certconv
if [ "$CER" != "-" ]; then
  cmp -s "$WORK/p7-cert.der" "$CER" || die E_AUTHENTICODE_SIGNER 'embedded cert != returned .cer'
fi
[ "$(sha256sum "$WORK/p7-cert.der" | cut -d' ' -f1)" = "$P1_EXP_CERT_SHA256" ] || die E_CERT_HASH 'embedded cert sha256'
openssl x509 -in "$WORK/p7-certs.pem" -noout -pubkey > "$WORK/p7-pub.pem" || die E_PKCS7 pubkey
openssl dgst -sha256 -verify "$WORK/p7-pub.pem" -signature "$WORK/cms-sig.bin" "$WORK/attrs.der" > "$WORK/cms-verify.out" 2>&1 \
  || die E_AUTHENTICODE_SIGNATURE 'openssl dgst -verify'
grep -q 'Verified OK' "$WORK/cms-verify.out" || die E_AUTHENTICODE_SIGNATURE output
TOP=$(sed -n '1p' "$PARSE")
DER_LEN=$(( $(hl "$TOP") + $(len "$TOP") ))
PAD=$(( $(stat -c%s "$P7") - DER_LEN ))
[ "$PAD" -ge 0 ] || die E_PKCS7 length
if [ "$PAD" -gt 0 ]; then
  if tail -c "$PAD" "$P7" | od -An -tx1 | grep -q '[1-9a-f]'; then die E_PKCS7 'non-zero trailing padding'; fi
fi
printf 'PASS pkcs7-structure + spc-binding + signer-cert-equality + signedAttrs-signature (asn1parse + openssl dgst)\n'

# 3. Detached RSA-PSS-SHA256 (salt 32) over SHA256(domain || 0x00 || final record)
if [ "$FINAL" != "-" ]; then
{ printf '%b' 'V3-SUCCESSOR-UKI-EXTERNAL-BINDING:v1\0'; cat "$FINAL"; } \
  | openssl dgst -sha256 -binary > "$WORK/preimage.bin"
openssl pkeyutl -verify -pubin -inkey "$WORK/pub.pem" -sigfile "$SIG" -in "$WORK/preimage.bin" \
  -pkeyopt rsa_padding_mode:pss -pkeyopt digest:sha256 \
  -pkeyopt rsa_pss_saltlen:32 -pkeyopt rsa_mgf1_md:sha256 > "$WORK/pss.out" 2>&1 \
  || die E_DETACHED_SIGNATURE "openssl pkeyutl -verify"
grep -q 'Signature Verified Successfully' "$WORK/pss.out" || die E_DETACHED_SIGNATURE output
printf 'PASS detached-pss-sha256-salt32 (openssl pkeyutl)\n'
fi
printf 'P1_OPENSSL_CROSSCHECK_PASS\n'

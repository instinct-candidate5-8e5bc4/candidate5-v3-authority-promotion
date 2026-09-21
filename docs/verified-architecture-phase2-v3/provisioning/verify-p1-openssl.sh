#!/bin/sh
# V3 Successor P1 evidence - SECOND, independent implementation of every signature
# check in verify-p1-evidence.py, using the OpenSSL CLI (3.x). Read-only, no network,
# no private material. Usage:
#   verify-p1-openssl.sh <signed-efi> <cert-der> <final-record> <detached-sig> <workdir>
# Exit 0 with PASS lines; exit 1 with E_<CODE> on any mismatch.
set -eu
SIGNED=$1; CER=$2; FINAL=$3; SIG=$4; WORK=$5
EXP_PE_DIGEST=ab95a4c3fcf946679d2a46e87e64f28912ca5a7b27d642c70e6d5713f4065219
EXP_CN='CN=V3 Successor UKI Secure Boot Authority'
CERT_OFF=21164544; CERT_SIZE=1872; PKCS7_BYTES=1864
die() { printf '%s %s\n' "$1" "$2" >&2; exit 1; }
mkdir -p "$WORK"

# 1. Certificate identity and self-signature (OpenSSL)
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
TBS_OFF=$(printf '%s' "$L2" | cut -d: -f1 | tr -d ' ')
TBS_HL=$(printf '%s' "$L2" | sed 's/.*hl= *\([0-9][0-9]*\).*/\1/' | tr -d ' ')
TBS_L=$(printf '%s' "$L2" | sed 's/.*l= *\([0-9][0-9]*\).*/\1/' | tr -d ' ')
dd if="$CER" of="$WORK/tbs.der" bs=1 skip="$TBS_OFF" count=$((TBS_HL + TBS_L)) status=none
L3=$(openssl asn1parse -inform DER -in "$CER" | tail -1)
SIG_OFF=$(printf '%s' "$L3" | cut -d: -f1 | tr -d ' ')
SIG_HL=$(printf '%s' "$L3" | sed 's/.*hl= *\([0-9][0-9]*\).*/\1/' | tr -d ' ')
SIG_L=$(printf '%s' "$L3" | sed 's/.*l= *\([0-9][0-9]*\).*/\1/' | tr -d ' ')
dd if="$CER" of="$WORK/cersig.bin" bs=1 skip=$((SIG_OFF + SIG_HL + 1)) count=$((SIG_L - 1)) status=none
openssl dgst -sha256 -verify "$WORK/pub.pem" -signature "$WORK/cersig.bin" "$WORK/tbs.der" > "$WORK/certself.out" \
  || die E_CERT_SELF_SIG dgst
grep -q 'Verified OK' "$WORK/certself.out" || die E_CERT_SELF_SIG output
printf 'PASS cert-self-signature (openssl dgst)\n'

# 2. Signed UKI: extract PKCS#7, verify CMS signature and embedded certificate
dd if="$SIGNED" of="$WORK/pkcs7.der" bs=1 skip=$((CERT_OFF + 8)) count=$PKCS7_BYTES status=none
openssl cms -verify -noverify -inform DER -in "$WORK/pkcs7.der" -out "$WORK/spc-content.der" \
  > "$WORK/cms.out" 2>&1 || die E_AUTHENTICODE_SIGNATURE "openssl cms -verify"
openssl pkcs7 -print_certs -inform DER -in "$WORK/pkcs7.der" -outform PEM -out "$WORK/p7-certs.pem" \
  || die E_PKCS7 print_certs
openssl x509 -in "$WORK/p7-certs.pem" -outform DER -out "$WORK/p7-cert.der" || die E_PKCS7 certconv
cmp -s "$WORK/p7-cert.der" "$CER" || die E_AUTHENTICODE_SIGNER 'embedded cert != returned .cer'
printf 'PASS cms-signature + signer-cert-equality (openssl cms)\n'

# 3. Detached RSA-PSS-SHA256 (salt 32) over SHA256(domain || 0x00 || final record)
{ printf '%b' 'V3-SUCCESSOR-UKI-EXTERNAL-BINDING:v1\0'; cat "$FINAL"; } \
  | openssl dgst -sha256 -binary > "$WORK/preimage.bin"
openssl pkeyutl -verify -pubin -inkey "$WORK/pub.pem" -sigfile "$SIG" -in "$WORK/preimage.bin" \
  -pkeyopt rsa_padding_mode:pss -pkeyopt digest:sha256 \
  -pkeyopt rsa_pss_saltlen:32 -pkeyopt rsa_mgf1_md:sha256 > "$WORK/pss.out" 2>&1 \
  || die E_DETACHED_SIGNATURE "openssl pkeyutl -verify"
grep -q 'Signature Verified Successfully' "$WORK/pss.out" || die E_DETACHED_SIGNATURE output
printf 'PASS detached-pss-sha256-salt32 (openssl pkeyutl)\n'
printf 'P1_OPENSSL_CROSSCHECK_PASS\n'

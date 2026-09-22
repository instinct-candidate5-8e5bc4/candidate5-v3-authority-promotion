#!/bin/sh
# V3 Successor P1.1 fixture harness: runs BOTH verifier implementations over every
# frozen fixture (positive + negative) and regenerates
# ../p1-tool-fixture-evidence.v1.json from the observed results. Read-only against
# the repository except that one evidence file. Usage: sh run-fixture-tests.sh [repo-root]
set -eu
HERE=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROV=$(dirname "$HERE")
REPO=${1:-$(dirname "$(dirname "$(dirname "$PROV")")")}
PYV=$PROV/verify-p1-evidence.py
SHV=$PROV/verify-p1-openssl.sh
MAN=$HERE/fixture-manifest.v1.json
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
R=$WORK/results; mkdir -p "$R"

SYN_PE=$(jq -r .profiles.synthetic.peAuthenticodeDigestSha256 "$MAN")
SYN_P7=$(jq -r .profiles.synthetic.pkcs7Sha256 "$MAN")
SYN_CERT=$(jq -r .profiles.synthetic.certDerSha256 "$MAN")
SYN_P7B=$(jq -r .profiles.synthetic.pkcs7Bytes "$MAN")
SYN_EFIB=$(jq -r .profiles.synthetic.signedUkiBytes "$MAN")

pycode() { # mode profile file -> first stderr token
  python3 "$PYV" --repo "$REPO" --fixture "$MAN" ${2:+--fixture-profile "$2"} --pkcs7 "$HERE/$1" --no-pin 2>&1 >/dev/null | awk '{print $1}'
}
pycode_efi() {
  python3 "$PYV" --repo "$REPO" --fixture "$MAN" --signed-efi "$HERE/$1" --cert-der "$HERE/synthetic-cert.der" --no-pin 2>&1 >/dev/null | awk '{print $1}'
}
shcode() { # pkcs7-file profile(pe_digest, cert_sha, p7sha auto=own file) -> first stderr token
  F=$HERE/$1
  P1_PKCS7="$F" P1_PKCS7_BYTES=$(stat -c%s "$F") P1_EXP_PKCS7_SHA256=$(sha256sum "$F" | cut -d' ' -f1) \
  P1_EXP_PE_DIGEST=$2 P1_EXP_CERT_SHA256=$3 \
    sh "$SHV" - - - - "$WORK/shneg" 2>&1 >/dev/null | awk '{print $1}'
}

# ---- python positives ----
python3 "$PYV" --repo "$REPO" --fixture "$MAN" --fixture-profile realAccepted \
  --pkcs7 "$HERE/accepted-authenticode-spc.pkcs7" --report "$R/py-real-pkcs7.json" >/dev/null
python3 "$PYV" --repo "$REPO" --fixture "$MAN" --pkcs7 "$HERE/synthetic-spc.pkcs7" \
  --report "$R/py-synth-pkcs7.json" >/dev/null
python3 "$PYV" --repo "$REPO" --fixture "$MAN" --signed-efi "$HERE/synthetic-signed.efi" \
  --cert-der "$HERE/synthetic-cert.der" --report "$R/py-synth-efi.json" >/dev/null
python3 "$PYV" --repo "$REPO" --fixture "$MAN" --final-record - \
  --detached-sig "$HERE/synthetic-detached.sig" --cert-der "$HERE/synthetic-cert.der" \
  --report "$R/py-synth-pss.json" >/dev/null
python3 "$PYV" --repo "$REPO" --final-record - --report "$R/py-reconstruction.json" >/dev/null

# ---- openssl positives ----
P1_PKCS7="$HERE/accepted-authenticode-spc.pkcs7" sh "$SHV" - - - - "$WORK/sh-real" > "$R/sh-real.txt"
python3 - "$PYV" "$REPO" "$WORK/final.json" <<'PYEOF'
import importlib.util, sys
spec = importlib.util.spec_from_file_location("v", sys.argv[1])
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
orig = m.repo_blob(sys.argv[2], m.EXPECTED["gitCommit"], m.ORIG_RECORD_REPO_PATH)
open(sys.argv[3], "wb").write(m.finalize_record(orig, m.EXPECTED))
PYEOF
P1_CERT_OFF=320 P1_CERT_SIZE=$((SYN_EFIB - 320)) P1_PKCS7_BYTES=$SYN_P7B \
P1_EXP_PE_DIGEST=$SYN_PE P1_EXP_PKCS7_SHA256=$SYN_P7 P1_EXP_CERT_SHA256=$SYN_CERT \
  sh "$SHV" "$HERE/synthetic-signed.efi" "$HERE/synthetic-cert.der" \
     "$WORK/final.json" "$HERE/synthetic-detached.sig" "$WORK/sh-synth" > "$R/sh-synth.txt"

# ---- negatives (observed codes; asserted below in assembly) ----
for n in real-octet-wrapped real-bad-digestinfo real-bad-messagedigest real-bad-signature real-bad-cert; do
  printf '%s\n' "$(pycode negatives/$n.pkcs7 realAccepted)" > "$R/neg-py-$n"
  printf '%s\n' "$(shcode negatives/$n.pkcs7 ab95a4c3fcf946679d2a46e87e64f28912ca5a7b27d642c70e6d5713f4065219 7cda4ddc149849cc61191d4b5b3d218d14770c0401e9e66dd9617b82ba1ae441)" > "$R/neg-sh-$n"
done
for n in synth-octet-wrapped synth-wrong-oid synth-bad-digestinfo synth-bad-messagedigest synth-bad-signature synth-wrong-cert synth-extra-signer synth-extra-algorithm synth-extra-attr; do
  printf '%s\n' "$(pycode negatives/$n.pkcs7 synthetic)" > "$R/neg-py-$n"
done
printf '%s\n' "$(shcode negatives/synth-octet-wrapped.pkcs7 $SYN_PE $SYN_CERT)" > "$R/neg-sh-synth-octet-wrapped"
for n in synth-cert-table-not-eof synth-cert-table-dwlength synth-wrong-cert; do
  printf '%s\n' "$(pycode_efi negatives/$n.efi)" > "$R/neg-py-$n-efi"
done
printf '%s\n' "$(python3 "$PYV" --repo "$REPO" --fixture "$MAN" --final-record - \
  --detached-sig "$HERE/negatives/synthetic-detached-salt20.sig" \
  --cert-der "$HERE/synthetic-cert.der" --no-pin 2>&1 >/dev/null | awk '{print $1}')" > "$R/neg-py-salt20"

# ---- assemble evidence JSON ----
python3 - "$R" "$HERE" > "$PROV/p1-tool-fixture-evidence.v1.json" <<'PYEOF'
import json, os, sys
R, HERE = sys.argv[1], sys.argv[2]
def rep(name):
    return json.load(open(os.path.join(R, name)))
def code(name):
    return open(os.path.join(R, name)).read().strip()
man = json.load(open(os.path.join(HERE, "fixture-manifest.v1.json")))
def pkcs7_block(report):
    c = report["checks"]["pkcs7"]
    return {"eContentType": c["eContentType"], "eContentForm": c["eContentForm"],
            "spcContentBytes": c["spcContentBytes"], "derBytes": c["derBytes"],
            "paddingBytes": c["paddingBytes"], "signerCertEquality": c["signerCertEquality"],
            "signature": c["signature"]}
real_py = rep("py-real-pkcs7.json")
synth_py = rep("py-synth-pkcs7.json")
efi_py = rep("py-synth-efi.json")
pss_py = rep("py-synth-pss.json")
recon = rep("py-reconstruction.json")
expect = {k: v["expect"] for k, v in man["negatives"].items()}
negatives = {}
for n in ("real-octet-wrapped", "real-bad-digestinfo", "real-bad-messagedigest",
          "real-bad-signature", "real-bad-cert"):
    negatives[n + ".pkcs7"] = {"expect": expect[n + ".pkcs7"],
        "python": code("neg-py-" + n), "openssl": code("neg-sh-" + n)}
for n in ("synth-octet-wrapped", "synth-wrong-oid", "synth-bad-digestinfo",
          "synth-bad-messagedigest", "synth-bad-signature", "synth-wrong-cert",
          "synth-extra-signer", "synth-extra-algorithm", "synth-extra-attr"):
    ent = {"expect": expect[n + ".pkcs7"], "python": code("neg-py-" + n)}
    if n == "synth-octet-wrapped":
        ent["openssl"] = code("neg-sh-synth-octet-wrapped")
    negatives[n + ".pkcs7"] = ent
for n in ("synth-cert-table-not-eof", "synth-cert-table-dwlength", "synth-wrong-cert"):
    negatives[n + ".efi"] = {"expect": expect[n + ".efi"], "python": code("neg-py-" + n + "-efi")}
negatives["synthetic-detached-salt20.sig"] = {"expect": expect["synthetic-detached-salt20.sig"],
    "python": code("neg-py-salt20")}
bad = []
for name, ent in negatives.items():
    for impl in ("python", "openssl"):
        if impl in ent:
            exp = ent["expect"]
            ok = ent[impl] == exp or (exp.endswith("_") and ent[impl].startswith(exp))
            if not ok: bad.append((name, impl, exp, ent[impl]))
if bad:
    sys.stderr.write("NEGATIVE MISMATCH: %r\n" % (bad,)); sys.exit(1)
out = {
 "schema": "v3.provisioning-p1-tool-fixture-evidence.v1",
 "note": ("P1.1 fixture validation of verify-p1-evidence.py and verify-p1-openssl.sh after the "
          "P1-PREP REJECT. Both CMS paths now strictly require and process the real accepted "
          "Microsoft SpcIndirectDataContent encoding (eContentType 1.3.6.1.4.1.311.2.1.4, [0] "
          "eContent holding the SEQUENCE directly, zero trailing padding). openssl cms -verify is "
          "not used anywhere: the OpenSSL second implementation extracts via asn1parse and verifies "
          "cert equality, SHA-256(SpcIndirectData content)==messageDigest, and the signedAttrs "
          "signature via openssl dgst. Primary fixture is the accepted real 1,864-byte PKCS#7 blob "
          "(440aebd4...); synthetic fixtures use ephemeral RSA-3072 keys with no authority. "
          "realIdentityReconstruction is NOT fixture data: it is the deterministic reconstruction "
          "from repo data at 92741cbdefaa78adc33bc3c74935a45f9558b88c matching the accepted final "
          "record identities."),
 "realIdentityReconstruction": recon["checks"]["finalRecord"],
 "positives": {
  "real_accepted_pkcs7_python": {"result": real_py["result"], "pkcs7": pkcs7_block(real_py)},
  "synthetic_pkcs7_python": {"result": synth_py["result"], "pkcs7": pkcs7_block(synth_py)},
  "synthetic_signed_efi_python": {"result": efi_py["result"], "signedUki": efi_py["checks"]["signedUki"],
                                  "pkcs7": pkcs7_block(efi_py)},
  "synthetic_detached_pss_python": {"result": pss_py["result"],
                                    "detachedSignature": pss_py["checks"]["detachedSignature"]},
  "real_accepted_pkcs7_openssl": open(os.path.join(R, "sh-real.txt")).read().splitlines(),
  "synthetic_full_openssl": open(os.path.join(R, "sh-synth.txt")).read().splitlines(),
 },
 "negatives": negatives,
 "fixtureManifest": {"schema": man["schema"],
                     "syntheticPkcs7Sha256": man["profiles"]["synthetic"]["pkcs7Sha256"],
                     "syntheticPeDigest": man["profiles"]["synthetic"]["peAuthenticodeDigestSha256"],
                     "syntheticCertSha256": man["profiles"]["synthetic"]["certDerSha256"],
                     "realPkcs7Sha256": man["profiles"]["realAccepted"]["pkcs7Sha256"]},
}
print(json.dumps(out, indent=1, sort_keys=True))
PYEOF
printf 'FIXTURE_EVIDENCE_OK %s\n' "$PROV/p1-tool-fixture-evidence.v1.json"

#!/usr/bin/env python3
"""V3 Successor P1.1 fixture generator (synthetic SpcIndirectData Authenticode material).

Builds the frozen PUBLIC fixtures used to validate verify-p1-evidence.py and
verify-p1-openssl.sh. All keys are ephemeral random RSA-3072 generated at build
time into --work (tmp); NO private key is written to the output tree and the
fixture certificates carry no authority of any kind. The accepted real
1,864-byte PKCS#7 blob (SHA-256 440aebd4...) is copied in unchanged and used
only to derive public real-format negative cases (byte mutations and an
eContent re-wrap that needs no re-signing).

Determinism note: key generation is random, so re-running produces different
fixture bytes. The frozen committed blobs plus fixture-manifest.v1.json pin the
exact reviewed identities; this script exists so the fixture STRUCTURE is
reviewable and reproducible in form, not bit-value.

Usage: make-fixtures.py --repo <clone> --real <accepted-spc.pkcs7> --out <fixtures-dir> --work <tmp>
"""
import hashlib, json, os, subprocess, sys

OID_SHA256 = "2.16.840.1.101.3.4.2.1"
OID_SHA512 = "2.16.840.1.101.3.4.2.2"
OID_RSA = "1.2.840.113549.1.1.1"
OID_SIGNED_DATA = "1.2.840.113549.1.7.2"
OID_PKCS7_DATA = "1.2.840.113549.1.7.1"
OID_CT = "1.2.840.113549.1.9.3"
OID_MD = "1.2.840.113549.1.9.4"
OID_SPC_INDIRECT = "1.3.6.1.4.1.311.2.1.4"
OID_SPC_STATEMENT = "1.3.6.1.4.1.311.2.1.11"
OID_SPC_OPUS = "1.3.6.1.4.1.311.2.1.12"
OID_SPC_INDIVIDUAL = "1.3.6.1.4.1.311.2.1.21"
CN = "V3 Successor UKI Secure Boot Authority"
DOMAIN = b"V3-SUCCESSOR-UKI-EXTERNAL-BINDING:v1"

# accepted real identities (public bindings, same as verify-p1-evidence.py EXPECTED)
REAL = {
 "gitCommit": "92741cbdefaa78adc33bc3c74935a45f9558b88c",
 "peChecksumOffset": 216, "peCertDirOffset": 296,
 "peCertTableOffset": 21164544, "peCertTableSize": 1872,
 "peAuthenticodeDigestSha256": "ab95a4c3fcf946679d2a46e87e64f28912ca5a7b27d642c70e6d5713f4065219",
 "pkcs7Bytes": 1864,
 "pkcs7Sha256": "440aebd415335218df88abbb9b858fabd3fa30d7d238c8e368f7adc6835de1e5",
 "spcIndirectDataContentBytes": 76,
 "certDerSha256": "7cda4ddc149849cc61191d4b5b3d218d14770c0401e9e66dd9617b82ba1ae441",
 "certThumbprintSha1": "DA1ED260911F93F41C0914108EA45DC0BD85B171",
 "certSubjectCN": CN,
 "winCertificateRevision": 0x0200, "winCertificateType": 0x0002,
 "peMachineAmd64": 0x8664,
 "finalRecordSha256": "07f88bfc5a98ef471c05451cc8077af4d7b61015aae5ba0395deb6c935dc1694",
 "preimageDigestSha256": "fec736a6a7e50f030164d76bd2015925621b5edfa1eefb4980ffcb8c18142b45",
}
ORIG_RECORD_REPO_PATH = "docs/verified-architecture-phase2-v3/successor-uki-candidate/successor-authority-record.v1.json"
EXPECTED_FINAL_FIELDS = {
 "certDerSha256": REAL["certDerSha256"],
 "gitCommit": REAL["gitCommit"],
 "gitTree": "9cc2e40fab25c2231d5a6cefa285d2e3e65a7bee",
 "signedUkiSha256": "133096976ee70a8c272cbcc8c28d369bfc65d93d994cbff4174b947df00239d1",
}

def sha256(b): return hashlib.sha256(b).hexdigest()
def sh(args, **kw):
    p = subprocess.run(args, capture_output=True, **kw)
    if p.returncode != 0:
        sys.stderr.write("FAIL %s\n%s\n" % (args, p.stderr.decode(errors="replace")))
        sys.exit(1)
    return p.stdout

# ---------- DER encode ----------
def L(n):
    if n < 128: return bytes([n])
    b = n.to_bytes((n.bit_length() + 7) // 8, "big")
    return bytes([0x80 | len(b)]) + b
def T(tag, content): return bytes([tag]) + L(len(content)) + content
def SEQ(*items): return T(0x30, b"".join(items))
def SET1(item): return T(0x31, item)
def SETOF(*items): return T(0x31, b"".join(sorted(items)))
def enc_oid(s):
    parts = [int(x) for x in s.split(".")]
    out = bytearray([40 * parts[0] + parts[1]])
    for p in parts[2:]:
        stack = [p & 0x7F]; p >>= 7
        while p: stack.append(0x80 | (p & 0x7F)); p >>= 7
        out += bytes(reversed(stack))
    return bytes(out)
def OID(s): return T(0x06, enc_oid(s))
def NULL(): return b"\x05\x00"
def INT(n):
    b = n.to_bytes(max(1, (n.bit_length() + 7) // 8), "big")
    if b[0] & 0x80: b = b"\x00" + b
    return T(0x02, b)
def OCT(b): return T(0x04, b)
def CTX0(content): return T(0xA0, content)

# ---------- DER parse (minimal, absolute offsets) ----------
class DerErr(Exception): pass
def tlv(b, i=0):
    if i + 2 > len(b): raise DerErr("truncated header")
    tag = b[i]; i += 1
    if tag & 0x1F == 0x1F: raise DerErr("multi-byte tag")
    lb = b[i]; i += 1
    if lb & 0x80:
        n = lb & 0x7F
        if n == 0 or n > 4 or i + n > len(b): raise DerErr("bad length")
        length = int.from_bytes(b[i:i+n], "big"); i += n; hdr = 2 + n
    else:
        length = lb; hdr = 2
    if i + length > len(b): raise DerErr("truncated value")
    return tag, b[i:i+length], hdr, hdr + length
def children(content, base=0):
    out, i = [], 0
    while i < len(content):
        t2, c2, h2, tl2 = tlv(content, i)
        out.append({"tag": t2, "content": c2, "hdr": h2, "abs": base + i, "tl": tl2,
                    "content_abs": base + i + h2})
        i += tl2
    return out
def der_oid(content):
    first = content[0]
    parts = [str(first // 40), str(first % 40)]
    v = 0
    for byt in content[1:]:
        v = (v << 7) | (byt & 0x7F)
        if not byt & 0x80: parts.append(str(v)); v = 0
    return ".".join(parts)

def patch_len(buf, tlv_abs, hdr, delta):
    """Add delta to the length field of the TLV at tlv_abs (same width)."""
    n = hdr - 1
    off = tlv_abs + 1
    if n == 1:
        buf[off] += delta
    else:
        width = buf[off] & 0x7F
        v = int.from_bytes(buf[off+1:off+1+width], "big") + delta
        buf[off+1:off+1+width] = v.to_bytes(width, "big")

# ---------- SpcIndirectData / CMS assembly ----------
SPC_PE_IMAGE_DATA = bytes.fromhex("3017060a2b06010401823702010f3009030100a004a2028000")

def spc_content(pe_digest):
    digest_info = SEQ(SEQ(OID(OID_SHA256), NULL()), OCT(pe_digest))
    return SPC_PE_IMAGE_DATA + digest_info

def build_attrs(spc, md_override=None, extra_attr=None):
    md = hashlib.sha256(spc).digest() if md_override is None else md_override
    attrs = [
        SEQ(OID(OID_SPC_OPUS), SET1(SEQ())),
        SEQ(OID(OID_CT), SET1(OID(OID_SPC_INDIRECT))),
        SEQ(OID(OID_SPC_STATEMENT), SET1(SEQ(OID(OID_SPC_INDIVIDUAL)))),
        SEQ(OID(OID_MD), SET1(OCT(md))),
    ]
    if extra_attr is not None:
        attrs.append(extra_attr)
    return b"".join(sorted(attrs))

def build_blob(pe_digest, cert_der, issuer_tlv, serial, key_pem, work,
               wrap_octet=False, econtent_oid=OID_SPC_INDIRECT,
               extra_signer=False, extra_alg=False, md_override=None,
               extra_attr=None, digest_override=None, sig_tamper=False,
               embed_cert=None, tag=""):
    spc = spc_content(pe_digest if digest_override is None else digest_override)
    econtent = OCT(T(0x30, spc)) if wrap_octet else T(0x30, spc)
    content_info = SEQ(OID(econtent_oid), CTX0(econtent))
    algs = [SEQ(OID(OID_SHA256), NULL())]
    if extra_alg:
        algs.append(SEQ(OID(OID_SHA512), NULL()))
    attrs_content = build_attrs(spc, md_override=md_override, extra_attr=extra_attr)
    attrs_set = T(0x31, attrs_content)
    ap = os.path.join(work, "attrs%s.der" % tag)
    sp_ = os.path.join(work, "sig%s.bin" % tag)
    open(ap, "wb").write(attrs_set)
    sh(["openssl", "dgst", "-sha256", "-sign", key_pem, "-out", sp_, ap])
    sig = open(sp_, "rb").read()
    if sig_tamper:
        sig = bytes([sig[0] ^ 0x01]) + sig[1:]
    si = SEQ(INT(1), SEQ(issuer_tlv, INT(serial)), SEQ(OID(OID_SHA256), NULL()),
             CTX0(attrs_content), SEQ(OID(OID_RSA), NULL()), OCT(sig))
    sis = [si]
    if extra_signer:
        sis.append(si)
    sd = SEQ(INT(1), SETOF(*algs), content_info, CTX0(embed_cert or cert_der), SETOF(*sis))
    der = SEQ(OID(OID_SIGNED_DATA), CTX0(sd))
    pad = (-len(der)) % 8
    return der + b"\x00" * pad

# ---------- PE builder ----------
def build_pe(blob, tail=b"", dwlen_delta=0):
    pe = bytearray(320)
    pe[0x3C:0x40] = (128).to_bytes(4, "little")
    pe[128:132] = b"PE\x00\x00"
    pe[132:134] = (0x8664).to_bytes(2, "little")
    pe[152:154] = (0x20B).to_bytes(2, "little")
    cert_off = 320
    cert_size = 8 + len(blob)
    pe[296:300] = cert_off.to_bytes(4, "little")
    pe[300:304] = cert_size.to_bytes(4, "little")
    wc = (8 + len(blob) + dwlen_delta).to_bytes(4, "little") \
         + (0x0200).to_bytes(2, "little") + (0x0002).to_bytes(2, "little")
    return bytes(pe) + wc + blob + tail

def pe_digest(buf):
    h = hashlib.sha256()
    h.update(buf[:216]); h.update(buf[220:296]); h.update(buf[304:320])
    return h.digest()

# ---------- real blob walking ----------
def walk_real(blob):
    t, c, h, tl = tlv(blob, 0)
    if t != 0x30: raise DerErr("top")
    top = {"abs": 0, "hdr": h, "tl": tl}
    ci = children(c, h)
    a0 = ci[1]
    sd = tlv(blob, a0["content_abs"])
    sd_abs, sd_hdr = a0["content_abs"], sd[2]
    sd_ch = children(sd[1], sd_abs + sd_hdr)
    enc = sd_ch[2]
    enc_ch = children(enc["content"], enc["content_abs"])
    wrap = enc_ch[1]
    spc_abs = wrap["content_abs"]
    spc = tlv(blob, spc_abs)
    spc_ch = children(spc[1], spc_abs + spc[2])
    di = spc_ch[1]
    di_ch = children(di["content"], di["content_abs"])
    digest_oct = di_ch[1]
    certs_el = next(x for x in sd_ch if x["tag"] == 0xA0)
    cert_abs = certs_el["content_abs"]
    cert_tl = tlv(blob, cert_abs)[3]
    si_set = [x for x in sd_ch if x["tag"] == 0x31][-1]
    si = tlv(blob, si_set["content_abs"])
    si_ch = children(si[1], si_set["content_abs"] + si[2])
    attrs_el = next(x for x in si_ch if x["tag"] == 0xA0)
    sig_oct = si_ch[-1]
    md_oct = None
    for at in children(attrs_el["content"], attrs_el["content_abs"]):
        at_ch = children(at["content"], at["content_abs"])
        if der_oid(at_ch[0]["content"]) == OID_MD:
            vs = children(at_ch[1]["content"], at_ch[1]["content_abs"])
            md_oct = vs[0]
    return {"top": top, "a0": a0, "sd": {"abs": sd_abs, "hdr": sd_hdr},
            "enc": enc, "wrap": wrap, "spc": {"abs": spc_abs, "hdr": spc[2], "tl": spc[3]},
            "digest_oct": digest_oct, "cert_abs": cert_abs, "cert_tl": cert_tl,
            "sig_oct": sig_oct, "md_oct": md_oct, "der_len": tl}

def main():
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", required=True)
    ap.add_argument("--real", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--work", required=True)
    a = ap.parse_args()
    out, work = a.out, a.work
    os.makedirs(os.path.join(out, "negatives"), exist_ok=True)
    os.makedirs(work, exist_ok=True)

    # 1. ephemeral keys + strict-profile self-signed certs
    k1, k2 = os.path.join(work, "k1.pem"), os.path.join(work, "k2.pem")
    c1, c2 = os.path.join(work, "c1.der"), os.path.join(work, "c2.der")
    sh(["openssl", "genrsa", "-out", k1, "3072"])
    sh(["openssl", "genrsa", "-out", k2, "3072"])
    cnf = os.path.join(work, "fixture-cert.cnf")
    open(cnf, "w").write(
        "[ req ]\ndistinguished_name = dn\n[ dn ]\n[ v3_fixture ]\n"
        "keyUsage = critical, digitalSignature\n"
        "extendedKeyUsage = codeSigning\n"
        "basicConstraints = critical, CA:FALSE\n"
        "subjectKeyIdentifier = hash\n")
    for key, cer in ((k1, c1), (k2, c2)):
        sh(["openssl", "req", "-x509", "-new", "-key", key, "-out", cer, "-outform", "DER",
            "-sha256", "-days", "3650", "-subj", "/CN=" + CN,
            "-set_serial", "0x4C1A1B1C1D1E1F2021222324252627",
            "-config", cnf, "-extensions", "v3_fixture"])
    cert1 = open(c1, "rb").read()
    cert2 = open(c2, "rb").read()

    # issuer TLV + serial from cert1 for the signerInfo sid
    ct, cc, ch, ctl = tlv(cert1, 0)
    tbs = children(cc, ch)[0]
    be = children(tbs["content"], tbs["content_abs"])
    serial = int.from_bytes(be[1]["content"], "big")
    issuer_tlv = cert1[be[3]["abs"]: be[3]["abs"] + be[3]["tl"]]

    files = {}

    def put(rel, data):
        p = os.path.join(out, rel)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        open(p, "wb").write(data)
        files[rel] = {"bytes": len(data), "sha256": sha256(data)}

    # 2. synthetic positive blob + PE
    dummy = hashlib.sha256(b"fixture-pe-digest-placeholder").digest()
    # build PE first pass to learn the digest, then the blob over that digest
    blob0 = build_blob(dummy, cert1, issuer_tlv, serial, k1, work, tag="p")
    pe0 = build_pe(blob0)
    digest = pe_digest(pe0)
    blob = build_blob(digest, cert1, issuer_tlv, serial, k1, work, tag="p")
    pe = build_pe(blob)
    assert pe_digest(pe) == digest
    put("synthetic-spc.pkcs7", blob)
    put("synthetic-signed.efi", pe)
    put("synthetic-cert.der", cert1)

    # 3. synthetic negatives (same digest, structural/byte variations)
    put("negatives/synth-octet-wrapped.pkcs7",
        build_blob(digest, cert1, issuer_tlv, serial, k1, work, wrap_octet=True, tag="ow"))
    put("negatives/synth-wrong-oid.pkcs7",
        build_blob(dummy, cert1, issuer_tlv, serial, k1, work, wrap_octet=True,
                   econtent_oid=OID_PKCS7_DATA, md_override=hashlib.sha256(b"x").digest(), tag="wo"))
    put("negatives/synth-bad-digestinfo.pkcs7",
        build_blob(digest, cert1, issuer_tlv, serial, k1, work,
                   digest_override=bytes([digest[0] ^ 1]) + digest[1:], tag="bd"))
    put("negatives/synth-bad-messagedigest.pkcs7",
        build_blob(digest, cert1, issuer_tlv, serial, k1, work,
                   md_override=hashlib.sha256(b"not-the-content").digest(), tag="bm"))
    put("negatives/synth-bad-signature.pkcs7",
        build_blob(digest, cert1, issuer_tlv, serial, k1, work, sig_tamper=True, tag="bs"))
    wc_blob = build_blob(digest, cert1, issuer_tlv, serial, k1, work, embed_cert=cert2, tag="wc")
    put("negatives/synth-wrong-cert.pkcs7", wc_blob)
    put("negatives/synth-wrong-cert.efi", build_pe(wc_blob))
    put("negatives/synth-extra-signer.pkcs7",
        build_blob(digest, cert1, issuer_tlv, serial, k1, work, extra_signer=True, tag="es"))
    put("negatives/synth-extra-algorithm.pkcs7",
        build_blob(digest, cert1, issuer_tlv, serial, k1, work, extra_alg=True, tag="ea"))
    put("negatives/synth-extra-attr.pkcs7",
        build_blob(digest, cert1, issuer_tlv, serial, k1, work,
                   extra_attr=SEQ(OID("1.2.3.4"), SET1(NULL())), tag="xa"))
    put("negatives/synth-cert-table-not-eof.efi", build_pe(blob, tail=b"\x00" * 8))
    put("negatives/synth-cert-table-dwlength.efi", build_pe(blob, dwlen_delta=-8))

    # 4. real accepted blob: copy + real-format negatives
    real = open(a.real, "rb").read()
    if len(real) != REAL["pkcs7Bytes"] or sha256(real) != REAL["pkcs7Sha256"]:
        sys.stderr.write("E_REAL_IDENTITY real blob does not match accepted identity\n"); sys.exit(1)
    put("accepted-authenticode-spc.pkcs7", real)
    w = walk_real(real)
    assert real[w["digest_oct"]["content_abs"]:w["digest_oct"]["content_abs"]+32].hex() \
        == REAL["peAuthenticodeDigestSha256"], "real walk: digest offset"
    m = bytearray(real)
    m[w["digest_oct"]["content_abs"]] ^= 0x01
    put("negatives/real-bad-digestinfo.pkcs7", bytes(m))
    m = bytearray(real)
    m[w["md_oct"]["content_abs"]] ^= 0x01
    put("negatives/real-bad-messagedigest.pkcs7", bytes(m))
    m = bytearray(real)
    m[w["sig_oct"]["content_abs"]] ^= 0x01
    put("negatives/real-bad-signature.pkcs7", bytes(m))
    m = bytearray(real)
    m[w["cert_abs"] + w["cert_tl"] - 10] ^= 0x01   # inside cert signature BIT STRING
    put("negatives/real-bad-cert.pkcs7", bytes(m))
    # octet re-wrap of the REAL content (no re-sign needed; form check must reject)
    spc_abs, spc_tl = w["spc"]["abs"], w["spc"]["tl"]
    spc_tlv = real[spc_abs:spc_abs + spc_tl]
    oct_wrap = T(0x04, spc_tlv)
    wrap_abs, wrap_tl = w["wrap"]["abs"], w["wrap"]["tl"]
    delta = len(oct_wrap) - (wrap_tl - w["wrap"]["hdr"])   # eContent content growth
    new = bytearray(real[:wrap_abs] + T(0xA0, oct_wrap) + real[wrap_abs + wrap_tl:w["der_len"]])
    patch_len(new, w["enc"]["abs"], w["enc"]["hdr"], delta)
    patch_len(new, w["sd"]["abs"], w["sd"]["hdr"], delta)
    patch_len(new, w["a0"]["abs"], w["a0"]["hdr"], delta)
    patch_len(new, 0, w["top"]["hdr"], delta)
    pad = (-len(new)) % 8
    put("negatives/real-octet-wrapped.pkcs7", bytes(new) + b"\x00" * pad)

    # 5. detached-signature fixtures over the deterministic final-record reconstruction
    orig = sh(["git", "-C", a.repo, "cat-file", "blob",
               "%s:%s" % (EXPECTED_FINAL_FIELDS["gitCommit"], ORIG_RECORD_REPO_PATH)])
    body = orig[:-2].decode()
    out_rec = '{"certificateDerSha256":"' + EXPECTED_FINAL_FIELDS["certDerSha256"] + '",' + body[1:]
    out_rec = out_rec.replace('"records":', '"gitCommit":"' + EXPECTED_FINAL_FIELDS["gitCommit"]
                              + '","gitTree":"' + EXPECTED_FINAL_FIELDS["gitTree"] + '","records":')
    out_rec = out_rec.replace('"signingRule":', '"signedUkiSha256":"'
                              + EXPECTED_FINAL_FIELDS["signedUkiSha256"] + '","signingRule":')
    fin = (out_rec + "}\n").encode()
    assert sha256(fin) == REAL["finalRecordSha256"], "final record reconstruction drift"
    pre = os.path.join(work, "preimage.bin")
    open(pre, "wb").write(DOMAIN + b"\x00" + fin)
    preh = sh(["openssl", "dgst", "-sha256", "-binary", pre])
    hp = os.path.join(work, "prehash.bin"); open(hp, "wb").write(preh)
    for salt, name in ((32, "synthetic-detached.sig"), (20, "negatives/synthetic-detached-salt20.sig")):
        sp = os.path.join(work, "pss%d.bin" % salt)
        sh(["openssl", "pkeyutl", "-sign", "-inkey", k1, "-in", hp, "-out", sp,
            "-pkeyopt", "rsa_padding_mode:pss", "-pkeyopt", "digest:sha256",
            "-pkeyopt", "rsa_pss_saltlen:%d" % salt, "-pkeyopt", "rsa_mgf1_md:sha256"])
        put(name, open(sp, "rb").read())

    # 6. manifest
    man = {
     "schema": "v3.provisioning-p1-fixture-manifest.v1",
     "note": ("Pinned identities of the frozen PUBLIC P1.1 fixtures. synthetic-* material uses "
              "ephemeral RSA-3072 keys with no authority; accepted-authenticode-spc.pkcs7 is the "
              "accepted real blob SHA-256 " + REAL["pkcs7Sha256"] + ". negatives/ are designed "
              "rejections; 'expect' is the required verifier exit code."),
     "profiles": {
      "synthetic": {
       "peChecksumOffset": 216, "peCertDirOffset": 296,
       "peCertTableOffset": 320, "peCertTableSize": files["synthetic-signed.efi"]["bytes"] - 320,
       "peAuthenticodeDigestSha256": digest.hex(),
       "pkcs7Bytes": files["synthetic-spc.pkcs7"]["bytes"],
       "pkcs7Sha256": files["synthetic-spc.pkcs7"]["sha256"],
       "spcIndirectDataContentBytes": 76,
       "certDerSha256": sha256(cert1),
       "certThumbprintSha1": hashlib.sha1(cert1).hexdigest().upper(),
       "certSubjectCN": CN,
       "winCertificateRevision": 0x0200, "winCertificateType": 0x0002,
       "peMachineAmd64": 0x8664,
       "signedUkiBytes": files["synthetic-signed.efi"]["bytes"],
       "signedUkiSha256": files["synthetic-signed.efi"]["sha256"],
       "detachedSigBytes": 384,
      },
      "realAccepted": {k: REAL[k] for k in (
        "peChecksumOffset", "peCertDirOffset", "peCertTableOffset", "peCertTableSize",
        "peAuthenticodeDigestSha256", "pkcs7Bytes", "pkcs7Sha256",
        "spcIndirectDataContentBytes", "certDerSha256", "certThumbprintSha1",
        "certSubjectCN", "winCertificateRevision", "winCertificateType", "peMachineAmd64")},
     },
     "files": files,
     "negatives": {
      "real-octet-wrapped.pkcs7": {"expect": "E_PKCS7", "note": "real content re-wrapped as OCTET STRING eContent; signature still valid, form check must reject"},
      "real-bad-digestinfo.pkcs7": {"expect": "E_AUTHENTICODE_DIGEST", "note": "1-bit flip in embedded DigestInfo digest"},
      "real-bad-messagedigest.pkcs7": {"expect": "E_AUTHENTICODE_DIGEST", "note": "1-bit flip in signedAttrs messageDigest"},
      "real-bad-signature.pkcs7": {"expect": "E_AUTHENTICODE_SIGNATURE", "note": "1-bit flip in 384-byte signature"},
      "real-bad-cert.pkcs7": {"expect": "E_CERT_HASH", "note": "1-bit flip inside embedded certificate"},
      "synth-octet-wrapped.pkcs7": {"expect": "E_PKCS7", "note": "SPC OID but OCTET-wrapped eContent"},
      "synth-wrong-oid.pkcs7": {"expect": "E_PKCS7", "note": "pkcs7-data eContentType (the P1-rejected fixture shape)"},
      "synth-bad-digestinfo.pkcs7": {"expect": "E_AUTHENTICODE_DIGEST", "note": "wrong embedded DigestInfo"},
      "synth-bad-messagedigest.pkcs7": {"expect": "E_AUTHENTICODE_DIGEST", "note": "wrong messageDigest, re-signed so the md check itself fires"},
      "synth-bad-signature.pkcs7": {"expect": "E_AUTHENTICODE_SIGNATURE", "note": "tampered signature"},
      "synth-wrong-cert.pkcs7": {"expect": "E_CERT_HASH", "note": "different embedded cert (identity pin in pkcs7 mode)"},
      "synth-wrong-cert.efi": {"expect": "E_AUTHENTICODE_SIGNER", "note": "different embedded cert vs provided .cer (signer equality in efi mode)"},
      "synth-extra-signer.pkcs7": {"expect": "E_PKCS7", "note": "two signerInfos"},
      "synth-extra-algorithm.pkcs7": {"expect": "E_PKCS7", "note": "digestAlgorithms {SHA-256,SHA-512}"},
      "synth-extra-attr.pkcs7": {"expect": "E_PKCS7", "note": "extra signedAttr OID 1.2.3.4, re-signed so the attr check itself fires"},
      "synth-cert-table-not-eof.efi": {"expect": "E_AUTHENTICODE_TABLE", "note": "trailing bytes after certificate table"},
      "synth-cert-table-dwlength.efi": {"expect": "E_AUTHENTICODE_TABLE", "note": "WIN_CERTIFICATE dwLength != table size"},
      "synthetic-detached-salt20.sig": {"expect": "E_PSS_", "note": "PSS salt length 20 must be rejected (prefix match)"},
     },
    }
    mp = os.path.join(out, "fixture-manifest.v1.json")
    open(mp, "w").write(json.dumps(man, indent=1, sort_keys=True) + "\n")
    # guard: no private material in the output tree
    for root, _, fns in os.walk(out):
        for fn in fns:
            low = fn.lower()
            assert not low.endswith((".pem", ".key", ".pfx", ".p12", ".pvk")), "private material in fixtures: " + fn
    print("FIXTURES_OK files=%d manifest=%s" % (len(files), mp))

if __name__ == "__main__":
    main()

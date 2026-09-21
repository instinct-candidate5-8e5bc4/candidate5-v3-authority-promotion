#!/usr/bin/env python3
"""V3 Successor P1 public-evidence verifier (first implementation, pure stdlib).

Verifies, on exact bytes, the owner/peer-held PUBLIC evidence for the Provisioning
P1 gate, against the frozen required bindings:
  (a) PE Authenticode digest of the signed UKI + embedded PKCS#7 signer/signature/
      certificate equality (MS12-024 digest; CMS signedAttrs signature verified as
      pure public-key math);
  (b) domain-separated detached RSA-PSS-SHA256 signature (salt length EXACTLY 32)
      over SHA256(UTF8("V3-SUCCESSOR-UKI-EXTERNAL-BINDING:v1") || 0x00 || final record),
      proved by full EMSA-PSS structural decode;
  (c) production certificate identity and self-signature (pure X.509/DER parse);
  (d) final authority record: byte-exact deterministic reconstruction from the
      certified original at the accepted source commit, proving the four-field-only
      delta and all 200 records retained;
  (e) optional evidence-set allow-list check against EVIDENCE-MANIFEST.json.

A second, independent implementation of every signature check lives in
verify-p1-openssl.sh (OpenSSL CLI). No network, no writes outside --report,
no private material accepted or used. Deterministic JSON report; exit 0 PASS,
exit 1 with E_<CODE> on stderr on any mismatch.
"""
import hashlib, json, os, re, subprocess, sys

DOMAIN = b"V3-SUCCESSOR-UKI-EXTERNAL-BINDING:v1"
ORIG_RECORD_REPO_PATH = "docs/verified-architecture-phase2-v3/successor-uki-candidate/successor-authority-record.v1.json"
UNSIGNED_EFI_REPO_PATH = "docs/verified-architecture-phase2-v3/successor-uki-candidate/successor-unsigned.efi"
INVENTORY_REPO_PATH = "docs/verified-architecture-phase2-v3/successor-uki-candidate/inventory.v1.json"

EXPECTED = {
 "gitCommit": "92741cbdefaa78adc33bc3c74935a45f9558b88c",
 "gitTree": "9cc2e40fab25c2231d5a6cefa285d2e3e65a7bee",
 "signedUkiBytes": 21166416,
 "signedUkiSha256": "133096976ee70a8c272cbcc8c28d369bfc65d93d994cbff4174b947df00239d1",
 "unsignedUkiSha256": "ed5d9d72be40592af3b14bd1fd9dc91a5976b14f350f9124ea414b975464d536",
 "origRecordSha256": "c09245ae3b60db34f050e29fd9f457a83fde95bd44efc70e9afda14fcbee0e88",
 "inventorySha256": "a34edbf31bdacca8b2f836d496d01da5d57a8e8a1f46fcc7d63a9ab0dc297236",
 "certDerSha256": "7cda4ddc149849cc61191d4b5b3d218d14770c0401e9e66dd9617b82ba1ae441",
 "certThumbprintSha1": "DA1ED260911F93F41C0914108EA45DC0BD85B171",
 "certSubjectCN": "V3 Successor UKI Secure Boot Authority",
 "finalRecordSha256": "07f88bfc5a98ef471c05451cc8077af4d7b61015aae5ba0395deb6c935dc1694",
 "finalRecordBytes": 47246,
 "preimageDigestSha256": "fec736a6a7e50f030164d76bd2015925621b5edfa1eefb4980ffcb8c18142b45",
 "detachedSigBytes": 384,
 "peChecksumOffset": 216,
 "peCertDirOffset": 296,
 "peCertTableOffset": 21164544,
 "peCertTableSize": 1872,
 "peAuthenticodeDigestSha256": "ab95a4c3fcf946679d2a46e87e64f28912ca5a7b27d642c70e6d5713f4065219",
 "pkcs7Bytes": 1864,
 "pkcs7Sha256": "440aebd415335218df88abbb9b858fabd3fa30d7d238c8e368f7adc6835de1e5",
 "spcIndirectDataContentBytes": 76,
 "winCertificateRevision": 0x0200,
 "winCertificateType": 0x0002,
 "peMachineAmd64": 0x8664,
}

OID_SHA256 = "2.16.840.1.101.3.4.2.1"
OID_RSA_ENC = "1.2.840.113549.1.1.1"
OID_SHA256_RSA = "1.2.840.113549.1.1.11"
OID_SIGNED_DATA = "1.2.840.113549.1.7.2"
OID_CONTENT_TYPE = "1.2.840.113549.1.9.3"
OID_MESSAGE_DIGEST = "1.2.840.113549.1.9.4"
OID_SIGNING_TIME = "1.2.840.113549.1.9.5"
OID_CN = "2.5.4.3"
OID_KU = "2.5.29.15"
OID_BC = "2.5.29.19"
OID_SKID = "2.5.29.14"
OID_EKU = "2.5.29.37"
OID_EKU_CODE_SIGNING = "1.3.6.1.5.5.7.3.3"

EVIDENCE_FILES = [
 "successor-secure-boot.cer", "successor-unsigned.efi", "successor-signed.efi",
 "successor-authority-record.v1.json", "successor-authority-record-final.v1.json",
 "successor-authority-record-final.v1.sig", "inventory.v1.json",
 "signtool-sign.txt", "authenticode-verify.txt", "detached-preimage.sha256",
]
PROHIBITED_EXT = (".pfx", ".p12", ".pvk", ".key")
PROHIBITED_NAME = ("password", "secret", "private")

def E(code, msg):
    sys.stderr.write(f"{code} {msg}\n"); sys.exit(1)

def sha256(b): return hashlib.sha256(b).hexdigest()

# ---------- minimal DER ----------
class DerErr(Exception): pass

def tlv(b, i=0):
    if i + 2 > len(b): raise DerErr("truncated header")
    tag = b[i]; i += 1
    if tag & 0x1F == 0x1F: raise DerErr("multi-byte tag unsupported")
    lb = b[i]; i += 1
    if lb & 0x80:
        n = lb & 0x7F
        if n == 0 or n > 4 or i + n > len(b): raise DerErr("bad long length")
        length = int.from_bytes(b[i:i+n], "big"); i += n
        hdr = 2 + n
    else:
        length = lb; hdr = 2
    if i + length > len(b): raise DerErr("truncated value")
    return tag, b[i:i+length], hdr, hdr + length

def seq_of(b, cls=DerErr):
    t, c, h, tl = tlv(b, 0)
    if t != 0x30 or tl != len(b): raise cls("expected SEQUENCE")
    out, i = [], 0
    while i < len(c):
        t2, c2, h2, tl2 = tlv(c, i)
        out.append((t2, c2, h2, i, tl2))
        i += tl2
    return out

def children(content):
    out, i = [], 0
    while i < len(content):
        t2, c2, h2, tl2 = tlv(content, i)
        out.append((t2, c2, h2, i, tl2))
        i += tl2
    return out

def der_oid(content):
    if not content: raise DerErr("empty oid")
    first = content[0]
    parts = [str(first // 40), str(first % 40)]
    v = 0
    for byt in content[1:]:
        v = (v << 7) | (byt & 0x7F)
        if not byt & 0x80:
            parts.append(str(v)); v = 0
    if v: raise DerErr("truncated oid arc")
    return ".".join(parts)

def der_int(content):
    return int.from_bytes(content, "big")

def mgf1(seed, length):
    out = b""; c = 0
    while len(out) < length:
        out += hashlib.sha256(seed + c.to_bytes(4, "big")).digest(); c += 1
    return out[:length]

def rsa_public(exp_int, mod_int, sig):
    s = der_int(sig)
    if s >= mod_int: raise DerErr("signature representative out of range")
    m = pow(s, exp_int, mod_int)
    return m.to_bytes((mod_int.bit_length() + 7) // 8, "big")

def pkcs1v15_check(em, digest, mod_bits):
    em_len = (mod_bits + 7) // 8
    di = bytes.fromhex("3031300d060960864801650304020105000420") + digest
    pad_len = em_len - len(di) - 3
    if pad_len < 8: return False
    want = b"\x00\x01" + b"\xff" * pad_len + b"\x00" + di
    return em == want

def emsa_pss_verify(em, mhash, mod_bits, expect_salt_len=32):
    em_len = (mod_bits - 1 + 7) // 8
    hlen = 32
    if em_len != len(em) or em_len < hlen + expect_salt_len + 2: return False, "E_SIG_LENGTH"
    if em[-1] != 0xBC: return False, "E_PSS_TRAILER"
    masked = em[:em_len - hlen - 1]; Hp = em[em_len - hlen - 1: em_len - 1]
    unused = 8 * em_len - mod_bits + 1  # 8*emLen - emBits
    if unused >= 8 or (masked[0] & (0xFF << (8 - unused)) & 0xFF): return False, "E_PSS_LEADING"
    db = bytes(x ^ y for x, y in zip(masked, mgf1(Hp, em_len - hlen - 1)))
    db = bytes([db[0] & (0xFF >> unused)]) + db[1:]
    ps_len = em_len - hlen - expect_salt_len - 2
    if ps_len < 0 or db[:ps_len] != b"\x00" * ps_len: return False, "E_PSS_PS"
    if db[ps_len] != 0x01: return False, "E_PSS_DELIM"
    salt = db[ps_len + 1:]
    if len(salt) != expect_salt_len: return False, "E_PSS_SALTLEN"
    H = hashlib.sha256(b"\x00" * 8 + mhash + salt).digest()
    if H != Hp: return False, "E_PSS_HASH"
    return True, "OK"

# ---------- X.509 ----------
def parse_cert(der):
    t, c, h, tl = tlv(der, 0)
    if t != 0x30 or tl != len(der): raise DerErr("certificate not one SEQUENCE")
    el = children(c)
    if len(el) != 3: raise DerErr("certificate element count")
    tbs_full = c[el[0][3]: el[0][3] + el[0][4]]
    tbs = el[0][1]
    sig_alg = der_oid(children(el[1][1])[0][1])
    sig_bits = el[2][1]
    if sig_bits[0] != 0: raise DerErr("signature bit string unused bits")
    sig = sig_bits[1:]
    be = children(tbs)
    if be[0][0] != 0xA0: raise DerErr("missing version")
    idx = 1
    serial = der_int(be[idx][1]); idx += 1
    tbs_sig_alg = der_oid(children(be[idx][1])[0][1]); idx += 1
    issuer_full = tbs[be[idx][3]: be[idx][3] + be[idx][4]]
    issuer = be[idx][1]; idx += 1
    idx += 1  # validity
    subject_full = tbs[be[idx][3]: be[idx][3] + be[idx][4]]
    subject = be[idx][1]; idx += 1
    spki = be[idx][1]; idx += 1
    spk = children(spki)
    spki_alg = der_oid(children(spk[0][1])[0][1])
    spk_bits = spk[1][1]
    if spk_bits[0] != 0: raise DerErr("spk bit string")
    rsa = seq_of(spk_bits[1:])
    modulus = der_int(rsa[0][1]); exponent = der_int(rsa[1][1])
    exts = {}
    for t2, c2, h2, off, tl2 in be[idx:]:
        if t2 == 0xA3:
            t7, extseq, h7, tl7 = tlv(c2, 0)
            if t7 != 0x30 or tl7 != len(c2): raise DerErr("extensions wrapper")
            for et, ec, eh, eoff, etl in children(extseq):
                ext = children(ec)
                oid = der_oid(ext[0][1])
                j = 1; critical = False
                if ext[j][0] == 0x01:
                    critical = ext[j][1] != b"\x00"; j += 1
                if oid in exts: raise DerErr("duplicate extension " + oid)
                exts[oid] = (critical, ext[j][1])
    def cn_of(name_content):
        rdns = children(name_content)
        if len(rdns) != 1: raise DerErr("RDN count")
        atvs = children(rdns[0][1])
        if len(atvs) != 1: raise DerErr("ATV count")
        atv = children(atvs[0][1])
        if der_oid(atv[0][1]) != OID_CN: raise DerErr("RDN OID not CN")
        if atv[1][0] not in (0x13, 0x0C): raise DerErr("CN string type")
        return atv[1][1].decode()
    return {"tbs": tbs_full, "serial": serial, "sigAlg": sig_alg, "tbsSigAlg": tbs_sig_alg,
            "issuerDer": issuer_full, "subjectDer": subject_full, "issuerCN": cn_of(issuer),
            "subjectCN": cn_of(subject), "spkiAlg": spki_alg, "modulus": modulus,
            "exponent": exponent, "exts": exts, "signature": sig}

def check_certificate(cer_der, exp):
    if sha256(cer_der) != exp["certDerSha256"]: E("E_CERT_HASH", "certificate DER SHA-256 mismatch")
    if hashlib.sha1(cer_der).hexdigest().upper() != exp["certThumbprintSha1"]: E("E_CERT_THUMB", "thumbprint mismatch")
    try:
        c = parse_cert(cer_der)
    except DerErr as e:
        E("E_CERT_PARSE", str(e))
    if c["sigAlg"] != OID_SHA256_RSA or c["tbsSigAlg"] != OID_SHA256_RSA: E("E_CERT_ALG", "not SHA256-with-RSA")
    if c["spkiAlg"] != OID_RSA_ENC: E("E_CERT_ALG", "SPKI not RSA")
    if c["modulus"].bit_length() != 3072: E("E_KEY_SIZE", "modulus not 3072-bit")
    if c["exponent"] != 65537: E("E_KEY_SIZE", "exponent not 65537")
    if c["subjectCN"] != exp["certSubjectCN"] or c["issuerCN"] != exp["certSubjectCN"]:
        E("E_CERT_IDENTITY", "subject/issuer CN mismatch")
    if c["subjectDer"] != c["issuerDer"]: E("E_CERT_SELF", "issuer DER != subject DER")
    exts = c["exts"]
    allowed = {OID_KU, OID_EKU, OID_BC, OID_SKID}
    extra = set(exts) - allowed
    if extra: E("E_CERT_EXTENSIONS", "unexpected extensions " + ",".join(sorted(extra)))
    if OID_KU not in exts or OID_EKU not in exts or OID_BC not in exts: E("E_CERT_EXTENSIONS", "missing required extension")
    crit, ku = exts[OID_KU]
    if not crit or ku != bytes.fromhex("03020780"): E("E_CERT_KU", "KeyUsage not critical digitalSignature-only")
    crit, eku = exts[OID_EKU]
    try:
        oids = [der_oid(x[1]) for x in seq_of(eku)]
    except DerErr as e:
        E("E_CERT_EKU", str(e))
    if oids != [OID_EKU_CODE_SIGNING]: E("E_CERT_EKU", "EKU not exactly codeSigning")
    crit, bc = exts[OID_BC]
    if not crit: E("E_CERT_BC", "BasicConstraints not critical")
    bc_el = seq_of(bc)
    if len(bc_el) > 1 or (len(bc_el) == 1 and not (bc_el[0][0] == 0x01 and bc_el[0][1] == b"\x00")):
        E("E_CERT_BC", "BasicConstraints not CA:false")
    if OID_SKID in exts and exts[OID_SKID][0]: E("E_CERT_SKID", "SKID unexpectedly critical")
    em = rsa_public(c["exponent"], c["modulus"], c["signature"])
    if not pkcs1v15_check(em, hashlib.sha256(c["tbs"]).digest(), 3072):
        E("E_CERT_SELF_SIG", "certificate self-signature invalid")
    return {"subjectCN": c["subjectCN"], "serial": c["serial"], "modulusBits": c["modulus"].bit_length(),
            "extensions": sorted(exts), "selfSignature": "VERIFIED_PURE_PYTHON"}

# ---------- PE Authenticode ----------
def pe_authenticode_digest(buf, exp):
    if len(buf) < 0x40: E("E_PE", "too small")
    e_lfanew = int.from_bytes(buf[0x3C:0x40], "little")
    if buf[e_lfanew:e_lfanew+4] != b"PE\x00\x00": E("E_PE", "missing PE signature")
    coff = e_lfanew + 4
    machine = int.from_bytes(buf[coff:coff+2], "little")
    if machine != exp["peMachineAmd64"]: E("E_PE", "not AMD64")
    opt = coff + 20
    magic = int.from_bytes(buf[opt:opt+2], "little")
    if magic == 0x20B:
        cksum_off = opt + 64; dirs = opt + 112
    elif magic == 0x10B:
        cksum_off = opt + 64; dirs = opt + 96
    else:
        E("E_PE", f"unknown optional header magic {magic:#x}")
    sec_dir = dirs + 8 * 4
    cert_off = int.from_bytes(buf[sec_dir:sec_dir+4], "little")
    cert_size = int.from_bytes(buf[sec_dir+4:sec_dir+8], "little")
    if cksum_off != exp["peChecksumOffset"]: E("E_PE_LAYOUT", "checksum offset mismatch")
    if sec_dir != exp["peCertDirOffset"]: E("E_PE_LAYOUT", "security directory offset mismatch")
    if cert_off != exp["peCertTableOffset"] or cert_size != exp["peCertTableSize"]:
        E("E_AUTHENTICODE_TABLE", "certificate table offset/size mismatch")
    if cert_off + cert_size != len(buf): E("E_AUTHENTICODE_TABLE", "certificate table not exactly at EOF")
    h = hashlib.sha256()
    h.update(buf[:cksum_off]); h.update(buf[cksum_off+4:sec_dir]); h.update(buf[sec_dir+8:cert_off])
    digest = h.hexdigest()
    wc_len = int.from_bytes(buf[cert_off:cert_off+4], "little")
    wc_rev = int.from_bytes(buf[cert_off+4:cert_off+6], "little")
    wc_typ = int.from_bytes(buf[cert_off+6:cert_off+8], "little")
    if wc_len != cert_size: E("E_AUTHENTICODE_TABLE", "WIN_CERTIFICATE length != table size")
    if wc_rev != exp["winCertificateRevision"] or wc_typ != exp["winCertificateType"]:
        E("E_AUTHENTICODE_TABLE", "WIN_CERTIFICATE revision/type mismatch")
    pkcs7 = buf[cert_off+8:cert_off+8+(cert_size-8)]
    return digest, pkcs7

# ---------- CMS / PKCS#7 ----------
def check_cms(pkcs7, cert_der, pe_digest_bytes, exp, spc_len=None):
    try:
        ci = seq_of(pkcs7)
        if len(ci) != 2 or der_oid(ci[0][1]) != OID_SIGNED_DATA: E("E_PKCS7", "not signedData ContentInfo")
        t0, sd_seq, h0, tl0 = tlv(ci[1][1], 0)
        if t0 != 0x30 or tl0 != len(ci[1][1]): E("E_PKCS7", "signedData wrapper")
        sd = children(sd_seq)
        if der_int(sd[0][1]) not in (1, 3): E("E_PKCS7", "signedData version")
        algs = [der_oid(children(x[1])[0][1]) for x in children(sd[1][1])]
        if algs != [OID_SHA256]: E("E_PKCS7", "digestAlgorithms not exactly {SHA-256}")
        enc = children(sd[2][1])
        ectype = der_oid(enc[0][1])
        if enc[1][0] != 0xA0: E("E_PKCS7", "missing eContent")
        t1, spc, h1, tl1 = tlv(enc[1][1], 0)
        if t1 != 0x04 or tl1 != len(enc[1][1]): E("E_PKCS7", "eContent not one primitive OCTET STRING")
        if spc_len is not None and len(spc) != spc_len: E("E_PKCS7", "SpcIndirectData content length mismatch")
        spc_el = seq_of(spc)
        if len(spc_el) != 2: E("E_PKCS7", "SpcIndirectData element count")
        di = children(spc_el[1][1])
        if der_oid(children(di[0][1])[0][1]) != OID_SHA256: E("E_PKCS7", "DigestInfo alg not SHA-256")
        if di[1][0] != 0x04 or di[1][1] != pe_digest_bytes: E("E_AUTHENTICODE_DIGEST", "embedded DigestInfo != computed PE digest")
        certs, sis = [], []
        for t2, c2, h2, off, tl2 in sd[3:]:
            if t2 == 0xA0:
                i = 0
                while i < len(c2):
                    t3, c3, h3, tl3 = tlv(c2, i)
                    certs.append(c2[i:i+tl3]); i += tl3
            elif t2 == 0x31:
                j = 0
                while j < len(c2):
                    t4, c4, h4, tl4 = tlv(c2, j)
                    sis.append(c2[j:j+tl4]); j += tl4
        if len(sis) != 1: E("E_PKCS7", "exactly one signerInfo required")
        if len([c for c in certs if c == cert_der]) != 1:
            E("E_AUTHENTICODE_SIGNER", "embedded signer certificate != returned .cer bytes")
        c = parse_cert(cert_der)
        si_full = sis[0]
        si = seq_of(si_full)
        if der_int(si[0][1]) != 1: E("E_PKCS7", "signerInfo version")
        sid = children(si[1][1])
        t_i, issuer_content, h_i, tl_i = tlv(c["issuerDer"], 0)
        if der_int(sid[1][1]) != c["serial"] or sid[0][1] != issuer_content:
            E("E_PKCS7", "signer issuer/serial mismatch")
        if der_oid(children(si[2][1])[0][1]) != OID_SHA256: E("E_PKCS7", "signerInfo digest alg")
        # locate signedAttrs [0] TLV and re-encode as SET OF for the signature input
        t5, c5full, h5full, tl5full = tlv(si_full, 0)
        k = 0; attrs_tlv = None
        while k < len(c5full):
            t6, c6, h6, tl6 = tlv(c5full, k)
            if t6 == 0xA0 and attrs_tlv is None: attrs_tlv = c5full[k:k+tl6]
            k += tl6
        if attrs_tlv is None: E("E_PKCS7", "missing signedAttrs")
        attrs_raw = attrs_tlv[tlv(attrs_tlv, 0)[2]:]
        set_input = bytes([0x31]) + attrs_tlv[1:]
        attrs = {}
        j = 0
        while j < len(attrs_raw):
            at, ac, ah, atl = tlv(attrs_raw, j)
            a = seq_of(attrs_raw[j:j+atl])
            attrs[der_oid(a[0][1])] = [v[1] for v in children(a[1][1])]
            j += atl
        allowed_attrs = {OID_CONTENT_TYPE, OID_MESSAGE_DIGEST, OID_SIGNING_TIME}
        extra = set(attrs) - allowed_attrs
        if extra: E("E_PKCS7", "unexpected signedAttrs " + ",".join(sorted(extra)))
        if OID_CONTENT_TYPE not in attrs or OID_MESSAGE_DIGEST not in attrs:
            E("E_PKCS7", "missing mandatory signedAttr")
        ct = attrs[OID_CONTENT_TYPE]
        if len(ct) != 1 or der_oid(ct[0]) != ectype: E("E_PKCS7", "contentType attr != eContentType")
        md = attrs[OID_MESSAGE_DIGEST]
        if len(md) != 1 or md[0] != hashlib.sha256(spc).digest():
            E("E_AUTHENTICODE_DIGEST", "messageDigest != SHA-256(SpcIndirectData content)")
        if der_oid(children(si[4][1])[0][1]) != OID_RSA_ENC: E("E_PKCS7", "signature algorithm not RSA")
        em = rsa_public(c["exponent"], c["modulus"], si[5][1])
        if not pkcs1v15_check(em, hashlib.sha256(set_input).digest(), c["modulus"].bit_length()):
            E("E_AUTHENTICODE_SIGNATURE", "authenticated-attributes signature invalid")
    except DerErr as e:
        E("E_AUTHENTICODE_PARSE", str(e))
    return {"eContentType": ectype, "spcContentBytes": len(spc),
            "signerCertEquality": "BYTE_EXACT", "signature": "VERIFIED_PURE_PYTHON"}

# ---------- final record ----------
def finalize_record(orig_bytes, exp):
    if not orig_bytes.endswith(b"}\n") or not orig_bytes.startswith(b'{"certification":'):
        E("E_RECORD_FORMAT", "original record framing")
    body = orig_bytes[:-2].decode()
    out = '{"certificateDerSha256":"' + exp["certDerSha256"] + '",' + body[1:]
    m1 = '"records":'
    if out.count(m1) != 1: E("E_RECORD_FORMAT", "records marker")
    out = out.replace(m1, '"gitCommit":"' + exp["gitCommit"] + '","gitTree":"' + exp["gitTree"] + '",' + m1)
    m2 = '"signingRule":'
    if out.count(m2) != 1: E("E_RECORD_FORMAT", "signingRule marker")
    out = out.replace(m2, '"signedUkiSha256":"' + exp["signedUkiSha256"] + '",' + m2)
    fin = (out + "}" + "\n").encode()
    try:
        json.loads(fin)
    except Exception:
        E("E_FINAL_JSON", "finalized record not valid JSON")
    return fin

def check_final_record(final_bytes, orig_bytes, exp):
    if sha256(final_bytes) != exp["finalRecordSha256"]: E("E_FINAL_HASH", "final record SHA-256 mismatch")
    if len(final_bytes) != exp["finalRecordBytes"]: E("E_FINAL_SIZE", "final record size mismatch")
    want = finalize_record(orig_bytes, exp)
    if final_bytes != want: E("E_FINAL_DELTA", "final record != deterministic reconstruction (delta not the four permitted fields)")
    fo = json.loads(orig_bytes); ff = json.loads(final_bytes)
    if len(fo.get("records", [])) != 200 or fo["records"] != ff["records"]:
        E("E_FINAL_RECORDS", "200 records not retained")
    if set(ff) - set(fo) != {"certificateDerSha256", "gitCommit", "gitTree", "signedUkiSha256"}:
        E("E_FINAL_FIELDS", "top-level field delta mismatch")
    if set(fo) - set(ff): E("E_FINAL_FIELDS", "fields removed")
    by_path = {r["path"]: r for r in ff["records"]}
    if by_path.get("successor-unsigned.efi", {}).get("sha256") != exp["unsignedUkiSha256"]:
        E("E_FINAL_UNSIGNED", "unsigned UKI identity in final record")
    if by_path.get("inventory.v1.json", {}).get("sha256") != exp["inventorySha256"]:
        E("E_FINAL_INVENTORY", "inventory identity in final record")
    pre = sha256(DOMAIN + b"\x00" + final_bytes)
    if pre != exp["preimageDigestSha256"]: E("E_PREIMAGE", "detached preimage digest mismatch")
    return {"finalRecordBytes": len(final_bytes), "records": 200,
            "delta": ["certificateDerSha256", "gitCommit", "gitTree", "signedUkiSha256"],
            "preimageDigestSha256": pre, "reconstruction": "BYTE_EXACT"}

def check_detached_signature(sig, final_bytes, cert_der, exp):
    if len(sig) != exp["detachedSigBytes"]: E("E_SIG_LENGTH", "detached signature not 384 bytes")
    c = parse_cert(cert_der)
    mhash = hashlib.sha256(DOMAIN + b"\x00" + final_bytes).digest()
    em = rsa_public(c["exponent"], c["modulus"], sig)
    ok, code = emsa_pss_verify(em, mhash, c["modulus"].bit_length(), 32)
    if not ok: E(code, "detached RSA-PSS verification failed")
    return {"bytes": len(sig), "scheme": "RSA-PSS-SHA256", "saltLength": 32,
            "mgf": "MGF1-SHA256", "signature": "VERIFIED_PURE_PYTHON"}

# ---------- evidence set ----------
def repo_blob(repo, commit, path):
    p = subprocess.run(["git", "-C", repo, "cat-file", "blob", f"{commit}:{path}"], capture_output=True)
    if p.returncode != 0: E("E_REPO", path)
    return p.stdout

def check_evidence_set(d, repo, exp):
    files = sorted(f for f in os.listdir(d) if os.path.isfile(os.path.join(d, f)))
    want = sorted(EVIDENCE_FILES + ["EVIDENCE-MANIFEST.json"])
    if files != want: E("E_EVIDENCE_SET", f"got {files}")
    for f in files:
        low = f.lower()
        if low.endswith(PROHIBITED_EXT) or any(w in low for w in PROHIBITED_NAME):
            E("E_SECRET_IN_EVIDENCE", f)
    man = json.load(open(os.path.join(d, "EVIDENCE-MANIFEST.json"), "rb"))
    if man.get("schema") != "v3.production-signing-evidence.v3": E("E_MANIFEST", "schema")
    if man.get("gitCommit") != exp["gitCommit"] or man.get("gitTree") != exp["gitTree"]: E("E_MANIFEST", "git identity")
    for k, v in (("unsignedUkiSha256", exp["unsignedUkiSha256"]), ("signedUkiSha256", exp["signedUkiSha256"]),
                 ("certificateDerSha256", exp["certDerSha256"]), ("finalRecordSha256", exp["finalRecordSha256"]),
                 ("certificateThumbprint", exp["certThumbprintSha1"])):
        if man.get(k) != v: E("E_MANIFEST", k)
    if man.get("pssSaltLengthBytes") != 32: E("E_MANIFEST", "salt length")
    mf = man.get("files", {})
    if sorted(mf) != sorted(EVIDENCE_FILES): E("E_MANIFEST", "file keys")
    for name, ent in mf.items():
        data = open(os.path.join(d, name), "rb").read()
        if len(data) != ent.get("bytes") or sha256(data) != ent.get("sha256"):
            E("E_MANIFEST", f"file hash {name}")
    if repo_blob(repo, exp["gitCommit"], UNSIGNED_EFI_REPO_PATH) != open(os.path.join(d, "successor-unsigned.efi"), "rb").read():
        E("E_EVIDENCE_UNSIGNED", "unsigned UKI != repo blob")
    if repo_blob(repo, exp["gitCommit"], ORIG_RECORD_REPO_PATH) != open(os.path.join(d, "successor-authority-record.v1.json"), "rb").read():
        E("E_EVIDENCE_ORIGREC", "original record != repo blob")
    if repo_blob(repo, exp["gitCommit"], INVENTORY_REPO_PATH) != open(os.path.join(d, "inventory.v1.json"), "rb").read():
        E("E_EVIDENCE_INVENTORY", "inventory != repo blob")
    raw = open(os.path.join(d, "detached-preimage.sha256"), "rb").read()
    txt = raw.decode(errors="strict").strip()
    got = bytes.fromhex(txt) if re.fullmatch(r"[0-9a-fA-F]{64}", txt) else raw
    if got.hex() != exp["preimageDigestSha256"]: E("E_PREIMAGE_FILE", "detached-preimage.sha256 content")
    return {"files": len(EVIDENCE_FILES) + 1, "manifest": "CONSISTENT", "repoByteEquality": "3/3"}

def main():
    args = sys.argv[1:]
    def opt(name, default=None):
        return args[args.index(name) + 1] if name in args else default
    repo = opt("--repo", ".")
    signed_p = opt("--signed-efi"); cer_p = opt("--cert-der"); fin_p = opt("--final-record")
    sig_p = opt("--detached-sig"); evd = opt("--evidence-dir"); rep_p = opt("--report")
    exp = EXPECTED
    report = {"schema": "v3.provisioning-p1-verification.v1", "implementation": "pure-python-stdlib",
              "checks": {}, "result": None}
    orig = repo_blob(repo, exp["gitCommit"], ORIG_RECORD_REPO_PATH)
    if sha256(orig) != exp["origRecordSha256"]: E("E_REPO", "original record identity")
    if fin_p:
        final_bytes = open(fin_p, "rb").read()
        report["checks"]["finalRecord"] = check_final_record(final_bytes, orig, exp)
    if cer_p:
        cer = open(cer_p, "rb").read()
        report["checks"]["certificate"] = check_certificate(cer, exp)
    if sig_p and fin_p and cer_p:
        report["checks"]["detachedSignature"] = check_detached_signature(open(sig_p, "rb").read(), final_bytes, cer, exp)
    if signed_p and cer_p:
        signed = open(signed_p, "rb").read()
        if len(signed) != exp["signedUkiBytes"] or sha256(signed) != exp["signedUkiSha256"]:
            E("E_SIGNED_HASH", "signed UKI size/SHA-256 mismatch")
        digest, pkcs7 = pe_authenticode_digest(signed, exp)
        if digest != exp["peAuthenticodeDigestSha256"]: E("E_AUTHENTICODE_DIGEST", "computed PE digest != accepted value")
        if len(pkcs7) != exp["pkcs7Bytes"] or sha256(pkcs7) != exp["pkcs7Sha256"]:
            E("E_PKCS7", "PKCS#7 identity mismatch")
        report["checks"]["signedUki"] = {"bytes": len(signed), "peAuthenticodeDigestSha256": digest,
            "pkcs7Bytes": len(pkcs7), "pkcs7Sha256": sha256(pkcs7)}
        report["checks"]["pkcs7"] = check_cms(pkcs7, cer, bytes.fromhex(digest), exp,
                                              spc_len=exp["spcIndirectDataContentBytes"])
    if evd:
        report["checks"]["evidenceSet"] = check_evidence_set(evd, repo, exp)
    report["mutationPerformed"] = False
    report["result"] = "P1_EVIDENCE_VERIFICATION_PASS"
    out = json.dumps(report, indent=1, sort_keys=True) + "\n"
    if rep_p:
        open(rep_p, "w").write(out)
    sys.stdout.write(out)

if __name__ == "__main__":
    main()

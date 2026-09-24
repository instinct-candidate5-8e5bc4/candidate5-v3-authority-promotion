#!/usr/bin/env python3
# verify-uki-signed.py - fail-closed signed-UKI gate (gate 4b semantics, same code names as
# rehearsal/preflight-check.py). Companion to rehearsal/UKI-13309697-ROOT-CAUSE.md. certificate-table shape (WIN_CERTIFICATE
# header, table at EOF, wCertificateType PKCS_SIGNED_DATA), PKCS#7 DigestInfo extraction, and
# the firmware-semantics digest comparison (gate 4b): recomputed EDK2 section-wise digest MUST
# equal the embedded DigestInfo. Codes: E_UKI_CERT_NOT_EOF / E_UKI_CERT_BAD_HDR /
# E_UKI_PKCS7_ABSENT / E_UKI_PKCS7_DIGESTINFO / E_UKI_FIRMWARE_DIGEST_MISMATCH.
# usage: check-uki-signed.py <file.efi>   exit 0 PASS / 91 FAIL
import sys, json, hashlib, struct
def die_list(E, extra=None):
    d = {"result":"FAIL","file":sys.argv[1],"errors":E}
    if extra: d.update(extra)
    print(json.dumps(d, sort_keys=True)); sys.exit(91)
b = open(sys.argv[1],"rb").read()
E = []
e_lfanew = struct.unpack_from("<I", b, 0x3c)[0]
coff = e_lfanew + 4; opt = coff + 20
nsec = struct.unpack_from("<H", b, coff+2)[0]
optsz = struct.unpack_from("<H", b, coff+16)[0]
dd = opt + (112 if struct.unpack_from("<H",b,opt)[0]==0x20b else 96)
cva, csz = struct.unpack_from("<II", b, dd+4*8)
if cva == 0 or csz == 0: die_list([["E_UKI_PKCS7_ABSENT","no certificate table"]])
if cva + csz != len(b): E.append(["E_UKI_CERT_NOT_EOF","cert table end=%d file size=%d"%(cva+csz,len(b))])
dw, rev, typ = struct.unpack_from("<IHH", b, cva)
# WIN_CERTIFICATE.dwLength excludes 8-byte alignment padding; the security-directory size
# includes it (Authenticode spec). sbsign emits dwLength=1957 padded to 1960; signtool/
# osslsigncode emit dwLength == table size. Require: dwLength <= csz, pad < 8, pad zeroed.
pad = csz - dw
if dw > csz or pad >= 8 or typ != 0x0002 or rev != 0x0200 or (pad and b[cva+dw:cva+csz] != b"\0"*pad):
    E.append(["E_UKI_CERT_BAD_HDR","dwLength=%d revision=0x%04x type=0x%04x cert table size=%d pad=%d"%(dw,rev,typ,csz,pad)])
pkcs7 = b[cva+8:cva+dw] if not E else b[cva+8:cva+min(dw, len(b)-cva)]
def parse_secs():
    secs = []
    for i in range(nsec):
        o = opt+optsz+i*40
        vsz, va, rawsz, rawptr = struct.unpack_from("<IIII", b, o+8)
        secs.append((rawsz, rawptr))
    return secs
h = hashlib.sha256()
h.update(b[:opt+64]); h.update(b[opt+68:dd+4*8]); h.update(b[dd+4*8+8:struct.unpack_from("<I",b,opt+60)[0]])
soh = struct.unpack_from("<I",b,opt+60)[0]
sobh = soh
for rawsz, rawptr in sorted((s for s in parse_secs() if s[0]>0), key=lambda s: s[1]):
    h.update(b[rawptr:rawptr+rawsz]); sobh += rawsz
if cva > sobh: h.update(b[sobh:cva])
recomputed = h.hexdigest()
import re as _re
m = _re.search((b"\x06\x09\x60\x86\x48\x01\x65\x03\x04\x02\x01" + b"\x05\x00\x04\x20"), pkcs7)
if not m: E.append(["E_UKI_PKCS7_DIGESTINFO","no sha256 DigestInfo in PKCS#7"])
emb = pkcs7[m.end():m.end()+32].hex() if m else None
if emb and emb != recomputed:
    E.append(["E_UKI_FIRMWARE_DIGEST_MISMATCH","embedded=%s section-wise=%s"%(emb,recomputed)])
if E: die_list(E, {"embedded":emb,"sectionwise":recomputed})
print(json.dumps({"result":"PASS","file":sys.argv[1],"embedded_digestinfo":emb,"sectionwise":recomputed}, sort_keys=True))

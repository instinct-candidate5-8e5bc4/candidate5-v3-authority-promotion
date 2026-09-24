#!/usr/bin/env python3
# verify-auth.py (peer #16 ruling E4): fail-closed checker for the enrollment
# auth blobs produced by enroll-prep.sh. stdlib + staged openssl only.
# usage: verify-auth.py <work_dir> <enroll-app.c> <openssl>
# Codes: E_ESL_FORMAT / E_AUTH_FORMAT / E_AUTH_DIGEST / E_AUTH_SIG / E_AUTH_ATTR_CONTRACT
import sys, os, struct, hashlib, uuid, subprocess, tempfile, shutil, re

W, APP, OPENSSL = sys.argv[1:4]
MODE = sys.argv[4] if len(sys.argv) > 4 else ""
if MODE not in ("--expect-db2", "--no-db2"):
    # die() is defined below; this early usage failure prints + exits directly
    print(f"E_DB2_SET usage: verify-auth.py W APP OPENSSL (--expect-db2|--no-db2); got {MODE!r}", file=sys.stderr)
    sys.exit(97)
X509_GUID = uuid.UUID("a5c059a1-94e4-4aa7-87b5-ab155c2bf072").bytes_le
GV   = uuid.UUID("8be4df61-93ca-11d2-aa0d-00e098032b8c").bytes_le   # EFI_GLOBAL_VARIABLE
DBG  = uuid.UUID("d719b2cb-3d3a-4596-a3bc-dad00e67656f").bytes_le   # EFI_IMAGE_SECURITY_DATABASE
ATTR_BITS = {"EFI_VARIABLE_NON_VOLATILE": 0x01, "EFI_VARIABLE_BOOTSERVICE_ACCESS": 0x02,
             "EFI_VARIABLE_RUNTIME_ACCESS": 0x04, "EFI_VARIABLE_TIME_BASED_AUTHENTICATED_WRITE_ACCESS": 0x20,
             "EFI_VARIABLE_APPEND_WRITE": 0x40}
MD_OID = bytes.fromhex("06092a864886f70d010904")  # messageDigest 1.2.840.113549.1.9.4

def die(code, msg):
    print(f"{code} {msg}", flush=True)
    sys.exit(97)

# E3 (L1 shape): the attribute contract is EXTRACTED from the pinned consumer,
# never hand-typed. Compute the integer value of the ATTRS define in enroll-app.c.
src = open(APP, "rb").read().decode("utf-8")
m = re.search(r"#define\s+ATTRS\s*\(([^)]*)\)", src)
if not m:
    die("E_AUTH_ATTR_CONTRACT", f"no ATTRS define found in consumer {APP}")
names = [t.strip() for t in m.group(1).split("|")]
unknown = [n for n in names if n not in ATTR_BITS]
if unknown:
    die("E_AUTH_ATTR_CONTRACT", f"consumer ATTRS names not in bit table: {unknown}")
CONSUMER_ATTRS = 0
for n in names:
    CONSUMER_ATTRS |= ATTR_BITS[n]
print(f"attr contract extracted from pinned consumer: ATTRS = 0x{CONSUMER_ATTRS:02x} ({'|'.join(names)})")

def run(args, **kw):
    return subprocess.run(args, capture_output=True, **kw)

def check_esl(path):
    b = open(path, "rb").read()
    if len(b) < 28:
        die("E_ESL_FORMAT", f"{path}: {len(b)} bytes < one EFI_SIGNATURE_LIST header")
    off = 0
    entries = 0
    while off < len(b):
        # B4: EVERY list's SignatureType, not just the first
        if b[off:off + 16] != X509_GUID:
            die("E_ESL_FORMAT", f"{path}: list at {off} SignatureType bytes {b[off:off + 16].hex()} != EFI_CERT_X509_GUID struct order")
        lsize, hsize, ssize = struct.unpack_from("<III", b, off + 16)
        if ssize < 16 + 1 or hsize != 0 or lsize < 28 + ssize or off + lsize > len(b):
            die("E_ESL_FORMAT", f"{path}: bad list header ListSize={lsize} HeaderSize={hsize} SigSize={ssize} at {off}")
        body = lsize - 28 - hsize
        if body % ssize != 0:
            die("E_ESL_FORMAT", f"{path}: (ListSize-28-HeaderSize)%SigSize != 0 at {off}")
        for i in range(body // ssize):
            cert = b[off + 28 + hsize + 16 + i * ssize: off + 28 + hsize + (i + 1) * ssize]
            with tempfile.NamedTemporaryFile(suffix=".der", delete=False) as t:
                t.write(cert); tp = t.name
            r = run([OPENSSL, "x509", "-inform", "DER", "-in", tp, "-noout", "-fingerprint", "-sha256"])
            os.unlink(tp)
            if r.returncode != 0:
                die("E_ESL_FORMAT", f"{path}: entry {i} at {off} does not parse as X.509 DER")
            entries += 1
        off += lsize
    if off != len(b):
        die("E_ESL_FORMAT", f"{path}: trailing {len(b) - off} bytes after last list")
    return len(b), entries

def der_len(n):
    if n < 128:
        return bytes([n])
    s = n.to_bytes((n.bit_length() + 7) // 8, "big")
    return bytes([0x80 | len(s)]) + s

def parse_auth(path):
    b = open(path, "rb").read()
    if len(b) < 40:
        die("E_AUTH_FORMAT", f"{path}: {len(b)} bytes < auth2 header")
    year, month, day, hour, minute, second, pad1 = struct.unpack_from("<HBBBBBB", b, 0)
    nano, tz, daylight, pad2 = struct.unpack_from("<IhBB", b, 8)
    if pad1 != 0 or nano != 0 or tz != 0 or daylight != 0 or pad2 != 0:
        die("E_AUTH_FORMAT", f"{path}: EFI_TIME padding fields not zero (Pad1={pad1} Nanosecond={nano} TimeZone={tz} Daylight={daylight} Pad2={pad2})")
    dwlen, rev, ctype = struct.unpack_from("<IHH", b, 16)
    if rev != 0x0200:
        die("E_AUTH_FORMAT", f"{path}: wRevision 0x{rev:04x} != 0x0200")
    if ctype != 0x0EF1:
        die("E_AUTH_FORMAT", f"{path}: wCertificateType 0x{ctype:04x} != 0x0EF1")
    cert_guid = b[24:40]
    if cert_guid != uuid.UUID("4aafd29d-68df-49ee-8aa9-347d375665a7").bytes_le:
        die("E_AUTH_FORMAT", f"{path}: CertType != EFI_CERT_TYPE_PKCS7_GUID")
    if 16 + dwlen > len(b):
        die("E_AUTH_FORMAT", f"{path}: dwLength {dwlen} overruns file")
    pkcs7 = b[40:16 + dwlen]
    payload = b[16 + dwlen:]
    # N1: the messageDigest search covers the PKCS7 slice ONLY - never the ESL payload
    if pkcs7.count(MD_OID) != 1:
        die("E_AUTH_FORMAT", f"{path}: messageDigest OID count in pkcs7 {pkcs7.count(MD_OID)} != 1")
    i = pkcs7.index(MD_OID) + len(MD_OID)
    # SET { OCTET STRING } immediately follows the OID
    if pkcs7[i] != 0x31 or pkcs7[i + 2] != 0x04:
        die("E_AUTH_FORMAT", f"{path}: messageDigest not a SET OF OCTET STRING at pkcs7 offset {i}")
    slen = pkcs7[i + 1]
    olen = pkcs7[i + 3]
    if slen != olen + 2 or olen != 32:
        die("E_AUTH_FORMAT", f"{path}: messageDigest lengths set={slen} oct={olen}, expected 34/32")
    md = pkcs7[i + 4: i + 36]
    return b[:16], pkcs7, payload, md

def composite(varname, guid, attrs, timestamp, payload):
    return varname.encode("utf-16-le") + guid + struct.pack("<I", attrs) + timestamp + payload

def wrapped(pkcs7):
    oid = bytes.fromhex("06092a864886f70d010702")  # pkcs7-signedData
    inner = oid + b"\xa0" + der_len(len(pkcs7)) + pkcs7
    return b"\x30" + der_len(len(inner)) + inner

FILES = [("pk",  "PK",  GV,  "pk.crt"),
         ("kek", "KEK", GV,  "pk.crt"),
         ("db",  "db",  DBG, "kek.crt"),
         ("db2", "db",  DBG, "kek.crt")]
ALT_CANDIDATES = [0x67, 0x07, 0x3F, 0x47]

mismatches = {}
processed = 0
tmp = tempfile.mkdtemp(prefix="verify-auth-")
try:
    for stem, varname, guid, signer in FILES:
        ep = os.path.join(W, f"{stem}.esl")
        ap = os.path.join(W, f"{stem}.auth")
        ee, ea = os.path.exists(ep), os.path.exists(ap)
        if stem == "db2":
            # B6: BOTH or NEITHER; presence must match the expected mode
            if ee != ea:
                die("E_DB2_SET", f"db2 half-present: db2.esl exists={ee} db2.auth exists={ea}")
            if MODE == "--expect-db2" and not ee:
                die("E_DB2_SET", "widened mode (hostile fixture given) but db2.esl/db2.auth absent")
            if MODE == "--no-db2" and ee:
                die("E_DB2_SET", "sole mode but db2.esl/db2.auth present")
            if not ee:
                continue
        elif not (ee and ea):
            die("E_ESL_FORMAT", f"missing {ep} or {ap}")
        processed += 1
        esl_len, entries = check_esl(ep)
        ts, pkcs7, payload, md = parse_auth(ap)
        esl = open(ep, "rb").read()
        if payload != esl:
            off = next((i for i, (x, y) in enumerate(zip(payload, esl)) if x != y), min(len(payload), len(esl)))
            die("E_AUTH_FORMAT", f"{ap}: payload bytes after header differ from {stem}.esl at offset {off}")
        want = hashlib.sha256(composite(varname, guid, CONSUMER_ATTRS, ts, esl)).digest()
        if md != want:
            alt = None
            for a in ALT_CANDIDATES:
                if a != CONSUMER_ATTRS and hashlib.sha256(composite(varname, guid, a, ts, esl)).digest() == md:
                    alt = a
                    break
            mismatches[stem] = alt
            continue
        # signature verification over the exact buffer the firmware reconstructs
        cp = os.path.join(tmp, f"{stem}.bin")
        wp = os.path.join(tmp, f"{stem}.p7")
        open(cp, "wb").write(composite(varname, guid, CONSUMER_ATTRS, ts, esl))
        open(wp, "wb").write(wrapped(pkcs7))
        r = run([OPENSSL, "smime", "-verify", "-binary", "-inform", "DER", "-in", wp, "-content", cp,
                 "-CAfile", os.path.join(W, signer), "-purpose", "any"])
        if r.returncode != 0:
            die("E_AUTH_SIG", f"{ap}: PKCS7 signature does not verify against {signer} over the firmware-reconstructed buffer")
        print(f"verify OK {stem}.auth esl={esl_len}B entries={entries} sig verified against {signer}")
finally:
    shutil.rmtree(tmp, ignore_errors=True)

if mismatches:
    alts = set(mismatches.values())
    # E3: the CONTRACT violation is the whole set signed with one wrong value (the
    # run-15 production defect). A PARTIAL mismatch is a corrupt/re-signed file
    # and dies E_AUTH_DIGEST (peer #16 E5's negative-test expectation).
    if len(mismatches) == processed and len(alts) == 1 and None not in alts:
        a = alts.pop()
        die("E_AUTH_ATTR_CONTRACT",
            f"all {processed} .auth files bind attrs=0x{a:02x}, consumer contract is 0x{CONSUMER_ATTRS:02x} ({sorted(mismatches)})")
    first = sorted(mismatches)[0]
    die("E_AUTH_DIGEST", f"{first}.auth messageDigest != sha256(name||guid||0x{CONSUMER_ATTRS:02x}||timestamp||esl)")
print("VERIFY_AUTH_OK all .esl format-checked, all .auth headers/digests/signatures verified against the consumer attr contract")

#!/usr/bin/env python3
# NON_CERTIFYING_REHEARSAL enrollment predicate checker (frozen predicates, fail-closed).
# Verifies ONE enrollment's ENROLL.TXT + enrolled VARS fd against the pre-frozen predicates
# (reviewer requirement 5a/5b resolution; edk2 edc6681206c1a8791981a2f911d2fb8b3d2f5768):
#   ENROLL: SET_{DB,KEK,PK}_STATUS == EFI_SUCCESS(0); SecureBoot: GET EFI_SUCCESS, attributes
#     exactly 6 (BS|RT only), size 1, data 0x01; SetupMode: GET EFI_SUCCESS, attributes
#     exactly 6 (BS|RT only), size 1, data 0x00.
#   VARS: stored PK/KEK/db data byte-equal the enrolled ESL payloads; PK and KEK each exactly
#     one X509 ESL entry with owner c501e570-0de0-0001-0000-000000000000 and DER equal to this
#     run's throwaway PK/KEK DER; sole db exactly {production cert 7cda4ddc..}; widened db
#     exactly {7cda4ddc.., 4428760c..}; dbx ABSENT (frozen form); dbt and all *Default trust
#     variables ABSENT. SecureBootEnable is recorded observationally (expected present NV|BS,
#     value 0x01, post-enrollment; absent in the pristine VARS).
# Any deviation FAILS the ceremony run (exit 92). The predicate cannot be reinterpreted;
# changing it = new candidate SHA + two rehearsals.
# usage: enroll-predicate-check.py <mode: sole|widened|sole-fresh|db2> <ENROLL.TXT> <prep_dir> <enrolled.fd> <vars_parser>
import sys, os, json, hashlib, subprocess

OWNER_GUID = "c501e570-0de0-0001-0000-000000000000"
X509 = "X509"
PROD_CERT = "7cda4ddc149849cc61191d4b5b3d218d14770c0401e9e66dd9617b82ba1ae441"
HOSTILE_CERT = "4428760c1ba2322bd9f9254e45cbbdb5b89c3f8b4e594f0efff337a4d3c4e07a"
TRUST_FORBIDDEN = {"dbx", "dbt", "PKDefault", "KEKDefault", "dbDefault", "dbxDefault", "dbtDefault"}

E = []
def fail(code, msg): E.append((code, msg))
def sha_f(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for c in iter(lambda: f.read(1 << 20), b""): h.update(c)
    return h.hexdigest()

mode, enroll_txt, prep, fd, parser = sys.argv[1:6]
widened = mode in ("widened", "db2")
if mode not in ("sole", "widened", "sole-fresh", "db2"):
    fail("E_PRED_MODE", mode)

# --- ENROLL.TXT predicate ---
# G3/T5 F5: the app writes UTF-16LE (CHAR16, no BOM guaranteed). Decode explicitly,
# strip a BOM if present, and fail closed (E_ENROLL_DECODE) on any decode error.
_raw = open(enroll_txt, "rb").read()
if _raw.startswith(b"\xff\xfe"):
    _raw = _raw[2:]
try:
    _text = _raw.decode("utf-16-le", errors="strict")
except UnicodeDecodeError as _e:
    fail("E_ENROLL_DECODE", str(_e))
    _text = None
import os as _os
PREFIX=_os.environ.get("PREFIX","")
if not PREFIX: print("E_PREFIX_UNSET"); sys.exit(97)
ALLOWED=_os.environ.get("ALLOWED_PREFIX","")
if PREFIX!=ALLOWED: print("E_PREFIX_MISMATCH prefix=%s allowed=%s"%(PREFIX,ALLOWED)); sys.exit(97)
rec = {}
if _text is None:
    report = {"schema": "NON_CERTIFYING_REHEARSAL-enroll-predicate/v1", "lane": PREFIX, "mode": mode,
          "enrolled_fd_sha256": sha_f(fd),
              "widened": widened, "errors": E, "result": "FAIL"}
    print(json.dumps(report, indent=1, sort_keys=True))
    sys.exit(92)
for line in _text.splitlines():
    if "=" in line:
        k, v = line.split("=", 1)
        rec[k] = v
# L5 (peer run-12 ruling): an app FATAL= line is the predicate's FIRST error,
# ahead of the missing-status list - it names why the app never produced statuses.
if "FATAL" in rec:
    E.insert(0, ("E_ENROLL_APP_FATAL", rec["FATAL"]))
def exp(key, want, code):
    got = rec.get(key)
    if got != want:
        fail(code, "%s=%r expected %r" % (key, got, want))
exp("SET_DB_STATUS", "0", "E_ENROLL_SET_DB")
exp("SET_KEK_STATUS", "0", "E_ENROLL_SET_KEK")
exp("SET_PK_STATUS", "0", "E_ENROLL_SET_PK")
for var, want_data in (("SecureBoot", "01"), ("SetupMode", "00")):
    exp(var + "_GET_STATUS", "0", "E_ENROLL_GET_" + var.upper())
    exp(var + "_ATTR", "6", "E_ENROLL_ATTR_" + var.upper())
    exp(var + "_SIZE", "1", "E_ENROLL_SIZE_" + var.upper())
    exp(var + "_DATA", want_data, "E_ENROLL_DATA_" + var.upper())

# --- ESL byte-identity: stored variable data == the exact enrolled ESL payloads ---
def hexdata(key):
    h = rec.get(key)
    if not h:
        return None
    try:
        return bytes.fromhex(h)
    except ValueError:
        return None
for name, key, fn in (("PK", "PK_DATA", "pk.esl"),
                      ("KEK", "KEK_DATA", "kek.esl"),
                      ("db", "db_DATA", "db2.esl" if widened else "db.esl")):
    d = hexdata(key)
    if d is None:
        fail("E_ENROLL_DATA_MISSING", name)
        continue
    ref_path = os.path.join(prep, fn)
    if not os.path.exists(ref_path):
        fail("E_PREP_MISSING", fn)
        continue
    if d != open(ref_path, "rb").read():
        fail("E_ESL_BYTE_MISMATCH", "%s stored data != %s" % (name, fn))

# --- VARS fd structural predicates via the pinned parser ---
p = subprocess.run([sys.executable, parser, fd], capture_output=True, text=True)
if p.returncode != 0:
    fail("E_VARS_PARSE", (p.stderr or p.stdout)[:200])
    v = {"variables": []}
else:
    v = json.loads(p.stdout)
by_name = {x["name"]: x for x in v.get("variables", [])}
def der_entries(name):
    r = by_name.get(name)
    if r is None:
        return None
    if r.get("esl_error"):
        fail("E_TRUST_ESL_ERROR", "%s %s" % (name, r["esl_error"]))
    out = []
    for l in r.get("esl_lists", []):
        for e in l["entries"]:
            out.append((e["type"], e["owner"], e["data_sha256"]))
    return out
def one_x509(name, der):
    es = der_entries(name)
    if es is None:
        fail("E_TRUST_MISSING", name)
        return
    if len(es) != 1:
        fail("E_TRUST_COUNT", "%s entries=%d" % (name, len(es)))
        return
    t, o, h = es[0]
    if t != X509: fail("E_TRUST_TYPE", "%s type=%s" % (name, t))
    if o != OWNER_GUID: fail("E_TRUST_OWNER", "%s owner=%s" % (name, o))
    if h != der: fail("E_TRUST_DER", "%s der=%s" % (name, h))
pk_der = sha_f(os.path.join(prep, "pk.cer")) if os.path.exists(os.path.join(prep, "pk.cer")) else fail("E_PREP_MISSING", "pk.cer") or ""
kek_der = sha_f(os.path.join(prep, "kek.cer")) if os.path.exists(os.path.join(prep, "kek.cer")) else fail("E_PREP_MISSING", "kek.cer") or ""
if pk_der: one_x509("PK", pk_der)
if kek_der: one_x509("KEK", kek_der)
db = der_entries("db")
db_expected = {PROD_CERT, HOSTILE_CERT} if widened else {PROD_CERT}
if db is None:
    fail("E_TRUST_MISSING", "db")
else:
    if any(t != X509 for t, _, _ in db): fail("E_TRUST_TYPE", "db non-X509 list")
    if any(o != OWNER_GUID for _, o, _ in db): fail("E_TRUST_OWNER", "db owner mismatch")
    if {h for _, _, h in db} != db_expected or len(db) != len(db_expected):
        fail("E_TRUST_DER_SET", "db ders=%s" % sorted(h for _, _, h in db))
present = TRUST_FORBIDDEN & set(by_name)
if present:
    fail("E_TRUST_FORBIDDEN_PRESENT", sorted(present))
sbe = by_name.get("SecureBootEnable")
sbe_note = None
if sbe:
    sbe_note = {"attributes": sbe["attributes"], "data_size": sbe["data_size"],
                "data_sha256": sbe["data_sha256"]}
report = {"schema": "NON_CERTIFYING_REHEARSAL-enroll-predicate/v1", "lane": PREFIX, "mode": mode,
          "widened": widened, "pk_der_sha256": pk_der, "kek_der_sha256": kek_der,
          "secure_boot_enable_observed": sbe_note, "errors": E,
          "result": "PASS" if not E else "FAIL"}
print(json.dumps(report, indent=1, sort_keys=True))
sys.exit(0 if not E else 92)

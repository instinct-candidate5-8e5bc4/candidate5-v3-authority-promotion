#!/usr/bin/env python3
# peer run-36031372949 ruling (6i/6ii/8/9/10 + convention): committed tests for the
# executed-argv freeze contract. Every block is EXTRACTED from the committed sources and
# executed - never reimplemented:
#   A. convention: recompute case R1's frozen entry FROM config.json via the harness's own
#      extracted build_argv - the rebuilt list must equal the frozen argv byte-for-byte and
#      its NUL-join sha256 must equal the frozen argv_sha256.
#   B. 6i comparison block (from rehearsal-harness.py): rehearsal-lane match passes;
#      scratch-lane rewritten argv passes via the canonical reverse-rewrite; a tampered
#      element dies E_CASE_ARGV_FROZEN_MISMATCH; an unknown id dies E_CASE_ARGV_FROZEN_MISSING.
#   C. freeze loader (from rehearsal-harness.py): the committed file loads (11 ids); a
#      missing file dies E_ARGV_FREEZE_MISSING; a tampered copy dies E_ARGV_FREEZE_PIN_MISMATCH.
#   D. preflight 6e3b: real config/freeze id sets pass; a renamed freeze id dies
#      E_CASE_ARGV_FREEZE_SET naming the drift.
#   E. preflight 6e3c: the real tree passes; a drifted harness pin constant dies
#      E_ARGV_FREEZE_PIN_DRIFT.
import hashlib, json, os, shutil, sys, tempfile

sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
HSRC = open(os.path.join(HERE, "rehearsal-harness.py")).read()
PF = open(os.path.join(HERE, "preflight-check.py")).read()
CFG = json.load(open(os.path.join(HERE, "config.json")))
FZ = json.load(open(os.path.join(HERE, "argv-freeze.json")))
FAILS = 0


class GateFail(Exception):
    def __init__(self, code, msg):
        self.code = code
        self.msg = msg


def fail(c, m):
    raise GateFail(c, m)


def report(name, ok, got=None):
    global FAILS
    print(("PASS" if ok else "FAIL") + " " + name + ("" if ok else " got=%r" % (got,)))
    if not ok:
        FAILS += 1


def expect_fail(name, fn, code, in_msg=None):
    try:
        fn()
        report(name, False, "no failure")
    except GateFail as e:
        report(name, e.code == code and (in_msg is None or in_msg in e.msg), (e.code, e.msg))


# --- A. convention: recompute one frozen entry from the config ---
i = HSRC.index("def build_argv")
j = HSRC.index("\ndef ", i)
g = {}
exec(HSRC[i:j], g)
case = CFG["cases"][0]
frozen = next(c for c in FZ["cases"] if c["id"] == case["id"])
cdir = "/tmp/NON_CERTIFYING_REHEARSAL-out/NON_CERTIFYING_REHEARSAL-cases/" + case["id"]
built = g["build_argv"](CFG, cdir, os.path.join(cdir, "vars.fd"), case["esp"], case["firmware"], frozen["qmp_sock"])
report("A1 build_argv rebuilds the frozen R1 argv byte-for-byte", built == frozen["argv"])
report("A2 NUL-join sha256 of the rebuild equals the frozen argv_sha256",
       hashlib.sha256("\0".join(built).encode()).hexdigest() == frozen["argv_sha256"])

# --- B. 6i comparison block ---
i = HSRC.index("    # peer run-36031372949 ruling (6i)")
j = HSRC.index("    # end peer run-36031372949 ruling (6i)", i)
BLOCK = HSRC[i:j]
lines = BLOCK.splitlines()
ind = min(len(l) - len(l.lstrip()) for l in lines if l.strip())
BLOCK = "\n".join(l[ind:] for l in lines) + "\n"
SHA = frozen["argv_sha256"]


def run_cmp(argv, cid, prefix):
    gg = {"_ARGV_FREEZE": {frozen["id"]: SHA}, "cid": cid, "argv": argv,
          "PREFIX": prefix, "hashlib": hashlib, "fail": fail}
    exec(compile(BLOCK, "block6i", "exec"), gg)


report("B1 rehearsal-lane executed argv matches the frozen pin",
       run_cmp(list(frozen["argv"]), frozen["id"], "NON_CERTIFYING_REHEARSAL") is None)
scratch_argv = [t.replace("/tmp/NON_CERTIFYING_REHEARSAL-", "/tmp/NON_CERTIFYING_SCRATCH-") for t in frozen["argv"]]
report("B2 scratch-lane argv passes via the canonical reverse-rewrite",
       run_cmp(scratch_argv, frozen["id"], "NON_CERTIFYING_SCRATCH") is None)
bad = list(frozen["argv"]); bad[1] = "-machine-X"
expect_fail("B3 tampered element dies E_CASE_ARGV_FROZEN_MISMATCH",
            lambda: run_cmp(bad, frozen["id"], "NON_CERTIFYING_REHEARSAL"), "E_CASE_ARGV_FROZEN_MISMATCH")
expect_fail("B4 executed id missing from the freeze dies E_CASE_ARGV_FROZEN_MISSING",
            lambda: run_cmp(list(frozen["argv"]), "NON_CERTIFYING_REHEARSAL-R99-nope", "NON_CERTIFYING_REHEARSAL"), "E_CASE_ARGV_FROZEN_MISSING")

# --- C. freeze loader ---
i = HSRC.index("# peer run-36031372949 ruling (8)+(9)")
j = HSRC.index("# end peer run-36031372949 ruling (8)+(9)", i)
BLOCK = HSRC[i:j]
g = {"hashlib": hashlib, "json": json, "fail": fail}
# the pin constant is module-level in the harness (outside the extracted loader block);
# read the committed value, never a hardcoded copy.
g["ARGV_FREEZE_SHA256"] = HSRC.split('ARGV_FREEZE_SHA256="', 1)[1].split('"', 1)[0]
exec(BLOCK, g)
real = g["_load_argv_freeze"](os.path.join(HERE, "argv-freeze.json"))
report("C1 committed freeze loads (11 case ids)", isinstance(real, dict) and len(real) == 11)
expect_fail("C2 missing freeze file dies E_ARGV_FREEZE_MISSING",
            lambda: g["_load_argv_freeze"]("/nonexistent/argv-freeze.json"), "E_ARGV_FREEZE_MISSING")
tmp = tempfile.mkdtemp(prefix="c5-aftest-")
try:
    raw = open(os.path.join(HERE, "argv-freeze.json"), "rb").read()
    tampered = raw[:-2] + b"0" + raw[-1:] if raw[-2:-1] != b"0" else raw[:-2] + b"1" + raw[-1:]
    tp = os.path.join(tmp, "argv-freeze.json")
    open(tp, "wb").write(tampered)
    expect_fail("C3 tampered freeze copy dies E_ARGV_FREEZE_PIN_MISMATCH",
                lambda: g["_load_argv_freeze"](tp), "E_ARGV_FREEZE_PIN_MISMATCH")
finally:
    shutil.rmtree(tmp, ignore_errors=True)

# --- D. preflight 6e3b (config ids == freeze ids) ---
i = PF.index("# 6e3b)")
j = PF.index("# 6e3c)", i)
BLOCK = PF[i:j]


def run_6e3b(fz, cfg):
    gg = {"_fz2": fz, "cfg": cfg, "fail": fail}
    exec(compile(BLOCK, "block6e3b", "exec"), gg)


report("D1 real config/freeze id sets pass", run_6e3b(FZ, CFG) is None)
badfz = json.loads(json.dumps(FZ))
badfz["cases"][0]["id"] = "NON_CERTIFYING_REHEARSAL-R99-renamed"
expect_fail("D2 renamed freeze id dies E_CASE_ARGV_FREEZE_SET",
            lambda: run_6e3b(badfz, CFG), "E_CASE_ARGV_FREEZE_SET", "R99-renamed")

# --- E. preflight 6e3c (harness pin == committed freeze sha256) ---
i = PF.index("# 6e3c)")
j = PF.index("# 6e6)", i)
BLOCK = PF[i:j]


def run_6e3c(here):
    gg = {"os": os, "here": here, "hashlib": hashlib, "fail": fail}
    exec(compile(BLOCK, "block6e3c", "exec"), gg)


report("E1 real tree pin matches the committed freeze", run_6e3c(HERE) is None)
tmp = tempfile.mkdtemp(prefix="c5-aftest-")
try:
    shutil.copy(os.path.join(HERE, "argv-freeze.json"), os.path.join(tmp, "argv-freeze.json"))
    drift = HSRC.replace('ARGV_FREEZE_SHA256="e9a38cec', 'ARGV_FREEZE_SHA256="00000000', 1)
    if drift == HSRC:
        report("E2 drifted harness pin dies E_ARGV_FREEZE_PIN_DRIFT", False, "could not plant")
        FAILS += 0
    else:
        open(os.path.join(tmp, "rehearsal-harness.py"), "w").write(drift)
        expect_fail("E2 drifted harness pin dies E_ARGV_FREEZE_PIN_DRIFT",
                    lambda: run_6e3c(tmp), "E_ARGV_FREEZE_PIN_DRIFT")
finally:
    shutil.rmtree(tmp, ignore_errors=True)

if FAILS:
    sys.exit(1)
print("test-argv-freeze: all 11 checks pass")

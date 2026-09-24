#!/usr/bin/env python3
# peer run-36017957182 ruling (DEFECT 2 + Q1/Q2): committed test for the single-sourced
# top-level config schema. Runs config_schema.py's OWN validator (the same import the
# harness and preflight use) - never a reimplementation:
#   1. the SHIPPED config.json passes
#   2. a planted extra top-level key fails
#   3. a missing REQUIRED 'enrollments' key fails (Q1: required, never merely tolerated)
#   4. bad enrollments value shapes fail (non-dict, empty, wrong inner keys, empty list,
#      bad hex, bad IN-RUN)
#   5. IN-RUN:<name> entries pass
import sys, os, json

sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from config_schema import ConfigSchemaError, check_top


def deepcopy(o):  # json round-trip: 'copy' is not on PY_ALLOW (peer verdict BLOCKER 1 on the 10-prime head)
    return json.loads(json.dumps(o))


FAILS = 0


def check(name, fn, expect_ok):
    global FAILS
    try:
        fn()
        ok, detail = expect_ok, ""
    except ConfigSchemaError as e:
        ok, detail = (not expect_ok), e.msg
    print(("PASS" if ok else "FAIL") + " " + name + (" " + detail if detail and not ok else ""))
    if not ok:
        FAILS += 1


cfg = json.load(open(os.path.join(HERE, "config.json")))
check("shipped config.json passes", lambda: check_top(deepcopy(cfg)), True)

bad = deepcopy(cfg)
bad["planted_extra"] = 1
check("planted extra top key fails", lambda: check_top(bad), False)

bad = deepcopy(cfg)
del bad["enrollments"]
check("missing enrollments fails (REQUIRED per Q1)", lambda: check_top(bad), False)

name = sorted(cfg["enrollments"])[0]
good_entry = deepcopy(cfg["enrollments"][name])

def with_enr(val):
    c = deepcopy(cfg)
    c["enrollments"] = val
    return c

check("enrollments non-dict fails", lambda: check_top(with_enr([1, 2])), False)
check("enrollments empty fails", lambda: check_top(with_enr({})), False)
check("inner wrong keys fails", lambda: check_top(with_enr({name: {"db_der_sha256": good_entry["db_der_sha256"], "extra": 1}})), False)
check("inner empty list fails", lambda: check_top(with_enr({name: {"db_der_sha256": []}})), False)
check("bad hex entry fails", lambda: check_top(with_enr({name: {"db_der_sha256": ["zz" * 32]}})), False)
check("short hex entry fails", lambda: check_top(with_enr({name: {"db_der_sha256": ["ab" * 31]}})), False)  # 62 hex - not 64
check("bad IN-RUN entry fails", lambda: check_top(with_enr({name: {"db_der_sha256": ["IN-RUN:"]}})), False)
check("IN-RUN:<name> entry passes", lambda: check_top(with_enr({name: {"db_der_sha256": ["IN-RUN:c5-throwaway-ci-cert"]}})), True)
check("64-hex entry passes", lambda: check_top(with_enr({name: {"db_der_sha256": ["ab" * 32]}})), True)

if FAILS:
    sys.exit(1)
print("test-config-schema: all checks pass")

#!/usr/bin/env python3
# peer run-36024634796 ruling (c): committed test for gate 6p E_HIST_ESP_BOOT_EXPECT.
# Executes the EXACT gate block extracted from preflight-check.py (bounded by the 6p/6q
# section markers - the same extraction discipline as test-env-contract) against the REAL
# config plus planted mutations - never a reimplementation:
#   1. the real config.json (R7 certification-only; R1 keeps the historical ESP
#      with kernel_exec=false)                                   -> passes
#   2. planted: R7 back in the scratch lane (historical ESP, kernel_exec=true)
#      -> E_HIST_ESP_BOOT_EXPECT naming the case
#   3. planted: kernel_exec=true on a NON-historical ESP in the scratch lane   -> passes
import json, os, sys

sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
PF = open(os.path.join(HERE, "preflight-check.py")).read()
i = PF.index("# 6p) peer run-36024634796 ruling (c)")
j = PF.index("# 6q) peer run-36024634796 ruling (d)", i)
BLOCK = PF[i:j]


class GateFail(Exception):
    def __init__(self, code, msg):
        self.code = code
        self.msg = msg


def run_gate(cfg):
    g = {"cfg": json.loads(json.dumps(cfg)),
         "fail": lambda c, m: (_ for _ in ()).throw(GateFail(c, m))}
    try:
        exec(BLOCK, g)
        return None
    except GateFail as e:
        return (e.code, e.msg)


FAILS = 0


def check(name, cfg, expect_code, expect_in_msg=None):
    global FAILS
    r = run_gate(cfg)
    if expect_code is None:
        ok = r is None
    else:
        ok = r is not None and r[0] == expect_code and (expect_in_msg is None or expect_in_msg in r[1])
    print(("PASS" if ok else "FAIL") + " " + name + ("" if ok else " got=%r" % (r,)))
    if not ok:
        FAILS += 1


REAL = json.load(open(os.path.join(HERE, "config.json")))
check("real config passes", REAL, None)

R7 = "NON_CERTIFYING_REHEARSAL-R7-release-sibling-behavior-only"
planted = json.loads(json.dumps(REAL))
for c in planted["cases"]:
    if c["id"] == R7:
        c["lanes"] = ["scratch", "certification"]
check("planted R7 in scratch lane fires", planted, "E_HIST_ESP_BOOT_EXPECT", R7)

planted2 = json.loads(json.dumps(REAL))
for c in planted2["cases"]:
    if c["id"] == R7:
        c["esp"] = "build-output/esp-variant/NON_CERTIFYING_REHEARSAL-esp-ossl-throwaway.raw"
        c["lanes"] = ["scratch", "certification"]
check("positive expectation on a NON-historical ESP passes", planted2, None)

if FAILS:
    sys.exit(1)
print("test-hist-esp-guard: all 3 checks pass")

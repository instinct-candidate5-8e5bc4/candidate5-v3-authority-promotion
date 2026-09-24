#!/usr/bin/env python3
# peer run-36024634796 ruling (d)+(e): committed test for gate 6q E_WORKDIR_SIBLING_MISSING.
# Executes the EXACT gate block extracted from preflight-check.py (bounded by the 6q/7
# section markers - the same extraction discipline as test-env-contract) - never a
# reimplementation:
#   1. the REAL tree (derive-scratch.py + both lane workflows)   -> passes
#   2. synthetic full-closure copy of the H3 block               -> passes
#   3. planted: config_schema.py removed from the H3 workdir copy (run
#      36024634796's exact D2 defect) -> E_WORKDIR_SIBLING_MISSING naming config_schema.py
import os, shutil, sys, tempfile

sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
PF = open(os.path.join(HERE, "preflight-check.py")).read()
i = PF.index("# 6q) peer run-36024634796 ruling (d)")
j = PF.index("# 7) KVM requirement", i)
BLOCK = PF[i:j]


class GateFail(Exception):
    def __init__(self, code, msg):
        self.code = code
        self.msg = msg


def run_gate(here):
    g = {"os": os, "here": here,
         "fail": lambda c, m: (_ for _ in ()).throw(GateFail(c, m))}
    try:
        exec(BLOCK, g)
        return None
    except GateFail as e:
        return (e.code, e.msg)


FAILS = 0


def check(name, here, expect_code, expect_in_msg=None):
    global FAILS
    r = run_gate(here)
    if expect_code is None:
        ok = r is None
    else:
        ok = r is not None and r[0] == expect_code and (expect_in_msg is None or expect_in_msg in r[1])
    print(("PASS" if ok else "FAIL") + " " + name + ("" if ok else " got=%r" % (r,)))
    if not ok:
        FAILS += 1


check("real tree passes", HERE, None)

# synthetic tree: root/d1/d2/d3/d4/rehearsal so that here/../../../../../.github
# resolves to root/.github (the gate's workflow paths are relative to `here`).
root = tempfile.mkdtemp(prefix="c5-wstest-")
try:
    syn = os.path.join(root, "d1", "d2", "d3", "d4", "rehearsal")
    os.makedirs(syn)
    wf = os.path.join(root, ".github", "workflows")
    os.makedirs(wf)
    for m in ("rehearsal-harness.py", "lane_resolve.py", "config_schema.py"):
        shutil.copy(os.path.join(HERE, m), os.path.join(syn, m))
    for w in ("NON_CERTIFYING_REHEARSAL-workflow.yml", "NON_CERTIFYING_SCRATCH-workflow.yml"):
        open(os.path.join(wf, w), "w").write("")
    ds = open(os.path.join(HERE, "derive-scratch.py")).read()
    open(os.path.join(syn, "derive-scratch.py"), "w").write(ds)
    check("synthetic full closure passes", syn, None)
    planted = ds.replace('          cp config_schema.py "$T/config_schema.py"\n', "", 1)
    if planted == ds:
        print("FAIL could not plant the config_schema removal (derive-scratch.py source drift)")
        FAILS += 1
    else:
        open(os.path.join(syn, "derive-scratch.py"), "w").write(planted)
        check("planted config_schema removal fires", syn, "E_WORKDIR_SIBLING_MISSING", "config_schema.py")
finally:
    shutil.rmtree(root)

if FAILS:
    sys.exit(1)
print("test-workdir-sibling: all 3 checks pass")

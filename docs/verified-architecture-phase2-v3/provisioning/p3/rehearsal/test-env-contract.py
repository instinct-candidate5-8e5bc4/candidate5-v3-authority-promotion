#!/usr/bin/env python3
# peer run-36017957182 ruling (c): committed test for gate 6o E_ENV_CONTRACT_UNWIRED.
# Executes the EXACT gate block extracted from preflight-check.py (bounded by the 6o/7
# section markers - the same extraction discipline as test-inrun-writes/stale-path) against
# synthetic layouts - never a reimplementation:
#   1. read + export in a committed .sh        -> passes
#   2. read with NO committed producer         -> E_ENV_CONTRACT_UNWIRED (file:line named)
#   3. read + env key in a workflow .yml       -> passes
#   4. reads in the two excluded files          -> ignored
import sys, os, tempfile, shutil

sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
PF = open(os.path.join(HERE, "preflight-check.py")).read()
i = PF.index("# 6o) peer run-36017957182 ruling (c)")
j = PF.index("# 7) KVM requirement", i)
BLOCK = PF[i:j]


class GateFail(Exception):
    def __init__(self, code, msg):
        self.code = code
        self.msg = msg


def run_gate(layout):
    """layout: dict of {('here'|'p3'|'wf', filename): text}. Returns (code, msg) or None."""
    root = tempfile.mkdtemp(prefix="c5-envtest-")
    dirs = {}
    for tag, sub in (("here", "rehearsal"), ("p3", "p3"), ("wf", "wf")):
        d = os.path.join(root, sub)
        os.makedirs(d)
        dirs[tag] = d
    for (tag, fn), text in layout.items():
        open(os.path.join(dirs[tag], fn), "w").write(text)
    g = {"os": os, "here": dirs["here"], "p3_root": dirs["p3"], "wf_dir": dirs["wf"],
         "fail": lambda c, m: (_ for _ in ()).throw(GateFail(c, m))}
    try:
        exec(BLOCK, g)
        return None
    except GateFail as e:
        return (e.code, e.msg)
    finally:
        shutil.rmtree(root)


FAILS = 0


def check(name, layout, expect_code):
    global FAILS
    r = run_gate(layout)
    if expect_code is None:
        ok = r is None
    else:
        ok = r is not None and r[0] == expect_code
    print(("PASS" if ok else "FAIL") + " " + name + ("" if ok else " got=%r" % (r,)))
    if not ok:
        FAILS += 1


READ = 'import os\nX = os.environ.get("C5_PLANTED_VAR", "")\n'
check("read + export in .sh passes",
      {("here", "consumer.py"): READ, ("here", "producer.sh"): "export C5_PLANTED_VAR=1\n"},
      None)
check("read without producer fires",
      {("here", "consumer.py"): READ},
      "E_ENV_CONTRACT_UNWIRED")
check("read + plain assignment in p3 .sh passes",
      {("here", "consumer.py"): READ, ("p3", "other.sh"): "C5_PLANTED_VAR=$(sha256sum x)\n"},
      None)
check("read + workflow env key passes",
      {("here", "consumer.py"): READ, ("wf", "W.yml"): "    env:\n      C5_PLANTED_VAR: abc\n"},
      None)
check("read + workflow shell export passes",
      {("here", "consumer.py"): READ, ("wf", "W.yml"): "          export C5_PLANTED_VAR=abc\n"},
      None)
check("subscript read without producer fires",
      {("here", "consumer.py"): 'import os\nX = os.environ["C5_PLANTED_VAR"]\n'},
      "E_ENV_CONTRACT_UNWIRED")
check("subscript WRITE is not a read",
      {("here", "consumer.py"): 'import os\nos.environ["C5_PLANTED_VAR"] = "x"\n'},
      None)
check("excluded files ignored",
      {("here", "preflight-check.py"): READ, ("here", "test-env-contract.py"): READ},
      None)

if FAILS:
    sys.exit(1)
print("test-env-contract: all 8 checks pass")

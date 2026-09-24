#!/usr/bin/env python3
# peer run-36031372949 ruling (11): committed planted negatives for the in-run
# marker-at-rest assertion. Executes the EXACT _marker_scan block extracted from
# rehearsal-harness.py - never a reimplementation:
#   1. clean inputs (esp, vars_template, firmware, two disks) -> passes
#   2. MARKER_KERNEL_EXEC at rest in the ESP      -> E_MARKER_AT_REST naming esp
#   3. MARKER_EXIT_98 at rest in disk1            -> E_MARKER_AT_REST naming disk1
#   4. MARKER_EXIT_97 at rest in the vars template -> E_MARKER_AT_REST naming vars_template
#   5. MARKER_KERNEL_EXEC straddling the 8MiB chunk boundary in the firmware -> still dies
import os, shutil, sys, tempfile

sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
HSRC = open(os.path.join(HERE, "rehearsal-harness.py")).read()
i = HSRC.index("# peer run-36031372949 ruling (11)")
j = HSRC.index("# end peer run-36031372949 ruling (11)", i)
BLOCK = HSRC[i:j]

MARKER_KERNEL_EXEC = b"Kernel panic - not syncing: Attempted to kill init!"
MARKER_EXIT_98 = b"Attempted to kill init! exitcode=0x00006200"
MARKER_EXIT_97 = b"Attempted to kill init! exitcode=0x00006100"


class GateFail(Exception):
    def __init__(self, code, msg):
        self.code = code
        self.msg = msg


G = {"MARKER_KERNEL_EXEC": MARKER_KERNEL_EXEC, "MARKER_EXIT_98": MARKER_EXIT_98,
     "MARKER_EXIT_97": MARKER_EXIT_97,
     "fail": lambda c, m: (_ for _ in ()).throw(GateFail(c, m))}
exec(BLOCK, G)
scan = G["_marker_scan"]

FAILS = 0
tmp = tempfile.mkdtemp(prefix="c5-mktest-")
KINDS = ("esp", "vars_template", "firmware", "disk0", "disk1")


def build(inputs, sizes=None):
    paths = {}
    for k in KINDS:
        p = os.path.join(tmp, k + ".bin")
        body = (sizes or {}).get(k, b"\x00" * 4096)
        if k in inputs:
            pad, marker = inputs[k]
            body = pad + marker + b"\x00" * 128
        open(p, "wb").write(body)
        paths[k] = p
    return [(k, paths[k]) for k in KINDS]


def check(name, inputs, expect_code, expect_in=None, sizes=None):
    global FAILS
    try:
        scan(build(inputs, sizes), "CASE-TEST")
        r = None
    except GateFail as e:
        r = (e.code, e.msg)
    if expect_code is None:
        ok = r is None
    else:
        ok = r is not None and r[0] == expect_code and (expect_in is None or expect_in in r[1])
    print(("PASS" if ok else "FAIL") + " " + name + ("" if ok else " got=%r" % (r,)))
    if not ok:
        FAILS += 1


try:
    check("clean inputs pass", {}, None)
    check("marker in the ESP fires", {"esp": (b"\x00" * 64, MARKER_KERNEL_EXEC)}, "E_MARKER_AT_REST", "esp")
    check("marker in disk1 fires", {"disk1": (b"\x00" * 64, MARKER_EXIT_98)}, "E_MARKER_AT_REST", "disk1")
    check("marker in the vars template fires", {"vars_template": (b"\x00" * 64, MARKER_EXIT_97)}, "E_MARKER_AT_REST", "vars_template")
    # marker straddling the 8MiB read boundary: pad so the marker starts 10 bytes before it
    pad = b"\x00" * ((1 << 23) - 10)
    check("marker straddling the chunk boundary fires", {"firmware": (pad, MARKER_KERNEL_EXEC)}, "E_MARKER_AT_REST", "firmware")
finally:
    shutil.rmtree(tmp, ignore_errors=True)

if FAILS:
    sys.exit(1)
print("test-marker-absence: all 5 checks pass")

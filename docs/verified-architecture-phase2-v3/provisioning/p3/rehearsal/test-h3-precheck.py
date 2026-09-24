#!/usr/bin/env python3
# peer run-36031372949 ruling (2)+(4): committed planted negatives for the H3 step's
# post-run read taxonomy. Executes the EXACT check segment extracted from
# derive-scratch.py's BLOCK_BOOT_TARGET_NEG (from the '[ -d "$T/cases" ]' line through the
# H3_BOOT_TARGET_MUST_SHOW_OK echo) under bash against synthetic $T trees - never a
# reimplementation:
#   1. well-formed tree (argv.txt, Booting line, gate death in h3.log) -> passes
#   2. cases dir missing            -> E_H3_QEMU_NOT_STARTED
#   3. argv.txt missing             -> E_H3_QEMU_NOT_STARTED
#   4. debug log chmod 000          -> E_H3_DEBUG_LOG_UNREADABLE (NEVER E_H3_QEMU_NOT_STARTED)
#   5. readable log, no Booting line -> E_H3_NO_BOOT_LINE
#   6. empty readable log           -> E_H3_NO_BOOT_LINE
#   7. debug log absent             -> E_H3_NO_BOOT_LINE
#   8. debug log path is a directory (grep rc 2) -> E_H3_DEBUG_LOG_UNREADABLE
import os, shutil, subprocess, sys, tempfile

sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
DS = open(os.path.join(HERE, "derive-scratch.py")).read()
anchor = DS.index("T=/tmp/$PREFIX-pf/h3boot")
start = DS.index('          [ -d "$T/cases" ] || { echo "E_H3_QEMU_NOT_STARTED case dir', anchor)
endmark = 'H3_BOOT_TARGET_MUST_SHOW_OK'
end = DS.index("\n", DS.index(endmark, start)) + 1
BLOCK = DS[start:end]
# dedent the common leading indent
lines = [l for l in BLOCK.splitlines()]
ind = min(len(l) - len(l.lstrip()) for l in lines if l.strip())
BLOCK = "\n".join(l[ind:] for l in lines) + "\n"

FAILS = 0


def run_block(tdir, rc90=True):
    script = "set -euo pipefail\nT=%s\n_rc=%s\n%s" % (tdir, "90" if rc90 else "0", BLOCK)
    r = subprocess.run(["bash", "-c", script], capture_output=True, text=True)
    return r.returncode, r.stdout + r.stderr


def mktree(argv=True, log="boot", log_mode=None, log_dir=False, cases=True):
    t = tempfile.mkdtemp(prefix="c5-h3test-")
    open(os.path.join(t, "h3.log"), "w").write("some output\nE_CASE_BOOT_TARGET proven\n")
    if cases:
        c = os.path.join(t, "cases", "case1")
        os.makedirs(c)
        if argv:
            open(os.path.join(c, "argv.txt"), "w").write("qemu\0-machine")
        lp = os.path.join(c, "ovmf-debug.log")
        if log_dir:
            os.makedirs(lp)
        elif log is not None:
            body = "" if log == "empty" else ("noise\n[Bds]Booting Linux\n" if log == "boot" else "noise only\n")
            open(lp, "w").write(body)
            if log_mode is not None:
                os.chmod(lp, log_mode)
    return t


def check(name, tdir, expect_rc, expect_in=None, forbid=None, cleanup_mode=None):
    global FAILS
    rc, out = run_block(tdir)
    ok = rc == expect_rc and (expect_in is None or expect_in in out) and (forbid is None or forbid not in out)
    print(("PASS" if ok else "FAIL") + " " + name + ("" if ok else " rc=%d out=%r" % (rc, out[:300])))
    if not ok:
        FAILS += 1
    if cleanup_mode is not None:
        for root, dirs, files in os.walk(tdir):
            for f in files:
                os.chmod(os.path.join(root, f), cleanup_mode)
    shutil.rmtree(tdir, ignore_errors=True)


check("well-formed tree passes", mktree(), 0, "H3_BOOT_TARGET_MUST_SHOW_OK")
check("cases dir missing", mktree(cases=False), 97, "E_H3_QEMU_NOT_STARTED")
check("argv.txt missing", mktree(argv=False), 97, "E_H3_QEMU_NOT_STARTED")
check("unreadable debug log", mktree(log_mode=0), 97, "E_H3_DEBUG_LOG_UNREADABLE", forbid="E_H3_QEMU_NOT_STARTED", cleanup_mode=0o600)
check("readable log without Booting line", mktree(log="noboot"), 97, "E_H3_NO_BOOT_LINE")
check("empty readable log", mktree(log="empty"), 97, "E_H3_NO_BOOT_LINE")
check("debug log absent", mktree(log=None), 97, "E_H3_NO_BOOT_LINE")
check("debug log is a directory (grep rc 2)", mktree(log_dir=True), 97, "E_H3_DEBUG_LOG_UNREADABLE", forbid="E_H3_QEMU_NOT_STARTED")

if FAILS:
    sys.exit(1)
print("test-h3-precheck: all 8 checks pass")

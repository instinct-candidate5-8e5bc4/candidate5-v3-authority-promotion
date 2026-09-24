#!/usr/bin/env python3
# peer run-36031372949 ruling (2)+(4) + run-36037280674 ruling (15): committed planted
# negatives for the H3 step's death-code assertion + post-run read taxonomy. Executes the
# EXACT check segment extracted from derive-scratch.py's BLOCK_BOOT_TARGET_NEG (from the
# '_codes=$(grep -o' death-code line through the H3_BOOT_TARGET_MUST_SHOW_OK echo) under
# bash against synthetic $T trees - never a reimplementation:
#   1. well-formed tree (E_CASE_BOOT_TARGET in h3.log, argv.txt, Booting line) -> passes
#   2. h3.log carries E_CASE_ARGV_FROZEN_MISMATCH  -> E_H3_WRONG_DEATH naming it,
#      BEFORE the debug-log checks (log chmod 000 must NOT surface first)
#   3. h3.log carries another death (E_QEMU_START) -> E_H3_WRONG_DEATH naming it
#   4. h3.log carries E_CASE_BOOT_TARGET_UNPROVEN  -> E_H3_WRONG_DEATH (exact token)
#   5. cases dir missing            -> E_H3_QEMU_NOT_STARTED
#   6. argv.txt missing             -> E_H3_QEMU_NOT_STARTED
#   7. debug log absent             -> E_H3_QEMU_NOT_STARTED (ruling 15: never NO_BOOT_LINE)
#   8. debug log chmod 000          -> E_H3_DEBUG_LOG_UNREADABLE (NEVER E_H3_QEMU_NOT_STARTED)
#   9. readable log, no Booting line -> E_H3_NO_BOOT_LINE
#  10. empty readable log           -> E_H3_NO_BOOT_LINE
#  11. debug log path is a directory (grep rc 2) -> E_H3_DEBUG_LOG_UNREADABLE
import os, shutil, subprocess, sys, tempfile

sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
DS = open(os.path.join(HERE, "derive-scratch.py")).read()
anchor = DS.index("T=/tmp/$PREFIX-pf/h3boot")
start = DS.index("          _codes=$(grep -o", anchor)
endmark = 'H3_BOOT_TARGET_MUST_SHOW_OK'
end = DS.index("\n", DS.index(endmark, start)) + 1
BLOCK = DS[start:end]
# dedent the common leading indent
lines = [l for l in BLOCK.splitlines()]
ind = min(len(l) - len(l.lstrip()) for l in lines if l.strip())
BLOCK = "\n".join(l[ind:] for l in lines) + "\n"

FAILS = 0


def run_block(tdir):
    script = "set -euo pipefail\nT=%s\n_rc=90\n%s" % (tdir, BLOCK)
    r = subprocess.run(["bash", "-c", script], capture_output=True, text=True)
    return r.returncode, r.stdout + r.stderr


def mktree(argv=True, log="boot", log_mode=None, log_dir=False, cases=True,
           death="E_CASE_BOOT_TARGET proven"):
    t = tempfile.mkdtemp(prefix="c5-h3test-")
    if death is not None:
        open(os.path.join(t, "h3.log"), "w").write("some output\n%s\n" % death)
    else:
        open(os.path.join(t, "h3.log"), "w").write("some output, no code\n")
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
check("freeze-gate death dies E_H3_WRONG_DEATH before log checks",
      mktree(log_mode=0, death="E_CASE_ARGV_FROZEN_MISMATCH x != y"), 97,
      "E_H3_WRONG_DEATH E_CASE_ARGV_FROZEN_MISMATCH", forbid="E_H3_DEBUG_LOG_UNREADABLE", cleanup_mode=0o600)
check("other harness death dies E_H3_WRONG_DEATH naming it",
      mktree(death="E_QEMU_START kvm busy"), 97, "E_H3_WRONG_DEATH E_QEMU_START")
check("UNPROVEN variant dies E_H3_WRONG_DEATH (exact-token)",
      mktree(death="E_CASE_BOOT_TARGET_UNPROVEN markers absent"), 97, "E_H3_WRONG_DEATH E_CASE_BOOT_TARGET_UNPROVEN")
check("no code at all dies E_H3_WRONG_DEATH", mktree(death=None), 97, "E_H3_WRONG_DEATH")
check("cases dir missing", mktree(cases=False), 97, "E_H3_QEMU_NOT_STARTED")
check("argv.txt missing", mktree(argv=False), 97, "E_H3_QEMU_NOT_STARTED")
check("debug log absent is QEMU_NOT_STARTED (never NO_BOOT_LINE)",
      mktree(log=None), 97, "E_H3_QEMU_NOT_STARTED", forbid="E_H3_NO_BOOT_LINE")
check("unreadable debug log", mktree(log_mode=0), 97, "E_H3_DEBUG_LOG_UNREADABLE", forbid="E_H3_QEMU_NOT_STARTED", cleanup_mode=0o600)
check("readable log without Booting line", mktree(log="noboot"), 97, "E_H3_NO_BOOT_LINE")
check("empty readable log", mktree(log="empty"), 97, "E_H3_NO_BOOT_LINE")
check("debug log is a directory (grep rc 2)", mktree(log_dir=True), 97, "E_H3_DEBUG_LOG_UNREADABLE", forbid="E_H3_QEMU_NOT_STARTED")

if FAILS:
    sys.exit(1)
print("test-h3-precheck: all 12 checks pass")

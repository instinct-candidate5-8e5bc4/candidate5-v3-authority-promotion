#!/usr/bin/env python3
# peer run-36031372949 ruling (2)+(4) + run-36037280674 ruling (15) + run-36042868066
# ruling (20)+(21): committed planted negatives for the H3 step's death-code assertion +
# post-run read taxonomy, plus the EXECUTED extraction of the WHOLE planted-freeze block
# (precondition, generation, all assertions, the pin sed) against the committed files in
# BOTH lanes - never a reimplementation:
#   part 1 (death-code segment, ruling 21 - fail() records are parsed as JSON and the
#     observed code set must be EXACTLY {E_CASE_BOOT_TARGET}):
#   1. well-formed tree (BOOT_TARGET in h3.log, argv.txt, Booting line) -> passes
#   2. BOOT_TARGET + a second code (freeze-gate) -> E_H3_WRONG_DEATH naming BOTH, BEFORE
#      the debug-log checks (debug log chmod 000 must NOT surface first)
#   3. freeze-gate code alone -> E_H3_WRONG_DEATH naming it
#   4. another death (E_QEMU_START) -> E_H3_WRONG_DEATH naming it
#   5. E_CASE_BOOT_TARGET_UNPROVEN -> E_H3_WRONG_DEATH (exact-set, not substring)
#   6. no JSON code at all -> E_H3_WRONG_DEATH naming "none"
#   7. cases dir missing            -> E_H3_QEMU_NOT_STARTED
#   8. argv.txt missing             -> E_H3_QEMU_NOT_STARTED
#   9. debug log absent             -> E_H3_QEMU_NOT_STARTED (ruling 15: never NO_BOOT_LINE)
#  10. debug log chmod 000          -> E_H3_DEBUG_LOG_UNREADABLE (NEVER E_H3_QEMU_NOT_STARTED)
#  11. readable log, no Booting line -> E_H3_NO_BOOT_LINE
#  12. empty readable log           -> E_H3_NO_BOOT_LINE
#  13. debug log path is a directory (grep rc 2) -> E_H3_DEBUG_LOG_UNREADABLE
#   part 2 (the WHOLE planted-freeze block extracted from derive-scratch.py and EXECUTED
#   under bash against the committed argv-freeze.json / rehearsal-harness.py /
#   lane_resolve.py in BOTH lanes, ruling 20):
#  P1/P2. both lanes: block exits 0; planted freeze parses, exactly 1 case, argv carries
#      zero bootindex flags, the literal occurs NOWHERE in the file (note included), the
#      entry sha is self-consistent, qmp_sock == argv -qmp element, and the harness
#      copy's ARGV_FREEZE_SHA256 pin == the planted file's sha256
#  P3/P4. both lanes: the freeze-gate comparison passes for the H3 argv (real build_argv
#      on the lane-resolved config, $T work_root, bootindex removed as the workflow seds
#      the copy, canonize_element) == the planted entry's argv_sha256
#  P5. negative (a): note text carrying the injected literal with a clean argv still
#      PASSES (the count assertions are JSON-scoped; prose cannot intersect them)
#  P6. negative (b): sabotaged bootindex removal -> E_H3_NEG_INJECTION, rc 97
import hashlib, json, os, re, shutil, subprocess, sys, tempfile

sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
from lane_resolve import canonize_element, resolve_config_value, resolve_path

DS = open(os.path.join(HERE, "derive-scratch.py")).read()
anchor = DS.index("T=/tmp/$PREFIX-pf/h3boot")
start = DS.index("          _codes=$(python3 -", anchor)
endmark = "H3_BOOT_TARGET_MUST_SHOW_OK"
end = DS.index("\n", DS.index(endmark, start)) + 1
BLOCK = DS[start:end]
lines = BLOCK.splitlines()
ind = min(len(l) - len(l.lstrip()) for l in lines if l.strip())
BLOCK = "\n".join(l[ind:] for l in lines) + "\n"

pstart = DS.index("          # peer run-36037280674 ruling (14) + run-36042868066 ruling (20): the freeze gate")
pendmark = 'E_H3_NEG_INJECTION freeze pin planting failed"; exit 97; }'
pend = DS.index("\n", DS.index(pendmark, pstart)) + 1
PLANT = DS[pstart:pend]
plines = PLANT.splitlines()
pind = min(len(l) - len(l.lstrip()) for l in plines if l.strip())
PLANT = "\n".join(l[pind:] for l in plines) + "\n"

vstart = DS.index("          # peer run-36048129342 ruling (v): the H3 must-show proof")
vendmark = "H3 evidence set: 5 files under"
vend = DS.index("\n", DS.index(vendmark, vstart)) + 1
VEV = DS[vstart:vend]
vlines = VEV.splitlines()
vind = min(len(l) - len(l.lstrip()) for l in vlines if l.strip())
VEV = "\n".join(l[vind:] for l in vlines) + "\n"

CANON = "NON_CERTIFYING_REHEARSAL"
SCRATCH = "NON_CERTIFYING_SCRATCH"
CFG = json.load(open(os.path.join(HERE, "config.json")))
HSRC = open(os.path.join(HERE, "rehearsal-harness.py")).read()
i = HSRC.index("def build_argv")
g = {}
exec(HSRC[i:HSRC.index("\ndef ", i)], g)
build_argv = g["build_argv"]

FAILS = 0
CHECKS = 0


def report(name, ok, got=None):
    global FAILS, CHECKS
    CHECKS += 1
    print(("PASS" if ok else "FAIL") + " " + name + ("" if ok else " got=%r" % (got,)))
    if not ok:
        FAILS += 1


def run_block(tdir):
    script = "set -euo pipefail\nT=%s\n_rc=90\n%s" % (tdir, BLOCK)
    r = subprocess.run(["bash", "-c", script], capture_output=True, text=True)
    return r.returncode, r.stdout + r.stderr


JBOOT = '{"result":"FAIL","code":"E_CASE_BOOT_TARGET","detail":"planted"}'


def mktree(argv=True, log="boot", log_mode=None, log_dir=False, cases=True, death=JBOOT):
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
    rc, out = run_block(tdir)
    ok = rc == expect_rc and (expect_in is None or expect_in in out) and (forbid is None or forbid not in out)
    report(name, ok, None if ok else (rc, out[:300]))
    if cleanup_mode is not None:
        for root, dirs, files in os.walk(tdir):
            for f in files:
                os.chmod(os.path.join(root, f), cleanup_mode)
    shutil.rmtree(tdir, ignore_errors=True)


check("well-formed tree passes", mktree(), 0, "H3_BOOT_TARGET_MUST_SHOW_OK")
check("BOOT_TARGET plus a second code dies E_H3_WRONG_DEATH naming both, before log checks",
      mktree(log_mode=0, death=JBOOT + '\n{"result":"FAIL","code":"E_CASE_ARGV_FROZEN_MISMATCH","detail":"x != y"}'),
      97, "E_H3_WRONG_DEATH E_CASE_ARGV_FROZEN_MISMATCH E_CASE_BOOT_TARGET",
      forbid="E_H3_DEBUG_LOG_UNREADABLE", cleanup_mode=0o600)
check("freeze-gate death alone dies E_H3_WRONG_DEATH naming it",
      mktree(death='{"result":"FAIL","code":"E_CASE_ARGV_FROZEN_MISMATCH","detail":"x != y"}'),
      97, "E_H3_WRONG_DEATH E_CASE_ARGV_FROZEN_MISMATCH")
check("other harness death dies E_H3_WRONG_DEATH naming it",
      mktree(death='{"result":"FAIL","code":"E_QEMU_START","detail":"kvm busy"}'),
      97, "E_H3_WRONG_DEATH E_QEMU_START")
check("UNPROVEN variant dies E_H3_WRONG_DEATH (exact-set)",
      mktree(death='{"result":"FAIL","code":"E_CASE_BOOT_TARGET_UNPROVEN","detail":"markers absent"}'),
      97, "E_H3_WRONG_DEATH E_CASE_BOOT_TARGET_UNPROVEN")
check("no JSON code at all dies E_H3_WRONG_DEATH naming none", mktree(death=None), 97, "E_H3_WRONG_DEATH none")
check("cases dir missing", mktree(cases=False), 97, "E_H3_QEMU_NOT_STARTED")
check("argv.txt missing", mktree(argv=False), 97, "E_H3_QEMU_NOT_STARTED")
check("debug log absent is QEMU_NOT_STARTED (never NO_BOOT_LINE)",
      mktree(log=None), 97, "E_H3_QEMU_NOT_STARTED", forbid="E_H3_NO_BOOT_LINE")
check("unreadable debug log", mktree(log_mode=0), 97, "E_H3_DEBUG_LOG_UNREADABLE", forbid="E_H3_QEMU_NOT_STARTED", cleanup_mode=0o600)
check("readable log without Booting line", mktree(log="noboot"), 97, "E_H3_NO_BOOT_LINE")
check("empty readable log", mktree(log="empty"), 97, "E_H3_NO_BOOT_LINE")
check("debug log is a directory (grep rc 2)", mktree(log_dir=True), 97, "E_H3_DEBUG_LOG_UNREADABLE", forbid="E_H3_QEMU_NOT_STARTED")


# --- part 2: the WHOLE planted-freeze block, executed in both lanes ---
def run_planting(prefix, edit=None):
    T = "/tmp/%s-pf/h3boot" % prefix
    shutil.rmtree(T, ignore_errors=True)
    os.makedirs(T)
    for f in ("argv-freeze.json", "rehearsal-harness.py", "lane_resolve.py"):
        shutil.copy(os.path.join(HERE, f), os.path.join(T, f))
    block = PLANT if edit is None else edit(PLANT)
    script = "set -euo pipefail\nT=%s\nPREFIX=%s\nALLOWED_PREFIX=%s\n%s" % (T, prefix, prefix, block)
    r = subprocess.run(["bash", "-c", script], capture_output=True, text=True)
    return T, r.returncode, r.stdout + r.stderr


def cleanup_T(T):
    shutil.rmtree(T, ignore_errors=True)
    try:
        os.rmdir(os.path.dirname(T))
    except OSError:
        pass


def planting_ok(prefix):
    T, rc, out = run_planting(prefix)
    ok, detail = rc == 0, (rc, out[:200])
    if ok:
        raw = open(os.path.join(T, "argv-freeze.json"), "rb").read()
        fz = json.loads(raw.decode())
        hcopy = open(os.path.join(T, "rehearsal-harness.py")).read()
        pins = re.findall(r'ARGV_FREEZE_SHA256="([0-9a-f]{64})"', hcopy)
        file_sha = hashlib.sha256(raw).hexdigest()
        ok = (len(fz["cases"]) == 1 and pins == [file_sha] and b",bootindex=0" not in raw)
        detail = (len(fz["cases"]), pins, file_sha)
        if ok:
            e = fz["cases"][0]
            ok = (sum(el.count(",bootindex=0") for el in e["argv"]) == 0
                  and e["argv_sha256"] == hashlib.sha256("\0".join(e["argv"]).encode()).hexdigest()
                  and e["argv"][e["argv"].index("-qmp") + 1] == "unix:%s,server,nowait" % e["qmp_sock"])
            detail = e["argv_sha256"]
    cleanup_T(T)
    return ok, detail


ok, detail = planting_ok(CANON)
report("P1 rehearsal-lane planting block executes clean (1 case, argv clean, zero literal, pin == file sha, qmp consistent)",
       ok, detail)
ok, detail = planting_ok(SCRATCH)
report("P2 scratch-lane planting block executes clean (same assertions)", ok, detail)


def h3_executed_entry_sha(prefix):
    cfgL = resolve_config_value(json.loads(json.dumps(CFG)), prefix)
    case = cfgL["cases"][0]
    T = "/tmp/%s-pf/h3boot" % prefix
    cd = os.path.join(T, "cases", case["id"])
    sock = resolve_path("/tmp/%s-q0.sock" % CANON, prefix)
    argv = build_argv(cfgL, cd, os.path.join(cd, "vars.fd"), case["esp"], case["firmware"], sock)
    argv = [el.replace(",bootindex=0", "") for el in argv]
    return hashlib.sha256("\0".join(canonize_element(t, prefix) for t in argv).encode()).hexdigest()


def gate_ok(prefix):
    T, rc, out = run_planting(prefix)
    if rc != 0:
        cleanup_T(T)
        return False, (rc, out[:200])
    fz = json.load(open(os.path.join(T, "argv-freeze.json")))
    entry_sha = fz["cases"][0]["argv_sha256"]
    ex = h3_executed_entry_sha(prefix)
    cleanup_T(T)
    return entry_sha == ex, (entry_sha, ex)


ok, detail = gate_ok(CANON)
report("P3 freeze-gate comparison passes for the H3 argv (rehearsal lane)", ok, detail)
ok, detail = gate_ok(SCRATCH)
report("P4 freeze-gate comparison passes for the H3 argv (scratch lane)", ok, detail)


def edit_note(block):
    out = block.replace("minus exactly one ESP bootindex flag", "minus exactly one ',bootindex=0' flag", 1)
    assert out != block, "note edit anchor missing"
    return out


T, rc, out = run_planting(CANON, edit=edit_note)
if rc == 0:
    raw = open(os.path.join(T, "argv-freeze.json"), "rb").read()
    fz = json.loads(raw.decode())
    note_ok = (b",bootindex=0" in raw
               and sum(el.count(",bootindex=0") for el in fz["cases"][0]["argv"]) == 0)
else:
    note_ok = False
cleanup_T(T)
report("P5 negative (a): note carrying the injected literal with clean argv still PASSES (JSON-scoped count)",
       rc == 0 and note_ok, (rc, out[:200]))


def edit_sabotage(block):
    out = block.replace('argv = [el.replace(",bootindex=0", "") for el in argv]', "argv = list(argv)", 1)
    assert out != block, "sabotage edit anchor missing"
    return out


T, rc, out = run_planting(CANON, edit=edit_sabotage)
cleanup_T(T)
report("P6 negative (b): sabotaged bootindex removal dies E_H3_NEG_INJECTION",
       rc == 97 and "E_H3_NEG_INJECTION" in out, (rc, out[:200]))

# --- (v) evidence block, executed against a synthetic but byte-real H3 tree ---
def h3_case_setup(prefix):
    T, rc, out = run_planting(prefix)
    assert rc == 0, (rc, out[:200])
    cfgL = resolve_config_value(json.loads(json.dumps(CFG)), prefix)
    case = cfgL["cases"][0]
    cdir = os.path.join(T, "cases", case["id"])
    os.makedirs(cdir)
    sock = resolve_path("/tmp/%s-q0.sock" % CANON, prefix)
    argv = build_argv(cfgL, cdir, os.path.join(cdir, "vars.fd"), case["esp"], case["firmware"], sock)
    argv = [el.replace(",bootindex=0", "") for el in argv]
    open(os.path.join(cdir, "argv.txt"), "w").write("\0".join(argv))
    open(os.path.join(cdir, "ovmf-debug.log"), "w").write("noise\n[Bds]Booting Linux\n")
    open(os.path.join(T, "h3.log"), "w").write("some output\n" + JBOOT + "\n[Bds]Booting Linux\n")
    return T, cdir


def run_vev(prefix, sabotage=False):
    T, cdir = h3_case_setup(prefix)
    if sabotage:
        open(os.path.join(cdir, "argv.txt"), "a").write("tamper")
    outdir = "/tmp/%s-out" % prefix
    os.makedirs(outdir, exist_ok=True)
    script = "set -euo pipefail\nT=%s\n_cdir=%s\n%s" % (T, cdir, VEV)
    r = subprocess.run(["bash", "-c", script], capture_output=True, text=True,
                       env=dict(os.environ, PREFIX=prefix, ALLOWED_PREFIX=prefix))
    ev = os.path.join(outdir, "%s-h3-evidence" % prefix)
    names = sorted(os.listdir(ev)) if os.path.isdir(ev) else []
    rec = None
    if "h3-must-show-record.json" in names:
        rec = json.load(open(os.path.join(ev, "h3-must-show-record.json")))
    shutil.rmtree(ev, ignore_errors=True)
    try:
        os.rmdir(outdir)
    except OSError:
        pass
    cleanup_T(T)
    return r.returncode, r.stdout + r.stderr, names, rec


rc, out, names, rec = run_vev(CANON)
want = ["case-argv.txt", "case-ovmf-debug.log", "h3-log".replace("-", "."), "h3-must-show-record.json", "planted-argv-freeze.json"]
want = sorted(["case-argv.txt", "case-ovmf-debug.log", "h3.log", "h3-must-show-record.json", "planted-argv-freeze.json"])
report("P7 (v) evidence block executes clean: 5 named files, record reproves canonicalized == planted entry",
       rc == 0 and names == want and rec is not None
       and rec["canonicalized_executed_sha256"] == rec["planted_entry_argv_sha256"]
       and rec["death_codes"] == ["E_CASE_BOOT_TARGET"] and rec["rc"] == 90
       and rec["boot_line"].startswith("[Bds]Booting "),
       (rc, names, out[:200]))
rc, out, names, rec = run_vev(CANON, sabotage=True)
report("P8 (v) sabotaged case argv dies E_H3_EVIDENCE_RECORD",
       rc == 97 and "E_H3_EVIDENCE_RECORD" in out, (rc, out[:200]))

if FAILS:
    sys.exit(1)
print("test-h3-precheck: all %d checks pass" % CHECKS)

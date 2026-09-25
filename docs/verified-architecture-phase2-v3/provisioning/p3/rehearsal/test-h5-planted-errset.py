#!/usr/bin/env python3
# Committed local proof for the peer run-36004747396 D2/H5 ruling: with the planted
# zz_bytecode_probe.py ("from lane_resolve import resolve_config_value"), the REAL
# preflight must attribute EXACTLY two errors to the probe: E_BYTECODE_GUARD and
# E_PYTHON_IMPORTS with module set exactly {lane_resolve}. Any other code, extra
# entry, or non-probe attribution fails. Baseline-delta method: the same temp tree
# runs WITHOUT and WITH the probe, so environment-only codes (which differ per
# machine) cancel; in CI the baseline is empty and the delta IS the planted set.
import json, os, shutil, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
P3 = os.path.dirname(HERE)
REPO = os.path.normpath(os.path.join(HERE, "..", "..", "..", "..", ".."))
PROBE = "from lane_resolve import resolve_config_value\n"

def run_preflight(reh, stage, prefix="NON_CERTIFYING_REHEARSAL"):
    env = dict(os.environ)
    env["PREFIX"] = prefix
    env["ALLOWED_PREFIX"] = prefix
    env["PYTHONDONTWRITEBYTECODE"] = "1"
    env.pop("CERTIFICATION_TARGET", None)  # never a certification context in these runs
    r = subprocess.run([sys.executable, os.path.join(reh, "preflight-check.py"),
                        os.path.join(reh, "config.json"), stage],
                       capture_output=True, text=True, env=env)
    try:
        rep = json.loads(r.stdout)
    except Exception:
        return r.returncode, None, r.stdout + r.stderr
    return r.returncode, rep.get("errors"), r.stdout + r.stderr

results = []
def expect(name, ok, detail=""):
    print("MUST_SHOW_H5_PLANTED_ERRSET %s %s %s" % (name, "OK" if ok else "FAIL", detail))
    results.append(ok)

tmp = tempfile.mkdtemp()
try:
    # preserve the 5-level layout preflight derives (repo_root = here/../../../../..)
    tp3 = os.path.join(tmp, "docs", "verified-architecture-phase2-v3", "provisioning", "p3")
    shutil.copytree(P3, tp3)
    shutil.copytree(os.path.join(REPO, ".github", "workflows"),
                    os.path.join(tmp, ".github", "workflows"))
    treh = os.path.join(tp3, "rehearsal")
    stage = os.path.join(tmp, "stage")

    rc0, errs0, raw0 = run_preflight(treh, stage)
    expect("baseline-parseable", errs0 is not None and rc0 in (0, 30), "rc=%d" % rc0)

    probe = os.path.join(treh, "zz_bytecode_probe.py")
    open(probe, "w").write(PROBE)
    rc1, errs1, raw1 = run_preflight(treh, stage)
    os.unlink(probe)

    ok = errs1 is not None and rc1 == 30
    expect("planted-rc30", ok, "rc=%d" % rc1)

    delta = [e for e in (errs1 or []) if e not in (errs0 or [])]
    bg = [e for e in delta if e[0] == "E_BYTECODE_GUARD" and "zz_bytecode_probe.py" in str(e[1])]
    pi = [e for e in delta if e[0] == "E_PYTHON_IMPORTS" and "zz_bytecode_probe.py" in str(e[1])]
    pim = str(pi[0][1]) if pi else ""
    exact = (len(delta) == 2 and len(bg) == 1 and len(pi) == 1
             and "," not in pim and pim.split()[-1:] == ["lane_resolve"])
    expect("planted-exact-pair", exact,
           "delta=%r" % (delta,))

    # peer run-36081199933 ruling (item 3): the E_SIGNED_CASE_LANES guard must fire in
    # the SCRATCH lane (no CERTIFICATION_TARGET). Planted negative: P1 lanes reduced to
    # ["certification"] in the temp tree's config; the REAL preflight run with
    # PREFIX=NON_CERTIFYING_SCRATCH must attribute EXACTLY one new error to it.
    cfgp = os.path.join(treh, "config.json")
    cfg0 = open(cfgp).read()
    rc_s0, errs_s0, raw_s0 = run_preflight(treh, stage, "NON_CERTIFYING_SCRATCH")
    expect("scratch-baseline-parseable", errs_s0 is not None and rc_s0 in (0, 30), "rc=%d" % rc_s0)
    sl_base = [e for e in (errs_s0 or []) if e[0] == "E_SIGNED_CASE_LANES"]
    expect("scratch-baseline-no-lanes-error", sl_base == [], "sl_base=%r" % (sl_base,))
    cfgm = json.loads(cfg0)
    planted = 0
    for c in cfgm["cases"]:
        if c["id"] == "NON_CERTIFYING_REHEARSAL-P1-signed-slot-positive":
            c["lanes"] = ["certification"]; planted += 1
    expect("planted-p1-lanes-mutation", planted == 1, "planted=%d" % planted)
    open(cfgp, "w").write(json.dumps(cfgm, indent=1) + "\n")
    try:
        rc_s1, errs_s1, raw_s1 = run_preflight(treh, stage, "NON_CERTIFYING_SCRATCH")
        sdelta = [e for e in (errs_s1 or []) if e not in (errs_s0 or [])]
        sl = [e for e in sdelta if e[0] == "E_SIGNED_CASE_LANES"]
        expect("scratch-planted-p1-lanes-fires-exactly-once",
               rc_s1 == 30 and len(sdelta) == 1 and len(sl) == 1
               and "P1-signed-slot-positive" in str(sl[0][1]),
               "rc=%d delta=%r" % (rc_s1, sdelta))
    finally:
        open(cfgp, "w").write(cfg0)
    print("H5_PLANTED_ERRSET_TESTS %d/%d pass" % (sum(results), len(results)))
finally:
    shutil.rmtree(tmp, ignore_errors=True)
sys.exit(0 if all(results) else 1)

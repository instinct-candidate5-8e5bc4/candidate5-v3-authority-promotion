#!/usr/bin/env python3
"""test-c-sign-confinement.py - committed negative tests for the criterion-C c-sign
derivation/confinement gates (peer 2026-09-24 B1 condition 5). The planted negatives
are RUNNABLE: each tampers a /tmp mirror of the committed tree (never the tree
itself), then the REAL gate - the exact 6e8b segment extracted from the committed
preflight-check.py, or the real derive-scratch.py CLI - must die with its ruled
named code. Prints one MUST_SHOW line per test; exits 0 only when every gate
behaves as ruled, else a named E_C_SIGN_NEGTEST_* failure and rc 90.
"""
import os, re, shutil, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT5 = os.path.normpath(os.path.join(HERE, "..", "..", "..", "..", ".."))
WF_REL = os.path.join(".github", "workflows")
REH_YML = "NON_CERTIFYING_REHEARSAL-workflow.yml"
SCR_YML = "NON_CERTIFYING_SCRATCH-workflow.yml"
CERT_YML = "OVMF_CI_SECURE_BOOT_UKI-CERTIFICATION-workflow.yml"

class GateFire(Exception):
    def __init__(self, code, detail=""):
        self.code, self.detail = code, detail

def fail(code, detail=""):
    raise GateFire(code, detail)

def build_mirror(T):
    mir = os.path.join(T, "m")
    rdir = os.path.join(mir, "docs", "a", "b", "c", "rehearsal")  # 5 ups from rdir == mir
    os.makedirs(rdir)
    os.makedirs(os.path.join(mir, WF_REL))
    for f in ("preflight-check.py", "derive-scratch.py"):
        shutil.copy2(os.path.join(HERE, f), os.path.join(rdir, f))
    for f in (REH_YML, SCR_YML, CERT_YML):
        shutil.copy2(os.path.join(ROOT5, WF_REL, f), os.path.join(mir, WF_REL, f))
    return mir, rdir

def seg_6e8b(rdir):
    src = open(os.path.join(rdir, "preflight-check.py")).read()
    return src[src.index("# 6e8b"):src.index("# 6e9)")]

def run_6e8b(rdir):
    try:
        exec(compile(seg_6e8b(rdir), "6e8b", "exec"), {"fail": fail, "os": os, "here": rdir})
        return None
    except GateFire as g:
        return g.code

def run_derive(rdir, src_yml):
    out = os.path.join(os.path.dirname(rdir), "derived.yml")
    p = subprocess.run([sys.executable, os.path.join(rdir, "derive-scratch.py"), src_yml, out],
                       capture_output=True, text=True)
    blob = p.stdout + p.stderr
    m = re.search(r"E_DERIVE_C_SIGN_[A-Z_]+", blob)
    return (p.returncode, m.group(0) if m else None)

RESULTS = []
def show(name, ok, detail=""):
    RESULTS.append((name, ok))
    print("MUST_SHOW_C_SIGN_NEGTEST %s %s %s" % (name, "OK" if ok else "FAILED", detail))

def main():
    T = "/tmp/%s-csign-negtest" % os.environ.get("PREFIX", "NOPREFIX")
    shutil.rmtree(T, ignore_errors=True)
    os.makedirs(T)
    mir, rdir = build_mirror(T)
    wfd = os.path.join(mir, WF_REL)
    reh = os.path.join(wfd, REH_YML)

    # 1) baseline: untampered mirror passes 6e8b
    show("baseline-confinement-pass", run_6e8b(rdir) is None)

    # 2/3) planted osslsigncode OUTSIDE the c-sign step -> E_TOOL_FORBIDDEN (both lanes)
    for wf in (SCR_YML, REH_YML):
        p = os.path.join(wfd, wf)
        orig = open(p).read()
        open(p, "w").write(orig + "# planted osslsigncode outside step\n")
        show("planted-osslsigncode-outside-%s" % wf.split("-")[0].lower(),
             run_6e8b(rdir) == "E_TOOL_FORBIDDEN")
        open(p, "w").write(orig)

    # 4) any osslsigncode in the certification workflow -> E_TOOL_FORBIDDEN
    p = os.path.join(wfd, CERT_YML)
    orig = open(p).read()
    open(p, "w").write(orig + "# planted osslsigncode in certification\n")
    show("planted-osslsigncode-certification", run_6e8b(rdir) == "E_TOOL_FORBIDDEN")
    open(p, "w").write(orig)

    # 5/6) duplicated c-sign step -> E_C_SIGN_STEP_COUNT (both lanes, via preflight)
    for wf, lane in ((SCR_YML, "NON_CERTIFYING_SCRATCH"), (REH_YML, "NON_CERTIFYING_REHEARSAL")):
        p = os.path.join(wfd, wf)
        orig = open(p).read()
        i = orig.index("- name: %s criterion-C throwaway signing" % lane)
        j = orig.index("\n      - name:", i)
        blk = orig[i:j].replace(lane, lane)  # same-lane duplicate
        open(p, "w").write(orig[:j] + "\n" + blk.replace("criterion-C throwaway signing (c-sign, ephemeral in-run key)",
                                                         "criterion-C throwaway signing") + orig[j:])
        show("planted-duplicate-step-%s" % lane.split("_")[-1].lower(),
             run_6e8b(rdir) == "E_C_SIGN_STEP_COUNT")
        open(p, "w").write(orig)

    # 7) rehearsal source minus c-sign -> derive dies E_DERIVE_C_SIGN_MISSING
    orig = open(reh).read()
    i = orig.index("- name: NON_CERTIFYING_REHEARSAL criterion-C throwaway signing")
    j = orig.index("\n      - name:", i)
    tam = os.path.join(T, "reh-nocsign.yml")
    open(tam, "w").write(orig[:i] + orig[j + 1:])
    rc, code = run_derive(rdir, tam)
    show("derive-missing-csign", rc != 0 and code == "E_DERIVE_C_SIGN_MISSING", "rc=%d" % rc)

    # 8) rehearsal source with duplicated c-sign -> derive dies E_DERIVE_C_SIGN_DUPLICATE
    tam2 = os.path.join(T, "reh-dupcsign.yml")
    open(tam2, "w").write(orig[:j] + "\n" + orig[i:j] + orig[j:])
    rc, code = run_derive(rdir, tam2)
    show("derive-duplicate-csign", rc != 0 and code == "E_DERIVE_C_SIGN_DUPLICATE", "rc=%d" % rc)

    # 9) c-sign moved before the ESP dual builds -> derive dies E_DERIVE_C_SIGN_PLACEMENT
    blk = orig[i:j]
    rest = orig[:i] + orig[j + 1:]
    i_esp = rest.index("- name: NON_CERTIFYING_REHEARSAL enrollment app + ESP dual builds")
    tam3 = os.path.join(T, "reh-movedcsign.yml")
    open(tam3, "w").write(rest[:i_esp] + blk + "\n" + rest[i_esp:])
    rc, code = run_derive(rdir, tam3)
    show("derive-misplaced-csign", rc != 0 and code == "E_DERIVE_C_SIGN_PLACEMENT", "rc=%d" % rc)

    shutil.rmtree(T, ignore_errors=True)
    bad = [n for n, ok in RESULTS if not ok]
    if bad:
        print("E_C_SIGN_NEGTEST_FAILED %s" % bad)
        sys.exit(90)
    print("MUST_SHOW_C_SIGN_NEGTEST all %d gates behave as ruled" % len(RESULTS))

if __name__ == "__main__":
    main()

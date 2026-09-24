#!/usr/bin/env python3
# Committed planted negatives for the E_INRUN_STALE_PATH gate (peer C1''''''' verdict (b)).
# Extracts the EXACT 6n block from preflight-check.py and execs it against synthetic
# layouts: any non-comment occurrence of build-output/uki or build-output/c-sign in a
# workflow, .sh, or .py fires by name; the real tree, comment lines, and the excluded
# gate/test files do NOT fire.
import os, sys, tempfile, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
P3_ROOT = os.path.normpath(os.path.join(HERE, ".."))
WF_REAL = os.path.normpath(os.path.join(HERE, "..", "..", "..", "..", "..", ".github", "workflows"))

PF = open(os.path.join(HERE, "preflight-check.py")).read()
i = PF.index("# 6n) peer C1''''''' verdict (b)")
j = PF.index("# 7) KVM requirement", i)
GATE = PF[i:j]

def run_gate(wf_dir, here, p3_root):
    fails = []
    ns = {"os": os, "fail": lambda c, m: fails.append((c, m)),
          "wf_dir": wf_dir, "here": here, "p3_root": p3_root}
    exec(compile(GATE, "preflight-6n", "exec"), ns)
    return fails

results = []
def expect(name, ok, detail=""):
    print("MUST_SHOW_INRUN_STALE_PATH %s %s %s" % (name, "OK" if ok else "FAIL", detail))
    results.append(ok)

# 1) control: the REAL tree produces zero E_INRUN_STALE_PATH
f = run_gate(WF_REAL, HERE, P3_ROOT)
expect("real-tree-clean", not any(c == "E_INRUN_STALE_PATH" for c, _ in f),
       "fires=%r" % ([m for c, m in f if c == "E_INRUN_STALE_PATH"],))

def synth(wf_lines=None, sh_lines=None, py_lines=None, py_name="tool.py", sh_name="tool.sh"):
    top = tempfile.mkdtemp()
    wf = os.path.join(top, "wf"); here = os.path.join(top, "here"); p3 = os.path.join(top, "p3")
    for d in (wf, here, p3):
        os.makedirs(d)
    if wf_lines is not None:
        open(os.path.join(wf, "t-workflow.yml"), "w").write("\n".join(wf_lines) + "\n")
    if sh_lines is not None:
        open(os.path.join(here, sh_name), "w").write("\n".join(sh_lines) + "\n")
    if py_lines is not None:
        open(os.path.join(here, py_name), "w").write("\n".join(py_lines) + "\n")
    return top, wf, here, p3

def case(name, want_fire, **kw):
    top, wf, here, p3 = synth(**kw)
    try:
        f = run_gate(wf, here, p3)
    finally:
        shutil.rmtree(top)
    fired = any(c == "E_INRUN_STALE_PATH" for c, _ in f)
    expect(name, fired == want_fire, "fires=%r" % ([m for c, m in f if c == "E_INRUN_STALE_PATH"],))

# 2) planted read in a workflow -> fires
case("workflow-read", True, wf_lines=["run: |", '  cp "$REH/build-output/c-sign/fixtures/X.cer" /tmp/x'])
# 3) planted reference in a .sh -> fires
case("sh-read", True, sh_lines=['./enroll-prep.sh a b build-output/c-sign/fixtures/X.cer'])
# 4) planted reference in .py EMBEDDED STEP TEXT (derive-scratch shape) -> fires
case("py-embedded-text", True, py_lines=["BLOCK = r'''", '  cp build-output/uki/x.efi /tmp/x', "'''"])
# 5) the uki leg -> fires
case("uki-leg", True, sh_lines=['cp rehearsal/build-output/uki/x.efi /tmp/x'])
# 6) full-comment occurrence -> no fire
case("comment-not-scanned", False, sh_lines=['# products used to live in build-output/c-sign', 'echo ok'])
# 7) occurrence inside an EXCLUDED gate/test file -> no fire
case("excluded-test-file", False, py_lines=['x = "build-output/c-sign/fixtures/X.cer"'], py_name="test-inrun-writes.py")
# 8) clean synthetic files -> no fire
case("clean-synthetic", False, wf_lines=["run: |", '  cp "/tmp/$PREFIX-inrun/c-sign/fixtures/X.cer" /tmp/x'],
     sh_lines=['./enroll-prep.sh a b "$INRUN/c-sign/fixtures/X.cer"'])

print("INRUN_STALE_PATH_NEGTESTS %d/%d pass" % (sum(results), len(results)))
sys.exit(0 if all(results) else 1)

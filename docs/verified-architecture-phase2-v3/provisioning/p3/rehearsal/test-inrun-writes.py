#!/usr/bin/env python3
# Committed planted negatives for the E_INRUN_WRITES_CHECKOUT gate (peer run-36009604654
# ruling (e)). Extracts the EXACT 6m block from preflight-check.py and execs it against
# synthetic rehearsal workflows: pre-ceremony shell writes under build-output/disks/prep
# must each fire; the real workflow, comments, python heredoc bodies, and post-ceremony
# writes must NOT.
import os, sys, tempfile, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
WF_REAL = os.path.normpath(os.path.join(HERE, "..", "..", "..", "..", "..", ".github", "workflows"))

sys.dont_write_bytecode = True  # BEFORE the sibling import (preflight check 6j)
import heredoc_parse as hp

PF = open(os.path.join(HERE, "preflight-check.py")).read()
i = PF.index("# 6m) peer run-36009604654 ruling")
j = PF.index("# 7) KVM requirement", i)
GATE = PF[i:j]

def run_gate(wf_dir):
    fails = []
    ns = {"os": os, "fail": lambda c, m: fails.append((c, m)), "wf_dir": wf_dir, "_hp": hp}
    exec(compile(GATE, "preflight-6m", "exec"), ns)
    return fails

def wf(pre_blocks, ceremony=True, post_blocks=None):
    out = ["jobs:", "  t:", "    steps:"]
    n = 0
    for blk in pre_blocks:
        n += 1
        out.append("      - name: pre%d" % n)
        out.append("        run: |")
        out += ["          " + l for l in blk]
    if ceremony:
        out.append("      - name: ceremony")
        out.append("        run: |")
        out.append("          ./run-ceremony.sh config.json /tmp/s /tmp/o")
    for blk in (post_blocks or []):
        n += 1
        out.append("      - name: post%d" % n)
        out.append("        run: |")
        out += ["          " + l for l in blk]
    return "\n".join(out) + "\n"

def synth(text):
    d = tempfile.mkdtemp()
    open(os.path.join(d, "NON_CERTIFYING_REHEARSAL-workflow.yml"), "w").write(text)
    return d

results = []
def expect(name, ok, detail=""):
    print("MUST_SHOW_INRUN_WRITES %s %s %s" % (name, "OK" if ok else "FAIL", detail))
    results.append(ok)

# 1) control: the REAL workflows produce zero E_INRUN_WRITES_CHECKOUT
f = run_gate(WF_REAL)
expect("real-workflows-clean", not any(c == "E_INRUN_WRITES_CHECKOUT" for c, _ in f),
       "fires=%r" % ([m for c, m in f if c == "E_INRUN_WRITES_CHECKOUT"],))

def case(name, text, want_fire):
    d = synth(text)
    try:
        f = run_gate(d)
    finally:
        shutil.rmtree(d)
    fired = any(c == "E_INRUN_WRITES_CHECKOUT" for c, _ in f)
    expect(name, fired == want_fire, "fires=%r" % ([m for c, m in f if c == "E_INRUN_WRITES_CHECKOUT"],))

# 2-7) pre-ceremony shell writes -> each fires
case("mkdir-build-output", wf([["mkdir -p rehearsal/build-output/x"]]), True)
case("cp-into-build-output", wf([["cp a.efi rehearsal/build-output/uki/"]]), True)
case("redirection-into-build-output", wf([["echo x > rehearsal/build-output/f"]]), True)
case("install-into-build-output", wf([["install -m 0644 a rehearsal/build-output/"]]), True)
case("tee-into-disks", wf([["printf log | tee rehearsal/disks/l.txt"]]), True)
case("nested-shell-heredoc-write", wf([["bash -se <<'OUTER'", "mkdir -p rehearsal/build-output/x", "OUTER"]]), True)
# 8) comment mentioning the path, write to /tmp -> no fire
case("comment-not-a-write", wf([["# products used to land in rehearsal/build-output", "mkdir -p /tmp/$PREFIX-inrun/uki"]]), False)
# 9) write AFTER the ceremony step -> out of scope, no fire
case("post-ceremony-write-not-scoped", wf([["echo pre"]], post_blocks=[["mkdir -p rehearsal/build-output/late"]]), False)
# 10) python heredoc body text mentioning the path -> not a shell write, no fire
case("python-body-not-scanned", wf([["python3 - <<'PYT'", 'open("rehearsal/build-output/f", "w").write("x")', "PYT"]]), False)
# 11) ceremony step missing -> fires
case("ceremony-missing", wf([["echo hi"]], ceremony=False), True)

print("INRUN_WRITES_NEGTESTS %d/%d pass" % (sum(results), len(results)))
sys.exit(0 if all(results) else 1)

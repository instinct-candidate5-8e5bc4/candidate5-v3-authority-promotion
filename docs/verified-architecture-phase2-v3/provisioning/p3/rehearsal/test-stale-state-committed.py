#!/usr/bin/env python3
# Committed planted negatives for the run-35999960747 D3 dual-mode E_STALE_STATE_COMMITTED.
# Static (step-11) mode keeps filesystem absence; mid-ceremony mode checks TRACKED paths
# via git ls-files. Planted negative per ruling: force-added build-output/x gives the code.
import os, re, subprocess, sys, tempfile, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = open(os.path.join(HERE, "preflight-check.py")).read()
i = SRC.index('# 6c) batch1r3 C1: no ceremony state in the committed tree.')
j = SRC.index('# 6d)', i)
BLOCK = SRC[i:j]
BLOCK = "\n".join(l for l in BLOCK.splitlines() if not l.strip().startswith("#") and l.strip())

def run(here, repo_root, mid):
    fails = []
    env = {"PREFLIGHT_MID_CEREMONY": "1"} if mid else {}
    ns = {"os": os, "_sp": subprocess, "here": here, "repo_root": repo_root,
          "fail": lambda c, m: fails.append((c, m))}
    old = os.environ.get("PREFLIGHT_MID_CEREMONY")
    if mid: os.environ["PREFLIGHT_MID_CEREMONY"] = "1"
    else: os.environ.pop("PREFLIGHT_MID_CEREMONY", None)
    try:
        exec(BLOCK, ns)
    finally:
        if old is None: os.environ.pop("PREFLIGHT_MID_CEREMONY", None)
        else: os.environ["PREFLIGHT_MID_CEREMONY"] = old
    return fails

results = []
def expect(name, got, want):
    ok = ([c for c, _ in got] == want)
    print("MUST_SHOW_STALE_STATE %s %s got=%s want=%s" % (name, "OK" if ok else "FAIL", [c for c, _ in got], want))
    results.append(ok)

d = tempfile.mkdtemp()
subprocess.run(["git", "init", "-q", d])
open(os.path.join(d, "a.py"), "w").write("x=1\n")
subprocess.run(["git", "-C", d, "add", "."])

# static mode: absent -> no fire; existing build-output -> fires (step-11 semantics kept)
expect("static-absent", run(d, d, False), [])
os.makedirs(os.path.join(d, "build-output"))
expect("static-existing", run(d, d, False), ["E_STALE_STATE_COMMITTED"])
# mid-ceremony: same UNTRACKED build-output -> NO fire (generated state is legitimate)
expect("mid-untracked-build-output", run(d, d, True), [])
# mid-ceremony: force-added tracked build-output/x under the rehearsal path -> fires
REH = os.path.join(d, "docs", "verified-architecture-phase2-v3", "provisioning", "p3", "rehearsal")
os.makedirs(os.path.join(REH, "build-output"))
open(os.path.join(REH, "build-output", "x"), "w").write("stale\n")
subprocess.run(["git", "-C", d, "add", "-f", "docs/verified-architecture-phase2-v3/provisioning/p3/rehearsal/build-output/x"])
f = run(d, d, True)
expect("mid-tracked-build-output", f, ["E_STALE_STATE_COMMITTED"])
ok = any("build-output" in m and "tracked" in m for _, m in f)
print("MUST_SHOW_STALE_STATE mid-tracked-message %s" % ("OK" if ok else "FAIL")); results.append(ok)
# mid-ceremony: tracked disks/y -> fires
os.makedirs(os.path.join(REH, "disks")); open(os.path.join(REH, "disks", "y"), "w").write("s\n")
subprocess.run(["git", "-C", d, "add", "docs/verified-architecture-phase2-v3/provisioning/p3/rehearsal/disks/y"])
expect("mid-tracked-disks", run(d, d, True), ["E_STALE_STATE_COMMITTED", "E_STALE_STATE_COMMITTED"])
shutil.rmtree(d)

if all(results):
    print("MUST_SHOW_STALE_STATE all %d cases behave as ruled" % len(results))
else:
    print("MUST_SHOW_STALE_STATE FAILURES"); sys.exit(97)

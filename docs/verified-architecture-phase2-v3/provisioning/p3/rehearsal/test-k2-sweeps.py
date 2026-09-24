#!/usr/bin/env python3
# Committed planted negatives for the K2 sweep hardening (run-35999960747 D4e/D4f).
# Extracts the EXACT sweep heredoc bodies from NON_CERTIFYING_REHEARSAL-workflow.yml and
# runs them against synthetic trees: an UNREADABLE subdirectory must make every sweep FAIL
# with its named code - never print "clean" (the run-35999960747 vacuous-sweep defect).
import os, re, subprocess, sys, tempfile, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
WF = os.path.normpath(os.path.join(HERE, "..", "..", "..", "..", "..", ".github", "workflows", "NON_CERTIFYING_REHEARSAL-workflow.yml"))
SRC = open(WF).read()

# peer run-36004747396 ruling (C1''''' item 4): bodies are extracted with the SAME
# bash-rule parser the E_HEREDOC_STRUCTURE gate uses (heredoc_parse.py) - never marker
# search (marker search extracted the swallowed PYK2F block and could not see the step-19
# defect). sys.dont_write_bytecode BEFORE the sibling import (preflight check 6j).
sys.dont_write_bytecode = True
from heredoc_parse import iter_run_blocks, parse_heredocs, is_python

def _find(tag, block, top):
    closed, unclosed = parse_heredocs(block)
    if top and unclosed:
        raise SystemExit("unclosed heredoc in workflow (E_HEREDOC_STRUCTURE territory): %r" % (unclosed,))
    for h in closed:
        if h["tag"] == tag:
            return "\n".join(l for _, l in h["body"]) + "\n"
    # nested-generation heredocs: a shell body (e.g. the sudo/unshare CFIX/CSIGN scripts)
    # is itself a bash script whose own heredocs bash parses at runtime - descend. Python
    # bodies are data (and the 6l gate guarantees they contain no opener lines).
    for h in closed:
        if not is_python(h):
            r = _find(tag, h["body"], False)
            if r is not None:
                return r
    return None

def extract(tag):
    for _rk, blk in iter_run_blocks(SRC):
        r = _find(tag, blk, True)
        if r is not None:
            return r
    raise KeyError(tag)

SWEEPS = {
    "PYK2-fixture": extract("PYK2"),
    "PYK2C-csign": extract("PYK2C"),
    "PYK2F-postcopy": extract("PYK2F"),
    "PYK-zerokkey": extract("PYK"),
}

def run(name, code, argv, cwd):
    with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False) as f:
        f.write(code); path = f.name
    try:
        r = subprocess.run([sys.executable, path] + argv, cwd=cwd, capture_output=True, text=True)
        return r.returncode, (r.stdout + r.stderr)
    finally:
        os.unlink(path)

def mktree(build):
    d = tempfile.mkdtemp()
    build(d)
    return d

def unreadable(d, sub):
    os.makedirs(os.path.join(d, sub), exist_ok=True)
    open(os.path.join(d, sub, "x.bin"), "wb").write(b"x")
    os.chmod(os.path.join(d, sub), 0)

results = []
def expect(name, rc, out, want_rc, want_code):
    ok = (rc == want_rc) and (want_code in out)
    print("MUST_SHOW_K2_SWEEP %s %s rc=%d want_rc=%d code=%s" % (name, "OK" if ok else "FAIL", rc, want_rc, want_code))
    results.append(ok)

FOUR = ["F-WRONGSIG.efi", "F-HOSTILEUKI.efi", "C5-WRONG-SIGNER-FIXTURE.cer", "C5-HOSTILE-FIXTURE.cer"]

# 1) fixture sweep: clean tree (gen + 4 public outputs) -> pass
d = mktree(lambda d: (os.makedirs(os.path.join(d, "gen")), [open(os.path.join(d, "gen", f), "wb").write(b"public") for f in FOUR]))
rc, out = run("fixture-clean", SWEEPS["PYK2-fixture"], [d], d)
expect("fixture-clean", rc, out, 0, "four public outputs present")
shutil.rmtree(d)
# 2) fixture sweep: unreadable subdir -> E_FIXTURE_TREE_UNREADABLE, never "clean"
d = mktree(lambda d: (os.makedirs(os.path.join(d, "gen")), [open(os.path.join(d, "gen", f), "wb").write(b"public") for f in FOUR], unreadable(d, "locked")))
rc, out = run("fixture-unreadable", SWEEPS["PYK2-fixture"], [d], d)
expect("fixture-unreadable", rc, out, 94, "E_FIXTURE_TREE_UNREADABLE")
expect("fixture-unreadable-not-clean", rc, out.replace("fixture generation tree clean", ""), 94, "E_FIXTURE_TREE_UNREADABLE")
os.chmod(os.path.join(d, "locked"), 0o700); shutil.rmtree(d)
# 3) fixture sweep: one public output missing -> E_FIXTURE_PAYLOAD_INCOMPLETE
d = mktree(lambda d: (os.makedirs(os.path.join(d, "gen")), [open(os.path.join(d, "gen", f), "wb").write(b"public") for f in FOUR[:3]]))
rc, out = run("fixture-incomplete", SWEEPS["PYK2-fixture"], [d], d)
expect("fixture-incomplete", rc, out, 94, "E_FIXTURE_PAYLOAD_INCOMPLETE")
shutil.rmtree(d)

# 4/5) c-sign + post-copy sweeps: clean / unreadable / empty / planted key-name
for tag, sub in (("PYK2C-csign", "build-output"), ("PYK2F-postcopy", os.path.join("rehearsal", "build-output"))):
    d = mktree(lambda d: (os.makedirs(os.path.join(d, sub)), open(os.path.join(d, sub, "x.efi"), "wb").write(b"public")))
    rc, out = run(tag + "-clean", SWEEPS[tag], [], d)
    expect(tag + "-clean", rc, out, 0, "sweep clean")
    shutil.rmtree(d)
    d = mktree(lambda d: (os.makedirs(os.path.join(d, sub)), open(os.path.join(d, sub, "x.efi"), "wb").write(b"public"), unreadable(d, os.path.join(sub, "locked"))))
    rc, out = run(tag + "-unreadable", SWEEPS[tag], [], d)
    expect(tag + "-unreadable", rc, out, 95, "E_K2_SWEEP_UNREADABLE")
    os.chmod(os.path.join(d, sub, "locked"), 0o700); shutil.rmtree(d)
    d = mktree(lambda d: os.makedirs(os.path.join(d, sub)))
    rc, out = run(tag + "-empty", SWEEPS[tag], [], d)
    expect(tag + "-empty", rc, out, 95, "E_K2_SWEEP_EMPTY")
    shutil.rmtree(d)
    d = mktree(lambda d: (os.makedirs(os.path.join(d, sub)), open(os.path.join(d, sub, "throwaway-key.pem"), "wb").write(b"k")))
    rc, out = run(tag + "-planted-keyname", SWEEPS[tag], [], d)
    expect(tag + "-planted-keyname", rc, out, 95, "E_PRIVATE_KEY_IN_BUILD_TREE")
    shutil.rmtree(d)

# 6) zero-private-key gate sweep: clean / unreadable / empty / planted pem
def pyk_args(d):
    pf = os.path.join(d, "paths.txt"); open(pf, "w").write(d + "/scan\n")
    return [pf]
d = mktree(lambda d: (os.makedirs(os.path.join(d, "scan")), open(os.path.join(d, "scan", "evidence.log"), "wb").write(b"log")))
rc, out = run("zerokkey-clean", SWEEPS["PYK-zerokkey"], pyk_args(d), d)
expect("zerokkey-clean", rc, out, 0, "clean across")
shutil.rmtree(d)
d = mktree(lambda d: (os.makedirs(os.path.join(d, "scan")), open(os.path.join(d, "scan", "evidence.log"), "wb").write(b"log"), unreadable(d, os.path.join("scan", "locked"))))
rc, out = run("zerokkey-unreadable", SWEEPS["PYK-zerokkey"], pyk_args(d), d)
expect("zerokkey-unreadable", rc, out, 94, "E_K2_SWEEP_UNREADABLE")
os.chmod(os.path.join(d, "scan", "locked"), 0o700); shutil.rmtree(d)
d = mktree(lambda d: os.makedirs(os.path.join(d, "scan")))
rc, out = run("zerokkey-empty", SWEEPS["PYK-zerokkey"], pyk_args(d), d)
expect("zerokkey-empty", rc, out, 94, "E_K2_SWEEP_EMPTY")
shutil.rmtree(d)
d = mktree(lambda d: (os.makedirs(os.path.join(d, "scan")), open(os.path.join(d, "scan", "evidence.log"), "wb").write(b"log"), open(os.path.join(d, "scan", "k.pem"), "wb").write(b"x")))
rc, out = run("zerokkey-planted-pem", SWEEPS["PYK-zerokkey"], pyk_args(d), d)
expect("zerokkey-planted-pem", rc, out, 94, "E_PRIVATE_KEY_IN_EVIDENCE")
shutil.rmtree(d)

if all(results):
    print("MUST_SHOW_K2_SWEEP all %d cases behave as ruled" % len(results))
else:
    print("MUST_SHOW_K2_SWEEP FAILURES"); sys.exit(97)

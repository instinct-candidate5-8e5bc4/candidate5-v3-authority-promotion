#!/usr/bin/env python3
# Committed planted negatives for the E_INRUN_UNEXPECTED_FILE exact-set gate
# (run-36014385477 ruling (c)+(d)). Extracts the EXACT PYALLOW heredoc body from
# NON_CERTIFYING_REHEARSAL-workflow.yml and execs it against synthetic /tmp/<prefix>-inrun
# trees: the exact 21-file set passes; an extra public .pem fails; a missing file fails;
# an empty tree fails. The synthetic "exact" tree is built from the want-list PARSED OUT
# OF THE EXTRACTED BODY (single source - the test cannot drift from the gate).
import os, re, subprocess, sys, tempfile, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
WF = os.path.normpath(os.path.join(HERE, "..", "..", "..", "..", "..", ".github", "workflows", "NON_CERTIFYING_REHEARSAL-workflow.yml"))
SRC = open(WF).read()

sys.dont_write_bytecode = True  # BEFORE the sibling import (preflight check 6j)
from heredoc_parse import iter_run_blocks, walk

def extract(tag):
    for _rk, blk in iter_run_blocks(SRC):
        for kind, path, rec in walk(blk):
            if kind == "unclosed":
                raise SystemExit("unclosed heredoc in workflow: %r" % (rec,))
            if kind == "heredoc" and rec["tag"] == tag:
                return "\n".join(l for _, l in rec["body"]) + "\n"
    raise KeyError(tag)

BODY = extract("PYALLOW")
WANT = sorted(set(re.findall(r'"(uki/[^"]+|c-sign/[^"]+)"', BODY)))
if len(WANT) != 21:
    print("MUST_SHOW_INRUN_ALLOWLIST want-list-parse FAIL got %d entries: %r" % (len(WANT), WANT))
    sys.exit(1)

TPREFIX = "INRUNALLOWTEST"
TINRUN = "/tmp/%s-inrun" % TPREFIX

def run_body():
    with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False) as f:
        f.write(BODY); path = f.name
    try:
        r = subprocess.run([sys.executable, path], capture_output=True, text=True,
                           env=dict(os.environ, PREFIX=TPREFIX))
        return r.returncode, (r.stdout + r.stderr)
    finally:
        os.unlink(path)

results = []
def expect(name, rc, out, want_rc, want_code):
    ok = (rc == want_rc) and (want_code in out)
    print("MUST_SHOW_INRUN_ALLOWLIST %s %s rc=%s want_rc=%s code=%s" % (name, "OK" if ok else "FAIL", rc, want_rc, want_code))
    results.append(ok)

def tree(files):
    shutil.rmtree(TINRUN, ignore_errors=True)
    for rel in files:
        p = os.path.join(TINRUN, rel)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        open(p, "wb").write(b"public")

# 1) exact set -> pass
tree(WANT)
rc, out = run_body()
expect("exact-set-clean", rc, out, 0, "inrun exact-set OK")
# 2) extra public .pem -> E_INRUN_UNEXPECTED_FILE
tree(WANT + ["c-sign/c5-throwaway-ci-cert.pem"])
rc, out = run_body()
expect("extra-public-pem", rc, out, 97, "E_INRUN_UNEXPECTED_FILE")
# 3) missing one file -> E_INRUN_UNEXPECTED_FILE
tree([w for w in WANT if w != "c-sign/SHASUMS"])
rc, out = run_body()
expect("missing-shasums", rc, out, 97, "E_INRUN_UNEXPECTED_FILE")
# 4) empty tree -> fires (missing everything)
tree([])
rc, out = run_body()
expect("empty-tree", rc, out, 97, "E_INRUN_UNEXPECTED_FILE")
shutil.rmtree(TINRUN, ignore_errors=True)

print("INRUN_ALLOWLIST_NEGTESTS %d/%d pass" % (sum(results), len(results)))
sys.exit(0 if all(results) else 1)

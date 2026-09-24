#!/usr/bin/env python3
# Committed planted negatives for the E_HEREDOC_STRUCTURE gate (peer run-36004747396
# ruling, C1''''' item 3). Extracts the EXACT 6l gate block from preflight-check.py
# and execs it against synthetic workflow trees: the run-36004747396 misplaced-terminator
# shape, an unclosed heredoc, and a python body with a syntax error must each fail by
# name; the real committed workflows and a clean synthetic step must NOT fire.
import os, sys, tempfile, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
WF_REAL = os.path.normpath(os.path.join(HERE, "..", "..", "..", "..", "..", ".github", "workflows"))

sys.dont_write_bytecode = True  # BEFORE the sibling import (preflight check 6j)
import heredoc_parse as hp

PF = open(os.path.join(HERE, "preflight-check.py")).read()
i = PF.index("# 6l) peer run-36004747396 ruling")
j = PF.index("# 6m) peer run-36009604654 ruling", i)
GATE = PF[i:j]

def run_gate(wf_dir):
    fails = []
    ns = {"os": os, "fail": lambda c, m: fails.append((c, m)), "wf_dir": wf_dir, "_hp": hp}
    exec(compile(GATE, "preflight-6l", "exec"), ns)
    return fails

def wf(run_lines):
    return ("jobs:\n  t:\n    steps:\n      - name: x\n        run: |\n"
            + "\n".join("          " + l for l in run_lines) + "\n")

def synth(run_lines):
    d = tempfile.mkdtemp()
    open(os.path.join(d, "t.yml"), "w").write(wf(run_lines))
    return d

results = []
def expect(name, ok, detail=""):
    print("MUST_SHOW_HEREDOC_STRUCTURE %s %s %s" % (name, "OK" if ok else "FAIL", detail))
    results.append(ok)

# 1) control: the REAL committed workflows produce zero E_HEREDOC_STRUCTURE
f = run_gate(WF_REAL)
expect("real-workflows-clean", len(f) == 0, "fails=%r" % (f,))

# 2) control: a clean synthetic step with two proper python heredocs -> no fire
d = synth(["python3 - <<'PYA'", 'print("a")', "PYA",
           "python3 - <<'PYB'", 'print("b")', "PYB"])
f = run_gate(d)
expect("synthetic-clean", len(f) == 0, "fails=%r" % (f,))
shutil.rmtree(d)

# 3) the run-36004747396 step-19 shape: PREC's terminator sits AFTER the PYK2F block,
#    so PREC's python body swallows the python3 - <<'PYK2F' opener line -> fires
d = synth(["python3 - <<'PREC'", 'print("record")',
           "# K2 over the checkout build-output tree after fixture copy-out",
           "python3 - <<'PYK2F'", "import os", "PYK2F", "PREC"])
f = run_gate(d)
expect("misplaced-terminator-exact-shape", any(c == "E_HEREDOC_STRUCTURE" for c, _ in f),
       "fails=%r" % (f,))
shutil.rmtree(d)

# 4) unclosed heredoc -> fires
d = synth(["python3 - <<'PYT'", 'print("never closed")'])
f = run_gate(d)
expect("unclosed-heredoc", any(c == "E_HEREDOC_STRUCTURE" and "never closes" in m for c, m in f),
       "fails=%r" % (f,))
shutil.rmtree(d)

# 5) python body with a syntax error -> fires
d = synth(["python3 - <<'PYT'", "def broken(:", "PYT"])
f = run_gate(d)
expect("python-syntax-error", any(c == "E_HEREDOC_STRUCTURE" and "py_compile" in m for c, m in f),
       "fails=%r" % (f,))
shutil.rmtree(d)

# 6) C1 ruling (d): syntax error in a python body NESTED inside a bash heredoc ->
#    fires with the nested path (the peer's exact repro shape, CSIGN>PYK2C)
d = synth(["bash -se <<'OUTER'", "echo hi", "python3 - <<'INNER'", "def broken(:",
           "INNER", "OUTER"])
f = run_gate(d)
expect("nested-python-syntax-error",
       any(c == "E_HEREDOC_STRUCTURE" and "OUTER>INNER" in m and "py_compile" in m for c, m in f),
       "fails=%r" % (f,))
shutil.rmtree(d)

# 7) C1 ruling (d): misplaced terminator INSIDE a nested body (nested step-19
#    shape: INNER's body swallows the INNER2 opener before INNER closes) -> fires
d = synth(["bash -se <<'OUTER'", "python3 - <<'INNER'", 'print("x")',
           "python3 - <<'INNER2'", 'print("y")', "INNER2", "INNER", "OUTER"])
f = run_gate(d)
expect("nested-misplaced-terminator",
       any(c == "E_HEREDOC_STRUCTURE" and "OUTER>INNER" in m for c, m in f),
       "fails=%r" % (f,))
shutil.rmtree(d)

# 8) C1 ruling (b)/(d): unquoted opener <<PYT -> fails closed with its own code
d = synth(["python3 - <<PYT", 'print("unquoted")', "PYT"])
f = run_gate(d)
expect("unquoted-opener",
       any(c == "E_HEREDOC_UNQUOTED_OPENER" for c, _ in f),
       "fails=%r" % (f,))
shutil.rmtree(d)

print("HEREDOC_STRUCTURE_NEGTESTS %d/%d pass" % (sum(results), len(results)))
sys.exit(0 if all(results) else 1)

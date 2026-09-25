#!/usr/bin/env python3
# Committed proof for the peer run-36081199933 ruling (item 2): the ESP builder's
# E_WORK_EXISTS fresh-workdir guard is load-bearing, so the EXACT ESP-build command
# sequence in BOTH non-certification workflow YAMLs must give every builder invocation
# a FRESH work dir. The sequence is extracted textually from the two committed
# workflows (the "enrollment app + ESP dual builds" and "env2 ESP image reproduction"
# steps), then EXECUTED against a stub build-esp-image that enforces the fresh-dir
# contract. run-36081199933 died exactly here: the slot ESP build reused the
# historical build's /tmp/$PREFIX-esp-a. The planted regression restores that
# 41ccb99c shape (slot dirs rewritten back onto the used dirs) and must die
# E_WORK_EXISTS; the committed sequence must run clean. Extraction is fail-closed on
# count drift (8 builder invocations per lane: 4 main + 4 env2).
# peer run-36081199933-review ruling (privilege mismatch): the executed stub sequence
# runs single-user and CANNOT see ownership, so a STRUCTURAL check proves every
# command writing into a sudo-builder-created dir is sudo-prefixed (the builder's
# mkdir runs as root; a non-sudo cp dies EACCES before E_SLOT_ESP_COPY_PIN). The
# planted f48e8f0e shape (sudo stripped from the copies) must be RED.
import os, re, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
WF = os.path.normpath(os.path.join(HERE, "..", "..", "..", "..", "..", ".github", "workflows"))
LANES = ("NON_CERTIFYING_REHEARSAL", "NON_CERTIFYING_SCRATCH")
STEP_MARKERS = ("ESP dual builds", "env2 ESP image reproduction")

STUB = r'''#!/bin/bash
# stub build-esp-image.sh enforcing the fresh-workdir contract the real builder
# guards with E_WORK_EXISTS (build-esp-image.sh lines 30-31)
set -euo pipefail
[ "$#" -eq 5 ] || { echo "E_STUB_ARGC $#"; exit 31; }
[ -e "$2" ] && { echo "E_WORK_EXISTS $2"; exit 30; }
mkdir -p "$2"
printf 'stub-esp-bytes\n' > "$2/$5"
'''

def extract_step_bodies(path):
    lines = open(path).read().splitlines()
    bodies = []
    for i, l in enumerate(lines):
        if "- name:" in l and any(mk in l for mk in STEP_MARKERS):
            j = i + 1
            while j < len(lines) and not re.match(r"^\s+run: \|$", lines[j]):
                j += 1
            if j >= len(lines):
                print("E_TEST_EXTRACTION no run block after step: " + l.strip()); sys.exit(97)
            indent, body, k = None, [], j + 1
            while k < len(lines):
                ln = lines[k]
                if ln.strip():
                    cur = len(ln) - len(ln.lstrip())
                    if indent is None: indent = cur
                    if cur < indent: break
                    body.append(ln[indent:])
                k += 1
            bodies.append("\n".join(body))
    return bodies

def esp_command_sequence(bodies):
    # the EXACT ESP-step command sequence, in order: every build-esp-image.sh
    # invocation plus the post-build copy lines (they create the staging copy the
    # ceremony/qemu-smoke read, so they belong to the executed ESP sequence).
    seq = []
    for b in bodies:
        for ln in b.splitlines():
            if ("build-esp-image.sh" in ln or ln.startswith("cp --sparse=always ")
                    or ln.startswith("sudo cp --sparse=always ")):
                seq.append(ln)
    return seq

results = []
def expect(name, ok, detail=""):
    print("MUST_SHOW_ESP_FRESH_DIRS %s %s %s" % (name, "OK" if ok else "FAIL", detail))
    results.append(ok)

tmp = tempfile.mkdtemp()
stub = os.path.join(tmp, "build-esp-image.sh")
open(stub, "w").write(STUB)
os.chmod(stub, 0o755)

def run_seq(seq, sandbox, prefix):
    out = []
    for ln in seq:
        ln = ln.replace("sudo unshare -n env PATH=\"$PATH\" ../build-esp-image.sh", stub)
        ln = ln.replace("../build-esp-image.sh", stub)
        # single-user sandbox: the sudo prefix on the copies is proven by the
        # STRUCTURAL check below (ownership is invisible to one-user execution)
        ln = ln.replace("sudo cp --sparse=always", "cp --sparse=always")
        ln = ln.replace("/tmp/$PREFIX", os.path.join(sandbox, prefix))
        out.append(ln)
    script = ("set -euo pipefail\nPREFIX=%s\nexport PREFIX\n" % prefix) + "\n".join(out) + "\n"
    return subprocess.run(["bash", "-c", script], capture_output=True, text=True)

REGRESS = (("esp-slot-a", "esp-a"), ("esp-slot-b", "esp-b"),
           ("esp-env2-slot-a", "esp-env2-a"), ("esp-env2-slot-b", "esp-env2-b"))

for lane in LANES:
    wf = os.path.join(WF, lane + "-workflow.yml")
    bodies = extract_step_bodies(wf)
    expect(lane + " extraction found both ESP steps", len(bodies) == 2, "bodies=%d" % len(bodies))
    seq = esp_command_sequence(bodies)
    builders = [l for l in seq if "build-esp-image.sh" in l]
    expect(lane + " extraction found 8 builder invocations", len(builders) == 8, "builders=%d" % len(builders))
    # GREEN: the committed sequence gives every builder a fresh dir
    sb = tempfile.mkdtemp()
    r = run_seq(seq, sb, lane)
    expect(lane + " committed ESP sequence runs clean under the fresh-dir stub",
           r.returncode == 0, "rc=%d out=%s" % (r.returncode, (r.stdout + r.stderr)[-300:]))
    # RED: the 41ccb99c shape (slot builds reuse the historical dirs) must die E_WORK_EXISTS
    reg = []
    nsub = 0
    for ln in seq:
        for a, b in REGRESS:
            if a in ln:
                nsub += ln.count(a)
            ln = ln.replace(a, b)
        reg.append(ln)
    # 4 builder lines + 2 post-build cp lines carry one slot-dir occurrence each
    expect(lane + " planted regression rewrote exactly 6 dirs", nsub == 6, "nsub=%d" % nsub)
    sb2 = tempfile.mkdtemp()
    r2 = run_seq(reg, sb2, lane)
    expect(lane + " 41ccb99c shape dies E_WORK_EXISTS (RED proof)",
           r2.returncode != 0 and "E_WORK_EXISTS" in (r2.stdout + r2.stderr),
           "rc=%d out=%s" % (r2.returncode, (r2.stdout + r2.stderr)[-300:]))

# --- structural privilege check: every write into a sudo-builder-created dir must be
# sudo-prefixed (the executed stub sequence cannot see ownership) ---
def builder_dirs(bodies):
    dirs = set()
    for b in bodies:
        for ln in b.splitlines():
            if "build-esp-image.sh" in ln:
                parts = ln.split()
                i = parts.index("../build-esp-image.sh")
                dirs.add(parts[i + 2])  # <script> <input> <workdir> <sha> <bytes> <name>
    return dirs

def writes_into_builder_dir(ln, dirs):
    for pre in ("cp --sparse=always ", "sudo cp --sparse=always "):
        if ln.startswith(pre):
            dst = ln.split()[-1]
            return os.path.dirname(dst) in dirs
    return False

for lane in LANES:
    wf = os.path.join(WF, lane + "-workflow.yml")
    bodies = extract_step_bodies(wf)
    dirs = builder_dirs(bodies)
    expect(lane + " builder-dir extraction found 8 dirs", len(dirs) == 8, "dirs=%r" % (sorted(dirs),))
    writers = [ln for b in bodies for ln in b.splitlines() if writes_into_builder_dir(ln, dirs)]
    expect(lane + " exactly 2 copy-writes into builder dirs", len(writers) == 2, "writers=%r" % (writers,))
    bad = [ln for ln in writers if not ln.startswith("sudo ")]
    expect(lane + " every builder-dir write is sudo-prefixed", bad == [], "bad=%r" % (bad,))
    # planted f48e8f0e shape: sudo stripped from the copies -> must be RED
    planted = [ln.replace("sudo cp --sparse=always", "cp --sparse=always") for ln in writers]
    pbad = [ln for ln in planted if not ln.startswith("sudo ")]
    expect(lane + " f48e8f0e shape (sudo stripped) is RED", len(pbad) == len(writers) and len(writers) > 0,
           "pbad=%d" % len(pbad))

if all(results):
    print("MUST_SHOW_ESP_FRESH_DIRS all %d checks pass" % len(results))
else:
    print("MUST_SHOW_ESP_FRESH_DIRS FAILURES: %s" % [i for i, r in enumerate(results) if not r]); sys.exit(97)

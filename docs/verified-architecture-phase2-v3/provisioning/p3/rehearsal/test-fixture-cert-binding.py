#!/usr/bin/env python3
# peer run-36017957182 ruling (b): committed wiring test for the fixture-cert binding.
# Runs the REAL helper (bind-fixture-certs.sh, sourced by rehearsal-enroll.sh before its
# predicate call) against planted inrun trees - never a reimplementation:
#   1. matching record        -> rc 0, all three exports == the ACTUAL .cer/.der sha256s
#   2. missing fixture cert   -> rc 97, E_HOSTILE_CERT_UNSET
#   3. missing record         -> rc 97, E_HOSTILE_CERT_UNSET
#   4. record/payload mismatch-> rc 97, E_FIXTURE_RECORD_MISMATCH
import sys, os, json, hashlib, subprocess, tempfile, shutil

sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
HELPER = os.path.join(HERE, "bind-fixture-certs.sh")


def sha(b):
    return hashlib.sha256(b).hexdigest()


def build_tree(mismatch=False, drop_cert=False, drop_record=False):
    root = tempfile.mkdtemp(prefix="c5-bindtest-")
    fx = os.path.join(root, "c-sign", "fixtures")
    os.makedirs(fx)
    h = os.urandom(700)
    w = os.urandom(800)
    t = os.urandom(900)
    if not drop_cert:
        open(os.path.join(fx, "C5-HOSTILE-FIXTURE.cer"), "wb").write(h)
    open(os.path.join(fx, "C5-WRONG-SIGNER-FIXTURE.cer"), "wb").write(w)
    open(os.path.join(root, "c-sign", "c5-throwaway-ci-cert.der"), "wb").write(t)
    if not drop_record:
        rec = {
            "hostile_cert_der_sha256": sha(h),
            "wrong_signer_cert_der_sha256": sha(w),
            "throwaway_cert_der_sha256": sha(t),
        }
        if mismatch:
            good = rec["wrong_signer_cert_der_sha256"]
            rec["wrong_signer_cert_der_sha256"] = ("0" if good[0] != "0" else "1") + good[1:]
        json.dump(rec, open(os.path.join(fx, "GENERATION-RECORD.json"), "w"))
    return root, sha(h), sha(w), sha(t)


def run_helper(root):
    cmd = '. "$1" "$2" && echo "EXPORTS:$C5_HOSTILE_CERT_SHA256,$C5_WRONG_SIGNER_CERT_SHA256,$C5_THROWAWAY_CERT_SHA256"'
    return subprocess.run(["bash", "-c", cmd, "_", HELPER, root], capture_output=True, text=True)


def check(name, ok, detail=""):
    print(("PASS" if ok else "FAIL") + " " + name + (" " + detail if detail else ""))
    if not ok:
        sys.exit(1)


# 1. matching record -> exports == actual hashes
root, h, w, t = build_tree()
r = run_helper(root)
check("match exports actual hashes", r.returncode == 0 and ("EXPORTS:%s,%s,%s" % (h, w, t)) in r.stdout,
      "rc=%d out=%r" % (r.returncode, (r.stdout + r.stderr)[:200]))
shutil.rmtree(root)

# 2. missing fixture cert -> E_HOSTILE_CERT_UNSET
root, h, w, t = build_tree(drop_cert=True)
r = run_helper(root)
check("missing cert named", r.returncode == 97 and "E_HOSTILE_CERT_UNSET" in r.stdout + r.stderr,
      "rc=%d out=%r" % (r.returncode, (r.stdout + r.stderr)[:200]))
shutil.rmtree(root)

# 3. missing record -> E_HOSTILE_CERT_UNSET
root, h, w, t = build_tree(drop_record=True)
r = run_helper(root)
check("missing record named", r.returncode == 97 and "E_HOSTILE_CERT_UNSET" in r.stdout + r.stderr,
      "rc=%d out=%r" % (r.returncode, (r.stdout + r.stderr)[:200]))
shutil.rmtree(root)

# 4. record mismatch -> E_FIXTURE_RECORD_MISMATCH
root, h, w, t = build_tree(mismatch=True)
r = run_helper(root)
check("record mismatch named", r.returncode == 97 and "E_FIXTURE_RECORD_MISMATCH" in r.stdout + r.stderr,
      "rc=%d out=%r" % (r.returncode, (r.stdout + r.stderr)[:200]))
shutil.rmtree(root)

print("test-fixture-cert-binding: all 4 checks pass")

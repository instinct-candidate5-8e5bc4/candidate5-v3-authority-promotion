#!/usr/bin/env python3
# Committed planted negatives for preflight's E_CERT_POSITIVE_MISSING guard (peer
# 2026-09-24 C1''' ruling; signed-slot head: predicate gains the (g) DEBUG-firmware
# clause - "the positive" is the debug-firmware case, the retargeted R7 release
# sibling MUST NOT count as a second positive). The test EXTRACTS the exact guard
# block from preflight-check.py and execs it against the REAL config.json plus
# synthetic case mutations. Post-slot premises: the committed config legitimately
# contains exactly one real positive (P1), so current-config+slot must NOT fire;
# the planted negatives mutate or remove that real P1.
# peer pre-push ruling on 63dc0ed9 (revision 5): the extraction now also covers the
# E_SIGNED_CASE_LANES guard - P1/R7 must run in all three lanes; the planted negatives
# prove removing scratch from P1's lanes (and the pre-revision certification-only
# shape) fails closed.
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = open(os.path.join(HERE, "preflight-check.py")).read()
CFG = json.load(open(os.path.join(HERE, "config.json")))

m = re.search(r'    if os\.path\.exists\(os\.path\.join\(here,"evidence","successor-to-certify\.efi"\)\):.*?_SIGNED_CASE_LANES-_found\)\)\)', SRC, re.S)
if not m:
    print("E_TEST_EXTRACTION guard block not found in preflight-check.py"); sys.exit(97)
_ls = m.group(0).splitlines()
_ind = min(len(l) - len(l.lstrip()) for l in _ls if l.strip())
BLOCK = "\n".join(l[_ind:] for l in _ls)

def run_guard(cfg, slot_exists):
    fails = []
    class _Path:
        @staticmethod
        def exists(p): return slot_exists
        join = staticmethod(os.path.join)
    class _Os: path = _Path
    ns = {"os": _Os, "here": HERE, "cfg": cfg,
          "fail": lambda c, m: fails.append((c, m))}
    exec(BLOCK, ns)
    return fails

P1_ID = "NON_CERTIFYING_REHEARSAL-P1-signed-slot-positive"
def real_p1():
    p1 = [c for c in CFG["cases"] if c["id"] == P1_ID]
    assert len(p1) == 1, "committed config must contain exactly one P1"
    return json.loads(json.dumps(p1[0]))

def cfg_drop_p1():
    c = json.loads(json.dumps(CFG))
    c["cases"] = [x for x in c["cases"] if x["id"] != P1_ID]
    return c

def cfg_mutate_p1(**mut):
    c = cfg_drop_p1()
    p1 = real_p1()
    for k, v in mut.items():
        if k == "expect": p1["expect"] = v
        else: p1[k] = v
    c["cases"] = c["cases"] + [p1]
    return c

def expect(name, cfg, slot, want_code):
    f = run_guard(cfg, slot)
    codes = [c for c, _ in f]
    want = ([want_code] if isinstance(want_code, str) else list(want_code or []))
    ok = (codes == want)
    print("MUST_SHOW_CERT_POS_GUARD %s %s got=%s want=%s" % (name, "OK" if ok else "FAIL", codes, want))
    return ok

results = []
# post-slot positive premise: the committed config carries exactly one real positive
results.append(expect("current-config+slot (real P1 present)", CFG, True, None))
results.append(expect("current-config-no-slot", CFG, False, None))
# the signed slot exists but NO case satisfies the full predicate -> must fire. With P1
# dropped entirely the lanes guard co-fires by design (a signed-file case is missing):
# defense in depth, exact code set asserted.
results.append(expect("positive-missing (P1 dropped)", cfg_drop_p1(), True, ["E_CERT_POSITIVE_MISSING","E_SIGNED_CASE_LANES"]))
results.append(expect("positive-wrong-esp", cfg_mutate_p1(esp="build-output/esp/c5-root-admitter-uki-v3-esp.raw"), True, "E_CERT_POSITIVE_MISSING"))
results.append(expect("positive-throwaway-enrollment",
                      cfg_mutate_p1(vars_template="/tmp/NON_CERTIFYING_REHEARSAL-out/NON_CERTIFYING_REHEARSAL-enroll-throwaway/vars-enrolled.fd"),
                      True, "E_CERT_POSITIVE_MISSING"))
# (g) ruling's own case: the retargeted R7 release sibling (slot ESP, sole db, positive
# expects, RELEASE firmware) must NOT count as the positive - with P1 dropped the
# predicate must still see ZERO positives and fire.
r7 = real_p1(); r7["id"] = "NON_CERTIFYING_REHEARSAL-R7-release-sibling-behavior-only"
r7["firmware"] = "/tmp/NON_CERTIFYING_REHEARSAL-stage/root/usr/share/OVMF/OVMF_CODE_4M.secboot.fd"
c = cfg_drop_p1(); c["cases"] = c["cases"] + [r7]
results.append(expect("release-sibling-is-not-the-positive (g)", c, True, ["E_CERT_POSITIVE_MISSING","E_SIGNED_CASE_LANES"]))
# a second debug-firmware positive alongside the real P1 -> two positives, must fire
p2 = real_p1(); p2["id"] = "NON_CERTIFYING_REHEARSAL-P2-second-positive"
c = json.loads(json.dumps(CFG)); c["cases"] = c["cases"] + [p2]
results.append(expect("two-positives", c, True, "E_CERT_POSITIVE_MISSING"))
e = dict(real_p1()["expect"]); del e["no_reject_strings"]
results.append(expect("positive-missing-no_reject_strings", cfg_mutate_p1(expect=e), True, "E_CERT_POSITIVE_MISSING"))
e = dict(real_p1()["expect"]); e["no_reject_strings"] = False; e["reject_strings"] = ["x"]
results.append(expect("positive-with-reject-strings", cfg_mutate_p1(expect=e), True, "E_CERT_POSITIVE_MISSING"))
results.append(expect("positive-unknown-enrollment",
                      cfg_mutate_p1(vars_template="/tmp/NON_CERTIFYING_REHEARSAL-out/NON_CERTIFYING_REHEARSAL-enroll-nonexistent/vars-enrolled.fd"),
                      True, "E_CERT_POSITIVE_MISSING"))
# peer pre-push ruling on 63dc0ed9 (revision 5): lane-set negatives - the signed-file
# cases must carry all three lanes; any reduction dies E_SIGNED_CASE_LANES.
results.append(expect("positive-lane-scratch-removed (revision 5)",
                      cfg_mutate_p1(lanes=["rehearsal","certification"]), True, "E_SIGNED_CASE_LANES"))
results.append(expect("positive-lanes-certification-only (pre-revision shape)",
                      cfg_mutate_p1(lanes=["certification"]), True, "E_SIGNED_CASE_LANES"))
_c = json.loads(json.dumps(CFG))
for _x in _c["cases"]:
    if _x["id"] == "NON_CERTIFYING_REHEARSAL-R7-release-sibling-behavior-only":
        _x["lanes"] = ["scratch","certification"]
results.append(expect("r7-lane-rehearsal-removed (revision 5)", _c, True, "E_SIGNED_CASE_LANES"))

if all(results):
    print("MUST_SHOW_CERT_POS_GUARD all %d cases behave as ruled" % len(results))
else:
    print("MUST_SHOW_CERT_POS_GUARD FAILURES: %s" % [i for i, r in enumerate(results) if not r]); sys.exit(97)

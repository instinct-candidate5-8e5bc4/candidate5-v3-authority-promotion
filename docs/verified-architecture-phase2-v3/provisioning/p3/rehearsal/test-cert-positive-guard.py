#!/usr/bin/env python3
# Committed planted negatives for preflight's E_CERT_POSITIVE_MISSING guard (peer
# 2026-09-24 C1''' ruling). The test EXTRACTS the exact guard block from
# preflight-check.py and execs it against the REAL config.json plus synthetic case
# mutations - the current config + planted slot MUST fire (the C1'' reviewer's repro).
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = open(os.path.join(HERE, "preflight-check.py")).read()
CFG = json.load(open(os.path.join(HERE, "config.json")))

m = re.search(r'    if os\.path\.exists\(os\.path\.join\(here,"evidence","successor-to-certify\.efi"\)\):.*?repr\(_pos\)\)\)', SRC, re.S)
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

POS = {"id": "NON_CERTIFYING_REHEARSAL-P1-signed-slot-positive",
       "esp": "build-output/esp/c5-successor-to-certify-esp.raw",
       "vars_template": "/tmp/NON_CERTIFYING_REHEARSAL-out/NON_CERTIFYING_REHEARSAL-enroll-sole/vars-enrolled.fd",
       "expect": {"exit_97": False, "exit_98": True, "kernel_exec": True,
                  "no_reject_strings": True, "reject_strings": []},
       "lanes": ["certification"]}

def cfg_with(*extra):
    c = json.loads(json.dumps(CFG))
    c["cases"] = c["cases"] + [json.loads(json.dumps(e)) for e in extra]
    return c

def expect(name, cfg, slot, want_code):
    f = run_guard(cfg, slot)
    codes = [c for c, _ in f]
    ok = (codes == [want_code]) if want_code else (codes == [])
    print("MUST_SHOW_CERT_POS_GUARD %s %s got=%s want=%s" % (name, "OK" if ok else "FAIL", codes, [want_code] if want_code else []))
    return ok

results = []
# the C1'' reviewer's exact repro: current frozen R2-R7 set + planted slot must fire
results.append(expect("current-config+slot", CFG, True, "E_CERT_POSITIVE_MISSING"))
results.append(expect("current-config-no-slot", CFG, False, None))
results.append(expect("one-real-positive+slot", cfg_with(POS), True, None))
bad_esp = dict(POS, esp="build-output/esp/c5-root-admitter-uki-v3-esp.raw")
results.append(expect("positive-wrong-esp", cfg_with(bad_esp), True, "E_CERT_POSITIVE_MISSING"))
bad_enr = dict(POS, vars_template="/tmp/NON_CERTIFYING_REHEARSAL-out/NON_CERTIFYING_REHEARSAL-enroll-throwaway/vars-enrolled.fd")
results.append(expect("positive-throwaway-enrollment", cfg_with(bad_enr), True, "E_CERT_POSITIVE_MISSING"))
p2 = dict(POS, id="NON_CERTIFYING_REHEARSAL-P2-second-positive")
results.append(expect("two-positives", cfg_with(POS, p2), True, "E_CERT_POSITIVE_MISSING"))
no_nrs = json.loads(json.dumps(POS)); del no_nrs["expect"]["no_reject_strings"]
results.append(expect("positive-missing-no_reject_strings", cfg_with(no_nrs), True, "E_CERT_POSITIVE_MISSING"))
rej = json.loads(json.dumps(POS)); rej["expect"]["no_reject_strings"] = False; rej["expect"]["reject_strings"] = ["x"]
results.append(expect("positive-with-reject-strings", cfg_with(rej), True, "E_CERT_POSITIVE_MISSING"))
no_enr = json.loads(json.dumps(POS)); no_enr["vars_template"] = "/tmp/NON_CERTIFYING_REHEARSAL-out/NON_CERTIFYING_REHEARSAL-enroll-nonexistent/vars-enrolled.fd"
results.append(expect("positive-unknown-enrollment", cfg_with(no_enr), True, "E_CERT_POSITIVE_MISSING"))

if all(results):
    print("MUST_SHOW_CERT_POS_GUARD all %d cases behave as ruled" % len(results))
else:
    print("MUST_SHOW_CERT_POS_GUARD FAILURES: %s" % [i for i, r in enumerate(results) if not r]); sys.exit(97)

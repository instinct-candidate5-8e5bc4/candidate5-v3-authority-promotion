#!/usr/bin/env python3
"""test-enroll-predicate-env.py - committed negative tests for the route-(ii) enroll
predicate env bindings (peer 2026-09-24): H (in-run hostile cert) and W (wrong-signer)
arrive via C5_HOSTILE_CERT_SHA256 / C5_WRONG_SIGNER_CERT_SHA256, T via
C5_THROWAWAY_CERT_SHA256. Runs the EXACT expectation block extracted from the
committed enroll-predicate-check.py against stubbed inputs; every ruled gate must
fire with its named code. Prints MUST_SHOW lines; rc 90 on any deviation."""
import os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = open(os.path.join(HERE, "enroll-predicate-check.py")).read()
SEG = SRC[SRC.index('if mode == "throwaway":'):SRC.index("present = TRUST_FORBIDDEN")]
PROD = "7cda4ddc149849cc61191d4b5b3d218d14770c0401e9e66dd9617b82ba1ae441"
H = "aa" * 32; W = "bb" * 32; T = "cc" * 32

def run(mode, widened, db_ders, envH=H, envW=W, envT=T):
    E = []
    g = {"fail": lambda c, m: E.append(c), "PROD_CERT": PROD,
         "HOSTILE_CERT": envH, "WRONG_SIGNER_CERT": envW,
         "mode": mode, "widened": widened, "X509": "X509", "OWNER_GUID": "g",
         "db": [("X509", "g", d) for d in db_ders], "_os": os}
    os.environ["C5_THROWAWAY_CERT_SHA256"] = envT or ""
    exec(compile(SEG, "pred", "exec"), g)
    return E

CASES = [
    ("widened-ok",            run("widened", True,  [PROD, H]), []),
    ("widened-H-unset",       run("widened", True,  [PROD], envH=""), ["E_HOSTILE_CERT_UNSET", "E_TRUST_DER_SET"]),
    ("sole-ok",               run("sole",    False, [PROD]), []),
    ("sole-H-present",        run("sole",    False, [PROD, H]), ["E_TRUST_DER_SET", "E_HOSTILE_CERT_IN_SOLE_DB"]),
    ("throwaway-ok",          run("throwaway", False, [T]), []),
    ("throwaway-T-eq-owner",  run("throwaway", False, [PROD], envT=PROD), ["E_THROWAWAY_CERT_DISTINCT"]),
    ("throwaway-T-eq-H",      run("throwaway", False, [H], envT=H), ["E_THROWAWAY_CERT_DISTINCT", "E_HOSTILE_CERT_IN_SOLE_DB"]),
    ("W-in-db",               run("widened", True,  [PROD, W]), ["E_TRUST_DER_SET", "E_WRONG_SIGNER_IN_DB"]),
    ("H-eq-owner",            run("widened", True,  [PROD], envH=PROD), ["E_HOSTILE_CERT_DISTINCT", "E_TRUST_DER_SET"]),
]
bad = []
for name, got, want in CASES:
    ok = sorted(got) == sorted(want)
    if not ok:
        bad.append(name)
    print("MUST_SHOW_PREDICATE_ENV %s %s got=%s want=%s" % (name, "OK" if ok else "FAILED", got, want))
if bad:
    print("E_PREDICATE_ENV_NEGTEST_FAILED %s" % bad)
    sys.exit(90)
print("MUST_SHOW_PREDICATE_ENV all %d cases behave as ruled" % len(CASES))

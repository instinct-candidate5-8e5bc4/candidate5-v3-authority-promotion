#!/bin/bash
# bind-fixture-certs.sh - peer run-36017957182 ruling (a): the fixture-cert binding lives
# at the SINGLE consumer point. SOURCED by rehearsal-enroll.sh immediately before its
# enroll-predicate call - NEVER exported by callers (run-ceremony.sh) and never bound at
# any other site. Run 36017957182 died at step 28 because NOTHING exported
# C5_HOSTILE_CERT_SHA256 / C5_WRONG_SIGNER_CERT_SHA256 for enroll-predicate-check.py.
#
# Binding contract (ruling (a) + Q2 part 2/2): compute the ACTUAL sha256 of the two
# in-run fixture .cer files itself, require equality with the H/W recorded in the
# c-fixtures step's GENERATION-RECORD.json (fresh ephemeral certs - the record is the
# only committed-shape source of truth for what THIS run generated), then export the
# predicate inputs. Fail-closed: missing fixture/record -> E_HOSTILE_CERT_UNSET
# (exit 97); record disagreement -> E_FIXTURE_RECORD_MISMATCH (exit 97).
#
# H/W binding is UNCONDITIONAL (every enrollment mode predicates on them).
# T binding is MODE-CONDITIONAL (peer verdict on the 10-prime head, BLOCKER 2): only
# MODE=throwaway requires, record-checks and exports C5_THROWAWAY_CERT_SHA256
# (enroll-predicate-check.py:157 reads it only in throwaway mode). The certification
# lane has no c-sign step and must never have one - an unconditional T requirement
# would kill every certification enrollment with E_THROWAWAY_CERT_UNSET. The third
# export itself remains (accepted: tighter than the old run-ceremony-only export).
#
# usage (sourced): . bind-fixture-certs.sh <inrun_dir> <mode>   # mode = sole|db2|throwaway
_ir="${1:?E_HOSTILE_CERT_UNSET inrun dir argument missing}"
_mode="${2:?E_HOSTILE_CERT_UNSET mode argument missing}"
_fx="$_ir/c-sign/fixtures"
_rec="$_fx/GENERATION-RECORD.json"
[ -f "$_fx/C5-HOSTILE-FIXTURE.cer" ] || { echo "E_HOSTILE_CERT_UNSET $_fx/C5-HOSTILE-FIXTURE.cer missing"; exit 97; }
[ -f "$_fx/C5-WRONG-SIGNER-FIXTURE.cer" ] || { echo "E_HOSTILE_CERT_UNSET $_fx/C5-WRONG-SIGNER-FIXTURE.cer missing"; exit 97; }
[ -f "$_rec" ] || { echo "E_HOSTILE_CERT_UNSET $_rec missing"; exit 97; }
_h_actual=$(sha256sum "$_fx/C5-HOSTILE-FIXTURE.cer" | cut -d' ' -f1)
_w_actual=$(sha256sum "$_fx/C5-WRONG-SIGNER-FIXTURE.cer" | cut -d' ' -f1)
_t_actual=""
if [ "$_mode" = "throwaway" ]; then
  _t_der="$_ir/c-sign/c5-throwaway-ci-cert.der"
  [ -f "$_t_der" ] || { echo "E_THROWAWAY_CERT_UNSET $_t_der missing"; exit 97; }
  _t_actual=$(sha256sum "$_t_der" | cut -d' ' -f1)
fi
# fail-closed on its own: a sourced helper cannot rely on the parent's set -e, so the
# record check's rc is captured and converted to the named death here (the python side
# prints the E_FIXTURE_RECORD_MISMATCH detail line first).
_rec_rc=0
python3 - "$_rec" "$_mode" "$_h_actual" "$_w_actual" "$_t_actual" <<'PY' || _rec_rc=$?
import sys, json
_rec, _mode, _h, _w, _t = sys.argv[1:6]
_r = json.load(open(_rec))
_pairs = [("hostile_cert_der_sha256", _h), ("wrong_signer_cert_der_sha256", _w)]
if _mode == "throwaway":
    _pairs.append(("throwaway_cert_der_sha256", _t))
for _k, _actual in _pairs:
    if _r.get(_k) != _actual:
        print("E_FIXTURE_RECORD_MISMATCH %s record=%s actual=%s" % (_k, _r.get(_k), _actual))
        sys.exit(97)
PY
[ "$_rec_rc" = 0 ] || exit 97
export C5_HOSTILE_CERT_SHA256="$_h_actual"
export C5_WRONG_SIGNER_CERT_SHA256="$_w_actual"
if [ "$_mode" = "throwaway" ]; then
  export C5_THROWAWAY_CERT_SHA256="$_t_actual"
fi
echo "fixture certs bound at the predicate consumer point (mode=$_mode; H/W == GENERATION-RECORD.json)"

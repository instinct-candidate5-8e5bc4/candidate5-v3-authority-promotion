#!/usr/bin/env python3
"""derive-scratch.py - derive .github/workflows/NON_CERTIFYING_SCRATCH-workflow.yml from the
committed .github/workflows/NON_CERTIFYING_REHEARSAL-workflow.yml (H1: the scratch workflow is
GENERATED, never hand-edited; single source of truth is the rehearsal workflow).

Usage: python3 derive-scratch.py <rehearsal-workflow-path> <output-path>

Transforms (in order):
  1. header swap (scratch banner, no-evidence-weight notice)
  2. lane prefix replace NON_CERTIFYING_REHEARSAL -> NON_CERTIFYING_SCRATCH (all)
  3. push trigger branches: [p3-rehearsal-3, p3-rehearsal-4] -> ['p3-scratch-*']
  4. run gate ref pattern -> refs/heads/p3-scratch-*
  5. drop the rehearsal-lane pushed-once EV_CREATED / EV_BEFORE assertions
     (scratch lane: successive commits allowed, force-push still rejected)
  6. pushed-once comment -> scratch form
  7. inject scratch-only steps (fetch_locked negatives, PF-1/2/4/5/6 must-shows,
     verify-auth + checkout-gate negatives) and the ceremony prerequisite condition,
     each at a unique step-name anchor (asserted exactly one occurrence).

Byte-provenance: the #18 reconstruction of this generator (before any #18 content
change) re-derived the scratch workflow committed at 8871ef65 BYTE-IDENTICALLY (derived
sha256 == committed sha256 == 8e07462c49876a73b1674764855f27e9527d2295271b3c92cacfcba611a88f11,
recorded in the #18 bundle notes). #18 then added exactly ONE injected block
(BLOCK_TIE_NEGS: the F3 out-of-set gate and F6 byte-flip tie must-shows); the #18 scratch
workflow is the 8871ef65 derivation plus that one block, re-derived by this file.
#20 (peer run-35963407323 ruling): the F3/F6/H3 must-show blocks gained `if: always()` (F3
also gained a named committed-input prerequisite) so each runs whenever its own prerequisites
exist, INDEPENDENT of the ceremony outcome, dying with its own named code otherwise - never
skipped silently; BLOCK_BYTECODE_GUARD_NEG was redesigned baseline-first/planted/post-clean
with all three preflight reports captured into the evidence tree and no /dev/null anywhere.
#20' (peer byte verdict on #20): the four must-show blocks carry `if: ${{ !cancelled() }}`,
never always() - always() would also fire on job cancellation, contradicting ruling C3.
C1' (peer 2026-09-24 B1): the criterion-C c-sign step rides the lane prefix swap (transform 2)
into the scratch workflow BY DESIGN - one source of truth, no duplicated step text. The
derivation now ASSERTS the carried step's presence (E_DERIVE_C_SIGN_MISSING) so a silent
drop of the C lane from either lane's workflow fails the generator closed.
"""
import re, sys

NEW_HDR = '''# NON_CERTIFYING_SCRATCH - pre-freeze KVM scratch lane (r3 ruling 3/H1). NO EVIDENCE WEIGHT.
# This workflow NEVER certifies anything and its runs carry no section-F evidence weight;
# findings here only feed the correction batch. It must never emit OVMF_CI_SECURE_BOOT_UKI_PASS
# or any certification marker (the forbidden-marker guard below is kept). Every artifact name
# begins NON_CERTIFYING_SCRATCH. It exists ONLY on p3-scratch-* commits in the existing
# candidate repository (no default-branch registration, never in the candidate tree handed
# for STATIC REVIEW). KVM-only, fail-closed, no TCG. Public standard runner only ($0).
# Every run URL and outcome is preserved and reported. Fail-closed: the first step of every
# job aborts the run unless github.run_attempt == 1 AND github.ref is under refs/heads/p3-scratch-;
# force-pushes are rejected. Every GitHub action is pinned to a full-length commit SHA.
'''

BLOCK_FETCH_TESTS = r'''      - name: NON_CERTIFYING_SCRATCH fetch_locked helper negative tests (F6)
        run: |
          set -euo pipefail
          cd docs/verified-architecture-phase2-v3/provisioning/p3/rehearsal
          T=/tmp/$PREFIX-fetchtest; rm -rf "$T"; mkdir -p "$T"
          printf 'indexbytes' > "$T/good.bin"
          GOODSHA=$(sha256sum "$T/good.bin" | cut -d' ' -f1)
          # case 0 (D14-1): the real caller import path must resolve (a hyphenated
          # module name dies here named, never as a bare ModuleNotFoundError)
          python3 -c "import sys, os; sys.path.insert(0, os.getcwd()); from fetch_locked import fetch_locked; print('IMPORT_PATH_OK')" || { echo "E_FETCHTEST import path broken (D14-1)"; exit 97; }
          python3 - "$T" <<'PYT' &
          import http.server, sys, os
          T = sys.argv[1]
          counts = {"good": 0}
          class H(http.server.BaseHTTPRequestHandler):
              def do_GET(self):
                  if self.path == "/good":
                      counts["good"] += 1
                      if counts["good"] < 3:
                          self.send_error(500); return
                      b = open(os.path.join(T, "good.bin"), "rb").read()
                      self.send_response(200); self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
                  elif self.path == "/wrongsha":
                      b = b"wrong-bytes"
                      self.send_response(200); self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
                  elif self.path == "/bad":
                      self.send_error(500)
                  else:
                      self.send_error(404)
              def log_message(self, *a): pass
          http.server.ThreadingHTTPServer(("127.0.0.1", 18099), H).serve_forever()
          PYT
          SRV=$!
          trap 'kill $SRV 2>/dev/null || true' EXIT
          sleep 1
          B=http://127.0.0.1:18099
          # case 1: transient 500,500 then bytes -> success on attempt 3
          python3 fetch_locked.py "$B/good" case1 "$T/c1.bin" "$GOODSHA" > "$T/c1.log" 2>&1 \
            || { echo "E_FETCHTEST case1 transient-then-success failed"; cat "$T/c1.log"; exit 97; }
          [ "$(grep -c 'fetch attempt' "$T/c1.log")" = "3" ] \
            || { echo "E_FETCHTEST case1 expected 3 attempt lines"; cat "$T/c1.log"; exit 97; }
          cmp "$T/good.bin" "$T/c1.bin" || { echo "E_FETCHTEST case1 bytes differ"; exit 97; }
          # case 2 (F6 core): wrong sha -> named mismatch on attempt 1, ZERO retry lines
          rc=0
          python3 fetch_locked.py "$B/wrongsha" case2 "$T/c2.bin" "$GOODSHA" > "$T/c2.log" 2>&1 || rc=$?
          [ "$rc" = "52" ] || { echo "E_FETCHTEST case2 expected exit 52, got $rc"; cat "$T/c2.log"; exit 97; }
          grep -q "E_LOCKGEN_INDEX_MISMATCH" "$T/c2.log" || { echo "E_FETCHTEST case2 not named"; cat "$T/c2.log"; exit 97; }
          [ "$(grep -c 'fetch attempt' "$T/c2.log")" = "1" ] || { echo "E_FETCHTEST case2 retried a mismatch"; cat "$T/c2.log"; exit 97; }
          # case 3: non-429 4xx -> E_STAGE_FETCH_HTTP 404 exit 54, attempt 1 only
          rc=0
          python3 fetch_locked.py "$B/nope" case3 "$T/c3.bin" "$GOODSHA" > "$T/c3.log" 2>&1 || rc=$?
          [ "$rc" = "54" ] || { echo "E_FETCHTEST case3 expected exit 54, got $rc"; cat "$T/c3.log"; exit 97; }
          grep -q "E_STAGE_FETCH_HTTP 404" "$T/c3.log" || { echo "E_FETCHTEST case3 not named"; cat "$T/c3.log"; exit 97; }
          [ "$(grep -c 'fetch attempt' "$T/c3.log")" = "1" ] || { echo "E_FETCHTEST case3 retried a 404"; cat "$T/c3.log"; exit 97; }
          # case 4: always-500 -> 3 attempts then E_STAGE_FETCH_EXHAUSTED exit 53
          rc=0
          python3 fetch_locked.py "$B/bad" case4 "$T/c4.bin" "$GOODSHA" > "$T/c4.log" 2>&1 || rc=$?
          [ "$rc" = "53" ] || { echo "E_FETCHTEST case4 expected exit 53, got $rc"; cat "$T/c4.log"; exit 97; }
          grep -q "E_STAGE_FETCH_EXHAUSTED case4" "$T/c4.log" || { echo "E_FETCHTEST case4 not named"; cat "$T/c4.log"; exit 97; }
          [ "$(grep -c 'fetch attempt' "$T/c4.log")" = "3" ] || { echo "E_FETCHTEST case4 expected 3 attempts"; cat "$T/c4.log"; exit 97; }
          echo "FETCH_LOCKED_HELPER_TESTS_OK case1=transient-recover case2=wrong-sha-first-attempt case3=404-immediate case4=exhausted"
'''

BLOCK_PF = r'''
      - name: NON_CERTIFYING_SCRATCH PF prerequisite build-success gate (peer run-12)
        id: pf-prereq
        run: echo "ok=true" >> "$GITHUB_OUTPUT"
      - name: NON_CERTIFYING_SCRATCH planted-fault PF-1 freemark gate must-show (peer condition 4)
        id: pf1
        if: "!cancelled() && steps.pf-prereq.outputs.ok == 'true'"
        run: |
          set -euo pipefail
          trap '_rc=$?; echo "E_BASH_ERRTRAP pf1 line $LINENO rc=$_rc cmd: $BASH_COMMAND" >&2; exit 97' ERR
          cd docs/verified-architecture-phase2-v3/provisioning/p3/rehearsal
          REH="$PWD"
          # peer run-12 shape (chosen option): NO PF-only knobs to the shared code/config.
          # Each PF wrapper recreates the ceremony's SAME relative cwd layout in its own
          # work dir and runs the UNCHANGED shared code against the committed config bytes.
          mkdir -p /tmp/$PREFIX-out
          export PATH="/tmp/$PREFIX-stage/shims:$PATH"
          PFD=/tmp/$PREFIX-out/NON_CERTIFYING_SCRATCH-pf1-dir
          PREPP=/tmp/$PREFIX-pfprep-1
          # K1 (peer run-12 K4): PF prep (which contains the throwaway private keys) lives
          # OUTSIDE the upload tree and is removed by this step's own EXIT trap. Absolute
          # rule: no *.key under any EVIDENCE_UPLOAD_PATHS entry.
          trap 'rm -rf "$PREPP"' EXIT
          PFWORK="$PFD/work"
          mkdir -p "$PFWORK/build-output/enroll-app" "$PFWORK/build-output/ovmf-debug"
          cp /tmp/$PREFIX-app-a/enroll-app.efi "$PFWORK/build-output/enroll-app/enroll-app.efi"
          [ "$(sha256sum "$PFWORK/build-output/enroll-app/enroll-app.efi" | cut -d' ' -f1)" = "dccc181800051a80df93b5ac2d280d3ff292d4193f7c223467e27df765e1dbbb" ] \
            || { echo "E_PF_SETUP enroll-app sha mismatch after copy" | tee -a "$PFD/prep.log"; exit 97; }
          cp /tmp/$PREFIX-ovmf-a/OVMF_CODE.fd "$PFWORK/build-output/ovmf-debug/OVMF_CODE.fd"
          [ "$(sha256sum "$PFWORK/build-output/ovmf-debug/OVMF_CODE.fd" | cut -d' ' -f1)" = "fc150336fce10eb5508fa440cdf7300622c8c3ac71f2fbe10a0731422b9cef24" ] \
            || { echo "E_PF_SETUP OVMF_CODE sha mismatch after copy" | tee -a "$PFD/prep.log"; exit 97; }
          cp config.json "$PFWORK/config.json"
          "$REH/enroll-prep.sh" /tmp/$PREFIX-stage/root "$PREPP" "$REH/evidence/c5-signing-cert.der" "/tmp/$PREFIX-inrun/c-sign/fixtures/C5-HOSTILE-FIXTURE.cer" \
            > "$PFD/prep.log" 2>&1 \
            || { echo "E_PF_PREP rc=$?" | tee -a "$PFD/prep.log"; cat "$PFD/prep.log"; exit 97; }
          _rc=0
          ( cd "$PFWORK" && sudo env PREFIX="$PREFIX" ALLOWED_PREFIX="$ALLOWED_PREFIX" PATH="$PATH" ENROLL_PLANTED_FAULT=freemark \
            "$REH/rehearsal-enroll.sh" config.json "$PREPP" "$PFD/vars.fd" "$PFD/evidence" ) \
            > "$PFD/pf1.log" 2>&1 || _rc=$?
          cat "$PFD/pf1.log"
          grep -F "PLANTED FAULT ACTIVE: freemark" "$PFD/pf1.log" \
            || { echo "E_PF_NOT_INJECTED no PLANTED FAULT ACTIVE line" | tee -a "$PFD/pf1.log"; exit 97; }
          grep -F "planted fault injection confirmation:" "$PFD/pf1.log" \
            || { echo "E_PF_NOT_INJECTED no before/after injection confirmation" | tee -a "$PFD/pf1.log"; exit 97; }
          # strictness (peer run-12): provable injection first, then exact exit + named gate
          # + diagnostic; every wrapper verdict lands IN the durable evidence log (tee -a).
          [ "$_rc" = "97" ] \
            || { echo "E_PF_GATE_NOT_FIRED expected exit 97, got $_rc" | tee -a "$PFD/pf1.log"; exit 97; }
          ! grep -F "E_BASH_ERRTRAP" "$PFD/pf1.log" \
            || { echo "E_PF_TRAP_MASKED E_BASH_ERRTRAP present - the named gate must be the failure" | tee -a "$PFD/pf1.log"; exit 97; }
          grep -F "E_ENROLL_FAT_INVALID" "$PFD/pf1.log" \
            || { echo "E_PF_GATE_WRONG_CODE" | tee -a "$PFD/pf1.log"; exit 97; }
          grep -F "Contains a free cluster" "$PFD/pf1.log" \
            || { echo "E_PF_GATE_WRONG_DIAG" | tee -a "$PFD/pf1.log"; exit 97; }
          echo "PF_1_MUST_SHOW_OK injected free-marked-dir image died pre-boot with E_ENROLL_FAT_INVALID exit 97" | tee -a "$PFD/pf1.log"
          grep -F "PF_1_MUST_SHOW_OK" "$PFD/pf1.log" || { echo "E_PF_LOG_VERDICT_MISSING"; exit 97; }
      - name: NON_CERTIFYING_SCRATCH planted-fault PF-2 missingblob name-contract gate must-show (peer condition 4 + run-12 L2/L3)
        id: pf2
        if: "!cancelled() && steps.pf-prereq.outputs.ok == 'true'"
        run: |
          set -euo pipefail
          trap '_rc=$?; echo "E_BASH_ERRTRAP pf2 line $LINENO rc=$_rc cmd: $BASH_COMMAND" >&2; exit 97' ERR
          cd docs/verified-architecture-phase2-v3/provisioning/p3/rehearsal
          REH="$PWD"
          # peer run-12 shape (chosen option): NO PF-only knobs to the shared code/config.
          # Each PF wrapper recreates the ceremony's SAME relative cwd layout in its own
          # work dir and runs the UNCHANGED shared code against the committed config bytes.
          mkdir -p /tmp/$PREFIX-out
          export PATH="/tmp/$PREFIX-stage/shims:$PATH"
          PFD=/tmp/$PREFIX-out/NON_CERTIFYING_SCRATCH-pf2-dir
          PREPP=/tmp/$PREFIX-pfprep-2
          # K1 (peer run-12 K4): PF prep (which contains the throwaway private keys) lives
          # OUTSIDE the upload tree and is removed by this step's own EXIT trap. Absolute
          # rule: no *.key under any EVIDENCE_UPLOAD_PATHS entry.
          trap 'rm -rf "$PREPP"' EXIT
          PFWORK="$PFD/work"
          mkdir -p "$PFWORK/build-output/enroll-app" "$PFWORK/build-output/ovmf-debug"
          cp /tmp/$PREFIX-app-a/enroll-app.efi "$PFWORK/build-output/enroll-app/enroll-app.efi"
          [ "$(sha256sum "$PFWORK/build-output/enroll-app/enroll-app.efi" | cut -d' ' -f1)" = "dccc181800051a80df93b5ac2d280d3ff292d4193f7c223467e27df765e1dbbb" ] \
            || { echo "E_PF_SETUP enroll-app sha mismatch after copy" | tee -a "$PFD/prep.log"; exit 97; }
          cp /tmp/$PREFIX-ovmf-a/OVMF_CODE.fd "$PFWORK/build-output/ovmf-debug/OVMF_CODE.fd"
          [ "$(sha256sum "$PFWORK/build-output/ovmf-debug/OVMF_CODE.fd" | cut -d' ' -f1)" = "fc150336fce10eb5508fa440cdf7300622c8c3ac71f2fbe10a0731422b9cef24" ] \
            || { echo "E_PF_SETUP OVMF_CODE sha mismatch after copy" | tee -a "$PFD/prep.log"; exit 97; }
          cp config.json "$PFWORK/config.json"
          "$REH/enroll-prep.sh" /tmp/$PREFIX-stage/root "$PREPP" "$REH/evidence/c5-signing-cert.der" "/tmp/$PREFIX-inrun/c-sign/fixtures/C5-HOSTILE-FIXTURE.cer" \
            > "$PFD/prep.log" 2>&1 \
            || { echo "E_PF_PREP rc=$?" | tee -a "$PFD/prep.log"; cat "$PFD/prep.log"; exit 97; }
          _rc=0
          ( cd "$PFWORK" && sudo env PREFIX="$PREFIX" ALLOWED_PREFIX="$ALLOWED_PREFIX" PATH="$PATH" ENROLL_PLANTED_FAULT=missingblob \
            "$REH/rehearsal-enroll.sh" config.json "$PREPP" "$PFD/vars.fd" "$PFD/evidence" ) \
            > "$PFD/pf2.log" 2>&1 || _rc=$?
          cat "$PFD/pf2.log"
          grep -F "PLANTED FAULT ACTIVE: missingblob" "$PFD/pf2.log" \
            || { echo "E_PF_NOT_INJECTED no PLANTED FAULT ACTIVE line" | tee -a "$PFD/pf2.log"; exit 97; }
          grep -F "planted fault injection confirmation:" "$PFD/pf2.log" \
            || { echo "E_PF_NOT_INJECTED no before/after injection confirmation" | tee -a "$PFD/pf2.log"; exit 97; }
          # strictness (peer run-12): fsck-silent, then exact exit + the run-12 name-contract
          # gate code + reader diagnostic; every verdict lands IN the durable evidence log.
          grep -F "enroll-fat-fsck.log (fsck.vfat -n rc=0)" "$PFD/pf2.log" \
            || { echo "E_PF_GATE_WRONG_DIAG fault was not fsck-silent" | tee -a "$PFD/pf2.log"; exit 97; }
          [ "$_rc" = "97" ] \
            || { echo "E_PF_GATE_NOT_FIRED expected exit 97, got $_rc" | tee -a "$PFD/pf2.log"; exit 97; }
          ! grep -F "E_BASH_ERRTRAP" "$PFD/pf2.log" \
            || { echo "E_PF_TRAP_MASKED E_BASH_ERRTRAP present - the named gate must be the failure" | tee -a "$PFD/pf2.log"; exit 97; }
          grep -F "E_ENROLL_FAT_NAME_CONTRACT" "$PFD/pf2.log" \
            || { echo "E_PF_GATE_WRONG_CODE" | tee -a "$PFD/pf2.log"; exit 97; }
          grep -F "contract name 'pk.auth' has no valid LFN entry" "$PFD/pf2.log" \
            || { echo "E_PF_GATE_WRONG_DIAG" | tee -a "$PFD/pf2.log"; exit 97; }
          echo "PF_2_MUST_SHOW_OK injected fsck-silent missing-blob image died pre-boot with E_ENROLL_FAT_NAME_CONTRACT exit 97" | tee -a "$PFD/pf2.log"
          grep -F "PF_2_MUST_SHOW_OK" "$PFD/pf2.log" || { echo "E_PF_LOG_VERDICT_MISSING"; exit 97; }
      - name: NON_CERTIFYING_SCRATCH planted-fault PF-4 missing-needed-file named-97 must-show (peer run-11/run-12 C1/C2)
        id: pf4
        if: "!cancelled() && steps.pf-prereq.outputs.ok == 'true'"
        run: |
          set -euo pipefail
          trap '_rc=$?; echo "E_BASH_ERRTRAP pf4 line $LINENO rc=$_rc cmd: $BASH_COMMAND" >&2; exit 97' ERR
          cd docs/verified-architecture-phase2-v3/provisioning/p3/rehearsal
          REH="$PWD"
          # peer run-12 shape (chosen option): NO PF-only knobs to the shared code/config.
          # Each PF wrapper recreates the ceremony's SAME relative cwd layout in its own
          # work dir and runs the UNCHANGED shared code against the committed config bytes.
          mkdir -p /tmp/$PREFIX-out
          export PATH="/tmp/$PREFIX-stage/shims:$PATH"
          PFD=/tmp/$PREFIX-out/NON_CERTIFYING_SCRATCH-pf4-dir
          PREPP=/tmp/$PREFIX-pfprep-4
          # K1 (peer run-12 K4): PF prep (which contains the throwaway private keys) lives
          # OUTSIDE the upload tree and is removed by this step's own EXIT trap. Absolute
          # rule: no *.key under any EVIDENCE_UPLOAD_PATHS entry.
          trap 'rm -rf "$PREPP"' EXIT
          PFWORK="$PFD/work"
          mkdir -p "$PFWORK/build-output/enroll-app" "$PFWORK/build-output/ovmf-debug"
          cp /tmp/$PREFIX-app-a/enroll-app.efi "$PFWORK/build-output/enroll-app/enroll-app.efi"
          [ "$(sha256sum "$PFWORK/build-output/enroll-app/enroll-app.efi" | cut -d' ' -f1)" = "dccc181800051a80df93b5ac2d280d3ff292d4193f7c223467e27df765e1dbbb" ] \
            || { echo "E_PF_SETUP enroll-app sha mismatch after copy" | tee -a "$PFD/prep.log"; exit 97; }
          cp /tmp/$PREFIX-ovmf-a/OVMF_CODE.fd "$PFWORK/build-output/ovmf-debug/OVMF_CODE.fd"
          [ "$(sha256sum "$PFWORK/build-output/ovmf-debug/OVMF_CODE.fd" | cut -d' ' -f1)" = "fc150336fce10eb5508fa440cdf7300622c8c3ac71f2fbe10a0731422b9cef24" ] \
            || { echo "E_PF_SETUP OVMF_CODE sha mismatch after copy" | tee -a "$PFD/prep.log"; exit 97; }
          cp config.json "$PFWORK/config.json"
          "$REH/enroll-prep.sh" /tmp/$PREFIX-stage/root "$PREPP" "$REH/evidence/c5-signing-cert.der" "/tmp/$PREFIX-inrun/c-sign/fixtures/C5-HOSTILE-FIXTURE.cer" \
            > "$PFD/prep.log" 2>&1 \
            || { echo "E_PF_PREP rc=$?" | tee -a "$PFD/prep.log"; cat "$PFD/prep.log"; exit 97; }
          # PF-4 planted condition: remove the pristine OVMF_VARS needed file; restore
          # BEFORE asserting so a failed must-show can never strand the ceremony.
          # peer #16 D15-2: canonical-config path resolution via the ONE shared script;
          # no remap literal in any derived workflow. Assert lane + existence.
          PRISTINE=$(python3 -c "import json;print(json.load(open('config.json'))['ovmf_vars_pristine'])")
          PRISTINE=$("$REH/resolve-lane-path.sh" "$PRISTINE" "$PREFIX")             || { echo "E_PF_SETUP resolve-lane-path rejected the config pristine path"; exit 97; }
          case "$PRISTINE" in /tmp/$PREFIX-*) ;; *) echo "E_PF_SETUP resolved path outside lane: $PRISTINE"; exit 97;; esac
          [ -f "$PRISTINE" ] || { echo "E_PF_SETUP pristine vars not at $PRISTINE"; exit 97; }
          sudo cp -a "$PRISTINE" "$PFD/pristine-vars.saved"
          SAVED_SHA=$(sudo sha256sum "$PFD/pristine-vars.saved" | cut -d' ' -f1)
          sudo rm "$PRISTINE"
          echo "PF-4 planted condition: removed $PRISTINE (saved sha256=$SAVED_SHA)" | tee -a "$PFD/prep.log"
          _rc=0
          ( cd "$PFWORK" && sudo env PREFIX="$PREFIX" ALLOWED_PREFIX="$ALLOWED_PREFIX" PATH="$PATH"  \
            "$REH/rehearsal-enroll.sh" config.json "$PREPP" "$PFD/vars.fd" "$PFD/evidence" ) \
            > "$PFD/pf4.log" 2>&1 || _rc=$?
          cat "$PFD/pf4.log"
          # C1 (peer run-12): the planted-condition line must land IN the durable pf4.log
          echo "PF-4 planted condition: removed $PRISTINE (saved sha256=$SAVED_SHA)" | tee -a "$PFD/pf4.log"
          sudo cp -a "$PFD/pristine-vars.saved" "$PRISTINE"
          [ "$(sudo sha256sum "$PRISTINE" | cut -d' ' -f1)" = "$SAVED_SHA" ] \
            || { echo "E_PF_RESTORE_DRIFT pristine vars not restored byte-identical" | tee -a "$PFD/pf4.log"; exit 97; }
          # C2 (peer run-12): the restore is verified against the FROZEN pristine sha,
          # not merely against the saved copy.
          [ "$(sudo sha256sum "$PRISTINE" | cut -d' ' -f1)" = "5d2ac383371b408398accee7ec27c8c09ea5b74a0de0ceea6513388b15be5d1e" ] \
            || { echo "E_PF_RESTORE_DRIFT restored vars != frozen pristine sha 5d2ac383..." | tee -a "$PFD/pf4.log"; exit 97; }
          # C1 + D13-3 (peer run-12/#13 review): PF-4's correct death is EXACTLY the ERR trap
          # at the pristine-VARS cp line, ONE fixed string ($BASH_COMMAND carries the command
          # text unexpanded). B1 (#16-prime): the line number is DERIVED AT RUN TIME from
          # the committed script - count==1 via grep -c, exact-content assert, no
          # hand-typed pin. A missing needed file has no narrower named gate, and
          # E_ENROLL_PID_MISSING must NOT appear.
          CPN=$(grep -c 'cp "$PRISTINE" "$EVD/vars.fd"' "$REH/rehearsal-enroll.sh")
          CPLINE=$(grep -n 'cp "$PRISTINE" "$EVD/vars.fd"' "$REH/rehearsal-enroll.sh")
          [ "$CPN" = "1" ] \
            || { echo "E_PF_SETUP cp pin not unique in rehearsal-enroll.sh (count=$CPN)" | tee -a "$PFD/pf4.log"; exit 97; }
          CPLINENO=${CPLINE%%:*}
          [ "${CPLINE#*:}" = 'cp "$PRISTINE" "$EVD/vars.fd"' ] \
            || { echo "E_PF_SETUP cp line content drift: $CPLINE" | tee -a "$PFD/pf4.log"; exit 97; }
          [ "$_rc" = "97" ] \
            || { echo "E_PF_GATE_NOT_FIRED expected exit 97, got $_rc" | tee -a "$PFD/pf4.log"; exit 97; }
          grep -F 'E_BASH_ERRTRAP rehearsal-enroll.sh line '"$CPLINENO"' rc=1 cmd: cp "$PRISTINE" "$EVD/vars.fd"' "$PFD/pf4.log" \
            || { echo "E_PF_NAMED97_WRONG_CODE expected the exact line-$CPLINENO ERRTRAP string" | tee -a "$PFD/pf4.log"; exit 97; }
          ! grep -F "E_ENROLL_PID_MISSING" "$PFD/pf4.log" \
            || { echo "E_PF_NAMED97_STALE_CODE E_ENROLL_PID_MISSING must not appear" | tee -a "$PFD/pf4.log"; exit 97; }
          grep -F "PF-4 planted condition:" "$PFD/pf4.log" \
            || { echo "E_PF_NOT_INJECTED planted-condition line missing from pf4.log" | tee -a "$PFD/pf4.log"; exit 97; }
          echo "PF_4_MUST_SHOW_OK missing needed file died with the exact line-$CPLINENO ERRTRAP string, exit 97" | tee -a "$PFD/pf4.log"
          grep -F "PF_4_MUST_SHOW_OK" "$PFD/pf4.log" || { echo "E_PF_LOG_VERDICT_MISSING"; exit 97; }
      - name: NON_CERTIFYING_SCRATCH planted-fault PF-5 nolfn name-contract gate must-show (peer run-12 L4)
        id: pf5
        if: "!cancelled() && steps.pf-prereq.outputs.ok == 'true'"
        run: |
          set -euo pipefail
          trap '_rc=$?; echo "E_BASH_ERRTRAP pf5 line $LINENO rc=$_rc cmd: $BASH_COMMAND" >&2; exit 97' ERR
          cd docs/verified-architecture-phase2-v3/provisioning/p3/rehearsal
          REH="$PWD"
          # peer run-12 shape (chosen option): NO PF-only knobs to the shared code/config.
          # Each PF wrapper recreates the ceremony's SAME relative cwd layout in its own
          # work dir and runs the UNCHANGED shared code against the committed config bytes.
          mkdir -p /tmp/$PREFIX-out
          export PATH="/tmp/$PREFIX-stage/shims:$PATH"
          PFD=/tmp/$PREFIX-out/NON_CERTIFYING_SCRATCH-pf5-dir
          PREPP=/tmp/$PREFIX-pfprep-5
          # K1 (peer run-12 K4): PF prep (which contains the throwaway private keys) lives
          # OUTSIDE the upload tree and is removed by this step's own EXIT trap. Absolute
          # rule: no *.key under any EVIDENCE_UPLOAD_PATHS entry.
          trap 'rm -rf "$PREPP"' EXIT
          PFWORK="$PFD/work"
          mkdir -p "$PFWORK/build-output/enroll-app" "$PFWORK/build-output/ovmf-debug"
          cp /tmp/$PREFIX-app-a/enroll-app.efi "$PFWORK/build-output/enroll-app/enroll-app.efi"
          [ "$(sha256sum "$PFWORK/build-output/enroll-app/enroll-app.efi" | cut -d' ' -f1)" = "dccc181800051a80df93b5ac2d280d3ff292d4193f7c223467e27df765e1dbbb" ] \
            || { echo "E_PF_SETUP enroll-app sha mismatch after copy" | tee -a "$PFD/prep.log"; exit 97; }
          cp /tmp/$PREFIX-ovmf-a/OVMF_CODE.fd "$PFWORK/build-output/ovmf-debug/OVMF_CODE.fd"
          [ "$(sha256sum "$PFWORK/build-output/ovmf-debug/OVMF_CODE.fd" | cut -d' ' -f1)" = "fc150336fce10eb5508fa440cdf7300622c8c3ac71f2fbe10a0731422b9cef24" ] \
            || { echo "E_PF_SETUP OVMF_CODE sha mismatch after copy" | tee -a "$PFD/prep.log"; exit 97; }
          cp config.json "$PFWORK/config.json"
          "$REH/enroll-prep.sh" /tmp/$PREFIX-stage/root "$PREPP" "$REH/evidence/c5-signing-cert.der" "/tmp/$PREFIX-inrun/c-sign/fixtures/C5-HOSTILE-FIXTURE.cer" \
            > "$PFD/prep.log" 2>&1 \
            || { echo "E_PF_PREP rc=$?" | tee -a "$PFD/prep.log"; cat "$PFD/prep.log"; exit 97; }
          _rc=0
          ( cd "$PFWORK" && sudo env PREFIX="$PREFIX" ALLOWED_PREFIX="$ALLOWED_PREFIX" PATH="$PATH" ENROLL_PLANTED_FAULT=nolfn \
            "$REH/rehearsal-enroll.sh" config.json "$PREPP" "$PFD/vars.fd" "$PFD/evidence" ) \
            > "$PFD/pf5.log" 2>&1 || _rc=$?
          cat "$PFD/pf5.log"
          grep -F "PLANTED FAULT ACTIVE: nolfn" "$PFD/pf5.log" \
            || { echo "E_PF_NOT_INJECTED no PLANTED FAULT ACTIVE line" | tee -a "$PFD/pf5.log"; exit 97; }
          grep -F "planted fault injection confirmation:" "$PFD/pf5.log" \
            || { echo "E_PF_NOT_INJECTED no before/after injection confirmation" | tee -a "$PFD/pf5.log"; exit 97; }
          # L4 must-show: the run-12 8.3-only layout is fsck-SILENT and must die pre-boot on
          # the name-contract reader with E_ENROLL_FAT_NAME_CONTRACT, never at boot.
          grep -F "enroll-fat-fsck.log (fsck.vfat -n rc=0)" "$PFD/pf5.log" \
            || { echo "E_PF_GATE_WRONG_DIAG fault was not fsck-silent" | tee -a "$PFD/pf5.log"; exit 97; }
          [ "$_rc" = "97" ] \
            || { echo "E_PF_GATE_NOT_FIRED expected exit 97, got $_rc" | tee -a "$PFD/pf5.log"; exit 97; }
          ! grep -F "E_BASH_ERRTRAP" "$PFD/pf5.log" \
            || { echo "E_PF_TRAP_MASKED E_BASH_ERRTRAP present - the named gate must be the failure" | tee -a "$PFD/pf5.log"; exit 97; }
          grep -F "E_ENROLL_FAT_NAME_CONTRACT" "$PFD/pf5.log" \
            || { echo "E_PF_GATE_WRONG_CODE" | tee -a "$PFD/pf5.log"; exit 97; }
          grep -F "contract name 'db.auth' has no valid LFN entry" "$PFD/pf5.log" \
            || { echo "E_PF_GATE_WRONG_DIAG" | tee -a "$PFD/pf5.log"; exit 97; }
          echo "PF_5_MUST_SHOW_OK injected fsck-silent 8.3-only image died pre-boot with E_ENROLL_FAT_NAME_CONTRACT exit 97" | tee -a "$PFD/pf5.log"
          grep -F "PF_5_MUST_SHOW_OK" "$PFD/pf5.log" || { echo "E_PF_LOG_VERDICT_MISSING"; exit 97; }
'''

CEREMONY_IF = r'''        if: "!cancelled() && steps.pf-prereq.outputs.ok == 'true' && steps.pf1.outcome == 'success' && steps.pf2.outcome == 'success' && steps.pf4.outcome == 'success' && steps.pf5.outcome == 'success'"
'''

BLOCK_PF6 = r'''      - name: NON_CERTIFYING_SCRATCH planted-fault PF-6 badpred predicate-fail must-show (peer run-13 D13-1)
        id: pf6
        if: "!cancelled() && steps.pf-prereq.outputs.ok == 'true'"
        run: |
          set -euo pipefail
          trap '_rc=$?; echo "E_BASH_ERRTRAP pf6 line $LINENO rc=$_rc cmd: $BASH_COMMAND" >&2; exit 97' ERR
          cd docs/verified-architecture-phase2-v3/provisioning/p3/rehearsal
          REH="$PWD"
          # peer run-12 shape (chosen option): NO PF-only knobs to the shared code/config.
          # Each PF wrapper recreates the ceremony's SAME relative cwd layout in its own
          # work dir and runs the UNCHANGED shared code against the committed config bytes.
          mkdir -p /tmp/$PREFIX-out
          export PATH="/tmp/$PREFIX-stage/shims:$PATH"
          PFD=/tmp/$PREFIX-out/NON_CERTIFYING_SCRATCH-pf6-dir
          PREPP=/tmp/$PREFIX-pfprep-6
          # K1 (peer run-12 K4): PF prep (which contains the throwaway private keys) lives
          # OUTSIDE the upload tree and is removed by this step's own EXIT trap. Absolute
          # rule: no *.key under any EVIDENCE_UPLOAD_PATHS entry.
          trap 'rm -rf "$PREPP"' EXIT
          PFWORK="$PFD/work"
          mkdir -p "$PFWORK/build-output/enroll-app" "$PFWORK/build-output/ovmf-debug"
          cp /tmp/$PREFIX-app-a/enroll-app.efi "$PFWORK/build-output/enroll-app/enroll-app.efi"
          [ "$(sha256sum "$PFWORK/build-output/enroll-app/enroll-app.efi" | cut -d' ' -f1)" = "dccc181800051a80df93b5ac2d280d3ff292d4193f7c223467e27df765e1dbbb" ] \
            || { echo "E_PF_SETUP enroll-app sha mismatch after copy" | tee -a "$PFD/prep.log"; exit 97; }
          cp /tmp/$PREFIX-ovmf-a/OVMF_CODE.fd "$PFWORK/build-output/ovmf-debug/OVMF_CODE.fd"
          [ "$(sha256sum "$PFWORK/build-output/ovmf-debug/OVMF_CODE.fd" | cut -d' ' -f1)" = "fc150336fce10eb5508fa440cdf7300622c8c3ac71f2fbe10a0731422b9cef24" ] \
            || { echo "E_PF_SETUP OVMF_CODE sha mismatch after copy" | tee -a "$PFD/prep.log"; exit 97; }
          cp config.json "$PFWORK/config.json"
          "$REH/enroll-prep.sh" /tmp/$PREFIX-stage/root "$PREPP" "$REH/evidence/c5-signing-cert.der" "/tmp/$PREFIX-inrun/c-sign/fixtures/C5-HOSTILE-FIXTURE.cer" \
            > "$PFD/prep.log" 2>&1 \
            || { echo "E_PF_PREP rc=$?" | tee -a "$PFD/prep.log"; cat "$PFD/prep.log"; exit 97; }
          _rc=0
          ( cd "$PFWORK" && sudo env PREFIX="$PREFIX" ALLOWED_PREFIX="$ALLOWED_PREFIX" PATH="$PATH" ENROLL_PLANTED_FAULT=badpred \
            "$REH/rehearsal-enroll.sh" config.json "$PREPP" "$PFD/vars.fd" "$PFD/evidence" ) \
            > "$PFD/pf6.log" 2>&1 || _rc=$?
          cat "$PFD/pf6.log"
          # D14-2: a guest that never produced a valid ENROLL.TXT is a NAMED
          # precondition (exit 93), reported distinctly from "gate did not fire".
          if grep -F "E_PF_BADPRED_PRECONDITION" "$PFD/pf6.log" > /dev/null; then
            echo "PF-6 NOT EXERCISABLE: guest produced no valid ENROLL.TXT (E_PF_BADPRED_PRECONDITION) - not a gate miss" | tee -a "$PFD/pf6.log"
            exit 97
          fi
          # D13-1 must-show: the predicate MUST reject the flipped ENROLL.TXT and the wrapper
          # MUST die with the predicate's OWN named code - never E_BASH_ERRTRAP (the #12 and
          # #13-tee masking shapes). The guest itself passes; only the evidence is poisoned.
          grep -F "PLANTED FAULT ACTIVE: badpred" "$PFD/pf6.log" \
            || { echo "E_PF_NOT_INJECTED no PLANTED FAULT ACTIVE line" | tee -a "$PFD/pf6.log"; exit 97; }
          grep -F "planted fault injection confirmation: ENROLL.TXT sha256" "$PFD/pf6.log" \
            || { echo "E_PF_NOT_INJECTED no before/after injection confirmation" | tee -a "$PFD/pf6.log"; exit 97; }
          grep -F "E_ENROLL_SET_DB" "$PFD/pf6.log" \
            || { echo "E_PF_GATE_WRONG_DIAG predicate did not reject SET_DB_STATUS=1" | tee -a "$PFD/pf6.log"; exit 97; }
          [ "$_rc" = "97" ] \
            || { echo "E_PF_GATE_NOT_FIRED expected exit 97, got $_rc" | tee -a "$PFD/pf6.log"; exit 97; }
          grep -F "E_ENROLL_PREDICATE_FAIL" "$PFD/pf6.log" \
            || { echo "E_PF_GATE_WRONG_CODE predicate failure must be named" | tee -a "$PFD/pf6.log"; exit 97; }
          # peer run-36017957182 ruling: PF-6's asserted diagnostic must be its PLANTED
          # predicate fault, never the HOSTILE_UNSET side effect - the wiring must be live.
          ! grep -F "E_HOSTILE_CERT_UNSET" "$PFD/pf6.log" \
            || { echo "E_PF6_STALE_CODE E_HOSTILE_CERT_UNSET must not appear" | tee -a "$PFD/pf6.log"; exit 97; }
          ! grep -F "E_BASH_ERRTRAP" "$PFD/pf6.log" \
            || { echo "E_PF_TRAP_MASKED E_BASH_ERRTRAP present - D13-1 regression" | tee -a "$PFD/pf6.log"; exit 97; }
          echo "PF_6_MUST_SHOW_OK predicate-failing evidence died with E_ENROLL_PREDICATE_FAIL exit 97, no E_BASH_ERRTRAP" | tee -a "$PFD/pf6.log"
          grep -F "PF_6_MUST_SHOW_OK" "$PFD/pf6.log" || { echo "E_PF_LOG_VERDICT_MISSING"; exit 97; }
'''

BLOCK_TIE_NEGS = r'''      - name: NON_CERTIFYING_SCRATCH planted-fault F3 out-of-set vars_template gate must-show (peer #17 F3)
        if: ${{ !cancelled() }}
        run: |
          set -euo pipefail
          trap '_rc=$?; echo "E_BASH_ERRTRAP f3negs line $LINENO rc=$_rc cmd: $BASH_COMMAND" >&2; exit 97' ERR
          cd docs/verified-architecture-phase2-v3/provisioning/p3/rehearsal
          [ -f config.json ] || { echo "E_F3_NEG_INPUT committed config.json absent"; exit 97; }
          [ -f lane_resolve.py ] || { echo "E_F3_NEG_INPUT committed lane_resolve.py absent"; exit 97; }
          T=/tmp/$PREFIX-pf/f3gate; rm -rf "$T"; mkdir -p "$T"
          # the planted input is DERIVED from the pinned config.json (never a canonical
          # literal in this YAML): R1's real vars_template with the inner enrollment
          # component staled to an old dir name - resolution succeeds, membership fails.
          python3 - config.json "$T/planted.json" <<'PYT'
          import json, sys
          c = json.load(open(sys.argv[1]))
          case = c["cases"][0]
          case["vars_template"] = case["vars_template"].replace("enroll-sole", "enroll-widened-old")
          c["cases"] = [case]
          json.dump(c, open(sys.argv[2], "w"), indent=1, sort_keys=True)
          PYT
          _rc=0
          PREFIX="$PREFIX" ALLOWED_PREFIX="$ALLOWED_PREFIX" python3 ./lane_resolve.py gate "$T/planted.json" "$T/out" > "$T/f3.log" 2>&1 || _rc=$?
          [ "$_rc" = "97" ] || { echo "E_F3_GATE_NOT_FIRED rc=$_rc expected 97"; cat "$T/f3.log"; exit 97; }
          grep -F "E_VARS_TEMPLATE_GATE" "$T/f3.log" || { echo "E_F3_NEG_CODE_ABSENT named gate code missing"; cat "$T/f3.log"; exit 97; }
          echo "F3_GATE_MUST_SHOW_OK planted out-of-set vars_template died named (E_VARS_TEMPLATE_GATE rc=97)"
      - name: NON_CERTIFYING_SCRATCH planted-fault F6 byte-flip enroll-tie must-show (peer #17 F6)
        if: ${{ !cancelled() }}
        run: |
          set -euo pipefail
          trap '_rc=$?; echo "E_BASH_ERRTRAP f6 line $LINENO rc=$_rc cmd: $BASH_COMMAND" >&2; exit 97' ERR
          cd docs/verified-architecture-phase2-v3/provisioning/p3/rehearsal
          SRC=/tmp/$PREFIX-out/$PREFIX-enroll-sole
          [ -f "$SRC/vars-enrolled.fd" ] || { echo "E_F6_NEG_INPUT sole vars-enrolled.fd absent"; exit 97; }
          [ -f "$SRC/evidence/enroll-predicate.json" ] || { echo "E_F6_NEG_INPUT sole enroll-predicate.json absent"; exit 97; }
          T=/tmp/$PREFIX-pf/f6tie; rm -rf "$T"; mkdir -p "$T/$PREFIX-enroll-sole/evidence"
          cp "$SRC/evidence/enroll-predicate.json" "$T/$PREFIX-enroll-sole/evidence/enroll-predicate.json"
          cp "$SRC/vars-enrolled.fd" "$T/$PREFIX-enroll-sole/vars-enrolled.fd"
          # flip one byte in the planted template copy: the predicate record now names
          # different bytes, so the F6 tie gate must kill the case named BEFORE any guest.
          python3 - "$T/$PREFIX-enroll-sole/vars-enrolled.fd" <<'PYT'
          import sys
          p = sys.argv[1]
          b = bytearray(open(p, "rb").read())
          b[0] ^= 1
          open(p, "wb").write(bytes(b))
          PYT
          python3 - config.json "$T" <<'PYT'
          import json, sys, os
          c = json.load(open(sys.argv[1])); T = sys.argv[2]
          case = c["cases"][0]
          case["id"] = "NON_CERTIFYING_SCRATCH-F6NEG-planted"
          case["vars_template"] = os.path.join(T, "NON_CERTIFYING_SCRATCH-enroll-sole", "vars-enrolled.fd")
          c["cases"] = [case]
          json.dump(c, open(os.path.join(T, "config.json"), "w"), indent=1, sort_keys=True)
          PYT
          _rc=0
          PREFIX="$PREFIX" ALLOWED_PREFIX="$ALLOWED_PREFIX" python3 ./rehearsal-harness.py "$T/config.json" "$T/cases" "$T" > "$T/f6.log" 2>&1 || _rc=$?
          [ "$_rc" = "90" ] || { echo "E_F6_TIE_NOT_FIRED rc=$_rc expected 90"; cat "$T/f6.log"; exit 97; }
          grep -F "E_VARS_TEMPLATE_ENROLL_TIE" "$T/f6.log" || { echo "E_F6_NEG_CODE_ABSENT named tie code missing"; cat "$T/f6.log"; exit 97; }
          echo "F6_TIE_MUST_SHOW_OK planted byte-flipped template died named (E_VARS_TEMPLATE_ENROLL_TIE rc=90)"
'''

BLOCK_BOOT_TARGET_NEG = r'''      - name: NON_CERTIFYING_SCRATCH planted-fault H3 boot-target gate must-show (peer run-35959397469 H3)
        if: ${{ !cancelled() }}
        run: |
          set -euo pipefail
          trap '_rc=$?; echo "E_BASH_ERRTRAP h3 line $LINENO rc=$_rc cmd: $BASH_COMMAND" >&2; exit 97' ERR
          cd docs/verified-architecture-phase2-v3/provisioning/p3/rehearsal
          SRC=/tmp/$PREFIX-out/$PREFIX-enroll-sole
          [ -f "$SRC/vars-enrolled.fd" ] || { echo "E_H3_NEG_INPUT sole vars-enrolled.fd absent"; exit 97; }
          [ -f "$SRC/evidence/enroll-predicate.json" ] || { echo "E_H3_NEG_INPUT sole enroll-predicate.json absent"; exit 97; }
          T=/tmp/$PREFIX-pf/h3boot; rm -rf "$T"; mkdir -p "$T"
          # ONE case copy with bootindex REMOVED: the harness copy drops ",bootindex=0"
          # from the ESP device (provable injection: exactly one removal). The case guest
          # then falls to the Internal Shell (run 35959397469 mechanics) and the H2 gate
          # MUST kill it named E_CASE_BOOT_TARGET - never a generic EXPECTATIONS_VIOLATED.
          cp rehearsal-harness.py "$T/rehearsal-harness.py"
          cp lane_resolve.py "$T/lane_resolve.py"
          cp config_schema.py "$T/config_schema.py"
          cp argv-freeze.json "$T/argv-freeze.json"
          [ "$(grep -c -F ',bootindex=0' "$T/rehearsal-harness.py")" = "1" ] || { echo "E_H3_NEG_INJECTION ESP-device bootindex count != 1 in harness source"; exit 97; }
          sed -i 's/,bootindex=0//' "$T/rehearsal-harness.py"
          [ "$(grep -c -F ',bootindex=0' "$T/rehearsal-harness.py")" = "0" ] || { echo "E_H3_NEG_INJECTION bootindex removal failed"; exit 97; }
          # peer run-36037280674 ruling (14): the freeze gate stays LIVE and PASSING on the
          # injected copy - never disabled, never bypassed. Plant a ONE-ENTRY argv-freeze.json:
          # the frozen R1 argv with EXACTLY ONE ',bootindex=0' removal (the injection itself)
          # and the $T work_root substituted in CANONICALIZED form (canonize_element maps the
          # executed $T paths to the canonical -pf/h3boot/cases root in BOTH lanes), then pin
          # THAT file's sha256 into the copy's ARGV_FREEZE_SHA256. Exact-count injection
          # assertions on BOTH mutations, same discipline as the bootindex check. The canonical
          # token is sourced from the copied lane_resolve.CANON - never a workflow literal
          # (E_DERIVED_CANON_LITERAL: the derived scratch workflow must carry zero).
          [ "$(grep -c -F ',bootindex=0' "$T/argv-freeze.json")" -ge "2" ] || { echo "E_H3_NEG_INJECTION planted-freeze precondition: committed freeze carries <2 bootindex flags"; exit 97; }
          python3 - "$T" <<'PYT' || { echo "E_H3_NEG_INJECTION planted-freeze generation failed"; exit 97; }
          import json, sys, hashlib
          T = sys.argv[1]
          sys.dont_write_bytecode = True
          sys.path.insert(0, T)
          from lane_resolve import CANON
          fz = json.load(open(T + "/argv-freeze.json"))
          r1 = [c for c in fz["cases"] if c["id"].endswith("-R1-historical-13309697-reject-control")]
          assert len(r1) == 1, "freeze R1 entry count %d != 1" % len(r1)
          e = r1[0]
          OLD = "/tmp/%s-out/%s-cases" % (CANON, CANON)
          NEW = "/tmp/%s-pf/h3boot/cases" % CANON
          argv, nsub = [], 0
          for el in e["argv"]:
              if OLD in el: argv.append(el.replace(OLD, NEW)); nsub += 1
              else: argv.append(el)
          assert nsub == 3, "case-dir substitution count %d != 3 (vars.fd, debugcon, pidfile)" % nsub
          assert sum(el.count(",bootindex=0") for el in argv) == 1, "bootindex count != 1 in freeze R1 argv"
          argv = [el.replace(",bootindex=0", "") for el in argv]
          assert sum(el.count(",bootindex=0") for el in argv) == 0, "bootindex removal from planted entry failed"
          e["argv"] = argv
          e["argv_sha256"] = hashlib.sha256("\0".join(argv).encode()).hexdigest()
          assert e["argv_sha256"] == hashlib.sha256("\0".join(e["argv"]).encode()).hexdigest()
          out = dict(fz); out["cases"] = [e]
          out["note"] = "H3 planted freeze (peer run-36037280674 ruling 14): single R1 entry - the frozen argv minus exactly one ',bootindex=0' with the canonicalized $T work_root substituted; sha256 pinned into the injected harness copy's ARGV_FREEZE_SHA256."
          json.dump(out, open(T + "/argv-freeze.json", "w"), indent=1, sort_keys=True)
          PYT
          [ "$(python3 -c "import json,sys;print(len(json.load(open(sys.argv[1]))['cases']))" "$T/argv-freeze.json")" = "1" ] || { echo "E_H3_NEG_INJECTION planted freeze case count != 1"; exit 97; }
          [ "$(grep -c -F ',bootindex=0' "$T/argv-freeze.json")" = "0" ] || { echo "E_H3_NEG_INJECTION planted freeze still carries a bootindex flag"; exit 97; }
          _PF_SHA=$(sha256sum "$T/argv-freeze.json" | awk '{print $1}')
          [ "$(grep -c 'ARGV_FREEZE_SHA256="e9a38cec9a63986b6898203ffc39de3ba706607646b66a9610c1a87b74713f94"' "$T/rehearsal-harness.py")" = "1" ] || { echo "E_H3_NEG_INJECTION ARGV_FREEZE_SHA256 constant count != 1 in harness copy"; exit 97; }
          sed -i "s/ARGV_FREEZE_SHA256=\"[0-9a-f]\{64\}\"/ARGV_FREEZE_SHA256=\"$_PF_SHA\"/" "$T/rehearsal-harness.py"
          [ "$(grep -c "ARGV_FREEZE_SHA256=\"$_PF_SHA\"" "$T/rehearsal-harness.py")" = "1" ] || { echo "E_H3_NEG_INJECTION freeze pin planting failed"; exit 97; }
          python3 - config.json "$T" <<'PYT'
          import json, sys
          c = json.load(open(sys.argv[1]))
          c["cases"] = [c["cases"][0]]
          json.dump(c, open(sys.argv[2] + "/config.json", "w"), indent=1, sort_keys=True)
          PYT
          # J2 (peer run-35959397469 review): the planted guest runs under the SAME
          # authorized root/KVM context as the ceremony (qemu needs /dev/kvm, root:kvm
          # 0660); all writes stay under /tmp ($T, one-case work root) - NO root write
          # into the checkout. The harness copy carries the H5a bytecode guard.
          _rc=0
          sudo unshare -n env PREFIX="$PREFIX" ALLOWED_PREFIX="$ALLOWED_PREFIX" PYTHONDONTWRITEBYTECODE=1 python3 "$T/rehearsal-harness.py" "$T/config.json" "$T/cases" /tmp/$PREFIX-out > "$T/h3.log" 2>&1 || _rc=$?
          # peer run-36031372949 ruling (1): the injected harness wrote $T as root. Repair
          # OWNERSHIP of $T only (chown to runner) before any runner-side read - NO
          # world-readable chmod, nothing outside $T. Fail closed if the repair fails.
          sudo chown -R "$(id -u):$(id -g)" "$T" || { echo "E_H3_PERM_REPAIR_FAILED chown rc=$? on $T"; exit 97; }
          # peer run-36037280674 ruling (15): the death code is checked FIRST, BEFORE any
          # debug-log checks - h3.log must carry EXACTLY the named boot-target death and NO
          # freeze-gate code; any other harness death dies E_H3_WRONG_DEATH naming it.
          # (Extracted with the taxonomy below by test-h3-precheck.py.)
          _codes=$(grep -o 'E_[A-Z0-9_]*' "$T/h3.log" | sort -u || true)
          if printf '%s\n' "$_codes" | grep -q 'E_CASE_ARGV_FROZEN_'; then
            echo "E_H3_WRONG_DEATH $(printf '%s\n' "$_codes" | grep 'E_CASE_ARGV_FROZEN_' | head -1) (freeze gate fired on the planted copy - expected exactly E_CASE_BOOT_TARGET)"; cat "$T/h3.log"; exit 97
          fi
          if ! printf '%s\n' "$_codes" | grep -qx 'E_CASE_BOOT_TARGET'; then
            echo "E_H3_WRONG_DEATH $(printf '%s\n' "$_codes" | grep '^E_' | head -1) (expected exactly E_CASE_BOOT_TARGET)"; cat "$T/h3.log"; exit 97
          fi
          [ "$_rc" = "90" ] || { echo "E_H3_GATE_NOT_FIRED rc=$_rc expected 90 (E_CASE_BOOT_TARGET)"; cat "$T/h3.log"; exit 97; }
          # before accepting the named target death, ASSERT qemu really started (an
          # environmental death would be E_QEMU_START, also rc 90 - indistinguishable
          # without this proof): the case argv.txt exists AND a NONEMPTY ovmf-debug.log
          # carries a "[Bds]Booting " line.
          # peer run-36031372949 ruling (2) + run-36037280674 ruling (15): DISTINCT named
          # deaths - a permissions death is never "environmental", grep's rc branches 0/1/2
          # (rc 2 never folds into "no match"), and a MISSING ovmf-debug.log after a harness
          # death before QEMU is E_H3_QEMU_NOT_STARTED, never E_H3_NO_BOOT_LINE.
          [ -d "$T/cases" ] || { echo "E_H3_QEMU_NOT_STARTED case dir $T/cases missing (early harness death - see h3.log)"; cat "$T/h3.log"; exit 97; }
          _cdir=$(find "$T/cases" -mindepth 1 -maxdepth 1 -type d | head -1)
          [ -n "$_cdir" ] && [ -f "$_cdir/argv.txt" ] || { echo "E_H3_QEMU_NOT_STARTED case dir or argv.txt missing"; cat "$T/h3.log"; exit 97; }
          if [ ! -e "$_cdir/ovmf-debug.log" ]; then echo "E_H3_QEMU_NOT_STARTED $_cdir/ovmf-debug.log absent (harness died before QEMU produced a debug log)"; cat "$T/h3.log"; exit 97; fi
          if [ ! -r "$_cdir/ovmf-debug.log" ]; then echo "E_H3_DEBUG_LOG_UNREADABLE $_cdir/ovmf-debug.log present but not readable by the runner"; cat "$T/h3.log"; exit 97; fi
          _grc=0; grep -q '^\[Bds\]Booting ' "$_cdir/ovmf-debug.log" || _grc=$?
          if [ "$_grc" = "1" ]; then echo "E_H3_NO_BOOT_LINE readable log carries no '^\[Bds\]Booting ' line"; cat "$T/h3.log"; exit 97; fi
          if [ "$_grc" != "0" ]; then echo "E_H3_DEBUG_LOG_UNREADABLE grep rc=$_grc on $_cdir/ovmf-debug.log"; cat "$T/h3.log"; exit 97; fi
          grep -m1 '^\[Bds\]Booting ' "$_cdir/ovmf-debug.log" | sed 's/^/H3 observed first Booting line: /' >> "$T/h3.log"
          ! grep -F "EXPECTATIONS_VIOLATED" "$T/h3.log" || { echo "E_H3_NEG_GENERIC death must be the named gate, never EXPECTATIONS_VIOLATED"; cat "$T/h3.log"; exit 97; }
          echo "H3_BOOT_TARGET_MUST_SHOW_OK planted bootindex-removed case died named (E_CASE_BOOT_TARGET rc=90, no EXPECTATIONS_VIOLATED)"
'''

BLOCK_NEG_TESTS = r'''      - name: NON_CERTIFYING_SCRATCH verify-auth negative tests (peer #16 E5)
        if: "!cancelled()"
        run: |
          set -euo pipefail
          R=docs/verified-architecture-phase2-v3/provisioning/p3/rehearsal
          cd "$GITHUB_WORKSPACE/$R"
          V=/tmp/$PREFIX-verify-auth-test; rm -rf "$V"; mkdir -p "$V"
          trap 'shred -u "$V"/prep/*.key 2>/dev/null || true; rm -rf "$V"' EXIT
          ./enroll-prep.sh /tmp/$PREFIX-stage/root "$V/prep" evidence/c5-signing-cert.der /tmp/$PREFIX-inrun/c-sign/fixtures/C5-HOSTILE-FIXTURE.cer > "$V/pos.log" 2>&1             || { echo "E_VATEST clean prep failed"; cat "$V/pos.log"; exit 97; }
          grep -F "VERIFY_AUTH_OK" "$V/pos.log" > /dev/null || { echo "E_VATEST no VERIFY_AUTH_OK in clean pass"; cat "$V/pos.log"; exit 97; }
          VA() { python3 verify-auth.py "$1" enroll-app.c /tmp/$PREFIX-stage/shims/openssl --expect-db2; }
          # one 0x67-signed .auth among the 0x27 set -> E_AUTH_DIGEST
          cp -r "$V/prep" "$V/n1"
          /tmp/$PREFIX-stage/shims/sbvarsign --key "$V/prep/pk.key" --cert "$V/prep/pk.crt" --output "$V/n1/pk.auth" PK "$V/n1/pk.esl"
          rc=0; VA "$V/n1" > "$V/n1.log" 2>&1 || rc=$?
          [ "$rc" = "97" ] && grep -F "E_AUTH_DIGEST" "$V/n1.log" > /dev/null             || { echo "E_VATEST 0x67-single case rc=$rc"; cat "$V/n1.log"; exit 97; }
          # string-order SignatureType GUID -> E_ESL_FORMAT
          cp -r "$V/prep" "$V/n2"
          python3 -c "b=bytearray(open('$V/n2/db.esl','rb').read()); b[0:16]=bytes.fromhex('a5c059a194e44aa787b5ab155c2bf072'); open('$V/n2/db.esl','wb').write(bytes(b))"
          rc=0; VA "$V/n2" > "$V/n2.log" 2>&1 || rc=$?
          [ "$rc" = "97" ] && grep -F "E_ESL_FORMAT" "$V/n2.log" > /dev/null             || { echo "E_VATEST guid case rc=$rc"; cat "$V/n2.log"; exit 97; }
          # whole set signed 0x67 -> E_AUTH_ATTR_CONTRACT
          cp -r "$V/prep" "$V/n3"
          /tmp/$PREFIX-stage/shims/sbvarsign --key "$V/prep/pk.key" --cert "$V/prep/pk.crt" --output "$V/n3/pk.auth" PK "$V/n3/pk.esl"
          /tmp/$PREFIX-stage/shims/sbvarsign --key "$V/prep/pk.key" --cert "$V/prep/pk.crt" --output "$V/n3/kek.auth" KEK "$V/n3/kek.esl"
          /tmp/$PREFIX-stage/shims/sbvarsign --key "$V/prep/kek.key" --cert "$V/prep/kek.crt" --output "$V/n3/db.auth" db "$V/n3/db.esl"
          /tmp/$PREFIX-stage/shims/sbvarsign --key "$V/prep/kek.key" --cert "$V/prep/kek.crt" --output "$V/n3/db2.auth" db "$V/n3/db2.esl"
          rc=0; VA "$V/n3" > "$V/n3.log" 2>&1 || rc=$?
          [ "$rc" = "97" ] && grep -F "E_AUTH_ATTR_CONTRACT" "$V/n3.log" > /dev/null             || { echo "E_VATEST contract case rc=$rc"; cat "$V/n3.log"; exit 97; }
          # n4: db.esl signed by the WRONG key (pk) with the CORRECT --attr - digest matches, verification against kek.crt must die E_AUTH_SIG
          cp -r "$V/prep" "$V/n4"
          /tmp/$PREFIX-stage/shims/sbvarsign --attr NON_VOLATILE,BOOTSERVICE_ACCESS,RUNTIME_ACCESS --key "$V/prep/pk.key" --cert "$V/prep/pk.crt" --output "$V/n4/db.auth" db "$V/n4/db.esl"
          rc=0; VA "$V/n4" > "$V/n4.log" 2>&1 || rc=$?
          [ "$rc" = "97" ] && grep -F "E_AUTH_SIG" "$V/n4.log" > /dev/null || { echo "E_VATEST wrong-signer case rc=$rc"; cat "$V/n4.log"; exit 97; }
          # n5: structural corruption (wRevision 0x0100) -> E_AUTH_FORMAT
          cp -r "$V/prep" "$V/n5"
          python3 -c "b=bytearray(open('$V/n5/db.auth','rb').read()); b[20:22]=(0x00,0x01); open('$V/n5/db.auth','wb').write(bytes(b))"
          rc=0; VA "$V/n5" > "$V/n5.log" 2>&1 || rc=$?
          [ "$rc" = "97" ] && grep -F "E_AUTH_FORMAT" "$V/n5.log" > /dev/null || { echo "E_VATEST wrevision case rc=$rc"; cat "$V/n5.log"; exit 97; }
          # B4: corrupt the SECOND list SignatureType GUID in two-list db2.esl (signing cert 1092B vs hostile 799B - size-grouped, so two lists), re-signed to keep payload consistent -> E_ESL_FORMAT
          cp -r "$V/prep" "$V/n6"
          python3 -c "import struct; b=bytearray(open('$V/n6/db2.esl','rb').read()); lsz=struct.unpack_from('<I',b,16)[0]; b[lsz:lsz+16]=bytes.fromhex('a5c059a194e44aa787b5ab155c2bf072'); open('$V/n6/db2.esl','wb').write(bytes(b))"
          /tmp/$PREFIX-stage/shims/sbvarsign --attr NON_VOLATILE,BOOTSERVICE_ACCESS,RUNTIME_ACCESS --key "$V/prep/kek.key" --cert "$V/prep/kek.crt" --output "$V/n6/db2.auth" db "$V/n6/db2.esl"
          rc=0; VA "$V/n6" > "$V/n6.log" 2>&1 || rc=$?
          [ "$rc" = "97" ] && grep -F "E_ESL_FORMAT" "$V/n6.log" > /dev/null || { echo "E_VATEST second-list-guid case rc=$rc"; cat "$V/n6.log"; exit 97; }
          # B6: db2 half-present (auth removed) -> E_DB2_SET
          cp -r "$V/prep" "$V/n7"; rm "$V/n7/db2.auth"
          rc=0; VA "$V/n7" > "$V/n7.log" 2>&1 || rc=$?
          [ "$rc" = "97" ] && grep -F "E_DB2_SET" "$V/n7.log" > /dev/null || { echo "E_VATEST db2-half case rc=$rc"; cat "$V/n7.log"; exit 97; }
          # clean pass on the uncorrupted set
          VA "$V/prep" > "$V/clean.log" 2>&1 || { echo "E_VATEST final clean pass failed"; cat "$V/clean.log"; exit 97; }
          echo "VERIFY_AUTH_TESTS_OK clean/0x67-single/guid-order/0x67-uniform/wrong-signer/wrevision/second-list-guid/db2-half all verified; keys shredded outside upload tree"
      - name: NON_CERTIFYING_SCRATCH checkout-gate negative tests (D15-1)
        if: "!cancelled()"
        run: |
          set -euo pipefail
          R=docs/verified-architecture-phase2-v3/provisioning/p3/rehearsal
          GATE="$GITHUB_WORKSPACE/$R/checkout-gate.sh"
          T=/tmp/$PREFIX-gatetest; rm -rf "$T"; mkdir -p "$T/repo"
          cd "$T/repo"
          git init -q .
          git config user.email gate@test && git config user.name gate
          mkdir -p "$R"
          echo tracked > "$R/tracked.txt"
          git add -A && git commit -qm init
          P="$R/prep"; B="$R/build-output"; D="$R/disks"
          # clean pass WITH the allowed ceremony roots populated
          mkdir -p "$B/esp" "$D"
          touch "$B/esp/x.efi" "$D/y.img"
          "$GATE" "$T/repo" "$P" "$B" "$D" || { echo "E_GATETEST clean pass failed"; exit 97; }
          # stray untracked file outside the allowlist -> named 97
          touch "$R/stray.txt"
          rc=0; "$GATE" "$T/repo" "$P" "$B" "$D" > "$T/stray.log" 2>&1 || rc=$?
          [ "$rc" = "97" ] && grep -F "E_CHECKOUT_MUTATED unexpected untracked path: $R/stray.txt" "$T/stray.log" > /dev/null \
            || { echo "E_GATETEST stray-file case rc=$rc"; cat "$T/stray.log"; exit 97; }
          rm "$R/stray.txt"
          # __pycache__ -> named 97 (the F5/D14-1 class the gate exists to catch)
          mkdir -p "$R/__pycache__" && touch "$R/__pycache__/x.pyc"
          rc=0; "$GATE" "$T/repo" "$P" "$B" "$D" > "$T/pyc.log" 2>&1 || rc=$?
          [ "$rc" = "97" ] && grep -F "E_CHECKOUT_MUTATED unexpected untracked path: $R/__pycache__" "$T/pyc.log" > /dev/null \
            || { echo "E_GATETEST pycache case rc=$rc"; cat "$T/pyc.log"; exit 97; }
          rm -rf "$R/__pycache__"
          # tracked modification -> named 97
          echo changed >> "$R/tracked.txt"
          rc=0; "$GATE" "$T/repo" "$P" "$B" "$D" > "$T/tracked.log" 2>&1 || rc=$?
          [ "$rc" = "97" ] && grep -F "E_CHECKOUT_MUTATED tracked file modified" "$T/tracked.log" > /dev/null \
            || { echo "E_GATETEST tracked case rc=$rc"; cat "$T/tracked.log"; exit 97; }
          git checkout -- "$R/tracked.txt"
          # staged change -> named 97 (caught by the HEAD diff either way)
          echo staged >> "$R/tracked.txt" && git add "$R/tracked.txt"
          rc=0; "$GATE" "$T/repo" "$P" "$B" "$D" > "$T/staged.log" 2>&1 || rc=$?
          [ "$rc" = "97" ] && grep -F "E_CHECKOUT_MUTATED" "$T/staged.log" > /dev/null \
            || { echo "E_GATETEST staged case rc=$rc"; cat "$T/staged.log"; exit 97; }
          git reset -q && git checkout -- "$R/tracked.txt"
          # prep left behind -> E_PREP_LEFT_BEHIND 98 (throwaway keys)
          mkdir -p "$P" && touch "$P/pk.key"
          rc=0; "$GATE" "$T/repo" "$P" "$B" "$D" > "$T/prep.log" 2>&1 || rc=$?
          [ "$rc" = "98" ] && grep -F "E_PREP_LEFT_BEHIND" "$T/prep.log" > /dev/null \
            || { echo "E_GATETEST prep case rc=$rc"; cat "$T/prep.log"; exit 97; }
          rm -rf "$P"
          # space+quote+dollar filename under an allowed root must PASS (-z form)
          touch "$B/esp/weird name 'quote' \$dollar.efi"
          "$GATE" "$T/repo" "$P" "$B" "$D" || { echo "E_GATETEST unusual-name case failed"; exit 97; }
          rm "$B/esp/weird name 'quote' \$dollar.efi"
          # sibling-prefix path must NOT be admitted by the allowlist (B2)
          mkdir "${B}x-evil"; touch "${B}x-evil/e"
          rc=0; "$GATE" "$T/repo" "$P" "$B" "$D" > "$T/sib.log" 2>&1 || rc=$?
          [ "$rc" = "97" ] && grep -F "E_CHECKOUT_MUTATED unexpected untracked path: ${B}x-evil/e" "$T/sib.log" > /dev/null || { echo "E_GATETEST sibling-prefix case rc=$rc"; cat "$T/sib.log"; exit 97; }
          rm -rf "${B}x-evil"
          # symlink under an allowed root -> named 97 (K2 alignment)
          ln -s /tmp "$B/link"
          rc=0; "$GATE" "$T/repo" "$P" "$B" "$D" > "$T/link.log" 2>&1 || rc=$?
          [ "$rc" = "97" ] && grep -F "E_CHECKOUT_MUTATED symlink under allowed root: $B/link" "$T/link.log" > /dev/null             || { echo "E_GATETEST symlink case rc=$rc"; cat "$T/link.log"; exit 97; }
          rm "$B/link"
          # final clean pass
          "$GATE" "$T/repo" "$P" "$B" "$D" || { echo "E_GATETEST final clean pass failed"; exit 97; }
          echo "CHECKOUT_GATE_TESTS_OK clean/stray/pycache/tracked/staged/prep/unusual-name/sibling-prefix/symlink all verified on a COPY"
'''

A_USERNS   = "      - name: NON_CERTIFYING_SCRATCH userns/bwrap preflight (staged, lock-verified bwrap)\n"
A_CEREMONY = "      - name: NON_CERTIFYING_SCRATCH ceremony (network-enforced-off, tee'd log)\n"
BLOCK_BYTECODE_GUARD_NEG = r'''      - name: NON_CERTIFYING_SCRATCH planted-fault H5 bytecode-guard must-show (peer run-35963407323 redesign)
        # run-35999960747 D3: the three re-preflights below run mid-ceremony (build-output legitimately
        # exists by then); PREFLIGHT_MID_CEREMONY=1 switches E_STALE_STATE_COMMITTED to tracked-path semantics.
        if: ${{ !cancelled() }}
        run: |
          set -eEuo pipefail
          trap '_rc=$?; echo "E_BASH_ERRTRAP h5 line $LINENO rc=$_rc cmd: $BASH_COMMAND" >&2; exit 97' ERR
          REH=docs/verified-architecture-phase2-v3/provisioning/p3/rehearsal
          OUT=/tmp/$PREFIX-out
          mkdir -p "$OUT"
          cd "$REH"
          REH_ABS="$PWD"
          # peer run-35963407323 redesign: (a) clean baseline FIRST, before any plant,
          # captured into the evidence tree - a must-show step NAMES every non-zero exit
          # (the run-19' phase-2 clean re-run died silent exit 30 into /dev/null).
          _rc=0
          PREFLIGHT_MID_CEREMONY=1 python3 preflight-check.py config.json /tmp/$PREFIX-stage > "$OUT/$PREFIX-h5-baseline.json" 2>&1 || _rc=$?
          if [ "$_rc" -ne 0 ]; then
            echo "E_H5_BASELINE_PREFLIGHT_FAIL rc=$_rc"; cat "$OUT/$PREFIX-h5-baseline.json"; exit 90
          fi
          # (b) planted sibling importer WITHOUT sys.dont_write_bytecode, scanned by the REAL
          # preflight E_BYTECODE_GUARD check; the EXIT trap guarantees the probe never survives
          # the step (the end-of-job checkout gate must see a clean tree).
          trap 'rm -f "$REH_ABS/zz_bytecode_probe.py"' EXIT
          printf 'from lane_resolve import resolve_config_value\n' > "$REH_ABS/zz_bytecode_probe.py"
          _rc=0
          PREFLIGHT_MID_CEREMONY=1 python3 preflight-check.py config.json /tmp/$PREFIX-stage > "$OUT/$PREFIX-h5-planted.json" 2>&1 || _rc=$?
          rm -f "$REH_ABS/zz_bytecode_probe.py"
          trap - EXIT
          if [ "$_rc" -ne 30 ]; then
            echo "E_H5_PLANTED_ERRSET_MISMATCH rc=$_rc (want 30)"; cat "$OUT/$PREFIX-h5-planted.json"; exit 90
          fi
          python3 - "$OUT/$PREFIX-h5-planted.json" <<'PYT'
          import json, sys
          try:
              rep = json.load(open(sys.argv[1]))
          except Exception as e:
              print("E_H5_PLANTED_ERRSET_MISMATCH planted report unparseable: %s" % e)
              print(open(sys.argv[1], errors="replace").read())
              sys.exit(90)
          errs = rep.get("errors")
          def _named(e, code):
              return (isinstance(e, list) and len(e) == 2 and e[0] == code
                      and "zz_bytecode_probe.py" in str(e[1]))
          bg = [e for e in (errs or []) if _named(e, "E_BYTECODE_GUARD")]
          pi = [e for e in (errs or []) if _named(e, "E_PYTHON_IMPORTS")]
          pim = str(pi[0][1]) if pi else ""
          # peer run-36004747396 ruling D2: BOTH guards correctly fire on the probe - the
          # exact set is a PAIR, each naming zz_bytecode_probe.py, the imports entry with
          # module set exactly {lane_resolve}. Any other code, extra entry, or non-probe
          # attribution fails this gate.
          ok = (isinstance(errs, list) and len(errs) == 2 and len(bg) == 1 and len(pi) == 1
                and "," not in pim and pim.split()[-1:] == ["lane_resolve"])
          if not ok:
              print("E_H5_PLANTED_ERRSET_MISMATCH errors=%r (want exactly {E_BYTECODE_GUARD naming zz_bytecode_probe.py, E_PYTHON_IMPORTS naming zz_bytecode_probe.py module set exactly {lane_resolve}})" % (errs,))
              print(json.dumps(rep, indent=1, sort_keys=True))
              sys.exit(90)
          print("planted error set exactly {E_BYTECODE_GUARD + E_PYTHON_IMPORTS{lane_resolve}} both naming zz_bytecode_probe.py")
          PYT
          # (c) probe removed; the post-clean run must pass clean, else NAMED with JSON printed.
          _rc=0
          PREFLIGHT_MID_CEREMONY=1 python3 preflight-check.py config.json /tmp/$PREFIX-stage > "$OUT/$PREFIX-h5-post.json" 2>&1 || _rc=$?
          if [ "$_rc" -ne 0 ]; then
            echo "E_H5_POST_PREFLIGHT_FAIL rc=$_rc"; cat "$OUT/$PREFIX-h5-post.json"; exit 90
          fi
          # (d) all three reports sit under the evidence upload path (each written BEFORE any
          # death, captured on success AND failure); (e) no output to /dev/null in this step.
          echo "H5_BYTECODE_GUARD_MUST_SHOW_OK baseline+planted+post captured as $PREFIX-h5-{baseline,planted,post}.json"
'''
A_REPAIR   = "      - name: NON_CERTIFYING_SCRATCH evidence readability repair (ephemeral out tree only)\n"
A_GATE     = "      - name: checkout immutability gate (end of job, frozen SHA)\n"

def _insert_before(t, anchor, block):
    n = t.count(anchor)
    assert n == 1, f"anchor not unique ({n}): {anchor!r}"
    return t.replace(anchor, block + anchor)

def derive(t):
    # C1' (peer 2026-09-24 B1 conditions 2-3): source-side c-sign guarantees, checked
    # BEFORE any transform. Exactly one c-sign step in the SOURCE (0/2+ get distinct
    # named codes); it must sit after the ESP dual builds and before the first K2 gate
    # and carry !cancelled() (placement ruling).
    _n_src = t.count("- name: NON_CERTIFYING_REHEARSAL criterion-C throwaway signing")
    if _n_src == 0:
        raise SystemExit("E_DERIVE_C_SIGN_MISSING source c-sign step occurrences=0")
    if _n_src > 1:
        raise SystemExit("E_DERIVE_C_SIGN_DUPLICATE source c-sign step occurrences=%d" % _n_src)
    _i_c = t.index("- name: NON_CERTIFYING_REHEARSAL criterion-C throwaway signing")
    _i_esp = t.index("- name: NON_CERTIFYING_REHEARSAL enrollment app + ESP dual builds")
    _i_k2 = t.index("- name: zero-private-key evidence gate K2 before firmware-hash upload")
    if not (_i_esp < _i_c < _i_k2):
        raise SystemExit("E_DERIVE_C_SIGN_PLACEMENT c-sign step must follow the ESP dual builds and precede the first K2 gate")
    _src_blk = t[_i_c:t.index("\n      - name:", _i_c)]
    if "if: ${{ !cancelled() }}" not in _src_blk:
        raise SystemExit("E_DERIVE_C_SIGN_PLACEMENT c-sign step lacks if: ${{ !cancelled() }}")
    t = NEW_HDR + t[t.index("name: "):]
    t = t.replace("NON_CERTIFYING_REHEARSAL", "NON_CERTIFYING_SCRATCH")
    t = t.replace("branches: [p3-rehearsal-3, p3-rehearsal-4]", "branches: ['p3-scratch-*']")
    t = t.replace("refs/heads/p3-rehearsal-3|refs/heads/p3-rehearsal-4) : ;;",
                  "refs/heads/p3-scratch-*) : ;;")
    t = re.sub(r'\n\s*\[ "\$EV_CREATED" = "true" \] \|\| \{ echo "E_PUSHED_ONCE created=\$EV_CREATED"; exit 89; \}', "", t)
    t = re.sub(r'\n\s*\[ "\$EV_BEFORE" = "0{40}" \] \|\| \{ echo "E_PUSHED_ONCE before=\$EV_BEFORE"; exit 89; \}', "", t)
    t = t.replace("# pushed-once gate (T3 F5): the ref must be created by THIS push, never force-pushed",
                  "# pushed-once gate (scratch form): force-push is forbidden; successive scratch commits are allowed")
    t = _insert_before(t, A_CEREMONY, BLOCK_PF)
    n = t.count(A_CEREMONY); assert n == 1, f"ceremony anchor not unique ({n})"
    t = t.replace(A_CEREMONY, A_CEREMONY + CEREMONY_IF)
    t = _insert_before(t, A_USERNS, BLOCK_FETCH_TESTS)
    t = _insert_before(t, A_REPAIR, BLOCK_PF6)
    t = _insert_before(t, A_REPAIR, BLOCK_TIE_NEGS)
    t = _insert_before(t, A_REPAIR, BLOCK_BOOT_TARGET_NEG)
    t = _insert_before(t, A_REPAIR, BLOCK_BYTECODE_GUARD_NEG)
    t = _insert_before(t, A_GATE, BLOCK_NEG_TESTS)
    # C1' (peer 2026-09-24 B1 conditions 1-3): output-side carry guarantees. Exactly one
    # c-sign step in the OUTPUT (0/2+ get distinct named codes), and the carried block
    # must equal the source block under ONLY the lane-prefix swap - any scratch-only
    # edit inside the step dies here.
    _n = t.count("- name: NON_CERTIFYING_SCRATCH criterion-C throwaway signing")
    if _n == 0:
        raise SystemExit("E_DERIVE_C_SIGN_MISSING output c-sign step occurrences=0")
    if _n > 1:
        raise SystemExit("E_DERIVE_C_SIGN_DUPLICATE output c-sign step occurrences=%d" % _n)
    _i_oc = t.index("- name: NON_CERTIFYING_SCRATCH criterion-C throwaway signing")
    _i_oend = t.index("\n      - name:", _i_oc)
    if t[_i_oc:_i_oend] != _src_blk.replace("NON_CERTIFYING_REHEARSAL", "NON_CERTIFYING_SCRATCH"):
        raise SystemExit("E_DERIVE_C_SIGN_CARRY_DRIFT c-sign step edited beyond the lane-prefix swap")
    return t

def main():
    src, out = sys.argv[1], sys.argv[2]
    t = derive(open(src).read())
    open(out, "w").write(t)
    print(f"derived {out} ({len(t.splitlines())} lines)")

if __name__ == "__main__":
    main()

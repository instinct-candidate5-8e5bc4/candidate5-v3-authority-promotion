# Criterion C CI design (E freeze head) - throwaway-key signing in-runner, zero persistent key material

Status: DESIGN for peer review. Implements criterion C under the zero-private-key rule
(2026-09-24): no private key in Git, CI artifacts, or messages; the signing key is generated
inside the CI job and plain-deleted before the job ends. The sbsign arm is pending the
WIN_CERTIFICATE dwLength ruling (see UKI-13309697-ROOT-CAUSE.md section 3).

## Job graph (all inside the existing NON_CERTIFYING rehearsal lane shape: attempt 1 only,
exact ref, pushed-once gates, no re-run, all runs preserved)

1. `c-sign` (new job, runner has /dev/kvm but does not boot):
   - stage pinned platform (lockgen lock incl. sbsigntool 0.9.4-3.1ubuntu7 + osslsigncode
     2.8-2 once the lock addition lands; deb sha256 verified against the lock).
   - verify the frozen unsigned UKI: sha256 == 4cda9c3e.., verify-uki-layout.py PASS
     (contiguous == section-wise == b2f655b0..).
   - generate ephemeral RSA-3072 keypair + self-signed cert CN=C5-THROWAWAY-UKI-CI
     (openssl, 0600, mktemp dir). KEY DELETION IS GUARANTEED BY THE TRAP, NOT BY ANY STEP:
     the signing step's shell runs `trap 'rm -rf "$W"' EXIT TERM INT` immediately after
     creating the work dir, so normal exit, failure, AND job cancellation (the runner
     SIGTERMs the step's shell, and the TERM/EXIT trap fires) all plain-delete the key.
     `if: ${{ !cancelled() }}` steps do NOT run on cancellation and are never relied on
     for deletion; the allowlist artifact upload (signed *.efi + cert DER + logs only)
     can never include the mktemp dir, and the job VM is destroyed at job end
     regardless. The K2 evidence sweep must show the key ABSENT.
   - sign the frozen unsigned UKI with osslsigncode (and sbsign per the ruling).
   - verify in-job: verify-uki-signed.py PASS on each variant (embedded == section-wise ==
     b2f655b0..); verify-signed-delta.py vs the pinned unsigned (E_SIGNED_UNSIGNED_DELTA);
     verify-uki-authenticode.py VALID with signer == the job's throwaway cert.
   - upload artifacts: signed variant(s), throwaway cert DER, per-step logs. Artifact
     retention per existing evidence policy; artifact digests come from the API metadata
     at review time (authenticated artifact route).

2. `c-enroll` (new job): enroll-prep.sh + rehearsal-enroll.sh UNCHANGED, with the job-1
   throwaway cert DER in the `production_cert.der` argument position -> throwaway-db
   enrolled vars template (sole db = [throwaway cert]); ENROLL.TXT predicate evidence
   produced by the same frozen machinery. Runtime shas recorded observationally.

3. `c-boot` (new job): one case per signed variant x {DEBUG, RELEASE} on the pinned OVMF
   pair: ESP variant built in-job from the signed variant (build-esp-variant.sh,
   deterministic given payload), vars template from job 2, expect = kernel exec +
   exit-98 (same R1 reject-control contract). Reject-string sets and companion-line rules
   unchanged.

4. Existing R2-R6 negatives run UNCHANGED against the re-derived committed fixtures
   (F-WRONGSIG/F-HOSTILEUKI embed b2f655b0..; fresh fixture certs 64eb51a0../5b5e4edc..;
   ESP variant pins 9f6f9cbe/6f49d9cb/495a9591 in config.json).

## Pinned vs ephemeral

PINNED (committed, byte-reviewed pre-push): unsigned UKI 4cda9c3e..; builder + gates;
fixtures + fixture certs; ESP-variant pins for the NEGATIVE cases; lock incl. both signers;
workflow + preflight logic.
EPHEMERAL (per-run, recorded in observational evidence, verified at runtime, never pinned):
throwaway key (deleted in-job), throwaway cert DER, signed variant bytes, throwaway-db vars
template, c-boot ESP images, all derived shas. Preflight gate 4b verifies the signed
artifacts against the pinned unsigned's dual-equal digest b2f655b0.. at runtime; the run is
fail-closed on any mismatch.

## Q2 enforcement (osslsigncode ONLY in criterion C)

- osslsigncode is staged ONLY inside `c-sign` (no other job installs or shims it).
- preflight gains a guard: the certification/rehearsal-cert/ceremony paths fail closed
  (E_TOOL_FORBIDDEN) if an osslsigncode binary is present in their staged tool set.
- The signing packet for criterion F remains signtool-only on the owner's Windows machine;
  osslsigncode output is never presented as ceremony material.

## What this does NOT change

R1 historical-13309697 reject-control boot, gate-4b on the owner-signed UKI, ESP pristine pin, and every
13309697-bearing doc stay exactly as they are until the fresh ceremony (criterion F) and
the post-ceremony recertification pass.

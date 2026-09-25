# R3 — Static Review Candidate: Option A CI Ceremony (NON_CERTIFYING_REHEARSAL pre-freeze rehearsal)

> **REVISION (E freeze head, 2026-09-24):** the previously accepted signed UKI
> 13309697.. is HISTORICAL EVIDENCE ONLY - firmware-rejected in run 19' (R1), root-caused in
> UKI-13309697-ROOT-CAUSE.md (inter-section gap = the stub's COFF symbol table; embedded
> digest ab95a4c3.. gap-included vs firmware section-wise 78eb453c..). Per the owner decision
> of 2026-09-24 this revision carries the gapless deterministic rebuild (unsigned UKI
> 4cda9c3e.., 21,154,304 B, symtab-zeroed; dual-equal Authenticode digest b2f655b0..), the
> re-derived hostile fixtures (fresh ephemeral fixture certs 64eb51a0../5b5e4edc.., both
> embedding b2f655b0..), rebuilt ESP-variant pins, the new builder
> (successor-uki-candidate/build-successor-gapless.py) and gates (verify-uki-layout.py,
> verify-uki-signed.py, verify-signed-delta.py, verify-uki-authenticode.py) with executed
> negatives. The 13309697-signed pristine ESP pin and every 13309697-bearing doc remain
> pinned to the historical artifact until the fresh signing ceremony (criterion F); they are
> re-derived in the post-ceremony recertification pass.


Status: STATIC REVIEW CANDIDATE. This document, the rehearsal branch content, and every value
in it freeze before static review. Any byte change after review starts restarts the review
(ONE SHA = ONE REVIEW). This document NEVER emits the closing marker; the closing marker for
the certification ceremony after STATIC ACCEPT is exactly one line: OVMF_CI_SECURE_BOOT_UKI_PASS
(emitted ONLY by the certification workflow, never by this rehearsal).

## 1. Scope and nonclaims
This ceremony certifies, on QEMU/KVM with a reproducible DEBUG OVMF build:
firmware Secure Boot ACCEPT of the exact accepted signed UKI
(sha256 133096976ee70a8c272cbcc8c28d369bfc65d93d994cbff4174b947df00239d1, 21,166,416 bytes),
Linux kernel execution, and signed-init exit 98 (E_PROVIDER_LINK_MISSING / E_PROVIDER_NAMESPACE
on non-Google hardware). Expected-PASS = those three together.
NOT claimed: full runtime PASS; dm-verity runtime PASS; provisioning PASS; Google platform
certification; complete boot-chain certification; any Google firmware, vTPM, GCP-deployment,
or persistence property. LOCAL_KVM_EXECUTION_NOT_YET_OBSERVED for the rehearsal itself:
rehearsal runs happen in CI; the local sandbox has no KVM.

## 2. Frozen inputs (public accepted inputs; ephemeral-key fixtures)
- branch base vs UKI source (requirement 1): the rehearsal commit's parent is the accepted P2
  branch tip cd455a0619903f072ab8dc1bd3c9f9238d41c559. The accepted signed UKI's source commit
  is 92741cbdefaa78adc33bc3c74935a45f9558b88c, a VERIFIED ANCESTOR of cd455a06
  (git merge-base --is-ancestor 92741cbd cd455a06 -> true, run locally 2026-09-23). These are
  distinct identities and must not be conflated.
- A4 record (requirement 7) [SUPERSEDED by section 15, C1' route-(ii): negative-control fixtures are now generated IN-RUN from runner-ephemeral keys and property-gated; the pinned bytes below are a HISTORICAL record only and the binary files were deleted from the tree in C1' after the 2026-09-24 C2 byte-loss event disclosed in section 15]: fixtures regenerated 2026-09-22 ~18:00 IDT under requirement A4 -
  prior ad-hoc generation (F-WRONGSIG 75c24ffc.., F-HOSTILEUKI 860389a7..) is VOID. Sole bound
  fixtures: generator fixture-generate.sh sha256 8a4661d57961c7a86d83d638325022fa81da7ed309e7df78eaeadcdc59167a85
  (public inputs only: unsigned UKI ed5d9d72.. + pinned sbsigntool; keys 0600 in mktemp, never
  logged, plain-deleted after the single reviewed run); F-WRONGSIG.efi
  e4c49342bfd9f1c7a90ea3364b6619865d8187a17f10f146cd25cce57721cfdb with cert
  64eb51a0deb3bc67df051de22bdd205426dd4b70931b1f8d49fee4e894339ca6 (809 B); F-HOSTILEUKI.efi
  e3547cd573b49caa8f5e9f0c20c0c78f1bbac694577bfd7fe19236092bd8dd3b with cert
  5b5e4edc11fd12787580fc9885fcdd4ebefecdabd82b893988be321483b68a8b (799 B). ANY regeneration
  = new review.
- signed UKI sha256 13309697... (above), unsigned UKI sha256 4cda9c3e285b5b639364234400bf0b121178f12447cc88d896cd2623e07d18e1 (21,154,304 B)
- production signing cert DER sha256 7cda4ddc149849cc61191d4b5b3d218d14770c0401e9e66dd9617b82ba1ae441 (1,092 B)
- F-WRONGSIG.efi sha256 e4c49342bfd9f1c7a90ea3364b6619865d8187a17f10f146cd25cce57721cfdb (21,155,888 B), cert DER 64eb51a0deb3bc67df051de22bdd205426dd4b70931b1f8d49fee4e894339ca6 (809 B) [HISTORICAL only; file deleted in C1', see section 15]
- F-HOSTILEUKI.efi sha256 e3547cd573b49caa8f5e9f0c20c0c78f1bbac694577bfd7fe19236092bd8dd3b (21,155,872 B), cert DER 5b5e4edc11fd12787580fc9885fcdd4ebefecdabd82b893988be321483b68a8b (799 B) [HISTORICAL only; file deleted in C1', see section 15]
- pristine VARS: OVMF_VARS_4M.fd from ovmf 2024.02-2ubuntu0.9, sha256 5d2ac383371b408398accee7ec27c8c09ea5b74a0de0ceea6513388b15be5d1e (540,672 B, EMPTY store)
- frozen ESP image (built, pinned): c5-root-admitter-uki-v3-esp.raw sha256 2bfa621238890890765c9636f99dabfb46233bfa626afb580ce33e65858019c9 (EPOCH 1789923381, disk GUID a42ac99f-298e-71d7-54e9-69cea084f6d6, partition GUID a1eee143-302e-bfce-2da6-410baab6c2ea)
- accepted source commit 92741cbdefaa78adc33bc3c74935a45f9558b88c
Fixture keys were generated once, used once, plain-deleted; any regeneration requires a new static review. [SUPERSEDED in C1': fixture keys are now generated in-run per ceremony and shredded end-of-step; see section 15.]

## 3. Platform lock (A2: complete build+runtime closure)
platform.lock.json sha256 330aea4630f1674da9dca242fda41ed3555f496a3be6b4ed3d6f9beedfbd89e4:
161 debs (ubuntu-24.04 noble amd64; noble + noble-updates main+universe indices, all four index
hashes recorded; regenerated with the byte-identical recorded indices - the 147 entries of the
previously committed lock are unchanged, exactly 14 packages added for criterion C: osslsigncode
2.8-2 (deb sha256 1aee7be603102633e80b4c67cd939bba2e16a62813e4a3035696727783f632b0, 79,478 B)
plus its libcurl4t64 dependency chain; zero removals). 107 runtime incl. qemu-system-x86 1:8.2.2+ds-0ubuntu1.18,
ovmf 2024.02-2ubuntu0.9
(deb sha256 a094c13d06f2740691ff57d108dff32aa087179363ddb0de42d463b4f7f9bc13), sbsigntool
0.9.4-3.1ubuntu7, gdisk, dosfstools, openssl, bubblewrap 0.9.0-1ubuntu0.3 (deb sha256
2461f1beee9cb04c8942739fe1a2b37e7b7c2a3d518f0779dc75f9245baa3094); 54 build-only incl. gcc-13 13.3.0, nasm 2.16.01,
acpica-tools 20230628, gnu-efi 3.0.15-1build1 (deb sha256 cb325283fa03f323fb2f2f2db6085c57518afe0a2d4f752efcc1a836dd2c48e6 — the noble index entry; an earlier "jammy" label and a "3.0.18-1" remark were corrected).
osslsigncode joins the runtime set for the c-sign step (staged like every other
tool, loader-explicit shim; the Q2 E_TOOL_FORBIDDEN guard confines every osslsigncode reference
to the c-sign step of the rehearsal workflow and bans it from the certification/scratch lanes).
stage-platform.sh downloads every deb, verifies every sha256, rejects any extra or
substituted file (E_LOCK_EXTRA_FILES), extracts to a private tree, and verifies the pristine
VARS hash (E_VARS_PRISTINE_MISMATCH). Download hardening (D3 ruling, round 5): explicit 60s
per-request urllib timeout; each deb retried at most 3 times, ALWAYS from the same
lock-listed URL (no mirror substitution); sha256 re-checked after EVERY attempt; every
attempt logged; failure after the final attempt fails closed E_LOCK_DOWNLOAD_FAILED
(exit 34; a sha256 mismatch is a failed attempt and follows the same retry path).
Source hardening (D4 ruling, round 6): edk2 and its nine pinned submodules are fetched ONCE
into $DEST/sources/edk2 in this same staging phase, under the same policy: liveness timeout
(http.lowSpeedLimit/lowSpeedTime) plus a hard 600s timeout(1) per attempt, at most 3 attempts,
ALWAYS the same URL (the edk2 origin; submodule URLs come from .gitmodules AT the pinned
commit - no mirror substitution), every attempt logged, final failure E_SOURCE_STAGE_FAILED
(exit 35). Pins are verified here - edk2 HEAD == the pinned commit and every submodule HEAD ==
its superproject gitlink, else E_SOURCE_PIN_MISMATCH (exit 36) - and every build consumes this
cache OFFLINE only (section 4).
Tool execution uses loader-explicit shims (make-shims.sh): staged binaries run through the staged
ld-linux with --argv0, so the locked toolchain behaves identically on any host glibc. bwrap is
load-bearing for the canonical build path, so it runs ONLY as the staged, lock-hash-verified
binary through that shim, never the host tool: build-ovmf-debug.sh re-execs
$STAGE/shims/bwrap (fails E_NO_STAGED_BWRAP if absent), and the workflow's userns preflight
exercises exactly that staged binary before any build starts.

## 4. Certification firmware: reproducible DEBUG OVMF (ruling 2)
- source: edk2 commit edc6681206c1a8791981a2f911d2fb8b3d2f5768 (tag edk2-stable202402), HEAD
  verified equal after fetch; the build initializes NINE pinned submodules, each pinned by its
  superproject gitlink (path @ gitlink commit, verified at staging and again in every build):
  - CryptoPkg/Library/OpensslLib/openssl @ de90e54bbe82e5be4fb9608b6f5c308bb837d355
  - CryptoPkg/Library/MbedTlsLib/mbedtls @ 8c89224991adff88d53cd380f42a2baa36f91454
  - BaseTools/Source/C/BrotliCompress/brotli @ f4153a09f87cbb9c826d8fc12c74642bb2d879ea
  - MdeModulePkg/Universal/RegularExpressionDxe/oniguruma @ abfc8ff81df4067f309032467785e06975678f0d
  - MdeModulePkg/Library/BrotliCustomDecompressLib/brotli @ f4153a09f87cbb9c826d8fc12c74642bb2d879ea
  - MdePkg/Library/MipiSysTLib/mipisyst @ 370b5944c046bab043dd8b133727b2135af7747a
  - MdePkg/Library/BaseFdtLib/libfdt @ cfff805481bdea27f900c32698171286542b8d3c
  - ArmPkg/Library/ArmSoftFloatLib/berkeley-softfloat-3 @ b64af41c3276f97f0e181920400ee056b9c88037
  - RedfishPkg/Library/JsonLib/jansson @ e9ebfa7e77a6bee77df44e096b100e7131044059
  D4 ruling: all of the above is staged ONCE into the source cache during
  staging (section 3); every build copies the cache locally (GIT_ALLOW_PROTOCOL=file) and
  re-verifies the same pins (E_EDK2_COMMIT_MISMATCH exit 41 unchanged; E_SOURCE_CACHE_MISSING /
  E_SOURCE_PIN_MISMATCH exit 44), with the network CUT by bwrap --unshare-net in both canonical
  and hostile modes - builds have no network access at all.
- flags: DEBUG, SECURE_BOOT_ENABLE=TRUE, SMM_REQUIRE=TRUE; frozen tools_def append: -Wno-error
  -Wno-stringop-overflow -Wno-array-bounds -Wno-stringop-overread (GCC13 warning compatibility ONLY),
  -g0 (no DWARF) and -ffile-prefix-map=$(WORKSPACE)=/ws (path normalization), DEBUG DLINK -Os;
  no semantic flag change; SOURCE_DATE_EPOCH=1706745600; PYTHONHASHSEED=0
- CANONICAL-PATH reproducibility (reviewer-accepted, conditions in section 8): the firmware is
  reproducible at the canonical in-container path /build ONLY, and is NOT path-independent.
  GenFw embeds each module's absolute DLL path in its CodeView debug-directory PDB entry and
  no flag rewrites it; builds at different paths therefore differ (drift demonstrated, section 8).
  The build runs inside a user-namespace (bwrap) bind of the real scratch dir to /build, never
  a GitHub host/workspace/user path; the script enforces resolved symlink-free paths
  (E_NONCANONICAL_INPUT_PATH / E_NONCANONICAL_WORKDIR / E_SYMLINK_IN_CANON_TREE).
  Local and self-hosted reproductions MUST use the same container namespace and /build path.
- two clean sequential builds at /build (entire tree deleted between them, only pinned inputs
  restored) MUST be byte-identical or the workflow fails (E_OVMF_DUAL_BUILD_MISMATCH); a SECOND
  fresh runner reproduces the same bytes at /build (env2 job, E_ENV2_HASH_MISMATCH gate).
- PDB-path verifier scan-pe-pdb-paths.py (sha256 6bcb1693dfff9c96bf1007101ef3d713caba3d4adbe6ec877bd668e519943d72; v3 - v1 had a PE32+ data-directory offset bug and exited vacuous-PASS on zero entries, caught by ground-truth check; v2 hard-fails on zero entries; v3 adds per-module reject counts to the REJECT verdict so the hostile gate can require EVERY scanned module to carry the hostile path):
  parses every module .efi's CodeView debug directory (RSDS/NB10) plus a raw-carve backstop;
  accepted firmware REQUIRES every absolute PDB path to carry the /build/ prefix and REJECTS any
  host/workspace/user path. A deliberately hostile (different-path) build MUST be rejected.
- expected dual-build outputs (locally observed at /build, CI must reproduce):
  OVMF_CODE.fd sha256 fc150336fce10eb5508fa440cdf7300622c8c3ac71f2fbe10a0731422b9cef24 (3653632 B)
  OVMF_VARS.fd sha256 5d2ac383371b408398accee7ec27c8c09ea5b74a0de0ceea6513388b15be5d1e (540672 B, pristine)
  HARD GATES (both build jobs): immediately after building, the workflow asserts CODE hash ==
  fc150336.. AND size == 3653632, and VARS hash == 5d2ac383.. AND size == 540672, exit 95
  (E_CODE_PIN_MISMATCH / E_CODE_PIN_SIZE / E_VARS_PIN_MISMATCH / E_VARS_PIN_SIZE) on any
  deviation; the env2 job applies the same pins on its own outputs before the cross-runner
  hash gate, so the compared bytes are pinned, not merely self-consistent.
- build-ovmf-debug.sh sha256 72d0fd687078d3d7b6c61026ecf8b99a622d9939b42097115cceee20bd93aa29 (staged-bwrap re-exec; hostile mode honors CANON_REALWORK so the preserved hostile Build tree is the scanned tree; D4: offline sources from the staged cache, --unshare-net in both modes)
- print-site uniqueness (DxeImageVerificationLib.c): unsigned reject "Image is not signed and %s
  hash of image is not found in DB/DBX"; signed-untrusted reject "Image is signed but signature is
  not allowed by DB and %s hash of image is not found in DB/DBX"; dbx "...forbidden by DBX";
  summary "The image doesn't pass verification: %s"; malformed-PE "Not a valid PE/COFF image" /
  "PeImage invalid. Cannot retrieve image information." The ACCEPT path is SILENT (no pass string);
  positive outcomes are proven by runtime RAM markers, not strings. String matching is %s-template
  sequential matching, not naive substring.
- the Ubuntu RELEASE OVMF (OVMF_CODE_4M.secboot.fd sha256 1dbb7f9b7e7285b950929bbbc1494c186bfb061cde60cf531ff9756ef87dab7a)
  appears only as the R7 behavior-only sibling; NO RELEASE/DEBUG equivalence is claimed.

## 5. Key enrollment (same-invocation rule)
The enrollment EFI app (enroll-app.c sha256 762c5d09a2a7b556b98f876626cd09f08c4bc724f2205ceb1bd4de863639fdda;
dual build byte-identity enforced) writes db/db2, then KEK, then PK, and in the SAME invocation
GetVariable-captures SecureBoot + SetupMode (raw value + attributes + status) to ENROLL.TXT on the
FAT evidence disk. An unsigned reader app is never booted after PK enrollment; no reader cert is
ever added. Enrollment runs on pristine VARS copies only, one invocation per template.
Throwaway PK/KEK (1-day, CN=C5-THROWAWAY-*), generated per ceremony run, never logged/uploaded/cached.
ESLs use EFI_CERT_X509_GUID (a159c0a5-e494-a74a-87b5-ab155c2bf072), fixture owner GUID
c501e570-0de0-0001-0000-000000000000; mixed cert sizes are emitted as concatenated per-size
EFI_SIGNATURE_LISTs. .auth blobs via sbvarsign (db KEK-signed, KEK PK-signed, PK self-signed).
Four templates: sole db=[production cert], widened db2=[production, hostile fixture cert],
sole-fresh (second independent sole enrollment for R6), throwaway db=[the run's ephemeral CI
signing cert] (criterion C: generated in-run by the c-sign step, private key plain-deleted by an
in-step trap, never committed/logged/uploaded; the expectation reaches the predicate checker as
the ceremony-exported C5_THROWAWAY_CERT_SHA256 bound to the c-sign SHASUMS record).

Enrollment predicate (requirement 5a resolution, pre-frozen - reviewer ruling: any different
rehearsal value = FAIL; the predicate cannot be reinterpreted; changing the predicate = new
SHA + two rehearsals). enroll-predicate-check.py (sha256
35309a3a45e4ddc0d904c4428d3a944e476f3a5088b28fd13c646cc5b88cf3ca, exit 92, E_ENROLL_* /
E_TRUST_* codes) runs inside the ceremony immediately after each enrollment's ENROLL.TXT
extraction and fails the run on any deviation; its report is stored as that enrollment's
enroll-predicate.json evidence. Frozen predicate: SET_{DB,KEK,PK}_STATUS = EFI_SUCCESS(0);
SecureBoot: GetVariable EFI_SUCCESS, attributes exactly 6 (EFI_VARIABLE_BOOTSERVICE_ACCESS |
EFI_VARIABLE_RUNTIME_ACCESS only), size 1, data 0x01; SetupMode: GetVariable EFI_SUCCESS,
attributes exactly 6 (BS|RT only), size 1, data 0x00. Source citations (edk2
edc6681206c1a8791981a2f911d2fb8b3d2f5768, the certified firmware's pinned commit):
- PK enrollment in SETUP_MODE transitions the platform to USER_MODE:
  SecurityPkg/Library/AuthVariableLib/AuthService.c:780-784 (ProcessVarWithPk calls
  UpdatePlatformMode(USER_MODE)).
- UpdatePlatformMode (AuthService.c:384) writes SetupMode in place (AuthService.c:409-410);
  the SetupMode variable itself is created with BS|RT attributes at library init
  (SecurityPkg/Library/AuthVariableLib/AuthVariableLib.c:172-186; SETUP_MODE while PK is
  absent, AuthVariableLib.c:175).
- USER_MODE => SecureBoot := SECURE_BOOT_MODE_ENABLE(1) (AuthService.c:440-441), written
  with RT|BS attributes only (AuthService.c:449-456, attributes at :454).
- SecureBootEnable: ABSENT in the pristine VARS (parse evidence: variable_count 0 over
  sha256 5d2ac383371b408398accee7ec27c8c09ea5b74a0de0ceea6513388b15be5d1e); it is not
  created while SETUP_MODE (AuthVariableLib.c:211-217); it is created = SECURE_BOOT_ENABLE(1)
  with NV|BS attributes on the USER_MODE transition (AuthService.c:472-476 create branch,
  written at :489-495) and on subsequent boots (AuthVariableLib.c:218-227); it is deleted
  only when secure boot is disabled (AuthService.c:478-486); runtime writes/deletes are
  physically-present-gated (AuthService.c:340-345). Post-enrollment SecureBootEnable=0x01
  NV|BS is recorded observationally in each enroll-predicate.json; the fail-closed
  predicate is the SecureBoot/SetupMode pair above.

## 6. Case set (config.json, exact values, no wildcards)
NON_CERTIFYING_REHEARSAL-R1-historical-13309697-reject-control (renamed from "R1" in C1', ruling B3, see section 15) historical-death control: frozen ESP (carrying the accepted signed UKI 13309697..), DEBUG
firmware, sole template (db=[production cert]). Expect: NO kernel exec, exactly the
signed-untrusted reject pair ("Image is signed but signature is not allowed by DB and %s hash
of image is not found in DB/DBX" plus the companion "The image doesn't pass verification").
The 13309697 signature is cryptographically valid yet its embedded digest does not match its
own bytes (run-19' evidence; UKI-13309697-ROOT-CAUSE.md), so the owner-db firmware rejects it.
The positive contract below now attaches to the criterion-C throwaway cases (C-*), whose ESP
variants carry the in-run throwaway-signed successor UKI.
Positive contract (frozen): post-run RAM contains the
CONTIGUOUS runtime-formatted kernel panic records "Kernel panic - not syncing: Attempted to
kill init!" AND "Attempted to kill init! exitcode=0x00006200" (exit 98), zero reject strings,
zero "Attempted to kill init! exitcode=0x00006100" (exit 97). Additionally (requirement 6):
the signed adapter's own evidence strings E_PROVIDER_NAMESPACE and E_PROVIDER_LINK_MISSING
are RECORDED observationally per case (markers.adapter_strings_present in the deterministic
manifest). They are at-rest bytes inside the accepted signed UKI 13309697..'s uncompressed
initrd, and the firmware loads the UKI image into guest RAM for hash verification even on
REJECT paths, so their presence or absence in a post-run RAM dump is NON-EVIDENTIARY:
no fail-closed expectation is attached in either direction (a fail-closed absence check in
the reject cases was a false-fail risk and was removed on the reviewer's recommendation;
execution provenance is the frozen runtime-formatted panic records above, which cannot
exist at rest).
Marker provenance (frozen): the signed cmdline (ro root=/dev/mapper/v3-root-admitter
rootfstype=ext4 v3.root_admitter_verity=533d6d61..) carries NO console= parameter, so the
serial channel is unsupported and the runtime-only channel is the kernel printk ring buffer,
read via the QMP dump-guest-memory snapshot. The initrd inside the accepted UKI is an
UNCOMPRESSED newc cpio (magic "070701" at .initrd offset 0; 9,371,136 B), so its bytes DO
appear verbatim in rootfs RAM at rest and no bare initrd string can prove execution. The
frozen lines are runtime-formatted panic() output: the kernel image holds only the
"exitcode=0x%08x" format string, and each frozen formatted line exists in NO input byte
stream (verified absent from the accepted signed UKI 13309697.. bytes), so its presence in
the post-run RAM proves the kernel formatted it at runtime - genuine execution, not at-rest
initrd bytes. The panic records are the execution provenance; the adapter evidence strings
are recorded observationally only (non-evidentiary at rest, see the requirement-6 note
above).
R2 N1: ESP variant carrying unsigned UKI. Expect: no kernel exec, exactly the unsigned-reject string.
R3 N2: ESP variant carrying F-WRONGSIG.efi. Expect: no kernel exec, exactly the signed-untrusted string.
R4 N3a: ESP variant carrying F-HOSTILEUKI.efi, sole template. Expect: signed-untrusted string.
R5 N3b: same hostile ESP, WIDENED template (db2 includes hostile cert). Expect: firmware ACCEPTS
(kernel exec true, zero reject strings) — proves db content controls the decision.
R6 N3c: same hostile ESP, sole-FRESH template. Expect: rejected again — no persistence across VMs.
R7: RELEASE sibling, R1-historical inputs (case id renamed in C1', see section 15). Behavior-only observation; no string claims, no equivalence claims.
C-ossl-throwaway-debug / C-ossl-throwaway-release: ESP variant built in-ceremony from the
c-sign step's osslsigncode arm (in-run ephemeral cert), throwaway template, DEBUG resp.
RELEASE firmware. Expect: the frozen positive contract (kernel exec, exit 98, zero reject strings).
C-sbsign-throwaway-debug / C-sbsign-throwaway-release: same shape for the sbsign arm.
The runtime ESPs and throwaway cert are per-run and carry no committed hash pins; the ceremony
binds them to the c-sign SHASUMS record before any guest runs (E_THROWAWAY_PAYLOAD_MISMATCH).
R8 (VARS delta + predicates, requirement 5b resolution - pre-frozen): stored PK/KEK/db data
byte-equal the enrolled ESL payloads; PK and KEK each exactly one X509 ESL entry
(EFI_CERT_X509_GUID a159c0a5-e494-a74a-87b5-ab155c2bf072), owner
c501e570-0de0-0001-0000-000000000000, DER equal to this run's throwaway PK/KEK DER (DER
hashes recorded in each enroll-predicate.json; private keys plain-deleted when the
enrollment window closes, never logged/uploaded/published); sole db exactly {7cda4ddc..};
widened db exactly {7cda4ddc.., 5b5e4edc..}; throwaway db exactly {the run's ephemeral CI signing cert DER sha256}; dbx ABSENT (frozen form: absent, not empty);
dbt and all *Default trust variables ABSENT; no other authenticated trust variables. Each
case draws its VARS from exactly one of the three run-fresh post-enrollment templates via
absolute config paths; the harness asserts the template allowlist and byte-identity before
every case boot (failed checks -> suite exit 91). Post-enrollment templates and per-case
pre/post VARS structural parse summaries + hashes are recorded observationally
(parse-ovmf-vars.py); the hashes are evidence, not pre-frozen expectations.
R9 (CPU record): -cpu Skylake-Server pinned in every argv; argv sha256 recorded per case.
Every case: fresh VARS copy, KVM fail-closed (E_NO_KVM), -nic none, q35 smm=on, secboot pflash,
debugcon capture, QMP dump-guest-memory, TERM-then-KILL reaping, deterministic + observational
manifests, suite exit 91 on any violated expectation.
Requirement 5c (frozen pre-publication): the exact QEMU argv per case is frozen in
argv-freeze.json (schema NON_CERTIFYING_REHEARSAL-argv-freeze/v1): q35 smm=on, KVM, -cpu
Skylake-Server, pflash unit0 readonly + cfi.pflash01 secure=on, pflash unit1 VARS, -nic none,
-display none, -serial none, debugcon isa-debugcon 0x402, QMP unix socket, 4096 MB, ESP
(bootindex=0 since #19, H1) + six v3-serial virtio-blk drives, -daemonize. argv_sha256 per
case (NUL-joined, identical to the harness's own recording): R1 c581e7dda5d855f2.., R2
f382e94075d87cd0.., R3 46d5c1c485cec634.., R4 daa8eee9131d7d2c.., R5 4a780d858f457e07.., R6
6f2fc5a541aebbd2.., R7 2d450e95e778d9f1.., C-ossl-debug ddc0e5c285dd0884.., C-ossl-release
efe08f207a651493.., C-sbsign-debug db4a6507297b386c.., C-sbsign-release 0765626bfa54dacd..
(the four criterion-C argvs are template transforms of R1/R7 - same qemu/firmware/disk shape,
case-dir and ESP paths substituted; all seven original pins byte-unchanged)
(full 64-hex values and complete argv vectors in argv-freeze.json). Per-case work dirs live
under OUT/NON_CERTIFYING_REHEARSAL-cases/ so every top-level evidence path carries the
rehearsal prefix (workflow guard E_UNPREFIXED_TOPLEVEL_EVIDENCE).
The six v3-* virtio disks carry honest v3 serials; the adapter exits 98 at
E_PROVIDER_NAMESPACE/E_PROVIDER_LINK_MISSING before any v3 device use (grounded in
cloud-boot-adapter.sh); their presence proves v3-named devices do not satisfy the google-
provider namespace. No Google device names are faked anywhere.

## 7. Workflow placement, triggers, and rehearsal discipline
Reviewer ruling (integrated): NO default-branch write, no workflow_dispatch. GitHub Actions
runs a push-triggered workflow from the workflow file AT the pushed commit, including on
non-default branches (docs.github.com/actions/reference/workflows-and-actions/events-that-trigger-workflows,
push: "GITHUB_SHA: Tip commit pushed to the ref"; "Runs your workflow when you push a commit
or tag ... This includes workflows that are not merged into the default branch.").
workflow_dispatch would require the file on the default branch
(docs.github.com/actions/how-tos/manage-workflow-runs/manually-run-a-workflow: "To trigger
the workflow_dispatch event, your workflow must be in the default branch.") - rejected: the
default branch is never touched.
Placement: exactly ONE copy of each workflow, both at .github/workflows/ on the candidate
commit: NON_CERTIFYING_REHEARSAL-workflow.yml (sha256
864a91a57ffea84c946835e71e04b4f3f20843f9da65c26e9df7e00110b1c96b) and
OVMF_CI_SECURE_BOOT_UKI-CERTIFICATION-workflow.yml (sha256
202c8c263137fd3cce8803cdaaf6bda48a1e33b82e9d0468a3db8b07ec8aa8ea). No docs/ copies
(preflight E_STALE_DOCS_WORKFLOW / E_WORKFLOW_MISSING).
Rehearsal trigger: on push, exact branches filter [p3-rehearsal-3, p3-rehearsal-4] - two
names, no wildcards, no other events (ref rotation per the reviewer ruling after D2:
p3-rehearsal-1 is SPENT and preserved immutably at 02f3eab9, p3-rehearsal-2 was never
created; -1/-2 are removed entirely so a stray push to a spent ref can never run).
The TWO clean sequential rehearsals are two separate fresh pushes of the SAME candidate
SHA: p3-rehearsal-3 first; p3-rehearsal-4 only after a FULL -3 pass with no stray runs.
No other commits to the filtered refs; no cancel, no re-run; all runs preserved. Every
job's first step fails closed unless github.run_attempt == 1 AND github.ref is exactly one
of the two filtered refs (E_RERUN_FORBIDDEN / E_REF_MISMATCH, exit 89): no re-run counts;
any accidental run is preserved and reported.
Certification trigger: on push, exact branches filter [p3-certification], never overlapping
the rehearsal filters. The p3-certification ref MUST NOT exist before STATIC ACCEPT. After
STATIC ACCEPT the single certification run is created by pushing the already-accepted SHA
once to the new p3-certification ref - no new commit, so certified SHA == reviewed SHA.
Every job's first step fails closed unless github.run_attempt == 1 AND github.ref ==
refs/heads/p3-certification.
Both workflows: runs-on ubuntu-22.04 (pinned: unprivileged user namespaces required for the
bwrap canonical-path mechanism; ubuntu-24.04 runners restrict them via AppArmor),
permissions {}, ref+attempt gate, KVM fail-closed step (E_NO_KVM), staging as the ONLY
network phase FIRST (the ceremony runs under sudo unshare -n) with timeout-minutes 20 on
the staging steps (D3 ruling) - now TRUE of sources too (D4: edk2 + submodule sources staged
once into the source cache in that same phase; every build runs under bwrap --unshare-net
with GIT_ALLOW_PROTOCOL=file, so a build attempting any network access fails), then the staged-bwrap userns preflight exercising the exact
lock-verified bwrap the builds re-exec, in the build script's own merged-/usr namespace
form (--ro-bind /usr /usr plus --symlink usr/bin /bin, usr/sbin /sbin, usr/lib /lib,
usr/lib64 /lib64 - the same bind/symlink set build-ovmf-debug.sh re-execs into, so the
preflight tests the SAME namespace shape as the build; D3 ruling). On preflight failure
bwrap's stderr is printed; genuine user-namespace failures fail E_NO_USERNS, any other
failure fails E_PREFLIGHT_NS_EXEC (both exit 91, fail-closed),
dual-build assertions at canonical /build with the accepted-firmware hash+size hard gates
(section 4) plus a second-runner env2 reproduction job with the same pins and a
cross-runner hash gate, hostile-path drift demonstration fail-closed on THREE assertions
(the preserved-tree module scan exits EXACTLY 43 - PASS, crash, missing tree, or vacuous
45 all fail the job; EVERY scanned module carries the hostile path, counts parsed from the
verifier verdict; the hostile CODE hash differs from accepted fc150336.., proving real
drift), ephemeral artifact upload only. Every GitHub action is pinned to a full commit SHA:
actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 (v4.2.2, persist-credentials:
false), actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 (v4.6.2),
actions/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093 (v4.3.0); the SHAs are
recorded in the publication manifest. The env2 download-artifact path is the literal
prefixed path /tmp/OVMF_CI_SECURE_BOOT_UKI-fw1 / /tmp/NON_CERTIFYING_REHEARSAL-fw1 (no
expansion tricks). There is no mode input: every triggered run is the full ceremony.
The rehearsal NEVER emits the closing marker. Its ceremony stdout/stderr is tee'd into the
evidence tree as NON_CERTIFYING_REHEARSAL-ceremony.log, and a forbidden-marker guard step
then scans the ENTIRE evidence tree (which includes that log) with grep -r -a -F -l -
explicit if, fixed-string, binary-inclusive - failing exit 94 if the closing marker string
appears anywhere, plus a top-level prefix guard (find -mindepth 1 -maxdepth 1) failing
exit 94 on any un-prefixed path under the evidence root. The certification workflow
replaces that guard with the closing certification-marker job (needs: BOTH ceremony jobs
green) which emits OVMF_CI_SECURE_BOOT_UKI_PASS once to stdout and once into the evidence
marker file, each time paired with the full nonclaim block: NOT a full runtime PASS; NOT a
dm-verity runtime PASS; NOT a provisioning PASS; NOT a Google platform certification; NOT
a complete boot-chain certification; NO claims about Google firmware, Google vTPM, GCP
deployment, or persistence. Each emission is bound to the exact run with SHA=$github.sha,
RUN_ID=$github.run_id, REF=$github.ref lines, so the marker cannot be transplanted onto
another commit or run (arity and exact-once shape verified locally by simulation).
certification-vs-rehearsal.diff (sha256
130b608c0d221e39de482dd778a9a9f27e7f7501bdb348ca7588fc4aa5877009) shows the diff is
strictly limited to (a) mode label: header comments, workflow/job/step names, trigger ref
filter, ref-gate target; (b) marker emission: the forbidden-marker guard step removed, the
closing certification-marker job added; (c) artifact names only. BOTH workflows pin env
PREFIX to NON_CERTIFYING_REHEARSAL and use IDENTICAL /tmp/NON_CERTIFYING_REHEARSAL-*
scratch paths (D1 conformance): the frozen scripts and config hardcode the rehearsal
scratch paths, so the certification run must execute the exact rehearsed bytes against the
exact rehearsed paths - certification evidence is provably produced by the rehearsed
bytes. preflight-check.py check 1c statically enforces this (E_WORKFLOW_PREFIX_MISMATCH /
E_SCRATCH_PREFIX_MISMATCH across both workflows, config.json, rehearsal-harness.py,
run-ceremony.sh and rehearsal-enroll.sh); negative-derisked against the superseded
certification workflow, which it flags. A byte-identical workflow-argument existence gate
step (D2 ruling item c) sits right after checkout and before staging in every job that
stages: a fixed list of every relative file/script argument used by later steps
(platform.lock.json, config.json, stage-platform.sh, make-shims.sh, preflight-check.py,
build-ovmf-debug.sh, scan-pe-pdb-paths.py, build-enroll-app.sh, ../build-esp-image.sh,
evidence/successor-signed.efi, run-ceremony.sh), failing closed E_WORKFLOW_ARG_MISSING
exit 88 on the first missing reference. The gate step name intentionally carries no mode
prefix so the step is byte-identical across both workflows (gate block sha256
e593dc8152a4f99d97e24f85a767328cdf2b4c4fe292fe75fa66d509e31f6b62 in all 4 positions). Internal
scratch names stay NON_CERTIFYING_REHEARSAL because the rehearsed scripts are frozen bytes -
an audit property: certification evidence is provably produced by the exact rehearsed bytes.
Historical refs: candidate5-p3-rehearsal holds the superseded candidate
90dc3167b4a8a6d385fa8ccdb49bf12336edecd3 (docs/-path workflows, workflow_dispatch): never
dispatched, never peer-reviewed, never to be force-pushed, rewritten, or deleted.
p3-rehearsal-1 is preserved immutably at 02f3eab9 (spent: rehearsal-1, D2 failure, run
35812361943); p3-rehearsal-2 was never created. Approved fresh refs: p3-rehearsal-3
(first) and p3-rehearsal-4 (only after a full -3 pass).
After STATIC ACCEPT: exactly ONE certification run at the exact accepted head.
Every run URL, head SHA, workflow blob, inputs, logs, and failures are preserved.

## 8. Local derisk performed + frozen reproducibility audit (observational)
Derisk executions:
- full staging executed locally: 160/160 debs hash-verified (bubblewrap 0.9.0-1ubuntu0.3
  added to the lock; the byte-identical recorded noble indices regenerate the 159 prior
  entries unchanged), pristine VARS verified
- staged bwrap through the make-shims loader shim launches the EXACT canonical /build
  namespace argv used by build-ovmf-debug.sh (full bind list + exec verified locally;
  a probe write lands in the real bound work dir)
- BaseTools built from the pinned commit: 303/303 tests OK
- enroll-app.c dual-build byte-identity reproduced (enroll-app.efi sha256 35dee872cd4905187981f39c47e5f589cd2242dc44a250c34e153613e5992b38)
- ESP rebuild reproduces the frozen image 2bfa6212...; verify-esp.py PASS
- ESL/.auth chain closed offline; parse-back: db = exactly 1 entry = production cert
- OVMF DEBUG dual build at canonical /build: byte-identical, hashes in section 4
- env2 second-environment reproduction at /build: byte-identical (below)
- preflight-check.py end-to-end PASS (zero errors)

Frozen reproducibility audit (reviewer ruling: no binary regeneration; records below suffice).
All builds: edk2 edc6681206c1a8791981a2f911d2fb8b3d2f5768, staged toolchain platform.lock
86454077 (v160; the demonstrated builds ran under v159 f817f41e - the v160 delta is the
bubblewrap deb only, which no demonstrated build consumed), SOURCE_DATE_EPOCH=1706745600, PYTHONHASHSEED=0. All FDs 3653632 B CODE / 540672 B VARS.

| run | time (IDT, Sep 23) | recipe / workdir path | OVMF_CODE.fd sha256 | result |
|-----|--------------------|-----------------------|---------------------|--------|
| 1 | Sep 22 ~18:00-19:00 | no prefix-map; /tmp/p3/ovmf-a + /tmp/p3/ovmf-b | A f46dd99b.., B 7b3d4a4a.. | MISMATCH: 1,910,805 byte diffs, first diff char 137, 41 embedded "/tmp/p3/ovmf-a" strings; VARS identical pristine. Fix: -ffile-prefix-map=$(WORKSPACE)=/ws |
| 2 | 00:06 / 01:02 | prefix-map; /tmp/p3/ovmf-a + /tmp/p3/ovmf-b | A 25182c74ef0a4539fe7737e82d03d5c84671e3ca5eadae913ed3a72a7609b1d6, B 8420f6dc4821c2d460823a5dee7b8fce25085e98c900c78d9ee799cd95344199 | MISMATCH: 1,910,262 byte diffs, first diff char 32660; 7,374 small clusters; regions 0-7 (~261K diffs per 256 KiB = the COMPRESSED PEI FV, one early byte cascades), exactly 1 diff in the uncompressed DXE region; VARS 5d2ac383 both |
| 3 | 01:03-01:34 / 02:02-02:19 | + -g0 (script 0d19aed5); same paths | identical to run 2 per workdir (A 25182c74, B 8420f6dc) | MISMATCH, same bytes as run 2: builds ~1 h apart are byte-identical per workdir, falsifying any wall-clock-timestamp theory; -g0 provably no FD effect (GenFw strips DWARF pre-FD) |
| 4 | 02:21-02:22 | fixed-path /tmp/p3/ovmf-work (script 16904627) | n/a | KILLED pre-completion 02:22: superseded by reviewer condition 1 (not a canonical in-container path); no outputs produced |
| 5 | 02:24-03:07 | canonical /build via bwrap namespace (script 2a07f221) | fc150336fce10eb5508fa440cdf7300622c8c3ac71f2fbe10a0731422b9cef24 | PASS: two clean sequential builds byte-identical; VARS 5d2ac383 |
| env2 | 03:08-03:37 | /var/tmp/ovmf-env2 bound to /build, own namespace (script 59b52fcb) | fc150336fce10eb5508fa440cdf7300622c8c3ac71f2fbe10a0731422b9cef24 | PASS: second fresh environment byte-identical to run 5; full-tree scan: 366/366 module .efi NB10 PDB paths all /build/ prefix (verifier PASS) |
| hostile | 03:37-04:20 | deliberate /tmp/p3/ovmf-hostile (script 59b52fcb + manual cp after an OUTA-mkdir bug, fixed in 73cf82af) | edc77fb4619387b21cc87eaff3c8767cc23012d6c6a5fd37e0d8b814be5f8955 | DRIFT as predicted: same pinned inputs, different path, different bytes. Verifier REJECT exit 43: 366/366 modules carry NB10 PDB path /tmp/p3/ovmf-hostile/... (e.g. SecMain, CpuDxe, BdsDxe); VARS 5d2ac383 |
| final-script | 04:24-05:07 | canonical /build via bwrap, real path /var/tmp/ovmf-final (script 73cf82af, the EXACT A3-shipped script) | fc150336fce10eb5508fa440cdf7300622c8c3ac71f2fbe10a0731422b9cef24 | PASS: the final shipped script reproduces the canonical bytes; closes the ONE SHA = ONE REVIEW requirement that the reviewed script is the demonstrated script; VARS 5d2ac383 |

Root cause (corrected): GenFw embeds each module's ABSOLUTE .dll path in a CodeView NB10
debug-directory entry; no compiler flag rewrites it and -g0 does not remove the entry. GenFw
source evidence (BaseTools/Source/C/GenFw/GenFw.c): FileHdr->TimeDateStamp = 0 (line ~2976) and
DebugEntry->TimeDateStamp = 0 (line ~2992) in the normal conversion path; wall-clock stamping
exists only in the FW_SET_STAMP_IMAGE/--setstamp path (SetStamp, line ~3023/3239), which the
build never invokes. Representative diff evidence (run 2, SecMain.dll A vs B): exactly 4 bytes
at file offset 71309, A = 0f fe 4b 1b, B = 91 f1 2e a2, immediately following the string
"SecMain.debug\0\0\0". SUPERSEDED THEORY: "GenFw writes a wall-clock debug-directory timestamp
(ignoring SOURCE_DATE_EPOCH)" — falsified by run 2 vs run 3 byte-identity across different
wall-clock build times; retained here as a corrected record, not as fact.

Retention record: run 1/2/3 firmware binaries were deleted at relaunches before the retention
request existed. Their SHA-256s, sizes, diff statistics and hex context (above) are preserved
and are self-proving; per-workdir determinism (run 2 == run 3) means the bytes are
regenerable on demand with the recorded recipes; the reviewer ruled no regeneration is wanted.
The hostile different-path build + verifier extraction (hashes and offending paths above) is
the standing drift evidence; its tree at /tmp/p3/ovmf-hostile is ephemeral CI-style scratch.

Verifier self-audit: scan-pe-pdb-paths.py v1 (0e11624a) had a wrong PE32+ data-directory
offset (0x88 vs 0x70) and a heredoc-corrupted carve regex; its first "PASS" was vacuous
(0 entries). Caught by ground-truthing against SecMain.efi. v2 (94ada3e6) hard-fails
(exit 45 E_NO_DEBUG_ENTRIES-style) when zero debug entries are found, so a vacuous pass
is now impossible. All verdicts above are v2 verdicts. v3 (6bcb1693, current) reports
per-module reject counts; re-verified against the preserved local trees: hostile tree
366/366 modules rejected (exit 43), canonical final tree PASS (exit 0), and the
workflow's verdict-count extraction validated against the real scanner output.

Bugs found and fixed during derisk: FAT16/FAT32 field mismatch in the enrollment image writer
(rewritten FAT32); mixed-size ESL emission (concatenated per-size lists); noble cc1/lto-wrapper
libexec path; glibc mixing in host-tool builds (shim + host-compat split); edksetup under
set -euo; edksetup parsing outer "$@"; WORKSPACE env bleed between workdirs; tools_def append
ordering vs edksetup; python3/python symlink; subhook repo unreachable (UnitTestFrameworkPkg
dropped from the submodule set); LTO disabled in frozen flags (host-toolchain coupling);
workdir path leak into FD (prefix-map); CodeView absolute PDB path (canonical /build);
hostile-mode OUTA mkdir omission; verifier v1 PE32+ offset.

Publication-candidate hardening (2026-09-23, pre-conformance):
- certification workflow fail-open removed: the inherited `if: inputs.mode == 'run'`
  conditionals would have evaluated FALSE under any no-inputs trigger, skipping the ceremony
  steps while the marker step still ran. Both workflows are now push-triggered with no mode
  input; every step runs unconditionally behind the ref+attempt gate. The marker also moved
  to a closing job gated on BOTH ceremony jobs; it previously could emit before the env2
  cross-runner verdict.
- preflight section 1 marker scan whitelisted only two files, so it flagged R3, the
  manifest, the diff, and the certification workflow (all legitimately naming the marker);
  the whitelist is now explicit by role (define/guard/diff/emit).
- parse-ovmf-vars.py name decode: a byte-level rstrip ate the last UTF-16 unit's high zero
  byte, making every populated-store name undecodable (never exercised locally - no KVM);
  caught by the enroll-predicate-check.py synthetic fixtures (10/10 pass/fail cases);
  fixed: decode first, then strip the terminator.
- config.json per-case vars_template paths were relative "out/...", which resolved to a
  nonexistent rehearsal-dir path at ceremony runtime; now absolute run-fresh paths under
  /tmp/NON_CERTIFYING_REHEARSAL-out/ and allowlist-checked in the harness.
- parse-ovmf-vars.py was mode 0644 while the harness invokes it directly; now 0755 (the
  predicate checker also invokes it via sys.executable).
- throwaway-key hygiene: run-ceremony.sh now plain-deletes the prep dir (PK/KEK private
  keys) the moment the enrollment window closes; the DER hashes persist in each
  enroll-predicate.json.
Conformance corrections C1-C9 (2026-09-23, pre-rehearsal conformance on cf5c28a3 = FAIL;
design accepted, these corrections ordered in ONE new candidate commit, parent cd455a06):
- C1: rehearsal evidence tree is now fully prefix-clean: ceremony stdout/stderr tee'd into
  NON_CERTIFYING_REHEARSAL-ceremony.log; harness work_root moved to
  OUT/NON_CERTIFYING_REHEARSAL-cases (argv-freeze regenerated, hashes in section 6); guard
  scans the whole tree with grep -r -a -F -l and a find-based top-level prefix guard.
- C2: hostile demonstration hardened: hostile build honors CANON_REALWORK (preserved tree =
  scanned tree); scanner v3 prints per-module reject counts; the workflow requires exit
  EXACTLY 43, all-scanned-modules-bad, and hostile CODE hash != accepted fc150336...
- C3: env2 download-artifact path is the literal prefixed path (no expansion tricks).
- C4: accepted-firmware hash+size hard gates (exit 95) in the main build job AND env2.
- C5: every GitHub action pinned to a full commit SHA (checkout v4.2.2 / upload-artifact
  v4.6.2 / download-artifact v4.3.0), recorded in the manifest's ci_action_pins.
- C6: bwrap added to the platform lock (160 debs, new lock hash 86454077..); builds re-exec
  ONLY the staged lock-verified bwrap via the loader shim (host bwrap never used); workflow
  step order: kvm check, checkout, staging, make-shims + staged-bwrap preflight, preflight,
  builds. Mechanism verified locally with the exact script argv.
- C7: RAM markers frozen as contiguous runtime-formatted panic records (provenance analysis
  in section 6): the signed cmdline has no console= (ring-buffer channel via QMP RAM dump),
  the initrd is an uncompressed newc cpio (at-rest strings carry no provenance), and the
  frozen lines are verified absent from the accepted UKI bytes.
- C8: the publication manifest declares itself as the 35th candidate path (self-excluded
  from the assets list, which enumerates the other 34).
- C9: marker emissions bound to the run (SHA/RUN_ID/REF on stdout AND in the marker file);
  the unsupported "22.04 image supported into 2027" comment claim removed from both
  workflows. Marker arity/shape verified by local simulation (exactly once per channel).
- also caught during this pass: a printf arity bug in the first C9 draft (one excess %s
  would have mislabeled SHA/RUN_ID/REF values) - fixed and proven by the same simulation;
  and the cert workflow's tee'd log initially kept the rehearsal filename (prefix leak) -
  fixed to OVMF_CI_SECURE_BOOT_UKI-ceremony.log.
Conformance round 2 (2026-09-23, conformance on 932a4352): FAIL on ONE defect (D1);
identity, 35-path diff, manifest v4, ancestry, C1-C9 all PASS. Fixed in this candidate:
- D1: the certification workflow had set env PREFIX to OVMF_CI_SECURE_BOOT_UKI while the
  frozen scripts/config hardcode NON_CERTIFYING_REHEARSAL scratch paths - the
  certification path was never rehearsed and would have failed at ceremony time. Remedy
  applied exactly as ordered: the certification workflow KEEPS PREFIX
  NON_CERTIFYING_REHEARSAL and every rehearsal scratch path; only artifact names, labels,
  trigger/gate, the removed guard, and the marker job differ. A static preflight gate
  (check 1c, above) now fails the run on any scratch-prefix divergence; negative derisk
  proves it flags the superseded workflow.
- adapter_strings_absent (reviewer recommendation, decision DISCLOSED): made observational
  in ALL cases. Ground: the adapter strings are at-rest bytes in the uncompressed initrd,
  and the firmware loads the UKI into guest RAM for hashing even on reject paths, so a
  fail-closed absence check in reject cases was a false-fail risk and presence in R1 was
  equally non-evidentiary. The C7 panic records remain the execution provenance. The
  harness records markers.adapter_strings_present per case; config.json's
  adapter_strings/adapter_strings_absent keys are retained as documentation of what is
  recorded, with no fail-closed check attached.
- constraint recorded: the inherited v3-foundation-temp.yml and
  v3-structural-enforcement-preflight.yml workflows are accepted as-is ONLY as long as no
  pull request is ever opened on this repository (their triggers/job shapes were not
  reviewed for PR events). No PR will be opened.
Conformance round 3 (2026-09-23): REHEARSAL-1 FAILED on defect D2. Run (preserved):
https://github.com/instinct-candidate5-8e5bc4/candidate5-v3-authority-promotion/actions/runs/35812361943
- head 02f3eab9, attempt 1, ubuntu-22.04 image 20260907.292.1, runner 2.337.0. The
rehearsal job's staging step died in <1s (FileNotFoundError 'platform.lock'): the
workflow invoked "./stage-platform.sh platform.lock ..." while the committed lockfile is
platform.lock.json (the canonical name used by preflight-check.py, platform-lockgen.py,
the manifest, and stage-platform.sh's own header). All ceremony steps skipped, env2
skipped, zero cases ran; the inherited closure-temp workflow skipped cleanly; no stray
runs. Root cause of escape: local derisk always staged via the canonical platform.lock.json
name, and no static check cross-verified workflow-referenced filenames against the tree.
The reviewer MISSED D2 in its own conformance of 02f3eab9 (which it had passed); D2
surfaced only in rehearsal-1.
Conformance round 4 (2026-09-23, reviewer ruling on D2 - complete): candidate 04938d1b
(this workspace's first D2 fix, never submitted) is SUPERSEDED: it still targeted the
spent refs -1/-2 and carried a preflight-side gate the ruling does not include. The
ordered delta a-d is implemented exactly in this candidate and NOTHING else:
(a) platform.lock -> platform.lock.json in all 4 staging invocations (main + env2, both
workflows); (b) ref rotation of the rehearsal workflow trigger filter and both
rehearsal-job ref gates to exactly [p3-rehearsal-3, p3-rehearsal-4], -1/-2 removed
entirely; the certification workflow's only change is (a); (c) the byte-identical
workflow-argument existence gate step (section 7; E_WORKFLOW_ARG_MISSING, exit 88) after
checkout and before staging in every staging job of both workflows - preflight-check.py
kept byte-identical to 02f3eab9 (check 1c stays; the preflight-side 1d gate from
04938d1b is NOT carried over, per the ruling's strict delta scope); (d) the diff
artifact, this document and the manifest regenerated. Ref status frozen by the ruling:
p3-rehearsal-1 preserved immutably at 02f3eab9 (spent); p3-rehearsal-2 never created;
approved fresh refs p3-rehearsal-3 (first) and p3-rehearsal-4 (only after a full -3
pass); no cancel/re-run; all runs preserved; the failed-run URL/log and the inherited
no-op skipped-run records go into R4.

Conformance round 5 (2026-09-23): the MANDATORY fresh-clone replay of candidate 2d92bf1b
FAILED before submission on defect D3. Failing step: the userns/bwrap preflight
(rc=91, "bwrap: execvp true: No such file or directory"). Root cause: the preflight's bwrap
bind set (--ro-bind /usr /usr --symlink usr/bin /bin) omitted /lib and /lib64, so the
namespace lacked the ELF interpreter /lib64/ld-linux-x86-64.so.2 and execvp of ANY dynamic
binary returned ENOENT - the E_NO_USERNS verdict would have been a FALSE negative on any
usrmerge Ubuntu runner, CI included. Reproduced with the staged noble bwrap AND the host
jammy bwrap (identical failure with the committed arguments); the same command with /lib +
/lib64 added passed rc=0. The defective line was inherited byte-identically from 02f3eab9
in ALL 4 positions (both jobs, BOTH workflows - certification included) and had never
executed anywhere: rehearsal-1 died at D2 in the staging step, before the preflight, and no
local replay had reached it. The reviewer MISSED D3 in its conformance of 02f3eab9 and in
its D2 ruling scope; D3 surfaced only in the fresh-clone replay. Replay timeline (three
starts, all preserved in the transcript): (1) 06:01:51 stalled on a dead download socket at
deb #116 (libgomp1) during an environment pause - urlretrieve had no timeout; the driver
tree was killed and the replay relaunched (verified debs hash-skip on re-stage); (2)
06:54:03 killed early by a local harness timeout after re-running the argument gate green -
no state impact; (3) 06:54:57 ran staging green (160 debs, all hashes verified; pristine
VARS verified) then hit D3. Replay transcript final sha256
aa16b97b3934a309fe25d0f097d3895308e4ff37d507e9e59a8d73ab38d5141a. Candidate 2d92bf1b is
SUPERSEDED unsubmitted. Reviewer ruling on D3 (complete), implemented exactly in this
candidate and NOTHING else: (1) in ALL 4 preflight locations (main + env2, both workflows)
the bwrap argument list is replaced with the build script's own merged-/usr form
(--symlink usr/sbin /sbin, usr/lib /lib, usr/lib64 /lib64 added); the separate
"--ro-bind /lib /lib --ro-bind /lib64 /lib64" approach is FORBIDDEN (it tests a different
namespace than the build uses); (2) error split: bwrap stderr printed on failure;
E_NO_USERNS only for genuine user-namespace failures, otherwise E_PREFLIGHT_NS_EXEC
(exit 91); (3) staging hardened (section 3) plus timeout-minutes 20 on the staging steps of
both workflows; (4) the diff artifact, this document and the manifest regenerated. Ref
status UNCHANGED by D3: p3-rehearsal-1 preserved immutably at 02f3eab9 (spent);
p3-rehearsal-2 never created; fresh refs p3-rehearsal-3 (first) and p3-rehearsal-4 (only
after a full -3 pass) remain unused; the certification ref remains absent.
Conformance round 6 (2026-09-23): the MANDATORY fresh-clone replay of candidate 35a489e7
FAILED before submission on defect D4. Failing step: the hostile OVMF build (rc=1, 1763s):
the openssl submodule clone from github.com died twice on the network (curl 56 GnuTLS recv
error -54) and git aborted. All prior legs were green: argument gate, staging (160 debs +
pristine VARS verified), staged-bwrap userns preflight, static conformance, and the OVMF
DEBUG dual build at canonical /build (6764s; both .fd pairs byte-identical; accepted-firmware
pins fc150336.. / 3653632 B and 5d2ac383.. / 540672 B green). Root cause (D4):
build-ovmf-debug.sh fetched edk2 (pin edc66812..) and its pinned submodules over the network
in EVERY build leg (a, b, hostile, env2) with no timeout or retry - contradicting the frozen
"staging is the ONLY network phase" claim (section 7) and putting a flake path on the
one-shot certification run. The reviewer MISSED D4 in conformance: the network-fetch-in-build
design was inherited byte-identically from 02f3eab9 and passed the C1-C9 conformance and five
conformance rounds without being flagged; it surfaced only when a real network failure hit a
replay build leg. Replay attempt history (every attempt with SHA and outcome; all transcripts
preserved): (i) 2d92bf1b - three starts 06:01:51 (stalled on a dead download socket at deb
#116 during an environment pause; killed), 06:54:03 (killed by a local harness timeout),
06:54:57 (FAIL at the D3 preflight, rc=91) - round 5 above; (ii) fce0a93c - one start
07:03:24, KILLED mid-dual-build ~11:24 by a rehearsal-workspace container rebuild, NO result;
the committed bytes were lost with the workspace and the candidate tree was reconstructed
byte-identically (tree 221c7c10c5e09852935fc105c9e39095a0101250 re-derived from the recovered
edit scripts, gated on every known per-file hash) and committed as 35a489e7 - fce0a93c is
unrecoverable and SUPERSEDED unsubmitted; (iii) 35a489e7 - one start 11:30:55, FAIL at the
hostile step = D4 (above); the green dual-build pass at 35a489e7 is supporting evidence ONLY
and counts for nothing at this new SHA; transcript final sha256
81d18946587249078ab4a9e73683400503834d7eeebeffaa7324908397bb0343 (1,152 lines, 64,854 B),
preserved as the failed-attempt record for R4; no partial state (hostile tree, dual-build
outputs, staged platform) was reused for anything in this candidate. Reviewer ruling on D4
(complete), implemented exactly in this candidate and NOTHING else: (1) the edk2 + pinned
submodule fetches moved into staging into a local source cache $DEST/sources/edk2 under the
D3 fetch policy (section 3; new codes E_SOURCE_STAGE_FAILED exit 35 and E_SOURCE_PIN_MISMATCH
exit 36, implemented in stage-platform.sh; the cache re-verifies all pins on every staging
run); (2) every build copies from the local cache ONLY, network forbidden:
GIT_ALLOW_PROTOCOL=file plus bwrap --unshare-net in BOTH modes - the hostile build,
previously namespace-free, now re-execs the staged bwrap with the same merged-/usr set plus
--unshare-net, its deliberately non-canonical host path preserved verbatim for the drift
demonstration; pins re-verified per build (E_SOURCE_CACHE_MISSING / E_SOURCE_PIN_MISMATCH
exit 44); any attempted network access during a build fails the build; (3) env2 stages its
own cache through the same staging step; (4) firmware bytes must not change - the replay at
this candidate must still reproduce fc150336.. / 5d2ac383.. and the hostile build must still
drift; any hash change = stop and report; (5) this document records D4, the reviewer miss,
and every replay attempt. Ref status UNCHANGED by D4: p3-rehearsal-1 preserved immutably at
02f3eab9 (spent); p3-rehearsal-2 never created; fresh refs p3-rehearsal-3 (first) and
p3-rehearsal-4 (only after a full -3 pass) remain unused; the certification ref remains
absent.
Reviewer follow-up (2026-09-23, via main): the reviewer ACCEPTED both D4 deviations - the
nine-submodule staging (the ruling text said four) and the unchanged
certification-vs-rehearsal diff - on ONE condition: this document must list all nine
submodule paths with their gitlink commit SHAs (now in section 4). Replay attempt (iv)
60648bf3: two starts, no result, candidate bytes exonerated. Start 1 (14:04:43): killed ~12s
into the dual-build leg by a local tool-call timeout that terminated the driver process
group (harness artifact; the partial transcript was wiped and the run relaunched). Start 2
(14:05:56): FAIL in 0s at the dual-build step, rc=49 E_SYMLINK_IN_CANON_TREE - the pre-build
canonical-tree check fired on the STALE start-1 build tree in /tmp/ovmf-work-real (the edk2
worktree contains one symlink, EmulatorPkg/Unix/Host/X11IncludeHack, materialized
identically by the old git-checkout flow and the D4 cache copy) that the restart wipe
missed; the check runs before build_one's rm -rf, so an aborted local run's leftover always
trips it. Replay-prep gap, NOT a candidate defect: CI runners always start with an empty
canonical workdir, and the legs before it were green (argument gate; staging 37s incl. a
fresh source-cache fetch with all pins verified; userns/bwrap preflight; static
conformance). Terminal transcript sha256
29ae8023e80814cad602d1126f154c0781dd9822454477c2e363eed90a776880. Main's stop order for
this R3 amendment (14:08:23) arrived after the driver had already self-terminated;
60648bf3 is SUPERSEDED by this amendment with no content defect found.

## 9. Cost and publisher discipline
Zero mandatory cost forever: GitHub-hosted standard runners only, no card, no TCG fallback
(KVM-only, fail-closed). Nothing is published from the rehearsal workspace; all pushes go through
the publisher agent only on main's explicit order after review. No merge, no promotion, no PFX or
production-key involvement.
Push discipline: the publisher pushes the UNCHANGED candidate SHA only to p3-rehearsal-3 and
p3-rehearsal-4 (first -3; -4 only after -3 passes), and - after STATIC ACCEPT - the same SHA
once to the new p3-certification ref. No other refs, no tags, no force-push, no rewrites of
historical refs.

## 10. Single-cycle design: pre-frozen predicates, evidence-only R4
Reviewer ruling: the second review cycle is avoided only because every expectation the runs
must satisfy is already known and frozen BEFORE the first rehearsal; run outputs are
evidence-only. Nothing unknown was invented to dodge the cycle:
- requirement 5a (ENROLL.TXT) is pre-frozen as the exact predicate in section 5, with edk2
  source citations; any different rehearsal value FAILS the run.
- requirement 5b (VARS) is pre-frozen as the exact structural predicates in section 6; the
  exact post-run VARS image hash is NOT pre-computable without executing the firmware (no
  local KVM) and is therefore observational-only, recorded per run - no value was guessed.
- requirement 5c (QEMU argv) is pre-frozen in argv-freeze.json.
- run outputs (per-case results, observed enrollment values, VARS summaries and hashes, argv
  hashes, deterministic manifests) are evidence: they verify the frozen predicates; they do
  not feed back into the candidate.
R4 (the certification-run report) is produced from run outputs and NEVER changes the
candidate tree. It is never committed to the filtered refs, the default branch, or the old
rehearsal refs. It is published either as an orphan evidence branch (p3-evidence-r4)
carrying ONLY the report + a hash manifest and NO .github directory, or transferred
out-of-band exactly. R4 includes: both rehearsal run URLs (and the certification run URL
after STATIC ACCEPT), the equal head SHA, both workflow blobs, run_attempt = 1 evidence,
runner image versions, per-case results, enrollment values, VARS summaries, argv hashes, and
the byte-identical deterministic manifests.
The inherited no-op workflow v3-closure-temp.yml (untouched; blob sha256
e31a19e3516178b409d5dbc834cad3442a9f95198362166b3a61e5b27b13fedd; on: [push]; its single
job gated if: github.ref == 'refs/heads/candidate5', exact equality) produces a SKIPPED
run record on every filtered-ref push of the candidate SHA. R4 records its skipped-run
URL and conclusion per push alongside the rehearsal runs; any JOB EXECUTION of it on a
rehearsal or certification ref is a stray run: stop, preserve, report.

Certification exactly-one-run verifier (peer N5): the check that exactly one certification
run exists for the accepted SHA keys by the certification WORKFLOW PATH, never by all runs
for the SHA: query the workflow-scoped endpoint
/repos/<repo>/actions/workflows/OVMF_CI_SECURE_BOOT_UKI-CERTIFICATION-workflow.yml/runs?head_sha=<SHA>
(equivalently: list runs for the SHA and filter .path ==
".github/workflows/OVMF_CI_SECURE_BOOT_UKI-CERTIFICATION-workflow.yml") and assert exactly
one run, run_attempt == 1, conclusion success. EXPECTED SIBLING on the same push:
v3-closure-temp.yml (on: [push], job gated if: github.ref == 'refs/heads/candidate5')
produces a SKIPPED run record for the same SHA - it is not a certification run and must not
be counted; v3-foundation-temp.yml and v3-structural-enforcement-preflight.yml filter
candidate5* branches, so they produce NO run records on p3-* refs. Any second
certification-workflow run for the SHA, any attempt > 1, or any JOB EXECUTION of the
closure sibling on a p3-* ref = stray run: stop, preserve, report.
Any failed expectation or any byte change = new candidate + conformance + two fresh
refs/runs. Certification remains forbidden until STATIC ACCEPT of the exact SHA.

Batch1-r3 #10 corrections (post-run-9, peer orders via main 2026-09-24; implemented, locally
validated, UNCOMMITTED pending freeze order):

FAT double defect (run 9 root cause, two independent classes, both proven locally on the
staged dosfstools 4.2 against the exact writer bytes, matching the peer's independent parse
of the run-9 image and main's fsck):
- Defect 1: the hand writer never allocated the /EFI and /EFI/BOOT directory clusters in
  the FAT (FAT[3]=FAT[4]=0, FREE). fsck tolerates a free cluster inside a directory chain
  ("Contains a free cluster (3). Assuming EOF."); OVMF hard-fails it with "FATDirSize:
  cluster chain corrupt", the app never ran, ENROLL.TXT was never written. Fix: both
  directory clusters written EOC.
- Defect 2: 8.3 directory names were 12 bytes ("DB      AUTH" - 4-char extension), and
  bytearray slice assignment silently produced 33-byte entries, shifting every later root
  entry out of slot alignment. KEK/PK became unreachable orphans (fsck: "Reclaimed 107
  unused clusters" = 103 app + 2 KEK + 2 PK clusters, matching the peer's orphan count on
  the actual run-9 bytes). Fix: exact 11-byte 8.3 names (DB/KEK/PK .AUT) with a hard
  length assert; every directory built as one contiguous block and written once.
- Also repaired per the peer's fix bar: "." / ".." entries (".." of a root-child points at
  cluster 0 per the FAT spec), a volume-label entry matching the boot-sector label, and
  the FSInfo free count derived from the BPB geometry instead of mkfs deltas.
Pre-boot gates (BOTH must pass before any boot; E_ENROLL_FAT_INVALID, exit 97):
- Gate 1 - fsck.vfat -n keyed on DIAGNOSTICS, never the exit code (dosfstools 4.2 returned
  rc=0 in one container and rc=1 in another on the same corrupt run-9 image): any output
  line beyond the banner and the final "N files, X/Y clusters" summary fails closed. Full
  output preserved to enroll-fat-fsck.log and echoed.
- Gate 2 - independent directory round-trip against the CONTRACT (never the produced
  output): MODE=sole (sole + sole-fresh templates) requires exactly db.auth/kek.auth/
  pk.auth; MODE=db2 (widened template) requires exactly db2.auth/kek.auth/pk.auth at the
  volume root; /EFI/BOOT holds exactly BOOTX64.EFI. Names, sizes and SHA-256 of every
  readback are compared against the source files; anything missing, extra, or
  byte-different fails closed. Output preserved to enroll-fat-roundtrip.log and echoed.
- Per-run enroll-fat.raw sha256+size logged every run (unpinned by design).
- Local gate matrix on the exact production gate bytes (staged tools): sole PASS, db2
  PASS; planted free-marked-dir image fails gate 1 pre-boot; planted missing-blob image
  fails gate 1 (orphaned chain) and, in an fsck-silent variant, fails gate 2 (contract
  mismatch); planted corrupted-blob-bytes image passes fsck and fails gate 2 (SHA
  mismatch, both hashes quoted).
- mtools/mcopy (the peer's preferred placement) is NOT in the locked stage and not in
  main's container; adding it is a platform.lock revision. The retained hand writer is
  fixed and independently round-trip-verified every run for the executed mode (the peer's
  stated alternative), locally exercised for both modes. mtools-lock decision surfaced to
  main/peer.
N7: qemu-smoke in-namespace evidence now stats/findmnts the ACTUAL EXECUTED argv0 (frozen
case argv0 after the lane-prefix rewrite, absolute, executable) and fails closed
(E_QEMU_SMOKE_ARGV0_MISSING / E_QEMU_SMOKE_ARGV0_NOT_ABSOLUTE, exit 97) if absent - in the
shell evidence block AND at the python spawn site. The old PATH lookup of a bare name
("resolved: MISSING") is gone.
N8: both lane workflows assert the durable smoke log carries EXACTLY ONE "lane argv
check:" reverse-rewrite verification line (the two source print sites are if/else
branches, one per executed smoke) and fail closed (E_QEMU_SMOKE_ARGV_LANE_LOG, exit 97) on
absent OR duplicated. Run-9 ground truth (log sha256
4a07f1dcb809e4aec1e2b041f6e397f3f906183a69f10519645fd02ae0834fdd): the line fired exactly
once (line 38, scratch-lane form), the executed argv+-S sha256 b6fca059...2e55 equals the
lane table's R1-positive value, and QEMU_SMOKE_OK followed - the publisher's earlier
"absent" claim was WRONG; raw/executed equivalence was proven in run 9.
N9: the evidence manifest now covers EVERY uploaded path (out dir + fw-hashes + the three
basetools build logs), absent members noted explicitly; env2 gained the same manifest +
ARTIFACT-DIGEST covering the env2-evidence tree and the ovmf-env2 basetools log.
N1b: post-unlink leftover check on the enrollment QMP socket (E_QMP_SOCK_LEFTOVER, exit
97; -e and -L both checked) and a workflow evidence-tree sweep failing closed on ANY
non-regular file (E_EVIDENCE_NONREGULAR, exit 94; find -type f misses sockets).
Peer ruling (2026-09-24, pre-#10-freeze conditions; repaired hand writer ACCEPTED, no
mtools, no lock revision) - all six implemented and validated:
1. ZERO code sharing: the round-trip reader is a separate python program sharing no
   code/imports/helpers with the writer (both blocks carry the independence note);
   expectations are hardcoded from the mode contract + SOURCE-file bytes only.
2. BOTH gates run on EVERY enrollment image: they are inline in rehearsal-enroll.sh, which
   the ceremony invokes for ALL THREE modes - sole (MODE=sole), widened (MODE=db2), and
   sole-fresh/R6 (MODE=sole) - in every lane.
3. Writer named asserts: E_ENROLL_FAT_WRITER_NAME83 (8.3 name != 11 bytes),
   E_ENROLL_FAT_WRITER_DENT (entry != 32 bytes), E_ENROLL_FAT_WRITER_DIRBLOCK (directory
   block not a multiple of 32) - all exit 97, never a bare AssertionError.
4. CI must-show: PF-1 (freemark) and PF-2 (missingblob, fsck-silent) are folded into the
   #10 scratch run as two dedicated must-show steps (scratch-only derivation injection;
   the ENROLL_PLANTED_FAULT switch refuses non-scratch lanes with E_PLANTED_FAULT_LANE and
   unknown names with E_PLANTED_FAULT_UNKNOWN). Each step asserts exit 97 AND the expected
   gate's diagnostic; any other outcome fails the step. Proven locally through the exact
   production blocks: PF-1 -> gate 1 ("Contains a free cluster (3)"), PF-2 -> fsck SILENT,
   gate 2 (contract mismatch quoted).
5. Image sha256+size logged unpinned every run (already in place).
6. fsck.vfat resolution printed in-log before every gate-1 run: shim path -> staged
   fsck.vfat -> real fsck.fat target with sha256+size (fail-closed E_ENROLL_FSCK_SHIM_MISSING
   / E_ENROLL_FSCK_STAGED_MISSING / E_ENROLL_FSCK_SHIM_DRIFT).
Planted-fault queue (remaining MUST-SHOW, owed as dedicated scratch runs):
- PF-3 argv lane-mismatch (reverse-rewrite tamper): must fail the smoke with
  E_QEMU_SMOKE_ARGV_LANE; and any run whose smoke log lacks the verification line must
  fail with E_QEMU_SMOKE_ARGV_LANE_LOG.

Run-10 outcomes (scratch run 35939070738, #10 candidate) - GUEST ENROLLMENT SUCCEEDED
(ovmf-debug verbatim: FSOpen created + opened ENROLL.TXT; DXE ResetSystem2 Shutdown; image
sha changed pre/post guest, f48a5700... -> 41740f00...): the FAT fix, both pre-boot gates,
the fsck shim resolution line, the smoke lane-check (exactly once), KVM proof, N9 manifests
and the socket sweep all held. Two host-side defects found and fixed (tree work, next
candidate):
- Collection break (run-10 defect-1; peer run-11 reconciliation): the pidfile-lifecycle
  hypothesis is CONFIRMED, not just likely - a successful enrollment shuts the guest down
  (run-10 evidence: ResetSystem2 + absent pidfile) and a cleanly exiting qemu UNLINKS its
  own pidfile; the old code cat'd the pidfile after the 25s window and died bare under
  set -e (run-9 only survived because the firmware dropped to a shell and qemu stayed
  alive). Fixed in the peer-requested capture+poll shape: the PID is captured PROMPTLY
  after daemonize (bounded 5s pidfile wait; E_ENROLL_PID_MISSING exit 97 if it never
  appears), then THAT PID is polled with kill -0 through the bounded 25s budget and the
  actual exit mode is logged - self-exit at t=N, or W_ENROLL_QEMU_DEADLINE_TERM with
  TERM/KILL at the deadline (peer rename: a W_ event line, NOT an E_ error - the final
  disposition stays with the E_ENROLL_TXT_MISSING 97 extraction gate, which preserves
  the run-9 shell-drop success shape). The pidfile itself is never the lifecycle signal; a
  ResetSystem2 line is logged as SUPPORTING evidence of guest intent, not the mechanism.
  Post-guest image sha256+size and extracted ENROLL.TXT sha256+size are logged. All
  three modes locally tested on the exact extracted production block (self-exit, deadline
  TERM, pidfile-never-appears -> E_ENROLL_PID_MISSING 97).
- Ordering defect (run-10 defect-2): the PF-1/PF-2 must-show steps sat AFTER the ceremony
  step, so the ceremony's failure skipped them. They now sit BEFORE the ceremony in the
  scratch derivation - a must-show can never be gated by a ceremony outcome.
ovmf-b basetools log question (run-10 ARTIFACT-DIGEST note): "didn't run" vs "ran + log
missing" - by design it is "ran + log never written for ovmf-b". Proving code lines in
build-ovmf-debug.sh: build_one() writes the BaseTools log to OUTA only -
  line 68-69: make -C BaseTools -j"$(nproc)" >"$OUTA/basetools-build.log" 2>&1 || { ... E_BASETOOLS_BUILD ... }
  line 70:    echo "basetools build log: $OUTA/basetools-build.log sha256=..."
and ovmf-b receives only the final FDs, byte-identity enforced -
  line 188: cp "$WORKFIX/OVMF_CODE.fd" "$WORKFIX/OVMF_VARS.fd" "$OUTB"/
  line 190: cmp "$OUTA/OVMF_CODE.fd" "$OUTB/OVMF_CODE.fd" || { echo "E_OVMF_DUAL_BUILD_MISMATCH CODE"; exit 42; }
CAVEAT RESOLVED (peer #11 design review item 1 - DECIDED): per-pass logs are now
retained. build_one() takes an explicit log path; the dual-build driver calls it as
  pass 1: build_one "$WORKFIX" "$OUTA/basetools-build-pass1.log"
  pass 2: build_one "$WORKFIX" "$OUTA/basetools-build-pass2.log"
each pass's log sha256 is printed in the main log by the line above, the failure path
echoes the failing pass's own log (E_BASETOOLS_BUILD log=$BTLOG), and BOTH pass logs are
members of the shared evidence upload list (replacing the old ovmf-a/ovmf-b entries; the
ovmf-b absent-note is superseded - ovmf-b never had a log by design). Hostile and
CANON_SINGLE (env2) modes keep the default/single naming; env2's shared list references
basetools-build-pass1.log. CODE/VARS pin reproduction is unchanged: the cmp byte-identity
gate (E_OVMF_DUAL_BUILD_MISMATCH) and the frozen FD pins are untouched, and the next run
must still reproduce them.
Run-10 remaining owes: db2/sole-fresh ENROLL.TXT (ceremony stopped after sole), PF-1/PF-2
CI execution, env2 compare.

Run-11 hardening (peer #11 shape requests, this candidate):
- Named ERR traps (extended per peer #11 review item 3): ALL twelve ceremony-path bash
  scripts now run set -eE with an ERR trap printing E_BASH_ERRTRAP <script>
  line/rc/command, exit 97 - rehearsal-enroll.sh, run-ceremony.sh, qemu-smoke.sh,
  make-shims.sh, build-ovmf-debug.sh, build-enroll-app.sh, enroll-prep.sh,
  build-esp-variant.sh, build-esp-image.sh, make-disks.sh, stage-platform.sh and
  bwrap-argv.sh. No exceptions needed: every script already ran under set -e, so the trap
  only NAMES failures that would already abort. The EXIT evidence trap in
  run-ceremony.sh is preserved (the ERR trap is disabled inside _repair_out so an
  incidental repair failure can never mask the original named exit code, peer N3).
  Negative/positive tested: an unguarded cp failure -> E_BASH_ERRTRAP rc=97; a guarded
  named gate -> its own E_ code, trap silent.
- Post-guest fsck -n is run OBSERVATIONALLY (logged to enroll-fat-fsck-postguest.log and
  teed into the run log, never a gate) to record the guest-induced on-disk state.
- ONE SHARED LIST (extended per peer #11 review item 4 / D-e): EVIDENCE_UPLOAD_PATHS
  (YAML anchor at each workflow's env block) is the single source for BOTH the
  upload-artifact path (YAML alias) and the manifest member enumeration in ALL THREE
  workflows - rehearsal, scratch (via derivation) and CERTIFICATION, which previously
  enumerated upload and manifest separately and could drift. The env2 jobs got the same
  treatment (ENV2_EVIDENCE_UPLOAD_PATHS) in all three workflows. Directories expand to
  their files at manifest time; absent members are noted explicitly. Locally simulated
  with a mixed dir/file/absent list. 6e6 occurrence pins unchanged (cert 44, rehearsal
  77 - the anchors' literal lines exactly replace the removed upload-block lines).
- PF-1/PF-2 now live in INDEPENDENT per-PF directories under the evidence out dir
  (prep/log/vars/evidence each), so their logs ride the shared upload+manifest list via
  the out-dir expansion; both still sit BEFORE the ceremony step (run-10 ordering fix).
- PF-4 (new must-show, peer run-11): a missing NEEDED FILE (pristine OVMF_VARS removed)
  must die with a NAMED code (E_BASH_ERRTRAP or E_ENROLL_PID_MISSING) and exit 97 - never
  a bare set -e death. The file is restored BEFORE assertions (byte-identity checked,
  E_PF_RESTORE_DRIFT) so a failed must-show can never strand the ceremony. PF-3 remains
  the queued argv lane-mismatch must-show; this slot is PF-4.
- E_ENROLL_PID_MISSING is the defensive net for "qemu never started"; most launch
  failures (e.g. a missing readonly firmware drive) fail the daemonize command itself and
  surface as E_BASH_ERRTRAP - both are NAMED 97s, which is what PF-4 asserts.

Run-11 verdict (scratch run 35941253435, #11 candidate) - FAILED at PF-1, and the
failure itself proved the run-11 hardening: the planted fault never got planted because
the embedded FAT writer crashed on the RELATIVE config path build-output/enroll-app/
enroll-app.efi (writer python line 57) - and the NEW ERR trap named it exactly
(E_BASH_ERRTRAP rehearsal-enroll.sh line 39 rc=1 cmd shown) instead of run-10's silent
bare exit 1. Mechanism: the run-10 ordering fix moved the PF steps BEFORE the ceremony,
but config.json carries TWO build-output-relative paths (enroll_app, ovmf_code_debug)
that only resolve in the post-ceremony context (the ceremony builds them into
build-output/); pre-ceremony they do not exist. Fixes (this candidate):
- SUPERSEDED before delivery (peer run-12 source check at 05ef8031): the first fix
  absolutized both paths in a throwaway config COPY - the peer ruled NO PF-only
  argument/env/config knobs to the shared rehearsal-enroll or config, and offered two
  acceptable shapes. CHOSEN: each PF wrapper recreates the ceremony's SAME relative cwd
  layout in its own work dir ($PFD/work/build-output/enroll-app/enroll-app.efi copied
  from the pinned /tmp/$PREFIX-app-a product, sha 540b4fa3... asserted after copy;
  build-output/ovmf-debug/OVMF_CODE.fd from the pinned /tmp/$PREFIX-ovmf-a product, sha
  fc150336... asserted; the committed config.json copied byte-UNTOUCHED) and runs the
  UNCHANGED shared code from that cwd. The alternative (a shared anchor resolution in
  rehearsal-enroll.sh) was not chosen: a script-dir anchor still misses build-output in
  the pre-ceremony PF context, and anchoring at the pinned /tmp product would change
  what ceremony-context callers read. The config-copy approach never left the workspace.
- cwd AUDIT (peer run-12 requirement) - every relative read in the shared scripts and
  each caller's base dir:
  * rehearsal-enroll.sh: config.json path = caller arg; config VALUES enroll_app and
    ovmf_code_debug are build-output-relative and resolve against the PROCESS CWD;
    qemu and ovmf_vars_pristine are /tmp-absolute (CANON_TMP->LANE_TMP substituted);
    enroll-predicate-check.py + parse-ovmf-vars.py resolve via $HERE (script dir,
    absolute); fsck/mkfs resolve via the staged PATH; all evidence paths are $EVD-
    absolute. Callers' base dirs: ceremony/post-ceremony enrollment steps = the
    rehearsal dir (build-output present, ceremony-built); PF wrappers = $PFD/work
    (layout recreated); smoke = its own materialized work root.
  * enroll-prep.sh: the two evidence fixtures are caller-arg-relative (PF wrappers now
    pass them ABSOLUTE - "absolute paths already accepted by existing arguments are
    fine"); all other reads are arg-absolute.
  * run-ceremony.sh: cd "$HERE" then builds its own build-output - self-sufficient.
- CORRECTION logged by the peer against our run-11 report: E_PF_GATE_WRONG_CODE and the
  injection marker were in the STEP CONSOLE, not the durable PF evidence log (the log's
  only E_ was E_BASH_ERRTRAP). Fixed: every PF wrapper verdict - PLANTED FAULT ACTIVE,
  the injection confirmation, and the final E_PF_* / PF_n_MUST_SHOW_OK - is tee'd INTO
  the durable pf evidence log; a log lacking the wrapper verdict fails the must-show
  (E_PF_LOG_VERDICT_MISSING).
- MUST-SHOW STRICTNESS (peer run-12): PF-1/PF-2 first require BOTH "PLANTED FAULT
  ACTIVE: <mode>" AND a before/after image-sha injection confirmation (new in the shared
  injector block, scratch-gated, with E_PF_INJECTION_NOOP if the injector changes
  nothing) - else E_PF_NOT_INJECTED 97; then exact exit 97 + expected named gate +
  diagnostic; and any E_BASH_ERRTRAP in the log REJECTS the must-show even at exit 97
  (E_PF_TRAP_MASKED - the named gate must be the failure, not the trap). PF-4 expects
  the ERR-trap/E_ENROLL_PID_MISSING line as before. Locally simulated all wrapper paths:
  ok -> PF_1_MUST_SHOW_OK in log rc=0; trap -> E_PF_TRAP_MASKED 97; noinj ->
  E_PF_NOT_INJECTED 97.
- PF must-shows are now INDEPENDENT (peer run-12): each PF step carries if: always() &&
  steps.pf-prereq.outputs.ok == 'true' (a dedicated id: pf-prereq step records that every
  build prerequisite passed; one PF's failure never skips another, a prerequisite failure
  skips them all), each has its own id and dirs, and the ceremony runs ONLY when ALL PFs
  pass (if: always() && pf-prereq ok && steps.pf1/pf2/pf4.outcome all == 'success'). All
  PF logs live in per-PF dirs under the evidence out dir, riding the shared list.
- DISCLOSED near-miss from run 11: without the layout fix, PF-4 would ALSO have died at
  the writer crash - still a NAMED 97 via E_BASH_ERRTRAP, technically satisfying its grep
  assertion for the WRONG reason. With the layout fix, PF-4 reaches the intended
  missing-pristine-file failure at cp "$PRISTINE".
GREEN to hold from run 11: steps 1-16 all success; EVIDENCE_UPLOAD_PATHS shared anchor
live (env echoed every step; manifest_sha256=ec06c362... files=26); fw-hashes
ARTIFACT-DIGEST with correct run fields; evidence upload succeeded; hostile 50 lines;
marker scan 0 (publisher's independent scan, 138,288 B log). Ceremony (3 modes) never
ran this run - still owed with PF-1/2/4 execution.

Peer pushed-byte review of #10 (2026-09-24; run-10 watch items separate) - resolutions:
1. CERT VERIFIER identity non-keying: the exactly-one-run verifier (peer N5 section) keys
   ONLY on the certification workflow path, head SHA, run_attempt == 1 and conclusion.
   Commit author/committer identity is NOT a review input and must never gate anything;
   the #10 identity deviation is cosmetic history, not a verifier signal.
2. argv-freeze.json whole-file hash rationale: the enroll_qmp_sock_basename append (N1)
   RESERIALIZED the file - all seven case argvs + their SHAs, smoke_namespace and
   bwrap_argv are byte-identical in content, but JSON serialization moved bytes, so any
   whole-file hash differs. Content invariants are what preflight pins (6e5 key set,
   per-case argv SHAs, structural args, basename); the whole-file sha256 at the frozen #10
   bytes is 51b2dbc74f6b411885fcad1bbb0235dfb31e14c19418a7bfac6b33d0b12f24af
   (recomputed at every freeze). Future edits are
   byte-stable appends/in-place edits, never reserialization.
3. Planted-fault hook inert-outside-scratch, implemented: (a) preflight 6e9 -
   certification + rehearsal workflows must contain ZERO ENROLL_PLANTED_FAULT occurrences
   (negative-tested: a planted probe fires E_PLANTED_FAULT_WORKFLOW_SCOPE), and the scratch
   workflow must carry the must-show steps (guards a silent derivation drop); (b) the
   switch requires BOTH PREFIX and ALLOWED_PREFIX == NON_CERTIFYING_SCRATCH (negative
   matrix: either mismatch fires E_PLANTED_FAULT_LANE exit 97); (c) injection precedes
   BOTH pre-boot gates (fault block sits before the image-sha log, gate 1 and gate 2;
   proven locally for PF-1/PF-2, run-10 CI report confirms).
4. Evidence hashing under sudo: the repair-step before-hash find now runs under sudo
   (sudo find | sort | sudo sha256sum) in both lane workflows - a root-only DIRECTORY
   would silently shrink runner-side find coverage; the env2 manifest sweep+find switched
   the same way (env2 has no repair step, root-owned evidence possible).

Commit identity ruling (main 2026-09-24): exactly ONE author/committer identity for all
candidate commits - "Instinct Agent <agent@instinct.com>", the identity of every commit in
the chain before #10. The #10 commit d1a097f3636cbbb7be35d3a5f7b7202a843af71d carries
"candidate5-provisioning <candidate5-provisioning@localhost>" (a local -c override,
cosmetic only, disclosed to the peer); it stays - the scratch lane is FF-only and history
is never rewritten. Future commits use the pinned identity (repo-local git config set).

Run-12 review (2026-09-24; run 35942759117, head at the #12 scratch commit) - root cause,
rulings and the #13 correction batch:

RUN-12 ROOT CAUSE (verified from the durable evidence zip, zip sha256
3929105532ee6108e39c3922e0623c73fade318c44fe3de6a38f9deb75e6e88f, 6,581,581 B):
the image writer stored the auth blobs as bare 8.3 directory entries (DB.AUT/KEK.AUT/
PK.AUT) with no LFN entries; the pinned enroll app opens L"db.auth" on the volume root,
which does not resolve against an LFN-less 8.3 alias DB~1-style entry set - the app wrote
FATAL=READ_DB_AUTH and never produced SET_* statuses. The predicate then failed on the
missing statuses (first surfaced error E_ENROLL_SET_DB), its exit 92 was masked by the
tee'd pipeline, and the run died as E_BASH_ERRTRAP (run-ceremony.sh) - a masking chain,
not a gate failure. Amplifier: the "independent" reader hardcoded the same truncated 8.3
name contract as the writer, a common-mode blind spot.

PEER RUN-12 RULINGS L1-L7 (adopted via main 2026-09-24 04:53):
L1. The on-volume name contract is taken from the CONSUMER: the reader extracts the
    UTF-16LE L"db.auth"/L"kek.auth"/L"pk.auth" literals from the pinned app binary
    (sha256 540b4fa3990f998cb803160482bd50e9670a47da3d534acc3ade91364a85f3ee, pinned
    in the reader), fails closed on missing or extra .auth literals, and cross-checks
    against enroll-app.c lines 61-63. The contract is never hand-typed in the reader.
L2. No db2.auth on the volume: in db2 mode the file NAMED db.auth holds db2 source
    bytes; the reader verifies content sha per mode from the SOURCE files.
L3. LFN correctness is checked by the reader: LFN entries immediately before the 8.3
    alias in reverse sequence (last flagged 0x40), attr 0x0F, type 0, first-cluster 0,
    one shared checksum over the 11-byte alias (derived independently from the writer),
    UCS-2 name, NUL-terminated, 0xFFFF-padded, reassembled name == the L1 contract
    string exactly; aliases unique per volume (dot entries skipped), well-formed 8.3,
    and following the named generation rule (BASE~1.EXT, e.g. DB~1.AUT); resolution is
    case-insensitive long-name-first then 8.3 alias (UEFI open order); fsck stays rc=0.
L4. New scratch-only PF-5 "nolfn" (the run-12 8.3-only layout, fsck-silent) must die
    pre-boot on the reader with E_ENROLL_FAT_NAME_CONTRACT - implemented in the scratch
    workflow with the full must-show shape (provable injection, fsck rc=0 proof, exact
    exit 97, no E_BASH_ERRTRAP, named code, reader diagnostic, tee'd verdict).
L5. An app FATAL= line is the predicate's FIRST error: E_ENROLL_APP_FATAL <value>
    ahead of the missing-status list (local test: FATAL=READ_DB_AUTH input yields
    E_ENROLL_APP_FATAL first, exit 92).
L6. Predicate failure exits with its OWN named code: the wrapper captures the
    predicate's exit code unconditionally (PIPESTATUS, not the tee'd pipeline rc) and
    exits E_ENROLL_PREDICATE_FAIL (rc 92) or E_ENROLL_PREDICATE_RC (any other rc),
    exit 97; run-ceremony passes a named exit code up unchanged and reserves
    E_BASH_ERRTRAP for signal/trap deaths (rc >= 128) only.
L7. Writer, reader, predicate and config all changed in #13, so EVERY PF (1, 2, 4, 5)
    re-runs on the #13 head with C1-C4, the C4-addendum and the C5-binding in. OPEN
    after #13: sole + widened + sole-fresh guest passes with predicate PASS, the marker
    guard actually running, db2 mode, and env2.

PEER RUN-12 CORRECTIONS C1-C5 (adopted via main 2026-09-24 04:21-04:28):
C1. PF-4 must-show demands EXACTLY E_BASH_ERRTRAP at the pristine-VARS cp line
    (rehearsal-enroll.sh line 474 at the #13 head) carrying the cp command text;
    E_ENROLL_PID_MISSING must not appear; the planted-condition line is tee'd into the
    durable pf4.log and required by grep. Local gate simulation: positive shape passes;
    wrong line number and stale-code shapes rejected.
C2. After the PF-4 restore, the pristine VARS is verified against the FROZEN sha
    5d2ac383371b408398accee7ec27c8c09ea5b74a0de0ceea6513388b15be5d1e, not merely the
    saved copy.
C3. PF steps and the scratch ceremony step run under "!cancelled() && ..." instead of
    always(); cancelled runs skip the planted-fault gates.
C4. The forbidden-marker guard runs under !cancelled() with an absent-tree stand-down.
C4-addendum: a green run must have RUN the interpreter cross-check - new
    E_XCHECK_SKIPPED strictness step (id ceremony + id xcheck wired; env-mapped
    outcomes, no ${{ }} in run bodies); preflight 6e6 rehearsal pin 77->78 (one new
    literal, the step name); cert holds 44.
C5-binding (freeze-packet requirement, recorded here for the freeze order): the freeze
    packet FREEZE-MANIFEST gains a SHARED-FILE-BLOB-SHAS table - the git blob sha of
    rehearsal-enroll.sh, run-ceremony.sh, enroll-prep.sh, enroll-predicate-check.py,
    parse-ovmf-vars.py, config.json, evidence/c5-signing-cert.der and
    evidence/C5-HOSTILE-FIXTURE.cer at the PF-evidence head vs the frozen HEAD; any
    DIFFERS means the PFs re-run before rehearsal-3.

PEER RUN-12 K RULINGS (K4 containment executed 2026-09-24, adopted via main):
K1. PF prep moved OUTSIDE the evidence upload tree to /tmp/$PREFIX-pfprep-<n>, removed
    by the step's own EXIT trap. Absolute rule: no *.key under any
    EVIDENCE_UPLOAD_PATHS entry.
K2. New fail-closed zero-private-key gate (if: !cancelled()) immediately before EVERY
    evidence upload (scratch, rehearsal, certification, env2, cert marker): any
    *.key/*.pem/*.p12/*.pfx NAME or PEM "PRIVATE KEY" / PKCS#8 / RSA DER key content
    fails E_PRIVATE_KEY_IN_EVIDENCE exit 94; uploads run only when their gate passed
    (upload if: amended to require the gate outcome). Local negative tests: key-name
    tree -> 94, PEM-content tree -> 94, clean tree -> 0.
K3. Public material stays (*.crt/*.cer/*.esl/*.auth).
K4. Containment record - private throwaway keys were present in two scratch evidence
    artifacts and were DELETED via the repo owner's session, each deletion verified by
    the anonymous public API; digests preserved here as the historical trail:
    - run 35942759117 (#12): artifact NON_CERTIFYING_SCRATCH-evidence id 10785089772,
      6,581,581 B, zip sha256 3929105532ee6108e39c3922e0623c73fade318c44fe3de6a38f9deb75e6e88f;
      six key entries (pf1/pf2/pf4 prep kek.key+pk.key, PEM markers confirmed). DELETED.
    - run 35941253435 (#11): artifact id 10784703075, 124,425 B, zip sha256
      937fe7c87a9a4957ab1f399a2759521a3e51df2705ce1fbc8bf78fbca51e5ef7; two key entries
      (pf1-freemark prep kek.key+pk.key). DELETED.
    - run 35939070738 (#10): artifact id 10784597652, 158,160 B, zip sha256
      a63235e2abf75ff2c5194e64562416b98c5d7bc20b48ba5f188dc87daaa391f5; CLEAN (kept).
    - rehearsal-1 (run 35812361943): no live artifacts; the rehearsal lane carries no PF
      steps and its ceremony prep sat outside the upload tree - nothing to delete.
    Extension sweep (main 2026-09-24): all 8 other live scratch evidence artifacts
    scanned by download + full-byte PEM/DER sweep - ALL CLEAN, including #9 (artifact
    10783298343, run 35936156106, sha256 634719d2986e09ecd96f3ac06179fb7cd86fa0536bfa1bac3b13eb9c48211015;
    its ceremony kept prep outside the upload tree) and seven preflight-era artifacts
    (10781463985, 10780911049, 10779913586, 10779126442, 10778661746, 10777776130,
    10775949767; sha256s in the K4 report). The 33 pre-project artifacts
    (v3-foundation/closure-review/authority-routing-gate/github-pages) were swept the
    same way on main's order (2026-09-24): ALL 33 CLEAN - 16,679 nested tar members
    decompressed and swept alongside the zip entries; per-artifact digests in the K4
    extension report. No VARS from the affected
    runs is reused anywhere; the keys were one-day throwaway, no rotation required.
K5. This record + the conformance audit's K1/K2 check (this section).

PEER RUN-13 D RULINGS (D13 review of #13 head 2f157d0f, adopted via main 2026-09-24):
D13-1. BLOCKING - the #13 L6 predicate line still masked under set -eEuo pipefail +
    ERR trap: a failing pipeline fires the trap on its own line before PIPESTATUS is
    read (peer reproduced: rc 92 -> E_BASH_ERRTRAP on tee -> 97). Fixed to the peer's
    tested form: `_pred_rc=0; python3 enroll-predicate-check.py ... > json ||
    _pred_rc=$?; cat json`. Negative tests: (a) the EXACT extracted wrapper block run
    under the real trap with a 92-exiting predicate dies E_ENROLL_PREDICATE_FAIL
    exit 97 with ZERO E_BASH_ERRTRAP; rc=0 control continues; (b) new PF-6 scratch
    must-show (badpred planted fault): SET_DB_STATUS flipped 0->1 in the extracted
    UTF-16LE ENROLL.TXT (before/after sha256 confirmation + noop guard); the frozen
    predicate MUST reject with E_ENROLL_SET_DB rc 92 and the wrapper MUST die
    E_ENROLL_PREDICATE_FAIL exit 97, never E_BASH_ERRTRAP; ceremony_if extended with
    steps.pf6. Local evidence: injector before
    600eeb0085f61784c18b15a1160a35c2cdb79f2b089ed41bddd961b0cabb5f52 after
    6131a73609a36cb31b9bf032e36abfe07c499e7e76a27c060f090227f5fa1fd1; real
    enroll-predicate-check.py on the flipped file: rc 92, first error
    E_ENROLL_SET_DB ("SET_DB_STATUS='1' expected '0'"); injector second-run noop
    assert fires.
D13-2. PF-2/PF-5 must-show greps tightened to the exact consumer-extracted contract
    strings: PF-2 requires `contract name 'pk.auth' has no valid LFN entry`, PF-5
    `contract name 'db.auth' has no valid LFN entry` (no shared generic diagnostic).
    Verified prefix-substrings of the reader's ncfail format `contract name %r has
    no valid LFN entry reassembling to it exactly` (rehearsal-enroll.sh line 417).
D13-3. PF-4 command check is now the exact fixed single-line string
    `E_BASH_ERRTRAP rehearsal-enroll.sh line 477 rc=1 cmd: cp "$PRISTINE"
    "$EVD/vars.fd"` (the two-grep cmd/vars.fd shape is deleted). LINE-PIN SHIFT
    DISCLOSED: the #14 badpred guard moved the pristine-VARS cp from line 474 (#13
    head) to line 477 (#14 head); grep -n confirms 477. Trap-string simulation:
    under set -eEuo pipefail + the production trap, a failing cp emits exactly
    `... rc=1 cmd: cp "$PRISTINE" "$EVD/vars.fd"` (unexpanded $BASH_COMMAND text)
    and exits 97.
D13-4. K2 zero-private-key gate now also fails on ANY symlink under an upload path
    (top-level path, directory entry, file entry, dangling): E_SYMLINK_IN_EVIDENCE
    exit 94, checked before name/content. Applied to all 3 rehearsal gates + 4
    certification gates; scratch re-derived. Negative tests on the extracted gate:
    clean rc=0; symlink file/dir/top-level/dangling each rc=94 named.
D13-FIND RETRACTED (peer challenge 2026-09-24, verified correct): my claim that
    #13's K2 DER regexes were dead was WRONG. In a raw bytes REGEX pattern the re
    engine itself interprets \xNN as byte 0xNN, so the shipped rb"\x30\x82..." forms
    ARE live byte patterns. The flaw was in MY negative test: I double-escaped the
    pattern in the harness (tested rb"\\x30...", which matches literal ASCII), not the
    shipped form. Re-verified: shipped patterns match real RSA/PKCS#8 DER bytes and
    reject literal ASCII; a bytes() clarity variant I had spliced in matched
    identically over 120k sampled inputs (0 diffs), so the two der_ lines were
    REVERTED to the #13 text byte-for-byte in all 7 gate copies - no shared-gate
    byte churn, no behavior change. #13's K2 green stands for DER as well (scoped to
    the near-empty evidence tree that run produced). K2 negative tests re-run
    against the shipped gate with freshly generated throwaway keys (deleted after):
    openssl genrsa 2048 -> PKCS#1 DER (openssl rsa -outform DER), PKCS#8 DER
    (openssl pkcs8 -nocrypt -outform DER), PEM - each planted under a neutral name
    independently fired E_PRIVATE_KEY_IN_EVIDENCE exit 94 (content hit); a *.key
    name fired 94 (name hit); the clean tree passed rc=0.
RUN 35946339217 FOLD-IN (#13 scratch run verdict: transient infra, adopted via main
    2026-09-24): the lockgen index snapshot fetch in platform staging was a
    single-shot urllib call that died on HTTP 502 with a bare traceback outside
    named-gate coverage. Now mirrors the stage-platform retry pattern (3 attempts,
    60s timeout, "attempt n/3 [index]" log lines) and fails named
    E_LOCKGEN_INDEX_FETCH exit 52 after the third attempt - never a bare traceback.
    Applied to rehearsal + certification; scratch re-derived. Local tests:
    fail-fail-succeed proceeds after 3 calls; all-fail exits 52 with the named
    line. Green data points preserved from that run: both executed K2 gates PASSED
    ("zero-private-key gate: clean across 5 upload paths"); the forbidden-marker
    guard ran for the first time and PASSED fail-closed; readability repair +
    evidence upload succeeded; publisher's independent full-log scan found
    OVMF_CI_SECURE_BOOT_UKI_PASS exactly once - the cyan echo of the guard's own
    grep command text, not evidence content.
PINS after #14: 6e6 grep -o NON_CERTIFYING_REHEARSAL counts unchanged (cert 44,
    rehearsal 78); 6e9 ENROLL_PLANTED_FAULT counts: cert 0, rehearsal 0, scratch 4
    (was 3; +1 for the PF-6 badpred step - disclosed, pin is >=1). All three
    workflows yaml-parse and every run block passes bash -n.

PEER F1-F6 RULING (fetch retry wrapper, adopted via main 2026-09-24, F1 capped at 3
attempts to match D7 per main's reconciliation):
F1/F4/F5. New shared helper fetch_locked.py - ONE implementation for every staging
    HTTP(S) fetch (stage-platform.sh debs + the lockgen index loop, all lanes):
    max 3 attempts, bounded backoff (5s/10s), per-attempt log line with URL +
    status/exception + attempt n/3; transient-only retries (HTTP 5xx, 429,
    timeouts, connection reset/refused, DNS); attempts exhausted ->
    E_STAGE_FETCH_EXHAUSTED <name> <url> <last error> exit 53; no bare tracebacks.
F2. sha256/size mismatch fails at once named (E_LOCKGEN_INDEX_MISMATCH exit 52 for
    indices; E_LOCK_HASH_MISMATCH exit 38 for debs - D7 codes preserved); non-429
    4xx fails at once E_STAGE_FETCH_HTTP <code> exit 54. No retrying mismatches.
F3. Sources restricted to lock-recorded URLs: the four lockgen indices ARE
    lock-recorded snapshot.ubuntu.com/ubuntu/20260922T000000Z URLs (verified
    against platform.lock.json); the deb archive->snapshot fallback (D7,
    pre-existing) constructs from the lock-recorded snapshot_ts + pool path under
    the same pinned sha256/size. No new source, no lock change. The index loop
    retries ONLY its own lock-recorded URL (no alternate source for indices).
F5 audit: urlopen appears ONLY in fetch_locked.py across the p3 lanes; no
    curl/wget anywhere. Residual urlopen hits are in
    tools/verified-architecture-phase3/*-browser-runner.py - localhost Chrome
    DevTools JSON probes in unrelated phase-3 tooling, not staging fetches, not
    in any lane's network phase. The edk2 source cache uses git protocol via
    src_fetch (existing 3-attempt + E_SOURCE_STAGE_FAILED 35 shape; not
    urlopen/curl/wget, unchanged).
F6. Scratch-only step "fetch_locked helper negative tests (F6)" (localhost
    127.0.0.1 server, no external network): case1 500,500-then-bytes recovers on
    attempt 3 with exact bytes; case2 wrong-sha fails attempt 1 named
    E_LOCKGEN_INDEX_MISMATCH exit 52 with ZERO retry lines; case3 404 fails
    attempt 1 named E_STAGE_FETCH_HTTP 404 exit 54; case4 always-500 runs 3
    attempts then E_STAGE_FETCH_EXHAUSTED exit 53. All four cases verified
    LOCALLY against the shipped helper before commit (same flow, same asserts).

PEER RUN-14 D RULINGS (D14 review of #14-rev, adopted via main 2026-09-24):
D14-1. BLOCKING - the helper shipped as fetch-locked.py (hyphenated), unimportable
    by every `from fetch_locked import fetch_locked` caller; the F6 tests had only
    exercised the CLI path. Renamed fetch_locked.py; every caller reference
    updated; an import smoke (E_FETCH_HELPER_IMPORT exit 97) now runs at the
    start of ALL FOUR staging steps (main + env2, rehearsal + certification) and
    as F6 case 0. Local: import via the workflow caller path (cwd) and via
    STAGE_HELPER_DIR from a foreign cwd both resolve. Conformance audit covers
    the filename: no fetch-locked references remain anywhere.
D14-2. BLOCKING - PF-6 no longer gates the ceremony: removed from ceremony_if and
    relocated AFTER the ceremony step, gated only on the build prerequisite
    (steps.pf-prereq), independent of every pf/ceremony outcome; a PF-6 failure
    still fails the run. The badpred injector's bare assert is now a NAMED
    precondition: E_PF_BADPRED_PRECONDITION exit 93 when the guest produced no
    unique SET_DB_STATUS=0 (not exercisable, distinguishable from a gate miss);
    the wrapper propagates 93 under the ERR trap with zero E_BASH_ERRTRAP
    (verified through the exact extracted block); the PF-6 step reports the
    precondition distinctly before its must-show asserts. PF-6 closes only on a
    run whose guest produced a valid ENROLL.TXT.
MINOR-1. stage-platform.sh comment said "max 4 attempts" - corrected to 3 (F1 cap).
MINOR-2. urlopen redirects: integrity unaffected (bytes are lock-pinned), but the
    helper now logs "redirect followed: requested=... final=..." whenever
    r.geturl() differs, and the deb source manifest records the FINAL URL.
    Local: 302 case logged the redirect and returned the final URL.
Local suite for the revision: F6 cases 0-4 (import path, transient-recover,
    wrong-sha first-attempt, 404 immediate, exhausted) + redirect + injector
    precondition + wrapper trap behavior - all green pre-commit.

RUN-14 VERDICT FIXES + PEER S1-S4 CONDITIONS (#15, adopted via main 2026-09-24):
S1. fetch_locked.py to mode 100755 (it also runs as a CLI); the checker's mode rule
    is UNCHANGED. Local negative: chmod -x -> E_EXEC_BIT "not -x" rc=30.
S2. E_PYTHON_IMPORTS resolved NARROWLY: preflight-check.py keeps PY_ALLOW as pure
    stdlib; exactly one NAMED allowance - module "fetch_locked" (the reviewed local
    helper, this directory, exec-pinned, stdlib-only itself) ONLY inside
    stage-platform.sh heredocs. No wildcard, no other file, no other module. The
    lockgen index loops live in workflow YAML (outside this scan), covered at
    runtime by the staging import smokes + F6 case 0. Negatives: an unlisted
    third-party import in a planted .py -> E_PYTHON_IMPORTS rc=30; a fetch_locked
    import in a planted DIFFERENT .sh heredoc -> E_PYTHON_IMPORTS rc=30 (the
    allowance does not leak). The checker's before/after diff is in the #15 packet.
S3. preflight-check.py run LOCALLY against a REAL locally-staged tree (the full
    stage-platform.sh run - 147 debs + pristine VARS + edk2 edc66812 + 9
    submodules, all through the fetch_locked helper, every hash verified):
    {"errors": [], "lane": "NON_CERTIFYING_REHEARSAL", "result": "PASS",
     "schema": "NON_CERTIFYING_REHEARSAL-preflight/v1"} rc=0.
S4. PYTHONDONTWRITEBYTECODE=1 set in the top-level env of all three lane workflows
    (covers every job incl. future ones; job-level equivalent). New end-of-job
    "checkout immutability gate (frozen SHA)" in rehearsal, rehearsal-env2,
    certification and certification-env2 (scratch inherits via derive):
    if: "!cancelled()", dirty `git status --porcelain` -> E_CHECKOUT_MUTATED exit
    97. The certification-marker job is EXCLUDED deliberately: it has no
    actions/checkout step, so there is no checkout to immutabilize (disclosed).
    Step names carry no lane-token, so the 6e6 occurrence pins (44/78) are
    untouched. Step placement: last step of each covered job.

PEER D15-1 RULING (checkout immutability gate rework, adopted via main 2026-09-24):
The #15 inline gate would have failed EVERY ceremony run (run-ceremony.sh leaves
build-output/ + disks/ untracked in the checkout by design). Reworked to ONE
shared definition: checkout-gate.sh (exec-pinned, no heredocs), used by every
lane's gate step AND by the scratch negative tests on COPIES.
(a) TRACKED: git diff --quiet HEAD -- + git diff --cached --quiet -> any hit is
    E_CHECKOUT_MUTATED exit 97 (HEAD diff catches staged changes first; the
    cached check is defense-in-depth).
(b) UNTRACKED: every ?? path must fall under the EXACT per-lane allowlist of
    ceremony output roots (full repo-relative) - anything else is
    E_CHECKOUT_MUTATED naming the path. No .gitignore anywhere.
(c) a surviving prep/ -> E_PREP_LEFT_BEHIND exit 98 (throwaway keys;
    run-ceremony.sh deletes prep via EXIT trap + explicit rm - the gate guards
    regression).
(d) AUDIT - every in-checkout write, every lane (validated independently against
    the scripts and steps, not assumed):
    main job (scratch/rehearsal/certification): run-ceremony.sh (cwd =
      rehearsal dir) creates build-output/{esp,esp-variant,ovmf-debug,enroll-app}
      + disks/ (via make-disks.sh disks) + prep/ (transient, deleted). Everything
      else writes /tmp only: stage-platform.sh DEST=/tmp/$PREFIX-stage(+env2),
      make-shims.sh ->/tmp, build-ovmf-debug.sh ->/tmp/$PREFIX-ovmf-{a,b},
      build-enroll-app.sh ->/tmp/$PREFIX-app-{a,b}, build-esp-image.sh
      ->/tmp/$PREFIX-esp-*, qemu-smoke.sh W=/tmp/$PREFIX-smoke-work, lockgen
      ->/tmp/$PREFIX-lockgen*, F6/PF steps ->/tmp, evidence ->/tmp/$PREFIX-out.
      ALLOWLIST == {docs/verified-architecture-phase2-v3/provisioning/p3/
      rehearsal/build-output/, .../disks/} exactly.
    env2 job (all lanes): ZERO in-checkout writes (env2 app rebuild + ESP
      reproduction + single-path reproduction all target /tmp) - empty allowlist.
    certification-marker job: no actions/checkout step - excluded (no checkout
      to immutabilize).
    Secrets check: the allowed roots hold only public material (ESP images,
      firmware/app binaries - K3 public); prep/ (throwaway PRIVATE keys) is NOT
      allowed and must not survive (c).
(e) scratch step "checkout-gate negative tests (D15-1)" runs the SHIPPED script
    against a /tmp COPY repo: clean-with-roots pass; stray untracked file ->
    E_CHECKOUT_MUTATED 97 naming the path; __pycache__ -> 97; tracked
    modification -> 97; staged change -> 97; prep/ -> E_PREP_LEFT_BEHIND 98;
    final clean pass. Same six cases + the zero-root env2 shape verified LOCALLY
    pre-commit (case table in the #15-REV packet).
S3 re-run on the reworked tree: preflight-check.py PASS rc=0 (verbatim JSON in
    the packet).

## 11. Run-15 verdict fixes (#16): guest enrollment root causes, fail-closed prep verification, resolver conformance

Scope (peer-approved batch): enroll-prep.sh only + ONE new shipped checker
(verify-auth.py) + D15-2 resolver conformance + checkout-gate follow-ups. No
firmware, app, UKI, lock, or workflow-behavior changes outside the scratch-lane
derivation. Full D1-D5 research packet with exact log line numbers and byte
offsets is attached to the #16 report as files (D1..D5 + evidence index).

E1 (root cause A, D1): enroll-prep.sh lines 26-33 - the X.509 SignatureType GUID
    now derives from ONE canonical source,
    uuid.UUID("a5c059a1-94e4-4aa7-87b5-ab155c2bf072").bytes_le, asserted equal to
    the pinned struct-layout literal a159c0a5... (fail named E_ESL_GUID); the
    double-conversion swap is removed. Shipped .esl SignatureType bytes are
    struct-order, matching gEfiCertX509Guid for CheckSignatureListFormat
    (AuthService.c:512, undefined-type return at 580-582).
E2 (root cause B, D2): all four sbvarsign calls (lines 57-61) carry
    --attr NON_VOLATILE,BOOTSERVICE_ACCESS,RUNTIME_ACCESS (0x27), overriding the
    v0.9.4 default 0x67 (sbvarsign.c:99-103) so the signed attributes equal the
    app's SetVariable call attributes (enroll-app.c:15 ATTRS=0x27) that the
    firmware digest-binds (AuthService.c:2155-2192, Pkcs7Verify at 2238).
E3 (consumer contract, L1): verify-auth.py extracts ATTRS from enroll-app.c
    itself (macro-name table; unknown name -> E_AUTH_ATTR_CONTRACT). No
    hand-typed attribute contract anywhere.
E4 (NEW shipped fail-closed checker, verify-auth.py, runs at END of enroll-prep
    before the complete echo; failure -> E_PREP_VERIFY 97; stdlib + staged
    openssl only):
    per .esl: SignatureType bytes == E1 bytes; SignatureListSize/SignatureSize
    arithmetic; every DER entry parses as X.509 (E_ESL_FORMAT).
    per .auth: EFI_TIME padding zero; dwLength == file size; wRevision 0x0200;
    wCertificateType 0x0EF1; CertType == PKCS7 GUID; payload == matching .esl
    (structural failures -> E_AUTH_FORMAT).
    digest: sha256 over the firmware-exact composite
    name_utf16le_no_nul||vendor_guid||attrs_LE||timestamp||esl recomputed and
    compared to the PKCS#7 messageDigest (mismatch -> E_AUTH_DIGEST, or
    E_AUTH_ATTR_CONTRACT when EVERY processed file uniformly binds one other
    value, i.e. a systemic signer/consumer contract break).
    signature: openssl smime -verify over the reconstructed composite against
    the embedded signer certificate (failure -> E_AUTH_SIG).
    DISCLOSURE: E_AUTH_FORMAT is one code beyond the three the peer named; it
    carries structural .auth failures so E_AUTH_DIGEST stays purely a digest
    verdict. The uniform-vs-partial split preserves the peer's E5 expectation
    (a single 0x67 file among 0x27 files reports E_AUTH_DIGEST).
E5 (scratch-only negative tests, new derived step "verify-auth negative
    tests"): builds a throwaway prep set OUTSIDE the upload tree, then:
    single 0x67-signed .auth -> E_AUTH_DIGEST; string-order GUID .esl ->
    E_ESL_FORMAT; uniform 0x67 set -> E_AUTH_ATTR_CONTRACT; clean pass. Keys
    shredded in-step via EXIT trap. All four cases ALSO verified locally
    pre-commit, plus payload/esl mismatch and wRevision corruption cases
    (six-case battery, all named codes observed).
E6 (C5 blob rule): PF-1/2/4/5/6 and the ceremony all re-run on the #16 head;
    per main's standing requirement the run must show: SetupMode anomaly
    re-checked (D3); sole/widened/sole-fresh ENROLL.TXT SET_*_STATUS=0 + the
    predicate PASS; PF-6 exercisable + PF_6_MUST_SHOW_OK; PF-4 C1, C2, exact
    line; cross-check, guard, K2, checkout gate after a REAL ceremony.

D15-2 (resolver conformance):
    (a) resolve-lane-path.sh (NEW, shipped): the single owner of the
    canonical->lane mapping. Its needle is the ONLY canonical literal in any
    consumer. Idempotent (lane paths pass through); E_LANE_PATH_USAGE /
    E_LANE_PATH / E_LANE_PATH_NOT_CANON fail closed.
    (b) consumers rewired: rehearsal-enroll.sh (QEMU + pristine paths),
    derive-scratch.py PF-4 wrapper (remap needle REMOVED - the run-15 PF-4
    defect: the template needle carried the lane prefix, the committed config
    carries canonical, no-op remap, raw job log line 1707),
    derive-scratch.py ceremony QEMU line (already resolver-based).
    (c) static conformance: preflight-check.py 6e10 E_DERIVED_CANON_LITERAL -
    the derived scratch workflow must contain ZERO NON_CERTIFYING_REHEARSAL and
    ZERO CANON_TMP occurrences. Negative-tested locally (planted literal ->
    named failure; restored byte-identical; PASS).
    MECHANISM NOTE (peer's diagnosis corrected): the PF-4 template authors the
    needle pre-replaced; the global line-15 swap is NOT the mechanism.
    DISCLOSURE: preflight-check.py's own pref() normalization keeps its pinned
    canonical literal (it statically validates canonical committed bytes, same
    sanctioned-carrier role as the resolver); a resolver-based refactor was
    attempted and REVERTED because pref() also passes non-path strings
    (hashes, case names) through unchanged, which the resolver correctly
    rejects. Candidate follow-up if the peer wants total needle elimination.

checkout-gate.sh follow-ups (peer-approved into the batch):
    untracked enumeration now NUL-delimited (git status --porcelain=v1 -z
    --untracked-files=all) - filenames with spaces/quotes/$ cannot spoof the
    parse; symlink rejection under allowed roots (find -type l non-empty ->
    E_CHECKOUT_MUTATED naming the link, K2 alignment). DISCLOSURE: the
    E_PREP_LEFT_BEHIND check was restored BEFORE the untracked enumeration -
    the rewrite had reordered it so a surviving prep/ with files reported 97
    instead of its dedicated 98; shipped D15-1 semantics preserved. 13-case
    local battery (incl. space+quote+$ filename PASS, symlink 97, prep-with-key
    98, empty-prep 98, env2 zero-root shape) ALL PASS; the scratch gate-test
    step gains the unusual-name and symlink cases.
    preflight PY_ALLOW widened with tempfile,uuid (stdlib, used by E1/E4).

S3 re-run on the #16 tree: preflight-check.py PASS rc=0 (verbatim JSON in the
    #16 packet). yaml + bash -n clean on all three workflows. 6e6 pins
    unchanged: cert 44, rehearsal 78 (both workflows untouched this batch).
    6e9: 0/0/4 (the new scratch steps carry no lane token or planted-fault
    refs). Scratch workflow: 0 canonical literals, 0 CANON_TMP.

## 11a. #16-prime corrections (review findings B1-B6 + N1/N2 on the #16 bundle)

B1 PF-4 line pin: no hand-typed number anywhere. The pristine-cp line is
    derived at RUN TIME from the committed rehearsal-enroll.sh - grep -c must
    be exactly 1, the matched line must be exactly
    cp "$PRISTINE" "$EVD/vars.fd" (E_PF_SETUP otherwise), and the ERRTRAP grep
    uses that derived number. Local execution against the SHIPPED script:
    CPN=1, CPLINE=478:cp "$PRISTINE" "$EVD/vars.fd", content assert PASS, the
    assembled needle matches a simulated trap line at 478, and the stale 477
    needle provably does NOT match (grep rc=1) - the run-15 needle defect
    class is closed by construction.
B2 allowlist path boundary restored: "$allowed"|"$allowed/"* only - a sibling
    prefix (build-outputx-evil/e, build-output.sh) dies E_CHECKOUT_MUTATED 97.
    Negative executed locally AND added to the scratch gate-test step.
B3 fail-closed gate: find errors die E_CHECKOUT_SCAN 97 (rc captured, no
    2>/dev/null||true swallow); every -z porcelain entry must start with
    "?? " (anything else named E_CHECKOUT_MUTATED 97) before slicing.
B4 ESL SignatureType check moved INSIDE the list walk - every list's 16 bytes
    (b[off:off+16]), not just the first. db2.esl is TWO lists (the builder
    size-groups entries; signing cert 1092B vs hostile fixture 799B), so the
    second-list GUID corruption negative is a real two-list case:
    E_ESL_FORMAT naming list at 1136.
B5 E_AUTH_SIG now exercised: db.esl re-signed by the WRONG key (pk) with the
    CORRECT --attr (digest matches) dies E_AUTH_SIG against kek.crt. n5
    wRevision 0x0100 dies E_AUTH_FORMAT. openssl smime -verify now passes
    -binary (no text canonicalization of detached content); clean pass + n4
    prove it.
B6 db2 set discipline: verify-auth.py takes a required 4th arg
    (--expect-db2|--no-db2; enroll-prep passes it from HOSTILE given or not).
    db2.esl/db2.auth must be BOTH or NEITHER (half-present -> E_DB2_SET);
    presence must match the mode (missing in widened -> E_DB2_SET; present in
    sole -> E_DB2_SET; absent/bogus mode arg -> E_DB2_SET usage, exit 97 -
    that path printed a NameError in the first cut, caught by the executed
    battery, now prints the named code directly).
N1 messageDigest OID scan restricted to the PKCS7 slice (pkcs7.count/index),
    never the whole file including the ESL payload.
N2 preflight 6e10 fails closed on grep rc not in {0,1} and on a missing
    scratch workflow - a silent 0 can no longer pass.

Executed battery (verbatim outcomes in the #16-prime report): positives in
both modes (widened 4 files VERIFY_AUTH_OK incl db2 entries=2 two lists; sole
3 files), negatives n1 E_AUTH_DIGEST / n2 E_AUTH_ATTR_CONTRACT / n3 first-list
E_ESL_FORMAT / n4 E_AUTH_SIG / n5 E_AUTH_FORMAT / B4 second-list E_ESL_FORMAT /
B6 half E_DB2_SET / B6 missing-widened E_DB2_SET / B6 present-sole E_DB2_SET /
payload E_AUTH_FORMAT / usage E_DB2_SET, gate 9-case battery incl
sibling-prefix and find-error, preflight PASS + 6e10 planted-literal negative,
yaml + bash -n x3 workflows, bash -n x4 scripts, 6e6 44/78, 6e9 0/0/4, scratch
0 canonical literals. All throwaway keys shredded.

## 12. Run-15 follow-up (app follow-on head): enroll-app hex() print bug - D3 resolved as app defect, new app pin

Reviewer technical finding on run-15 evidence, confirmed from source and
evidence bytes: enroll-app.c line 21 hex() built a 2-char CHAR16 buffer per
byte but called f->Write with size 2 BYTES = ONE CHAR16, so only the
high-nibble character of each data byte reached ENROLL.TXT. Consequences:
SetupMode 0x01 printed "0" (the D3 anomaly - firmware init logged SetupMode=1
at ovmf-debug.log:768 while the guest print showed 0; the volatile-shadow
hypothesis is withdrawn; D3 is an app print defect, not firmware); SecureBoot
0x00 printed "0"; and any enrolled PK/KEK/db _DATA would print HALF its hex
digits, so no successful enrollment could ever satisfy
enroll-predicate-check.py (SecureBoot_DATA='01', SetupMode_DATA='00', full
PK/KEK/db _DATA hex vs the ESLs - the predicate's reading is correct and
unchanged). Half-length re-derived from the run-15 ENROLL.TXT bytes:
SecureBoot_SIZE=1 with a 1-char DATA field; SetupMode_SIZE=1 with a 1-char
DATA field (UTF-16LE, 826 B).

Fix: parent decision (path 1) under the owner's standing runtime-correctness
authorization; reviewer technical finding. Line 21 Write size 2 -> 4 (one
token; ATTRS line 15 untouched, the 16-prime E3 contract source intact). This
is its own head ON TOP of the corrected 16-prime head
d20bbf3de79e2165e982565bebb3aa022a71b4a5 - strictly separate from 16-prime
content, one head per review, one run per head.
Dual build (same two-pass pattern as the OVMF dual build) reproducible in
/tmp builds A/B byte-identical. New app pin:
dccc181800051a80df93b5ac2d280d3ff292d4193f7c223467e27df765e1dbbb (replaces
540b4fa3990f998cb803160482bd50e9670a47da3d534acc3ade91364a85f3ee). NOTE:
dccc1818 is reviewer-reported until a CI app build on this exact head asserts
it (the scratch run's E_APP_PIN_MISMATCH gate is that proof).
Gate demonstration: a build against the OLD pin fails closed with
E_APP_PIN_MISMATCH dccc1818...; against the new pin the same build passes rc=0.
Pin rewritten at every pinned location (12 spots): build-enroll-app.sh:44,
config.json:109 (byte-stable), rehearsal-enroll.sh:265 (reader L1),
NON_CERTIFYING_REHEARSAL-workflow.yml:679,
OVMF_CI_SECURE_BOOT_UKI-CERTIFICATION-workflow.yml:647,
NON_CERTIFYING_SCRATCH-workflow.yml x6 (derive-scratch.py template +
re-derive; byte-consistency verified), this file x2. Source-file identity
updated at R3 line 134 and A3-publication-manifest.json line 67:
enroll-app.c sha256 762c5d09a2a7b556b98f876626cd09f08c4bc724f2205ceb1bd4de863639fdda
(replaces 859c01bbae9b134aed08a17f550ba9add7d9f3efd8500757a64bd56b8d0fdf47).
X4 acknowledged: A3-publication-manifest.json is a hash manifest now stale for
other files changed across 16-prime/this head; it will be REGENERATED at the
eventual frozen r3 SHA and presented in that review (not regenerated here -
it would be stale again immediately).
Stop-condition check: firmware untouched (OVMF_CODE fc150336... pin
unchanged), UKI untouched (13309697...), ESP variants untouched (PINS[0..5]
unchanged - the app travels on its own C5ENROLL FAT image, never inside the
ESP), predicate untouched. All PFs plus the ceremony re-run on this head; this
head's scratch run must show a GREEN predicate (the 16-prime run is expected
to fail the predicate on DATA only - not patched around).
Validation on this head: preflight PASS rc=0; yaml + bash -n clean x3;
6e6 pins unchanged (cert 44, rehearsal 78); 6e9 0/0/4; scratch workflow 0
canonical literals / 0 CANON_TMP; re-derive byte-identical.

## 13. Run-17 follow-up (#18): single component-wise lane resolver, pre-guest template gates, enroll-tie producer fix, versioned generator

Run 35954821835 (head 8871ef65) proved the app fix: all three guest modes
enrolled, predicate PASS x3. One host-side defect remained: rehearsal-harness.py
died FileNotFoundError on every case's vars_template because the config literal
carries the canonical infix in TWO path components
(/tmp/NON_CERTIFYING_REHEARSAL-out/NON_CERTIFYING_REHEARSAL-enroll-sole/...) and
the ad-hoc pref() rewrote only the leading one, producing the mixed path
/tmp/NON_CERTIFYING_SCRATCH-out/NON_CERTIFYING_REHEARSAL-enroll-sole/... (no such
file). Steps 27/28 never ran; env2 skipped. Peer review of the exact pushed
bytes (F1-F7 final ruling) is implemented on this head as follows.

F1 (single resolver): NEW lane_resolve.py is the ONE resolver definition.
Component-wise mapping ONLY for canonical absolute /tmp lane paths: a component
equal to or starting with the canonical token maps to the running lane's
prefix; a canonical token anywhere else in a component fails closed
(E_LANE_PATH_COMPONENT, no substring rewrites anywhere); a different
NON_CERTIFYING_ lane component fails closed (E_LANE_PATH_FOREIGN); already-lane
paths are idempotent; token-free /tmp paths fail E_LANE_PATH_NOT_CANON.
resolve-lane-path.sh is now a thin caller of this module (interface, stdout
contract, named codes unchanged for its two existing callers). The pref()
copies in rehearsal-harness.py and preflight-check.py are DELETED; both import
the module (narrow named allowance in preflight 6h, fetch_locked precedent).
Non-/tmp config values (relative paths, case IDs, schema strings) pass through
untouched. Conformance: preflight 6e13 runs the bash caller and the python
definition over a 7-entry corpus (nested canonical, leading-only, already-lane,
the run-17 mixed shape, foreign, non-leading-token, token-free) and fails
E_LANE_RESOLVER_CONFORMANCE on any rc/stdout disagreement.

F2 (audit table): the literal->resolved->writer->match table travels in the
review packet as F2-F7-key-contract-audit.md; it matched the reviewer's
independent read. The esp_variant_sha256 assertion site is listed there
(run-ceremony.sh PINS[1..3] over build-output/esp-variant/, writer/reader
agree on the relative names).

F3 (pre-ceremony static gate): run-ceremony.sh runs
`python3 ./lane_resolve.py gate "$CONFIG" "$OUT"` after the input pins and
BEFORE enroll-prep/any guest: every case vars_template must resolve into THIS
ceremony's constructed enrolled-template set; anything else dies
E_VARS_TEMPLATE_GATE (exit 97, offending literal+resolved printed, L6
pass-up). Planted negative (scratch must-show step): a config derived from the
pinned config.json with R1's inner enrollment component staled to
"enroll-widened-old" - resolution succeeds, membership fails. Verbatim local
outcome: rc=97, `E_VARS_TEMPLATE_GATE case NON_CERTIFYING_REHEARSAL-R1-positive
vars_template resolves outside the enrolled-template set: literal=/tmp/
NON_CERTIFYING_REHEARSAL-out/NON_CERTIFYING_REHEARSAL-enroll-widened-old/
vars-enrolled.fd resolved=/tmp/NON_CERTIFYING_SCRATCH-out/
NON_CERTIFYING_SCRATCH-enroll-widened-old/vars-enrolled.fd`. Positive control:
`VARS_TEMPLATE_GATE_OK cases=7 out=/tmp/NON_CERTIFYING_SCRATCH-out` rc=0.

F4 (single-source allow set): ALLOWED_VARS_TEMPLATES has ONE construction,
lane_resolve.allowed_vars_templates(out_dir, prefix), shared by the F3 gate and
the harness membership check. The harness CLI gains <out_dir>
(run-ceremony.sh passes "$OUT"); E_HARNESS_USAGE on wrong argc.

F5 (preflight extension): 6e11 fails E_RESOLVED_CANON_COMPONENT if any
resolved absolute /tmp config path retains a canonical component. The gate
enforces in every lane whose prefix is not the canonical token (in the
rehearsal/certification lane the lane token IS the canonical token, so the
check is vacuous there by construction; it bites in the scratch lane, where a
surviving canonical component proves a resolution bypass). The ruled
exemptions are structural (relative build-output esp filenames, case IDs,
schema strings never start with /tmp and never enter the check). Standalone
scratch-lane run: 0 canonical components after resolution.

F6 (enroll-tie producer fix): the harness's C4 tie read a key that the
producer emitted ONLY on its decode-fail early-exit
(enroll-predicate-check.py:57) - #17's three normal-path PASS JSONs omit it, so
the tie would have evaluated False for every case (the reviewer's byte read was
exactly right). Fix per the ruled shape: the normal-path report gains
"enrolled_fd_sha256": sha_f(fd) - the SAME sha_f definition over the EXACT
kept vars-enrolled.fd (the script's argv[4], the file rehearsal-enroll.sh
copies to $OUT at :629 and passes at :637), an ADDED NON-GATING field;
predicate check semantics byte-for-byte unchanged (6e4 schema+lane pin still
holds, count 2). Carrier choice: the predicate JSON, because the only consumer
is the harness tie (tolerant .get) and the F7 audit found NO strict key-set
consumer (steps 27/28 read text records; env2 diffs host-inputs.txt and
fw-hashes only). The harness now verifies the tie PRE-GUEST (static byte
property) and fails E_VARS_TEMPLATE_ENROLL_TIE (missing/unreadable record or
mismatch) and E_VARS_TEMPLATE_BYTE_IDENTITY (mid-case template mutation)
NAMED, never soft. Verbatim local outcomes against the REAL run-17 sole
evidence: correct record -> tie passes, harness proceeds to the guest-launch
checks (dies E_NO_KVM only because the validation host has no KVM); byte-flip
-> rc=90 `E_VARS_TEMPLATE_ENROLL_TIE ... template sha256 !=
enrolled_fd_sha256 in ...`; missing record -> rc=90
`E_VARS_TEMPLATE_ENROLL_TIE ... tie record unreadable: ...`. For the record:
the run-17 sole vars-enrolled.fd hashes bba36a3ed558469cbd3648297df8755cb0eacc9342a3c02cd7b2510ca4642685
- the value the fixed producer would have recorded.
Planted negative (scratch must-show step): byte-flipped template copy against
the untampered predicate record must die E_VARS_TEMPLATE_ENROLL_TIE rc=90
before any guest.

F7 (key-contract audit): every JSON key the harness reads from ceremony
outputs is tabulated with its producer line in the packet file: config.json
(committed, schema-pinned), parse-ovmf-vars.py output (variables/summary plus
the per-variable key schema, including the consumer list for each), and
enroll-predicate.json (above). One hardening from the audit: the vars parser
exits 0 even on structural failure (its output then carries "error" and lacks
variables/summary), so a missing key surfaced as a bare KeyError; the harness
now fails E_VARS_PARSE_SCHEMA named instead. No other consumer gaps found.

Versioned generator (peer directive): derive-scratch.py is now committed under
this directory. Mandatory order was followed: FIRST the reconstructed generator
re-derived the 8871ef65 scratch workflow BYTE-IDENTICALLY with NO other edits
(derived sha256 == committed sha256 ==
8e07462c49876a73b1674764855f27e9527d2295271b3c92cacfcba611a88f11; the
reconstruction method and one tooling mishap - a non-raw triple-quoted literal
eating backslash-newline continuations, caught by the byte compare and fixed
with raw literals - are disclosed in the bundle notes); ONLY THEN the #18
content landed: exactly ONE added injected block (BLOCK_TIE_NEGS, 54 lines: the
F3 and F6 must-shows). The #18 scratch workflow is the 8871ef65 derivation plus
that one block, produced by the committed generator, never hand-edited.
Preflight 6e12 re-derives and fails E_SCRATCH_DERIVE_DRIFT on any byte drift.
Preflight 1's marker whitelist names derive-scratch.py explicitly (the
generator carries the derived banner, which names the closing marker inside
its never-emit rule).

Gate dogfooding disclosure: the FIRST preflight run over the new gates FAILED
rc=30 and caught two defects in this batch's own new checks - (1) 6e11 as
first written fired in the canonical lane too (there the lane token IS the
canonical token, so identity resolution legitimately retains it); fixed to
enforce only in non-canonical lanes, as documented above. (2) preflight 6h's
line-regex import scan flagged a phantom "http" import in derive-scratch.py:
the scan cannot see that the generator's embedded workflow-block TEXT (the
fetch-test heredoc) is data, not generator code; fixed with a narrow named
allowance for that one file and module, mirroring the fetch_locked precedent.
Both fixes re-validated: preflight PASS rc=0 in BOTH lanes
(NON_CERTIFYING_REHEARSAL and NON_CERTIFYING_SCRATCH) on a freshly staged
platform (the 7:07 workspace wipe had taken the stage; stage-platform.sh
rebuilt it: 147 debs hash-verified + edk2 edc6681206c1a8791981a2f911d2fb8b3d2f5768
+ 9 submodules pinned; download log preserved).

Validation on this head: generator byte-proof as above; re-derive of the #18
scratch workflow BYTE-IDENTICAL to the committed file; yaml parse clean x3
lane workflows; bash -n clean on every .sh; ast parse clean on every .py; both
new scratch steps extracted from the committed YAML and bash -n clean; F3
negative + positive EXECUTED (verbatim above); F6 positive + 2 negatives
EXECUTED against real run-17 evidence (verbatim above); dual-lane config
resolution (canonical identity; scratch: all 7 vars_templates in the
constructed set; R7 firmware + qemu resolve; relative esp / case IDs / schema
untouched); F5 scan 0 canonical components; 6e13 corpus 7/7 AGREE with the
correct accept/reject split; preflight PASS rc=0 both lanes (above, incl.
6e12 derive byte-identity and the 6e13 conformance run); 6e6 pins unchanged
(cert 44, rehearsal 78 - the rehearsal and certification workflow YAMLs are
untouched); 6e9 0/0/4 unchanged; scratch workflow 0 canonical literals /
0 CANON_TMP; app pin dccc1818... untouched; firmware/UKI/ESP pins untouched;
A3 manifest untouched (X4: regenerated at the frozen r3 SHA). The #18 scratch run must
show: every #17 checklist item, all 7 cases with ALL checks true (tie included
this time), steps 27/28 green with a real comparison, both new must-shows OK,
K2/guard/final gate green, and env2 with its cross-runner compare.

## 14. Run-35959397469 follow-up (#19): ESP bootindex promotion, named boot-target gate, harness rc passthrough, bytecode guard

Run 35959397469 (#18', 60a03a9b, attempt 1) reached case launch for the first time and
failed: all 7 cases EXPECTATIONS_VIOLATED. Evidence showed NO Secure Boot verdict in
either direction: every case guest fell through to the EFI Internal Shell without
attempting the case ESP. Mechanics (peer-confirmed against the kept template's NV-store
history): the kept enrolled template's BootOrder is 0000(UiApp),0001(non-block enrollment
FAT at Pci(0x2,0x0)),0002(Shell); in the case guest Pci(0x2) is the ESP virtio-BLK, the
stale non-block Boot0001 is invalid and BDS refresh deletes it, then re-adds the block
devices AFTER the Shell; with no bootindex in the case argv there is no fw_cfg bootorder,
so OVMF never reorders and the Shell boots first. Two rejected fix directions (peer):
host-side template edits (synthetic VARS, breaks producer-truth and the F6 tie) and
enrollment-app NVRAM mutation (widens the recorder; BDS re-writes boot options anyway).

H1 - rehearsal-harness.py build_argv adds ",bootindex=0" to the ESP virtio-blk-pci device
ONLY (data disks unchanged); QEMU publishes fw_cfg "bootorder" and the frozen OVMF's
QemuBootOrderLib promotes the ESP boot option ahead of the Shell. Shared by all lanes.
QemuBootOrderLib presence CONFIRMED in the frozen edk2 edc6681206c1a8791981a2f911d2fb8b3d2f5768:
SetBootOrderFromQemu at OvmfPkg/Library/QemuBootOrderLib/QemuBootOrderLib.c:2172, library
wired in OvmfPkgX64.dsc:418. argv-freeze.json vectors + argv_sha256 regenerated surgically
(14-line delta: 7 device strings + 7 hashes); preflight CASE_ARGV_PINS updated to the new
hashes; this document's quoted prefixes updated above.

H2 - check_boot_target() (module-level in rehearsal-harness.py): the FIRST "[Bds]Booting "
line in the case ovmf-debug.log must be the case ESP option, proven by its "[Bds] Expand "
line resolving to the ESP's PCI slot DERIVED from argv device order (q35 assigns -device
slots 0x2,0x3,... in argv order; the ESP is the first virtio-blk device by construction).
Anything else - Internal Shell, UiApp, wrong slot, no boot line - dies E_CASE_BOOT_TARGET
(rc 90) BEFORE expectation checks. The deterministic manifest records first_booting,
expand, esp_slot_derived_from_argv and the observed SetBootOrderFromQemu line when OVMF
logs one. Executed (function driver against the committed harness): the REAL run-18' R1
ovmf-debug.log dies rc 90 with detail naming '[Bds]Booting EFI Internal Shell'; synthetic
UiApp-first and wrong-slot (0x3) logs die rc 90; ESP-first at 0x2 passes; an argv with the
ESP second derives slot 0x3 and passes (derivation is not hand-typed).

H3 - planted must-show (scratch-only, generator BLOCK_BOOT_TARGET_NEG inserted before the
evidence-repair anchor): ONE case copy with bootindex REMOVED (harness copy; provable
injection: grep -c -F ',bootindex=0' is 1 before and 0 after the sed) must die
E_CASE_BOOT_TARGET rc 90, never a generic EXPECTATIONS_VIOLATED. Local simulation
(KVM-less host): injection counts 1->0 verified, the harness copy runs, the F3/F6 pre-guest
gates pass against the real run-18' sole evidence, the run dies E_NO_KVM before the guest
(expected off-CI), and the written argv.txt carries zero bootindex occurrences.

H4 - run-ceremony.sh passes the harness's NAMED exit code up unchanged (the L6 pattern from
the F3 gate and enrollment wrappers); E_BASH_ERRTRAP is reserved for signal/trap deaths
(rc>=128). Executed against the verbatim extracted block: stub rc 91 -> run-ceremony exits
91 with the passthrough line; stub rc 90 -> 90; stub rc 139 -> E_BASH_ERRTRAP exit 97.

Validation: generator re-derives the committed scratch workflow with EXACTLY the 29-line H3
block added (previous scratch sha f9c2892cff9500d746d01b3ed8871adb7b9a04d08dd08e2ce2829ce8d7b76363,
new sha 0622068eef665a84a01cd147b78c26a2bd96e4925cf2b23f627cc2108d377baf); E_SCRATCH_DERIVE_DRIFT
clean; preflight PASS rc=0 BOTH lanes; yaml parse clean on all three workflows; extracted H3
step bash -n clean. Rehearsal and certification workflow YAMLs untouched.

Mishaps (all caught before delivery): (a) first argv-freeze.json regen reserialized the whole
file (618-line noise) - reverted and redone surgically; (b) the first H1 comment carried the
literal string "bootindex=0", which would have broken the H3 injection count - caught by the
local simulation, comment reworded and block greps tightened to the exact ',bootindex=0'
device pattern; (c) the first generator patch left an unterminated r-string - caught by the
ast check, redone via file assembly; (d) the first H4 test extraction truncated at the wrong
'fi' (test-harness artifact only) - redone against the complete block.

H5 - the run's second failure class (end-of-job E_CHECKOUT_MUTATED on
__pycache__/lane_resolve.cpython-310.pyc), root-caused by the reviewer from the raw job log:
#18 introduced the FIRST sibling-module imports in this directory (from lane_resolve import
... in rehearsal-harness.py and preflight-check.py). Scripts run as __main__ never write
their own bytecode; only imports do. preflight runs as the runner user WITH
PYTHONDONTWRITEBYTECODE=1; the harness runs from run-ceremony.sh under
`sudo unshare -n env PREFIX=... ./run-ceremony.sh`, and sudo's env_reset strips
PYTHONDONTWRITEBYTECODE, so root wrote the .pyc. Fix, without weakening the gate and with no
.gitignore:
H5a - both sibling-importing files set sys.dont_write_bytecode = True BEFORE the lane_resolve
import (verified these are the only sibling importers here: enroll-predicate-check.py,
fetch_locked.py, platform-lockgen.py, scan-pe-pdb-paths.py, lane_resolve.py, derive-scratch.py
import none).
H5b - export PYTHONDONTWRITEBYTECODE=1 near the top of run-ceremony.sh and rehearsal-enroll.sh,
covering any future python3 child regardless of the workflow's sudo env list.
H5c - preflight check 6j E_BYTECODE_GUARD: any rehearsal .py whose first sibling import is not
preceded by the guard fails by name; scratch-only planted negative (probe file without the
guard, EXIT-trap cleanup, clean re-run must PASS, marker H5_BYTECODE_GUARD_MUST_SHOW_OK).
H5d - checkout-gate.sh and its __pycache__ gate test UNCHANGED.
H5 executed validation (verbatim extracted step, full fidelity against the real preflight):
the planted probe died rc=30 with E_BYTECODE_GUARD naming zz_bytecode_probe.py:1 and sibling
lane_resolve (the pre-existing E_PYTHON_IMPORTS import gate fired on the probe too - two
independent detectors); the probe was removed; the clean re-run PASSED. Local note: the first
simulation attempt's clean re-run failed only because this workspace lacks
/tmp/NON_CERTIFYING_SCRATCH-stage (E_LOCK_MISSING_DEB/E_STAGED_TOOL_MISSING on the missing
stage); symlinked to the p15 stage for the faithful re-run. The case-row booleans that looked
inverted are Shell-boot artifacts; no harness inversion is inferred until an ESP-first boot
tests it.

J1/J2 - peer review of 7e2dc964 came back NOT CLEARED with two blockers, fixed in this head:
J1 - the H2 debug-log gate would have killed R7 unconditionally: R7 boots the RELEASE
firmware (distro OVMF_CODE_4M.secboot.fd, sha256 1dbb7f9b7e7285b950929bbbc1494c186bfb061cde60cf531ff9756ef87dab7a),
which emits no debugcon output - its run-18' ovmf-debug.log is 0 bytes (R1-R6: 130,377 B
each, verified on the evidence). Reviewer amendment: (a) the debug-log gate applies ONLY to
cases whose RUN-TIME firmware sha256 == firmware_debug_sha256
(fc150336fce10eb5508fa440cdf7300622c8c3ac71f2fbe10a0731422b9cef24), hashed from the exact
pflash file fed to qemu; (b) a release-firmware case proves its boot target BEHAVIORALLY -
the kernel_exec + exit_98 RAM-scan markers are present only if the case ESP booted (only
the ESP carries the UKI); absent markers die E_CASE_BOOT_TARGET_UNPROVEN (rc 90) BEFORE
expectation checks, recording boot_target = {observable:false, reason:"RELEASE firmware, no
debugcon", proof:"kernel_exec+exit98 markers"}; (c) preflight check 6k
E_CASE_BOOT_TARGET_UNPROVABLE: any case on non-debug firmware must carry
expect.kernel_exec=true (R7 does); (d) R7 keeps bootindex=0 like every other case.
Executed: T1 release+markers -> PASS with the exact observable:false record; T2 release
markers absent -> rc 90 E_CASE_BOOT_TARGET_UNPROVEN; T3 REAL run-18' R1 Shell log -> rc 90
E_CASE_BOOT_TARGET (debug path unchanged); T4 debug ESP-first -> PASS observable:true; 6k
positive both lanes, planted config negative (R7 kernel_exec flipped) -> rc 30
E_CASE_BOOT_TARGET_UNPROVABLE naming the case.
J2 - the H3 must-show ran the planted guest as the runner user, but qemu needs /dev/kvm
(root:kvm 0660): the guest would never start, the harness would die E_QEMU_START (also rc
90), and the must-show would fail for an environmental reason. Fix: the planted harness
copy runs under the SAME authorized root/KVM context as the ceremony (sudo unshare -n env
PREFIX=... ALLOWED_PREFIX=... PYTHONDONTWRITEBYTECODE=1 python3 ... - byte-identical to the
ceremony's proven invocation plus the bytecode export), all writes under /tmp ($T work
root), NO root write into the checkout, harness copy H5a-protected. Before accepting the
named death the step ASSERTS qemu really started: the case argv.txt exists AND a nonempty
ovmf-debug.log carries a "[Bds]Booting " line (E_H3_QEMU_NOT_STARTED names the
environmental case); the observed first Booting line is appended to h3.log as must-show
evidence. Executed: injection 1->0 and one-case config derivation green; assertion branches
simulated - branch A (no debug log) dies E_H3_QEMU_NOT_STARTED, branch B (started + named
death) reaches H3_BOOT_TARGET_MUST_SHOW_OK with the observed-line evidence. Local limit:
this sandbox has neither passwordless sudo nor /dev/kvm, so the full planted-guest path is
CI-only; the harness copy itself runs green as the runner up to the E_NO_KVM wall.

## 15. C1' revision (peer review of C1): B1/B2/B3 fixes, C2 byte-loss disclosure, route-(ii) in-run negative-control scheme

This section records the complete C1' change set. C1 (commit b2eaef1d1b8b56f7aea55d33a881b5eb8d37f348, tree a6f3caed..) was delivered for peer review on 2026-09-24. The peer returned ruling items B1, B2, B3 plus a C2 decision point with route options; the owner chose route (ii) (in-run fixtures, runner-ephemeral keys, property gates). C1' SUPERSEDES C1 as the review candidate; C1 remains in history as a reviewed-and-revised head.

### 15a. B1: osslsigncode confinement (derive-scratch carried-step mechanism)
osslsigncode now appears only inside the c-sign step of the rehearsal and scratch workflows (ZERO occurrences in the certification workflow). The scratch workflow lacked a c lane; it is derived from the rehearsal workflow by derive-scratch.py using the PEER-PREFERRED carried-step mechanism (accepted over literal BLOCK on 5 conditions, all implemented): (1) c-sign is carried byte-identical after ONLY the prefix swap - enforced by E_DERIVE_C_SIGN_CARRY_DRIFT; (2) exactly-one c-sign step asserted in BOTH source and output - 0 -> E_DERIVE_C_SIGN_MISSING, >1 -> E_DERIVE_C_SIGN_DUPLICATE; (3) placement asserted by the generator: after the ESP dual builds, before the K2 sweep, gated !cancelled() - E_DERIVE_C_SIGN_PLACEMENT; (4) preflight independently checks the one-step count in both lanes plus confinement - E_C_SIGN_STEP_COUNT; (5) planted negatives are COMMITTED RUNNABLE TESTS: test-c-sign-confinement.py (this directory) (9 cases, all pass in-run, tee'd to $PREFIX-csign-negtests.log, D2-registered).

### 15b. B2: historical signed UKI out of the certification-target pin set
The historical signed UKI 13309697.. (evidence/successor-signed.efi) is HISTORY-ONLY: preflight EXPECT now contains exactly c5-signing-cert.der; HISTORY contains successor-signed.efi. The certification-target signed slot is ABSENT by design: the certification workflow declares CERTIFICATION_TARGET=1 and dies E_SIGNED_UKI_ABSENT (no fallback) until the owner-signed successor arrives. The in-run unsigned UKI build output is the EXACT owner-signing-packet input; the owner-signed file will later enter as its OWN reviewed head/commit, never inside this tree. Gate 4b (verify-signed-delta) is re-scoped to the slot and will check every criterion-C throwaway output now and the real signtool output later. Certification-workflow path references retargeted to successor-to-certify.efi; two D2 gates die E_SIGNED_UKI_ABSENT.

### 15c. B3: case rename and lane scoping
Case "R1" renamed to "NON_CERTIFYING_REHEARSAL-R1-historical-13309697-reject-control" (config.json, argv-freeze.json argv pin recomputed: argv_sha256 4110dad173e5a1d4a9bbe0fae05d9aaa21fc20859c599d63ab43bda6a3c22891 over NUL-joined argv; preflight CASE_ARGV_PINS updated). config.json gains per-case "lanes": criterion-C cases and R1-historical are scratch/rehearsal-only; R2-R7 keep certification lanes. Preflight enforces the certification case set == frozen list (E_CONFIG_CASE_LANES, E_CERT_CASE_SET, FROZEN_CERT_CASE_IDS). rehearsal-harness.py filters to certification-lane cases in the certification lane. The esp_variant_sha256 config pin is dropped: ESP variant hashes are RECORDED per run ($PREFIX-esp-variant-recorded.sha256), not pinned.

### 15d. C2 byte-loss disclosure (2026-09-24)
DISCLOSED MISHAP: on 2026-09-24 the C2 review-packet transfer LOST THE BYTES of five committed fixture binaries; only their names/sizes/sha256 metadata survived. The deleted files: evidence/F-WRONGSIG.efi (e4c49342bfd9f1c7a90ea3364b6619865d8187a17f10f146cd25cce57721cfdb), evidence/F-HOSTILEUKI.efi (e3547cd573b49caa8f5e9f0c20c0c78f1bbac694577bfd7fe19236092bd8dd3b), evidence/C5-HOSTILE-FIXTURE.cer (5b5e4edc11fd12787580fc9885fcdd4ebefecdabd82b893988be321483b68a8b), evidence/C5-WRONG-SIGNER-FIXTURE.cer (64eb51a0deb3bc67df051de22bdd205426dd4b70931b1f8d49fee4e894339ca6), evidence/successor-unsigned.efi. These files are REMOVED from the tree in C1'. The metadata-only record is NOT evidence and is never used as evidence: the pin policy changes ONLY for the negative controls (they move to in-run generation, route (ii)); all positive-evidence pins are untouched. c5-signing-cert.der (7cda4ddc.., public owner cert) and successor-signed.efi (13309697.., history-only) are unaffected and remain. evidence/C2-BINARY-PINS.json (zero consumers) is deleted; this section carries the scheme instead. Signed fixture bytes are NOT reproducible by design (per-signature signingTime); only the deterministic unsigned build is reproducible, which is exactly why route (ii) gates on properties, not bytes.

### 15e. Route (ii): in-run fixtures, runner-ephemeral keys, property gates
The rehearsal workflow gains two steps: (1) "unsigned UKI in-run build" (network-off; committed builder successor-uki-candidate/build-successor-gapless.py reproduces 4cda9c3e285b5b639364234400bf0b121178f12447cc88d896cd2623e07d18e1, 21,154,304 B, verified byte-exactly locally; NAMED FAIL E_UNSIGNED_UKI_DRIFT on any mismatch; root-admitter-candidate/uki/build-unsigned-uki.py is the OLD gapped builder dcaacb36.. and is NOT the certification input); (2) "criterion-C fixture generation" (network-off fixture-generate.sh against staged /tmp/$PREFIX-stage/root sbsigntool; K2-style sweep E_PRIVATE_KEY_IN_FIXTURE_TREE; emits 4 public artifacts to build-output/c-sign/fixtures/ [CORRECTED in §24: stale path - since §21's relocation the fixtures live at /tmp/$PREFIX-inrun/c-sign/fixtures/ and never touch the checkout] plus GENERATION-RECORD.json and FIXTURE-SHASUMS). The c-sign step consumes the in-run unsigned UKI (E_UNSIGNED_PIN retired). run-ceremony.sh binds fixture record vs payload (E_UKI_BUILD_MISSING, E_FIXTURE_RECORD_MISSING, E_FIXTURE_PAYLOAD_MISMATCH) and exports C5_HOSTILE_CERT_SHA256 / C5_WRONG_SIGNER_CERT_SHA256 to enroll-predicate-check.py [CORRECTED in §24: the export half of this sentence was never true in the bytes - run 36017957182 reached step 28 and died on E_ENROLL_PREDICATE_FAIL because NOTHING exported H/W; the binding now lives at the single consumer point, bind-fixture-certs.sh sourced by rehearsal-enroll.sh immediately before the predicate call], whose HOSTILE_CERT constant is DELETED: E_HOSTILE_CERT_UNSET, E_HOSTILE_CERT_DISTINCT (hostile != 7cda4ddc), E_HOSTILE_CERT_IN_SOLE_DB (hostile absent from sole db), E_WRONG_SIGNER_IN_DB (wrong-signer absent from every db), E_THROWAWAY_CERT_DISTINCT; H/W DER hashes recorded in the predicate report. Throwaway db == [T] with T distinct from both the owner cert and the hostile cert (E_FIXTURE_CERT_DISTINCT pairwise). Keys are generated network-off under /tmp/$PREFIX-*, shredded end-of-step; K2 sweep runs after EACH generating step and before EVERY upload; records carry public DER hashes and tool versions ONLY. Committed test-enroll-predicate-env.py (9 cases, all pass) is wired into the same must-show step and D2-registered. Negative controls are never committed as bytes anywhere in this scheme.

### 15f. A3 manifest and housekeeping
A3-publication-manifest.json is regenerated for the C1' tree (asset sha256/bytes recomputed; deleted binaries dropped; new files added: test-c-sign-confinement.py (this directory), test-enroll-predicate-env.py (this directory), UKI-13309697-ROOT-CAUSE.md, UKI-NEGATIVE-SUITE-EVIDENCE.md, derive-scratch.py). The manifest self-declaration path count is updated to the C1' name-status. Open design point flagged for the future slot-fill review: the certification workflow qemu-smoke currently runs case index 0 (the R1-historical ESP path), unreachable while the signed slot is absent; revisit when the owner-signed slot lands.

## 16. C1'' revision (peer verdict on C1'): bytecode purge, c-sign key lifecycle, positive-case guard

The peer's C1' verdict accepted the bytes on the derive-identical mechanism, the c-sign carried step and confinement, the in-step gates, the B2 absent-slot behavior, the B3 rename/lane-scoping, the env-driven predicate, and the certification YAML scope. Two blockers and one required guard were ruled; all three are fixed in C1''. C1'' SUPERSEDES C1' (0d66fc2b6b7644e157f7a305530d82066f2195ab) and C1 (b2eaef1d1b8b56f7aea55d33a881b5eb8d37f348); both remain in history as reviewed-and-revised heads.

### 16a. BLOCKING 1: tracked compiled bytecode (own mishap, disclosed)
C1' tracked 19 __pycache__/*.pyc files under provisioning/p3/, p3/rehearsal/, and successor-uki-candidate/ - the #18'/H5 defect class, introduced by a local git add -A sweeping in interpreter caches. All 19 are removed; .gitignore now covers __pycache__/ and *.pyc; preflight gains E_BYTECODE_COMMITTED (zero tracked __pycache__/.pyc in git ls-files, fail-closed). Negative-tested EXECUTED: clean temp repo no fire, planted __pycache__/a.cpython-310.pyc fires E_BYTECODE_COMMITTED naming the path, real C1'' tree no fire. Local tooling runs with PYTHONDONTWRITEBYTECODE=1 from here on.

### 16b. BLOCKING 2: throwaway key location and lifecycle in c-sign
The c-sign throwaway key previously lived at build-output/c-sign/throwaway-key.pem (INSIDE the checkout) and was plain-rm'd. Now: the key is generated at /tmp/$PREFIX-csign-key/throwaway-key.pem (directory mode 0700, outside the checkout and every upload path); shred -u runs BOTH in the step's EXIT trap (guaranteed on cancellation) and in the explicit post-gate cleanup; E_KEY_RESIDUE targets /tmp/$PREFIX-csign-key; the directory itself is removed. K2 now also sweeps the checkout build-output tree after the c-sign gates and again after fixture copy-out: any key-named file or PEM/DER private-key content anywhere under build-output dies E_PRIVATE_KEY_IN_BUILD_TREE (exit 95). fixture-generate.sh gets the same rule: its workdir is now /tmp/$PREFIX-fixture-keys.XXXXXX (mktemp, mode 0700) and its keys are shred -u'd both in its EXIT trap and in the explicit cleanup (replacing the A4-era plain-delete, which the old comment explicitly disclaimed).

### 16c. REQUIRED GUARD: E_CERT_POSITIVE_MISSING
Preflight now fails E_CERT_POSITIVE_MISSING when evidence/successor-to-certify.efi exists but the certification case set does not contain exactly ONE positive case: sole db [owner cert 7cda4ddc..] via the enroll-sole template, expect.kernel_exec true, exit_98 true, exit_97 false, zero reject strings. A negative-only certification set can never reach the PASS emitter. Negative-tested EXECUTED: slot absent + negative-only no fire; slot present + negative-only fires; exactly one sole-db positive no fire; two positives fires; widened-db "positive" fires; positive carrying reject strings fires.

### 16d. FUTURE signed-slot head (recorded per peer part 3/3; NOT implemented in C1'')
When the owner-signed slot lands, its own reviewed head must: (a) retarget qemu-smoke case index 0 away from the historical R1 ESP; (b) replace the certification ESP pin 2bfa6212.. in both runner and env2 with the pin of the ESP built from the signed slot at build-output/esp/c5-successor-to-certify-esp.raw (path designated in section 17); (c) add the positive case and update the frozen certification set (FROZEN_CERT_CASE_IDS) together with the E_CERT_POSITIVE_MISSING guard passing. These are explicitly distinguished from the C1'' blockers and deferred to that head. (d) (added per the C1''' full verdict, parts 2-3/3): preflight must CROSS-CHECK config.json "enrollments" against enroll-predicate-check.py's mode map (sole/sole-fresh db == [PROD_CERT], widened == [PROD_CERT, hostile], throwaway == [in-run cert]) under its own named code with a committed planted negative, so the committed declaration cannot drift from in-run enforcement - otherwise one config edit could let a widened-db case count as the positive. NOT implemented in C1'''; mandatory for the signed-slot head. (e) (added per the C1'''' verdict, parts 2-3/3): the CERTIFICATION workflow still has four silent-skip zero-private-key K2 evidence-gate sweeps - os.walk(p) with NO onerror at lines 292 (before firmware-hash upload), 498 (before evidence upload), 753 (before env2 evidence upload), 877 (before marker upload) of OVMF_CI_SECURE_BOOT_UKI-CERTIFICATION-workflow.yml (line numbers at C1'''' bytes c839727e72c2c99296eeec41061251008018044a; verified: no onerror anywhere in that file). The peer's D4(e) "both workflows" wording was ambiguous; C1'''' hardened the rehearsal/scratch lanes only, and the certification lane is where the vacuous-skip risk matters most. The signed-slot head MUST bring the same fail-closed treatment there: onerror that raises a named code, a non-zero scanned-count assertion (empty-scan code), and committed planted negatives in test-k2-sweeps.py extended to extract and exec the certification workflow's exact sweep blocks (unreadable subdir fails, empty scan fails, planted key/pem still caught). NOT implemented in C1''''; mandatory for the signed-slot head.

## 17. C1''' revision (peer verdict on C1''): tight positive predicate + committed planted negative + comment fix

The peer's C1'' verdict accepted the bytecode purge, E_BYTECODE_COMMITTED, the c-sign/fixture key lifecycles, the retargeted E_KEY_RESIDUE, both K2 sweeps, and the identical rehearsal/scratch deltas. One blocker remained: E_CERT_POSITIVE_MISSING passed on the current frozen R2-R7 set with a planted slot. Two causes, both confirmed and fixed: (a) R7 matched the loose v1 predicate (enroll-sole template substring + kernel_exec + exit_98) while running the HISTORICAL ESP; (b) the reject-string clause was dead code - the schema uses expect.no_reject_strings=true, not a reject_strings absence test.

The v2 guard (E_CERT_POSITIVE_MISSING, same code) requires exactly ONE certification case satisfying ALL of: (1) esp == build-output/esp/c5-successor-to-certify-esp.raw - the designated exact path for the ESP built from evidence/successor-to-certify.efi (the signed head pins its hash); (2) vars enrollment whose trust DER set is exactly [7cda4ddc149849cc61191d4b5b3d218d14770c0401e9e66dd9617b82ba1ae441] per the NEW committed enrollment record (config.json "enrollments": sole and sole-fresh map to [owner DER]; widened to [owner DER, IN-RUN:c5-hostile-fixture]; throwaway to [IN-RUN:c5-throwaway-ci-cert]) - never a template-name substring; (3) positive expectations under the real schema keys (kernel_exec true, exit_98 true, exit_97 false, no_reject_strings true).

Committed planted negatives: test-cert-positive-guard.py EXTRACTS the exact guard block from preflight-check.py and execs it against the REAL config.json - 9 cases, all pass, including the reviewer's exact repro (current frozen set + planted slot -> E_CERT_POSITIVE_MISSING, since neither R5 nor R7 satisfies the slot-ESP condition), plus wrong-ESP, throwaway-enrollment, two-positives, missing no_reject_strings, reject-strings-present, and unknown-enrollment mutations. Wired into the same must-show step (tee'd to $PREFIX-certpos-guard-negtests.log) and D2-registered. Also fixed: fixture-generate.sh's stale header comment claiming plain-delete (the lifecycle was accepted on the bytes; the comment now says shred -u).

Mishap disclosed: my v1 negative suite tested synthetic configs and missed the simplest case - the CURRENT config plus a planted slot. The v2 suite leads with exactly that case. C1''' SUPERSEDES C1'' (fe147879d468994f696fb09d50eb8425bfbcdc47), C1' (0d66fc2b..) and C1 (b2eaef1d..); all remain in history as reviewed-and-revised heads.

## 18. C1'''' revision (run-35999960747 failure map): prefix pin, import, dual-mode stale-state, fixture sweep/handoff

Run 35999960747 (head 27bfd5c3, attempt 1, push-triggered) FAILED; the peer ruled a real failure of the committed head, no rerun, fixes as C1'''' (parent 27bfd5c3). C1'''' SUPERSEDES C1''' (27bfd5c3..), C1'' (fe147879..), C1' (0d66fc2b..), C1 (b2eaef1d..); all remain in history as reviewed-and-revised heads. Consequential downstream failures (F6/H3 neg-inputs, verify-auth inputs, env2 skip) get no workarounds - they are re-judged only on the new run.

### 18a. D1: E_PREFIX_COUNT_MISMATCH (rehearsal 83 vs pinned 79) - pin moved deliberately 79->83
Root cause: C1' added five literal NON_CERTIFYING_REHEARSAL occurrences to the rehearsal workflow; the 78->79 pin move counted only one of them. Per-occurrence justification (line numbers at C1'''' bytes; each +1 literal):
- line 183: step name "NON_CERTIFYING_REHEARSAL c-sign derivation/confinement negative tests (must-show)" - B1 confinement suite step (C1'); MISSED by the 78->79 move.
- line 271: step name "NON_CERTIFYING_REHEARSAL unsigned UKI in-run build (reviewed gapless builder)" - route-(ii) in-run build step (C1'); MISSED.
- line 293: step name "NON_CERTIFYING_REHEARSAL criterion-C throwaway signing (c-sign, ephemeral in-run key)" - the c-sign step (C1'); ALREADY counted by the 78->79 move.
- line 390: step name "NON_CERTIFYING_REHEARSAL criterion-C fixture generation (in-run ephemeral keys)" - route-(ii) fixture step (C1'); MISSED.
- line 479: "schema": "NON_CERTIFYING_REHEARSAL-c-fixture-generation/v1" - GENERATION-RECORD schema literal (C1'); MISSED.
Net +4 beyond the pin: 79->83. Certification workflow: 44 == 44 (unchanged; its pin stands). Scratch workflow: 0 REHEARSAL literals by construction (derive swaps prefixes). C1'''' adds zero new literals (verified: count remains 83 after the D4 rework).

### 18b. D2: E_PYTHON_IMPORTS (textwrap) - import DROPPED
test-cert-positive-guard.py now dedents the extracted guard block locally (common-leading-whitespace strip); the allowed-imports list is untouched.

### 18c. D3: E_STALE_STATE_COMMITTED at the H5 baseline - dual-mode check
Root cause: section 6c tested os.path.exists, but since C1' the run legitimately creates rehearsal/build-output (in-run UKI build, c-sign, fixtures), so the mid-ceremony H5 re-preflights were always red and masked the H5 probe. Fix: static (step-11) runs keep the filesystem-absence check (NOT weakened - they run before any build); mid-ceremony re-preflights (the three H5 invocations in the scratch lane) set PREFLIGHT_MID_CEREMONY=1, under which "committed" means TRACKED via git ls-files (build-output/, disks/, prep/ under the rehearsal path). Committed planted negatives (test-stale-state-committed.py, execs the exact 6c block): static-absent no fire; static-existing fires; mid-ceremony untracked build-output NO fire; mid-ceremony force-added tracked build-output/x FIRES with the tracked-path message; tracked disks/y FIRES. 6/6 pass.

### 18d. D4: fixture copy-back Permission denied + the VACUOUS sweep
Root cause (more serious than first reported): fixture-generate.sh runs as root (sudo unshare) with umask 077, so $F/gen is root-owned 0700; the runner-user PYK2 sweep hit os.walk's silent onerror=None skip, scanned NOTHING, and printed "tree clean"; the later cp failed EACCES for the same reason. Fix per ruling: (a) the K2 sweep now runs INSIDE the sudo/unshare block as root over the whole $F tree; (b) os.walk gets an onerror that RAISES (E_FIXTURE_TREE_UNREADABLE); (c) the scanned-file count and the presence of all four named public outputs are asserted (E_FIXTURE_PAYLOAD_INCOMPLETE); (d) the four artifacts leave the namespace with install -m 0644 -o $RUNNER_UID -g $RUNNER_GID (uid/gid passed via env) into the runner-premade rehearsal/build-output/c-sign/fixtures/ - NEVER chown, and the 0700 root key workdir is never relaxed. (e) Every other sweep hardened against the same silent skip: the c-sign build-output sweep (PYK2C), the post-copy build-output sweep (PYK2F), and all three zero-private-key upload gates (PYK) now use onerror=raise (E_K2_SWEEP_UNREADABLE) plus a non-zero scanned-count assertion (E_K2_SWEEP_EMPTY). (f) Committed planted negatives (test-k2-sweeps.py, extracts the exact heredoc bodies from the workflow): clean trees pass, an UNREADABLE subdirectory makes every sweep FAIL with its named code (never "clean"), empty trees fail E_K2_SWEEP_EMPTY, missing public output fails E_FIXTURE_PAYLOAD_INCOMPLETE, planted key names/content fail their E_PRIVATE_KEY_* codes. 16/16 pass. SCOPE NOTE (added per the C1'''' verdict, parts 2-3/3): the (e) hardening above covers the rehearsal/scratch lanes. The CERTIFICATION workflow's four K2 evidence-gate sweeps (lines 292/498/753/877) remain silent-skip and are recorded as deferred item 16d(e) - mandatory for the signed-slot head, NOT part of C1''''.

## 19. C1''''' revision (run-36004747396 failure map): heredoc structure gate + H5 exact-pair expectation

Run 36004747396 (head c839727e72c2c99296eeec41061251008018044a, attempt 1) FAILED on two real defects; step 11 static conformance, both builds, hostile drift, canary, app+ESP builds, unsigned UKI build and criterion-C throwaway signing were GREEN. C1''''' SUPERSEDES C1'''' (c839727e72c2c99296eeec41061251008018044a), C1''' (27bfd5c3296d63cc8cb7fe6e1627fe2cf6e4aabd), C1'' (fe147879d468994f696fb09d50eb8425bfbcdc47), C1' (0d66fc2b6b7644e157f7a305530d82066f2195ab), C1 (b2eaef1d1b8b56f7aea55d33a881b5eb8d37f348); all remain in history as reviewed-and-revised heads. Consequential failures (steps 31/32 F6/H3 missing sole vars) are re-judged only on the new run - no workarounds.

### 19a. DEFECT 1: step-19 PREC heredoc swallowed the PYK2F opener - structure fix + NEW E_HEREDOC_STRUCTURE gate
Root cause: the C1'''' fixture-step edit left the PREC terminator AFTER the PYK2F block, so bash fed the python3 - <<'PYK2F' line into PREC's python stdin (line 47 SyntaxError); the generation-record heredoc and the post-copy sweep never ran as shell. bash -n, YAML parse and marker-name extraction are all blind to this shape - both sides missed it on the C1'''' byte review. Fix per ruling: (a) PREC closes BEFORE the PYK2F opener (PREC body, PREC, then python3 - <<'PYK2F' ... PYK2F). (b) NEW preflight gate E_HEREDOC_STRUCTURE over EVERY workflow (rehearsal, scratch, certification, temp): each run block is parsed with bash rules via the NEW committed single-source module heredoc_parse.py (run-block extraction after YAML-indent stripping; opener = <<'TAG' or <<"TAG", here-strings excluded; body ends at the first line equal to the delimiter; openers queue in order); every opener must close inside its step, every python heredoc body must py_compile, and no python body line may itself open a heredoc. (c) Committed planted negatives (test-heredoc-structure.py, execs the EXACT 6l block): real workflows clean, clean synthetic step clean, the misplaced-terminator exact shape fires, unclosed heredoc fires, python syntax error fires - 5/5. (d) test-k2-sweeps.py now extracts sweep bodies with the SAME parser (recursive descent into shell-script bodies such as the sudo/unshare CFIX/CSIGN heredocs, whose nested heredocs bash parses at runtime) - marker search extracted the swallowed block and could not see the defect; 16/16 still pass. The gate caught the still-broken committed scratch PREC the moment it was added (E_HEREDOC_STRUCTURE + E_SCRATCH_DERIVE_DRIFT), and both cleared on re-derivation - the detector-proves-the-fix loop ran locally before CI.

### 19b. DEFECT 2: H5 planted expectation was wrong, NOT the guards - exact-pair expectation + committed local proof
Root cause: the probe zz_bytecode_probe.py (from lane_resolve import resolve_config_value) CORRECTLY trips two guards - E_BYTECODE_GUARD (sibling import without prior sys.dont_write_bytecode=True, check 6j) and E_PYTHON_IMPORTS (lane_resolve is allow-listed only for rehearsal-harness.py and preflight-check.py per the #18 F1 narrow allowance). The singleton expectation was never exercised because the mid-ceremony baseline was always red until C1''''. No guard weakened; the lane_resolve allowance NOT widened; no committed consumer mutated. Fix per ruling: the scratch H5 gate (derive-scratch.py BLOCK_BYTECODE_GUARD_NEG) now demands EXACTLY two entries, each naming zz_bytecode_probe.py - E_BYTECODE_GUARD plus E_PYTHON_IMPORTS with module set exactly {lane_resolve}; any other code, extra entry, or non-probe attribution fails E_H5_PLANTED_ERRSET_MISMATCH. Committed local proof (test-h5-planted-errset.py): copies the real p3 tree + workflows to a temp layout, runs the REAL preflight without and with the planted probe, and asserts the baseline-delta is exactly that pair (environment-only codes cancel; in CI the baseline is empty so the delta IS the planted set) - 3/3. The expectation is thus proven before CI.

Mishap disclosed: C1'''' shipped the swallowed heredoc; my own byte-review and the peer's both missed it because every static check we had (bash -n, YAML parse, marker extraction) is blind to heredoc-body swallowing. The new gate closes that class structurally, with the parser shared by gate and tests so extraction can never drift from enforcement again.

Signed-slot deferred items 16d(a)-(e) still stand, including (e) the certification lane's four silent-skip K2 sweeps - NOT part of this head.

## 20. C1'''''' revision (C1''''' verdict): recursive nested-heredoc gate + unquoted-opener fail-closed + coverage evidence

The C1''''' verdict accepted everything except one blocker IN the new gate itself: E_HEREDOC_STRUCTURE treated heredoc bodies as opaque data, so python heredocs NESTED inside shell-stdin heredocs (the sudo unshare ... bash -se <<'CSIGN' and <<'CFIX' bodies: CSIGN>PYG4B, CSIGN>PYX, CSIGN>PYK2C, CFIX>PYK2 - exactly where the D4 fix lives) were never structure-checked or compiled. The reviewer reproduced on the shipped bytes: a planted PYK2C syntax error inside CSIGN in the scratch workflow produced no E_HEREDOC_STRUCTURE. C1'''''' SUPERSEDES C1''''' (d53219d253f764d4048a2fd4ef5b1b85413db8fc), C1'''' (c839727e..), C1''' (27bfd5c3..), C1'' (fe147879..), C1' (0d66fc2b..), C1 (b2eaef1d..); all remain in history as reviewed-and-revised heads.

Fix per ruling: (a) heredoc_parse.walk recurses - every closed non-python heredoc body is itself parsed with the same bash rules (close inside the parent body, py_compile python bodies, no opener inside a python body) at every depth, with >-joined path attribution (CSIGN>PYK2C, CFIX>PYK2). (b) Unquoted openers (<<TAG, <<-TAG) fail closed with their own named code E_HEREDOC_UNQUOTED_OPENER (none exist today; the parser only recognises quoted delimiters and records unquoted matches as violations, never queues them). (c) The preflight report now carries heredoc_coverage: the per-workflow list of compiled python heredoc paths including nested ones (rehearsal 12 incl. 4 nested; scratch 18 incl. 4 nested; certification 7; v3-structural-enforcement-preflight 1) - coverage is visible in evidence. (d) Committed planted negatives extended (test-heredoc-structure.py, execs the EXACT 6l block): nested python syntax error fires with the nested path, the nested misplaced-terminator shape fires, an unquoted opener fires E_HEREDOC_UNQUOTED_OPENER - 8/8 with the original five. (e) test-k2-sweeps.py extracts PYK2C and PYK2 through the shared recursive walk() (its own parallel recursion removed) - 16/16. Reviewer repro re-run locally as final validation: a planted unclosed-paren in the scratch CSIGN>PYK2C print line fires E_HEREDOC_STRUCTURE naming the nested path; file restored afterwards.

Mishap disclosed: my first local replant attempt was paren-balanced (paren moved, not removed) and taught nothing; the real unclosed-paren plant fires as required. C1''''' itself shipped a gate whose own coverage claim was unproven for nested bodies - the recursion the extraction already had is now shared by enforcement, so gate and tests cannot diverge on depth again.

Signed-slot deferred items 16d(a)-(e) still stand - NOT part of this head.

## 21. C1''''''' revision (run-36009604654 failure): in-run products leave the checkout - design contradiction removed

Run 36009604654 (head dac532c39166e63c11a7f11ec2e4efef213d617c, attempt 1) FAILED at step 22 "qemu staged-ROM gates (A3)": E_SMOKE_PREP_TREE_DIRTY exit 97 - git status showed exactly ?? rehearsal/build-output/ (untracked in-run products from steps 18/19) and the boot never started. Steps 11 (static), 18 (c-sign), 19 (c-fixtures) and 33 (H5) were GREEN; steps 31/32 (F6/H3) cascaded on the missing sole vars; step 30 (F3), step 42 (immutability) and the marker scan passed. C1''''''' SUPERSEDES C1'''''' (dac532c39166e63c11a7f11ec2e4efef213d617c), C1''''' (d53219d2..), C1'''' (c839727e..), C1''' (27bfd5c3..), C1'' (fe147879..), C1' (0d66fc2b..), C1 (b2eaef1d..); all remain in history as reviewed-and-revised heads. F6/H3 consequential failures are re-judged only on the new run - no workarounds.

Root cause: a design contradiction, not flakiness. In-run products (UKI build, c-sign outputs, fixtures) were written into rehearsal/build-output inside the checkout while three cleanliness mechanisms demanded an empty git status: the A3 gates (step 22, workflow lines 624/651), the run-ceremony.sh E_STALE_STATE loop (lines 17-19) and static preflight 6c. The first A3 gate after the first in-run write had to fire. The reviewer REJECTED the allowlist/.gitignore shapes (they weaken the gates); the ruling moves the products OUT of the checkout.

Fix per ruling (parts 3-4/4):
(a) UKI build, c-sign and fixtures now write OUTSIDE the checkout to /tmp/$PREFIX-inrun/{uki,c-sign,c-sign/fixtures} (runner-owned). The key dir stays /tmp/$PREFIX-csign-key; fixture keys stay in mktemp.
(b) run-ceremony.sh and every later consumer read from /tmp/$PREFIX-inrun; the SHASUMS/FIXTURE-SHASUMS sha256sum -c bindings and the unsigned-UKI drift check (4cda9c3e285b5b639364234400bf0b121178f12447cc88d896cd2623e07d18e1) are KEPT at consumption.
(c) No gate weakened: the A3 git-status gates, the E_STALE_STATE loop, static 6c and the three H5 mid-ceremony re-preflights stay exactly as strict (PREFLIGHT_MID_CEREMONY=1 only on the three H5 invocations).
(d) The K2 sweeps (PYK2C, PYK2F) and all three zero-private-key upload gates now cover /tmp/$PREFIX-inrun AS WELL AS the checkout build-output tree (both legs, when present); the fixture root sweep (PYK2) needed no path change - $F was and stays a mktemp outside the checkout. Anything uploaded from inrun names only the public files. test-k2-sweeps.py re-pointed at the dual-leg bodies: 22/22 (clean, clean-both-legs, unreadable inrun, unreadable checkout leg, empty, planted key-name in inrun, planted key-name in checkout leg; fixture and zero-key suites unchanged).
(e) NEW static preflight gate E_INRUN_WRITES_CHECKOUT (section 6m): no run block BEFORE the ceremony step may write under build-output/disks/prep in the checkout (shell-line scan over heredoc_parse.walk at every depth; python heredoc bodies and comment lines excluded - the ruling's inspection list is shell shapes: mkdir/cp/install/mv/tee/ln/dd/touch, redirections, -o/-out targets; boundary = the first run block containing run-ceremony.sh; missing boundary fails too). Committed planted negatives test-inrun-writes.py exec the EXACT 6m block: 11/11 (real workflow clean; mkdir/cp/redirect/install/tee/nested-shell-heredoc writes each fire; comment mention, post-ceremony write, python-body write do not fire; ceremony step missing fires).
(f) Ruling table - every step writing inside the checkout, in step order, and every checkout-cleanliness gate:

| step (in order) | role re checkout |
|---|---|
| step 11 static preflight | CLEANLINESS GATE: 6c E_RUNTIME_ARTIFACT_COMMITTED (no committed build-output/disks/prep) + NEW 6m E_INRUN_WRITES_CHECKOUT |
| step 22 qemu staged-ROM gates (A3) | CLEANLINESS GATE x2 (workflow lines 624/651): git status --porcelain must be EMPTY (E_SMOKE_PREP_TREE_DIRTY exit 97) |
| smoke-prep / ceremony step | CLEANLINESS GATE then WRITER: run-ceremony.sh E_STALE_STATE loop (exit 93) refuses a dirty checkout, then creates its OWN build-output/{esp,esp-variant,ovmf-debug,enroll-app} (ceremony outputs - legitimate) |
| steps 31-42 consumers | WRITERS of evidence files under build-output/pins, esp, ovmf-debug, enroll-app; READERS of /tmp/$PREFIX-inrun products |
| H5 mid-ceremony re-preflights x3 (step 33) | CLEANLINESS GATE: tracked-file cleanliness only (PREFLIGHT_MID_CEREMONY=1 - the tracked-mode check, unchanged) |

(g) Certification lane: its A3 gates (workflow lines 358/385) were checked - no cert step before them writes into the checkout (structured pass in the delivery report).

Signed-slot deferred items 16d(a)-(e) still stand - NOT part of this head.

## 22. C1'''''''' revision (C1''''''' verdict): relocation completed - eight stale reads retargeted, E_INRUN_STALE_PATH gate, prep-key shred

The C1''''''' verdict accepted the relocation design but found it INCOMPLETE: eight consumers still read the pre-relocation in-checkout paths. C1'''''''' SUPERSEDES C1''''''' (3508536e7fcddfd6f1b236c1611f97de703dab2f), C1'''''' (dac532c3..), C1''''' (d53219d2..), C1'''' (c839727e..), C1''' (27bfd5c3..), C1'' (fe147879..), C1' (0d66fc2b..), C1 (b2eaef1d..); all remain in history as reviewed-and-revised heads.

The eight stale reads (reviewer repro: git grep -nE 'build-output/(c-sign|uki)' on the shipped tree): run-ceremony.sh:174 (sole/widened enrollment hostile fixture) and :178 (prep-throwaway db cert + wrong-signer fixture) - the ceremony would have died at enrollment; SCRATCH lines 755/806/859/938/1002 (the five PF must-show steps) and 1364 (VATEST), all six generated from derive-scratch.py lines 146/197/250/329/387/532 - the PF must-shows could have "failed as expected" for the WRONG reason (missing file instead of the planted fault).

Fix per the verdict:
(a) All eight retargeted: run-ceremony.sh reads "$INRUN/c-sign/..."; derive-scratch.py embedded step text uses /tmp/$PREFIX-inrun/c-sign/...; SCRATCH re-derived (DERIVE_IDENTICAL). Post-fix grep: zero occurrences of build-output/(c-sign|uki) outside the excluded gate/test files.
(b) NEW static gate E_INRUN_STALE_PATH (preflight 6n): no occurrence of build-output/uki or build-output/c-sign in any workflow, .sh, or .py - including derive-scratch.py's embedded step text - outside full-comment lines and the gate/test files themselves (preflight-check.py carries the pattern strings; test-inrun-writes.py and test-inrun-stale-path.py carry planted negatives; all three named in the gate). Committed planted negatives test-inrun-stale-path.py exec the EXACT 6n block: 8/8 (real tree clean; workflow/.sh/.py-embedded-text/uki-leg each fire; comment-only, excluded-file, clean-synthetic no-fire).
(c) PF must-show strictness SURVEY (verdict item): each of the five PF steps already asserts its planted failure by NAMED CODE, never a bare non-zero - pf1: exact exit 97 + !E_BASH_ERRTRAP + E_ENROLL_FAT_INVALID + injection proof; pf2/pf5: exact exit 97 + !E_BASH_ERRTRAP + E_ENROLL_FAT_NAME_CONTRACT + injection proof; pf4: exact exit 97 + the exact run-time-derived line-N ERRTRAP string (cp pin count==1, content-verified) + !E_ENROLL_PID_MISSING + planted-condition line in the durable log; pf6: E_PF_BADPRED_PRECONDITION precondition guard + injection proof + E_ENROLL_SET_DB diagnostic + exact exit 97 + E_ENROLL_PREDICATE_FAIL + !E_BASH_ERRTRAP. No step accepts any failure; nothing to change.
(d) prep/prep-throwaway key hygiene raised to the c-sign rule: CONFIRMED enroll-prep.sh writes the throwaway PK/KEK private keys at $W/pk.key and $W/kek.key (0600 via umask 077; W = the prep dir argument: prep, prep-throwaway). run-ceremony.sh now shred -u's all four key files in the EXIT trap AND in the explicit cleanup after the enrollment loop, with a fail-closed residue check (E_PREP_KEY_RESIDUE, exit 97) before the prep dirs are removed; the stale "plain-deleted" comments corrected.

Mishap disclosed: C1''''''' shipped eight stale reads. The 6m gate covers WRITES only and could not see them; my retarget sweep checked the producers and the SHASUMS consumption but not every consumer, and both byte reviews missed it. The new 6n gate makes the whole path class unrepresentable outside the named exclusions.

Signed-slot deferred items 16d(a)-(e) still stand - NOT part of this head.

## 23. C1''''''''' revision (run-36014385477 ruling): PEM intermediates out of $INRUN, aligned K2 legs, exact-set allowlist

Run 36014385477 (head a7bca25ef66098d05b4e51632569839639991988, attempt 1) FAILED at steps 20/38 (zero-private-key K2 gates): E_PRIVATE_KEY_IN_EVIDENCE names=[signer-ossl.pem, c5-throwaway-ci-cert.pem, signer-sbsign.pem] content=[] - filename-only hits on three public-cert PEM intermediates the c-sign step left in /tmp/$PREFIX-inrun/c-sign. Steps 1-19 GREEN (incl. the relocated c-sign/fixtures and their sweeps), F3/H5/immutability GREEN; the A3 smoke-prep path (step 22) never ran. C1''''''''' SUPERSEDES C1'''''''' (a7bca25e..), C1''''''' (3508536e..), C1'''''' (dac532c3..), C1''''' (d53219d2..), C1'''' (c839727e..), C1''' (27bfd5c3..), C1'' (fe147879..), C1' (0d66fc2b..), C1 (b2eaef1d..); all remain in history as reviewed-and-revised heads. The K2 name policy is UNCHANGED: *.key|*.pem|*.p12|*.pfx fails by NAME whatever the content - "public by description" is exactly the judgment the name rule exists to avoid. F6/H3 consequential, re-judged on the next run.

Fix per the ruling:
(a) PEM intermediates NEVER land in $INRUN: c5-throwaway-ci-cert.pem and signer-$v.pem now live in the sibling 0700 transient dir /tmp/$PREFIX-csign-pem, consumed there by the DER conversions and both signing arms, shred -u'd in the SAME EXIT trap AND the explicit cleanup as the throwaway key, with per-file residue checks (E_PEM_RESIDUE, exit 95) plus an outer dir-level E_PEM_RESIDUE backstop. $INRUN holds certs as .der ONLY, as SHASUMS already expects.
(b) PYK2C and PYK2F aligned with the zero-private-key gates: name set = .key/.pem/.p12/.pfx extension PLUS the 'key' substring; content = PEM "PRIVATE KEY" + PKCS#8/RSA DER key-header regexes (the PYK2 fixture sweep already used this set). This class now fails INSIDE c-sign/fixtures, not three steps later at the upload gate.
(c) NEW positive allowlist E_INRUN_UNEXPECTED_FILE (exit 97) at the END of the fixture step - /tmp/$PREFIX-inrun must contain EXACTLY these 21 files:
    uki/successor-unsigned.efi
    c-sign/signed-ossl.efi, c-sign/signed-sbsign.efi
    c-sign/c5-throwaway-ci-cert.der, c-sign/signer-ossl.der, c-sign/signer-sbsign.der
    c-sign/pkcs7-ossl.der, c-sign/pkcs7-sbsign.der
    c-sign/gate4b-ossl.json, c-sign/gate4b-sbsign.json
    c-sign/delta-ossl.json, c-sign/delta-sbsign.json
    c-sign/auth-ossl.json, c-sign/auth-sbsign.json
    c-sign/SHASUMS
    c-sign/fixtures/F-WRONGSIG.efi, c-sign/fixtures/F-HOSTILEUKI.efi
    c-sign/fixtures/C5-WRONG-SIGNER-FIXTURE.cer, c-sign/fixtures/C5-HOSTILE-FIXTURE.cer
    c-sign/fixtures/GENERATION-RECORD.json, c-sign/fixtures/FIXTURE-SHASUMS
  Any extra OR missing file fails. (Identical list in the workflow's PYALLOW block.)
(d) Committed tests: test-k2-sweeps.py gained aligned-leg cases - a PUBLIC .pem (cert-only bytes) in inrun fails at PYK2C AND PYK2F by name, and DER PKCS#8 key bytes fail by content: 26/26. NEW test-inrun-allowlist.py execs the EXACT PYALLOW body (synthetic exact tree built from the want-list parsed out of the extracted body - single source): exact set passes, extra public .pem fails, missing SHASUMS fails, empty tree fails: 4/4. Existing suites unchanged and green.

Mishap disclosed: C1'''''''' relocated the c-sign PRODUCTS but left the public-cert PEM INTERMEDIATES in $INRUN; my own run-36014385477 analysis proposed plain rm inside $INRUN and the ruling's shape (never land them there + transient dir + shred + exact-set) is strictly stronger. The exact-set allowlist now makes ANY unplanned inrun content a named failure at the producing step.

Signed-slot deferred items 16d(a)-(e) still stand - NOT part of this head.

## 24. C1'''''''''' revision (run-36017957182 ruling): fixture-cert consumer-point binding, single-sourced config schema, env-contract gate, H3 guard + must-show trap audit

Run 36017957182 (head 48b251ad, attempt 1) was the deepest run yet - the K2 gates and the A3 porcelain gate passed, the guest booted, and all five prior planted-fault gates passed - then died at step 28 on E_ENROLL_PREDICATE_FAIL with root cause E_ENROLL_PREDICATE_FAIL <- (enroll-predicate-check.py exit 97) E_ENROLL_PREDICATE_FAIL's inner detail: nothing exported C5_HOSTILE_CERT_SHA256 / C5_WRONG_SIGNER_CERT_SHA256 (§15e's claim that run-ceremony.sh exports them was doc running ahead of bytes; git log -S confirms the wiring never existed). Two further defects surfaced downstream: F6 E_F6_NEG_CODE_ABSENT (config.json gained "enrollments" in C1''' but the harness's schema never learned it -> E_CONFIG_SCHEMA fired first) and H3's unnamed exit-1 shape (bare find, no guard, no ERR trap). The ruling's four fix sets, as implemented in this head:

**(a) DEFECT 1 - binding at the SINGLE consumer point.** New committed helper bind-fixture-certs.sh (100755, rehearsal/) is SOURCED by rehearsal-enroll.sh immediately before its enroll-predicate call - never exported by callers and never bound at any other site. It computes the ACTUAL sha256 of the two in-run fixture .cer files itself, requires equality with the H/W recorded in the c-fixtures step's GENERATION-RECORD.json (fail E_FIXTURE_RECORD_MISMATCH, exit 97), and only then exports C5_HOSTILE_CERT_SHA256 / C5_WRONG_SIGNER_CERT_SHA256; missing fixture cert or record fails E_HOSTILE_CERT_UNSET (exit 97). Third-export disclosure (ruling (c) forces it): enroll-predicate-check.py:157 also reads C5_THROWAWAY_CERT_SHA256 in throwaway mode, and its comment's "ceremony-exported" claim was only half true (run-ceremony.sh:122 does export T from the c-sign SHASUMS, but the consumer point must be self-sufficient), so the helper binds T against GENERATION-RECORD.json the same way and exports it too. The helper fails closed on its own (sourced code cannot rely on the parent's set -e; the record check's rc is captured and converted) - the first draft of the helper let a python exit-97 fall through to rc 0, and the committed test caught it before commit. Committed test-fixture-cert-binding.py runs the REAL helper via bash sourcing against planted trees: matching record -> exports == actual hashes; missing cert -> E_HOSTILE_CERT_UNSET; missing record -> E_HOSTILE_CERT_UNSET; record mismatch -> E_FIXTURE_RECORD_MISMATCH. 4/4 pass.

**(b) DEFECT 2 - schema single-sourced (Q1+Q2).** New committed config_schema.py (100755, stdlib-only, no sibling imports) holds TOP_KEYS / TOP_REQUIRED / the enrollments validator as the ONE source; BOTH rehearsal-harness.py and preflight-check.py import it (E_BYTECODE_GUARD-compliant: sys.dont_write_bytecode=True precedes the import in both) and wrap ConfigSchemaError into their own named E_CONFIG_SCHEMA exits. Q1: "enrollments" is REQUIRED (TOP_REQUIRED), not merely tolerated. Q2: preflight now runs the harness's OWN top-level validation on the loaded config, so a schema/config drift dies in the preflight, never at a deep must-show step. The validator requires a nonempty enrollments dict of name -> exactly {"db_der_sha256": [nonempty list of 64-lowercase-hex or IN-RUN:<name>]}; the shipped config.json passes. E_PYTHON_IMPORTS gained the same narrow named-allowance shape as lane_resolve/heredoc_parse: exactly "config_schema", only in rehearsal-harness.py, preflight-check.py and test-config-schema.py. Committed test-config-schema.py runs the module's OWN validator: shipped config passes; planted extra key fails; missing enrollments fails; six bad value shapes fail; IN-RUN:<name> and 64-hex entries pass. 13/13 pass.

**(c) NEW static gate 6o - E_ENV_CONTRACT_UNWIRED.** Every C5_* env READ (os.environ.get / os.environ[...] forms; subscript WRITES are not reads) in a committed rehearsal .py must have a matching committed producer: an export or assignment in a rehearsal/p3 .sh, or an env key / shell line in the ceremony workflows. preflight-check.py (carries the scan regex) and test-env-contract.py (planted fixtures) are excluded. Verified firing on the exact run-36017957182 shape before the helper existed (enroll-predicate-check.py:29 C5_HOSTILE_CERT_SHA256 unwired), passing once bind-fixture-certs.sh exports all three reads. Committed test-env-contract.py executes the EXACT 6o block extracted from preflight-check.py (6o/7 marker-bounded, same discipline as the other extraction-bound tests) against synthetic layouts: read+export passes; read without producer fires with file:line; p3 .sh assignment, workflow env key and workflow shell export all satisfy; subscript write is not a read; excluded files ignored. 8/8 pass. NOTE: inserting section 6o moved the extraction boundary for test-inrun-stale-path.py - its end marker was retargeted from "# 7) KVM requirement" to the 6o marker in the same commit (the third time this extraction-boundary class has appeared; all four extraction tests re-verified).

**(d) DEFECT 3 + PF-6 re-judge + the trap audit.** H3 now guards the harness's early death with [ -d "$T/cases" ] || E_H3_CASES_MISSING (dumps h3.log, exit 97) BEFORE the bare find. The re-judged PF-6 assertion requires its PLANTED predicate fault and nothing else: E_ENROLL_PREDICATE_FAIL must be present AND E_HOSTILE_CERT_UNSET must be ABSENT (new E_PF6_STALE_CODE) - with the wiring live, the side-effect death from run 36017957182 can never again masquerade as PF-6's expected diagnostic. The ruling's must-show ERR-trap audit, executed across every must-show step including the derive-scratch-generated ones (through derive-scratch.py itself):

| must-show step (scratch lane) | ERR trap before this head | ERR trap after |
| --- | --- | --- |
| c-sign derivation/confinement negative tests | csign-negtest (pre-existing) | unchanged |
| PF-1 freemark | none | pf1 |
| PF-2 missingblob | none | pf2 |
| PF-4 missing-needed-file | none (a comment line mentioning the trap had masked the gap in a substring audit) | pf4 |
| PF-5 nolfn | none | pf5 |
| PF-6 badpred | none | pf6 |
| F3 out-of-set vars_template | none | f3negs |
| F6 byte-flip enroll-tie | none | f6 |
| H3 boot-target | none | h3 (+ E_H3_CASES_MISSING guard) |
| H5 bytecode-guard | none | h5 |

Every added trap is the standard named shape (trap '_rc=$?; echo "E_BASH_ERRTRAP <tag> line $LINENO rc=$_rc cmd: $BASH_COMMAND" >&2; exit 97' ERR) inserted immediately after the step's set -e line in derive-scratch.py, with the scratch workflow re-derived (1,809 lines) and the post-derivation audit re-run against the workflow bytes. The non-must-show negative-test steps (fetch_locked, verify-auth, checkout-gate) run python suites, not bash gates, and stay untrapped. The traps cannot misfire on the steps' intentional failures: every expected-failure path in these steps was already `|| _rc=$?`-exempted or `|| { E_...; exit 97; }`-guarded, both ERR-exempt forms.

D2 registration: config_schema.py, bind-fixture-certs.sh and the three new test files joined the job-1 workflow-argument existence gate; config_schema.py and bind-fixture-certs.sh joined the env2 gate (preflight-check.py imports the former, rehearsal-enroll.sh sources the latter). The three new suites are wired into the c-sign negative-tests must-show step with their logs teed into the run evidence tree.

## 25. C1''''''''''' revision (peer verdict on C1''''''''''): copy dropped from the schema test, MODE-conditional throwaway binding, executed error-set reconciliation

The peer's verdict on 2403781e: NOT CLEARED - two small blockers plus one discrepancy to explain; the design and all four ruling fix sets were accepted on the bytes (all 13 suites pass on the exact bytes, zero tracked bytecode, new files 100755).

**BLOCKER 1 - E_PYTHON_IMPORTS on a clean worktree.** His preflight on a clean 2403781e checkout, under BOTH PREFIX=NON_CERTIFYING_SCRATCH and NON_CERTIFYING_REHEARSAL, yielded the 48b251ad set plus exactly one new code: E_PYTHON_IMPORTS for test-config-schema.py line 11 `import sys, os, json, copy` - 'copy' is not on PY_ALLOW, so CI step 11 would have failed. Reproduced here byte-for-byte on a clean 2403781e worktree (`["E_PYTHON_IMPORTS", ".../test-config-schema.py copy"]`, exit 30, both lanes). Fix per option (a): `copy` dropped - the test's deepcopy is now a json round-trip (stdlib, PY_ALLOW-compliant), all 13 checks still pass. EXECUTED preflight on the fixed tree: the error set equals 48b251ad's EXACTLY under both lanes - {E_BWRAP_ARGV_MISMATCH, E_LOCK_MISSING_DEB, E_STAGED_TOOL_MISSING, E_VARS_MISSING}, 173 collected entries, exit 30 - E_PYTHON_IMPORTS gone, E_CONFIG_SCHEMA and E_ENV_CONTRACT_UNWIRED absent (both gates pass on the committed bytes).

**Discrepancy reconciliation (verdict item b).** The C1'''''''''' report's "preflight error set 70 -> 72" was a STATIC scan of fail("E_...") literals in preflight-check.py (70 codes at 48b251ad, 72 with the two new gates), NOT an executed preflight run; the executed set comparison above is the authoritative one and it is unchanged. The E_ENV_CONTRACT_UNWIRED message quoted in that report ("enroll-predicate-check.py:29 reads C5_HOSTILE_CERT_SHA256 with no committed export/assignment in rehearsal/p3 .sh or workflow") was produced by executing the EXTRACTED 6o block standalone (cwd=rehearsal dir, real here/p3_root/wf_dir) in the DIRTY worktree before bind-fixture-certs.sh existed - the intended pre-wiring negative, never a claim about a clean-tree run. The E_CONFIG_SCHEMA messages quoted were produced by the harness's check_schema (exit 90 JSON), not by a full preflight run.

**BLOCKER 2 - throwaway binding is now MODE-conditional.** bind-fixture-certs.sh takes the enrollment MODE as $2 (rehearsal-enroll.sh passes "$MODE"). H/W binding stays UNCONDITIONAL; T is required, record-checked and exported ONLY when MODE=throwaway (fail E_THROWAWAY_CERT_UNSET / E_FIXTURE_RECORD_MISMATCH by name there). The certification lane has no c-sign step and must never have one - sole/db2 enrollments never touch the throwaway DER. The third export itself was accepted (tighter than the old run-ceremony-only export). test-fixture-cert-binding.py grew to 7 cases: the four original plus (5) sole mode with NO throwaway DER present binds H/W and succeeds with T unset, (6) db2 same, (7) throwaway mode with the DER missing dies E_THROWAWAY_CERT_UNSET. 7/7 pass.

**Noted for the signed-slot head (verdict item (f), NOT part of this head):** the certification workflow has no uki-build or fixture-generation steps, yet run-ceremony.sh (since C1''''''') requires $INRUN/uki/successor-unsigned.efi and $INRUN/c-sign/fixtures + FIXTURE-SHASUMS, and the R2-R6 certification negatives need the unsigned UKI + hostile/wrong-signer fixtures. Masked today because the slot is absent (certification dies at D2 first). The signed-slot head must add the in-run unsigned-UKI build and network-off fixture generation to the certification lane (same K2/allowlist gates, no c-sign/throwaway), OR make run-ceremony lane-aware with named gates.

## 26. C1'''''''''''' revision (run-36024634796 ruling + amendment): R7 stale expectation retired to certification-only, lane-driven case selection, per-case VARS provenance, workdir sibling-closure gate

**The failure map (run 36024634796, scratch lane, head 45d3f412).** Deepest run yet: all 4 enroll predicates PASS, F6 PASS, R1-R6 EXPECTATIONS_MET, zero unnamed deaths. Two defects: (D1) step 28 - R7 died E_CASE_BOOT_TARGET_UNPROVEN on the RELEASE firmware 1dbb7f9b7e7285b950929bbbc1494c186bfb061cde60cf531ff9756ef87dab7a (kernel_exec=False, exit_98=False; first non-plumbing failure); (D2) step 32 - the H3 boot-target planted negative died E_H3_CASES_MISSING: the injected $T harness copy hit ModuleNotFoundError config_schema.

**26a. R7 verdict: CASE-EXPECTATION defect, NOT a release-firmware gap.** R7 ran the release firmware + the HISTORICAL ESP c5-root-admitter-uki-v3-esp.raw (signed UKI 13309697) with a sole db, expecting boot. The #19' root cause (section 14) proved UKI 13309697's embedded Authenticode digest ab95a4c3.. differs from EDK2's computed 78eb453c.., so NO correct Secure Boot firmware can run it; R1 runs the SAME ESP on debug expecting REJECT for exactly this reason. R7's positive expectation predates #19' and was never updated; the release firmware rejecting that ESP is CORRECT behavior, and the expectation was stale by construction. Per the ruling: R7 is REMOVED from the scratch and rehearsal lanes (config lanes now ["certification"]); it stays in the frozen certification six (FROZEN_CERT_CASE_IDS and the harness _CERT_IDS unchanged). The release-firmware positive coverage in the non-certifying lanes is the two criterion-C release cases (C-ossl-throwaway-release, C-sbsign-throwaway-release); R7 is NOT re-expected as a release reject control because no provable boot-target observable exists for it on release. argv-freeze.json and the preflight CASE_ARGV_PINS are UNCHANGED: the freeze pins the config-derived argv per case id (a static derivation artifact, count-checked against the independent pin constants, never reconstructed against the lane-filtered run set); R7 remains one of the 11 config cases and its frozen argv stays byte-reviewed.

**26b. Lane-driven case selection (harness).** Before this head the harness ran cfg["cases"] UNFILTERED outside the certification lane - the lanes field constrained nothing at runtime. The harness now selects cases by lane in the non-certification lanes too (PREFIX NON_CERTIFYING_REHEARSAL -> rehearsal, NON_CERTIFYING_SCRATCH -> scratch; E_LANE_UNKNOWN on any other PREFIX, E_LANE_CASE_SET_EMPTY if nothing selects). The scratch/rehearsal lanes now run exactly 10 cases: R1-R6 plus the four criterion-C cases.

**26c. Amendment (1): the C-release cases must EXECUTE and PASS.** The next run must actually execute both C-release cases and both must meet their POSITIVE expectations with a provable boot target; a failure or UNPROVEN there is a real defect to diagnose. R7's removal does not cover for it - a lane without passing release coverage is not green. (R7 previously died first in case order, so the C-release cases were never reached.)

**26d. Amendment (2): per-case VARS provenance + cross-build reuse statement.** The harness deterministic manifest now records, per case: the CODE firmware sha256 (pre-existing firmware_sha256) AND vars_provenance = {template, enrollment (the enrollment directory), produced_by, producer_fw_pin, producer_fw_sha256}. Rehearsal lane: produced_by rehearsal-enroll.sh, producer_fw_pin $BUILD/ovmf_code_debug, producer_fw_sha256 = config firmware_debug_sha256 (fc150336fce10eb5508fa440cdf7300622c8c3ac71f2fbe10a0731422b9cef24) - the enrollment boots under the reproducible DEBUG build (rehearsal-enroll.sh line 33). Certification lane: the vars come from the certification ceremony enrollment and that ceremony's own evidence records their provenance; the harness records no claim there. CROSS-BUILD VARS REUSE (reproducible DEBUG build -> distro RELEASE) IS INTENDED: the enrollment is performed once under the debug build and the resulting var store (standard authenticated variables, firmware-agnostic content) is consumed by both firmware builds; that is the design under test, not an accident. If either C-release case fails on the next run, this reuse is the FIRST hypothesis to test, before touching expectations.

**26e. New static guard 6p E_HIST_ESP_BOOT_EXPECT.** No case with scratch or rehearsal in its lanes may target the historical ESP while expecting kernel_exec=true (a positive expectation there is stale by construction per 26a). The certification lane is exempt (R7 stays certification-only until signed-slot item (g) retargets it). Planted negative: test-hist-esp-guard.py executes the extracted 6p block against the real config (passes), a planted R7-back-in-scratch mutation (fires, naming the case), and a positive expectation on a NON-historical ESP (passes) - 3/3.

**26f. Ruling (d)+(e): H3 sibling closure fixed; new static gate 6q E_WORKDIR_SIBLING_MISSING.** D2 root cause: the H3 negative copied only rehearsal-harness.py + lane_resolve.py into $T; the harness also imports config_schema (single-sourced schema, section 24), so the injected harness died at import. The H3 copy list now includes config_schema.py, and the derived scratch workflow is re-derived (6e12 byte-identity holds). The new gate 6q scans derive-scratch.py and both lane workflows: every copy group (maximal run of 'cp NAME.py ...' lines) must copy the FULL transitive sibling-import closure of its modules (sibling detection mirrors 6j E_BYTECODE_GUARD). The only other workdir .py copy in the tree (platform-lockgen.py, stdlib-only) is closure-clean. Planted negative: test-workdir-sibling.py executes the extracted 6q block against the real tree (passes), a synthetic full-closure tree (passes), and the exact D2 removal of config_schema.py from the H3 copy (fires, naming config_schema.py) - 3/3.

**26g. Signed-slot item (g) - note only, NOT this head.** When the signed slot lands, certification R7 must be retargeted to the signed-slot ESP (release firmware, sole db [7cda4ddc..], expect boot), and E_CERT_POSITIVE_MISSING must then define "the positive" as the DEBUG-firmware case and treat the retargeted R7 as its release sibling - otherwise the retargeted R7 becomes a second positive and the exactly-one rule fires.

**Mishaps (disclosed).** The first 6q implementation compared the copied set in filename space against the closure in module-name space and false-fired on the real tree; test-workdir-sibling.py's real-tree check caught it before commit and the gate now compares in module-name space. The same test then caught the not-yet-re-derived scratch workflow (still carrying the 2-file H3 copy) - resolved by re-deriving. Both defects were caught locally and never committed.

**Validation (executed, this head).** All 15 suites pass on the exact bytes (13 pre-existing + test-hist-esp-guard + test-workdir-sibling). EXECUTED preflight under BOTH lanes: the error set equals 45d3f412's EXACTLY - {E_BWRAP_ARGV_MISMATCH x1, E_LOCK_MISSING_DEB x161, E_STAGED_TOOL_MISSING x10, E_VARS_MISSING x1}, 173 collected entries, exit 30; E_HIST_ESP_BOOT_EXPECT and E_WORKDIR_SIBLING_MISSING do not fire on the committed tree. Both workflows parse as YAML; the new test files are mode 100755; zero tracked bytecode.

## 27. C1''''''''''''' revision (run-36031372949 ruling, items 1-11): H3 readability repair + named precheck taxonomy, executed-argv freeze contract, marker-at-rest assertion

**The run map (run 36031372949, scratch lane, head aee37e2d): the run is NOT ACCEPTED.** Step 32 (H3) died exit 97 and steps 35/36 + env2 were skipped, so the run counts for nothing as acceptance evidence whatever its green steps show - this document is repo prose, not evidence, and a reviewer ruling is not a run result. For the record, the ceremony steps that did run went green: all 4 enroll predicates PASS, all TEN lane-selected cases EXPECTATIONS_MET - including BOTH C-release cases with proven boot target on release firmware 1dbb7f9b.. and per-case vars_provenance in the deterministic manifests; R7 correctly absent. The peer independently verified the evidence ZIP bytes (166 manifest entries re-hashed, both C-release check sets all-true, and he ruled the behavioral boot-target proof sound: the runtime-formatted panic records exist in the RAM dump only if the kernel executed) and ruled the amended C-release bar MET as NON-CERTIFYING scratch evidence - while keeping the run itself NOT ACCEPTED. H3's planted gate actually FIRED (E_CASE_BOOT_TARGET rc=90, as designed); the step's own precheck then hit EACCES reading the root-owned $T tree and misreported it as E_H3_QEMU_NOT_STARTED "environmental" - a permissions death wearing an environmental name.

**27a. Items 1-2: ownership repair + distinct named deaths (H3 step 32).** After the sudo harness run, the step repairs OWNERSHIP of $T only with `sudo chown -R "$(id -u):$(id -g)" "$T"`, failing closed E_H3_PERM_REPAIR_FAILED (no world-readable chmod, nothing outside $T - mirrors the c-sign/out-tree chown-preferred contract). The precheck taxonomy is now: case dir or argv.txt missing -> E_H3_QEMU_NOT_STARTED; ovmf-debug.log present but [ -r ] false, or grep exit 2 -> E_H3_DEBUG_LOG_UNREADABLE (never "environmental"); log absent, readable-but-empty, or carrying no '^\[Bds\]Booting ' line -> E_H3_NO_BOOT_LINE. grep's rc is captured and branched 0/1/2; rc 2 never folds into "no match". E_H3_CASES_MISSING is folded into E_H3_QEMU_NOT_STARTED per the ruling's taxonomy. Item 3 stands: the planted case must still die E_CASE_BOOT_TARGET rc=90 with a readable Booting line observed and logged. Item 4: test-h3-precheck.py executes the EXACT extracted check segment under bash against synthetic trees - 8/8 (well-formed passes; cases-dir missing; argv.txt missing; chmod-000 log -> E_H3_DEBUG_LOG_UNREADABLE and NOT E_H3_QEMU_NOT_STARTED; no-Booting-line; empty log; absent log; log-path-is-a-directory -> grep rc 2 -> E_H3_DEBUG_LOG_UNREADABLE).

**27b. Item 5: the sweep.** Every step that reads harness/build output produced under sudo was audited on the bytes: (i) qemu-smoke and the PF-1/2/4/5/6 wrappers capture logs via RUNNER-side redirects (runner-owned files) and their evidence trees sit under /tmp/$PREFIX-out, covered by the end-of-job readability repair (if: always(), chown-preferred, E_EVIDENCE_HASH_DRIFT hash contract); (ii) the c-sign block and the CFIX fixture block self-repair (sudo chown -R to runner / RUNNER_UID/RUNNER_GID); (iii) the ceremony tree is repaired by run-ceremony.sh's EXIT trap; (iv) f3gate and f6tie run without sudo (f6tie runs the harness IN PLACE from the checkout, dying at the tie gate before qemu); (v) the env2 firmware build runs without sudo, and env2's sudo-built app/ESP outputs mirror job 1's proven-readable build pattern; (vi) the closure-temp/foundation-temp workflows run no sudo harness or qemu at all. H3 was the ONLY step with the un-repaired sudo-created tree plus runner-side read pattern. No other step needed the repair.

**27c. Items 6(i)/7/8/9/10: the executed-argv freeze contract.** The harness now loads argv-freeze.json from beside itself at startup, fail-closed: missing or unreadable or unparseable -> E_ARGV_FREEZE_MISSING (never skipped, never an empty freeze); the loaded bytes must sha256-match the new committed constant ARGV_FREEZE_SHA256 (e9a38cec9a63986b6898203ffc39de3ba706607646b66a9610c1a87b74713f94, the committed file's sha256) or it dies E_ARGV_FREEZE_PIN_MISMATCH (a workdir copy cannot drift). In run_case, immediately after argv construction: an executed id absent from the freeze dies E_CASE_ARGV_FROZEN_MISSING; otherwise the executed argv is reverse-rewritten to canonical form (the qemu-smoke lane-argv discipline - identity in the rehearsal/certification lanes, only the /tmp/<prefix>- rewrite in scratch) and its NUL-join sha256 must equal the frozen argv_sha256, else E_CASE_ARGV_FROZEN_MISMATCH naming both hashes. The H3 injected workdir now copies argv-freeze.json beside the harness (the ONLY injected harness workdir - f6tie runs the harness in place, so its freeze load resolves to the committed file; its planted case id is absent from the freeze but dies at the F6 tie gate BEFORE argv construction, so 6(i)'s per-EXECUTED-case placement is load-bearing). Gate 6q E_WORKDIR_SIBLING_MISSING now treats argv-freeze.json as a REQUIRED non-.py sibling of any workdir harness copy. test-argv-freeze.py 11/11: (A) convention proof - the harness's own extracted build_argv rebuilds the frozen R1 argv from config.json byte-for-byte and its NUL-join sha256 equals the frozen entry; (B) 6i block - rehearsal match passes, scratch-rewritten argv passes via the reverse-rewrite, tampered element -> E_CASE_ARGV_FROZEN_MISMATCH, unknown id -> E_CASE_ARGV_FROZEN_MISSING; (C) loader - committed file loads 11 ids, missing file -> E_ARGV_FREEZE_MISSING, tampered copy -> E_ARGV_FREEZE_PIN_MISMATCH; (D) 6e3b; (E) 6e3c. test-workdir-sibling.py grew to 4 checks (planted argv-freeze.json removal from the H3 copy fires naming it).

**27d. Item 6(ii): preflight binds the id sets.** New 6e3b E_CASE_ARGV_FREEZE_SET: config case ids == argv-freeze case ids EXACTLY, both directions (planted negative: renamed freeze id fires naming it). New 6e3c E_ARGV_FREEZE_PIN_DRIFT (ruling (9) companion): the harness's ARGV_FREEZE_SHA256 constant must equal the committed file's sha256, or a harness/freeze drift would surface only at runtime (planted negative: drifted constant fires).

**27e. Item 11: marker-at-rest assertion.** The behavioral boot-target proof is sound only if the three runtime panic markers (MARKER_KERNEL_EXEC, MARKER_EXIT_98, MARKER_EXIT_97) are absent from every guest input; before this head that absence had been verified only against the historical UKI 13309697. The harness now scans - BEFORE ANY GUEST RUNS - each executed case's ESP, every attached disk image (disk_dir/disk<i>.raw over v3_serials, the build_argv enumeration), its vars template and its firmware, with chunked reads and a marker-length overlap so a marker spanning a chunk boundary still fires; any hit dies E_MARKER_AT_REST naming case, input kind, path and marker. Each deterministic manifest records marker_absence {markers_absent, inputs, result: ABSENT}. test-marker-absence.py 5/5: clean tree passes; marker in the ESP / disk1 / vars template fires naming the input; a marker straddling the 8MiB chunk boundary still fires.

**Mishaps (disclosed).** test-argv-freeze.py's loader extraction initially omitted the module-level ARGV_FREEZE_SHA256 constant (it lives outside the extracted block) and died NameError on first run - fixed by reading the committed constant from the harness source, never a hardcoded copy. The extended 6q gate caught the not-yet-re-derived scratch workflow (missing the argv-freeze.json copy) before commit, as designed. Both caught locally, never committed.

**Validation (executed, this head).** All 18 suites pass on the exact bytes (15 pre-existing + test-h3-precheck 8 + test-argv-freeze 11 + test-marker-absence 5; test-workdir-sibling now 4). EXECUTED preflight under BOTH lanes: the error set equals aee37e2d's EXACTLY - {E_BWRAP_ARGV_MISMATCH x1, E_LOCK_MISSING_DEB x161, E_STAGED_TOOL_MISSING x10, E_VARS_MISSING x1}, 173 collected entries, exit 30; E_CASE_ARGV_FREEZE_SET, E_ARGV_FREEZE_PIN_DRIFT and the extended E_WORKDIR_SIBLING_MISSING do not fire on the committed tree. Both workflows parse as YAML; the derived scratch workflow carries the H3 repair/taxonomy/freeze-copy and all three new suites (6e12 byte-identity holds); new test files mode 100755; zero tracked bytecode.

## 28. C1'' revision (run-36037280674 ruling, items 12-16 + carried x/y/z): single-source canonical inverse, run-byte regression fixture, live planted freeze in H3, death-code-first taxonomy, marker-scan hardening

**The run map (run 36037280674, scratch lane, head 1a3575ba, attempt 1): the run is NOT ACCEPTED.** The new freeze gate fired at the FIRST case (ceremony step 28, exit 90, E_CASE_ARGV_FROZEN_MISMATCH on R1: executed(canonicalized) ee1df6e2.. != frozen 4110dad1..) and H3's injected copy died at the same gate (executed c395ac07..). No guest ran; the marker pre-pass had cleared all 10 lane-selected cases. All 3 enrollments completed PASS before the harness died; steps 1-27, 29-31, 33-34, 37-42 went green incl. PF-6/F3/F6/H5. The peer ruled it a gate-wiring defect, not a boot/Secure-Boot finding. Root cause, reproduced BYTE-EXACT locally on both digests: (i) the comparison's canonicalization was a hand-written single-boundary string replace, which is NOT the inverse of lane_resolve's component-wise mapping - the ceremony work_root carries TWO lane-prefixed components (/tmp/NON_CERTIFYING_SCRATCH-out/NON_CERTIFYING_SCRATCH-cases) and the inner one survived the "reverse-rewrite"; (ii) H3's planted execution can never match the unmutated pin (a $T work_root, plus the deliberate ',bootindex=0' removal the freeze exists to catch), so the before-subprocess comparison made the planted E_CASE_BOOT_TARGET death unreachable. The prior suite's scratch case was common-mode: it built its "scratch" argv with the SAME string replace it tested, so the lossy component could not appear. Nothing between aee37e2d and 1a3575ba changed R1's executed argv; the rehearsal-lane executed form still hashes to the pin exactly.

**28a. Item 12: the canonical inverse, from the single source.** lane_resolve.py gains canonize_element: the EXACT component-wise inverse of resolve_path's mapping (running-lane components map back to the canonical token; already-canonical components - embedded case IDs, which the forward mapping never touches - pass through idempotently; a namespace token not at a component start or a third NON_CERTIFYING_ lane fails closed with the same LaneError codes). The harness comparison block now canonicalizes via canonize_element imported from lane_resolve - no hand-written replace anywhere - and a LaneError during canonicalization dies E_CASE_ARGV_FROZEN_MISMATCH naming it.

**28b. Item 13: the run-byte regression fixture.** fixtures/run-36037280674-R1-argv.txt commits the EXACT argv.txt bytes the scratch ceremony executed on R1 (extracted from the run's evidence ZIP by the reviewer; file sha256 4e281caa6cc858a5781435df84c772c658477a9d35b1fe823c5f09de8792cab7, 1,767 B, pinned in the test). test-argv-freeze.py asserts: canonize_element(fixture) hashes to the frozen pin 4110dad1.. AND passes the extracted comparison block; the OLD partial rewrite of the same bytes reproduces the run's failing digest ee1df6e2.. (the bug, demonstrated) and would still die E_CASE_ARGV_FROZEN_MISMATCH under the block. The common-mode B2 is REPLACED: the scratch argv is now produced by the REAL extracted build_argv driven by the REAL lane_resolve mapping with the real scratch work_root, in BOTH lanes. Non-namespace tamper and unknown-id negatives kept. The D2 workflow-arg gate lists the fixture in both workflows.

**28c. Item 14: H3 keeps the freeze gate LIVE and PASSING - no exemption, no bypass.** The step plants a ONE-ENTRY $T/argv-freeze.json: the frozen R1 argv with EXACTLY ONE ',bootindex=0' removal (the injection itself) and the $T work_root substituted in canonicalized form (canonize_element maps the executed $T paths to the canonical -pf/h3boot/cases root in both lanes, so one planted form serves both), then sed-pins THAT file's sha256 into the harness copy's ARGV_FREEZE_SHA256. Exact-count injection assertions on BOTH mutations (bootindex count >=2 before / 0 after in the file; case count == 1; pin constant count == 1 before and after; the generator asserts the R1 entry count, exactly 3 case-dir substitutions and exactly 1 bootindex removal, and the entry's self-consistent argv_sha256). The canonical token is sourced from the copied lane_resolve.CANON under sys.dont_write_bytecode - zero canonical literals in the derived scratch workflow (E_DERIVED_CANON_LITERAL holds) and no bytecode write. Verified end-to-end locally: the canonicalized executed H3 argv (injected, $T work_root) equals the planted entry byte-for-byte in BOTH lanes, so the gate PASSES and the planted case proceeds to its intended death.

**28d. Item 15: death code FIRST.** Before any debug-log check, h3.log must carry EXACTLY the E_CASE_BOOT_TARGET token (grep -o extraction, exact-line compare, so E_CASE_BOOT_TARGET_UNPROVEN does not pass) and NO E_CASE_ARGV_FROZEN_* - any other harness death dies E_H3_WRONG_DEATH naming the observed code. The pipefail-empty-grep edge (a codeless h3.log dying silently at the ERR trap instead of named) was caught by the suite and fixed with || true. A missing ovmf-debug.log after a pre-QEMU death is E_H3_QEMU_NOT_STARTED, never E_H3_NO_BOOT_LINE. test-h3-precheck.py executes the exact extracted segment (12 checks): freeze-gate death dies E_H3_WRONG_DEATH BEFORE the log checks (chmod-000 log must not surface first), E_QEMU_START and UNPROVEN and no-code deaths all die E_H3_WRONG_DEATH, absent log -> E_H3_QEMU_NOT_STARTED, plus the prior taxonomy (unreadable/rc-2 -> E_H3_DEBUG_LOG_UNREADABLE, no-Booting/empty -> E_H3_NO_BOOT_LINE).

**28e. Item 16 (carried x/y/z).** (x) _marker_scan: a missing input dies named E_MARKER_SCAN_INPUT (isfile check), an unopenable or unreadable one dies the same code with the OS error - never a bare exception. (y) hits dedupe per (input, marker) - one record even when the marker appears twice in one input or across chunks. Planted negatives for both in test-marker-absence.py (8 checks). (z) section 27 reworded: the run's NOT ACCEPTED status leads; this document is prose, and a ruling is not a result.

**Mishaps (disclosed).** The first draft of this head broke THREE preflight gates, all caught locally before commit: the planted-freeze heredoc carried 4 canonical literals into the derived scratch workflow (E_DERIVED_CANON_LITERAL - fixed by sourcing CANON from the copied lane_resolve); the new lane_resolve imports needed their narrow PY_ALLOW amendments (E_PYTHON_IMPORTS x2 - test-argv-freeze.py consumer + derive-scratch.py phantom, same shape as the existing allowances); the heredoc import lacked sys.dont_write_bytecode (E_BYTECODE_GUARD). The death-code check's empty-grep pipefail edge died silently until test-h3-precheck.py caught it. One preflight comment anchor mismatched during editing (no content effect).

**Validation (executed, this head).** All 18 suites pass on the exact bytes (test-argv-freeze now 16 checks, test-h3-precheck 12, test-marker-absence 8, test-workdir-sibling 4, rest unchanged). EXECUTED preflight under BOTH lanes: the error set EQUALS 1a3575ba's EXACTLY - 173 collected entries {E_LOCK_MISSING_DEB x161, E_STAGED_TOOL_MISSING x10, E_BWRAP_ARGV_MISMATCH x1, E_VARS_MISSING x1}, exit 30; none of the new gates fires on the committed tree. Both workflows parse as YAML; the derived scratch workflow is byte-identical to the derived expectation (6e12) and carries zero canonical literals; the fixture is byte-identical to the run-verified sha256; zero tracked bytecode.

## 29. C1''''''''''''''' revision (run-36042868066 ruling, items 17-21 + carried w): full-config socket index, regenerated argv freeze, full-lane dry-run, JSON-scoped H3 assertions, exact death-code set

**The run map (run 36042868066, scratch lane, head 364462fb, attempt 1): the run is NOT ACCEPTED.** R1-R6 ran fully green INCLUDING the freeze gate (the item-12 canonical-inverse fix worked: six executed argvs canonicalized to their frozen pins byte-exactly). The run died at case 7 (C-ossl-throwaway-debug, step 34, exit 90, E_CASE_ARGV_FROZEN_MISMATCH: executed d17bcc7d.. != frozen ddc0e5c2..) - R7, C-ossl-release and the two C-sbsign cases never ran. Root cause, reproduced BYTE-EXACT locally (executed digest d17bcc7d.. bit-for-bit from the run's own argv.txt): the harness assigned QMP socket indexes by the LANE-SELECTED enumeration (C-ossl-debug is scratch case index 6, so its executed argv carried the q6 socket) while the four frozen C entries had been generated under a DIFFERENT stale enumeration - their argv -qmp elements carried q0/q6/q0/q6 and, unlike the seven R entries, they carried NO qmp_sock field at all. The two sides disagreed on exactly the four C cases; every R case coincides between the lane and full-config enumerations (R1-R6 = q0-q5 in both, R7 = q6), so the drift was invisible until the first C case ran. The same class of defect was LATENT in the certification lane: its first case R2 sits at certification index 0 vs full-config index 1, so a certification run would have died at its very first case. Independently, H3 died E_H3_NEG_INJECTION at step 32: its planted-freeze post-check counted the injected literal over the WHOLE FILE with grep -c, and the generator's own NOTE text carried that literal (count 1, expected 0) - a prose/count self-intersection; the injection itself was byte-correct (publisher reproduction).

**29a. Item 17: one socket key - the case's index in the FULL committed config order.** rehearsal-harness.py captures _case_idx from the loaded config BEFORE lane selection and passes it to run_case, so every case in every lane builds its QMP socket at its full-config index (R1=0 .. C-sbsign-release=10). The two alternatives are on record as REJECTED by the ruling: per-lane freeze sets (forks the contract) and dropping the socket from the comparison (weakens the freeze).

**29b. Item 18: argv-freeze.json regenerated, R1-R7 pins BYTE-IDENTICAL.** The freeze was regenerated from the harness's own extracted build_argv over the canonical lane for ALL 11 cases, sockets q0-q10 by full-config order. EXACT change statement: ONLY the four C entries changed - C-ossl-throwaway-debug 28336d0b080c9425d41f17be7bef464d5a1ec396229061a32e1711f4f9d9608c, C-ossl-throwaway-release 55eab601878f4eb2d036a5ab87d5c382df5168bd5ba13fc8ad886bb8f428621c, C-sbsign-throwaway-debug d26b5e269982039d569f0099964a8b1bb79b9ed3770b44083ff3660484c1ba90, C-sbsign-throwaway-release a42e506e652cf34d0d4d35b9c2c3d6a7e3a95650400172cb604e1a96dc0d6bd2 (stale q0/q6/q0/q6 socket forms with the qmp_sock field ABSENT -> the q7/q8/q9/q10 full-config forms, field present) - plus the freeze note text; the seven R entries' argv and argv_sha256 are BYTE-IDENTICAL to the prior file (proven: git diff of argv-freeze.json touches exactly the four C entries and the note; the independent CASE_ARGV_PINS preflight table was updated for exactly the same four cases, R1-R7 rows untouched). Every entry now also carries a non-null qmp_sock equal to its argv's -qmp element, asserted three ways: preflight 6e3d (new gate between 6e3c and 6e6: null/mismatched/shared socket dies E_ARGV_FREEZE_QMP_SOCK naming it), the regeneration itself, and the dry-run below. New freeze file sha256 ceeac181022d14868788b30cc41a0f3d3e1d991dfbef01e53c93946759156945; the harness ARGV_FREEZE_SHA256 constant pins it.

**29c. Item 19: full-lane dry-run + the pre-fix negative fixture.** test-argv-freeze.py section G selects per lane EXACTLY as the harness does (lanes lists; certification = the frozen six), builds each case with the REAL extracted build_argv over the REAL lane work_root at the full-config socket index, canonicalizes with canonize_element, and requires equality with the freeze entry - executed in the rehearsal (11 cases, q0-q10), scratch (10 cases) and certification (R2-R7 provably building to q1-q6) selections. fixtures/run-36042868066-C-ossl-debug-argv.txt commits the EXACT argv.txt the scratch ceremony executed on C-ossl-throwaway-debug (1,746 B, sha256 788fae665031bfeb8cd683236e7d72f8fb639cbf20fe6302648f7569e1b2a135, from the run's evidence ZIP, artifact 10827549358, zip sha256 fe150fc565a61487b03b52caa11196c5909051fe63f48f2a3a403cd18e5f1244). The test pins the bytes, asserts they canonicalize to the run's executed digest d17bcc7d.. (the OLD per-lane socket rule, demonstrated from real run bytes), and asserts they do NOT match the new q7-form pin - a documented pre-fix negative. The D2 workflow-arg gate lists the fixture in both workflows.

**29d. Item 20: H3 counts are JSON-scoped; the WHOLE planting block is extraction-tested.** The planted-freeze assertions in the H3 step now read the PARSED argv (python over the JSON: every committed case carries exactly one ESP bootindex flag; the planted file has exactly one case and zero flag elements) - no grep over the file remains, so prose can never intersect a count, and the generator's note is reworded to drop the injected literal. The pin check generalizes to the constant's regex form (any 64-hex value, count == 1) instead of naming one historical pin. test-h3-precheck.py extracts the WHOLE planting block (precondition, generation, all assertions, the pin sed) and EXECUTES it under bash against the committed argv-freeze.json / rehearsal-harness.py / lane_resolve.py in BOTH lanes: the block exits clean, the planted freeze parses with exactly one case, zero flag elements anywhere in the file (note included), a self-consistent argv_sha256, qmp_sock == argv -qmp element, and the harness copy's pin == the planted file's sha256; then the freeze-gate comparison itself is proven - the real build_argv over the lane-resolved one-case config with the $T work_root (bootindex removed exactly as the workflow seds the copy) canonicalizes to the planted entry in BOTH lanes. Planted negatives: (a) a note carrying the injected literal with a clean argv still PASSES (the count cannot see prose); (b) a sabotaged removal line dies E_H3_NEG_INJECTION, exit 97.

**29e. Item 21 (carried w): the death code is an EXACT parsed set.** fail() records one JSON object ({"result":"FAIL","code":...}); the H3 step now parses h3.log for those records and requires the observed code set to be EXACTLY {E_CASE_BOOT_TARGET} - a freeze-gate code, the UNPROVEN variant, a second code alongside the target, or no code at all dies E_H3_WRONG_DEATH naming the observed set (or "none"). test-h3-precheck.py's synthetic logs switched to the JSON form; new negatives: two-code set (naming both, before the log checks), freeze-gate-only, E_QEMU_START, UNPROVEN, and no-code all die E_H3_WRONG_DEATH. The post-run taxonomy (QEMU_NOT_STARTED / DEBUG_LOG_UNREADABLE / NO_BOOT_LINE) is unchanged and re-proven (19 checks total).

**Mishaps (disclosed), all caught locally before commit.** (i) The H3 step's pin-count grep named the OLD freeze pin e9a38cec.. literally - after the item-18 pin move to ceeac181.. the harness copy would have failed that count and died E_H3_NEG_INJECTION at the next run; the new whole-block extraction test (P1/P2) executes the step against the committed harness and forced the regex form before commit. (ii) test-argv-freeze.py's 6e3c extraction ended at the "# 6e6)" marker and would have swallowed the inserted 6e3d block (NameError on _fz2) - the boundary moved to "# 6e3d)". (iii) The same suite's 6e3c drift plant named the old pin literally (a "could not plant" failure-in-waiting) - now a regex subn with a count assertion. (iv) The suite's hardcoded "all 16 checks" tally had drifted from the real count (18) - both suites now print a counted total. (v) The replacement pin sed was first written with doubled backslashes (functionally identical under bash double quotes, stylistically inconsistent with the derived files) - normalized to the surrounding single-backslash form and re-derived.

**Validation (executed, this head).** All 18 suites pass on the exact bytes (test-argv-freeze now 29 checks incl. the 6e3d negatives and the three-lane dry-run, test-h3-precheck 19 incl. the executed planting block and both negatives, rest unchanged). EXECUTED preflight under BOTH lanes: the error set EQUALS 364462fb's EXACTLY - 173 collected entries {E_LOCK_MISSING_DEB x161, E_STAGED_TOOL_MISSING x10, E_BWRAP_ARGV_MISMATCH x1, E_VARS_MISSING x1}, exit 30; the new 6e3d gate does not fire on the committed tree. Both workflows parse as YAML; the derived scratch workflow is byte-identical to a fresh derivation (6e12) and carries zero canonical literals; the new fixture is byte-identical to its run-verified sha256; zero tracked bytecode.

## 30. C1'''''''''''''''' revision (run-36048129342 ruling, PREPARATION items d/e/f/v): enrollment cross-check, certification K2 sweep hardening, certification in-run unsigned-UKI build + no-c-sign fixtures, H3 must-show evidence set

**Scope discipline.** This head carries ONLY the slot-independent items (d), (e), (f), (v) of the run-36048129342 ruling. Items (a), (b), (c), (g) are NOT in this head: they wait for the real owner-signed file, and nothing here substitutes a test signer, fabricates a signed-slot pin, or weakens the D2 absent-slot fail-closed gate.

**30a. Item (d): preflight cross-checks config.json "enrollments" against the predicate checker's in-run mode map (new gate 6e3e).** The committed declaration must not drift from in-run enforcement, or one config edit could let a widened-db case count as the positive. 6e3e reads the map FROM the committed enroll-predicate-check.py (the PROD_CERT constant plus the two pinned map-encoding lines: the `db_expected = [PROD_CERT, HOSTILE_CERT] if widened else [PROD_CERT]` line and the `if mode == "throwaway":` branch), then requires config.json's enrollments object to carry EXACTLY the four canonical template keys NON_CERTIFYING_REHEARSAL-enroll-{sole, sole-fresh, widened, throwaway} with db_der_sha256 declarations sole/sole-fresh == [PROD_CERT], widened == [PROD_CERT, "IN-RUN:c5-hostile-fixture"], throwaway == ["IN-RUN:c5-throwaway-ci-cert"]. Any one-sided drift on EITHER side dies E_ENROLL_MODE_MAP_DRIFT naming the offending key or missing map line. Planted negatives (test-argv-freeze.py E7-E11): the real tree passes; a widened declaration missing its hostile entry dies naming the key; a sole declaration gaining a second entry dies; a missing template key dies (key-set mismatch); a checker-side map-line edit dies ("predicate mode-map line missing"). Insertion-boundary note: the 6e3d extraction in test-argv-freeze.py previously ended at "# 6e6)"; it now ends at "# 6e3e)" and 6e3e has its own extraction ending at "# 6e6)" - the swallow hazard was handled BEFORE the first test run (the mishap class is on record from item 17).

**30b. Item (e): the four certification-workflow K2 sweeps are hardened to the rehearsal pattern.** Each sweep now walks with an onerror that RAISES (E_K2_SWEEP_UNREADABLE, exit 94), counts scanned files, asserts the count is nonzero (E_K2_SWEEP_EMPTY, exit 94), and prints the count - the silent-skip class (vacuous root-owned os.walk) is closed in the certification lane exactly as run-35999960747 D4 closed it in the rehearsal lane. All four header+tail blocks verified byte-identical (count == 4 each). test-k2-sweeps.py extracts the certification sweep and adds four planted negatives (clean tree passes; unreadable directory dies E_K2_SWEEP_UNREADABLE; empty tree dies E_K2_SWEEP_EMPTY; a planted .pem-named file dies E_PRIVATE_KEY_IN_BUILD_TREE): 30/30.

**30c. Item (f): the certification lane builds the unsigned UKI and generates fixtures IN-RUN, with NO c-sign/throwaway step.** Two steps added between "enrollment app + ESP dual builds" and the firmware-hash K2 gate, mirroring the rehearsal lane order. Step one, "OVMF_CI_SECURE_BOOT_UKI unsigned UKI in-run build (reviewed gapless builder)": byte-identical to the rehearsal lane's run-proven step except the step name and a three-line provenance comment (verified by scripted diff) - same committed builder, same unshare -n, same E_UNSIGNED_UKI_DRIFT gate requiring sha256 == 4cda9c3e285b5b639364234400bf0b121178f12447cc88d896cd2623e07d18e1. The scratch lane already proves this byte-reproduction end to end (the drift gate is exercised every scratch run and the consumed bytes are re-hashed at the ceremony consumption point); the certification-side step is the SAME script and the SAME gate, so the certification build is byte-identical to the frozen unsigned input by construction + by the exercised shared gate. Step two, "OVMF_CI_SECURE_BOOT_UKI fixture generation (in-run ephemeral keys, no c-sign)": produced from the rehearsal step by a scripted transform with asserted single replacements - the c-sign SHASUMS dependency is REMOVED (replaced by an E_UNSIGNED_UKI_MISSING presence gate on the in-run unsigned UKI), the throwaway-cert distinctness leg and record field are REMOVED (no throwaway exists in this lane), the generation-record schema is OVMF_CI_SECURE_BOOT_UKI-c-fixture-generation/v1 (keeps preflight 6e6's pinned NON_CERTIFYING_REHEARSAL occurrence count at 44), and the end-of-step inrun positive allowlist is the 7-file certification set {uki/successor-unsigned.efi, c-sign/fixtures/F-WRONGSIG.efi, F-HOSTILEUKI.efi, C5-WRONG-SIGNER-FIXTURE.cer, C5-HOSTILE-FIXTURE.cer, GENERATION-RECORD.json, FIXTURE-SHASUMS} - the rehearsal 21-file set MINUS every c-sign/throwaway output. The K2 tree sweep (onerror raise + scanned-count assertion), the four-public-output assertion, the install-only copy-out, the post-copy K2 inrun sweep, and the H/W/owner DER distinctness check carry over unchanged. Embedded python heredocs compile (4/4) and both step bodies pass bash -n. run-ceremony.sh's required certification-side paths ($INRUN/uki/successor-unsigned.efi, $INRUN/c-sign/fixtures + FIXTURE-SHASUMS) are now produced by this lane itself; the D2 absent-slot gate is untouched and still fails closed. Static pins re-verified after the splice: 6e6 occurrence counts (cert 44, rehearsal 83), 6e8b osslsigncode (cert 0; exactly one c-sign step in rehearsal + scratch), 6e9 ENROLL_PLANTED_FAULT (cert 0, rehearsal 0, scratch >= 1).

**30d. Item (v): the H3 must-show proof lands in the evidence artifact.** The H3 step now copies h3.log, the planted argv-freeze (planted-argv-freeze.json), the dead case's argv.txt (case-argv.txt) and ovmf-debug.log (case-ovmf-debug.log) into /tmp/$PREFIX-out/$PREFIX-h3-evidence/ (auto-included by the evidence-manifest expansion), and generates h3-must-show-record.json: case id, death codes == [E_CASE_BOOT_TARGET], rc 90, the boot line, the planted freeze sha256, the planted entry's argv sha256, and the canonicalized-executed sha256 re-proved equal to the planted entry via canonize_element over the $T copy, plus per-file sha256s and a note that the dead case writes no manifest-*.json by design. Any inconsistency dies E_H3_EVIDENCE_RECORD (exit 97). CONSEQUENCE FOR THE NEXT RUN: the evidence manifest grows 169 -> 174 entries (+5 named files). The steps-35/36 cross-check outputs (expected-ceremony-python.txt, ceremony-python.txt) were verified ALREADY under /tmp/$PREFIX-out and therefore already uploaded. Executed tests (test-h3-precheck.py P7/P8): the extracted evidence block runs clean against a synthetic-but-byte-real H3 tree (five named files, record reproves canonicalized == planted entry, death codes [E_CASE_BOOT_TARGET], rc 90, boot line); a sabotaged case argv dies E_H3_EVIDENCE_RECORD. Test-harness mishap disclosed: P7's first form did not export PREFIX into the block's environment (the workflow guarantees it via the workflow-level env:), producing a false FAIL on the positive and a false PASS on the negative; the test now passes the environment explicitly and both halves are genuinely proven.

**30e. Validation inventory for this head.** All 18 suites green (test-k2-sweeps 30/30 with the four new certification negatives; test-argv-freeze 34/34 with E7-E11; test-h3-precheck 21/21 with P7/P8). Executed preflight in BOTH lanes: the error set EQUALS the 173-entry baseline {E_LOCK_MISSING_DEB x161, E_STAGED_TOOL_MISSING x10, E_BWRAP_ARGV_MISMATCH x1, E_VARS_MISSING x1}, exit 30, lanes byte-identical, zero E_ENROLL_MODE_MAP_DRIFT on the real tree. YAML parses for all three workflows. 6e12 derive-identity: the re-derived scratch workflow equals the working-tree file byte-for-byte (1,973 lines), zero canonical literals. Splice mishap disclosed: the first 6e3e form referenced a `_re3` alias that does not exist in preflight (the module alias is `_re`); the executed preflight run caught it immediately (NameError, not a silent pass) and the corrected block is what the battery above covers. Found-staleness disclosure: certification-vs-rehearsal.diff was STALE at the parent commit - an earlier head's certification-header edit (the B2 slot-absent wording) was committed without regenerating the diff (committed body 222 lines; a regeneration at the parent produces 862). The file is regenerated in this head (667-line body reflecting the (f) splice) and the A3 manifest re-pins it.

## 31. C1''''''''''''''''' revision (signed-slot head; ruling items (a) (b) (c) (g) + guards + in-run committed-bytes gates)

**Scope discipline.** This head carries the signed-slot items of the run-36048129342 ruling that waited on the real owner-signed file: (a) qemu-smoke retarget, (b) signed-slot ESP pin replacing 2bfa6212.., (c) exactly one positive + frozen-set update, (g) certification R7 retargeted to the signed-slot ESP with the positive defined as the DEBUG case, plus the certification-builder drift guard, the tracked successor-unsigned.efi guard, the argv-freeze regeneration with full-lane dry-run including certification, and the in-run committed-bytes gates (delta/signed/authenticode/cmp-to-7cda4ddc). The signed bytes entered through THIS reviewed commit as evidence/successor-to-certify.efi - never an artifact, never re-signed. No p3-certification ref is created by this head.

**31a. The slot: committed bytes and their independent verification.** evidence/successor-to-certify.efi = the exact owner-signed c5-signed.efi: 21,156,176 B, sha256 0ea8dd7da95eece8fe8eefed9f3fb701b9cdfd09abe5cfdd5f1954dd0d2f6959. Before commitment the returned bytes were independently re-verified end-to-end (ZIP sha256 a65e3214c3a49d75a8391af38e85760590c926c030d5d5806eb429e98e6fc2ad, exactly one entry; verify-signed-delta vs the unsigned 4cda9c3e..: only PE CheckSum and one WIN_CERTIFICATE (dwLength 1872, rev 0x0200, type 0x0002, padding 0 to EOF); verify-uki-signed: embedded DigestInfo == section-wise EDK2 digest b2f655b01cb1587500e163916be8f10fe1eb10f11905597b76cdc51e088924de; PKCS#7 1,864 B sha256 6351f9c76204513d42b62afb1ff1b3568a16d8497ef68391427f2e45101e32e0 verify-uki-authenticode VALID (messageDigest == sha256(eContent), RSA OK); exactly one signer cert, byte-equal to the committed rehearsal/evidence/c5-signing-cert.der 7cda4ddc149849cc61191d4b5b3d218d14770c0401e9e66dd9617b82ba1ae441). preflight EXPECT now pins the slot in EVERY lane; the pre-signing comments and the two D2 gate strings moved to post-signing wording (the gates still fail closed on absence). Gate 4b (E_UKI_FIRMWARE_DIGEST_MISMATCH) runs on the slot unchanged and now PASSES by construction (computed == embedded).

**31b. Item (a): qemu-smoke retarget.** qemu-smoke.sh no longer hardcodes the historical ESP: it derives the case's ESP path from config.json cases[$IDX].esp and selects its committed pin by basename (c5-root-admitter-uki-v3-esp.raw -> esp_sha256; c5-successor-to-certify-esp.raw -> esp_slot_sha256; any other name dies E_QEMU_SMOKE exit 97), hash-verifies the dual-build product against that pin, and links it under the case's own relative path. The rehearsal/scratch smoke calls keep index 0 (R1 historical; byte-identical behavior to the parent). The certification workflow's smoke moves 0 -> 7: the signed-slot positive P1 is its target.

**31c. Item (b): the signed-slot ESP pin is DERIVED and PROVEN, not transcribed.** The ESP built from the committed slot (build-output/esp/c5-successor-to-certify-esp.raw) has sha256 6ff0d9ef89668ef79e60eba41eb70704664008697637797b384e6e67075d2f77 (10,737,418,240 B sparse). Derivation proof: the full pinned toolchain was staged locally (stage-platform.sh + make-shims.sh, 161 debs, every lock hash verified) and the pipeline byte-reproduced the CI-pinned historical ESP 2bfa621238890890765c9636f99dabfb46233bfa626afb580ce33e65858019c9 EXACTLY - so the local pipeline is bit-exact with CI. The slot ESP was then built three times independently (twice via a constants-patched copy of the builder, once via the parameterized committed builder): all three identical at 6ff0d9ef... The certification workflow's ESP step (runner + env2) builds from evidence/successor-to-certify.efi, pins 6ff0d9ef.. (replacing 2bfa6212.. in both), dual-builds and cmps, and records it in fw-hashes; the env1/env2 cross-check compares it. The rehearsal/scratch ESP steps are unchanged (historical ESP from successor-signed.efi, pin 2bfa6212.. stays).

**31d. Item (c): exactly one positive + frozen-set update.** New case NON_CERTIFYING_REHEARSAL-P1-signed-slot-positive (full-config index 7): debug firmware build-output/ovmf-debug/OVMF_CODE.fd, slot ESP, sole-db enrollment (trust DER == [7cda4ddc..] per the committed enrollments record), positive expectations (kernel_exec true, exit_98 true, exit_97 false, no_reject_strings true), certification lane only. The frozen certification set is SEVEN ids in all three pinned places (preflight FROZEN_CERT_CASE_IDS, harness _CERT_IDS with len 7, config lanes), all three updated together. E_CERT_POSITIVE_MISSING gains the ruling-(g) DEBUG-firmware clause: "the positive" is the debug-firmware case, so the retargeted R7 release sibling (same slot ESP, same sole db, same positive expects, RELEASE firmware) cannot count as a second positive. test-cert-positive-guard.py was rewritten for the post-slot world (the real P1 is in the committed config): 10/10 including the ruling's own planted case - P1 dropped + R7-like release sibling present must still fire E_CERT_POSITIVE_MISSING - plus wrong-ESP, throwaway/unknown enrollment, missing no_reject_strings, reject-strings, two-positives negatives.

**31e. Item (g) mechanics + the two guards.** R7's esp is retargeted build-output/esp/c5-root-admitter-uki-v3-esp.raw -> build-output/esp/c5-successor-to-certify-esp.raw (release firmware, sole db, expect boot; the release sibling). R1 keeps the historical ESP (reject-control, kernel_exec false). Guard 1 (E_CERT_BUILDER_STEP_DRIFT): preflight extracts the unsigned-UKI in-run builder step from the scratch and certification workflows and requires the bodies EQUAL after lane-prefix normalization - the slot's delta proof anchors to the in-run-built unsigned bytes 4cda9c3e.., so the certification builder cannot drift from the scratch lane's reviewed builder. The bodies differed by one three-line provenance comment; it was replicated into the scratch and rehearsal steps so all three are identical (verified EQUAL by the guard's own comparison). Guard 2 (E_STALE_UNSIGNED_UKI): the retired tracked successor-uki-candidate/successor-unsigned.efi (ed5d9d72..) is REMOVED; preflight requires the path absent or == 4cda9c3e... run-ceremony.sh binds the ceremony ESP mode-conditionally: CERTIFICATION_TARGET=1 copies+pins the slot ESP (esp_slot_sha256), every other lane the historical ESP (esp_sha256) - never by filename probing.

**31f. build-esp-image.sh parameterized.** The pinned UKI identity (sha256, bytes) and output name are now required arguments; the output name is allowlisted fail-closed (exactly the two known ESP names, E_ESP_NAME otherwise) and the pins are format-validated (E_UKI_PIN_FORMAT / E_UKI_BYTES_FORMAT). All 12 workflow call sites pass the constants explicitly (8 historical + 4 certification slot). EXECUTED validation: the parameterized builder reproduces 2bfa6212.. from successor-signed.efi and 6ff0d9ef.. from the committed slot - both proven locally under the staged pinned toolchain.

**31g. argv-freeze regenerated from build_argv, full-lane dry-run including certification.** The freeze was regenerated from the harness's own extracted build_argv over the canonical lane for ALL 12 cases, sockets q0-q11 by full-config order. EXACT change statement: R1-R6 entries byte-identical to the previous freeze; R7 changed exactly once (esp retarget) -> bffee5267e621f7eece1dbecd4957b313b2ab4ec43c35155acdb20d25e5f3535; P1 added -> ee0fdec15dedfa889572dded60c97405d4733004071b81c25c9d46f2f76f2ce1; the four C entries changed exactly once (full-config indexes shifted 7-10 -> 8-11). New freeze file sha256 97b1401222a844b97bfc0bd9445ff5006fea3c3e1a4fb483f91918ebdb943daf; the harness ARGV_FREEZE_SHA256 constant pins it. The independent preflight CASE_ARGV_PINS table was updated with the same five new pins - and when the preflight first ran against the regenerated freeze, its OWN computed drift values matched the freeze regen bit-for-bit (two independent computations agree). test-argv-freeze.py section G now dry-runs the certification selection R2-R7+P1 (full-config indexes 1-7, q1-q7): 34/34.

**31h. In-run committed-bytes gates (delta/signed/authenticode/cmp-to-7cda4ddc).** A new step "<LANE> signed-slot committed-bytes in-run gates" sits directly after the unsigned-UKI build step in all three workflows (identical bodies modulo the lane name). Under sudo unshare -n with PYTHONDONTWRITEBYTECODE=1 it: pins the committed slot to 0ea8dd7d.. (E_SLOT_COMMITTED_DRIFT), requires the in-run unsigned build product (E_SLOT_UNSIGNED_MISSING), runs verify-signed-delta.py slot vs in-run unsigned (E_SLOT_DELTA), verify-uki-signed.py (E_SLOT_SIGNED), extracts the PKCS#7 with structural assertions (E_SLOT_PKCS7_EXTRACT), runs verify-uki-authenticode.py (E_SLOT_AUTHENTICODE), extracts the signer cert via the staged openssl and cmps it byte-for-byte against rehearsal/evidence/c5-signing-cert.der (E_SLOT_SIGNER_EXTRACT / E_SLOT_SIGNER_CMP); every gate exits 91 with its named code and the verifier JSON printed. EXECUTED local replica against the real committed slot + the locally rebuilt unsigned 4cda9c3e..: all gates PASS (PKCS#7 1,864 B sha256 6351f9c7.., signer cmp clean).

**31i. Generated/derived files.** certification-vs-rehearsal.diff regenerated by its pinned recipe (699 lines; the stale 671-line body predated this head's certification edits). The scratch workflow is byte-identical to a fresh derive-scratch.py derivation (2,021 lines) - this head's scratch-lane changes (ESP call-site args, builder comment, slot-gates step) are exactly what the derivation produces from the edited rehearsal workflow, verified by scripted diff (zero differences). preflight 6e6 prefix-count pin: rehearsal 83 -> 84 (one new literal: the slot-gates step name; certification stays 44), with this justification recorded beside the pin.

**31j. Validation inventory + mishaps (disclosed).** All 18 suites green (test-cert-positive-guard 10/10 rewritten; test-argv-freeze 34/34; test-hist-esp-guard 4/4 with the slot-ESP variant documented as in-scope-pass). Executed preflight under BOTH lanes: the error set EQUALS the 173-entry baseline EXACTLY {E_LOCK_MISSING_DEB x161, E_STAGED_TOOL_MISSING x10, E_BWRAP_ARGV_MISMATCH x1, E_VARS_MISSING x1}, exit 30, lanes identical. Both lane preflight runs exercise the new guards on the real tree: no E_CERT_BUILDER_STEP_DRIFT, no E_STALE_UNSIGNED_UKI, no E_CERT_POSITIVE_MISSING. Mishaps, all caught locally before commit: (i) the first form of the run-ceremony PINS edit broke the tuple structure syntactically (dangling continuation) - caught by readback inspection and repaired before any test ran, then bash -n confirmed; (ii) test-cert-positive-guard.py's premises were stale by design (pre-slot world: current config has no positive) - every planted case silently passed the new predicate; rewritten to derive from the committed P1 (the failure was caught by the suite itself going 7/10 red, not by inspection); (iii) test-hist-esp-guard.py's planted R7 carried the NEW slot ESP, so the historical-ESP guard correctly did not fire - the planted regression now restores the historical ESP explicitly, and a slot-ESP-in-scratch variant is pinned as in-scope-pass; (iv) the first preflight run after the freeze regen surfaced E_CASE_ARGV_PIN x6 + E_PREFIX_COUNT_MISMATCH x1 (the independent pin table and the occurrence pin doing exactly their job); both were updated with exact-change justifications, and the table's own computed drift values matched the freeze regen bit-for-bit.

## 32. C1'''''''''''''''''' revision (signed-file evidence in EVERY lane; peer pre-push ruling on 63dc0ed9)

**Scope discipline.** The reviewer's pre-push ruling on 63dc0ed9 was NOT CLEARED: the P1-signed-slot-positive (debug) and R7 (release) cases had only CERTIFICATION lanes, the scratch/rehearsal dual-build produced only the historical ESP 2bfa6212.., and run-ceremony bound the slot ESP only at CERTIFICATION_TARGET=1 - so with certification HELD by the owner, a green scratch run would have booted ZERO signed-file firmware evidence: the misleading partial PASS the owner expressly forbade. This head is the required revision, a NEW SHA on the same parent 484c8f1a.. superseding 63dc0ed9. The certification workflow is UNCHANGED (ruling item 6) and the certification push remains HELD for a NEW owner decision; no push, no re-sign, no hardware instructions.

**32a. Item 1: P1 and R7 run in all three lanes.** config.json: exactly two lines change - the lanes lists of NON_CERTIFYING_REHEARSAL-R7-release-sibling-behavior-only and NON_CERTIFYING_REHEARSAL-P1-signed-slot-positive go ["certification"] -> ["scratch", "rehearsal", "certification"] (surgical replacement, verified 4-line diff). Expectations are UNCHANGED: P1 boots the signed file on DEBUG OVMF with sole db (exit-98 + kernel exec, no reject strings); R7 checks the same on the release OVMF. The harness lane filter (lanes drive selection in every lane) now selects them in scratch/rehearsal; the stale "R7 is certification-only" comment in rehearsal-harness.py is corrected.

**32b. Item 2: scratch/rehearsal dual-build the slot ESP, proven at runtime.** The rehearsal workflow's ESP step now dual-builds evidence/successor-to-certify.efi (0ea8dd7d.. / 21,156,176 B) into the SAME /tmp/$PREFIX-esp-a|b staging dirs the ceremony and qemu-smoke read, asserts output pin 6ff0d9ef89668ef79e60eba41eb70704664008697637797b384e6e67075d2f77, cmps a/b, and records it in fw-hashes - alongside the historical ESP 2bfa6212.. (still built for R1). env2 does the same (esp-env2-a|b, pin assert E_ESP_SLOT_PIN_MISMATCH, evidence file <LANE>-env2-esp-slot-hash.txt, picked up by the directory-scoped ENV2_EVIDENCE_UPLOAD_PATHS), and the env2 cross-runner byte-identity gate gains the slot comparison (E_ENV2_ESP_SLOT_MISMATCH). The reviewer's local pin-reproduction gap (disk tooling) is thus closed by CI: the pin is proven at runtime in BOTH non-certification lanes on every run. Both D2 workflow-argument existence lists gain evidence/successor-to-certify.efi. preflight 6e6 prefix-count pin: rehearsal 84 -> 85 (one new literal: the env2 slot evidence filename; certification stays 44), justification recorded beside the pin. The scratch workflow carries all of this by derivation: byte-identical to a fresh derive-scratch.py run (2,044 lines).

**32c. Item 3: run-ceremony copies and asserts BOTH ESPs, fail-closed.** The non-certification branches copy /tmp/$PREFIX-esp-a/{c5-root-admitter-uki-v3-esp.raw, c5-successor-to-certify-esp.raw} into build-output/esp/ and assert_sha BOTH against esp_sha256 AND esp_slot_sha256 (E_CEREMONY_SOURCE_ESP / E_INPUT_PIN_MISMATCH, named, before any guest). The certification lane keeps the slot-only binding. The PINS tuple grows to five (historical ESP, slot ESP, debug firmware, release firmware, enroll app) with the firmware/enroll indices shifted accordingly; selection is by the CERTIFICATION_TARGET lane/mode flag, never by filename probing. qemu-smoke.sh already derived per-case ESP name + pin by basename for both names and needed no change.

**32d. Item 4: the negative set is unchanged.** N1 (unsigned), N2 (wrong key), N3a/b/c (hostile) stay exactly as ruled, all built from the in-run unsigned UKI 4cda9c3e285b5b639364234400bf0b121178f12447cc88d896cd2623e07d18e1. With P1 in every lane, each lane's case set is now the signed-file positive-plus-negative set: P1 (+R7 release sibling) positive, N1/N2/N3a/b/c negative, R1 historical reject-control, four criterion-C throwaway controls.

**32e. Item 5: guards, tests, freeze, manifest, diff.** New preflight guard E_SIGNED_CASE_LANES (inside the slot-exists block): the two signed-file case ids must exist and carry exactly {scratch, rehearsal, certification}; any reduction or absence dies named. test-cert-positive-guard.py extracts the extended block and adds three revision-5 negatives - removing scratch from P1's lanes, the pre-revision certification-only shape, and removing rehearsal from R7's lanes each fail closed with E_SIGNED_CASE_LANES; the P1-dropped and (g)-release-sibling cases now assert the exact co-firing code set {E_CERT_POSITIVE_MISSING, E_SIGNED_CASE_LANES} (a missing signed-file case trips both guards by design). 13/13. test-argv-freeze.py section G report strings move 10 -> 12 cases (the dry-runs were already data-driven over lanes); 34/34. argv-freeze.json REGENERATED from the harness's own extracted build_argv over all 12 cases (sockets q0-q11 by full-config order): BYTE-IDENTICAL to the committed file, sha256 97b1401222a844b97bfc0bd9445ff5006fea3c3e1a4fb483f91918ebdb943daf - lanes are not an argv input, so zero pin changes; ARGV_FREEZE_SHA256 and the preflight CASE_ARGV_PINS table are unchanged. certification-vs-rehearsal.diff regenerated by its pinned recipe (717 lines; the rehearsal side changed, the certification side did not). A3 manifest re-pinned (its own section).

**32f. Validation inventory + mishaps (disclosed).** All 18 suites green. Executed preflight under BOTH lanes on the final tree: the error set EQUALS the 173-entry baseline EXACTLY {E_LOCK_MISSING_DEB x161, E_STAGED_TOOL_MISSING x10, E_BWRAP_ARGV_MISMATCH x1, E_VARS_MISSING x1}, exit 30 - with E_SIGNED_CASE_LANES and the 85-pin live on the real tree and silent (passing). Literal prefix count recomputed live: 85 occurrences, matching the pin. YAML parses for all three workflows; bash -n clean on run-ceremony.sh and every touched script; zero tracked bytecode. Mishaps, all caught locally before commit: (i) the first config.json lanes edit went through json.dumps and reindented the whole file (502-line churn) - reverted and replaced with the surgical two-line replacement, verified by minimal git diff; (ii) the two pre-existing planted negatives (P1-dropped, (g) release-sibling) went red on the first run of the extended guard because a missing P1 trips E_SIGNED_CASE_LANES as well as E_CERT_POSITIVE_MISSING - caught by the suite itself, and the want-lists now assert the exact co-firing code set; (iii) the first freeze-regen comparison reported DIFFERS on a trailing-newline artifact of json.dumps (every content line identical) - with the LF restored the regen is byte-identical, which is the result recorded above.

## 33. C1''''''''''''''''''' revision (run-36081199933 CI-wiring failure: ESP fresh dirs + all-lane lane guard)

**Failure disclosure.** Run 36081199933 (attempt 1, scratch lane on 41ccb99c) FAILED. Root cause confirmed at log level: the ESP step died on E_WORK_EXISTS (build-esp-image.sh lines 30-31) because this head's slot ESP build invoked the builder with WORK=/tmp/$PREFIX-esp-a, the dir the historical ESP build had already used. Cascade: F6/H3 exit 97 (vars-enrolled.fd absent), slot gates + ceremony + env2 skipped, all six evidence items absent; the OVMF_CI_SECURE_BOOT_UKI_PASS marker was never emitted (one benign grep echo). This was CI WIRING, not a firmware rejection of the signed file: the builder's fresh-workdir guard did exactly its job, and my 41ccb99c local validation had never executed the workflow's ESP-step command sequence end to end (the pin derivation built in separate scratch dirs by hand). The failed run was not re-run.

**33a. Item 1: SEPARATE FRESH build dirs + copy closed by a pin check (the ruling's allowed alternative).** The slot ESP now dual-builds in /tmp/$PREFIX-esp-slot-a and -esp-slot-b (env2: /tmp/$PREFIX-esp-env2-slot-a/-b), pin-asserted 6ff0d9ef.. and cmp'd a/b there; the a-product is then copied (cp --sparse=always) into the esp-a / esp-env2-a staging dirs the already-cleared consumers read, and the copy is closed by a NAMED post-copy pin check (E_SLOT_ESP_COPY_PIN, exit 46). run-ceremony.sh, qemu-smoke.sh, the env2 cross-runner gate and the evidence file names needed NO changes - they keep reading the staging dirs, which now receive the slot ESP by copy instead of by build. E_WORK_EXISTS is NOT weakened; it is the guard that caught the defect.

**33b. Item 2: the exact ESP-step sequence is now EXECUTED in CI against a fresh-dir-enforcing stub.** New committed test-esp-fresh-dirs.py extracts the ESP-build command sequence textually from BOTH non-certification workflow YAMLs (the "enrollment app + ESP dual builds" and "env2 ESP image reproduction" steps; 8 builder invocations per lane, fail-closed on extraction drift) and runs it against a stub build-esp-image that dies E_WORK_EXISTS on any reused work dir. EXECUTED RED-then-GREEN proof: against the 41ccb99c workflows the test reproduced the run's death exactly (E_WORK_EXISTS on /tmp/$PREFIX-esp-a in both lanes, exit 97); after the fix the committed sequence runs clean (rc 0) and the planted 41ccb99c-shape regression (slot dirs rewritten back onto the used dirs, 6 dir occurrences: 4 builder lines + 2 cp lines) dies E_WORK_EXISTS in both lanes. 10/10. The test is registered in the workflow battery step and the D2 existence list.

**33c. Item 3: E_SIGNED_CASE_LANES fires in EVERY lane.** The guard moved OUT of the `if CERT_TARGET:` gate to top level (same slot-exists precondition), so scratch/rehearsal preflight runs enforce it too. test-cert-positive-guard.py now extracts BOTH blocks (the nested positive predicate and the top-level lanes guard), asserts the lanes block's top-level placement structurally (its `if` at column 0), and execs both - 13/13 unchanged. test-h5-planted-errset.py gained the ruling's planted negative at the real-preflight level: with P1's lanes planted as ["certification"], a REAL preflight run with PREFIX=NON_CERTIFYING_SCRATCH and CERTIFICATION_TARGET explicitly absent must attribute EXACTLY one new error, E_SIGNED_CASE_LANES naming the P1 case (baseline-delta method; scratch baseline carries no such error). 7/7.

**33d. Item 4: everything cleared at 41ccb99c is unchanged.** Signed bytes (0ea8dd7d.. committed slot), case lanes and expectations, the negative set, the certification workflow (byte-identical), argv-freeze.json (sha256 97b14012.., untouched - no argv input changed), ESP pins, and all guards not named above are exactly as cleared. certification-vs-rehearsal.diff regenerated by its pinned recipe. A3 manifest re-pinned.

**33e. Validation inventory + mishaps (disclosed).** All 19 suites green (new test-esp-fresh-dirs 10/10; test-h5-planted-errset 7/7 with the scratch-lane planted negative; test-cert-positive-guard 13/13 two-block). Executed preflight under BOTH lanes: the error set EQUALS the 173-entry baseline EXACTLY {E_LOCK_MISSING_DEB x161, E_STAGED_TOOL_MISSING x10, E_BWRAP_ARGV_MISMATCH x1, E_VARS_MISSING x1}, exit 30 - with the top-level E_SIGNED_CASE_LANES live and silent on the real tree in both lanes. 6e6 prefix-count pin unchanged at 85 (no new lane-prefix literals; verified live). YAML parses for all three workflows; bash -n clean; zero tracked bytecode; derive-identity zero-diff (2,054 lines). Mishaps, all caught locally before commit: (i) the first h5 edit wrote a literal line break inside a string literal ("\n" unescaped in the generator) - SyntaxError on the immediate ast.parse check, repaired before any run; (ii) the new fresh-dirs test's regression-count assertion first expected 4 rewritten dirs and failed on the true count 6 (the two post-build cp lines carry one slot-dir occurrence each) - the assertion now documents 6; (iii) this head exists BECAUSE 41ccb99c's validation gap (never executing the workflow ESP-step sequence) shipped a real CI failure - the gap is now closed by item 2's committed executed test, and the failure itself is disclosed at the top of this section; (iv) the new test file was first staged mode 100644 - the executed preflight's E_EXEC_BIT pair (mode + not -x) caught it, chmod 755 restored the exact 173-entry baseline.

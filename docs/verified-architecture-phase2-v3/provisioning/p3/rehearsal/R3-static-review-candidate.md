# R3 — Static Review Candidate: Option A CI Ceremony (NON_CERTIFYING_REHEARSAL pre-freeze rehearsal)

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
- A4 record (requirement 7): fixtures regenerated 2026-09-22 ~18:00 IDT under requirement A4 -
  prior ad-hoc generation (F-WRONGSIG 75c24ffc.., F-HOSTILEUKI 860389a7..) is VOID. Sole bound
  fixtures: generator fixture-generate.sh sha256 8a4661d57961c7a86d83d638325022fa81da7ed309e7df78eaeadcdc59167a85
  (public inputs only: unsigned UKI ed5d9d72.. + pinned sbsigntool; keys 0600 in mktemp, never
  logged, plain-deleted after the single reviewed run); F-WRONGSIG.efi
  44706c4a02bc013a248d4ba228b731471d373a813ea7fd921416c9119071b50a with cert
  98abb484874dd3c850c6930dd0ba474d1c287b6372292ff6efe44c5a92dda485 (809 B); F-HOSTILEUKI.efi
  5f6cfe5cf11b5e71158ce3a5736175eae925f33dec2a308370618c3aceec939e with cert
  4428760c1ba2322bd9f9254e45cbbdb5b89c3f8b4e594f0efff337a4d3c4e07a (799 B). ANY regeneration
  = new review.
- signed UKI sha256 13309697... (above), unsigned UKI sha256 ed5d9d72be40592af3b14bd1fd9dc91a5976b14f350f9124ea414b975464d536 (21,164,544 B)
- production signing cert DER sha256 7cda4ddc149849cc61191d4b5b3d218d14770c0401e9e66dd9617b82ba1ae441 (1,092 B)
- F-WRONGSIG.efi sha256 44706c4a02bc013a248d4ba228b731471d373a813ea7fd921416c9119071b50a (21,166,128 B), cert DER 98abb484874dd3c850c6930dd0ba474d1c287b6372292ff6efe44c5a92dda485 (809 B)
- F-HOSTILEUKI.efi sha256 5f6cfe5cf11b5e71158ce3a5736175eae925f33dec2a308370618c3aceec939e (21,166,112 B), cert DER 4428760c1ba2322bd9f9254e45cbbdb5b89c3f8b4e594f0efff337a4d3c4e07a (799 B)
- pristine VARS: OVMF_VARS_4M.fd from ovmf 2024.02-2ubuntu0.9, sha256 5d2ac383371b408398accee7ec27c8c09ea5b74a0de0ceea6513388b15be5d1e (540,672 B, EMPTY store)
- frozen ESP image (built, pinned): c5-root-admitter-uki-v3-esp.raw sha256 2bfa621238890890765c9636f99dabfb46233bfa626afb580ce33e65858019c9 (EPOCH 1789923381, disk GUID a42ac99f-298e-71d7-54e9-69cea084f6d6, partition GUID a1eee143-302e-bfce-2da6-410baab6c2ea)
- accepted source commit 92741cbdefaa78adc33bc3c74935a45f9558b88c
Fixture keys were generated once, used once, plain-deleted; any regeneration requires a new static review.

## 3. Platform lock (A2: complete build+runtime closure)
platform.lock.json sha256 86454077ee27514fc9e750b1c6aa47d7902a5128010dd4f5728681967c45423a:
160 debs (ubuntu-24.04 noble amd64; noble + noble-updates main+universe indices, all four index
hashes recorded; regenerated with the byte-identical recorded indices - the 159 prior entries are
unchanged, exactly one package added). 93 runtime incl. qemu-system-x86 1:8.2.2+ds-0ubuntu1.18,
ovmf 2024.02-2ubuntu0.9
(deb sha256 a094c13d06f2740691ff57d108dff32aa087179363ddb0de42d463b4f7f9bc13), sbsigntool
0.9.4-3.1ubuntu7, gdisk, dosfstools, openssl, bubblewrap 0.9.0-1ubuntu0.3 (deb sha256
2461f1beee9cb04c8942739fe1a2b37e7b7c2a3d518f0779dc75f9245baa3094); 67 build-only incl. gcc-13 13.3.0, nasm 2.16.01,
acpica-tools 20230628, gnu-efi 3.0.15-1build1 (deb sha256 cb325283fa03f323fb2f2f2db6085c57518afe0a2d4f752efcc1a836dd2c48e6 — the noble index entry; an earlier "jammy" label and a "3.0.18-1" remark were corrected).
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
The enrollment EFI app (enroll-app.c sha256 859c01bbae9b134aed08a17f550ba9add7d9f3efd8500757a64bd56b8d0fdf47;
dual build byte-identity enforced) writes db/db2, then KEK, then PK, and in the SAME invocation
GetVariable-captures SecureBoot + SetupMode (raw value + attributes + status) to ENROLL.TXT on the
FAT evidence disk. An unsigned reader app is never booted after PK enrollment; no reader cert is
ever added. Enrollment runs on pristine VARS copies only, one invocation per template.
Throwaway PK/KEK (1-day, CN=C5-THROWAWAY-*), generated per ceremony run, never logged/uploaded/cached.
ESLs use EFI_CERT_X509_GUID (a159c0a5-e494-a74a-87b5-ab155c2bf072), fixture owner GUID
c501e570-0de0-0001-0000-000000000000; mixed cert sizes are emitted as concatenated per-size
EFI_SIGNATURE_LISTs. .auth blobs via sbvarsign (db KEK-signed, KEK PK-signed, PK self-signed).
Three templates: sole db=[production cert], widened db2=[production, hostile fixture cert],
sole-fresh (second independent sole enrollment for R6).

Enrollment predicate (requirement 5a resolution, pre-frozen - reviewer ruling: any different
rehearsal value = FAIL; the predicate cannot be reinterpreted; changing the predicate = new
SHA + two rehearsals). enroll-predicate-check.py (sha256
d69e0a76579c27d0f78552c039ccb1b2f9aec24b6ee65cf0572a01f739c0f659, exit 92, E_ENROLL_* /
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
R1 positive: frozen ESP, DEBUG firmware, sole template. Expect: post-run RAM contains the
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
R7: RELEASE sibling, R1 inputs. Behavior-only observation; no string claims, no equivalence claims.
R8 (VARS delta + predicates, requirement 5b resolution - pre-frozen): stored PK/KEK/db data
byte-equal the enrolled ESL payloads; PK and KEK each exactly one X509 ESL entry
(EFI_CERT_X509_GUID a159c0a5-e494-a74a-87b5-ab155c2bf072), owner
c501e570-0de0-0001-0000-000000000000, DER equal to this run's throwaway PK/KEK DER (DER
hashes recorded in each enroll-predicate.json; private keys plain-deleted when the
enrollment window closes, never logged/uploaded/published); sole db exactly {7cda4ddc..};
widened db exactly {7cda4ddc.., 4428760c..}; dbx ABSENT (frozen form: absent, not empty);
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
-display none, -serial none, debugcon isa-debugcon 0x402, QMP unix socket, 4096 MB, ESP +
six v3-serial virtio-blk drives, -daemonize. argv_sha256 per case (NUL-joined, identical to
the harness's own recording): R1 f638534d69912eb2.., R2 ae0e386910577385.., R3 4a26479001210058..,
R4 fddad3133d84026c.., R5 4ef06100d6a70605.., R6 c2691c9a4aa71666.., R7 4634c38eb8c0f393..
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
4f0f6c7f44ce46af05b853dd0849ddeb664c40cda0e2cfd9143cad374ba55dff) and
OVMF_CI_SECURE_BOOT_UKI-CERTIFICATION-workflow.yml (sha256
0921ca7657c1fe9ab14d63a97aab75a84ee6ecd5dfb9d66f739fdbae0a3ad3f8). No docs/ copies
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

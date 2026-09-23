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
stage-platform.sh downloads every deb, verifies every sha256, rejects any missing, extra, or
substituted file (E_LOCK_MISSING_DEB / E_LOCK_HASH_MISMATCH / E_LOCK_EXTRA_FILES), extracts to a
private tree, and verifies the pristine VARS hash (E_VARS_PRISTINE_MISMATCH).
Tool execution uses loader-explicit shims (make-shims.sh): staged binaries run through the staged
ld-linux with --argv0, so the locked toolchain behaves identically on any host glibc. bwrap is
load-bearing for the canonical build path, so it runs ONLY as the staged, lock-hash-verified
binary through that shim, never the host tool: build-ovmf-debug.sh re-execs
$STAGE/shims/bwrap (fails E_NO_STAGED_BWRAP if absent), and the workflow's userns preflight
exercises exactly that staged binary before any build starts.

## 4. Certification firmware: reproducible DEBUG OVMF (ruling 2)
- source: edk2 commit edc6681206c1a8791981a2f911d2fb8b3d2f5768 (tag edk2-stable202402), HEAD
  verified equal after fetch; submodules (openssl, oniguruma, brotli x2) pinned by superproject gitlinks
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
- build-ovmf-debug.sh sha256 b2035fc6aecb5b66602e112ae02ab19002f9aed82cc4bae06cac4d779435eeb0 (staged-bwrap re-exec; hostile mode honors CANON_REALWORK so the preserved hostile Build tree is the scanned tree)
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
f4d6a2ed7d7e9f55224878033f27f02f454409c3f2417e4a643c00298f8e333d) and
OVMF_CI_SECURE_BOOT_UKI-CERTIFICATION-workflow.yml (sha256
0af44fadb7a3830b3c94f6710dc4d30cd2cfbf645e5df877e445298b67bd25ae). No docs/ copies
(preflight E_STALE_DOCS_WORKFLOW / E_WORKFLOW_MISSING).
Rehearsal trigger: on push, exact branches filter [p3-rehearsal-1, p3-rehearsal-2] - two
names, no wildcards, no other events. The TWO clean sequential rehearsals are two separate
fresh pushes of the SAME candidate SHA: p3-rehearsal-1 first; p3-rehearsal-2 only after -1
passes. No other commits to the filtered refs. Every job's first step fails closed unless
github.run_attempt == 1 AND github.ref is exactly one of the two filtered refs
(E_RERUN_FORBIDDEN / E_REF_MISMATCH, exit 89): no re-run counts; any accidental run is
preserved and reported.
Certification trigger: on push, exact branches filter [p3-certification], never overlapping
the rehearsal filters. The p3-certification ref MUST NOT exist before STATIC ACCEPT. After
STATIC ACCEPT the single certification run is created by pushing the already-accepted SHA
once to the new p3-certification ref - no new commit, so certified SHA == reviewed SHA.
Every job's first step fails closed unless github.run_attempt == 1 AND github.ref ==
refs/heads/p3-certification.
Both workflows: runs-on ubuntu-22.04 (pinned: unprivileged user namespaces required for the
bwrap canonical-path mechanism; ubuntu-24.04 runners restrict them via AppArmor),
permissions {}, ref+attempt gate, KVM fail-closed step (E_NO_KVM), staging as the ONLY
network phase FIRST (the ceremony runs under sudo unshare -n), then the staged-bwrap
userns preflight (E_NO_USERNS) exercising the exact lock-verified bwrap the builds re-exec,
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
117eaf5f84ea4fad524b2803dd442b2367939df30adebc2cd1de512fc9bf1be2) shows the diff is
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
certification workflow, which it flags. Internal
scratch names stay NON_CERTIFYING_REHEARSAL because the rehearsed scripts are frozen bytes -
an audit property: certification evidence is provably produced by the exact rehearsed bytes.
Historical refs: candidate5-p3-rehearsal holds the superseded candidate
90dc3167b4a8a6d385fa8ccdb49bf12336edecd3 (docs/-path workflows, workflow_dispatch): never
dispatched, never peer-reviewed, never to be force-pushed, rewritten, or deleted.
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

## 9. Cost and publisher discipline
Zero mandatory cost forever: GitHub-hosted standard runners only, no card, no TCG fallback
(KVM-only, fail-closed). Nothing is published from the rehearsal workspace; all pushes go through
the publisher agent only on main's explicit order after review. No merge, no promotion, no PFX or
production-key involvement.
Push discipline: the publisher pushes the UNCHANGED candidate SHA only to p3-rehearsal-1 and
p3-rehearsal-2 (first -1; -2 only after -1 passes), and - after STATIC ACCEPT - the same SHA
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
Any failed expectation or any byte change = new candidate + conformance + two fresh
refs/runs. Certification remains forbidden until STATIC ACCEPT of the exact SHA.

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
platform.lock.json sha256 f817f41e9c48235a075e58b44d3d4252b8a6ea8f00063b2deafd594cbc6fd515:
159 debs (ubuntu-24.04 noble amd64; noble + noble-updates main+universe indices, all four index
hashes recorded). 92 runtime incl. qemu-system-x86 1:8.2.2+ds-0ubuntu1.18, ovmf 2024.02-2ubuntu0.9
(deb sha256 a094c13d06f2740691ff57d108dff32aa087179363ddb0de42d463b4f7f9bc13), sbsigntool
0.9.4-3.1ubuntu7, gdisk, dosfstools, openssl; 67 build-only incl. gcc-13 13.3.0, nasm 2.16.01,
acpica-tools 20230628, gnu-efi 3.0.15-1build1 (deb sha256 cb325283fa03f323fb2f2f2db6085c57518afe0a2d4f752efcc1a836dd2c48e6 — the noble index entry; an earlier "jammy" label and a "3.0.18-1" remark were corrected).
stage-platform.sh downloads every deb, verifies every sha256, rejects any missing, extra, or
substituted file (E_LOCK_MISSING_DEB / E_LOCK_HASH_MISMATCH / E_LOCK_EXTRA_FILES), extracts to a
private tree, and verifies the pristine VARS hash (E_VARS_PRISTINE_MISMATCH).
Tool execution uses loader-explicit shims (make-shims.sh): staged binaries run through the staged
ld-linux with --argv0, so the locked toolchain behaves identically on any host glibc.

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
- PDB-path verifier scan-pe-pdb-paths.py (sha256 94ada3e6a640d4f11e308f50763361025db8970e1e7ca42b7427cd213e8c060d; v2 - v1 had a PE32+ data-directory offset bug and exited vacuous-PASS on zero entries, caught by ground-truth check; v2 hard-fails on zero entries):
  parses every module .efi's CodeView debug directory (RSDS/NB10) plus a raw-carve backstop;
  accepted firmware REQUIRES every absolute PDB path to carry the /build/ prefix and REJECTS any
  host/workspace/user path. A deliberately hostile (different-path) build MUST be rejected.
- expected dual-build outputs (locally observed at /build, CI must reproduce):
  OVMF_CODE.fd sha256 fc150336fce10eb5508fa440cdf7300622c8c3ac71f2fbe10a0731422b9cef24 (3653632 B)
  OVMF_VARS.fd sha256 5d2ac383371b408398accee7ec27c8c09ea5b74a0de0ceea6513388b15be5d1e (540672 B, pristine)
- build-ovmf-debug.sh sha256 73cf82af49bcbd41dd6ecaecd64a6c37d9da86373373ed543e5f197d0422c3d1
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

## 6. Case set (config.json, exact values, no wildcards)
R1 positive: frozen ESP, DEBUG firmware, sole template. Expect: RAM marker "Attempted to kill init!"
AND "exitcode=0x00006200" (exit 98), zero reject strings, zero exit-97. Additionally (requirement 6):
the signed adapter's own evidence strings E_PROVIDER_NAMESPACE and E_PROVIDER_LINK_MISSING must be
PRESENT in the post-run RAM dump. They exist only inside the accepted signed UKI 13309697..'s
initrd (cloud-boot-adapter.sh fail() reasons), so their presence plus exitcode 0x6200 ties the
observed exit 98 uniquely to the signed path. In every kernel_exec=false case (R2, R3, R4, R6)
both strings must be ABSENT (adapter_strings_absent control).
R2 N1: ESP variant carrying unsigned UKI. Expect: no kernel exec, exactly the unsigned-reject string.
R3 N2: ESP variant carrying F-WRONGSIG.efi. Expect: no kernel exec, exactly the signed-untrusted string.
R4 N3a: ESP variant carrying F-HOSTILEUKI.efi, sole template. Expect: signed-untrusted string.
R5 N3b: same hostile ESP, WIDENED template (db2 includes hostile cert). Expect: firmware ACCEPTS
(kernel exec true, zero reject strings) — proves db content controls the decision.
R6 N3c: same hostile ESP, sole-FRESH template. Expect: rejected again — no persistence across VMs.
R7: RELEASE sibling, R1 inputs. Behavior-only observation; no string claims, no equivalence claims.
R8 (VARS delta): enrollment evidence — pre/post VARS structural parse summaries + hashes recorded
per enrollment (parse-ovmf-vars.py).
R9 (CPU record): -cpu Skylake-Server pinned in every argv; argv sha256 recorded per case.
Every case: fresh VARS copy, KVM fail-closed (E_NO_KVM), -nic none, q35 smm=on, secboot pflash,
debugcon capture, QMP dump-guest-memory, TERM-then-KILL reaping, deterministic + observational
manifests, suite exit 91 on any violated expectation.
Requirement 5c (frozen pre-publication): the exact QEMU argv per case is frozen in
argv-freeze.json (schema NON_CERTIFYING_REHEARSAL-argv-freeze/v1): q35 smm=on, KVM, -cpu
Skylake-Server, pflash unit0 readonly + cfi.pflash01 secure=on, pflash unit1 VARS, -nic none,
-display none, -serial none, debugcon isa-debugcon 0x402, QMP unix socket, 4096 MB, ESP +
six v3-serial virtio-blk drives, -daemonize. argv_sha256 per case (NUL-joined, identical to
the harness's own recording): R1 f8db984d6005855e.., R2 7d318a4181b488c5.., R3 00d133e59af2cf64..,
R4 3ee2a49b6d272f2d.., R5 ce47cc1a6eb88b10.., R6 9ed949637b3c0df4.., R7 183412f22a5440e5..
(full 64-hex values and complete argv vectors in argv-freeze.json).
The six v3-* virtio disks carry honest v3 serials; the adapter exits 98 at
E_PROVIDER_NAMESPACE/E_PROVIDER_LINK_MISSING before any v3 device use (grounded in
cloud-boot-adapter.sh); their presence proves v3-named devices do not satisfy the google-
provider namespace. No Google device names are faked anywhere.

## 7. Workflow and rehearsal discipline
.github workflow (sha256 df330a5a0dcde00458a9b9658bf16a30e628152eb349e79be087bd1cb2551ffc):
runs-on ubuntu-22.04 (pinned: unprivileged user namespaces required for the bwrap canonical-path
mechanism; ubuntu-24.04 runners restrict them via AppArmor), permissions {}, KVM fail-closed first
step, bwrap/userns preflight (E_NO_USERNS), staging as the ONLY network phase (ceremony runs under
sudo unshare -n), dual-build assertions at canonical /build plus a second-runner env2 reproduction
job with cross-runner hash gate, hostile-path drift demonstration whose rejection by the PDB-path
verifier is asserted, forbidden-marker guard (fails if the closing marker string appears in any
output or any evidence file lacks the NON_CERTIFYING_REHEARSAL prefix), ephemeral artifact upload
only, preflight-only mode for static conformance without VMs. The rehearsal NEVER emits the closing
marker and never claims certification.
After STATIC ACCEPT: exactly ONE certification run at the exact accepted head.
Every run URL, head SHA, workflow blob, inputs, logs, and failures are preserved.
The ONE certification workflow (requirement 3): OVMF_CI_SECURE_BOOT_UKI-CERTIFICATION-workflow.yml.
Its ceremony logic is BYTE-IDENTICAL to the rehearsed workflow; certification-vs-rehearsal.diff
shows the diff is strictly limited to (a) mode label (header, workflow/job names, inputs removed -
a certification run is always a full run), (b) marker emission (the forbidden-marker guard step is
replaced by a marker step that runs only on full suite success and emits
OVMF_CI_SECURE_BOOT_UKI_PASS once to stdout and once into the evidence marker file, each time
paired with the full nonclaim block: NOT a full runtime PASS;
NOT a dm-verity runtime PASS; NOT a provisioning PASS; NOT a Google platform certification; NOT a
complete boot-chain certification; NO claims about Google firmware, Google vTPM, GCP deployment,
or persistence), and (c) evidence prefix (upload artifact names). Internal scratch names stay
NON_CERTIFYING_REHEARSAL because the rehearsed scripts are frozen bytes - an audit property:
certification evidence is provably produced by the exact rehearsed bytes.

## 8. Local derisk performed + frozen reproducibility audit (observational)
Derisk executions:
- full staging executed locally: 159/159 debs hash-verified, pristine VARS verified
- BaseTools built from the pinned commit: 303/303 tests OK
- enroll-app.c dual-build byte-identity reproduced (enroll-app.efi sha256 35dee872cd4905187981f39c47e5f589cd2242dc44a250c34e153613e5992b38)
- ESP rebuild reproduces the frozen image 2bfa6212...; verify-esp.py PASS
- ESL/.auth chain closed offline; parse-back: db = exactly 1 entry = production cert
- OVMF DEBUG dual build at canonical /build: byte-identical, hashes in section 4
- env2 second-environment reproduction at /build: byte-identical (below)
- preflight-check.py end-to-end PASS (zero errors)

Frozen reproducibility audit (reviewer ruling: no binary regeneration; records below suffice).
All builds: edk2 edc6681206c1a8791981a2f911d2fb8b3d2f5768, staged toolchain platform.lock
f817f41e, SOURCE_DATE_EPOCH=1706745600, PYTHONHASHSEED=0. All FDs 3653632 B CODE / 540672 B VARS.

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
is now impossible. All verdicts above are v2 verdicts.

Bugs found and fixed during derisk: FAT16/FAT32 field mismatch in the enrollment image writer
(rewritten FAT32); mixed-size ESL emission (concatenated per-size lists); noble cc1/lto-wrapper
libexec path; glibc mixing in host-tool builds (shim + host-compat split); edksetup under
set -euo; edksetup parsing outer "$@"; WORKSPACE env bleed between workdirs; tools_def append
ordering vs edksetup; python3/python symlink; subhook repo unreachable (UnitTestFrameworkPkg
dropped from the submodule set); LTO disabled in frozen flags (host-toolchain coupling);
workdir path leak into FD (prefix-map); CodeView absolute PDB path (canonical /build);
hostile-mode OUTA mkdir omission; verifier v1 PE32+ offset.

## 9. Cost and publisher discipline
Zero mandatory cost forever: GitHub-hosted standard runners only, no card, no TCG fallback
(KVM-only, fail-closed). Nothing is published from the rehearsal workspace; all pushes go through
the publisher agent only on main's explicit order after review. No merge, no promotion, no PFX or
production-key involvement.

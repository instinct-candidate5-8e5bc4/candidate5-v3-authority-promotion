# Bootstrap / Provisioning-Script Pinning Design

Status: `DESIGN - INDEPENDENT REVIEW REQUIRED`

Parent: `2b569a1294fbcc7a9d19aeeb980772bc06edc4ff`

Current maximum state: `BOOTSTRAP_TRUST_ROOT_CANDIDATES_READY_FOR_OWNER_REVIEW`. `BOOTSTRAP_PINNING_DESIGN_PASS` is prohibited until every required candidate is independently reviewed and explicitly approved by the owner.

This document designs the bootstrap and future provisioning script. It commits no executable script and performs no provisioning. It preserves every approved Rust 1.98.1 pin, signer rule, component decision and license manifest at `2b569a1` unchanged.

## Scope and state separation

The states are distinct and monotonic:

1. `BOOTSTRAP_VERIFIED`: an external trusted launcher has admitted the exact host/platform, bootstrap closure and reviewed script bytes.
2. `RUST_TOOLCHAIN_PROVISIONED`: that admitted script completed the `2b569a1` protocol and emitted verified evidence. This does not imply an authoritative compiler invocation.
3. `AUTHORITATIVE_BUILD_ENVIRONMENT_CERTIFIED`: a later review has additionally pinned and verified compiler source/dependencies/flags, kernel, OS/base image, glibc, linker, sysroot, container and all build-time inputs.

This delivery cannot reach `BOOTSTRAP_PINNING_DESIGN_PASS` while candidates remain unapproved. It authorizes no bootstrap provisioning, Rust provisioning, compilation, Structural Enforcement implementation, Certified Boundary Baseline, Authority Routing, runtime routing, Gate continuation, release, promotion, main merge, School integration or visuals.

## Host/platform and bootstrap trust root

The sole designed bootstrap platform is an externally measured, read-only `linux/amd64` bootstrap filesystem matching Ubuntu 22.04.5 LTS (Jammy), dpkg architecture `amd64`, glibc `2.35`. A digest for one distribution, architecture or closure authorizes no other platform. Kernel identity remains outside this provisioning verifier's byte closure and inside the reduced-guarantee trusted execution environment already named by the approved threat model. It must still be recorded; it receives no build authority.

Bootstrap verification terminates at an external trusted launcher/verifier, protected measurement store and execution environment. They are initial trust assumptions, not verified by the script. Before starting any bootstrap executable, the launcher compares platform identity, the committed closure manifest, filesystem bytes and eventual script bytes against immutable values from the reviewed repository commit using a verifier outside the measured filesystem. It mounts the admitted closure read-only, denies writes to it and starts the script by exact absolute path. No script, bootstrap executable or library verifies itself.

The original independently reproduced 56-file static-ELF vector remains evidence only. The complete candidate graph is `bootstrap-trust-root-candidates.md`; its executable/library inventory is mechanically derived from the exact review artifacts plus the retrieval phase. It does not become authority until candidate approval.

Security-relevant runtime data is also in the external trust-root measurement: `/etc/os-release`, CA bundle, DNS/NSS configuration and modules, locale/timezone settings, mount table, loader cache and the kernel/execution policy. These data identities are intentionally not assigned by this design. They must be pinned in the later script review before execution. Network retrieval additionally requires a separately reviewed CA trust policy. Missing identity means `HARD STOP - BOOTSTRAP_TRUST_ROOT_INCOMPLETE`.

## Exact bootstrap capabilities

The exact review artifacts and mechanically derived operation/closure inventory in `bootstrap-trust-root-candidates.md` supersede the earlier hand-selected capability table. The executable set MUST be extracted from the script and launcher bytes plus the declared retrieval phase, never selected manually. Every absolute executable, recursive ELF interpreter/library and runtime-selected data node appears in that package. PATH remains empty and every undeclared dependency fails closed.

## Exact future provisioning script contract

The exact non-executable bytes are now committed at `future-rust-provisioning-script.review-bytes`, mode `100644`, with no shebang. The exact bytes govern; the phase summary below is explanatory and any conflict fails review. Its deterministic phases are:

1. Require arguments naming only an empty output root and evidence root. Reject all other arguments, existing roots, relative paths and environment values outside the fixed allowlist.
2. Emit the reviewed repository commit, script blob ID, script SHA-256, platform-measurement ID and bootstrap-closure root received from the trusted launcher. Compare each to literal reviewed values before any network access.
3. Recheck every closure path by externally supplied read-only admission evidence. The script's `sha256sum` checks are defense in depth only; they do not bootstrap trust.
4. Create empty work/evidence directories by absolute tool path and restrictive umask. Set deterministic locale `C`, timezone `UTC` and empty PATH. Disable shell startup, aliases, functions, glob ambiguity and inherited configuration.
5. Fetch only the exact approved Rust key, manifest, checksum, signature, rustc/cargo/rust-std payloads and optional exact rustup-init URL from `2b569a1`, using fixed curl flags: HTTPS only, TLS failure fatal, no credentials/config/cookies/proxy/netrc, no retry-based alternate resolution, no redirect except a same-origin response explicitly captured and rejected unless its exact target was reviewed.
6. Verify bytes before parsing, extraction or execution: expected lengths where pinned, SHA-256, sole signer VALIDSIG, signed manifest fields and payload digests. Never execute downloaded `rustup-init` in this stage unless a later separately reviewed script explicitly includes and verifies that path. Direct extraction from authenticated payloads is the default design.
7. List and reject unsafe archive structure before extraction. Invoke tar and xz through their exact paths, extract only preverified payloads into an empty root, apply the accepted license inventory algorithm and byte-compare its committed canonical manifest.
8. Produce canonical evidence for every phase, including exact command vector, input/output hashes, stable reason code, stdout/stderr hashes and exit status. Dynamic timestamps/worker IDs go in a separate non-canonical envelope. Canonical JSON uses the existing sorted-key UTF-8 rules.
9. Disable network, rerun the offline inventory and identity gates from `2b569a1`, compare installed files, seal output read-only and atomically mark `RUST_TOOLCHAIN_PROVISIONED`. Any earlier failure removes only the newly created roots and emits no success marker.

Every mismatch, missing input, extra input, malformed record, stale approved identity, alternate tool, failure, partial output or unverifiable fact fails closed with no fallback and no trusted output. Floating `stable`, `latest`, unqualified versions, PATH tools, system defaults, mutable cache labels and unreviewed network origins are forbidden.

## Final script identity and lineage

Any later execution-authorizing commit must descend exactly from the owner-approved candidate/design commit and must not change the reviewed script bytes, fixtures/evidence schema or closure manifest. Review records its full commit, parent, Git blob ID, mode `100755`, byte length and SHA-256. The trusted launcher receives those immutable values through protected configuration, verifies the checked-out commit ancestry/tree and exact script bytes before running `/reviewed-root/<fixed-path>` by file descriptor. It rejects symlinks, writable file/parent, replacement after measurement and a script copied from another commit even if its content happens to match unless the approved lineage also matches. Execution evidence binds all identities and a pre/post byte measurement. Branch, tag, CI status, filename and shebang alone grant no authority.

## Complete verification graph and termination

The graph is acyclic:

`external trusted launcher + protected pins -> platform/base measurement + script commit/blob/bytes + bootstrap closure bytes -> admitted bash -> admitted sha256sum/gpg/curl/tar/xz/coreutils -> authenticated Rust metadata/payloads -> provisioned Rust tree -> deterministic evidence`.

For each bootstrap verifier, the external launcher verifies executable path/digest and all loader/library/runtime-data dependencies. GPG then authenticates only Rust metadata; it does not verify itself. sha256sum then checks only already source-bound bytes; it does not verify itself. The script coordinates already admitted tools; it is not its own trust root. Any edge whose verifier or input is absent, cyclic, `UNASSIGNED`, mutable or undefined yields `HARD STOP - BOOTSTRAP_TRUST_ROOT_INCOMPLETE` before bootstrap execution.

## Mandatory hostile verification

Disposable negative fixtures MUST prove, before provisioning GO, that each case fails with a stable reason code, no success marker and no mutation to the trusted closure:

- prepend PATH substitutions and same-name tools;
- same-version/different-binary curl, sha256sum, gpg, tar, xz, bash or coreutil;
- wrong executable digest or authoritative location;
- modified script byte, mode, blob, lineage or post-measurement replacement;
- modified glibc, loader or any dynamic dependency;
- injected unexpected dynamic dependency, preload/audit module or runtime data;
- missing bootstrap dependency;
- alternate shell/interpreter;
- substituted download client, URL, redirect, mirror or proxy;
- substituted signature verifier, key or VALIDSIG signer;
- stale but previously approved identity;
- wrong architecture, distribution, platform measurement or closure root;
- verifier-of-verifier cycle, missing external admission evidence or new `UNASSIGNED` prerequisite.

The harness must also demonstrate that an exact approved fixture reaches only `BOOTSTRAP_VERIFIED`, then separately `RUST_TOOLCHAIN_PROVISIONED`, never authoritative build certification.

## Deterministic design evidence and review stop

The design review receives this document, full closure inventory, generator source/command transcript, raw `readelf` dependency evidence, package provenance records, platform/runtime-data assumptions, hostile fixtures and expected reason codes. Independent reviewers reproduce the closure from a separately obtained immutable Ubuntu base image, compare every path/digest and audit that the script plan invokes no undeclared capability.

This package supplies concrete base-image, launcher, pin-store, script and runtime-data candidates. Each is `CANDIDATE_FOR_OWNER_APPROVAL`, never placeholder authority. Until independent review and owner approval bind all terminal artifacts, the only result is `BOOTSTRAP_TRUST_ROOT_CANDIDATES_READY_FOR_OWNER_REVIEW`; `BOOTSTRAP_PINNING_DESIGN_PASS` and execution both MUST FAIL CLOSED with `HARD STOP - BOOTSTRAP_TRUST_ROOT_INCOMPLETE`.

No paid GitHub plan feature is a trust root or dependency. GitHub Free CI may publish head-bound reproduction evidence only.

# Bootstrap / Provisioning-Script Pinning Design

Status: `FINAL BOOTSTRAP PINNING DESIGN CANDIDATE - INDEPENDENT REVIEW REQUIRED`

Parent: `2b569a1294fbcc7a9d19aeeb980772bc06edc4ff`

Current state: `FINAL_BOOTSTRAP_PINNING_DESIGN_CANDIDATE_FOR_INDEPENDENT_REVIEW`. The concrete trust-root package at `b768d48e58b6ddcf66ed482ee06e7d62b3162edb` is independently reviewed and owner-approved for exact incorporation. `BOOTSTRAP_PINNING_DESIGN_PASS` remains pending independent review of this final design at one frozen SHA.

This document designs the bootstrap and future provisioning script. It commits no executable script and performs no provisioning. It preserves every approved Rust 1.98.1 pin, signer rule, component decision and license manifest at `2b569a1` unchanged.

## Scope and state separation

The states are distinct and monotonic:

1. `BOOTSTRAP_VERIFIED`: an external trusted launcher has admitted the exact host/platform, bootstrap closure and reviewed script bytes.
2. `RUST_TOOLCHAIN_PROVISIONED`: that admitted script completed the `2b569a1` protocol and emitted verified evidence. This does not imply an authoritative compiler invocation.
3. `AUTHORITATIVE_BUILD_ENVIRONMENT_CERTIFIED`: a later review has additionally pinned and verified compiler source/dependencies/flags, kernel, OS/base image, glibc, linker, sysroot, container and all build-time inputs.

This delivery may reach `BOOTSTRAP_PINNING_DESIGN_PASS` only through independent review of one exact frozen final-design SHA. It authorizes no bootstrap provisioning, Rust provisioning, compilation, Structural Enforcement implementation, Certified Boundary Baseline, Authority Routing, runtime routing, Gate continuation, release, promotion, main merge, School integration or visuals.

## Host/platform and bootstrap trust root

The sole bootstrap platform is the exact owner-approved, externally measured, read-only Linux/amd64 OCI filesystem and nine-layer vector recorded in `bootstrap-concrete-candidates/cross-binding.v1.json`. Its immutable index, manifest, config and full image-closure identities are summarized in `final-bootstrap-trust-root-design.md`; no distribution, architecture, tag move or layer substitution is authorized. Kernel/hypervisor administration remains `NON_AUTHORITATIVE/OUT_OF_SCOPE` under the approved reduced guarantee and grants no application authority.

The measured service, launcher, provisioning script, 44-record service/runtime closure, protected-store policy/floor, Ed25519 verification identity, canonical pin/cross/manifest records and detached signatures are the exact approved bytes at `b768d48e58b6ddcf66ed482ee06e7d62b3162edb`. The measured service validates this complete signed graph and denies network before any launcher path. No artifact verifies itself.

Offline content-addressed delivery is final. Authoritative execution uses exactly the nine signed offline records. DNS, CA/resolver injection, live retrieval, curl transport, host files, mutable cache, mirror and fallback are forbidden and absent from the authoritative execution graph. Runtime data is limited to the exact files in the approved 44-record closure plus explicit `NON_AUTHORITATIVE/OUT_OF_SCOPE` kernel/filesystem semantics named in the reduced threat model. Any newly authoritative runtime data requires a new binding and review.

## Exact bootstrap capabilities

The exact review artifacts and mechanically derived operation/closure inventory in `final-bootstrap-trust-root-design.md` supersede the earlier hand-selected capability table. The executable set MUST be extracted from the service, launcher and script bytes, never selected manually. Every absolute executable, recursive ELF interpreter/library and runtime-selected data node appears in that package. PATH remains empty and every undeclared dependency fails closed.

## Exact future provisioning script contract

The exact non-executable bytes are now committed at `future-rust-provisioning-script.review-bytes`, mode `100644`, with no shebang. The exact bytes govern; the phase summary below is explanatory and any conflict fails review. Its deterministic phases are:

1. Require arguments naming only an empty output root and evidence root. Reject all other arguments, existing roots, relative paths and environment values outside the fixed allowlist.
2. Consume only the already measured, signed offline input mount and the admitted platform/service/launcher/script identities. No script network access exists.
3. Recheck every closure path by externally supplied read-only admission evidence. Script hashes are defense in depth only; the signed measured-service graph bootstraps trust.
4. Create empty work/evidence directories by absolute tool path and restrictive umask. Set deterministic locale `C`, timezone `UTC` and empty PATH. Disable shell startup, aliases, functions, glob ambiguity and inherited configuration.
5. Require exactly the nine basenames in the signed offline manifest and reject missing, extra, renamed, symlinked or digest-mismatched inputs. No retrieval or rustup input is permitted.
6. Verify bytes before parsing, extraction or execution: expected lengths where pinned, SHA-256, sole signer VALIDSIG, signed manifest fields and payload digests. Rustup is not an input. Direct extraction from the three authenticated payloads is the only design.
7. List and reject unsafe archive structure before extraction. Invoke tar and xz through their exact paths, extract only preverified payloads into an empty root, apply the accepted license inventory algorithm and byte-compare its committed canonical manifest.
8. Produce canonical evidence for every phase, including exact command vector, input/output hashes, stable reason code, stdout/stderr hashes and exit status. Dynamic timestamps/worker IDs go in a separate non-canonical envelope. Canonical JSON uses the existing sorted-key UTF-8 rules.
9. Disable network, rerun the offline inventory and identity gates from `2b569a1`, compare installed files, seal output read-only and atomically mark `RUST_TOOLCHAIN_PROVISIONED`. Any earlier failure removes only the newly created roots and emits no success marker.

Every mismatch, missing input, extra input, malformed record, stale approved identity, alternate tool, failure, partial output or unverifiable fact fails closed with no fallback and no trusted output. Floating `stable`, `latest`, unqualified versions, PATH tools, system defaults, mutable cache labels and unreviewed network origins are forbidden.

## Final script identity and lineage

Any later execution-authorizing commit must descend exactly from the owner-approved package/final-design commit and must not change the reviewed script bytes, fixtures/evidence schema or closure manifest. Review records its full commit, parent, Git blob ID, mode `100644`, byte length and SHA-256. The trusted launcher receives those immutable values through protected configuration, verifies the checked-out commit ancestry/tree and exact script bytes before running `/reviewed-root/<fixed-path>` by file descriptor. It rejects symlinks, writable file/parent, replacement after measurement and a script copied from another commit even if its content happens to match unless the approved lineage also matches. Execution evidence binds all identities and a pre/post byte measurement. Branch, tag, CI status, filename and shebang alone grant no authority.

## Complete verification graph and termination

The graph is acyclic:

`protected public key + floor -> signed pin/cross/offline records -> exact image/layers + service/44-record closure + launcher/script -> admitted bash/openssl/sha256sum/gpg/tar/xz/coreutils -> authenticated offline Rust metadata/payloads -> provisioned Rust tree -> deterministic evidence`.

For each bootstrap verifier, the external launcher verifies executable path/digest and all loader/library/runtime-data dependencies. GPG then authenticates only Rust metadata; it does not verify itself. sha256sum then checks only already source-bound bytes; it does not verify itself. The script coordinates already admitted tools; it is not its own trust root. Any edge whose verifier or input is absent, cyclic, `UNASSIGNED`, mutable or undefined yields `HARD STOP - BOOTSTRAP_TRUST_ROOT_INCOMPLETE` before bootstrap execution.

## Mandatory hostile verification

Disposable negative fixtures MUST prove, before provisioning GO, that each case fails with a stable reason code, no success marker and no mutation to the trusted closure:

- prepend PATH substitutions and same-name tools;
- same-version/different-binary openssl, sha256sum, gpg, tar, xz, bash or coreutil;
- wrong executable digest or authoritative location;
- modified script byte, mode, blob, lineage or post-measurement replacement;
- modified glibc, loader or any dynamic dependency;
- injected unexpected dynamic dependency, preload/audit module or runtime data;
- missing bootstrap dependency;
- alternate shell/interpreter;
- attempted live-network, mirror, host-file, mutable-cache or recovery-download fallback;
- substituted signature verifier, key or VALIDSIG signer;
- stale but previously approved identity;
- wrong architecture, distribution, platform measurement or closure root;
- verifier-of-verifier cycle, missing external admission evidence or new `UNASSIGNED` prerequisite.

The harness must also demonstrate that an exact approved fixture reaches only `BOOTSTRAP_VERIFIED`, then separately `RUST_TOOLCHAIN_PROVISIONED`, never authoritative build certification.

## Deterministic design evidence and review stop

The design review receives this document, full closure inventory, generator source/command transcript, raw `readelf` dependency evidence, package provenance records, platform/runtime-data assumptions, hostile fixtures and expected reason codes. Independent reviewers reproduce the closure from a separately obtained immutable Ubuntu base image, compare every path/digest and audit that the script plan invokes no undeclared capability.

The exact concrete package is owner-approved for incorporation, and `final-bootstrap-pinning-design.v1.json` binds its artifact identities. No unresolved authoritative candidate, placeholder, `UNASSIGNED`, prose-only edge, live-network input or undeclared runtime dependency remains in this bootstrap design. Until independent review passes this exact final-design SHA, `BOOTSTRAP_PINNING_DESIGN_PASS` remains withheld. Execution remains separately prohibited regardless of design PASS.

No paid GitHub plan feature is a trust root or dependency. GitHub Free CI may publish head-bound reproduction evidence only.

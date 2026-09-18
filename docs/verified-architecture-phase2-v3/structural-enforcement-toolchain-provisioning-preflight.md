# Structural Enforcement Toolchain Provisioning Preflight

Status: `DESIGN PREFLIGHT - REVIEW REQUIRED`

Base design: `c6b1962261a376ec6089586327030308868619cd`

This is a design-only provisioning contract. It installs nothing and changes no implementation, Foundation, Gate, runtime, School or visual artifact. Provisioning remains prohibited until the owner accepts this design reopen and independent review records `TOOLCHAIN_PROVISIONING_PREFLIGHT=PASS` against this exact document commit.

## Governing decision and supersession

After that PASS only, this contract is the single governing authorization for provisioning the Rust compiler toolchain used by structural-enforcement implementation. It authorizes provisioning and identity verification only. It does not authorize an authoritative build, implementation acceptance, boundary artifact/certification finalization, Gate continuation, merge, release, routing or promotion.

The owner authorization at `c6b1962` supersedes historical language whose sole purpose is to prohibit implementation while pins are `UNASSIGNED`. `UNASSIGNED` is permitted during Implementation Preflight, Toolchain Provisioning, Implementation, testing, review and baseline building. In `structural-enforcement-preflight.md`, this supersedes only the contradictory implementation-timing clauses in:

- line 9, which says implementation may be considered only after both boundary commits are named;
- line 211, which says no implementation may begin while commit roles and compiler/runtime identities are unassigned;
- line 536, only the clause blocking implementation until exact engine/build identities are named and probes pass;
- line 606, which blocks implementation while the Rust channel manifest and compiler identities are `UNASSIGNED`;
- line 641, which orders assignment and certification of boundary commit IDs before implementation;
- line 643, only to the extent it makes approval of all listed final identities and controls a prerequisite to implementation rather than a prerequisite to certification; and
- line 648, only its hard stop based on an `UNASSIGNED` or not-yet-certified boundary commit role, absent not-yet-finalized two-commit files or suite, and other not-yet-final implementation-lifecycle artifacts.

Only blockers that contradict the authorized implementation lifecycle are superseded. Every substantive design requirement and every other hard stop remains, including the external certification/verifier controls; immutable two-commit construction; Foundation byte and semantic immutability; fail-closed behavior; exactly three Gate-to-Foundation edges; no loader or host-object exposure; declared dependencies; exact targets; and behavioral hostile proof. Engine, OS, architecture, compiler-source, dependency, linker, sysroot and container identities may remain `UNASSIGNED` only while the lifecycle permits; they receive no wildcard or authority semantics. This Rust provisioning contract does not assign those other identities or authorize engine provisioning.

Nothing here authorizes certification, promotion, release, runtime, Gate continuation, baseline validity or merge. At the certification/promotion boundary, if either boundary pin or any required identity is missing, the required result is exactly: `HARD STOP - CERTIFIED BOUNDARY BASELINE REQUIRED`.

Therefore the governing transition is:

`c6b1962 design -> this provisioning preflight -> owner acceptance -> independent preflight PASS -> provision exact toolchain -> hostile verification PASS -> implementation may use the provisioned compiler for non-authorizing development -> independent Implementation Review`.

No toolchain state, cache or evidence created before preflight PASS is authoritative.

## Exact supported platform and toolchain

The sole provisioning platform is `x86_64-unknown-linux-gnu`. An OS image/digest, kernel, glibc, linker, sysroot or architecture identity is not silently inferred by this pin. Until those are assigned by the implementation plan, this toolchain may compile only non-authorizing development and hostile-test fixtures. Every other host or target is an unexpected target and MUST FAIL CLOSED.

Pinned distribution:

| Identity | Required value |
|---|---|
| Rust release | `1.90.0`, dated `2025-09-18` |
| Rust source/release commit | `1159e78c4747b02ef996e55082b704c09b970588` |
| host and only installed target | `x86_64-unknown-linux-gnu` |
| rustc | `rustc 1.90.0 (1159e78c4 2025-09-14)` |
| cargo | `cargo 1.90.0 (840b83a10 2025-07-30)`; manifest package version `0.91.0` |
| rust-std | `1.90.0 (1159e78c4 2025-09-14)` for the sole target |
| rust-src | `1.90.0 (1159e78c4 2025-09-14)` |
| rustfmt-preview | package `1.8.0`, release artifact `rustfmt-1.90.0` |
| clippy-preview | package `0.1.90`, release artifact `clippy-1.90.0` |
| llvm-tools-preview | `1.90.0 (1159e78c4 2025-09-14)` for the sole target |
| rustup bootstrap, if used | `rustup-init 1.28.2` for `x86_64-unknown-linux-gnu` |
| profile | explicit `minimal`; then add exactly `rust-src`, `rustfmt`, `clippy`, `llvm-tools` |

`rustc`, `cargo`, `rust-std`, `rust-src`, `rustfmt`, `clippy` and `llvm-tools` are the complete permitted component set. Documentation and other targets/components MUST NOT be installed. A later need is a design change and requires review, not an opportunistic add.

## Authoritative sources and immutable integrity pins

All URLs are exact HTTPS Rust Project distribution paths. A redirect to another origin, mutable channel name, mirror or package manager MUST FAIL CLOSED.

Trust anchors and manifest:

| Object | Authoritative URL | Required SHA-256 / identity |
|---|---|---|
| Rust release signing key | `https://static.rust-lang.org/rust-key.gpg.ascii` | file SHA-256 `e54b09a439647e006b4831eec9785cbaaf3e07ab371c3a6ee6a68e1bdb9fbc6b`; primary fingerprint `108F66205EAEB0AAA8DD5E1C85AB96E6FA1BE5FE`; signing subkey fingerprint `C13466B7E169A085188632165CB4A9347B3B09DC` |
| versioned release manifest | `https://static.rust-lang.org/dist/channel-rust-1.90.0.toml` | SHA-256 `489c19f20d331765ab2835661eb546de90f6446a107a8db83045e7371e45cae2` |
| manifest checksum | `https://static.rust-lang.org/dist/channel-rust-1.90.0.toml.sha256` | exact payload naming the preceding digest |
| detached manifest signature | `https://static.rust-lang.org/dist/channel-rust-1.90.0.toml.asc` | signature must validate the exact manifest with the pinned signing fingerprint; observed file SHA-256 `d6462be232558bca99d549c3a0a32ec8ec8c37e6fce799d7c38963afcd9b734` |
| optional rustup bootstrap | `https://static.rust-lang.org/rustup/archive/1.28.2/x86_64-unknown-linux-gnu/rustup-init` | SHA-256 `20a06e644b0d9bd2fbdbfd52d42540bdde820ea7df86e92e533c073da0cdd43c` |

Pinned `.tar.xz` payloads from `https://static.rust-lang.org/dist/2025-09-18/`:

| Payload | Required SHA-256 |
|---|---|
| `rustc-1.90.0-x86_64-unknown-linux-gnu.tar.xz` | `48c2a42de9e92fcae8c24568f5fe40d5734696a6f80e83cc6d46eef1a78f13c9` |
| `cargo-1.90.0-x86_64-unknown-linux-gnu.tar.xz` | `9853db03d68578a30972e2755c89c66aec035fec641cf8f3a7117c81eec2578d` |
| `rust-std-1.90.0-x86_64-unknown-linux-gnu.tar.xz` | `663f4ab7945b392d5e5294dec1b050a66820a20e86f084ec37eeb0f2f7ff5569` |
| `rust-src-1.90.0.tar.xz` | `cde088d57064d151b2236f4619aea4a8207e0709eb3035ddc6617d609ab7d453` |
| `rustfmt-1.90.0-x86_64-unknown-linux-gnu.tar.xz` | `7f4d38b9d782e55832bf17969ef35477703c60781545bb098eb127cc8172d1c6` |
| `clippy-1.90.0-x86_64-unknown-linux-gnu.tar.xz` | `5b6466419693a05365827378145014a37ae74fb2948fab390d5210a524792ed8` |
| `llvm-tools-1.90.0-x86_64-unknown-linux-gnu.tar.xz` | `1376ef6021578fcfe94fad66396f7ca6d2f19bda5a417f8746a2b32ccf3f4470` |

The versioned signed manifest is the distribution metadata authority. This reviewed document separately pins its key, fingerprint, manifest digest and permitted payload digests. HTTPS alone, the `.sha256` sidecar alone and rustup alone are insufficient: rustup documents that it does not validate distribution signatures. The accepted provenance chain is:

`reviewed document commit -> pinned Rust release-key bytes/fingerprint -> valid detached signature over exact versioned manifest -> exact manifest date/release/source commit/package URL/digest -> downloaded payload digest -> clean installed-file inventory/digests -> executable identity and path -> build evidence`.

A valid signature from any other key, valid metadata for another release, same version with another digest, or payload from an alternate URL is a provenance mismatch and MUST FAIL CLOSED.

## Clean reproducible provisioning protocol

Provisioning runs in a newly created, empty, access-controlled root. It MUST NOT use `/usr/bin`, an existing home, a global cargo/rustup directory or inherited shell startup files.

1. Record the preflight document commit, UTC time, worker identity and empty-root proof. Set a restrictive umask. Clear `RUSTUP_HOME`, `CARGO_HOME`, `RUSTC`, `RUSTDOC`, `CARGO`, `RUSTUP_TOOLCHAIN`, `RUSTUP_DIST_SERVER`, `RUSTUP_UPDATE_ROOT`, compiler wrappers and linker overrides. Replace, do not extend, `PATH` with a reviewed bootstrap-tool path.
2. Verify the bootstrap operating tools by immutable paths and pre-approved digests. The implementation preflight must assign these before execution: TLS client, SHA-256 tool, OpenPGP verifier, archive extractor, shell/core utilities and C runtime. An unassigned bootstrap-tool digest is a hard stop.
3. Fetch only the pinned key, manifest, signature and permitted payload URLs. Reject redirects to another origin. Verify key-file hash and exact primary and signing fingerprints in an isolated empty keyring. Verify manifest hash, checksum payload and detached signature. Parse only manifest version 2; reject duplicate keys, malformed TOML, unknown selected fields, missing availability, mismatched date/version/commit/URL/hash, and any requested component not listed available.
4. Download payloads into a new staging directory. Verify every SHA-256 against both this contract and the authenticated manifest before extraction. Reject links escaping the root, absolute paths, devices, ownership/mode surprises, duplicate paths and post-extraction writes outside staging.
5. Install with a deterministic provisioning script pinned by the later implementation commit. If rustup is used, first verify exact `rustup-init` bytes, invoke it by absolute path with `--default-toolchain none --profile minimal --no-modify-path -y`, then install the exact versioned toolchain and exact component list into empty explicit `RUSTUP_HOME` and `CARGO_HOME`. Never invoke `stable`, `latest`, an unqualified `1.90`, system rustup or network auto-update. Independently compare its downloaded objects and installed inventory to the preverified set; rustup success is not evidence of integrity.
6. Remove network access. Re-run all payload, installed-tree and executable identity checks offline. Produce a canonical installed-file manifest sorted by raw UTF-8 path, with file type, mode, size and SHA-256. Reject unexpected files, targets, components, writable executables and symlinks outside the root.
7. Seal the verified payload cache and installed root read-only under distinct content-addressed names. A mutable name such as `stable`, `latest` or `default` is forbidden. Cache admission occurs only after the same signature, manifest, payload, extraction and inventory verification. Cache provenance is the complete evidence bundle, not a success marker.
8. Repeat from empty state on an administratively separate worker using independently fetched bytes. Canonical payload and installed-file manifests, identity outputs and hostile-proof results MUST match byte-for-byte. Environment-specific absolute root paths are recorded separately and excluded from equality only by an explicit evidence schema rule.

No network fallback is permitted after staging. A clean online bootstrap that cannot fetch or verify every pin fails. An offline bootstrap may use only a sealed cache whose entire provenance chain is reverified; absent, stale, malformed or unverifiable evidence fails. Recovery means discard the incomplete root, start from a new empty root and replay the same contract. It never means update, repair from PATH, substitute a mirror, relax a digest or reuse partially verified state.

## Identity gate before every authoritative build

Provisioning PASS does not itself make a build authoritative. Immediately before every candidate authoritative build, a fail-closed wrapper owned by the later implementation commit MUST:

- start from an allowlisted environment and absolute tool paths beneath the sealed root; resolve each executable with no PATH search and prove its canonical path, file type, owner, mode and SHA-256 match the sealed installed manifest;
- reverify the preflight commit, signing-key fingerprint, manifest signature and hash, selected payload hashes, cache evidence and installed-file manifest;
- require exact `rustc --version --verbose` release `1.90.0`, commit hash `1159e78c4747b02ef996e55082b704c09b970588`, commit date `2025-09-14` and host `x86_64-unknown-linux-gnu`; record the entire output, including LLVM version, and bind it to the later compiler evidence;
- require exact `cargo --version --verbose` release `1.90.0`, commit hash `840b83a10fb0e039a83f4d70ad032892c287570a` and release date `2025-07-30`;
- require the exact installed component list and exactly one target, `x86_64-unknown-linux-gnu`; verify rust-src, rustfmt, clippy and LLVM tools by sealed file inventory, and run their explicit version probes where available;
- reject `RUSTC_WRAPPER`, `RUSTC_WORKSPACE_WRAPPER`, aliases, shims, compiler launchers, dynamic preload/injection variables, unknown config, user/system Cargo config, auto-update and network access;
- record linker, sysroot, dynamic loader, shared-library and OS/container identities. An unassigned or mismatched identity blocks authoritative status even when Rust itself matches;
- take an exclusive read lease on the sealed root, verify it immediately before execution and again after the build. Any mutation or time-of-check/time-of-use substitution invalidates the build.

Any missing, mismatch, substitution, stale, malformed or unverifiable input or result MUST FAIL CLOSED. Correct version with wrong digest MUST FAIL CLOSED. There is no warning-only mode and no fallback to system, latest, unpinned, PATH-unknown, alternate or unverified cached Rust.

## Mandatory hostile proofs

Tests run against disposable copies and MUST prove nonzero failure before any compiler-controlled output can receive candidate authority:

1. prepend a wrong `rustc` to PATH;
2. replace the absolute rustc with the right name and wrong version;
3. supply correct rustc version text with a wrong executable digest;
4. prepend or substitute a wrong `cargo`;
5. set `RUSTC`, `CARGO`, `RUSTC_WRAPPER` and `RUSTC_WORKSPACE_WRAPPER` substitutions;
6. tamper one byte in rustc after initial verification and test the pre-build and post-build checks;
7. introduce an unverified cache object and a forged cache-success marker;
8. remove each required component in turn;
9. add an unexpected target or component;
10. request an unexpected target through Cargo config or command flags;
11. provide a correctly hashed payload under a URL or manifest with the wrong provenance;
12. provide a validly signed different release manifest;
13. provide the correct version with a wrong payload or installed-file digest;
14. corrupt, truncate, duplicate or malform manifest/evidence fields;
15. make the cache stale, mutable, partially verified or missing its signature chain;
16. attempt online repair, mirror substitution, mutable `stable` resolution and system fallback while required input is absent;
17. mutate the sealed root between identity gate and compiler execution.

Each case passes only if the wrapper fails closed, emits a stable machine-readable reason code, produces no candidate-authority marker and leaves the sealed cache/root unchanged.

## Deterministic evidence for independent reproduction

One canonical, versioned evidence bundle MUST contain:

- this preflight commit and later provisioning-script commit;
- bootstrap host/image and every bootstrap-tool path/version/digest;
- exact source URLs, redirect records, TLS retrieval times and raw key, manifest, checksum and signature files;
- OpenPGP verifier identity and complete signature result with pinned fingerprints;
- every payload name, byte length and SHA-256 plus the authenticated manifest selection;
- canonical extraction and installed-file manifests;
- exact environment allowlist, absolute executable paths and full identity outputs;
- exact target/component inventory, linker/sysroot/loader/library/OS identities and network-disabled proof;
- provisioning commands and exit status, UTC timestamps, worker identity and empty-root proof;
- all hostile fixture inputs, stable reason codes, stdout/stderr digests and no-output/no-mutation proofs;
- independently reproduced bundle root and byte comparison.

Canonical JSON uses UTF-8, lexicographically sorted object keys, no insignificant whitespace, decimal integers and one trailing LF; arrays whose order is not semantic are sorted by raw UTF-8 bytes. Binary inputs remain separate content-addressed blobs. The bundle root is SHA-256 over a domain-separated ordered manifest of relative path, byte length and SHA-256. Independent reviewers verify from raw inputs, not screenshots, CI summaries, mutable links or branch names.

GitHub Free CI may reproduce the public checks and publish the exact tested head as defense in depth. GitHub status, Actions, caches, environments, protected branches, paid rulesets and repository administration are not provenance or authority. The full protocol must run on independent workers and requires no paid GitHub plan feature.

## Review stop

This preflight is not PASS merely because its listed public hashes match today. Independent review must confirm every pinned byte, full Cargo commit identity, supported bootstrap host/tool digests, provisioning script semantics, evidence schema, hostile fixtures and the exact supersession boundary. Until then: `TOOLCHAIN_PROVISIONING_PREFLIGHT=REVIEW_REQUIRED`, and no Rust installation or provisioning is authorized by this document.

## Authoritative public references

- Rust release channel layout and signed manifest model: https://forge.rust-lang.org/infra/channel-layout.html
- Rust standalone artifacts and release signing statement: https://forge.rust-lang.org/infra/other-installation-methods.html
- Rustup security limitation (HTTPS downloads but no signature validation): https://rust-lang.github.io/rustup/security.html
- Rustup component semantics: https://rust-lang.github.io/rustup/concepts/components.html
- Rustup override precedence and directory/toolchain selection risk: https://rust-lang.github.io/rustup/overrides.html
- rustc command-line identity interface: https://doc.rust-lang.org/stable/rustc/command-line-arguments.html
- Exact signed release manifest: https://static.rust-lang.org/dist/channel-rust-1.90.0.toml

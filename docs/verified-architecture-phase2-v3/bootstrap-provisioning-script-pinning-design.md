# Bootstrap / Provisioning-Script Pinning Design

Status: `DESIGN - INDEPENDENT REVIEW REQUIRED`

Parent: `2b569a1294fbcc7a9d19aeeb980772bc06edc4ff`

Maximum verdict: `BOOTSTRAP_PINNING_DESIGN_PASS`.

This document designs the bootstrap and future provisioning script. It commits no executable script and performs no provisioning. It preserves every approved Rust 1.98.1 pin, signer rule, component decision and license manifest at `2b569a1` unchanged.

## Scope and state separation

The states are distinct and monotonic:

1. `BOOTSTRAP_VERIFIED`: an external trusted launcher has admitted the exact host/platform, bootstrap closure and reviewed script bytes.
2. `RUST_TOOLCHAIN_PROVISIONED`: that admitted script completed the `2b569a1` protocol and emitted verified evidence. This does not imply an authoritative compiler invocation.
3. `AUTHORITATIVE_BUILD_ENVIRONMENT_CERTIFIED`: a later review has additionally pinned and verified compiler source/dependencies/flags, kernel, OS/base image, glibc, linker, sysroot, container and all build-time inputs.

This delivery can reach only `BOOTSTRAP_PINNING_DESIGN_PASS`. It authorizes no bootstrap provisioning, Rust provisioning, compilation, Structural Enforcement implementation, Certified Boundary Baseline, Authority Routing, runtime routing, Gate continuation, release, promotion, main merge, School integration or visuals.

## Host/platform and bootstrap trust root

The sole designed bootstrap platform is an externally measured, read-only `linux/amd64` bootstrap filesystem matching Ubuntu 22.04.5 LTS (Jammy), dpkg architecture `amd64`, glibc `2.35`. A digest for one distribution, architecture or closure authorizes no other platform. Kernel identity remains outside this provisioning verifier's byte closure and inside the reduced-guarantee trusted execution environment already named by the approved threat model. It must still be recorded; it receives no build authority.

Bootstrap verification terminates at an external trusted launcher/verifier, protected measurement store and execution environment. They are initial trust assumptions, not verified by the script. Before starting any bootstrap executable, the launcher compares platform identity, the committed closure manifest, filesystem bytes and eventual script bytes against immutable values from the reviewed repository commit using a verifier outside the measured filesystem. It mounts the admitted closure read-only, denies writes to it and starts the script by exact absolute path. No script, bootstrap executable or library verifies itself.

The current design inventory is `bootstrap-ubuntu-22.04-amd64-closure.md`. Its canonical records are exact-path UTF-8, NUL, role, NUL, decimal length, NUL, lowercase SHA-256, LF, sorted by unsigned raw path bytes. The intended 12 executables and their complete ELF `DT_NEEDED` recursive closure total 56 files; canonical manifest length is 6,966 bytes and SHA-256 is `c658d6c78749e27421dddf26acdfcbdaf2390bc4b7c1dbf8f66e4d7285b29926`. The later script commit MUST include the exact canonical binary manifest as a reviewed artifact; until independent reproduction confirms its bytes and root, execution is a hard stop.

Security-relevant runtime data is also in the external trust-root measurement: `/etc/os-release`, CA bundle, DNS/NSS configuration and modules, locale/timezone settings, mount table, loader cache and the kernel/execution policy. These data identities are intentionally not assigned by this design. They must be pinned in the later script review before execution. Network retrieval additionally requires a separately reviewed CA trust policy. Missing identity means `HARD STOP - BOOTSTRAP_TRUST_ROOT_INCOMPLETE`.

## Exact bootstrap capabilities

The future script may execute only these absolute paths:

| Capability | Exact path | Version / purpose | SHA-256 |
|---|---|---|---|
| POSIX orchestration | `/usr/bin/bash` | GNU bash 5.1.16; script interpreter | `59474588a312b6b6e73e5a42a59bf71e62b55416b6c9d5e4a6e1c630c2a9ecd4` |
| HTTPS retrieval | `/usr/bin/curl` | curl 7.81.0; exact approved HTTPS URLs only | `0ca2b923679ab186f6512c7512e131a1c5c1b43d4cb5d55933998405b39e85bf` |
| digest | `/usr/bin/sha256sum` | GNU coreutils 8.32 | `b88ea413571562a591268213d736121fada5ba14330bfcc74b8d9f14e4018ddf` |
| signature | `/usr/bin/gpg` | GnuPG 2.2.27; isolated keyring and exact VALIDSIG | `9dcc2c88ecfe281b416b47453444cb382dac67f62e9a551fbbec0417441cf480` |
| archive | `/usr/bin/tar` | GNU tar 1.34; list/extract verified archives | `fd0d62eed19efd3e115aa1be44160f89d777cd1e6d6d8eb0ce7c8bdc879f59e2` |
| xz decoder | `/usr/bin/xz` | XZ Utils 5.2.5; invoked only by absolute path | `d0ef210d5cf6ce495db2994254b183907989686c8647440fa2eb03cf99903e21` |
| directories | `/usr/bin/mkdir` | coreutils 8.32 | `1bf979d8d0ec5a3b64f24806668b738940c8735790098c96e0bb2a16d81fe516` |
| cleanup | `/usr/bin/rm` | coreutils 8.32 | `2e49f7c07c7b58dfef7c556dd43ddd2c491c70a9cf1e0283b411f6c2438097b5` |
| mode seal | `/usr/bin/chmod` | coreutils 8.32 | `8a9091d6d2a0e5da7778ff6057b69097ec9bc4fcf1bfed9d8d94d5232dd72b50` |
| temporary root | `/usr/bin/mktemp` | coreutils 8.32 | `5ba7d37836aecbb741f868e29baa57d5f99524e6c8d0acafba2db80e674f0f6e` |
| byte compare | `/usr/bin/cmp` | diffutils 3.8 | `b355472d3c90ea94d11ebb8b750e6946ccd348edc6fca4aefc1235c3994ef791` |
| empty environment | `/usr/bin/env` | coreutils 8.32 | `854a8d7f147ff1bf3562edd1aa0b2f2ac28ef432811533f03c43dc9162fe3af3` |

The companion closure inventory pins every dynamic loader/library byte used by these executables. A same-version binary with another digest fails. A same digest at another location fails where location is listed as authoritative. Symlink resolution, ELF interpreter, every recursively loaded object and runtime data policy must equal the externally measured closure before execution. `LD_PRELOAD`, `LD_LIBRARY_PATH`, `GCONV_PATH`, `LOCPATH`, audit variables and all unknown environment variables are rejected.

No `command -v`, `/usr/bin/env <name>`, PATH lookup, shell alias, function, package manager, downloader fallback, mirror, alternate OpenPGP implementation or alternate archive decoder is allowed. `PATH` is set to an empty directory. Bash builtins are allowed only for control flow, parameter expansion, fixed-string comparison, redirection and `printf`; use of any other external command or builtin must be added to this design and closure first.

## Exact future provisioning script contract

The later delivery MUST add exactly one LF-terminated UTF-8 Bash script with no BOM, CR, NUL, generated code or sourced file. It will be reviewed as bytes before execution. Its deterministic phases are:

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

The later executable-script commit must descend exactly from this design PASS commit and change only the reviewed script plus its canonical fixtures/evidence schema and complete closure manifest. Review records its full commit, parent, Git blob ID, mode `100755`, byte length and SHA-256. The trusted launcher receives those immutable values through protected configuration, verifies the checked-out commit ancestry/tree and exact script bytes before running `/reviewed-root/<fixed-path>` by file descriptor. It rejects symlinks, writable file/parent, replacement after measurement and a script copied from another commit even if its content happens to match unless the approved lineage also matches. Execution evidence binds all identities and a pre/post byte measurement. Branch, tag, CI status, filename and shebang alone grant no authority.

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

This draft intentionally leaves the immutable Ubuntu base-image digest, external-launcher identity, protected pin-store identity, kernel/execution-policy identity, CA/runtime-data hashes and final script commit/blob/digest `UNASSIGNED`; inventing them from this mutable workspace would be false provenance. Therefore this design may PASS as a pinning design, but no bootstrap execution may start. The later executable-script review must assign and independently reproduce all of them or stop with `HARD STOP - BOOTSTRAP_TRUST_ROOT_INCOMPLETE`.

No paid GitHub plan feature is a trust root or dependency. GitHub Free CI may publish head-bound reproduction evidence only.

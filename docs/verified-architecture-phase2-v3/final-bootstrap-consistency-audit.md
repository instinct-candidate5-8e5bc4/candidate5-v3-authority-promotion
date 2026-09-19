# Final Bootstrap Pinning Design Consistency Audit

Result: `BOOTSTRAP_PINNING_DESIGN_READY_FOR_INDEPENDENT_REVIEW`

Audit basis: owner decision `ROOT_ADMITTER_CONCRETE_CANDIDATE_APPROVED` at 2026-09-19 19:44 IDT; exact approved commit `aac192071090e21f0f7373add2305ac760d10ec0`, parent `f3e336c6a01030f8c58b177194587453f9a9d740`, tree `c724e3633a673e8080ada8d9d790302fbc9d39de`, root-admitter subtree `cd03b2286e57b6ee5580f3b24b32cbb7678d980c`; exact final manifest `final-bootstrap-pinning-design.v1.json`. The approval covers only the reviewed bytes, identities, digests, topology, provenance, closure and hostile semantics. No approved candidate artifact was changed.

| Required edge | Exact terminal identity and enforcement | Result |
|---|---|---|
| external trusted boundary | signed UKI SHA-256 `7f5c339270f486a107285e9abfe0150f6e95bef0456668f34f79401f81dcc836`; external boot binding/key/signature SHA-256 `8815ee6...` / `ec3c563...` / `449451b...`; exact UEFI db policy in the approved subtree | CLOSED |
| native Root Admitter | static supervisor ELF SHA-256 `a2d33af1aa9ff076d4dc2e6e5f90be8f95cacc6a45a8559263035758e17ff6eb`; active dm table verified through the kernel API; prefork pidfd + PDEATHSIG + zero-time poll parent-liveness proof | CLOSED |
| authoritative root | rootfs image `71e3290...`, verity tree `82423ac...`, dm-verity root `c8f1ca4...`; one exact read-only target and exact root hash | CLOSED |
| descriptor admission | supervisor opens the exact admission artifact once, verifies type/owner/mode/digest, clears CLOEXEC only on that descriptor and hands `/proc/self/fd/N` across chroot; no pathname reopen | CLOSED |
| admission/launcher layer | artifact `1858da0...`, 30-file closure `709f8dd...`, binding `ce6b288...`, signature `62188d0...`, public key `ebe7ecc...`; it replaces the historical launcher role and performs same-descriptor script handoff | CLOSED |
| composed measured service | exact bytes `17441ae...`; exact approved inner service `e470199...`; fresh input/output/evidence state; immutable input descriptors; bounded native successor result channel and cleanup semantics | CLOSED |
| protected pin store | policy `2f2b4ef...`, public key `6be9ac5...`, sequence/floor 1, append-only signed update and two-copy byte-identical recovery without rollback | CLOSED |
| verification records | pin/cross/offline records and signatures `98b2471...`/`f214180...`, `5de911f...`/`6d83495...`, `30044b7...`/`90889cb...`; canonical reconstruction and exact comparison | CLOSED |
| offline seal chain | nine exact signed input records; `network=DENIED`; no DNS, live retrieval, mirror, cache, host-file or fallback authority | CLOSED |
| cross-binding | exact image/layers, service/closure, admission identity, script and offline manifest are joined through signed records and the approved root image; wrong-but-valid bindings fail closed | CLOSED |
| provisioning script | blob `2622618...`, 8,738 bytes, mode `100644`, SHA-256 `7d6b7c6...`; exact reviewed repository/commit/tree/path/blob and same opened descriptor are required | CLOSED |
| Rust provisioning inputs | Rust 1.98.1, source commit `48a229ceaefd4985c50990b14116b6d856af0985`, signer `108F66205EAEB0AAA8DD5E1C85AB96E6FA1BE5FE`, exactly rustc/cargo/rust-std for x86_64-unknown-linux-gnu and the 26-record license inventory | CLOSED |
| hostile semantics | wrong dm tuple, stale/wrong binding, path replacement, descriptor mismatch, malformed result channel, helper death, object-identity failure, partial cleanup, residue and signal/reap races have exact fail-closed outcomes in the approved hostile record | CLOSED |

The authority graph is acyclic:

`external protected UEFI db policy -> exact signed UKI -> signed external-boot binding -> native measured supervisor -> exact active dm-verity root -> descriptor-admitted composed service/admission layer -> protected pin public key + monotonic floor -> signed pin/cross/offline records -> exact opened provisioning script -> nine authenticated offline inputs -> Rust 1.98.1 provisioned tree and evidence`.

The Root-Admitter files still contain `CANDIDATE_FOR_OWNER_REVIEW`, `CANDIDATE_FOR_OWNER_APPROVAL`, "Candidate only" and `E_CANDIDATE_AUTHORITY`. They are immutable reviewed bytes, not unresolved final-design statuses. The 2026-09-19 owner decision closes their design status by exact commit/tree/subtree identity; the stop remains in place and continues to prohibit execution. Historical alternatives and the 22 closed FAIL/correction iterations are non-authoritative review history.

No authoritative `CANDIDATE`, `UNASSIGNED`, placeholder, circular self-admission, prose-only authority edge, resolver/network choice, undeclared executable/runtime-data dependency or unresolved trust-root dependency remains in this final design. `BOOTSTRAP_PINNING_DESIGN_PASS` is withheld only for independent review of one newly frozen integration SHA. That review is a certification step, not a missing design edge.

This audit is static documentation evidence only. No Root Admitter, UKI, dm-verity root, admission launcher, provisioning script, Rust tool, compiler or project verification program was executed.

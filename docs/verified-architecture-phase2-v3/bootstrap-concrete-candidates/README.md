# Concrete Bootstrap Trust-Root Candidates

Status: `BOOTSTRAP_TRUST_ROOT_CONCRETE_CANDIDATES_READY_FOR_OWNER_REVIEW`

Every new object is `CANDIDATE_FOR_OWNER_APPROVAL`. No candidate, signature or descriptive architecture authorizes execution. `BOOTSTRAP_PINNING_DESIGN_PASS` remains prohibited until independent review and explicit owner approval.

## Frozen candidate graph

The correction followed the required order: freeze artifact bytes; mechanically derive identities and the service closure; regenerate canonical records; independently compare them with actual bytes; then create detached signatures. The review-only private key was destroyed after signing and is absent from the package.

The signed graph is:

`pin record/signature -> cross-binding bytes/signature + offline manifest/signature + protected-store policy/floor + public key -> exact OCI identity/nine-layer vector + canonical service closure + measured service + launcher + script -> nine offline inputs`

The cross-binding cannot contain its own detached-signature hash without a cycle. The signed subordinate pin record binds that signature and the rest of the signed root graph. Every machine-authoritative edge is in a canonical signed record or a record cryptographically bound by the pin record.

## Measured-service candidate

`measured-execution-service.review-bytes` is mode `100644`, has no shebang and is review data. It arms one `EXIT` cleanup trap before the first temporary write; cleanup tests stage existence directly, closing the asynchronous post-mkdir marker race and confines all verification state to one dedicated stage. Before any launcher invocation it:

1. requires regular, non-symlink records and artifacts;
2. verifies domain-separated Ed25519 signatures on pin, cross-binding and offline-manifest records;
3. reconstructs the sole accepted canonical pin record from actual artifact digests and compares exact bytes;
4. validates every path, role, length and digest in the canonical service closure against the measured root;
5. reconstructs the sole accepted canonical cross-binding from actual service, launcher, script, closure, policy, public-key, offline-manifest and detached-signature bytes plus the exact image and nine-layer identities, then compares exact bytes;
6. hard-stops on candidate authority as `E_CANDIDATE_AUTHORITY`.

Exact-byte comparison rejects malformed JSON, alternate serialization, duplicate/reordered/unknown/missing fields, stale sequence/floor, substituted identities and incomplete records without relying on substring checks. The dedicated stage is removed on every reachable post-creation exit. The static failure-injection review is in `failure-injection-evidence.md`. These candidate bytes never authorize or invoke the launcher.

## Service closure

`measured-execution-service-closure.v1.bin` is the service-enforced canonical closure, mechanically derived from the frozen service, launcher and script command references and recursive ELF interpreter/DT_NEEDED dependencies against the approved OCI root. Records are `path NUL role NUL decimal-length NUL lowercase-sha256 LF`, sorted by raw path. `measured-execution-service-closure.md` is its human review rendering.

Kernel namespace enforcement, procfs/devfs, filesystem and hypervisor remain `NON_AUTHORITATIVE/OUT_OF_SCOPE` under the approved reduced guarantee. This candidate cannot resist their compromise.

## Protected store and seals

`protected-pin-store-policy.v1.json` defines the candidate root-owned read-only measured mount, offline Ed25519 key, two-copy recovery rule, append-only updates and monotonic sequence floor. `protected-pin-record.v1.json` is canonical compact sorted-key UTF-8 JSON with one LF, sequence/floor 1, and binds the cross-binding, its detached signature, offline manifest, its detached signature, policy and public key. Its own detached signature uses:

`bytes("V3BOOTSTRAP-SEAL:v1") || NUL || bytes("pin-record") || NUL || recordBytes`

Cross-binding and manifest signatures use the same construction with domains `cross-binding` and `offline-input-manifest`. The committed public key is candidate review evidence only. A later operational key ceremony must publish a persistent offline public key and regenerate/review every affected record and signature.

`offline-input-manifest.v1.bin` remains the exact nine-record offline input manifest. Authoritative execution has no DNS, live network, cache, mirror or host fallback.

## Permanent hostile regressions

`hostile-fixtures/VALID_SIGNATURE_WRONG_BINDING/` contains eight four-artifact signed roots under the same candidate key: stale script blob, stale launcher blob, substituted service, modified service closure, substituted detached signature, substituted pin-store, modified layer vector and substituted offline manifest. Both signatures for each case independently verify and its matching pin exact comparison passes, while cross exact semantic comparison fails before launcher invocation. `hostile-fixtures/expected-results.v1.json` records those outcomes.

## Scope

This is a one-shot documentation/review-data format patch. The service, launcher and provisioning script were not executed. No Rust input was provisioned, installed or compiled. No runtime, Gate, main merge, School or visual work was performed. Maximum state is `BOOTSTRAP_TRUST_ROOT_CONCRETE_CANDIDATES_READY_FOR_OWNER_REVIEW`.

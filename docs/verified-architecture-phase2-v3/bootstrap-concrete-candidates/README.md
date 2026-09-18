# Concrete Bootstrap Trust-Root Candidates

Status: `BOOTSTRAP_TRUST_ROOT_CONCRETE_CANDIDATES_READY_FOR_OWNER_REVIEW`

Every new object here is `CANDIDATE_FOR_OWNER_APPROVAL`. No candidate, signature or descriptive architecture authorizes execution. `BOOTSTRAP_PINNING_DESIGN_PASS` remains prohibited until independent review and explicit owner approval.

## A. Measured-execution service candidate

Artifact: `measured-execution-service.review-bytes`, mode `100644`, no shebang, 2,019 bytes, SHA-256 `37b5dd3944f5c5e658b2fe12d61af7c6073dd012317f0b5859254ff4021b6a12`, Git blob `d5aa6305313f3b0e033e2ae12ff4aafd0662a69e` before final commit. It is exact Bash review data, never invoked.

Implementation/product identity is these exact bytes executed inside the already approved MCR Linux/amd64 filesystem identity. It verifies the cross-binding and offline manifest signatures with pinned `/usr/bin/openssl`; then `/usr/bin/unshare --user --map-root-user --mount --pid --fork --kill-child --net` creates new user, mount, PID and network namespaces. The empty network namespace makes live network/DNS unavailable before the exact launcher and script are invoked. The service's immutable build is its raw bytes; provenance is the owner-approved repository lineage and reviewed Git blob.

Measurement inputs are the exact OCI index/manifest/config/layers and reconstructed root closure, cross-binding JSON/signature, offline manifest/signature, public key, service/launcher/script bytes and modes, input directory and mount policy. Measurement output is canonical evidence naming SHA-256/Git blob identities and the namespace vector. The signature-verified cross-binding is the authorization record. Until its `authority` state is owner-approved and a later execution GO exists, the service MUST NOT invoke anything. Missing/mismatched image, record, signer, signature, input, mode, namespace isolation or dependency fails closed with no launcher invocation.

Dependency/runtime closure is the exact 21-executable/41-file vector in `measured-execution-service-closure.md`, generated mechanically from service, launcher and script bytes against the approved OCI root. Kernel namespace enforcement, procfs/devfs, filesystem and hypervisor remain `NON_AUTHORITATIVE/OUT_OF_SCOPE` under the approved reduced guarantee. This candidate cannot resist their compromise.

Hostile tests substitute service bytes/blob/mode, image/root closure, cross-binding, signature/key, launcher/script, namespace flags, network namespace, executable/library/runtime data and user/mount/PID isolation. Each must fail before launcher invocation; a network socket/DNS probe inside the child must fail as `UNDECLARED_NETWORK_DEPENDENCY`.

## B. Protected pin-store and seal candidate

Product/implementation: an append-only directory of canonical cross-binding records and detached Ed25519 signatures, protected by an offline signing key and replicated read-only into the measured service. Candidate root public key: `offline-root-ed25519-public.pem`, 113 bytes, SHA-256 `f6a55be9526560a571067e58faa88c013e55308a7b5028222a2e7aa602b53e65`; algorithm Ed25519. Public-key fingerprint is that SHA-256. The private key was ephemeral, never committed, and destroyed after producing these candidate signatures. Therefore this candidate signature is review evidence only; it cannot be the operational update key. Owner approval must select a persistent offline key through a secret ceremony, publish only its public key and re-sign records before execution review.

Storage representation: compact JSON, sorted keys, UTF-8, no insignificant whitespace, exactly one LF. `cross-binding.v1.json` is sequence 1, 1,340 bytes, SHA-256 `9663a5e399d58d0baf8e4dabcb8f9175046c677d3683edb826b6c426761571fe`. Signature is raw 64-byte Ed25519 over `bytes("V3BOOTSTRAP-SEAL:v1") || NUL || bytes("cross-binding") || NUL || recordBytes`; detached candidate signature SHA-256 `6a3ec4d3466a2dce902ff48ed307d218b6701ad4c36b633d147514f3e59022d0`.

Protection/persistence: offline private key; public verifier/key and signed records copied into a root-owned read-only mount measured before service entry; two independently held read-only copies; monotonically increasing unsigned decimal `sequence`; protected minimum sequence and record SHA-256 in the measured configuration. Sequence below floor, same-sequence/different bytes, unknown key, bad signature, corrupt/extra field or writable store fails closed. Update requires new reviewed record, higher sequence, offline signature, independent review, owner approval and atomic floor advance. Recovery restores a byte-identical signed record at or above floor from an independent copy. Rollback never restores an older floor.

Verifier identity is `/usr/bin/openssl` from the approved OCI image, exact bytes and dynamic closure in the closure inventory. Verification uses `openssl pkeyutl -verify -pubin -rawin`; no private key enters execution. Hostile tests cover rollback, sequence collision, key/signature substitution, truncation, field addition/removal, writable mount, stale floor, copy equivocation and verifier/library replacement.

## C. Offline content-addressed delivery seal chain

`offline-input-manifest.v1.bin` is the complete canonical nine-record input set: 963 bytes, SHA-256 `30044b7453c89eb195df394a0236faf5ef7c7ec4ccf8dbe20766f5690d5f13e3`. Each record is `raw UTF-8 basename || NUL || decimal byte length || NUL || lowercase SHA-256 || LF`; records are sorted by unsigned raw basename bytes. Names cannot contain slash, backslash, NUL, dot segments or non-UTF-8. Duplicate or case/normalization collision fails. Exactly nine records and names are permitted; missing or extra records/files fail.

Content addressing is SHA-256 of exact bytes. The nine names bind Rust key, signed manifest/checksum/signature, rustc/cargo/std archives, canonical license manifest and expected checksum. The future script independently checks each approved digest and the exact name set.

Signature is raw 64-byte Ed25519 over `bytes("V3BOOTSTRAP-SEAL:v1") || NUL || bytes("offline-input-manifest") || NUL || manifestBytes`; candidate signature SHA-256 `79a7ada223b4fb1c7e291ece604b978466e7309134f2017f7223a5fb2b1ca4d1`. Signer/verifier is the same candidate public identity and exact OpenSSL verifier above.

The seal is bound into cross-binding sequence 1. Later records must bind manifest hash/length, public-key hash, image, service, launcher and script. Revocation is an offline-root-signed higher-sequence record naming the revoked manifest and replacement or terminal stop. Protected floor enforces freshness; absent current non-revoked record is a hard stop. No cache, mirror, host file, network or DNS fallback exists. Hostile tests replay old sequence, substitute bytes at same digest claim, add/remove/rename files, change order/encoding, replace signature/key/verifier, corrupt manifest and attempt network recovery. Each yields fail closed before launcher.

## D. Exact cross-binding

`cross-binding.v1.json` binds approved base-image identities/closure, exact service/launcher/script bytes and blobs, offline manifest hash/length, public key, sequence and `network=DENIED`. No prose identity can substitute. Its signature chain and protected floor bind the graph:

`approved OCI digest -> approved root closure -> measured service -> signed cross-binding/floor -> exact launcher -> exact script -> signed nine-record offline manifest -> exact nine inputs -> Rust verification/provisioning design`.

Any newly discovered authoritative object remains a candidate and yields `HARD STOP - BOOTSTRAP_TRUST_ROOT_INCOMPLETE` until concrete bytes, provenance, review and owner approval exist.

## Scope

This package was generated as data only. The service, launcher and provisioning script were not executed; no Rust input was downloaded for execution, installed or provisioned. Maximum state is `BOOTSTRAP_TRUST_ROOT_CONCRETE_CANDIDATES_READY_FOR_OWNER_REVIEW`, not design PASS. No compilation, runtime, Gate, merge, School or visual work is authorized.

# Offline Secure Boot Signing Ceremony Design and Storage-Policy Stop

Status: `OWNER_DECISION_REQUIRED`

Basis: accepted custody hard stop `7adabe83c1c04a9b416d02a59cd4e7bc176ee38c`; owner designation of the Owner as human offline custodian; unchanged Root-Admitter subtree `cd03b2286e57b6ee5580f3b24b32cbb7678d980c`.

No private key was generated, held, viewed or transported by the build/review side. No certificate, unsigned successor UKI or signing-request instance was produced because the expected public identity and its approved custody policy do not yet exist. No cloud account/resource was created and no approved byte was changed or executed.

## Result and exact next boundary

The ceremony protocol is complete below, but applying it introduces one expressly unresolved trust-model choice: the concrete offline storage medium, encryption/unlock method and backup/recovery copy count. Those facts determine who can exercise the Secure Boot root and whether loss or compromise is recoverable. They cannot be inferred by the executor.

A canonical signing-request instance cannot be finalized before the offline ceremony generates the public certificate: `expectedSecureBootCertificateDerSha256` is mandatory and placeholders are forbidden. Building an unsigned successor before that identity exists would not advance an independently signable request and risks freezing an artifact without its authority edge. Work therefore stops before authoritative key generation and before successor construction, exactly at the Owner-confirmation gate required by the custody decision.

## Roles and separation

- **Owner / human offline custodian:** sole unlock and signing authority; controls all authoritative private-key copies; gives explicit per-request approval; returns only signed UKI, public certificate and non-secret evidence.
- **Build/review side:** creates deterministic unsigned UKI and canonical request only after receiving the approved public certificate; never receives a private key; verifies returned public artifacts.
- **Cloud runtime:** receives only the certified signed UKI, public policy and non-secret evidence; cannot request unattended signing and never receives private bytes.
- **Independent reviewer:** verifies manifests, public signatures, provenance, blast radius and hostile evidence; has no signing authority.

No role admits itself. Firmware trusts the sole public certificate; the certificate authenticates the successor UKI; the successor adaptation init constructs and validates the canonical environment; the exact existing downstream init and Root Admitter enforce their unchanged boundaries.

## Deterministic key-generation profile

After storage policy approval, the Owner performs generation in an offline, freshly prepared environment with networking physically or administratively absent and verifies that no unapproved input/output files are present.

- algorithm: RSA;
- modulus: 3072 bits;
- public exponent: 65537;
- signature use: UEFI PE/COFF Authenticode through the pinned `sbsign` implementation;
- certificate: self-signed X.509 v3, SHA-256 with RSA, critical Basic Constraints `CA:FALSE`, critical Key Usage `Digital Signature`, fixed Owner-approved subject, serial derived by the ceremony profile, explicit UTC validity window;
- entropy: kernel CSPRNG seeded from the offline machine's physical entropy sources; generation stops unless the OS reports the CSPRNG initialized; exact platform/OS/tool identities and entropy readiness evidence are recorded, but raw entropy and private parameters are never recorded;
- private-key encoding at rest: encrypted PKCS#8 or non-exporting hardware form selected by the storage decision; unencrypted private-key files are forbidden outside volatile ceremony workspace;
- public outputs: PEM and DER certificate, DER SHA-256, SPKI SHA-256, subject, issuer, serial, validity, key algorithm/size/exponent and certificate text rendering.

Determinism applies to policy, command vectors, canonical evidence and artifact verification. Key bytes are intentionally random and are not reproducible. Two runs must not generate the same key. “Reproducible key generation” would be a security defect.

## Canonical request

The build side emits compact sorted-key UTF-8 JSON with one LF and no duplicate keys. The instance schema is `v3.successor-uki-signing-request.v1`. Mandatory fields:

- `schema`, fixed as above;
- `requestId`, SHA-256 of domain-separated canonical request core;
- `antiStaleNonce`, 32 random bytes represented as lowercase hex, unique and never reused;
- `createdAt`, UTC RFC3339;
- `expiresAt`, UTC RFC3339, no more than 24 hours after creation;
- `purpose`, exact `V3_GCP_MINIMAL_SUCCESSOR_UKI`;
- `candidateCommit`, `candidateTree`, `candidateParent`;
- `unsignedUkiSha256`, `unsignedUkiByteLength`, `unsignedUkiGitBlob`, `unsignedUkiPath`;
- exact kernel/initramfs/cmdline/adaptation-init/downstream-init identities;
- `expectedSecureBootCertificateDerSha256`, `expectedSecureBootSpkiSha256`;
- exact build-recipe/toolchain/inventory identities;
- exact downstream Root-Admitter subtree, supervisor and dm-verity root identities;
- `executionAuthorized:false`.

The domain for `requestId` is ASCII `V3-SUCCESSOR-UKI-SIGNING-REQUEST:v1 NUL` followed by canonical core bytes with `requestId` omitted. The request is signed only after all mandatory identities exist. Empty, placeholder, unknown, floating or mutable identity fields are forbidden.

## Signing ceremony

1. Build/review side produces the exact unsigned successor UKI and request in a clean deterministic build, then publishes only those non-secret artifacts.
2. Transfer into the offline environment exactly two authoritative inputs: the unsigned UKI and request. Transport media is scanned and mounted read-only where possible. Any extra authoritative input fails closed.
3. Offline verifier parses strict canonical JSON, reconstructs and checks `requestId`, checks current time within the request window, checks nonce against the offline consumed-request ledger, and verifies candidate/head/tree/path/build identities.
4. Hash and length-check the unsigned UKI from bytes. Verify exact PE/COFF structure, exact embedded kernel, initramfs and command line, exact adaptation-init and downstream-init identities, and absence of an existing Authenticode signature.
5. Verify request certificate/SPKI identities equal the public certificate paired with the retained private key. Prove private/public match without exporting private material.
6. Present to Owner the request ID, purpose, candidate commit/tree, unsigned digest/length, expected certificate fingerprint and expiry. Ambiguity, mismatch, expiry or missing explicit Owner approval stops.
7. Owner explicitly authorizes this one request. Record only non-secret approval evidence: request ID, decision, UTC time and ceremony operator role. Do not record passphrases, private paths containing secrets or key material.
8. Materialize or unlock the retained key only through the approved storage procedure. Sign the exact verified unsigned UKI using pinned signer/toolchain and fixed signing-time policy. No network, timestamp service or alternate certificate is permitted.
9. Immediately verify offline: Authenticode structure; exactly one expected signer; signature cryptographically valid against the approved public certificate; reconstructed unsigned PE digest equals the requested unsigned UKI; signed artifact embeds the exact requested kernel/initramfs/cmdline; wrong-key verification fails.
10. Mark the nonce/request ID consumed in the offline append-only ledger before export. A repeated, expired or already-consumed request never signs.
11. Produce canonical non-secret evidence and export exactly: signed UKI, public certificate PEM/DER, request, evidence and public tool/provenance inventory. Exporting a private key, key backup, passphrase, session secret or volatile workspace is forbidden.
12. Return the private key to approved offline custody. Verify volatile plaintext workspace removal under the storage policy. Record custody return without exposing secret values.
13. Build/review side independently verifies signed UKI digest/length; exact signer; certificate/SPKI identity; exact correspondence to requested unsigned PE content; request ID/nonce; embedded identities; evidence canonicalization and signature; then performs the complete successor hostile suite.

## Canonical non-secret evidence

Schema `v3.successor-uki-offline-signing-evidence.v1`, compact sorted-key UTF-8 JSON with one LF:

- request ID, nonce, purpose, candidate commit/tree;
- unsigned and signed UKI SHA-256/length;
- certificate DER/SPKI SHA-256 and public certificate metadata;
- pinned signer and verifier identities;
- verified embedded section identities;
- approval decision/time and operator role, never operator secret;
- consumed-ledger record digest and monotonic sequence;
- exact output inventory;
- `privateKeyExported:false`, `networkPresent:false`, `unexpectedInputCount:0`;
- custody-return result and non-secret storage-policy ID;
- stable outcome/reason code.

Evidence does not prove custody by assertion. It is accepted only with independently verified public artifacts and the approved storage-policy mechanics.

## Fail-closed reasons

- `E_REQUEST_NONCANONICAL`, `E_REQUEST_SCHEMA`, `E_REQUEST_ID`;
- `E_REQUEST_EXPIRED`, `E_REQUEST_REPLAY`, `E_REQUEST_PURPOSE`;
- `E_CANDIDATE_IDENTITY`, `E_UNSIGNED_DIGEST`, `E_UNSIGNED_LENGTH`, `E_UNSIGNED_STRUCTURE`;
- `E_EMBEDDED_KERNEL`, `E_EMBEDDED_INITRAMFS`, `E_EMBEDDED_CMDLINE`, `E_ADAPTER_INIT`, `E_DOWNSTREAM_INIT`;
- `E_PUBLIC_IDENTITY`, `E_PRIVATE_PUBLIC_MISMATCH`, `E_SIGNING_INTENT`, `E_OWNER_APPROVAL`;
- `E_UNEXPECTED_INPUT`, `E_NETWORK_PRESENT`, `E_SIGNER_IDENTITY`;
- `E_SIGNATURE`, `E_SIGNATURE_COUNT`, `E_SIGNED_CORRESPONDENCE`, `E_OUTPUT_INVENTORY`;
- `E_LEDGER_COMMIT`, `E_CUSTODY_RETURN`.

Any failure occurs before export and produces no authoritative signed artifact. A signature produced before a later failed ledger/custody step is quarantined offline and never exported.

## Hostile ceremony tests

The certification suite must prove rejection of: changed UKI digest/length; wrong candidate/tree/path; stale or replayed request; duplicate nonce; wrong purpose; wrong/extra certificate; public/private mismatch; unexpected signing input; ambiguous or absent Owner approval; pre-signed input; substituted initramfs/kernel/cmdline; wrong adaptation or downstream init; wrong signer tool; invalid/stale signature; signed output not corresponding to requested unsigned PE; extra exported file; consumed-ledger write failure; custody-return failure. Tests use disposable non-authoritative test keys and fixtures, never the production private key. Test keys cannot confer candidate authority.

## Key lifecycle policy requiring Owner choice

Common rules independent of medium:

- one active successor Secure Boot authority;
- no convenience overlap with the retired destroyed key;
- signing only for an unexpired, unconsumed canonical request with explicit Owner approval;
- no unattended, cloud or CI signing;
- rotation creates a new independently approved sole-key policy and retires the old key after transition;
- suspected compromise immediately stops signing, quarantines outputs, records revocation intent, removes the certificate from future sole-key policy and requires a new ceremony;
- loss without recovery copy makes future signing impossible and triggers rotation, never bypass;
- backups, if approved, are authoritative private-key copies and obey identical encryption, access and audit rules.

The unresolved choices are:

| Policy | Copies | Recovery | Trust/cost consequence |
|---|---:|---|---|
| `SINGLE_OFFLINE_COPY_NO_BACKUP` | 1 | loss forces key rotation and new firmware policy | smallest attack surface; no recovery; requires an Owner-controlled medium already available at zero mandatory cost |
| `PRIMARY_PLUS_ONE_OFFLINE_BACKUP` | 2 | Owner restores from separately stored encrypted backup | higher resilience and larger private-key attack surface; requires two approved media/locations and a separation rule |
| `NON_EXPORTING_HARDWARE_TOKEN` | device-defined | replacement/backup depends on token capability | strong non-exportability but cannot be assumed zero-cost or available; exact model/tool support must be approved |

For file-based media, encryption algorithm/KDF, passphrase custody, medium type, physical storage location class, wipe semantics and backup separation all remain Owner choices. The executor cannot safely invent them.

## Owner decision required

Approve one policy above and provide the following non-secret decisions:

1. storage policy ID and medium class;
2. authoritative copy count;
3. encryption/non-exportability mechanism;
4. sole unlock/sign authority (Owner, already designated) and whether a second recovery person exists;
5. passphrase/recovery-material custody model without sending the secret;
6. physical separation requirement for any backup;
7. loss, compromise, revocation and rotation trigger;
8. whether existing zero-cost hardware/media is available or whether lack of such media blocks the zero-cost constraint;
9. certificate subject and UTC validity window;
10. offline environment class and signer/verifier tool availability.

After approval, the Owner generates the key offline and returns only the public certificate and non-secret generation evidence. Then the build side can freeze the exact expected public identity, build the unsigned successor UKI, instantiate the canonical signing request and stop at the signing boundary.

Until those choices are approved, `OFFLINE_SECURE_BOOT_SIGNING_CEREMONY_READY` and `NEW_SECURE_BOOT_SUCCESSOR_CANDIDATE_READY_FOR_OWNER_REVIEW` are withheld. No key generation, UKI build/signing, cloud deployment, Bootstrap execution, Rust provisioning, Structural Enforcement, Authority Routing, merge, School or visuals work may proceed.

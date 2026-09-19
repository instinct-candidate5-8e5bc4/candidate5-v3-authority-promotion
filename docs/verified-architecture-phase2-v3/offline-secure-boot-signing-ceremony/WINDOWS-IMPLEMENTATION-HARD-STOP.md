# Windows Ceremony Implementation and Environment-Evidence Hard Stop

Status: `OWNER_DECISION_REQUIRED`

Basis: independent FAIL at `5ece95a025529dc8bf5ae4348c0cc674dbbbfbbf`. No private key was generated, no runbook was executed and no cloud or signing action occurred.

## Directory authority and inert design inputs

This file is the sole current status document in this directory. `README.md` and `WINDOWS-CEREMONY.md` are retired historical drafts. Both PowerShell files are inert and begin with unconditional throws. No ceremony, signer, verifier, qualification or key-generation executable is currently approved.

The JSON Schemas `signing-request.schema.v1.json`, `signing-evidence.schema.v1.json` and `consumed-ledger.schema.v1.json` remain non-executable design inputs only. Their presence does not validate any instance and grants no ceremony readiness or authority. They may be consumed only by a future pinned validator that passes qualification and independent review.

## Finding accepted

The PowerShell template at the parent SHA is not an implementation of its ceremony contract and must not be run. It is retired. Specifically, it lacks requestId reconstruction, schema loading, duplicate-key rejection, canonical JSON, the hash-chained atomic ledger, schema-complete evidence, correct evidence-core signing, exact certificate construction, PE section/signature verification, safe quarantine/export sequencing and measured custody/network/BitLocker state. Owner confirmation cannot repair those defects.

Those mechanics can be implemented only after selecting and pinning a Windows validation runtime. Windows PowerShell 5.1 alone does not provide the committed JSON Schema 2020-12 validator, duplicate-key-preserving JSON parser, RFC 8785-style canonicalizer, Authenticode PE digest/certificate-table parser, UEFI signature verifier or deterministic atomic-ledger utility that the contract requires. Writing those security-critical primitives ad hoc inside a copy/paste shell script would create a new unpinned verifier/toolchain and would not constitute independent proof.

## New contradiction with the requested readiness sequence

The reviewer requires, before ceremony-ready status:

1. actual SHA-256 identities of Owner-station `signtool.exe`, PowerShell, `certutil.exe` and every validation runtime;
2. exact Windows edition/build and BitLocker capability;
3. actual clean removable-volume identity and BitLocker protection state;
4. a disposable-key fixture proving that this exact SignTool binary's EFI PE output is accepted by an independent UEFI Secure Boot verifier and rejects unsigned, wrong-key and modified images;
5. exact validator implementation/provenance capable of strict schemas, duplicate rejection, canonical request/evidence/ledger bytes and PE correspondence.

The build/review side has no Windows station and cannot observe or hash those binaries. The owner clarification forbids requiring Linux and forbids authoritative key generation before review, but it does not provide an executable Owner-station evidence collection path or authorize a disposable-key test run before the ceremony passes review. Invented tool hashes, assumed Windows builds or claimed UEFI results would be false load-bearing evidence.

Therefore `OWNER_CONFIRMATION_REQUIRED` is not yet the correct status. The exact prior-to-confirmation machine evidence itself needs an authorized collection step.

## Safe staged resolution

Authorize a **non-authoritative Windows qualification run** on the Owner station before any production key generation. It uses no production key and no cloud resource. The qualification package must:

1. collect exact Windows edition/build, PowerShell host/version/path/SHA-256, `signtool.exe` path/version/SHA-256, `certutil.exe` path/version/SHA-256 and Windows SDK installer/package identity;
2. collect BitLocker capability and a redacted removable-volume report containing no recovery key, password, serial number or personal path;
3. install/select one explicit zero-cost validation runtime, then return its exact package/source/binary identities. Recommended boundary: a reviewed self-contained Windows verifier executable built from committed source, rather than shell reimplementation;
4. with a disposable test key only, sign a non-authoritative EFI PE fixture through exact SignTool, verify it through an independently pinned UEFI Secure Boot verifier, and return public fixture/key/evidence only;
5. run hostile unsigned, wrong-key, changed-byte, multiple-signer and pre-signed fixtures;
6. return only non-secret machine inventory and disposable public artifacts through the ordinary review pipeline.

This qualification does not select storage secrets, generate the production key, authorize signing or confer firmware authority. Its disposable key must be destroyed after fixture generation and must be explicitly barred from every production policy.

## Correct implementation architecture after qualification

The next ceremony candidate must replace the retired shell template with one reviewed Windows-native verifier/ceremony executable that mechanically owns the complete transaction:

- strict UTF-8 JSON parser rejecting duplicate keys and unknown/missing fields;
- schema validation against pinned request/evidence/ledger schemas;
- compact sorted-key canonicalization and exact-byte comparison;
- requestId reconstruction over `V3-SUCCESSOR-UKI-SIGNING-REQUEST:v1 NUL || canonicalCore`;
- RFC3339-Z parsing and <=86,400-second window;
- PE parsing before signing: valid structure, no certificate table, exact section identities;
- exact SPKI-derived certificate serial and exact extensions/validity, mechanically verified from DER;
- staging in a private quarantine directory, with an empty export directory until every late gate succeeds;
- exact signer binary identity and one-signer Authenticode output;
- independent Authenticode digest/certificate/section correspondence and pinned UEFI verification;
- schema-complete canonical evidence, exact PSS signed core, immediate public verification;
- canonical ledger keyed by requestId and nonce with sequence/previous digest, write-through temp, atomic replace and fail-closed recovery;
- measured network-interface state, BitLocker protection, volume identity, non-exportable imported key, empty inbox/outbox inventories and volatile cleanup;
- one final atomic publication only after ledger, evidence and custody-return success.

The Owner runbook then becomes a short wrapper that invokes this exact pinned executable and compares the full requestId. It must not implement security primitives itself.

## Nine non-secret Owner facts

After qualification and implementation PASS, Owner confirms exactly nine items:

1. Windows edition/build;
2. BitLocker To Go capability;
3. one existing dedicated removable drive at zero added cost;
4. single encrypted PFX/no-backup risk;
5. separate custody of PFX password and BitLocker recovery material;
6. exact qualified SDK/SignTool identity;
7. exact qualified verifier identity;
8. fixed certificate subject/validity;
9. disconnected Owner-controlled physical storage location class.

## Owner decision required

Authorize the non-authoritative Windows qualification run and choose how its reviewed package reaches the Owner station:

- Owner downloads one public qualification ZIP/patch from the repository, runs one qualification command while online only for tool installation if needed, disconnects for disposable-key/UEFI tests, and returns only the generated non-secret bundle; or
- designate another Windows operator/station for qualification, without making that operator a production key custodian.

Also authorize disposable test-key generation and destruction solely for UEFI compatibility fixtures. This does not authorize the production key.

Until this qualification path is approved and its machine evidence independently passes, the ceremony cannot honestly be marked ready and the ten implementation defects cannot be closed with source prose alone. No production key, successor UKI signing, cloud deployment, Bootstrap execution, Rust provisioning, Structural Enforcement, Authority Routing, merge, School or visuals work may proceed.

## Enforced retirement CI

The exact-head workflow `.github/workflows/v3-structural-enforcement-preflight.yml` invokes `assert-retired-state.py` in the named step `Retired Windows ceremony entrypoints are inert`. Pull-request path filters include the entire ceremony directory and the workflow itself. This makes retirement-state enforcement part of exact-head CI rather than an uninvoked script.

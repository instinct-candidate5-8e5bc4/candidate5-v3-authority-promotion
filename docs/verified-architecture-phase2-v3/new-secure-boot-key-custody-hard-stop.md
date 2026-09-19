> SUPERSEDED / HISTORICAL / NON-AUTHORITATIVE. The current key-custody and successor design is `minimal-successor-uki-design.md`. Preserve this record for review provenance only; do not use its status, blockers or next-step instructions as current authority.

# New Secure Boot Key Custody Hard Stop

Status: `OWNER_DECISION_REQUIRED`

Basis: accepted signing-key hard stop `cf22132569c3bf74682f1025145328b04e92363a`; owner authorization for a new Secure Boot key ceremony with mandatory offline retention and reuse; unchanged Root-Admitter subtree `cd03b2286e57b6ee5580f3b24b32cbb7678d980c`.

No new private key was generated. No successor UKI was built or signed. No vault entry, repository secret, CI secret, cloud key or paid service was created. No approved byte was changed or executed.

## Exact blocker

The authorized ceremony requires an auditable cycle:

`OFFLINE STORAGE -> AUTHORIZED SIGNING CEREMONY -> RETURN TO OFFLINE STORAGE`

The private key must remain reusable for future authorized successor UKIs, must never enter Git, CI, evidence, cloud images, ordinary project storage, messaging or attachments, and cannot depend on a paid HSM/KMS/service.

The secure custody surface currently available to this executor supports encrypted credential fields and browser-only secret filling. It does not expose a generic asymmetric-key item, a non-exporting Secure Boot signing operation, or an authorized way to materialize a retained private key into a local signing process. A PEM key could be misclassified into a credential field, but after storage the only supported use would be filling a browser form. The successor build requires a local PE/COFF Authenticode signer (`sbsign --key <private-key-file>` or an equivalent signing API). Browser form filling cannot provide that operation without disclosing the key to an unapproved web surface or ordinary storage.

Generating a key locally, signing once, and then placing it into an unreadable credential field would not meet the lifecycle requirement: future `OFFLINE STORAGE -> AUTHORIZED SIGNING CEREMONY` retrieval is unproven and currently unavailable. Retaining a local file, encrypted archive, environment variable or repository/CI secret would violate the explicit custody boundary. Automatically destroying it after first signing is explicitly superseded and forbidden.

Therefore a safe, reusable, zero-cost custody mechanism cannot currently be established within the authorized threat model and available execution surface. The owner's stop condition applies before key generation.

## Why candidate construction must not begin

Key generation is irreversible trust-anchor creation. Generating before custody is closed would create one of two unauthorized outcomes:

1. destroy-after-signing, contradicting mandatory retained-key lifecycle; or
2. leave private bytes in a location not approved for offline custody.

A structural UKI candidate under an ephemeral or temporary key is also forbidden by the decision. Building unsigned bytes first would not solve the missing retained-authority path and would risk treating a review-only artifact as the concrete candidate.

## Required custody properties

Any approved mechanism must provide all of these mechanically, not by prose:

- encrypted-at-rest storage for an RSA-3072 private key;
- an agent-designated item separate from user login credentials;
- no private bytes in repository, CI, evidence, cloud image, ordinary project storage, messages or attachments;
- authorized signing use by a local PE/COFF signer without exposing private bytes to an external website;
- explicit checkout/use/return audit events without returning key contents in reports;
- offline or equivalently disconnected custody between ceremonies;
- zero mandatory monetary cost;
- backup/recovery, rotation, revocation and compromise semantics;
- proof that future authorized successor ceremonies can invoke the retained key;
- deletion/revocation behavior that is explicit and auditable.

## Rejected workarounds

| Workaround | Reason rejected |
|---|---|
| store PEM in a generic password field | no supported non-browser signing/retrieval path; wrong item semantics; lifecycle cannot be completed |
| keep PEM in `/tmp`, home or an encrypted local archive | ordinary ephemeral/project storage, not approved offline custody; rebuild/loss and access controls are inadequate |
| repository or CI secret | expressly forbidden; CI becomes signing authority |
| cloud KMS/HSM or certificate service | no cloud account activation authorized; paid dependency forbidden; GCP KMS is not the approved zero-cost custody path |
| hardware token owned by a person | no such device/custodian is in the authorization or available execution environment; would need a new custody owner and procedure |
| generate, sign and destroy | explicitly superseded because future successor signing is required |
| ephemeral review key | explicitly forbidden as the authoritative successor path |
| transmit PEM through parent/peer message | secret disclosure and expressly forbidden transport |

## Recertification blast radius if custody is later solved

No transition artifact has been created yet. The expected categories remain:

- `BYTES_CHANGED`: new certificate; successor init; successor initramfs; successor unsigned and signed UKI; successor UKI inventory/build/reproduction/hostile artifacts.
- `AUTHORITY_BINDING_CHANGED`: sole-key UEFI policy; external boot binding; successor cross-binding/authority-chain record; key lifecycle and transition policy.
- `EVIDENCE_ONLY_CHANGED`: build provenance, reproducibility evidence, exact dependency closure, GCP zero-cost deployment gate and hostile results.
- `UNAFFECTED_BYTE_IDENTICAL`: approved downstream init `6f6b504525b8f4f87a36422e5cc48c570220f1103514a204c36f3d70a8f2663f`; supervisor `a2d33af1aa9ff076d4dc2e6e5f90be8f95cacc6a45a8559263035758e17ff6eb`; dm-verity image/tree/root `71e3290f...` / `82423acc...` / `c8f1ca41...`; composed service, admission layer, protected pin/offline graph, provisioning script and Root-Admitter subtree `cd03b2286e57b6ee5580f3b24b32cbb7678d980c`.

This classification is planning only. No category-1 or category-2 artifact exists until custody is authorized and implemented.

## Owner decision required

Choose a zero-cost custody mechanism that can actually perform the retained-key signing lifecycle:

1. provide/authorize a secure generic-key vault capability with a non-exporting local signing operation or controlled file materialization to the signer, plus auditable checkout/return;
2. designate an offline human custodian and hardware/storage medium, with a procedure for receiving only unsigned UKI digest/bytes and returning signed public artifacts without transporting the private key through messages or repository storage; or
3. authorize a specific zero-cost non-cloud local keystore/signing mechanism and its encrypted storage, unlock authority, backup and recovery model.

The decision must name who or what can unlock/sign, how the executor invokes it, and where the retained key resides between ceremonies. A storage destination without a usable authorized signing path is insufficient.

Until custody is selected and independently reviewed, `NEW_SECURE_BOOT_SUCCESSOR_CANDIDATE_READY_FOR_OWNER_REVIEW` cannot be claimed. No private key generation, UKI build/signing, cloud deployment, Bootstrap execution, Rust provisioning, Structural Enforcement, Authority Routing, merge, School or visuals work may proceed.

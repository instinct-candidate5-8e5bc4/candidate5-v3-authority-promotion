> SUPERSEDED / HISTORICAL / NON-AUTHORITATIVE. The current key-custody and successor design is `minimal-successor-uki-design.md`. Preserve this record for review provenance only; do not use its status, blockers or next-step instructions as current authority.

# Minimal Successor UKI Signing-Key Hard Stop

Status: `OWNER_DECISION_REQUIRED`

Basis: owner authorization for a minimal successor UKI after accepted lifecycle hard stop `173e6ee6215988aee0df0131b4577543e982485d`; unchanged Root-Admitter subtree `cd03b2286e57b6ee5580f3b24b32cbb7678d980c`.

No candidate UKI was built or signed. No key was generated, requested, recovered or imported. No approved byte was changed or executed. No cloud account, billing profile, trial, image, disk or VM was created.

## Exact blocker

The successor is required to be signed with the approved sole Secure Boot certificate whose DER SHA-256 is:

`ada879f4c86a9298b31027a615a9064570a3b0745abb13f4db8e6759b2ef68ae`

The repository contains the corresponding public certificate:

`root-admitter-candidate/uki/secure-boot-db-candidate.pem`

It does not contain the corresponding private RSA-3072 signing key. The approved build record states explicitly:

> the reviewed offline RSA-3072 key ... The private key is destroyed.

The exact prior signing command is preserved only as a recipe with a placeholder:

`LD_PRELOAD=<pinned-libfaketime> FAKETIME='@2026-09-18 00:00:00' sbsign --key <offline-key> --cert secure-boot-db-candidate.pem --output root-admitter-signed.efi root-admitter-unsigned.efi`

A new UKI cannot be signed by a public certificate. RSA signing requires the destroyed private key. The prior signed UKI's signature cannot be transferred to changed successor bytes. Reusing it would fail Authenticode verification because the PE/COFF digest changes when the initramfs changes.

Therefore these requirements cannot all be satisfied:

1. successor UKI bytes change to include the cloud adaptation init;
2. fresh exact successor UKI certification and signature identity;
3. signature under the exact approved sole certificate `ada879f...`;
4. no recovery or availability of its destroyed private key;
5. no firmware-policy change or new key ceremony.

This is a cryptographic impossibility, not a mechanical build problem.

## Why no internal correction exists

| Attempt | Result |
|---|---|
| sign with the public PEM | impossible; it contains no private signing exponent |
| copy the old UKI signature | invalid over changed PE/COFF bytes |
| leave the successor unsigned | rejected by `rejectUnsigned=true` |
| use a newly generated key while retaining old `db` | wrong signer; rejected by the sole-key policy |
| add a second certificate to `db` | violates `dbEntryCount=1` and the no-firmware-relaxation decision |
| replace the sole `db` certificate with a new one | changes the firmware verification identity and requires owner authorization, new policy/binding and certification |
| use a review-only self-signature outside Secure Boot | does not authenticate firmware boot of the successor UKI |
| ask a cloud provider to attest the image | provider attestation is not the approved sole-key Secure Boot signature |

No hostile suite can certify a signed successor until an authorized private signing identity exists. Fabricating a signature or silently generating a replacement key would create a new trust anchor without owner authority.

## Preserved downstream identities

The blocker occurs before any successor construction. The following remain unchanged and are not reopened:

- old signed UKI: `7f5c339270f486a107285e9abfe0150f6e95bef0456668f34f79401f81dcc836`;
- old initramfs: `64929fe646c45d5203c3bf29065613367544576c629842fdde7a44394b1ad219`;
- old downstream `/init`: `6f6b504525b8f4f87a36422e5cc48c570220f1103514a204c36f3d70a8f2663f`;
- native supervisor: `a2d33af1aa9ff076d4dc2e6e5f90be8f95cacc6a45a8559263035758e17ff6eb`;
- dm-verity root: `e6ddb15916e12220c6117b6abded6550acd77df9379101662d8af78c7396dad7`;
- Root-Admitter subtree: `cd03b2286e57b6ee5580f3b24b32cbb7678d980c`.

## Owner decision required

Choose one signing-authority path:

1. **New operational sole-key ceremony.** Authorize generation of a new offline RSA signing key and self-signed certificate, replacement of the sole GCP `db` entry with that certificate, and fresh certification of the successor UKI. The new certificate's exact DER identity, generation inputs, custody/destruction rule, build provenance, successor UKI signature, UEFI policy and external boot binding must all receive independent review. The old key is not recovered and the old UKI receives no authority under the new sole-key policy unless explicitly re-signed and reviewed.
2. **Authorized external signer holding the exact old private key.** Identify a source-of-truth signing service or custodian that genuinely retains the private key corresponding to `ada879f...`, define its authorization and reproducible signing evidence, and authorize use for this successor. This conflicts with the current certified statement that the private key was destroyed unless that statement is corrected with evidence.
3. **Separate review certificate only, production ceremony later.** Authorize a newly generated ephemeral review key to certify candidate structure now, with the explicit result remaining non-bootable and ineligible for `SUCCESSOR_UKI_CONCRETE_CANDIDATE_READY_FOR_OWNER_REVIEW` until a later operational sole-key ceremony regenerates and reviews all affected identities.

Option 1 is the clean path consistent with the earlier Bootstrap design's requirement for a separately authorized offline-key ceremony before execution. It is still a new trust anchor and cannot be assumed.

Until the owner selects a signing path, `SUCCESSOR_UKI_CONCRETE_CANDIDATE_READY_FOR_OWNER_REVIEW` cannot be claimed. No UKI build, signing, cloud deployment, Bootstrap execution, Rust provisioning, Structural Enforcement, Authority Routing, merge, School or visuals work may proceed.

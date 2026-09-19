> RETIRED / HISTORICAL / NON-AUTHORITATIVE. Do not use this document as a ceremony, readiness claim, Owner-confirmation gate or execution instruction. The sole current status and next boundary are in `WINDOWS-IMPLEMENTATION-HARD-STOP.md` (`OWNER_DECISION_REQUIRED`). No ceremony or verifier executable is approved.

Status: `RETIRED_HISTORICAL_NON_AUTHORITATIVE`

## Historical draft preserved for review provenance
> Superseded by `WINDOWS-CEREMONY.md` and the strict request/evidence/ledger schemas in this directory. Historical draft below is non-authoritative.

# Windows Offline Secure Boot Signing Ceremony


This is the authoritative ceremony contract. It supersedes the earlier draft at parent `33190143c3b5584bc60df633b3abee8b16ea9388`. The Owner is the sole offline human custodian. No private key is generated before independent review and Owner confirmation of the Windows/BitLocker policy. No private material enters Git, CI, cloud, repository/evidence packages, messages, browser/password vaults or ordinary project storage.

## Concrete Windows mechanism

- station: Owner-controlled Windows 11 Pro/Enterprise/Education, disconnected during generation/signing;
- signer/verifier: Microsoft SignTool from Windows SDK 10.0.26100.0 at `%ProgramFiles(x86)%\Windows Kits\10\bin\10.0.26100.0\x64\signtool.exe`; exact executable SHA-256 and file version are recorded before generation and frozen into candidate evidence;
- key/certificate generation: reviewed PowerShell/.NET ceremony code using Windows CNG `Microsoft Software Key Storage Provider`, RSA-3072, exponent 65537, SHA-256;
- certificate: self-signed X.509 v3, subject exactly `CN=V3 GCP Successor UKI Secure Boot Authority`, Basic Constraints `CA:FALSE` critical, Key Usage `Digital Signature` critical, validity exactly `2026-09-19T00:00:00Z` through `2036-09-16T23:59:59Z`;
- serial: first 16 bytes of SHA-256 over ASCII `V3-SUCCESSOR-SECURE-BOOT-SERIAL:v1` + NUL + DER SubjectPublicKeyInfo, with the high bit cleared and a zero serial changed to one; encoded as positive big-endian X.509 serial;
- Authenticode: `signtool sign /fd SHA256`, no `/t` or `/tr`, so no timestamp authority/network exists. Any local PKCS#7 `signingTime` attribute is evidence-only and ignored for authority, freshness and expiry. Authority derives from request freshness/consumption and the exact sole certificate, not signingTime;
- custody: one encrypted PFX on one Owner-dedicated BitLocker To Go removable drive, disconnected between ceremonies; no backup in the initial policy; PFX password and BitLocker recovery material are controlled separately by Owner and never stored on that drive;
- recurring use: import PFX into CurrentUser `My` as non-exportable, sign one approved request, verify, remove store key, disconnect drive.

This mechanism is zero added cost only if Owner already has an eligible Windows edition and removable drive. Otherwise STOP; no purchase or Windows upgrade is authorized.

Official references: [SignTool](https://learn.microsoft.com/en-us/windows-hardware/drivers/devtest/signtool), [New-SelfSignedCertificate and Windows PKI](https://learn.microsoft.com/en-us/powershell/module/pki/new-selfsignedcertificate), [Export-PfxCertificate](https://learn.microsoft.com/en-us/powershell/module/pki/export-pfxcertificate), [BitLocker](https://learn.microsoft.com/en-us/windows/security/operating-system-security/data-protection/bitlocker/).

## Secure Boot compatibility

The successor UKI is a PE/COFF EFI application. SignTool emits PE Authenticode using SHA-256. Certification does not trust SignTool's exit status alone. Review must independently:

1. parse the PE certificate table and require one PKCS#7 signer;
2. validate the signer against the sole exported DER certificate;
3. reconstruct the Authenticode image digest and prove correspondence to the exact requested unsigned PE;
4. prove `.linux`, `.initrd`, `.cmdline` and all other load-bearing sections unchanged by signing;
5. run a disposable-key UEFI verifier fixture proving signed succeeds while unsigned, wrong-key and changed-byte variants fail;
6. bind the same DER certificate as the sole GCP `shieldedInstanceInitialState.dbs[]` entry.

If Windows SignTool output fails that independent UEFI verifier, return `OWNER_DECISION_REQUIRED`; do not weaken Secure Boot or require Linux by default.

## Request authentication

The request is deliberately unsigned because the build side has no pre-existing signing authority that should become a root. It is content-addressed and authenticated through two independent observations:

- offline media provides exact `request.json` plus unsigned UKI;
- the Owner receives the 64-hex `requestId` through the authenticated owner channel and manually types the complete value at signing.

`requestId = SHA256("V3-SUCCESSOR-UKI-SIGNING-REQUEST:v1\0" || canonicalCore)`, where canonicalCore is compact sorted-key UTF-8 JSON with one LF, omitting `requestId`. The strict request schema includes `authentication.method=OWNER_TRUSTED_CHANNEL_REQUEST_ID_COMPARISON` and the domain. A media attacker cannot change any request/UKI field without changing the value the Owner compares. A channel attacker remains outside this ceremony and is governed by authenticated-owner-channel controls. No request signature is claimed.

`Test-CeremonyContract.ps1` mechanically enforces canonical bytes, requestId reconstruction, exact RFC3339 UTC (`YYYY-MM-DDTHH:MM:SSZ`), `expiresAt > createdAt`, window at most 86,400 seconds, current time inside the window, schema constants, digest/length and expected certificate identity.

## Consumed ledger

Schema `v3.successor-uki-consumed-ledger.v1` is strict. Genesis is sequence 0, empty records and `previousLedgerSha256` of 64 zeroes. Each successful signing adds exactly one record keyed by both requestId and nonce, increments sequence by one and binds the prior canonical ledger SHA-256. Duplicate requestId or nonce is fatal.

Commit is write-ahead and atomic on the BitLocker NTFS volume:

1. construct canonical next ledger in memory;
2. write `consumed-ledger.next`, flush file buffers;
3. reread and verify schema, previous digest, sequence and new record;
4. atomically replace `consumed-ledger.json` with `MoveFileEx(REPLACE_EXISTING|WRITE_THROUGH)` through reviewed .NET/PInvoke code;
5. reread/verify final bytes before exporting signed output.

A crash before replace leaves the old ledger authoritative and no signed output may export. A crash after replace makes replay fail. A stray `.next`, malformed ledger, sequence gap, wrong previous digest or ambiguous recovery state stops with `E_LEDGER_RECOVERY`; the Owner quarantines any signed output and independent review decides recovery. The procedure never guesses or rolls back.

## Evidence authentication

Evidence follows `signing-evidence.schema.v1.json`. The same retained Secure Boot RSA key signs a domain-separated evidence digest only after UKI verification and ledger commit:

`RSASSA-PSS-SHA256(privateKey, SHA256("V3-SUCCESSOR-UKI-SIGNING-EVIDENCE:v1\0" || canonicalEvidenceCore))`

PSS uses MGF1-SHA256 and salt length 32. `evidenceSignature` is base64; core omits that field. `evidenceSignerSpkiSha256` must equal the approved certificate SPKI identity. This secondary key use is restricted to the paired evidence for a UKI signed in the same authorized request. Offline and review-side verification reconstructs canonical core, verifies PSS parameters against the public certificate, then verifies every referenced artifact independently. Evidence never substitutes for Authenticode.

## Ceremony sequence

1. Build side publishes exact unsigned UKI and strict canonical request after public certificate identity exists.
2. Transfer only those two files to `signing-inbox`; unexpected files fail.
3. Offline script and `Test-CeremonyContract.ps1` verify canonical request, trusted-channel requestId, time window, nonce/request ledger uniqueness, candidate/build identities, UKI digest/length and expected certificate/SPKI.
4. Independently inspect unsigned PE and embedded kernel/initramfs/cmdline/adapter/downstream-init identities; existing signature fails.
5. Owner sees purpose/requestId/commit/tree/digest/length/certificate/expiry and types full requestId.
6. Import retained PFX non-exportably; prove public/private match; invoke exact pinned SignTool without timestamping.
7. Verify signature offline and exact signed/unsigned correspondence.
8. Commit consumed ledger atomically.
9. Create canonical evidence core, sign it with PSS contract, verify signature offline.
10. Export exactly signed UKI, DER/PEM public certificate, request, evidence and public tool/provenance inventory.
11. Remove store key and volatile plaintext, verify absence, disconnect drive and return to custody.
12. Review side independently repeats request, Authenticode, evidence, embedded-identity, ledger-record and hostile verification.

Late ledger/evidence/custody failure quarantines the signature offline and exports nothing authoritative.

## Hostile suite

Reject noncanonical/unknown request fields, wrong requestId/domain/method, malformed time, >24h window, not-yet-valid/expired request, duplicate nonce/requestId, wrong candidate/tree/path/purpose, changed UKI digest/length, pre-signed input, wrong certificate/SPKI/private key, extra input, missing full Owner comparison, altered kernel/initramfs/cmdline/adapter/downstream init, wrong SignTool identity, timestamped/wrong digest/wrong signer/multiple signer output, invalid PSS parameters/evidence signature, signed/unsigned mismatch, ledger sequence/previous-digest/recovery/atomic-commit failure, extra export, store cleanup or custody-return failure. Disposable test keys confer no authority.

## Lifecycle and blast radius

Loss or forgotten secret forces rotation; compromise stops signing, quarantines pending output and replaces sole-key policy; no bypass or dual-authority convenience state. Adding a backup is a new reviewed decision.

- `BYTES_CHANGED`: new public certificate, adapter init, successor initramfs, unsigned/signed successor UKI, inventories, request/evidence/ledger artifacts.
- `AUTHORITY_BINDING_CHANGED`: sole-key UEFI policy, external boot binding, successor authority chain and key transition/lifecycle policy.
- `EVIDENCE_ONLY_CHANGED`: build/reproducibility/closure/hostile/cost evidence.
- `UNAFFECTED_BYTE_IDENTICAL`: old downstream init `6f6b5045...`, supervisor `a2d33af1...`, dm image/tree/root, composed service, admission, pin/offline graph, provisioning script and Root-Admitter subtree `cd03b228...`.

## Owner confirmation gate

Confirm: eligible Windows edition; an existing dedicated removable drive; single encrypted PFX/no backup risk; separate Owner control of PFX password and BitLocker recovery material; SDK 10.0.26100.0 availability; fixed subject/validity; and disconnected Owner-controlled physical storage. No key generation occurs until confirmation after independent PASS.

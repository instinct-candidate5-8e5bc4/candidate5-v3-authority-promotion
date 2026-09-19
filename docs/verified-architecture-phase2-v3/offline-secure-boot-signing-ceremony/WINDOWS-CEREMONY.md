> RETIRED / HISTORICAL / NON-AUTHORITATIVE. Do not use this document as a ceremony, readiness claim, Owner-confirmation gate or execution instruction. The sole current status and next boundary are in `WINDOWS-IMPLEMENTATION-HARD-STOP.md` (`OWNER_DECISION_REQUIRED`). No ceremony or verifier executable is approved.

Status: `RETIRED_HISTORICAL_NON_AUTHORITATIVE`

## Historical draft preserved for review provenance
# Windows-Native Offline Secure Boot Signing Ceremony


This revision binds the human-custodian ceremony to an Owner-controlled Windows 11 signing station. It does not require Linux, dual boot, WSL, a Linux VM, cloud signing, paid HSM/KMS or a second computer. No authoritative key is generated until this design passes independent review and the Owner confirms the storage policy.

## Selected mechanism

- signer/verifier: Microsoft SignTool from Windows SDK 10.0.26100.0, exact `signtool.exe` bytes and SHA-256 recorded by the Owner before key generation;
- key provider: Windows Software Key Storage Provider through CNG;
- key: RSA-3072, exponent 65537, SHA-256, exportable only for the explicit encrypted offline backup step;
- certificate: self-signed X.509 code-signing certificate, sole successor UEFI `db` authority;
- online store during ceremony only: CurrentUser `My` certificate store on the offline Windows signing account;
- between ceremonies: encrypted PFX on an Owner-designated BitLocker To Go removable drive, plus certificate DER and non-secret ceremony records; PFX password is held by Owner and never sent or stored with the drive;
- local cleanup: after verified PFX export and drive removal, delete private-key certificate from Windows certificate store and verify absence;
- authoritative copies: one encrypted PFX copy, no backup in this initial policy;
- recovery: loss or forgotten password retires the key and requires a new key ceremony/policy; there is no bypass;
- zero-cost assumption: Owner already has Windows 11 Pro/Enterprise/Education with BitLocker To Go and one suitable removable drive. If not, STOP. Purchasing hardware or upgrading Windows is not authorized and would violate the zero-mandatory-cost design.

This is the smallest bounded policy. The removable drive, its physical storage location and whether the Windows edition exposes BitLocker To Go are Owner facts, so the Owner must confirm them before generation.

Official mechanism references: [SignTool syntax and SHA-256 requirement](https://learn.microsoft.com/en-us/windows-hardware/drivers/devtest/signtool); [New-SelfSignedCertificate](https://learn.microsoft.com/en-us/powershell/module/pki/new-selfsignedcertificate); [Export-PfxCertificate](https://learn.microsoft.com/en-us/powershell/module/pki/export-pfxcertificate); [Export-Certificate](https://learn.microsoft.com/en-us/powershell/module/pki/export-certificate); [BitLocker overview](https://learn.microsoft.com/en-us/windows/security/operating-system-security/data-protection/bitlocker/).

## Compatibility claim and independent acceptance proof

A UKI is a PE/COFF EFI application. UEFI Secure Boot validates an Authenticode certificate table and PE image digest against `db`. SignTool emits and verifies PE Authenticode signatures with an explicit SHA-256 file digest. The ceremony forbids timestamping, so there is no network dependency or external timestamp authority.

SignTool success alone is not final proof. Candidate certification must independently parse the returned PE certificate table, verify exactly one PKCS#7 signer against the exported DER certificate, reconstruct the Authenticode image digest from the exact unsigned/signed PE pair, and confirm unchanged embedded `.linux`, `.initrd`, `.cmdline` and metadata sections. GCP `shieldedInstanceInitialState.dbs[]` binds the same DER certificate as the sole `db` entry. A disposable test-key fixture must demonstrate that the exact successor PE signed with this SignTool command is accepted by an independent UEFI Secure Boot verifier and that unsigned/wrong-key/changed-byte images are rejected. Production authority remains withheld until those checks pass.

If SignTool output fails independent UEFI verification, STOP with `OWNER_DECISION_REQUIRED`; do not change signature semantics or install Linux by default.

## Tool pin

The review pin is:

- Windows SDK release: 10.0.26100.0;
- expected executable location: `%ProgramFiles(x86)%\Windows Kits\10\bin\10.0.26100.0\x64\signtool.exe`;
- publisher/provenance: Microsoft Windows SDK, obtained from Microsoft;
- executable SHA-256: captured into the first public ceremony evidence and then frozen into the candidate. It cannot be filled before the Owner installs/selects the exact SDK package. An absent or different path/version is a hard stop, not a floating fallback.

PowerShell and `certutil.exe` are Windows components. Their file versions and SHA-256 identities are recorded in generation/signing evidence. No Chocolatey, winget auto-update, third-party signer or “latest” selector is allowed.

## Storage, backup and lifecycle

The one authoritative encrypted PFX resides only on a BitLocker To Go removable volume that is disconnected except during ceremonies. BitLocker recovery material and the PFX password are separate secrets controlled by Owner and are never written to the same removable drive, repository, browser/password manager, cloud or messages. The drive is physically stored in an Owner-controlled location. No second PFX copy is authorized.

At signing time Owner unlocks and connects the drive, imports PFX into CurrentUser `My`, signs one approved request, exports no new PFX, deletes the store copy and disconnects/returns the drive. The offline request ledger and non-secret evidence may remain on the encrypted drive. The private key must not be marked persistently importable into machine-wide stores.

- loss: stop signing; retire certificate; generate new authority after review;
- password/recovery loss: same as media loss;
- suspected compromise: stop, quarantine all unsigned/signed pending outputs, retire certificate from future sole-key policy, review previously signed UKIs, rotate;
- revocation: new sole-key UEFI policy excludes old certificate; no dual-authority convenience state;
- rotation: repeat ceremony with new certificate and recertify changed policy/binding/UKI;
- backup: none. Adding one requires Owner approval and independent review of copy count and separation.

## Exact scripts and runbook relationship

`OWNER-SIGNING-RUNBOOK.ps1` is the copy/paste procedure. It has two explicit modes represented by sections:

1. one-time key generation and encrypted PFX export after Owner confirmation;
2. recurring request verification, explicit approval, signing, verification, evidence export, store cleanup and custody return.

It uses no network or timestamp URL. It rejects extra request-directory files, noncanonical request JSON, wrong/stale/replayed request, digest/length/public identity mismatch, existing signature and absent Owner approval. The production script instance is finalized only after the public certificate exists and the candidate request identities are frozen. Until then, the reviewed runbook is a ceremony template, not a signing authorization.

## Expected results

- generation prints one certificate thumbprint, certificate DER SHA-256 and SPKI SHA-256; exports exactly `successor-secure-boot.cer` and encrypted `successor-secure-boot.pfx` to the BitLocker drive; store deletion leaves no matching private certificate;
- signing prints `REQUEST VERIFIED`, the exact request ID and UKI SHA-256, then requires Owner to type the full request ID;
- SignTool prints `Successfully signed` for exactly the requested UKI;
- `signtool verify /pa /all /v` reports success and one signer;
- the script prints `SIGNED ARTIFACT VERIFIED`, emits signed UKI plus non-secret evidence/public certificate/request only, marks nonce consumed, deletes the imported store key and prints `CUSTODY RETURN READY`;
- any deviation produces a stable `E_*` error, exports no authoritative signed artifact and requires manual quarantine.

## Owner confirmation gate

Confirm all non-secret facts:

1. Windows edition supports BitLocker To Go;
2. one existing removable drive can be dedicated at zero added cost;
3. single encrypted PFX/no backup risk is accepted;
4. Owner alone controls PFX password and BitLocker recovery material separately;
5. Windows SDK 10.0.26100.0 can be installed from Microsoft before the station is taken offline;
6. certificate subject `CN=V3 GCP Successor UKI Secure Boot Authority` and ten-year validity are accepted;
7. physical storage remains Owner-controlled and disconnected between ceremonies.

Until confirmed, no key generation occurs and `OFFLINE_SECURE_BOOT_SIGNING_CEREMONY_READY` remains withheld.

# Minimal Successor UKI Design

Status: `MINIMAL_SUCCESSOR_UKI_DESIGN_READY_FOR_INDEPENDENT_REVIEW`

Baseline: `2330f59f06a89bf5274cbfdf27b0c815232efbee`. The certified Root-Admitter subtree remains byte-identical at `cd03b2286e57b6ee5580f3b24b32cbb7678d980c`.

This is a design artifact only. It generates no key, certificate, UKI, cloud resource or production signature. It performs no provisioning and grants no execution authority.

## Decision and scope

The successor uses one new persistent Secure Boot signing identity. The same key signs the first successor UKI and later authorized successor UKIs until explicit rotation or revocation. The prior certificate cannot sign changed bytes because its private key was destroyed.

The key-custody requirement is deliberately small:

- never place private-key material in Git, repository artifacts, CI, logs, chat, cloud storage or published evidence;
- keep the private key encrypted at rest;
- retain one controlled encrypted primary PFX and one controlled encrypted backup PFX so loss of one copy does not permanently remove signing capability;
- expose only the public certificate, certificate hashes and signed UKIs to review;
- use no paid HSM, KMS, certificate service or additional trust-root infrastructure.

The earlier Windows qualification, disposable-key fixtures, transaction ledger, JSON ceremony protocol and elaborate offline ceremony are superseded. The two historical PowerShell entrypoints remain inert and must not be reused.

This custody simplification does not relax firmware or Root-Admitter integrity. The successor still has one Secure Boot `db` certificate, rejects unsigned or differently signed EFI images, preserves the exact certified Root-Admitter ELF and dm-verity tuple, and requires independent review of every changed authoritative byte and binding.

## Minimal successor architecture

The successor follows the previously identified minimal-UKI path:

1. preserve the existing kernel bytes;
2. preserve the existing dm-verity data image, verity tree, root hash and native Root-Admitter ELF;
3. add one small Cloud Boot Adapter as the first initramfs program;
4. have the adapter resolve only reviewed GCP persistent-disk identities, reject missing, extra, duplicate, swapped or ambiguous inputs, construct `/dev/v3-rootfs-data` and `/dev/v3-rootfs-hash`, mount the four reviewed filesystems with the required modes, emit deterministic evidence, then execute the existing `/init` bytes unchanged;
5. build a new unsigned UKI containing the adapter and unchanged downstream inputs;
6. sign that exact UKI with the retained production key;
7. bind the public certificate as the sole GCP Secure Boot `db` entry and bind the exact signed UKI as the sole boot entry.

The adapter is security-authoritative new code and is not supplied by this design. Its implementation, input manifest, complete runtime closure and hostile suite require their own frozen candidate review. This design only closes the signing-authority and custody choice so that implementation can proceed without another custody preflight.

## Zero-cost Windows signing mechanism

Use the Owner's Windows computer and Windows built-in certificate/CNG facilities plus Microsoft SignTool from the zero-cost Windows SDK. The production key is RSA-3072 with exponent 65537 and SHA-256. The certificate is self-signed, code-signing only, and is the sole successor Secure Boot `db` identity.

The implementation candidate must freeze:

- the exact Windows SDK release selected from Microsoft's official SDK downloads;
- the exact absolute `signtool.exe` path, file version, Authenticode signer and SHA-256 observed on the Owner's station;
- the exact public certificate DER bytes and SHA-256;
- the exact unsigned and signed UKI SHA-256 values;
- the no-timestamp SignTool command and verification transcript.

No qualification phase is required. If the actual SignTool cannot sign the candidate as PE/COFF Authenticode SHA-256 or the result does not pass the required independent parsing and firmware acceptance checks, that is a concrete functional failure and signing stops.

Official references: [SignTool](https://learn.microsoft.com/en-us/windows-hardware/drivers/devtest/signtool), [New-SelfSignedCertificate](https://learn.microsoft.com/en-us/powershell/module/pki/new-selfsignedcertificate), [Export-PfxCertificate](https://learn.microsoft.com/en-us/powershell/module/pki/export-pfxcertificate), [Export-Certificate](https://learn.microsoft.com/en-us/powershell/module/pki/export-certificate), and [Windows SDK downloads](https://learn.microsoft.com/en-us/windows/apps/windows-sdk/downloads).

## Exact future key-creation boundary

These commands define the intended Windows mechanism. They are not to be run from this design commit. After the successor implementation and signing inputs pass review, the Owner runs them locally in a fresh PowerShell session. The PFX password is entered interactively and is never substituted into source, command history, logs or review output.

```powershell
$ErrorActionPreference = 'Stop'
$subject = 'CN=V3 Successor UKI Secure Boot Authority'
$primary = 'E:\v3-secure-boot-primary\successor-secure-boot.pfx'
$backup = 'F:\v3-secure-boot-backup\successor-secure-boot.pfx'
$public = "$env:USERPROFILE\Desktop\successor-secure-boot.cer"

$password = Read-Host 'New PFX password (do not transmit or record in project files)' -AsSecureString
$notBefore = (Get-Date).ToUniversalTime().Date
$notAfter = $notBefore.AddYears(10).AddSeconds(-1)
$cert = New-SelfSignedCertificate `
  -Type Custom `
  -Subject $subject `
  -KeyAlgorithm RSA `
  -KeyLength 3072 `
  -HashAlgorithm SHA256 `
  -KeyExportPolicy Exportable `
  -KeyUsage DigitalSignature `
  -TextExtension @('2.5.29.19={critical}{text}ca=false','2.5.29.37={text}1.3.6.1.5.5.7.3.3') `
  -CertStoreLocation 'Cert:\CurrentUser\My' `
  -NotBefore $notBefore `
  -NotAfter $notAfter

Export-PfxCertificate -Cert $cert.PSPath -FilePath $primary -Password $password -CryptoAlgorithmOption AES256_SHA256 -NoProperties
Copy-Item -LiteralPath $primary -Destination $backup -Force
Export-Certificate -Cert $cert.PSPath -FilePath $public -Type CERT

if ((Get-FileHash -Algorithm SHA256 -LiteralPath $primary).Hash -ne
    (Get-FileHash -Algorithm SHA256 -LiteralPath $backup).Hash) {
  throw 'E_PFX_BACKUP_MISMATCH'
}
Get-FileHash -Algorithm SHA256 -LiteralPath $public
```

Before execution the Owner substitutes two distinct existing controlled storage paths for `E:` and `F:`. Both destinations must be encrypted at rest by Windows device encryption, BitLocker, BitLocker To Go or an equivalently encrypted Owner-controlled volume. The two copies must not be on the same physical device. If those properties are not true, STOP before key generation. Buying hardware or a Windows upgrade is not authorized by this design.

Expected public output is one SHA-256 for `successor-secure-boot.cer`. The PFX digest may be compared locally to prove the backup copy, but it is not needed in review. The PFX, password, recovery material, console transcript containing storage paths, and certificate-store private-key data must never be uploaded.

The generated certificate remains temporarily in `Cert:\CurrentUser\My` for signing. After the signed candidate is verified, remove that store instance with:

```powershell
Remove-Item -LiteralPath $cert.PSPath
if (Test-Path -LiteralPath $cert.PSPath) { throw 'E_STORE_KEY_REMAINS' }
$password = $null
$cert = $null
[GC]::Collect()
```

This removes the working store copy, not the two retained encrypted PFX files. It makes no physical or forensic erasure claim.

## Exact future signing boundary

The reviewed implementation supplies literal values for every angle-bracket placeholder before Owner execution:

```powershell
$ErrorActionPreference = 'Stop'
$signtool = '<reviewed-absolute-path-to-signtool.exe>'
$unsigned = '<reviewed-absolute-path-to-successor-unsigned.efi>'
$staged = '<private-empty-staging-path-to-successor.efi>'
$signed = '<empty-output-path-for-successor-signed.efi>'
$pfx = '<controlled-primary-pfx-path>'
$thumbprint = '<REVIEWED_CERTIFICATE_THUMBPRINT>'

if ((Get-FileHash -Algorithm SHA256 -LiteralPath $signtool).Hash -ne '<REVIEWED_SIGNTOOL_SHA256>') { throw 'E_SIGNTOOL_IDENTITY' }
if ((Get-FileHash -Algorithm SHA256 -LiteralPath $unsigned).Hash -ne '<REVIEWED_UNSIGNED_UKI_SHA256>') { throw 'E_UNSIGNED_UKI_IDENTITY' }
if ((Test-Path -LiteralPath $staged) -or (Test-Path -LiteralPath $signed)) { throw 'E_OUTPUT_EXISTS' }
Copy-Item -LiteralPath $unsigned -Destination $staged
if ((Get-FileHash -Algorithm SHA256 -LiteralPath $staged).Hash -ne '<REVIEWED_UNSIGNED_UKI_SHA256>') { throw 'E_STAGED_UKI_IDENTITY' }

$password = Read-Host 'PFX password' -AsSecureString
if (Get-ChildItem 'Cert:\CurrentUser\My' | Where-Object Thumbprint -eq $thumbprint) { throw 'E_CERTIFICATE_ALREADY_PRESENT' }
$imported = Import-PfxCertificate -FilePath $pfx -CertStoreLocation 'Cert:\CurrentUser\My' -Password $password -Exportable:$false
if ($imported.Thumbprint -ne $thumbprint) { throw 'E_CERTIFICATE_IDENTITY' }
& $signtool sign /fd SHA256 /s My /sha1 $thumbprint $staged
if ($LASTEXITCODE -ne 0) { throw 'E_SIGNTOOL_SIGN' }
& $signtool verify /pa /all /v $staged
if ($LASTEXITCODE -ne 0) { throw 'E_SIGNTOOL_VERIFY' }
Move-Item -LiteralPath $staged -Destination $signed
Get-FileHash -Algorithm SHA256 -LiteralPath $signed
Remove-Item -LiteralPath $imported.PSPath
if (Test-Path -LiteralPath $imported.PSPath) { throw 'E_STORE_KEY_REMAINS' }
$password = $null
$imported = $null
[GC]::Collect()
```

The sketch is intentionally non-executable because every placeholder must be frozen by the implementation review. SignTool signs only the byte-checked private staging copy and the script publishes it to the empty output path only after verification. The PFX password remains a `SecureString`; it is never passed as a process argument.

No timestamp server or network signing service is used. The PFX is loaded only on the Owner station. A failed import, identity check, signing command, independent verifier, firmware test or cleanup is a STOP; do not improvise another signer, digest, certificate or trust policy.

## Required candidate verification

A successor candidate is not accepted merely because SignTool exits zero. Independent review must reproduce or inspect:

- exact unsigned-to-signed PE/COFF correspondence;
- exactly one Authenticode signer and SHA-256 image digest;
- signer certificate equality with the sole reviewed `db` DER certificate;
- unchanged kernel, command line and preserved initramfs members;
- exact new adapter bytes and complete dependency closure;
- adapter positive boot with exact disk/mount inputs;
- rejection of unsigned, wrong-key and modified UKIs;
- rejection of missing, extra, duplicate, swapped and ambiguously identified disks;
- rejection of wrong filesystem, wrong mount mode and changed adapter manifest;
- handoff to the byte-identical old `/init`, Root-Admitter ELF and dm-verity tuple;
- exact GCP image and firmware-variable representation before any resource creation.

Firmware acceptance may use the production key and public test artifacts. A disposable qualification key is not required. Test outputs remain non-authoritative until the entire candidate and binding pass review.

## Public review bundle and secret exclusion

Safe to return for review:

- public certificate DER and its SHA-256;
- unsigned and signed UKIs;
- hashes, exact tool versions and public Authenticode/PE verification output;
- adapter source, build inputs, closure, manifest, evidence and hostile-test results;
- redacted proof that two encrypted controlled copies exist, without drive identifiers, paths, recovery data or secrets.

Never return or upload:

- PFX files or any private-key export;
- PFX password, BitLocker password, recovery key, PIN or other unlock material;
- certificate-store private-key containers;
- screenshots or transcripts that expose secrets or private storage identifiers;
- memory dumps, temporary files or logs containing password arguments;
- any artifact from which the private key can be reconstructed.

## Rotation, revocation and loss

Normal updates reuse this same key and repeat candidate-specific review. Rotation or revocation requires an explicit Owner decision, a new public certificate, replacement of the sole `db` entry and recertification of affected bindings. Suspected compromise stops all new signing and triggers that path.

If one encrypted PFX copy is lost or unreadable, stop signing, make one replacement encrypted copy from the remaining controlled PFX on the Owner station, verify the two encrypted files match locally, then remove the failed medium from use. If both copies or their password are lost, the key is unrecoverable and must be rotated. No bypass, hidden third copy or cloud recovery copy is permitted.

## Superseded records and next step

`successor-uki-signing-key-hard-stop.md`, `new-secure-boot-key-custody-hard-stop.md` and `offline-secure-boot-signing-ceremony/WINDOWS-IMPLEMENTATION-HARD-STOP.md` are superseded historical records. Their earlier custody blockers and qualification gate are not current requirements. The historical ceremony documents and PowerShell files remain retired and inert.

After independent PASS of this exact design SHA, the next artifact is the minimal Cloud Boot Adapter and successor UKI implementation candidate. It may prepare unsigned public bytes and reviewed signing inputs. Production key creation and signing occur only after that implementation candidate's exact inputs and commands are frozen for review. Provisioning, Structural Enforcement, Authority Routing, main merge and release remain outside this design artifact.

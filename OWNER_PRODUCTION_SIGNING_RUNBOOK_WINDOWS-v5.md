# V3 Successor UKI - Owner Production Signing Runbook (Windows) - PACKAGE v5

This v5 package replaces the rejected v1, v2, v3 and v4 packages. If you received any
of them, discard them and use only v5. v5 keeps everything v4 proved and fixes the real
defect found in owner review of v4: the cleanup captured only the CNG container's
UniqueName and passed it to CngKey.Exists/Open - but those APIs take the container's
KEY NAME, which is a different identifier, so a container could have survived while the
check reported absence. In v5 every part captures BOTH identifiers before any removal
(KeyName and UniqueName plus provider, both required nonempty), deletes the container
through the CNG API by its KeyName, and verifies absence two independent ways: the API
check by KeyName, corroborated at key-store level by the UniqueName-named key file.
Part 4 re-checks all three containers the same way.

v5 also adds the binding minimum-platform evidence route: a bounded, disposable
GitHub Actions compatibility proof (ci/ plus the workflow file in this package) that
executes the EXACT helper and verification bytes shipped here, under Windows
PowerShell 5.1 on a windows-latest runner, with disposable fixture keys only. Its
passing public log is the required platform transcript for this package. See the
compatibility-proof section before any production run.

You sign one file with a new production key on your own Windows computer. Everything is
zero cost. You never design, debug, or choose anything technical: every step tells you
exactly what to type, what you should see, when it passed, and when to stop.

- Time: about 30-45 minutes, mostly waiting for downloads.
- You need: your Windows 10/11 64-bit computer, internet, administrator rights, and TWO
  encrypted storage locations you control that are NOT the same physical device
  (for example: your internal drive with BitLocker/Device Encryption ON, plus one USB
  drive with BitLocker To Go ON). If you do not have two encrypted locations, STOP now
  and say so - Part 0 will check this for you and tell you.
- Nothing in this runbook asks you to pay for anything. If anything asks for payment,
  STOP and report it.

## FIRST ACTION

Press the Windows key, type `PowerShell`, right-click **Windows PowerShell**, choose
**Run as administrator**. Keep this window open for all parts. Everything below happens
in this one window.

## Setup (once): create the work folder and place the scripts

In the PowerShell window, copy-paste this line and press Enter:

```powershell
New-Item -ItemType Directory -Path C:\v3-signing\scripts -Force | Out-Null
```

Now save the five script files that came with this runbook into `C:\v3-signing\scripts`:

- V3-Part0-Preflight.ps1
- V3-Part1-KeyCreation.ps1
- V3-Part2-SignUKI.ps1
- V3-Part3-FinalizeAndDetachedSign.ps1
- V3-Part4-EvidenceAndCleanup.ps1

**One edit is required.** Open `C:\v3-signing\scripts\V3-Part0-Preflight.ps1` in Notepad.
At the top there are two clearly marked lines:

```powershell
$PrimaryPfxDir = 'E:\v3-secure-boot-primary'
$BackupPfxDir  = 'F:\v3-secure-boot-backup'
```

Replace `E:\v3-secure-boot-primary` with a folder on your FIRST encrypted location, and
`F:\v3-secure-boot-backup` with a folder on your SECOND encrypted location (different
physical device). Create both folders first (they can be empty). Save the file. This is
the only thing you will ever edit.

## Package contents and the compatibility proof (read before any production run)

This package contains:

- `scripts/` - the five production scripts below (the only files the owner uses).
- `ci/V3-WindowsCompatProof.ps1` and `ci/V3-WindowsCompatCleanup.ps1` - the bounded
  disposable compatibility proof and its guaranteed cleanup.
- `.github/workflows/v3-windows-compat-proof.yml` - the GitHub Actions workflow that
  runs the proof on a windows-latest runner, manually dispatched, read-only checkout,
  no persisted credentials, no caches, no artifact upload.
- `.gitattributes` - pins LF line endings so checked-out bytes are identical to the
  reviewed bytes and the CI log hashes match the reviewed hashes below.

The compatibility proof is executed by the package publisher, NOT during the owner's
production ceremony: the package contents are published to the repository at the paths
above (preserving paths exactly), the workflow is dispatched manually, and it runs the
complete Windows-only ceremony path - certificate creation on the Microsoft software
CNG provider, PFX export and identical-copy check, verified cleanup, non-exportable
import, SignTool signing of a disposable fixture, the mathematical Authenticode
verification, the detached RSA-PSS signature with its structural salt-length proof, the
second verified cleanup, and the Part 4 container-absence recheck including a
fail-closed negative fixture - entirely with throwaway fixture keys. It tests the EXACT
shipped bytes: every helper function and verification block is extracted from the
production scripts in the same checkout (functions via the PowerShell parser, inline
blocks via asserted unique markers), hashed, and executed; nothing is reimplemented.
The public run log records the platform facts, the run URL, the commit, the workflow
hash, every package member hash, every extracted-block hash, and PASS/STOP states - and
never any PFX, password, private key, or production material. An `if: always()` cleanup
step removes all disposable material and FAILS the job if anything remains.

Gate: this package is deliverable only after that workflow run PASSes and its logged
member hashes equal the reviewed member hashes recorded in the validation appendix
below. A pass grants no signing, provisioning, or private-transfer authority - those
remain under their separate owner approvals.

Scope note (accepted): the CI run does not certify the desktop-only preflights
(BitLocker/Device Encryption presence, removable-media layout, winget/SDK installation
experience, folder checks). That is acceptable because every one of those fails closed
BEFORE the production key exists, and this runbook forbids bypassing them: if Part 0
stops, you stop and report - there is no skip. What CI certifies is the platform layer
the desktop cannot be distinguished on: Windows PowerShell 5.1 certificate store, the
Microsoft software CNG provider, KeyName-based container deletion, non-exportable
import, SignTool signing, SignedCms verification, and the verified cleanup.

## SAFE vs PRIVATE - read once before starting

SAFE TO RETURN FOR REVIEW (public): everything that lands in `C:\v3-signing\REVIEW-EVIDENCE`.

NEVER SHARE / KEEP PRIVATE: the two `successor-secure-boot.pfx` files, the PFX password,
and the `C:\v3-signing\state` and `C:\v3-signing\work` folders. Never put any of these
in Git, GitHub, any repository, any CI system, email, chat, or cloud storage, and never
transfer them to any agent or assistant. They never leave your computer.

NEVER place the production certificate into the Trusted Root or Intermediate
Certification Authorities stores, on this or any other machine. The scripts never do,
and you must not either.

## How each part works

You run five parts in order, 0 then 1, 2, 3, 4. Each part prints either:

- `PART N PASS - ...` meaning everything worked; continue to the next part, or
- `STOP E_SOME_CODE - explanation` meaning STOP. Do not continue, do not retry with
  changes, do not look for workarounds. Report the exact code and message back.

Every script has a top-level guard: even a completely unexpected error is converted into
`STOP E_UNEXPECTED - <detail>` (detail is shortened and stripped of control characters;
it never contains the password or key material), the script exits with a failure code,
and no raw error text is ever shown. If a failure happens while a temporary key is in
the certificate store, cleanup is still attempted and verified; if cleanup also fails,
you see BOTH the original failure and a separate `STOP E_CLEANUP_FAILED` line.

There is no situation where you fix something yourself.

## Part 0 - automatic preflight (nothing secret)

```powershell
powershell -ExecutionPolicy Bypass -File C:\v3-signing\scripts\V3-Part0-Preflight.ps1
```

What it does: checks administrator mode and 64-bit Windows; checks your two folders are
on two different, encrypted physical drives; installs the zero-cost Windows SDK
10.0.26100 from Microsoft via winget (winget verifies the installer against its source
manifest hash; if winget is missing it prints exact manual instructions naming only the
official Microsoft SDK page); locates `signtool.exe`, verifies it carries a VALID
Authenticode signature and compares the signer's parsed identity EXACTLY (Subject CN and
O must each equal exactly "Microsoft Corporation", as must the Issuer O - no partial
matching), and records its path, version and SHA-256; downloads the three public input
files from the pinned public repository address and verifies each byte count and full SHA-256:

- successor-unsigned.efi, 21164544 bytes, SHA-256 ed5d9d72be40592af3b14bd1fd9dc91a5976b14f350f9124ea414b975464d536
- successor-authority-record.v1.json, 46963 bytes, SHA-256 c09245ae3b60db34f050e29fd9f457a83fde95bd44efc70e9afda14fcbee0e88
- inventory.v1.json, 52390 bytes, SHA-256 a34edbf31bdacca8b2f836d496d01da5d57a8e8a1f46fcc7d63a9ab0dc297236

SignTool (a Microsoft-signed binary) is the ONLY executable this ceremony runs. There is
no OpenSSL and no other third-party tool: all verification is done by Windows itself and
by mathematical proofs inside the scripts.

Expected result: lines starting with VERIFIED, then `PART 0 PASS`.
PASS: you see `PART 0 PASS`. STOP: any `STOP E_...` line (for example E_ENCRYPTION_UNPROVEN
means one of the two drives is not encrypted; report it - do not buy anything).

## Part 1 - create the production signing identity

```powershell
powershell -ExecutionPolicy Bypass -File C:\v3-signing\scripts\V3-Part1-KeyCreation.ps1
```

It asks you to invent a NEW password and type it privately (you will not see the
characters). This password protects the two key files; it is never shown, logged, or
sent anywhere. You will need the same password in Parts 2 and 3 and again for later
signing phases, so write it down and keep the note with the key files.

It then creates the RSA-3072 SHA-256 code-signing identity named
`CN=V3 Successor UKI Secure Boot Authority`, proves the key is a genuine CNG key on the
Microsoft software provider (anything else = STOP E_KEY_PROVIDER), writes the encrypted
primary key file to your first encrypted location, an identical encrypted backup to your
second encrypted location, verifies the two files are byte-identical, exports the PUBLIC
certificate (which is safe), and then destroys the temporary copy completely: it captures BOTH of the key's CNG
container identifiers before removal (the KeyName the CNG API takes, and the UniqueName
the provider generates - never substituted for KeyName), removes the certificate from
the store, explicitly deletes the underlying CNG private-key container through the CNG
API by its KeyName, and independently verifies BOTH are gone (certificate absent AND
container absent by KeyName, corroborated at key-store level by the UniqueName-named
key file) before printing CLEANUP PASS. Any failure is a precise STOP E_CLEANUP_FAILED,
never a hidden leftover.

Expected result: it prints a PUBLIC certificate thumbprint and a PUBLIC certificate
SHA-256, then `PART 1 PASS`.
PASS: `PART 1 PASS`. STOP: any `STOP E_...` line.

## Part 2 - sign the successor UKI

```powershell
powershell -ExecutionPolicy Bypass -File C:\v3-signing\scripts\V3-Part2-SignUKI.ps1
```

It re-verifies that the unsigned UKI on disk still exactly matches the certified SHA-256
ed5d9d72be40592af3b14bd1fd9dc91a5976b14f350f9124ea414b975464d536 (full value, checked
twice), asks for the PFX password privately, loads the key (and proves it is CNG,
non-exportable, RSA-3072), and signs with Microsoft SignTool (SHA-256 Authenticode, no
timestamp).

It then verifies the signature MATHEMATICALLY, with no trust store involved: it computes
the Windows PE Authenticode digest of the signed file (the current algorithm, fixed by
Microsoft security bulletin MS12-024: the whole file except the CheckSum field, the
Certificate Table directory entry, and the certificate table itself), with every header
offset bounds-checked and the certificate table required to sit exactly at end of file
(malformed input is always a controlled STOP, never a guess), decodes the
embedded PKCS#7 signature block, checks that the signed content's DigestInfo carries
exactly that digest and that the signer certificate is exactly your production
certificate, and finally checks the cryptographic signature itself with
SignedCms.CheckSignature(verifySignatureOnly) - the documented mode that verifies the
signature only, without any chain-of-trust evaluation.

`signtool verify /pa` is deliberately NOT used: it verifies chain-of-trust up to a
trusted root. A self-signed identity has no trusted root, so /pa would fail on a
perfectly good signature, and the only workaround would be adding the production
certificate to a persistent trust store - which is prohibited. The mathematical check
verifies exactly what was signed, byte for byte, and needs no trust anchor.

The temporary key is then destroyed completely, under the same exception-safe guard as
Part 1: certificate removed, its CNG private-key container explicitly deleted through the
CNG API by its captured KeyName, and both absences independently verified (API check by
KeyName, key-store corroboration by UniqueName). Even if something fails mid-part, cleanup
is still attempted, and a cleanup failure is a precise STOP E_CLEANUP_FAILED printed
together with the original problem.

Expected result: `Authenticode mathematical verification PASS ...`, then
`SIGNED UKI SHA-256: <64 hex characters>` then `PART 2 PASS`.
PASS: `PART 2 PASS`. STOP: any `STOP E_...` line.

## Part 3 - finalize the binding record and create the detached signature

```powershell
powershell -ExecutionPolicy Bypass -File C:\v3-signing\scripts\V3-Part3-FinalizeAndDetachedSign.ps1
```

It builds the final public binding record (the certified 200-record record plus the
Git commit/tree, the signed-UKI SHA-256 and the certificate SHA-256, in the frozen
canonical format, with a built-in round-trip proof that nothing else changed), then
creates the detached production signature required by the certified record rule:
RSA-PSS-SHA256 over SHA-256 of the bytes `V3-SUCCESSOR-UKI-EXTERNAL-BINDING:v1`,
one zero byte, then the finalized record.

It then verifies the signature by TWO independent implementations, both already built
into Windows - no third-party executable anywhere in this trust path:

1. Microsoft CNG: an immediate VerifyHash self-check, and
2. a full EMSA-PSS structural decode written into the script itself as pure public-key
   math (s^e mod n with the public key, MGF1-SHA256 unmasking, salt recovery): it PROVES
   the signature is really RSA-PSS with SHA-256, MGF1-SHA256, and a salt length of
   EXACTLY 32 bytes - anything else is STOP E_PSS_SALTLEN. Nothing is assumed.

The temporary key is destroyed under the same complete verified-cleanup procedure as
Part 2: certificate removed, CNG key container explicitly deleted by its KeyName, both
absences independently verified (API by KeyName, key-store corroboration by UniqueName).

Expected result: `PSS STRUCTURAL PROOF PASS - ... salt length EXACTLY 32 bytes`, then
`PART 3 PASS`.
PASS: `PART 3 PASS`. STOP: any `STOP E_...` line.

## Part 4 - package evidence and clean up

```powershell
powershell -ExecutionPolicy Bypass -File C:\v3-signing\scripts\V3-Part4-EvidenceAndCleanup.ps1
```

It confirms the production certificate is gone from the certificate store AND that all
three recorded CNG key containers (the Part 1 generated key and the two temporary
imports) no longer exist - checked by KeyName through the CNG API and corroborated by
the absence of each UniqueName-named key file in the user key store (any survivor =
STOP E_KEY_CONTAINER_REMAINS) - then assembles the
evidence folder against an EXACT list of 10 public files: the public certificate, the
unsigned and signed UKI, the original and finalized records, the detached signature,
the inventory, the SignTool signing transcript, the Authenticode verification
transcript, and the detached pre-image digest. Anything in the folder that is not on
that exact list is STOP E_UNEXPECTED_EVIDENCE; any key-file type (.pfx/.p12/.pvk/.key)
or password/secret/private file name is STOP E_SECRET_IN_EVIDENCE. It then writes
EVIDENCE-MANIFEST.json recording the SHA-256 and byte length of every OTHER evidence
file (a manifest never hashes itself) and re-checks the final folder contents.

Expected result: a clearly printed RETURN INSTRUCTIONS box, then `PART 4 PASS`.

## What you return

Return ONLY the folder `C:\v3-signing\REVIEW-EVIDENCE` (zip it if easier). All of it is
public evidence. Your returned evidence will be independently reviewed; any later
provisioning or other follow-on step remains under the separately applicable owner
approval and gates - this package neither grants nor waives any later authority.

Keep private, forever (never Git/GitHub/repository/CI/email/chat/cloud/agent transfer):
the two `successor-secure-boot.pfx` files (you will need them for future signing
phases), the PFX password, and the `state`/`work` folders.

## Complete STOP code table

The rule for EVERY code starting with E_ is always the same: stop and report the exact
code and message. This table explains the common ones; for any code not listed,
stop and report it exactly as printed.

| Code | Meaning | What you do |
|---|---|---|
| E_NOT_ADMIN | Window is not administrator | Close, reopen via Run as administrator, rerun |
| E_POWERSHELL / E_NOT_64BIT | Windows or PowerShell too old | STOP; report |
| E_STATE | A part was skipped or run out of order | Run the parts in order 0,1,2,3,4; if you did, STOP and report |
| E_PRIMARY_DIR / E_BACKUP_DIR | One of your two folders does not exist | Create it, fix the two edited lines, rerun Part 0 |
| E_ENCRYPTION_UNPROVEN | A key-storage drive is not encrypted | STOP; report. Do not buy anything |
| E_SAME_VOLUME / E_SAME_DISK | Both folders on one device | STOP; report |
| E_SDK_INSTALL / E_WINGET_MISSING / E_SIGNTOOL_* | SDK or SignTool problem | STOP; report the code |
| E_INPUT_SIZE / E_INPUT_HASH | A public download is wrong | STOP; report. Never fetch from another site |
| E_OUTPUT_EXISTS | An output already exists | STOP; report. Never overwrite |
| E_PFX_BACKUP_MISMATCH | The two key files differ | STOP; report. Delete nothing |
| E_KEY_PROVIDER / E_KEY_EXPORTABLE / E_KEY_SIZE / E_PRIVATE_KEY / E_KEYGEN | Key is not the exact required CNG/RSA-3072/non-exportable form | STOP; report |
| E_UNSIGNED_UKI_IDENTITY / E_STAGED_UKI_IDENTITY | Wrong unsigned UKI bytes | STOP; report |
| E_CERTIFICATE_* / E_*_MISMATCH | Certificate or file identity problem | STOP; report |
| E_SIGNTOOL_SIGN | Signing failed | STOP; report with signtool-sign.txt |
| E_AUTHENTICODE_PARSE / E_AUTHENTICODE_TABLE / E_AUTHENTICODE_PKCS7 | Signed-file structure problem | STOP; report |
| E_AUTHENTICODE_SIGNER / E_AUTHENTICODE_DIGEST / E_AUTHENTICODE_SIGNATURE | The mathematical Authenticode verification failed | STOP; report with authenticode-verify.txt |
| E_PSS_* / E_SIG_LENGTH / E_DETACHED_* / E_RECORD_FORMAT / E_FINAL_* | Detached signature or record problem | STOP; report |
| E_PSS_SALTLEN | Measured salt length is not exactly 32 bytes | STOP; report. Do not retry |
| E_CLEANUP_FAILED | Temporary certificate and/or its CNG key container could not be fully removed | STOP; report. Do not delete anything manually. The original failure, if any, is printed too |
| E_KEY_CONTAINER_REMAINS | A production CNG key container still exists at Part 4 | STOP; report. Do not delete it manually |
| E_STORE_KEY_REMAINS | Store still holds the certificate at Part 4 | STOP; report. Do not delete manually |
| E_UNEXPECTED_EVIDENCE / E_SECRET_IN_EVIDENCE / E_EVIDENCE_SET / E_EVIDENCE_MISSING | Evidence folder contents are not exactly the expected public set | STOP; report. Remove nothing manually |
| E_UNEXPECTED | Any unexpected error (shown instead of raw error text) | STOP; report what you see |
| anything else unexpected | - | STOP; report what you see |


## Validation status of this package (read once)

Honesty statement, same rule as every prior package: nothing is simulated or faked, and
every claim below names exactly how it was verified.

Fixed in v5 (owner review of v4): the v4 cleanup captured only each CNG container's
UniqueName and used it with CngKey.Exists/Open, but those APIs take the container's
KEY NAME - a different, provider-generated identifier - so a surviving container could
have been reported absent. v5 captures BOTH identifiers plus provider before any
removal (both required nonempty), deletes by KeyName, verifies absence by KeyName
through the API AND corroborates at key-store level by the UniqueName-named key file,
and Part 4 re-checks all three containers the same way. A negative fixture (in the CI
proof) demonstrates on the live platform whether substituting UniqueName into the
KeyName API misreports a live key, and the rule is stated in the log: only KeyName-based
results count as API absence evidence.

Minimum-platform evidence (owner requirement): a genuine Windows PowerShell 5.1
execution transcript is mandatory and is now produced through the bounded disposable
GitHub Actions compatibility proof shipped in this package (see the proof section
above). The proof executes the EXACT shipped helper and verification bytes - extracted
from the production scripts in the same checkout and hash-bound in the log - under
powershell.exe on windows-latest, with disposable fixture keys only, and fails the job
if any disposable material remains. Deliverable gate: the workflow run must PASS and
its logged member hashes must equal the reviewed member hashes below. Until then this
package is not deliverable. A pass closes the platform-transcript requirement for
PACKAGE DELIVERY only; it grants no signing, provisioning, or private-transfer
authority, and it does not certify the desktop-only preflights, which fail closed
before the production key exists and may never be bypassed.

Verified deterministically here (real PowerShell execution, no Windows host; the
Windows-only operations are certified by the CI run above, not claimed here):

- All five production scripts and both CI scripts parse cleanly under the real
  PowerShell language parser.
- Every script's failure plumbing was executed: each failure path prints exactly one
  STOP line and exits with a failure code, including conversion of an unexpected error
  into STOP E_UNEXPECTED.
- The signed-file verification was executed end to end: a real Authenticode-signed copy
  of the actual UKI verifies PASS with this exact code, a one-byte change fails with
  STOP E_AUTHENTICODE_DIGEST, and malformed headers produce controlled STOP codes.
  The PE digest matches an independent implementation byte for byte.
- The binding-record finalization and the detached-signature structural proof were
  executed against the real certified record: results match an independent Python
  reference byte for byte, and a deliberately wrong PSS salt length is caught with
  STOP E_PSS_SALTLEN.
- The CI extraction machinery itself was executed here against the shipped scripts:
  every function and block it extracts was recovered, hashed, and loaded, and the
  extracted Authenticode-verification and PSS-decode blocks are byte-identical to the
  blocks that passed the end-to-end executions above.
- Every cleanup API used (CngKey.Exists, CngKey.Open, CngKey.Delete with the
  container's KeyName; CngKey.KeyName/UniqueName as identifiers) is documented by
  Microsoft for .NET Framework 3.5 through 4.8.1 - the runtime that ships with Windows
  PowerShell 5.1 on plain Windows 10/11 - and the exact member signatures were
  reflection-verified. The CNG-API deletion path is used deliberately instead of the
  certificate provider's Remove-Item -DeleteKey option, whose dynamic parameter differs
  across PowerShell/provider versions.

Reviewed package member SHA-256 hashes (the CI log must print these exact values):
| Member | SHA-256 |
|---|---|
| `scripts/V3-Part0-Preflight.ps1` | `37263b251e4da1b92b2c4b4a8cdd86d05dc22590c72e921c0e0b2c66e6428157` |
| `scripts/V3-Part1-KeyCreation.ps1` | `9c12f7f515f82ba7c8776d776fddfab27c831cc7c83760bbc6f9b7862329cb8b` |
| `scripts/V3-Part2-SignUKI.ps1` | `1fb2f757954d5a08c0af7b482c6738a2b76595b677ba5d3b8700a33afc6aacb0` |
| `scripts/V3-Part3-FinalizeAndDetachedSign.ps1` | `cca30a0c362cf41818e11227f4be240df7d43dfe9b4888a70c6320e303396a06` |
| `scripts/V3-Part4-EvidenceAndCleanup.ps1` | `567a6e61ab532e956a1aef7ef72355d70cc8853a80e0f8d4a61fb35d663181db` |
| `ci/V3-WindowsCompatProof.ps1` | `50130336b2e8dface488499e39a229b8eefb3e204aeb84515f61644e13f940da` |
| `ci/V3-WindowsCompatCleanup.ps1` | `def0af44f59f7677a4498dd5e6566eefb070170f3303ee6fe2f4be44f1b452fd` |
| `.github/workflows/v3-windows-compat-proof.yml` | `d91a02bace7886d4bb12c5d53381122e90c2486ec06b638fc68e8883d0f73556` |
| `.gitattributes` | `2a60899cd8f14193e8f76d6332f0e125706853f86287863947621cc61e6c47a3` |

Extracted-block SHA-256 hashes (the CI log prints these; they bind the tested code to
the shipped bytes):
| Extracted block | SHA-256 |
|---|---|
| `Remove-CertAndCngKey` | `acbd033d044847eeabea30f17d5246c83aa32de2abeb3bad8d50fc6d07ab5413` |
| `ToHex` | `5f192cdcd52a507be25ebde50233dd5ce8b382ec67ca5832c65c588166a9793f` |
| `Get-X500Field` | `24d9ccbb0065c6e95d3013e9df125e0d7067aebf6a923cc2ceaba3a2dad495a3` |
| `Get-AuthenticodeDigest` | `1de68ca00c5ef516613bde76722f073ca9ad37cad4689d63a76294fb1579104a` |
| `Read-DerTlv` | `804c9ee9b4a255818068c60828e1170456b9778838fd23372bfb366bd2a12e78` |
| `Get-EmbeddedPkcs7` | `066be4956190f23b6b075a28076f84bd3322f9abec2856acfbc4a7266502ce1b` |
| `AuthenticodeVerificationBlock` | `da29c322d7dfce1d364bafcdcd87a55fdcd993950951da5febeb04969302ca71` |
| `PssStructuralDecodeBlock` | `fad110c19d52e8dce757c414ac2c34a235c3b4c314895930c71e07e26a70d5e1` |
| `Part4ContainerAbsenceBlock` | `ba86a8f454c9ab0d7d0769ba18c93666481dc01efe31f9cec9c6bb7c4e158ae8` |

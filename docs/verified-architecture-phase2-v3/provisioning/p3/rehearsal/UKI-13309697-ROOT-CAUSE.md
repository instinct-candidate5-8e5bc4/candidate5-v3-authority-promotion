# Root cause: accepted UKI 13309697 firmware rejection (HISTORICAL EVIDENCE ONLY)

Status of the artifact discussed here: **HISTORICAL EVIDENCE ONLY.** The signed UKI
`successor-signed.efi` sha256 `133096976ee70a8c272cbcc8c28d369bfc65d93d994cbff4174b947df00239d1`
(21,166,416 bytes) is retired as a boot candidate. It is preserved solely as evidence.
Its replacement is the gapless deterministic rebuild (`4cda9c3e285b5b639364234400bf0b121178f12447cc88d896cd2623e07d18e1`,
21,154,304 bytes unsigned), signed in a fresh ceremony per the owner decision of 2026-09-24.

## 1. Observed failure

Run 19' (rehearsal run https://github.com/instinct-candidate5-8e5bc4/candidate5-v3-authority-promotion/actions/runs/35963407323),
case NON_CERTIFYING_REHEARSAL-R1-historical-13309697-reject-control (then named NON_CERTIFYING_REHEARSAL-R1-positive), pinned OVMF DEBUG, db = [7cda4ddc..]. Verbatim
from the case's preserved `ovmf-debug.log` (lines 2294-2295):

```
DxeImageVerificationLib: Image is signed but signature is not allowed by DB and SHA256 hash of image is not found in DB/DBX.
The image doesn't pass verification: PciRoot(0x0)/Pci(0x2,0x0)/HD(1,GPT,A1EEE143-302E-BFCE-2DA6-410BAAB6C2EA,0x800,0x20000)/\EFI\BOOT\BOOTX64.EFI
```

The preflight's gate 4b detected the same defect before any boot, fail-closed:
`E_UKI_FIRMWARE_DIGEST_MISMATCH` - the PKCS#7 DigestInfo embedded in 13309697 is
`ab95a4c3fcf946679d2a46e87e64f28912ca5a7b27d642c70e6d5713f4065219`, while the EDK2
section-wise Authenticode digest of the file is
`78eb453c019771503bd186b83b34c9be0e58feb32fd2a3e348824605fc433bad`.

## 2. Structure of the defective file

PE32+, 9 sections, SizeOfHeaders 1024, SectionAlignment 4096, FileAlignment 512,
SizeOfImage 21192704, security directory (0,0) on the unsigned twin:

| section   | VA         | VSize    | RawSize  | RawPtr   | end      |
|-----------|------------|----------|----------|----------|----------|
| .text     | 0x00004000 | 0x86a0   | 34816    | 1024     | 35840    |
| .reloc    | 0x0000d000 | 0xc      | 512      | 35840    | 36352    |
| .data     | 0x0000e000 | 0x20e8   | 8704     | 36352    | 45056    |
| .dynamic  | 0x00011000 | 0x110    | 512      | 45056    | 45568    |
| .rela     | 0x00012000 | 0xe58    | 4096     | 45568    | 49664    |
| .dynsym   | 0x00013000 | 0x438    | 1536     | 49664    | 51200    |
| (GAP)     | -          | -        | -        | 51200    | 61440    |
| .cmdline  | 0x00014000 | 0x8e     | 512      | 61440    | 61952    |
| .linux    | 0x00015000 | 0xb301e8 | 11731456 | 61952    | 11793408 |
| .initrd   | 0x00b46000 | 0x8efe00 | 9371136  | 11793408 | 21164544 |

**The gap:** .dynsym raw data ends at file offset 51200; .cmdline begins at 61440.
The 10,240-byte region between them belongs to no section. It is not zero padding:
6,481 of its 10,240 bytes are non-zero. Its origin (peer ruling 2026-09-24, verified here
byte-for-byte against git HEAD): it is the stub's COFF symbol and string table. Both the
stub and the old UKI carry PointerToSymbolTable=51200, NumberOfSymbols=315 in their COFF
headers; old-UKI bytes 51200-61410 are byte-identical to the stub's 10,210-byte symbol
tail (symbols/strings include `.exit`, `dummy`, `label1`, `magic`, `_DYNAMIC`, `DbgPrint`,
`StrCat`, `efivar_set`), followed by 30 alignment zero bytes (61410-61440). The old builder
(`successor-uki-candidate/build-successor.py`) appended the payload sections at the stub's
512-aligned EOF (61440) instead of its last section's end (51200), converting the stub's
trailing overlay into an INTER-SECTION GAP inside the UKI.

## 3. Why the firmware rejected it

Two Authenticode digest computations diverge exactly on the gap:

* **EDK2 section-wise (the firmware, per the PE Authenticode spec):** headers (minus
  CheckSum and security directory) + each section's raw data in PointerToRawData order +
  the tail region past SumOfBytesHashed. Inter-section gaps are NOT hashed.
  Result on 13309697: `78eb453c..`.
* **Contiguous gap-included:** headers (minus the same fields) + every byte from
  SizeOfHeaders to the certificate table. Result on 13309697: `ab95a4c3..`.

13309697's signature commits `ab95a4c3..`. On the corrected gapless rebuild both methods
coincide at `b2f655b0..`: sbsign 0.9.4 (throwaway-signed output 21,156,264 B sha256
`b02cca2910a8cb94e1065fc2a6c79c17fc47e4ae00f975154991002e8cd73a5c`) and osslsigncode 2.8-2
(21,156,176 B sha256 `af42f45bd41e7eb84a1a6511ead483fc85ffa3fe04b91b70946e6366b10d3e0e`)
both embed `b2f655b0..` (executed). NOTE (executed finding, ruled 2026-09-24): sbsign's
WIN_CERTIFICATE carries dwLength=1957 with its 3-byte alignment padding OUTSIDE dwLength
(table size 1960); osslsigncode's output has dwLength == Size == 1872 (pad inside). The
peer ruled BOTH shapes legitimate per the PE spec (each entry is zero-padded to ALIGN8)
and REFINED the tail rule accordingly: security directory Size == ALIGN8(dwLength),
padding = Size - dwLength (0-7 bytes) all zero, dwLength >= 8, wRevision 0x0200,
wCertificateType 0x0002, exactly one entry running exactly to EOF, VirtualAddress ==
len(U). NO post-sign normalization is ever permitted - rewriting a signed binary is
forbidden. The delta gate `verify-signed-delta.py` (`E_SIGNED_UNSIGNED_DELTA`) enforces
the refined rule and records each tool's shape (dwLength, Size, pad); executed: sbsign
arm (1957/1960/3) PASS, osslsigncode arm (1872/1872/0) PASS, both checksums correct.
The real signtool output is checked against the same refined rule under criterion F. The firmware recomputes `78eb453c..`, the
comparison fails, and the image dies as "signed but signature is not allowed by DB"
(section 1). The signature itself is otherwise cryptographically VALID - executed:
messageDigest signed-attr == sha256 of the SpcIndirectDataContent SEQUENCE's content
octets (the signtool convention), and RSA PKCS#1 v1.5 verification of the signedAttrs
against the embedded signer certificate returns Verified OK (signer =
`7cda4ddc149849cc61191d4b5b3d218d14770c0401e9e66dd9617b82ba1ae441`, CN = V3 Successor
UKI Secure Boot Authority). The defect is the digest COMMITMENT, not the cryptography.

Executed signer-behavior evidence on the old unsigned twin (throwaway RSA-3072 key,
pinned toolchain, 2026-09-24):

| signer                    | embedded DigestInfo on the gapped file | firmware would |
|---------------------------|----------------------------------------|----------------|
| sbsign 0.9.4-3.1ubuntu7   | `78eb453c..` (section-wise)            | accept         |
| osslsigncode 2.8-2        | `ab95a4c3..` (contiguous gap-included) | reject         |
| accepted 13309697         | `ab95a4c3..` (contiguous gap-included) | rejected (observed) |

The value embedded in 13309697 equals the contiguous gap-included algorithm's output
(the algorithm osslsigncode implements), not the section-wise spec value the firmware
computes. Whatever produced the accepted signature, its digest method is irreconcilable
with EDK2 on a gapped file. The owner decision of 2026-09-24 therefore rejected any
nonstandard-signer salvage of the malformed bytes: the fix is a gapless file, on which
both methods coincide BY CONSTRUCTION and every spec-conformant or contiguous signer
embeds the firmware's digest.

## 4. Fix (gapless deterministic rebuild) - summary of executed equivalence proofs

`successor-uki-candidate/build-successor-gapless.py` rebuilds the UKI from the pinned
stub (`96dc5f83..`) and payload pins (vmlinuz `b253def2..`, cmdline `c95bc0a1..`,
initramfs `d62e7c87..`) with every section packed contiguously (each PointerToRawData ==
previous section end). The rebuild also ZEROES the COFF symbol-table fields (PE deprecates the COFF symbol
table for images): PointerToSymbolTable 51200 -> 0, NumberOfSymbols 315 -> 0. Leaving them
would have pointed into moved .cmdline data - the peer's blocking structural finding on the
first gapless candidate (sha 3fb7234a.., superseded before ever being pinned externally).
Executed equivalence to the old unsigned UKI: all 9 section CONTENTS byte-identical; all
VAs/VirtualSizes/RawSizes identical; SizeOfImage identical (21192704); the COMPLETE header
delta is exactly 6 bytes inside 5 listed fields:

| field                          | file offset | old      | new    |
|--------------------------------|-------------|----------|--------|
| .cmdline PointerToRawData      | 652         | 61440    | 51200  |
| .linux PointerToRawData        | 692         | 61952    | 51712  |
| .initrd PointerToRawData       | 732         | 11793408 | 11783168 |
| COFF PointerToSymbolTable      | 140         | 51200    | 0      |
| COFF NumberOfSymbols           | 144         | 315      | 0      |

`repack(old) + symtab-zero == new` byte-for-byte; dual build (differing umask /
PYTHONHASHSEED / SOURCE_DATE_EPOCH / cwd) byte-identical. Layout gate
(`provisioning/p3/verify-uki-layout.py`) prints contiguous == section-wise ==
`b2f655b01cb1587500e163916be8f10fe1eb10f11905597b76cdc51e088924de` on the corrected rebuild
(the digest moved from the first candidate's e83cb60b.. because Authenticode hashing covers
the COFF header), and fails the old file with named `E_UKI_LAYOUT_SYMTAB` +
`E_UKI_LAYOUT_GAP` + `E_UKI_DIGEST_METHOD_MISMATCH`. The gate's full rule set: first rawptr
== SizeOfHeaders; contiguous sections; no overlaps; FileAlignment multiples; VAs ascending
and SectionAlignment-aligned; SizeOfImage consistent; security directory zero; both COFF
symbol-table fields zero (`E_UKI_LAYOUT_SYMTAB`); every data directory resolves inside a
section or is zero (`E_UKI_LAYOUT_DIR_UNRESOLVED`); no trailing data; size % 8 == 0;
contiguous == section-wise digest. Executed negatives (each a named death): gap-injected ->
E_UKI_LAYOUT_GAP; overlapping -> E_UKI_LAYOUT_OVERLAP; trailing -> E_UKI_LAYOUT_TRAILING;
truncated -> E_UKI_LAYOUT_BOUNDS; VA-disorder -> E_UKI_LAYOUT_VA_ORDER; non-zero
PointerToSymbolTable -> E_UKI_LAYOUT_SYMTAB; old 13309697/unsigned twins as pin ->
E_UKI_LAYOUT_SYMTAB + E_UKI_LAYOUT_GAP + E_UKI_DIGEST_METHOD_MISMATCH.

## 5. Hostile control (distinct death classes)

The rehearsal fixtures F-WRONGSIG.efi / F-HOSTILEUKI.efi were sbsign-generated and embed
the CORRECT section-wise digest `78eb453c..`; their firmware rejections are the
db-membership class (signer not enrolled), not the R1 digest-mismatch class. The R3
static review and the R-class harness keep these classes separate; the layout and
signed-file gates (`verify-uki-layout.py`, `verify-uki-signed.py`) name each death
(`E_UKI_LAYOUT_*`, `E_UKI_CERT_*`, `E_UKI_FIRMWARE_DIGEST_MISMATCH`) with executed
negative evidence per gate.

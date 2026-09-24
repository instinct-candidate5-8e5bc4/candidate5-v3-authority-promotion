# Executed negative-suite evidence - gapless UKI gates (E freeze head)

All outcomes below are VERBATIM EXECUTED on 2026-09-24 against the corrected gapless
unsigned UKI sha256 4cda9c3e285b5b639364234400bf0b121178f12447cc88d896cd2623e07d18e1
(21,154,304 B) with the committed gates. Exit code 91 = named fail-closed death; 0 = PASS.

## verify-uki-layout.py (unsigned layout gate)

| negative (constructed mutation)              | exit | named death(s) |
|----------------------------------------------|------|----------------|
| gap-injected (512 B inserted before .initrd) | 91   | E_UKI_LAYOUT_GAP + E_UKI_DIGEST_METHOD_MISMATCH |
| overlap (.linux rawptr -512 into .cmdline)   | 91   | E_UKI_LAYOUT_OVERLAP (+knock-on E_UKI_LAYOUT_GAP, E_UKI_DIGEST_METHOD_MISMATCH) |
| trailing (64 B appended)                     | 91   | E_UKI_LAYOUT_TRAILING |
| truncated (-1000 B)                          | 91   | E_UKI_LAYOUT_BOUNDS + E_UKI_LAYOUT_TRAILING |
| VA-disorder (.linux VA = .initrd VA)         | 91   | E_UKI_LAYOUT_VA_ORDER + E_UKI_LAYOUT_SIZEOFIMAGE |
| symtab-nonzero (PointerToSymbolTable=51200)  | 91   | E_UKI_LAYOUT_SYMTAB |
| old unsigned UKI (git HEAD) as pin           | 91   | E_UKI_LAYOUT_SYMTAB + E_UKI_LAYOUT_GAP + E_UKI_DIGEST_METHOD_MISMATCH |
| corrected UKI itself                         | 0    | PASS; contiguous == section-wise == b2f655b01cb1587500e163916be8f10fe1eb10f11905597b76cdc51e088924de |

Content tamper is NOT a layout death by design: one flipped byte inside .linux changes the
section-wise digest b2f655b0.. -> 99e8d0de.. (executed) while the layout stays clean; the
detection layer is the signature check (firmware reject / gate 4b), not the layout gate.

## verify-uki-signed.py (signed-file gate; gate-4b digest semantics)

| negative                                     | exit | named death(s) |
|----------------------------------------------|------|----------------|
| old 13309697 presented as pin                | 91   | E_UKI_FIRMWARE_DIGEST_MISMATCH (embedded ab95a4c3.. vs section-wise 78eb453c..) |
| cert table not at EOF (+64 B junk)           | 91   | E_UKI_CERT_NOT_EOF (+ inherited E_UKI_FIRMWARE_DIGEST_MISMATCH) |
| bad dwLength (+8)                            | 91   | E_UKI_CERT_BAD_HDR (+ inherited E_UKI_FIRMWARE_DIGEST_MISMATCH) |
| throwaway sbsign variant                     | 0    | PASS (embeds b2f655b0..) |
| throwaway osslsigncode variant               | 0    | PASS (embeds b2f655b0..) |

## verify-uki-authenticode.py (signature layer; openssl cms cannot parse Authenticode eContent)

| negative                                     | outcome |
|----------------------------------------------|---------|
| old 13309697 signature                       | VALID crypto: messageDigest == SpcIndirectDataContent, RSA Verified OK, signer 7cda4ddc.. (the failure was the digest COMMITMENT, not the cryptography) |
| one flipped byte in the RSA signature        | INVALID: RSA Verification failure |
| F-WRONGSIG.efi                               | VALID crypto but signer C5-WRONG-SIGNER-FIXTURE 64eb51a0.. != 7cda4ddc.. (db-membership rejection is the firmware layer, R3) |
| F-HOSTILEUKI.efi                             | VALID crypto, signer C5-HOSTILE-FIXTURE 5b5e4edc.. |

## verify-signed-delta.py (peer 2026-09-24 signed-vs-unsigned rule, E_SIGNED_UNSIGNED_DELTA)

Refined tail rule (peer ruling 2026-09-24, second part): Size == ALIGN8(dwLength); pad =
Size - dwLength (0-7 B) all zero; dwLength >= 8; rev 0x0200; type 0x0002; one entry to EOF;
VA == len(U). Both tool shapes legitimate; no normalization ever.

| input                                        | outcome |
|----------------------------------------------|---------|
| throwaway osslsigncode variant vs unsigned   | PASS: only CheckSum + security-directory deltas; dwLength=1872 Size=1872 pad=0; checksum correct |
| throwaway sbsign variant vs unsigned         | PASS: only CheckSum + security-directory deltas; dwLength=1957 Size=1960 pad=3 (all zero); checksum correct |
| non-zero padding byte (constructed)          | FAIL E_SIGNED_UNSIGNED_DELTA: '3 padding bytes not zero' (+ stale checksum recorded) |
| table Size != ALIGN8(dwLength) (constructed) | FAIL E_SIGNED_UNSIGNED_DELTA: 'table Size=1968 != ALIGN8(dwLength=1957)=1960' |
| content delta inside .linux (constructed)    | FAIL E_SIGNED_UNSIGNED_DELTA: '1 unexpected byte deltas, first at 51754' |

## builder determinism + equivalence (executed)

Dual build (umask 022 vs 077, PYTHONHASHSEED 0 vs random, SOURCE_DATE_EPOCH set vs unset,
separate cwd): byte-identical 4cda9c3e... repack(old unsigned) + symtab-zero == new build
byte-for-byte. Header delta vs old unsigned: exactly 6 bytes inside 5 listed fields
(.cmdline/.linux/.initrd PointerToRawData, COFF PointerToSymbolTable, COFF NumberOfSymbols).

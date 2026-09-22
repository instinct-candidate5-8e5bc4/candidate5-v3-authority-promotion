# V3 Successor Provisioning P1 - close record

Status: `P1_CLOSED_PENDING_FINAL_REVIEW`

P1 ingestion and verification executed per the peer's P1-close conditions against
the exact transferred REVIEW-EVIDENCE set. Both accepted validators PASS. No
evidence bytes are committed beyond the optional `EVIDENCE-MANIFEST.json` copy
(R1 external hash-bound ingestion; the evidence zip stays outside Git).

## Transfer provenance (R1)

- Channel: authenticated peer exchange, relayed by the main agent on
  2026-09-22 with the exact URL and expected identities.
- URL: https://github.com/yuzok101/review-evidence-6a410f1d/releases/download/v1.0/REVIEW-EVIDENCE.zip
- ZIP: 31,486,919 bytes, SHA-256
  `6a410f1d290b64429748ac0263c9d2bd1f57b150c7b2ffb52e76e013c0889df0`
  (re-measured on receipt before any use - matches the transfer message).
- Contents: EXACTLY the 10-file Part 4 allow-list + `EVIDENCE-MANIFEST.json`,
  nothing else. No `.pfx/.p12/.pvk/.key`, no password/secret/private-named file.

## Verified evidence identities (recomputed here)

| File | Identity |
|---|---|
| `successor-signed.efi` | 21,166,416 B, SHA-256 `133096976ee70a8c272cbcc8c28d369bfc65d93d994cbff4174b947df00239d1` |
| `successor-secure-boot.cer` | 1,092 B, SHA-256 `7cda4ddc149849cc61191d4b5b3d218d14770c0401e9e66dd9617b82ba1ae441`, thumbprint `DA1ED260911F93F41C0914108EA45DC0BD85B171` |
| `successor-authority-record-final.v1.json` | 47,246 B, SHA-256 `07f88bfc5a98ef471c05451cc8077af4d7b61015aae5ba0395deb6c935dc1694` |
| `successor-authority-record-final.v1.sig` | 384 B, RSA-PSS-SHA256 salt=32 (structurally proved) |
| `detached-preimage.sha256` | raw 32-byte digest `fec736a6a7e50f030164d76bd2015925621b5edfa1eefb4980ffcb8c18142b45` (see finding below) |
| `successor-unsigned.efi` | byte-equals repo blob `ed5d9d72...` at `92741cbd...` |
| `successor-authority-record.v1.json` | byte-equals repo blob `c09245ae...` at `92741cbd...` |
| `inventory.v1.json` | byte-equals repo blob `a34edbf3...` at `92741cbd...` |
| `signtool-sign.txt`, `authenticode-verify.txt` | transcripts; per-file hashes verified against the manifest |
| `EVIDENCE-MANIFEST.json` | SHA-256 `2ed610034a928940b10720b7ed3684d6f6c0339d0fca31cdba145bea6e342f2e`; schema `v3.production-signing-evidence.v3`; git `92741cbd...` / tree `9cc2e40f...` |

## Verification results

Tool versions: Python 3.10.12, OpenSSL 3.0.2 (15 Mar 2022), git 2.34.1,
bash 5.1.16 / dash sh.

1. `verify-p1-evidence.py` (pure stdlib, first implementation):
   `P1_EVIDENCE_VERIFICATION_PASS` - all six check groups: finalRecord
   (byte-exact deterministic reconstruction, four-field-only delta, 200 records
   retained, preimage `fec736a6...`), certificate (full X.509 profile +
   self-signature pure math), detachedSignature (EMSA-PSS structural decode,
   salt EXACTLY 32), signedUki (size/SHA-256, PE layout, MS12-024 digest
   `ab95a4c3...`), pkcs7 (strict SpcIndirectDataContent form, direct SEQUENCE,
   76-byte content, embedded DigestInfo == PE digest, messageDigest ==
   SHA-256(content), one signer, issuer/serial match, signedAttrs signature
   pure math, embedded cert byte-equals `.cer`), evidenceSet (11 files,
   manifest CONSISTENT, repo byte-equality 3/3).
   Full report: `p1-verification-report.v1.json`; complete stdout/stderr with
   versions: `p1-python-final-transcript.txt`.
2. `verify-p1-openssl.sh` (OpenSSL CLI, second independent implementation):
   `P1_OPENSSL_CROSSCHECK_PASS` - cert self-signature, PE digest + table
   layout, PKCS#7 structure + SpcIndirectData binding + signer-cert equality +
   signedAttrs signature (asn1parse extraction + `openssl dgst`; no
   `cms -verify`), detached PSS salt 32 (`openssl pkeyutl`).
   Complete transcript: `p1-openssl-transcript.txt`.

## Finding recorded during execution (failed run preserved)

The tooling accepted at `6905d40e` crashed with `UnicodeDecodeError` at the
LAST check (evidenceSet) on the exact accepted evidence:
`detached-preimage.sha256` is the RAW 32-byte digest, which the accepted
preimage-file parser attempted to decode as strict UTF-8 before falling back
to raw bytes. (The transfer message described this file as UTF-16 text;
measured content is the raw digest - the digest VALUE matches `fec736a6...`
either way.) Every cryptographic check had already passed; the crash was
input-format handling only. The failed run is preserved verbatim in
`p1-python-attempt1-transcript.txt`.

Fix in THIS close commit (one function, `check_evidence_set`; no cryptographic
change): undecodable input now falls through to the raw-byte comparison
instead of crashing; accepted forms remain exactly 64-hex text (optional
BOM/whitespace) or the raw 32 digest bytes, anything else still rejects with
E_PREIMAGE_FILE. The OpenSSL implementation needed no change (it recomputes
the preimage from the final record and never reads this file). The
certificate-table, CMS, record, and signature checks are byte-identical to
the accepted `6905d40e` tooling.

## Boundary statement

P0 frozen at `55a8491f...`; P0/preflight untouched. R1 ingestion: nothing but
this close record, the verification outputs and the optional manifest entered
Git. No PFX/private-key/password involvement, no trust-store placement, no
target/device mutation, no cloud call, no image/disk/VM creation, no
enrollment, no boot, zero cost. A P1 ACCEPT may authorize P2 construction
only, never P3. P3 authority remains owner-gated: at P2 close the exact
provider/project/account/region/resource commands, expected cost, rollback
and evidence are preregistered and owner authority is checked against that
concrete mutation set before any mutation.

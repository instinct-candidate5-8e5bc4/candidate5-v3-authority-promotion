# V3 Successor Provisioning P1 - Public Evidence Ingestion and Verification Plan

Status: `P1.1_TOOLING_READY_FOR_INDEPENDENT_REVIEW`

P1.1 corrects the fatal defect from the P1-prep REJECT: both CMS paths now
strictly require and process the real accepted Microsoft SpcIndirectDataContent
encoding (see Chain (a)). The rejected commit `6efee48b...` stays in history.

P0 is frozen at `55a8491f570e99836b9274b315779d7f52d9bdf5` (PROVISIONING P0: ACCEPT).
This P1 delivery adds tooling and a plan only. No evidence byte has been ingested
yet; the signed UKI, certificate DER, final authority record and detached signature
remain owner/peer-held public evidence. No target mutation, no cloud call, no
image/disk/VM creation, no enrollment, no boot, no private material, no trust-store
placement - the hard gates are unchanged. A P1 ACCEPT may authorize P2 construction
only, never P3. P0 does not resolve P3 authority; at P2 close the exact
provider/project/account/region/resource command set, expected cost, rollback and
evidence are preregistered and owner authority is checked against that concrete
mutation set before any mutation.

## Required input evidence (owner/peer-held; to be delivered through the peer channel)

The complete `REVIEW-EVIDENCE` folder exactly as Part 4 assembled it - the 10-file
allow-list plus `EVIDENCE-MANIFEST.json`, delivered as one zip whose own SHA-256 is
confirmed in the peer channel message carrying it:

| File | Expected identity |
|---|---|
| `successor-secure-boot.cer` | DER SHA-256 `7cda4ddc149849cc61191d4b5b3d218d14770c0401e9e66dd9617b82ba1ae441`, thumbprint `DA1ED260911F93F41C0914108EA45DC0BD85B171` |
| `successor-signed.efi` | 21,166,416 bytes, SHA-256 `133096976ee70a8c272cbcc8c28d369bfc65d93d994cbff4174b947df00239d1` |
| `successor-authority-record-final.v1.json` | 47,246 bytes, SHA-256 `07f88bfc5a98ef471c05451cc8077af4d7b61015aae5ba0395deb6c935dc1694` |
| `successor-authority-record-final.v1.sig` | 384 bytes, RSA-PSS-SHA256 salt=32 |
| `detached-preimage.sha256` | digest `fec736a6a7e50f030164d76bd2015925621b5edfa1eefb4980ffcb8c18142b45` |
| `successor-unsigned.efi` | byte-equals repo blob `ed5d9d72be40592af3b14bd1fd9dc91a5976b14f350f9124ea414b975464d536` |
| `successor-authority-record.v1.json` | byte-equals repo blob `c09245ae3b60db34f050e29fd9f457a83fde95bd44efc70e9afda14fcbee0e88` |
| `inventory.v1.json` | byte-equals repo blob `a34edbf31bdacca8b2f836d496d01da5d57a8e8a1f46fcc7d63a9ab0dc297236` |
| `signtool-sign.txt`, `authenticode-verify.txt` | transcripts (consistency evidence, checked into the manifest) |
| `EVIDENCE-MANIFEST.json` | schema `v3.production-signing-evidence.v3`; per-file bytes/SHA-256 recomputed and required to match; git/cert/record identity fields required to match the bound values |

The four cryptographic inputs (cer, signed efi, final record, sig) are the minimum
set for chains (a) and (b); the full folder additionally enables the allow-list and
repo byte-equality checks. Requesting the complete folder is preferred.

## Verification chains (both run on the exact returned bytes)

### Chain (a): signed UKI / Authenticode

`verify-p1-evidence.py` (first implementation, pure Python stdlib):
1. signed UKI size 21,166,416 and SHA-256 `13309697...`.
2. PE structure: AMD64, checksum offset 216, security-directory offset 296,
   certificate table at 21,164,544 size 1,872 ending exactly at EOF; WIN_CERTIFICATE
   revision `0x0200`, type `0x0002`, `dwLength` equal to the table size.
3. PE Authenticode SHA-256 recomputed per MS12-024 (whole file except the CheckSum
   field, the certificate-table directory entry and the certificate table) and
   required to equal `ab95a4c3fcf946679d2a46e87e64f28912ca5a7b27d642c70e6d5713f4065219`.
4. PKCS#7 extracted (1,864 bytes, SHA-256 `440aebd4...`): SignedData with exactly
   `{SHA-256}` digest algorithms; eContentType REQUIRED to be
   SpcIndirectDataContent (`1.3.6.1.4.1.311.2.1.4`); the [0] eContent REQUIRED to
   hold the SpcIndirectData SEQUENCE DIRECTLY (an OCTET STRING wrapper, or any
   other eContentType, is rejected); SpcIndirectData content exactly 76 bytes; its
   DigestInfo is SHA-256 and equals the computed PE digest; exactly one signer;
   signer issuer/serial match the certificate; signedAttrs limited to
   {contentType (equal to eContentType), messageDigest (equal to SHA-256 of the
   exact SpcIndirectData content), optional signingTime, and the two Microsoft
   attributes present in the accepted blob, SPC_SP_OPUS_INFO
   (`1.3.6.1.4.1.311.2.1.12`) and SPC_STATEMENT_TYPE (`1.3.6.1.4.1.311.2.1.11`)};
   the authenticated-attributes RSA/SHA-256 signature verified as pure public-key
   math over the re-encoded DER SET OF; the embedded signer certificate
   byte-equals the returned `.cer`; trailing bytes after the ContentInfo (the
   1,864-byte blob carries 5) REQUIRED to be zero padding from the
   WIN_CERTIFICATE 8-byte alignment.
5. Certificate: DER SHA-256 + SHA-1 thumbprint; full X.509 parse requiring
   self-signed SHA256-with-RSA, RSA-3072 e=65537, exact subject==issuer
   `CN=V3 Successor UKI Secure Boot Authority`, KeyUsage critical digitalSignature
   only, EKU exactly codeSigning, BasicConstraints critical CA:false, optional
   non-critical SKID, no other extension; self-signature verified as pure
   public-key math.

`verify-p1-openssl.sh` (second, independent implementation, OpenSSL CLI): certificate
identity via `openssl x509`/RFC2253 exact match, self-signature via `openssl dgst`
over the asn1parse-extracted TBS, detached signature via `openssl pkeyutl
-verify`. `openssl cms -verify` is NOT used: it cannot decode the accepted
SpcIndirectDataContent encoding. The CMS chain is instead verified from an
`openssl asn1parse` structural extraction with three independent checks: (1)
embedded signer certificate byte equality (`openssl pkcs7 -print_certs` + byte
compare against the returned `.cer`, plus SHA-256 pin), (2) SHA-256 of the exact
SpcIndirectData content equals the signedAttrs messageDigest, (3) `openssl dgst
-sha256 -verify` over the re-tagged DER SET OF signedAttrs with the extracted
384-byte signature. The script also independently recomputes the PE Authenticode
digest, the certificate-table layout (offset/size/EOF, WIN_CERTIFICATE
dwLength/revision/type), the direct-SEQUENCE eContent form, and the zero
trailing padding.

### Chain (b): detached authority binding

1. Final record: 47,246 bytes, SHA-256 `07f88bfc...`.
2. Four-field-only delta PROOF: the verifier deterministically reconstructs the
   expected final record from the certified original at `92741cbd...` (repo blob
   `c09245ae...`) using the frozen Part 3 byte surgery (prepend
   `certificateDerSha256`; insert `gitCommit`/`gitTree` before the unique
   `"records":`; insert `signedUkiSha256` before the unique `"signingRule":`) and
   requires BYTE EQUALITY with the returned record. Semantic check on top: top-level
   field delta is exactly `{certificateDerSha256, gitCommit, gitTree,
   signedUkiSha256}`, nothing removed, all 200 records retained, unsigned UKI entry
   `ed5d9d72...`, inventory entry `a34edbf3...`.
   This reconstruction already matches the accepted identities WITHOUT the returned
   bytes: SHA-256 `07f88bfc...` and preimage digest `fec736a6...` (see
   `p1-tool-fixture-evidence.v1.json`). P1 ingestion still requires the returned
   bytes to byte-equal the reconstruction - reuse of accepted evidence is only
   with exact hashes and provenance.
3. Preimage digest recomputed over
   `UTF8("V3-SUCCESSOR-UKI-EXTERNAL-BINDING:v1") || 0x00 || final record` and
   required to equal `fec736a6...`; the returned `detached-preimage.sha256` content
   (hex or raw 32 bytes) must equal it too.
4. Detached signature: exactly 384 bytes; full EMSA-PSS structural decode
   (s^e mod n, MGF1-SHA256 unmask, salt recovery) proving RSA-PSS with SHA-256,
   MGF1-SHA256 and salt length EXACTLY 32 over that preimage digest
   (`verify-p1-evidence.py`), and independently `openssl pkeyutl -verify` with
   `rsa_pss_saltlen:32` (`verify-p1-openssl.sh`).

### Evidence-set consistency (when the full folder is delivered)

Exact 10-file allow-list plus the manifest; no `.pfx/.p12/.pvk/.key`, no
password/secret/private-named file; manifest schema, git identity and all per-file
hashes recomputed; the three repo-carried files byte-equal to their repo blobs.

## Ingestion mechanics (REVIEWER RULING: R1)

The reviewer has ruled **R1: external hash-bound complete REVIEW-EVIDENCE ZIP**.
The evidence stays outside the repository, bound by the zip SHA-256 recorded in
the authenticated peer-channel transfer message and in the P1 verification
report. At P1 close the repository receives ONLY the deterministic verification
report + cross-check transcript (optionally the small `EVIDENCE-MANIFEST.json`),
never the evidence core. Evidence custody per the ruling: the reviewer side
holds the nine-small-files zip plus the extracted public PKCS#7; the owner side
holds the EFI bytes and reassembles the full 11-file zip once this tooling is
accepted. The full set is required (the minimum four would not satisfy the
allow-list/manifest/repo-equality scope).

## P1 execution (after evidence delivery)

1. `python3 verify-p1-evidence.py --repo <clone> --signed-efi ... --cert-der ...
   --final-record ... --detached-sig ... [--evidence-dir ...] --report
   p1-verification-report.v1.json`
2. `sh verify-p1-openssl.sh successor-signed.efi successor-secure-boot.cer
   successor-authority-record-final.v1.json successor-authority-record-final.v1.sig
   <workdir>`
3. Both must PASS; the report and the cross-check transcript become the P1 close
   evidence, on one frozen P1 commit per the accepted delivery pattern.

## P1 review boundary (as fixed by the reviewer, mapped)

1. P0 stays frozen at `55a8491f...`; this delivery adds new files only.
2. Evidence bytes or a transfer-safe split: requested above with exact hashes;
   accepted evidence is reused only with exact hashes/provenance.
3. Both chains recomputed deterministically: chain (a) and (b) above, each with two
   independent implementations; four-field-only delta and 200-record retention are
   proved by byte-exact reconstruction plus semantic diff.
4. Nothing prohibited: no PFX/key/password, no trust-store placement, no
   target/cloud call, no image/disk/VM, no enrollment, no boot - the tooling is
   read-only and network-free.
5. Ingestion mechanics: R1 per the reviewer ruling above; no silent repository
   widening.
6. One frozen P1 commit + deterministic report at close; a P1 ACCEPT may authorize
   P2 construction only, never P3.

## Tooling validation already performed (P1.1, real-format)

See `p1-tool-fixture-evidence.v1.json` and `fixtures/`: the PRIMARY fixture is
the accepted real 1,864-byte PKCS#7 blob itself (`440aebd4...`), which both
implementations parse and fully verify (direct-SEQUENCE form, 76-byte
SpcIndirectData content, embedded DigestInfo `ab95a4c3...`, embedded certificate
byte-identity `7cda4ddc...`, signedAttrs signature). Structurally faithful
synthetic fixtures (ephemeral RSA-3072, no authority) exercise the full
PE/EFI path, the certificate path and the detached PSS path. 18 negative cases
(all with the designed E_ codes) include real-format mutations: OCTET-wrapped
eContent re-wrap of the real blob (signature still valid - only the form check
can reject), wrong embedded DigestInfo, wrong messageDigest, tampered
signature, different embedded certificate, extra signer/algorithm/attribute,
malformed certificate table, and PSS salt length 20. The final-record
reconstruction still matches the accepted real identities byte-exactly using
only repository data. Regenerate with `fixtures/run-fixture-tests.sh`.

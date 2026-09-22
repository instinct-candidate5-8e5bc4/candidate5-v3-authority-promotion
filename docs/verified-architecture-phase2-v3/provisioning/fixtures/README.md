# P1.1 verification fixtures (public, no authority)

Frozen fixtures validating `../verify-p1-evidence.py` and `../verify-p1-openssl.sh`
after the P1-prep REJECT. Both verifier CMS paths strictly require - and are
tested against - the real accepted Microsoft Authenticode encoding:
eContentType `SpcIndirectDataContent` (1.3.6.1.4.1.311.2.1.4) with the [0]
eContent holding the SpcIndirectData SEQUENCE directly, plus zero trailing
padding inside the WIN_CERTIFICATE table.

## Layout

- `accepted-authenticode-spc.pkcs7` - PRIMARY fixture: the accepted real
  1,864-byte PKCS#7 blob (SHA-256
  `440aebd415335218df88abbb9b858fabd3fa30d7d238c8e368f7adc6835de1e5`),
  re-extracted from the accepted signed UKI WIN_CERTIFICATE. Public signature
  material only. Exercises every CMS check against the exact bytes the P1 gate
  must certify, including the embedded production certificate
  (`7cda4ddc...`) and the embedded PE digest (`ab95a4c3...`).
- `synthetic-spc.pkcs7`, `synthetic-signed.efi`, `synthetic-cert.der`,
  `synthetic-detached.sig` - structurally faithful synthetic Authenticode
  material built with an ephemeral RSA-3072 key (same SpcIndirectData form,
  same signedAttrs shape, same certificate profile, synthetic PE32+ with the
  certificate table at EOF, plus an RSA-PSS-SHA256 salt-32 detached signature
  over the deterministic final-record reconstruction). The key is random per
  generation and carries no authority; no private key is stored here.
- `negatives/` - designed rejections. `real-*` are byte mutations / an
  eContent re-wrap of the accepted real blob (the re-wrap keeps the signature
  valid, so ONLY the encoding-form check can reject it). `synth-*` are
  structural variants (wrong OID, OCTET-wrapped eContent, wrong DigestInfo,
  wrong messageDigest re-signed so the digest check itself fires, tampered
  signature, different embedded cert, extra signer, extra digest algorithm,
  extra signed attribute, malformed certificate table x2, PSS salt 20).
- `fixture-manifest.v1.json` - pinned bytes/SHA-256 of every fixture file,
  the verifier override profiles (`synthetic`, `realAccepted`) and the
  expected E_ code per negative.
- `make-fixtures.py` - generator (python3 stdlib + openssl CLI) producing the
  synthetic material and deriving the real-format negatives. Regeneration
  produces new random keys, so blob identities change; the committed blobs
  and manifest are the frozen reviewed identities.
- `run-fixture-tests.sh` - harness rerunning every positive and negative
  through BOTH verifiers and regenerating
  `../p1-tool-fixture-evidence.v1.json` from observed results.
  Requirements: python3, openssl 3.x, jq (harness only), git.

## Run

    sh run-fixture-tests.sh /path/to/repo

The verifiers themselves need only python3 stdlib and openssl 3.x.

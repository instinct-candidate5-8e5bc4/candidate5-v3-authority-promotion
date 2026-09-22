# P2 close

P2 constructed and froze, offline, everything the commission required. One frozen SHA
(this commit) contains the recipes, both build transcripts, the manifest and hashes,
the validator and its report, the hostile-test report, provenance, and the declarative
unexecuted target specification with the P3 preregistration.

## What was built (all offline, no target mutation, no publishing)

- Four deterministic ext4 staging images, byte-identical across two clean builds
  (transcripts byte-identical too):
  - `reviewed-root.ext4` 301,989,888 B SHA-256 `94465db6545a10088383dfc9be4ce399d140309c0882565a585db26a9f47ede1`
  - `reviewed-input.ext4` 201,326,592 B SHA-256 `279d0653e561b00d067c3e07a33b6a1e2ce301924b289b59e085913d03465a69`
  - `reviewed-output.ext4` 16,777,216 B SHA-256 `12ad23aedf6543934f71e7e7816606ee5d81258dac93f52dfa416a81207376a1`
  - `reviewed-evidence.ext4` 16,777,216 B SHA-256 `a2e0e68fcd4875342c8574c6e3214153e5e4402f7a497b313869a5dfc7901669`
- Boot pair frozen (not rebuilt): rootfs `77a3bd99...` 100,663,296 B, verity
  `331502b7...` 798,720 B, root hash `533d6d61...`, metadata and boot policy preserved.
- Nine offline inputs fetched from the public Rust release endpoints and verified
  byte-for-byte against the signed offline manifest pins; the license manifest was
  independently regenerated from the authenticated tarballs and is byte-identical to
  the committed canonical bytes; the 11-file R1 evidence set is bound via
  `/binding.v1.json`. Provenance: `offline-input-provenance.v1.json`.
- Deterministic validator `verify-p2-staging.py` + `inspect-image.py`: PASS,
  125 checks (`p2-validation-report.v1.json`).
- Hostile suite `hostile-p2-tests.py`: 28/28 mutations rejected with the expected
  codes (`p2-hostile-report.v1.json`) - size, marker, content, extra payload, missing
  file, mode, owner, inode-time and superblock-time drift, UUID, label, feature-set
  drift, superblock drift, type change, boot-pair pin forgery, and target-spec
  attacks (extra/zero/wrong db entry, wrong certificate, extra boot entry, wrong UKI,
  network enabled, missing/extra/renamed/source-swapped disk, swap disk, boot disk in
  the `v3-*` namespace, wrong architecture, schema extension).
- Declarative, unexecuted target spec `target-spec.v1.json` (x86_64; exact six
  `v3-*` disks with roles and source hashes; boot disk outside the namespace; sole db
  entry = certificate `7cda4ddc...`; exactly one boot entry = UKI `13309697...`;
  network denied after offline inputs; intended $0 with availability explicitly
  unclaimed) and P3 preregistration `P3-PREREGISTRATION.md` (exact provider; project/
  account declared as required owner inputs; exact commands, credential route, $0
  verification rule, rollback, ordering, timeouts, failure handling).

## Provenance separation

Repo-reproducible records (this commit) pin external artifacts by SHA-256, exactly as
in P0/P1. The four staging images and the nine downloaded inputs are external
artifacts, hash-bound by `staging-manifest.v1.json` and `offline-input-pins.v1.json`;
the images are deliverable out-of-band on request (about 537 MB total).

## Boundary

Nothing was published, pushed, merged, promoted, or executed against any target. No
PFX/private-key/password material exists in any artifact. No certificate was placed in
any trust store. No agent holds credentials or used a production key. P3 is
preregistered only; its authority is assessed against the preregistration at this
close, not before. One SHA = one review.

## File inventory

| file | role |
|---|---|
| `P2-STAGING-RECIPE.md` | full predeclaration (environment, method, images, freeze) |
| `build-p2-images.sh` | deterministic builder |
| `offline-input-pins.v1.json` | pinned inputs, evidence, freeze, source identity |
| `staging-manifest.v1.json` | expected images: superblocks, full inventories, dual-build hashes |
| `inspect-image.py` | structural inspector (shared by builder validation and verifier) |
| `verify-p2-staging.py` | deterministic validator |
| `p2-validation-report.v1.json` | validator PASS report (125 checks) |
| `hostile-p2-tests.py` | hostile mutation suite |
| `p2-hostile-report.v1.json` | 28/28 rejections proven |
| `p2-build-1-transcript.txt` / `p2-build-2-transcript.txt` | identical build transcripts |
| `offline-input-provenance.v1.json` | download/regeneration/binding provenance |
| `target-spec.v1.json` | declarative unexecuted target specification |
| `P3-PREREGISTRATION.md` | P3 preregistration without execution |

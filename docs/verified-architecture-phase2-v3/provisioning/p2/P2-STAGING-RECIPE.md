# P2 staging recipe (predeclaration)

This document predeclares, before any build, everything the P2 offline construction
produces. The builder is `build-p2-images.sh` (same directory); the pinned inputs are
`offline-input-pins.v1.json`; the expected results are `staging-manifest.v1.json`;
the validator is `verify-p2-staging.py` with `inspect-image.py`; the hostile suite is
`hostile-p2-tests.py`. Offline construction only: no target mutation, no publishing.

## Environment pins

| Pin | Value |
|---|---|
| `EPOCH` (all inode and superblock times, seconds) | `1789923381` (= commit time of accepted source commit `92741cbdefaa78adc33bc3c74935a45f9558b88c`, 2026-09-20T19:56:21+03:00) |
| `LC_ALL` | `C` |
| `TZ` | `UTC` |
| umask | `0022` |
| network | not used by the builder |
| root privileges | not used (fakeroot only; no mounting anywhere) |

Build-host tool identities at construction time (recorded in both transcripts; a
rebuilder compares produced image hashes, not host binaries):
mke2fs/debugfs/dumpe2fs/e2fsck 1.46.5 (SHA-256 of each binary in the transcripts),
fakeroot 1.28, Python 3.10.12, git 2.34.1.

## ext4 method (identical for every image)

1. Stage a directory tree; all regular files mode `0444`, all directories mode `0755`,
   owner `0:0` everywhere (mke2fs `-d` under fakeroot); marker file `/.v3-volume-role`
   contains exactly the role string bytes with no trailing newline, mode `0444`.
2. Every staged path is touched to `@1789923381` before imaging (mtime source; the fs
   times are pinned afterwards regardless).
3. Image preallocated with `truncate` to the exact declared length; then
   `fakeroot -- mke2fs -q -t ext4 -F -L <label> -U <uuid> -E hash_seed=<uuid>
   -N <inodes> -m 0 -b 4096 [-O ^has_journal] -d <stage> <image>`.
4. All inodes `1..N` pinned via debugfs `sif <i> crtime|ctime|atime|mtime @1789923381`;
   superblock pinned via `ssv mtime|wtime|lastcheck|mkfs_time @1789923381`; for the two
   writable images the root directory inode is set to mode `040700` in the same session.
5. libext2fs rewrites `s_wtime` (and leaves `s_mkfs_time` stale in backup superblocks)
   on every write-close, so a final Python step patches **every** superblock copy
   (primary at byte 1024 plus sparse backups at groups 1, 3^k, 5^k, 7^k): fields
   `s_mtime` (0x2C), `s_wtime` (0x30), `s_lastcheck` (0x40), `s_mkfs_time` (0x108) set
   to EPOCH, and `s_checksum` (0x3FC) recomputed as CRC-32C (Castagnoli, reflected,
   initial state 0xFFFFFFFF, no final complement) over superblock bytes 0..1019.
   The step re-reads every copy and fails the build (`E_SB_TIME_PIN`) unless all four
   fields hold EPOCH.
6. `e2fsck -fn` must report clean; the builder then records length and SHA-256.
7. Two full builds from clean work directories must produce byte-identical images and
   byte-identical transcripts (asserted in `staging-manifest.v1.json` `dual_build`).

## The four images

| image file | role marker bytes | label | UUID | inodes (-N) | length (bytes) | journal | root mode |
|---|---|---|---|---|---|---|---|
| `reviewed-root.ext4` | `reviewed-root` (13 B) | `v3-rev-root` | `639c6eaa-5345-d50e-9db5-736a6f06e730` | 2048 | 301,989,888 | no (`-O ^has_journal`) | 0755 |
| `reviewed-input.ext4` | `reviewed-input` (14 B) | `v3-rev-input` | `58c398a0-c5a7-3f37-6e11-b9f38e20dab2` | 512 | 201,326,592 | no (`-O ^has_journal`) | 0755 |
| `reviewed-output.ext4` | `reviewed-output` (15 B) | `v3-rev-output` | `6762c3c1-b7eb-a031-e02a-d5064c8e3ed8` | 128 | 16,777,216 | yes (default) | 0700 |
| `reviewed-evidence.ext4` | `reviewed-evidence` (17 B) | `v3-rev-evid` | `4031792a-6a3d-5acb-0f03-0d8f72dc8a4d` | 128 | 16,777,216 | yes (default) | 0700 |

UUIDs are SHA-256("candidate5-p2-staging-uuid:<role>")[0:16] rendered as UUID text;
the same value pins `-U` and `-E hash_seed`. Resulting feature sets (asserted by the
validator): content images `ext_attr resize_inode dir_index filetype extent 64bit
flex_bg sparse_super large_file huge_file dir_nlink extra_isize metadata_csum`;
writable images add `has_journal`.

## Content rules (exact inventories live in staging-manifest.v1.json)

- **reviewed-root**: `/repo/` = `git archive 92741cbdefaa78adc33bc3c74935a45f9558b88c`
  (929 regular files, 22 symlinks, the frozen reviewed repository including the frozen
  boot pair under `root-admitter-candidate/`); `/input-manifest/` =
  `offline-input-manifest.v1.bin` + `.sig` + `offline-root-ed25519-public.pem`
  (SHA-256 `30044b74...`, `90889cbb...`, `6be9ac57...`); the marker. Nothing else.
- **reviewed-input**: `/offline-inputs/` = the nine pinned offline inputs from
  `offline-input-pins.v1.json` (exact paths/sizes/hashes there);
  `/review-evidence/` = the 11 files of review-evidence ZIP `6a410f1d...` (exact hashes
  in the pins); `/binding.v1.json` (SHA-256
  `dbcad6d09789941c66d6e9d606b0f7ebaf43de36251ff6344c717b53d27d182c`) binding the ZIP,
  the offline manifest, the accepted source commit, the signed UKI and the db
  certificate; the marker. No PFX, key, password, state, work or trust-store material
  exists anywhere in any image (asserted by the full-inventory comparison).
- **reviewed-output** / **reviewed-evidence**: marker only (plus filesystem `lost+found`).

## Boot-pair freeze (pinned, not rebuilt)

rootfs `root-admitter-rootfs.ext4` 100,663,296 B SHA-256
`77a3bd99ad9dbfa18952dcc7b2bd180bbebd57843ac8c21edcec63dc737b64f0`;
verity `root-admitter-rootfs.verity` 798,720 B SHA-256
`331502b7de57f7899fa1af25158c398e9603ee2644a9d1e165ebc955d59118e4`;
root hash `533d6d61d83ad8e03539549d500fb74ec6d844f18ee3bcaec238f7fb78303245`
(dm-verity-metadata.v1.json: sha256, 4096-byte hash blocks, 24,576 data blocks, empty
salt); boot-policy `rootfs/trust/boot-policy.v1` 206 B SHA-256 `faf5a291...`.
The builder re-verifies these from repo blobs before staging; the validator re-verifies
them from inside the built `reviewed-root.ext4` (`E_BOOT_PAIR`).

## Validation

`verify-p2-staging.py --images <dir> --manifest staging-manifest.v1.json --pins
offline-input-pins.v1.json --target-spec target-spec.v1.json --report <out.json>`
checks, per image and in this order: presence, byte length, superblock magic/checksum/
UUID/label/feature set/four time fields, inspect-image inventory (exact path set; per
path type, mode, uid/gid, size, content SHA-256 or symlink target, four inode times at
EPOCH with zero nanoseconds), exact marker bytes, e2fsck clean, full superblock bytes,
image SHA-256; then boot-pair freeze, input-manifest trio, all nine offline inputs and
11 evidence files against the pins, binding hash, dual-build equality, and the target
spec semantics (architecture, exact six disks with roles and source hashes, boot disk
outside the `v3-*` namespace, exactly one db entry = certificate `7cda4ddc...`,
`dbxs` empty, exactly one boot entry = UKI `13309697...`, network denied, intended $0).
First failure stops with a stable `E_` code in a canonical JSON report.
`hostile-p2-tests.py` proves 28 mutations are each rejected with the expected code
(`p2-hostile-report.v1.json`).

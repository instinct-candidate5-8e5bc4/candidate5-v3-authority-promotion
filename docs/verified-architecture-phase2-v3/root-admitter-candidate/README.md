# Native Root-Admitter + dm-verity Concrete Candidate

Status: `ROOT_ADMITTER_CONCRETE_CANDIDATE_READY_FOR_OWNER_REVIEW`

Candidate only. No generated ELF was executed or loaded; no image was mounted, activated or booted. The exception covered offline compilation and deterministic image/verity generation only.

## Noncircular chain

`externally trusted UEFI Secure Boot/config signer -> measured exact kernel command line root hash -> kernel read-only dm-verity target/status -> exact immutable ext4 data image + verity tree -> static-PIE measured supervisor -> exact admission artifact/key/binding/closure -> exact b768d48 repository/commit/tree/script blob -> descriptor-verified script -> same-descriptor handoff`.

The supervisor does not establish its own identity. Its ELF and the rootfs that contains it terminate at the externally measured dm-verity root hash. That hash must occur exactly once in trusted kernel command-line configuration and must match the active read-only `v3-root-admitter` dm-verity table. The candidate boot binding leaves the operational Secure Boot signer key as an explicit ceremony prerequisite; no repository, supervisor or script can self-select it.

## Concrete identities

- supervisor source and exact static-PIE ELF are committed; ELF is x86-64 DYN static-pie with no PT_INTERP and no build ID;
- exact compiler/linker/sysroot/header/static-library inputs and flags are in `build/build-inputs.v1.json` and `build/build-recipe.sh`;
- two clean workspaces reproduced the ELF byte-for-byte;
- two independently generated 8 MiB ext4 images and dm-verity trees reproduced byte-for-byte;
- `dm-verity-metadata.v1.json` records data/hash block sizes, data block count, image/tree digests and root hash;
- rootfs contents include only the supervisor, exact affected admission artifacts and boot policy, with root ownership and fixed times.

Build provenance is evidence about how bytes were produced. Runtime trust comes only from the external measured boot/config root and dm-verity root hash. Neither trusts the compiler.

## Supervisor semantics

The supervisor accepts the externally supplied 64-hex root hash, requires the same exact field once in `/proc/cmdline`, queries `/dev/mapper/control` for read-only `v3-root-admitter` table status and requires target type `verity` containing that root. It opens each required rootfs artifact with `O_NOFOLLOW`, enforces regular/root-owned/non-group-or-other-writable policy and embedded SHA-256, then executes the exact admission artifact through its already verified descriptor. Kernel, secure-boot implementation and device-mapper correctness are the external immutable primitive, not self-verified software.

## Affected integration

No approved b768d48 concrete artifact changed. The external-admission candidate is the affected chain: its operational successor mechanics now concretely fresh-check a root-owned non-writable evidence parent; stop before mutation; then arm run-owned stage cleanup, create mode-0700 stage, write deterministic evidence, `sync -f` file and stage, atomically rename stage to fresh EVIDENCE, clear cleanup, verify committed evidence, sync parent and hand descriptor 9 to Bash. Its binding/signatures must be regenerated and re-reviewed because its bytes changed.

## Frozen candidate identity vector

- supervisor source: 5619 bytes, SHA-256 `ddbb033a8ae0fb0b5a1fd8b804580e57f0dd34bcf4cae8b3f0d250854c36b606`
- reproducible static-PIE ELF: 950600 bytes, SHA-256 `e8e5622521be45ec3cf8cfcd836ae382a2de27a3b369e3032e4b759715abb9fa`
- deterministic ext4: SHA-256 `8bdc101e0448ae5e9a1f90b02c912a06a00bef4bbe855167b34627b1f0ca56e9`
- deterministic verity tree: SHA-256 `d5d84ba18011d744e9bfac16c29034f27576206f8752b7554da3be1308415c51`
- dm-verity root: `db80c3e07b4c75dfa92804761b198a9ef45783805fd78965a8fdaa414e8f0d55`
- kernel: SHA-256 `b253def256f2560ed9b658830ca9ec2783bb51f3c5dcb0d9b5c695b6554d70fb`
- initramfs: SHA-256 `14a4ee8c4115613ca9c7c3f8935f7fbaa63ca5d30bbaf8ebeef9f427ef508266`
- signed UKI: SHA-256 `ade85007ddc6741397468b57ff0541942d08d416b031b21b10683dbc725100ca`
- sole UEFI db certificate DER SHA-256: `2e840d03e075c39b0678e8f8defc0a4fa56b05986c73ebdce4ff13a72d91c383`
- external-admission artifact: SHA-256 `dd66b2f91de6f8bfb6e7daacf55d4bfcf43c525d33295e0866c454271e0bbb75`
- external-admission closure: 30 paths, SHA-256 `709f8ddc63321aee68b17e14e21cf8cf71b4e85181a5aaeb07161e30329a73d8`

The dm-verity root is stored only outside the verity-protected image, in the exact signed UKI command line, so there is no image/self-hash cycle. The exact package provenance, build recipes and hostile/static evidence are committed beside the artifacts. No generated supervisor, launcher or script was executed; no generated image was mounted, activated or booted.

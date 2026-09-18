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

## Corrected candidate identity vector

- supervisor ELF: `e8e5622521be45ec3cf8cfcd836ae382a2de27a3b369e3032e4b759715abb9fa`
- 64 MiB ext4 with exact 30-record authoritative runtime closure and immutable bind targets: `508730db37fd8cf33679e1ae982f50bc0b8aceceb2bf0b7e88ecac63e97e838e`
- verity tree: `509eb42233bf32431d6b71dc00b9e20dac2484e8c3aa32d7dd42aebf3fd12ee5`
- dm-verity root: `41c0a61e166d385bf0ed13719650b0cebab46a15fe3369cd01e66b9e15da909f`
- initramfs: `e0bfd8c022b4a8b070ff46bd09ba0e72e8b8ecf36dc3074a2262bb721380ca06`
- signed UKI: `b29c847b6d1c70ca8433e3f540541d6c2a0a92c1c6a5de2d89fbd40687f3b80c`
- sole UEFI db certificate DER: `a3de89512c31c7e9e97c428dfc7876be02a329327362017529c419d1c6fc8fd5`

The rootfs contains every path and exact digest in the signed external-admission closure plus all immutable chroot/bind targets. Init is `set -eu`, checks every device/module/dm/mount/bind operation, confirms dm table, source mountpoints, target object identity and options, and only then invokes the supervisor. No generated artifact was executed, mounted, activated or booted during generation or review.

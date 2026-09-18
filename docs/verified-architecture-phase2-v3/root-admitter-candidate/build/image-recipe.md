# Deterministic rootfs and dm-verity recipe

1. Copy the exact supervisor ELF and five affected admission artifacts into the committed `rootfs/` tree; set supervisor mode 0555, data 0644, directories 0755; normalize source timestamps to epoch+1.
2. Create an 8 MiB zero file. Run exact `/usr/sbin/mke2fs` 1.46.5 under pinned libfaketime at `1970-01-01T00:00:01Z` with `E2FSPROGS_FAKE_TIME=1`, ext4, 4096-byte blocks, 256-byte inodes, fixed UUID `...0001`, fixed hash seed `...0002`, lazy initialization off, journal and metadata checksum seed disabled, and `-d rootfs`.
3. Without mounting, run exact `/usr/sbin/debugfs` 1.46.5 on every raw-sorted path to set uid/gid 0 and atime/ctime/mtime/crtime to 1.
4. Run `make-verity.py` over exact 4096-byte data blocks, SHA-256, empty salt, format 1, separate hash device. Hash each level, zero-pad levels to a block, concatenate lower-to-upper hash levels and hash the final root block.
5. Repeat steps 1-4 from a second clean workspace and require byte equality for image, verity tree, metadata and root hash. Never mount, activate or boot generated artifacts.

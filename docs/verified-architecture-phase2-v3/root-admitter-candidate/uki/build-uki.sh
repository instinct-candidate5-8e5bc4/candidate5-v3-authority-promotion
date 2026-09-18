#!/bin/sh
set -eu
# Inputs must first match inputs/pinned-packages.v1.json. Extract with dpkg-deb.
python3 make-initramfs.py initramfs initramfs.cpio
python3 build-unsigned-uki.py linuxx64.efi.stub vmlinuz initramfs.cpio cmdline root-admitter-unsigned.efi
# Candidate signing uses pinned sbsigntool and libfaketime, a fixed 2026-09-18T00:00:00Z clock,
# the reviewed offline RSA-3072 key, and secure-boot-db-candidate.pem. The private key is destroyed.
# LD_PRELOAD=<pinned-libfaketime> FAKETIME='@2026-09-18 00:00:00' sbsign --key <offline-key> --cert secure-boot-db-candidate.pem --output root-admitter-signed.efi root-admitter-unsigned.efi

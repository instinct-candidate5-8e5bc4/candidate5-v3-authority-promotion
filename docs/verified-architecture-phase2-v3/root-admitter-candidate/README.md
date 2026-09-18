# Descriptor-aware measured root-admitter candidate

Status: candidate only. The complete dm-verity rootfs contains the exact signed 30-record authoritative tool closure and immutable bind targets. The supervisor exact-checks and preserves the admitted launcher descriptor. The launcher accepts only `/proc/self/fd/<number>`, proves that descriptor and immutable SELF path are the same device/inode and digest, then continues measuring SELF and hands the script by descriptor.

- launcher: `ea4d3965cc4e9a534e14f6dc584911c276ecfc0183e8ee124b761e3edf7e3242`
- supervisor ELF: `f62b975d276ee59920f149b6aac58c4f37231bf421e472adec7f3c4b6c605523`
- ext4: `3d80c9ba5e24c5c7dde69d7f4f130cbc7e56f539fed9fb2ca8ec34c6090041a7`
- verity tree: `5dd1b10ffaa293c64a8d11176db7a31455ecb59fa0e82ee8339440fc0f2e35f2`
- dm-verity root: `587fb07ead8f50ceee45663291a7846142ad1d998a5a968f39cdfde77a1a3c67`
- signed UKI: `a99a7d5ba6fd1d7b82b130ed3a692e233e785d5de8d5c6530b5f0202c129eac6`
- sole db certificate DER: `e0c3e48c41d1b51bbc4cc58de8bc0837adcd952ac95ccc3904a98d9f3de3f9ea`

Init fails closed and verifies dm/bind identities/options before supervisor handoff. No generated artifact was executed, mounted, activated or booted.

# Bootstrap Trust-Root Candidates and Complete Capability Graph

State: `BOOTSTRAP_TRUST_ROOT_CANDIDATES_READY_FOR_OWNER_REVIEW`

Every item below is `CANDIDATE_FOR_OWNER_APPROVAL`. Inclusion, identity, digest, review or reproducibility is not approval and cannot satisfy trust-root closure. The three candidates must be accepted or rejected independently. Any missing approval yields `HARD STOP - BOOTSTRAP_TRUST_ROOT_INCOMPLETE`.

## Candidate A - immutable enriched image

- Product/artifact: Microsoft Dev Container `mcr.microsoft.com/devcontainers/base:2.0.5-ubuntu22.04`, OCI Linux/amd64 manifest.
- Immutable identity: index `sha256:81380e4c9c14e8a629ff39029639e4b7893e67400246fa7782a0fe7dc193a02a`; Linux/amd64 manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; config `sha256:04996d625578186e972c7e0e7e355d82c1e92f158fb0820ff04bcac68dda5d20`.
- Authoritative retrieval/provenance: MCR OCI Distribution API by digest, with all nine layer digests from the exact manifest verified before OCI whiteout-aware unpacking. Its published source is `https://github.com/devcontainers/images/tree/main/src/base-ubuntu`; publisher provenance is weaker than an owner-built signed reproducible image and is a candidate risk, not hidden authority.
- Truthful closure: independent research downloaded all nine exact layers, verified their digests, unpacked them in order and mechanically derived the executable/ELF/runtime graph from that root. It contains every required executable. The 19-executable, 66-file ELF canonical closure is 8,037 bytes, SHA-256 `90e044c4586fb42bfa3932b9804fe31b719b91731a567c092d830bdd4ec70f0b`. The inventory below is from this image, not the earlier worker.
- Update/platform: only this Linux/amd64 manifest is proposed. A tag move, layer/package update or other architecture requires complete regeneration, review and owner approval; no apt mutation is permitted.
- Persistence/protection: exact layers/root mount read-only; work/evidence mounts are separate and fresh.
- Hostile-admin implications: external measured execution must verify manifest/layers/root closure. Kernel/hypervisor admin remains outside the reduced application-adversary guarantee. The image's large extra package surface and publisher-account risk favor the alternative of an owner-built minimal, signed, reproducible OCI image.

## Candidate B - launcher

- Artifact: `future-bootstrap-launcher.review-bytes`, mode `100644`, 851 bytes, SHA-256 `e9d40303c39310761a4f3c0ebb3374806ed420b008926ae6a3ea2e14fcc55232`, Git blob `fa2ecf9e40a07221ba9f849e402d4d27822faa23` before final commit.
- Provenance: exact repository bytes in this review package; owner-approved descendant lineage from `d274fc8`. It has no shebang and was not executed.
- Role: runs only after a higher-level measured-execution service has verified the OCI/rootfs and protected pin-store digest. It checks fixed script path, type, mode, length and digest, then invokes admitted Bash by absolute path.
- Immutable build/retrieval: no build; reviewers hash raw committed bytes and compare Git blob. Later execution copies the exact reviewed blob by commit/tree identity.
- Update/persistence: any byte, mode, path, blob or lineage change requires new review and owner approval. Protected launcher bytes mount read-only.
- Protection/hostile-admin: assumes the measured-execution service and kernel enforce immutable mounts and TOCTOU-safe file-descriptor execution. A hostile platform admin is outside the reduced guarantee; within scope, replacement after measurement must fail. Alternative: a small statically linked launcher whose source/toolchain/reproducible binary are separately pinned, or a Nitro Enclave EIF launcher with PCR-bound attestation.
- Dependency implication: Bash, stat, sha256sum, printf and their full closure are included below. This candidate is not the ultimate hardware trust root; owner approval must also name the measured-execution service that authenticates its protected configuration.

## Candidate C - protected pin store

- Artifact: `bootstrap-pin-store.candidate.json`, canonical sorted-key compact JSON plus LF, mode `100644`, 958 bytes, SHA-256 `a0fe3cae00b8bcd3df52819daa9d4ad579ad744eb4a49326cdb5a1024d36275e`, Git blob `177c809961298bc6846faf59222a5a29bbffae79` before final commit.
- Provenance: exact reviewed repository bytes and owner-approved descendant lineage from `d274fc8`.
- Role: binds candidate base image and exact future script identity. It grants no execution authority while its `authority` field is `CANDIDATE_FOR_OWNER_APPROVAL`.
- Protection/persistence: candidate storage is Git only. Proposed approved persistence is an offline-root-signed, append-only pin record replicated into the external launcher's protected read-only configuration, with monotonic sequence and rollback floor. The signer key, protected store product and measurement service require explicit owner selection; this JSON does not self-authorize them.
- Update model: append a higher-sequence signed record after independent review and owner approval; no mutation, rollback or wildcard.
- Hostile-admin implications: repository or CI admin cannot authorize a pin. A protected-store/platform admin is outside the reduced application-adversary guarantee but must be constrained by offline signature, monotonic floor and measured configuration for operational defense.
- Alternatives: cloud KMS policy bound to an attested workload measurement; TPM-sealed local record plus offline signature; Nitro Enclave KMS attestation with PCR conditions. Each adds vendor/runtime dependencies that must be pinned before selection.

Because the protected-store product, its offline signer and measured-execution service remain candidate choices, Candidate C cannot be approved as written without that owner decision. This is deliberate candidacy, not `UNASSIGNED` authority.

## Exact future script review artifact

`future-rust-provisioning-script.review-bytes` is the complete proposed future script: mode `100644`, no shebang, 8,738 bytes, SHA-256 `7d6b7c6399919ebfc4c9f3eea4455b5033ec6ed0a57ffed570ecfe525fde9b33`, Git blob `2622618addebf7385bda722295965540cf51c849` before final commit. It was written and hashed as data and never invoked. Its path, raw bytes, hash, length, mode and final commit blob comprise `PINNED_SCRIPT_IDENTITY` after review. `PINNED_SCRIPT_IDENTITY` never means `EXECUTION_AUTHORIZED`. Any byte or metadata change invalidates review.

The review artifact consumes already-downloaded exact Rust inputs. Retrieval is a distinct launcher-controlled phase using admitted `/usr/bin/curl` and the pinned CA/resolver closure, before the script runs. This prevents downloaded bytes from being executed before the script's validations.

## Mechanically derived capability graph

Operations map to declared capabilities:

| Operation | Exact capability/data |
|---|---|
| interpreter/control/fixed comparisons | `/usr/bin/bash` and its loader/library closure |
| HTTPS input delivery | `/usr/bin/curl`, CA bundle, resolver/NSS data/modules, its recursive closure |
| hash/signature | `/usr/bin/sha256sum`, `/usr/bin/gpg`, pinned Rust key, isolated empty GPG home |
| manifest checks | exact hashes first, then fixed-string/count parser `/usr/bin/grep`; it accepts only the signed exact manifest hash, so no general TOML parser parses untrusted variants |
| archive inspection/extraction | `/usr/bin/tar`, `/usr/bin/xz`, `/usr/bin/grep`, fixed safe-path rejection |
| recursive discovery/metadata/canonical ordering | `/usr/bin/find`, `/usr/bin/sort`, `/usr/bin/stat`, `/usr/bin/readlink` when launcher measures symlinks |
| copy/seal/atomic marker | `/usr/bin/cp`, `/usr/bin/chmod`, `/usr/bin/mv`, `/usr/bin/sync` |
| evidence/byte comparison | Bash redirection/printf, `/usr/bin/printf`, `/usr/bin/cmp`, `/usr/bin/sha256sum` |
| NUL stream hashing | `/usr/bin/xargs` plus sha256sum |

The executable set is extracted from exact launcher/script bytes plus the retrieval phase, then recursive ELF interpreter and `DT_NEEDED` resolution produces the inventory below. No PATH command is allowed. Runtime-selected objects/data are added separately. Any undeclared executable, library, NSS module, GPG option/config, parser, resolver or host dependency is a hard stop.

## Graph classification and termination

- `TRUST_ROOT`: after approval only, the immutable OCI/rootfs measurement, selected measured-execution service, approved launcher/pin-store records and their protected signing/rollback state. Candidates are not yet TRUST_ROOT.
- `PINNED_AND_VERIFIED`: exact script, executables, loader/libraries, runtime data, CA bundle, GPG key and Rust artifacts, each verified by the approved external root before consumption.
- `NON_AUTHORITATIVE/OUT_OF_SCOPE`: kernel/hypervisor/platform administrator under the already approved reduced guarantee. Their identity is still recorded for evidence; they cannot be used to claim stronger resistance.

There is no fourth category. Every authoritative path is `protocol -> exact launcher/script operation -> exact capability/runtime data -> externally measured approved root`. GPG and sha256sum do not verify themselves. Candidates do not terminate the graph. Until all terminal candidates are approved: `HARD STOP - BOOTSTRAP_TRUST_ROOT_INCOMPLETE`.
| Exact canonical path | Class | Role | Bytes | SHA-256 | Provenance |
|---|---|---|---:|---|---|
| `/lib/x86_64-linux-gnu/ld-linux-x86-64.so.2` | PINNED_AND_VERIFIED | dynamic-library | 240936 | `9739c1dc9bff2b11533a38d4218a1a926638a4d8262ef1c9d75c17290ac257e9` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/bin/bash` | PINNED_AND_VERIFIED | executable | 1396520 | `59474588a312b6b6e73e5a42a59bf71e62b55416b6c9d5e4a6e1c630c2a9ecd4` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/bin/chmod` | PINNED_AND_VERIFIED | executable | 55816 | `e624a2e918718e570f989dd05b219278c9fa7ae3b3ab8830302b2d98e0c7dca8` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/bin/cmp` | PINNED_AND_VERIFIED | executable | 43408 | `b355472d3c90ea94d11ebb8b750e6946ccd348edc6fca4aefc1235c3994ef791` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/bin/cp` | PINNED_AND_VERIFIED | executable | 141832 | `8da5881bb59f65673bc22b3a09b0d663b19bc0e785cf986b05d41b8222449ec2` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/bin/curl` | PINNED_AND_VERIFIED | executable | 260328 | `9bde64e896b6bd9b59f5761c5ff7e0e6e9142695db2f25f8137d0db2e16f66d0` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/bin/find` | PINNED_AND_VERIFIED | executable | 282088 | `791b89c8bffb8101fd7d4d212b80af66a2332834b05a42721104eb47e8fa2eb1` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/bin/gpg` | PINNED_AND_VERIFIED | executable | 1050624 | `3a27f40515781b739c5ce4a438db33016b78f8e3f112b671aa891acb91133bf8` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/bin/grep` | PINNED_AND_VERIFIED | executable | 182728 | `73abb4280520053564fd4917286909ba3b054598b32c9cdfaf1d733e0202cc96` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/bin/mkdir` | PINNED_AND_VERIFIED | executable | 68104 | `bd2f081ac37d653181332bd27f35a6041dbf215a7957f65838a9cbec9e64928b` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/bin/mv` | PINNED_AND_VERIFIED | executable | 137752 | `8e2b0545d39a38c2167949bafa943a9d848f363ded3782a9c350fe5e1a66d82c` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/bin/printf` | PINNED_AND_VERIFIED | executable | 51648 | `71f5e524ddba07b97b8b79913103f57dc7ac6a0dd71eed1f3945083b630b4af2` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/bin/rm` | PINNED_AND_VERIFIED | executable | 59912 | `7477c0f734a465a39a4fe40f6a9bb9d7431827e0a1d799ad1f25855b5dc63682` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/bin/sha256sum` | PINNED_AND_VERIFIED | executable | 51624 | `7645c8e76d75515ccb75c9086bdcf0d4071f2985f380f249253ead7d7c6810b3` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/bin/sort` | PINNED_AND_VERIFIED | executable | 101176 | `0fc26ce295e8e549635da2129e389f63685745b3be7c1737db6251a296f1cd78` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/bin/stat` | PINNED_AND_VERIFIED | executable | 80400 | `9b571b54bd2f17f5fbb841e1886c2d364f5138a02533f4ac3dbfbdaf4dddbea3` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/bin/sync` | PINNED_AND_VERIFIED | executable | 35240 | `c348f0056e87c717b1864955ab5979604bfe374958bbce24ce451461e8354cb3` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/bin/tar` | PINNED_AND_VERIFIED | executable | 517952 | `148313667aa9111de45fe3c70a1c7c963ae5f015071a106c4cdabea749d2db9f` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/bin/xargs` | PINNED_AND_VERIFIED | executable | 63912 | `ff3eca2d9d88883c0e997a5dbe62883819fffb40d12194ebd753848b7c7b3f0b` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/bin/xz` | PINNED_AND_VERIFIED | executable | 84504 | `bf66862cb9945876668da02c1522a57ad1824a4bde7c510df497db7c15cbe2ed` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/ld-linux-x86-64.so.2` | PINNED_AND_VERIFIED | dynamic-library | 240936 | `9739c1dc9bff2b11533a38d4218a1a926638a4d8262ef1c9d75c17290ac257e9` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libacl.so.1.1.2301` | PINNED_AND_VERIFIED | dynamic-library | 34888 | `b35d4bbf00844a585e02502b8a1db17b740a0127e2fb9a4428a83eaa0f23be65` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libassuan.so.0.8.5` | PINNED_AND_VERIFIED | dynamic-library | 84288 | `336d94b12e2eeff94981163f5fc1bd1af76f26d8da8fcd9664bb71a7ef245584` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libattr.so.1.1.2501` | PINNED_AND_VERIFIED | dynamic-library | 26696 | `5f0471b6d14d4090263ea2f859a07b5bdf56a235335fafab5e0ce1ed2c6815ba` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libbrotlicommon.so.1.0.9` | PINNED_AND_VERIFIED | dynamic-library | 137560 | `abf86ae9362dbb413c740a55b194c74adb09a7bd92d8fbd96a293c797a4a6d08` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libbrotlidec.so.1.0.9` | PINNED_AND_VERIFIED | dynamic-library | 51512 | `db9dbda709a46c3ae124433f47c4db71167db8aaba4eafdfd99c8a3a14584463` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libbz2.so.1.0.4` | PINNED_AND_VERIFIED | dynamic-library | 74848 | `5e516f77fc36dd924fdf02c8489a217f55fa1548883d32c3a5e041fb25d47d6e` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libc.so.6` | PINNED_AND_VERIFIED | dynamic-library | 2220400 | `6e28ee37e8e1ee5ddb4292d58a668b8cd5bb5f928390b07021d842a91fff9f2b` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libcom_err.so.2.1` | PINNED_AND_VERIFIED | dynamic-library | 18504 | `f196091d8ec9790b4cd203ecdb0eab3b242d35ae8625ead7962d0a944a8fdfa5` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libcrypto.so.3` | PINNED_AND_VERIFIED | dynamic-library | 4455728 | `ef58def3bb20b203d413fd8e44bb9a4ce300573cf99ed43a12eddfac9e8cc17c` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libcurl.so.4.7.0` | PINNED_AND_VERIFIED | dynamic-library | 677656 | `ef05c8ea074e06dbf878c18fcfecbd0a6a819e2f780081fe17332a8e12885f26` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libffi.so.8.1.0` | PINNED_AND_VERIFIED | dynamic-library | 47688 | `247da4d5d34a91cadcdd6282be4c4644fcb8af001334d2b8a82ecda435418cbf` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libgcrypt.so.20.3.4` | PINNED_AND_VERIFIED | dynamic-library | 1296312 | `7ff6ae38b83fd19beb283fa784d845d0614a0ee92917dab950846bdb14cce4f3` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libgmp.so.10.4.1` | PINNED_AND_VERIFIED | dynamic-library | 526896 | `4dc20a901c6951e678e216e959da2534bcef7053e6efdf1492509baf142282b0` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libgnutls.so.30.31.0` | PINNED_AND_VERIFIED | dynamic-library | 2000320 | `a1c10edc89061a10d554c1b0bf989c4b9a092716b854b27700791ca0240d7416` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libgpg-error.so.0.32.1` | PINNED_AND_VERIFIED | dynamic-library | 149760 | `ed682e103b671d628ef11f19f8a5b772b8d2501ba26e4b80c055331a4c4d8dfc` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libgssapi_krb5.so.2.2` | PINNED_AND_VERIFIED | dynamic-library | 338648 | `74c938dcc051d96376e4a396d4694f0ce9da54c08fce18c593148ad567f93810` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libhogweed.so.6.4` | PINNED_AND_VERIFIED | dynamic-library | 289800 | `47d56894948545036bd49aed718393bf6edb93fce222874dad30b59f085ad9ee` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libidn2.so.0.3.7` | PINNED_AND_VERIFIED | dynamic-library | 129096 | `1420c60a18189fb2e7bb4b8da1409564b0c1c46c59df5bbb0c23339bb961403a` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libk5crypto.so.3.1` | PINNED_AND_VERIFIED | dynamic-library | 182864 | `43d6a714cda56141db7070f16c2ca4a33ed93c5af848b8ee226749fb29f3ef9d` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libkeyutils.so.1.9` | PINNED_AND_VERIFIED | dynamic-library | 22600 | `ad20d5fb89df5297073b46373c65bfbb01f33a00b4949894055d29a7fcf00900` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libkrb5.so.3.3` | PINNED_AND_VERIFIED | dynamic-library | 827936 | `7ccebba46ab1548e386e4884c0bc6553d4297789d53324d890fa30f0c87ee31b` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libkrb5support.so.0.1` | PINNED_AND_VERIFIED | dynamic-library | 52016 | `134342eac5baf7a0c5a37be979bf8addb22d171220441478f98ba6cd2771d14d` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/liblber-2.5.so.0.1.14` | PINNED_AND_VERIFIED | dynamic-library | 63992 | `ff904533b0a8f824009e5d41e8e56f8a668829874f7bdd6c2b5f1a9ac4deb643` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libldap-2.5.so.0.1.14` | PINNED_AND_VERIFIED | dynamic-library | 380608 | `22fb2ed060fb58a7ffd0f11e5850b78eb4bfc52c108f8f52d3594c871d2bfaf1` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/liblzma.so.5.2.5` | PINNED_AND_VERIFIED | dynamic-library | 170456 | `493cb401ab4aa3bba611ca464d12996afb3b327940d29476f535f999e167439b` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libm.so.6` | PINNED_AND_VERIFIED | dynamic-library | 940560 | `1a08a427bbf3790aa434d2310e8c724846ec72ba7811982e85b0002dd296ca92` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libnettle.so.8.4` | PINNED_AND_VERIFIED | dynamic-library | 281000 | `2d3bda6cfa2d477cd91b8178843d19e081b911a124f04b4be06b6e32c9fabc73` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libnghttp2.so.14.20.1` | PINNED_AND_VERIFIED | dynamic-library | 166288 | `1cc16764b791a539548534872f094937924b3d5af3b59936d28386f1ad6b2d27` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libp11-kit.so.0.3.0` | PINNED_AND_VERIFIED | dynamic-library | 1285888 | `d2b01eaad185e95ef312940a3bdd4b6694f992b022a2dddb9dd494286e5a1d2c` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libpcre.so.3.13.3` | PINNED_AND_VERIFIED | dynamic-library | 477296 | `baae995e98223eee1afe6c640f21bdbba91b9c170584ce766418b59810d98a93` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libpcre2-8.so.0.10.4` | PINNED_AND_VERIFIED | dynamic-library | 613064 | `f887eed7d0df7073f3d8bdc9e60d35082453b10165cf45359b5019e33ba2b9ec` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libpsl.so.5.3.2` | PINNED_AND_VERIFIED | dynamic-library | 75768 | `95ca960ec3417da3d9505c8d2c6f0e9b7caf79ab900f6099a6bd938cf91069c5` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libreadline.so.8.1` | PINNED_AND_VERIFIED | dynamic-library | 335936 | `57419e3b177639246ecf7ffd2eba170bde779b7369d70e68b9b4c5fc3051cbc1` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libresolv.so.2` | PINNED_AND_VERIFIED | dynamic-library | 68552 | `4ed65f06525c7718eafdb95042c1c03f3e8b10f20729f31b1dadf0d05e3fe495` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/librtmp.so.1` | PINNED_AND_VERIFIED | dynamic-library | 121864 | `2401c4fc99c7b93e79648071224a6eb230dcb800184ccacc8e1854e33fc61445` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libsasl2.so.2.0.25` | PINNED_AND_VERIFIED | dynamic-library | 105392 | `344870a9ff3cfee1df28f518e9e93073df8d0522a288f016f06fdacbfa49eed8` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libselinux.so.1` | PINNED_AND_VERIFIED | dynamic-library | 166280 | `624eb1e6a7510e0983e9caa1bbf3e1966acb64fd6d3ad4db94528addbe1e7224` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libsqlite3.so.0.8.6` | PINNED_AND_VERIFIED | dynamic-library | 1358520 | `4afd0a63b217e9ad1716ededa0f90d2dbb0561136e69c363e423e2f501afd0d4` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libssh.so.4.8.7` | PINNED_AND_VERIFIED | dynamic-library | 446040 | `c573988dcda553787da78bcdac87059687fad8b5713c855f6883a0bcd9223459` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libssl.so.3` | PINNED_AND_VERIFIED | dynamic-library | 667864 | `660a6abeaa243ab1487155bf770df19e599459c074db3a016578cf3cd4ffb720` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libtasn1.so.6.6.2` | PINNED_AND_VERIFIED | dynamic-library | 92312 | `5982aae4da76969d6ca4c2acae79bce72eafd479493879ed821e9c3461760390` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libtinfo.so.6.3` | PINNED_AND_VERIFIED | dynamic-library | 200136 | `1594d475b771bf8cbb547f0e9b0c842ec37628d42c6747960b4d7c12a4cf4427` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libunistring.so.2.2.0` | PINNED_AND_VERIFIED | dynamic-library | 1743016 | `9c28d59500f186fc28bf7e77e9b1a71129f66731c52ac1e974b9acd1a760911a` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libz.so.1.2.11` | PINNED_AND_VERIFIED | dynamic-library | 108936 | `64c206f0146cc58bbddc4f22054436f4ff278f5a554aa3ce6921ddf7e9133370` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
| `/usr/lib/x86_64-linux-gnu/libzstd.so.1.4.8` | PINNED_AND_VERIFIED | dynamic-library | 841808 | `5df4f4df42d76270bb6981fabc7c1fdccd8ad28a23d84d67f73203fb3f537667` | exact file from MCR OCI manifest `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`; package origin mapped by embedded dpkg database |
## Archive-type hostile fixtures

Exact deterministic GNU-format `.tar.xz` review fixtures prove the pinned listing parser rejects each special type before extraction:

| Fixture | Bytes | SHA-256 | Required result |
|---|---:|---|---|
| `block-device.tar.xz` | 156 | `d5984776126fa10bd08e60d4160fc66bed3b9be9065960fe7463dbb8cce9a78f` | `E_ARCHIVE_TYPE` before extraction |
| `char-device.tar.xz` | 156 | `be118ed40deb14eb4e3d4089986e59e594b1ec2873e95a140ff900983b0cb798` | `E_ARCHIVE_TYPE` before extraction |
| `fifo.tar.xz` | 148 | `621a9ebef2ede194ef051e4277a80076e13393132aa521433e23391dd361338e` | `E_ARCHIVE_TYPE` before extraction |
| `hardlink.tar.xz` | 180 | `4e47c655bad5e7d16305f8c2a7fa61bdad1e1c092de982ff1c6e896fff01ae6b` | `E_ARCHIVE_TYPE` before extraction |
| `symlink.tar.xz` | 152 | `7e64f11491d5b0e3ccf7d30d5def02239e8f0dd25f632a8ba2cce9c0b501c77c` | `E_ARCHIVE_TYPE` before extraction |

The parser runs with `LC_ALL=C`, `--quoting-style=escape`, `--numeric-owner` and `--full-time`, accepts listing records beginning only `-` or `d`, and requires `E_ARCHIVE_TYPE` for each fixture. Review records that no extraction command was invoked. Any GNU tar formatting change requires new fixtures and review; a future machine-readable verifier is preferred.

## Runtime-data candidates

| Path | Class | Bytes | SHA-256 | Purpose/provenance |
|---|---|---:|---|---|
| `/etc/ld.so.cache` | PINNED_AND_VERIFIED | 12172 | `b86229bfba404d5a0e8cc0f42fe2444242ebc9b381e58ef834b6170095c22e3a` | exact loader cache from MCR OCI candidate; loader resolution also matches direct ELF closure |
| `/etc/os-release` | PINNED_AND_VERIFIED | 386 | `594d5ddd35aedb47f00d9c34d140017907a5b9f93c975aba125fc924daac5c07` | exact Ubuntu identity bytes from MCR candidate |
| `/etc/nsswitch.conf` | PINNED_AND_VERIFIED | 494 | `eec30745bade42a3f3f792e4d4192e57d2bcfe8e472433b1de426fe39a39cddb` | exact resolver selection from MCR candidate |
| `/etc/resolv.conf` | PINNED_AND_VERIFIED | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | empty image-layer file; execution must bind a separately owner-approved resolver injection or perform no DNS |
| `/etc/ssl/certs/ca-certificates.crt` | PINNED_AND_VERIFIED | 219342 | `6d84ab71cb726c0641b0af84303c316e3fa50db941dc8507d09045eb2fa5d238` | exact CA trust store from MCR candidate; no ambient host store |
| `/usr/lib/x86_64-linux-gnu/libnss_dns.so.2` | PINNED_AND_VERIFIED | 14352 | `f334ba8e66e7d0bbbd4f72d2771fc63ebcb6daef89438e4eff8815696b5c024d` | exact NSS DNS module from MCR candidate |
| `/usr/lib/x86_64-linux-gnu/libnss_files.so.2` | PINNED_AND_VERIFIED | 14352 | `8f8501037e70fdf85f0c5d894e38e857998bbc4909f00e329bb3e98b76913499` | exact NSS files module from MCR candidate |

### Resolver candidates requiring owner choice

The immutable image's `/etc/resolv.conf` is empty, so network retrieval cannot be approved without choosing exactly one concrete alternative:

- `RESOLVER_CANDIDATE_STATIC_IP`: resolve all `static.rust-lang.org` HTTPS endpoints outside the candidate; pin the exact IP set, TLS SNI/Host, retrieval time window and external signed resolver evidence. Curl uses reviewed `--resolve host:443:IP` vectors and the pinned CA bundle. Replacement requires a new signed mapping and owner approval. Risk: CDN IP churn and expiry.
- `RESOLVER_CANDIDATE_PINNED_FILE`: add a canonical `/etc/resolv.conf` review artifact containing exactly one approved DNS endpoint, with byte length/SHA-256 in the pin store; pin `/etc/hosts`, `/etc/gai.conf`, route/network namespace and the endpoint's authenticated operator identity. Replacement requires review and owner approval. Risk: DNS operator/network compromise and environment coupling.
- `RESOLVER_CANDIDATE_OFFLINE_INPUTS`: perform no network inside the measured candidate. A separately approved delivery service supplies the nine exact preverified input files into a content-addressed read-only input mount. Its signer/transport/launcher graph must be approved, but DNS, curl, CA and resolver nodes become `NON_AUTHORITATIVE/OUT_OF_SCOPE` for script execution. This is the preferred smaller runtime graph.

Each remains `CANDIDATE_FOR_OWNER_APPROVAL`. An empty or ambient resolver, injected host resolver, mutable DNS server or implicit container-runtime `/etc/resolv.conf` MUST FAIL CLOSED.

GPG uses `--no-options`, an explicit empty mode-0700 `GNUPGHOME`, the exact pinned key, no agent configuration and no ambient keyring. Locale is `C`, timezone is `UTC`, HOME is `/nonexistent`, PATH is empty and network proxy variables are rejected. The candidate image must prove that locale/timezone need no additional loaded data for these operations. `/dev/null`, shell/glibc/kernel file-test and filesystem semantics, `/etc/hosts`, `/etc/gai.conf`, `/etc/host.conf`, entropy source, kernel syscalls, mount policy and container runtime are explicit `NON_AUTHORITATIVE/OUT_OF_SCOPE` nodes under the reduced trusted-environment boundary; if a later threat model makes any authoritative, it must be pinned before approval.

## Provenance closure rule

Every inventory digest is paired with Ubuntu package ownership/version where the observed root exposes it. Approval additionally requires independent retrieval of the exact OCI image, package status database, Ubuntu archive package files, Release/InRelease signature chain and source/buildinfo metadata for every distinct package in the table. Reviewers must produce a package-to-file mapping and verify package payload hashes recreate the image paths. `UNRESOLVED_PACKAGE_PROVENANCE`, mutable repository metadata or digest-only origin evidence is a hard stop. The OCI digest binds host bytes; Ubuntu archive signatures/buildinfo establish origin. Neither alone substitutes for the other.

## Hostile plan for newly closed nodes

Negative fixtures mutate or substitute, one at a time: PATH substitution and same-version/different-binary tools; OCI index/manifest/config/layer; architecture/platform; launcher byte/blob/mode/path/lineage; pin-store byte/signature/sequence/rollback floor; CA certificate; NSS/resolver/hosts policy; GPG home/options/key/VALIDSIG; locale/loader cache; every executable, parser/inspection tool and library; script byte/digest/blob/mode; extra DT_NEEDED or dlopen object; stale package/provenance record; and measured-execution configuration. Each authoritative mismatch must produce a stable failure reason, no `BOOTSTRAP_VERIFIED`, no `RUST_TOOLCHAIN_PROVISIONED` and no mutation. Tests also prove candidates never pass the approval predicate.

## Review decision

The exact script bytes and graph can be reviewed now. The base image, launcher and pin-store remain candidates. Therefore the only permitted successful outcome for this package is `BOOTSTRAP_TRUST_ROOT_CANDIDATES_READY_FOR_OWNER_REVIEW`, not `BOOTSTRAP_PINNING_DESIGN_PASS`. No artifact in this package may be executed.

Authoritative references:
- Docker Official Ubuntu image: https://hub.docker.com/_/ubuntu
- OCI Distribution digest retrieval: https://registry-1.docker.io/v2/library/ubuntu/manifests/22.04
- AWS Nitro Enclaves attestation candidate background: https://docs.aws.amazon.com/enclaves/latest/user/set-up-attestation.html
- AWS KMS attestation conditions candidate background: https://docs.aws.amazon.com/kms/latest/developerguide/conditions-nitro-enclave.html

# Bootstrap Trust-Root Candidates and Complete Capability Graph

State: `BOOTSTRAP_TRUST_ROOT_CANDIDATES_READY_FOR_OWNER_REVIEW`

Every item below is `CANDIDATE_FOR_OWNER_APPROVAL`. Inclusion, identity, digest, review or reproducibility is not approval and cannot satisfy trust-root closure. The three candidates must be accepted or rejected independently. Any missing approval yields `HARD STOP - BOOTSTRAP_TRUST_ROOT_INCOMPLETE`.

## Candidate A - immutable base image

- Product/artifact: Docker Official Image `library/ubuntu:22.04`, OCI Linux/amd64 manifest.
- Immutable identity: index `sha256:b8b6ee6aa931ecd9d0d952abc34dc0e5f7c6a30c6bb71b079fe399fde0329c02`; Linux/amd64 manifest `sha256:281c5745f657873d78e5531fc5ba8575f46ab7769b94550ac99543f122679986`; config `sha256:bf7f4568d95723d2148bb19c688526d1404ef3302ef024bc1513ad8f533d46c8`; layer `sha256:20c3783cc497b5b0df1fc5f92bd64c3d2fbb24057c88692c8fda205b6ea8a2f2`.
- Authoritative provenance/retrieval: OCI Distribution API response from `registry-1.docker.io/library/ubuntu`; index selects the exact Linux/amd64 child. Reviewer must retrieve by digest, verify each content digest, unpack with OCI whiteout semantics and independently match the approved closure. A mutable `22.04` tag is discovery only.
- Role/platform binding: supplies the Linux/amd64 root filesystem. No other architecture, tag resolution or updated Jammy filesystem is authorized.
- Update model: replacement requires a new index/manifest/config/layer digest, full closure regeneration, independent review and owner approval. No in-place apt update.
- Persistence/protection: content-addressed layer and derived root remain read-only; output/evidence uses separate fresh mounts.
- Hostile-admin implications: a host admin can substitute mount/kernel/runtime. The narrow threat model places the measured execution environment outside the application adversary, but the external launcher must reject a rootfs digest or closure mismatch. This candidate does not defend a compromised launcher/hypervisor.
- Closure/risk: the observed 64-file/runtime-data candidate must be reproduced from this exact image. If it does not reproduce, reject this candidate rather than patching paths. OCI publisher-account compromise and lack of an owner-pinned publisher signature are residual provenance risks. Alternative: owner-built minimal image with signed reproducible build evidence or a separately signed Ubuntu cloud image.

## Candidate B - launcher

- Artifact: `future-bootstrap-launcher.review-bytes`, mode `100644`, 851 bytes, SHA-256 `fa265eefe57d3a8c48d3efcc5d08167d99d64d524ac72106509b9f0a4916c414`, Git blob `0553cc09a3fcc420ed5599bf7f901bc46650da75`.
- Provenance: exact repository bytes in this review package; owner-approved descendant lineage from `d274fc8`. It has no shebang and was not executed.
- Role: runs only after a higher-level measured-execution service has verified the OCI/rootfs and protected pin-store digest. It checks fixed script path, type, mode, length and digest, then invokes admitted Bash by absolute path.
- Immutable build/retrieval: no build; reviewers hash raw committed bytes and compare Git blob. Later execution copies the exact reviewed blob by commit/tree identity.
- Update/persistence: any byte, mode, path, blob or lineage change requires new review and owner approval. Protected launcher bytes mount read-only.
- Protection/hostile-admin: assumes the measured-execution service and kernel enforce immutable mounts and TOCTOU-safe file-descriptor execution. A hostile platform admin is outside the reduced guarantee; within scope, replacement after measurement must fail. Alternative: a small statically linked launcher whose source/toolchain/reproducible binary are separately pinned, or a Nitro Enclave EIF launcher with PCR-bound attestation.
- Dependency implication: Bash, stat, sha256sum, printf and their full closure are included below. This candidate is not the ultimate hardware trust root; owner approval must also name the measured-execution service that authenticates its protected configuration.

## Candidate C - protected pin store

- Artifact: `bootstrap-pin-store.candidate.json`, canonical sorted-key compact JSON plus LF, mode `100644`, 955 bytes, SHA-256 `16327ba3c721927a4d5db3358c2b47fd6273cb02e11ecbcaa3b6a2405fedf178`, Git blob `04b91e141ddbae48f8029631c70412269c4c0516`.
- Provenance: exact reviewed repository bytes and owner-approved descendant lineage from `d274fc8`.
- Role: binds candidate base image and exact future script identity. It grants no execution authority while its `authority` field is `CANDIDATE_FOR_OWNER_APPROVAL`.
- Protection/persistence: candidate storage is Git only. Proposed approved persistence is an offline-root-signed, append-only pin record replicated into the external launcher's protected read-only configuration, with monotonic sequence and rollback floor. The signer key, protected store product and measurement service require explicit owner selection; this JSON does not self-authorize them.
- Update model: append a higher-sequence signed record after independent review and owner approval; no mutation, rollback or wildcard.
- Hostile-admin implications: repository or CI admin cannot authorize a pin. A protected-store/platform admin is outside the reduced application-adversary guarantee but must be constrained by offline signature, monotonic floor and measured configuration for operational defense.
- Alternatives: cloud KMS policy bound to an attested workload measurement; TPM-sealed local record plus offline signature; Nitro Enclave KMS attestation with PCR conditions. Each adds vendor/runtime dependencies that must be pinned before selection.

Because the protected-store product, its offline signer and measured-execution service remain candidate choices, Candidate C cannot be approved as written without that owner decision. This is deliberate candidacy, not `UNASSIGNED` authority.

## Exact future script review artifact

`future-rust-provisioning-script.review-bytes` is the complete proposed future script: mode `100644`, no shebang, 5,032 bytes, SHA-256 `e9aac6e92dd2c8f6c53c90c8eb81a2520ba0edb774acefe76e493a0912608e58`, Git blob `c77570105436399719a6f3d3869327a0434df5a2`. It was written and hashed as data and never invoked. Its path, raw bytes, hash, length, mode and final commit blob comprise `PINNED_SCRIPT_IDENTITY` after review. `PINNED_SCRIPT_IDENTITY` never means `EXECUTION_AUTHORIZED`. Any byte or metadata change invalidates review.

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
| Exact canonical path | Class | Role | Bytes | SHA-256 | Ubuntu package provenance |
|---|---|---|---:|---|---|
| `/usr/bin/bash` | PINNED_AND_VERIFIED | executable | 1396520 | `59474588a312b6b6e73e5a42a59bf71e62b55416b6c9d5e4a6e1c630c2a9ecd4` | `bash 5.1-6ubuntu1.1 amd64` |
| `/usr/bin/chmod` | PINNED_AND_VERIFIED | executable | 55816 | `8a9091d6d2a0e5da7778ff6057b69097ec9bc4fcf1bfed9d8d94d5232dd72b50` | `coreutils 8.32-4.1ubuntu1.3 amd64` |
| `/usr/bin/cmp` | PINNED_AND_VERIFIED | executable | 43408 | `b355472d3c90ea94d11ebb8b750e6946ccd348edc6fca4aefc1235c3994ef791` | `diffutils 1:3.8-0ubuntu2 amd64` |
| `/usr/bin/cp` | PINNED_AND_VERIFIED | executable | 141832 | `350a14620bfe68a43580059688d3a0d0e38299d22d058b3fa8e1bf8ba322e4b4` | `coreutils 8.32-4.1ubuntu1.3 amd64` |
| `/usr/bin/curl` | PINNED_AND_VERIFIED | executable | 260328 | `0ca2b923679ab186f6512c7512e131a1c5c1b43d4cb5d55933998405b39e85bf` | `curl 7.81.0-1ubuntu1.25 amd64` |
| `/usr/bin/find` | PINNED_AND_VERIFIED | executable | 282088 | `791b89c8bffb8101fd7d4d212b80af66a2332834b05a42721104eb47e8fa2eb1` | `findutils 4.8.0-1ubuntu3 amd64` |
| `/usr/bin/gpg` | PINNED_AND_VERIFIED | executable | 1050624 | `9dcc2c88ecfe281b416b47453444cb382dac67f62e9a551fbbec0417441cf480` | `gpg 2.2.27-3ubuntu2.5 amd64` |
| `/usr/bin/grep` | PINNED_AND_VERIFIED | executable | 182728 | `73abb4280520053564fd4917286909ba3b054598b32c9cdfaf1d733e0202cc96` | `grep 3.7-1build1 amd64` |
| `/usr/bin/mkdir` | PINNED_AND_VERIFIED | executable | 68104 | `1bf979d8d0ec5a3b64f24806668b738940c8735790098c96e0bb2a16d81fe516` | `coreutils 8.32-4.1ubuntu1.3 amd64` |
| `/usr/bin/mv` | PINNED_AND_VERIFIED | executable | 137752 | `6a3628d6d00fcb05b0550c503804a94075a8c4b74a9e4b76eedf023086fec3af` | `coreutils 8.32-4.1ubuntu1.3 amd64` |
| `/usr/bin/printf` | PINNED_AND_VERIFIED | executable | 51648 | `1ecedcd1c04456313c96ba0ec8f0ae75d437364d8e8ba502d133d515dfe7c331` | `coreutils 8.32-4.1ubuntu1.3 amd64` |
| `/usr/bin/sha256sum` | PINNED_AND_VERIFIED | executable | 51624 | `b88ea413571562a591268213d736121fada5ba14330bfcc74b8d9f14e4018ddf` | `coreutils 8.32-4.1ubuntu1.3 amd64` |
| `/usr/bin/sort` | PINNED_AND_VERIFIED | executable | 101176 | `dc0a7dda1bd9dbf795fa1fb57015d5abc08221b9d577d9b399998fcc8634ccf1` | `coreutils 8.32-4.1ubuntu1.3 amd64` |
| `/usr/bin/stat` | PINNED_AND_VERIFIED | executable | 80400 | `3f0fb4f434ee0f531179a85ed4e91b44c718317c1514ddc17e23630c72b71b82` | `coreutils 8.32-4.1ubuntu1.3 amd64` |
| `/usr/bin/sync` | PINNED_AND_VERIFIED | executable | 35240 | `802ef14c64e3b1e47340995c12dceda27dd24919843bdc72d3a5a15a9ff95077` | `coreutils 8.32-4.1ubuntu1.3 amd64` |
| `/usr/bin/tar` | PINNED_AND_VERIFIED | executable | 522048 | `fd0d62eed19efd3e115aa1be44160f89d777cd1e6d6d8eb0ce7c8bdc879f59e2` | `tar 1.34+dfsg-1ubuntu0.1.22.04.6 amd64` |
| `/usr/bin/xargs` | PINNED_AND_VERIFIED | executable | 63912 | `ff3eca2d9d88883c0e997a5dbe62883819fffb40d12194ebd753848b7c7b3f0b` | `findutils 4.8.0-1ubuntu3 amd64` |
| `/usr/bin/xz` | PINNED_AND_VERIFIED | executable | 84504 | `d0ef210d5cf6ce495db2994254b183907989686c8647440fa2eb03cf99903e21` | `xz-utils 5.2.5-2ubuntu1.1 amd64` |
| `/usr/lib/x86_64-linux-gnu/ld-linux-x86-64.so.2` | PINNED_AND_VERIFIED | dynamic-library | 240936 | `9eb34cb2da3ae2a9398cc09b3cd2d069563ec40d9858cb711af15cd23fa80abf` | `libc6:amd64 2.35-0ubuntu3.13 amd64` |
| `/usr/lib/x86_64-linux-gnu/libacl.so.1.1.2301` | PINNED_AND_VERIFIED | dynamic-library | 34888 | `b35d4bbf00844a585e02502b8a1db17b740a0127e2fb9a4428a83eaa0f23be65` | `libacl1:amd64 2.3.1-1 amd64` |
| `/usr/lib/x86_64-linux-gnu/libassuan.so.0.8.5` | PINNED_AND_VERIFIED | dynamic-library | 84288 | `336d94b12e2eeff94981163f5fc1bd1af76f26d8da8fcd9664bb71a7ef245584` | `libassuan0:amd64 2.5.5-1build1 amd64` |
| `/usr/lib/x86_64-linux-gnu/libattr.so.1.1.2501` | PINNED_AND_VERIFIED | dynamic-library | 26696 | `5f0471b6d14d4090263ea2f859a07b5bdf56a235335fafab5e0ce1ed2c6815ba` | `libattr1:amd64 1:2.5.1-1build1 amd64` |
| `/usr/lib/x86_64-linux-gnu/libbrotlicommon.so.1.0.9` | PINNED_AND_VERIFIED | dynamic-library | 137560 | `abf86ae9362dbb413c740a55b194c74adb09a7bd92d8fbd96a293c797a4a6d08` | `libbrotli1:amd64 1.0.9-2build6 amd64` |
| `/usr/lib/x86_64-linux-gnu/libbrotlidec.so.1.0.9` | PINNED_AND_VERIFIED | dynamic-library | 51512 | `db9dbda709a46c3ae124433f47c4db71167db8aaba4eafdfd99c8a3a14584463` | `libbrotli1:amd64 1.0.9-2build6 amd64` |
| `/usr/lib/x86_64-linux-gnu/libbz2.so.1.0.4` | PINNED_AND_VERIFIED | dynamic-library | 74848 | `5e516f77fc36dd924fdf02c8489a217f55fa1548883d32c3a5e041fb25d47d6e` | `libbz2-1.0:amd64 1.0.8-5build1 amd64` |
| `/usr/lib/x86_64-linux-gnu/libc.so.6` | PINNED_AND_VERIFIED | dynamic-library | 2220400 | `c53819710b163d3f1d2541778590d58d3ef31cb0ed75adcbe059faac68c1e72d` | `libc6:amd64 2.35-0ubuntu3.13 amd64` |
| `/usr/lib/x86_64-linux-gnu/libcom_err.so.2.1` | PINNED_AND_VERIFIED | dynamic-library | 18504 | `f196091d8ec9790b4cd203ecdb0eab3b242d35ae8625ead7962d0a944a8fdfa5` | `libcom-err2:amd64 1.46.5-2ubuntu1.2 amd64` |
| `/usr/lib/x86_64-linux-gnu/libcrypto.so.3` | PINNED_AND_VERIFIED | dynamic-library | 4455728 | `956faca08210194c3753ad5c756234ccf3ea9f4938c697676be614993694603b` | `libssl3:amd64 3.0.2-0ubuntu1.21 amd64` |
| `/usr/lib/x86_64-linux-gnu/libcurl.so.4.7.0` | PINNED_AND_VERIFIED | dynamic-library | 677656 | `0b6cae5c8f3ba2e76777d4fcffebbc4baaea3d8016bca0f0606f2ff104cbd7ac` | `libcurl4:amd64 7.81.0-1ubuntu1.25 amd64` |
| `/usr/lib/x86_64-linux-gnu/libffi.so.8.1.0` | PINNED_AND_VERIFIED | dynamic-library | 47688 | `247da4d5d34a91cadcdd6282be4c4644fcb8af001334d2b8a82ecda435418cbf` | `libffi8:amd64 3.4.2-4 amd64` |
| `/usr/lib/x86_64-linux-gnu/libgcrypt.so.20.3.4` | PINNED_AND_VERIFIED | dynamic-library | 1296312 | `7ff6ae38b83fd19beb283fa784d845d0614a0ee92917dab950846bdb14cce4f3` | `libgcrypt20:amd64 1.9.4-3ubuntu3 amd64` |
| `/usr/lib/x86_64-linux-gnu/libgmp.so.10.4.1` | PINNED_AND_VERIFIED | dynamic-library | 526896 | `4dc20a901c6951e678e216e959da2534bcef7053e6efdf1492509baf142282b0` | `libgmp10:amd64 2:6.2.1+dfsg-3ubuntu1 amd64` |
| `/usr/lib/x86_64-linux-gnu/libgnutls.so.30.31.0` | PINNED_AND_VERIFIED | dynamic-library | 2004416 | `55ef3c5cf96f363ee3587a702108949e443caab2c40fb903f676c9667e8a789c` | `libgnutls30:amd64 3.7.3-4ubuntu1.8 amd64` |
| `/usr/lib/x86_64-linux-gnu/libgpg-error.so.0.32.1` | PINNED_AND_VERIFIED | dynamic-library | 149760 | `ed682e103b671d628ef11f19f8a5b772b8d2501ba26e4b80c055331a4c4d8dfc` | `libgpg-error0:amd64 1.43-3 amd64` |
| `/usr/lib/x86_64-linux-gnu/libgssapi_krb5.so.2.2` | PINNED_AND_VERIFIED | dynamic-library | 338648 | `74c938dcc051d96376e4a396d4694f0ce9da54c08fce18c593148ad567f93810` | `libgssapi-krb5-2:amd64 1.19.2-2ubuntu0.7 amd64` |
| `/usr/lib/x86_64-linux-gnu/libhogweed.so.6.4` | PINNED_AND_VERIFIED | dynamic-library | 289800 | `47d56894948545036bd49aed718393bf6edb93fce222874dad30b59f085ad9ee` | `libhogweed6:amd64 3.7.3-1build2 amd64` |
| `/usr/lib/x86_64-linux-gnu/libidn2.so.0.3.7` | PINNED_AND_VERIFIED | dynamic-library | 129096 | `1420c60a18189fb2e7bb4b8da1409564b0c1c46c59df5bbb0c23339bb961403a` | `libidn2-0:amd64 2.3.2-2build1 amd64` |
| `/usr/lib/x86_64-linux-gnu/libk5crypto.so.3.1` | PINNED_AND_VERIFIED | dynamic-library | 182864 | `43d6a714cda56141db7070f16c2ca4a33ed93c5af848b8ee226749fb29f3ef9d` | `libk5crypto3:amd64 1.19.2-2ubuntu0.7 amd64` |
| `/usr/lib/x86_64-linux-gnu/libkeyutils.so.1.9` | PINNED_AND_VERIFIED | dynamic-library | 22600 | `ad20d5fb89df5297073b46373c65bfbb01f33a00b4949894055d29a7fcf00900` | `libkeyutils1:amd64 1.6.1-2ubuntu3 amd64` |
| `/usr/lib/x86_64-linux-gnu/libkrb5.so.3.3` | PINNED_AND_VERIFIED | dynamic-library | 827936 | `7ccebba46ab1548e386e4884c0bc6553d4297789d53324d890fa30f0c87ee31b` | `libkrb5-3:amd64 1.19.2-2ubuntu0.7 amd64` |
| `/usr/lib/x86_64-linux-gnu/libkrb5support.so.0.1` | PINNED_AND_VERIFIED | dynamic-library | 52016 | `134342eac5baf7a0c5a37be979bf8addb22d171220441478f98ba6cd2771d14d` | `libkrb5support0:amd64 1.19.2-2ubuntu0.7 amd64` |
| `/usr/lib/x86_64-linux-gnu/liblber-2.5.so.0.1.15` | PINNED_AND_VERIFIED | dynamic-library | 63992 | `3d6d7558e2764fa0a2ee3ee9bf1754bff872bed23148d673bdb648f737ec39ff` | `libldap-2.5-0:amd64 2.5.20+dfsg-0ubuntu0.22.04.1 amd64` |
| `/usr/lib/x86_64-linux-gnu/libldap-2.5.so.0.1.15` | PINNED_AND_VERIFIED | dynamic-library | 380608 | `f7c5ddb238bc12a13c4d4b4f8e6ea8af61f8bd144651728936d31b65bec7bbdc` | `libldap-2.5-0:amd64 2.5.20+dfsg-0ubuntu0.22.04.1 amd64` |
| `/usr/lib/x86_64-linux-gnu/liblzma.so.5.2.5` | PINNED_AND_VERIFIED | dynamic-library | 170456 | `493cb401ab4aa3bba611ca464d12996afb3b327940d29476f535f999e167439b` | `liblzma5:amd64 5.2.5-2ubuntu1 amd64` |
| `/usr/lib/x86_64-linux-gnu/libm.so.6` | PINNED_AND_VERIFIED | dynamic-library | 940560 | `00830df310aac5023e10bd7b715149ab8ddc682277fd8ae3539a7a44fcdd6c38` | `libc6:amd64 2.35-0ubuntu3.13 amd64` |
| `/usr/lib/x86_64-linux-gnu/libnettle.so.8.4` | PINNED_AND_VERIFIED | dynamic-library | 281000 | `2d3bda6cfa2d477cd91b8178843d19e081b911a124f04b4be06b6e32c9fabc73` | `libnettle8:amd64 3.7.3-1build2 amd64` |
| `/usr/lib/x86_64-linux-gnu/libnghttp2.so.14.20.1` | PINNED_AND_VERIFIED | dynamic-library | 166288 | `1cc16764b791a539548534872f094937924b3d5af3b59936d28386f1ad6b2d27` | `libnghttp2-14:amd64 1.43.0-1ubuntu0.2 amd64` |
| `/usr/lib/x86_64-linux-gnu/libp11-kit.so.0.3.0` | PINNED_AND_VERIFIED | dynamic-library | 1285888 | `d2b01eaad185e95ef312940a3bdd4b6694f992b022a2dddb9dd494286e5a1d2c` | `libp11-kit0:amd64 0.24.0-6build1 amd64` |
| `/usr/lib/x86_64-linux-gnu/libpcre.so.3.13.3` | PINNED_AND_VERIFIED | dynamic-library | 477296 | `baae995e98223eee1afe6c640f21bdbba91b9c170584ce766418b59810d98a93` | `libpcre3:amd64 2:8.39-13ubuntu0.22.04.1 amd64` |
| `/usr/lib/x86_64-linux-gnu/libpcre2-8.so.0.10.4` | PINNED_AND_VERIFIED | dynamic-library | 613064 | `f887eed7d0df7073f3d8bdc9e60d35082453b10165cf45359b5019e33ba2b9ec` | `libpcre2-8-0:amd64 10.39-3ubuntu0.1 amd64` |
| `/usr/lib/x86_64-linux-gnu/libpsl.so.5.3.2` | PINNED_AND_VERIFIED | dynamic-library | 75768 | `95ca960ec3417da3d9505c8d2c6f0e9b7caf79ab900f6099a6bd938cf91069c5` | `libpsl5:amd64 0.21.0-1.2build2 amd64` |
| `/usr/lib/x86_64-linux-gnu/libreadline.so.8.1` | PINNED_AND_VERIFIED | dynamic-library | 335936 | `57419e3b177639246ecf7ffd2eba170bde779b7369d70e68b9b4c5fc3051cbc1` | `libreadline8:amd64 8.1.2-1 amd64` |
| `/usr/lib/x86_64-linux-gnu/libresolv.so.2` | PINNED_AND_VERIFIED | dynamic-library | 68552 | `0f40debbe0184c3a2b2f90ecb5aa7d499cae96e9d84e2859f866e5ed6e3018f8` | `libc6:amd64 2.35-0ubuntu3.13 amd64` |
| `/usr/lib/x86_64-linux-gnu/librtmp.so.1` | PINNED_AND_VERIFIED | dynamic-library | 121864 | `2401c4fc99c7b93e79648071224a6eb230dcb800184ccacc8e1854e33fc61445` | `librtmp1:amd64 2.4+20151223.gitfa8646d.1-2build4 amd64` |
| `/usr/lib/x86_64-linux-gnu/libsasl2.so.2.0.25` | PINNED_AND_VERIFIED | dynamic-library | 105392 | `344870a9ff3cfee1df28f518e9e93073df8d0522a288f016f06fdacbfa49eed8` | `libsasl2-2:amd64 2.1.27+dfsg2-3ubuntu1.2 amd64` |
| `/usr/lib/x86_64-linux-gnu/libselinux.so.1` | PINNED_AND_VERIFIED | dynamic-library | 166280 | `624eb1e6a7510e0983e9caa1bbf3e1966acb64fd6d3ad4db94528addbe1e7224` | `libselinux1:amd64 3.3-1build2 amd64` |
| `/usr/lib/x86_64-linux-gnu/libsqlite3.so.0.8.6` | PINNED_AND_VERIFIED | dynamic-library | 1358520 | `26917e4509991ee5c180c3dcfc39630f1bf81bc7812a5711be0cbaaef1650148` | `libsqlite3-0:amd64 3.37.2-2ubuntu0.7 amd64` |
| `/usr/lib/x86_64-linux-gnu/libssh.so.4.8.7` | PINNED_AND_VERIFIED | dynamic-library | 446040 | `66a3c908ba71ea89be3ddba61704cbb1d9fcbfeaa80b24f2d22174f27e41e36c` | `libssh-4:amd64 0.9.6-2ubuntu0.22.04.7 amd64` |
| `/usr/lib/x86_64-linux-gnu/libssl.so.3` | PINNED_AND_VERIFIED | dynamic-library | 667864 | `d671f9ce5d85af6d3fffd89811c509f8a5525c187848ac767be921bf3fbd1d3f` | `libssl3:amd64 3.0.2-0ubuntu1.21 amd64` |
| `/usr/lib/x86_64-linux-gnu/libtasn1.so.6.6.2` | PINNED_AND_VERIFIED | dynamic-library | 92312 | `f198a1272ca6a071b313646ae65fc1942628df8caebe07e4c377b15b68903358` | `libtasn1-6:amd64 4.18.0-4ubuntu0.2 amd64` |
| `/usr/lib/x86_64-linux-gnu/libtinfo.so.6.3` | PINNED_AND_VERIFIED | dynamic-library | 200136 | `1594d475b771bf8cbb547f0e9b0c842ec37628d42c6747960b4d7c12a4cf4427` | `libtinfo6:amd64 6.3-2ubuntu0.1 amd64` |
| `/usr/lib/x86_64-linux-gnu/libunistring.so.2.2.0` | PINNED_AND_VERIFIED | dynamic-library | 1743016 | `9c28d59500f186fc28bf7e77e9b1a71129f66731c52ac1e974b9acd1a760911a` | `libunistring2:amd64 1.0-1 amd64` |
| `/usr/lib/x86_64-linux-gnu/libz.so.1.2.11` | PINNED_AND_VERIFIED | dynamic-library | 108936 | `64c206f0146cc58bbddc4f22054436f4ff278f5a554aa3ce6921ddf7e9133370` | `zlib1g:amd64 1:1.2.11.dfsg-2ubuntu9.2 amd64` |
| `/usr/lib/x86_64-linux-gnu/libzstd.so.1.4.8` | PINNED_AND_VERIFIED | dynamic-library | 841808 | `5df4f4df42d76270bb6981fabc7c1fdccd8ad28a23d84d67f73203fb3f537667` | `libzstd1:amd64 1.4.8+dfsg-3build1 amd64` |
## Runtime-data candidates

| Path | Class | Bytes | SHA-256 | Purpose/provenance |
|---|---|---:|---|---|
| `/etc/ld.so.cache` | PINNED_AND_VERIFIED | 58476 | `7a26facbbba53fddc346f8d5bd3239c67809e11dc07d3265a448e75f1ecdbf1d` | loader cache from candidate rootfs; loader resolution must also match direct ELF closure |
| `/etc/os-release` | PINNED_AND_VERIFIED | 386 | `594d5ddd35aedb47f00d9c34d140017907a5b9f93c975aba125fc924daac5c07` | Ubuntu base identity data |
| `/etc/nsswitch.conf` | PINNED_AND_VERIFIED | 542 | `c82823e2e926b49e843d84bc8ec6d7f0861bda70bdd9d8716674609596ddb863` | resolver selection |
| `/etc/resolv.conf` | PINNED_AND_VERIFIED | 18 | `fa406b11186ddb2ef985e7055fd0694d59cade40c8ed71a7347b196e4d0a83f2` | candidate DNS endpoint policy; owner must decide whether environment-specific resolver bytes are acceptable |
| `/etc/ssl/certs/ca-certificates.crt` | PINNED_AND_VERIFIED | 182735 | `e8efe7ebeeb9ecf6024d98c18110e451ee105640e5468defee8fc82171c9170d` | Ubuntu `ca-certificates` trust store; exact bytes, not ambient host store |
| `/usr/lib/x86_64-linux-gnu/libnss_dns.so.2` | PINNED_AND_VERIFIED | 14352 | `b5d11c935472be35b59c0c9d15bf01f5c94e02dfd200883e9e993da09c7b73ea` | glibc NSS DNS module, Ubuntu libc6 provenance |
| `/usr/lib/x86_64-linux-gnu/libnss_files.so.2` | PINNED_AND_VERIFIED | 14352 | `423f14091ddbd452eac7d1944cb0efd2969d5ec8707a975b2055658070d5c51a` | glibc NSS files module, Ubuntu libc6 provenance |

GPG uses `--no-options`, an explicit empty mode-0700 `GNUPGHOME`, the exact pinned key, no agent configuration and no ambient keyring. Locale is `C`, timezone is `UTC`, HOME is `/nonexistent`, PATH is empty and network proxy variables are rejected. The candidate image must prove that locale/timezone need no additional loaded data for these operations. `/etc/hosts`, `/etc/gai.conf`, `/etc/host.conf`, entropy source, kernel syscalls, mount policy and container runtime are graph nodes that independent tracing must classify; if consumed authoritatively, they must be added with pins before approval.

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

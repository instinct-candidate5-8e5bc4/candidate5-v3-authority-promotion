# Measured-Execution Service Closure

Exact executable and recursive ELF interpreter/DT_NEEDED closure mechanically derived from the frozen service, launcher and script review bytes against the approved MCR OCI root. Canonical records are `path NUL role NUL decimal-length NUL lowercase-sha256 LF`, raw-path sorted: 24 executables, 44 files, 4,943 bytes, SHA-256 `5e0b440d868e0c9ad21743cd8a4903f43047cbf13993380d39bfd45349dd028d`. The canonical `.bin` bytes are service-enforced; this table is the human review rendering.

| Exact path | Class | Role | Bytes | SHA-256 |
|---|---|---|---:|---|
| `/lib/x86_64-linux-gnu/ld-linux-x86-64.so.2` | PINNED_AND_VERIFIED | dynamic-library | 240936 | `9739c1dc9bff2b11533a38d4218a1a926638a4d8262ef1c9d75c17290ac257e9` |
| `/usr/bin/bash` | PINNED_AND_VERIFIED | executable | 1396520 | `59474588a312b6b6e73e5a42a59bf71e62b55416b6c9d5e4a6e1c630c2a9ecd4` |
| `/usr/bin/cat` | PINNED_AND_VERIFIED | executable | 35288 | `210ffa7daedb3ef6e9230d391e9a10043699ba81080ebf40c6de70ed77e278ba` |
| `/usr/bin/chmod` | PINNED_AND_VERIFIED | executable | 55816 | `e624a2e918718e570f989dd05b219278c9fa7ae3b3ab8830302b2d98e0c7dca8` |
| `/usr/bin/cmp` | PINNED_AND_VERIFIED | executable | 43408 | `b355472d3c90ea94d11ebb8b750e6946ccd348edc6fca4aefc1235c3994ef791` |
| `/usr/bin/cp` | PINNED_AND_VERIFIED | executable | 141832 | `8da5881bb59f65673bc22b3a09b0d663b19bc0e785cf986b05d41b8222449ec2` |
| `/usr/bin/find` | PINNED_AND_VERIFIED | executable | 282088 | `791b89c8bffb8101fd7d4d212b80af66a2332834b05a42721104eb47e8fa2eb1` |
| `/usr/bin/gpg` | PINNED_AND_VERIFIED | executable | 1050624 | `3a27f40515781b739c5ce4a438db33016b78f8e3f112b671aa891acb91133bf8` |
| `/usr/bin/grep` | PINNED_AND_VERIFIED | executable | 182728 | `73abb4280520053564fd4917286909ba3b054598b32c9cdfaf1d733e0202cc96` |
| `/usr/bin/mkdir` | PINNED_AND_VERIFIED | executable | 68104 | `bd2f081ac37d653181332bd27f35a6041dbf215a7957f65838a9cbec9e64928b` |
| `/usr/bin/mv` | PINNED_AND_VERIFIED | executable | 137752 | `8e2b0545d39a38c2167949bafa943a9d848f363ded3782a9c350fe5e1a66d82c` |
| `/usr/bin/openssl` | PINNED_AND_VERIFIED | executable | 1001272 | `8b3df2d202d29791ec056d229506e5e547dabf7d8f130cd5be59a815bf6f72e6` |
| `/usr/bin/printf` | PINNED_AND_VERIFIED | executable | 51648 | `71f5e524ddba07b97b8b79913103f57dc7ac6a0dd71eed1f3945083b630b4af2` |
| `/usr/bin/rm` | PINNED_AND_VERIFIED | executable | 59912 | `7477c0f734a465a39a4fe40f6a9bb9d7431827e0a1d799ad1f25855b5dc63682` |
| `/usr/bin/sha1sum` | PINNED_AND_VERIFIED | executable | 43432 | `397034db86baf4f49d30a4bfd8e4d81751a808be454b131c7ed0821e597d2fde` |
| `/usr/bin/sha256sum` | PINNED_AND_VERIFIED | executable | 51624 | `7645c8e76d75515ccb75c9086bdcf0d4071f2985f380f249253ead7d7c6810b3` |
| `/usr/bin/sort` | PINNED_AND_VERIFIED | executable | 101176 | `0fc26ce295e8e549635da2129e389f63685745b3be7c1737db6251a296f1cd78` |
| `/usr/bin/stat` | PINNED_AND_VERIFIED | executable | 80400 | `9b571b54bd2f17f5fbb841e1886c2d364f5138a02533f4ac3dbfbdaf4dddbea3` |
| `/usr/bin/sync` | PINNED_AND_VERIFIED | executable | 35240 | `c348f0056e87c717b1864955ab5979604bfe374958bbce24ce451461e8354cb3` |
| `/usr/bin/tar` | PINNED_AND_VERIFIED | executable | 517952 | `148313667aa9111de45fe3c70a1c7c963ae5f015071a106c4cdabea749d2db9f` |
| `/usr/bin/tr` | PINNED_AND_VERIFIED | executable | 47624 | `24f53bbf7e48b1be3b71f20cf29963a44dbf084aafe5301f0ed1425b91d1c60c` |
| `/usr/bin/unshare` | PINNED_AND_VERIFIED | executable | 31336 | `ea175949d95fb64dcf6131758c6fc78ca318a241f7d4cb264ed63fbb5de77bcf` |
| `/usr/bin/wc` | PINNED_AND_VERIFIED | executable | 43440 | `504463c7a12780b7439321be6e67f43ab61a3ff429cbf916c0722d19f98692a8` |
| `/usr/bin/xargs` | PINNED_AND_VERIFIED | executable | 63912 | `ff3eca2d9d88883c0e997a5dbe62883819fffb40d12194ebd753848b7c7b3f0b` |
| `/usr/bin/xz` | PINNED_AND_VERIFIED | executable | 84504 | `bf66862cb9945876668da02c1522a57ad1824a4bde7c510df497db7c15cbe2ed` |
| `/usr/lib/x86_64-linux-gnu/ld-linux-x86-64.so.2` | PINNED_AND_VERIFIED | dynamic-library | 240936 | `9739c1dc9bff2b11533a38d4218a1a926638a4d8262ef1c9d75c17290ac257e9` |
| `/usr/lib/x86_64-linux-gnu/libacl.so.1.1.2301` | PINNED_AND_VERIFIED | dynamic-library | 34888 | `b35d4bbf00844a585e02502b8a1db17b740a0127e2fb9a4428a83eaa0f23be65` |
| `/usr/lib/x86_64-linux-gnu/libassuan.so.0.8.5` | PINNED_AND_VERIFIED | dynamic-library | 84288 | `336d94b12e2eeff94981163f5fc1bd1af76f26d8da8fcd9664bb71a7ef245584` |
| `/usr/lib/x86_64-linux-gnu/libattr.so.1.1.2501` | PINNED_AND_VERIFIED | dynamic-library | 26696 | `5f0471b6d14d4090263ea2f859a07b5bdf56a235335fafab5e0ce1ed2c6815ba` |
| `/usr/lib/x86_64-linux-gnu/libbz2.so.1.0.4` | PINNED_AND_VERIFIED | dynamic-library | 74848 | `5e516f77fc36dd924fdf02c8489a217f55fa1548883d32c3a5e041fb25d47d6e` |
| `/usr/lib/x86_64-linux-gnu/libc.so.6` | PINNED_AND_VERIFIED | dynamic-library | 2220400 | `6e28ee37e8e1ee5ddb4292d58a668b8cd5bb5f928390b07021d842a91fff9f2b` |
| `/usr/lib/x86_64-linux-gnu/libcrypto.so.3` | PINNED_AND_VERIFIED | dynamic-library | 4455728 | `ef58def3bb20b203d413fd8e44bb9a4ce300573cf99ed43a12eddfac9e8cc17c` |
| `/usr/lib/x86_64-linux-gnu/libgcrypt.so.20.3.4` | PINNED_AND_VERIFIED | dynamic-library | 1296312 | `7ff6ae38b83fd19beb283fa784d845d0614a0ee92917dab950846bdb14cce4f3` |
| `/usr/lib/x86_64-linux-gnu/libgpg-error.so.0.32.1` | PINNED_AND_VERIFIED | dynamic-library | 149760 | `ed682e103b671d628ef11f19f8a5b772b8d2501ba26e4b80c055331a4c4d8dfc` |
| `/usr/lib/x86_64-linux-gnu/liblzma.so.5.2.5` | PINNED_AND_VERIFIED | dynamic-library | 170456 | `493cb401ab4aa3bba611ca464d12996afb3b327940d29476f535f999e167439b` |
| `/usr/lib/x86_64-linux-gnu/libm.so.6` | PINNED_AND_VERIFIED | dynamic-library | 940560 | `1a08a427bbf3790aa434d2310e8c724846ec72ba7811982e85b0002dd296ca92` |
| `/usr/lib/x86_64-linux-gnu/libpcre.so.3.13.3` | PINNED_AND_VERIFIED | dynamic-library | 477296 | `baae995e98223eee1afe6c640f21bdbba91b9c170584ce766418b59810d98a93` |
| `/usr/lib/x86_64-linux-gnu/libpcre2-8.so.0.10.4` | PINNED_AND_VERIFIED | dynamic-library | 613064 | `f887eed7d0df7073f3d8bdc9e60d35082453b10165cf45359b5019e33ba2b9ec` |
| `/usr/lib/x86_64-linux-gnu/libreadline.so.8.1` | PINNED_AND_VERIFIED | dynamic-library | 335936 | `57419e3b177639246ecf7ffd2eba170bde779b7369d70e68b9b4c5fc3051cbc1` |
| `/usr/lib/x86_64-linux-gnu/libselinux.so.1` | PINNED_AND_VERIFIED | dynamic-library | 166280 | `624eb1e6a7510e0983e9caa1bbf3e1966acb64fd6d3ad4db94528addbe1e7224` |
| `/usr/lib/x86_64-linux-gnu/libsqlite3.so.0.8.6` | PINNED_AND_VERIFIED | dynamic-library | 1358520 | `4afd0a63b217e9ad1716ededa0f90d2dbb0561136e69c363e423e2f501afd0d4` |
| `/usr/lib/x86_64-linux-gnu/libssl.so.3` | PINNED_AND_VERIFIED | dynamic-library | 667864 | `660a6abeaa243ab1487155bf770df19e599459c074db3a016578cf3cd4ffb720` |
| `/usr/lib/x86_64-linux-gnu/libtinfo.so.6.3` | PINNED_AND_VERIFIED | dynamic-library | 200136 | `1594d475b771bf8cbb547f0e9b0c842ec37628d42c6747960b4d7c12a4cf4427` |
| `/usr/lib/x86_64-linux-gnu/libz.so.1.2.11` | PINNED_AND_VERIFIED | dynamic-library | 108936 | `64c206f0146cc58bbddc4f22054436f4ff278f5a554aa3ce6921ddf7e9133370` |

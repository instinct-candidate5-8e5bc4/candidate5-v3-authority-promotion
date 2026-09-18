# External Admission Runtime Closure

Canonical records are `path NUL role NUL decimal-length NUL lowercase-sha256 LF`, raw-path sorted. Mechanically derived from exact candidate command references and recursive ELF interpreter/DT_NEEDED resolution against the approved OCI root: 15 executables, 30 files, 3,428 bytes, SHA-256 `709f8ddc63321aee68b17e14e21cf8cf71b4e85181a5aaeb07161e30329a73d8`. Records name the actual external `/usr/bin` and `/usr/lib` namespace invoked.

| Exact path | Role | Bytes | SHA-256 |
|---|---|---:|---|
| `/lib/x86_64-linux-gnu/ld-linux-x86-64.so.2` | dynamic-library | 240936 | `9739c1dc9bff2b11533a38d4218a1a926638a4d8262ef1c9d75c17290ac257e9` |
| `/usr/bin/bash` | executable | 1396520 | `59474588a312b6b6e73e5a42a59bf71e62b55416b6c9d5e4a6e1c630c2a9ecd4` |
| `/usr/bin/cat` | executable | 35288 | `210ffa7daedb3ef6e9230d391e9a10043699ba81080ebf40c6de70ed77e278ba` |
| `/usr/bin/cmp` | executable | 43408 | `b355472d3c90ea94d11ebb8b750e6946ccd348edc6fca4aefc1235c3994ef791` |
| `/usr/bin/findmnt` | executable | 65136 | `2668fe017172fa496ca506b99879d1c3bc3c7e3f54f71ec0c6e24b1562610d60` |
| `/usr/bin/git` | executable | 3710360 | `5a39a7909c023f92a84b77b49e6b008f3f152b833135b96d73ac7c403314a88a` |
| `/usr/bin/mkdir` | executable | 68104 | `bd2f081ac37d653181332bd27f35a6041dbf215a7957f65838a9cbec9e64928b` |
| `/usr/bin/mv` | executable | 137752 | `8e2b0545d39a38c2167949bafa943a9d848f363ded3782a9c350fe5e1a66d82c` |
| `/usr/bin/openssl` | executable | 1001272 | `8b3df2d202d29791ec056d229506e5e547dabf7d8f130cd5be59a815bf6f72e6` |
| `/usr/bin/printf` | executable | 51648 | `71f5e524ddba07b97b8b79913103f57dc7ac6a0dd71eed1f3945083b630b4af2` |
| `/usr/bin/readlink` | executable | 39336 | `f6da8c9d4619cbfe63a480d516b62463b32da2e1d285a301ead8c7b97d776483` |
| `/usr/bin/rm` | executable | 59912 | `7477c0f734a465a39a4fe40f6a9bb9d7431827e0a1d799ad1f25855b5dc63682` |
| `/usr/bin/sha1sum` | executable | 43432 | `397034db86baf4f49d30a4bfd8e4d81751a808be454b131c7ed0821e597d2fde` |
| `/usr/bin/sha256sum` | executable | 51624 | `7645c8e76d75515ccb75c9086bdcf0d4071f2985f380f249253ead7d7c6810b3` |
| `/usr/bin/stat` | executable | 80400 | `9b571b54bd2f17f5fbb841e1886c2d364f5138a02533f4ac3dbfbdaf4dddbea3` |
| `/usr/bin/sync` | executable | 35240 | `c348f0056e87c717b1864955ab5979604bfe374958bbce24ce451461e8354cb3` |
| `/usr/lib/x86_64-linux-gnu/ld-linux-x86-64.so.2` | dynamic-library | 240936 | `9739c1dc9bff2b11533a38d4218a1a926638a4d8262ef1c9d75c17290ac257e9` |
| `/usr/lib/x86_64-linux-gnu/libacl.so.1.1.2301` | dynamic-library | 34888 | `b35d4bbf00844a585e02502b8a1db17b740a0127e2fb9a4428a83eaa0f23be65` |
| `/usr/lib/x86_64-linux-gnu/libattr.so.1.1.2501` | dynamic-library | 26696 | `5f0471b6d14d4090263ea2f859a07b5bdf56a235335fafab5e0ce1ed2c6815ba` |
| `/usr/lib/x86_64-linux-gnu/libblkid.so.1.1.0` | dynamic-library | 220208 | `16beebd82fee33310c355a040128b5f2fa78a73f2619919c34550732acc4ff42` |
| `/usr/lib/x86_64-linux-gnu/libc.so.6` | dynamic-library | 2220400 | `6e28ee37e8e1ee5ddb4292d58a668b8cd5bb5f928390b07021d842a91fff9f2b` |
| `/usr/lib/x86_64-linux-gnu/libcrypto.so.3` | dynamic-library | 4455728 | `ef58def3bb20b203d413fd8e44bb9a4ce300573cf99ed43a12eddfac9e8cc17c` |
| `/usr/lib/x86_64-linux-gnu/libmount.so.1.1.0` | dynamic-library | 273064 | `e80992b7e08db8c1bbe9da22715946f40ae1027dbc3d9740087d2c66edcab173` |
| `/usr/lib/x86_64-linux-gnu/libpcre2-8.so.0.10.4` | dynamic-library | 613064 | `f887eed7d0df7073f3d8bdc9e60d35082453b10165cf45359b5019e33ba2b9ec` |
| `/usr/lib/x86_64-linux-gnu/libselinux.so.1` | dynamic-library | 166280 | `624eb1e6a7510e0983e9caa1bbf3e1966acb64fd6d3ad4db94528addbe1e7224` |
| `/usr/lib/x86_64-linux-gnu/libsmartcols.so.1.1.0` | dynamic-library | 100504 | `cb0d1893c1cef53fda04eb64644e2dd1841c5f879efa491d984eb082d053ec5a` |
| `/usr/lib/x86_64-linux-gnu/libssl.so.3` | dynamic-library | 667864 | `660a6abeaa243ab1487155bf770df19e599459c074db3a016578cf3cd4ffb720` |
| `/usr/lib/x86_64-linux-gnu/libtinfo.so.6.3` | dynamic-library | 200136 | `1594d475b771bf8cbb547f0e9b0c842ec37628d42c6747960b4d7c12a4cf4427` |
| `/usr/lib/x86_64-linux-gnu/libudev.so.1.7.2` | dynamic-library | 166240 | `801bed8d1004e7ddfb34bf563d89f598bfc0497fa62582b730dc9a0c26490daa` |
| `/usr/lib/x86_64-linux-gnu/libz.so.1.2.11` | dynamic-library | 108936 | `64c206f0146cc58bbddc4f22054436f4ff278f5a554aa3ce6921ddf7e9133370` |

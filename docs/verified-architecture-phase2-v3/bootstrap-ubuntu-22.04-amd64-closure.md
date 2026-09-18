# Ubuntu 22.04 amd64 Bootstrap Closure Inventory

Design-time inventory of exact canonical paths and bytes observed for the intended 12 bootstrap executables and recursively resolved ELF dependencies. The later script review must independently reproduce this from the approved immutable Ubuntu base image. Canonical binary manifest is not committed in this design-only stage.

| Exact canonical path | Role | Bytes | SHA-256 |
|---|---|---:|---|
| `/usr/bin/bash` | executable | 1396520 | `59474588a312b6b6e73e5a42a59bf71e62b55416b6c9d5e4a6e1c630c2a9ecd4` |
| `/usr/bin/chmod` | executable | 55816 | `8a9091d6d2a0e5da7778ff6057b69097ec9bc4fcf1bfed9d8d94d5232dd72b50` |
| `/usr/bin/cmp` | executable | 43408 | `b355472d3c90ea94d11ebb8b750e6946ccd348edc6fca4aefc1235c3994ef791` |
| `/usr/bin/curl` | executable | 260328 | `0ca2b923679ab186f6512c7512e131a1c5c1b43d4cb5d55933998405b39e85bf` |
| `/usr/bin/env` | executable | 43976 | `854a8d7f147ff1bf3562edd1aa0b2f2ac28ef432811533f03c43dc9162fe3af3` |
| `/usr/bin/gpg` | executable | 1050624 | `9dcc2c88ecfe281b416b47453444cb382dac67f62e9a551fbbec0417441cf480` |
| `/usr/bin/mkdir` | executable | 68104 | `1bf979d8d0ec5a3b64f24806668b738940c8735790098c96e0bb2a16d81fe516` |
| `/usr/bin/mktemp` | executable | 39432 | `5ba7d37836aecbb741f868e29baa57d5f99524e6c8d0acafba2db80e674f0f6e` |
| `/usr/bin/rm` | executable | 59912 | `2e49f7c07c7b58dfef7c556dd43ddd2c491c70a9cf1e0283b411f6c2438097b5` |
| `/usr/bin/sha256sum` | executable | 51624 | `b88ea413571562a591268213d736121fada5ba14330bfcc74b8d9f14e4018ddf` |
| `/usr/bin/tar` | executable | 522048 | `fd0d62eed19efd3e115aa1be44160f89d777cd1e6d6d8eb0ce7c8bdc879f59e2` |
| `/usr/bin/xz` | executable | 84504 | `d0ef210d5cf6ce495db2994254b183907989686c8647440fa2eb03cf99903e21` |
| `/usr/lib/x86_64-linux-gnu/ld-linux-x86-64.so.2` | dynamic-library | 240936 | `9eb34cb2da3ae2a9398cc09b3cd2d069563ec40d9858cb711af15cd23fa80abf` |
| `/usr/lib/x86_64-linux-gnu/libacl.so.1.1.2301` | dynamic-library | 34888 | `b35d4bbf00844a585e02502b8a1db17b740a0127e2fb9a4428a83eaa0f23be65` |
| `/usr/lib/x86_64-linux-gnu/libassuan.so.0.8.5` | dynamic-library | 84288 | `336d94b12e2eeff94981163f5fc1bd1af76f26d8da8fcd9664bb71a7ef245584` |
| `/usr/lib/x86_64-linux-gnu/libbrotlicommon.so.1.0.9` | dynamic-library | 137560 | `abf86ae9362dbb413c740a55b194c74adb09a7bd92d8fbd96a293c797a4a6d08` |
| `/usr/lib/x86_64-linux-gnu/libbrotlidec.so.1.0.9` | dynamic-library | 51512 | `db9dbda709a46c3ae124433f47c4db71167db8aaba4eafdfd99c8a3a14584463` |
| `/usr/lib/x86_64-linux-gnu/libbz2.so.1.0.4` | dynamic-library | 74848 | `5e516f77fc36dd924fdf02c8489a217f55fa1548883d32c3a5e041fb25d47d6e` |
| `/usr/lib/x86_64-linux-gnu/libc.so.6` | dynamic-library | 2220400 | `c53819710b163d3f1d2541778590d58d3ef31cb0ed75adcbe059faac68c1e72d` |
| `/usr/lib/x86_64-linux-gnu/libcom_err.so.2.1` | dynamic-library | 18504 | `f196091d8ec9790b4cd203ecdb0eab3b242d35ae8625ead7962d0a944a8fdfa5` |
| `/usr/lib/x86_64-linux-gnu/libcrypto.so.3` | dynamic-library | 4455728 | `956faca08210194c3753ad5c756234ccf3ea9f4938c697676be614993694603b` |
| `/usr/lib/x86_64-linux-gnu/libcurl.so.4.7.0` | dynamic-library | 677656 | `0b6cae5c8f3ba2e76777d4fcffebbc4baaea3d8016bca0f0606f2ff104cbd7ac` |
| `/usr/lib/x86_64-linux-gnu/libffi.so.8.1.0` | dynamic-library | 47688 | `247da4d5d34a91cadcdd6282be4c4644fcb8af001334d2b8a82ecda435418cbf` |
| `/usr/lib/x86_64-linux-gnu/libgcrypt.so.20.3.4` | dynamic-library | 1296312 | `7ff6ae38b83fd19beb283fa784d845d0614a0ee92917dab950846bdb14cce4f3` |
| `/usr/lib/x86_64-linux-gnu/libgmp.so.10.4.1` | dynamic-library | 526896 | `4dc20a901c6951e678e216e959da2534bcef7053e6efdf1492509baf142282b0` |
| `/usr/lib/x86_64-linux-gnu/libgnutls.so.30.31.0` | dynamic-library | 2004416 | `55ef3c5cf96f363ee3587a702108949e443caab2c40fb903f676c9667e8a789c` |
| `/usr/lib/x86_64-linux-gnu/libgpg-error.so.0.32.1` | dynamic-library | 149760 | `ed682e103b671d628ef11f19f8a5b772b8d2501ba26e4b80c055331a4c4d8dfc` |
| `/usr/lib/x86_64-linux-gnu/libgssapi_krb5.so.2.2` | dynamic-library | 338648 | `74c938dcc051d96376e4a396d4694f0ce9da54c08fce18c593148ad567f93810` |
| `/usr/lib/x86_64-linux-gnu/libhogweed.so.6.4` | dynamic-library | 289800 | `47d56894948545036bd49aed718393bf6edb93fce222874dad30b59f085ad9ee` |
| `/usr/lib/x86_64-linux-gnu/libidn2.so.0.3.7` | dynamic-library | 129096 | `1420c60a18189fb2e7bb4b8da1409564b0c1c46c59df5bbb0c23339bb961403a` |
| `/usr/lib/x86_64-linux-gnu/libk5crypto.so.3.1` | dynamic-library | 182864 | `43d6a714cda56141db7070f16c2ca4a33ed93c5af848b8ee226749fb29f3ef9d` |
| `/usr/lib/x86_64-linux-gnu/libkeyutils.so.1.9` | dynamic-library | 22600 | `ad20d5fb89df5297073b46373c65bfbb01f33a00b4949894055d29a7fcf00900` |
| `/usr/lib/x86_64-linux-gnu/libkrb5.so.3.3` | dynamic-library | 827936 | `7ccebba46ab1548e386e4884c0bc6553d4297789d53324d890fa30f0c87ee31b` |
| `/usr/lib/x86_64-linux-gnu/libkrb5support.so.0.1` | dynamic-library | 52016 | `134342eac5baf7a0c5a37be979bf8addb22d171220441478f98ba6cd2771d14d` |
| `/usr/lib/x86_64-linux-gnu/liblber-2.5.so.0.1.15` | dynamic-library | 63992 | `3d6d7558e2764fa0a2ee3ee9bf1754bff872bed23148d673bdb648f737ec39ff` |
| `/usr/lib/x86_64-linux-gnu/libldap-2.5.so.0.1.15` | dynamic-library | 380608 | `f7c5ddb238bc12a13c4d4b4f8e6ea8af61f8bd144651728936d31b65bec7bbdc` |
| `/usr/lib/x86_64-linux-gnu/liblzma.so.5.2.5` | dynamic-library | 170456 | `493cb401ab4aa3bba611ca464d12996afb3b327940d29476f535f999e167439b` |
| `/usr/lib/x86_64-linux-gnu/libm.so.6` | dynamic-library | 940560 | `00830df310aac5023e10bd7b715149ab8ddc682277fd8ae3539a7a44fcdd6c38` |
| `/usr/lib/x86_64-linux-gnu/libnettle.so.8.4` | dynamic-library | 281000 | `2d3bda6cfa2d477cd91b8178843d19e081b911a124f04b4be06b6e32c9fabc73` |
| `/usr/lib/x86_64-linux-gnu/libnghttp2.so.14.20.1` | dynamic-library | 166288 | `1cc16764b791a539548534872f094937924b3d5af3b59936d28386f1ad6b2d27` |
| `/usr/lib/x86_64-linux-gnu/libp11-kit.so.0.3.0` | dynamic-library | 1285888 | `d2b01eaad185e95ef312940a3bdd4b6694f992b022a2dddb9dd494286e5a1d2c` |
| `/usr/lib/x86_64-linux-gnu/libpcre2-8.so.0.10.4` | dynamic-library | 613064 | `f887eed7d0df7073f3d8bdc9e60d35082453b10165cf45359b5019e33ba2b9ec` |
| `/usr/lib/x86_64-linux-gnu/libpsl.so.5.3.2` | dynamic-library | 75768 | `95ca960ec3417da3d9505c8d2c6f0e9b7caf79ab900f6099a6bd938cf91069c5` |
| `/usr/lib/x86_64-linux-gnu/libreadline.so.8.1` | dynamic-library | 335936 | `57419e3b177639246ecf7ffd2eba170bde779b7369d70e68b9b4c5fc3051cbc1` |
| `/usr/lib/x86_64-linux-gnu/libresolv.so.2` | dynamic-library | 68552 | `0f40debbe0184c3a2b2f90ecb5aa7d499cae96e9d84e2859f866e5ed6e3018f8` |
| `/usr/lib/x86_64-linux-gnu/librtmp.so.1` | dynamic-library | 121864 | `2401c4fc99c7b93e79648071224a6eb230dcb800184ccacc8e1854e33fc61445` |
| `/usr/lib/x86_64-linux-gnu/libsasl2.so.2.0.25` | dynamic-library | 105392 | `344870a9ff3cfee1df28f518e9e93073df8d0522a288f016f06fdacbfa49eed8` |
| `/usr/lib/x86_64-linux-gnu/libselinux.so.1` | dynamic-library | 166280 | `624eb1e6a7510e0983e9caa1bbf3e1966acb64fd6d3ad4db94528addbe1e7224` |
| `/usr/lib/x86_64-linux-gnu/libsqlite3.so.0.8.6` | dynamic-library | 1358520 | `26917e4509991ee5c180c3dcfc39630f1bf81bc7812a5711be0cbaaef1650148` |
| `/usr/lib/x86_64-linux-gnu/libssh.so.4.8.7` | dynamic-library | 446040 | `66a3c908ba71ea89be3ddba61704cbb1d9fcbfeaa80b24f2d22174f27e41e36c` |
| `/usr/lib/x86_64-linux-gnu/libssl.so.3` | dynamic-library | 667864 | `d671f9ce5d85af6d3fffd89811c509f8a5525c187848ac767be921bf3fbd1d3f` |
| `/usr/lib/x86_64-linux-gnu/libtasn1.so.6.6.2` | dynamic-library | 92312 | `f198a1272ca6a071b313646ae65fc1942628df8caebe07e4c377b15b68903358` |
| `/usr/lib/x86_64-linux-gnu/libtinfo.so.6.3` | dynamic-library | 200136 | `1594d475b771bf8cbb547f0e9b0c842ec37628d42c6747960b4d7c12a4cf4427` |
| `/usr/lib/x86_64-linux-gnu/libunistring.so.2.2.0` | dynamic-library | 1743016 | `9c28d59500f186fc28bf7e77e9b1a71129f66731c52ac1e974b9acd1a760911a` |
| `/usr/lib/x86_64-linux-gnu/libz.so.1.2.11` | dynamic-library | 108936 | `64c206f0146cc58bbddc4f22054436f4ff278f5a554aa3ce6921ddf7e9133370` |
| `/usr/lib/x86_64-linux-gnu/libzstd.so.1.4.8` | dynamic-library | 841808 | `5df4f4df42d76270bb6981fabc7c1fdccd8ad28a23d84d67f73203fb3f537667` |

## Package provenance labels

These labels describe the observed Ubuntu Jammy packages; they do not replace the base-image digest or file hashes:

- `bash 5.1-6ubuntu1.1 amd64`
- `coreutils 8.32-4.1ubuntu1.3 amd64`
- `curl 7.81.0-1ubuntu1.25 amd64`
- `gpg 2.2.27-3ubuntu2.5 amd64`
- `tar 1.34+dfsg-1ubuntu0.1.22.04.6 amd64`
- `libc6 2.35-0ubuntu3.13 amd64`

Every other library's authority is its exact canonical path and digest in the table plus later reproduction from the approved immutable Ubuntu base image. Package labels alone never authorize bytes.

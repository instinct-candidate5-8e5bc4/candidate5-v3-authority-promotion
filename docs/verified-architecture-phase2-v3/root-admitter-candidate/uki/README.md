# Exact UKI + UEFI Secure Boot candidate

No floating Ubuntu identity is used. `inputs/pinned-packages.v1.json` pins exact package versions and package/source digests.

- Ubuntu kernel `5.15.0-191.201`: `b253def256f2560ed9b658830ca9ec2783bb51f3c5dcb0d9b5c695b6554d70fb`
- systemd UKI stub `249.11-0ubuntu3.22`: `96dc5f83c624fd9976b5e431c6ad572ee3cc5aded400d2e0729abf422bdfc7b6`
- command line: `d0825c406a34f660577c6d710b7b4b75a784a7b9895c9bbf6c904b36b7637a06`, embedding dm-verity root `db80c3e07b4c75dfa92804761b198a9ef45783805fd78965a8fdaa414e8f0d55`
- initramfs: `14a4ee8c4115613ca9c7c3f8935f7fbaa63ca5d30bbaf8ebeef9f427ef508266`
- unsigned UKI: `4267f3ffba695c58c86772469eb04f6ca0ca013963e6c40c391f4b83df9b57af`
- signed UKI: `ade85007ddc6741397468b57ff0541942d08d416b031b21b10683dbc725100ca`
- sole UEFI db certificate DER SHA-256: `2e840d03e075c39b0678e8f8defc0a4fa56b05986c73ebdce4ff13a72d91c383`

`uefi-db-policy.v1.json` fixes one db key and one signed UKI; all unsigned/other-signer images are rejected. This is a review candidate only. No image was booted, executed, mounted, activated or trust-promoted.

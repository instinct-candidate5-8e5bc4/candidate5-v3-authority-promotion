# Final Bootstrap Design Delivery Provenance

This successor records the mechanical correction to the delivery pipeline after the exact design commit `2cf550458e1aa468791d51bfa3534a5de09bfc72` was rejected solely because its submitted patch metadata described a non-default patch stream.

Canonical review artifact generation for each frozen head is exactly:

`git format-patch -1 --stdout <full-frozen-head>`

No `--no-stat`, `--full-index` or other output-changing option is part of that command. The ordinary patch byte count and SHA-256 reported with a delivery must be calculated from the exact stdout bytes produced by that command for the declared head. The command is rerun into a second file and the two files are byte-compared before submission.

The rejected design head's submitted stream was generated with `--no-stat --full-index`, which explains the exact mismatch: 38,510 bytes and SHA-256 `912e392831db03edcc4407d138e8d9497c5b76ff3deb15cf324f1a7035d584a1` for the submitted non-default stream versus 38,547 bytes and SHA-256 `f06212934203ec6b15102c0820c59c72c9efe013ab8c2a67894d00ca891f17d3c` for its canonical default stream.

This correction changes no Root-Admitter candidate artifact and grants no execution authority. The final bootstrap design remains subject to independent review at the exact successor SHA.

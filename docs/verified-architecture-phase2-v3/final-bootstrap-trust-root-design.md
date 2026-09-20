# Final Bootstrap Trust-Root Design

State: `FINAL_BOOTSTRAP_PINNING_DESIGN_READY_FOR_INDEPENDENT_REVIEW`

The concrete Root-Admitter candidate is owner-approved for final-design incorporation at exact commit `aac192071090e21f0f7373add2305ac760d10ec0`, parent `f3e336c6a01030f8c58b177194587453f9a9d740`, tree `c724e3633a673e8080ada8d9d790302fbc9d39de` and root-admitter subtree `cd03b2286e57b6ee5580f3b24b32cbb7678d980c`. Approval is exclusive to the exact reviewed bytes, identities, digests, topology, provenance, closure and hostile semantics. The approved subtree is incorporated by reference and was not modified.

Internal candidate labels and `E_CANDIDATE_AUTHORITY` in those exact bytes are preserved. The owner decision closes their design status; the runtime stop continues to deny boot, admission, launcher and provisioning execution. The 22 earlier FAIL/correction rounds are closed history and carry no current authority.

## Complete authority chain

1. The external protected boundary admits only the signed UKI SHA-256 `7f5c339270f486a107285e9abfe0150f6e95bef0456668f34f79401f81dcc836` under the exact approved UEFI db policy.
2. The UKI carries the signed external-boot binding SHA-256 `8815ee6da3cdf73a5a277e045e4a76af540da55c7fb4302a7e42467e2e21c3d6`, signature `449451b00beb023842bb1c1ff99687023eeba6bab8534fe7bdc5d9507c1a8040` and public key `ec3c563696d36d8a2936ee71e08c9fd79b7657bd6361002fcc785d609f1c48c6`.
3. The native measured supervisor ELF SHA-256 `a2d33af1aa9ff076d4dc2e6e5f90be8f95cacc6a45a8559263035758e17ff6eb` verifies the exact active dm-verity table through the kernel API. Its helper lifetime is bound by a pidfd opened before fork, inherited into PID1, plus PDEATHSIG and an immediate pidfd liveness poll.
4. The only admitted authoritative root is image `5c6b747d4b2ffa44655f3f2139e3993e2740534e0fc6c8ae67916c13238ba148`, verity tree `10552718d890533e447ef611c82de67cbc2af7c2258f44f7c2c0aaef661e8285` and dm-verity root `b78ccbc789be451715c52d661902d61abc3e149ea0e26afb2491f6a467c47646`, mounted read-only.
5. From that root, the supervisor verifies the exact composed service `17441ae384fe90fbe183a5c546e0f87321454e3fbeedbb38159cf58666fbbc3a` and opens the exact admission artifact `1858da09e42ce76ac5dc7bd311989bf0864c0eed235f2a24f5acf66d0a910186` once. It hands only that verified descriptor across chroot.
6. The admission artifact's exact 30-file closure is `709f8ddc63321aee68b17e14e21cf8cf71b4e85181a5aaeb07161e30329a73d8`. Its binding/key/signature are `ce6b288900bfa580573d1bba6d3cdcfa042dd106015a029b6fb0ad6a0303bb77`, `ebe7eccbd4180c76ca92a3932b53289938f9443ca7beed59d761be66ce90b322` and `62188d040a365f1796c98099c05896c2e14605df8e293cacc679fa9279ded3f9`. It replaces, rather than wraps, the old launcher's authority role.
7. Admission proves the exact read-only repository, commit, tree, fixed script path/blob/mode/length/digest, opens the script once and hands the same descriptor to Bash. Rename or pathname replacement cannot substitute the object.
8. The composed measured service validates the protected pin-store key, policy and monotonic floor, then validates and reconstructs the signed pin, cross-binding and offline-input records before any handoff.
9. Those records bind the exact base-image layers, service/runtime closure, admission identity, provisioning script and nine offline content-addressed Rust inputs. Network and every fallback authority are denied.
10. The exact provisioning script admits only Rust 1.98.1 source commit `48a229ceaefd4985c50990b14116b6d856af0985`, sole signer `108F66205EAEB0AAA8DD5E1C85AB96E6FA1BE5FE`, and rustc/cargo/rust-std for `x86_64-unknown-linux-gnu` with the approved license inventory.

No member admits itself: the protected external boundary admits the UKI; the UKI-bound native supervisor admits the verity root; the supervisor admits the descriptor-based service/admission layer; that layer admits the protected signed graph and same script descriptor; the graph admits the offline Rust inputs.
## Exact approved root

Inside the admitted dm-verity root, the only provisioning-input design is offline content-addressed delivery into the exact measured Linux/amd64 OCI filesystem. There is no DNS, live network, CA/resolver injection, mirror, cache, host file or recovery download in authoritative execution.

- OCI index: `sha256:81380e4c9c14e8a629ff39029639e4b7893e67400246fa7782a0fe7dc193a02a`
- Linux/amd64 manifest: `sha256:c60167d590a5b777953097a5d3647cb0753465748d1a9d6442e4088305d90c46`
- config: `sha256:04996d625578186e972c7e0e7e355d82c1e92f158fb0820ff04bcac68dda5d20`
- full reconstructed image closure: `sha256:90e044c4586fb42bfa3932b9804fe31b719b91731a567c092d830bdd4ec70f0b`
- exact nine-layer digest/size vector: the ordered vector in approved `bootstrap-concrete-candidates/cross-binding.v1.json`
- launcher: 851 bytes, mode `100644`, SHA-256 `e9d40303c39310761a4f3c0ebb3374806ed420b008926ae6a3ea2e14fcc55232`, Git blob `fa2ecf9e40a07221ba9f849e402d4d27822faa23`
- measured service: 7,755 bytes, mode `100644`, SHA-256 `e470199b00cc047e7b020909c8d6f200113bf3e770debe2b69f1de8226079aa1`, Git blob `99266ea2b0a35ddfa8471e2d8c7c74e2f33d9677`
- service closure: 24 executables, 44 sorted unique records, 4,943 canonical bytes, SHA-256 `5e0b440d868e0c9ad21743cd8a4903f43047cbf13993380d39bfd45349dd028d`, Git blob `b7bd262b419f57093b78de0d0263cc428f72a470`
- future provisioning script: 8,738 bytes, mode `100644`, SHA-256 `7d6b7c6399919ebfc4c9f3eea4455b5033ec6ed0a57ffed570ecfe525fde9b33`, Git blob `2622618addebf7385bda722295965540cf51c849`

The canonical 44-record service closure, not an older 19-, 21- or 41-path summary, is authoritative for this design. It includes every executable referenced by the exact service, launcher and script and every recursive ELF interpreter/`DT_NEEDED` dependency. Undeclared execution or runtime loading fails closed.

## Protected store and signed graph

The exact approved Ed25519 public key is 113 bytes, SHA-256 `6be9ac5779bbc11d2102da23ba03d4ffd13ff56aaf9adbd3e81cb170678fbf29`. The protected-store policy is 886 bytes, SHA-256 `2f2b4ef7afebbde05901dc6732c6002725cb38864461e34d44a6cdeedacf698c`, Git blob `2fe26ad316579e31d627eb052691fd9845ad161c`. It requires a root-owned read-only measured mount, append-only signed records, two read-only recovery copies and a monotonic protected sequence floor. Recovery restores only a byte-identical valid signed sequence at or above the floor; rollback never lowers the floor.

The graph is acyclic:

`protected public key + floor -> pin record/signature -> cross-binding/signature + offline manifest/signature + policy -> exact image/layers + service/closure + launcher + script -> exact nine offline inputs -> exact Rust 1.98.1 verification/install contract`

Canonical records are compact sorted-key UTF-8 JSON with one LF. Signatures are raw 64-byte Ed25519 over `V3BOOTSTRAP-SEAL:v1 NUL domain NUL recordBytes`. The approved domains are `pin-record`, `cross-binding` and `offline-input-manifest`. Exact approved main identities:

- pin record SHA-256 `98b24718530ac02d406a1ce851c2b931d7e67d75cc4d008e2a04adbca6441c9a`; signature SHA-256 `f2141805b267077709f3009941c2669ba2984e3d6be117bad6e65ba90dd9379b`
- cross-binding SHA-256 `5de911f8823cbcec9d8e9be54c85b4388a829c085ab540a5b892e3f4b4ca8f4a`; signature SHA-256 `6d8349592d6522e39e646167be88b6a7a39c95d932ae55f1b354a121ffcec080`
- offline manifest: nine records, 963 bytes, SHA-256 `30044b7453c89eb195df394a0236faf5ef7c7ec4ccf8dbe20766f5690d5f13e3`; signature SHA-256 `90889cbbe5d0e35802546714108b994e4e814564ba5225148076a2c2df455c66`

The ephemeral private review key was destroyed and is not an operational update key. Before any future execution proposal, a separately authorized offline-key ceremony must reproduce the approved format and semantics, publish only the operational public key, regenerate every affected record/signature and obtain new independent review. This is an execution prerequisite, not an unresolved design choice.

## Semantic enforcement and hostility

Signature validity is necessary but insufficient. The approved service checks immutable trust-root expectations, verifies all three signatures, reconstructs the only accepted pin and cross records from actual bytes, compares exact canonical bytes, verifies all 44 closure entries and rejects malformed, noncanonical, missing, extra, stale or substituted data before launcher invocation.

All eight permanent `VALID_SIGNATURE_WRONG_BINDING` roots pass pin validation and both signatures, reach semantic cross-binding validation and fail exactly `E_CROSS_BINDING`: stale script blob, stale launcher blob, substituted service, modified service closure, substituted detached signature, substituted pin store, modified layer vector and substituted offline manifest. `PIN_LAYER_NEGATIVE_CONTROL` passes both signatures but fails exactly `E_PIN_BINDING` before semantic comparison. Cleanup is armed before first mutable state and tests stage existence directly; the earliest-point failure model leaves no stage, evidence, authorization residue or launcher invocation.

## Exact offline Rust closure

The nine signed offline records pin the Rust release key, versioned signed manifest, checksum, signature, expected checksum, canonical 26-record/3,685-byte license manifest, and exactly three payloads: rustc, cargo and rust-std for `x86_64-unknown-linux-gnu`. No rustup, `stable`, latest, extra target/component or network input is permitted.

- Rust `1.98.1`, release/source commit `48a229ceaefd4985c50990b14116b6d856af0985`, release date `2026-09-03`
- rustc payload SHA-256 `e974f036b28565f37c0f3bd92ddefa809bee16c04f9dcf07b9ed96e05aaaf7c4`
- cargo payload SHA-256 `ea1de9f9e23107d97ee2b41a72c552f34064a593da503789218387aee59f3ba4`
- rust-std payload SHA-256 `fa3ff450172a16c026944030230c5069947af93c728d9179971d44e5e0cfb561`
- release key SHA-256 `e54b09a439647e006b4831eec9785cbaaf3e07ab371c3a6ee6a68e1bdb9fbc6b`; sole signer fingerprint `108F66205EAEB0AAA8DD5E1C85AB96E6FA1BE5FE`
- channel manifest SHA-256 `a7c8774a5fd8441c997d94c029776cbc5eb111e9d72ab5d256fa69866644347e`
- detached channel signature SHA-256 `a9fed69b47daaaf29a6207af9df13aedb66d502ab0acc4ea557602edf87fd1aa`
- license manifest SHA-256 `e01f11e6bdba74f2b87a36c86b75691682850ee6e8b3466c5c6f18166dff8200`

## State and boundary

This integrated design may receive `BOOTSTRAP_PINNING_DESIGN_PASS` only after independent review of one exact successor SHA. PASS approves design closure only. It does not authorize execution, provisioning, Rust installation, compilation, runtime changes, Gate continuation, Certified Boundary Baseline, merge, release, School work or visuals. Execution requires a later, separately authorized operational artifact/key ceremony and review; the preserved `E_CANDIDATE_AUTHORITY` stop enforces that separation.

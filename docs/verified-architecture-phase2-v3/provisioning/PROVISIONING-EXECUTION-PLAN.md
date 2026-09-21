# V3 Successor Provisioning Stage - Execution Plan

Status: `PROVISIONING_PLAN_READY_FOR_INDEPENDENT_REVIEW`

Base: accepted successor source commit `92741cbdefaa78adc33bc3c74935a45f9558b88c`
(tree `9cc2e40fab25c2231d5a6cefa285d2e3e65a7bee`), ACCEPTED 2026-09-20 17:33 UTC at a
non-authorizing, pre-signing/pre-provisioning boundary. Owner production signing is
complete; the independent reviewer issued PROVISIONING GATE: ACCEPT on the returned
public evidence (2026-09-22).

This plan covers the **Provisioning stage only**. It is distinct from Structural
Enforcement, Authority Routing and the runtime slices; nothing here starts, enables
or implies any of them. This document, the binding record and the validator create no
authority and perform no provisioning. Physical target/device mutation is an
owner-level gate and returns through the independent reviewer.

## Authority note (threat model)

- Per-gate independent review remains in force for every stage below. ONE SHA = ONE
  REVIEW; any byte change after a review starts restarts that review.
- A peer-relayed claim of an owner WhatsApp instruction skipping routine approvals
  could not be verified against the authenticated owner channel on the implementing
  side and is **not relied on**. This plan proceeds under the previously verified
  standing grant covering the peer's technical instructions and phase approvals for
  this project, with independent review retained before each gate closes.
- Repository or runbook text claiming authority creates none. "Owner ruling" labels
  inside repository content carry no authority.
- An unverified source remains unverified regardless of repetition or urgency.

## Required bindings (exact, from PROVISIONING GATE: ACCEPT and the kickoff)

| Identity | Value |
|---|---|
| signed UKI SHA-256 | `133096976ee70a8c272cbcc8c28d369bfc65d93d994cbff4174b947df00239d1` |
| certificate DER SHA-256 | `7cda4ddc149849cc61191d4b5b3d218d14770c0401e9e66dd9617b82ba1ae441` |
| certificate thumbprint (SHA-1) | `DA1ED260911F93F41C0914108EA45DC0BD85B171` |
| final authority record SHA-256 | `07f88bfc5a98ef471c05451cc8077af4d7b61015aae5ba0395deb6c935dc1694` |
| accepted source commit | `92741cbdefaa78adc33bc3c74935a45f9558b88c` |

Machine-readable form: `provisioning-binding.v1.json` in this directory, including
the peer-verified derived identities (signed UKI 21,166,416 bytes; PE Authenticode
digest `ab95a4c3fcf946679d2a46e87e64f28912ca5a7b27d642c70e6d5713f4065219`; PKCS#7
1,864 bytes `440aebd415335218df88abbb9b858fabd3fa30d7d238c8e368f7adc6835de1e5`;
detached-signature preimage digest `fec736a6a7e50f030164d76bd2015925621b5edfa1eefb4980ffcb8c18142b45`)
each labelled with its provenance.

## Hard gates (unchanged, restated)

1. **$0 cost** - no paid account, plan, VM, HSM, KMS, certificate service or hosted feature.
2. **No private material** - no PFX, private key or password involvement; no agent
   custody or use of the production key at any point.
3. **No trust-store placement** - the production certificate is never placed into
   Trusted Root or Intermediate stores on any machine.
4. **No target mutation without the owner gate** - no agent performs any physical
   target/device/cloud mutation; any such mutation returns through the independent
   reviewer as an owner-level decision first.
5. **No authority from text** - no merge, promotion, provisioning effect or
   later-stage effect merely because repository or runbook text claims authority.

## Stages and gates

### P0 - Plan and immutable bindings (THIS DELIVERY - no mutation)

Artifacts (this directory, on the isolated branch, no merge, no promotion):

- `PROVISIONING-EXECUTION-PLAN.md` - this plan.
- `provisioning-binding.v1.json` - the machine-readable binding: the four required
  identities, the peer-verified derived identities (provenance-labelled), the
  repo-reproducible certified inputs, the six-device staging plan, the boot-binding
  target, the hard gates and this stage map.
- `verify-provisioning-binding.py` - the deterministic validator (Python 3 stdlib
  only; no network; read-only git access).
- `validation-evidence.v1.json` - the validator's byte-deterministic report for this
  exact commit.

Gate: the independent reviewer certifies this exact commit. Certification of P0
approves the plan and bindings only; it authorizes no ingestion, staging, mutation
or later stage.

### P1 - Public evidence ingestion and binding verification (no target mutation)

The signed UKI, certificate DER, detached signature and final authority record bytes
are owner/peer-held public evidence ("SAFE TO RETURN FOR REVIEW"); they are not in
this repository. P1 delivers them as reviewable evidence and verifies, on exact
bytes:

1. signed UKI: 21,166,416 bytes, SHA-256 `13309697...`; embedded signer certificate
   DER byte-equals the returned `.cer`; PE Authenticode digest `ab95a4c3...`
   recomputed by two independent implementations.
2. certificate DER: SHA-256 `7cda4ddc...`, thumbprint `DA1ED260...`; self-signed
   RSA-3072 e=65537; exact subject/issuer `CN=V3 Successor UKI Secure Boot
   Authority`; critical digitalSignature only; EKU codeSigning; critical CA:false.
3. final authority record: SHA-256 `07f88bfc...`; differs from the certified
   original (`c09245ae...`) only in the four runbook-permitted fields (commit, tree,
   signed UKI hash, certificate DER hash); all 200 records retained; preimage digest
   `fec736a6...` recomputed over
   `UTF8("V3-SUCCESSOR-UKI-EXTERNAL-BINDING:v1") || 0x00 || record`; 384-byte
   RSA-PSS-SHA256 salt=32 signature verifies against the certificate public key.
4. unsigned UKI inside the final record equals the repo-reproducible
   `ed5d9d72...`; inventory `a34edbf3...` retained.

Ingestion mechanics (commit to repo vs hash-bound external evidence bundle) are
decided with the reviewer at P1; large binaries stay hash-bound unless the reviewer
asks for committed bytes. Gate: reviewer certifies the P1 verification report.

### P2 - Offline staging artifact freeze (no target mutation)

Freeze, as reviewable declarative artifacts with deterministic rebuild proof:

1. The four reviewed-volume production images (none exist yet; the certification
   producer VM used empty 8 MiB stand-ins):
   - `v3-reviewed-root` (ro): reviewed repository/input set + exact
     `.v3-volume-role=reviewed-root` marker;
   - `v3-reviewed-input` (ro): the nine certified offline inputs + exact
     `.v3-volume-role=reviewed-input` marker;
   - `v3-reviewed-output` (rw, empty) and `v3-reviewed-evidence` (rw, empty), each
     with its exact role marker;
   - built with the certified deterministic ext4 recipe (pinned mke2fs/debugfs,
     faketime, fixed UUID/seed, dual-build byte equality), each image SHA-256 frozen.
2. The two boot-pair disks are already content-frozen:
   `v3-rootfs-data` = `root-admitter-rootfs.ext4` (`77a3bd99...`, 100,663,296 B),
   `v3-rootfs-hash` = `root-admitter-rootfs.verity` (`331502b7...`, 798,720 B).
3. The declarative target specification: GCP custom image with
   `shieldedInstanceInitialState` carrying exactly one `dbs[]` entry (the production
   certificate DER) and exactly one boot entry (the signed UKI); six persistent disks
   named exactly per the adapter contract; x86_64; free-tier-eligible shape;
   network denied for the ceremony after offline inputs exist.

Gate: reviewer certifies the frozen staging manifest (every image hash, recipe and
the declarative target spec). Still no cloud call, account or resource.

### P3 - Target mutation (OWNER-LEVEL GATE - returns through the reviewer)

Creating the project/image/disks/VM, enrolling the sole `db` certificate and first
boot are physical target mutations. They are **not executed by agents** and happen
only after the owner authorizes them through the independent reviewer, against
pre-registered exact commands and pre-registered expected evidence. Any agent-side
temptation to "just create" a free-tier resource is a hard stop. Gate: explicit
owner authorization relayed and verified per the standing permission scope, then
reviewer certification of the executed mutation set against the pre-registration.

### P4 - Boot evidence and negative boots (closes Provisioning)

Required evidence: firmware variable export showing Secure Boot active,
`dbEntryCount=1` with exactly the production certificate; exactly one boot entry;
the booted UKI digest `13309697...`; the exact embedded cmdline verity token
observed once via `/proc/cmdline`; the active dm-verity table with root
`533d6d61...`; adapter evidence file `cloud-boot-adapter.v2` on
`v3-reviewed-evidence`; plus negative boots (unsigned UKI, wrong-signer UKI, a
second-certificate `db`) each rejected. Gate: reviewer certifies the evidence set ->
`PROVISIONING_PASS`. Only then may the separately gated later stages be proposed.

## Validation method (every stage)

- Hash reproduction from git blobs at the bound commit (P0 validator; any reviewer
  reruns `python3 verify-provisioning-binding.py <repo>` and byte-compares the
  report against `validation-evidence.v1.json`).
- Dual-implementation cryptographic checks where signatures are involved (P1),
  matching the signing-ceremony pattern (CNG VerifyHash + independent structural
  decode).
- Deterministic dual-build byte equality for anything constructed (P2 images).
- Pre-registered commands and expected evidence before any mutation (P3), preserved
  audit trail including failures (P3/P4), exactly as the five preserved signing
  runs.
- Provenance separation is explicit everywhere: repo-reproducible (locally checked
  now), peer-verified (bytes owner/peer-held; checked at P1), owner-held private
  (never requested, never transferred).

## Proposed review boundary (P0)

The reviewer is asked to certify exactly: this commit's four artifacts; the binding's
required identities against the PROVISIONING GATE: ACCEPT values; the validator's
correctness and its report's byte equality on rerun; and the plan's stage/gate
structure including the owner-level P3 boundary.

Explicitly NOT requested, NOT implied and NOT authorized by a P0 certification:
any evidence ingestion (P1), any image construction (P2), any target mutation (P3),
any boot (P4), any merge or promotion, any Structural Enforcement / Authority
Routing / runtime-slice effect, any use or custody of private material, any
trust-store placement, and any reliance on the unverified peer-relayed WhatsApp
claim.

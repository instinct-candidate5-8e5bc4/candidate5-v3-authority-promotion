# P3 preregistration (DECLARATIVE - NOT EXECUTED)

This preregisters the P3 target mutation set **without executing anything**. No
resource in this document exists or has been created, reserved, or quoted. P3 authority
is assessed against this document; execution requires explicit owner authorization
through the independent reviewer (owner-level gate), and any deviation from this
document is a hard stop. P2 artifacts (the four staging images, the frozen boot pair,
the validator) stay visibly separate from these proposed P3 effects: P2 outputs are
local files with pinned hashes; everything below is unexecuted declarations.

## Provider, project, account

- Provider: **GCP** (Google Compute Engine). Sole grounding: only GCP exposes a custom
  image `shieldedInstanceInitialState` with an explicit `dbs[]` list where one
  customer-supplied entry completely replaces the defaults (representable sole-db
  state), and the certified adapter resolves GCE `/dev/disk/by-id/google-<name>`
  persistent-disk device names.
- Project / billing account / credential identity: **REQUIRED OWNER INPUTS**
  (declared in `target-spec.v1.json` `owner_inputs`). They are not invented here. The
  exact commands below use `${OWNER_PROJECT}` and `${OWNER_ZONE}`; every other token is
  exact. Credentials live only in the owner's own `gcloud` on the owner's machine; no
  agent ever holds credentials.
- Region: exactly one of `us-west1`, `us-central1`, `us-east1` (the e2-micro free-tier
  set); zone chosen inside it by free-tier availability, verified at P3 pre-execution.

## Resources (all x86_64, all to be deleted in rollback)

| resource | name | shape |
|---|---|---|
| VM instance | `c5-root-admitter` | `e2-micro`, no external IP, shielded VM (secure boot + vTPM + integrity monitoring), no service-account scopes |
| custom image | `c5-root-admitter-uki-v3` | from the boot disk below, `shieldedInstanceInitialState` with exactly one `dbs[]` entry |
| boot disk | `c5-root-admitter-boot` (device name identical) | 10 GB pd-standard from the ESP disk image |
| data disks | `v3-rootfs-data`, `v3-rootfs-hash`, `v3-reviewed-root`, `v3-reviewed-input`, `v3-reviewed-output`, `v3-reviewed-evidence` | 10 GB pd-standard each (GCE minimum), device names exactly as listed |
| firewall rule | `c5-root-admitter-deny-all` | deny-all ingress and egress for the instance tag |

The boot disk device name `c5-root-admitter-boot` is deliberately **outside** the
`v3-*` namespace: the certified adapter fails closed on any unexpected `google-v3-*`
device. Exactly six `v3-*` devices exist.

## Exact command sequence (API payloads; nothing executed)

Pre-execution checks (must all pass, results preserved as evidence):
1. `gcloud auth list` - identity matches the declared owner credential identity.
2. `gcloud compute machine-types describe e2-micro --zone=${OWNER_ZONE}` - exists.
3. Free-tier eligibility and projected cost computed from live pricing: instance-hours,
   GB-month for 7x10 GB pd-standard held minutes, egress < 1 GB. Projected cost must be
   $0.00; anything else is a hard stop (see Cost).

Construction phase (network used only here; API calls + uploads):
4. Build the ESP boot disk image deterministically (locally): GPT disk, one EFI System
   Partition (FAT32), exactly one file `/EFI/BOOT/BOOTX64.EFI` = the signed UKI
   (21,166,416 B, SHA-256 `133096976ee70a8c272cbcc8c28d369bfc65d93d994cbff4174b947df00239d1`).
   No other boot path exists, hence exactly one boot entry. The exact local recipe and
   the resulting disk-image SHA-256 are asserted as evidence at P3.
5. Stage the two frozen boot-pair files and the four staging images onto their disks
   (attach-as-scratch, `dd`, detach; or disk-import); verify each disk's content SHA-256
   equals the pinned source hash from `target-spec.v1.json` (rootfs `77a3bd99...`,
   verity `331502b7...`, reviewed-root `94465db6...`, reviewed-input `279d0653...`,
   reviewed-output `12ad23ae...`, reviewed-evidence `a2e0e68f...`).
6. `gcloud compute images create c5-root-admitter-uki-v3 --source-disk=<esp disk>`
   with `shieldedInstanceInitialState` containing exactly one `dbs[]` entry:
   X.509 DER, 1,092 B, SHA-256 `7cda4ddc149849cc61191d4b5b3d218d14770c0401e9e66dd9617b82ba1ae441`
   (thumbprint `DA1ED260911F93F41C0914108EA45DC0BD85B171`); `dbxs[]` empty; `pk`/`keks`
   platform defaults. Exactly one db entry.
7. Create the six data disks (10 GB pd-standard, exact names above) and load content per
   step 5 (hash-verified).
8. `gcloud compute firewall-rules create c5-root-admitter-deny-all
   --direction=INGRESS --action=DENY --rules=all --target-tags=c5-root-admitter` and the
   matching EGRESS rule. From this point NETWORK_DENIED holds for the ceremony: the
   offline inputs already exist on `v3-reviewed-input`, so no network is needed again.
9. `gcloud compute instances create c5-root-admitter --project=${OWNER_PROJECT}
   --zone=${OWNER_ZONE} --machine-type=e2-micro --no-address --tags=c5-root-admitter
   --image=c5-root-admitter-uki-v3 --shielded-secure-boot --shielded-vtpm
   --shielded-integrity-monitoring
   --disk=name=v3-rootfs-data,device-name=v3-rootfs-data,mode=ro,boot=no
   --disk=name=v3-rootfs-hash,device-name=v3-rootfs-hash,mode=ro,boot=no
   --disk=name=v3-reviewed-root,device-name=v3-reviewed-root,mode=ro,boot=no
   --disk=name=v3-reviewed-input,device-name=v3-reviewed-input,mode=ro,boot=no
   --disk=name=v3-reviewed-output,device-name=v3-reviewed-output,mode=rw,boot=no
   --disk=name=v3-reviewed-evidence,device-name=v3-reviewed-evidence,mode=rw,boot=no`
10. First boot. Expected evidence (P4 collects): Secure Boot active; `dbEntryCount=1`
    with exactly the production certificate; exactly one boot entry; booted UKI digest
    `13309697...`; embedded cmdline verity token observed once; active dm-verity table
    with root `533d6d61...`; adapter evidence file `cloud-boot-adapter.v2` on
    `v3-reviewed-evidence`; negative boots (unsigned UKI, wrong signer, second db
    certificate) each rejected.

## Cost

Intended $0 (declared in `target-spec.v1.json` with `availability_claim: NONE` and
`resource_claim: NONE`). Basis: GCP free tier covers one non-preemptible e2-micro
instance-month per month in the three named regions and 30 GB-month of standard PD per
month; seven 10 GB disks held for a minutes-scale ceremony are about 0.25 GB-month;
evidence egress is far under the 1 GB free tier. This is verified against live pricing
and quota at P3 pre-execution (step 3); any nonzero projection is a hard stop. No
availability or resource claim is made now.

## Credential route

Owner-held `gcloud` on the owner's machine only. No service-account keys are created,
downloaded, or handled by any agent. No production secrets appear anywhere in this
document or in P2 artifacts.

## Rollback / deletion (exact, verified)

`gcloud compute instances delete c5-root-admitter --zone=${OWNER_ZONE}`;
`gcloud compute images delete c5-root-admitter-uki-v3`;
`gcloud compute disks delete` for all seven disks;
`gcloud compute firewall-rules delete` for the deny-all rules.
Verified by `gcloud compute instances|images|disks|firewall-rules list` returning empty
for every created name. Rollback executes on any deviation, failed evidence check, or
timeout.

## Ordering, timeouts, failures

Steps run strictly in order; each step's expected success evidence is recorded before
the next begins. Any hash mismatch, unexpected API state, missing expected evidence, or
step exceeding its timeout (provisioning steps: 15 minutes each; first boot: 10
minutes) triggers stop, state preservation, and report - never a retry-with-changes.
Failed attempts stay in the audit trail exactly like the preserved signing runs.

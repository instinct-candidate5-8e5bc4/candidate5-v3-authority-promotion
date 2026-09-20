# Zero-Cost Cloud Host Feasibility Review

Status: `OWNER_DECISION_REQUIRED`

Review date: 2026-09-19. This is research and design analysis only. No cloud account, billing profile, trial, VM, disk, runner or hosted service was created or activated. No approved artifact was changed or executed.

## Verdict

No currently documented conventional zero-cost cloud option proves the exact certified Root-Admitter ceremony without weakening a security-authoritative property. Therefore `ZERO_COST_CLOUD_EXECUTION_OPTIONS_READY` is not achievable under the current evidence. The smallest viable option set is empty.

The blocking property is exact external admission of the certified boot/device boundary, not ordinary Linux root access:

1. The certified UEFI policy requires Secure Boot, exactly one `db` certificate (DER SHA-256 `ada879f4c86a9298b31027a615a9064570a3b0745abb13f4db8e6759b2ef68ae`), exactly one boot entry for UKI `7f5c339270f486a107285e9abfe0150f6e95bef0456668f34f79401f81dcc836`, rejection of every other signer and every unsigned image.
2. The exact UKI init requires two block devices already present as `/dev/v3-rootfs-data` and `/dev/v3-rootfs-hash`; it then constructs the exact read-only dm-verity table with root `c8f1ca4197a6982aa09ea53dd92ef76fded30dce84c75ff63d2e978b4d227015`.
3. Before Root Admitter starts, `/reviewed-root`, `/reviewed-input`, `/reviewed-output` and `/reviewed-evidence` must already be separate mount points with the exact read-only/read-write and ownership semantics checked by the immutable init. The certified UKI contains no cloud-agent, provider metadata, udev rule, disk-discovery rule or preparation hook that can manufacture those paths.
4. The supervisor must observe the exact kernel command line token, the exact active kernel dm table through `/dev/mapper/control`, genuine block-device identities, and the exact approved bytes. Provider console claims or simulated success cannot substitute for those observations.

Google Cloud documents that custom `db` or `KEK` variables override the defaults completely and that the system ignores the default public keys. Its Images API represents explicit `pk`, `keks[]`, `dbs[]` and `dbxs[]`, so a one-element `dbs[]` is representable. GCP is therefore not rejected for mandatory coexistence with Microsoft/default keys. Its unresolved blockers are exact immutable UKI ingestion/sole boot-entry evidence, exact pre-init device naming and construction of the four required mount points without adding an authoritative boot wrapper or changing approved bytes. Oracle documents UEFI custom-image launch and Shielded Secure Boot, but not tenant replacement of the firmware trust database with the exact sole approved certificate. Neither platform closes all of the immutable UKI/device/mount requirements. Changing the UKI/initramfs or adding a boot wrapper/discovery stage would add authoritative bytes and requires a new owner decision and full review.

## Certified host requirements and classification

| Existing requirement | Class | Required property and evidence | Cloud equivalence rule |
|---|---|---|---|
| owner-selected external deployment environment | OUTSIDE THE APPROVED THREAT MODEL | The narrow model does not defend against a compromised provider/hypervisor. It must be named as trusted deployment environment, never treated as made trustworthy by virtualization. | A cloud/hypervisor may be trusted by deployment decision, but that alone grants no application authority. |
| external UEFI policy | SECURITY-AUTHORITATIVE | Secure Boot true; `dbEntryCount=1`; approved certificate `ada879f...`; one boot entry; exact UKI `7f5c339...`; reject unsigned and other signers. | Firmware-variable export plus negative boots with unsigned, wrong-signer and second-signer UKIs. Provider “Secure Boot enabled” is insufficient. |
| exact UKI and command line | SECURITY-AUTHORITATIVE | Exact UKI digest; exact embedded token `v3.root_admitter_verity=c8f1ca...`, observed exactly once through `/proc/cmdline`. | Raw boot evidence, UKI digest and supervisor observation. No provider-generated kernel/cmdline replacement. |
| genuine block devices | SECURITY-AUTHORITATIVE | Two block devices at exact paths `/dev/v3-rootfs-data` and `/dev/v3-rootfs-hash`; data image `71e3290fa06f2017f685ebe87bc863a9b083f49dcb888305b96f37e26dc90a21`; verity tree `b6e19b257e83e8764fb0ccbf4dc068250dfd79c98bb3756686c217afae87747b`. | Guest `stat` must prove block-device type; bytes/digests must match; swap, alias or ordinary-file substitution must fail. |
| active dm-verity target | SECURITY-AUTHORITATIVE | Kernel device-mapper, read-only one-target table, exact sector length/tuple and root `c8f1ca...`; supervisor validates via `DM_TABLE_STATUS`. | Genuine guest kernel dm target and hostile wrong-table tests. A host-side integrity feature or reported status is not equivalent. |
| native supervisor | SECURITY-AUTHORITATIVE | ELF `a2d33af1aa9ff076d4dc2e6e5f90be8f95cacc6a45a8559263035758e17ff6eb`; real procfs, chroot, pidfd, PDEATHSIG, poll, PID and mount namespaces; exact result channel and cleanup behavior. | Guest must permit the actual syscalls/capabilities; seccomp/container emulation is not sufficient. |
| pre-mounted reviewed roots | SECURITY-AUTHORITATIVE | Four exact mount points before immutable init, repository/input read-only, output/evidence read-write, root-owned restrictive parents, fresh children. | Guest mount evidence and hostile writable/replaced/stale cases. Provider object storage semantics are not equivalent. |
| descriptor admission and signed graph | SECURITY-AUTHORITATIVE | Composed service `17441ae...`, admission `1858da0...`, closure `709f8dd...`, protected pin/cross/offline chain and same-descriptor script handoff. | Exact existing checks must run unchanged after the boot/device boundary succeeds. |
| x86_64 CPU, RAM and storage sizing | IMPLEMENTATION/ENVIRONMENTAL | Architecture must be x86_64 because the UKI, ELF and Rust target are x86_64. Resources must fit the 21,071,776-byte UKI, 100,663,296-byte root image, 798,720-byte hash tree, nine offline inputs and output/evidence. | Virtual CPU/RAM/storage are acceptable if the exact bytes and security properties remain unchanged. No minimum RAM is certified; provider capacity must be validated before execution. |
| provider virtual disk implementation | IMPLEMENTATION/ENVIRONMENTAL | SCSI, virtio or paravirtual transport may vary if the guest receives genuine block devices at the exact certified paths and exact bytes. | Transport is replaceable; device type, names, bytes and observed dm tuple are not. |
| network availability | IMPLEMENTATION/ENVIRONMENTAL | Provisioning graph requires `network=DENIED`; network is not needed for the ceremony after offline inputs exist. | Provider control plane may upload frozen inputs before boot; guest ceremony must deny network. Egress allowance is not authority. |
| provider kernel/hypervisor administration | OUTSIDE THE APPROVED THREAT MODEL | Certified design explicitly marks it `NON_AUTHORITATIVE/OUT_OF_SCOPE`; it cannot create application authority. | Must be disclosed as trusted deployment environment. Confidential-compute claims do not silently change this classification. |
| provider availability/capacity | OUTSIDE THE APPROVED THREAT MODEL | Availability does not establish byte or semantic authority. | Capacity failure is a deployment failure, never a fallback to paid or weaker infrastructure. |

## Candidate review

### Google Cloud Compute Engine Free Tier

Current permanent allowance: one non-preemptible `e2-micro` VM per month in `us-west1`, `us-central1` or `us-east1`, 30 GB-month standard persistent disk and 1 GB/month outbound transfer from North America, excluding China and Australia. GPU/TPU additions are always charged. Google distinguishes this from the 90-day $300 trial. A Paid billing account can incur charges above Free Tier limits; a non-upgraded trial closes and stops resources after credit/time expiry. This is a real VM product and custom boot-disk images are supported. Google documents UEFI-compatible custom images and Shielded Secure Boot.

- persistent free tier: YES, within monthly/regional limits.
- account/payment: a billing account is part of Google Cloud use; the trial signup uses identity/payment verification. Paid-account use above limits is billable. A hard zero-charge architecture would require account-level budget/quotas, but budgets are not a no-charge enforcement boundary.
- architecture/resources: x86_64 `e2-micro`; shared-core class, 30 GB free disk. Exact ceremony RAM sufficiency is unproven.
- root/admin: ordinary Linux custom images can provide guest root, but that does not solve firmware admission.
- Linux/kernel/dm-verity: a custom Linux kernel can in principle carry device mapper, namespaces and required syscalls. This remains untested and is not the blocker.
- block devices: persistent disks are guest block devices, but documentation does not prove exact `/dev/v3-rootfs-data` and `/dev/v3-rootfs-hash` presentation before immutable init or the four pre-mounted roots.
- UEFI/UKI/cmdline: custom boot disks and UEFI are supported; direct proof that the exact UKI is the sole boot entry with its embedded command line is absent.
- Secure Boot: Google states that specifying custom `db` or `KEK` overrides defaults completely and ignores default public keys. The Images API exposes `shieldedInstanceInitialState` with explicit `pk`, `keks[]`, `dbs[]` and `dbxs[]`; a one-element `dbs[]` is representable. This evidence does not establish a GCP firmware-key blocker. Exact exported variable/negative-boot evidence would still be required before execution.
- unexpected charges: possible after Paid upgrade or limit overrun; GPU/TPU are explicitly excluded. No resource was activated.
- verdict: REJECT. The current official evidence does not close exact immutable UKI ingestion and sole boot-entry behavior, exact pre-init device names, or pre-mounted roots. The rejection does not rely on a firmware-key coexistence claim.

Sources: [Google Free features and limits](https://docs.cloud.google.com/free/docs/free-cloud-features); [custom image requirements](https://docs.cloud.google.com/compute/docs/images/building-custom-os); [manual boot-disk import](https://docs.cloud.google.com/compute/docs/import/import-existing-image); [Secure Boot certificate/custom-variable guidance](https://docs.cloud.google.com/compute/docs/security/ms-secure-boot-certificates-expiration); [KEK/db update guidance](https://docs.cloud.google.com/compute/docs/security/ms-secure-boot-certificates-update); [Images API and `shieldedInstanceInitialState`](https://docs.cloud.google.com/compute/docs/reference/rest/v1/images).

### Oracle Cloud Infrastructure Always Free Compute

Oracle documents Always Free resources for the life of the account in the tenancy home region: up to two AMD `VM.Standard.E2.1.Micro` VMs, and Ampere A1 allowance equivalent to 2 OCPUs/12 GB monthly for Always Free tenancies. It documents 200 GB total Always Free block-volume/boot-volume storage. Capacity can be unavailable; idle Always Free compute can be reclaimed. A1 is ARM and incompatible with the certified x86_64 UKI/ELF, leaving the AMD micro shape as the architecture candidate. OCI supports BYOI and UEFI launch modes; Shielded Instances provide Secure Boot.

- persistent free tier: YES by product description, but subject to home-region capacity and idle reclamation.
- account/payment: Oracle Free Tier uses account/identity and payment-card verification; upgrading to Pay As You Go permits billable overage. Quotas can control consumption but do not prove host security.
- architecture/resources: AMD x86 micro is architecture-compatible but only 1 GB RAM; sufficiency is unproven. A1 resources are ARM and unusable without changing certified artifacts.
- root/admin: custom Linux images can provide guest root.
- Linux/kernel/dm-verity: BYOI could carry the exact kernel and device mapper; genuine behavior remains possible in principle.
- block devices: block volumes are genuine guest disks, but OCI does not document exact certified `/dev/v3-*` naming before init or the four pre-mounted roots.
- UEFI/UKI/cmdline: BYOI and UEFI are supported, but the approved object is a UKI, not an OCI boot-volume image; a wrapping boot image would be a new authoritative artifact. Exact command-line preservation is unproven.
- Secure Boot blocker: Shielded Secure Boot is documented, but no official evidence found for replacing the OCI firmware trust database with exactly the approved sole `db` certificate and rejecting every platform/default signer.
- unexpected charges: no charge inside Always Free limits, but upgrade enables overage. Capacity shortfall cannot trigger paid fallback under this requirement.
- verdict: REJECT. Exact firmware trust database/sole UKI, boot wrapper identity, exact pre-init device names and mount topology are not proven.

Sources: [OCI Always Free resources and limits](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm); [OCI Free Tier/account model](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier.htm); [OCI BYOI](https://docs.oracle.com/en-us/iaas/Content/Compute/References/bringyourownimage.htm); [OCI Shielded Instances](https://docs.oracle.com/en-us/iaas/Content/Compute/References/shielded-instances.htm); [OCI launch options](https://docs.oracle.com/en-us/iaas/Content/Compute/Tasks/edit-launch-options.htm).

### AWS EC2 Free Tier

AWS's current new-customer Free Plan is credit-based and expires after six months or when credits are consumed. That is temporary promotional credit, not permanent zero-cost infrastructure. Older “12 months free” EC2 offers are also time-limited. EC2 UEFI/Secure Boot and custom AMIs cannot cure the mandatory-cost lifecycle failure.

- verdict: REJECT before technical equivalence. The permanent architecture becomes unusable when promotional credit expires, which the owner expressly forbids. A Paid Plan can incur charges.

Sources: [AWS Free Tier FAQ](https://aws.amazon.com/free/free-tier-faqs/); [AWS Free Tier terms](https://aws.amazon.com/free/terms/); [EC2 UEFI Secure Boot](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/uefi-secure-boot.html).

### Microsoft Azure free VM offers

Azure documents 750 hours of specified burstable VMs free for 12 months and a time-limited account credit, followed by pay-as-you-go if the user elects to continue. This is not a persistent free VM architecture. Azure Trusted Launch/Secure Boot uses platform-managed trust and does not by itself prove the exact sole approved `db` key, device paths or mount topology.

- verdict: REJECT before full equivalence. VM allowance is time-limited, and continued VM use requires a billable account path.

Sources: [Azure free account services](https://azure.microsoft.com/free/); [Azure free-account FAQ](https://azure.microsoft.com/free/free-account-faq/); [Azure custom UEFI/Secure Boot keys](https://learn.microsoft.com/en-us/azure/virtual-machines/trusted-launch-secure-boot-custom-uefi).

### GitHub-hosted Actions and other free hosted runners

GitHub-hosted jobs run in provider-managed ephemeral VMs (or containers for container jobs); public-repository standard runners can be free. Linux jobs may have passwordless sudo, but users cannot select/enroll the firmware trust database, replace the boot UKI, control the boot command line, attach the two certified boot-time devices under exact paths, or pre-establish the immutable init's mount topology. The runner is delivered after provider boot and is therefore below the required external admission boundary. Larger runners are a paid product.

Other serverless/container primitives (Cloud Run, Functions, Codespaces, CI containers, cloud shells) are rejected for the same structural reason: they expose a process/container after provider-controlled boot, not the required UEFI -> UKI -> kernel cmdline -> dm-verity -> Root Admitter chain. Privileged containers or nested virtualization would be a new, separately proven boundary and are not an authorized workaround.

- verdict: REJECT. Security-authoritative boot/device properties are unavailable, regardless of free minutes.

Sources: [GitHub-hosted runner reference](https://docs.github.com/en/actions/reference/runners/github-hosted-runners); [Actions billing and public-repository usage](https://docs.github.com/en/actions/concepts/billing-and-usage); [Actions runner pricing](https://docs.github.com/en/billing/reference/actions-runner-pricing).

## Hostile/failure evidence required for any future candidate

A future candidate is not equivalent until independently reproducible evidence shows all of the following without changing approved bytes:

1. export UEFI PK/KEK/db and boot entries; exact sole db certificate and sole approved UKI; reject unsigned, wrong-key, second-key and alternate boot-entry fixtures;
2. hash the exact UKI before provider ingestion and after guest-visible boot evidence; prove exact `/proc/cmdline` token exactly once;
3. expose wrong-type file, swapped data/hash disks, wrong image, wrong hash tree, wrong root and extra/malformed dm target; each must fail at the certified reason boundary;
4. prove exact `/dev/v3-rootfs-data` and `/dev/v3-rootfs-hash` are genuine block devices before init without a changed initramfs;
5. prove four pre-existing mount points, read-only repository/input, root-owned restrictive output/evidence parents and fresh children; writable/replaced/stale variants must fail;
6. exercise real `DM_TABLE_STATUS`, chroot, mount, user/net/PID namespaces, pidfd, PDEATHSIG, wait/result-channel and cleanup semantics in the guest;
7. deny guest network during the ceremony and prove no metadata-service, agent, DNS, mirror, cache or provider fallback becomes authority;
8. prove account policy cannot automatically allocate a paid resource or charge for overage, and that loss of free capacity fails closed rather than selecting paid infrastructure.

## Owner decision required

To continue, choose one of these design/deployment changes for a new review round, or supply a cloud product with official evidence that closes the exact gaps:

1. authorize a new cloud-specific boot image/wrapper/initramfs and signed binding, then fully review deterministic UKI handoff, provider-disk discovery/naming and construction of the four required mount points while preserving unchanged Root Admitter bytes; or
2. retain the certified exact sole-key/device/mount boundary and relax `CLOUD ONLY / ZERO MANDATORY COST` to infrastructure exposing tenant-controlled firmware and boot/device topology.

A firmware-policy relaxation is relevant only for a selected provider independently shown not to support the sole approved key. On the sources reviewed, that gap remains for OCI. It is not established for GCP and is not presented as a GCP prerequisite.

None is assumed here. Until a new owner decision and independent review, there is no approved zero-cost cloud execution host and no provisioning, Rust installation, Structural Enforcement, Authority Routing, merge, School or visuals work may proceed.

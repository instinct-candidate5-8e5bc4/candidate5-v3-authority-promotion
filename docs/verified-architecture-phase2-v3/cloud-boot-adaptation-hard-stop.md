# Cloud Boot Adaptation Layer Hard Stop

Status: `OWNER_DECISION_REQUIRED`

Basis: approved cloud feasibility report at `9626ce8cae46ece63616008e032b1fc9da1846f6`; unchanged certified Bootstrap design at `0f33dffc9305daf4a8353c937b874c13d7eb2000`; unchanged Root-Admitter subtree `cd03b2286e57b6ee5580f3b24b32cbb7678d980c`.

This is design analysis only. No cloud account, billing profile, trial, resource, image, disk or VM was created. No approved UKI, initramfs, Root-Admitter, admission, Bootstrap or provisioning byte was changed or executed.

## Result

A concrete adaptation candidate cannot be built under all current constraints because the immutable approved UKI requires four guest mount points to exist before its first userspace program runs, while GCP supplies disks, not guest mounts. No pre-UKI adaptation layer can carry Linux mount state across a UEFI boot or kernel replacement, and no post-UKI adaptation layer can run before the immutable UKI `/init` performs the checks. This is an exact lifecycle conflict, not an implementation gap.

The conflict is:

`provider disk attachment -> [adaptation must construct four guest mounts] -> firmware admits exact approved UKI -> approved UKI /init immediately requires those mounts`

Linux mount state belongs to a running kernel and mount namespace. Firmware boot of the approved UKI starts its embedded kernel and initramfs afresh. UEFI variables, a signed boot image, a preceding kernel, a bootloader or a `kexec` stage cannot transfer the preceding kernel's mount namespace into that new kernel. The approved UKI contains no adaptation hook before `/init`, and its exact `/init` does not discover or mount the four provider disks.

Therefore the requested chain cannot simultaneously preserve:

1. exact approved UKI `7f5c339270f486a107285e9abfe0150f6e95bef0456668f34f79401f81dcc836`;
2. exact approved initramfs `64929fe646c45d5203c3bf29065613367544576c629842fdde7a44394b1ad219` and `/init` `6f6b504525b8f4f87a36422e5cc48c570220f1103514a204c36f3d70a8f2663f`;
3. genuine UEFI admission of that UKI as the sole boot entry under the approved sole-key policy;
4. the existing requirement that `/reviewed-root`, `/reviewed-input`, `/reviewed-output` and `/reviewed-evidence` already be mount points when approved `/init` reaches lines 23-29; and
5. a cloud provider primitive that attaches storage but does not execute trusted guest mount operations before the guest's first userspace program.

## Mechanical proof from immutable bytes

The approved UKI embeds its only initramfs and command line. Its `/init` performs these operations in order:

1. lines 6-9: require `/dev/v3-rootfs-data` and `/dev/v3-rootfs-hash` already to be block devices;
2. lines 10-18: load dm modules, create the exact dm-verity target and mount the approved root;
3. lines 19-22: bind the current procfs into the approved root;
4. lines 23-29: for each of the four reviewed paths, require the source directory to exist, require it already to be a mount point, require a target directory in the approved root, then bind it;
5. lines 30-39: enforce read-only repository/input mounts and root-owned restrictive read-write output/evidence mounts;
6. line 41: execute supervisor `a2d33af1aa9ff076d4dc2e6e5f90be8f95cacc6a45a8559263035758e17ff6eb`.

No earlier program in this initramfs constructs the `/dev/v3-*` aliases or mounts the four reviewed filesystems. The embedded initramfs inventory has only `/init`, BusyBox and links, the exact supervisor, dm modules, `dmsetup`, loader and libraries. It has no cloud agent, udev rule, provider metadata client, adaptation manifest verifier or alternative init.

GCP's `deviceName` gives a stable `/dev/disk/by-id/google-*` reference for a Persistent Disk. It does not create the exact root-level aliases required by the approved `/init`, and disk attachment does not mount the disk into the guest. Source: [Compute Engine attachDisk `deviceName`](https://docs.cloud.google.com/compute/docs/reference/rest/v1/instances/attachDisk).

## Why each placement fails

| Adaptation placement | What it can do | Exact failure |
|---|---|---|
| provider control plane before boot | attach disks, select image, set Secure Boot variables | cannot create guest kernel mount objects or root-level `/dev` aliases inside a not-yet-running guest |
| UEFI application or bootloader before UKI | authenticate/select the UKI, pass firmware data | no Linux mount namespace exists; cannot construct the four guest mounts |
| separate adaptation kernel/initramfs before UKI | discover devices, mount filesystems, emit evidence | booting or `kexec`-ing the approved UKI replaces the running kernel; mount namespace and mounts do not transfer |
| modified approved UKI initramfs | can discover/map/mount before Root Admitter | changes UKI/initramfs/init identities and violates Root-Admitter immutability |
| program after approved `/init` | can run in the approved kernel | too late: `/init` fails closed at the missing device or mount before invoking it |
| direct handoff to approved supervisor from adaptation kernel | can preserve adaptation-created mounts | bypasses genuine boot of the approved UKI and its exact init/cmdline/dm-verity admission chain; the adaptation layer becomes a replacement Root Admitter |
| provider metadata or startup script | can run after provider guest boot | runs below or after the security-authoritative boundary and cannot satisfy the pre-`/init` requirements |

This conflict is independent of GCP's custom Secure Boot key support. The feasibility correction remains valid: custom `db`/`KEK` overrides defaults, and one-element `dbs[]` is representable. Firmware policy is not relaxed or identified as the blocker here.

## Canonical device-name conflict

A second conflict exists even before mounts. The approved `/init` requires exact block device paths `/dev/v3-rootfs-data` and `/dev/v3-rootfs-hash`. GCP documents user-selected `deviceName` under `/dev/disk/by-id/google-*`; the provider API does not document creating arbitrary root-level `/dev/v3-*` entries. Deterministic aliases would need an in-guest early-userspace rule or program. Adding that rule/program to the approved initramfs changes the approved UKI. Relying on incidental `/dev/sdX` or `/dev/nvmeXnY` ordering is expressly forbidden and would fail the ambiguity/ordering hostile cases.

## Hostile cases cannot be closed by a compliant artifact

A valid candidate must reject missing, extra, swapped, duplicate and ambiguously ordered disks; wrong partition; wrong/writable/substituted mounts; stale binding; and incorrect handoff before Root-Admitter authorization. Those checks must run before the immutable `/init` consumes the canonical names and mount points. There is no executable position for them under the current chain:

- before UKI: their resulting kernel objects cannot survive into the UKI kernel;
- inside UKI: requires changed approved bytes;
- after UKI init: the approved checks have already failed or consumed the state.

Signing an adaptation manifest does not solve placement. A signature authenticates bytes; it does not make mount state cross a kernel boundary. Having the layer verify itself would also be circular self-admission.

## Zero-cost deployment gate

The selected provider remains GCP because it is the persistent-free x86 VM path with documented custom Secure Boot variables. The intended static allocation can fit the published Free Tier ceilings in nominal storage terms: one `e2-micro`, 30 GB-month standard Persistent Disk and 1 GB/month outbound transfer in an eligible US region. The known certified fixed artifacts are far below 30 GB. However, no concrete configuration can reach deployment review while the boot lifecycle conflict remains.

Google requires an active billing account for Free Tier, bills overage on a Paid billing account and reserves the right to change or remove Free Tier limits with 30 days' notice. Budgets/alerts alone are not a no-charge boundary. The strongest fail-closed gate would require all of the following before any resource creation: exactly one eligible non-preemptible `e2-micro`; eligible region; aggregate standard Persistent Disk allocation at or below 30 GB-month; no GPU/TPU, external paid SKU, autoscaling, paid fallback or quota increase; no automatic resource replacement outside the fixed manifest; network egress denied during ceremony; an account-level enforced zero-spend cap where available; otherwise billing disabled rather than relying on alerts. Official limits/source: [Google Cloud Free Tier](https://docs.cloud.google.com/free/docs/free-cloud-features); budget behavior: [Cloud Billing budgets](https://docs.cloud.google.com/billing/docs/how-to/budgets).

This cost gate is necessary but cannot authorize deployment and does not cure the security conflict.

## Owner decision required

One downstream boundary must change. Choose one of these concrete paths for a new full review:

1. **Minimal approved-UKI successor.** Authorize a new UKI/initramfs successor that preserves the exact approved kernel, dm-verity tuple, Root-Admitter ELF and all downstream identities, but adds an externally admitted Cloud Boot Adapter as the first init. The adapter would verify a signed provider/device manifest, resolve GCP disks only through exact `/dev/disk/by-id/google-*` identities, reject missing/extra/duplicate/ambiguous disks, construct the exact `/dev/v3-*` aliases and four mounts, emit deterministic evidence, then execute the existing approved `/init` bytes unchanged. This changes the UKI and initramfs identities and requires new firmware binding, closure, hostile suite and independent certification.
2. **Adaptation-root handoff.** Authorize a new external-boot binding in which the signed Cloud Boot Adapter kernel/initramfs genuinely constructs and verifies the canonical environment, then invokes the exact approved native supervisor and unchanged dm-verity root directly. This preserves the supervisor/root/downstream artifacts but replaces the requirement to boot the old UKI itself; it is a trust-model and authority-chain change, not a mechanical wrapper.
3. **Provider-native pre-mount proof.** Supply a GCP primitive, backed by current official documentation and hostile evidence, that creates the exact two root-level block-device identities and four Linux guest mount points before approved `/init` without changing the UKI or booting a preceding kernel. No such primitive was found in the approved feasibility evidence.

Until one path is approved, `CLOUD_BOOT_ADAPTATION_CONCRETE_CANDIDATE_READY_FOR_OWNER_REVIEW` cannot be claimed honestly. No adaptation candidate, cloud deployment, account activation, Bootstrap execution, Rust provisioning, Structural Enforcement, Authority Routing, merge, School or visuals work is authorized.

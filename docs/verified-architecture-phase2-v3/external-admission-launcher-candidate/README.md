# External Measured Admission / Launcher Candidate

Status: `EXTERNAL_ADMISSION_LAUNCHER_CANDIDATE_READY_FOR_OWNER_REVIEW`

Every new object is `CANDIDATE_FOR_OWNER_APPROVAL`. Nothing here authorizes execution. The candidate review bytes have no shebang, mode `100644` and a mandatory `E_CANDIDATE_AUTHORITY` stop before evidence commit or Bash handoff.

## Role and authority chain

This artifact is a narrowly scoped extension. It does not mutate or reopen the approved b768d48 bootstrap artifacts. After separate review and owner approval, an operational successor would replace the existing launcher for both admission and script handoff. It does not wrap or invoke the old launcher, avoiding duplicate authority. It verifies the approved cross-binding/signature identities, then binds the exact b768d48 repository commit/tree/script blob to the same approved script bytes. The approved measured-service package remains unchanged and non-executable. Integrating this new member into an operational signed root is a later affected-portion review, not silently claimed here.

## Enforcement

The candidate requires `/reviewed-root` as the exact repository mount; mount target exactly `/reviewed-root`; VFS `ro`; exact repository URL; exact commit `b768d48...`; exact tree `dd2228...`; exact script tree entry/blob/path; root ownership and no group/other writability for root, `.git`, `docs`, phase directory and script. It rejects symlinks and noncanonical script resolution.

The script is opened once as descriptor 9. Length, mode, owner, SHA-256, Git blob framing and device/inode identity are checked through that descriptor. The pathname device/inode must match at admission, but final handoff is `/proc/self/fd/9`, never the script pathname. A rename or path replacement after open cannot change the object read or handed to Bash. The read-only exact root mount prevents mutation through the authoritative namespace. Guarantees are limited to these enforced conditions and the approved reduced threat model; hostile kernel/hypervisor behavior is out of scope.

The domain-separated signed binding record joins candidate artifact bytes/identity, complete 24-file runtime closure, approved cross/signature, repository, commit, tree and script identity. The artifact reconstructs and exact-compares that record. A valid signature over a stale or wrong admission identity fails `E_ADMISSION_BINDING`.

## Evidence and cleanup

The deterministic evidence records repository, commit, tree, script blob/SHA/length/mode/owner, enforced mount target/options, descriptor device/inode, admission and same-descriptor handoff. Pre-authority verification uses pipes and shell variables only; it creates no scratch path. Candidate authority stops before the first mutable evidence write and before execution. A preexisting caller path is never deleted. Operational successor semantics create the fresh evidence directory only after admission and hand the same descriptor to Bash. The actual external `/usr/bin` tool namespace used for security decisions is the namespace hashed by the closure; its containing mount is required read-only, root-owned and non-writable by group/other.

The review-only Ed25519 private key was destroyed after signing. Its public key/signature prove candidate record consistency only; a later operational ceremony and affected cross-binding review are required.

# Provenance and affected integration boundary

Candidate artifact provenance is exact repository review bytes in this commit, mechanically hashed as raw bytes and Git blob. Its runtime is the exact 29-file closure derived from the already approved OCI root. The candidate depends on Linux procfs descriptor semantics, Git object/tree parsing, read-only mount enforcement, root ownership and kernel file-descriptor identity. Under the approved reduced threat model, kernel/hypervisor and a lying mount namespace are out of scope; the candidate does not claim resistance to them.

The existing approved launcher `fa2ecf9...` remains byte-identical evidence but has no operational authority when this candidate is selected. The new artifact replaces its admission and execution role; it does not call it. The authority path becomes:

`external protected admission key/config -> signed external-admission binding -> exact admission artifact + 29-file closure -> exact b768d48 repository/commit/tree/script blob -> one opened script object -> descriptor verification/evidence -> same-descriptor Bash handoff`.

The existing bootstrap cross-binding remains byte-identical and is verified as an input by this candidate. Because it does not yet name the new artifact, this package is not an operational closed root and cannot yield design PASS. After candidate approval, only the affected root integration must add the new artifact/binding/signature/closure and explicitly retire the old launcher's admission role. That regenerated root requires independent review. No unrelated approved byte or semantic rule is reopened.

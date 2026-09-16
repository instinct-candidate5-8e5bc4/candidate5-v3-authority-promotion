# Gate A.2 Immutable Definition + Lifecycle Envelope

Definition truth and admission truth now have separate digest domains.

`DefinitionRef` pins `{definitionType, definitionId, revision, definitionDigest}` for PHYSICAL_BODY, PROFILE or POSTURE. Definition bytes and digest never change during validation/review/admission.

The lifecycle envelope holds version/ID, exact DefinitionRef, lifecycle state, validation/review evidence, review decision/scope, limitations, supersession and its own `envelopeDigest`. Audit timestamps/transport metadata stay outside deterministic decision bytes. Envelope transitions are DRAFT -> VALIDATED -> REVIEWED -> VERIFIED_FOR_SLICE; terminal/exception transitions remain fail-closed. Every transition changes only envelope bytes/digest.

Registry admission requires lifecycle VERIFIED_FOR_SLICE, valid envelope digest, exact definition ref and exact expected scope. No envelope, stale ref, other revision, other digest, other scope or review of another definition is admitted. Runtime remains pinned to definition digest, never envelope digest.

The old embedded lifecycle/review functions now throw DEPRECATED_USE_LIFECYCLE_ENVELOPE or return false, leaving one admission source of truth. Existing definition lifecycle-looking fields are frozen historical bytes in reviewed revision 1 and are not mutable authority. New definition schemas should remove them in a future new schema revision only; removing them from the reviewed Gate B bytes now would violate the exact digest lock.

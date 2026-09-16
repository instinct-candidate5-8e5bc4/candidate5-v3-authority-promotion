# Multi-Support Contract Extension - Engineering Review and HARD STOP

## IDEA / OBSERVATION

`supportRelations[]` plus stable `relationId` and an exact `contactRegionRef` is a sound cardinality/identity model, but it is not sufficient by itself. The locked Phase 2 Geometry Gate accepts exactly one `surfaceId`, requires that surface type to be FLOOR or SUPPORT_SURFACE, and tests the *whole submitted geometry AABB's* `minY` against one horizontal `planeY`.

## WHY IT MATTERS

A real multi-contact body cannot honestly pass by submitting its whole AABB against two planes at different heights. Submitting only each contact-region AABB would check contacts but omit collision of the rest of the body. Wall support is explicitly impossible because Phase 2 rejects WALL as forbidden and has only horizontal Y-plane contact logic. Re-labeling a wall as SUPPORT_SURFACE or choosing a first/last relation would be a forbidden semantic substitution/proof loss.

This blocks required future cases including seated-on-floor leaning on wall, standing leaning on wall, floor + elevated legs, and any support set with non-horizontal contact.

## PROPOSED CHANGE

Approve a separately versioned `PHASE_2_MULTI_SUPPORT_EXTENSION` before implementing the runtime collection:

1. Add a request V2 that carries one exact full-body collision geometry/proof plus canonical `contacts[]` ordered by `relationId`.
2. Each contact carries `relationId`, exact `contactRegionRef` and region geometry/digest, exact surface model/surface ref, expected semantic type, contact normal, plane/region proof, and required/optional status (V1 starts required-only).
3. Validate full-body collision/containment once against the model's walls/doors/obstacles/legal room; validate every contact independently against its exact surface plane/region and normal.
4. Permit explicitly support-capable WALL contacts without changing the surface's WALL identity. Add vertical/axis-aligned plane contact semantics rather than re-labeling it.
5. Return one final result with canonical per-relation evidence. FAIL and UNKNOWN precedence is relation-ID deterministic after global identity/evidence checks. No proof borrowing; every required relation must PASS.
6. Preserve the existing V1 `evaluate(req, model)` behavior byte-for-byte and add a new versioned entry point or explicit V2 branch. The clean adapter remains the single call site to the selected Geometry Gate API.

## BENEFIT

This separates whole-body collision truth from contact-region support truth, supports arbitrary explicit cardinality, preserves exact surface semantics, and avoids another cardinality redesign for the posture list.

## RISK

Phase 2 reason/evidence schemas and proofs expand. Vertical contact tolerance, penetration direction, contact-region geometry validity, conflicting contacts, and global-vs-relation failure precedence need explicit contracts and tests. A weak wrapper above existing Phase 2 would create false PASS possibilities by failing to check full-body collision.

## SCOPE IMPACT

A locked Phase 2 contract/code change is required. The user's gate forbids that without separate approval. No clean-runtime Multi-Support code, migration, fixture, posture, ScenePackage, visual, clinical, legacy or production changes are safe to make first because the authoritative legality contract would still be incapable of proving the required semantics.

## YOUR RECOMMENDATION

HARD STOP this gate before implementation. Approve the minimal Phase 2 V2 contact-set extension above as its own gate. After it passes, resume Multi-Support with canonical world-owned relations and relation-addressed commands.

## Contact-role recommendation for the later runtime gate

Use exact authored `contactRegionRef {bodyId, bodyRevision, bodyDigest, contactRegionId}` plus a non-medical `contactRole` label. The exact region is the physical authority; labels such as FEET, PELVIS, TORSO, BACK, LEGS, HEAD, KNEES, HANDS and FULL_BODY are descriptive closed vocabulary, not geometry and not clinical state. Future bodies/postures author their own regions; no visual inference occurs. Existing Gate B/C definitions remain immutable.

## Migration recommendation for the later runtime gate

Make world-owned canonical `supportRelations[]` the sole authority. Entity views are derived, never serialized as a second mutable truth. A one-way explicit V1 migration command converts historical singular relations at an identified boundary; historical events/evidence are not rewritten. Gate C's `NOT_REVIEWED_FOR_SLICE` string remains recorded compatibility residue, unchanged.

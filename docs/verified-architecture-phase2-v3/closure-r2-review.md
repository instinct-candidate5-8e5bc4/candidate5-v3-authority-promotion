# V3 Surface / Containment / Opening Closure R2

Status: CLOSURE CANDIDATE ONLY — NOT AUTHORITY PROMOTED.

Normative input SHA-256: `214ea1a9923c7454cd2d605cc7ee93231c1a3ef426fce418b4b81e0a8a26c59f`.
Accepted ancestor: `1f1985ea0f37a8a82eb39efa9e28f2794fa5e667`.
Required correction base: `fe637a7278bf4082672703fd33a5edf5089d2fa8`.

## R2 cryptographic ownership

The reciprocal digest cycle is removed. The dependency graph is a DAG:

`authoritative request/envelope pin -> BoundaryFeature.digest -> {OpeningRegion.digest, solid geometry digests}`

`OpeningRegion -> {BoundaryFeature ID, revision}` only. OpeningRegion never embeds BoundaryFeature.digest.

Deterministic construction order: hash OpeningRegion and solids first; canonical-sort owner refs; hash BoundaryFeature; pin the final BoundaryFeature digest independently in the request or authenticated owning envelope. No independent pin means `UNKNOWN / UNSUPPORTED_GEOMETRY`, never PASS.

## Closure invariants

Support legality consumes explicit ContactRegionDefinitions and canonical SupportRelations. Each REQUIRED relation produces its own proof containing pinned identity, materialization evidence, contact distance, physical-normal compatibility, finite-polygon predicates and a proof digest. OPTIONAL semantics remain unsupported and fail closed.

Opening legality preflights the independently pinned owner, exact opening membership triple, opening back-reference, frames and every solid digest before geometry. Each body child then receives an opening-interior proof and SAT proof against every owner solid. Missing owner or child definitions are stale evidence, not empty space.

Containment and opening children are canonical-sorted. Definite outside/collision is distinguished from interval ambiguity; clear siblings cannot hide either.

## Mandatory regression set

The focused gate includes exact IDs `REG-V3-SUPPORT-AMBIGUITY-001`, `REG-V3-OPENING-AMBIGUITY-001`, `REG-V3-CONTAINMENT-COMPOUND-001`, `REG-V3-SUPPORT-COMPOUND-001`, `REG-V3-STALE-SURFACE-001`, plus preserved `REG-V3-SUPPORT-POLY-001`, `REG-V3-NORMAL-001`, `REG-V3-CONTAINMENT-AABB-001`, and `REG-V3-OPENING-AABB-001`. The hostile `MISSING-BOUNDARY` case is permanent. R2 owner-pin tamper, membership tamper, back-reference tamper, missing pin, owner-ref ordering, old-revision/pin replay and missing-solid cases are permanent subtests.

## Authority lock

`gatewayRouted=false`

`legalityPromoted=false`

No runtime, renderer, visual, School/vehicle/stair/posture production definition, route registration, readiness mutation, clinical, constraint, accessibility, fire, smoke, water, CCD, friction, stability or load implementation is authorized by this closure.

## Static-boundaries compatibility debt

`tests/verified-architecture-phase2/static-boundaries.test.js` is not modified or weakened. If its historical allowed-prefix lock fails against the accumulated accepted repository, the exact state remains:

`COMPATIBILITY_DEBT_PENDING_AUTHORITY_PROMOTION_REVIEW`

This is not converted into a geometry PASS.

## UNKNOWN / risk ledger

- Optional support relations remain unsupported.
- ContactRegion geometry is currently affirmative finite planar geometry; arbitrary compound ContactRegion representations are not promoted by this closure. Multiple required contacts are represented as separate SupportRelations with separate proofs.
- No continuous collision detection, friction/load/stability, water physics, entrapment/accessibility or clinical semantics.
- Performance evidence is measurement-only; no threshold is asserted.
- Historical static-boundaries policy requires the later explicit promotion-review decision already recorded by the project.

## Acceptance semantics

All 14 closure items must be supported by generated evidence before handoff. Even when all closure items are YES, the result is only ready for the same independent Authority Promotion Review. It does not authorize merge, routing or promotion.

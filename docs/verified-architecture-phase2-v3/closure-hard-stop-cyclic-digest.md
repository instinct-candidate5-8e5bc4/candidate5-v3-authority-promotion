# V3 Surface / Containment / Opening Closure — HARD STOP

Status: **HARD STOP — specification cannot yet be implemented without changing an authoritative contract.**

Scope remains isolated. `gatewayRouted=false`; `legalityPromoted=false`. No runtime, visual, gateway, promotion, or main-branch change is authorized by this record.

## Blocking contradiction

The supplied closure specification makes `BoundaryFeatureDefinition` and `OpeningRegion` mutually content-addressed:

- `BoundaryFeatureDefinition.digest` covers every field except its own digest and contains `openingRegionRefs[] = { geometryId, revision, digest }`.
- `OpeningRegion.digest` covers its definition and contains `boundaryFeatureRef = { boundaryFeatureId, revision, digest }`.

Therefore the BoundaryFeature digest depends on the OpeningRegion digest while the OpeningRegion digest simultaneously depends on the BoundaryFeature digest. With SHA-256 content digests this is a cyclic fixed-point requirement. There is no deterministic construction order and no authorized rule in the specification for breaking the cycle.

Inventing one of the following would change the contract and is therefore prohibited in this closure implementation:

1. omitting either cross-reference digest from its owner's digest coverage;
2. replacing one cross-reference with ID+revision only;
3. introducing a separate binding/manifest record whose digest binds both definitions;
4. using a two-phase unresolved reference or mutable post-seal patch;
5. accepting a placeholder digest.

Any of those choices requires an explicit design decision before implementation can satisfy the stale-evidence requirements.

## Work performed before discovery

The branch contains preliminary isolated closure scaffolding for affirmative ContactRegion, SupportRelation, BoundaryFeature records and pinned-reference preflight, plus a candidate closure legality path. These changes are **not a closure candidate** and are not claimed to pass tests or acceptance. They must not be authority-promoted.

The hostile missing-BoundaryFeature requirement is understood and the preflight direction is fail-closed, but no PASS claim is made because the complete binding contract cannot be instantiated under the current cyclic digest definition.

## Required decision

Choose and approve one acyclic binding model. Recommended minimal model for review:

- BoundaryFeatureDefinition owns `openingRegionRefs` with `{geometryId, revision, digest}`.
- OpeningRegion owns `boundaryFeatureRef` with `{boundaryFeatureId, revision}` only.
- OpeningRegion still resolves its BoundaryFeature affirmatively by ID+revision; the BoundaryFeature is the authoritative owner that cryptographically binds the OpeningRegion digest.
- Request/preflight evidence pins and reports both final digests, so stale/tampered evidence still fails closed.

Alternative: introduce a separate immutable `BoundaryOpeningBinding` record that contains both final refs and is itself pinned by the request. This is cleaner for symmetric binding but expands the record model.

Until one model is approved, acceptance checklist items 1–14 are **not all YES**, so the required result is HARD STOP.

# Gate A R1 v4 - Contract Additions Resolving the Engine's Three Integration Boundaries

Status: PROPOSAL, pre-admission. Nothing in this package is admitted, certified
or signed. The formal R1 review signs exact bytes; this document identifies them.

Supersedes: R1 v3 (f3e82f8b) - the v3 records are unchanged in content; v4 adds
the contract paths the engine's review found missing.

Evidence harness: `node scripts/track-b/gate-a-r1v4-contract-check.mjs` (18 checks,
all through the real repo contracts). Test suite: `tests/track-b/gate-a-r1v4-contracts.test.js`.

## Boundary 1 - ENTITY and SUPPORT_VOLUME admission types

`src/clean-runtime/authoring/admission/definition-ref.js`: TYPES gains `ENTITY`
and `SUPPORT_VOLUME`; `refFor` maps them to the entity definition fields
(entityDefinitionId/entityRevision/entityDigest) and volume fields
(supportVolumeId/volumeRevision/canonicalDigest). Because the envelope and
registry are generic over definitionRef, the admission path now EXISTS for
both types without touching envelope/registry bytes. Harness C1 proves the
envelope validates and the registry still rejects a draft with
NOT_VERIFIED_FOR_SLICE - admissible, never self-admitted.

New validator `src/clean-runtime/authoring/validators/support-volume-validator.js`:
validateSupportVolume (owner entity ref staleness STALE_VOLUME_OWNER, canonical
orientation + OWNER_TRANSLATION_IDENTITY_ORIENTATION binding, containmentRole
CONTAINMENT_INTERIOR, integer bounds, AUTHORED_NEW + provenance) and
materializeSupportVolume (world-region materialization; rotated owner throws
UNSUPPORTED_V1_CAPABILITY, stale owner throws STALE_VOLUME_OWNER).

## Boundary 2 - body identity seam

New module `src/clean-runtime/multi-support/owner-body-binding.js`: an explicit,
validated, digest-pinned, world-revision-bound BINDING record linking the
certified RECOVERED bag body (school-medical-bag-body r1, geometry digest
f3630d86...) to the AUTHORED_NEW owner body (school/medical-bag-owner-body r1).
The validator RECOMPUTES aggregate AABB equality from the two records - the
equivalence is proven, never asserted (BOUNDS_MISMATCH negative). The certified
recovered body record is not touched.

`validateRelations` gains an optional `ownerBodyBindings` parameter (default
null = byte-identical current behavior). An ownerBodyRef differing from the
runtime physicalBodyRef is accepted ONLY through a VALIDATED binding linking
exactly that recovered ref and owner ref at the target world revision;
anything else stays STALE_OWNER_BODY (negatives: no binding, wrong pair,
stale world revision). The multi-support runtime takes the bindings as
construction configuration (same trust level as legalityPort), seeded from the
validated scene package - world state bytes are untouched, so certified world
digests are unaffected.

## Boundary 3 - scene version + adapter contract

`scene-v2/validate.js`: v2.0.0 path byte-unchanged (C4a). New v2.1.0 branch
(same scenePackageId) admits exactly 4 entities: the certified three plus
synthetic-training-unit-v1 with exact pinned refs, requires the bag to carry
the interior floor surface, requires exactly one owner-body binding
byte-matching the validated module binding, and passes the validated binding
into relation validation. Four scene negatives (C4c-f).

`school-geometry-adapter.js`: new isTrainingUnit branch keyed on the certified
unit body recordId, materializing the bag interior floor from the owner entity
definition (the Gate C isSynthetic fixture branch is untouched and is a
separate branch; the fixture is NOT reused or cited as proof - C7).

Central module `src/clean-runtime/school/definitions/synthetic-training-unit-v1.js`:
all six records (owner body, owner entity, interior floor, containment volume,
unit body, owner-body binding) built once and run through the REAL validators
at load - a broken draft throws R1V4_DRAFT_INVALID instead of shipping.

## Integration proof (proposal testing, not admission)

C5: the v2.1.0 package instantiates atomically in a THROWAWAY in-memory
session - 4 entities, 4 support relations, replay stateDigest matches. This
exercises spawn + relation attach + the adapter legality path end to end.
It remains proposal testing: no certified world is modified; admission is the
formal R1 review.

## Signed semantic provenance

R1-Q1 (evidence/track-b/r1-q1-semantic-authorization.json,
wamid.HBgMOTcyNTMyNDkwMzUxFQIAEhgUM0EwRTNFRDUxRDZDQzAwNEU2NjcA) authorizes the
semantic MEANING (certified hollow interior + valid internal support floor for
this specifically certified configuration) under its 9 strict-scope bullets.
It does not admit these bytes; v4 makes the bytes admissible and reviewable.

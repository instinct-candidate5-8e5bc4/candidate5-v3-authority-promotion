# School Physical Authoring + Support Extension Preflight

**Decision:** READY FOR STAGED AUTHORING, WITH A BOUNDED PHASE 2 COMPATIBILITY PROFILE. No implementation is included.

## 1. New truth and status

This program authors new physical truth. Every new record starts `AUTHORED_NEW / DRAFT`, not RECOVERED and not VERIFIED. Legacy source, PNGs and `human-clothed-rig.glb` may inform author review, but cannot populate a binding field without an explicit new author decision. The first slice deliberately chooses a small deterministic physical representation rather than pretending the visual mesh is a collision body.

Promotion to `VERIFIED_FOR_SLICE` requires: schema and semantic validation; canonical digest; independent review of dimensions, frame, footprint and contacts; all acceptance fixtures; byte-identical rerun; authority/dependency audits; a locked revision; and a signed decision record naming the exact slice limits. Verification means fit for those tests, not anatomical or visual truth.

## 2. Casualty body recommendation

### Compared options

| Option | Determinism / Gate fit | Browser cost | Authoring risk | Decision |
|---|---|---:|---|---|
| One axis-aligned box | Excellent | Lowest | Overstates occupied corners; poor physical fit | Reject as long-term model |
| Compound authored primitives | Good if Phase 2 gains compound handling | Low | Explicit and inspectable | Recommended target |
| Capsule set | Good, but current Gate has only AABBs | Low-medium | Better anatomy; needs capsule collision/containment contract | Future extension |
| Convex hulls | Deterministic with canonical vertices | Medium | Tool/export and numeric complexity | Later profile |
| Simplified collision mesh | Requires canonical mesh/intersection rules | Highest | Easy to confuse visual and collision lineage | Not slice one |
| Posture-specific bodies | Excellent architectural fit | Proportional to posture count | Requires separate author review per posture | Required strategy |

**Recommendation:** posture-specific compound primitives, authored directly as physical records. For Gate B, author one adult `SUPINE_FLOOR` profile as a conservative union of a small bounded set of axis-aligned boxes. Do not derive dimensions from the legacy 1.80 sprite constant. A domain owner explicitly chooses and reviews every dimension. Gate B may use a deterministic conservative aggregate AABB only as the Phase 2 request projection, while retaining the authored compound body and proving that the aggregate encloses every component. This proves floor contact, full footprint and static-scene exclusion with the current Gate. It does not claim limb articulation or biomechanical fidelity.

`SEATED_ON_SUPPORT` is a separate body revision/package. It is not implemented or inferred from SUPINE. It belongs after the support contract is approved.

## 3. Authoring schema

```json
{
  "schemaVersion": "1.0.0",
  "bodyDefinitionId": "casualty/adult/supine-floor",
  "bodyRevision": 1,
  "status": "AUTHORED_NEW_DRAFT",
  "units": {"linear": "MICROUNIT", "microunitsPerAuthoredUnit": 1000000},
  "coordinateFrame": {
    "handedness": "RIGHT_HANDED",
    "axes": {"x": "entity-right", "y": "up", "z": "entity-forward"},
    "localOrigin": "AUTHOR_DECLARED_CONTACT_FRAME",
    "orientationConvention": "quaternion-xyzw",
    "allowedOrientations": ["IDENTITY_FOR_SLICE_V1"]
  },
  "profile": {"profileId": "adult-v1", "populationClaim": "SLICE_TEST_PROFILE_ONLY"},
  "postureBinding": {"postureDefinitionId": "SUPINE_FLOOR", "revision": 1},
  "collisionRepresentation": {
    "kind": "COMPOUND_AABB",
    "components": [{"componentId": "...", "min": [0,0,0], "max": [0,0,0]}],
    "phase2Projection": {"kind": "CONSERVATIVE_AGGREGATE_AABB", "bounds": {}}
  },
  "footprint": {"kind": "XZ_UNION", "regions": [], "aggregateBounds": {}},
  "contactRegions": [{"contactRegionId": "floor-contact", "planeY": 0, "regions": []}],
  "supportRules": [{"supportType": "SCHOOL_FLOOR", "contactRegionId": "floor-contact"}],
  "evidenceRefs": [],
  "authoringProvenance": {"status": "AUTHORED_NEW", "author": "...", "decisionRecord": "..."},
  "validation": {"status": "DRAFT", "validatorVersion": "..."},
  "bodyDigest": "canonical-sha256"
}
```

Digest excludes only `bodyDigest`; no timestamps, floats, map insertion order or tool-local paths. Binding geometry is integer microunits. Bounds use closed minima/maxima under ED-P2-02. Components and regions are sorted by stable ID. Duplicate IDs, empty contact regions, gaps between declared contact and body minimum, non-safe integers, invalid quaternions, undeclared supports, and projection non-enclosure fail validation. Nothing is snapped, clamped or repaired.

## 4. Dimension and profile strategy

Profiles are versioned physical test profiles: `adult-v1` first; child and infant are future independent authoring decisions. A profile is not an average person and does not inherit legacy visual scale. Gate B requires a human/domain author to provide a dimension decision worksheet with purpose, population limits, posture, measurement definitions, safety/conservatism rationale and review signoff. The physical record uses only the approved values. Updating any value creates a new body revision and digest.

## 5. Posture contract

`PostureDefinition` names the body definition/revision, contact regions, orientation constraints and allowed support types. `SUPINE_FLOOR` permits School floor only in Gate B. `SEATED_ON_SUPPORT` later binds to a different posture-specific body and a named support-surface type. A posture transition is a transaction replacing `postureStateId`, `physicalBodyRef`, geometry proof and SupportRelation together. Old body/posture proofs never carry forward. If any replacement proof is absent or stale, the entire transaction rejects.

## 6. Physical / visual separation

`CasualtyPhysicalBody` is authoritative for placement. `CasualtyVisualAsset` is not. A future `VisualPhysicalBinding` may map a visual revision and visual coordinate frame to a locked physical body revision with an authored transform and review status. Absence or staleness affects rendering readiness, not physical legality. A GLB cannot populate collision geometry merely because it is 3D.

## 7. Validation and lock pipeline

1. Author a draft record and dimension worksheet.
2. Validate JSON schema and closed enums.
3. Validate integer microunits, safe ranges, frame and orientation.
4. Validate primitive bounds, component disjoint/overlap policy and aggregate enclosure.
5. Validate footprint is the exact projection required by the representation.
6. Validate contact regions lie on declared body boundary and within footprint.
7. Validate support rules reference existing contact and support types.
8. Canonically sort and serialize; calculate SHA-256.
9. Run positive, negative, stale-proof, atomicity and deterministic fixtures.
10. Independent review; record limits and UNKNOWNs.
11. Lock immutable revision and promote only to `VERIFIED_FOR_SLICE`.

Every failure is explicit. The pipeline never edits the authored input.

## 8. New School support recommendation

Author one **fixed treatment chair** as a new entity in School ScenePackage V2. It is semantically useful for `SEATED_ON_SUPPORT`, smaller than a bed, and keeps the first support relation bounded. This is not any legacy chair. Its exact dimensions and location remain undecided until Gate C author review.

The support package contains: `entityDefinitionId`, body definition/revision/digest, integer-microunit transform, identity-only orientation for slice V1, compound/AABB collision body, source status `AUTHORED_NEW`, and one entity-owned seat surface. No visual asset is needed.

```json
{
  "supportSurfaceDefinitionId": "school/treatment-chair/seat-v1",
  "surfaceRevision": 1,
  "ownerEntityId": "school-treatment-chair-1",
  "localFrame": "owner-body-frame",
  "localPlane": {"normal": [0,1000000,0], "offsetMicrounits": 0},
  "localRegions": [{"regionId": "seat", "minX": 0, "maxX": 0, "minZ": 0, "maxZ": 0}],
  "contactRules": [{"contactRuleId": "seated-contact", "policy": "FULL_FOOTPRINT"}],
  "allowedPostures": ["SEATED_ON_SUPPORT"],
  "status": "AUTHORED_NEW_DRAFT",
  "surfaceDigest": "canonical-sha256"
}
```

World materialization uses the owner transform and declared identity orientation to produce a Phase 2 `SUPPORT_SURFACE`. The relation pins owner entity ID/revision, owner body revision/digest, surface revision/digest and the materialized composite-model digest.

## 9. Phase 2 compatibility analysis

Current Phase 2 accepts a Surface Model containing `SUPPORT_SURFACE`, checks exact model ID/revision/digest, requires full-footprint containment and plane contact, and already fails floating, penetration, forbidden type and outside-region cases. Its request supports one axis-aligned body box and translation. Therefore the first support slice can use Phase 2 **without modification** only under this profile:

- identity orientation;
- an authored conservative aggregate AABB for the casualty;
- an axis-aligned rectangular seat region and horizontal plane;
- deterministic adapter-side materialization performed by a separate contract transformer, not by physics heuristics;
- support collision volume ending exactly at the seat plane, so boundary contact is disjoint under existing rules;
- composite Surface Model revision/digest derived from static School model plus pinned support entity/body/surface revisions and world transform.

This is translation of authored contracts, not a second legality engine. The transformer may add integers and translate local bounds; it may not decide legal contact, collision or containment.

**Contract gaps for later:** rotated entity-owned surfaces, oriented/compound primitive evaluation without conservative AABB projection, non-horizontal support planes, multiple simultaneous contact surfaces, and direct provenance fields in Phase 2 evidence. These need a future Phase 2 extension proposal. They are not needed for the bounded identity-oriented chair slice.

## 10. Dependency invalidation and transactions

A `SupportRelation` pins `{supportEntityId, supportEntityRevision, supportBodyRevision, supportBodyDigest, supportSurfaceDefinitionId, supportSurfaceRevision, supportSurfaceDigest, supportTransformDigest, compositeSurfaceModelDigest}`. Validation happens on every casualty mutation and support-affecting transaction.

- Move or rotate support: old transform digest mismatches, so dependent proof is stale.
- Change support body or surface: pinned revision/digest mismatches.
- Remove support: relation cannot resolve and is invalid.
- Change casualty body/posture: relation must be reproved for the replacement body.

No operation silently drops, moves or repairs a casualty. Standalone move/change/remove of a support with active dependents rejects `DEPENDENT_SUPPORT_RELATION_REQUIRES_TRANSACTION`. Valid changes use one transaction containing the support mutation plus each dependent casualty's new transform/relation/proof, or explicit detach/rehome. Removal requires all dependents explicitly detached/re-supported/removed in the same transaction. The candidate graph is validated first, the composite model is built from that candidate, every affected body is passed through the Geometry Gate, all events append, then one state revision commits. Any failure rejects the whole transaction.

This requires a clean-runtime **multi-entity invariant validator** at the authority boundary. It checks references/revisions and transaction completeness, not geometry. Geometry remains solely Phase 2-owned.

## 11. School ScenePackage V2

V2 is new authored physical data and does not mutate `school-surface-v1`. It references the recovered static model as an immutable component, then adds authored physical definitions and instances:

- package ID/revision/digest/status and units/frame;
- recovered static Surface Model ref;
- authored support body and instance;
- authored entity-owned SupportSurface;
- casualty body/profile/posture definitions;
- deterministic composite Surface Model materialization contract;
- environment metadata with no visual authority;
- provenance per record and package-level validation report.

The package starts `AUTHORED_NEW_DRAFT`; only a reviewed locked revision becomes `VERIFIED_FOR_SLICE`.

## 12. Web/mobile implications

Slice V1 keeps primitive count small, stores integer arrays, and sends one aggregate AABB to the existing gate. Canonical records are compact and cacheable by digest. Composite models are cached by the tuple of static-model digest plus owner revisions/transforms/surface digests. Dependency lookup uses an owner-to-dependent index. Gate and serialization benchmarks report raw distributions, allocation and bytes for 1, 5 and future multi-casualty scenarios; no invented threshold. Collision meshes and hulls remain outside the first slice.

## 13. Acceptance matrix

### Gate A: contracts and synthetic fixtures

Schema rejection, integer/frame rules, canonical bytes/digest, projection enclosure, contact-region validation, provenance transitions, relation pinning, dependency graph and atomic transaction fixtures. No real dimensions.

### Gate B: authored adult SUPINE_FLOOR

After dimension signoff: legal School floor PASS/commit; floating, wall, door, locker, partial outside and full outside FAIL unchanged; stale body/posture/model/world proof FAIL; deterministic request/evidence/event/state. The aggregate-projection conservatism must be documented.

### Gate C: treatment chair + support surface

After support dimension/location signoff: support body legal placement; surface materialization and digest; casualty on seat PASS; floating, penetration, partial/full outside, wrong support type and stale support FAIL; moved support invalidates old relation; removed support cannot dangle; multi-entity move/remove transaction atomicity. Identity orientation only.

### Gate D: School physical entity E2E

ScenePackage V2 lock, full registry, bag regressions, casualty floor/support flows, dependency audit, exactly one Geometry Gate path, deterministic replay/performance evidence, inherited suites, zero legacy/production diff. Stop before visuals.

## 14. File-level proposal

- `schemas/clean-runtime/physical-body.schema.json`
- `schemas/clean-runtime/posture-definition.schema.json`
- `schemas/clean-runtime/support-surface.schema.json`
- `schemas/clean-runtime/school-scene-package-v2.schema.json`
- `src/clean-runtime/authoring/{canonical-validator,physical-body-validator,contact-validator,provenance}.js`
- `src/clean-runtime/school/definitions/{adult-supine-floor,treatment-chair}.json` only after author signoff
- `src/clean-runtime/school/support/{surface-materializer,dependency-validator}.js`
- `tests/clean-runtime-authoring/*`
- `tests/clean-runtime-school-entities/*`
- `evidence/clean-runtime/school-physical-authoring/*`

No changes are proposed to Phase 1, Phase 2, legacy, production or renderer paths for the bounded V1 profile.

## 15. Risks and UNKNOWNs

- Human/domain owner and dimension source for the first profile are not selected.
- Conservative aggregate AABB may reject physically legal placements; it must never create false PASS. A component-aware Phase 2 extension may later reduce false rejection.
- Chair dimensions, location and clinical suitability are undecided.
- Identity-only support orientation is a real slice limit.
- Compound-to-aggregate projection and dynamic model materialization need proof they contain no legality policy.
- Multi-entity invariant validation adds authority-boundary complexity and needs adversarial tests.
- `VERIFIED_FOR_SLICE` review ownership and signoff artifact format remain to be named.

## Stop

No body, support, surface, ScenePackage, Phase 2 extension or renderer has been implemented. Explicit GO is required for Gate A.

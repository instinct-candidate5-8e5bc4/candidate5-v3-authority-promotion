# Phase 2 V3 Oriented Geometry Design Contracts

Design only. Nothing here is wired to runtime or the Geometry Gate.

## Physical geometry identity

`PhysicalGeometryDefinition` contains geometry ID, schema version, revision, digest, provenance, local frame ref, representation kind, representation payload, materialization policy ref, capability records and limitations. Visual/GLB/Three.js identities cannot fill any field. PhysicalBody pins exact PhysicalGeometryDefinition and BodyLocalFrame. World materialization composes World -> entity -> body -> child/contact frame using accepted numeric contracts, with exact dependency and quantization evidence.

Compound children have stable child IDs, exact local frame refs and geometry refs. Canonical order is child ID. Duplicate IDs, cycles, stale refs and insertion-dependent digests reject.

## Oriented surfaces and contact regions

Finite planar regions pin frame, canonical coplanar polygon boundary, authoritative local normal, sidedness (`FRONT_ONLY` initially; double-sided only by explicit future capability), support capability and limitations. Surface semantics such as FLOOR, WALL, SEAT, BACKREST, RAMP, TREAD, RISER, LANDING and VEHICLE_FLOOR are separate semantic refs. WALL stays WALL even when rotated.

ContactRegionDefinition pins exact PhysicalBody revision/digest, region ID, body-local frame, planar/convex physical region and authored normal. Labels such as FEET, PELVIS, BACK, LEGS, KNEES and BODY_SIDE are descriptive and do not replace geometry.

World normals are derived by exact frame rotation. Support requires explicitly configured facing convention, normal compatibility, bounded distance/penetration interval and containment in the finite region. Opposite-facing or ambiguous normals return NORMAL_MISMATCH or QUANTIZATION_AMBIGUITY. Visual winding is ignored.

## Query taxonomy

Initial synthetic V3 query types:

- `BODY_VS_WORLD_SOLID`
- `BODY_VS_OBSTACLE`
- `BODY_CONTAINMENT_IN_ALLOWED_REGION`
- `BODY_VS_OPENING_BOUNDARY`
- `CONTACT_REGION_VS_SUPPORT_SURFACE`
- `BODY_VS_BODY`

Future/deferred: mesh queries, swept/continuous collision, deformable bodies and Constraint feature mechanics. ConstraintDomain may consume V3 overlap/distance evidence, but overlap is never interpreted as entrapment.

## Broad and narrow phase

Broad phase uses conservative error-expanded world AABBs and a deterministic spatial index. It may prove separation and skip a pair. It cannot produce final PASS, containment or contact legality. Candidate pairs are sorted by stable IDs.

Narrow phase initially uses SAT for OBB/convex pairs and plane/polygon projections for finite planar regions. Each candidate separating axis is canonicalized; projections are error intervals, not rounded points. Convex compounds test all relevant child pairs. Explicit opening checks test aperture inclusion and solid frame/boundary nonpenetration.

## Error-aware geometry and quantization

Every materialized coordinate is `[fixed-error, fixed+error]`, backed by exact rational source, fixed value, ties-to-even record and exact error. Derived dot/cross/projection bounds propagate conservatively with checked integer/rational arithmetic.

Decision policy:

- PASS only if the entire uncertainty interval satisfies every required inequality.
- FAIL only if the entire interval violates a required inequality or proves penetration/separation according to query semantics.
- If the interval straddles a boundary, contact plane, opening edge or SAT zero, return `QUANTIZATION_AMBIGUITY` (fail closed at mutation authority).
- No epsilon or implicit tolerance. A query may carry an independently approved exact policy ref; absent policy means exact zero-bound semantics plus ambiguity.

This handles sub-microunit gaps, corners near walls, narrow openings, rounded touching/penetration and contact near finite-region boundaries without false PASS.

## Openings and topology

OpeningRegion is an explicit aperture polygon in a named BoundaryFeature frame. Passing requires body projection wholly inside the aperture uncertainty-safe region and no intersection with the solid boundary/frame. Portal/access semantics are separate and not computed here.

TopologyFeatureSet names levels and geometric features. Stairs comprise treads (support-capable planes), risers (solid vertical boundaries), landings and staircase opening. Ramps are finite inclined surfaces with side/boundary solids as authored. Multiple elevations are ordinary framed geometry; topology refs express adjacency/identity only. No pathfinding.

## Vehicle-local readiness

A synthetic vehicle frame may own shell solids, floor, seat, backrest, dashboard, door boundary/opening and occupant allowed region. Parent rotation materializes all features into world space. Legal occupant state requires: body containment in allowed region; no shell/dashboard/boundary penetration; each required contact region passes its exact seat/backrest/floor query; opening crossing checks when relevant. Normal, 90-degree/on-side and 180-degree/upside-down transforms are representable. An externally specified 30 degrees remains unavailable until an approved angle-to-ratio policy supplies an exact authored ratio. This design does not silently approximate it.

Parent/frame revision changes invalidate every materialization and proof. No result survives without recomputation.

## Body-vs-body and motion

`BODY_VS_BODY` belongs in initial V3 because movable objects and multi-actor scenes cannot claim physical correctness without it. Initial support is discrete-state convex/compound overlap only. It does not prove biological contact or constraints.

Initial V3 remains discrete authoritative states. Animation/path endpoints alone risk tunneling. Any motion that can cross geometry between validated states must be UNSUPPORTED until a future swept-volume/CCD capability validates the path or uses sufficiently specified intermediate authoritative steps. Rendering interpolation is never collision proof.

## Separation of concerns

Geometric contact/containment does not prove friction, balance, center of mass, load capacity or structural stability. These remain UNKNOWN. Water volume/boundary geometry does not become rigid support, floating or buoyancy. Collision overlap does not imply entrapment. Accessibility and Constraint authorities remain separate.

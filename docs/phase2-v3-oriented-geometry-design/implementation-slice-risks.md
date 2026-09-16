# Proposed Next Implementation Slice, Performance and Risks

## Minimum next V3 implementation slice

Synthetic only:

1. New `evaluateV3` request/result routed through the existing sole Geometry Gate boundary.
2. PhysicalGeometryDefinition kinds ORIENTED_BOX, CONVEX_POLYHEDRON, COMPOUND and FINITE_PLANAR_REGION; explicit SOLID/OPENING features.
3. Accepted bounded Frame/Rotation materialization with interval error evidence.
4. Conservative AABB broad phase; OBB SAT, convex SAT and finite-plane/polygon narrow phase.
5. Queries BODY_VS_WORLD_SOLID, BODY_CONTAINMENT, BODY_VS_OPENING_BOUNDARY, CONTACT_REGION_VS_SUPPORT_SURFACE and BODY_VS_BODY.
6. Synthetic fixtures only: rotated boxes, convex compound, floor/wall/incline with an explicitly supplied ratio (not degree conversion), doorway, simple tread/riser/landing and synthetic local-world shell/seat/backrest.
7. Negatives for stale frames/geometry, overflow, degenerate shapes/axes, ambiguous intervals, normal mismatch, opening edges, child near-wall, tunneling unsupported and insertion-order tampering.
8. Canonical evidence, detached deterministic reruns, AST single-authority audit and measurement-only performance.

No real School definition is migrated. No vehicle/human/stair asset is authored.

## Web performance architecture

Cache derived materializations and broad-phase bounds by exact geometry+frame dependency digest. Invalidate on any dependency revision. Sort scene solids and candidate pairs by IDs. Use a deterministic spatial index only as acceleration; full narrow evidence remains authoritative. Measure compound child count, world solid count, broad candidates, narrow queries, tested SAT axes, interval bit sizes, cache hit/miss and invalidation, memory and p50/p95/max across target devices. Mobile optimization may reduce visual detail, never physical primitives or queries. No thresholds are set.

## Risks

- SAT degeneracy/cross-product zero axes need exact canonical rules.
- Convex authoring validity and face winding cannot rely on visuals.
- Interval propagation can be too conservative and produce UNKNOWN near boundaries.
- Exact rational/BigInt cost may be high for large compounds/mobile.
- Broad-phase bugs could omit pairs; conservative bound proof is required.
- Openings and allowed regions can become complex/concave and need explicit decomposition.
- Discrete validation permits tunneling if misused for motion.
- Physical meshes may later need a separate robust algorithm without weakening current proof.
- Stability/load may be mistakenly inferred from contact PASS; evidence must state limitation.

## UNKNOWN ledger

Phase 2 V3 error-budget/policy records; accepted non-axis external angle authoring; convex validity/decomposition authoring; SAT degeneracy and exact axis canonicalization; interval arithmetic tightness; spatial index design; physical triangle meshes; CCD/swept motion; articulation/deformation; friction/load/stability; complex concave topology; mobile BigInt performance; physical mesh evidence workflow; real vehicle/stair/human definitions. None is promoted.

# Engineering Partner Review

## Primitive choice challenge

No one primitive family covers the requested platform safely.

- **OBB only:** fast and debuggable, but compounds collapsed to one OBB create both false collision and false containment/contact results. An adult-v1 compound OBB can fill empty gaps between limbs and torso. OBB is valid only for explicitly authored box shapes or broad phase.
- **Convex polyhedra only:** expressive for rigid authored solids and compatible with SAT/support mappings, but concave rooms, openings, stairs and compound humans require decomposition. Decomposition identity/evidence must remain explicit.
- **Triangle meshes:** represent arbitrary boundaries, but are expensive and fragile as primary authority; visual topology/winding and tiny triangles must never become physical truth. A separately authored physical mesh may later be a bounded static-world narrow-phase tier, not the initial V3 primitive.
- **GJK/EPA support mappings:** broad convex support and future scalability, but deterministic fixed/rational termination, degeneracy and penetration-depth evidence are harder to audit than SAT for a first synthetic slice.
- **Hybrid:** conservative AABB broad phase plus exact/error-aware narrow phases selected by explicit primitive/query capability. Best fit.

## Decision

Use a tiered PhysicalGeometryDefinition:

1. `ORIENTED_BOX` for authored rigid boxes.
2. `CONVEX_POLYHEDRON` with canonical vertices/faces/planes for general convex rigid shapes.
3. `COMPOUND` with stable child IDs, exact child frame refs and children restricted initially to boxes/convexes.
4. `FINITE_PLANAR_REGION` for support/contact surfaces, authoritative normal, boundary polygon and sidedness.
5. `SOLID_REGION` assembled from explicit convex children for world solids/obstacles.
6. `OPENING_REGION` as an explicit bounded aperture on a named boundary plus portal semantic ref. Absence of solid is not enough.
7. `TOPOLOGY_FEATURE_SET` for levels, tread/riser/landing/ramp/opening identities. Topology does not itself prove collision.
8. `PHYSICAL_TRIANGLE_MESH` is deferred and requires separate authoring/provenance/algorithm gate. Visual mesh is never eligible.

Initial narrow phase: error-aware OBB-vs-OBB SAT, convex-vs-convex SAT, point/polygon/convex projection against finite planar region, and explicit solid/opening boundary tests. GJK/EPA and physical meshes are future capabilities. SAT axes come from authoritative faces and cross-products, canonicalized and deduplicated. Degenerate/quantization-ambiguous axes return UNKNOWN.

## Compound human analysis

Adult-v1 remains an authored compound. Broad-phase aggregate AABB/OBB may eliminate impossible pairs but cannot PASS. Every potentially interacting child is tested. Final body result combines all child evidence under the query policy. Child gaps remain gaps; collapsing to one OBB is prohibited. Canonical child order is by stable child ID, not insertion order.

## Additivity review

V3 can be a new evaluateV3 request/result and separate schemas behind the existing single Geometry Gate authority. V1/V2 adapters and evidence remain unchanged. V3 relies on the accepted frame/numeric substrate. If implementation needs any V1/V2 observable change or adds a second authority call site, HARD STOP for review.

## Final answer

**YES.** The tiered model can represent oriented rigid/compound bodies, finite support/contact regions, explicit openings, multi-level feature topology and vehicle-local worlds without renderer geometry and without another fundamental representation redesign. New algorithms can be added by primitive/query capability. Deferred meshes, CCD, stability and fluids fit as separate tiers/domains rather than changing identity, frame or evidence contracts.

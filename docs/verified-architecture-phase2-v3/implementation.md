# Phase 2 V3 Synthetic Oriented Geometry

The executable V3 experiment exposes `evaluateV3` directly for synthetic tests only. It is deliberately NOT routed through `phase2-gateway`, because the correctness gaps in the engineering review require a HARD STOP. V1/V2 behavior/evidence are unchanged and the single Geometry Gate authority call site remains one.

Implemented synthetic definitions: ORIENTED_BOX, CONVEX_POLYHEDRON, COMPOUND, FINITE_PLANAR_REGION, OPENING_REGION and TOPOLOGY_FEATURE_SET. SOLID semantics use explicit convex definitions/queries. Definitions pin ID/schema/revision/digest/provenance/local frame/capabilities/limitations. No visual identity exists.

Experimental query prototypes: BODY_VS_BODY, BODY_VS_WORLD_SOLID, BODY_VS_OBSTACLE, BODY_CONTAINMENT_IN_ALLOWED_REGION, BODY_VS_OPENING_BOUNDARY, CONTACT_REGION_VS_SUPPORT_SURFACE. Swept requests return UNSUPPORTED_QUERY.

The experiment consumes accepted exact frame/rational contracts. World corners/axes derive without floats. Materialization records fixed ties-to-even values and exact errors. Broad phase computes conservative world AABBs and only returns DEFINITELY_DISJOINT or NARROW_PHASE_REQUIRED. A caller cannot inject/override a broad result. Broad overlap is never PASS.

Narrow phase uses canonical axis keys and exact rational SAT projections for boxes/convexes. Zero cross axes are dropped. Axes and compound pairs are sorted. Touching is a distinct non-penetrating contact result and remains non-clear for BODY_VS_BODY. Convex definitions require at least four vertices/faces, valid unique face indices, nondegenerate faces, supplied physical normals, and a same-half-space convexity check independent from visuals.

Finite support uses an authoritative frame/normal and FRONT_ONLY policy. Contact minimum plane distance distinguishes floating, penetration and contact. Double-sided is unsupported. Opening is an explicit bounded aperture; full strict containment passes, edge contact is QUANTIZATION_AMBIGUITY, and outside/too-large is BOUNDARY_PENETRATION. Containment uses world bounds in this minimum box region slice; arbitrary oriented containment remains limited and must not be claimed beyond synthetic box regions.

Evidence pins request/query, child pair IDs, definition digests, frame dependencies/snapshot, exact rational bounds/projections, materialization/rounding/error, broad result, sorted SAT axes and distinct final reason. It always states GEOMETRIC_ONLY, NO_STABILITY_LOAD_FRICTION, NO_WATER_BUOYANCY, NO_ENTRAPMENT_INFERENCE and DISCRETE_STATE_ONLY.

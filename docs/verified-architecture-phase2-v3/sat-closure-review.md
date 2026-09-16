# V3 SAT Closure Review

Result: **PASS for the two-blocker SAT closure gate only**. V3 remains unrouted and non-authoritative. `gatewayRouted=false`; `legalityPromoted=false`.

## REG-V3-CONVEX-AXIS-001

The frozen fixture uses identical convex boxes with half extents (10,4,3). A has quaternion ratio (1,1,0,0). B has quaternion ratio (1,2,3,4) and translation (5,11,10). All coordinates, frame ratios and interval projections are exact rational data.

Every face-normal candidate is non-separating. Exactly one edge-cross candidate definitely separates: canonical `axis:0,42,15`, from A `edge:0:1` crossed with B `edge:0:3`. A projects to [-186,186]. B's lower bound is 19199999/100000, strictly above 186 despite complete materialization intervals. The full SAT returns this edge-cross source. A face-normal-only removal control does not return definite separation.

## Compound BODY_VS_BODY

Compound candidates resolve every child definition to an interval-aware primitive candidate. Child evidence retains definition digests, canonical child IDs, frame dependencies, and every MaterializedVertex evidence digest. No point-only or old experiment geometry is accepted.

Child pairs are canonicalized by `childA|childB`. Aggregation is deterministic and fail closed. Exceptional invalid/stale/overflow states dominate unsupported geometry; body collision dominates non-penetrating contact, which dominates quantization ambiguity, which dominates all-clear. PASS requires every child pair definitely clear. Tests cover collision plus a clear sibling, all-clear, exact contact, ambiguity contagion, stronger collision versus ambiguity, exceptional states, malformed state rejection and insertion-order invariance.

This closure does not infer support, opening, containment, contact-normal legality, routing, vehicles, stairs, posture, clinical state, CCD, stability, friction, load or water physics.

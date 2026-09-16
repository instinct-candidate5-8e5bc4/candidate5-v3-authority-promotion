# Algorithm Comparison, Evidence and Synthetic Walkthroughs

## Algorithm comparison

| Candidate | Determinism/fixed suitability | Compound/opening fit | Complexity/debug | Decision |
|---|---|---|---|---|
| OBB SAT | strong; finite axes and interval projections | good for box children, poor universal shape | low, inspectable axes | initial box narrow phase |
| Convex SAT | strong if canonical faces/axes and degeneracy rules | strong for convex children | medium, good evidence | initial convex narrow phase |
| GJK | possible but termination/simplex degeneracy require policy | broad convex support | medium-high, less direct evidence | defer |
| EPA | penetration depth after GJK adds degeneracy/iteration issues | convex only | high | defer |
| Triangle/convex | physical meshes can represent concavity | openings/static solids possible | high, topology robustness | separate future gate |
| BVH | deterministic if canonical build | acceleration only | medium | future broad-phase optimization |
| Hybrid AABB + typed narrow phase | strong and extensible | best overall | explicit dispatch | selected |

## Failure taxonomy

`INVALID_INPUT`, `STALE_EVIDENCE`, `UNSUPPORTED_GEOMETRY`, `NUMERIC_OVERFLOW`, `QUANTIZATION_AMBIGUITY`, `BODY_COLLISION`, `OBSTACLE_PENETRATION`, `BOUNDARY_PENETRATION`, `OUTSIDE_ALLOWED_REGION`, `CONTACT_FLOATING`, `CONTACT_PENETRATION`, `CONTACT_OUTSIDE_REGION`, `NORMAL_MISMATCH`, `UNSUPPORTED_QUERY`, `UNKNOWN`. These remain distinct.

## Evidence contract

Every query result pins request/query IDs and versions; body/child/shape and target IDs/revisions/digests; all frame refs and resolved dependency chain; exact rational source; fixed materialization; rounding and interval errors; broad-phase bounds/result; sorted narrow-phase axes/features; interval projections/distances; support normal/facing/containment evidence; policy ref; final status/reason; evidence digest. PASS is never opaque.

## Synthetic algorithm walkthroughs

A. Rotated box on horizontal floor: broad AABB candidate, OBB corners/face interval, bottom contact region plane distance and polygon containment, normal match.

B. Box on 30-degree incline: only after an approved exact angle-ratio authoring policy. Without it, UNSUPPORTED/UNKNOWN, never approximate.

C. Box touching vertical wall: BODY_VS_WORLD_SOLID SAT distinguishes separated/touching/penetrating intervals; support is not inferred.

D. Compound body, one child near wall: broad aggregate cannot PASS; child SAT identifies only the interacting child. Empty compound gaps remain empty.

E. Floor + elevated seat: independent contact queries retain exact target and region IDs; all REQUIRED contacts must PASS.

F. Floor + wall: horizontal and vertical target normals are checked independently; descriptive roles do not decide geometry.

G. Body inside rotated synthetic vehicle: compose parent/local frames; containment, shell/dashboard noncollision and required seat/backrest/floor contacts all pass.

H. Vehicle on side (90 degrees): same local definitions, new parent revision; all proofs stale and recomputed with rotated normals.

I. Vehicle upside down (180 degrees): floor/seat normal compatibility may fail for a posture; geometry does not reinterpret semantics.

J. Body through legal oriented doorway: body uncertainty hull fits fully inside aperture and does not hit boundary frame.

K. Doorway boundary intersection: BOUNDARY_PENETRATION; a missing wall segment is not an opening proof.

L. Multi-level stairs: individual treads/risers/landing/opening have frames/geometry and topology identity; each contact/collision query is local. Traversal/path is out of scope.

M. Two bodies: broad candidate then all relevant convex child pairs. Any proved overlap returns BODY_COLLISION under the query policy; ambiguity stays UNKNOWN.

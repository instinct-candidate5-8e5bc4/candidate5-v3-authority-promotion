# Interval Foundation Risks and UNKNOWN

- Materialized scalar interval currently reconstructs the accepted closed interval from fixed value and exact recorded signed error magnitude. A future schema should pin both signed error and absolute bound explicitly.
- Frame rotation itself is exact rational, so direction is exact before fixed materialization. If future geometry materializes directions, a separate directional policy is required.
- Independent intervals discard shared-transform correlation. Safe but potentially highly conservative; affine forms or symbolic shared-noise terms may later reduce UNKNOWN without changing contracts.
- Convex edge completeness assumes already validated closed face topology; stronger manifold/orientation validation remains for the SAT gate.
- Basis vectors are homogeneous and unnormalized. Future predicates must account for scale and cannot compare distances across different basis scales without exact adjustment.
- Projection currently uses world-origin dot products; containment can subtract target origin in the future legality gate. This is a translation offset, not visual UV.
- Broad integrity recomputes from vertices; large geometry may need canonical cache/indexing.
- No SAT, polygon containment, opening, contact or body containment legality is completed here.

None is promoted. The prior hard stop remains for authority routing.

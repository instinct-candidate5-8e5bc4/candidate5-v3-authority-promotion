# V3 Interval-Aware SAT Correctness Review

Result: **HARD STOP**. V3 remains unrouted and non-authoritative.

## Engineering findings

The interval-bearing data foundation is sufficient for sound projection on exact homogeneous axes. The new candidate implementation:

- consumes MaterializedVertex intervals, not naked rounded coordinates;
- computes interval dot products and projection envelopes;
- canonicalizes exact proportional axes and q/-axis direction identity without float normalization;
- generates the complete OBB family: three axes per OBB plus all 3x3 cross products, skipping exact zero only;
- generates convex face-normal and all canonical edge(A)xedge(B) candidates from complete extracted edges;
- records axis source, representation, projection intervals and classification;
- returns DEFINITELY_SEPARATED, DEFINITELY_NON_SEPARATED or QUANTIZATION_AMBIGUITY;
- treats exact touching as a distinct NON_PENETRATING_CONTACT outcome, not support semantics;
- validates source broad bounds before narrow use.

However, two mandatory requirements are incomplete:

1. `REG-V3-CONVEX-AXIS-001` requires a permanent geometric fixture where face normals all fail to separate but a specific edge-cross axis definitely separates. Candidate generation is complete, but no verified fixture/evidence yet identifies an edge-cross axis as the actual separator. Merely showing the axis exists does not meet the proof.
2. Compound BODY_VS_BODY aggregation over canonical child pairs is not implemented on the new interval SAT path. The old point experiment cannot be reused. Therefore an ambiguous child could not yet be proven contagious and a one-child collision cannot be evidenced through the corrected path.

Under the gate, required final questions 5 and 7 are NO. Authority promotion is prohibited. No gateway changes were made.

## Uncertain axis policy

Exact authored/frame-derived axes remain homogeneous exact rationals. A DERIVED_INTERVAL axis is never projected via a center/representative. Current SAT returns QUANTIZATION_AMBIGUITY for it. This is conservative and may be relaxed only by a future sound quantified interval-direction predicate.

## Projection semantics

For each exact axis, every IntervalVector3 vertex is interval-dotted. Shape projection is the hull of vertex dot intervals. Definite separation requires one projection upper bound strictly less than the other lower bound. If uncertainty can change separation, result is QUANTIZATION_AMBIGUITY. Whole-interval universal proof is enforced; shared-correlation widening can only turn a result ambiguous, never select favorable values.

## Touching and precedence

Exact touching is non-penetrating contact and distinct from both separated and penetrating. BODY_VS_BODY currently rejects both touching and overlap as non-clear geometry, while evidence preserves the distinction. This does not infer support.

Precedence: malformed/tampered/stale and inconsistent broad evidence; numeric/resource failure; unsupported geometry/query; definite separation/collision; ambiguity; PASS. The experiment does not claim complete end-to-end precedence until compound aggregation is added.

## Next minimum correction

- Author/verify a stable skew-convex edge-edge separating fixture and assert the exact separating axis source/digest.
- Implement corrected-path compound candidate materialization and canonical child-pair aggregation with ambiguity contagion.
- Add compound-vs-compound scope decision and insertion-order evidence.
- Re-run all required negative/degenerate/stale/overflow matrices and performance counters.
- Repeat promotion review. Do not route before every answer is YES.

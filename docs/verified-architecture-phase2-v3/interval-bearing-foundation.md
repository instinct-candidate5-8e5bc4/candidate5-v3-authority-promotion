# V3 Interval-Bearing Geometry Foundation

Result: PASS for data substrate only. `gatewayRouted=false`; no legality algorithm is promoted.

## Canonical dataflow

```text
Authored exact local coordinate
 -> accepted exact Frame composition
 -> exact rational world coordinate
 -> Numeric materializeVector (ties-to-even, scale 1e6)
 -> fixed coordinate + exact signed error
 -> closed scalar interval around fixed value
 -> IntervalVector3 + policy/evidence digest
 -> MaterializedVertex + geometry/child/owner/frame lineage
 -> derived edge/direction/basis/projection/broad-bound records
```

No candidate produced by this path exposes an anonymous rounded coordinate. Existing point-only experiment functions remain quarantined and non-authoritative; future narrow algorithms must accept MaterializedVertex/Direction records only.

## Value classes

- EXACT_RATIONAL: authored coordinates, canonical homogeneous directions, exact frame rotations/cross products where inputs are exact.
- MATERIALIZED_WITH_INTERVAL: world position crossing the fixed geometry boundary, carrying exact source, fixed value, signed error and closed interval.
- DERIVED_INTERVAL: vectors/projections/bounds calculated from intervals.
- UNSUPPORTED/AMBIGUOUS: an operation whose uncertainty/correlation cannot safely classify. It cannot PASS.

Directions and normals are not translations. Exact canonical homogeneous direction components avoid normalization. A derived uncertain cross product is an interval direction. It is not silently normalized.

## Contracts

IntervalVector3 has three scalar materialization records, Numeric policy ID, complete evidence and canonical digest. MaterializedVertex binds vertex, geometry revision/digest, child/owner, exact local coordinate, exact world rational coordinate, IntervalVector3, exact frame dependency proof and evidence digest.

Convex edge extraction walks every canonical face boundary, creates one undirected `(minVertex,maxVertex)` identity, unions source faces and sorts edge IDs. This is complete for validated face topology and insertion-order independent.

Finite planar basis uses only physical normal/frame semantics. It picks the canonical world-local seed axis with least absolute normal component, then `u=seed×n`, `v=n×u`, producing right-handed U,V,N without normalization or visual UV/winding. Target-local 2D projections dot IntervalVector3 with exact homogeneous basis directions and retain interval/provenance.

Opening data binds BoundaryFeature, OpeningRegion geometry, physical basis and projected interval vertices. It contains no world-AABB legality result.

Broad AABB lower/upper are component-wise minima/maxima of every vertex interval. It pins geometry, sorted vertex evidence, frame dependency digest and interval policy. Recalculation mismatch/tampering rejects. It remains acceleration-only.

## Correlation review

Independent component intervals are conservative for affine transforms, AABB envelopes and dot products with exact directions. Vertices sharing one frame can over-expand because correlations are lost; that creates ambiguity, not false PASS, provided predicates require whole-interval proof. Uncertain axes crossed with uncertain edges require derived interval directions; if zero/nonzero or orientation cannot be proven, the future predicate must return QUANTIZATION_AMBIGUITY.

Related opening/body frames can share error. Independent intervals over-approximate the joint set. It is safe for containment only when PASS means every value in the product intervals passes; otherwise UNKNOWN. No future algorithm may select favorable independent endpoints. Basis vectors remain exact only when derived from exact physical normal/frame rotation; if materialized, they become interval directions.

No false-PASS route is found in this substrate. Correlation loss may cause false ambiguity and performance cost. The legality gate must preserve universal quantification over intervals.

## Staleness

Every MaterializedVertex pins the complete frame chain. A parent revision/digest change makes it stale. Derived edge, normal, projection and broad records cite source evidence digests, so staleness propagates transitively. No partial reuse is authorized without validating all source/dependency digests.

## Required engineering answers

1. Rounded coordinate without uncertainty/provenance reaching next candidate path? NO, for the new canonical materialization API.
2. Positional uncertainty, directional uncertainty and exact rationals distinguished? YES.
3. Parent mutation leave valid derived geometry? NO; exact dependencies/evidence invalidate.
4. Convex edges complete/canonical for next SAT gate? YES for validated face topology.
5. Finite surfaces/openings projectable target-locally without AABB assumptions? YES as data.
6. Broad bound conservative over intervals? YES by component hull construction.
7. Correlation analysis reveals route to false PASS? NO if future predicates obey whole-interval proof; uncertain direction/correlation must become ambiguity.

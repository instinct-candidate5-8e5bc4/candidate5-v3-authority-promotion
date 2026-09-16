# Numeric Frame / Rotation Contract

## Domains

ED-P2-02 remains: one world unit is 1,000,000 integer microunits. Canonical stored translations are three signed decimal strings within signed 63-bit magnitude range. Rotations are canonical bounded integer quaternion ratios. Composition uses checked exact BigInt rational arithmetic up to 4096 magnitude bits. Materialization targets integer microunits. There is no underflow in exact integer/rational domains; values smaller than half a target microunit can round to canonical zero only at explicit materialization. Overflow fails closed.

JSON contains only canonical decimal strings, arrays and objects. Raw BigInt never crosses JSON or digest boundaries. Canonical object keys are sorted before SHA-256. Clones/freezes are used for returned values. JavaScript Number is used only for safe metadata/counters/timings, never authoritative coordinates, ratios or rational arithmetic.

## Frame graph

One WORLD frame has no parent. ENTITY_LOCAL, FEATURE_LOCAL, SURFACE_LOCAL, BODY_LOCAL and CONTACT_REGION_LOCAL require exact parent `{frameId, revision, digest}`. Validation rejects zero/multiple worlds, missing/dangling/stale/wrong parents, duplicate IDs, tampered digests, self/direct/indirect cycles, depth/count excess and malformed transform values. Sorted IDs make graph digest independent of insertion/map order.

Resolution follows exact refs to World, reverses the chain and composes in that order. Rigid composition is `t = t_parent + R_parent * t_local`, `q = q_parent * q_local`. Exact rational reduction after operations preserves values, so associativity holds before quantization. A World→Entity→Feature→Surface/Body→ContactRegion chain is proved with local, parent and resolved world values.

## Rational growth and materialization

Exact rationals are necessary to keep composition associative, but growth is mathematically unbounded without resource constraints. This gate therefore fails on 4096-bit intermediates or depth over 64. Measurements report depth 1/2/4/8/16/32/64 operand bits, canonical byte size and timing without a performance threshold.

Materialization is explicit:

- source: exact vector numerators/common positive denominator;
- target scale: 1,000,000 microunits/world unit;
- rounding: nearest, ties to even, performed with integer quotient/remainder;
- negative values round symmetrically; negative zero is impossible;
- output signed 63-bit or reject `MATERIALIZATION_OVERFLOW`;
- impossible requested precision rejects;
- evidence includes exact source, fixed result, each exact error, scale, rounding ID and maximum absolute positional error `1/(2*scale)` world units per coordinate.

No Phase 2 V3 tolerance is invented. A caller must compare the exposed exact error with an independently approved operation error budget.

## Snapshot and invalidation

World transforms are derived on demand. A cache is optional optimization, never authority. A snapshot contains the exact ordered dependency refs, rational transform and snapshot digest. Any parent revision/digest change makes descendants stale. Stale cache is rejected; a caller may explicitly recompute from a newly validated graph. Synthetic parent movement invalidates feature/seat and occupant-contact snapshots without creating a real vehicle.

## Renderer boundary

Renderer conversion is downstream and derived. A renderer may convert exact materialized translation and canonical quaternion/matrix to floats for display. Renderer floats, matrices and quaternions never feed authoritative state or proof. No Three.js code is included.

## Oriented surface numeric readiness

Synthetic ratios represent horizontal, vertical, 90-degree, 180-degree/upside-down and representative 30/45-degree-like orientations at the transform level. No claim is made that a chosen integer ratio exactly equals an external degree value unless its exact quaternion is representable; no surface geometry or legality is implemented.

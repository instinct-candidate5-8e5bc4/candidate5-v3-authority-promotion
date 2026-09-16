# Phase 2 V3 Narrow-Phase Correctness Review

Result: **HARD STOP**. The interval arithmetic primitive is sound at its tested scalar/vector level, but the eight accepted blockers are not all corrected. Authority promotion is forbidden.

## Promotion questions

1. Does every V3 PASS depend on complete narrow evidence rather than broad/AABB? **NO** - prototype opening and containment still use AABB final predicates.
2. Does every required uncertainty propagate through the actual predicate? **NO** - SAT/contact/opening/containment still consume exact rational points without materialized coordinate intervals.
3. Does convex SAT use complete face plus edge-cross set? **NO**.
4. Does finite support prove contact and finite containment? **NO**.
5. Are opening and containment target-oriented rather than world AABB? **NO**.
6. Does contact enforce authoritative normal compatibility? **NO**.
7. Does every boundary have legal/illegal/exact/uncertainty-crossing regression? **NO**.
8. Is there one authority path and zero bypass? **YES** because V3 remains intentionally unrouted; this does not compensate for 1-7.

Any NO requires HARD STOP under the owner-approved gate. `phase2-gateway` is unchanged. The experimental 15/15 tests include five interval-unit proofs and ten prior experiment tests; they are not authoritative legality proof.

## Interval foundation delivered

`interval.js` defines canonical closed exact rational intervals, rejects lower>upper, and implements addition, subtraction, negation, multiplication, scalar multiplication, dot accumulation, projection, zero containment, strict comparisons and explicit separation/overlap/ambiguity classification. It uses no float or epsilon. REG-V3-QI-SAT-001 demonstrates crossing uncertainty is ambiguous.

## Why implementation stops here

A correct retrofit is not a small wrapper around current SAT. It must change the core dataflow so each transformed/materialized coordinate enters narrow phase with exact source, fixed result and accepted error interval. Axes, transformed normals and target-local bases then require interval or exact provenance that preserves correlations. Convex topology must canonically extract complete edge sets. Support/opening/containment need common target-local half-space predicates. Adding partial interval checks would create a plausible but unsound PASS path, exactly what this gate prohibits.

## Required next correction package

- Replace point-only materialized shape data with interval-bearing vertices/axes/normals.
- Implement canonical convex topology/edge extraction and complete SAT axes.
- Implement interval-expanded broad bounds and tamper/completeness proof.
- Implement target-local 2D convex polygon predicates and oriented 3D half-space containment.
- Implement contact-normal pairing and interval plane distance.
- Add all six named false-PASS regressions and four-way adversaries for every predicate.
- Add deterministic evidence operation counters/axis provenance.
- Run promotion review again. Route only if all eight answers are YES.

## Failure precedence retained

Malformed/tampered/stale, numeric overflow, unsupported representation/query, inconsistent broad evidence, definite narrow illegality, quantization ambiguity, PASS. Current experiment cannot claim this precedence end-to-end because several required predicates are absent.

## Remaining limitations and UNKNOWN

Transform uncertainty correlation model; interval axis canonicalization; complete convex topology proof; edge-cross regression geometry; target-local basis generation and orientation; convex polygon interval predicates; arbitrary oriented containment; body cross-section for openings; contact normal tolerance policy (none may be invented); performance after interval propagation; cache behavior; target-browser BigInt. All stay UNKNOWN.

# V3 Surface / Containment / Opening Correctness Review

Status: **IMPLEMENTED ON ISOLATED REVIEW BRANCH — NOT AUTHORITY-PROMOTED**.

Base: `1f1985ea0f37a8a82eb39efa9e28f2794fa5e667`.
Branch: `chatgpt/v3-surface-containment-opening`.

## Scope implemented

- Interval-aware finite SupportSurface contact proof.
- Full ContactRegion finite convex polygon containment in a physical target-local basis.
- Exact physical contact-normal compatibility; renderer/UV/winding are not authority.
- Target-oriented body containment using target physical axes, not world AABB final legality.
- Explicit BoundaryFeature / OpeningRegion legality using opening-local oriented axes, not absence-of-wall inference and not world AABB final legality.
- Compound propagation for support and containment.
- Quantization ambiguity is fail-closed: boundary/uncertainty cannot PASS.

## Permanent regressions added

- `REG-V3-SUPPORT-POLY-001`
- `REG-V3-NORMAL-001`
- `REG-V3-CONTAINMENT-AABB-001`
- `REG-V3-CONTAINMENT-COMPOUND`
- `REG-V3-OPENING-AABB-001`
- `REG-V3-SUPPORT-COMPOUND`
- `REG-V3-STALE-SURFACE`

The support matrix also freezes legal contact, floating, penetration, exact boundary ambiguity; the opening matrix freezes legal interior, exact edge ambiguity, outside penetration, and oversized-body rejection.

## Local verification evidence

The focused `tests/verified-architecture-phase2-v3/*.test.js` suite ran **49/49 PASS**. Two detached focused runs were byte-identical after normalizing timing-only fields.

A broad local `node --test tests/**/*.test.js` run produced 386 passing tests and one environment-only failure: `tests/verified-architecture-phase2/static-boundaries.test.js` invokes `git diff`, while the supplied review archive has no `.git` metadata. The failure was `Not a git repository`; it was not a geometry assertion failure. This historical static-boundaries compatibility debt remains explicitly pending the separate Authority Promotion Review.

## Locks preserved

- `gatewayRouted=false` by scope: no V3 routing/promotion is performed here.
- `legalityPromoted=false`.
- No real School/vehicle/stairs/posture definitions authored or migrated.
- No renderer/Three.js physical authority.
- No clinical, Constraint/Accessibility, fire/smoke/water, CCD, friction, stability or load work.
- Existing SAT + BODY_VS_BODY closure is reused and not reopened.

## Next checkpoint

Do **not** promote this branch directly. Next step is a separate `V3 AUTHORITY PROMOTION REVIEW`, including explicit disposition of the historical `static-boundaries` compatibility lock and an authenticated repository/CI run before any Geometry Gate routing.

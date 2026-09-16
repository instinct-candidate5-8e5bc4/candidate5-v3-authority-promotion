# Engineering Partner Review and ADRs

## Challenges resolved before codifying

1. **Duplicated truth across authority roots.** Cross-domain refs replace copied state. Only the owner stores authoritative data; derived records pin revisions and invalidate.
2. **Capabilities becoming tags.** Capability records require version, scope, parameters, status, evidence and limitations. Tags cannot enter compatibility rules.
3. **Moving-parent frame identity.** Definition identity alone is insufficient. Future frame state revision/digest changes on parent transform; composed consumers pin and invalidate.
4. **Floating quaternion nondeterminism.** Rejected normalized floats. Canonical integer quaternion ratios plus exact rational matrices remove sign/scale ambiguity; geometry rounding is deliberately deferred to a reviewed V3 numeric boundary.
5. **Constraint expressiveness.** A boolean or SupportRelation is rejected. Region, feature, pinned frame, motion declaration, lifecycle and release transition are required. Complex joints/forces remain UNKNOWN.
6. **Accessibility semantics.** Actor, target, optional region and objective are required. Status alone is insufficient.
7. **Clinical presentation leakage.** Projection explicitly identifies exposed observations and hidden refs; renderer receives presentation, not ClinicalState.
8. **Cross-domain partial failure.** Universal rollback is rejected. Deterministic saga with prevalidation/reservations, immutable history, blocked partial status and reviewed forward compensation is recommended.
9. **Visual anchors for humans.** Anchor names alone are insufficient. Exact physical contact/body and asset-family anchor identities must be reviewed together; otherwise alignment is UNKNOWN.

## ADR summary

- ADR-01: Independent domain roots and exact immutable refs. ACCEPT.
- ADR-02: Open semantic/component registry; tags descriptive only. ACCEPT.
- ADR-03: Scoped/evidenced Capability Registry and deterministic fail-closed compatibility. ACCEPT.
- ADR-04: Frame hierarchy with canonical integer quaternion ratios. ACCEPT AS CONTRACT; numeric bounds/rounding block implementation.
- ADR-05: Lower oriented primitive layer plus additive Phase 2 V3. ACCEPT AS PROPOSAL; do not change V1/V2.
- ADR-06: Constraint and Accessibility separate from Support and each other. ACCEPT.
- ADR-07: Deterministic saga with reservations/forward recovery. RECOMMENDED; coordinator unimplemented.
- ADR-08: VisualBinding only renderer bridge and same-family fallback. ACCEPT.

## Risk register

| Risk | Severity | Control |
|---|---:|---|
| Root copies drift | Critical | Owner-only data plus exact refs/invalidation. |
| Registry wish-list claims implementation | Critical | Four-state status; CONTRACT_ONLY never passes implementation requirement. |
| Quaternion overflow/rounding ambiguity | Critical | Implementation HARD STOP until bounds and fixed-point conversion rules are approved. |
| Frame cycle or stale composition | High | Future acyclic validation, state revisions and deterministic invalidation. |
| V3 accidentally rewrites V1/V2 | Critical | Additive gate; separate review on any required modification. |
| Saga leaves unsafe partial state | Critical | Prevalidation/reservation, dependency order, blocked status and explicit forward recovery. |
| Compensation fabricates rollback | Critical | Compensation is a new event/action only. |
| Constraint implies solver capability | High | Contract-only status and explicit no-solver limitation. |
| Accessibility looks like pathfinding | High | Assessment/evidence only; no route computation claim. |
| Hidden clinical truth leaks | Critical | Reviewed projection allowlist and separate Presentation root. |
| Visual fallback changes meaning | Critical | Same exact asset family and semantic/physical refs. |
| Human anchors exist only visually | High | Require matching physical contact/body anchor evidence. |

## Fail-closed matrix

| Condition | Required result |
|---|---|
| Missing semantic capability | Scenario compatibility UNKNOWN/reject |
| Capability CONTRACT_ONLY but implementation required | UNSUPPORTED/reject |
| Unsupported venue | UNSUPPORTED; no nearest venue |
| Synagogue with only School capability | UNKNOWN/reject; no substitution |
| Road collision without road/vehicle | UNKNOWN/reject |
| Submersion without water volume | UNSUPPORTED/UNKNOWN; reject |
| Missing/stale physical proof | Physical mutation reject |
| Missing Constraint authority | No entrapment assertion |
| Stale Accessibility dependency | INVALIDATED, never reused |
| Missing Clinical authority/catalog | No clinical fact invented |
| Presentation projection omits cue | Cue remains hidden/unavailable |
| Missing VisualBinding/family | VISUAL_UNAVAILABLE; physical state unchanged |
| Stale cross-domain ref | reject or invalidate under owning contract |
| Progression prevalidation UNKNOWN | no saga step begins |
| Saga fails after commit | PARTIALLY_COMMITTED_BLOCKED; immutable history; reviewed recovery only |
| Visual or physical domain verifies | no provenance promotion in another domain |

# V3 Authority Promotion Preflight

Base closure: `f307db22472dfd2f9aee757c94d26ddfefbf6b24` (independently reviewed PASS/CLOSED).

## Result

**HARD_STOP** — no merge, no runtime routing, no legality promotion, no visual integration.

The V3 closure is not reopened by this result. The blockers are in the promotion boundary between the closed V3 evaluator and Clean Runtime.

## Current authority path

Current School runtime is:

`createSchoolRuntime -> createAuthorityRuntime -> WorldMutationAPI -> legalityPort.evaluate -> schoolGeometryAdapter -> phase2-gateway('1.0.0') -> Phase 2 V1 geometry-gate`.

`createAuthorityRuntime` accepts an injected legality port. The public mutation API owns transaction ordering and only commits after every non-removed command receives `outcome === PASS`. FAIL and UNKNOWN reject the whole transaction. Event append occurs before the world-store commit.

V3 is currently isolated. `src/verified-architecture-phase2-v3/evaluate.js` is not routed by `src/clean-runtime/mutation/phase2-gateway.js`, whose version switch only selects V2 for `2.0.0` and otherwise V1. The School adapter explicitly calls version `1.0.0`.

## Blockers

### AP-B01 — PhysicalLegalityPort result contract is too narrow

Clean Runtime permits only `PASS | FAIL | UNKNOWN`. Closed V3 additionally emits `INVALID` for invalid/stale authority evidence. A promotion adapter must define a canonical fail-closed mapping without erasing the V3 status/reason/evidence. `INVALID` must never become PASS and must remain distinguishable in evidence/events from geometric FAIL and unsupported/ambiguous UNKNOWN.

### AP-B02 — No capability/query routing contract exists

The current gateway is a version switch, not a capability authority registry. It cannot prove which evaluator is authoritative for support, containment, opening, body/body, obstacle/world-solid, or unsupported future capabilities. Promotion requires an explicit closed routing decision per query/capability. Unsupported capability must return UNKNOWN; it must not fall back to V1/V2 and accidentally PASS.

### AP-B03 — Runtime state does not yet supply the closed V3 authority envelope

Closed V3 support/containment/opening require independent geometry/frame/BoundaryFeature authority pins, exact definitions, frames, bodies, ContactRegions, SupportRelations, and owner/solid membership evidence. The existing School adapter constructs a V1 placement request from entity/body/surface state and does not construct this V3 authority context. Promotion without a source-authenticated runtime authority envelope would either fail every V3 query or tempt a self-derived-pin bypass.

### AP-B04 — Command-to-query derivation is undefined

WorldMutationAPI invokes legality once per ordered command against the complete proposed draft, but there is no normative rule that derives the complete set of V3 proofs required by a command/transaction. A transform may require support + containment + body/world + body/body checks; attach/detach/reparent/body replacement may require a different proof set. A single selected query is insufficient. Promotion requires a deterministic proof-plan builder and fail-closed aggregation over every required proof.

### AP-B05 — Transaction-wide cross-entity proof coverage is not demonstrated

The draft is atomic, but legality is called per command. The promotion design must prove that mutations affecting multiple entities/relations cannot escape a required cross-entity V3 proof because only the command's primary entity is inspected. Required proof plans must be derived from before+proposed state and the whole transaction impact set, not from renderer state or command-local convenience fields.

### AP-B06 — Static-boundaries historical test encodes an obsolete cumulative-branch assumption

`tests/verified-architecture-phase2/static-boundaries.test.js` has two distinct invariants. The first protects Phase 2 itself from fallback/clamp/snap/runtime adapter/promotion APIs and remains valid. The second asserts that *every* file changed since Phase 1 commit `30cb23e...` is under `verified-architecture-phase2/`. That was valid when Phase 2 was the only cumulative work, but later approved Clean Runtime, authoring, numeric-frame and V3 work necessarily violate the path assertion. This is why broad has one historical failure.

Do not delete or skip it. Before promotion, replace/migrate only the obsolete repository-history assertion with scoped immutable-boundary tests: Phase 1 bytes remain immutable; V1/V2 locked files remain immutable except an explicitly reviewed promotion seam if one is required; runtime/V3 additions are independently allowlisted. Preserve the first no-fallback/no-clamp/no-snap invariant unchanged.

### AP-B07 — Existing gateway default is unsafe for promotion

`phase2-gateway.evaluate(version,...)` currently returns V1 for every version other than exactly `2.0.0`. Therefore an unknown or mistyped future version such as `3.0.0` silently routes to V1. That is acceptable only as historical code outside V3 promotion; it is a promotion blocker. The promoted gateway must reject/UNKNOWN unknown versions and must explicitly name V1, V2 and V3 routes. No default-to-V1.

### AP-B08 — V3 BODY_VS_BODY / BODY_VS_WORLD_SOLID authority completeness differs from the closed support/containment/opening contract

The closed Authority-Completeness review covered support, containment and opening. In `evaluateV3`, BODY_VS_BODY and BODY_VS_WORLD_SOLID/BODY_VS_OBSTACLE currently resolve definitions directly from `ctx.definitions` and materialize them without the same independent geometry/frame pin preflight. They must not be promoted as authoritative merely because the three closure paths passed. Either keep these queries explicitly NON_PROMOTED/UNKNOWN at the first promotion slice or run a separate authority-completeness closure for them.

## Single-authority requirement

The target runtime path must be:

`WorldMutationAPI -> one PhysicalLegalityPort -> deterministic Promotion Proof Planner -> explicit Capability Router -> V3 closed evaluator(s) -> fail-closed aggregate -> WorldMutationAPI atomic commit/reject`.

No runtime code may import V3 legality/evaluate modules except the one reviewed promotion adapter/router composition boundary. Renderer, THREE, pixels, visual bindings and scene presentation are downstream and may not participate in legality.

## Required outcome mapping

The promotion adapter must preserve the complete V3 result as evidence and map only at the port boundary:

- V3 `PASS/VALID` -> port `PASS`.
- V3 `FAIL/<definite-illegality>` -> port `FAIL`.
- V3 `UNKNOWN/*` -> port `UNKNOWN`.
- V3 `INVALID/*` -> port `UNKNOWN` or a new explicitly approved non-committing port outcome; under no design may it commit. If the existing three-outcome port remains immutable, map to `UNKNOWN` while preserving `v3Status: INVALID`, reason and evidence digest.

No other mapping is permitted.

## V1/V2/V3 coexistence lock

Promotion must use an explicit capability table, not fallback:

- V3 support -> V3 only after promotion tests pass.
- V3 containment -> V3 only after promotion tests pass.
- V3 opening -> V3 only after promotion tests pass.
- V3 body/body and world-solid/obstacle -> NON_PROMOTED until their independent authority gate closes.
- Existing locked School V1/V2 capabilities may remain authoritative only for explicitly registered legacy capabilities/scenes.
- Missing registration, unsupported representation, stale evidence, unknown version or missing authority context -> UNKNOWN/reject.

## Promotion acceptance matrix

A future implementation gate must prove all of the following before routing is enabled:

1. Exactly one runtime import/composition seam can invoke promoted V3 authority.
2. No direct physical writer is public; writer capability remains closure-private.
3. Every physical mutation produces a deterministic complete proof plan from authoritative before/proposed state.
4. Every required proof must PASS; FAIL/UNKNOWN/INVALID rejects atomically.
5. No unknown capability/version falls back to V1/V2/V3.
6. Independent pins are sourced from an authority registry/envelope outside request-carried/self-sealed refs.
7. MISSING-BOUNDARY remains INVALID/STALE before geometry and rejects runtime mutation.
8. Offset support plane remains PASS only when physically coplanar; floating/penetrating variants reject.
9. Forged containment body/target/child/frame evidence rejects before geometry.
10. Embedded/self-carried support frame pins without independent authority remain UNKNOWN/UNSUPPORTED and reject.
11. One-sided authority pin experiments remain non-PASS.
12. Compound support/containment/opening preserve canonical child identity and cannot hide illegal siblings.
13. Quantization ambiguity remains UNKNOWN and rejects; no epsilon/clamp/snap.
14. Transaction with one PASS and one non-PASS proof rejects with zero state mutation.
15. Multi-command transaction proof plan is deterministic under command input ordering and replay.
16. Event evidence preserves V3 status/reason/evidenceDigest and selected capability route.
17. Event-log failure still prevents state commit.
18. Replay reproduces exact state/event/proof-plan digests.
19. V3 promotion code imports no renderer/THREE/pixel/visual module.
20. Static-boundaries migration preserves the original safety invariant and removes only the obsolete cumulative-path assumption.

## Files expected to change in a future implementation gate

Expected new files (names may be refined without changing responsibility):

- `src/clean-runtime/mutation/v3-authority-adapter.js`
- `src/clean-runtime/mutation/physical-proof-planner.js`
- `src/clean-runtime/mutation/physical-capability-router.js`
- an authoritative V3 context/envelope registry under `src/clean-runtime/` or a domain-specific composition root
- dedicated promotion tests under `tests/clean-runtime/` and/or `tests/verified-architecture-phase2-v3/`

Expected reviewed edits:

- `src/clean-runtime/mutation/phase2-gateway.js` only if retained as the single router; its implicit default must be removed.
- School/domain composition root(s) to inject the promoted port only after the implementation gate passes.
- `tests/verified-architecture-phase2/static-boundaries.test.js`: migrate the obsolete cumulative-history assertion; preserve its no-fallback/clamp/snap invariant.

Closed V3 implementation files should not require semantic modification for promotion. If implementation discovers that they do, stop and reopen a separate V3 review rather than silently changing the closed closure.

## Decision

`HARD_STOP` for runtime promotion now.

The next safe engineering gate is **V3 Authority Promotion Foundation**: implement only the fail-closed router/adapter/proof-planner/authority-envelope contracts plus synthetic integration tests, still isolated from production/runtime composition. After that foundation independently passes, a separate routing gate may connect it to School/Clean Runtime.

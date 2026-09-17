# Candidate 5 — Normative 67-Row Acceptance Matrix

Each of the 67 locked matrix rows (locked at 6cb0291, "V3 foundation: lock
focused matrix at 67 cases") is mapped to a real behavioral regression that
executes the behavior and asserts fail-closed, result, evaluator, or commit
evidence. Historical source-token assertions are replaced by behavioral
regressions; historical names/suites are not byte-identical where behavior
moved. Machine-checkable mapping and live coverage proof:
`tests/clean-runtime/v3-candidate5-matrix-coverage.js` (exits 0 only at
67/67 covered by passing behavioral regressions, audit executed clean).

| # | Row | Behavioral regression | Evidence |
|---|---|---|---|
| 1 | ROUTE_TABLE_SHAPE | v3-authority-promotion-foundation: foundation route table is exactly 3 promoted + 3 non-promoted | result |
| 2 | ROUTE_EXACT_TUPLE | v3-authority-promotion-foundation: promoted routes require exact capability version query tuple | result |
| 3 | ROUTE_LOCKED_NON_PROMOTED | v3-authority-promotion-foundation: locked collision routes are explicit NON_PROMOTED | fail-closed |
| 4 | PLAN_PERMUTATION_CANONICAL | v3-foundation-adversarial-closure: all command permutations produce identical canonical plan bytes | result |
| 5 | IMPACT_CONTAINMENT_CLOSURE | v3-foundation-adversarial-closure: shared containment target closes impact over siblings | result |
| 6 | IMPACT_BOUNDARY_CLOSURE | v3-foundation-adversarial-closure: shared boundary closes impact over siblings | result |
| 7-12 | ROUTE_EXACT_* (6 capabilities) | v3-promotion-acceptance-matrix: route exact V3_SUPPORT / V3_CONTAINMENT / V3_OPENING / V3_BODY_VS_BODY / V3_WORLD_SOLID / V3_OBSTACLE | result, fail-closed |
| 13-18 | ROUTE_WRONG_QUERY_* | v3-promotion-acceptance-matrix: route rejects wrong query (6 capabilities) | fail-closed |
| 19 | ROUTE_TABLE_EXACT_SIX | v3-promotion-acceptance-matrix: route table exact six | result |
| 20 | ROUTE_TABLE_EXACT_PROMOTED | v3-promotion-acceptance-matrix: route table exact promoted three | result |
| 21 | ROUTE_TABLE_DIGEST | v3-promotion-acceptance-matrix: route digest sealed | result |
| 22-27 | PERMUTATION_1..6 | v3-promotion-acceptance-matrix: permutation canonical 1-6 | result |
| 28 | IMPACT_INITIATOR | v3-promotion-acceptance-matrix: impact shared target includes initiator | result |
| 29 | IMPACT_SIBLING | v3-promotion-acceptance-matrix: impact shared target includes sibling | result |
| 30 | IMPACT_TARGET_SET | v3-promotion-acceptance-matrix: impact shared target records target | result |
| 31 | IMPACT_DIRECT_CANONICAL | v3-promotion-acceptance-matrix: impact direct set canonical | result |
| 32 | IMPACT_DIGEST | v3-promotion-acceptance-matrix: impact digest sealed | result |
| 33 | PLANNER_NO_CALLER_REQUIREMENTS | v3-promotion-hostile ADV-03: caller requirements cannot create an obligation | fail-closed |
| 34 | PLANNER_CANONICAL_COMMANDS | v3-foundation-adversarial-closure: all command permutations produce identical canonical plan bytes | result |
| 35 | PLANNER_CANONICAL_TX_BINDING | v3-promotion-hostile ADV-09: envelope bound to a foreign transaction digest rejects at planning | fail-closed |
| 36 | PLANNER_TARGET_CLOSURE | v3-promotion-acceptance-matrix: impact shared target records target | result |
| 37 | PLANNER_BOUNDARY_CLOSURE | v3-promotion-acceptance-matrix: boundary closure records boundary | result |
| 38 | OBLIGATION_REQUEST_IDENTITY | v3-promotion-hostile ADV-13: obligation identity is content-bound and requestId equals obligationId | result |
| 39 | OBLIGATION_IDENTITY_CONTENT_BOUND | v3-promotion-hostile ADV-13 (obligationDigest recomputation; digest changes when the request body changes) | result |
| 40 | ENVELOPE_CONTAINMENT_PROJECTION | v3-promotion-full-path-containment-opening: FULL-PATH-CONTAINMENT envelope -> plan -> route -> context -> adapter -> aggregate PASS | evaluator, commit |
| 41 | ENVELOPE_OPENING_PROJECTION | v3-promotion-full-path-containment-opening: FULL-PATH-OPENING envelope -> plan -> route -> context -> adapter -> aggregate PASS | evaluator, commit |
| 42 | ENVELOPE_OPENING_MEMBERSHIP | v3-promotion-hostile ADV-01: missing opening membership target is rejected before READY | fail-closed |
| 43 | ENVELOPE_OPENING_BACKREF | v3-promotion-hostile ADV-10: opening backref mismatch rejects before READY | fail-closed |
| 44 | ENVELOPE_COMPOUND_CHILDREN | v3-promotion-hostile ADV-11: stale compound child digest rejects before READY | fail-closed |
| 45 | CONTEXT_FRAMES_CANONICAL | v3-promotion-full-path: FULL-PATH-SUPPORT (asserts canonical frames array in projected context) | result |
| 46 | CONTEXT_SUPPORT_RELATIONS | v3-promotion-full-path: FULL-PATH-SUPPORT (asserts projected support relations) | result |
| 47 | CONTEXT_AUTHORITY_REQUIREMENTS | v3-promotion-hostile ADV-12: context projection and adapter enforce the full authority requirement set | fail-closed, evaluator |
| 48 | AUDIT_INBOUND_ISOLATION | tests/clean-runtime/v3-promotion-authority-audit.js executed; zero findings (forbids every non-foundation inbound import) | fail-closed |
| 49 | FULL_PATH_CONTAINMENT | v3-promotion-full-path-containment-opening: FULL-PATH-CONTAINMENT | evaluator, commit |
| 50 | FULL_PATH_OPENING | v3-promotion-full-path-containment-opening: FULL-PATH-OPENING | evaluator, commit |
| 51 | FULL_PATH_SUPPORT | v3-promotion-full-path: FULL-PATH-SUPPORT | evaluator, commit |
| 52 | ADV_01 | v3-promotion-hostile ADV-01 | fail-closed |
| 53 | ADV_02 | v3-promotion-hostile ADV-02 | fail-closed |
| 54 | ADV_03 | v3-promotion-hostile ADV-03 | fail-closed |
| 55 | ADV_04 | v3-promotion-hostile ADV-04 | fail-closed |
| 56 | ADV_05 | v3-promotion-hostile ADV-05 | fail-closed |
| 57 | ADV_06 | v3-promotion-hostile ADV-06 | fail-closed |
| 58 | ADV_07 | v3-promotion-hostile ADV-07 | fail-closed |
| 59 | ADV_08 | v3-promotion-hostile ADV-08 | fail-closed |
| 60 | ADV_LOCKED_BODY | v3-promotion-hostile ADV locked V3_BODY_VS_BODY | fail-closed |
| 61 | ADV_LOCKED_WORLD | v3-promotion-hostile ADV locked V3_WORLD_SOLID | fail-closed |
| 62 | ADV_LOCKED_OBSTACLE | v3-promotion-hostile ADV locked V3_OBSTACLE | fail-closed |
| 63 | ADV_VERSION_PAD | v3-promotion-hostile ADV version "3.0.0 " | fail-closed |
| 64 | ADV_VERSION_LEADING_ZERO | v3-promotion-hostile ADV version 03.0.0 | fail-closed |
| 65 | ADV_VERSION_FUTURE | v3-promotion-hostile ADV version 4.0.0 | fail-closed |
| 66 | ADV_VERSION_NULL | v3-promotion-hostile ADV version null | fail-closed |
| 67 | ADV_VERSION_UNDEFINED | v3-promotion-hostile ADV version undefined | fail-closed |

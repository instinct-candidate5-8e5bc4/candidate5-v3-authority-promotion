# V3 Authority Routing Gate — Acceptance Matrix

Maps the 20 promotion acceptance items from `authority-promotion-preflight.md`
to executable evidence. "Inherited" rows are proved by the Foundation suite at
the frozen baseline, which this gate reruns unchanged as mandatory regression
gates (focused twice, broad, static boundaries, isolation audit, detached
determinism).

| # | Item | Evidence |
|---|---|---|
| 1 | Exactly one runtime composition seam invokes promoted V3 authority | audit 1.3.0: `routingConnected=true`, allowlisted edges exact, `FORBIDDEN_INBOUND_FOUNDATION_IMPORT` empty; static-boundaries routing-edge test |
| 2 | No direct physical writer is public | ROUTED-WRITER-PRIVACY; inherited authority.test.js |
| 3 | Deterministic complete proof plan from authoritative before/proposed state | ROUTED-FULL-PATH (independent recomputation equality), ROUTED-DETERMINISM, detached determinism harness identical SHA-256 |
| 4 | Every required proof must PASS; FAIL/UNKNOWN/INVALID rejects atomically | ROUTED-FAIL-FLOATING, ROUTED-FAIL-PENETRATING, ROUTED-UNKNOWN-NON-PROMOTED, ROUTED-INCOMPLETE-AUTHORITY, ROUTED-ATOMIC-MIXED; inherited hostile INVALID matrix |
| 5 | No unknown capability/version falls back to V1/V2/V3 | ROUTED-UNKNOWN-NON-PROMOTED (NON_PROMOTED_CAPABILITY, zero evaluator calls); inherited route/version hostile rows 13-18, 63-67; audit `gatewayRouted=false` |
| 6 | Independent pins sourced from authority registry, never request-carried | ROUTED-REGISTRY-INDEPENDENCE; inherited ADV-12 and pin regressions |
| 7 | MISSING-BOUNDARY stays INVALID/STALE before geometry and rejects runtime mutation | ROUTED-STALE-REGISTRY (unpinned boundary record rejects whole transaction pre-geometry), ROUTED-INCOMPLETE-AUTHORITY (zero evaluator calls); inherited real-chain MISSING-BOUNDARY |
| 8 | Offset support plane PASS only when physically coplanar | ROUTED-FULL-PATH (coplanar PASS), ROUTED-FAIL-FLOATING, ROUTED-FAIL-PENETRATING; inherited closure-support-offset-plane |
| 9 | Forged containment body/target/child/frame evidence rejects before geometry | Inherited hostile ADV-01/10/11 and forgery matrices rerun unchanged; routing-level global closure proof ROUTED-STALE-REGISTRY |
| 10 | Self-carried support frame pins without independent authority stay UNKNOWN | Inherited embedded-pin adversary; routing-level pin drop ROUTED-INCOMPLETE-AUTHORITY |
| 11 | One-sided authority pin experiments remain non-PASS | Inherited pin-tamper regressions rerun unchanged |
| 12 | Compound canonical child identity, no hidden illegal siblings | Inherited compound regressions (REG-V3-SUPPORT/CONTAINMENT-COMPOUND) rerun unchanged |
| 13 | Quantization ambiguity stays UNKNOWN; no epsilon/clamp/snap | Inherited ambiguity regressions; audit FORBIDDEN_TOKEN scan extended to routing modules |
| 14 | One PASS + one non-PASS proof rejects with zero state mutation | ROUTED-ATOMIC-MIXED (revision and state digest unchanged, no commit event) |
| 15 | Multi-command plan deterministic under input ordering and replay | ROUTED-MULTI-COMMAND (single transaction-scoped proof, distinct obligations), ROUTED-DETERMINISM; inherited permutation closure |
| 16 | Event evidence preserves V3 status/reason/evidenceDigest and selected route | ROUTED-FULL-PATH asserts all fields on the commit event; rejection events carry the full legality result (ROUTED-FAIL-FLOATING) |
| 17 | Event-log failure prevents state commit | ROUTED-EVENT-LOG-FAILURE |
| 18 | Replay reproduces exact state/event/proof-plan digests | ROUTED-REPLAY, ROUTED-REPLAY-TAMPER (tampered proof evidence breaks replay) |
| 19 | Promotion code imports no renderer/THREE/pixel/visual module | audit import graph scan + FORBIDDEN_TOKEN over routing modules; `renderer_three_imports_in_v3=0` |
| 20 | Static-boundaries migration preserves the original safety invariant | static-boundaries 4/4: no-fallback/clamp/snap invariant unchanged, Phase 1 and V1/V2/V3 byte-locks unchanged, routing edges exact |

Gate rules from the owner-approved phase scope map to evidence as follows:
rules 1-3 (frozen baseline, main untouched, isolated branch) -> CI review
metadata (diff vs 127f284, remote-tip equality, candidate5 tip still 127f284,
upstream main control pinned at 4e06f74); rule 4 (inherited gates) -> focused
x2, broad, static, audit, closure determinism all rerun on this branch; rules
5-7 -> the contract and tests above; rule 8 -> not triggered; rule 9 -> this
branch is delivered for independent review and is not merged.

# Transformer Qualification + Static/Migration Inventory Decision Report

## Gate result: PASS WITH DECISION WARNING

The qualification and inventory gate itself passed: all 67 parse units (37 inline/external script slots after excluding import maps and 30 NextGen files) were parsed with zero parse failures; the same source/tool/config produced byte-identical inventories and manifests across two runs; seven semantic-equivalence fixtures passed; original runtime files remained unchanged.

This is not approval or proof of a full transformer. The static classifier produces conservative physical-write candidates. `INSTRUMENTABLE` means the AST shape has a qualification candidate, not that every surrounding semantic context has passed a rewrite. Ambiguous sites and all unsafe contexts still block complete observation until rule-specific qualification. No simulator source was transformed or run.

## Exact AST counts

| Metric | Count |
|---|---:|
| Classified AST sites | 344 |
| Authoritative physical-write candidates | 336 |
| Direct scalar writes | 62 |
| Transform mutator calls | 99 |
| Scene membership/reparent candidates | 129 |
| Geometry mutation paths | 12 |
| Persistence/recovery/replay/debug-related physical candidates | 59 |
| Computed/dynamic writes | 6 |
| Automatically instrumentable candidates | 241 |
| Ambiguous candidates | 99 |
| Statically uninstrumentable after implemented checks | 0 |
| Library-only sites in scanned simulator source | 0 |
| Diagnostic/derived-recomputation sites | 8 |

`Uninstrumentable=0` does not mean all 336 are safe. The qualification tool did not implement a full transformer/context proof. Ninety-nine are already ambiguous; unsafe fixture classes deterministically return UNINSTRUMENTABLE. External Three.js library internals were deliberately not scanned, hence library-only=0 within the simulator-source inventory.

## Mutation dispersion

- 9 simulator files contain candidates.
- 80 enclosing functions/top-level units contain them.
- 80 independent enclosing mutation entry points.
- 336 candidates sit outside a central authoritative mutation boundary.
- 336 can potentially bypass the Geometry Gate because the recovered runtime has no central Gate connection.
- 59 are statically associated with legacy/debug/recovery/persistence/query contexts.
- 277 are outside those contexts and classified runtime-essential candidates.

These are counts, not a risk score.

## L-01..L-17

The complete machine-readable mapping is in `decision-evidence.json`, with source paths/ranges, source-range hashes, node operation, enclosing function, instrumentability and trigger/migration classification. Zero direct regex-matched candidates for L-02, L-04, L-14 and L-16 does not mean those paths are absent or safe. It means the candidate operation's narrow source range did not itself contain the legacy label. Those rows remain NOT_OBSERVED/UNKNOWN and require call-graph/alias linkage; they do not count as covered.

## Qualification fixture result

7/7 pass:

- simple assignment receiver/key/value exactly once and in order;
- setter once without an extra getter;
- compound getter/setter/RHS/receiver/key exactly once and ordered;
- postfix/prefix result preservation;
- mutator `this`, args, single call and result;
- thrown exception identity;
- deterministic rejection of super/private/yield/unsafe-await/optional-assignment/destructuring-setter contexts.

These fixtures qualify lowering primitives only. They do not establish A/B simulator equivalence.

## Authoritative Mutation API migration design

`WorldMutationAPI.request(command, exactIdentity, priorStateDigest)`
-> validate exact identity/revision/source and current state
-> Geometry Gate evaluates the proposed physical change
-> on PASS only, apply one immutable authoritative world transition
-> emit deterministic event with prior/new state digests
-> update canonical world state.

There is no alternate physical write path, name/pixel/family fallback, visual authority or readiness promotion.

Migration classes:

- membership/reparent -> `WorldMutationAPI.changeMembership`;
- local transform -> `requestTransform` with exact object and geometry revision;
- geometry change -> `replaceGeometry`/`reviseGeometry`, invalidating proof;
- physical visibility/participation -> explicit physical-state transition;
- persistence/replay -> commands revalidated against exact prior state, never raw object writes;
- diagnostic render/camera/material effects remain outside physical API unless explicitly reclassified.

## Reuse map

- REUSE_AS_IS: Phase 1 contracts/registries; Phase 2 Geometry Gate.
- REUSE_WITH_ADAPTER: Surface Models; environment catalog; posture definitions; event system; scenario/case data.
- REIMPLEMENT: NPC physical mutation logic; multi-casualty physical application; persistence/recovery physical restoration.
- LEGACY_ONLY: direct placement/surface-map paths.
- UNKNOWN: assets and visual-to-physical bindings.

Each transfer still needs exact component evidence. Reuse classification does not upgrade provenance.

## Minimum clean-runtime vertical slice, design only

One Web-first school scene for desktop, iPhone browser and Android browser:

- canonical Scene/World state;
- existing explicit school floor/support/door/wall/obstacle Surface Model;
- casualty, bag/equipment, one support object;
- one NPC only if its mutation through the central API is justified;
- WorldMutationAPI and unchanged Geometry Gate;
- deterministic state/event evidence;
- legal positive placement and rejections for floating, door/opening, wall/obstacle penetration and outside legal surface.

Physical truth is Geometry + Surface + World State. Visual representation is a separate consumer and has no placement authority. No visual improvement or photorealism work belongs in the slice.

## Path A vs Path B

### Path A: Legacy continuation

- Surface discovered: 336 candidate physical writes across 9 files and 80 functions; 99 ambiguous AST sites; 62 direct scalar writes.
- Preserves current runtime and all Phase 1/2 work.
- Requires: full rule qualification, transformed-copy determinism, A/B/C differential, resolution of prior OBSERVER_DIVERGENCE, checkpoint reconciliation, L-01..L-17 observation, binding and replay.
- Production risk is lower during test-copy instrumentation but remains high at eventual enforcement because mutation ownership is dispersed.
- Observability is difficult: transformed copy is not exact production bytes; direct and dynamic aliases can remain UNKNOWN.
- Web/mobile performance remains UNKNOWN; instrumentation/streaming are extra overhead.

### Path B: Clean physical runtime

- Initial implementation can be constrained to one scene and one central mutation API rather than migrating 336 dispersed sites at once.
- Preserves Phase 1, Phase 2, Geometry Gate, Surface evidence and transferable catalog/case/posture/event data after adapters and validation.
- Makes long-term AST observation of legacy paths unnecessary for the new physical core, though legacy migration inventory remains needed for parity and decommissioning.
- Production risk is a new-runtime/migration program, not a patch: behavior parity, assets, visuals and integration remain UNKNOWN.
- Testability/observability are structurally stronger because mutation events originate at the authoritative API.
- Deterministic replay is native rather than retrofitted.
- Web/mobile performance budgets can be designed from the first vertical slice, but must be measured.

## Engineering recommendation

Choose PATH B for the next design phase: a clean, Web-first physical runtime vertical slice with a central WorldMutationAPI, reusing locked Phase 1/2 and healthy data through explicit adapters. Do not authorize full legacy AST instrumentation as the primary architecture.

Why: the inventory found 336 physical-write candidates dispersed across 80 functions, with 99 already ambiguous and 62 direct scalar writes. Prior observation attempts also produced two independent failures, including observer divergence. AST instrumentation remains valuable as a migration/audit tool, but using it as the foundation for authoritative physical truth would preserve the dispersed write architecture and transformed-copy fidelity burden.

This recommendation is based on present counts and proof obligations, not sunk cost. PATH B still needs its own Preflight, no production cutover, no visual rewrite, and explicit migration/rollback gates.

## Risks and UNKNOWNs

- Candidate classification can over-include visual scene additions; exact physical role still needs semantic review.
- L-02/L-04/L-14/L-16 need call-graph/alias linkage because narrow source ranges had no direct label match.
- No simulator transformation or A/B/C differential has occurred.
- Dynamic/reflection/proxy/library-internal writes can remain UNKNOWN.
- Clean-runtime behavior parity, asset binding, visual integration and performance are UNKNOWN.
- Phase 3 capture/replay remains unopened; L-01..L-17 remain NOT_OBSERVED.

## Production exclusion and locks

No transformed simulator artifact exists. No observer/touchpoint is present in production runtime. `index.html` remains exact SHA-256 `e1955f80...`. Phase 1/2 and all earlier gate outcomes remain unchanged.

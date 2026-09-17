# V3 Authority Routing Gate — Contract

Base: frozen immutable Foundation baseline `127f284d78b83f358f076b3ee8f8b56044bcc691`.
Branch: `candidate5-authority-routing-gate`. `main` and the `candidate5` Foundation
branch are unchanged. No Foundation module semantics are modified.

## Controlled production path proved by this gate

`WorldMutationAPI -> one PhysicalLegalityPort -> deterministic Promotion Proof
Planner -> explicit Physical Capability Router -> certified V3 authority/evaluator
path -> fail-closed aggregate -> atomic authoritative commit/reject ->
deterministic event/replay chain`

Every link runs on real production modules:

- `src/clean-runtime/mutation/world-mutation-api.js` (Clean Runtime host) now
  passes the sealed transaction to the single legality port, consults the port
  at least once per transaction (a removal-only transaction cannot slip past
  the port), and embeds the transaction-scoped physical proof payload in the
  commit event. The rejection event already carries the full legality result.
- `src/clean-runtime/v3-routing/promoted-legality-port.js` (new) is the single
  promoted PhysicalLegalityPort. It derives the exact candidate committed world
  deterministically (same pure `world()` construction the runtime commits),
  binds `transactionDigest + beforeStateDigest + candidateStateDigest`, and
  evaluates once per transaction through the certified Foundation
  `evaluateTransaction`. The decision is recomputation-checked against the
  planner/envelope digests before any PASS is returned. Every structural or
  authority failure returns `UNKNOWN`. No evaluator, router, planner, or
  registry selection surface exists; the authority registrySnapshot source is
  injected at composition time and never read from the request.
- `src/clean-runtime/v3-routing/promoted-authority-runtime.js` (new) is the
  only composition seam. It injects exactly one promoted port into the
  unchanged `createAuthorityRuntime`. School, renderer, and visual composition
  roots are not connected by this gate.
- The six certified Foundation modules are byte-identical to the frozen
  baseline (blob SHAs pinned in
  `tests/clean-runtime/foundation-allowed-paths.json`).

## Promotion scope lock

Route table is unchanged: PROMOTED `V3_SUPPORT`, `V3_CONTAINMENT`,
`V3_OPENING`; NON_PROMOTED `V3_BODY_VS_BODY`, `V3_WORLD_SOLID`, `V3_OBSTACLE`.
No wildcard routing, no default-to-V1, no fallback, no clamp/snap, no
caller-selected evaluator, no request-carried authority as source of truth, no
bypass around PhysicalLegalityPort. Unknown capability/version/query and
NON_PROMOTED capabilities return UNKNOWN and reject the transaction
atomically.

## Event/replay chain

The commit event carries the sealed `physicalProof` payload (decision, plan,
route table, envelope, authority snapshot reference, and per-obligation
outcome/V3 status/reason/evidence digests). Replay verifies the event chain
digests, so proof evidence is tamper-evident end to end. A latent Clean
Runtime gap was repaired in this gate: `stateDelta` now carries
`supportRelations`, which replay already consumed; without it, worlds with
authoritative support relations could not replay. Legacy event/state behavior
is otherwise byte-identical (inherited determinism and replay suites pass
unchanged).

## Audit evolution (designed at the Foundation)

`tests/clean-runtime/foundation-allowed-paths.json` declared inbound imports
"forbidden until Authority Routing Gate". This gate performs exactly that
designed evolution: the manifest now pins the two routing modules by blob SHA
and allowlists the exact importer -> foundation-module edges. The audit
(schema 1.3.0) still fails on any other inbound import, any School/renderer
connection, any gateway routing, any adapter import outside the Foundation,
any extra evaluateV3 call site, and any unapproved file in the foundation or
routing sets; it additionally fails if the allowlisted seam disappears.

## Hard stop

No discovery required modifying certified Foundation semantics at 127f284, so
FOUNDATION_REOPEN_REQUIRED was not triggered.

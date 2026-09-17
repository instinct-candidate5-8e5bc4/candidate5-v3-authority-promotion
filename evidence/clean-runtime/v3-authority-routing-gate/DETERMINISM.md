# Authority Routing Gate detached determinism evidence

- `routing-determinism-run-1.json` and `routing-determinism-run-2.json` are
  byte-identical outputs of two detached harness processes
  (`node tests/clean-runtime/v3-routing-determinism.js`). File SHA-256:
  `a4ce5b6bca9bacf1364eb281c17416a4e590b36f8fbdbdea950db2776e286c30`.
- `evidenceDigest` inside the JSON (`42c42cdf24a521e2dbc319273342f030044127f7b6126d869c01c27507691ad7`)
  is an internal field computed over the canonical run record
  (schemaVersion/inProcessRuns/inProcessIdentical/run). It is not the SHA-256
  of any file.
- The harness drives the real promoted production path: WorldMutationAPI ->
  promoted PhysicalLegalityPort -> Promotion Proof Planner -> Physical
  Capability Router -> certified V3 evaluator -> fail-closed aggregate ->
  atomic commit -> event chain -> replay, three times per process.

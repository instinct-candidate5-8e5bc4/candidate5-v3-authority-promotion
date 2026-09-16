# School Geometry Adapter Gate

## Binding path

`WorldMutationAPI -> PhysicalLegalityPort -> SchoolGeometryAdapter -> Phase 2 Geometry Gate` is the only placement-decision path. The adapter has the only clean-runtime import of `verified-architecture-phase2/geometry-gate`. It converts immutable clean-runtime fields into the existing Phase 2 request. It contains no floor, contact, containment, collision, tolerance, correction or visual rules.

The current/proposed state stays immutable. `SetTransform` first builds the candidate entity. The adapter resolves the exact bag body and School Surface Model proof, converts ED-P2-02 integer microunits to authored units, calls Phase 2 once and returns its result. WorldMutationAPI commits only PASS. FAIL and UNKNOWN produce deterministic rejection events without state change.

## Locked physical provenance

- School authored physical source: `index.html`, SHA-256 `e1955f80d07ae2660b48fc2fce6cca68da30e9de4848e691e4fa3fa052191618`, source classification and lineage `RECOVERED`, exact bytes locked at Recovery Baseline/Phase 2.
- School Surface Model: `school-surface-v1`, revision 1, digest `308951f841bd9be7a56d5d14ee1852c0cffe66b30d29d6a34f7a7da6bb0555cf`, classification/lineage `RECOVERED`. Each resolved surface preserves its own authored-source provenance.
- Medical bag body: authored box `.55 x .35 x .35` from source-range `school-bag-lockers`, range SHA-256 `21ba7567961cbb9c022ab8a1f11359bf07049c506519a7656394cfc48fcc11ea`. Half bounds `[-.275,.275] x [-.175,.175] x [-.175,.175]`, geometry digest `f3630d860bbd1900c026aa392632cf73097273c4b7894745d92ac31bf75f2c5a`, revision 1, classification/lineage `RECOVERED`.
- Panorama and visible bag image are not physical sources. Their geometry binding remains `UNKNOWN`; no visual input enters the request.

## Failure mapping

WorldMutationAPI keeps its closed canonical rejection contract (`TRANSACTION_REJECTED`, cause `GEOMETRY_PROOF_FAILED` or `UNKNOWN`). The nested legality evidence preserves the exact Phase 2 `reasonCode`, full Phase 2 evidence and proof digest. The adapter does not reinterpret Phase 2 FAIL or change the proposal.

Casualty and support-object bodies are not included. This gate has no sufficiently locked body proof for them and invents none.

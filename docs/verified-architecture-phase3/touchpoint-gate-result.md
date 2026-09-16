# Integration Touchpoint Gate: FAIL / HARD STOP

The approved single preload touchpoint was tried in the isolated copy. The observer preserved source bytes outside the one approved `index.html` insertion, and wrapper unit tests passed. The real observer ON run did not remain responsive: CDP state extraction timed out twice, once with a 10-second limit and again with 45 seconds.

Under the locked no-sampling/no-dropped-events requirement, wrappers captured full before/after object matrices, child lists and geometry metadata on high-frequency update/render paths into an unbounded in-memory event list. This is a material behavior/performance failure, not a result to waive. OFF/ON state equivalence, boot coverage, production exclusion and complete performance distributions therefore were not proven.

The gate stopped before full capture/replay and before static reconciliation. No workaround, sampling, precision reduction or extra runtime change was attempted. The trial touchpoint was rolled back. `index.html` is restored to SHA-256 `e1955f80d07ae2660b48fc2fce6cca68da30e9de4848e691e4fa3fa052191618`, the exact locked Phase 2 byte.

A future proposal would need a separately approved bounded evidence architecture. Because sampling/dropping is prohibited, the likely safe design is lossless streaming to a backpressured external sink plus a narrower contract-approved mutation boundary. That is a scope decision and was not implemented.

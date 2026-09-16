# Clean Runtime Contract and Authority Skeleton

This gate contains no school, Geometry Gate adapter, Three.js, visuals, assets, NPC, persistence migration, legacy or production integration.

`createAuthorityRuntime` is the composition root. It creates an internal WorldStore writer capability and exposes only:

- `worldMutationAPI.proposeMutation(command)`
- `worldMutationAPI.proposeTransaction(transaction)`
- `worldMutationAPI.getWorldState()`
- `worldMutationAPI.getEventLog()`
- `worldStore.getState()`

The reducer/commit capability is held in closure and not in the public store or package index. PhysicalLegalityPort is `TEST_DOUBLE_ONLY`; PASS can commit, FAIL and UNKNOWN reject atomically. WorldMutationAPI contains no floor/wall/door/contact/containment rules and imports no Phase 2 implementation in this gate.

Every state/entity/nested structure is deeply frozen. Canonical serialization sorts object/map keys. Decision bytes contain no time, random UUID or process data. Committed and rejected events form a digest chain. Event append must succeed before state commit. Replay verifies event and state digests.

The one math representation is adapter-compatible ED-P2-02 microunits; this skeleton performs no physical math.

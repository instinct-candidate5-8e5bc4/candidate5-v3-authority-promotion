# Multi-Support Clean Runtime V2

World schema 2.0 uses one authoritative canonical `supportRelations[]`, sorted by stable `relationId`. Entities carry no serialized relation copy. The dependency index is derived and verifiable, never mutable truth. Relations bind exact supported body/contact region, STATIC_WORLD or ENTITY_OWNED target lineage, candidate-world revision, descriptive role, REQUIRED semantics and proof/materialization data.

Relation-addressed Attach/Replace/Detach mutate only the addressed relation. Missing/duplicate IDs fail. Every transaction constructs one candidate, validates all dependency lineage, maps every relation for each affected supported entity one-to-one into one Phase 2 V2 contacts array, receives one final legality decision, then commits one immutable state/event. Failure leaves authoritative state unchanged. Owner/body/posture changes invalidate stale relations; there is no auto-drop/move/detach/snap/clamp.

Migration is explicit and one-way from state schema 1 to 2. A caller must supply a deterministic converter because legacy singular records lack V2 contact-region/proof details. Ambiguous or mixed V1/V2 states reject. Historical events/evidence and Gate C definitions are not rewritten.

The new gateway is the sole clean-runtime require/call boundary for Phase 2 V1/V2. The School adapter selects V1 through that gateway; the Multi-Support port selects V2. This preserves one authority boundary rather than making the port a second geometry authority.

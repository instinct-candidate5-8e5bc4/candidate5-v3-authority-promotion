# Gate D HARD STOP - current dependency schema is singular

## Finding

The current clean runtime fundamentally represents only one support relationship per entity:

- `WorldEntity.supportRelation` is a single object or null.
- `AttachSupport` overwrites `entity.supportRelation`.
- `DetachSupport` nulls the single field and removes every indexed relation for that entity.
- `validateSupportDependencies` requires the entity's single `supportRelation` to equal one indexed relation. With two `physicalRelations` for one entity, at most one can equal the singular field, so validation rejects.
- `schoolGeometryAdapter` resolves one `entity.supportRelation.surfaceModelRef` or one owner entity/surface. Phase 2 accepts one surface/contact request per evaluation.

Therefore the schema cannot represent future simultaneous floor + chair support, seated-on-floor + wall leaning, or other explicit multi-contact postures. Gate D section 7 requires a HARD STOP and forbids a workaround.

## Minimal forward-compatible extension proposal (not implemented)

1. Introduce `supportRelations: SupportRelation[]` on WorldEntity, canonically ordered by stable `relationId`; migrate legacy `supportRelation` only through an explicit schema-version adapter, never implicit runtime fallback.
2. Give each relation exact `relationId`, semantic/contact role, owner entity revision, owner body ref, support-surface ref and candidate-world revision. A floor relation binds the exact static SurfaceModel/surface rather than using a string.
3. Change commands to `AttachSupportRelation`, `ReplaceSupportRelation`, and `DetachSupportRelation`, all addressed by exact relation ID. Do not let attach overwrite unrelated relations.
4. Validate the entity array and world relation index as the same canonical relation set. Reject duplicates, missing counterparts, stale refs and partial sets.
5. Extend the PhysicalLegalityPort request contract to evaluate an ordered set of contact/support requests for one entity against one candidate world. Phase 2 currently evaluates one surface; this extension therefore needs a separately approved Phase 2 multi-contact contract revision or a new aggregate port contract above Phase 2 with proof that every required contact is checked. Gate D explicitly forbids implementing that now.
6. Preserve atomic multi-entity transactions, deterministic failure ordering, one geometry authority, event/replay determinism and no auto-drop/detach.
7. Keep posture semantics and future ClinicalPresentation separate from collision geometry and support evidence.

## Semantic debt carried forward

The approved Gate C VERIFIED_FOR_SLICE envelopes contain historical `NOT_REVIEWED_FOR_SLICE`. Per the user's lock, it is compatibility residue and is not silently mutated. A future envelope schema revision should replace state-dependent prose limitations with stable capability limitations plus explicit lifecycle state, preserving old envelope history.

No ScenePackage V2, posture, clinical, visual, legacy/production, Phase 1 or Phase 2 code was created or changed.

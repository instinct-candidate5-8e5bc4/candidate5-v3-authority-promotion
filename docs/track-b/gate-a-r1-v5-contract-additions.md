# Gate A R1 v5 - Contract Additions Resolving the Engine's R1 v4 Verdict

Status: PROPOSAL, pre-admission. Nothing in this package is admitted, certified
or signed. The formal R1 review signs exact bytes; this document identifies them.

Supersedes: R1 v4 (commits 7948b81, fea8c7c, 1101695). The engine's v4 verdict
(required all three fixes before resubmission) is resolved point by point below.
v4 content (ENTITY/SUPPORT_VOLUME admission types, six central records validated
at load, v2.1.0 scene branch, throwaway instantiate proof) is unchanged unless
explicitly listed here.

Evidence harness: `node scripts/track-b/gate-a-r1v5-contract-check.mjs` (31 checks,
all through the real repo contracts). Test suite: `tests/track-b/gate-a-r1v5-contracts.test.js`.

## Fix 1 - binding staleness bound to owner/body/volume revisions, not a frozen world revision

Engine finding: OWNER_BODY_BINDING.boundWorldRevision hard-coded to 1 made the
runtime reject every subsequent transaction (STALE_OWNER_BODY at revision 2;
the engine executed the repro).

v5: `owner-body-binding.js` drops boundWorldRevision entirely. Staleness is
carried by the pins that actually identify the bodies: recoveredBodyRef
(revision+digest, revalidated against the live owner entity physicalBodyRef on
every transaction) and ownerBodyRef (revision+digest against the relation), and
- new in v5 - the supportVolumeRef pin on the unit relation against the owner
entity's supportVolume state (STALE_SUPPORT_VOLUME in validateRelations).
`relations.js` drops the binding's world-revision term from the ownerBodyOk
fallback. Proofs: C2e, C3c (same binding validates at world revision 2), and
C8a - the engine's exact repro (SetTransform unit unchanged + all 4 relations
rebound to revision 2) COMMITS. Negatives: C8b replaced bag body ->
STALE_OWNER_BODY on the unit relation; C8c owner revision bump without relation
update -> STALE_OWNER_REVISION; C8d forged volume digest -> STALE_SUPPORT_VOLUME.

## Fix 2 - SUPPORT_VOLUME pinned, materialized and containment-checked in the authoritative legality path

Engine finding: v4 validated the volume only in tests; the adapter never called
materializeSupportVolume; no full-3D contained-volume test; no unit-vs-bag
collision/intersection check or narrowly scoped pair supersession.

v5: the unit relation carries supportVolumeRef (id/revision/digest of the
validated containment volume); the bag entity physicalState carries the
supportVolume pins; validateScenePackage requires both (C4g, C4h). The
adapter's isTrainingUnit branch now, inside the authoritative legality path:
(1) requires the relation's volume pin to match the validated volume
(STALE_VOLUME), (2) requires the owner entity state to carry the same volume
(STALE_VOLUME_OWNER_STATE), (3) scopes the pair supersession to exactly
relation synthetic:unit:bag-interior-floor + the validated owner-body binding
(PAIR_SUPERSESSION_SCOPE otherwise), (4) materializes the volume and recomputes
full-3D containment of the unit world AABB inside the volume world region
(CONTAINMENT_VIOLATION otherwise: X/Z strictly inside, bottom resting on the
volume floor allowed, top strictly below). On PASS the adapter evidence carries
containmentProof (materialization digest, both AABBs, pairSupersession record
stating that containment supersedes unit-vs-bag body overlap for exactly this
relation+binding pair; every other body overlap remains a collision).
Negatives: C8e protrusion (unit X+0.2m) -> CONTAINMENT_VIOLATION; C8f a foreign
item claiming the same containment -> PAIR_SUPERSESSION_SCOPE.

## Fix 3 - scene validator re-digests and re-validates the binding record bytes

Engine finding: the v4 validator compared only the canonicalDigest string and
instantiate seeded the module constant, not the package record - a forgery
keeping the stale digest validated (the engine supplied the hostile repro:
provenanceRefs=['FORGED'] + stale digest + redigested package).

v5: validateScenePackage (v2.1.0 branch) (a) recomputes the digest over the
package record's bytes and requires it to equal the stored canonicalDigest
(OWNER_BODY_BINDING_BYTES_MISMATCH - the engine's hostile repro dies here, C4i,
plus missing-field forgery C4j), (b) re-runs validateOwnerBodyBinding on the
package record against the live recovered/owner records
(OWNER_BODY_BINDING_INVALID:<code> - a sophisticated forge that redigests the
tampered record dies here, C4k), (c) requires equality with the reviewed module
anchor digest (OWNER_BODY_BINDING_MISMATCH). instantiate seeds the runtime with
the PACKAGE's validated binding record (v.ownerBodyBindings), not the module
constant. Certified v2.0.0 path byte-unchanged (C4a); v2.1.0 throwaway
instantiate still COMMITS 4/4 with replay digest match (C5).

## Signed semantic provenance

R1-Q1 (evidence/track-b/r1-q1-semantic-authorization.json,
wamid.HBgMOTcyNTMyNDkwMzUxFQIAEhgUM0EwRTNFRDUxRDZDQzAwNEU2NjcA) authorizes the
semantic MEANING (certified hollow interior + valid internal support floor for
this specifically certified configuration) under its 9 strict-scope bullets.
It does not admit these bytes; v5 makes the bytes admissible and reviewable.
Admission is always the formal review's call.

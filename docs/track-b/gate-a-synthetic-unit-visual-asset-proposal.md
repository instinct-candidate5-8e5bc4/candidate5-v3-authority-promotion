# Gate A Proposal: Synthetic Training Unit - Authoring + Certified Support Path

Status: PROPOSED (R1 v3). Nothing here is admitted. Owner decision authorizing
the certification work: Option A (full Gate A certification of this ONE
synthetic unit, minimal scope), WhatsApp 2026-09-30. The owner authorized the
work, not draft dimensions or semantics - every number below is proven by the
accompanying harness (scripts/track-b/gate-a-unit-proposal-check.mjs, 26/26
checks, Part B executes the REAL Gate A validators), none asserted.

R1 v3 changes after engine review + owner R1-Q1:
- NEW section 3a: the narrowly scoped bag owner definition package the engine
  required (validateSupportSurface/materializeSupportSurface need an authored
  owner entity id/revision/digest; the recovered bag had none). Drafted and
  executed through the REAL validators with byte-level results and negative
  proofs. The harness caught and fixed one of my own record errors (bag
  footprint/contact Z span mis-copied as +/-275000; the bag's Z span is
  +/-175000 - the real body validator rejected it, INVALID_FOOTPRINT).
- R1-Q1 SIGNED by the owner 2026-09-30 01:29 +03: narrow semantic
  authorization, recorded with its own evidence/identity at
  evidence/track-b/r1-q1-semantic-authorization.json (provenance: WhatsApp
  wamid.HBgMOTcyNTMyNDkwMzUxFQIAEhgUM0EwRTNFRDUxRDZDQzAwNEU2NjcA). His
  strict scope is binding and is quoted in section 3b.
- CONSUMED lifecycle + commit seam are R2 scope (engine ruling), marked as
  such - not part of R1 admission.
- Hardening spelled out: stale owner/body/volume rejection codes (section 7)
  and the pair-collision supersession predicate scoped ONLY to the exact
  admitted unit+bag+validated relation (section 5).

R1 v2 corrections (kept): interior recomputed wholly inside the certified bag
body (v1's top extended 125mm outside); two-layer design replaces the false
"CONTAINMENT through Phase 2" claim; solid-bag collision conflict resolved
explicitly.

## 1. Identity binding (proposed)

| Layer | Proposed id | Notes |
|---|---|---|
| Engine inventory identity | `unit-1` / `SYNTHETIC_ITEM_A` (existing V2) | unchanged, engine-owned |
| World entity | `synthetic-training-unit-1` | entityTypeId `synthetic/training-unit` |
| Physical body record | `synthetic-training-unit-body-v1` revision 1 | section 2 |
| Bag owner body definition | `school/medical-bag-owner-body` revision 1 | section 3a |
| Bag owner entity definition | `school/medical-bag-entity` revision 1 | section 3a |
| Interior support floor (layer 1) | `school/medical-bag-interior-floor` revision 1 | entity-owned SUPPORT_SURFACE, chair-seat pattern |
| Containment volume (layer 2) | `school/medical-bag-interior-volume-v1` revision 1 | new authored record, section 4 |
| Renderer map entry (B-W5) | `synthetic-training-unit-v1` | SYNTHETIC_TRAINING, zero clinical fields |

## 2. Authored physical body (draft; EXECUTED through the real validator: PASS B6)

- bodyDefinitionId synthetic-training-unit-body-v1, revision 1, AUTHORED_NEW.
- One component: AABB, BOTH, dims [200000, 120000, 80000] microunits, local
  translation [0, 60000, 0], identity orientation.
- Validator-derived aggregate: X [-100000,+100000], Y [0,+120000], Z [-40000,+40000].
- Footprint XZ_RECT_UNION: X [-100000,+100000], Z [-40000,+40000].
- Contact region HORIZONTAL_XZ_RECT, planeY 0, same rect (bottom face).
- supportCategories: EXACTLY ONE - { bag-interior-floor, SUPPORT_SURFACE,
  AUTHORED_NEW, fixtureOnly false }. The closed semantic set is NOT extended
  for the body record; containment is carried by the relation layer
  (section 7). No FLOOR category: minimal scope.
- authoringProvenance.decisionId: gate-a-unit-authoring-001.
- Harness result: validateBody -> VALIDATED (B6). Draft is validator-lawful
  today; admission is the review's decision, not the validator's.

## 3. The two-layer lawful check (chosen path, and why)

- (i) New Phase 2 capability (CONTAINMENT surface type): REJECTED - reopens
  the certified gate byte surface, demands a full Phase 2 capability review.
- (ii) CHOSEN - two layers, Phase 2 untouched:
  - Layer 1 (existing gate, existing semantics): the bag's interior floor
    authored as an entity-owned SUPPORT_SURFACE on the chair-seat pattern:
    localPlane normal [0,1000000,0], offset -150000; localRegion
    X [-250000,+250000], Z [-150000,+150000]; FULL_FOOTPRINT;
    transformBinding OWNER_TRANSLATION_IDENTITY_ORIENTATION;
    ownerDefinitionRef = the section-3a bag owner entity (exact
    id/revision/digest). The unit's support legality is evaluated by the
    EXISTING Phase 2 gate as a real horizontal support surface.
  - Layer 2 (new, independently authored, separately reviewed): the full-3D
    containment check of section 4 + the scoped supersession of section 5.
    New validator code next to the multi-support relations validator. No
    Phase 2 byte changes.

## 3a. Bag owner definition package (engine's integration blocker - resolved)

The recovered bag supplies runtime bagEntity + SCHOOL_BAG_BODY but no Gate A
entity definition; validateSupportSurface requires an authored owner's
id/revision/digest, and validateBody accepts only classification
AUTHORED_NEW. So the owner records are AUTHORED_NEW re-expressions,
byte-bound by evidence to the certified recovered record:

- school/medical-bag-owner-body r1: one AABB component [550000, 350000,
  350000] at [0,0,0] -> aggregate EXACTLY equals the certified bag bounds
  (harness B2 equivalence proof). Contact region planeY -175000 (bag floor
  face), footprint within aggregate. supportCategories: FLOOR only
  (provenanceStatus RECOVERED). geometrySource AUTHORED_NEW with
  sourceReferenceEvidenceRefs pinning the certified record:
  'certified-runtime-record:school-medical-bag-body revision 1',
  'certified-bag-geometry-digest:<SCHOOL_BAG_BODY.geometryDigest>',
  'recovered-source:index.html#school-bag-lockers@<sourceDigest>'.
  Harness: validateBody -> VALIDATED (B1).
- school/medical-bag-entity r1: physicalBodyRef pins the owner body
  id/revision/canonicalDigest; transform [-3000000, 175000, 1000000] identity
  = the certified committed bag position (harness B3, byte-compared against
  bagEntity()). Harness: validateSupportEntity -> VALIDATED.
- Interior floor surface validated against that entity (B4) and materialized
  (B5): world planeY 0.025, region X [-3.25,-2.75] Z [0.85,1.15] - identical
  to the Part A world arithmetic.
- Real-validator negatives (B-neg): stale body digest -> STALE_BODY_REVISION;
  rotated owner orientation -> UNSUPPORTED_V1_CAPABILITY; stale
  ownerDefinitionRef digest -> INVALID_SUPPORT_REFERENCE; non-horizontal
  plane -> INVALID_SUPPORT_SURFACE; non-FULL_FOOTPRINT rule ->
  INVALID_SUPPORT_SURFACE; rotated-owner materialization -> throws
  UNSUPPORTED_V1_CAPABILITY.
- Dual-record honesty: the owner definition serves ONLY support-surface/
  volume ownership. The Phase 2 path keeps using the certified
  SCHOOL_BAG_BODY; nothing is re-derived, nothing replaced silently. Two
  records, one physical truth, evidence-linked in both directions.

## 3b. Owner R1-Q1: SIGNED narrow semantic authorization

The owner approved the semantic meaning: "For this specifically certified
synthetic-unit configuration, the approved bag has a certified hollow
interior with a valid internal support floor on which this unit may
physically rest." Strict scope (binding): ONLY this certified synthetic-unit
configuration; NOT a general bag-interior rule; does NOT authorize any other
item in the bag; bag stays opaque/closed to all other unsupported semantics;
the support floor has its own explicit identity/lineage + validation
evidence; placement still passes normal Geometry/Support/Ground Contact
rules; no hidden geometry inference or fallback; no other item inherits;
future items need their own certified relationship or a separately approved
generalized contract. Record: evidence/track-b/r1-q1-semantic-authorization.json
(authority USER_GATE_REVIEW, provenance wamid, appliesTo the section-1 drafts).

## 4. Containment volume (draft record - corrected geometry)

- supportVolumeId school/medical-bag-interior-volume-v1, revision 1,
  AUTHORED_NEW; ownerDefinitionRef pins the section-3a owner entity/body.
- Interior region (bag-local, 25mm inset on all six certified faces):
  X [-250000,+250000], Y [-150000,+150000], Z [-150000,+150000]
  (harness A1: strictly inside the certified bounds).
- Containment floor plane = interior minY = -150000 (the layer-1 surface).
- Unit placement (bag-local, identity): center [0,-90000,0]; occupies
  X [-100000,+100000], Y [-150000,-30000], Z [-40000,+40000]. Harness-proven:
  bottom exactly on floor plane (A4); footprint 200x80 inside the 500x300
  floor region; clearances +X/-X 150mm, +Z/-Z 110mm, top 180mm (A3).
- World transform (bag at certified [-3000000,175000,1000000]): unit world
  center [-3000000,85000,1000000]; bottom 25000 (no floor penetration);
  top 145000 (A5).

## 5. Hollow interior / collision conflict (explicit resolution + scoping)

- The hollow interior is AUTHORED NEW (own digest, R1-Q1 signed) - never
  inferred from the outer AABB. Hollow FOR THE PINNED CONTAINED ENTITY ONLY.
- Pair-collision supersession predicate (exact scope, hardening per engine):
  supersede ONLY WHEN relation.relationId ===
  'synthetic-training-unit:bag-containment' AND relation status VALIDATED AND
  supportedBodyRef === (synthetic-training-unit-body-v1, r1, admitted digest)
  AND ownerBodyRef === (school/medical-bag-owner-body, r1, admitted digest).
  Every other pair, entity, relation or state = normal collision evaluation.
  Never a generic bypass; the bag stays a solid collision box for everything
  else, exactly as the owner's signed scope requires.
- Collision-cover invariant (A6): unit world AABB strictly inside bag world
  AABB; protrusion rejects at legality, so the invariant holds by
  construction.

## 6. CONTAINMENT as new admission (spelled out)

The body record keeps the closed SUPPORT_SURFACE type (section 2). The NEW
admission is the containment-volume semantics package:
1. The authored records of sections 3-4 with revision digests and
   AUTHORED_NEW provenance (+ R1-Q1 signed semantic authorization).
2. validateContainment (new validator next to multi-support relations):
   strict-inside on 5 faces + floor contact + supersession predicate;
   fail-closed; emits PROTRUSION_X/Y/Z, CONTACT_GAP_FLOATING,
   SUPPORT_PENETRATION, FOOTPRINT_OUTSIDE_FLOOR_REGION, plus the staleness
   codes of section 7.
3. A1-style validator matrix: positives + negatives (protrusion on every
   face incl. oversized unit through the ceiling with contact intact,
   floating 1mm, penetration 1mm, stale owner/body/volume, unknown container,
   container REMOVED/CONSUMED, double containment) - mirrored today by the
   proposal-stage harness (26/26) as preview only.
4. Deterministic fixture + authority audit + SHA256SUMS, then owner
   exact-review with revision digests, then VERIFIED_FOR_SLICE. Phase 2
   capability review: NOT required under the two-layer design.

## 7. supportVolumeRef - exact schema addition (multi-support relations)

Minimal, backward-compatible: OPTIONAL COMPANION on ENTITY_OWNED relations;
supportSurfaceRef remains required and governs the existing conflict key and
buildIndex (no change to either).
- Relation field: supportVolumeRef { id, revision, digest } - present IFF the
  supported entity is contained in the owner's authored volume.
- Owner physicalState gains containmentVolume { volumeId, volumeRevision,
  canonicalDigest } (chair-surface analog).
- Staleness/hardening codes (exact, existing style):
  - supportVolumeRef present, owner physicalState.containmentVolume missing
    -> MISSING_SUPPORT_VOLUME;
  - id/revision/digest mismatch -> STALE_SUPPORT_VOLUME;
  - volume's ownerDefinitionRef != relation's ownerEntityRef/ownerBodyRef
    (stale or wrong owner/body) -> STALE_VOLUME_OWNER;
  - owner entity revision/body digest stale -> STALE_OWNER_REVISION /
    STALE_OWNER_BODY (existing);
  - placement fails validateContainment -> CONTAINMENT_VIOLATION (with the
    section-6 codes);
  - volume naming a different owner, or two volumes claiming the same
    supported entity -> CONFLICTING_RELATION (existing).
- Contact role GENERIC; contactRegionRef continues to reference the SUPPORTED
  body's bottom-face contact region (unchanged semantics).

## 8. R2 scope (engine ruling: NOT part of R1 admission)

CONSUMED lifecycle state and the atomic prepare/validate/commit seam are
specified for R2, not submitted for R1 signoff:
- lifecycleState gains CONSUMED (terminal): ACTIVE -> CONSUMED only inside
  the atomic seam bundle (attemptId-correlated; ledger + inventory + world
  revision + lifecycle land together or not at all - the engine's
  commit-ordering finding accepted as contract). CONSUMED -> nothing.
- Participation: CONSUMED excluded wherever REMOVED is excluded; exact
  validator change: lifecycleState==='REMOVED' checks become
  lifecycleState!=='ACTIVE'. Surviving relation naming a CONSUMED entity =
  fail.
- Retention: entity stays in state.entities with digest lineage + terminal
  provenance { attemptId, ledgerEventRef, consumedAtWorldRevision }.
- Post-consumption geometry: explicitly not applicable - stated, never
  silently bypassed.
- Renderer: reads only committed projections; v0.3 publicUseState codes are
  presentation-only, derived from committed state.

## 9. Visual representation (Track B side)

- Parametric box mesh from the CERTIFIED aggregate bounds (visuals inside
  certified envelopes; pixels never feed physics). "SYNTHETIC TRAINING UNIT"
  label in all states; CONSUMED renders absence + grayed slot marker, driven
  only by committed projections.
- B-W5 map entry synthetic-training-unit-v1 with visual digest;
  entity<->body<->asset binding pinned by digest on all three ends;
  validator test proves zero clinical fields.

## 10. Evidence chain, review rounds, boundaries

R1 (this package): unit body + bag owner definition package + interior floor
surface + containment volume + validator matrix + harness + R1-Q1 signed
authorization -> formal owner signoff. R2: consumption seam + CONSUMED
lifecycle + admission records. R3: BEFORE/AFTER proof exactly as the owner
defined completion (BEFORE: unit committed at IN_BAG, rendered from committed
state; AFTER: V2 commits consumption, ledger records, world revision
advances, renderer removes the unit from the committed projection only).
One unit only. No new scenes/equipment/content. Casualty/chair/bag/room
records untouched (bag pinned by reference, never modified). Frozen Track A
candidate untouched. Renderer read-only; FPS never feeds sim time; no
dual-write; no production promotion. Engine owns the authority side; Track B
owns this authoring/visual package and its evidence chain.

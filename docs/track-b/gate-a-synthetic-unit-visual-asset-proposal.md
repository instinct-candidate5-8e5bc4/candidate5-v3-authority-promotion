# Gate A Proposal: Synthetic Training Unit - Authoring + Certified Support Path

Status: PROPOSED (R1 v2, corrected after engine review). Nothing here is
validated, reviewed, or admitted. Every record is a draft for Gate A review
under the existing lifecycle (AUTHORED_NEW_DRAFT -> VALIDATED -> REVIEWED ->
VERIFIED_FOR_SLICE). Owner decision authorizing this work: Option A (full
Gate A certification of this ONE synthetic unit, minimal scope), WhatsApp
2026-09-30. The owner authorized the certification work, not specific draft
dimensions or semantics - every number below is proven by the accompanying
arithmetic harness (scripts/track-b/gate-a-unit-proposal-check.mjs, 14/14
checks), none asserted.

R1 v2 corrections after engine review:
- v1 interior top extended 125mm OUTSIDE the certified bag body (bag local Y
  is -175000..+175000; v1 used +25000..+300000). Recomputed wholly inside.
- Phase 2 surface-type closure (FLOOR/SUPPORT_SURFACE only) is now addressed
  by an explicit two-layer design; "Phase 2 unchanged" is no longer claimed
  alongside a CONTAINMENT surface type.
- The solid-bag collision conflict is resolved explicitly (section 5) instead
  of silently inferring a hollow interior from the outer AABB.
- CONTAINMENT admission (6), supportVolumeRef schema (7), CONSUMED lifecycle
  (8) are now spelled out as exact additions.

## 1. Identity binding (proposed)

| Layer | Proposed id | Notes |
|---|---|---|
| Engine inventory identity | `unit-1` / `SYNTHETIC_ITEM_A` (existing V2) | unchanged, engine-owned |
| World entity | `synthetic-training-unit-1` | entityTypeId `synthetic/training-unit` |
| Physical body record | `synthetic-training-unit-body-v1` revision 1 | section 2 |
| Renderer map entry (B-W5) | `synthetic-training-unit-v1` | SYNTHETIC_TRAINING, zero clinical fields |
| Interior support floor (layer 1) | `school/medical-bag-interior-floor-v1` | entity-owned SUPPORT_SURFACE, chair-seat pattern |
| Containment volume (layer 2) | `school/medical-bag-interior-volume-v1` | new authored record, section 4 |

## 2. Authored physical body (draft record, chair-definition pattern)

- `bodyDefinitionId: synthetic-training-unit-body-v1`, revision 1,
  classification/lineageStatus AUTHORED_NEW (synthetic by design; no recovered
  source claimed; geometrySource.sourceId = authoring decisionId).
- One component: AABB, participationRole BOTH, dimensions microunits
  [200000, 120000, 80000] (0.20 x 0.12 x 0.08 m boxed consumable), local
  translation [0, 60000, 0], identity orientation (V1 mandatory).
- Validator-derived aggregate: minX -100000 maxX 100000, minY 0 maxY 120000,
  minZ -40000 maxZ 40000 (author supplies components; validator derives).
- Footprint XZ_RECT_UNION: minX -100000 maxX 100000, minZ -40000 maxZ 40000.
- Contact region HORIZONTAL_XZ_RECT, planeY 0, same rect (bottom face).
- Orientation constraints: identity only (V1).
- supportCategories: EXACTLY ONE - { supportCategoryId: 'bag-interior-floor',
  supportSemanticType: 'SUPPORT_SURFACE', provenanceStatus: 'AUTHORED_NEW',
  fixtureOnly: false }. The closed semantic set is NOT extended for the body
  record; containment is carried by the relation layer (section 7), not
  smuggled into the body's support type. Deliberately no FLOOR category: the
  unit's only certified legal placement is inside the bag (minimal scope).
- authoringProvenance.decisionId: gate-a-unit-authoring-001 (to be created).

## 3. The two-layer lawful check (answers: which path, and why)

The V1 geometry gate accepts surface types FLOOR or SUPPORT_SURFACE only, and
the School adapter forwards into it unchanged. Two options were weighed:

- (i) New Phase 2 capability (CONTAINMENT surface type): REJECTED. It reopens
  the certified gate byte surface, demands a full Phase 2 capability review,
  and puts the milestone's timeline on the riskiest artifact in the repo.
- (ii) RECOMMENDED - two layers, Phase 2 untouched:
  - Layer 1 (existing gate, existing semantics): the bag's interior floor is
    authored as an entity-owned SUPPORT_SURFACE ('school/medical-bag-interior-
    floor-v1') on the chair-seat pattern: localPlane normal [0,1000000,0],
    offset -150000; localRegion X [-250000,+250000], Z [-150000,+150000];
    contact rule FULL_FOOTPRINT; transformBinding
    OWNER_TRANSLATION_IDENTITY_ORIENTATION; ownerDefinitionRef pins the
    certified bag entity/body r1 by id+revision+digest. The unit's support
    legality is evaluated by the EXISTING Phase 2 gate as a real horizontal
    support surface - materially the same semantics as the chair seat. This
    meaning ("the bag has a support floor") requires owner approval and
    correct binding to the bag - flagged as review question R1-Q1.
  - Layer 2 (new, independently authored, separately reviewed): the full-3D
    containment check of section 4 - walls/ceiling strict-inside + the
    collision supersession of section 5. New validator code next to the
    multi-support relations validator, reviewed jointly by both sides. No
    Phase 2 byte changes.

## 4. Containment volume (draft record - corrected geometry)

- supportVolumeId: school/medical-bag-interior-volume-v1, revision 1,
  classification AUTHORED_NEW - a new authored claim, NOT derived from the
  recovered bag source. Certified bag body bytes stay untouched (pinned by
  reference exactly as the chair seat pins the chair body).
- Interior region (bag-local, 25mm inset on all six faces of the certified
  bag bounds X [-275000,+275000], Y [-175000,+175000], Z [-175000,+175000]):
  X [-250000,+250000], Y [-150000,+150000], Z [-150000,+150000].
  Harness-proven strictly inside the bag bounds (25mm each face).
- Containment floor plane = interior minY = -150000 (layer-1 surface above).
- Unit placement (bag-local, identity orientation): center [0,-90000,0];
  occupies X [-100000,+100000], Y [-150000,-30000], Z [-40000,+40000].
  Harness-proven: bottom face exactly on the floor plane; footprint 200x80mm
  inside the 500x300mm floor region (FULL_FOOTPRINT); clearances +X/-X 150mm,
  +Z/-Z 110mm, top 180mm - every margin >50mm, strict containment.
- World transform (bag center at the certified committed position
  [-3000000,175000,1000000]): unit world center [-3000000,85000,1000000];
  world bottom 25000 (25mm above the world floor - no floor penetration);
  world top 145000. Identity orientation end to end.

## 5. The hollow-interior / collision conflict (explicit resolution)

The certified bag body is a recovered SOLID AABB and is treated as a solid
collision box; it does NOT evidence a hollow interior. Resolution:

- The hollow interior is AUTHORED NEW as an explicit claim (decisionId, its
  own digest) - never inferred from the outer AABB. It declares the interior
  region of section 4 hollow FOR THE PINNED CONTAINED ENTITY ONLY.
- Pair-collision supersession (reviewable rule, part of the layer-2
  admission): while the containment relation is VALIDATED, mutual collision
  between the pinned pair (bag body r1 digest, unit body r1 digest) is
  evaluated as containment, not intersection. For everything else the bag
  remains a solid collision box.
- Collision-cover invariant (harness-proven): the unit's world AABB is
  STRICTLY inside the bag's world AABB, so the bag's existing
  collision-vs-world evaluation conservatively covers the contained unit.
  Protrusion rejects at legality (layer 2), so the invariant holds by
  construction: a contained unit can never be partly outside its container.

## 6. CONTAINMENT as new admission (spelled out)

The body record keeps the closed SUPPORT_SURFACE type (section 2). The NEW
admission is the containment-volume semantics package:
1. The authored records of sections 3-4 (floor surface + volume) with their
   own revision digests and AUTHORED_NEW provenance.
2. validateContainment (new validator next to multi-support relations):
   strict-inside on 5 faces + floor contact + supersession invariant;
   deterministic; fail-closed; emits PROTRUSION_X/Y/Z,
   CONTACT_GAP_FLOATING, SUPPORT_PENETRATION,
   FOOTPRINT_OUTSIDE_FLOOR_REGION, plus staleness codes of section 7.
3. A1-style validator matrix: positives (legal placement, exact contact,
   clearances, world transform, cover invariant) + negatives (protrusion on
   every face incl. oversized unit through the ceiling with contact intact,
   floating 1mm, penetration 1mm, stale bag revision, unknown container,
   container REMOVED/CONSUMED, double containment) - mirrored today by the
   proposal-stage harness (14/14) as arithmetic preview only.
4. Deterministic fixture + authority audit + SHA256SUMS, then owner
   exact-review with revision digests (USER_GATE_REVIEW, wamid provenance
   refs), then VERIFIED_FOR_SLICE. Phase 2 capability review: NOT required
   under option (ii); required only if review rejects the two-layer reading.

## 7. supportVolumeRef - exact schema addition (multi-support relations)

Minimal, backward-compatible: supportVolumeRef is an OPTIONAL COMPANION on
ENTITY_OWNED relations; supportSurfaceRef remains required and governs the
existing conflict key and buildIndex (no change to either).
- Relation field: supportVolumeRef: { id: string, revision: int, digest:
  hex64 }. Present IFF the supported entity is contained in the owner's
  authored volume.
- Owner physicalState gains containmentVolume: { volumeId, volumeRevision,
  canonicalDigest } (chair-surface analog; bag entity revision bumps per the
  normal entity-revision rules - bag BODY bytes still untouched).
- validateRelations additions (existing staleness style):
  - supportVolumeRef present but owner physicalState.containmentVolume
    missing -> MISSING_SUPPORT_VOLUME;
  - id/revision/digest mismatch -> STALE_SUPPORT_VOLUME;
  - supportVolumeRef present while supported entity's placement fails
    validateContainment -> CONTAINMENT_VIOLATION (with the section-6 codes);
  - volume naming a different owner, or two volumes claiming the same
    supported entity -> CONFLICTING_RELATION (existing).
- Contact role GENERIC; contactRegionRef/contactRegionGeometry/
  contactRegionDigest continue to reference the SUPPORTED body's bottom-face
  contact region (existing semantics, unchanged).

## 8. CONSUMED lifecycle state - exact definition

- lifecycleState enum { ACTIVE, REMOVED } gains CONSUMED (terminal).
- Legal transitions: ACTIVE -> CONSUMED only inside the atomic
  prepare/validate/commit seam bundle (attemptId-correlated; ledger +
  inventory + world revision + lifecycle land together or not at all - the
  engine's commit-ordering finding accepted as the contract). CONSUMED ->
  nothing. REMOVED semantics unchanged.
- Participation: CONSUMED is excluded wherever REMOVED is excluded. Exact
  validator change: lifecycleState==='REMOVED' checks become
  lifecycleState!=='ACTIVE' (MISSING_SUPPORTED_ENTITY / MISSING_OWNER paths).
  A CONSUMED entity still named by any surviving support relation = fail.
- Retention: the entity stays in state.entities with digest lineage plus
  terminal provenance { attemptId, ledgerEventRef,
  consumedAtWorldRevision } - the audit trail records WHY it left, which a
  plain REMOVED would not.
- Geometry after consumption: explicitly not applicable (no body to
  evaluate) - stated, never silently bypassed.
- Renderer: reads only committed projections. v0.3 publicUseState
  AVAILABLE/RESERVED/CONSUMED remain presentation codes derived from
  committed state; they carry no physical authority.

## 9. Visual representation (Track B side)

- Parametric box mesh from the CERTIFIED aggregate bounds (visuals inside
  certified envelopes; pixels never feed physics). Distinct training-unit
  appearance + "SYNTHETIC TRAINING UNIT" label in all states; CONSUMED
  renders absence + grayed slot marker, driven only by committed projections.
- B-W5 map entry synthetic-training-unit-v1 with visual digest;
  entity<->body<->asset binding pinned by digest on all three ends;
  validator test proves zero clinical fields.

## 10. Evidence chain, review rounds, boundaries

R1: unit body + interior floor surface + containment volume + validator
matrix + harness -> owner review. R2: consumption seam + CONSUMED lifecycle +
admission records. R3: BEFORE/AFTER proof exactly as the owner defined
completion (BEFORE: unit committed at IN_BAG, rendered from committed state;
AFTER: V2 commits consumption, ledger records, world revision advances,
renderer removes the unit from the committed projection only).
One unit only. No new scenes/equipment/content. Casualty/chair/bag/room
records untouched (bag pinned by reference, never modified). Frozen Track A
candidate untouched. Renderer read-only; FPS never feeds sim time; no
dual-write; no production promotion. Engine owns the authority side; Track B
owns this authoring/visual package and its evidence chain.

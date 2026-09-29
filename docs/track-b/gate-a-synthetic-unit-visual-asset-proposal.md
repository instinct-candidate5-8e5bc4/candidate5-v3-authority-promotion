# Gate A Proposal: Synthetic Training Unit - Authoring + Certified Support Path

Status: PROPOSED. Nothing in this document is validated, reviewed, or admitted.
Every record below is a draft for Gate A review under the existing lifecycle
(`AUTHORED_NEW_DRAFT -> VALIDATED -> REVIEWED -> VERIFIED_FOR_SLICE`).
Owner decision authorizing this work: Option A (full Gate A certification of
this ONE synthetic unit, minimal scope), WhatsApp 2026-09-30.

## 1. Identity binding (proposed)

| Layer | Proposed id | Notes |
|---|---|---|
| Engine inventory identity | `unit-1` / `SYNTHETIC_ITEM_A` (existing V2) | unchanged, engine-owned |
| World entity | `synthetic-training-unit-1` | entityTypeId `synthetic/training-unit` |
| Physical body record | `synthetic-training-unit-body-v1` revision 1 | authored below |
| Renderer map entry (B-W5) | `synthetic-training-unit-v1` | class SYNTHETIC_TRAINING, zero clinical fields (map validator already enforces) |
| Containment region on bag | `school/medical-bag-interior-v1` | authored below, pins certified bag body r1 |

## 2. Authored physical body (draft record, chair-definition pattern)

- `bodyDefinitionId: synthetic-training-unit-body-v1`, revision 1,
  `classification/lineageStatus: AUTHORED_NEW` (synthetic by design; no
  recovered source claimed; geometrySource.sourceId = authoring decisionId).
- One component: AABB, participationRole BOTH, dimensions microunits
  `[200000, 120000, 80000]` (0.20 x 0.12 x 0.08 m - a small boxed consumable),
  local translation `[0, 60000, 0]`, identity orientation (V1 mandatory).
- Derived aggregate (validator computes; author does not assert):
  `minX:-100000 maxX:100000 minY:0 maxY:120000 minZ:-40000 maxZ:40000`.
- Footprint `XZ_RECT_UNION`: single rect `minX:-100000 maxX:100000 minZ:-40000 maxZ:40000`.
- Contact region `HORIZONTAL_XZ_RECT`, planeY 0, same rect (bottom face).
- Orientation constraints: identity only (V1).
- `supportCategories`: EXACTLY ONE - `{ supportCategoryId: 'contained-in-bag', supportSemanticType: 'CONTAINMENT', provenanceStatus: 'AUTHORED_NEW', fixtureOnly: false }`.
  Deliberately NO FLOOR category: the unit's only certified legal placement is
  inside the bag interior. Narrower support surface = smaller certification
  scope (owner: "certify only what is required for this single synthetic unit").
- `authoringProvenance.decisionId: gate-a-unit-authoring-001` (to be created).

## 3. Bag containment region (draft record, chair-seat SURFACE pattern, volumetric)

The certified bag body (`school-medical-bag-body` r1, RECOVERED, authored box
bounds .55 x .35 x .35 m) has NO interior. This record authors one, honestly:

- `supportVolumeId: school/medical-bag-interior-v1`, revision 1,
  classification AUTHORED_NEW - a new authored claim, NOT derived from the
  recovered bag source. The certified bag body revision/digest is pinned as
  owner exactly as the chair-seat surface pins the chair body; bag body bytes
  stay untouched.
- `ownerDefinitionRef`: bag body id + revision 1 + certified digest.
- `transformBinding: OWNER_TRANSLATION_IDENTITY_ORIENTATION` (same as chair
  seat; materialization translates with the bag, identity orientation only).
- Local interior region (conservative 25 mm wall inset, 25 mm floor):
  `minX:-250000 maxX:250000 minY:25000 maxY:300000 minZ:-150000 maxZ:150000`.
  The drafted unit (200x120x80 mm) fits with >50 mm margin on every axis.
- Containment floor plane: `normal [0,1000000,0]`, offset 25000 microunits.
- Contact rule: FULL_FOOTPRINT of the contained body's bottom contact region
  on the containment floor plane, AND contained aggregate AABB strictly inside
  the interior region (both required - no partial protrusion).

## 4. Certified support path (the new semantics - A1-style contract extension)

1. `SUPPORT_SEMANTIC_TYPES` gains `'CONTAINMENT'` (alongside FLOOR,
   SUPPORT_SURFACE). A1 precedent: adding SUPINE_FLOOR was a reviewed
   validator-matrix extension, not a Phase 2 change. Phase 2 unchanged here.
2. Multi-support relations: extend `ENTITY_OWNED` with a
   `supportVolumeRef` variant (RECOMMENDED over a new kind - reuses the
   existing staleness checks: owner revision, owner body digest, world
   revision binding). Contact role `GENERIC`. Relation draft:
   `synthetic-training-unit:bag-containment`, requirement REQUIRED.
3. `materializeContainmentVolume({ owner, volume })`: owner translation +
   identity orientation only; rotations/non-axis-aligned reject (same bar as
   materializeSupportSurface). No legality decided during materialization.
4. Legality rule (validator, fail-closed): contained aggregate AABB strictly
   inside materialized interior region AND bottom contact FULL_FOOTPRINT on
   the containment floor plane AND owner (bag) itself legally supported.
   Negatives that must reject: protrusion beyond any interior face; floating
   above / penetrating below the containment floor; stale bag body revision;
   unknown container; container REMOVED; double-containment conflict.
5. School geometry adapter: admit `synthetic-training-unit-body-v1` ONLY with
   exact revision/digest proof (bag/casualty/chair pattern). The contract-only
   `synthetic/gate-c-supported-box-body` fixture is NOT used and NOT admitted
   for this unit (engine boundary, agreed).

## 5. Consumption semantics (physical, not presentational)

- Consumption is an authoritative lifecycle transition of the world entity,
  derived from the committed Inventory V2 attempt - never a renderer decision.
- Shared seam (engine's commit-ordering finding, accepted as the contract):
  ONE reviewable prepare/validate/commit bundle per attempt:
  - prepare: V2 consumption intent + derived world proposal (unit lifecycle
    ACTIVE -> CONSUMED, relation `synthetic-training-unit:bag-containment`
    released), correlated by attemptId;
  - validate: Geometry Gate + support/contact where applicable on the BEFORE
    state (after consumption there is no geometry to validate - stated
    explicitly, not bypassed);
  - commit: atomic. Ledger event + inventory transition + world revision +
    lifecycle transition land together or not at all. V2 failure => no world
    commit; world failure => no inventory commit. No orphan either direction.
- Terminal state name: RECOMMEND `CONSUMED` (distinct from REMOVED - keeps
  audit trail honest about WHY the entity left the world). New lifecycleState
  value = contract extension, part of the same review.
- Post-consumption world carries the tombstone: entity digest + terminal
  state + the release of its containment relation, all inside the committed
  world digest. The renderer reads ONLY the committed projection
  (v0.3 publicUseState AVAILABLE/RESERVED/CONSUMED are presentation codes
  derived from committed state; they carry no physical authority).

## 6. Visual representation (Track B side)

- Parametric box mesh generated from the CERTIFIED aggregate bounds (same
  pattern as casualty/chair/bag: visuals articulated strictly inside certified
  envelopes; pixels never feed physics).
- Distinct training-unit appearance + floating label "SYNTHETIC TRAINING UNIT"
  in all three states; CONSUMED renders absence + grayed slot marker in the
  status overlay - driven only by committed projections.
- B-W5 map gains entry `synthetic-training-unit-v1` with its own visual
  digest; entity <-> body <-> asset binding pinned by digest on all three
  ends; validator test proves zero clinical fields.

## 7. Evidence chain (per existing gate patterns) and review rounds

Per definition: authoring record + deterministic fixture + validator matrix
(positives/negatives, A1-style) + authority audit + SHA256SUMS, then owner
review with exact revision digests recorded in an exact-review.json record
(`authority: USER_GATE_REVIEW`, provenanceRefs = WhatsApp wamids), then
VERIFIED_FOR_SLICE admission. Expected rounds:
- R1: unit body + bag containment region + CONTAINMENT semantics + validator
  matrix (positives + the negatives listed in section 4).
- R2: consumption seam contract + CONSUMED lifecycle + admission records.
- R3: BEFORE/AFTER integration proof (owner's exact completion definition):
  BEFORE - unit committed at IN_BAG, rendered from committed state;
  AFTER - V2 commits consumption, ledger records, world revision advances,
  renderer removes the unit from the committed projection only.

## 8. Boundaries

One unit only. No new scenes, equipment, or synthetic content. Casualty,
chair, bag, room records untouched (bag body pinned by reference, never
modified). Frozen Track A certification candidate untouched. Renderer stays
read-only; FPS never feeds sim time; no dual-write. No production promotion.
Engine owns the authority side (world-mutation path, Geometry Gate,
contact/collision where applicable, committed state, ledger); Track B owns
this authoring/visual package and the evidence chain above.

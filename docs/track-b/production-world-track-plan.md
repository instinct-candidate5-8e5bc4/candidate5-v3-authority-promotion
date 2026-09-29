# Track B / Production-World Track Plan (owner directive 2026-09-30)

Owner directive (evidence/track-b/visual-layer-classification.json, wamid ...QUIwQzVCOTUA):
the current SCHOOL_TREATMENT_ROOM preview is an ENGINEERING/PHYSICS VALIDATION
ENVIRONMENT, not the target visual world. Two explicit layers, presentation
never replacing or bypassing authority. R1/R2/R3 continue uninterrupted.

## 1. Binding model (formalized)

    SceneDefinition (approved scene semantics: room type, entity roster, constraints)
      -> Authoritative Physical Scene (certified bodies, transforms, supports, gates - UNCHANGED by this track)
      -> Presentation Manifest (per-entity binding records, stable IDs, asset refs, version pins)
      -> Visual Assets (meshes, materials, textures, lighting rigs - decorative unless separately certified)
      -> Entity Bindings (physical entityId -> visual entityId, transform source = authoritative only)
      -> Renderer (consumes bindings; reads authoritative transforms; never invents positions/supports/collisions)

Rules (owner verbatim intent):
- The certified physical representation and the final visual asset are NOT
  necessarily the same mesh.
- Presentation NEVER invents positions, supports or collisions. Every visual
  transform derives from the authoritative world state consumed through the
  existing public projection contract.
- Decorative meshes are never authoritative for physics unless separately
  certified through the normal gates.
- The physics engine is NOT redesigned to make the scene prettier.
- Scene semantics drive appearance: no decorative object may contradict the
  approved scene definition; no generic room under different labels; no silent
  visual fallback (missing asset = loud labeled placeholder, never a swap).
- CLAIMS: the world is not "visually complete" until a production-quality
  scene actually runs from the same authoritative world state.

## 2. Presentation Manifest (new artifact, proposed schema sketch)

    { kind:'TRACK_B_PRESENTATION_MANIFEST', manifestVersion:'0.1.0',
      sceneRef:{definitionId, authoritativeWorldDigest},   // pinned, staleness-checked
      entities:[{ physicalEntityId:'school-medical-bag',   // existing authority ID
                  visualEntityId:'vw-school-medical-bag',  // stable visual ID, namespaced vw-
                  assetRef:{kind:'procedural'|'file', source, sha256?},
                  transformSource:'authoritative',          // the only legal value
                  physicsAuthoritative:false }],            // decorative unless separately certified
      lighting:{rigRef, shadowPolicy}, policy:{...rules above...} }

Validation (fail-closed, mirrors projection-guard posture): unknown
physicalEntityId reject; transformSource != 'authoritative' reject; unpinned
file asset reject; manifest worldDigest != consumed world digest reject
(STALE_WORLD); placeholder must render its own LAYOUT/PLACEHOLDER label.

## 3. Zero-spend asset strategy (owner constraint: zero cost)

- Phase A assets are PROCEDURAL/parametric (three.js geometry + generated
  canvas textures): room architecture, doorway, window frames, cabinets,
  treatment furniture, lighting rig with shadow map tuning. Zero download,
  zero license risk, byte-reproducible, diff-reviewable - matches repo
  discipline.
- Phase B (only if the owner wants more): CC0-only external assets (e.g.
  Kenney.nl, ambientCG, Poly Haven CC0), each with license record +
  byte SHA-256 pin in the manifest. Any non-CC0 or paid asset is out of
  scope unless the owner explicitly lifts the constraint.
- The synthetic training unit and all Gate A work are unaffected: R1-R3 stay
  purely about the authority proof and are not blocked by this track.

## 4. Staged work orders (proposed IDs, each lands as its own patch set)

- PW-1 Presentation Manifest schema + validator + negative tests; renderer
  reads manifest IN ADDITION TO current path (debug view stays available).
- PW-2 Room architecture pass: real walls/ceiling/floor, doorway, window
  (per approved scene definition), realistic proportions and scale, bound to
  the existing certified room surfaces (visual skins over authority).
- PW-3 Lighting/materials/shadows pass: lighting rig, coherent materials,
  generated textures, shadow tuning, spatial depth.
- PW-4 Furniture/equipment visual pass: treatment furniture, storage,
  environment-specific objects bound to certified equipment entities.
- PW-5 Patient visual pass: higher-quality articulated human rendered FROM
  the authoritative pose (SUPINE_FLOOR only; pose set never expanded by
  presentation).
- PW-6 Cutover gate: production scene runs from the same authoritative
  world state; debug view re-labeled permanently; claims gate flips only
  here, only after owner review.

Every stage: pixel-verified screenshots, fail-closed validation negatives,
no physics byte changes, no claims beyond what runs.

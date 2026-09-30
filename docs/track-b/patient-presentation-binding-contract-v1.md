# Patient Presentation Binding Contract v1 (SUPINE_FLOOR limits APPROVED + v14 LOCKED; other postures PROPOSED only)

Route: carried in-repo as docs/track-b/patient-presentation-binding-contract-v1.md (evidence-only snapshot). Living workspace source: track-b-constraints/patient-presentation/binding-contract-v1.md; patient assets (v14 GLB, renders, opt-state) live in the workspace patient-presentation/ pipeline, not in this repo.

Status: SUPINE_FLOOR per-region limits APPROVED by owner signoff 2026-09-30
12:31 EEST (WhatsApp, full provenance in evidence/track-b/supine-floor-limits-owner-signoff.json,
wamid.HBgMOTcyNTMyNDkwMzUxFQIAEhgUM0E2QzkxOTJGNTYwQkQzQ0M2OUQA), and the v14
candidate LOCKED under them. STANDING and every future posture get their own
measurement and limits - NOTHING inherits the SUPINE thresholds (owner, same
message). Per the owner's binding-contract ruling (wamid...B0FA), limits are set
BEFORE any posture acceptance, deviation past the limit fails closed, penetration
into floor/support is a FAIL, and no visual-only posing is permitted.
HARD FAIL list (owner, verbatim, unchanged by any match percentage): floor
penetration; support/chair/bag/other-body penetration; floating hidden by
mesh/IK; visual change concealing an illegal physical state; deviation beyond
the approved bound; binding change without new version+evidence.

## Scope
Postures in scope for v1: SUPINE_FLOOR, STANDING (unchanged-rest verification only).
SEATED / RECOVERY / others: out of scope; nothing in this contract is posture-specific
hackery - the same pipeline (authoritative posture -> certified body/support ->
bone/region binding -> bounded adaptation) applies to any future posture.

## Certified region source of truth
Region AABBs are read live from the engine bundle buildVisualCasualty output
(visual-slice/engine-bundle.js), never retyped by hand. v1 capture (meters, engine
frame: X lateral, Y height above floor, Z along body from feet end):
- head:    X +/-0.120, Y 0..0.240, Z 1.527..1.767, floorContact=true
- torso:   X +/-0.280, Y 0..0.302, Z 0.877..1.527, floorContact=true
- left-arm:  X -0.330..-0.280, Y 0..0.180, Z 0.877..1.577, floorContact=true
- right-arm: X +0.280..+0.330, Y 0..0.180, Z 0.877..1.577, floorContact=true
- legs:    X +/-0.230, Y 0..0.220, Z -0.179..0.877, floorContact=true
Total envelope length 1.946 m. v4 MakeHuman body lying length 1.68 m (zone-shortfall
is structural, see Deviations).

## Frame mapping and anchoring (SUPINE_FLOOR)
Blender frame after compose Rz(180) @ Rx(+90): body face-up along +Y, height +Z.
Mapping: certified Z -> Blender Y, certified Y -> Blender Z, certified X -> Blender -X
(symmetric; arm slabs are side-symmetric).
Anchor rule v1:
1. Floor: lowest 0.3-percentile of sane body vertices rests at Z=0 (stray
   unweighted garment verts excluded by rest-position sanity filter).
2. Along-body: torso region center (Z 1.202) aligned to body torso-vertex centroid.
   Rationale: torso is the primary support/mass region; the 27 cm length shortfall
   is distributed to the extremities instead of breaking core support binding.

## Bone <-> Certified Region mapping v1 (versioned)
- head: head, neck_01 (includes hair/brow/lash meshes - they are the visible surface)
- torso: pelvis, spine_01..03, clavicle_l/r (plus root/hips/breast helpers)
- left-arm: upperarm_l, lowerarm_l, hand_l, all finger/thumb joints _l
- right-arm: mirror of left
- legs: thigh_*, calf_*, foot_*, ball_*, toe_*
Vertex -> region: dominant vertex group (max weight). Unclassified vertices are
rejected at build time (0 allowed), so nothing visible escapes coverage.

## Metrics per region (measured on the rendered mesh, all visible meshes)
- inPct: % of region-classified vertices inside the region AABB
- overshoot: max vertex distance outside the AABB (mm)
- clearance: min vertex height above floor (mm); penetration = clearance < -2 mm
- contact: for floorContact regions, the region's lowest contact band must reach
  <= 10 mm (natural clearance elsewhere is allowed per owner directive:
  anatomy may leave clearance - do not force every point onto the floor)

## Acceptance lanes (all four must PASS per posture; per owner 04:18 directive)
1. PHYSICAL VALIDITY: regions from certified state only; presentation never feeds
   sim; posture from authoritative state (visualMayAlter=false).
2. PRESENTATION BINDING: inPct and overshoot within the proposed limits below.
3. VISUAL CONTACT/PENETRATION: penetration 0 (tolerance -2 mm soft tissue);
   contact bands within 10 mm.
4. HUMAN POSTURE PLAUSIBILITY: human review of rendered views (oblique/top/side);
   no crossed joints, no twisted chains, natural resting pose.

## APPROVED MAX ALLOWED DEVIATION (SUPINE_FLOOR) - owner signoff 2026-09-30, v14 LOCKED

APPROVAL RECORD: evidence/track-b/supine-floor-limits-owner-signoff.json (channel, full wamid,
verbatim, inReplyTo chain). Scope: SUPINE_FLOOR ONLY; applies to the exact
reviewed candidate+version (v14); hands/arms 60% is a documented STRUCTURAL
EXCEPTION ONLY, never a general license; Bone <-> Certified Body Region binding
remains mandatory; the exception must remain deterministic, measurable, within
the reviewed bound.

PRECISION NOTE (binding): the ask summarized v14's MEASURED values rounded to
integers (head 97.8->98, legs 96.9->97, arms ~59.7->60); the owner approved those
stated values for the exact reviewed candidate. The approved bound is therefore
the candidate's deterministic measured values below; the owner's stated integers
are the rounded expression of that same bound. Any regression beyond the measured
values = deviation beyond the approved bound = FAIL.

OWNER-STATED LIMIT vs v14 MEASURED (the locked bound):
- head:      stated 98% in-region / contact <= 9mm as measured;
             LOCKED measured inPct 97.8, contact 9 mm, overshoot 62 mm
- upperBody: stated 100% in-region / natural lumbar gap <= 55mm documented;
             LOCKED measured inPct 100, lumbar 55 mm, overshoot 0 mm
- legs:      stated 97% in-region / zero-contact deviation as measured;
             LOCKED measured inPct 96.9, contact 0 mm, overshoot 153 mm
- handsArms: stated 60% STRUCTURAL EXCEPTION (certified shell ~50mm vs anatomy
             ~100mm; shoulder column |X| 0.157 vs slab inner edge |X| 0.28);
             LOCKED measured inPct 59.5/59.8, overshoot 171/153 mm

Proposal detail below kept as the measurement record of the locked candidate:
Measured v1 candidate (2026-09-30) vs proposed limits:
- head:   inPct >= 85 (measured 97.8), overshoot <= 120 mm (measured 62),
          contact band <= 10 mm (measured 9)
- torso:  inPct >= 50 (measured 100), overshoot <= 120 mm (measured 0),
          clearance: natural lumbar clearance allowed (measured lowest torso
          vertex 55 mm; owner directive: do not force every point onto the floor)
- arms:   inPct >= 25 (measured 59.5 / 59.8), overshoot <= 180 mm
          (measured 171 / 153; residual is STRUCTURAL - the shoulder column at
          |X| 0.157 can never enter a slab whose inner edge is |X| 0.28, and the
          50 mm slab vs ~100 mm anatomical arm caps occupancy near ~50-60%)
- legs:   inPct >= 70 (measured 90.7), overshoot <= 180 mm (measured 155;
          residual = waistband/boot-top weights above the AABB top),
          contact band <= 10 mm (measured 0)
- all:    penetration tolerance -2 mm soft tissue (measured worst -2 mm at one
          arm contact point, exactly at tolerance - flagged for tune);
          hand/head crossing centerline or beyond head zone = FAIL (none)
Lane-4 finding RESOLVED in v14 (was: knee/calf float, heels down). Root cause,
diagnosed with pipeline/mh-probe-heel.py + mh-probe2d.py: a coupled local
minimum - the toe-down foot dangled to the floor OUTSIDE the certified Y box
(gaming the minZ contact metric) while the calf/heel floated (ankle z 199 mm);
single-axis descent could not move calf (toe penetration) or foot (region loss)
alone. A 2-D grid scan found the coupled escape (calf|0 -0.35 + foot|0 -1.2),
then descent converged: legs inPct 96.9 (was 81.6), legs minZ 0 mm true contact,
no penetration, score 11175 (was 12049). Visually verified: heel/sole planted,
calf grounded (mh-v14-supine-candidate-side.png). Residual: legs over = 153 mm
unchanged across ALL cells (not pose-driven; consistent with waistband/boot-top
weights + thigh X-spread vs the narrow +/-230 mm certified box - belongs to the
PENDING owner limits decision, not to the optimizer). v14 supersedes the v10
candidate; both artifacts retained.

## STANDING regression
Standing GLB is untouched by the supine optimizer (separate artifact). v1 verifies
the standing render is unchanged (byte-identical source GLB) and the same metrics
machinery runs against STANDING regions when the engine exposes them.

## Anti-hack clause
No SUPINE-specific code paths in the renderer or package. All adaptation happens in
this bounded, versioned pipeline artifact. Any future posture runs the same
optimizer against its own certified regions with its own approved limits.

## R3 integrated-shell acceptance (owner directive 2026-09-30 12:32 EEST, wamid...M0EwOTA0ODVCRDZFODlCMUI3NDMA)

The visual-slice page remains the preview; R3 acceptance happens in the
INTEGRATED game shell. For every migrated authoritative physical entity
(PATIENT, WITNESS/NPC, BAG, STRETCHER, CHAIR, EQUIPMENT, ...) the evidence pack
must demonstrate, per entity: (1) authoritative entity ID; (2) certified
physical body; (3) authoritative X/Y/Z transform; (4) support/surface ID;
(5) geometry/contact validation result; (6) presentation asset/mesh binding;
(7) renderer transform derived from the committed physical transform; (8) camera
parallax exposing the same 3D body from multiple viewpoints; (9) no independent
screen-space X/Y positioning; (10) no sprite fallback after successful
authoritative binding. Plus a NEGATIVE TEST: unsupported/penetrating placement
is rejected by geometry/contact validation AND the renderer must not display it
(billboard/screen-aligned sprites do not pass).

Hard boundary: LEGACY/UNMIGRATED content may temporarily keep the old
sprite/panorama presentation; MIGRATED/AUTHORITATIVE entities REQUIRE 3D
world-bound presentation. No migrated authoritative entity may silently fall
back to the old sprite system - fallback for a migrated entity fails LOUD (same
pattern as the presentation-manifest placeholder), never a silent render.
Physics stays authoritative: certified physical authority underneath,
high-quality presentation mesh bound above; the visual mesh never becomes the
physics authority. The realistic patient model (this track) enters the real
shell only through the full pipeline: authoritative entity -> certified body ->
authoritative 3D transform -> support/contact -> Geometry Gate -> committed
world -> 3D presentation binding -> rendered 3D entity.

v14 lock R3-readiness: region/bone binding infrastructure (points 2,4,6 partly)
and deterministic measurable metrics (point 5 inputs) exist; integrated-shell
proof (points 1,3,7,8,9,10 and the negative test in situ) is due in the
integrated-shell phase with the engine executor, using this contract's evidence.

### World-level requirements (owner directive #2, 2026-09-30 12:35 EEST, wamid.HBgMOTcyNTMyNDkwMzUxFQIAEhgUM0EwRjE0NDhFOTY3MzI1N0U4REQA)

The bar is the whole playable world, not only the patient. The contract tracks
it as binding acceptance requirements:

1. TRUE 3D WORLD: the playable scene itself is a real 3D world - never 2D
   background/panorama/photo + sprites on top. The engine holds explicit 3D
   knowledge of floor, walls, ceiling, doors, windows, bed/stretcher, chairs,
   tables, cabinets, bag, equipment, patient, NPCs, obstacles, support surfaces.
2. SEMANTIC WORLD MODEL: every important entity/surface carries semantic
   identity (FLOOR walkable/support; WALL solid obstacle, not legal patient
   support; DOOR bounds + open/closed state; BED support surfaces/collision/
   bounds; CHAIR seat support; ...). Where-is/what-supports/floating/
   interpenetration/wall-penetration/in-bag/legal-support questions are answered
   from authoritative 3D world state - never from pixel interpretation.
3. NO PANORAMA AS PHYSICAL AUTHORITY: photos/HDRI only for lighting, distant
   scenery, atmosphere, non-interactive background. No invisible proxy geometry
   contradicting what the player sees - visible and physical worlds spatially
   aligned.
4. SCENE CAMERA PROOF: front/left/right/high/low sweeps over the whole scene
   with correct parallax preserving world positions; billboard/sprite fails.
5. FLOOR/SUPPORT PROOF for SCHOOL_TREATMENT_ROOM from authoritative state, plus
   an invalid-placement battery (contact gap, floor penetration, chair
   intersection, floating bag, bag-obstacle penetration, wrong support) that
   FAILS before committed rendering.
6. SCENE DISTINCTNESS: SCHOOL_TREATMENT_ROOM must actually be a 3D school
   treatment room (owner final-gate criterion: identifiable from the render
   alone). SYNAGOGUE/STREET/HOME later become real distinct environments -
   never one generic room relabeled. Scene Compatibility fails closed.
7. ENVIRONMENTAL CONDITIONS: DAY/NIGHT/RAIN/WINTER eventually modify the actual
   scene - never a dark/rain PNG overlay called simulation.
8. PRODUCTION WORLD = AUTHORITATIVE 3D WORLD + SEMANTIC WORLD MODEL +
   CERTIFIED PHYSICAL GEOMETRY + HIGH-QUALITY 3D PRESENTATION. $0 mandatory:
   procedural/custom/CC0/free-compatible assets only, recorded provenance per
   external asset (asset-provenance.md standard).
9. R3 EXTENDED: not complete when the 3D patient appears - the migrated path
   must operate inside an actual authoritative 3D scene (floor + support
   geometry + entities + world transforms + Geometry Gate + Ground Contact +
   collision validation + 3D binding + renderer).
10. NOT A REWRITE: extend the existing Scene Registry, Surface/Floor model,
    Support Validator, Geometry Gate, Ground Contact, WorldMutationAPI, bodies,
    bindings to describe the REAL playable world. The visual-slice room
    continues as the engineering bridge; PW-2 room work feeds the authoritative
    scene model rather than staying a presentation-only bridge.

11. CAMERA PHYSICS (owner directive #3, 2026-09-30 12:38 EEST,
    wamid.HBgMOTcyNTMyNDkwMzUxFQIAEhgUM0FDOTc3M0M2MERDQjFCQTQ2MjUA): the player
    camera respects the physical scene - never below the authoritative floor,
    never through walls/closed doors/solid obstacles/the patient, always within
    scene bounds. Violations are handled by deterministic constrain/reject
    BEFORE the fact, never post-penetration hiding. Constraints derive from the
    SAME semantic floor/walls/obstacles the Scene/Surface system knows - no
    hard-coded visual Y-floor. Near-plane clipping protection required. Rules
    may be per-camera-mode, but the invariants are universal. A DEBUG
    free-camera is allowed only if clearly marked, unavailable in gameplay,
    never used as acceptance evidence, and read-only on world state.
    CAMERA VALIDITY is a separate R3 acceptance item, and the camera/parallax
    proof (point 4) must demonstrate BOTH parallax correctness AND constraint
    compliance.

Track-binding note: patient/posture method is unchanged (authoritative posture
-> certified body/support -> bone/region binding -> bounded adaptation under the
approved limits). What changes is the target: the realistic patient and the
PW-2 room both feed the authoritative scene model, and posture acceptance
evidence must ultimately be reproducible inside that authoritative 3D scene.

### Extension contract rows (executor integration dependency, 2026-09-30)

Defined against verified owner directives; the executor implements against these
rows. Rows marked [OWNER] flag genuine owner-decision territory - the contract
defines the requirement shape, the decision itself is not made here.

A. PRESENTATION CONTRACT v2 - mesh binding correspondence (basis: no-sprite
   lock 12:32 wamid...M0EwOTA0ODVCRDZFODlCMUI3NDMA; patient directive 03:06
   wamid...M0FDQTk2NzQ3RUYzQkRGMEI2OTUA; two-engines rule):
   A1. An admitted presentation binding is the exact tuple (authoritativeEntityId,
       physicalBodyRef{id,revision,digest}, postureStateId, supportSurfaceRef,
       meshAssetRef{id,version,sha256,provenanceRef}). Missing any pin =
       INADMISSIBLE, fail-closed.
   A2. The renderer transform is DERIVED from the committed physical transform
       via the versioned bone<->region binding. No independent mesh transform
       input exists - no screen-space X/Y, no hand-placed offsets.
   A3. Mesh pose derives from authoritative postureStateId under that posture's
       APPROVED per-region deviation limits. A posture without approved limits
       has NO admitted mesh binding (today: SUPINE_FLOOR locked v14 only;
       STANDING pending its own measurement+limits).
   A4. Binding staleness fails closed: any change to body revision/digest,
       posture, support surface, or region map invalidates the binding; new
       version+evidence required (same pattern as pin-staleness HARD STOP).
   A5. One-directional: authority -> mesh. No mesh-derived value enters physical
       state; the mesh never becomes physics authority.
   A6. Sprite fallback for a migrated entity = LOUD failure (placeholder
       pattern), never a silent render.
   A7. $0 with recorded provenance+license per external asset
       (asset-provenance.md standard); any paid/licensed acquisition needs
       per-acquisition owner sign-off.
   A8. [OWNER] Admitting the realistic-patient mesh binding into the host
       allowlist IS the R2/R3 visual asset admission the R1 signoff explicitly
       excluded. These rows define the requirements; the admission itself needs
       owner sign-off when the evidence pack is complete. The contract does not
       admit it.

B. CAMERA POLICY (basis: camera lock 12:38 wamid...M0FDOTc3M0M2MERDQjFCQTQ2MjUA):
   B1. The camera is a physical body in the authoritative scene (position,
       orientation, near plane). Legality is evaluated against the SAME
       semantic surface model the Scene/Surface system knows - no separate
       hard-coded visual floor constant.
   B2. Deterministic constrain/reject BEFORE render: a proposed camera state
       violating floor clearance, wall/closed-door/obstacle/patient
       intersection, or scene bounds is constrained to the nearest legal state
       by a deterministic rule, or rejected when no legal constraint exists.
       Post-penetration hiding is a FAIL.
   B3. Near-plane protection: in every legal camera state the near plane clears
       any solid surface by at least the declared near distance.
   B4. Per-mode policy table: each camera mode declares its allowed
       region/motion; universal invariants (floor, walls, closed doors,
       obstacles, patient, bounds, near-plane) hold in ALL modes.
   B5. DEBUG free-camera: clearly marked, unavailable in gameplay, read-only on
       world state, NEVER acceptance evidence.
   B6. CAMERA VALIDITY is a separate R3 acceptance item: the sweep proof
       demonstrates BOTH parallax correctness AND constraint compliance,
       including attempted illegal moves being deterministically
       constrained/rejected.
   B7. [OWNER] The SET of gameplay camera modes (fixed scene camera, orbit,
       inspection, ...) is a product decision. The contract defines the
       invariant framework and the per-mode table shape; which modes ship is
       owner/product territory.

C. DOOR/BOUNDS COVERAGE (basis: semantic world model 12:35 wamid...M0EwRjE0NDhFOTY3MzI1N0U4REQA):
   C1. Door carries authoritative state: declared bounds (AABB in the surface
       model) + open/closed state in committed world state. State changes only
       via runtime command (world revision, legality-checked).
   C2. A closed door is a solid obstacle for entities AND the camera; an open
       door's opening region is passable per declared bounds. Type
       DOOR_OR_OPENING is never a support.
   C3. Every scene declares an authoritative bounding volume; entity or camera
       positions outside it are illegal (constrain/reject).
   C4. Scene Compatibility fails closed: a scene package missing door state or
       scene bounds is inadmissible.
   (Scenario content note: a door's DEFAULT state at scenario start is scene
   content defined per scenario, not a contract question.)

D. CAMERA SWEEP / ADMISSION SEAM (basis: camera proof 12:32 point 8 + 12:38):
   D1. A camera-sweep evidence artifact is part of scene admission: defined
       sweep waypoints (front/left/right/high/low + per-scene additions), each
       producing a render plus a constraint-compliance record.
   D2. The seam is executable: the sweep spec lives in the scene package
       (deterministic, versioned); the admission harness runs it and fails
       closed on parallax violation or constraint violation.
   D3. Sweep evidence is scene-specific: SCHOOL_TREATMENT_ROOM must show the
       treatment room from all five canonical directions with entity world
       positions preserved; billboard/screen-aligned content fails.

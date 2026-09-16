# Universal Simulation Capability Architecture

Status: `HARD_STOP` before Visual Vertical Slice. Design is ready for review, not implementation.

## Composition and authority graph

```text
Catalogs/Registries -> ScenarioDefinition -> CompatibilityEngine -> ScenarioInstance
                              |                     |
                              v                     v
 SemanticWorldState ----> PhysicalWorldState <---- EnvironmentState
       |                         |                       |
       |                    ConstraintState <-------- HazardState
       |                         |
       +----------------> AccessibilityState
 ClinicalState <--------- typed progression/action intents
       |
 ClinicalPresentationState -> ObservablePresentation

Physical + Semantic + ObservablePresentation
       -> VisualBinding -> Renderer

UserIntent -> ActionRouter -> domain-specific validation/commit
committed outcomes -> ConsequenceProjection -> ObservableResponse -> Evaluation
Evaluation/Renderer never write an authority state.
```

A ScenarioDefinition is a composition manifest, not a giant state object. It holds exact immutable refs to SceneDefinition, EventDefinitions, EnvironmentDefinition, initial HazardDefinitions, EntityDefinitions, CasualtyDefinitions, PhysicalBody/Posture definitions, Clinical definitions, Constraint/Accessibility declarations and ProgressionDefinition. ScenarioInstance stores independent versioned state roots and a causal event ledger.

## Canonical identity and versioning

Every definition/state/ref uses a namespaced stable ID, integer revision, canonical digest and provenance record. Refs pin all four. Identity is never inferred from a filename, display label, visual asset, geometry resemblance or tag. Definitions are immutable per ID+revision+digest. State roots have schema version, instance ID, revision, prior digest, state digest and committed sequence. Cross-domain refs record the depended-on revision/digest and fail when stale.

Provenance classifications are `RECOVERED`, `AUTHORED_NEW`, `VERIFIED`, `REFERENCE_ONLY`, `UNKNOWN`. Verification is domain- and slice-specific. No layer upgrades another layer's provenance. `VERIFIED` must name review scope and evidence. Unsupported, unresolved and stale are not aliases for pass.

## Scene semantics

`SceneDefinition` has a stable namespaced `sceneTypeId`, family refs, typed components, declared capabilities and descriptive tags. Families are open registries, not a closed runtime enum:

- residential: HOME, APARTMENT, KITCHEN, BATHROOM, BEDROOM, LIVING_ROOM
- education: SCHOOL, CLASSROOM, TREATMENT_ROOM, HALLWAY, STAIRS, PLAYGROUND
- worship: SYNAGOGUE and future worship spaces
- medical/public/commercial: CLINIC, MEDICAL_ROOM, OFFICE, PUBLIC_BUILDING, RESTAURANT, COMMERCIAL_SPACE
- transport/public way: STREET, ROAD, INTERSECTION, SIDEWALK, PARKING_AREA, BUS_STOP, VEHICLE_INTERIOR/EXTERIOR, BUS_INTERIOR
- work/high-place: INDUSTRIAL, FACTORY, WORKSHOP, CONSTRUCTION_SITE, ROOF, BALCONY, ELEVATOR, STAIRWELL
- water/outdoor: POOL, BEACH, SEA, RIVER, FIELD, OPEN_AREA
- exceptional topology: CONFINED_SPACE, COLLAPSED_STRUCTURE

Typed components include SurfaceTopology, AccessTopology, CoordinateFrames, WaterRegionTopology, TrafficContext, VehicleTopology, VerticalTopology and EnvironmentalEnvelope. Tags never grant capability. SYNAGOGUE cannot fall back to SCHOOL or HOME.

## Entity semantic model

`EntityDefinition` separates `semanticTypeRef`, component refs and `physicalBodyRef`. Semantic types include VEHICLE, VEHICLE_SEAT, BACKREST, DASHBOARD, DOOR, WINDSHIELD, STEERING_WHEEL, CHAIR, BED, STRETCHER, TABLE, STAIRS, RAILING, MACHINERY, DEBRIS, FIRE_SOURCE, WATER_REGION, ELECTRICAL_SOURCE, HAZMAT_SOURCE, OBSTACLE and SUPPORT_CAPABLE_OBJECT. Typed components declare capabilities such as Openable, SupportSurfaceProvider, ConstraintFeatureProvider, HazardSource, AccessPortal or VehicleOccupantStation. Geometry proves physical truth; semantics explain identity and compatibility.

Actors use roles `CASUALTY`, `BYSTANDER`, `RESPONDER`, `OTHER_NPC`. Role is independent from body/physics. Every physically authoritative actor uses the same mutation and legality authority. There is no singleton casualty: `casualtyInstances[]` is 0..N, each with independent identity and domain refs.

## Event model

`EventDefinition` describes causal incident semantics and participant roles; `EventInstance` records occurrence/progression. Open event type IDs cover MEDICAL_EVENT, TRAUMA, ROAD_TRAFFIC_COLLISION, PEDESTRIAN_STRUCK, MOTORCYCLE_COLLISION, BICYCLE_COLLISION, FALL, FALL_FROM_HEIGHT, STAIR_FALL, CRUSH_EVENT, ENTRAPMENT_EVENT, COLLAPSE, FIRE, SMOKE_EXPOSURE, EXPLOSION, ELECTRICAL_EVENT, DROWNING/SUBMERSION, POISONING/TOXIC_EXPOSURE, HAZMAT, HEAT_EVENT, COLD_EVENT, ANIMAL_RELATED_EVENT, VIOLENCE/PENETRATING_OR_BLUNT_TRAUMA, MULTIPLE_CASUALTY_EVENT and MASS_CASUALTY_EVENT. Event types never encode diagnosis. One event maps through explicit effect declarations to different casualties.

## Environment and hazards

EnvironmentState holds time-of-day (`DAY`, `NIGHT`, `DAWN_DUSK`), weather (`CLEAR`, `RAIN`, future reviewed states), temperature/wetness/visibility and domain-specific conditions. NIGHT is not a CSS overlay and RAIN is not decoration.

HazardDefinition/Instance binds type, source/region, state/severity vocabulary, spatial ref, progression ref and four separate effect bindings: physical, accessibility, clinical and visual. Types include FIRE, SMOKE, HEAT, COLD, RAIN, WATER, FLOODING/STANDING_WATER, TRAFFIC, ELECTRICITY, TOXIC_MATERIAL, UNSTABLE_OBJECT, UNSTABLE_STRUCTURE, DEBRIS and LOW_VISIBILITY. Missing effect authority stays UNKNOWN. No hazard or fluid simulation is claimed.

Fire compatibility needs fire/smoke/heat regions, source identity, blocked-access effects, visibility and future spread progression across building/kitchen/vehicle/industrial families. Water compatibility needs water surface/volume, submersion state, buoyancy approximation contract, water contact, pool-edge support and extraction transition for pool/sea/river/standing water. These are contracts, not implemented physics.

## Vehicle and road compatibility

Required semantic topology:

- vehicle family: car, van, bus, motorcycle, bicycle
- state: normal, collision-damaged, door open/closed, on-side, overturned, multi-vehicle participation
- local frame and shell; occupant stations; seat/backrest/floor; dashboard; doors/openings; windshield; steering controls
- casualty placement: driver, passenger, rear seat, outside, road, partially in/out, under or adjacent
- pedestrian is an actor role/location relationship, not a vehicle subtype

Required future physical extensions are general rigid transforms, quaternion/rotation validation, rotated support/contact planes, vehicle-local coordinate frames composed into world coordinates, oriented footprints/volumes, and contact with seat+backrest+floor. Current axis-aligned geometry cannot honestly represent on-side/overturned vehicles. Motorcycle/bicycle supports and balance are not proven. Bus has repeated occupant stations and standing/handhold topology. No compatibility claim passes without those capabilities.

## Physical topology extensions

Current V2 multi-support cardinality is reusable. Additive-but-foundational contracts needed:

1. `CoordinateFrameDefinition/State` with parent frame, rigid transform and digest.
2. Oriented geometry/contact regions and surface planes, not only world-axis-aligned bounds.
3. Surface graphs at multiple elevations and inclinations; stair tread/riser/landing semantics.
4. Explicit transform composition and invalidation for moving owners/vehicles.
5. Future articulation/deformation and force/load/friction models remain separate, optional capabilities.

Fall trajectories, ladders, roofs, balconies and elevated platforms require vertical topology and a future motion/trajectory authority; a final support relation alone cannot describe a fall.

## Constraint and entrapment

`ConstraintRelation` is independent of SupportRelation. It pins constrained entity/body region, constraining entity/feature, type (`PINNED`, `COMPRESSED`, `ENCLOSED`, `INSERTED`, `ATTACHED`, future reviewed types), allowed/blocked motion, coordinate frame, dependency lineage, lifecycle and release transition declaration. Removal/release is a validated mutation followed by explicit posture/support/access revalidation. No solver is designed here.

## Accessibility

`AccessibilityAssessment` binds actor, target entity/body region/objective, access topology ref, depended-on physical/hazard/constraint revisions, status (`REACHABLE`, `PARTIALLY_REACHABLE`, `BLOCKED`, `HAZARD_GATED`, `REQUIRES_ENVIRONMENTAL_ACTION`, `REQUIRES_ACCESS_CHANGE`), blockers and evidence. It is invalidated by relevant changes and never stands in for pathfinding or entrapment.

## Human posture capability

Each PostureDefinition pins a posture semantic ID, authored PhysicalBody variant, contact regions, required/optional support roles, orientation constraints, admissible surface capabilities, transition declarations and visual-pose binding requirements.

| Posture family | Required future contracts |
|---|---|
| STANDING | feet contacts, floor support, upright orientation, standing body/visual pose |
| SITTING_ON_FLOOR | pelvis/legs contacts, floor topology, authored body/pose |
| SEATED_ON_CHAIR | pelvis-seat, back-backrest optional/required by variant, feet-floor optional, owner-local contacts |
| SUPINE / PRONE / SIDE_LYING / RECOVERY_POSITION | posture-specific body/contact regions and orientation; floor/bed/stretcher compatibility |
| KNEELING | knees/feet contacts and authored geometry |
| LEANING_ON_WALL variants | floor support plus torso/back wall contact and orientation |
| LEGS_ELEVATED_ON_CHAIR | body floor/bed support plus legs on entity-owned surface |
| LYING_ON_BED / STRETCHER | authored body variant and entity-owned surface; rails/back elevation where applicable |
| VEHICLE_SEATED | seat+backrest+floor/footwell in vehicle frame; rotated/local contact support |
| PARTIALLY_SUPPORTED / arbitrary multi-contact | all contacts explicitly authored and validated; no inferred contact |

No new adult-v1 posture is authored. Current approved casualty remains adult-v1, MALE, SUPINE_FLOOR.

## Gesture and body presentation

`GestureState` binds a gesture semantic ID (`HANDS_ON_THROAT`, `HAND_ON_CHEST`, `HOLDING_LIMB`, `GUARDING_ABDOMEN`, `PROTECTIVE`, `TREMOR`, `SEIZURE_MOTION`, extensible), affected visual/body regions, time behavior and `physicalEffect`. Default physicalEffect is `NONE`. If a gesture changes authoritative collision, it requires a separately reviewed PhysicalBody/Posture transition; animation cannot do so silently.

## Clinical boundaries

ClinicalState is a separate reviewed authority for consciousness, responsiveness, breathing, circulation observations, bleeding, pain, injury regions, burns, swelling, seizure, temperature presentation, submersion/drowning findings and future catalog entries. It makes no protocol or treatment claim. Catalogs pin source, edition, review and evidence. MDA coverage cannot be claimed without the exact supplied/reviewed MDA source and edition.

ClinicalPresentationState exposes only learner-perceivable cues such as pallor, redness, cyanosis, sweating, visible bleeding, burns, swelling, wet clothing, facial expression, breathing motion, choking gesture, seizure motion and reduced responsiveness. `ClinicalState -> ObservablePresentation` is an explicit reviewed projection. Hidden truth is not automatically disclosed. Observable uncertainty is representable.

## Progression, actions, consequences and evaluation

ProgressionDefinition contains typed triggers, timing policy, causal dependencies and domain intents. Physical intents go only through WorldMutationAPI; Clinical, Hazard/Environment, Constraint and Accessibility changes go through their own future authorities. Visuals consume committed states downstream.

`UserIntent -> ActionDefinition -> ActionRouter` separates approach/inspect/observe, move/open/reposition/extract, environmental interaction, clinical intervention and call-for-help intents. No treatment logic or scoring is defined. A domain authority validates and commits/rejects. ConsequenceProjection maps committed outcomes to observable responses. Evaluation reads the action/outcome ledger against a separately versioned rubric. Evaluation cannot mutate any authoritative domain.

## Scenario composition examples, not implementations

- ROAD + ROAD_TRAFFIC_COLLISION + damaged vehicle + driver + dashboard ConstraintRelation + TRAFFIC HazardInstance
- HOME/KITCHEN + FIRE + SMOKE + casualty with reviewed burn ClinicalState + blocked-exit AccessibilityAssessment
- POOL + SUBMERSION event + casualty in water + submersion/water contact + explicit extraction transition

All must pass compatibility before instantiation. They are manifests of refs, never copied monoliths.

## Semantic Compatibility Engine

Input: exact ScenarioDefinition and registry snapshot. Output: `COMPATIBLE`, `UNSUPPORTED`, `UNKNOWN` or `CONFLICT`, with rule IDs, required capabilities, observed capabilities, exact missing refs and evidence digest. Only COMPATIBLE may instantiate. Rules include:

- collision requires road/traffic and relevant vehicle/pedestrian topology
- submersion requires water volume/surface and submersion capability
- vehicle-seated requires occupant station and seat/backrest/footwell topology plus rotated/local contact capability where needed
- entrapment requires Constraint capability and constraining feature
- fire/smoke requires hazard-region and relevant effect contracts
- posture requires exact authored body, contacts and compatible supports
- visual readiness never upgrades scenario or physical compatibility

No fallback, substitution, threshold lowering or automatic capability synthesis.

## Capability Registry

A canonical registry entry pins capability ID/revision/digest, contract schema, provider component, implementation status, provenance/review scope, dependencies and limitations. Queries answer whether exact registered evidence supports a capability; they do not infer truth from names. Capability status is one of `IMPLEMENTED_VERIFIED_FOR_SCOPE`, `CONTRACT_ONLY`, `UNSUPPORTED`, `UNKNOWN`. Example questions include vehicle collision, water/fire, entity-owned seat, rotated contacts, posture-support compatibility and entrapment. `CONTRACT_ONLY` cannot pass an implementation-required rule.

## Visual Binding contract

`VisualBindingDefinition` pins semantic entity ID/revision/digest, physical entity/body/surface/contact refs, VisualAssetFamily ID/revision/digest, local alignment anchors, transform mapping, material/animation binding refs, supported gesture/presentation cues, LOD variants and quality tiers. Runtime sync is one-way from authoritative state to visual transform/presentation. Renderer events cannot mutate truth.

LOD, lazy loading, streaming, culling, instancing and compressed assets/textures may vary quality only within the same asset family and semantic/physical identity. Missing binding/asset is explicit `VISUAL_UNAVAILABLE`; an approved non-authoritative proxy must still name the same entity and may never become physical proof.

## Visual Quality Gate proposal

Design acceptance dimensions: semantic recognizability; exact binding identity; transform/contact/support alignment; no visible floating/penetration; scale; materials; lighting/shadows; camera; animation-to-state sync; desktop/mobile rendering; asset load/error behavior; and visual regression evidence. Inspect rendered pixels on named devices/viewports. Separate physical correctness evidence from visual correctness evidence. Gate output is PASS/FAIL/UNKNOWN per dimension, with artifact and binding digests.

## Web Performance Gate proposal

Before Visual Gate implementation, lock measured budgets by representative device tiers (desktop, iPhone, Android, tablet) and representative scene complexity tiers. Metrics: initial load, scene load, transferred asset bytes, memory, GPU cost, draw calls, triangles, texture memory, frame time distributions, long tasks and asset failures. Define cold/warm cache, network profile, viewport, power/thermal assumptions, sample count and percentile. No thresholds are proposed here; product/device owners must approve them before assets and renderer choices harden.

## Current foundation vs extension

**Supported by current foundation:** immutable canonical digests; explicit provenance; axis-aligned School SurfaceModel; approved School package with three entities; adult-v1 MALE SUPINE_FLOOR; chair/seat; canonical multi-support; exact dependency index; fail-closed geometry gate; atomic physical transaction; event/replay; one physical mutation authority.

**Additive extension required:** open semantic/component registry; event/environment/hazard definitions; multi-casualty collection; actor roles; independent clinical/presentation state; constraints; accessibility; progression/action/evaluation boundaries; capability registry/engine; VisualBinding; typed domain refs.

**Foundational extension required before general physical implementation:** coordinate frames; rotated/oriented contacts and surfaces; inclined/multi-level topology; moving-owner transform composition and invalidation; cross-domain causal transaction protocol.

**Fundamental redesign if current structures are reused naively:** putting all state in Scenario; treating tags as capabilities; serializing one `theCasualty`; encoding entrapment as support; hazards as visual effects; ClinicalState as visible presentation; renderer/evaluation as mutation authority. These patterns are prohibited rather than implemented.

## Fail-closed rules

UNKNOWN is never PASS. Unsupported does not select a nearby venue/entity/posture. Missing semantic capability rejects composition. Missing physical proof rejects physical mutation. Missing clinical authority produces no invented clinical truth. Missing visual asset changes no semantic/physical state. Stale cross-domain dependencies invalidate derived assessments. Registry absence cannot be interpreted as support.

# Universal Foundation Contracts

Gate scope: architecture, contracts and synthetic proofs only. No geometry gate extension, feature, real scene/entity/posture, clinical catalog or renderer is implemented.

## Authority graph

| State root | Authority owner / only future writer | Read dependencies | Invalidated by | Event and evidence |
|---|---|---|---|---|
| PhysicalWorldState | WorldMutationAPI | Semantic refs, exact physical definitions | stale bodies/frames/surfaces/supports/constraints | committed/rejected physical event, legality evidence |
| SemanticWorldState | SemanticRegistryAuthority | immutable semantic/component registry | changed exact definition refs | semantic composition event, registry evidence |
| EnvironmentState | EnvironmentAuthority | environment definitions | changed environment definition/progression | environment event, source evidence |
| HazardState | HazardAuthority | Environment, Semantic region/source refs | source/region/environment revisions | hazard event, domain effect declarations/evidence |
| ConstraintState | ConstraintAuthority | Physical entity/body/feature/frame refs | physical or constraint lifecycle revision | constraint event and release evidence |
| ClinicalState | ClinicalAuthority | casualty identity, reviewed clinical catalog | source/catalog/casualty revisions | clinical event, clinical authority evidence |
| AccessibilityAssessment | derived, read-only | Physical, Hazard, Constraint, topology, actor/objective | any dependency revision/digest | derivation evidence and invalidation result |
| ClinicalPresentation / ObservablePresentation | derived, read-only | Clinical plus disclosure/projection definition | clinical or projection revision | projection evidence; hidden refs excluded |
| Evaluation | derived, read-only | committed action/outcome/observable ledgers | rubric or ledger revision | evaluation evidence; never mutation |
| VisualBinding projection | derived, read-only | exact Semantic/Physical/Presentation and asset-family refs | any binding dependency or asset revision | alignment/binding evidence; never physical proof |

Every authoritative root has domain, state ID, schema version, revision, prior digest, canonical digest, provenance, authority ID, event sequence and data. Descriptors pin permitted writers, reads, invalidation dependencies, event contract and evidence contract. Shared copied truth is prohibited: domains store exact immutable refs and their own state only.

## Canonical cross-domain reference

`{refVersion, domain, kind, id, schemaVersion, revision, digest}` is the only identity grammar. IDs are namespaced machine identities. Display names, tags, filenames, asset IDs and geometric resemblance are never refs. All fields compare exactly. Missing, stale or mismatched refs fail closed.

## Scenario composition

ScenarioDefinition is a sealed manifest of exact refs to Scene, Event(s), Environment, Hazard(s), Entity(s), Casualty definitions, physical/posture definitions, Clinical, Constraint, Accessibility and Progression definitions plus capability requirements. ScenarioInstance pins its definition, independent domain-state refs, 0..N casualty records and a causal ledger. Each casualty has independent physical/body/posture/support, constraint, accessibility, clinical, presentation and progression refs. An EventInstance targets an explicit set of casualty IDs with independent effect declarations.

## Open semantics and entity components

Semantic IDs are open and namespaced, such as `scene.school.treatment_room`, `scene.synagogue`, `scene.road`, `scene.vehicle_interior`, `scene.pool`, `entity.chair`, `event.road_traffic_collision`. Adding an ID does not require changing a universal enum. Typed components, not tags, carry contracts. Tags are search metadata only. Semantic identity grants no physical capability.

EntityDefinition separates semanticRef, component instances, capability refs and optional exact PhysicalBody ref. Component types are general provider/feature contracts: `component.support_surface_provider`, `component.openable`, `component.access_portal`, `component.occupant_station`, `component.constraint_feature_provider`, `component.hazard_source`, `component.spatial_region`. Water/vehicle meaning is expressed by semantic identity plus reviewed typed components, avoiding hidden behavior in broad names.

## Capability Registry and compatibility

Capability entries are sealed records with ID, revision/digest, status, scope, parameters, evidence and limitations. Status is `IMPLEMENTED_VERIFIED_FOR_SCOPE`, `CONTRACT_ONLY`, `UNSUPPORTED` or `UNKNOWN`. There are no bare implementation booleans. Capabilities cover multi-support, vertical contacts, rotated frames, inclined surfaces, multi-level topology, water volume, occupant stations, constraints, dynamic hazards and multiple casualties.

Compatibility takes sorted requirements and exact capability records and returns a canonical result: `COMPATIBLE`, `UNSUPPORTED`, `UNKNOWN` or `INVALID`, with deterministic reason codes, exact evidence digests and registry digest. Only COMPATIBLE instantiates. CONTRACT_ONLY cannot satisfy an implementation-required rule. No closest match or fallback exists.

## Coordinate frames and deterministic rotation

Frame kinds are WORLD, ENTITY_LOCAL, FEATURE_LOCAL, SURFACE_LOCAL, BODY_LOCAL and CONTACT_REGION_LOCAL. Every non-world frame has an exact parent ref; every frame has stable identity, microunit integer translation, rotation, revision/digest and provenance. Moving parents create new frame state revisions and invalidate dependent composed transforms, contacts and derived assessments.

Rotation is a **canonical integer quaternion ratio** `[w,x,y,z]` serialized as base-10 integer strings:

1. reject all-zero and non-integer components;
2. divide all components by their positive greatest common divisor;
3. force the first nonzero component positive, making `q` and `-q` identical;
4. compute geometry conversion as an exact rational rotation matrix whose denominator is `w²+x²+y²+z²`;
5. rounding to geometry fixed point happens only at a future, versioned geometry-evaluation boundary with an approved deterministic rule.

This avoids equivalent-rotation digest ambiguity and floating-point normalization. It is renderer-independent. Three.js conversion is downstream only. Arbitrary rotations imported from floating assets cannot become authoritative until quantized/approved into this representation. Numeric bounds, overflow rules and rounding remain an explicit implementation-gate decision.

## Oriented geometry and topology decision

Do not modify Phase 2 V1/V2. A future additive **Phase 2 V3** may consume oriented rigid body/contact/surface primitives and frame refs, but those primitives must live in a lower renderer-independent contract layer so Constraint, topology and VisualBinding can share identities without calling the legality gate. V3 must translate exact frame-composed rational transforms into its reviewed deterministic numeric model, validate oriented footprint/volume and return PASS/FAIL/UNKNOWN with proof. If implementation shows V1/V2 internals must change, stop and review a separate proposal rather than editing them.

SurfaceTopology separates semantics from geometry and supports multiple levels, floors, walls, ceilings, openings, inclined ramps, stair tread/riser/landing components, entity-owned vehicle-interior surfaces and future water boundary/volume components. Surface adjacency/access graph is not collision geometry and does not claim pathfinding. Vertical/inclined support requires oriented plane, bounded region, normal, frame ref, capability and evidence.

## Constraint, accessibility, environment/hazard, clinical/presentation

ConstraintRelation is not SupportRelation. It pins constrained entity/body region, constraining entity/world feature, exact frame, semantic type, allowed/blocked motion declaration, dependency refs, lifecycle, release preconditions and post-release typed transition intent. It claims no solving. Axis vocabulary is interpreted in the pinned frame. More complex degrees of freedom require a later reviewed vocabulary.

AccessibilityAssessment is derived and objective-specific, not a boolean. It pins actor, target and optional target body region, access objective, topology refs, exact Physical/Hazard/Constraint dependencies, status, blockers and evidence. Status vocabulary includes REACHABLE, PARTIALLY_REACHABLE, BLOCKED, HAZARD_GATED, REQUIRES_ENVIRONMENTAL_ACTION, REQUIRES_ACCESS_CHANGE and UNKNOWN. Any dependency change deterministically invalidates it. No pathfinding is claimed.

EnvironmentState stores day/night, weather and ambient conditions. HazardState stores authoritative hazard instances with exact source/region and independent potential bindings to physical, accessibility, clinical and visual effects. A visual particle is never hazard truth. No propagation is implemented.

ClinicalState, ClinicalPresentation projection, ObservablePresentation and VisualRepresentation remain distinct. A presentation projection explicitly lists exposed observation refs and hidden clinical refs. Projection does not copy or leak hidden truth. No medical catalog, protocol, MDA source or completeness claim exists.

## Progression and cross-domain atomicity

Progression logic emits a sealed typed intent to one owning authority: PHYSICAL, CLINICAL, HAZARD, CONSTRAINT or ENVIRONMENT. That authority validates and commits/rejects, emits a domain event, and appends causal lineage. No coordinator writes a domain directly.

**Recommendation: deterministic saga with reservation/prevalidation and fail-closed forward recovery, not universal atomic memory transaction.** Independent authorities and real-world progression cannot be rolled back honestly after observable effects. Contract invariants:

1. one CausalAction ID, immutable ordered StepPlan and exact starting state refs;
2. prevalidate every intended step and acquire version-bound reservations where supported;
3. no step begins if required prevalidation/reservation is UNKNOWN or stale;
4. commit in declared dependency order; each domain event cites the CausalAction and prior step event;
5. after any commit, never erase history or pretend rollback; a later failure produces `PARTIALLY_COMMITTED_BLOCKED` and only explicit reviewed compensation/forward-recovery intents;
6. compensation is a new authoritative action, not state reversal;
7. derived Accessibility/Presentation/Evaluation stays invalidated until required steps complete;
8. safety-critical composition can declare `REQUIRES_ATOMIC_PROVIDER`; if no single authority can own it, return UNSUPPORTED.

Examples: extraction reserves constraint release and physical transition, commits release then physical/posture/support revalidation, then derives access. Door opening commits physical state before recomputing access. Fire progression commits Hazard first, then typed effects; clinical/access failures are recorded, not silently rolled back.

## Visual contract

VisualBinding is the only bridge to a renderer. It pins exact semantic entity, physical entity/body, VisualAssetFamily and variant refs, alignment anchors, transform synchronization, visibility and quality policy. Anchors include entity origin, floor contact, seat contact, backrest contact, body-local landmarks and door/opening landmarks. Human alignment requires corresponding exact PhysicalBody/ContactRegion and asset-family anchor IDs; an anchor name without reviewed geometry is UNKNOWN.

High/medium/low variants are allowed only in the same VisualAssetFamily and must preserve semantic/physical IDs, dimensions, contacts and scenario meaning. Missing required family/binding is `VISUAL_UNAVAILABLE`; synagogue-to-room and car-to-unrelated-geometry substitutions are invalid. VisualBinding never proves physics; renderer never writes authoritative state.

## Quality and performance gate protocols

Visual evidence must include exact binding/asset/physical digests, named viewport/device/browser, deterministic camera/state, rendered screenshots and pixel inspection for semantic recognizability, transform/contact alignment, floating, penetration, scale, materials, lighting, shadows and asset errors on desktop and mobile. Results are per-dimension PASS/FAIL/UNKNOWN; visual PASS does not upgrade physical provenance.

Before Visual implementation, owners must explicitly approve numerical budgets for each representative device and scene tier: initial transferred bytes; scene transferred bytes; initial and scene load time percentiles; JS/WASM and total memory; Web-visible GPU timing or stated proxy; draw calls; triangles; texture-memory estimate; frame-time percentiles/worst-frame policy; long-task count/duration; asset decode and GPU upload where measurable; cache/network/thermal/power assumptions; sample count and failure/error policy. No budgets are invented here.

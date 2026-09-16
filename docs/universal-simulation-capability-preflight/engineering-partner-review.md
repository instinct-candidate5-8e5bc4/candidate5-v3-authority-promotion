# Engineering Partner Review

## 1. Ordered chain is too linear

**Idea / observation:** The proposed composition reads as one chain from Scenario to Evaluation.

**Why it matters:** Physical, semantic, clinical, observable and visual truth have different authorities and clocks. A chain invites downstream layers to become truth owners.

**Proposed change:** Use a versioned composition graph with five authority domains: Semantic World, Physical World, Clinical World, Progression, and Presentation. ScenarioDefinition composes immutable definitions; ScenarioInstance holds exact refs plus independent authoritative state roots. Actions submit intent to domain authorities. Evaluation observes committed outcomes only.

**Benefit:** Prevents clinical, rendering or scoring code from mutating physical truth and allows domains to evolve additively.

**Risk:** More explicit refs and synchronization events.

**Scope impact:** Architecture/contracts only now; future composition coordinator and domain APIs.

**Recommendation:** Adopt before visuals.

## 2. Scene taxonomy cannot be only tags

**Idea / observation:** Stable identity plus capabilities/components/tags is right, but unrestricted tags are ambiguous.

**Why it matters:** `ROAD`, `VEHICLE_INTERIOR` and `WATER_REGION` carry compatibility obligations that strings cannot prove.

**Proposed change:** Define open, namespaced semantic type IDs; versioned component contracts; descriptive tags only for search. Compatibility rules consume typed components/capabilities, never display names or tags.

**Benefit:** Extensible without a closed enum and fail-closed without venue substitution.

**Risk:** Registry governance is required.

**Scope impact:** Additive semantic registry and compatibility contracts.

**Recommendation:** Adopt.

## 3. Environment State and Hazard overlap

**Idea / observation:** Rain, smoke, water and traffic can be conditions, hazards, physical regions and visuals.

**Why it matters:** A single object would confuse source condition, hazardous exposure and effects.

**Proposed change:** EnvironmentState stores conditions; HazardInstance identifies hazardous region/source and severity state; effect bindings separately target Physical, Accessibility, Clinical and Presentation domains. One source may create several hazards.

**Benefit:** No visual-only hazard can masquerade as authoritative danger.

**Risk:** Cross-domain progression needs ordered commits.

**Scope impact:** New contracts, no simulation.

**Recommendation:** Adopt.

## 4. Posture must not own gesture or diagnosis

**Idea / observation:** Posture, gesture and clinical presentation are often conflated in animation systems.

**Why it matters:** A choking gesture must not change collision geometry; a visual recovery-position clip must not assert physical support.

**Proposed change:** PostureDefinition owns authored body configuration/contact requirements. GestureState is a presentation modifier with explicit collision effect `NONE` unless paired with a separately reviewed PhysicalBody transition. ClinicalPresentation selects observable cues, not hidden ClinicalState.

**Benefit:** Preserves authority boundaries and allows degraded visuals without changing truth.

**Risk:** Some future articulated gestures may need a physical variant.

**Scope impact:** Additive posture/gesture/presentation contracts.

**Recommendation:** Adopt.

## 5. "Dynamic Progression" is not one authority

**Idea / observation:** Deterioration, fire spread, door motion and constraint release cannot share one generic reducer safely.

**Why it matters:** They validate under different rules and may commit or fail independently.

**Proposed change:** ProgressionDefinition is a declarative schedule/trigger graph. It emits typed intents to Physical, Clinical, Environment/Hazard, Constraint and Accessibility authorities. A CompositionTransaction records causal ordering; it does not bypass domain validation.

**Benefit:** Deterministic causality without a universal mutation backdoor.

**Risk:** True all-domain atomicity may later require a coordinator protocol.

**Scope impact:** Fundamental contract extension before dynamic implementation.

**Recommendation:** Contract the domain-intent boundary now; defer coordinator mechanics.

## 6. Accessibility is relational, not a casualty flag

**Idea / observation:** `reachable/blocked` on a casualty loses actor, route, body region and cause.

**Why it matters:** A casualty may be reachable by one responder but not another, or torso-reachable while a leg remains inaccessible.

**Proposed change:** AccessibilityAssessment binds actor/ref, target entity or region, access objective, route/topology ref, status, blockers/hazards, required change and evidence revision. It is derived/validated state, never geometry truth.

**Benefit:** Supports partial and hazard-gated access without pathfinding.

**Risk:** Can become stale as the world changes.

**Scope impact:** Additive contract with dependency invalidation.

**Recommendation:** Adopt.

## 7. Constraint requires region and release lifecycle

**Idea / observation:** A general "entrapped" state is too broad.

**Why it matters:** It cannot distinguish blocked motion, compression, enclosure or attachment, nor prove release.

**Proposed change:** ConstraintRelation binds constrained body/contact region, constraining entity/feature, exact type, blocked/allowed motion axes, dependency refs, lifecycle, release preconditions and post-release transition intent. No solver and no SupportRelation substitution.

**Benefit:** Honest representation of dashboard, machinery, debris, under-vehicle and collapse cases.

**Risk:** Motion-axis semantics need rotation support for non-axis-aligned worlds.

**Scope impact:** Additive model, but rotation foundations are prerequisite for general vehicles.

**Recommendation:** Adopt.

## 8. Visual fallback needs an identity-preservation rule

**Idea / observation:** Mobile quality fallback can become semantic substitution.

**Why it matters:** Replacing a synagogue with a school or a bus seat with a chair corrupts scenario meaning even if geometry is similar.

**Proposed change:** Visual variants share one VisualAssetFamily identity and bind to the same semantic/physical IDs and alignment anchors. Missing family is `VISUAL_UNAVAILABLE`; proxy visuals are allowed only when explicitly approved as a variant of that exact entity definition, never as physical proof.

**Benefit:** Performance scaling without truth drift.

**Risk:** More assets can produce explicit unavailable states.

**Scope impact:** Visual contract only.

**Recommendation:** Adopt.

## Final partner conclusion

Beginning the Visual Vertical Slice now creates meaningful redesign risk. The current physical foundation proves immutable axis-aligned School entities, one static SurfaceModel, exact bodies, multi-support relations, atomic physical mutation, events and replay. It does not yet contract scene semantics/capabilities, independent domain state roots, rotated/local geometry, constraints, accessibility, hazards/environment, multi-casualty composition or visual binding identity. Binding visuals directly to current School-shaped records would harden accidental assumptions.

**HARD STOP.** Before visual implementation, approve the minimum architecture-only extension: (1) domain authority graph and canonical ref/version rules; (2) semantic component/capability registry plus compatibility result contract; (3) VisualBinding contract; (4) extension contract for coordinate frames, rotated/inclined/multi-level geometry; (5) independent Constraint, Accessibility, Environment/Hazard, Clinical/Presentation and Progression boundaries. No implementation or new physical authoring is required for that approval.

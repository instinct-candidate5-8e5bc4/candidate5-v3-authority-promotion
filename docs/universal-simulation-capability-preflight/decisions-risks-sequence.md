# Decisions, Risks and Recommended Sequence

## Architecture decision proposals

1. ADOPT a graph of independently authoritative domain states; REJECT a giant Scenario state.
2. ADOPT open namespaced semantic IDs plus typed components/capabilities; REJECT closed venue enums and tag-driven behavior.
3. RETAIN WorldMutationAPI as sole physical authority; add distinct future authorities for Clinical, Hazard/Environment, Constraint and derived Accessibility.
4. ADOPT exact cross-domain refs and causal event ledger; never share mutable objects across domains.
5. ADOPT ConstraintRelation separate from SupportRelation and AccessibilityAssessment separate from both.
6. ADOPT ClinicalState separate from ClinicalPresentation/ObservablePresentation.
7. ADOPT VisualBinding as the only semantic/physical-to-renderer bridge; renderer and evaluation remain read-only consumers.
8. ADOPT Capability Registry + fail-closed Compatibility Engine before new ScenarioPackages.
9. APPROVE coordinate-frame/oriented-geometry contracts before vehicles, stairs, water or generalized visuals.
10. DEFER all catalogs that carry clinical/treatment meaning until sources/editions and reviewers are named.

## Risk register

| Risk | Severity | Control |
|---|---:|---|
| School-specific fields become universal API | High | Approve semantic/domain refs and VisualBinding before visuals. |
| Tags treated as capability proof | High | Typed components; registry evidence; tags descriptive only. |
| Cross-domain mutation backdoor | Critical | Separate authorities; typed intents; immutable causal ledger. |
| Axis-aligned assumptions block vehicles/stairs | Critical | Coordinate frames and oriented contacts contract first. |
| Entrapment encoded as support | Critical | Separate ConstraintRelation; compatibility rejection. |
| Accessibility reduced to boolean | High | Actor/target/objective/topology assessment with revision dependencies. |
| Hidden clinical truth leaks to learner | Critical | Explicit reviewed ObservablePresentation projection. |
| Visual animation changes physics | Critical | VisualBinding one-way; physicalEffect NONE unless separate physical transition. |
| Lower-quality asset changes semantic identity | High | Same VisualAssetFamily and exact binding identity only. |
| Dynamic coordinator bypasses validation | Critical | Progression emits domain intents; each authority validates. |
| Stale derived state after door/hazard/support change | High | Exact dependency revisions and invalidation. |
| Clinical protocol implied without authority | Critical | Separate sourced/reviewed catalogs; no MDA claim without exact edition. |
| Performance budgets arrive after asset lock-in | High | Approve device/scene measurement budgets before Visual Gate implementation. |
| Capability registry claims contract-only as implemented | High | Distinct status and rules requiring `IMPLEMENTED_VERIFIED_FOR_SCOPE`. |

## Recommended implementation sequence after review

0. Preserve Gate D and all current locks unchanged.
1. Approve domain authority graph, canonical identities/versioning/provenance and composition manifest schemas.
2. Approve semantic component registry, Capability Registry and CompatibilityResult/rule schema.
3. Approve coordinate frames, oriented surfaces/contact regions, multi-level/inclined topology and invalidation contracts. Do not author assets yet.
4. Approve ConstraintRelation, AccessibilityAssessment, Environment/Hazard and Clinical/Presentation boundaries.
5. Approve Progression typed intents, causal ledger, ActionRouter and read-only Evaluation boundary.
6. Approve VisualBinding/asset-family contract and exact visual fallback policy.
7. Set explicit device/scene performance budgets and Visual Quality Gate evidence protocol.
8. Only then design one bounded Visual Vertical Slice against approved bindings. It may use Gate D physical truth but must not revise it.
9. Later, choose one new capability vertical at a time, author exact definitions/evidence and pass compatibility. Vehicle, fire, water and clinical catalogs each need separate review gates.

## UNKNOWN ledger

- Final schemas and governing owner for each future registry.
- Cross-domain transaction semantics: saga/ordered commits versus atomic coordinator.
- General rigid-transform numeric representation and tolerances.
- Oriented collision/contact algorithm and proof format.
- Articulation, deformation, friction, loading, stability, forces and balance.
- Vehicle damage/deformation and shell/opening semantics.
- Water/buoyancy approximation, currents and moving water frames.
- Fire/smoke/heat propagation model and severity vocabulary.
- Dynamic structural stability and fall trajectory authority.
- Constraint motion-axis vocabulary and release validation.
- Accessibility topology/evidence computation without pathfinding.
- Clinical ontology, progression rules, sources, editions and reviewers; exact MDA source/edition.
- ObservablePresentation disclosure policy and uncertainty model.
- NPC movement/behavior and physical revalidation cadence.
- Action consequence/intervention catalogs and evaluation rubrics.
- Visual asset catalog, formats, renderer, quality tiers and proxy approval process.
- Device tiers, representative scenes and numerical performance budgets.
- Panorama-to-geometry and visual-to-physical lineage.

None is promoted to supported capability.

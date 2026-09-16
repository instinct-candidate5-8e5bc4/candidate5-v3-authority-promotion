# Engineering Review, Risks and UNKNOWN

Executable review found two issues and corrected them without weakening design: BigInt needed canonical string conversion before evidence hashing, and function callbacks could pass array indices as accidental fraction denominators. Dedicated conversions now prevent both. Broad-phase overrides are rejected.

Final answers:
1. **NO - HARD STOP.** The experiment proves deterministic exact-rational OBB/compound mechanics, but it does not yet prove the complete V3 legality contract. SAT projections currently use exact rational center geometry without propagating accepted materialization error intervals. Convex SAT lacks edge-cross-edge axes. Finite support checks plane distance but not complete finite polygon containment/normal pairing. Opening and containment use world AABB bounds, which can false-pass arbitrary oriented shapes. Routing this result to physical authority would weaken correctness.
2. No fundamental identity/frame redesign was exposed, but binding future vehicles/humans/stairs is unsafe until the minimum correction below is implemented and reviewed.

Required correction before V3 authority routing:
- interval-valued scalar/vector arithmetic derived from every materialization error record;
- conservative broad AABB proof that expands by those intervals;
- complete OBB axes and convex face-normal plus unique edge-cross-edge SAT axes with canonical degeneracy rules;
- convex polygon projection/containment for finite support and openings in target-local 2D coordinates;
- oriented convex-region containment, not world AABB containment;
- contact-region normal pairing and whole-region distance/containment proof;
- adversarial tests showing ambiguity at every boundary returns QUANTIZATION_AMBIGUITY;
- only after all pass may evaluateV3 be added to the existing gateway.

The executable files in this checkpoint are a non-authoritative synthetic experiment used to expose these gaps. They are deliberately not routed through the Geometry Gate.

Failure precedence: malformed/tampered/stale inputs first; numeric overflow; unsupported geometry/query; broad definite separation; narrow collision/penetration/containment/contact reasons; quantization ambiguity; PASS. UNKNOWN never passes.

Risks/UNKNOWN: full error-interval propagation through SAT is incomplete in this minimum slice; arbitrary convex edge-edge axes and oriented containment beyond synthetic boxes need expansion; finite polygon support containment is not yet complete; normal compatibility currently supports FRONT_ONLY plane contact and not explicit contact-normal comparison; cache not implemented; opening uses convex aperture bounds; externally specified angles remain unsupported; physical mesh, CCD, stability/load/friction, water/buoyancy and constraints remain absent. No real binding may claim these capabilities.

# Engineering Partner Challenge

IDEA / OBSERVATION: Full-body collision geometry plus exact authored contact-region references, canonical contacts, explicit surface capability and axis-aligned plane/normal proof is sufficient for the authorized V2 axis-aligned synthetic scope. It separates global collision from local contact and does not require proof borrowing.

WHY IT MATTERS: A contact-only model can hide collisions; a whole-AABB-per-support model cannot represent contacts at different heights. The split closes both false-PASS classes for rigid axis-aligned authored bodies.

PROPOSED CHANGE: Add a separate V2 evaluator. It validates one complete body globally, then validates every required authored region against one exact capability-bearing surface. Contacts may authorize boundary touch only; global collision remains whole-body and gives no penetration exemption.

BENEFIT: Multiple heights and floor+wall contacts are independently provable with complete evidence while V1 remains untouched.

RISK: This is not an articulated-body, force/stability, friction, load, arbitrary-rotation or entrapment constraint solver. A body's authored contact regions and global AABB must honestly represent its posture. Those cases remain explicit future extensions rather than inferred PASS.

SCOPE IMPACT: New Phase 2 V2 files, schemas, synthetic tests, docs and evidence only. No V1 implementation or fixture edits; no clean-runtime multi-support yet.

YOUR RECOMMENDATION: Implement V2 for deterministic axis-aligned rigid-body/contact proof. Mark optional contacts, arbitrary planes, articulation, force/stability and entrapment constraints UNSUPPORTED.

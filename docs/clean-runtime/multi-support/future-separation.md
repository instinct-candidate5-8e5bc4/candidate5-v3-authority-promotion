# Future posture, Entrapment, Clinical and Visual separation

The relation cardinality supports later standing; floor/chair sitting; floor+wall leaning; standing+wall; supine/prone/side/recovery; kneeling; elevated legs; bed/stretcher; and vehicle seat+backrest+floor by adding honestly authored posture-specific PhysicalBodies, contact regions and exact support capabilities. Axis-aligned cases fit V2. Rotated seats, articulation/deformation, friction/load/stability and force equilibrium need explicit future extensions.

Entrapment is not support. Pinned limbs, dashboard/debris/machinery/collapse constraints require a future Constraint/Entrapment model and must never be encoded as a fake support relation.

PhysicalBody + ContactRegions + SupportRelations are separate from ClinicalPresentation and VisualRepresentation. Symptoms, gestures, burns, bleeding, choking, cyanosis and wetness do not create support or collision truth. Sex semantics do not generate geometry.

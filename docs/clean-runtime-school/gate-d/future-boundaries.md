# Gate D future capability boundaries

Human posture requires separate authored posture semantics, posture-specific PhysicalBody collision geometry, exact ContactRegions, SupportRelations, atomic transition rules, and separate visual pose/animation. Cardinality no longer blocks chair+feet, floor+wall lean, standing+wall, elevated legs, bed/stretcher or vehicle seat+backrest+floor. None is implemented. Rotation, articulation/deformation, friction/load/stability and forces remain future extensions.

World topology is not School-specific. Future ScenePackages may describe home, synagogue, street/road, clinic, office, workplace/industrial, construction, stairs/roof/elevator, vehicle/bus/motorcycle/bicycle, pool/sea/beach/river, fire/smoke, collapsed/confined and mass-casualty worlds using exact versioned dependencies.

SCENE, EVENT and HAZARD are separate: ROAD + VEHICLE_COLLISION + traffic/fire/fuel/debris; HOUSE + FIRE + smoke/heat/access; WATER + DROWNING + water/current/access. SurfaceModel holds physical surfaces, not event semantics.

SUPPORT is not ENTRAPMENT or ACCESSIBILITY. Dashboard/debris/machinery/pinning/collapse/fire-blocked access need future Constraint/Entrapment/Accessibility contracts.

Physical World, Posture/Support, Clinical State and Visual Presentation are separate. Symptoms and deterioration do not rewrite collision/support truth. ScenePackage references versioned physical state and does not assume the world stays static; future mutations may model fire/smoke/rain/water/day-night/moving vehicles/unstable objects/routes/multiple casualties through separately authorized contracts.

# School Adapter Dependency and Thinness Audit

Allowed path: WorldMutationAPI -> legality port -> SchoolGeometryAdapter -> unchanged Phase 2 Geometry Gate.

The AST audit parses all clean-runtime JavaScript. It requires exactly one Phase 2 Geometry Gate import, in `school/school-geometry-adapter.js`; flags other call sites, unauthorized physical writes and forbidden visual/legacy dependencies; and rejects physics/visual-authority vocabulary in the adapter. The recorded result is PASS with one gate call site and zero findings.

Phase 2 owns failure precedence, fixed-point rounding, full-footprint contact, floor/support containment, floating/support penetration, wall/door/obstacle collision and surface type rules. None is copied into the adapter.

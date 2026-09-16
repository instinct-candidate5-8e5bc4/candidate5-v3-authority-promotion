# Phase 2 Contract Gap Proposal: School Support Entity

## Gate outcome

The support-object lane is a hard stop. No support entity or surface was created.

## Evidence

The locked School physical source for variant 8 authors lockers and the School bag, not a chair, bed or gurney. Chair/bench declarations elsewhere in the recovered source belong to other variants or conditional scene families and have no evidence binding them to the locked School slice. Choosing one would be scene substitution.

The locked School Surface Model `school-surface-v1`, revision 1, digest `308951f841bd9be7a56d5d14ee1852c0cffe66b30d29d6a34f7a7da6bb0555cf`, contains FLOOR, WALL, DOOR_OR_OPENING and OBSTACLE surfaces only. It contains zero SUPPORT_SURFACE records. Therefore there is no exact support region, plane, contact rule, source revision or digest that the unchanged Phase 2 Geometry Gate can evaluate.

## Needed future input

A separately reviewed evidence package must select exactly one School support object and bind its authored body, transform and coordinate frame to this School scene. It must define a SUPPORT_SURFACE with exact region/plane, contact rules, revision, digest and lineage, plus dependency invalidation semantics for moved/revised/removed support entities. If Phase 2 must gain dynamic entity-owned surfaces or multi-entity dependency checks, that is a new Phase 2 contract change and requires separate approval.

No support tag/string was promoted. No surface was copied into clean runtime. No Geometry Gate bypass or new geometry rule was added.

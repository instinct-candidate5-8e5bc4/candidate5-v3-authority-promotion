# Gate A Fixture Migration

Gate A's fixture-only support string `SYNTHETIC_FLOOR` is replaced by a typed fixture category:

`{supportCategoryId: "synthetic/floor", supportSemanticType: "FLOOR", provenanceStatus: "UNKNOWN", fixtureOnly: true}`.

Fixture posture field `postureId: "synthetic-posture"` becomes `postureDefinitionId: "synthetic/posture"` plus `postureSemanticType: "SYNTHETIC_POSTURE"`. Geometry and fixture coordinates are unchanged. The full updated Gate A suite remains green.

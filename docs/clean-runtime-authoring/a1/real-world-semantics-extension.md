# Gate A.1 Real-World Semantics Extension

## Support model

The core uses a general typed taxonomy rather than a `SCHOOL_FLOOR` enum. A support category is:

- `supportCategoryId`: stable lowercase scene/definition identity, e.g. `school/floor-v1`;
- `supportSemanticType`: closed physical kind, initially `FLOOR` or `SUPPORT_SURFACE`;
- `provenanceStatus`: independently `RECOVERED`, `AUTHORED_NEW`, `VERIFIED` or `UNKNOWN`;
- `fixtureOnly`: explicit boolean;
- `categoryDigest`: canonical digest.

Thus the future School category is `supportCategoryId=school/floor-v1`, `supportSemanticType=FLOOR`, `provenanceStatus=AUTHORED_NEW`, `fixtureOnly=false`. It is not hardcoded as a School physics type and cannot be confused with the synthetic fixture category. `SYNTHETIC_FLOOR` was migrated explicitly to a fixture category ID `synthetic/floor`, semantic `FLOOR`, provenance `UNKNOWN`, `fixtureOnly=true`.

## Posture identity

`postureDefinitionId` keeps lowercase machine grammar. `postureSemanticType` is a separate closed enum: `SYNTHETIC_POSTURE` for Gate A fixtures and `SUPINE_FLOOR` for the next approved body gate. Values are exact. Unknown, lowercase alias, missing or body/posture mismatch rejects with no fallback.

PhysicalBodyDefinition and PostureDefinition both bind the machine ID and semantic type. Changing either or changing a support category alters canonical bytes/digest and requires a new revision; prior proof rejects stale.

## Male-only Gate B requirement

Subject sex belongs in `ProfileDefinition`, not collision geometry. Gate A.1 adds a closed `subjectSex` field with exact `MALE`, `FEMALE`, `UNSPECIFIED`; Gate B can explicitly author adult-v1 with `MALE`. Lowercase, inferred-from-visual and missing values reject. This gate adds only synthetic semantic tests and no human body, dimensions or visual binding.

## Scope

No Phase 2 or School adapter change is required. No geometry rule was added. Runtime authority remains unchanged.

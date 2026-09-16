# Gate B Locked Contract Gap Proposal

**Result: HARD STOP before authoring the body**

Gate B cannot create the requested `adult-v1 / SUPINE_FLOOR` definition without changing the accepted and locked Gate A contract at commit `5c6ca4be9150090769e77f33da41a773d4723b3d`. The Gate B instruction explicitly requires a hard stop if that occurs.

## Gap 1: real floor support type is unrepresentable

Gate A closed `SUPPORT_TYPES` to:

- `SYNTHETIC_FLOOR`
- `SYNTHETIC_SUPPORT`

The body validator rejects every other value as `UNKNOWN_SUPPORT_TYPE`. Gate B requires an authoritative real School floor body. Labeling that support `SYNTHETIC_FLOOR` would misstate provenance and silently widen a synthetic-only contract into production semantics. Introducing `SCHOOL_FLOOR` changes the locked Gate A constant algebra and its tests.

## Gap 2: required posture identifier is unrepresentable

Gate A applies the same lowercase ID grammar `^[a-z0-9][a-z0-9._:/-]*$` to `postureId`. The requested semantic posture is exactly `SUPINE_FLOOR`; uppercase and underscore are rejected `INVALID_ID`. Replacing it silently with a lowercase alias would change the user's contract. Gate A lacks a distinction between a machine definition ID and the closed semantic posture enum.

## Minimal proposed correction for separate approval

A narrowly scoped Gate A.1 should:

1. Add `SCHOOL_FLOOR` to the closed support-type algebra, with explicit status `AUTHORED_NEW` or a typed support-category record rather than a bare string.
2. Split posture fields:
   - `postureDefinitionId`: lowercase stable machine ID;
   - `postureSemanticType`: closed enum initially containing `SUPINE_FLOOR`;
   - remove semantic posture values from the lowercase generic-ID validator path.
3. Update PhysicalBodyDefinition and PostureDefinition schemas/validators/fixtures only.
4. Add negative tests for unknown real support category, alias/fallback posture names and mismatched body/posture semantic type.
5. Re-run Gate A and all inherited locks, with no body dimensions or School body authored in Gate A.1.

Only after that correction is accepted should Gate B restart dimension authoring. The School adapter can then be extended through its existing sole Geometry Gate path without altering Phase 2.

## No partial body

A tentative dimension worksheet and source reference search were discarded. No adult-v1 component, dimension, footprint, contact region, posture or digest was committed or registered. This avoids creating a body that cannot pass the locked validator honestly.

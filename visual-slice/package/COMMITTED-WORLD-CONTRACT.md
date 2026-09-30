# TRACK B / R3 committed-world renderer contract (v1.0)

Root-shell PHYSICAL session route -> renderer. This contract is the ONLY
shape the renderer's `renderPhysicalProjection(projection)` entry accepts.
Guard: `visual-slice/package/committed-world-guard.mjs` (pure, no three.js,
no DOM). Fail-closed: any violation rejects the WHOLE projection with NO
visual action. Whitelist is exhaustive - any key not listed here rejects.

## Projection shape

```json
{
 "kind": "TRACK_B_COMMITTED_WORLD_PROJECTION",
 "contractVersion": "1.0",
 "worldDigest": "<64-hex sha256 of the committed world state>",
 "committedTransactionId": "<commit transaction id, <=200 chars>",
 "entities": [
  {
   "publicRef": "<host binding-table ref>",
   "authoritativeTransformMicrounits": { "positionMicrounits": [x, y, z] },
   "publicUseState": "AVAILABLE" | "RESERVED" | "CONSUMED"
  }
 ]
}
```

- `positionMicrounits` semantics: the committed world position of the
  entity's LOCAL ORIGIN; the entity's certified bounds are local offsets
  from it (renderer places bounds at position + bounds). 3 finite numbers,
  |v| <= 1e9.
- `publicUseState` is valid ONLY for SYNTHETIC_TRAINING map entries. It
  presents committed state; it never decides it.
- `worldDigest` is recorded and surfaced, never treated as authority by the
  renderer. The renderer has no mutation/commit surface.

## What this contract deliberately EXCLUDES (rejected on sight)

Cues (`cue`), finding text (`findingText`), highlight requests
(`highlightComponentIds`), pose/location codes (`visiblePoseCode`,
`visibleLocationCode`), inventory, visual-cue fields, clinical state,
findings, placement proposals - and any other key. Those belong to the
nonphysical-session projection contract (`projection-guard.mjs`,
`TRACK_B_PUBLIC_PROJECTION`), which remains unchanged.

## Apply allowlist

Committed transforms are applied ONLY for entities on the guard's
`APPLY_ALLOWLIST` (v1.0: `synthetic-training-unit-v1`), and only when the
entity is covered by the PINNED presentation-manifest binding
(manifest 0.2.0 `assetRef.pinned`: `assetBindingVersion`,
`unitDefinitionSha256` - byte SHA-256 of the committed
`synthetic-training-unit-v1.js` definition - and `bindingDigest`).
A committed entity outside the allowlist REJECTS the whole projection
(loud, never a silent skip). The allowlist extends only by reviewed
increments.

## Honesty vocabulary

`applied:true` means every action in the projection was applied; anything
less is `applied:false` with a reason. Renderer status() surfaces the last
applied `committedWorld` digest/transaction for evidence.

## Runtime pin verification (executor review R3-1)

Format alone is never acceptance. At mount the renderer recomputes the pin
anchors and the presentation-guard refuses the manifest on ANY mismatch:

- `pinned.unitDefinitionSha256` must equal the runtime recompute anchor
  `package-build.json.committedWorldPins.unitDefinitionSha256`, hashed by the
  package builder from the committed `synthetic-training-unit-v1.js`
  definition bytes. A tampered or stale manifest refuses.
- `pinned.bindingDigest` is recomputed at runtime from the pin record fields
  and must match; `manifestDigest` is recomputed over the manifest and must
  match. Missing runtime sha256 refuses (never format-only).
- If the manifest fails validation, its binding coverage is unavailable and
  the committed-world guard rejects the projection outright - a failed
  manifest can never bypass pin coverage (`boundEntities` must be a real
  list; null/omitted rejects).

## Committed use-state presentation (executor review R3-1)

`AVAILABLE` green / `RESERVED` orange + edge marker / `CONSUMED` hides the
whole group (no visual presence; the overlay reports the state). The label
reads PHYSICS R1-ADMITTED - INTERIM BOX ONLY: the unit's physical records
are owner-admitted (R1) while the visual stays an honest interim debug box,
not the final asset - committed-state rendering is never final-asset
acceptance.

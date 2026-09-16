# Missing PhysicalBody Proposal: School Casualty

## Gate outcome

The casualty body is a hard stop. No body was created.

## Sources examined

1. The recovered `index.html` at SHA-256 `e1955f80d07ae2660b48fc2fce6cca68da30e9de4848e691e4fa3fa052191618` states `casualtyLength=1.80`, but uses it to scale a transparent sprite. Its posture ratios, heights, focus multipliers, alpha-bottom ground contact and contact shadow are explicitly visual calculations. They are not an authored collision body, footprint or contact region.
2. `src/nextgen/posture-map.js` maps cases to PNG assets and support labels. It contains no physical dimensions, footprint, coordinate frame, contact region, body revision or geometry digest. A string such as `floor`, `chair` or `gurney` is not a SupportRelation proof.
3. `human-clothed-rig.glb` was fetched from the canonical production host only for evidence examination. It is 6,148,224 bytes, SHA-256 `964dcc0eaf004d09ae02ebe4c1b6a2bfa4755394a02847f2c62f925bb9dbddca`, glTF 2.0, two meshes, one skin, 188 nodes and no animations. It is absent from the repository history. The recovered runtime applies scenario/age scale, rotates the casualty group, edits bones and fits bounds to the floor after loading. The file has no collision body or footprint metadata, no authoritative scale/coordinate-frame record, and no proven posture-to-physical-body correspondence.
4. Production posture PNGs exist, but pixels, alpha bounds, shadows and sprite scales are prohibited as PhysicalBody evidence and have no proven physical binding.

## Missing contract

A future proposal needs a source-bound posture package containing: definition ID; exact source and lineage; coordinate frame and units; posture ID; complete collision geometry or footprint bounds; contact region; orientation constraints; allowed supports; body revision and digest; and an explicit binding from that physical package to the casualty entity/posture. Until then, casualty status remains `UNKNOWN / MISSING_PHYSICAL_BODY`.

No "reasonable" adult dimensions were inferred. No floor casualty test was fabricated. No second posture or ChangePosture behavior was added.

# Gate A Validation Matrix

Synthetic positives: compound AABB body, derived aggregate, explicit footprint, contact region, exact posture binding, support entity, owner-local horizontal support surface, translation-only materialization, review record, revision replacement, canonical byte equality.

Synthetic negatives: malformed schema; unknown primitive; non-finite and overflow values; zero/negative dimensions; invalid frame/origin; duplicate component ID; aggregate mismatch; footprint outside aggregate; malformed/outside contact; unknown support type; rotated body/support; non-horizontal support; stale body/owner reference; digest mismatch; review missing/mismatch. Every invalid record returns REJECTED and cannot enter a registry.

The fixture coordinates are tiny synthetic integers chosen to expose boundary behavior. They have no human or real-object meaning.

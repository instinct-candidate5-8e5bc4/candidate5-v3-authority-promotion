# Permanent hostile regressions

`VALID_SIGNATURE_WRONG_BINDING/` contains eight canonical cross-binding records, each carrying one required wrong binding and each accompanied by a cryptographically valid detached Ed25519 signature made by the same review-only candidate key. Signature verification MUST pass, but exact semantic comparison MUST fail as `E_CROSS_BINDING` before launcher invocation.

| Fixture | Wrong binding |
|---|---|
| `stale-script-blob` | historical script Git blob |
| `stale-launcher-blob` | historical launcher Git blob |
| `substituted-service` | measured-service SHA-256 |
| `modified-service-closure` | canonical service-closure SHA-256 |
| `substituted-detached-signature` | offline-manifest detached-signature SHA-256 |
| `substituted-pin-store` | protected-store policy SHA-256 |
| `modified-layer-vector` | first OCI layer size |
| `substituted-offline-manifest` | offline manifest SHA-256 |

These are review data, not executable tests. `expected-results.v1.json` records the permanent expected outcomes.

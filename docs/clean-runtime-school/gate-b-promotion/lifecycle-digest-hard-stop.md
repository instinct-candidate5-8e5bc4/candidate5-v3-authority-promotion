# Gate B Lifecycle Promotion: Hard Stop

Promotion was not executed because the locked Gate A lifecycle contract changes canonical physical bytes while retaining the old `canonicalDigest`.

The exact reviewed body digest is `5c3eaa82412038d16cde2bafe5547a5db0c58fdb237da85fce478679063981d3`. The locked `transition()` implementation changes body fields `status`, `validationEvidenceRefs` and `reviewEvidenceRefs` but does not recalculate the digest. Under the locked canonical contract, all those fields are currently included in decision bytes.

A dry-run produced:

- draft recomputed physical digest: `5c3eaa82412038d16cde2bafe5547a5db0c58fdb237da85fce478679063981d3`
- VALIDATED recomputed digest: `c025160cb0330f5c6b2f9ea04bbef3c1cfc2efd613ca191eab1dd52e2cc82779`
- REVIEWED recomputed digest: `065850042ccf513e68b87c09aa5a43e5fd5bf0477e13a040bcbd4f577323a4e0`
- VERIFIED_FOR_SLICE recomputed digest: `75b9182759e0008c85a6441e0aaf70816810cb9a0033d8fc35aeec9ae33ff19f`

The stored digest remains `5c3eaa82...` at each transition, creating an internally inconsistent record. Recalculating would violate the instruction to promote the exact reviewed physical revision/digest. Keeping the stale digest would violate deterministic canonicalization and proof integrity.

## Minimal correction proposal for separate approval

Introduce a review/status envelope outside immutable PhysicalBody physical decision bytes:

```json
{
  "definitionRef": {"id": "...", "revision": 1, "physicalDigest": "5c3eaa82..."},
  "lifecycleState": "VERIFIED_FOR_SLICE",
  "review": {
    "reviewId": "gate-b-user-review-ee04481",
    "reviewedPhysicalDigest": "5c3eaa82...",
    "decision": "APPROVE_FOR_SLICE",
    "scope": "School Vertical Slice / adult-v1 MALE / SUPINE_FLOOR / conservative aggregate AABB",
    "evidenceRefs": []
  },
  "envelopeDigest": "separate canonical digest"
}
```

PhysicalBody revision 1 and physical digest remain byte-identical. Lifecycle/review metadata receives a separate canonical envelope digest. The validator must reject an envelope whose definition ref does not match the exact body ID/revision/digest. Runtime proof continues to pin the physical digest, while registry admission requires a verified envelope.

This requires a small Gate A lifecycle/review contract change, so it was not made inside the promotion-only authorization.

# Phase 2 Multi-Support V2 contract

V2 is a separate entry point; V1 `evaluate` is untouched. One request binds one full-body geometry/proof and a canonical relation-ID-sorted set of REQUIRED contacts. Request identity sorts contacts, so insertion order does not change the digest. OPTIONAL is unsupported in 2.0.

The full-body pass checks legal floor/world containment and whole-body WALL/DOOR_OR_OPENING/OBSTACLE intersection first. A boundary touch is disjoint; any volume penetration fails globally before contact checks. It never uses contact slices as the body's collision truth.

Each contact binds the exact body and authored contact-region ID/geometry/digest, exact SurfaceModel and surface, semantic type, explicit SUPPORT_CONTACT capability, axis-aligned plane and exact integer-microunit boundary with zero hidden tolerance. WALL stays WALL and requires explicit capability. DOOR_OR_OPENING and OBSTACLE are not supported contact targets. Descriptive role is not geometry.

Failure precedence is: schema/version; request/body/surface identity/evidence; body/contact-region validity; canonical relation-ID conflict (duplicate IDs is rejected early because subsequent evidence would be ambiguous); unsupported semantic/capability/plane; global full-body collision/containment; per-contact geometry in relation-ID order. This intentionally moves identity-conflict ahead of the suggested last position.

Contact authorization is exact boundary touch only. It grants no body-wide collision exemption. One result contains global evidence and one record per passed relation; the first canonical failing relation includes already-completed relation evidence. Result proof digest authenticates the evidence.

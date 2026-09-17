# V3 Foundation Authority Closure Policy

Status: explicit conservative policy for the isolated Authority Promotion Foundation candidate.

The envelope builder validates the complete supplied authority registry snapshot for internal digest/pin/reference closure before projecting the transaction impact subset into the envelope. This is intentionally stricter than validating only the projected impact subset: an unrelated stale or incomplete record can reject an otherwise locally provable transaction.

This behavior is fail-closed and cannot create a false PASS. It is retained in this gate to prevent an invalid authority snapshot from being treated as an authoritative source. Relaxing validation to impact-only closure is a separate future policy decision and must not be done silently.

The evidence carried forward to planning/evaluation remains the required impact projection; the full registry is not copied into obligation context as proof evidence.

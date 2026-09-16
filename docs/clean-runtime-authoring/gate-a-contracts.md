# Gate A Physical Authoring Contracts

All Gate A bodies, postures, entities and surfaces are synthetic. None describes a human, casualty, adult, child, infant, School object or chair.

## Lifecycle

`AUTHORED_NEW_DRAFT -> VALIDATED -> REVIEWED -> VERIFIED_FOR_SLICE`; terminal/exception states are `REJECTED`, `SUPERSEDED`, `UNKNOWN`. `AUTHORED_NEW` is provenance, not verification. Review requires an exact revision digest, decision, evidence refs and configurable reviewer role/identifier. Timing/workflow metadata stays outside canonical decision bytes.

## Primitive and coordinate contract

V1 primitive algebra contains AABB only. Binding values are safe integer microunits under ED-P2-02. Frame is right-handed: +X entity-right, +Y up, +Z entity-forward; transform order scale-rotate-translate; local origin is author-declared contact frame; canonical identity quaternion is `[0,0,0,1000000]`; negative zero canonicalizes to zero. V1 components and support owners must use identity orientation.

A component has a stable ID, AABB type, translation, identity orientation, positive even integer dimensions and participation role COLLISION/CONTACT/BOTH. The author supplies component values; the validator derives aggregate bounds. Any authored aggregate/projection mismatch rejects.

## Body, footprint and contact

PhysicalBodyDefinition separates 3D components and aggregate from 2D `XZ_RECT_UNION` footprint and horizontal contact regions. Footprints and contacts must have positive area and lie within aggregate bounds. Legality never uses a center point.

The V1 Phase 2 projection is the conservative aggregate AABB. It encloses every component. Evidence says native compound evaluation was not performed and labels false-rejection candidates. No compensation may turn a Phase 2 failure into PASS. Phase 2 PASS proves only the bounded aggregate-AABB contract.

## Posture

PostureDefinition is physical-only and pins profile/posture IDs, exact body revision/digest, contact expectations, support types and identity orientation. A body/frame/footprint/contact/support change creates a new revision/digest; an old reference rejects stale.

## Support and materialization

A support is a regular physical entity pinning its body revision/digest, transform, support-surface refs and dependency policy. Entity-owned SupportSurface pins owner revision/digest, local horizontal plane, local rectangular region, FULL_FOOTPRINT contact rule, allowlists, revision and digest.

Materialization accepts only owner translation + identity orientation. It translates integer local bounds and plane into Phase 2 authored units and emits a SUPPORT_SURFACE with owner/body/surface provenance. Rotations and non-horizontal planes reject UNSUPPORTED/INVALID; no legality is decided during materialization.

## Provenance and authority

Authoring provenance separates decision ID, source-reference evidence, validation evidence and review evidence. Legacy/GLB/PNG references can be listed but are never the source of physical truth. Authoring outputs immutable validated definitions and has no WorldState writer. Runtime remains WorldMutationAPI -> PhysicalLegalityPort -> Phase 2.

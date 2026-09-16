# Phase 2 Engineering Decisions

## ED-P2-01 Deterministic failure precedence

The Geometry Gate evaluates failures in this fixed order: evidence and geometry-digest validity; proof/Surface Model identity and revision; exact surface existence/type; orientation/support sanity; contact gap or support penetration; explicit physical collision; positive legal-region containment. When collision volumes overlap, the deterministic reporting order is `DOOR_OR_OPENING`, `OBSTACLE`, then `WALL`, so a door volume represented within a wall is not hidden by the wall. The gate reports one canonical reason without suppressing the underlying checked evidence. It never changes the proposal. Multi-failure tests repeat each case 20 times and require byte-identical results.

Why: checking containment before collision hid a more specific door/wall failure. Stable precedence makes regression output useful and repeatable.

## ED-P2-02 Fixed-point geometry comparisons

All binding geometry comparisons convert authored units through `fixed-point.js`, the single contract owner. One authored unit equals 1,000,000 integer microunits. Conversion rounds to the nearest microunit; an exact half rounds away from zero. Negative zero becomes zero. Non-finite values, values beyond `MAX_INPUT_MAGNITUDE`, or any unsafe integer result fail closed with `RangeError`.

This is representation normalization, not an acceptance tolerance. It cannot legalize a represented gap or penetration of one microunit or more, and it never snaps, clamps or changes geometry. Tests cover 0.08 equality, positive and negative half-unit boundaries, negative coordinates, near-limit safe integers, overflow and non-finite inputs.

# Phase 1 verified architecture contracts

This directory implements only inert CommonJS contracts, immutable registries, deterministic gates, synthetic fixtures, and audit export. Contract version is `1.0.0`. `PLACEMENT_READY` and proof status `VERIFIED` do not exist. Every record is fixed at `placementReady: false`; evaluation ends at `PHASE_1_CERTIFICATION_NOT_AUTHORIZED`.

No current asset is registered. No runtime imports this directory. Footprint proof validation checks the fixed proof shape and deterministic synthetic rule results; it does not calculate geometry. Geometry calculation and runtime connection remain outside Phase 1.

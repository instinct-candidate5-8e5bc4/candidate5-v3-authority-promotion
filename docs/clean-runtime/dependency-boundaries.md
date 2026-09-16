# Clean Runtime Dependency Boundaries

Allowed: public composition root -> internal store/writer + WorldMutationAPI; WorldMutationAPI -> validators/contracts/PhysicalLegalityPort/EventLog; replay -> immutable state contracts.

Forbidden: renderer/scenario/NPC/debug -> reducer or writer; event log -> state commit; clean core -> Three.js, legacy `src/nextgen`, `index.html`, assets or production deployment. This gate has none of those packages.

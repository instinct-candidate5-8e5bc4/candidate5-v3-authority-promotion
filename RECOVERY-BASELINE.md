# Recovery Baseline

This branch is not a byte-for-byte reconstruction of lost commit 0413182.

Provenance:
- `index.html`, `src/nextgen/*`, and `sw.js` were recovered from the live production deployment on 2026-09-16 as behavioral/legacy evidence.
- `llm-worker.js` remains UNKNOWN: its production endpoint returned the app HTML despite a JavaScript response header, so it was not recorded as worker source.
- The live `index.html` SHA-256 at recovery was `e1955f80d07ae2660b48fc2fce6cca68da30e9de4848e691e4fa3fa052191618`.
- Phase 1 contracts are not part of this checkpoint.
- Binary assets are not reconstructed at this checkpoint.
- Lost baseline source differences, unserved tests, asset authoring sources, and Git ancestry after the old public main are UNKNOWN.

Locked constraints remain external approval requirements. This recovery does not promote an asset/scene, open Phase 2, change production, or claim Placement Readiness.

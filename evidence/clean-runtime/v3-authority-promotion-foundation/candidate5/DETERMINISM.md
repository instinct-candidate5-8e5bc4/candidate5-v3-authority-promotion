# Candidate 5 detached determinism evidence — digest labeling (corrected)

Two distinct digests exist for the determinism evidence; an earlier report
conflated them (row A8.5):

- `evidenceDigest` (`af052155344def0223ff22568d13bacd7114569b420a85c4056627ae86986eff`):
  an internal field of the evidence JSON, computed over the canonical run
  record (schemaVersion/inProcessRuns/inProcessIdentical/run). It is not the
  SHA-256 of any file.
- Evidence file SHA-256 (`a0eb287985202a942ac1a3b065ebcca6021308c412e29ab0ea10dcbaae3e15df`):
  the SHA-256 of `determinism-run-1.json` and `determinism-run-2.json`, which
  are byte-identical outputs of two detached harness processes
  (`node tests/clean-runtime/v3-candidate5-determinism.js`).

The corrected normative matrix (`tests/clean-runtime/v3-candidate5-matrix-coverage.js`)
maps row DETACHED_DETERMINISM to executing the harness twice in detached
processes and comparing the SHA-256 of the complete run outputs.

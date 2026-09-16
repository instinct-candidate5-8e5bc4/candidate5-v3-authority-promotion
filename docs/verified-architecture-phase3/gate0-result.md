# Phase 3 Gate 0 Result: HARD STOP

A throwaway copy was created with `git archive` from locked commit `7020b41e9067f5c58fb094cb126cd9ddc014ab72`, containing exact `index.html`, `sw.js`, and `src/nextgen`. Source hashes were identical before and after isolated launches. The isolated server returned 404 for `sw.js` without editing archived bytes.

The observation mechanism is not feasible under the locked no-edit/no-response-rewrite/no-runtime-injection boundary. Three.js and `scene` are lexical bindings inside an inline ES module. A post-load external observer misses boot and cannot access `scene`; a pre-execution wrapper requires a prohibited source edit, response rewrite, or runtime-path injection. Gate 0 stopped before capture.

Two launches without an installed observer were diagnostic only and are not claimed as an OFF/ON observer equivalence test. Performance, memory, frame-time and event-volume measurements remain blocked/UNKNOWN because no observer was installed. No sampling or event dropping was introduced.

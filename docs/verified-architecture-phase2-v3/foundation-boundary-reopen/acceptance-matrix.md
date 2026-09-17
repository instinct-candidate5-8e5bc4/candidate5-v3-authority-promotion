# Foundation Boundary Policy Reopen - Acceptance Matrix

| # | Mandatory hostile test | Evidence |
|---|---|---|
| 1 | Each approved edge independently passes | hostile test 1 (3 fixtures, each single edge, audit exit 0) |
| 2 | All three together pass | hostile test 2 |
| 3 | Same source to wrong target fails | hostile test 3 (-> authority-envelope.js rejected) |
| 4 | Wrong source to approved target fails | hostile test 4 (wrong-source.js rejected) |
| 5 | Fourth Foundation edge fails | hostile test 5 (-> v3-authority-adapter.js rejected) |
| 6 | Sibling module edge fails | hostile test 6 (-> physical-capability-router.js rejected) |
| 7 | Path alias attempt fails | hostile test 7 (non-canonical manifest target rejected) |
| 8 | Relative-path normalization bypass fails | hostile test 8 (aliased require to router rejected post-resolution) |
| 9 | Dynamic require/import attempt fails | hostile test 9 (ALLOWLIST_IMPORTER_DYNAMIC_LOAD) |
| 10 | Re-export/factory/injector indirection creates no additional authority | hostile test 10 (consumer via port clean; consumer direct edge rejected) |
| 11 | Duplicate or malformed allowlist entry fails | hostile test 11 (4 variants) |
| 12 | Missing approved edge fails certification | hostile test 12 |
| 13 | Additional allowlist edge fails certification | hostile test 13 |
| 14 | Modification of any certified blob fails | hostile test 14 (all six modules) |
| 15 | Foundation semantic/result change fails | hostile test 15 (route-table semantic tamper) |
| 16 | Existing fail-closed behavior unchanged | hostile test 16 (school + runtime inbound still rejected) |
| 17 | Inherited hostile/replay/determinism suites green | hostile test 17 |
| 18 | Routing Gate remains non-promoted | hostile test 18 |
| R19 | Aliased require fails (independent-cert repro a) | regression test 19 |
| R20 | Comment-separated require fails (repro b; also closes graph-invisibility) | regression test 20 (3 variants) |
| R21 | Bracket/member loader access fails (repro c) | regression test 21 |
| R22 | Dynamic load from non-allowlisted source fails (repro d) | regression test 22 |

Certification evidence: `evidence/clean-runtime/v3-foundation-boundary-reopen/`
(baseline SHA, changed-file list, six-module byte comparison, old/new policy,
exact allowlist, focused x2, broad, static, hostile, audit, determinism,
matrix coverage, SHA-256 sums). CI adds candidate SHA + parent, remote
branch/head verification, candidate5-tip and upstream-main controls, and the
SHA-256 evidence archive. Green CI is necessary but not sufficient: Yoni's
side independently reruns certification to the Candidate 5 standard before any
Authority Routing Gate implementation proceeds through the new boundary.
